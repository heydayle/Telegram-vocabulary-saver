# Telegram Vocabulary Saver

Telegram Vocabulary Saver is a Chrome extension that lets you capture new words as you browse, add a quick definition, and send the entry to a Telegram group or channel through your bot. Highlight any word on a page, jot down the meaning, and the extension pushes the formatted message straight to Telegram so you can keep a running vocabulary log.

## Features

- **One-click capture** &mdash; highlight a word and submit its meaning from an inline popup injected into any webpage by the content script. The popup is styled via `styles/popup.css` so it stays usable on bright or dark backgrounds.【F:content.js†L1-L79】【F:styles/popup.css†L1-L41】
- **Secure credential storage** &mdash; the extension stores the Telegram bot token and chat ID in Chrome Sync storage, making them available across devices while keeping them outside of your source files.【F:options.js†L1-L43】【F:setup.js†L1-L43】
- **Telegram Markdown formatting** &mdash; messages are escaped and wrapped with MarkdownV2 spoiler syntax before being sent to the Telegram Bot API to avoid formatting issues and keep the definition hidden until tapped.【F:background.js†L36-L61】
- **Guided onboarding** &mdash; if credentials are missing on install or when you try to save a word, the background service worker opens `setup.html` so you can paste in your bot token and chat ID.【F:background.js†L17-L34】【F:background.js†L80-L88】

## Project structure

```
├── background.js   # Service worker that validates credentials and calls Telegram
├── content.js      # Content script that renders the popup and sends SAVE_VOCAB messages
├── manifest.json   # Chrome extension manifest (Manifest V3)
├── options.html/js # Settings page to edit the bot token and chat ID after setup
├── setup.html/js   # First-run page for entering Telegram credentials
└── styles          # Shared popup styles injected with the content script
```

## How it works

1. **Content selection** &mdash; When you release the mouse after selecting text, `content.js` reads the selection, renders an inline popup beside the cursor, and posts the word/meaning to the background service worker via `chrome.runtime.sendMessage` when you click **Save**.【F:content.js†L13-L74】
2. **Credential guard** &mdash; The background worker loads the saved bot token and chat ID from `chrome.storage.sync`. If either is missing it opens the setup page instead of calling Telegram, preventing failed API calls.【F:background.js†L17-L53】
3. **Telegram delivery** &mdash; On success, the worker formats the message (`*word* = = ||meaning||`) and issues a `fetch` request to `https://api.telegram.org/bot<token>/sendMessage` with `MarkdownV2` parsing enabled.【F:background.js†L36-L69】
4. **Persistence** &mdash; Both `setup.js` and `options.js` use the same storage helper so updating credentials in either place immediately affects subsequent saves.【F:options.js†L1-L43】【F:setup.js†L1-L43】

## Prerequisites

- A Telegram bot token obtained from [@BotFather](https://core.telegram.org/bots/features#botfather).
- The numeric ID of the destination chat (for groups, ensure the bot is added and promote it if necessary).
- Google Chrome 88+ (Manifest V3 support) or a Chromium-based browser with developer mode.

## Installation

1. Clone or download this repository.
2. Open `chrome://extensions` in Chrome and toggle **Developer mode** (top right).
3. Choose **Load unpacked** and select the `vocab-to-tele-extension` directory.
4. When prompted, the extension opens the setup page. Paste your bot token and chat ID, then click **Save**.【F:setup.html†L33-L43】【F:setup.js†L24-L42】

## Usage

1. Browse to any page and highlight a word or phrase.
2. Release the mouse to reveal the inline popup.
3. Type a short definition or translation and press **Enter** or click **Save**.
4. The entry is sent to your configured Telegram chat. The definition is wrapped in spoiler tags so it stays hidden until you tap it in the chat.【F:background.js†L36-L61】

To adjust your credentials later, open the extension's details card on `chrome://extensions` and click **Extension options** to launch `options.html`.【F:options.html†L40-L51】【F:options.js†L24-L43】

## Debugging tutorial

Follow these steps if the extension does not behave as expected:

1. **Verify storage**
   - Open `chrome://extensions`, find the extension, and click **service worker** under "Inspect views".
   - In the DevTools console, run `chrome.storage.sync.get(['botToken','chatId']).then(console.log)` to confirm credentials exist.【F:background.js†L4-L18】
2. **Check message flow**
   - On the page where you reproduce the issue, open DevTools and inspect the console of the tab. The content script logs any `chrome.runtime.lastError` or API error returned by the background worker.【F:content.js†L52-L63】
   - If you do not see the popup, ensure the selection actually contains text; the script removes the popup for empty selections.【F:content.js†L41-L50】
3. **Inspect the service worker**
   - In the service worker console, watch for errors printed by `console.error` inside `handleSaveVocab`. Failures include missing credentials and non-OK responses from Telegram.【F:background.js†L46-L77】
   - You can manually trigger a call by running `chrome.runtime.sendMessage({type:'SAVE_VOCAB', payload:{word:'test', meaning:'example', pageUrl:location.href}})` from the service worker console.
4. **Validate Telegram API**
   - The worker logs the full API error body when Telegram rejects the request. Common causes include invalid tokens, missing chat permissions, or mis-formatted Markdown. Ensure the bot is part of the chat and try sending a plain text message with `curl` to confirm the token works.【F:background.js†L65-L76】

After adjusting settings, reload the extension from `chrome://extensions` (click **Reload**) to restart the service worker.

## Contributing

1. Fork the repository and create a new branch.
2. Make your changes, ensuring the popup remains unobtrusive and the Telegram flow is preserved.
3. Submit a pull request describing the update and how to test it.

## Contributors

- @your-github-handle (maintainer) &mdash; feel free to add yourself when you contribute.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
