const fs = require('fs');
const { execSync } = require('child_process');

// Fonction pour créer un répertoire s'il n'existe pas
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Fonction principale
async function build() {
  console.log('Début de la construction de l\'extension...');

  // Vérifier la structure des dossiers
  const requiredDirs = ['popup', 'options', '_locales', 'icons'];
  requiredDirs.forEach(dir => ensureDirectoryExists(dir));

  // Vérifier les fichiers requis
  const requiredFiles = [
    'manifest.json',
    'background.js',
    'popup/popup.html',
    'popup/popup.js',
    'options/options.html',
    'options/options.js'
  ];

  requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      console.error(`Erreur: Le fichier ${file} est manquant`);
      process.exit(1);
    }
  });

  // Créer le fichier XPI
  try {
    console.log('Création du fichier XPI...');
    execSync('npm run package', { stdio: 'inherit' });
    console.log('Extension générée avec succès: cleanmailbox.xpi');
  } catch (error) {
    console.error('Erreur lors de la création du fichier XPI:', error);
    process.exit(1);
  }
}

// Exécuter le build
build().catch(console.error); 