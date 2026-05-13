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
    throw new Error("Aucun message trouve. Ouvrez un email et reessayez.");
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
    const err = new Error(response?.error || "Erreur inconnue");
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
    let msg = browser.i18n.getMessage("spamReportedSuccess");
    if (response.moveError) {
      msg += "<br>" + browser.i18n.getMessage("moveWarning");
    }
    showStatus(msg, "success");
  } catch (error) {
    if (error.errorCode === "detectionNotTransmitted") {
      const reason = error.reason || "Mail non passé par CleanMailbox";
      showStatus(browser.i18n.getMessage("detectionNotTransmitted", reason), "info");
    } else {
      showStatus(browser.i18n.getMessage("spamReportError"), "error");
    }
  } finally {
    setButtonsDisabled(false);
  }
}

async function addToBlacklist() {
  setButtonsDisabled(true);
  try {
    const response = await sendBackgroundAction("addToBlacklist");
    let msg = browser.i18n.getMessage("blacklistAddSuccess");
    if (response.moveError) {
      msg += "<br>" + browser.i18n.getMessage("moveWarning");
    }
    showStatus(msg, "success");
  } catch {
    showStatus(browser.i18n.getMessage("blacklistAddError"), "error");
  } finally {
    setButtonsDisabled(false);
  }
}

async function addDomainToBlacklist() {
  setButtonsDisabled(true);
  try {
    const response = await sendBackgroundAction("addDomainToBlacklist");
    let msg = browser.i18n.getMessage("blacklistDomainAddSuccess");
    if (response.moveError) {
      msg += "<br>" + browser.i18n.getMessage("moveWarning");
    }
    showStatus(msg, "success");
  } catch {
    showStatus(browser.i18n.getMessage("blacklistAddError"), "error");
  } finally {
    setButtonsDisabled(false);
  }
}

document.querySelectorAll("[data-i18n]").forEach((element) => {
  const message = browser.i18n.getMessage(element.getAttribute("data-i18n"));
  if (message) {
    element.textContent = message;
  }
});

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
    blacklistBtn.textContent = browser.i18n.getMessage(
      "addToBlacklistButtonWithEmail",
      senderEmail,
    );
  }
  if (senderDomain) {
    domainBtn.textContent = browser.i18n.getMessage(
      "addDomainToBlacklistButtonWithDomain",
      senderDomain,
    );
    domainBtn.disabled = false;
  } else {
    domainBtn.disabled = true;
  }
}

async function main() {
  const { isConfigured } = await browser.storage.local.get("isConfigured");
  if (!isConfigured) {
    document.getElementById("spamButton").disabled = true;
    document.getElementById("blacklistButton").disabled = true;
    document.getElementById("blacklistDomainButton").disabled = true;
    showStatus(browser.i18n.getMessage("configurationRequired"), "info");
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
