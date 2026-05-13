const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const [,, version, xpiPath] = process.argv;

if (!version || !xpiPath) {
  console.error('Usage: node generate-update-manifest.js <version> <xpi-path>');
  process.exit(1);
}

const absXpiPath = path.resolve(xpiPath);
if (!fs.existsSync(absXpiPath)) {
  console.error(`Fichier XPI introuvable : ${absXpiPath}`);
  process.exit(1);
}

const xpiBuffer = fs.readFileSync(absXpiPath);
const hash = crypto.createHash('sha256').update(xpiBuffer).digest('hex');

const manifestPath = path.resolve('updates.json');
let manifest = { addons: { 'contact@ethersys.fr': { updates: [] } } };
if (fs.existsSync(manifestPath)) {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

const updates = manifest.addons['contact@ethersys.fr'].updates;

if (updates.some(u => u.version === version)) {
  console.log(`Version ${version} déjà présente dans updates.json — aucune modification.`);
  process.exit(0);
}

updates.unshift({
  version,
  update_link: `https://github.com/ethersys/CleanMailbox-Thunderbird-extension/releases/download/v${version}/cleanmailbox.xpi`,
  update_hash: `sha256:${hash}`,
  applications: {
    gecko: { strict_min_version: '140.0' }
  }
});

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`updates.json mis à jour : version ${version} (sha256:${hash})`);
