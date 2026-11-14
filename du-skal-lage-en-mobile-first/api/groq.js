export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Bruk POST.' });
  if (!process.env.GROQ_API_KEY) return response.status(503).json({ error: 'AI er ikke koblet til ennå.' });

  const question = String(request.body?.question || '').trim();
  if (!question || question.length > 500) return response.status(400).json({ error: 'Skriv et kort spørsmål.' });

  try {
    const result = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        temperature: 0.5,
        max_tokens: 350,
        messages: [
          { role: 'system', content: 'Du er en trygg, rolig norsk turvenn. Svar enkelt med korte setninger. Ikke erstatt værvarsel, skredvarsel eller medisinsk hjelp. Si tydelig fra om usikkerhet.' },
          { role: 'user', content: question }
        ]
      })
    });
    const data = await result.json();
    if (!result.ok) throw new Error(data.error?.message || 'AI-tjenesten svarte ikke.');
    return response.status(200).json({ answer: data.choices?.[0]?.message?.content || 'Jeg fikk ikke et svar. Prøv igjen.' });
  } catch (error) {
    return response.status(502).json({ error: error.message || 'AI-tjenesten svarte ikke.' });
  }
}
