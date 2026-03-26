const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const BACKEND_KB = path.join(__dirname, '../src/data/knowledgeBase');
const client_KB = path.join(__dirname, '../../client/src/data/knowledgeBase');

if (!fs.existsSync(client_KB)) {
    fs.mkdirSync(client_KB, { recursive: true });
}

// 1. Convert CSV to JSON
console.log("Converting training_dataset.csv to JSON...");
const csvPath = path.join(BACKEND_KB, 'training_dataset.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');
const records = parse(csvContent, { columns: true, skip_empty_lines: true });

// Convert numbers from string to float/int
const jsonRecords = records.map(row => ({
    ...row,
    ph: parseFloat(row.ph),
    nitrogen: parseFloat(row.nitrogen),
    phosphorus: parseFloat(row.phosphorus),
    potassium: parseFloat(row.potassium),
    organic_carbon: parseFloat(row.organic_carbon),
    dosage_kg_ha: parseFloat(row.dosage_kg_ha)
}));

fs.writeFileSync(path.join(client_KB, 'training_dataset.json'), JSON.stringify(jsonRecords, null, 2));
console.log(`✅ Saved ${jsonRecords.length} records to training_dataset.json`);

// 2. Copy JSON files
const filesToCopy = [
    'soil_standards.json',
    'crop_requirements.json',
    'fertilizers.json',
    'locales/en.json',
    'locales/hi.json',
    'locales/mr.json'
];

filesToCopy.forEach(file => {
    const src = path.join(BACKEND_KB, file);
    const dest = path.join(client_KB, file);

    // Ensure dest dir exists
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    fs.copyFileSync(src, dest);
    console.log(`✅ Copied ${file}`);
});

console.log("Data Migration Complete.");
