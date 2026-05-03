import React, { useEffect, useState } from "react";

// ============================================================================
// FOFA CLUB DASHBOARD — Self-service management for club admins
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

export default function ClubDashboard() {
  const [token] = useState(localStorage.getItem("fofaToken") || null);
  const [club, setClub] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [stats, setStats] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!token) {
      setError("Please log in to access your club dashboard.");
      setLoading(false);
      return;
    }
    fetchClubData();
  }, []);

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function fetchClubData() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/clubs/my-club`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to load club data");
      }
      const data = await res.json();
      setClub(data.club);
      setFollowers(data.followers || []);
      setStats(data.stats);
      setAnnouncements(data.announcements || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ background: COLORS.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 24 }}>
        <Styles />
        <div style={{ fontSize: 48, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, color: COLORS.green, letterSpacing: "0.05em", animation: "pulse 2s ease-in-out infinite" }}>FOFA</div>
        <div style={{ color: COLORS.body, opacity: 0.6, fontFamily: "'DM Mono', monospace", fontSize: 12 }}>Loading club dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: COLORS.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 24, padding: 40 }}>
        <Styles />
        <div style={{ fontSize: 48, marginBottom: 8 }}>🏟️</div>
        <div style={{ color: "#F2F5EE", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, textAlign: "center" }}>
          {error === "You don't manage any club" ? "No Club Found" : "Access Error"}
        </div>
        <p style={{ color: COLORS.body, opacity: 0.7, textAlign: "center", maxWidth: 400 }}>
          {error === "You don't manage any club"
            ? "You're not listed as an admin for any club on FOFA. If your club has been approved, contact the platform admin."
            : error}
        </p>
        <a href="#" style={{ color: COLORS.green, fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.1em" }}>← BACK TO FOFA</a>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "📊 Overview" },
    { id: "edit", label: "✏️ Edit Profile" },
    { id: "fans", label: "👥 Fans" },
    { id: "announcements", label: "📢 Announcements" },
  ];

  return (
    <div style={{ background: COLORS.bg, color: COLORS.body, fontFamily: "'Crimson Pro', Georgia, serif", minHeight: "100vh", position: "relative" }}>
      <Styles />

      {/* Ambient bg */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(circle at 20% 30%, ${COLORS.greenGlow} 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(26, 200, 200, 0.05) 0%, transparent 50%)`, pointerEvents: "none", zIndex: 0 }} />

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 1000, padding: "12px 24px", background: toast.type === "error" ? COLORS.red : COLORS.green, color: COLORS.bg, borderRadius: 4, fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, boxShadow: "0 4px 20px rgba(0,0,0,0.3)", animation: "fadeIn 0.3s ease-out" }}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header style={{ position: "relative", zIndex: 1, padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${COLORS.hairline}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="#" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 24, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, color: COLORS.green, letterSpacing: "0.05em" }}>FOFA</span>
          </a>
          <span style={{ color: COLORS.hairlineStrong }}>|</span>
          <span style={{ fontSize: 14, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: "#F2F5EE", letterSpacing: "0.05em" }}>
            {club.name} — Dashboard
          </span>
        </div>
        <a href={`#clubs/${club.slug}`} style={{ color: COLORS.body, opacity: 0.6, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.1em", textDecoration: "none" }}>
          VIEW PUBLIC PAGE →
        </a>
      </header>

      {/* Main */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "40px 20px 80px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 40, borderBottom: `1px solid ${COLORS.hairline}`, paddingBottom: 0, overflowX: "auto" }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              background: "transparent", border: "none", color: activeTab === tab.id ? COLORS.green : COLORS.body,
              opacity: activeTab === tab.id ? 1 : 0.6, padding: "12px 20px", fontFamily: "'DM Mono', monospace",
              fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
              borderBottom: `2px solid ${activeTab === tab.id ? COLORS.green : "transparent"}`, marginBottom: "-1px",
              transition: "all 0.2s", whiteSpace: "nowrap",
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div key={activeTab} className="fade-in">
          {activeTab === "overview" && <OverviewTab club={club} stats={stats} announcements={announcements} />}
          {activeTab === "edit" && <EditProfileTab club={club} token={token} onUpdate={fetchClubData} showToast={showToast} />}
          {activeTab === "fans" && <FansTab followers={followers} club={club} />}
          {activeTab === "announcements" && <AnnouncementsTab announcements={announcements} club={club} token={token} onUpdate={fetchClubData} showToast={showToast} />}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// OVERVIEW TAB
// ============================================================================

function OverviewTab({ club, stats, announcements }) {
  return (
    <div>
      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 40 }}>
        {[
          { label: "FANS", value: stats.fan_count, icon: "👥", color: COLORS.green },
          { label: "ENDORSEMENTS", value: stats.endorsement_count, icon: "🛡️", color: COLORS.gold },
          { label: "ANNOUNCEMENTS", value: stats.announcement_count, icon: "📢", color: COLORS.teal },
        ].map((s, i) => (
          <div key={i} style={{
            background: COLORS.bgCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 8, padding: 28, textAlign: "center",
            animation: `fadeIn 0.4s ease-out ${i * 0.1}s forwards`, opacity: 0,
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 36, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.5, letterSpacing: "0.2em", marginTop: 8 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Club info summary */}
      <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 8, padding: 32, marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.gold, letterSpacing: "0.25em", marginBottom: 16 }}>— CLUB DETAILS</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
          {[
            { label: "Country", value: club.country },
            { label: "League", value: club.league },
            { label: "Stadium", value: club.stadium || "—" },
            { label: "Founded", value: club.founded_year || "—" },
            { label: "Website", value: club.website || "—" },
            { label: "Status", value: club.status },
          ].map((item, i) => (
            <div key={i}>
              <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.5, letterSpacing: "0.15em", marginBottom: 4 }}>{item.label.toUpperCase()}</div>
              <div style={{ fontSize: 16, color: "#F2F5EE", fontFamily: "'Crimson Pro', serif" }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent announcements */}
      <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 8, padding: 32 }}>
        <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.gold, letterSpacing: "0.25em", marginBottom: 16 }}>— RECENT ANNOUNCEMENTS</div>
        {announcements.length === 0 ? (
          <p style={{ color: COLORS.body, opacity: 0.5 }}>No announcements yet. Switch to the Announcements tab to post one.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {announcements.slice(0, 5).map((a, i) => (
              <div key={i} style={{ padding: "12px 16px", background: COLORS.bg, border: `1px solid ${COLORS.hairline}`, borderRadius: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#F2F5EE" }}>{a.pinned ? "📌 " : ""}{a.title}</span>
                  <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.4 }}>{new Date(a.created_at).toLocaleDateString("en-GB")}</span>
                </div>
                <div style={{ fontSize: 13, color: COLORS.body, opacity: 0.7 }}>{a.content.length > 120 ? a.content.slice(0, 120) + "…" : a.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// EDIT PROFILE TAB
// ============================================================================

function EditProfileTab({ club, token, onUpdate, showToast }) {
  const [form, setForm] = useState({
    description: club.description || "",
    stadium: club.stadium || "",
    website: club.website || "",
    social_twitter: club.social_twitter || "",
    social_instagram: club.social_instagram || "",
    social_facebook: club.social_facebook || "",
    primary_color: club.primary_color || "",
    secondary_color: club.secondary_color || "",
  });
  const [saving, setSaving] = useState(false);

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/clubs/my-club`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      showToast("Club profile updated!");
      onUpdate();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  const fields = [
    { key: "description", label: "Description", type: "textarea", hint: "Tell fans what makes your club special" },
    { key: "stadium", label: "Stadium", type: "text" },
    { key: "website", label: "Website", type: "text" },
    { key: "social_twitter", label: "Twitter / X", type: "text", hint: "e.g. https://twitter.com/yourclub" },
    { key: "social_instagram", label: "Instagram", type: "text" },
    { key: "social_facebook", label: "Facebook", type: "text" },
    { key: "primary_color", label: "Primary Color (hex)", type: "text", hint: "e.g. #FF0000" },
    { key: "secondary_color", label: "Secondary Color (hex)", type: "text" },
  ];

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.gold, letterSpacing: "0.25em", marginBottom: 12 }}>— EDIT CLUB PROFILE</div>
      <h2 style={{ color: "#F2F5EE", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, margin: "0 0 8px" }}>Update {club.name}</h2>
      <p style={{ color: COLORS.body, opacity: 0.7, marginBottom: 32 }}>Changes will appear on your public club page immediately.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {fields.map(f => (
          <div key={f.key}>
            <label style={{ display: "block", fontSize: 10, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.6, letterSpacing: "0.2em", marginBottom: 8, textTransform: "uppercase" }}>
              {f.label}
            </label>
            {f.type === "textarea" ? (
              <textarea
                value={form[f.key]}
                onChange={e => handleChange(f.key, e.target.value)}
                rows={4}
                style={{
                  width: "100%", padding: "12px 16px", background: COLORS.bgCard, border: `1px solid ${COLORS.hairline}`,
                  borderRadius: 4, color: "#F2F5EE", fontFamily: "'Crimson Pro', serif", fontSize: 16, resize: "vertical", outline: "none",
                }}
                onFocus={e => e.target.style.borderColor = COLORS.green}
                onBlur={e => e.target.style.borderColor = COLORS.hairline}
              />
            ) : (
              <input
                type="text"
                value={form[f.key]}
                onChange={e => handleChange(f.key, e.target.value)}
                style={{
                  width: "100%", padding: "12px 16px", background: COLORS.bgCard, border: `1px solid ${COLORS.hairline}`,
                  borderRadius: 4, color: "#F2F5EE", fontFamily: "'Crimson Pro', serif", fontSize: 16, outline: "none",
                }}
                onFocus={e => e.target.style.borderColor = COLORS.green}
                onBlur={e => e.target.style.borderColor = COLORS.hairline}
              />
            )}
            {f.hint && <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.4, marginTop: 4 }}>{f.hint}</div>}
          </div>
        ))}

        <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ alignSelf: "flex-start", padding: "12px 32px", marginTop: 8 }}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// FANS TAB
// ============================================================================

function FansTab({ followers, club }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = followers.filter(f =>
    !searchQuery || f.display_name.toLowerCase().includes(searchQuery.toLowerCase()) || f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const levelColors = {
    legend: COLORS.red || "#FF4757",
    master: "#9C88FF",
    veteran: COLORS.gold,
    devotee: COLORS.teal,
    supporter: COLORS.green,
    apprentice: COLORS.body,
  };

  return (
    <div>
      <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.gold, letterSpacing: "0.25em", marginBottom: 12 }}>— YOUR FANS</div>
      <h2 style={{ color: "#F2F5EE", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, margin: "0 0 8px" }}>
        {followers.length} {followers.length === 1 ? "Fan" : "Fans"} Following {club.name}
      </h2>
      <p style={{ color: COLORS.body, opacity: 0.7, marginBottom: 24 }}>Ranked by loyalty score.</p>

      {followers.length > 5 && (
        <input
          type="text"
          placeholder="Search fans..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: "100%", maxWidth: 400, padding: "10px 16px", background: COLORS.bgCard, border: `1px solid ${COLORS.hairline}`,
            borderRadius: 4, color: "#F2F5EE", fontFamily: "'Crimson Pro', serif", fontSize: 15, marginBottom: 24, outline: "none",
          }}
          onFocus={e => e.target.style.borderColor = COLORS.green}
          onBlur={e => e.target.style.borderColor = COLORS.hairline}
        />
      )}

      {filtered.length === 0 ? (
        <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 8, padding: "48px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
          <div style={{ color: "#F2F5EE", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900 }}>
            {searchQuery ? "No fans match your search" : "No fans yet"}
          </div>
          <p style={{ color: COLORS.body, opacity: 0.7 }}>Share your club page to start building your fanbase on FOFA.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {/* Header row */}
          <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 100px 80px 100px", gap: 12, padding: "8px 16px", fontSize: 9, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.4, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            <span>#</span><span>FAN</span><span>LEVEL</span><span>SCORE</span><span>JOINED</span>
          </div>
          {filtered.map((fan, i) => (
            <a key={fan.username} href={`#fans/${fan.username}`} style={{
              display: "grid", gridTemplateColumns: "40px 1fr 100px 80px 100px", gap: 12, padding: "12px 16px",
              background: COLORS.bgCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 4, textDecoration: "none", color: "inherit",
              alignItems: "center", transition: "border-color 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.green}
            onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.hairline}
            >
              <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.5 }}>{i + 1}</span>
              <div>
                <span style={{ fontSize: 15, color: "#F2F5EE", fontWeight: 600 }}>{fan.display_name}</span>
                <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.4, marginLeft: 8 }}>@{fan.username}</span>
              </div>
              <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: levelColors[fan.level] || COLORS.body, textTransform: "capitalize" }}>{fan.level}</span>
              <span style={{ fontSize: 13, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: COLORS.green }}>{Math.round(fan.total_score)}</span>
              <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.4 }}>{new Date(fan.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ANNOUNCEMENTS TAB
// ============================================================================

function AnnouncementsTab({ announcements, club, token, onUpdate, showToast }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);
  const [posting, setPosting] = useState(false);
  const [deleting, setDeleting] = useState(null);

  async function handlePost() {
    if (!title.trim() || !content.trim()) {
      showToast("Title and content are required", "error");
      return;
    }
    setPosting(true);
    try {
      const res = await fetch(`${API_URL}/clubs/my-club/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim(), content: content.trim(), pinned }),
      });
      if (!res.ok) throw new Error("Failed to post");
      showToast("Announcement posted! Followers have been notified.");
      setTitle("");
      setContent("");
      setPinned(false);
      setShowForm(false);
      onUpdate();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(id) {
    setDeleting(id);
    try {
      const res = await fetch(`${API_URL}/clubs/my-club/announcements/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      showToast("Announcement deleted");
      onUpdate();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.gold, letterSpacing: "0.25em", marginBottom: 12 }}>— ANNOUNCEMENTS</div>
          <h2 style={{ color: "#F2F5EE", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, margin: 0 }}>Club Announcements</h2>
          <p style={{ color: COLORS.body, opacity: 0.7, marginTop: 8 }}>Post updates for your followers. They'll be notified automatically.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ padding: "10px 24px" }}>
          {showForm ? "Cancel" : "+ New Announcement"}
        </button>
      </div>

      {/* New announcement form */}
      {showForm && (
        <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.green}40`, borderRadius: 8, padding: 28, marginBottom: 32, animation: "fadeIn 0.3s ease-out" }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 10, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.6, letterSpacing: "0.2em", marginBottom: 8 }}>TITLE</label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title..."
              style={{ width: "100%", padding: "12px 16px", background: COLORS.bg, border: `1px solid ${COLORS.hairline}`, borderRadius: 4, color: "#F2F5EE", fontFamily: "'Crimson Pro', serif", fontSize: 16, outline: "none" }}
              onFocus={e => e.target.style.borderColor = COLORS.green} onBlur={e => e.target.style.borderColor = COLORS.hairline}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 10, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.6, letterSpacing: "0.2em", marginBottom: 8 }}>CONTENT</label>
            <textarea
              value={content} onChange={e => setContent(e.target.value)} rows={5} placeholder="Write your announcement..."
              style={{ width: "100%", padding: "12px 16px", background: COLORS.bg, border: `1px solid ${COLORS.hairline}`, borderRadius: 4, color: "#F2F5EE", fontFamily: "'Crimson Pro', serif", fontSize: 16, resize: "vertical", outline: "none" }}
              onFocus={e => e.target.style.borderColor = COLORS.green} onBlur={e => e.target.style.borderColor = COLORS.hairline}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: COLORS.body }}>
              <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} style={{ accentColor: COLORS.green }} />
              Pin this announcement
            </label>
            <button onClick={handlePost} disabled={posting} className="btn-primary" style={{ padding: "10px 28px" }}>
              {posting ? "Posting..." : "Post Announcement"}
            </button>
          </div>
        </div>
      )}

      {/* Announcements list */}
      {announcements.length === 0 ? (
        <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 8, padding: "48px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📢</div>
          <div style={{ color: "#F2F5EE", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900 }}>No Announcements Yet</div>
          <p style={{ color: COLORS.body, opacity: 0.7 }}>Keep your fans informed by posting updates about your club.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {announcements.map(a => (
            <div key={a._id} style={{
              background: COLORS.bgCard, border: `1px solid ${a.pinned ? COLORS.gold + "40" : COLORS.hairline}`, borderRadius: 8, padding: "20px 24px",
              position: "relative",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 16 }}>
                <div>
                  <span style={{ fontSize: 18, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: "#F2F5EE" }}>
                    {a.pinned ? "📌 " : ""}{a.title}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.4 }}>
                    {new Date(a.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <button
                    onClick={() => handleDelete(a._id)}
                    disabled={deleting === a._id}
                    style={{ background: "transparent", border: "none", color: COLORS.red, opacity: 0.5, cursor: "pointer", fontSize: 11, fontFamily: "'DM Mono', monospace", padding: "2px 8px" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = "0.5"}
                  >
                    {deleting === a._id ? "..." : "Delete"}
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 15, color: COLORS.body, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{a.content}</div>
              <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.3, marginTop: 8 }}>
                Posted by {a.author}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// STYLES
// ============================================================================

function Styles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,500;1,400&family=DM+Mono:wght@400;500&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .fade-in { animation: fadeIn 0.4s ease-out; }
      .btn-primary {
        background: ${COLORS.green}; color: ${COLORS.bg}; border: none; border-radius: 4px;
        font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 700; letter-spacing: 0.1em;
        text-transform: uppercase; cursor: pointer; transition: all 0.2s;
      }
      .btn-primary:hover { box-shadow: 0 0 20px ${COLORS.greenGlow}; transform: translateY(-1px); }
      .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
      .btn-ghost {
        background: transparent; color: ${COLORS.body}; border: 1px solid ${COLORS.hairlineStrong}; border-radius: 4px;
        font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase;
        padding: 10px 20px; cursor: pointer; transition: all 0.2s;
      }
      .btn-ghost:hover { border-color: ${COLORS.green}; color: ${COLORS.green}; }
    `}</style>
  );
}
