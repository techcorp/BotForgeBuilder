import { useState, useRef, useEffect } from "react";
import { useTheme } from "./_app";
import { LS } from "../lib/storage";
import { buildSystemPrompt } from "../lib/prompts";
import { ZEN_MODELS, ANTHROPIC_MODELS, BUSINESS_TEMPLATES, TONES, LANGUAGES } from "../lib/constants";
import Icon from "../components/Icon";

async function api(url, opts = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// ─── Btn ─────────────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant = "primary", disabled, full, size = "md", style: sx = {} }) {
  const { t, mode } = useTheme();
  const base = {
    display: "inline-flex", alignItems: "center", gap: 7, border: "none",
    cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit",
    fontWeight: 600, borderRadius: 10, transition: "all 0.15s",
    opacity: disabled ? 0.45 : 1, width: full ? "100%" : "auto",
    justifyContent: full ? "center" : "flex-start",
    padding: size === "sm" ? "7px 14px" : size === "lg" ? "14px 24px" : "10px 20px",
    fontSize: size === "sm" ? 12 : 14,
  };
  const styles = {
    primary: { background: "linear-gradient(135deg,#7C3AED,#6D28D9)", color: "#fff" },
    danger:  { background: "linear-gradient(135deg,#DC2626,#B91C1C)", color: "#fff" },
    success: { background: "linear-gradient(135deg,#059669,#047857)", color: "#fff" },
    ghost:   { background: mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", color: t.sub, border: `1px solid ${t.border}` },
    outline: { background: "transparent", color: "#7C3AED", border: "1.5px solid #7C3AED" },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...styles[variant], ...sx }}>
      {children}
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function Card({ children, style: sx = {}, hover = false }) {
  const { t } = useTheme();
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => hover && setHov(true)}
      onMouseLeave={() => hover && setHov(false)}
      style={{
        background: t.surface, border: `1px solid ${hov ? "rgba(124,58,237,0.4)" : t.border}`,
        borderRadius: 16, transition: "all 0.2s",
        transform: hov ? "translateY(-2px)" : "none",
        boxShadow: hov ? "0 12px 40px rgba(124,58,237,0.12)" : "none",
        ...sx,
      }}>
      {children}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
function Input({ value, onChange, placeholder, type = "text", disabled, style: sx = {} }) {
  const { t } = useTheme();
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} disabled={disabled}
      style={{
        width: "100%", padding: "11px 14px", borderRadius: 10,
        border: `1px solid ${t.border}`, background: t.input,
        color: t.text, fontSize: 14, outline: "none", transition: "border-color 0.15s",
        opacity: disabled ? 0.6 : 1, ...sx,
      }}
    />
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
function Textarea({ value, onChange, placeholder, rows = 4 }) {
  const { t } = useTheme();
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      style={{
        width: "100%", padding: "11px 14px", borderRadius: 10,
        border: `1px solid ${t.border}`, background: t.input,
        color: t.text, fontSize: 14, outline: "none", resize: "vertical",
        lineHeight: 1.6, fontFamily: "inherit",
      }}
    />
  );
}

// ─── Label ────────────────────────────────────────────────────────────────────
function Label({ children }) {
  const { t } = useTheme();
  return <div style={{ fontSize: 13, fontWeight: 600, color: t.sub, marginBottom: 7 }}>{children}</div>;
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ children, color = "#7C3AED" }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 5,
      background: `${color}20`, color, border: `1px solid ${color}30` }}>
      {children}
    </span>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 9999,
      padding: "12px 20px", borderRadius: 10, fontSize: 14,
      animation: "slideIn 0.2s ease", boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      background: toast.type === "error" ? "#3B0A0A" : "#0A2A1A",
      border: `1px solid ${toast.type === "error" ? "#EF4444" : "#10B981"}`,
      color: toast.type === "error" ? "#FCA5A5" : "#6EE7B7",
    }}>
      {toast.msg}
    </div>
  );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────
