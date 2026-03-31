/**
 * Small API server for AI content formatting (Magic Wand).
 * Run: node server/index.js (or npm run server)
 * Loads .env from project root. Requires OPENAI_API_KEY or GEMINI_API_KEY.
 */
import dotenv from 'dotenv';
dotenv.config();

const FORMAT_SYSTEM_PROMPT = `You are a luxury copywriter for Skin Studio. Your tone is 'Quiet Luxury'—minimalist, professional, and empathetic.
Convert the user's raw notes into a Markdown-formatted description for a beauty service.
Rules:
1. Write the entire output in Czech.
2. Use **bold** for key benefits.
3. Use bullet points for clear structure.
4. Keep it editorial and soft-sell (don't be pushy).
5. Output only the Markdown content.`;

async function formatWithOpenAI(rawText, apiKey) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: FORMAT_SYSTEM_PROMPT },
        { role: 'user', content: rawText },
      ],
      temperature: 0.5,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (content == null) throw new Error('No content in OpenAI response');
  return content.trim();
}

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

async function createApp() {
  const express = (await import('express')).default;
  const app = express();
  app.use(express.json());

  app.post('/api/format-content', async (req, res) => {
    try {
      const { rawText } = req.body ?? {};
      if (typeof rawText !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid rawText' });
      }
      const trimmed = rawText.trim();
      if (!trimmed) {
        return res.status(400).json({ error: 'rawText is empty' });
      }

      const openaiKey = process.env.OPENAI_API_KEY;
      const geminiKey = process.env.GEMINI_API_KEY;

      let formattedMarkdown;
      if (openaiKey) {
        formattedMarkdown = await formatWithOpenAI(trimmed, openaiKey);
      } else if (geminiKey) {
        formattedMarkdown = await formatWithGemini(trimmed, geminiKey);
      } else {
        return res.status(503).json({
          error: 'No LLM configured. Set OPENAI_API_KEY or GEMINI_API_KEY.',
        });
      }

      res.json({ formattedMarkdown });
    } catch (err) {
      console.error('format-content error:', err);
      res.status(500).json({
        error: err.message || 'Formatting failed',
      });
    }
  });

  return app;
}

const port = Number(process.env.PORT) || 3001;

createApp().then((app) => {
  app.listen(port, () => {
    console.log(`API server running at http://localhost:${port}`);
  });
});
