import React, { useEffect, useState } from "react";

// ============================================================================
// FOFA SEARCH — Cross-entity search across clubs, experts, articles, fans
// ============================================================================

const COLORS = {
  bg: "#080C08",
  bgSoft: "#0E140E",
  bgCard: "#0A1109",
  green: "#1AFF6E",
  greenGlow: "rgba(26, 255, 110, 0.15)",
  body: "#C8D4C0",
  gold: "#C8A84B",
  teal: "#1AC8C8",
  red: "#FF4757",
  hairline: "rgba(200, 212, 192, 0.08)",
  hairlineStrong: "rgba(200, 212, 192, 0.15)",
};

const API_URL = import.meta.env.VITE_API_URL || "https://fofa.lol/api";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const debounceRef = React.useRef(null);

  useEffect(() => {
    // Check for ?q= in hash
    const hash = window.location.hash;
    const match = hash.match(/[?&]q=([^&]+)/);
    if (match) {
      const q = decodeURIComponent(match[1]);
      setQuery(q);
      doSearch(q);
    }
  }, []);

  function handleInputChange(value) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length >= 2) {
      debounceRef.current = setTimeout(() => doSearch(value.trim()), 400);
    } else {
      setResults(null);
      setTotal(0);
    }
  }

  async function doSearch(q) {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(q)}&limit=15`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data.results);
      setTotal(data.total);
    } catch (err) {
      setResults({ clubs: [], experts: [], articles: [], fans: [] });
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  const typeIcons = { club: "🏟️", expert: "🛡️", article: "📝", fan: "👤" };
  const typeColors = { club: COLORS.green, expert: COLORS.gold, article: COLORS.teal, fan: COLORS.body };

  return (
    <div style={{ background: COLORS.bg, color: COLORS.body, fontFamily: "'Crimson Pro', Georgia, serif", minHeight: "100vh" }}>
      <Styles />
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(circle at 50% 30%, ${COLORS.greenGlow} 0%, transparent 50%)`, pointerEvents: "none" }} />

      {/* Header */}
      <header style={{ position: "relative", zIndex: 1, padding: "20px 32px", borderBottom: `1px solid ${COLORS.hairline}` }}>
        <a href="#" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 24, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, color: COLORS.green, letterSpacing: "0.05em" }}>FOFA</span>
        </a>
      </header>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 800, margin: "0 auto", padding: "60px 20px 80px" }}>
        {/* Search hero */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.gold, letterSpacing: "0.25em", marginBottom: 12 }}>— SEARCH FOFA</div>
          <h1 style={{ fontSize: "clamp(32px, 6vw, 48px)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, color: "#F2F5EE", margin: "0 0 32px", letterSpacing: "-0.02em" }}>
            Find Clubs, Experts, Articles & Fans
          </h1>
          <div style={{ position: "relative", maxWidth: 600, margin: "0 auto" }}>
            <input
              type="text"
              value={query}
              onChange={e => handleInputChange(e.target.value)}
              placeholder="Search anything on FOFA..."
              autoFocus
              style={{
                width: "100%", padding: "16px 24px 16px 48px", background: COLORS.bgCard,
                border: `1px solid ${COLORS.hairlineStrong}`, borderRadius: 8, color: "#F2F5EE",
                fontFamily: "'Crimson Pro', serif", fontSize: 18, outline: "none", transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = COLORS.green}
              onBlur={e => e.target.style.borderColor = COLORS.hairlineStrong}
            />
            <span style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", fontSize: 18, opacity: 0.4 }}>🔍</span>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: 32 }}>
            <div style={{ fontSize: 14, fontFamily: "'DM Mono', monospace", color: COLORS.green, opacity: 0.6 }}>Searching...</div>
          </div>
        )}

        {/* Results */}
        {!loading && results && (
          <div>
            {total === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 32px" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <div style={{ color: "#F2F5EE", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900 }}>No Results</div>
                <p style={{ color: COLORS.body, opacity: 0.7 }}>Try a different search term.</p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.5, marginBottom: 24 }}>
                  {total} result{total !== 1 ? "s" : ""} for "{query}"
                </div>

                {/* Clubs */}
                {results.clubs.length > 0 && (
                  <ResultSection title="Clubs" icon="🏟️">
                    {results.clubs.map((c, i) => (
                      <a key={i} href={`#clubs/${c.slug}`} style={resultCardStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <span style={{ fontSize: 17, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: "#F2F5EE" }}>{c.name}</span>
                            <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.5, marginLeft: 12 }}>{c.country} · {c.league}</span>
                          </div>
                          <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.green }}>{c.fan_count} fans</span>
                        </div>
                      </a>
                    ))}
                  </ResultSection>
                )}

                {/* Experts */}
                {results.experts.length > 0 && (
                  <ResultSection title="Experts" icon="🛡️">
                    {results.experts.map((e, i) => (
                      <a key={i} href={`#experts/${e.slug}`} style={resultCardStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 17, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: "#F2F5EE" }}>{e.name}</span>
                          <div style={{ display: "flex", gap: 12 }}>
                            <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: COLORS.gold, textTransform: "capitalize" }}>{e.tier}</span>
                            <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: COLORS.teal, textTransform: "capitalize" }}>{e.expert_type}</span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </ResultSection>
                )}

                {/* Articles */}
                {results.articles.length > 0 && (
                  <ResultSection title="Articles" icon="📝">
                    {results.articles.map((a, i) => (
                      <div key={i} style={resultCardStyle}>
                        <div style={{ fontSize: 17, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: "#F2F5EE", marginBottom: 4 }}>{a.title}</div>
                        {a.summary && <div style={{ fontSize: 13, color: COLORS.body, opacity: 0.6, marginBottom: 6 }}>{a.summary.slice(0, 120)}{a.summary.length > 120 ? "…" : ""}</div>}
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          {a.expert && <a href={`#experts/${a.expert.slug}`} style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.teal, textDecoration: "none" }}>by {a.expert.name}</a>}
                          <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.4 }}>{a.views} views</span>
                          {a.tags && a.tags.slice(0, 3).map((t, ti) => (
                            <span key={ti} style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: COLORS.teal, background: COLORS.teal + "15", padding: "2px 8px", borderRadius: 3 }}>{t}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </ResultSection>
                )}

                {/* Fans */}
                {results.fans.length > 0 && (
                  <ResultSection title="Fans" icon="👤">
                    {results.fans.map((f, i) => (
                      <a key={i} href={`#fans/${f.username}`} style={resultCardStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <span style={{ fontSize: 17, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: "#F2F5EE" }}>{f.display_name}</span>
                            <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.4, marginLeft: 10 }}>@{f.username}</span>
                          </div>
                          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: levelColors[f.level] || COLORS.body, textTransform: "capitalize" }}>{f.level}</span>
                            <span style={{ fontSize: 12, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: COLORS.green }}>{Math.round(f.total_score)} pts</span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </ResultSection>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const levelColors = { legend: "#FF4757", master: "#9C88FF", veteran: "#C8A84B", devotee: "#1AC8C8", supporter: "#1AFF6E", apprentice: "#C8D4C0" };

const resultCardStyle = {
  display: "block", padding: "14px 20px", background: COLORS.bgCard, border: `1px solid ${COLORS.hairline}`,
  borderRadius: 6, textDecoration: "none", color: "inherit", transition: "border-color 0.2s", cursor: "pointer",
};

function ResultSection({ title, icon, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.gold, letterSpacing: "0.2em", marginBottom: 12 }}>
        {icon} {title.toUpperCase()}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {children}
      </div>
    </div>
  );
}

function Styles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,500;1,400&family=DM+Mono:wght@400;500&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    `}</style>
  );
}
