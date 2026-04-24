import React, { useEffect, useRef, useState } from "react";

// ============================================================================
// PERSONAL PORTAL — with DID Passport & On-Chain Interaction Stamps
// ============================================================================

const COLORS = {
  bg: "#080C08",
  bgSoft: "#0E140E",
  green: "#1AFF6E",
  greenDeep: "#0D8F3C",
  body: "#C8D4C0",
  gold: "#C8A84B",
  teal: "#1AC8C8",
  red: "#FF4757",
  hairline: "rgba(200, 212, 192, 0.08)",
};

const API_URL = import.meta.env.VITE_API_URL || "https://fofa-xi.vercel.app/api";

// ============================================================================
// PERSONAL PORTAL (root)
// ============================================================================

export default function PersonalPortal() {
  const [currentView, setCurrentView] = useState("landing");
  const [token, setToken] = useState(localStorage.getItem("fofaToken") || null);
  const [user, setUser] = useState(null);
  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (token) {
      fetchUserProfile();
      setCurrentView("portal");
    } else {
      setCurrentView("landing");
    }
  }, [token]);

  async function fetchUserProfile() {
    try {
      const response = await fetch(`${API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch profile");
      const data = await response.json();
      setUser(data.user);
      setPassport(data.passport || { match_attendance: 0, merch_purchases: 0, social_media: 0, interactions: [] });
    } catch (err) {
      console.error(err);
      setError("Session expired. Please log in again.");
      logout();
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");
    const username = formData.get("username");
    const display_name = formData.get("display_name");
    const favorite_club = formData.get("favorite_club");

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username, display_name, favorite_club }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setToken(data.token);
      localStorage.setItem("fofaToken", data.token);
      setSuccess("Welcome to FOFA! Your DID passport has been created.");
      setCurrentView("portal");
      e.target.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      setToken(data.token);
      localStorage.setItem("fofaToken", data.token);
      setSuccess("Welcome back!");
      setCurrentView("portal");
      e.target.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
    setPassport(null);
    localStorage.removeItem("fofaToken");
    setCurrentView("landing");
  }

  return (
    <div
      style={{
        background: COLORS.bg,
        color: COLORS.body,
        fontFamily: "'Crimson Pro', Georgia, serif",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,500;1,400&family=DM+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }

        input, textarea, select {
          font-family: 'Crimson Pro', Georgia, serif;
          background: ${COLORS.bgSoft};
          border: 1px solid ${COLORS.hairline};
          color: ${COLORS.body};
          padding: 12px 16px;
          border-radius: 4px;
          font-size: 16px;
          transition: all 0.2s;
        }

        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: ${COLORS.green};
          box-shadow: 0 0 0 3px rgba(26, 255, 110, 0.1);
        }

        button {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 12px 24px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }

        .btn-primary {
          background: ${COLORS.green};
          color: ${COLORS.bg};
        }

        .btn-primary:hover:not(:disabled) {
          background: #2cff7f;
          transform: translateY(-2px);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-ghost {
          background: transparent;
          border: 1px solid ${COLORS.green};
          color: ${COLORS.green};
        }

        .btn-ghost:hover {
          background: rgba(26, 255, 110, 0.1);
        }

        .btn-danger {
          background: ${COLORS.red};
          color: white;
        }

        .btn-danger:hover {
          background: #ff6a7f;
        }

        @keyframes stamp-appear {
          0% { transform: scale(0) rotate(-15deg); opacity: 0; }
          60% { transform: scale(1.15) rotate(3deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        .stamp-badge {
          animation: stamp-appear 0.4s cubic-bezier(.2,.7,.2,1) forwards;
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(26, 255, 110, 0.2); }
          50% { box-shadow: 0 0 20px rgba(26, 255, 110, 0.4); }
        }

        .did-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
      `}</style>

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 40,
          paddingBottom: 20,
          borderBottom: `1px solid ${COLORS.hairline}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              fontSize: 24,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              color: COLORS.green,
            }}
          >
            FOFA
          </div>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.2em",
            color: COLORS.gold,
            textTransform: "uppercase",
          }}>
            Passport
          </span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); window.location.hash = ""; }}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: COLORS.body,
              opacity: 0.6,
              textDecoration: "none",
            }}
          >
            Back to Site
          </a>
          {token && (
            <button className="btn-ghost" onClick={logout}>
              Logout
            </button>
          )}
        </div>
      </div>

      {/* ERROR / SUCCESS MESSAGES */}
      {error && (
        <div
          style={{
            background: `${COLORS.red}20`,
            border: `1px solid ${COLORS.red}`,
            color: "#FF9AAD",
            padding: "16px",
            borderRadius: "4px",
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            background: `${COLORS.green}20`,
            border: `1px solid ${COLORS.green}`,
            color: COLORS.green,
            padding: "16px",
            borderRadius: "4px",
            marginBottom: 20,
          }}
        >
          {success}
        </div>
      )}

      {currentView === "landing" && <LandingView setCurrentView={setCurrentView} />}
      {currentView === "login" && (
        <AuthForm type="login" onSubmit={handleLogin} loading={loading} onSwitchView={() => setCurrentView("register")} />
      )}
      {currentView === "register" && (
        <AuthForm type="register" onSubmit={handleRegister} loading={loading} onSwitchView={() => setCurrentView("login")} />
      )}
      {currentView === "portal" && user && (
        <PortalDashboard user={user} passport={passport} token={token} onRefresh={fetchUserProfile} apiUrl={API_URL} />
      )}
    </div>
  );
}

// ============================================================================
// LANDING VIEW
// ============================================================================

function LandingView({ setCurrentView }) {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 80 }}>
        <h1
          style={{
            fontSize: "clamp(42px, 8vw, 96px)",
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            margin: "0 0 24px",
            color: "#F2F5EE",
          }}
        >
          Your Fan Passport
        </h1>
        <p style={{ fontSize: 20, color: COLORS.body, marginBottom: 16, maxWidth: 640, margin: "0 auto 16px" }}>
          A decentralised identity for football fans. Every match you attend, every shirt you buy,
          every moment you share — stamped on-chain, owned by you.
        </p>
        <p style={{
          fontSize: 14,
          fontFamily: "'DM Mono', monospace",
          color: COLORS.teal,
          marginBottom: 48,
        }}>
          Powered by Ethereum DID
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn-primary" onClick={() => setCurrentView("register")}>
            Create Your Passport
          </button>
          <button className="btn-ghost" onClick={() => setCurrentView("login")}>
            Already a member?
          </button>
        </div>
      </div>

      {/* FEATURE CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 24,
          marginTop: 80,
        }}
      >
        {[
          {
            icon: "🏟️",
            title: "Match Attendance",
            description: "Check in at matches and earn stamps that prove you were there. 50 points per match.",
            color: COLORS.green,
          },
          {
            icon: "👕",
            title: "Merch & Gear",
            description: "Every purchase recorded. Build your collection badge. 30 points per purchase.",
            color: COLORS.gold,
          },
          {
            icon: "📱",
            title: "Social Engagement",
            description: "Likes, retweets, comments — your digital support counts. 10 points per action.",
            color: COLORS.teal,
          },
          {
            icon: "🔗",
            title: "On-Chain Identity",
            description: "Your passport lives on Ethereum. Portable, verifiable, truly yours.",
            color: COLORS.green,
          },
        ].map((card, i) => (
          <div
            key={i}
            style={{
              background: COLORS.bgSoft,
              border: `1px solid ${COLORS.hairline}`,
              padding: 28,
              borderRadius: 4,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>{card.icon}</div>
            <h3 style={{ color: card.color, marginBottom: 8, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700 }}>
              {card.title}
            </h3>
            <p style={{ color: COLORS.body, opacity: 0.8, lineHeight: 1.5, fontSize: 15, margin: 0 }}>
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// AUTH FORM
// ============================================================================

function AuthForm({ type, onSubmit, loading, onSwitchView }) {
  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <h2
        style={{
          textAlign: "center",
          marginBottom: 40,
          color: COLORS.green,
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 36,
          fontWeight: 900,
        }}
      >
        {type === "login" ? "Sign In" : "Create Your Passport"}
      </h2>

      {type === "register" && (
        <p style={{ textAlign: "center", marginBottom: 32, fontSize: 14, color: COLORS.teal, fontFamily: "'DM Mono', monospace" }}>
          An Ethereum wallet & DID will be generated for you automatically
        </p>
      )}

      <form onSubmit={onSubmit}>
        {type === "register" && (
          <>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8, fontSize: 14, opacity: 0.8 }}>Display Name</label>
              <input type="text" name="display_name" placeholder="Your name" required style={{ width: "100%" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8, fontSize: 14, opacity: 0.8 }}>Username</label>
              <input type="text" name="username" placeholder="footy_fan" required style={{ width: "100%" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8, fontSize: 14, opacity: 0.8 }}>Favorite Club</label>
              <input type="text" name="favorite_club" placeholder="Manchester United" style={{ width: "100%" }} />
            </div>
          </>
        )}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 14, opacity: 0.8 }}>Email</label>
          <input type="email" name="email" placeholder="you@example.com" required style={{ width: "100%" }} />
        </div>
        <div style={{ marginBottom: 32 }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 14, opacity: 0.8 }}>Password</label>
          <input type="password" name="password" placeholder="••••••••" required style={{ width: "100%" }} />
        </div>
        <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", marginBottom: 16 }}>
          {loading ? "Loading..." : type === "login" ? "Sign In" : "Create Passport"}
        </button>
      </form>
      <div style={{ textAlign: "center" }}>
        <button
          className="btn-ghost"
          onClick={onSwitchView}
          style={{ background: "none", border: "none", color: COLORS.green, cursor: "pointer" }}
        >
          {type === "login" ? "Don't have an account? Register here" : "Already have an account? Sign in here"}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// PORTAL DASHBOARD
// ============================================================================

function PortalDashboard({ user, passport, token, onRefresh, apiUrl }) {
  const [activeTab, setActiveTab] = useState("passport");

  const TAB_LABELS = {
    passport: "Passport",
    record: "Record Activity",
    social: "X Sync",
    history: "History",
    profile: "Profile",
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* TABS */}
      <div style={{ display: "flex", gap: 24, marginBottom: 40, borderBottom: `1px solid ${COLORS.hairline}`, paddingBottom: 16, flexWrap: "wrap" }}>
        {Object.keys(TAB_LABELS).map((tab) => (
          <button
            key={tab}
            className="btn-ghost"
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? `${COLORS.green}20` : "transparent",
              borderColor: activeTab === tab ? COLORS.green : "transparent",
              borderBottom: activeTab === tab ? `2px solid ${COLORS.green}` : "none",
              borderLeft: "none",
              borderRight: "none",
              borderTop: "none",
              textTransform: "none",
            }}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {activeTab === "passport" && <PassportCard user={user} passport={passport} />}
      {activeTab === "record" && <RecordInteraction token={token} onComplete={onRefresh} />}
      {activeTab === "social" && <SocialSync token={token} apiUrl={apiUrl} onComplete={onRefresh} />}
      {activeTab === "history" && <InteractionHistory passport={passport} />}
      {activeTab === "profile" && <ProfileTab user={user} token={token} onUpdate={onRefresh} />}
    </div>
  );
}

// ============================================================================
// PASSPORT CARD — the visual "passport" with DID + stamps
// ============================================================================

function PassportCard({ user, passport }) {
  const badges = passport || { match_attendance: 0, merch_purchases: 0, social_media: 0, interactions: [] };

  return (
    <div>
      {/* PASSPORT VISUAL */}
      <div
        className="did-glow"
        style={{
          maxWidth: 700,
          margin: "0 auto 48px",
          background: `linear-gradient(135deg, ${COLORS.bgSoft} 0%, #101810 50%, ${COLORS.bgSoft} 100%)`,
          border: `2px solid ${COLORS.green}40`,
          borderRadius: 12,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Passport Header */}
        <div
          style={{
            background: `linear-gradient(90deg, ${COLORS.green}15, ${COLORS.green}08)`,
            padding: "24px 32px",
            borderBottom: `1px solid ${COLORS.green}30`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              fontSize: 28,
              color: COLORS.green,
              letterSpacing: "0.05em",
            }}>
              FOFA PASSPORT
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: COLORS.body,
              opacity: 0.6,
              letterSpacing: "0.3em",
              marginTop: 4,
            }}>
              DECENTRALISED FAN IDENTITY
            </div>
          </div>
          <div style={{
            width: 56,
            height: 56,
            border: `2px solid ${COLORS.green}`,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            color: COLORS.green,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
          }}>
            {user.display_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
        </div>

        {/* Passport Body */}
        <div style={{ padding: "32px" }}>
          {/* User Info Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
            <div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: COLORS.body, opacity: 0.5, letterSpacing: "0.2em", marginBottom: 6 }}>
                HOLDER
              </div>
              <div style={{ color: "#F2F5EE", fontSize: 22, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>
                {user.display_name}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: COLORS.body, opacity: 0.5, letterSpacing: "0.2em", marginBottom: 6 }}>
                CLUB ALLEGIANCE
              </div>
              <div style={{ color: COLORS.gold, fontSize: 18, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>
                {user.favorite_club || "Not set"}
              </div>
            </div>
          </div>

          {/* DID */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: COLORS.body, opacity: 0.5, letterSpacing: "0.2em", marginBottom: 6 }}>
              DECENTRALISED IDENTIFIER (DID)
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 13,
              color: COLORS.teal,
              background: `${COLORS.bg}`,
              padding: "10px 14px",
              borderRadius: 4,
              border: `1px solid ${COLORS.hairline}`,
              wordBreak: "break-all",
            }}>
              {user.did || "did:fofa:pending..."}
            </div>
          </div>

          {/* Wallet Address */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: COLORS.body, opacity: 0.5, letterSpacing: "0.2em", marginBottom: 6 }}>
              ETHEREUM WALLET
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              color: COLORS.body,
              opacity: 0.7,
              wordBreak: "break-all",
            }}>
              {user.wallet_address || "0x..."}
            </div>
          </div>

          {/* STAMPS / BADGES */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              color: COLORS.body,
              opacity: 0.5,
              letterSpacing: "0.2em",
              marginBottom: 16,
            }}>
              INTERACTION STAMPS
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              <StampBadge
                icon="🏟️"
                label="Matches"
                count={badges.match_attendance}
                color={COLORS.green}
                points={badges.match_attendance * 50}
              />
              <StampBadge
                icon="👕"
                label="Merch"
                count={badges.merch_purchases}
                color={COLORS.gold}
                points={badges.merch_purchases * 30}
              />
              <StampBadge
                icon="📱"
                label="Social"
                count={badges.social_media}
                color={COLORS.teal}
                points={badges.social_media * 10}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={{
            borderTop: `1px solid ${COLORS.hairline}`,
            paddingTop: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: COLORS.body, opacity: 0.4 }}>
              Member since {new Date(user.created_at).toLocaleDateString()}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: COLORS.body, opacity: 0.4 }}>
              {badges.total_interactions || (badges.match_attendance + badges.merch_purchases + badges.social_media)} interactions recorded
            </div>
          </div>
        </div>
      </div>

      {/* Recent Interactions */}
      {passport?.interactions?.length > 0 && (
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h3 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 20,
            fontWeight: 700,
            color: "#F2F5EE",
            marginBottom: 16,
          }}>
            Recent On-Chain Activity
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {passport.interactions.slice(0, 8).map((ix, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 16px",
                  background: COLORS.bgSoft,
                  borderRadius: 4,
                  border: `1px solid ${COLORS.hairline}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 18 }}>
                    {ix.interaction_type === "match_attendance" ? "🏟️" :
                     ix.interaction_type === "merch_purchase" ? "👕" : "📱"}
                  </span>
                  <div>
                    <div style={{ color: "#F2F5EE", fontSize: 14 }}>
                      {formatInteractionLabel(ix.interaction_type, ix.metadata)}
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: COLORS.body, opacity: 0.5, marginTop: 2 }}>
                      {ix.tx_hash ? `tx: ${ix.tx_hash.slice(0, 10)}...${ix.tx_hash.slice(-6)}` : "pending"}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: COLORS.green, fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
                    +{ix.points}
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.5 }}>
                    {new Date(ix.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// STAMP BADGE component
// ============================================================================

function StampBadge({ icon, label, count, color, points }) {
  const hasStamps = count > 0;

  return (
    <div
      className={hasStamps ? "stamp-badge" : ""}
      style={{
        background: hasStamps ? `${color}15` : COLORS.bg,
        border: `2px solid ${hasStamps ? color : COLORS.hairline}`,
        borderRadius: 8,
        padding: "20px 16px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        opacity: hasStamps ? 1 : 0.4,
      }}
    >
      {hasStamps && (
        <div style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: color,
          color: COLORS.bg,
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          padding: "2px 6px",
          borderRadius: 10,
        }}>
          x{count}
        </div>
      )}
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <div style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 700,
        fontSize: 16,
        color: hasStamps ? "#F2F5EE" : COLORS.body,
        marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 11,
        color: hasStamps ? color : COLORS.body,
        opacity: hasStamps ? 1 : 0.5,
      }}>
        {hasStamps ? `${points} pts` : "No stamps yet"}
      </div>
    </div>
  );
}

// ============================================================================
// RECORD INTERACTION
// ============================================================================

function RecordInteraction({ token, onComplete }) {
  const [type, setType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function submitInteraction(interaction_type, metadata) {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch(`${API_URL}/api/passport/interact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ interaction_type, metadata }),
      });

      if (!response.ok) throw new Error("Failed to record interaction");

      const data = await response.json();
      setResult(data);
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>
          {result.interaction?.interaction_type === "match_attendance" ? "🏟️" :
           result.interaction?.interaction_type === "merch_purchase" ? "👕" : "📱"}
        </div>
        <h2 style={{ color: COLORS.green, fontFamily: "'Barlow Condensed', sans-serif", marginBottom: 16 }}>
          Interaction Recorded!
        </h2>
        <div style={{
          background: COLORS.bgSoft,
          border: `1px solid ${COLORS.hairline}`,
          borderRadius: 8,
          padding: 24,
          marginBottom: 24,
          textAlign: "left",
        }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: COLORS.body, opacity: 0.5, letterSpacing: "0.2em", marginBottom: 4 }}>
              TRANSACTION HASH
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: COLORS.teal, wordBreak: "break-all" }}>
              {result.tx?.txHash}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: COLORS.body, opacity: 0.5, letterSpacing: "0.2em", marginBottom: 4 }}>
              BLOCK NUMBER
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: COLORS.body }}>
              #{result.tx?.blockNumber}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: COLORS.body, opacity: 0.5, letterSpacing: "0.2em", marginBottom: 4 }}>
              POINTS EARNED
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, color: COLORS.green }}>
              +{result.interaction?.points}
            </div>
          </div>
        </div>
        <button className="btn-primary" onClick={() => { setResult(null); setType(null); }}>
          Record Another
        </button>
      </div>
    );
  }

  if (!type) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 28,
          fontWeight: 900,
          color: "#F2F5EE",
          marginBottom: 8,
        }}>
          Record an Interaction
        </h2>
        <p style={{ marginBottom: 32, opacity: 0.7 }}>
          Choose the type of fan interaction to stamp on your passport.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
          {[
            {
              type: "match_attendance",
              icon: "🏟️",
              title: "Match Attendance",
              desc: "Record attending a live match",
              points: 50,
              color: COLORS.green,
            },
            {
              type: "merch_purchase",
              icon: "👕",
              title: "Merch Purchase",
              desc: "Log a merchandise purchase",
              points: 30,
              color: COLORS.gold,
            },
            {
              type: "social_media",
              icon: "📱",
              title: "Social Media",
              desc: "Like, retweet, or comment",
              points: 10,
              color: COLORS.teal,
            },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => setType(item.type)}
              style={{
                background: COLORS.bgSoft,
                border: `1px solid ${COLORS.hairline}`,
                borderRadius: 8,
                padding: 28,
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                color: COLORS.body,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = item.color;
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = COLORS.hairline;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>{item.icon}</div>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: 18,
                color: "#F2F5EE",
                marginBottom: 8,
                textTransform: "none",
                letterSpacing: 0,
              }}>
                {item.title}
              </div>
              <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 12, textTransform: "none", letterSpacing: 0 }}>
                {item.desc}
              </div>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 12,
                color: item.color,
              }}>
                +{item.points} pts
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <InteractionForm
      type={type}
      loading={loading}
      onSubmit={submitInteraction}
      onBack={() => setType(null)}
    />
  );
}

