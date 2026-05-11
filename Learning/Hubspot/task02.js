import "dotenv/config";

const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;
const COMPANY_ID = "322346450652";

async function getCompanyContacts(companyId) {
  try {
    const associationResponse = await fetch(
      `https://api.hubapi.com/crm/v4/objects/companies/${companyId}/associations/contacts`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${HUBSPOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const associationData = await associationResponse.json();

    console.log("Associations:", associationData);

    if (!associationData.results || associationData.results.length === 0) {
      console.log("No contacts associated with this company");
      return;
    }

    const contacts = [];

    for (const item of associationData.results) {

      const contactId = item.toObjectId;

      const contactResponse = await fetch(
        `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=firstname,lastname,email`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${HUBSPOT_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      const contactData = await contactResponse.json();

      contacts.push({
        contactId,
        name: `${contactData.properties.firstname || ""} ${contactData.properties.lastname || ""}`.trim(),
        email: contactData.properties.email || "",
      });
    }

    return contacts;

  } catch (error) {
    console.error("Error:", error);
  }
}

getCompanyContacts(COMPANY_ID)
  .then((contacts) => {
    console.log(JSON.stringify(contacts, null, 2));
  });