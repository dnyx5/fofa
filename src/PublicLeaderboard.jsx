import React, { useEffect, useState } from "react";

// ============================================================================
// FOFA PUBLIC LEADERBOARD
// Public-facing leaderboard at /#leaders
// ============================================================================

const COLORS = {
  bg: "#080C08",
  bgSoft: "#0E140E",
  bgCard: "#0A1109",
  green: "#1AFF6E",
  greenDeep: "#0D8F3C",
  greenGlow: "rgba(26, 255, 110, 0.15)",
  body: "#C8D4C0",
  gold: "#C8A84B",
  teal: "#1AC8C8",
  red: "#FF4757",
  purple: "#9C88FF",
  hairline: "rgba(200, 212, 192, 0.08)",
  hairlineStrong: "rgba(200, 212, 192, 0.15)",
};

const API_URL = import.meta.env.VITE_API_URL || "https://fofa-xi.vercel.app/api";

export default function PublicLeaderboard() {
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, top10, by-club

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const [statsRes, leadersRes] = await Promise.all([
        fetch(`${API_URL}/stats`),
        fetch(`${API_URL}/leaderboard?limit=50`),
      ]);
      const statsData = await statsRes.json();
      const leadersData = await leadersRes.json();
      setStats(statsData);
      setLeaderboard(leadersData.leaderboard || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function getMedal(rank) {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  }

  function getLevelColor(level) {
    const map = {
      legend: COLORS.red,
      master: COLORS.purple,
      veteran: COLORS.gold,
      devotee: COLORS.teal,
      supporter: COLORS.green,
      apprentice: COLORS.body,
    };
    return map[level] || COLORS.body;
  }

  return (
    <div style={{
      background: COLORS.bg,
      color: COLORS.body,
      fontFamily: "'Crimson Pro', Georgia, serif",
      minHeight: "100vh",
      position: "relative",
    }}>
      <GlobalStyles />

      {/* Ambient background */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `radial-gradient(circle at 20% 30%, ${COLORS.greenGlow} 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(26, 200, 200, 0.05) 0%, transparent 50%)`,
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <div style={{ position: "relative", zIndex: 1, padding: "0 20px 80px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          
          {/* Hero */}
          <Hero stats={stats} />

          {/* Stats Bar */}
          {stats && <StatsBar stats={stats} />}

          {/* Top 3 Podium */}
          {!loading && leaderboard.length >= 3 && <Podium leaderboard={leaderboard} getLevelColor={getLevelColor} />}

          {/* Leaderboard List */}
          <div style={{ marginTop: 32 }}>
            <SectionHeader title="Full Rankings" subtitle={`Top ${leaderboard.length} fans worldwide`} />
            
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[1,2,3,4,5,6,7,8,9,10].map(i => <Skeleton key={i} height={64} />)}
              </div>
            ) : leaderboard.length === 0 ? (
              <EmptyLeaderboard />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {leaderboard.map((entry, i) => (
                  <LeaderRow
                    key={entry.username}
                    entry={entry}
                    index={i}
                    getMedal={getMedal}
                    getLevelColor={getLevelColor}
                  />
                ))}
              </div>
            )}
          </div>

          {/* CTA Section */}
          <CTASection totalUsers={stats?.total_users || 0} />

          {/* Prize Section */}
          <PrizeSection />

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

function Header() {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px 24px",
      borderBottom: `1px solid ${COLORS.hairline}`,
      position: "relative",
      zIndex: 10,
      backdropFilter: "blur(10px)",
    }}>
      <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          fontSize: 24,
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900,
          color: COLORS.green,
          letterSpacing: "0.05em",
        }}>
          FOFA
        </div>
        <div style={{
          fontSize: 10,
          fontFamily: "'DM Mono', monospace",
          color: COLORS.body,
          opacity: 0.5,
          letterSpacing: "0.15em",
          borderLeft: `1px solid ${COLORS.hairline}`,
          paddingLeft: 12,
        }}>
          LEADERBOARD
        </div>
      </a>
      <a href="/#portal" style={{
        background: COLORS.green,
        color: COLORS.bg,
        padding: "10px 20px",
        textDecoration: "none",
        fontFamily: "'DM Mono', monospace",
        fontSize: 11,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontWeight: 700,
        borderRadius: 4,
        transition: "all 0.2s",
      }}
        onMouseEnter={(e) => {
          e.target.style.background = "#2dff82";
          e.target.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.target.style.background = COLORS.green;
          e.target.style.transform = "translateY(0)";
        }}
      >
        Join FOFA →
      </a>
    </div>
  );
}

