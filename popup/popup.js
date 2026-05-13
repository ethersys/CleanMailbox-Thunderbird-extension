import { init as initI18n, t, applyI18n } from "../lib/i18n.js";

function showStatus(html, type) {
  const div = document.getElementById("status");
  div.innerHTML = html;
  div.className = type;
  div.style.display = "block";
}

function setButtonsDisabled(disabled) {
  document.getElementById("spamButton").disabled = disabled;
  document.getElementById("blacklistButton").disabled = disabled;
  document.getElementById("blacklistDomainButton").disabled = disabled;
}

async function getCurrentMessageId() {
  const displayed = await browser.messageDisplay.getDisplayedMessages();
  const messages = Array.isArray(displayed) ? displayed : displayed?.messages;

  if (!Array.isArray(messages) || messages.length === 0 || !messages[0]?.id) {
    throw new Error(t("configurationRequired"));
  }

  return messages[0].id;
}

async function sendBackgroundAction(action) {
  const messageId = await getCurrentMessageId();
  const response = await browser.runtime.sendMessage({
    action,
    data: { messageId },
  });

  if (!response?.success) {
    const err = new Error(response?.error || t("errorOccurred", "?"));
    err.errorCode = response?.errorCode;
    err.reason = response?.reason;
    throw err;
  }

  return response;
}

async function reportSpam() {
  setButtonsDisabled(true);
  try {
    const response = await sendBackgroundAction("reportSpam");
    let msg = t("spamReportedSuccess");
    if (response.moveError) {
      msg += "<br>" + t("moveWarning");
    }
    showStatus(msg, "success");
  } catch (error) {
    if (error.errorCode === "detectionNotTransmitted") {
      const reason = error.reason || t("configurationRequired");
      showStatus(t("detectionNotTransmitted", reason), "info");
    } else {
      showStatus(t("spamReportError"), "error");
    }
  } finally {
    setButtonsDisabled(false);
  }
}

async function addToBlacklist() {
  setButtonsDisabled(true);
  try {
    const response = await sendBackgroundAction("addToBlacklist");
    let msg = t("blacklistAddSuccess");
    if (response.moveError) {
      msg += "<br>" + t("moveWarning");
    }
    showStatus(msg, "success");
  } catch {
    showStatus(t("blacklistAddError"), "error");
  } finally {
    setButtonsDisabled(false);
  }
}

async function addDomainToBlacklist() {
  setButtonsDisabled(true);
  try {
    const response = await sendBackgroundAction("addDomainToBlacklist");
    let msg = t("blacklistDomainAddSuccess");
    if (response.moveError) {
      msg += "<br>" + t("moveWarning");
    }
    showStatus(msg, "success");
  } catch {
    showStatus(t("blacklistAddError"), "error");
  } finally {
    setButtonsDisabled(false);
  }
}

async function updateBlacklistButtonLabels() {
  const blacklistBtn = document.getElementById("blacklistButton");
  const domainBtn = document.getElementById("blacklistDomainButton");
  let messageId;
  try {
    messageId = await getCurrentMessageId();
  } catch {
    return;
  }
  const response = await browser.runtime.sendMessage({
    action: "getDisplayedMessageInfo",
    data: { messageId },
  });
  if (!response?.success) {
    return;
  }
  const { senderEmail, senderDomain } = response;
  if (senderEmail) {
    blacklistBtn.textContent = t("addToBlacklistButtonWithEmail", senderEmail);
  }
  if (senderDomain) {
    domainBtn.textContent = t("addDomainToBlacklistButtonWithDomain", senderDomain);
    domainBtn.disabled = false;
  } else {
    domainBtn.disabled = true;
  }
}

async function main() {
  await initI18n();
  applyI18n();

  const { isConfigured } = await browser.storage.local.get("isConfigured");
  if (!isConfigured) {
    document.getElementById("spamButton").disabled = true;
    document.getElementById("blacklistButton").disabled = true;
    document.getElementById("blacklistDomainButton").disabled = true;
    showStatus(t("configurationRequired"), "info");
    return;
  }

  updateBlacklistButtonLabels();
  document.getElementById("spamButton").addEventListener("click", reportSpam);
  document.getElementById("blacklistButton").addEventListener("click", addToBlacklist);
  document
    .getElementById("blacklistDomainButton")
    .addEventListener("click", addDomainToBlacklist);
}

main();
