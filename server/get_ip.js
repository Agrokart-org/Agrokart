const os = require("os");
const interfaces = os.networkInterfaces();
const results = {};

for (const name of Object.keys(interfaces)) {
  for (const iface of interfaces[name]) {
    // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
    if ("IPv4" !== iface.family || iface.internal) {
      continue;
    }
    results[name] = iface.address;
    console.log(`Interface: ${name}`);
    console.log(`  Address: ${iface.address}`);
  }
}
