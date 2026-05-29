/**
 * BotForge Widget v1.0
 * Drop-in chat widget — loaded on client websites via <script> tag
 * Config is set via window.BotForgeConfig before this script loads
 */
(function () {
  "use strict";

  const cfg = window.BotForgeConfig || {};
  if (!cfg.apiUrl) { console.warn("[BotForge] apiUrl not set in BotForgeConfig"); return; }

  const NAME    = cfg.name        || cfg.botName      || "Assistant";
  const BIZ     = cfg.businessName || "";
  const COLOR   = cfg.primaryColor || "#7C3AED";
  const LOGO    = cfg.logo        || "";
  const WELCOME = cfg.welcomeMessage || `Hi! I'm ${NAME}. How can I help you today?`;
  const API_URL = cfg.apiUrl;
  const MODEL   = cfg.model       || "claude-haiku-4-5";
  const POWERED = cfg.poweredBy   || "";

  // ── Inject Styles ──────────────────────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = `
    #bf-widget-btn {
      position: fixed; bottom: 24px; right: 24px; z-index: 99998;
      width: 58px; height: 58px; border-radius: 50%;
      background: linear-gradient(135deg, ${COLOR}, #6D28D9);
      border: none; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.25);
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
      overflow: hidden;
    }
    #bf-widget-btn:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(0,0,0,0.3); }
    #bf-widget-btn svg { width: 26px; height: 26px; }
    #bf-widget-btn img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }

    #bf-widget-box {
      position: fixed; bottom: 96px; right: 24px; z-index: 99999;
      width: 380px; max-height: 580px;
      background: #13131F; border-radius: 20px;
      border: 1px solid #2D2D44;
      box-shadow: 0 16px 64px rgba(0,0,0,0.5);
      display: flex; flex-direction: column;
      font-family: 'DM Sans', 'Segoe UI', sans-serif;
      overflow: hidden;
      transform: scale(0.9) translateY(20px);
      opacity: 0; pointer-events: none;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    #bf-widget-box.bf-open {
      transform: scale(1) translateY(0);
      opacity: 1; pointer-events: all;
    }
    #bf-widget-header {
      padding: 14px 16px;
      background: linear-gradient(135deg, ${COLOR}20, rgba(109,40,217,0.15));
      border-bottom: 1px solid #2D2D44;
      display: flex; align-items: center; gap: 10px;
    }
    #bf-widget-avatar {
      width: 38px; height: 38px; border-radius: 50%;
      background: ${COLOR}30; border: 1.5px solid ${COLOR}60;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; overflow: hidden; flex-shrink: 0;
    }
    #bf-widget-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .bf-header-info { flex: 1; }
    .bf-header-name { font-weight: 700; font-size: 14px; color: #F1F5F9; }
    .bf-header-status { font-size: 11px; color: #10B981; display: flex; align-items: center; gap: 4px; }
    .bf-dot { width: 6px; height: 6px; border-radius: 50%; background: #10B981; display: inline-block; animation: bf-pulse 2s infinite; }
    #bf-close-btn { background: none; border: none; color: #64748B; cursor: pointer; padding: 4px; border-radius: 6px; line-height: 1; font-size: 18px; }
    #bf-close-btn:hover { color: #E2E8F0; background: rgba(255,255,255,0.08); }

    #bf-messages {
      flex: 1; overflow-y: auto; padding: 14px 12px;
      display: flex; flex-direction: column; gap: 10px;
      max-height: 380px; min-height: 200px;
    }
    #bf-messages::-webkit-scrollbar { width: 4px; }
    #bf-messages::-webkit-scrollbar-thumb { background: #2D2D44; border-radius: 4px; }

    .bf-msg { display: flex; align-items: flex-end; gap: 7px; }
    .bf-msg.bf-user { justify-content: flex-end; }
    .bf-msg-avatar {
      width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
      background: ${COLOR}25; display: flex; align-items: center; justify-content: center;
      font-size: 12px; overflow: hidden;
    }
    .bf-msg-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .bf-bubble {
      max-width: 76%; padding: 9px 13px; font-size: 13.5px; line-height: 1.55;
      white-space: pre-wrap; word-break: break-word;
    }
    .bf-bubble.bf-bot {
      background: #1E1E2E; color: #E2E8F0; border: 1px solid #2D2D44;
      border-radius: 4px 16px 16px 16px;
    }
    .bf-bubble.bf-user {
      background: linear-gradient(135deg, ${COLOR}, #6D28D9);
      color: #fff; border-radius: 16px 16px 4px 16px;
    }
    .bf-typing { display: flex; gap: 5px; padding: 10px 14px; background: #1E1E2E; border: 1px solid #2D2D44; border-radius: 4px 16px 16px 16px; width: fit-content; }
    .bf-typing span { width: 6px; height: 6px; border-radius: 50%; background: ${COLOR}; display: inline-block; animation: bf-bounce 1.2s infinite; }
    .bf-typing span:nth-child(2) { animation-delay: 0.2s; }
    .bf-typing span:nth-child(3) { animation-delay: 0.4s; }

    #bf-input-area {
      padding: 10px 12px; border-top: 1px solid #2D2D44;
      display: flex; gap: 8px; align-items: center;
    }
    #bf-input {
      flex: 1; padding: 10px 14px; border-radius: 20px;
      border: 1px solid #2D2D44; background: #0C0C14; color: #E2E8F0;
      font-size: 13px; font-family: inherit; outline: none; resize: none;
    }
    #bf-input::placeholder { color: #4B5563; }
    #bf-send-btn {
      width: 38px; height: 38px; border-radius: 50%; border: none; flex-shrink: 0;
      background: linear-gradient(135deg, ${COLOR}, #6D28D9);
      color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 0.15s;
    }
    #bf-send-btn:disabled { background: #2D2D44; cursor: not-allowed; }
    #bf-powered { text-align: center; padding: 6px; font-size: 10px; color: #374151; border-top: 1px solid #1E1E2E; }
    #bf-powered a { color: #4B5563; text-decoration: none; }

    @keyframes bf-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
    @keyframes bf-bounce { 0%,80%,100%{transform:scale(0.6);opacity:0.5} 40%{transform:scale(1);opacity:1} }

    @media (max-width: 480px) {
      #bf-widget-box { width: calc(100vw - 20px); right: 10px; bottom: 80px; }
      #bf-widget-btn { bottom: 16px; right: 16px; }
    }
  `;
  document.head.appendChild(style);

  // ── Chat State ─────────────────────────────────────────────────────────────
  let messages  = [{ role: "assistant", content: WELCOME }];
  let isOpen    = false;
  let isLoading = false;

  // ── Build DOM ──────────────────────────────────────────────────────────────
  // Toggle Button
  const btn = document.createElement("button");
  btn.id = "bf-widget-btn";
  btn.setAttribute("aria-label", `Chat with ${NAME}`);
  btn.innerHTML = LOGO
    ? `<img src="${LOGO}" alt="${NAME}" />`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;

  // Widget Box
  const box = document.createElement("div");
  box.id = "bf-widget-box";
  box.innerHTML = `
    <div id="bf-widget-header">
      <div id="bf-widget-avatar">
        ${LOGO ? `<img src="${LOGO}" alt="${NAME}" />` : "🤖"}
      </div>
      <div class="bf-header-info">
        <div class="bf-header-name">${NAME}</div>
        <div class="bf-header-status"><span class="bf-dot"></span> Online${BIZ ? " • " + BIZ : ""}</div>
      </div>
      <button id="bf-close-btn" aria-label="Close chat">✕</button>
    </div>
    <div id="bf-messages"></div>
    <div id="bf-input-area">
      <input id="bf-input" type="text" placeholder="Type a message…" autocomplete="off" />
      <button id="bf-send-btn" aria-label="Send" disabled>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
      </button>
    </div>
    <div id="bf-powered">Powered by ${POWERED || '<a href="#" target="_blank">BotForge</a>'}</div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(box);

  // ── DOM Refs ───────────────────────────────────────────────────────────────
  const msgContainer = box.querySelector("#bf-messages");
  const input        = box.querySelector("#bf-input");
  const sendBtn      = box.querySelector("#bf-send-btn");
  const closeBtn     = box.querySelector("#bf-close-btn");

  // ── Render Messages ────────────────────────────────────────────────────────
  function renderMessages() {
    msgContainer.innerHTML = "";
    messages.forEach(m => {
      const row = document.createElement("div");
      row.className = `bf-msg ${m.role === "user" ? "bf-user" : ""}`;

      if (m.role === "assistant") {
        const av = document.createElement("div");
        av.className = "bf-msg-avatar";
        av.innerHTML = LOGO ? `<img src="${LOGO}" alt="" />` : "🤖";
        row.appendChild(av);
      }

      const bubble = document.createElement("div");
      bubble.className = `bf-bubble ${m.role === "user" ? "bf-user" : "bf-bot"}`;
      bubble.textContent = m.content;
      row.appendChild(bubble);
      msgContainer.appendChild(row);
    });
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  function showTyping() {
    const row = document.createElement("div");
    row.className = "bf-msg";
    row.id = "bf-typing-row";
    if (LOGO) {
      const av = document.createElement("div");
      av.className = "bf-msg-avatar";
      av.innerHTML = `<img src="${LOGO}" alt="" />`;
      row.appendChild(av);
    }
    const t = document.createElement("div");
    t.className = "bf-typing";
    t.innerHTML = "<span></span><span></span><span></span>";
    row.appendChild(t);
    msgContainer.appendChild(row);
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  function hideTyping() {
    const r = document.getElementById("bf-typing-row");
    if (r) r.remove();
  }

  // ── Send Message ───────────────────────────────────────────────────────────
  async function sendMessage() {
    const text = input.value.trim();
    if (!text || isLoading) return;

    input.value = "";
    sendBtn.disabled = true;
    isLoading = true;

    messages.push({ role: "user", content: text });
    renderMessages();
    showTyping();

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: { id: MODEL, provider: "anthropic", source: "zen" },
          systemPrompt: cfg.systemPrompt || `You are ${NAME}, assistant for ${BIZ}. Be helpful and concise.`,
          messages: messages,
        }),
      });
      const data = await res.json();
      hideTyping();
      if (!res.ok) throw new Error(data.error || "Error");
      messages.push({ role: "assistant", content: data.reply });
      renderMessages();
    } catch (e) {
      hideTyping();
      messages.push({ role: "assistant", content: "Sorry, something went wrong. Please try again." });
      renderMessages();
    }

    isLoading = false;
    sendBtn.disabled = !input.value.trim();
    input.focus();
  }

  // ── Toggle ─────────────────────────────────────────────────────────────────
  function toggle() {
    isOpen = !isOpen;
    if (isOpen) {
      box.classList.add("bf-open");
      renderMessages();
      setTimeout(() => input.focus(), 300);
    } else {
      box.classList.remove("bf-open");
    }
  }

  // ── Events ─────────────────────────────────────────────────────────────────
  btn.addEventListener("click", toggle);
  closeBtn.addEventListener("click", toggle);
  input.addEventListener("input", () => { sendBtn.disabled = !input.value.trim() || isLoading; });
  input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
  sendBtn.addEventListener("click", sendMessage);

  // Initial render
  renderMessages();

})();
