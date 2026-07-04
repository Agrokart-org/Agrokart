const locationData = require('india-location-data');

try {
  console.log("Keys available:", Object.keys(locationData));
  
  if (locationData.getStates) {
    console.log("States:", locationData.getStates().slice(0, 5));
  }
} catch (e) {
  console.error("Error testing package:", e);
}
