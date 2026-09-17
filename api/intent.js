export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body || {};

  if (!text || typeof text !== 'string' || text.trim() === '' || text === 'No speech detected in recording.') {
    return res.status(400).json({ error: 'Valid transcribed text is required.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY environment variable is not set on Vercel.',
    });
  }

  try {
    // Memanggil endpoint model gemma-4-31b-it dari Google AI Studio
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Analyze the following transcribed user speech input. Extract the user's core intent and provide a clear 1-sentence summary.\n\nRespond strictly with a JSON object containing the keys "intent" and "summary".\n\nTranscript: "${text}"`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemma 4 API Error:', data);
      throw new Error(data.error?.message || 'Gemma 4 API call failed.');
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error('Empty payload returned from Gemma 4 model.');
    }

    const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedText);

    return res.status(200).json({
      intent: parsed.intent || 'General Statement',
      summary: parsed.summary || text,
      status: 'success',
    });
  } catch (error) {
    console.error('Intent Serverless Function Error:', error);
    return res.status(500).json({
      intent: 'Speech Input',
      summary: text,
      error: error.message || 'Failed to process downstream NLP intent with Gemma 4.',
      status: 'error',
    });
  }
}