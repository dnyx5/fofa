import React, { useEffect, useState } from "react";

// ============================================================================
// FOFA PUBLIC FAN PROFILE — viewable by anyone at #fans/:username
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

const levelColors = {
  legend: "#FF4757",
  master: "#9C88FF",
  veteran: COLORS.gold,
  devotee: COLORS.teal,
  supporter: COLORS.green,
  apprentice: COLORS.body,
};

export default function FanProfile() {
  const [fan, setFan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/^#fans\/([a-z0-9_-]+)$/);
    if (match) {
      fetchFan(match[1]);
    } else {
      setError("Invalid profile URL");
      setLoading(false);
    }
  }, []);

  async function fetchFan(username) {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/fans/${username}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Not found");
      }
      const data = await res.json();
      setFan(data.fan);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ background: COLORS.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Styles />
        <div style={{ fontSize: 48, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, color: COLORS.green, animation: "pulse 2s ease-in-out infinite" }}>FOFA</div>
      </div>
    );
  }

  if (error || !fan) {
    return (
      <div style={{ background: COLORS.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 24, padding: 40 }}>
        <Styles />
        <div style={{ fontSize: 48 }}>🔍</div>
        <div style={{ color: "#F2F5EE", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900 }}>Fan Not Found</div>
        <p style={{ color: COLORS.body, opacity: 0.7 }}>{error || "This profile doesn't exist."}</p>
        <a href="#" style={{ color: COLORS.green, fontFamily: "'DM Mono', monospace", fontSize: 12 }}>← BACK TO FOFA</a>
      </div>
    );
  }

  const initials = fan.display_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{ background: COLORS.bg, color: COLORS.body, fontFamily: "'Crimson Pro', Georgia, serif", minHeight: "100vh" }}>
      <Styles />
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(circle at 30% 20%, ${COLORS.greenGlow} 0%, transparent 50%)`, pointerEvents: "none" }} />

      {/* Header */}
      <header style={{ position: "relative", zIndex: 1, padding: "20px 32px", borderBottom: `1px solid ${COLORS.hairline}` }}>
        <a href="#" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 24, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, color: COLORS.green, letterSpacing: "0.05em" }}>FOFA</span>
        </a>
      </header>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "40px 20px 80px" }}>
        {/* Back link */}
        <a href="#leaders" style={{ display: "inline-block", marginBottom: 24, color: COLORS.body, opacity: 0.7, fontSize: 12, fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", textDecoration: "none" }}>
          ← Back to leaderboard
        </a>

        {/* Profile card */}
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.bgCard} 0%, ${COLORS.bgSoft} 100%)`,
          border: `1px solid ${COLORS.green}`,
          boxShadow: `0 0 60px ${COLORS.greenGlow}`,
          borderRadius: 8, overflow: "hidden", marginBottom: 32,
        }}>
          {/* Header strip */}
          <div style={{ padding: "24px 32px", borderBottom: `1px solid ${COLORS.green}30`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: 20, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, color: COLORS.green, letterSpacing: "0.1em" }}>FAN PROFILE</div>
              <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.6, letterSpacing: "0.2em", marginTop: 4 }}>@{fan.username}</div>
            </div>
            <div style={{
              width: 56, height: 56, borderRadius: "50%", background: COLORS.greenGlow, border: `2px solid ${COLORS.green}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, color: COLORS.green,
            }}>
              {initials}
            </div>
          </div>

          {/* Main info */}
          <div style={{ padding: 32 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 32 }} className="grid-responsive">
              <div>
                <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.6, letterSpacing: "0.2em", marginBottom: 6 }}>NAME</div>
                <div style={{ fontSize: 28, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, color: "#F2F5EE" }}>{fan.display_name}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.6, letterSpacing: "0.2em", marginBottom: 6 }}>CLUB ALLEGIANCE</div>
                <div style={{ fontSize: 24, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: COLORS.gold }}>{fan.favorite_club || "—"}</div>
              </div>
            </div>

            {fan.bio && (
              <div style={{ marginBottom: 32, padding: "16px 20px", background: COLORS.bg, border: `1px solid ${COLORS.hairline}`, borderRadius: 4 }}>
                <div style={{ fontSize: 15, lineHeight: 1.7, color: COLORS.body, fontStyle: "italic" }}>{fan.bio}</div>
              </div>
            )}

            {/* Level + Score */}
            <div style={{ display: "flex", gap: 24, marginBottom: 32, flexWrap: "wrap" }}>
              <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.hairline}`, borderRadius: 4, padding: "16px 24px", textAlign: "center", flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", opacity: 0.5, letterSpacing: "0.15em", marginBottom: 6 }}>LEVEL</div>
                <div style={{ fontSize: 24, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, color: levelColors[fan.level] || COLORS.body, textTransform: "uppercase" }}>{fan.level}</div>
              </div>
              <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.hairline}`, borderRadius: 4, padding: "16px 24px", textAlign: "center", flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", opacity: 0.5, letterSpacing: "0.15em", marginBottom: 6 }}>SCORE</div>
                <div style={{ fontSize: 24, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, color: COLORS.green }}>{Math.round(fan.total_score)}</div>
              </div>
              <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.hairline}`, borderRadius: 4, padding: "16px 24px", textAlign: "center", flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", opacity: 0.5, letterSpacing: "0.15em", marginBottom: 6 }}>RANK</div>
                <div style={{ fontSize: 24, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, color: COLORS.gold }}>#{fan.rank}</div>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
              {[
                { label: "ACTIVITIES", value: fan.stats.activity_count },
                { label: "CLUBS", value: fan.stats.following_count },
                { label: "BADGES", value: fan.stats.badge_count },
                { label: "REFERRALS", value: fan.stats.referral_count },
              ].map((s, i) => (
                <div key={i} style={{ background: COLORS.bg, border: `1px solid ${COLORS.hairline}`, borderRadius: 4, padding: "12px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", opacity: 0.5, letterSpacing: "0.15em", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, color: "#F2F5EE" }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: "16px 32px", borderTop: `1px solid ${COLORS.green}30`, background: COLORS.bg, display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.6, letterSpacing: "0.15em" }}>
            <div>MEMBER SINCE {new Date(fan.created_at).toLocaleDateString("en-GB")}</div>
            <div>@{fan.username}</div>
          </div>
        </div>

        {/* Badges */}
        {fan.badges && fan.badges.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.gold, letterSpacing: "0.25em", marginBottom: 16 }}>— BADGES EARNED</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {fan.badges.map((b, i) => (
                <div key={i} style={{
                  background: COLORS.bgCard, border: `1px solid ${COLORS.green}40`, borderRadius: 8, padding: "12px 18px",
                  display: "flex", alignItems: "center", gap: 10, animation: `fadeIn 0.3s ease-out ${i * 0.05}s forwards`, opacity: 0,
                }}>
                  <span style={{ fontSize: 24 }}>{b.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: "#F2F5EE" }}>{b.name}</div>
                    <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.5 }}>{b.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Following clubs */}
        {fan.following_clubs && fan.following_clubs.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.gold, letterSpacing: "0.25em", marginBottom: 16 }}>— FOLLOWING</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {fan.following_clubs.map((c, i) => (
                <a key={i} href={`#clubs/${c.slug}`} style={{
                  background: COLORS.bgCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 6, padding: "10px 16px",
                  display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit", transition: "border-color 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.teal}
                onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.hairline}
                >
                  <span>🏟️</span>
                  <span style={{ fontSize: 14, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: COLORS.teal }}>{c.name}</span>
                  <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.4 }}>{c.country}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Recent activity */}
        {fan.recent_activities && fan.recent_activities.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.gold, letterSpacing: "0.25em", marginBottom: 16 }}>— RECENT ACTIVITY</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {fan.recent_activities.map((a, i) => (
                <div key={i} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 4, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 14, color: "#F2F5EE" }}>{a.description || a.activity_type}</span>
                  </div>
                  <div style={{ display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: COLORS.green }}>+{a.points}</span>
                    <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.4 }}>
                      {new Date(a.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      .grid-responsive { }
      @media (max-width: 600px) { .grid-responsive { grid-template-columns: 1fr !important; } }
    `}</style>
  );
}
