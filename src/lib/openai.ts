import Constants from 'expo-constants';

/**
 * getAIResponse - supports GPT-4 Vision and image input
 * @param messages - Array of message objects for OpenAI chat
 * @param imageUrlOrBase64 - Optional image URL or base64 string
 */
type ChatContent = string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
type ChatMessage = { role: string; content: ChatContent };
export async function getAIResponse(
  messages: ChatMessage[],
  imageUrlOrBase64?: string
) {
  const apiKey = Constants?.expoConfig?.extra?.OPENAI_API_KEY;
  const endpoint = 'https://api.openai.com/v1/chat/completions';

  // Use GPT-4 Vision model if image is provided
  const model = imageUrlOrBase64 ? 'gpt-4-vision-preview' : 'gpt-3.5-turbo';

  // If image is provided, add it to the last user message as per OpenAI API
  let messagesWithImage = [...messages];
  if (imageUrlOrBase64) {
    // Find last user message
    const lastUserIdx = messagesWithImage.map(m => m.role).lastIndexOf('user');
    if (lastUserIdx !== -1) {
      // Extract string from content (if array, join text fields; if string, use directly)
      let textContent = '';
      const origContent = messagesWithImage[lastUserIdx].content;
      if (typeof origContent === 'string') {
        textContent = origContent;
      } else if (Array.isArray(origContent)) {
        textContent = origContent
          .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
          .map(part => {
            if (part.type === 'text') {
              return part.text;
            }
            return '';
          })
          .join(' ');
      }
      messagesWithImage[lastUserIdx] = {
        ...messagesWithImage[lastUserIdx],
        content: [
          { type: 'text', text: textContent },
          { type: 'image_url', image_url: { url: imageUrlOrBase64 } }
        ]
      };
    } else {
      // If no user message, add a new one
      messagesWithImage.push({
        role: 'user',
        content: [
          { type: 'text', text: 'Please analyze this image.' },
          { type: 'image_url', image_url: { url: imageUrlOrBase64 } }
        ]
      });
    }
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: messagesWithImage,
      temperature: 0.7,
      // Optionally, you can set max_tokens for vision model
      ...(imageUrlOrBase64 ? { max_tokens: 1024 } : {})
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to get AI response');
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
}