function Chip({ label, active, onClick, block = false }) {
  const { t } = useTheme();
  return (
    <div onClick={onClick} style={{
      padding: block ? "10px 14px" : "8px 16px",
      borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500,
      border: `1.5px solid ${active ? "#7C3AED" : t.border}`,
      background: active ? "rgba(124,58,237,0.15)" : t.input,
      color: active ? "#A78BFA" : t.sub,
      transition: "all 0.15s",
      display: block ? "block" : "inline-block",
    }}>{label}</div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage, botsCount }) {
  const { t, mode, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const NAV = [
    { id: "dashboard", icon: "grid",  label: "Dashboard" },
    { id: "builder",   icon: "spark", label: "New Chatbot" },
    { id: "settings",  icon: "key",   label: "Settings" },
  ];
  return (
    <aside style={{
      width: 220, flexShrink: 0,
      background: mode === "dark" ? "#0F0F1A" : "#F1F5F9",
      borderRight: `1px solid ${t.border}`,
      display: "flex", flexDirection: "column",
      padding: "24px 0", height: "100vh", position: "sticky", top: 0,
    }}>
      <div style={{ padding: "0 20px 24px", borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#7C3AED,#06B6D4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon n="bot" size={18} style={{ color: "#fff" }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, color: t.text }}>BotForge</div>
            <div style={{ fontSize: 10, color: t.sub, letterSpacing: 2, textTransform: "uppercase" }}>Builder</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "20px 12px" }}>
        {NAV.map(item => {
          const active = page === item.id || (page === "preview" && item.id === "dashboard") || (page === "export" && item.id === "dashboard");
          return (
            <div key={item.id} onClick={() => setPage(item.id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500, marginBottom: 4,
              color: active ? "#A78BFA" : t.sub,
              background: active ? "rgba(124,58,237,0.12)" : "transparent",
              transition: "all 0.15s",
            }}>
              <Icon n={item.icon} size={16} />
              {item.label}
              {mounted && item.id === "dashboard" && botsCount > 0 && (
                <span style={{ marginLeft: "auto", background: "#7C3AED", color: "#fff", borderRadius: 20, fontSize: 11, padding: "1px 7px", fontWeight: 600 }}>
                  {botsCount}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      <div style={{ padding: "14px 20px", borderTop: `1px solid ${t.border}` }}>
        <div onClick={toggleTheme} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: t.sub, fontWeight: 500 }}>
          <Icon n={mode === "dark" ? "sun" : "moon"} size={15} />
          {mode === "dark" ? "Light Mode" : "Dark Mode"}
        </div>
      </div>
      {mounted && LS.get("bf_company_name", "") && (
        <div style={{ padding: "8px 20px", fontSize: 11, color: mode === "dark" ? "#374151" : "#9A94AD" }}>
          Powered by {LS.get("bf_company_name")}
        </div>
      )}
    </aside>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function Dashboard({ bots, loading, openBuilder, deleteBot, goPreview, goExport }) {
  const { t } = useTheme();

  if (loading) {
    return (
      <div className="fade-up" style={{ maxWidth: 1000 }}>
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <div style={{ fontSize: 32, marginBottom: 16, animation: "pulse 1.2s infinite" }}>⏳</div>
          <div style={{ fontSize: 16, color: t.sub }}>Loading chatbots…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up" style={{ maxWidth: 1000 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, color: t.text, marginBottom: 5 }}>My Chatbots</h1>
          <p style={{ color: t.sub, fontSize: 14 }}>{bots.length} chatbot{bots.length !== 1 ? "s" : ""} ready to deploy</p>
        </div>
        <Btn onClick={() => openBuilder()} size="lg">
          <Icon n="plus" size={16} /> New Chatbot
        </Btn>
      </div>

      {bots.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Total Bots",     val: bots.length,                                icon: "bot" },
            { label: "Business Types", val: new Set(bots.map(b => b.businessType)).size, icon: "grid" },
            { label: "Models Used",    val: new Set(bots.map(b => b.model?.id)).size,    icon: "spark" },
          ].map(s => (
            <Card key={s.label} style={{ padding: "18px 20px" }}>
              <div style={{ color: t.sub, fontSize: 12, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <Icon n={s.icon} size={13} /> {s.label}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#A78BFA", fontFamily: "'Syne',sans-serif" }}>{s.val}</div>
            </Card>
          ))}
        </div>
      )}

      {bots.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🤖</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: t.text, marginBottom: 8 }}>No chatbots yet</div>
          <p style={{ fontSize: 14, color: t.sub, marginBottom: 24 }}>Build your first AI chatbot in minutes</p>
          <Btn onClick={() => openBuilder()} size="lg"><Icon n="plus" size={16} /> Create Chatbot</Btn>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
          {bots.map(bot => (
            <BotCard key={bot.id} bot={bot}
              onEdit={() => openBuilder(bot)} onDelete={() => deleteBot(bot.id)}
              onPreview={() => goPreview(bot)} onExport={() => goExport(bot)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── BotCard ─────────────────────────────────────────────────────────────────
function BotCard({ bot, onEdit, onDelete, onPreview, onExport }) {
  const { t } = useTheme();
  const tmpl = BUSINESS_TEMPLATES.find(x => x.id === bot.businessType) || BUSINESS_TEMPLATES[7];
  return (
    <Card hover style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `${tmpl.color}20`, border: `1px solid ${tmpl.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
            {tmpl.icon}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: t.text }}>{bot.name}</div>
            <div style={{ fontSize: 12, color: t.sub }}>{bot.businessName}</div>
          </div>
        </div>
        <Badge color={tmpl.color}>{tmpl.name}</Badge>
      </div>
      <p style={{ fontSize: 13, color: t.sub, marginBottom: 14, lineHeight: 1.5 }}>
        {(bot.businessDetails || "").slice(0, 85)}…
      </p>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {[bot.tone, bot.language, bot.model?.name?.split(" ").slice(0, 2).join(" ")].filter(Boolean).map(tag => (
          <span key={tag} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: `${t.border}80`, color: t.sub, border: `1px solid ${t.border}` }}>{tag}</span>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, borderTop: `1px solid ${t.border}`, paddingTop: 14 }}>
        {[
          { icon: "eye",      label: "Preview", action: onPreview, color: "#06B6D4" },
          { icon: "download", label: "Export",  action: onExport,  color: "#10B981" },
          { icon: "edit",     label: "Edit",    action: onEdit,    color: "#A78BFA" },
          { icon: "trash",    label: "Delete",  action: onDelete,  color: "#EF4444" },
        ].map(b => (
          <button key={b.icon} title={b.label} onClick={b.action} style={{
            padding: 8, background: "transparent", border: `1px solid ${t.border}`,
            borderRadius: 8, cursor: "pointer", color: b.color,
            display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
          }}>
            <Icon n={b.icon} size={15} />
          </button>
        ))}
      </div>
    </Card>
  );
}

// ─── Builder ─────────────────────────────────────────────────────────────────
const STEPS = ["Business Info", "Personality", "AI Model", "Review"];

function Builder({ bot, onSave, onCancel, notify }) {
  const { t } = useTheme();
  const isEdit = !!bot?.id;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    id: bot?.id || Date.now().toString(),
    logo: bot?.logo || "",
    name: bot?.name || "",
    businessName: bot?.businessName || "",
    businessType: bot?.businessType || "",
    businessDetails: bot?.businessDetails || "",
    tone: bot?.tone || "Friendly",
    language: bot?.language || "English",
    model: bot?.model || ZEN_MODELS[0],
    customInstructions: bot?.customInstructions || "",
    welcomeMessage: bot?.welcomeMessage || "",
    createdAt: bot?.createdAt || new Date().toISOString(),
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const canNext = [
    () => form.businessName.trim() && form.businessType && form.businessDetails.trim(),
    () => form.name.trim() && form.tone && form.language,
    () => !!form.model,
    () => true,
  ];

  return (
    <div className="fade-up" style={{ maxWidth: 780 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
        <Btn variant="ghost" onClick={onCancel} size="sm"><Icon n="back" size={16} /></Btn>
        <div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: t.text }}>{isEdit ? "Edit Chatbot" : "Create New Chatbot"}</h1>
          <p style={{ color: t.sub, fontSize: 13 }}>Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 32 }}>
        {STEPS.map((s, i) => (
          <div key={s} onClick={() => i < step && setStep(i)} style={{
            flex: 1, height: 4, borderRadius: 4,
            background: i <= step ? "linear-gradient(90deg,#7C3AED,#06B6D4)" : t.border,
            cursor: i < step ? "pointer" : "default", transition: "all 0.3s",
          }} />
        ))}
      </div>

      <Card style={{ padding: 32 }}>
        {step === 0 && <StepBusiness form={form} set={set} />}
        {step === 1 && <StepPersonality form={form} set={set} />}
        {step === 2 && <StepModel form={form} set={set} />}
        {step === 3 && <StepReview form={form} />}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, paddingTop: 20, borderTop: `1px solid ${t.border}` }}>
          <Btn variant="ghost" onClick={() => step === 0 ? onCancel() : setStep(s => s - 1)}>
            {step === 0 ? "Cancel" : "← Back"}
          </Btn>
          {step < 3 ? (
            <Btn disabled={!canNext[step]()} onClick={() => setStep(s => s + 1)}>Next →</Btn>
          ) : (
            <Btn variant="success" onClick={() => onSave(form)}>✓ Save Chatbot</Btn>
          )}
        </div>
      </Card>
    </div>
  );
}

function StepBusiness({ form, set }) {
  const { t } = useTheme();
  const logoRef = useRef();
  const pdfRef  = useRef();
  const [pdfState, setPdfState] = useState({ loading: false, fileName: "", error: "", success: "" });

  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) { alert("Logo too large. Max 500KB."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => set("logo", ev.target.result);
    reader.readAsDataURL(file);
  };

  const handlePDF = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setPdfState(s => ({ ...s, error: "PDF too large. Max 10MB." })); return; }

    setPdfState({ loading: true, fileName: file.name, error: "", success: "" });

    const fd = new FormData();
    fd.append("pdf", file);

    try {
      const res  = await fetch("/api/extract-pdf", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Extraction failed");

      // Paste raw text directly into Business Details — no AI needed
      const text = data.text?.slice(0, 12000) || "";
      set("businessDetails", text);

      setPdfState({ loading: false, fileName: file.name, error: "",
        success: `✓ Text extracted from "${file.name}" (${data.pages} pages, ${data.charCount.toLocaleString()} chars)${data.charCount > 12000 ? " — first 12,000 chars used" : ""}` });
    } catch (err) {
      setPdfState({ loading: false, fileName: file.name, error: err.message, success: "" });
    }
    e.target.value = "";
  };

  return (
    <>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: t.text, marginBottom: 4 }}>Business Information</h2>
      <p style={{ color: t.sub, fontSize: 13, marginBottom: 18 }}>Fill manually or upload a PDF — AI will extract everything automatically</p>

      {/* PDF Upload Banner */}
      <div style={{ marginBottom: 22, padding: 16, borderRadius: 12,
        border: `2px dashed ${pdfState.success ? "#10B981" : pdfState.error ? "#EF4444" : "#7C3AED"}`,
        background: pdfState.success ? "rgba(16,185,129,0.06)" : pdfState.error ? "rgba(239,68,68,0.06)" : "rgba(124,58,237,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 28 }}>📄</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 2 }}>Upload Business PDF</div>
            <div style={{ fontSize: 12, color: t.sub }}>Brochure, menu, product catalog, price list — AI extracts all details automatically</div>
          </div>
          <button
            onClick={() => pdfRef.current?.click()}
            disabled={pdfState.loading}
            style={{
              padding: "9px 18px", borderRadius: 8, border: "none",
              background: pdfState.loading ? t.border : "linear-gradient(135deg,#7C3AED,#6D28D9)",
              color: pdfState.loading ? t.sub : "#fff",
              cursor: pdfState.loading ? "not-allowed" : "pointer",
              fontSize: 13, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap",
              display: "flex", alignItems: "center", gap: 7,
            }}>
            {pdfState.loading ? "⏳ Extracting…" : "📤 Upload PDF"}
          </button>
          <input ref={pdfRef} type="file" accept=".pdf" onChange={handlePDF} style={{ display: "none" }} />
        </div>
        {pdfState.success && <div style={{ marginTop: 10, fontSize: 12, color: "#10B981", fontWeight: 500 }}>{pdfState.success}</div>}
        {pdfState.error   && <div style={{ marginTop: 10, fontSize: 12, color: "#EF4444" }}>⚠️ {pdfState.error}</div>}
        {pdfState.loading && (
          <div style={{ marginTop: 10, fontSize: 12, color: "#A78BFA" }}>
            🤖 AI is reading your PDF and extracting business details…
          </div>
        )}
      </div>

      <Label>Business Type *</Label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 22 }}>
        {BUSINESS_TEMPLATES.map(tmpl => (
          <div key={tmpl.id} onClick={() => { set("businessType", tmpl.id); if (tmpl.sample && !form.businessDetails) set("businessDetails", tmpl.sample); }} style={{
            padding: "12px 8px", borderRadius: 10, textAlign: "center", cursor: "pointer",
            border: `2px solid ${form.businessType === tmpl.id ? tmpl.color : t.border}`,
            background: form.businessType === tmpl.id ? `${tmpl.color}12` : t.input,
            transition: "all 0.15s",
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{tmpl.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: form.businessType === tmpl.id ? tmpl.color : t.sub }}>{tmpl.name}</div>
          </div>
        ))}
      </div>

      <Label>Business Name *</Label>
      <div style={{ marginBottom: 18 }}>
        <Input value={form.businessName} onChange={v => set("businessName", v)} placeholder="e.g. Khan's Restaurant, City Clinic…" />
      </div>

      <Label>Business Logo (Optional)</Label>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <div style={{ width: 72, height: 72, borderRadius: 16, border: `2px dashed ${form.logo ? "#7C3AED" : t.border}`, background: form.logo ? "transparent" : t.input, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, cursor: "pointer" }}
          onClick={() => logoRef.current?.click()}>
          {form.logo
            ? <img src={form.logo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ textAlign: "center" }}><div style={{ fontSize: 24, marginBottom: 2 }}>🖼️</div><div style={{ fontSize: 10, color: t.sub }}>Click to upload</div></div>
          }
        </div>
        <div>
          <button onClick={() => logoRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.input, color: t.text, cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 500, marginBottom: 8 }}>
            <Icon n="download" size={14} /> Upload Logo
          </button>
          {form.logo && (
            <button onClick={() => set("logo", "")} style={{ fontSize: 12, color: "#EF4444", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
              ✕ Remove
            </button>
          )}
          <div style={{ fontSize: 11, color: t.sub, marginTop: 4 }}>PNG, JPG, SVG — Max 500KB</div>
        </div>
        <input ref={logoRef} type="file" accept="image/*" onChange={handleLogo} style={{ display: "none" }} />
      </div>

      <Label>Business Details *</Label>
      <Textarea value={form.businessDetails} onChange={v => set("businessDetails", v)}
        placeholder="Location, timings, services, products — anything relevant… (or upload PDF above)" rows={5} />
    </>
  );
}

function StepPersonality({ form, set }) {
  const { t } = useTheme();
  const instrPdfRef = useRef();
  const [pdfState, setPdfState] = useState({ loading: false, error: "", success: "" });

  const handleInstrPDF = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPdfState({ loading: true, error: "", success: "" });
    const fd = new FormData();
    fd.append("pdf", file);
    try {
      const res  = await fetch("/api/extract-pdf", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      const text     = data.text?.slice(0, 6000) || "";
      const existing = form.customInstructions?.trim();
      set("customInstructions", existing ? existing + "\n\n" + text : text);
      setPdfState({ loading: false, error: "", success: `✓ Text extracted from "${file.name}" (${data.pages} pages)` });
    } catch (err) {
      setPdfState({ loading: false, error: err.message, success: "" });
    }
    e.target.value = "";
  };

  return (
    <>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: t.text, marginBottom: 4 }}>Bot Personality</h2>
      <p style={{ color: t.sub, fontSize: 13, marginBottom: 22 }}>Customize how your chatbot talks</p>
      <Label>Bot Name *</Label>
      <div style={{ marginBottom: 18 }}>
        <Input value={form.name} onChange={v => set("name", v)} placeholder="e.g. Aria, Max, Support Bot…" />
      </div>
      <Label>Welcome Message</Label>
      <div style={{ marginBottom: 18 }}>
        <Input value={form.welcomeMessage} onChange={v => set("welcomeMessage", v)} placeholder="e.g. Hi! I'm Aria. How can I help you today?" />
      </div>
      <Label>Tone *</Label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {TONES.map(tone => <Chip key={tone} label={tone} active={form.tone === tone} onClick={() => set("tone", tone)} />)}
      </div>
      <Label>Response Language *</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {LANGUAGES.map(lang => <Chip key={lang} label={lang} active={form.language === lang} onClick={() => set("language", lang)} block />)}
      </div>
      <Label>Additional Instructions (Optional)</Label>
      <Textarea value={form.customInstructions} onChange={v => set("customInstructions", v)}
        placeholder="Any special rules, topics to avoid, or specific behaviors…" rows={3} />
      {/* PDF upload for additional instructions */}
      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => instrPdfRef.current?.click()} disabled={pdfState.loading}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.input, color: t.sub, cursor: pdfState.loading ? "not-allowed" : "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 500 }}>
          {pdfState.loading ? "⏳ Extracting…" : "📄 Extract from PDF"}
        </button>
        <span style={{ fontSize: 11, color: t.sub }}>Upload a PDF to auto-fill instructions</span>
        <input ref={instrPdfRef} type="file" accept=".pdf" onChange={handleInstrPDF} style={{ display: "none" }} />
      </div>
      {pdfState.success && <div style={{ marginTop: 6, fontSize: 12, color: "#10B981" }}>{pdfState.success}</div>}
      {pdfState.error   && <div style={{ marginTop: 6, fontSize: 12, color: "#EF4444" }}>⚠️ {pdfState.error}</div>}
    </>
  );
}

function StepModel({ form, set }) {
  const { t } = useTheme();
  const BADGE_COLORS = { Free: "#10B981", Recommended: "#A78BFA", Fast: "#06B6D4", Powerful: "#F59E0B", Budget: "#94A3B8" };
  return (
    <>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: t.text, marginBottom: 4 }}>Choose AI Model</h2>
      <p style={{ color: t.sub, fontSize: 13, marginBottom: 22 }}>OpenCode Zen models (primary) or Direct Anthropic (optional)</p>
      <Label>OpenCode Zen Models</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        {ZEN_MODELS.map(m => {
          const active = form.model?.id === m.id && form.model?.source !== "anthropic-direct";
          return (
            <div key={m.id} onClick={() => set("model", m)} style={{
              padding: "12px 16px", borderRadius: 10, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              border: `1.5px solid ${active ? "#7C3AED" : t.border}`,
              background: active ? "rgba(124,58,237,0.1)" : t.input, transition: "all 0.15s",
            }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 500, color: t.text }}>{m.name}</span>
                <span style={{ fontSize: 11, color: t.sub, marginLeft: 8 }}>{m.provider}</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {m.badge && <Badge color={BADGE_COLORS[m.badge] || "#64748B"}>{m.badge}</Badge>}
                {active && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7C3AED" }} />}
              </div>
            </div>
          );
        })}
      </div>
      <Label>Direct Anthropic API (requires ANTHROPIC_API_KEY in .env.local)</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ANTHROPIC_MODELS.map(m => {
          const active = form.model?.id === m.id && form.model?.source === "anthropic-direct";
          return (
            <div key={m.id} onClick={() => set("model", m)} style={{
              padding: "12px 16px", borderRadius: 10, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              border: `1.5px solid ${active ? "#06B6D4" : t.border}`,
              background: active ? "rgba(6,182,212,0.08)" : t.input, transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: t.text }}>{m.name}</span>
              {active && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#06B6D4" }} />}
            </div>
          );
        })}
      </div>
    </>
  );
}

function StepReview({ form }) {
  const { t } = useTheme();
  const tmpl = BUSINESS_TEMPLATES.find(x => x.id === form.businessType);
  return (
    <>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: t.text, marginBottom: 4 }}>Review & Save</h2>
      <p style={{ color: t.sub, fontSize: 13, marginBottom: 22 }}>Everything look good?</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[["Bot Name", form.name], ["Business", form.businessName], ["Type", tmpl?.name], ["Tone", form.tone], ["Language", form.language], ["Model", form.model?.name]].map(([k, v]) => (
          <div key={k} style={{ background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 11, color: t.sub, marginBottom: 3 }}>{k}</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: t.text }}>{v || "—"}</div>
          </div>
        ))}
      </div>
      <Label>Generated System Prompt</Label>
      <pre style={{
        background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14,
        fontSize: 12, color: t.sub, lineHeight: 1.7, maxHeight: 180, overflow: "auto",
        whiteSpace: "pre-wrap", wordBreak: "break-word",
      }}>
        {buildSystemPrompt(form)}
      </pre>
    </>
  );
}

// ─── Preview ─────────────────────────────────────────────────────────────────
function Preview({ bot, onBack }) {
  const { t } = useTheme();
  const tmpl = BUSINESS_TEMPLATES.find(x => x.id === bot.businessType) || BUSINESS_TEMPLATES[7];
  const companyName = typeof window !== "undefined" ? LS.get("bf_company_name", "") : "";
  const initMsg = { role: "assistant", content: bot.welcomeMessage || `Hi! I'm ${bot.name}, assistant for ${bot.businessName}. How can I help you today?` };
  const [msgs,    setMsgs]    = useState([initMsg]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const endRef = useRef();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput(""); setError("");
    const next = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: bot.model, systemPrompt: bot.systemPrompt || buildSystemPrompt(bot), messages: next }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "API error");
      setMsgs([...next, { role: "assistant", content: d.reply }]);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const reset = () => { setMsgs([initMsg]); setError(""); setInput(""); };

  const QUICK = ["What services do you offer?", "What are your hours?", "How can I contact you?", "Tell me about yourself"];

  return (
    <div className="fade-up" style={{ maxWidth: 760 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <Btn variant="ghost" onClick={onBack} size="sm"><Icon n="back" size={16} /></Btn>
        <div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: t.text }}>Live Preview</h1>
          <p style={{ color: t.sub, fontSize: 13 }}>{bot.name} — {bot.businessName}</p>
        </div>
        <button onClick={reset} title="Reset chat" style={{ marginLeft: "auto", padding: "7px 12px", borderRadius: 8, border: `1px solid ${t.border}`, background: "transparent", color: t.sub, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit" }}>
          <Icon n="refresh" size={13} /> Reset
        </button>
      </div>

      <Card style={{ overflow: "hidden" }}>
        {/* Chat Header — model name hidden */}
        <div style={{ padding: "14px 18px", background: `linear-gradient(135deg,${tmpl.color}15,rgba(124,58,237,0.08))`, borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", gap: 12 }}>
          {bot.logo
            ? <img src={bot.logo} alt="logo" style={{ width: 38, height: 38, borderRadius: 12, objectFit: "cover", border: `1.5px solid ${tmpl.color}50` }} />
            : <div style={{ width: 38, height: 38, borderRadius: 12, background: `${tmpl.color}25`, border: `1.5px solid ${tmpl.color}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{tmpl.icon}</div>
          }
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: t.text }}>{bot.name}</div>
            <div style={{ fontSize: 11, color: "#10B981", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", display: "inline-block", animation: "pulse 2s infinite" }} />
              Online • {bot.businessName}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ height: 440, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 7 }}>
              {m.role === "assistant" && (
                <div style={{ width: 26, height: 26, borderRadius: "50%", overflow: "hidden", background: `${tmpl.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>
                  {bot.logo ? <img src={bot.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : tmpl.icon}
                </div>
              )}
              <div style={{
                maxWidth: "72%", padding: "10px 14px",
                borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
                background: m.role === "user" ? `linear-gradient(135deg,${tmpl.color},#7C3AED)` : t.surface,
                color: m.role === "user" ? "#fff" : t.text,
                fontSize: 14, lineHeight: 1.65,
                border: m.role === "assistant" ? `1px solid ${t.border}` : "none",
                whiteSpace: "pre-wrap",
              }}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 7 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: `${tmpl.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{tmpl.icon}</div>
              <div style={{ padding: "10px 16px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: "4px 18px 18px 18px", display: "flex", gap: 5, alignItems: "center" }}>
                {[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: tmpl.color, display: "inline-block", animation: "bounce 1.2s infinite", animationDelay: `${i*0.2}s` }} />)}
              </div>
            </div>
          )}

          {error && (
            <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.25)" }}>
              <div style={{ color: "#EF4444", fontSize: 13, marginBottom: 5 }}>⚠️ {error}</div>
              <button onClick={() => setError("")} style={{ fontSize: 11, color: "#A78BFA", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>Dismiss</button>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "12px 14px", borderTop: `1px solid ${t.border}`, display: "flex", gap: 8, alignItems: "center" }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={loading ? `${bot.name} is typing…` : "Type a message…"}
            disabled={loading}
            style={{ flex: 1, padding: "11px 18px", borderRadius: 24, border: `1px solid ${t.border}`, background: t.input, color: t.text, fontSize: 14, outline: "none", fontFamily: "inherit" }}
          />
          <button onClick={send} disabled={loading || !input.trim()} style={{
            width: 42, height: 42, borderRadius: "50%", border: "none", flexShrink: 0,
            background: input.trim() && !loading ? `linear-gradient(135deg,${tmpl.color},#7C3AED)` : t.border,
            color: input.trim() && !loading ? "#fff" : t.sub,
            cursor: input.trim() && !loading ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
          }}>
            <Icon n="send" size={15} />
          </button>
        </div>
      </Card>

      {/* Suggested questions */}
      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: t.sub }}>Suggested Questions:</span>
        {QUICK.map(q => (
          <button key={q} onClick={() => setInput(q)} style={{
            fontSize: 12, padding: "5px 12px", borderRadius: 20,
            border: `1px solid ${t.border}`, background: t.surface,
            color: t.sub, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
          }}>{q}</button>
        ))}
      </div>

      {companyName && (
        <div style={{ marginTop: 12, textAlign: "center", fontSize: 11, color: t.sub }}>
          Powered by {companyName}
        </div>
      )}
    </div>
  );
}

// ─── Export ──────────────────────────────────────────────────────────────────
const EXPORT_TABS = [
  { id: "embed",     label: "Script Tag" },
  { id: "iframe",    label: "iFrame" },
  { id: "wordpress", label: "WordPress" },
  { id: "shopify",   label: "Shopify" },
  { id: "html",      label: "Custom HTML" },
];

function Export({ bot, onBack, notify }) {
  const { t } = useTheme();
  const [tab, setTab]       = useState("embed");
  const [copied, setCopy]   = useState(false);
  const [appUrl, setAppUrl] = useState(() => {
    if (typeof window !== "undefined") return LS.get("bf_app_url", "");
    return "";
  });
  const [urlSaved, setUrlSaved] = useState(false);
  const tmpl = BUSINESS_TEMPLATES.find(x => x.id === bot.businessType) || BUSINESS_TEMPLATES[7];
  const companyName = typeof window !== "undefined" ? LS.get("bf_company_name", "") : "";

  const BASE = appUrl.replace(/\/$/, "") || "https://YOUR-APP.vercel.app";

  const saveUrl = () => {
    LS.set("bf_app_url", appUrl);
    setUrlSaved(true);
    setTimeout(() => setUrlSaved(false), 2000);
    notify("App URL saved!");
  };

  // Bot config as compact JSON for the widget
  const botConfig = JSON.stringify({
    id:             bot.id,
    name:           bot.name,
    businessName:   bot.businessName,
    model:          bot.model,
    primaryColor:   tmpl.color,
    logo:           bot.logo || "",
    welcomeMessage: bot.welcomeMessage || `Hi! I'm ${bot.name}. How can I help?`,
    poweredBy:      companyName || "",
    apiUrl:         `${BASE}/api/chat`,
  });

  const EMBED = `<!-- ${bot.businessName} — AI Chatbot by BotForge -->
<script>
  window.BotForgeConfig = ${botConfig};
</script>
<script src="${BASE}/widget.js" async></script>`;

  const IFRAME = `<iframe
  src="${BASE}/chat/${bot.id}"
  width="420" height="640" frameborder="0"
  style="border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.3);border:none;"
  title="${bot.name} Chat">
</iframe>`;

  const WP = `# WordPress Integration Guide

## Method 1: "Insert Headers and Footers" Plugin (Easiest)
1. Install plugin: "Insert Headers and Footers"
2. Settings → Insert Headers and Footers
3. Paste the Script Tag code below in "Scripts in Footer"
4. Save Changes

## Method 2: Theme Footer
1. Appearance → Theme Editor → footer.php
2. Find </body> tag — paste this just before it:

${EMBED}

## Method 3: Elementor / Page Builder
1. Add "HTML" widget to any page or global footer
2. Paste the Script Tag code inside it`;

  const SHOPIFY = `# Shopify Integration Guide

1. Admin → Online Store → Themes
2. Click "..." next to active theme → Edit Code
3. Open: Layout → theme.liquid
4. Find the </body> tag
5. Paste this just before </body>:

${EMBED}

6. Click Save
7. View your store — chatbot will appear in the corner`;

  const HTML_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${bot.businessName}</title>
</head>
<body>

  <!-- Your existing website content -->

  <!-- BotForge Chatbot — paste before </body> -->
${EMBED}

</body>
</html>`;

  const content = { embed: EMBED, iframe: IFRAME, wordpress: WP, shopify: SHOPIFY, html: HTML_CODE };

  const copy = () => {
    navigator.clipboard.writeText(content[tab]).then(() => {
      setCopy(true); notify("Copied to clipboard!");
      setTimeout(() => setCopy(false), 2000);
    });
  };

  return (
    <div className="fade-up" style={{ maxWidth: 820 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <Btn variant="ghost" onClick={onBack} size="sm"><Icon n="back" size={16} /></Btn>
        <div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: t.text }}>Export & Integration</h1>
          <p style={{ color: t.sub, fontSize: 13 }}>{bot.name} — Add to your website</p>
        </div>
      </div>

      {/* Bot Summary */}
      <Card style={{ padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 14 }}>
        {bot.logo
          ? <img src={bot.logo} alt="logo" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover" }} />
          : <div style={{ width: 44, height: 44, borderRadius: 10, background: `${tmpl.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{tmpl.icon}</div>
        }
        <div>
          <div style={{ fontWeight: 600, color: t.text }}>{bot.name}</div>
          <div style={{ fontSize: 12, color: t.sub }}>{bot.businessName} • {tmpl.name}</div>
        </div>
        <div style={{ marginLeft: "auto" }}><Badge color="#10B981">✓ Ready to Deploy</Badge></div>
      </Card>

      {/* App URL Input — IMPORTANT */}
      <Card style={{ padding: 20, marginBottom: 18, border: `1px solid rgba(124,58,237,0.3)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Icon n="globe" size={16} style={{ color: "#7C3AED" }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: t.text }}>Your BotForge App URL</span>
          <Badge color="#7C3AED">Required</Badge>
        </div>
        <p style={{ fontSize: 12, color: t.sub, marginBottom: 12 }}>
          Enter the URL where your BotForge app is deployed (e.g. Vercel). This will appear in the integration code.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={appUrl}
            onChange={e => setAppUrl(e.target.value)}
            placeholder="https://my-botforge.vercel.app"
            style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1px solid ${appUrl ? "#7C3AED" : t.border}`, background: t.input, color: t.text, fontSize: 14, outline: "none", fontFamily: "inherit" }}
          />
          <button onClick={saveUrl} style={{
            padding: "10px 18px", borderRadius: 10, border: "none", cursor: "pointer",
            background: urlSaved ? "linear-gradient(135deg,#059669,#047857)" : "linear-gradient(135deg,#7C3AED,#6D28D9)",
            color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "inherit", transition: "all 0.2s", whiteSpace: "nowrap",
          }}>
            {urlSaved ? "✓ Saved" : "Save URL"}
          </button>
        </div>
        {!appUrl && (
          <div style={{ fontSize: 11, color: "#F59E0B", marginTop: 8 }}>⚠️ Enter your URL to generate correct integration code</div>
        )}
      </Card>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: t.input, padding: 4, borderRadius: 12, border: `1px solid ${t.border}` }}>
        {EXPORT_TABS.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{
            flex: 1, padding: "8px 10px", borderRadius: 8, border: "none",
            cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "inherit",
            background: tab === tb.id ? "#7C3AED" : "transparent",
            color: tab === tb.id ? "#fff" : t.sub, transition: "all 0.15s",
          }}>{tb.label}</button>
        ))}
      </div>

      {/* Code Block */}
      <div style={{ background: "#080810", border: `1px solid ${t.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${t.border}` }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["#EF4444", "#F59E0B", "#10B981"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
          </div>
          <button onClick={copy} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
            background: copied ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : t.border}`,
            borderRadius: 7, cursor: "pointer", color: copied ? "#10B981" : "#9CA3AF",
            fontSize: 12, fontFamily: "inherit", transition: "all 0.2s",
          }}>
            <Icon n={copied ? "check" : "copy"} size={13} />
            {copied ? "Copied!" : "Copy Code"}
          </button>
        </div>
        <pre style={{ padding: 20, fontSize: 12, color: "#94A3B8", overflow: "auto", maxHeight: 380, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {content[tab]}
        </pre>
      </div>

      {/* How it works */}
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ padding: 14, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, fontSize: 13, color: "#6EE7B7" }}>
          <strong>✅ How it works:</strong><br/>
          User pastes 2 lines of code. Your server handles everything — AI calls, bot config, widget UI. Their website just loads the widget.
        </div>
        <div style={{ padding: 14, background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 10, fontSize: 13, color: "#A78BFA" }}>
          <strong>🚀 Next step:</strong><br/>
          Create <code>public/widget.js</code> in your project — this is the floating chat bubble that appears on client websites.
        </div>
      </div>
    </div>
  );
}

// ─── Settings helpers ────────────────────────────────────────────────────────
function SettingsSection({ title, children, t }) {
  return (
    <Card style={{ padding: 24, marginBottom: 18 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 18, paddingBottom: 12, borderBottom: `1px solid ${t.border}` }}>{title}</h3>
      {children}
    </Card>
  );
}

function SettingsRow({ label, sub, children, t }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: t.text }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: t.sub, marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

// ─── Settings ────────────────────────────────────────────────────────────────
function Settings({ notify }) {
  const { t, mode, toggleTheme } = useTheme();
  const [accentColor, setAccentColor] = useState("#7C3AED");
  const [chatBubble,  setChatBubble]  = useState("rounded");
  const [fontSize,    setFontSize]    = useState("medium");
  const [sidebarCompact, setSidebarCompact] = useState(false);
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    setAccentColor(LS.get("bf_accent", "#7C3AED"));
    setChatBubble(LS.get("bf_bubble", "rounded"));
    setFontSize(LS.get("bf_fontsize", "medium"));
    setSidebarCompact(LS.get("bf_compact", false));
    setCompanyName(LS.get("bf_company_name", ""));
  }, []);

  const save = () => {
    LS.set("bf_accent",   accentColor);
    LS.set("bf_bubble",   chatBubble);
    LS.set("bf_fontsize", fontSize);
    LS.set("bf_compact",  sidebarCompact);
    LS.set("bf_company_name", companyName);
    notify("Settings saved! ✓");
  };

  return (
    <div className="fade-up" style={{ maxWidth: 640 }}>
      <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, color: t.text, marginBottom: 6 }}>Settings</h1>
      <p style={{ color: t.sub, fontSize: 14, marginBottom: 28 }}>Customize your BotForge experience</p>

      <SettingsSection title="🔑 API Configuration" t={t}>
        <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 10, padding: "14px 16px", fontSize: 13, color: "#6EE7B7", lineHeight: 1.7, marginBottom: 16 }}>
          <strong>✓ API keys are configured via environment variables</strong><br />
          Add your keys to <code style={{ background: "rgba(255,255,255,0.1)", padding: "1px 5px", borderRadius: 4 }}>.env.local</code> — they are never exposed to the browser.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "ZEN_API_KEY", desc: "opencode.ai/auth", color: "#7C3AED" },
            { label: "ANTHROPIC_API_KEY", desc: "console.anthropic.com (optional)", color: "#06B6D4" },
          ].map(k => (
            <div key={k.label} style={{ background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: k.color, marginBottom: 3, fontFamily: "monospace" }}>{k.label}</div>
              <div style={{ fontSize: 11, color: t.sub }}>{k.desc}</div>
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="🎨 Appearance" t={t}>
        <SettingsRow label="Theme" sub="Switch between dark and light mode" t={t}>
          <div onClick={toggleTheme} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "8px 16px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.input, fontSize: 13, fontWeight: 500, color: t.text }}>
            <Icon n={mode === "dark" ? "sun" : "moon"} size={15} />
            {mode === "dark" ? "Switch to Light" : "Switch to Dark"}
          </div>
        </SettingsRow>
        <SettingsRow label="Accent Color" sub="Primary color used throughout the app" t={t}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {["#7C3AED", "#2563EB", "#059669", "#DB2777", "#D97706", "#0891B2"].map(c => (
              <div key={c} onClick={() => setAccentColor(c)} style={{ width: 26, height: 26, borderRadius: "50%", background: c, cursor: "pointer", border: accentColor === c ? `3px solid ${t.text}` : "3px solid transparent", transition: "all 0.15s" }} />
            ))}
          </div>
        </SettingsRow>
        <SettingsRow label="Font Size" sub="Chat preview text size" t={t}>
          <div style={{ display: "flex", gap: 6 }}>
            {["small", "medium", "large"].map(s => (
              <button key={s} onClick={() => setFontSize(s)} style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${fontSize === s ? "#7C3AED" : t.border}`, background: fontSize === s ? "rgba(124,58,237,0.15)" : t.input, color: fontSize === s ? "#A78BFA" : t.sub, cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 500, textTransform: "capitalize" }}>{s}</button>
            ))}
          </div>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="💬 Chat Widget Defaults" t={t}>
        <SettingsRow label="Bubble Style" sub="Shape of chat message bubbles" t={t}>
          <div style={{ display: "flex", gap: 6 }}>
            {["rounded", "square", "pill"].map(s => (
              <button key={s} onClick={() => setChatBubble(s)} style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${chatBubble === s ? "#7C3AED" : t.border}`, background: chatBubble === s ? "rgba(124,58,237,0.15)" : t.input, color: chatBubble === s ? "#A78BFA" : t.sub, cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 500, textTransform: "capitalize" }}>{s}</button>
            ))}
          </div>
        </SettingsRow>
        <SettingsRow label="Compact Sidebar" sub="Reduce sidebar width for more content space" t={t}>
          <div onClick={() => setSidebarCompact(!sidebarCompact)} style={{ width: 44, height: 24, borderRadius: 12, cursor: "pointer", transition: "all 0.2s", background: sidebarCompact ? "#7C3AED" : t.border, position: "relative" }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, transition: "all 0.2s", left: sidebarCompact ? 22 : 3 }} />
          </div>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="🏷️ Branding" t={t}>
        <SettingsRow label="Company Name" sub="Shown as 'Powered by …' in your chatbot widget" t={t}>
          <input value={companyName} onChange={e => setCompanyName(e.target.value)}
            placeholder="Your Company Name"
            style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${t.border}`,
              background: t.input, color: t.text, fontSize: 13, outline: "none", fontFamily: "inherit", width: 220 }} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="ℹ️ About BotForge" t={t}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[["Version", "1.0.0"], ["Framework", "Next.js"], ["AI Provider", "OpenCode Zen"]].map(([k, v]) => (
            <div key={k} style={{ background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: t.sub, marginBottom: 3 }}>{k}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{v}</div>
            </div>
          ))}
        </div>
      </SettingsSection>

      <Btn variant="success" full size="lg" onClick={save}>✓ Save Settings</Btn>
    </div>
  );
}

// ─── Root Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [page,         setPage]        = useState("dashboard");
  const [bots,         setBots]        = useState([]);
  const [editingBot,   setEditingBot]  = useState(null);
  const [previewBotId, setPreviewBotId] = useState(null);
  const [exportBotId,  setExportBotId]  = useState(null);
  const [toast,        setToast]       = useState(null);
  const [loading,      setLoading]     = useState(true);
  const { t } = useTheme();

  useEffect(() => {
    api("/api/bots")
      .then(setBots)
      .catch(() => {}) // silently fail on first load
      .finally(() => setLoading(false));
  }, []);

  const previewBot = bots.find(b => b.id === previewBotId) || null;
  const exportBot  = bots.find(b => b.id === exportBotId)  || null;

  const notify   = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const deleteBot = async id => {
    try {
      await api(`/api/bots/${id}`, { method: "DELETE" });
      setBots(p => p.filter(b => b.id !== id));
      notify("Chatbot deleted", "error");
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const openBuilder = (bot = null) => { setEditingBot(bot); setPage("builder"); };

  const saveBot = async bot => {
    try {
      const full = { ...bot, systemPrompt: buildSystemPrompt(bot) };
      const exists = bots.find(b => b.id === bot.id);
      if (exists) {
        const updated = await api(`/api/bots/${bot.id}`, {
          method: "PUT", body: JSON.stringify(full),
        });
        setBots(p => p.map(b => b.id === bot.id ? updated : b));
      } else {
        const created = await api("/api/bots", {
          method: "POST", body: JSON.stringify(full),
        });
        setBots(p => [...p, created]);
      }
      notify("Chatbot saved! ✓");
      setPage("dashboard");
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const goPreview = bot => { setPreviewBotId(bot.id); setPage("preview"); };
  const goExport  = bot => { setExportBotId(bot.id);  setPage("export");  };
  const navTo     = p   => { setPage(p); if (p === "builder") setEditingBot(null); };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: t.bg }}>
      <Toast toast={toast} />
      <Sidebar page={page} setPage={navTo} botsCount={bots.length} />
      <main style={{ flex: 1, overflowY: "auto", padding: 36 }}>
        {page === "dashboard" && (
          <Dashboard bots={bots} loading={loading} openBuilder={openBuilder} deleteBot={deleteBot} goPreview={goPreview} goExport={goExport} />
        )}
        {page === "builder" && (
          <Builder bot={editingBot} onSave={saveBot} onCancel={() => setPage("dashboard")} notify={notify} />
        )}
        {page === "preview" && previewBot && (
          <Preview bot={previewBot} onBack={() => setPage("dashboard")} />
        )}
        {page === "preview" && !previewBot && (
          <div style={{ color: t.sub, padding: 40 }}>
            Bot not found. <span style={{ color: "#7C3AED", cursor: "pointer" }} onClick={() => setPage("dashboard")}>Go back</span>
          </div>
        )}
        {page === "export" && exportBot && (
          <Export bot={exportBot} onBack={() => setPage("dashboard")} notify={notify} />
        )}
        {page === "settings" && <Settings notify={notify} />}
      </main>
    </div>
  );
}
