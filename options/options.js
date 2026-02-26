document.addEventListener('DOMContentLoaded', async () => {
  // Charger les configurations existantes
  const config = await browser.storage.local.get(['email', 'apiKey']);
  if (config.email) document.getElementById('email').value = config.email;
  if (config.apiKey) document.getElementById('apiKey').value = config.apiKey;

  // Gérer la soumission du formulaire
  document.getElementById('configForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const apiKey = document.getElementById('apiKey').value.trim();
    
    // Validation des champs
    if (!email || !apiKey) {
      showStatus('Veuillez remplir tous les champs', 'error');
      return;
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showStatus('Veuillez entrer une adresse email valide', 'error');
      return;
    }

    try {
      // Sauvegarder les configurations
      await browser.storage.local.set({
        email,
        apiKey,
        isConfigured: true
      });

      showStatus('Configuration enregistrée avec succès', 'success');
      
      // Rediriger vers la page principale après 2 secondes
      setTimeout(() => {
        window.close();
      }, 2000);

    } catch (error) {
      showStatus(`Erreur : ${error.message}`, 'error');
    }
  });
});

// Fonction pour afficher les messages de statut
function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
}
