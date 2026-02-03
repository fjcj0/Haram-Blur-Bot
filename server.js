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
import csrfProtection from './middleware/csrfProtection.js';
if (!BOT_TOKEN || !GROQ_API_KEY) {
  console.error('❌ ضع BOT_TOKEN و GROQ_API_KEY');
  process.exit(1);
}
const app = express();
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.json());
morgan.token('client-ip', (req) => req.ip || req.connection.remoteAddress);
app.use(morgan('➜ :method :url :status :response-time ms - :res[content-length] - :client-ip'));
app.use(helmet());
app.use(cors({
    origin: process.env.SERVER,
    credentials: true
}));
app.use(rateLimiter);
app.use(speedLimiter);
app.use((req, res, next) => {
    if (["/api/cron", "/api/csrf-token", "/api/telegram-webhook"].includes(req.path)) {
        return next();
    }
    return csrfProtection(req, res, next);
});
app.get("/api/csrf-token", (req, res) => {
    const csrfToken = generateCsrfToken();
    res.cookie("csrfToken", csrfToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'None',
    });
    res.status(201).json({ csrfToken });
});
app.get('/api/cron', (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'cron job started....'
    });
});
app.post('/api/telegram-webhook', async (req, res) => {
    const update = req.body;
    const msg = update.message || update.edited_message;
    if (!msg) return res.sendStatus(200);
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const name = msg.from.first_name;
    const messageId = msg.message_id;
    try {
        if (msg.text) {
            if (/\/help/.test(msg.text)) {
                await bot.sendMessage(chatId,
`🤖 بوت رقابة تلقائي

✔ يمنع السب
✔ يحذف الرسائل المخالفة
✔ يحذف الصور غير الملائمة
✔ 3 مخالفات = حظر 3 أيام`);
                return res.sendStatus(200);
            }
            const badText = await checkText(msg.text);
            if (badText) {
                await bot.deleteMessage(chatId, messageId);
                await warn(chatId, userId, name);
                return res.sendStatus(200);
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
                return res.sendStatus(200);
            }
            if (msg.caption) {
                const badCaption = await checkText(msg.caption);
                if (badCaption) {
                    await bot.deleteMessage(chatId, messageId);
                    await warn(chatId, userId, name);
                    return res.sendStatus(200);
                }
            }
        }
    } catch (err) {
        console.error("❌ Bot Error:", err);
    }
    res.sendStatus(200);
});
if (process.env.NODE_ENV !== 'development') {
    job.start();
}
app.listen(process.env.PORT, () => console.log(`➜ Server running at http://localhost:${process.env.PORT}`));