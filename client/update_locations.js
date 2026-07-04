const fs = require('fs');
const https = require('https');

const url = 'https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsedData = JSON.parse(data);
      const hierarchicalData = {};
      
      parsedData.states.forEach(stateObj => {
        hierarchicalData[stateObj.state] = {};
        stateObj.districts.forEach(dist => {
          // We leave talukas empty because we can't reliably fetch all of them
          hierarchicalData[stateObj.state][dist] = {}; 
        });
      });

      const fileContent = `// Auto-generated comprehensive list of Indian States and Districts
export const hierarchicalLocationData = ${JSON.stringify(hierarchicalData, null, 2)};
`;
      fs.writeFileSync('src/data/hierarchicalLocationData.js', fileContent);
      console.log('Successfully updated hierarchicalLocationData.js');
    } catch (e) {
      console.error('Error parsing JSON', e);
    }
  });
}).on('error', (e) => {
  console.error('Error fetching data:', e);
});