function Hero({ stats }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 0 32px", opacity: 0, animation: "slideInUp 0.6s ease-out forwards" }}>
      <div style={{
        fontSize: 11,
        fontFamily: "'DM Mono', monospace",
        color: COLORS.gold,
        letterSpacing: "0.25em",
        marginBottom: 16,
      }}>
        — LIVE RANKINGS
      </div>
      <h1 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: "clamp(40px, 9vw, 84px)",
        fontWeight: 900,
        color: "#F2F5EE",
        margin: "0 0 16px",
        letterSpacing: "-0.02em",
        lineHeight: 0.95,
      }}>
        The Most<br/>
        <span style={{ color: COLORS.green }}>Loyal Fans</span>
      </h1>
      <p style={{
        color: COLORS.body,
        fontSize: "clamp(15px, 2.5vw, 18px)",
        opacity: 0.8,
        margin: "0 auto 16px",
        maxWidth: 540,
        lineHeight: 1.6,
      }}>
        Real fans, ranked by their loyalty. The most engaged supporter wins<br/>the Ultimate Football Experience.
      </p>
      {stats && stats.total_users > 0 && (
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 16px",
          background: COLORS.greenGlow,
          border: `1px solid ${COLORS.green}`,
          borderRadius: 100,
          fontSize: 13,
          fontFamily: "'DM Mono', monospace",
          color: COLORS.green,
          letterSpacing: "0.05em",
        }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: COLORS.green,
            animation: "pulse 1.5s ease-in-out infinite",
          }} />
          {stats.signups_today > 0 ? `${stats.signups_today} new fans today` : "Live"}
        </div>
      )}
    </div>
  );
}

