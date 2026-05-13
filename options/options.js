import { init as initI18n, t, applyI18n } from "../lib/i18n.js";

document.addEventListener("DOMContentLoaded", async () => {
  await initI18n();
  applyI18n();

  const config = await browser.storage.local.get(["email", "apiKey", "locale"]);
  if (config.email) document.getElementById("email").value = config.email;
  if (config.apiKey) document.getElementById("apiKey").value = config.apiKey;
  if (config.locale) document.getElementById("locale").value = config.locale;

  document.getElementById("configForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const apiKey = document.getElementById("apiKey").value.trim();
    const locale = document.getElementById("locale").value;

    if (!email || !apiKey) {
      showStatus(t("optionsFieldsRequired"), "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showStatus(t("optionsEmailInvalid"), "error");
      return;
    }

    try {
      await browser.storage.local.set({ email, apiKey, locale, isConfigured: true });
      showStatus(t("optionsSavedSuccess"), "success");
      setTimeout(() => window.close(), 2000);
    } catch (error) {
      showStatus(t("optionsSaveError", error.message), "error");
    }
  });
});

function showStatus(message, type) {
  const statusDiv = document.getElementById("status");
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = "block";
}
