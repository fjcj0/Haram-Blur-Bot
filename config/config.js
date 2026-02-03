import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import Groq from "groq-sdk";
export const GROQ_API_KEY = process.env.GROQ_API_KEY;
export const BOT_TOKEN = process.env.BOT_TOKEN;
export const bot = new TelegramBot(BOT_TOKEN,{polling:true});
export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });