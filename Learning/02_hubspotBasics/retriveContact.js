import "dotenv/config";

const options = {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}`
  }
};

fetch('https://api.hubapi.com/crm/v3/objects/contacts/481647331030', options)
  .then(res => res.json())
  .then(res => console.log(res))
  .catch(err => console.error(err));