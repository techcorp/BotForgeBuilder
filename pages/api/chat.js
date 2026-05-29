export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

// Retry helper
async function fetchWithRetry(url, options, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      return res;
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1))); // backoff
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { model, messages, systemPrompt } = req.body || {};
  if (!model || !messages || !systemPrompt) {
    return res.status(400).json({ error: "Missing required fields: model, messages, systemPrompt" });
  }

  const ZEN_KEY       = process.env.ZEN_API_KEY;
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ZEN_KEY && !ANTHROPIC_KEY) {
    return res.status(500).json({ error: "No API key configured. Add ZEN_API_KEY to .env.local" });
  }

  const isDirectAnthropic = model.source === "anthropic-direct";
  const isAnthropicStyle  = model.provider === "anthropic";

  try {
    let response, data;

    // ── 1. Direct Anthropic ──────────────────────────────────────────────────
    if (isDirectAnthropic) {
      if (!ANTHROPIC_KEY) return res.status(400).json({ error: "ANTHROPIC_API_KEY not set in .env.local" });
      response = await fetchWithRetry("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: model.id, max_tokens: 1024, system: systemPrompt, messages }),
      });
      data = await response.json();
      if (!response.ok) return res.status(response.status).json({ error: data.error?.message || `Anthropic error ${response.status}` });
      return res.json({ reply: data.content?.[0]?.text || "" });
    }

    // ── 2. Zen → Claude (Anthropic-style) ────────────────────────────────────
    if (isAnthropicStyle) {
      if (!ZEN_KEY) return res.status(400).json({ error: "ZEN_API_KEY not set in .env.local" });
      response = await fetchWithRetry("https://opencode.ai/zen/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${ZEN_KEY}` },
        body: JSON.stringify({ model: model.id, max_tokens: 1024, system: systemPrompt, messages }),
      });
      data = await response.json();
      if (!response.ok) return res.status(response.status).json({ error: data.error?.message || `Zen error ${response.status}: ${JSON.stringify(data)}` });
      return res.json({ reply: data.content?.[0]?.text || "" });
    }

    // ── 3. Zen → OpenAI-style (GPT, DeepSeek etc.) ───────────────────────────
    if (!ZEN_KEY) return res.status(400).json({ error: "ZEN_API_KEY not set in .env.local" });
    response = await fetchWithRetry("https://opencode.ai/zen/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${ZEN_KEY}` },
      body: JSON.stringify({
        model: model.id, max_tokens: 1024,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    });
    data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || `Zen error ${response.status}: ${JSON.stringify(data)}` });
    return res.json({ reply: data.choices?.[0]?.message?.content || "" });

  } catch (err) {
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "Request timed out (25s). Try a faster model like Claude Haiku." });
    }
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
}
