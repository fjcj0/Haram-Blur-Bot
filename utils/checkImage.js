import { groq } from "../config/config.js";
export async function checkImage(imageUrl) {
  try {
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
              text: "هل هذه الصورة تحتوي على فتاة أو امرأة بأي شكل كان، أو أي محتوى غير مناسب؟"
            },
            {
              type: "image_url",
              image_url: imageUrl
            }
          ]
        }
      ]
    });
    const content = result.choices[0].message.content.trim();
    const parsed = JSON.parse(content.replace(/(\r\n|\n|\r)/gm, ""));
    return parsed.bad === true;
  } catch (err) {
    console.error("❌ checkImage error:", err);
    return false;
  }
}