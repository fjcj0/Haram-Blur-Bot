import { groq } from "../config/config.js";
export async function checkImage(imageUrl) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "system",
          content: "أجب فقط بصيغة JSON: {\"bad\":true} أو {\"bad\":false}"
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Does this image contain a woman or girl in any form? Reply only in JSON: {\"bad\":true} or {\"bad\":false}"
            },
            {
              type: "image_url",
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      temperature: 0,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: false
    });
    const content = chatCompletion.choices[0].message.content.trim();
    const match = content.match(/\{[^}]*"bad"\s*:\s*(true|false)[^}]*\}/i);
    const parsed = match ? JSON.parse(match[0]) : { bad: false };
    console.log("checkImage result:", parsed.bad);
    return parsed.bad === true;
  } catch (err) {
    console.error("❌ checkImage error:", err);
    return false;
  }
}