function StatsBar({ stats }) {
  const items = [
    { label: "Total Fans", value: stats.total_users.toLocaleString() },
    { label: "Activities Logged", value: stats.total_activities.toLocaleString() },
    { label: "Clubs Represented", value: stats.clubs_represented || 0 },
    { label: "Active Today", value: stats.activities_today.toLocaleString() },
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 12,
      marginTop: 32,
      marginBottom: 40,
    }} className="stats-grid">
      <style>{`
        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            background: COLORS.bgSoft,
            border: `1px solid ${COLORS.hairline}`,
            borderRadius: 4,
            padding: 16,
            textAlign: "center",
            opacity: 0,
            animation: `fadeIn 0.4s ease-out ${i * 0.1}s forwards`,
          }}
        >
          <div style={{
            fontSize: "clamp(20px, 5vw, 32px)",
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            color: "#F2F5EE",
            lineHeight: 1,
            marginBottom: 6,
          }}>
            {item.value}
          </div>
          <div style={{
            fontSize: 10,
            fontFamily: "'DM Mono', monospace",
            color: COLORS.body,
            opacity: 0.6,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function Podium({ leaderboard, getLevelColor }) {
  const top3 = leaderboard.slice(0, 3);
  if (top3.length < 3) return null;

  const podiumOrder = [top3[1], top3[0], top3[2]]; // 2nd, 1st, 3rd
  const heights = [180, 220, 160];
  const medals = ["🥈", "🥇", "🥉"];
  const colors = ["#C0C0C0", COLORS.gold, "#CD7F32"];

  return (
    <div style={{ marginTop: 32, marginBottom: 48 }}>
      <SectionHeader title="🏆 Top 3 Champions" subtitle="The current leaders" />
      
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 12,
        alignItems: "end",
        maxWidth: 700,
        margin: "0 auto",
        padding: "0 8px",
      }}>
        {podiumOrder.map((entry, i) => {
          const initials = entry.display_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
          return (
            <div
              key={entry.username}
              style={{
                background: `linear-gradient(180deg, ${COLORS.bgCard} 0%, ${COLORS.bgSoft} 100%)`,
                border: `1px solid ${colors[i]}`,
                borderRadius: 4,
                padding: 16,
                textAlign: "center",
                height: heights[i],
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                position: "relative",
                opacity: 0,
                animation: `slideInUp 0.5s ease-out ${i * 0.15}s forwards`,
                boxShadow: i === 1 ? `0 0 40px ${COLORS.gold}40` : "none",
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 8 }}>{medals[i]}</div>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: colors[i] + "20",
                border: `2px solid ${colors[i]}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                color: colors[i],
                margin: "0 auto 12px",
              }}>
                {initials}
              </div>
              <div style={{
                fontSize: 14,
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                color: "#F2F5EE",
                marginBottom: 4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {entry.display_name}
              </div>
              <div style={{
                fontSize: 9,
                fontFamily: "'DM Mono', monospace",
                color: getLevelColor(entry.level),
                opacity: 0.9,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}>
                {entry.level}
              </div>
              <div style={{
                fontSize: "clamp(18px, 4vw, 24px)",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                color: colors[i],
                lineHeight: 1,
              }}>
                {Math.round(entry.total_score).toLocaleString()}
              </div>
              <div style={{
                fontSize: 9,
                fontFamily: "'DM Mono', monospace",
                color: COLORS.body,
                opacity: 0.5,
                letterSpacing: "0.15em",
                marginTop: 4,
              }}>
                POINTS
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeaderRow({ entry, index, getMedal, getLevelColor }) {
  const medal = getMedal(entry.rank);
  const isTop3 = entry.rank <= 3;
  const initials = entry.display_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "14px 16px",
        background: isTop3 ? COLORS.bgCard : COLORS.bgSoft,
        borderRadius: 4,
        border: `1px solid ${isTop3 ? COLORS.gold + "30" : COLORS.hairline}`,
        transition: "all 0.2s",
        opacity: 0,
        animation: `fadeIn 0.3s ease-out ${Math.min(index * 0.02, 0.6)}s forwards`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = COLORS.green;
        e.currentTarget.style.background = COLORS.bgCard;
        e.currentTarget.style.transform = "translateX(4px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = isTop3 ? COLORS.gold + "30" : COLORS.hairline;
        e.currentTarget.style.background = isTop3 ? COLORS.bgCard : COLORS.bgSoft;
        e.currentTarget.style.transform = "translateX(0)";
      }}
    >
      <div style={{
        minWidth: 44,
        textAlign: "center",
        fontSize: medal ? 22 : 16,
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 900,
        color: isTop3 ? COLORS.gold : COLORS.body,
        opacity: isTop3 ? 1 : 0.7,
      }}>
        {medal || `#${entry.rank}`}
      </div>

      <div style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: COLORS.bg,
        border: `1px solid ${COLORS.hairline}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 900,
        color: COLORS.body,
        flexShrink: 0,
      }}>
        {initials}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15,
          color: "#F2F5EE",
          fontWeight: 500,
          marginBottom: 2,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {entry.display_name}
        </div>
        <div style={{
          fontSize: 11,
          fontFamily: "'DM Mono', monospace",
          color: getLevelColor(entry.level),
          opacity: 0.85,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {entry.level}
          {entry.favorite_club && (
            <span style={{ color: COLORS.body, opacity: 0.5 }}> · {entry.favorite_club}</span>
          )}
        </div>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{
          fontSize: 18,
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900,
          color: isTop3 ? COLORS.gold : "#F2F5EE",
        }}>
          {Math.round(entry.total_score).toLocaleString()}
        </div>
        <div style={{
          fontSize: 9,
          fontFamily: "'DM Mono', monospace",
          color: COLORS.body,
          opacity: 0.5,
          letterSpacing: "0.15em",
        }}>
          PTS
        </div>
      </div>
    </div>
  );
}

function CTASection({ totalUsers }) {
  return (
    <div style={{
      marginTop: 48,
      padding: "48px 24px",
      background: `linear-gradient(135deg, ${COLORS.bgCard} 0%, ${COLORS.bgSoft} 100%)`,
      border: `1px solid ${COLORS.green}`,
      borderRadius: 8,
      textAlign: "center",
      boxShadow: `0 0 60px ${COLORS.greenGlow}`,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        fontSize: 11,
        fontFamily: "'DM Mono', monospace",
        color: COLORS.gold,
        letterSpacing: "0.25em",
        marginBottom: 16,
      }}>
        — JOIN THE COMPETITION
      </div>
      <h2 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: "clamp(28px, 6vw, 48px)",
        fontWeight: 900,
        color: "#F2F5EE",
        margin: "0 0 16px",
        letterSpacing: "-0.02em",
        lineHeight: 1.05,
      }}>
        Think you're a<br/>
        <span style={{ color: COLORS.green }}>true fan?</span>
      </h2>
      <p style={{
        color: COLORS.body,
        opacity: 0.8,
        fontSize: "clamp(15px, 2.5vw, 17px)",
        maxWidth: 480,
        margin: "0 auto 32px",
        lineHeight: 1.6,
      }}>
        Join {totalUsers > 0 ? `${totalUsers} fans` : "the community"} competing for the Ultimate Football Experience. Free to join. Always.
      </p>
      <a href="/#portal" style={{
        display: "inline-block",
        background: COLORS.green,
        color: COLORS.bg,
        padding: "16px 36px",
        textDecoration: "none",
        fontFamily: "'DM Mono', monospace",
        fontSize: 13,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontWeight: 700,
        borderRadius: 4,
        transition: "all 0.2s",
      }}
        onMouseEnter={(e) => {
          e.target.style.background = "#2dff82";
          e.target.style.transform = "translateY(-2px)";
          e.target.style.boxShadow = `0 8px 24px ${COLORS.greenGlow}`;
        }}
        onMouseLeave={(e) => {
          e.target.style.background = COLORS.green;
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = "none";
        }}
      >
        Create Your Passport →
      </a>
    </div>
  );
}

function PrizeSection() {
  return (
    <div style={{ marginTop: 48 }}>
      <SectionHeader title="🏆 Campaign Prizes" subtitle="What the most loyal fans win" />
      
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 16,
      }}>
        {[
          {
            medal: "🥇",
            title: "Grand Prize",
            description: "424pass tournament hospitality package — flights, VIP access, signed memorabilia.",
            color: COLORS.gold,
          },
          {
            medal: "🥈",
            title: "Partner Club VIP",
            description: "Weekend at a partner club — match day hospitality, locker room tour, meet the team.",
            color: "#C0C0C0",
          },
          {
            medal: "🥉",
            title: "Memorabilia Bundle",
            description: "Curated signed items from partner clubs and limited-edition FOFA Founder badge.",
            color: "#CD7F32",
          },
        ].map((prize, i) => (
          <div
            key={i}
            style={{
              background: COLORS.bgSoft,
              border: `1px solid ${prize.color}40`,
              borderRadius: 4,
              padding: 24,
              textAlign: "center",
              transition: "all 0.3s",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = prize.color;
              e.currentTarget.style.transform = "translateY(-4px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = prize.color + "40";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>{prize.medal}</div>
            <h3 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              color: prize.color,
              margin: "0 0 12px",
              letterSpacing: "0.02em",
            }}>
              {prize.title}
            </h3>
            <p style={{
              color: COLORS.body,
              opacity: 0.75,
              fontSize: 14,
              lineHeight: 1.6,
              margin: 0,
            }}>
              {prize.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div style={{
      marginTop: 80,
      paddingTop: 32,
      borderTop: `1px solid ${COLORS.hairline}`,
      textAlign: "center",
    }}>
      <div style={{
        fontSize: 24,
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 900,
        color: COLORS.green,
        letterSpacing: "0.05em",
        marginBottom: 8,
      }}>
        FOFA
      </div>
      <p style={{
        color: COLORS.body,
        opacity: 0.5,
        fontSize: 12,
        margin: "0 0 16px",
        fontStyle: "italic",
      }}>
        Football Open For All. The game belongs to everyone who has ever loved it.
      </p>
      <div style={{
        display: "flex",
        gap: 16,
        justifyContent: "center",
        fontSize: 11,
        fontFamily: "'DM Mono', monospace",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}>
        <a href="/" style={{ color: COLORS.body, opacity: 0.6, textDecoration: "none" }}>Home</a>
        <a href="/#portal" style={{ color: COLORS.body, opacity: 0.6, textDecoration: "none" }}>Portal</a>
        <a href="/#leaders" style={{ color: COLORS.green, opacity: 1, textDecoration: "none" }}>Leaderboard</a>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: "clamp(24px, 5vw, 32px)",
        fontWeight: 900,
        color: "#F2F5EE",
        margin: "0 0 4px",
        letterSpacing: "-0.01em",
      }}>
        {title}
      </h2>
      <p style={{
        color: COLORS.body,
        opacity: 0.6,
        margin: 0,
        fontSize: 14,
      }}>
        {subtitle}
      </p>
    </div>
  );
}

function EmptyLeaderboard() {
  return (
    <div style={{
      textAlign: "center",
      padding: "80px 20px",
      background: COLORS.bgSoft,
      border: `1px solid ${COLORS.hairline}`,
      borderRadius: 4,
    }}>
      <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.4 }}>🏆</div>
      <h3 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 22,
        color: "#F2F5EE",
        margin: "0 0 8px",
      }}>
        Be the first
      </h3>
      <p style={{
        color: COLORS.body,
        opacity: 0.6,
        margin: "0 0 24px",
        fontSize: 14,
      }}>
        No fans have registered yet. Sign up and claim #1 forever.
      </p>
      <a href="/#portal" style={{
        display: "inline-block",
        background: COLORS.green,
        color: COLORS.bg,
        padding: "12px 28px",
        textDecoration: "none",
        fontFamily: "'DM Mono', monospace",
        fontSize: 12,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontWeight: 700,
        borderRadius: 4,
      }}>
        Join Now →
      </a>
    </div>
  );
}

function Skeleton({ width = "100%", height = 20, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, ...style }}
    />
  );
}

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,500;1,400&family=DM+Mono:wght@400;500&display=swap');
      
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes slideInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      @keyframes shimmer {
        0% { background-position: -1000px 0; }
        100% { background-position: 1000px 0; }
      }
      
      .skeleton {
        background: linear-gradient(90deg, ${COLORS.bgSoft} 0%, ${COLORS.bgCard} 50%, ${COLORS.bgSoft} 100%);
        background-size: 1000px 100%;
        animation: shimmer 2s infinite linear;
        border-radius: 4px;
      }
      
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: ${COLORS.bg}; }
      ::-webkit-scrollbar-thumb { background: ${COLORS.hairlineStrong}; border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: ${COLORS.green}; }
    `}</style>
  );
}