// ============================================================================
// INTERACTION FORM — specific fields per type
// ============================================================================

function InteractionForm({ type, loading, onSubmit, onBack }) {
  const [formData, setFormData] = useState({});

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(type, formData);
  }

  const config = {
    match_attendance: {
      icon: "🏟️",
      title: "Match Attendance",
      color: COLORS.green,
      fields: [
        { key: "match_name", label: "Match", placeholder: "e.g. Arsenal vs Chelsea", required: true },
        { key: "venue", label: "Venue", placeholder: "e.g. Emirates Stadium" },
        { key: "date", label: "Date", type: "date" },
        { key: "competition", label: "Competition", placeholder: "e.g. Premier League" },
      ],
    },
    merch_purchase: {
      icon: "👕",
      title: "Merchandise Purchase",
      color: COLORS.gold,
      fields: [
        { key: "item_name", label: "Item", placeholder: "e.g. Home Kit 2025/26", required: true },
        { key: "brand", label: "Brand", placeholder: "e.g. Nike" },
        { key: "club", label: "Club / Team", placeholder: "e.g. Arsenal FC" },
        { key: "category", label: "Category", placeholder: "e.g. Jersey, Scarf, Cap" },
      ],
    },
    social_media: {
      icon: "📱",
      title: "Social Media Engagement",
      color: COLORS.teal,
      fields: [
        { key: "action", label: "Action", type: "select", options: ["Like", "Retweet", "Comment", "Share", "Post"], required: true },
        { key: "platform", label: "Platform", type: "select", options: ["X (Twitter)", "Instagram", "Facebook", "TikTok", "YouTube"] },
        { key: "content_url", label: "Content URL", placeholder: "https://..." },
        { key: "description", label: "Description", placeholder: "What did you engage with?" },
      ],
    },
  };

  const cfg = config[type];

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: COLORS.body,
          opacity: 0.6,
          cursor: "pointer",
          fontFamily: "'DM Mono', monospace",
          fontSize: 12,
          marginBottom: 24,
          padding: 0,
        }}
      >
        &larr; Back
      </button>

      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{cfg.icon}</div>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 28,
          fontWeight: 900,
          color: cfg.color,
          margin: 0,
        }}>
          {cfg.title}
        </h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {cfg.fields.map((field) => (
          <div key={field.key}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 14, opacity: 0.8 }}>
              {field.label} {field.required && <span style={{ color: COLORS.red }}>*</span>}
            </label>
            {field.type === "select" ? (
              <select
                value={formData[field.key] || ""}
                onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                required={field.required}
                style={{ width: "100%" }}
              >
                <option value="">Select...</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type || "text"}
                value={formData[field.key] || ""}
                onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                required={field.required}
                style={{ width: "100%" }}
              />
            )}
          </div>
        ))}

        <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", marginTop: 12 }}>
          {loading ? "Recording on-chain..." : "Stamp My Passport"}
        </button>
      </form>
    </div>
  );
}

