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
  try {
    await sendBackgroundAction("reportSpam");
    alert(browser.i18n.getMessage("spamReportedSuccess"));
  } catch (error) {
    if (error.errorCode === "detectionNotTransmitted") {
      const reason = error.reason || "Mail non passé par CleanMailbox";
      alert(browser.i18n.getMessage("detectionNotTransmitted", reason));
    } else {
      alert(browser.i18n.getMessage("errorOccurred", error.message));
    }
  }
}

async function addToBlacklist() {
  try {
    await sendBackgroundAction("addToBlacklist");
    alert(browser.i18n.getMessage("blacklistAddSuccess"));
  } catch (error) {
    alert(browser.i18n.getMessage("errorOccurred", error.message));
  }
}

async function addDomainToBlacklist() {
  try {
    await sendBackgroundAction("addDomainToBlacklist");
    alert(browser.i18n.getMessage("blacklistDomainAddSuccess"));
  } catch (error) {
    alert(browser.i18n.getMessage("errorOccurred", error.message));
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

updateBlacklistButtonLabels();

document.getElementById("spamButton").addEventListener("click", reportSpam);
document.getElementById("blacklistButton").addEventListener("click", addToBlacklist);
document
  .getElementById("blacklistDomainButton")
  .addEventListener("click", addDomainToBlacklist);
