/**
 * Firebase Cloud Function: format-content API (AI Magic Wand).
 * Deploy: firebase deploy --only functions
 * Set Gemini key: firebase functions:config:set gemini.key="YOUR_GEMINI_API_KEY"
 * Or in Firebase Console: Functions → formatContent → Environment variables → GEMINI_API_KEY
 */
const functions = require('firebase-functions');

const FORMAT_SYSTEM_PROMPT = `You are a luxury copywriter for Skin Studio. Your tone is 'Quiet Luxury'—minimalist, professional, and empathetic.
Convert the user's raw notes into a Markdown-formatted description for a beauty service.
Rules:
1. Write the entire output in Czech.
2. Use **bold** for key benefits.
3. Use bullet points for clear structure.
4. Keep it editorial and soft-sell (don't be pushy).
5. Output only the Markdown content.`;

async function formatWithGemini(rawText, apiKey) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${FORMAT_SYSTEM_PROMPT}\n\nUser raw notes:\n${rawText}` }] }],
        generationConfig: { temperature: 0.5 },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (text == null) throw new Error('No text in Gemini response');
  return text.trim();
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

exports.formatContent = functions
  .runWith({ timeoutSeconds: 60 })
  .https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    try {
      const body = await parseBody(req);
      const rawText = body.rawText;
      if (typeof rawText !== 'string') {
        res.status(400).json({ error: 'Missing or invalid rawText' });
        return;
      }
      const trimmed = rawText.trim();
      if (!trimmed) {
        res.status(400).json({ error: 'rawText is empty' });
        return;
      }
      const geminiKey = process.env.GEMINI_API_KEY || functions.config().gemini?.key;
      if (!geminiKey) {
        res.status(503).json({ error: 'No LLM configured. Set GEMINI_API_KEY in env or gemini.key in config.' });
        return;
      }
      const formattedMarkdown = await formatWithGemini(trimmed, geminiKey);
      res.status(200).json({ formattedMarkdown });
    } catch (err) {
      functions.logger.error('formatContent error', err);
      res.status(500).json({ error: err.message || 'Formatting failed' });
    }
  });
