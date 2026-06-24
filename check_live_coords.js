const https = require('https');
const API_URL = "https://agrokart-api.onrender.com/api/admin/collections/users";

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    }).on('error', reject);
  });
}

async function checkLocations() {
  const res = await makeRequest(`${API_URL}?limit=1000`);
  const users = res.documents || [];
  
  users.forEach(u => {
    console.log(`Email: ${u.email} | Role: ${u.role} | Coordinates: ${JSON.stringify(u.address?.coordinates?.coordinates || "None")}`);
  });
}
checkLocations();
