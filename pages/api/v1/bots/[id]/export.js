import { connectDB } from "../../../../../lib/mongoose";
import Bot from "../../../../../lib/models/Bot";
import { withAuth } from "../../../../../lib/middleware";
import { rateLimit } from "../../../../../lib/rateLimit";
import { logger } from "../../../../../lib/logger";
import { logAudit } from "../../../../../lib/auditLog";

const limiter = rateLimit(20, 60000);

/**
 * @swagger
 * /api/v1/bots/{id}/export:
 *   post:
 *     summary: Export bot in various formats
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [html, iframe, json, api]
 *                 description: Export format
 *     responses:
 *       200:
 *         description: Exported bot data or HTML
 */

export default async function handler(req, res) {
  limiter(req, res, () => {});

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    await connectDB();
    await withAuth(req, res, () => {});

    if (!req.user) return;

    const { id } = req.query;
    const { format = "json" } = req.body;

    const bot = await Bot.findOne({ id });
    if (!bot) {
      return res.status(404).json({ success: false, error: "Bot not found" });
    }

    if (bot.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    logger.info("Export bot", { botId: id, format, userId: req.user._id });
    await logAudit(req, "EXPORT", "BOT", id, { format });

    if (format === "json") {
      return handleJsonExport(res, bot);
    } else if (format === "html") {
      return handleHtmlExport(res, bot);
    } else if (format === "iframe") {
      return handleIframeExport(res, bot);
    } else if (format === "api") {
      return handleApiExport(res, bot);
    } else {
      return res.status(400).json({ success: false, error: "Unsupported format" });
    }
  } catch (err) {
    logger.error("Bot export error", { error: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
}

function handleJsonExport(res, bot) {
  const exported = {
    id: bot.id,
    name: bot.name,
    businessName: bot.businessName,
    businessType: bot.businessType,
    tone: bot.tone,
    language: bot.language,
    model: bot.model,
    customInstructions: bot.customInstructions,
    welcomeMessage: bot.welcomeMessage,
    createdAt: bot.createdAt,
  };

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="bot-${bot.id}.json"`);
  return res.status(200).send(JSON.stringify(exported, null, 2));
}

function handleHtmlExport(res, bot) {
  const html = generateChatbotHTML(bot);
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Content-Disposition", `attachment; filename="chatbot-${bot.id}.html"`);
  return res.status(200).send(html);
}

function handleIframeExport(res, bot) {
  const embedCode = `<iframe
  src="${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/embed/${bot.id}"
  width="100%"
  height="600"
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
></iframe>`;

  return res.status(200).json({
    success: true,
    data: {
      embedCode,
      url: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/embed/${bot.id}`,
    },
  });
}

function handleApiExport(res, bot) {
  return res.status(200).json({
    success: true,
    data: {
      botId: bot.id,
      apiEndpoint: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/v1/bots/${bot.id}/chat`,
      authentication: "Bearer token required",
      example: {
        url: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/v1/bots/${bot.id}/chat`,
        method: "POST",
        headers: {
          "Authorization": "Bearer YOUR_TOKEN",
          "Content-Type": "application/json",
        },
        body: {
          messages: [
            { role: "user", content: "Hello!" },
          ],
        },
      },
    },
  });
}

function generateChatbotHTML(bot) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${bot.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      width: 100%;
      max-width: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      display: flex;
      flex-direction: column;
      height: 600px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 12px 12px 0 0;
      text-align: center;
    }
    .header h1 { font-size: 20px; margin-bottom: 5px; }
    .header p { font-size: 14px; opacity: 0.9; }
    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .message {
      padding: 12px 16px;
      border-radius: 8px;
      max-width: 80%;
      word-wrap: break-word;
    }
    .message.bot {
      background: #f0f0f0;
      align-self: flex-start;
      color: #333;
    }
    .message.user {
      background: #667eea;
      align-self: flex-end;
      color: white;
    }
    .input-area {
      padding: 20px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      gap: 10px;
    }
    input {
      flex: 1;
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
    }
    input:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    button {
      padding: 12px 20px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }
    button:hover { background: #5568d3; }
    .loading {
      text-align: center;
      color: #999;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${bot.name}</h1>
      <p>${bot.businessName}</p>
    </div>
    <div class="messages" id="messages">
      <div class="message bot">${bot.welcomeMessage || "Hello! How can I help you today?"}</div>
    </div>
    <div class="input-area">
      <input type="text" id="userInput" placeholder="Type your message..." />
      <button onclick="sendMessage()">Send</button>
    </div>
  </div>

  <script>
    const messagesDiv = document.getElementById('messages');
    const userInput = document.getElementById('userInput');

    function addMessage(text, isBot = false) {
      const div = document.createElement('div');
      div.className = \`message \${isBot ? 'bot' : 'user'}\`;
      div.textContent = text;
      messagesDiv.appendChild(div);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    async function sendMessage() {
      const message = userInput.value.trim();
      if (!message) return;

      addMessage(message, false);
      userInput.value = '';

      // Show loading indicator
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'loading';
      loadingDiv.textContent = 'Bot is thinking...';
      messagesDiv.appendChild(loadingDiv);

      try {
        // This is a demo - in production, connect to your API
        const response = await fetch('/api/v1/bots/${bot.id}/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message }),
        });

        messagesDiv.removeChild(loadingDiv);

        if (response.ok) {
          const data = await response.json();
          addMessage(data.reply, true);
        } else {
          addMessage('Sorry, I encountered an error. Please try again.', true);
        }
      } catch (error) {
        messagesDiv.removeChild(loadingDiv);
        addMessage('Connection error. Please check your internet connection.', true);
      }
    }

    userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  </script>
</body>
</html>`;
}
