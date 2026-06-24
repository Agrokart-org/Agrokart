const https = require('https');

const API_URL = "https://agrokart-api.onrender.com/api/admin/collections/users";

function makeRequest(method, url, data = null) {
  return new Promise((resolve, reject) => {
    const { URL } = require('url');
    const parsedUrl = new URL(url);
    
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function updatePartner() {
  console.log("Fetching live users...");
  const res = await makeRequest("GET", `${API_URL}?limit=1000`);
  const users = res.documents || [];
  
  let partner = users.find(u => u.email === "kkpartner@agmail.com");
  
  if (!partner) {
    console.log("Partner not found.");
    return;
  }
  
  // Set partner to Jack's location
  const coords = [72.8777, 19.0760];
  await makeRequest("PUT", `${API_URL}/${partner._id}`, {
    "address.coordinates.coordinates": coords,
    "address.coordinates.type": "Point"
  });
  console.log(`Updated partner ${partner.email} to ${coords}`);
}

updatePartner();
