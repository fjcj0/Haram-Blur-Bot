import { bot } from "../config/config.js";
const warnings = new Map();
export const warn = async (chatId, userId, name) => {
  const count = warnings.get(userId) || 0;
  const newCount = count + 1;
  warnings.set(userId, newCount);
  if (newCount >= 3) {
    const threeDays =
      Math.floor(Date.now() / 1000) + (3 * 24 * 60 * 60);
    await bot.banChatMember(chatId, userId, {
      until_date: threeDays
    });
    warnings.delete(userId);
    await bot.sendMessage(
      chatId,
      `🚫 ${name} تم حظرك 3 أيام بسبب المخالفات`
    );
  } else {
    await bot.sendMessage(
      chatId,
      `⚠️ ${name} تحذير (${newCount}/3) التزم بالآداب`
    );
  }
};