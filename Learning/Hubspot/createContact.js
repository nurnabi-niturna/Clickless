import "dotenv/config";

const options = {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    properties: {
      email: "mdnurnabirana.cse@gmail.com",
    },
  }),
};

fetch("https://api.hubapi.com/crm/v3/objects/contacts", options)
  .then((res) => res.json())
  .then((res) => console.log(res))
  .catch((err) => console.error(err));