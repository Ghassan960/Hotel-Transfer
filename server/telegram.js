const TelegramBot = require('node-telegram-bot-api');

class TelegramService {
  constructor() {
    this.bot = null;
    this.token = process.env.TELEGRAM_BOT_TOKEN;
  }

  init() {
    if (!this.token) {
      console.warn('TELEGRAM_BOT_TOKEN not provided. Notifications will be disabled.');
      return;
    }
    
    // We only need the bot for sending messages, not for receiving
    // Therefore, we do not need to set up polling unless we want to catch errors or something.
    try {
      this.bot = new TelegramBot(this.token, { polling: false });
      console.log('Telegram Bot initialized for outgoing notifications.');
    } catch (error) {
      console.error('Failed to initialize Telegram Bot:', error);
    }
  }

  async sendMessage(chatId, message, parseMode = 'Markdown') {
    if (!this.bot) {
      console.log(`[Mock Telegram] To: ${chatId} | Message: ${message}`);
      return;
    }
    
    try {
      await this.bot.sendMessage(chatId, message, { parse_mode: parseMode });
    } catch (error) {
      console.error(`Error sending Telegram message to ${chatId}:`, error.message);
    }
  }
}

module.exports = new TelegramService();
