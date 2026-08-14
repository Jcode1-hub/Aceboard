export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, context } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Missing message" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server misconfigured — missing API key" });
  }

  const systemPrompt = `You are AceAi, the study coach inside AceBoard — an exam prep app for Nigerian students (WAEC, JAMB, NECO) and international students (SAT, IGCSE, ACT, IELTS).

Your job: help students figure out *why* they're struggling with a topic and give a clear, practical fix — not generic textbook answers. Be direct, encouraging, and specific. Use short paragraphs. Where useful, break down concepts step by step.

${context ? `Context about this student: ${context}` : ""}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nStudent's message: ${message}` }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);
      return res.status(502).json({ error: "AI service error, try again" });
    }

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't generate a response. Try rephrasing your question.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("aceai handler error:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

