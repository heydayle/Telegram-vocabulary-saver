importScripts('vendor/node-telegram-bot-api.js');

const TELEGRAM_API_BASE = 'https://api.telegram.org';

let botInstance;

function getBot(botToken) {
  if (!botToken) {
    throw new Error('Telegram bot token is required.');
  }

  if (!botInstance || botInstance.token !== botToken) {
    botInstance = new TelegramBot(botToken, {
      polling: false,
      baseApiUrl: TELEGRAM_API_BASE
    });
  }

  return botInstance;
}

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

  const text = `🧠 *${escapeMarkdown(word)}*\n💬 ${escapeMarkdown(meaning)}\n🔗 [Source](${escapeMarkdown(pageUrl)})`;

  const bot = getBot(botToken);
  await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });

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
