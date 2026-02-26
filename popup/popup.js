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
    throw new Error(response?.error || "Erreur inconnue");
  }

  return response;
}

async function reportSpam() {
  try {
    await sendBackgroundAction("reportSpam");
    alert(browser.i18n.getMessage("spamReportedSuccess"));
  } catch (error) {
    alert(browser.i18n.getMessage("errorOccurred", error.message));
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

document.querySelectorAll("[data-i18n]").forEach((element) => {
  const message = browser.i18n.getMessage(element.getAttribute("data-i18n"));
  if (message) {
    element.textContent = message;
  }
});

document.getElementById("spamButton").addEventListener("click", reportSpam);
document.getElementById("blacklistButton").addEventListener("click", addToBlacklist);
