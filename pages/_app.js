import { createContext, useContext, useState, useEffect } from "react";
import { LS } from "../lib/storage";
import { THEMES } from "../lib/constants";

export const ThemeCtx = createContext({});
export const useTheme = () => useContext(ThemeCtx);

export default function MyApp({ Component, pageProps }) {
  const [mode, setMode] = useState("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = LS.get("bf_theme", "dark");
    setMode(saved);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
    LS.set("bf_theme", next);
  };

  // Always use dark theme on server to avoid mismatch
  const t = THEMES[mounted ? mode : "dark"];

  return (
    <ThemeCtx.Provider value={{ mode: mounted ? mode : "dark", toggleTheme, t }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: ${t.bg};
          color: ${t.text};
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
          transition: background 0.2s, color 0.2s;
        }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${mode === "dark" ? "#2D2D44" : "#CBD5E1"}; border-radius: 10px; }
        textarea, input, select, button { font-family: inherit; }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn  { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes bounce   { 0%,80%,100%{transform:scale(.6);opacity:.5} 40%{transform:scale(1);opacity:1} }
        .fade-up { animation: fadeUp 0.3s ease; }
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');
      `}</style>
      <Component {...pageProps} />
    </ThemeCtx.Provider>
  );
}
