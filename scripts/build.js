const fs = require('fs');
const path = require('path');
const { ZipArchive } = require('archiver');

const ROOT = path.resolve(__dirname, '..');

const requiredFiles = [
  'manifest.json',
  'background.js',
  'popup/popup.html',
  'popup/popup.js',
  'options/options.html',
  'options/options.js',
];

async function build() {
  console.log("Début de la construction de l'extension...");

  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(ROOT, file))) {
      console.error(`Erreur: Le fichier ${file} est manquant`);
      process.exit(1);
    }
  }

  const output = fs.createWriteStream(path.join(ROOT, 'cleanmailbox.xpi'));
  const archive = new ZipArchive({ zlib: { level: 9 } });

  await new Promise((resolve, reject) => {
    archive.on('error', reject);
    output.on('close', resolve);
    archive.pipe(output);

    archive.file(path.join(ROOT, 'manifest.json'), { name: 'manifest.json' });
    archive.file(path.join(ROOT, 'background.js'), { name: 'background.js' });
    archive.directory(path.join(ROOT, 'popup'), 'popup');
    archive.directory(path.join(ROOT, 'options'), 'options');
    archive.directory(path.join(ROOT, '_locales'), '_locales');
    archive.directory(path.join(ROOT, 'icons'), 'icons');

    archive.finalize();
  });

  console.log(`Extension générée avec succès: cleanmailbox.xpi`);
}

build().catch((err) => {
  console.error('Erreur lors de la construction:', err);
  process.exit(1);
});
