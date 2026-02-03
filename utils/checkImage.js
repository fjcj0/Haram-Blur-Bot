import { groq } from "../config/config.js";
export async function checkImage(imageUrl) {
  const result = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
      {
        role: "system",
        content: 'أجب فقط بصيغة JSON: {"bad":true} أو {"bad":false}'
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `هل هذه الصورة تحتوي على تعري أو محتوى غير لائق؟`
          },
          {
            type: "image_url",
            image_url: { url: imageUrl }
          }
        ]
      }
    ]
  });
  try {
    return JSON.parse(result.choices[0].message.content).bad === true;
  } catch {
    return false;
  }
}