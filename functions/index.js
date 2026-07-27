const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const Anthropic = require("@anthropic-ai/sdk");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

exports.aiStudyCoach = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Use POST" });
    }

    const { message } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing 'message' in request body" });
    }

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system:
          "You are the AceBoard AI Study Coach — a friendly, encouraging tutor for Nigerian secondary school students preparing for WAEC, NECO, JAMB, GCE, IGCSE, SAT, ACT, and IELTS. Give specific, practical, exam-relevant advice. Keep responses concise and actionable.",
        messages: [{ role: "user", content: message }],
      });

      const text = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n");

      return res.status(200).json({ text });
    } catch (err) {
      console.error("aiStudyCoach error:", err);
      return res.status(500).json({ error: "AI request failed" });
    }
  });
});
