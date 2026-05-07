const TelegramBot = require('node-telegram-bot-api');

let bot = null;

const getBot = () => {
  if (!bot && process.env.TELEGRAM_BOT_TOKEN) {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
  }
  return bot;
};

const sendMessage = async (chatId, message) => {
  try {
    const b = getBot();
    if (!b || !chatId) return;
    await b.sendMessage(chatId, message, { parse_mode: 'HTML' });
  } catch (err) {
    console.error('Telegram sendMessage error:', err.message);
  }
};

const sendPaymentConfirmed = async (chatId, booking, game) => {
  const msg = `
✅ <b>Payment Confirmed!</b>

🎉 Your spot is confirmed for:
<b>${game.title}</b>

📅 Date: ${new Date(game.date_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
🕐 Time: ${new Date(game.date_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
📍 Location: ${game.location}, Addis Ababa
👟 Format: ${game.format}
👥 Players: ${booking.num_players}
🎫 Reference: <code>${booking.reference_code}</code>

See you on the pitch! ⚽
`;
  await sendMessage(chatId, msg);
};

const sendPasswordResetToken = async (chatId, token) => {
  const msg = `
🔐 <b>Password Reset</b>

Your password reset code is:
<code>${token}</code>

This code expires in <b>15 minutes</b>.

If you didn't request this, please ignore this message.
`;
  await sendMessage(chatId, msg);
};

const sendWelcomeMessage = async (chatId, fullName) => {
  const msg = `
⚽ <b>Welcome to Addis Meetup, ${fullName}!</b>

Join football games across Addis Ababa — no team needed!

Use the app to:
• Browse upcoming games
• Book your spot
• Play and connect

Let's play! 🏟️
`;
  await sendMessage(chatId, msg);
};

module.exports = {
  getBot,
  sendMessage,
  sendPaymentConfirmed,
  sendPasswordResetToken,
  sendWelcomeMessage,
};
