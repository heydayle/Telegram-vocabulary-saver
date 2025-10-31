const TELEGRAM_API_BASE = 'https://api.telegram.org';

function storageGet(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(keys, (result) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(result);
    });
  });
}

async function getCredentials() {
  const { botToken, chatId } = await storageGet(['botToken', 'chatId']);
  return { botToken, chatId };
}

function openSetupPage() {
  const url = chrome.runtime.getURL('setup.html');
  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url }, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve();
    });
  });
}

function openOptionsPage() {
  return new Promise((resolve, reject) => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage(() => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }
        resolve();
      });
      return;
    }

    const url = chrome.runtime.getURL('options.html');
    chrome.tabs.create({ url }, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve();
    });
  });
}

async function handleSaveVocab(message) {
  const { botToken, chatId } = await getCredentials();

  if (!botToken || !chatId) {
    await openSetupPage();
    throw new Error('Telegram credentials are not set. Redirecting to setup.');
  }

  const { word, meaning, pageUrl } = message.payload || {};

  if (!word || !meaning) {
    throw new Error('Word and meaning are required.');
  }
  
  const messageFormatted = `*${escapeMarkdown(word)}* ${escapeMarkdown('=')} ||${escapeMarkdown(meaning)}||`
  const text = `${messageFormatted}`;

  const endpoint = `${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'MarkdownV2'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Telegram API error: ${errorText}`);
  }

  return true;
}

function escapeMarkdown(text) {
  if (!text) {
    return '';
  }
  return text.replace(/([*_\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'SAVE_VOCAB') {
    (async () => {
      try {
        await handleSaveVocab(message);
        sendResponse({ success: true });
      } catch (error) {
        console.error(error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }
  return undefined;
});

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    const { botToken, chatId } = await getCredentials();
    if (!botToken || !chatId) {
      await openSetupPage();
    }
  }
});

chrome.action.onClicked.addListener(async () => {
  try {
    const { botToken, chatId } = await getCredentials();
    if (!botToken || !chatId) {
      await openSetupPage();
      return;
    }

    await openOptionsPage();
  } catch (error) {
    console.error('Failed to handle extension icon click:', error);
  }
});
