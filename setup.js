document.addEventListener('DOMContentLoaded', () => {
  const botTokenInput = document.getElementById('botToken');
  const chatIdInput = document.getElementById('chatId');
  const saveButton = document.getElementById('save');
  const statusEl = document.getElementById('status');

  chrome.storage.sync.get(['botToken', 'chatId'], ({ botToken, chatId }) => {
    if (botToken) {
      botTokenInput.value = botToken;
    }
    if (chatId) {
      chatIdInput.value = chatId;
    }
  });

  function saveCredentials(data) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(data, () => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }
        resolve();
      });
    });
  }

  saveButton.addEventListener('click', async () => {
    const botToken = botTokenInput.value.trim();
    const chatId = chatIdInput.value.trim();

    if (!botToken || !chatId) {
      statusEl.textContent = 'Both bot token and chat ID are required.';
      statusEl.style.color = '#c0392b';
      return;
    }

    try {
      await saveCredentials({ botToken, chatId });
      statusEl.textContent = 'Credentials saved successfully! You can close this tab.';
      statusEl.style.color = '#2e7d32';
    } catch (error) {
      console.error(error);
      statusEl.textContent = 'Failed to save credentials. Please try again.';
      statusEl.style.color = '#c0392b';
    }
  });
});
