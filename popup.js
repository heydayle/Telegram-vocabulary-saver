const menuView = document.getElementById('menuView');
const formView = document.getElementById('addForm');
const addNewButton = document.getElementById('addNewButton');
const settingsButton = document.getElementById('settingsButton');
const cancelButton = document.getElementById('cancelButton');
const saveButton = document.getElementById('saveButton');
const wordInput = document.getElementById('wordInput');
const meaningInput = document.getElementById('meaningInput');
const statusMessage = document.getElementById('statusMessage');

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

function openSetupPage() {
  const url = chrome.runtime.getURL('setup.html');
  chrome.tabs.create({ url });
  window.close();
}

function openOptionsPage() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    const url = chrome.runtime.getURL('options.html');
    chrome.tabs.create({ url });
  }
  window.close();
}

function showStatus(message, variant) {
  statusMessage.textContent = message;
  statusMessage.classList.remove('popup__status--error', 'popup__status--success');
  if (variant === 'error') {
    statusMessage.classList.add('popup__status--error');
  } else if (variant === 'success') {
    statusMessage.classList.add('popup__status--success');
  }
}

function toggleView(showForm) {
  if (showForm) {
    menuView.classList.add('popup__view--hidden');
    formView.classList.remove('popup__view--hidden');
    showStatus('', null);
    wordInput.focus();
  } else {
    formView.classList.add('popup__view--hidden');
    menuView.classList.remove('popup__view--hidden');
    showStatus('', null);
  }
}

async function ensureCredentials() {
  const { botToken, chatId } = await storageGet(['botToken', 'chatId']);
  if (!botToken || !chatId) {
    openSetupPage();
    return false;
  }
  return true;
}

addNewButton.addEventListener('click', async () => {
  try {
    const ready = await ensureCredentials();
    if (!ready) {
      return;
    }
    toggleView(true);
  } catch (error) {
    console.error('Failed to verify credentials:', error);
    showStatus('Unable to verify credentials. Please try again.', 'error');
  }
});

settingsButton.addEventListener('click', () => {
  openOptionsPage();
});

cancelButton.addEventListener('click', () => {
  toggleView(false);
  wordInput.value = '';
  meaningInput.value = '';
});

formView.addEventListener('submit', (event) => {
  event.preventDefault();
  const word = wordInput.value.trim();
  const meaning = meaningInput.value.trim();

  if (!word || !meaning) {
    showStatus('Word and meaning are required.', 'error');
    if (!word) {
      wordInput.focus();
    } else {
      meaningInput.focus();
    }
    return;
  }

  saveButton.disabled = true;
  showStatus('Saving…');

  chrome.runtime.sendMessage(
    {
      type: 'SAVE_VOCAB',
      payload: {
        word,
        meaning
      }
    },
    (response) => {
      saveButton.disabled = false;

      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        showStatus(chrome.runtime.lastError.message, 'error');
        return;
      }

      if (!response?.success) {
        console.error(response?.error || 'Failed to save word.');
        showStatus(response?.error || 'Failed to save word.', 'error');
        return;
      }

      showStatus('Vocabulary saved!', 'success');
      wordInput.value = '';
      meaningInput.value = '';
      wordInput.focus();
    }
  );
});
