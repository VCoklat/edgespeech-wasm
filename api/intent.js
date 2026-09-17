export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text || text === 'No speech detected in recording.') {
    return res.status(400).json({ error: 'Valid speech transcript is required.' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Calls Google AI Studio API (Gemini/Gemma models)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Analyze the following transcribed user input. Extract the core intent, key entities, and a 1-sentence summary:\n\n"${text}"`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'API call failed');
    }

    const output = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to extract intent.';
    return res.status(200).json({ intent: output });
  } catch (error) {
    console.error('LLM API Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process intent.' });
  }
}