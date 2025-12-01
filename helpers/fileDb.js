const fs = require('fs');
const path = require('path');

function readJson(fileName) {
  const filePath = path.join(__dirname, '..', 'data', fileName);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf8');
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw || '[]');
}

function writeJson(fileName, data) {
  const filePath = path.join(__dirname, '..', 'data', fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = { readJson, writeJson };
