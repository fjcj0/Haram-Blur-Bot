import { groq } from "../config/config.js";
export async function checkText(text) {
  const result = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
      {
        role: "system",
        content: 'أجب فقط بصيغة JSON: {"bad":true} أو {"bad":false}'
      },
      {
        role: "user",
        content: `هل هذا النص يحتوي على سب أو كلام بذيء أو محرم؟
${text}`
      }
    ]
  });
  try {
    return JSON.parse(result.choices[0].message.content).bad === true;
  } catch {
    return false;
  }
}