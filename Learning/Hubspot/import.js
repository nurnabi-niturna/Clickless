import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import csv from "csv-parser";

import hubspot from "@hubspot/api-client";

//  Env properties
const hubspotClient = new hubspot.Client({
  accessToken: process.env.HUBSPOT_ACCESS_TOKEN,
});

const MEMBERSHIP_OBJECT_TYPE = process.env.MEMBERSHIP_OBJECT_TYPE;

const ASSOCIATION_TYPE_ID = Number(process.env.ASSOCIATION_TYPE_ID);

const rows = [];

let processed = 0;
let contactsCreated = 0;
let contactsUpdated = 0;
let membershipsCreated = 0;
let associationsCreated = 0;
let failed = 0;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatDate(value) {
  if (!value || value.trim() === "") {
    return null;
  }

  const date = new Date(value);

  if (isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().split("T")[0];
}

function normalizeBoolean(value) {
  if (!value) {
    return "false";
  }

  const normalized = value.toString().trim().toLowerCase();

  return normalized === "yes" ||
    normalized === "true" ||
    normalized === "signed"
    ? "true"
    : "false";
}

function normalizeYesNo(value) {
  if (!value) {
    return "No";
  }

  const normalized = value.toString().trim().toLowerCase();

  return normalized === "yes" ? "Yes" : "No";
}

async function upsertContact(row) {
  const email = row["Email"]?.trim();

  if (!email) {
    console.error("MISSING EMAIL");

    failed++;

    return null;
  }

  const properties = {
    copy_record_id: row["Record ID"],

    firstname: row["First Name"] || "",

    lastname: row["Last Name"] || "",

    phone: row["Phone Number"] || "",

    annualrevenue: row["Annual Revenue"] || "",

    country: row["Country/Region"] || "",

    city: row["City"] || "",

    zip: row["Postal Code"] || "",

    state: row["State/Region"] || "",

    hs_linkedin_url: row["LinkedIn URL"] || "",

    community_employment_status: row["Community Employment Status"] || "",

    member_initial_roadblock: row["Member Initial Roadblock"] || "",
  };

  try {
    const response = await hubspotClient.crm.contacts.basicApi.create({
      properties: {
        email,
        ...properties,
      },
    });

    contactsCreated++;

    console.log(`CREATED CONTACT: ${email}`);

    return response.id;
  } catch (error) {
    if (error.code === 409 || error.response?.body?.category === "CONFLICT") {
      try {
        const searchResponse =
          await hubspotClient.crm.contacts.searchApi.doSearch({
            filterGroups: [
              {
                filters: [
                  {
                    propertyName: "email",
                    operator: "EQ",
                    value: email,
                  },
                ],
              },
            ],
            limit: 1,
          });

        if (searchResponse.results && searchResponse.results.length > 0) {
          const contactId = searchResponse.results[0].id;

          await hubspotClient.crm.contacts.basicApi.update(contactId, {
            properties,
          });

          contactsUpdated++;

          console.log(`UPDATED EXISTING CONTACT: ${email}`);

          return contactId;
        }
      } catch (innerError) {
        console.error(
          "CONTACT UPDATE ERROR:",
          innerError.response?.body || innerError,
        );
      }
    }

    console.error("CONTACT ERROR:", error.response?.body || error);

    failed++;

    return null;
  }
}

async function createMembership(row) {
  try {
    const properties = {
      membership_type: "true",

      cc_membership_agreement: normalizeBoolean(row["CC Membership Agreement"]),

      community_access_revoked: normalizeBoolean(
        row["Community Access Revoked"],
      ),

      cohort_start_date: formatDate(row["Cohort Start Date"]),

      community_expiration_date: formatDate(row["Community Expiration Date"]),

      community_course_purchase: normalizeYesNo(
        row["Community Course Purchase"],
      ),

      community_date_joined: formatDate(row["Community Date Joined"]),

      community_renewal_price: row["Community Renewal Price"] || "0",

      community_slack_id: row["Community Slack ID"] || "",

      latest_renewal_date: formatDate(row["Latest Renewal Date"]),
    };

    const membership = await hubspotClient.crm.objects.basicApi.create(
      MEMBERSHIP_OBJECT_TYPE,
      {
        properties,
      },
    );

    membershipsCreated++;

    console.log(`CREATED MEMBERSHIP: ${membership.id}`);

    return membership.id;
  } catch (error) {
    console.error("MEMBERSHIP ERROR:", error.response?.body || error);

    failed++;

    return null;
  }
}

async function associateMembership(contactId, membershipId) {
  try {
    await hubspotClient.apiRequest({
      method: "PUT",

      path: `/crm/v4/objects/contacts/${contactId}/associations/${MEMBERSHIP_OBJECT_TYPE}/${membershipId}`,

      body: [
        {
          associationCategory: "USER_DEFINED",

          associationTypeId: ASSOCIATION_TYPE_ID,
        },
      ],
    });

    associationsCreated++;

    console.log(
      `ASSOCIATED CONTACT ${contactId} ↔ MEMBERSHIP ${membershipId} WITH LABEL`,
    );
  } catch (error) {
    console.error("ASSOCIATION ERROR:", error.response?.body || error);

    failed++;
  }
}

async function processRow(row) {
  processed++;

  console.log(`\nPROCESSING ROW ${processed}`);

  const contactId = await upsertContact(row);

  if (!contactId) {
    return;
  }

  await delay(100);

  const membershipId = await createMembership(row);

  if (!membershipId) {
    return;
  }

  await delay(100);

  await associateMembership(contactId, membershipId);

  await delay(100);
}

fs.createReadStream("members.csv")
  .pipe(csv())
  .on("data", (data) => {
    rows.push(data);
  })
  .on("end", async () => {
    console.log(`STARTING IMPORT FOR ${rows.length} ROWS`);

    for (const row of rows) {
      await processRow(row);
    }

    console.log("\n======================");
    console.log("IMPORT COMPLETE");
    console.log("======================");

    console.log(`Processed: ${processed}`);

    console.log(`Contacts Created: ${contactsCreated}`);

    console.log(`Contacts Updated: ${contactsUpdated}`);

    console.log(`Memberships Created: ${membershipsCreated}`);

    console.log(`Associations Created: ${associationsCreated}`);

    console.log(`Failed: ${failed}`);
  });