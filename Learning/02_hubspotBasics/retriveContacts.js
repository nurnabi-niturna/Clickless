import "dotenv/config";

const options = {
  method: "GET",
  headers: {
    Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}`,
  },
};

fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}`,
  },
})
  .then((res) => res.json())
  .then((data) => console.log(data))
  .catch((err) => console.error(err));