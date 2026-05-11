import "dotenv/config";

const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;
const CONTACT_ID = "484379351745";

const options = {
  method: "GET",
  headers: {
    Authorization: `Bearer ${HUBSPOT_TOKEN}`,
    "Content-Type": "application/json",
  },
};

async function getContactAndCompany() {
  try {
    const contactRes = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts/${CONTACT_ID}?properties=firstname,lastname,email`,
      options,
    );

    const contact = await contactRes.json();

    const associationRes = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts/${CONTACT_ID}/associations/companies`,
      options,
    );

    const associations = await associationRes.json();

    const companyId = associations.results?.[0]?.id;

    let company = null;

    if (companyId) {
      const companyRes = await fetch(
        `https://api.hubapi.com/crm/v3/objects/companies/${companyId}?properties=name,domain,phone,city,country`,
        options,
      );

      company = await companyRes.json();
    }

    const result = {
      contact: {
        id: contact.id,
        firstName: contact.properties?.firstname,
        lastName: contact.properties?.lastname,
        email: contact.properties?.email,
      },
      company: company
        ? {
            id: company.id,
            name: company.properties?.name,
            domain: company.properties?.domain,
            phone: company.properties?.phone,
            city: company.properties?.city,
            country: company.properties?.country,
          }
        : null,
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

getContactAndCompany();