// ============================================================================
// INTERACTION HISTORY
// ============================================================================

function InteractionHistory({ passport }) {
  const interactions = passport?.interactions || [];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h2 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 28,
        fontWeight: 900,
        color: "#F2F5EE",
        marginBottom: 8,
      }}>
        On-Chain History
      </h2>
      <p style={{ marginBottom: 32, opacity: 0.7 }}>
        Every interaction is recorded with a transaction hash for verification.
      </p>

      {interactions.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: 60,
          background: COLORS.bgSoft,
          borderRadius: 8,
          border: `1px solid ${COLORS.hairline}`,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>🔗</div>
          <p style={{ opacity: 0.5 }}>No interactions recorded yet. Start building your passport!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {interactions.map((ix, i) => (
            <div
              key={i}
              style={{
                background: COLORS.bgSoft,
                border: `1px solid ${COLORS.hairline}`,
                borderRadius: 8,
                padding: "16px 20px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 24 }}>
                    {ix.interaction_type === "match_attendance" ? "🏟️" :
                     ix.interaction_type === "merch_purchase" ? "👕" : "📱"}
                  </span>
                  <div>
                    <div style={{ color: "#F2F5EE", fontSize: 15, fontWeight: 500 }}>
                      {formatInteractionLabel(ix.interaction_type, ix.metadata)}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>
                      {new Date(ix.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div style={{
                  color: COLORS.green,
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 14,
                  fontWeight: 500,
                }}>
                  +{ix.points}
                </div>
              </div>

              {ix.tx_hash && (
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  color: COLORS.teal,
                  opacity: 0.7,
                  background: COLORS.bg,
                  padding: "6px 10px",
                  borderRadius: 4,
                  wordBreak: "break-all",
                }}>
                  tx: {ix.tx_hash}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PROFILE TAB
// ============================================================================

function ProfileTab({ user, token, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    display_name: user.display_name,
    favorite_club: user.favorite_club || "",
    bio: user.bio || "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave() {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("Failed to update profile");
      setMessage("Profile updated!");
      setEditing(false);
      onUpdate();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("Error updating profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ marginBottom: 32, color: "#F2F5EE", fontFamily: "'Barlow Condensed', sans-serif" }}>My Profile</h2>

      {message && (
        <div style={{
          padding: "12px 16px",
          marginBottom: 24,
          background: `${COLORS.green}20`,
          border: `1px solid ${COLORS.green}`,
          color: COLORS.green,
          borderRadius: 4,
          fontSize: 14,
        }}>
          {message}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label style={{ display: "block", marginBottom: 8, opacity: 0.8 }}>DID</label>
          <input type="text" value={user.did || ""} disabled style={{ width: "100%", opacity: 0.6, cursor: "not-allowed", fontFamily: "'DM Mono', monospace", fontSize: 12 }} />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 8, opacity: 0.8 }}>Wallet Address</label>
          <input type="text" value={user.wallet_address || ""} disabled style={{ width: "100%", opacity: 0.6, cursor: "not-allowed", fontFamily: "'DM Mono', monospace", fontSize: 12 }} />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 8, opacity: 0.8 }}>Email</label>
          <input type="email" value={user.email} disabled style={{ width: "100%", opacity: 0.6, cursor: "not-allowed" }} />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 8, opacity: 0.8 }}>Username</label>
          <input type="text" value={user.username} disabled style={{ width: "100%", opacity: 0.6, cursor: "not-allowed" }} />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 8, opacity: 0.8 }}>Display Name</label>
          <input type="text" value={formData.display_name} onChange={(e) => setFormData({ ...formData, display_name: e.target.value })} disabled={!editing} style={{ width: "100%" }} />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 8, opacity: 0.8 }}>Favorite Club</label>
          <input type="text" value={formData.favorite_club} onChange={(e) => setFormData({ ...formData, favorite_club: e.target.value })} disabled={!editing} style={{ width: "100%" }} />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 8, opacity: 0.8 }}>Bio</label>
          <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} disabled={!editing} style={{ width: "100%", minHeight: 100, resize: "vertical" }} placeholder="Tell us about yourself..." />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {!editing ? (
            <button className="btn-primary" onClick={() => setEditing(true)}>Edit Profile</button>
          ) : (
            <>
              <button className="btn-primary" onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SOCIAL SYNC — X (Twitter) OAuth & Activity Sync
// ============================================================================

function SocialSync({ token, apiUrl, onComplete }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [showClubs, setShowClubs] = useState(false);

  useEffect(() => {
    fetchStatus();
    fetchClubs();
    // Check URL for twitter callback result
    const hash = window.location.hash;
    if (hash.includes("twitter=connected")) {
      // Clean URL
      window.location.hash = "#portal";
      fetchStatus();
    }
  }, []);

  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/twitter/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error("Failed to fetch X status:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchClubs() {
    try {
      const res = await fetch(`${apiUrl}/api/twitter/clubs`);
      if (res.ok) {
        const data = await res.json();
        setClubs(data.clubs || []);
      }
    } catch (err) {
      console.error("Failed to fetch clubs:", err);
    }
  }

  function connectX() {
    // Redirect to OAuth endpoint
    window.location.href = `${apiUrl}/api/twitter/auth?token=${token}`;
  }

  async function disconnectX() {
    try {
      const res = await fetch(`${apiUrl}/api/twitter/disconnect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setStatus({ connected: false });
        setSyncResult(null);
      }
    } catch (err) {
      console.error("Failed to disconnect:", err);
    }
  }

  async function syncNow() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch(`${apiUrl}/api/twitter/sync`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error("Sync failed");
      const data = await res.json();
      setSyncResult(data);
      onComplete(); // refresh passport data
    } catch (err) {
      console.error("Sync failed:", err);
      setSyncResult({ error: err.message });
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center", padding: 60 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: COLORS.body, opacity: 0.6 }}>
          Checking X connection...
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <h2 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 28,
        fontWeight: 900,
        color: "#F2F5EE",
        marginBottom: 8,
      }}>
        X (Twitter) Sync
      </h2>
      <p style={{ marginBottom: 32, opacity: 0.7, lineHeight: 1.6 }}>
        Connect your X account and sync your likes, retweets, and replies on football club posts.
        Each qualifying interaction earns 10 passport points.
      </p>

      {/* Demo mode banner */}
      {status?.demo_mode && (
        <div style={{
          background: `${COLORS.gold}15`,
          border: `1px solid ${COLORS.gold}40`,
          borderRadius: 8,
          padding: "14px 20px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>🧪</span>
          <div>
            <div style={{ color: COLORS.gold, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.1em", marginBottom: 4 }}>
              DEMO MODE
            </div>
            <div style={{ fontSize: 13, color: COLORS.body, opacity: 0.8 }}>
              No X API keys configured. Sync will generate simulated club interactions for testing.
            </div>
          </div>
        </div>
      )}

      {/* Connection Status Card */}
      <div style={{
        background: COLORS.bgSoft,
        border: `1px solid ${status?.connected ? COLORS.teal + "60" : COLORS.hairline}`,
        borderRadius: 8,
        padding: 28,
        marginBottom: 24,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: status?.connected ? 20 : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* X Logo */}
            <div style={{
              width: 48,
              height: 48,
              background: status?.connected ? `${COLORS.teal}20` : COLORS.bg,
              border: `2px solid ${status?.connected ? COLORS.teal : COLORS.hairline}`,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              color: status?.connected ? COLORS.teal : COLORS.body,
            }}>
              𝕏
            </div>
            <div>
              <div style={{ color: "#F2F5EE", fontSize: 16, fontWeight: 500, marginBottom: 4 }}>
                {status?.connected ? (
                  <>
                    Connected as <span style={{ color: COLORS.teal }}>@{status.twitter_username}</span>
                  </>
                ) : (
                  "Not Connected"
                )}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: COLORS.body, opacity: 0.5 }}>
                {status?.connected
                  ? status.last_synced
                    ? `Last synced: ${new Date(status.last_synced).toLocaleString()}`
                    : "Never synced"
                  : "Connect to start earning social points"}
              </div>
            </div>
          </div>

          {!status?.connected ? (
            <button className="btn-primary" onClick={connectX}>
              Connect X
            </button>
          ) : (
            <button
              className="btn-ghost"
              onClick={disconnectX}
              style={{ fontSize: 10, padding: "8px 14px", borderColor: COLORS.red + "60", color: COLORS.red }}
            >
              Disconnect
            </button>
          )}
        </div>

        {/* Sync Now Button */}
        {status?.connected && (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              className="btn-primary"
              onClick={syncNow}
              disabled={syncing}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: COLORS.teal,
              }}
            >
              {syncing ? (
                <>
                  <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
                  Syncing...
                </>
              ) : (
                "Sync Now"
              )}
            </button>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: COLORS.body, opacity: 0.5 }}>
              Pull latest likes, retweets & replies
            </span>
          </div>
        )}
      </div>

      {/* Sync Results */}
      {syncResult && !syncResult.error && (
        <div style={{
          background: `${COLORS.green}08`,
          border: `1px solid ${COLORS.green}30`,
          borderRadius: 8,
          padding: 24,
          marginBottom: 24,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ color: COLORS.green, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                Sync Complete!
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: COLORS.body, opacity: 0.7 }}>
                {syncResult.total_found} interaction(s) found, {syncResult.new_interactions?.length || 0} new
                {syncResult.already_synced > 0 && `, ${syncResult.already_synced} already recorded`}
              </div>
            </div>
            {syncResult.points_earned > 0 && (
              <div style={{
                background: `${COLORS.green}20`,
                color: COLORS.green,
                fontFamily: "'DM Mono', monospace",
                fontSize: 18,
                fontWeight: 700,
                padding: "8px 16px",
                borderRadius: 8,
              }}>
                +{syncResult.points_earned} pts
              </div>
            )}
          </div>

          {/* List new interactions */}
          {syncResult.new_interactions?.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {syncResult.new_interactions.map((ix, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    background: COLORS.bgSoft,
                    borderRadius: 4,
                    border: `1px solid ${COLORS.hairline}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                    <span style={{
                      fontSize: 14,
                      background: actionColor(ix.metadata?.action) + "20",
                      color: actionColor(ix.metadata?.action),
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontFamily: "'DM Mono', monospace",
                      textTransform: "uppercase",
                      fontSize: 10,
                      letterSpacing: "0.05em",
                      whiteSpace: "nowrap",
                    }}>
                      {ix.metadata?.action || "engage"}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: COLORS.teal, fontSize: 13, fontFamily: "'DM Mono', monospace" }}>
                        {ix.metadata?.club_handle}
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: COLORS.body,
                        opacity: 0.6,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: 350,
                      }}>
                        {ix.metadata?.tweet_preview}
                      </div>
                    </div>
                  </div>
                  <div style={{ color: COLORS.green, fontFamily: "'DM Mono', monospace", fontSize: 12, whiteSpace: "nowrap", marginLeft: 12 }}>
                    +10
                  </div>
                </div>
              ))}
            </div>
          )}

          {syncResult.new_interactions?.length === 0 && (
            <div style={{ textAlign: "center", padding: "16px 0", opacity: 0.6, fontSize: 14 }}>
              No new club interactions found since last sync.
            </div>
          )}
        </div>
      )}

      {syncResult?.error && (
        <div style={{
          background: `${COLORS.red}15`,
          border: `1px solid ${COLORS.red}40`,
          borderRadius: 8,
          padding: "14px 20px",
          marginBottom: 24,
          color: "#FF9AAD",
          fontSize: 14,
        }}>
          Sync failed: {syncResult.error}
        </div>
      )}

      {/* Tracked Clubs */}
      <div style={{
        background: COLORS.bgSoft,
        border: `1px solid ${COLORS.hairline}`,
        borderRadius: 8,
        overflow: "hidden",
      }}>
        <button
          onClick={() => setShowClubs(!showClubs)}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            color: COLORS.body,
          }}
        >
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.1em" }}>
            TRACKED CLUBS ({clubs.length})
          </span>
          <span style={{ fontSize: 12, opacity: 0.5 }}>
            {showClubs ? "▲" : "▼"}
          </span>
        </button>

        {showClubs && (
          <div style={{ padding: "0 20px 20px", display: "flex", flexWrap: "wrap", gap: 8 }}>
            {clubs.map((club, i) => (
              <div
                key={i}
                style={{
                  background: COLORS.bg,
                  border: `1px solid ${COLORS.hairline}`,
                  borderRadius: 20,
                  padding: "6px 14px",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span style={{ color: COLORS.teal, fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
                  @{club.handle}
                </span>
                <span style={{ opacity: 0.5, fontSize: 11 }}>
                  {club.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How it works */}
      <div style={{
        marginTop: 32,
        padding: 24,
        background: COLORS.bgSoft,
        border: `1px solid ${COLORS.hairline}`,
        borderRadius: 8,
      }}>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          color: COLORS.body,
          opacity: 0.5,
          letterSpacing: "0.15em",
          marginBottom: 16,
        }}>
          HOW IT WORKS
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20 }}>
          {[
            { step: "1", title: "Connect", desc: "Link your X account via OAuth" },
            { step: "2", title: "Interact", desc: "Like, retweet, or reply to club posts" },
            { step: "3", title: "Sync", desc: 'Click "Sync Now" to pull activity' },
            { step: "4", title: "Earn", desc: "10 points per qualifying interaction" },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{
                width: 32,
                height: 32,
                background: `${COLORS.teal}20`,
                border: `1px solid ${COLORS.teal}40`,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 8px",
                fontFamily: "'DM Mono', monospace",
                fontSize: 13,
                color: COLORS.teal,
                fontWeight: 700,
              }}>
                {item.step}
              </div>
              <div style={{ color: "#F2F5EE", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                {item.title}
              </div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function actionColor(action) {
  switch (action) {
    case "like": return COLORS.red;
    case "retweet": return COLORS.green;
    case "reply": return COLORS.teal;
    default: return COLORS.body;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function formatInteractionLabel(type, metadata) {
  const meta = metadata || {};
  switch (type) {
    case "match_attendance":
      return meta.match_name ? `Match: ${meta.match_name}` : "Match Attendance";
    case "merch_purchase":
      return meta.item_name ? `Purchased: ${meta.item_name}` : "Merch Purchase";
    case "social_media": {
      const action = meta.action || "Engaged";
      const platform = meta.platform ? ` on ${meta.platform}` : "";
      return `${action}${platform}`;
    }
    default:
      return "Interaction";
  }
}
