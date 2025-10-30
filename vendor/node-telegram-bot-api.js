(function (global) {
  const DEFAULT_BASE_URL = 'https://api.telegram.org';

  class TelegramBot {
    constructor(token, options = {}) {
      if (!token) {
        throw new Error('TelegramBot token is required');
      }
      this.token = token;
      this.options = { polling: false, ...options };
      this.baseApiUrl = (this.options.baseApiUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
    }

    async sendMessage(chatId, text, options = {}) {
      if (!chatId) {
        throw new Error('chatId is required');
      }

      if (typeof text !== 'string' || text.length === 0) {
        throw new Error('text is required');
      }

      const payload = {
        chat_id: chatId,
        text,
        ...options
      };

      return this._request('sendMessage', payload);
    }

    async _request(method, body) {
      const endpoint = `${this.baseApiUrl}/bot${this.token}/${method}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Telegram API error: ${errorText}`);
      }

      return response.json();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TelegramBot;
  }

  global.TelegramBot = TelegramBot;
})(typeof self !== 'undefined' ? self : this);
