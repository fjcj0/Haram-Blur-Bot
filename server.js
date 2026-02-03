import 'dotenv/config';
import express from 'express';
import { bot, BOT_TOKEN, GROQ_API_KEY } from './config/config.js';
import { checkText } from './utils/checkText.js';
import { checkImage } from './utils/checkImage.js';
import { warn } from './utils/warn.js';
import generateCsrfToken from './tools/csrf.js';
import { rateLimiter, speedLimiter } from './tools/DDosProtection.js';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import job from './tools/cron.js';
if (!BOT_TOKEN || !GROQ_API_KEY) {
  console.error('❌ ضع BOT_TOKEN و GROQ_API_KEY');
  process.exit(1);
}
const app = express();
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.json());
morgan.token('client-ip', (request) => {
    return request.ip || request.connection.remoteAddress;
});
app.use(morgan('➜ :method :url :status :response-time ms - :res[content-length] - :client-ip'));
app.use(helmet());
app.use(cors({
    origin: process.env.SERVER,
    credentials: true
}));
app.use(rateLimiter);
app.use(speedLimiter);
app.use((request, response, next) => {
    if (request.path === "/api/cron" || request.path === "/api/csrf-token" || request.path === "/api/telegram-webhook") {
        return next();
    }
    return csrfProtection(request, response, next);
});
app.get("/api/csrf-token", (request, response) => {
    const csrfToken = generateCsrfToken();
    response.cookie("csrfToken", csrfToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'None',
    });
    response.status(201).json({ csrfToken });
});
app.get('/api/cron', (request, response) => {
    return response.status(200).json({
        success: true,
        message: 'cron job started....'
    });
});
app.post('/api/telegram-webhook', async (req, res) => {
  const update = req.body;
  try {
     bot.processUpdate(update); 
  } catch (err) {
    console.error('❌ Webhook Error:', err);
  }
  res.sendStatus(200);
});
if (process.env.NODE_ENV !== 'development') {
    job.start();
}
app.listen(process.env.PORT, () => console.log(`➜ Server running at http://localhost:${process.env.PORT}`));
bot.on("message", async (msg) => {
  try {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const name = msg.from.first_name;
    const messageId = msg.message_id;
    if (msg.text) {
      const badText = await checkText(msg.text);
      if (badText) {
        await bot.deleteMessage(chatId, messageId);
        await warn(chatId, userId, name);
        return;
      }
    }
    if (msg.photo && msg.photo.length > 0) {
      const photo = msg.photo[msg.photo.length - 1];
      const file = await bot.getFile(photo.file_id);
      const imageUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
      const badImage = await checkImage(imageUrl);
      if (badImage) {
        await bot.deleteMessage(chatId, messageId);
        await warn(chatId, userId, name);
        return;
      }
      if (msg.caption) {
        const badCaption = await checkText(msg.caption);
        if (badCaption) {
          await bot.deleteMessage(chatId, messageId);
          await warn(chatId, userId, name);
        }
      }
    }
  } catch (err) {
    console.error("❌ Bot Error:", err);
  }
});
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
`🤖 بوت رقابة تلقائي

✔ يمنع السب
✔ يحذف الرسائل المخالفة
✔ يحذف الصور غير الملائمة
✔ 3 مخالفات = حظر 3 أيام`
  );
});