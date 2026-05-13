const MESSAGES = {
  fr: {
    // Popup
    popupTitle: "Actions CleanMailbox",
    reportSpamButton: "Signaler comme Spam",
    addToBlacklistButton: "Ajouter à la Blacklist",
    addToBlacklistButtonWithEmail: "Ajouter $1 à la Blacklist",
    addDomainToBlacklistButton: "Ajouter tout le domaine à la Blacklist",
    addDomainToBlacklistButtonWithDomain: "Ajouter tout le domaine $1 à la Blacklist",
    configurationRequired: "Veuillez configurer l'extension d'abord.",
    spamReportedSuccess: "Spam signalé avec succès !",
    spamReportError: "Erreur lors du signalement du spam.",
    blacklistAddSuccess: "Adresse ajoutée à la blacklist avec succès !",
    blacklistAddError: "Erreur lors de l'ajout à la blacklist.",
    blacklistDomainAddSuccess: "Domaine ajouté à la blacklist avec succès !",
    moveWarning: "Action effectuée, mais impossible de déplacer le message vers Indésirables.",
    errorOccurred: "Erreur : $1",
    detectionNotTransmitted: "Déclaration spam échouée : $1",
    // Options
    optionsTitle: "Configuration CleanMailbox",
    optionsEmailLabel: "Votre adresse email :",
    optionsApiKeyLabel: "Clé API :",
    optionsLocaleLabel: "Langue :",
    optionsSaveButton: "Enregistrer la configuration",
    optionsFieldsRequired: "Veuillez remplir tous les champs",
    optionsEmailInvalid: "Veuillez entrer une adresse email valide",
    optionsSavedSuccess: "Configuration enregistrée avec succès",
    optionsSaveError: "Erreur : $1",
    localeFr: "Français",
    localeEn: "English",
  },
  en: {
    // Popup
    popupTitle: "CleanMailbox Actions",
    reportSpamButton: "Report as Spam",
    addToBlacklistButton: "Add to Blacklist",
    addToBlacklistButtonWithEmail: "Add $1 to Blacklist",
    addDomainToBlacklistButton: "Add entire domain to Blacklist",
    addDomainToBlacklistButtonWithDomain: "Add entire domain $1 to Blacklist",
    configurationRequired: "Please configure the extension first.",
    spamReportedSuccess: "Spam reported successfully!",
    spamReportError: "Error while reporting spam.",
    blacklistAddSuccess: "Address added to blacklist successfully!",
    blacklistAddError: "Error while adding to blacklist.",
    blacklistDomainAddSuccess: "Domain added to blacklist successfully!",
    moveWarning: "Action performed, but the message could not be moved to Junk.",
    errorOccurred: "Error: $1",
    detectionNotTransmitted: "Spam report failed: $1",
    // Options
    optionsTitle: "CleanMailbox Configuration",
    optionsEmailLabel: "Your email address:",
    optionsApiKeyLabel: "API Key:",
    optionsLocaleLabel: "Language:",
    optionsSaveButton: "Save configuration",
    optionsFieldsRequired: "Please fill in all fields",
    optionsEmailInvalid: "Please enter a valid email address",
    optionsSavedSuccess: "Configuration saved successfully",
    optionsSaveError: "Error: $1",
    localeFr: "Français",
    localeEn: "English",
  },
};

const SUPPORTED_LOCALES = ["fr", "en"];
const DEFAULT_LOCALE = "fr";

let currentMessages = MESSAGES[DEFAULT_LOCALE];

async function init() {
  const result = await browser.storage.local.get("locale");
  const locale = SUPPORTED_LOCALES.includes(result.locale)
    ? result.locale
    : DEFAULT_LOCALE;
  currentMessages = MESSAGES[locale];
}

function t(key, ...substitutions) {
  const msg = currentMessages[key] ?? MESSAGES[DEFAULT_LOCALE][key] ?? key;
  return substitutions.reduce(
    (acc, sub, i) => acc.replaceAll(`$${i + 1}`, sub),
    msg
  );
}

function applyI18n(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const msg = t(el.getAttribute("data-i18n"));
    if (msg) el.textContent = msg;
  });
}

export { init, t, applyI18n };
