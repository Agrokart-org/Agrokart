const https = require('https');
const API_URL = "https://agrokart-api.onrender.com/api/admin/collections/users";

function makeRequest(method, url, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function syncCoords() {
  console.log("Fetching live users...");
  const res = await makeRequest("GET", `${API_URL}?limit=1000`);
  const users = res.documents || [];
  
  // 1. Find the newest customer (the one most recently created)
  const customers = users.filter(u => u.role === "customer" && u.address?.coordinates);
  if (customers.length === 0) {
    console.log("No customers with coordinates found!");
    return;
  }
  
  // Sort by createdAt descending (assuming newer users are at the end, or just take the last one)
  const newestCustomer = customers[customers.length - 1];
  const coords = newestCustomer.address.coordinates.coordinates;
  console.log(`Found newest customer ${newestCustomer.email} at coordinates:`, coords);
  
  // 2. Update Jack and kkpartner
  let jack = users.find(u => u.email === "jack@gmail.com");
  let partner = users.find(u => u.email === "kkpartner@agmail.com");
  
  if (jack) {
    await makeRequest("PUT", `${API_URL}/${jack._id}`, {
      "address.coordinates.coordinates": coords,
      "address.coordinates.type": "Point"
    });
    console.log(`Updated Jack to ${coords}`);
  }
  
  if (partner) {
    await makeRequest("PUT", `${API_URL}/${partner._id}`, {
      "address.coordinates.coordinates": coords,
      "address.coordinates.type": "Point"
    });
    console.log(`Updated partner to ${coords}`);
  }
  
  console.log("Sync complete.");
}

syncCoords();
