const POPUP_CLASS = 'telegram-vocab-popup';
let popupElement = null;
let selectedWord = '';

function removePopup() {
  if (popupElement && popupElement.parentNode) {
    popupElement.parentNode.removeChild(popupElement);
  }
  popupElement = null;
  selectedWord = '';
}

function createPopup(x, y) {
  popupElement = document.createElement('div');
  popupElement.className = POPUP_CLASS;

  const wordLabel = document.createElement('span');
  wordLabel.className = `${POPUP_CLASS}__word`;
  wordLabel.textContent = selectedWord;

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Enter meaning...';
  input.className = `${POPUP_CLASS}__input`;
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      button.click();
    }
  });

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Save';
  button.className = `${POPUP_CLASS}__button`;

  button.addEventListener('click', () => {
    const meaning = input.value.trim();
    if (!meaning) {
      input.focus();
      return;
    }

    chrome.runtime.sendMessage(
      {
        type: 'SAVE_VOCAB',
        payload: {
          word: selectedWord,
          meaning,
          pageUrl: window.location.href
        }
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
        } else if (!response?.success) {
          console.error(response?.error || 'Failed to save word.');
        }
      }
    );

    removePopup();
  });

  popupElement.appendChild(wordLabel);
  popupElement.appendChild(input);
  popupElement.appendChild(button);

  popupElement.style.top = `${y}px`;
  popupElement.style.left = `${x}px`;

  document.body.appendChild(popupElement);

  // requestAnimationFrame(() => input.focus());
}

document.addEventListener('mousedown', (event) => {
  if (popupElement && !event.target.closest(`.${POPUP_CLASS}`)) {
    removePopup();
  }
});

document.addEventListener('mouseup', (event) => {
  if (event.target.closest(`.${POPUP_CLASS}`)) {
    return;
  }

  const selection = window.getSelection();
  if (!selection) {
    removePopup();
    return;
  }

  const text = selection.toString().trim();
  if (!text || text.split(' ').length > 10) {
    removePopup();
    return;
  }

  selectedWord = text.charAt(0).toUpperCase() + text.slice(1);

  const pageX = event.pageX + 12;
  const pageY = event.pageY + 12;
  createPopup(pageX, pageY);
});
