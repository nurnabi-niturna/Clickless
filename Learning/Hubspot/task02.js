import "dotenv/config";

const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;

const COMPANY_RECORD_ID = "322346824393";

const options = {
  method: "POST",
  headers: {
    Authorization: `Bearer ${HUBSPOT_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    properties: {
      email: "xyz1@gmail.com",
      firstname: "Marissa",
      lastname: "Leach",
      phone: "001-395-339-4210x47095",
      jobtitle: "Sales Director",
      lifecyclestage: "customer",
      hs_lead_status: "NEW",
      city: "North Renee",
      country: "Greece",
    },

    associations: [
      {
        to: {
          id: COMPANY_RECORD_ID,
        },
        types: [
          {
            associationCategory: "HUBSPOT_DEFINED",
            associationTypeId: 1, 
          },
        ],
      },

      {
        to: {
          id: COMPANY_RECORD_ID,
        },
        types: [
          {
            associationCategory: "USER_DEFINED",
            associationTypeId: 3, 
          },
        ],
      },
    ],
  }),
};

fetch("https://api.hubapi.com/crm/v3/objects/contacts", options)
  .then((res) => res.json())
  .then((data) => {
    console.log("Contact Created Successfully");
    console.log(JSON.stringify(data, null, 2));
  })
  .catch((err) => console.error("Error:", err));