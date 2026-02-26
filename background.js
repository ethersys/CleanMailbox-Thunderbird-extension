const CLEANMAILBOX_BASE_URL = "https://manager.clean-mailbox.com";

browser.runtime.onStartup.addListener(() => {
  console.log("CleanMailbox Extension demarree");
});

const ALLOWED_ACTIONS = new Set(["reportSpam", "addToBlacklist", "getBlacklist"]);

function isPayloadValidForMessageAction(data) {
  return data != null && typeof data === "object" && data.messageId != null;
}

browser.runtime.onMessage.addListener((message, sender) => {
  if (sender?.id !== browser.runtime.id) {
    return Promise.resolve({ success: false, error: "Requête refusée." });
  }

  const action = message?.action;
  if (!ALLOWED_ACTIONS.has(action)) {
    return Promise.resolve({ success: false, error: "Requête invalide." });
  }

  if (action === "reportSpam" || action === "addToBlacklist") {
    if (!isPayloadValidForMessageAction(message?.data)) {
      return Promise.resolve({ success: false, error: "Données invalides." });
    }
  }

  switch (action) {
    case "reportSpam":
      return handleSpamReport(message.data);
    case "addToBlacklist":
      return addToBlacklist(message.data);
    case "getBlacklist":
      return getBlacklist();
    default:
      return Promise.resolve({ success: false, error: "Requête invalide." });
  }
});

async function getBlacklist() {
  try {
    const data = await browser.storage.local.get("blacklist");
    return { success: true, blacklist: data.blacklist || [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleSpamReport(data) {
  try {
    const messageId = data?.messageId;
    if (!messageId) {
      throw new Error("Message introuvable pour le signalement.");
    }

    const config = await getRequiredConfig();
    const rawBase64 = await getRawMessageBase64(messageId);

    const response = await fetch(`${CLEANMAILBOX_BASE_URL}/public-api/report`, {
      method: "POST",
      headers: {
        "Api-Key": config.apiKey,
        email: config.email,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file: rawBase64 }),
    });

    const payload = await parseApiResponse(response);
    await moveMessageToJunk(messageId);
    return { success: true, result: payload };
  } catch (error) {
    console.error("Erreur lors du signalement du spam:", error);
    return { success: false, error: error.message };
  }
}

async function addToBlacklist(data) {
  try {
    const messageId = data?.messageId;
    if (!messageId) {
      throw new Error("Message introuvable pour la blacklist.");
    }

    const config = await getRequiredConfig();
    const message = await browser.messages.get(messageId);
    const senderEmail = extractEmailAddress(message?.author);
    const recipientDomain = extractRecipientDomain(message);

    if (!senderEmail) {
      throw new Error("Impossible de determiner l'expediteur du message.");
    }

    if (!recipientDomain) {
      throw new Error("Impossible de determiner le domaine du destinataire.");
    }

    const response = await fetch(
      `${CLEANMAILBOX_BASE_URL}/public-api/domain/${encodeURIComponent(recipientDomain)}/bl`,
      {
        method: "PUT",
        headers: {
          "Api-Key": config.apiKey,
          email: config.email,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address: senderEmail }),
      },
    );

    const payload = await parseApiResponse(response);
    await moveMessageToJunk(messageId);
    return { success: true, result: payload };
  } catch (error) {
    console.error("Erreur lors de l'ajout a la blacklist:", error);
    return { success: false, error: error.message };
  }
}

async function getRequiredConfig() {
  const config = await browser.storage.local.get(["apiKey", "email"]);

  if (!config.apiKey || !config.email) {
    throw new Error("Configuration manquante. Ouvrez les options de l'extension.");
  }

  return config;
}

function extractEmailAddress(value) {
  if (typeof value !== "string") {
    return null;
  }

  const angleMatch = value.match(/<\s*([^>\s]+@[^>\s]+)\s*>/);
  const candidate = (angleMatch ? angleMatch[1] : value).trim();
  const plainMatch = candidate.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return plainMatch ? plainMatch[0].toLowerCase() : null;
}

function extractRecipientDomain(message) {
  const candidates = [];

  if (Array.isArray(message?.recipients)) {
    candidates.push(...message.recipients);
  }

  if (Array.isArray(message?.to)) {
    candidates.push(...message.to);
  }

  for (const item of candidates) {
    const email = extractEmailAddress(item);
    if (!email) {
      continue;
    }

    const atIndex = email.lastIndexOf("@");
    if (atIndex > 0 && atIndex < email.length - 1) {
      return email.slice(atIndex + 1).toLowerCase();
    }
  }

  return null;
}

async function getRawMessageBase64(messageId) {
  try {
    const binaryRaw = await browser.messages.getRaw(messageId, { data_format: "BinaryString" });
    if (typeof binaryRaw === "string") {
      return btoa(binaryRaw);
    }
  } catch (error) {
    console.warn("Fallback vers data_format File pour getRaw:", error);
  }

  const fileRaw = await browser.messages.getRaw(messageId, { data_format: "File" });
  if (fileRaw && typeof fileRaw.arrayBuffer === "function") {
    const rawBuffer = await fileRaw.arrayBuffer();
    return arrayBufferToBase64(rawBuffer);
  }

  throw new Error("Format de message brut non supporte.");
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

async function parseApiResponse(response) {
  let payload;
  const responseText = await response.text();

  try {
    payload = responseText ? JSON.parse(responseText) : {};
  } catch {
    payload = { raw: responseText };
  }

  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status}: ${JSON.stringify(payload)}`);
  }

  return payload;
}

async function moveMessageToJunk(messageId) {
  if (!messageId) {
    throw new Error("Message introuvable pour le deplacement vers Indesirables.");
  }

  const junkFolderId = await resolveJunkFolderId(messageId);
  if (!junkFolderId) {
    throw new Error("Dossier Indesirables introuvable pour ce compte.");
  }

  await browser.messages.move([messageId], junkFolderId, { isUserAction: true });
}

async function resolveJunkFolderId(messageId) {
  const message = await browser.messages.get(messageId);
  const accountId = message?.folder?.accountId;

  // 1) Priorite: dossier Junk reel du compte du message
  if (accountId) {
    const accountJunkFolders = await browser.folders.query({
      accountId,
      specialUse: ["junk"],
      isUnified: false,
      isVirtual: false,
    });

    if (Array.isArray(accountJunkFolders) && accountJunkFolders[0]?.id) {
      return accountJunkFolders[0].id;
    }
  }

  // 2) Fallback global: n'importe quel dossier Junk reel (non unifie/non virtuel)
  const globalJunkFolders = await browser.folders.query({
    specialUse: ["junk"],
    isUnified: false,
    isVirtual: false,
  });

  if (Array.isArray(globalJunkFolders) && globalJunkFolders[0]?.id) {
    return globalJunkFolders[0].id;
  }

  return null;
}

async function initialize() {
  try {
    const { isConfigured, blacklist } = await browser.storage.local.get(["isConfigured", "blacklist"]);

    if (!isConfigured) {
      await browser.runtime.openOptionsPage();
      return;
    }

    if (!blacklist) {
      await browser.storage.local.set({ blacklist: [] });
    }

    const { apiKey, email } = await browser.storage.local.get(["apiKey", "email"]);
    if (!apiKey || !email) {
      console.warn("Configuration API incomplete. Ouvrez les options de l'extension.");
    }
  } catch (error) {
    console.error("Erreur lors de l'initialisation:", error);
  }
}

initialize();
