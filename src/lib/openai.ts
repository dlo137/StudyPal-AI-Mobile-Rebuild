import Constants from 'expo-constants';

export async function getAIResponse(messages: { role: string, content: string }[]) {
  const apiKey = Constants?.expoConfig?.extra?.OPENAI_API_KEY;
  const endpoint = 'https://api.openai.com/v1/chat/completions';

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to get AI response');
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
}
