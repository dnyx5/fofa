import React, { useState } from "react";

const COLORS = {
  bg: "#080C08", bgSoft: "#0E140E", bgCard: "#0A1109",
  green: "#1AFF6E", greenGlow: "rgba(26, 255, 110, 0.15)",
  body: "#C8D4C0", gold: "#C8A84B", red: "#FF4757",
  hairline: "rgba(200, 212, 192, 0.08)",
  hairlineStrong: "rgba(200, 212, 192, 0.15)",
};

const API_URL = import.meta.env.VITE_API_URL || "https://fofa.lol/api";

const EXPERT_TYPES = [
  { id: "verifier", icon: "🛡️", title: "Verifier", description: "Validate clubs and maintain trust. Your endorsement carries weight." },
  { id: "voice", icon: "📢", title: "Voice", description: "Share expert analysis. Your opinions guide the community." },
  { id: "ambassador", icon: "🎖️", title: "Ambassador", description: "Lead a club's fan community. Your passion brings people together." },
];

export default function ExpertApplyForm() {
  const [step, setStep] = useState(0); // 0 = type select, 1-3 = form
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const [data, setData] = useState({
    expert_type: "",
    full_name: "",
    display_name: "",
    email: "",
    phone: "",
    country: "",
    professional_background: "",
    current_role: "",
    years_in_football: "",
    clubs_supported: "",
    expertise_areas: "",
    region_focus: "",
    website: "",
    social_twitter: "",
    social_instagram: "",
    social_linkedin: "",
    social_youtube: "",
    follower_count: "",
    why_fofa: "",
    what_they_offer: "",
    references: "",
  });
  
  function update(field, value) {
    setData(d => ({ ...d, [field]: value }));
  }
  
  function selectType(type) {
    update("expert_type", type);
    setStep(1);
  }
  
  function validate(stepNum) {
    if (stepNum === 1) return data.full_name && data.display_name && data.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) && data.country;
    if (stepNum === 2) return data.professional_background && data.professional_background.length >= 50;
    if (stepNum === 3) return data.why_fofa && data.what_they_offer;
    return true;
  }
  
  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/experts/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          years_in_football: data.years_in_football ? parseInt(data.years_in_football) : null,
          follower_count: data.follower_count ? parseInt(data.follower_count) : 0,
          clubs_supported: data.clubs_supported.split(",").map(s => s.trim()).filter(Boolean),
          expertise_areas: data.expertise_areas.split(",").map(s => s.trim()).filter(Boolean),
        }),
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error || "Submission failed");
      setResult(responseData);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }
  
  return (
    <div style={{ background: COLORS.bg, color: COLORS.body, fontFamily: "'Crimson Pro', Georgia, serif", minHeight: "100vh" }}>
      <GlobalStyles />
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: `1px solid ${COLORS.hairline}` }}>
        <a href="/" style={{ textDecoration: "none", display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 24, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, color: COLORS.green, letterSpacing: "0.05em" }}>FOFA</div>
          <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.5, letterSpacing: "0.15em", borderLeft: `1px solid ${COLORS.hairline}`, paddingLeft: 12 }}>EXPERT APPLICATION</div>
        </a>
        <a href="#experts" style={{ color: COLORS.body, opacity: 0.7, fontSize: 11, fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none" }}>← Back</a>
      </div>
      
      <div style={{ padding: "0 20px 80px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          
          {/* Title */}
          <div style={{ textAlign: "center", padding: "60px 0 32px" }}>
            <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.gold, letterSpacing: "0.25em", marginBottom: 16 }}>— BECOME AN EXPERT</div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(36px, 7vw, 64px)", fontWeight: 900, color: "#F2F5EE", margin: "0 0 16px", letterSpacing: "-0.02em", lineHeight: 1.05 }}>
              Join <span style={{ color: COLORS.green }}>FOFA's</span><br/>Trust Layer
            </h1>
            <p style={{ color: COLORS.body, opacity: 0.7, maxWidth: 520, margin: "0 auto", fontSize: 16, lineHeight: 1.6 }}>
              Verified industry voices who shape the platform.
            </p>
          </div>
          
          {result ? <ResultView result={result} /> : (
            <>
              {step > 0 && <ProgressBar step={step} totalSteps={3} />}
              
              {error && (
                <div style={{ background: "rgba(255, 71, 87, 0.1)", border: `1px solid ${COLORS.red}`, color: COLORS.red, padding: 16, borderRadius: 4, marginBottom: 24, fontSize: 14 }}>
                  {error}
                </div>
              )}
              
              {step === 0 && <TypeSelect onSelect={selectType} />}
              
              {step === 1 && (
                <FormStep title="Tell us about yourself" onPrev={() => setStep(0)} onNext={() => validate(1) && setStep(2)} canProgress={validate(1)}>
                  <Field label="Full Name *"><Input value={data.full_name} onChange={v => update("full_name", v)} placeholder="John Smith" /></Field>
                  <Field label="Display Name *" hint="How you'll appear publicly"><Input value={data.display_name} onChange={v => update("display_name", v)} placeholder="John Smith" /></Field>
                  <Row>
                    <Field label="Email *"><Input type="email" value={data.email} onChange={v => update("email", v)} placeholder="you@example.com" /></Field>
                    <Field label="Phone"><Input type="tel" value={data.phone} onChange={v => update("phone", v)} placeholder="+44..." /></Field>
                  </Row>
                  <Row>
                    <Field label="Country *"><Input value={data.country} onChange={v => update("country", v)} placeholder="England" /></Field>
                    <Field label="Region Focus"><Input value={data.region_focus} onChange={v => update("region_focus", v)} placeholder="UK / Europe / Global" /></Field>
                  </Row>
                </FormStep>
              )}
              
              {step === 2 && (
                <FormStep title="Your Football Background" onPrev={() => setStep(1)} onNext={() => validate(2) && setStep(3)} canProgress={validate(2)}>
                  <Field label="Professional Background *" hint="Min 50 chars. Tell us your story.">
                    <Textarea value={data.professional_background} onChange={v => update("professional_background", v)} placeholder="e.g., Former PGMOL referee for 20 years. Officiated 250+ Premier League matches..." rows={4} />
                  </Field>
                  <Row>
                    <Field label="Current Role"><Input value={data.current_role} onChange={v => update("current_role", v)} placeholder="Sky Sports pundit" /></Field>
                    <Field label="Years in Football"><Input type="number" value={data.years_in_football} onChange={v => update("years_in_football", v)} placeholder="20" /></Field>
                  </Row>
                  <Field label="Clubs You Support" hint="Comma-separated"><Input value={data.clubs_supported} onChange={v => update("clubs_supported", v)} placeholder="Liverpool, Stocksbridge Park Steels" /></Field>
                  <Field label="Expertise Areas" hint="Comma-separated"><Input value={data.expertise_areas} onChange={v => update("expertise_areas", v)} placeholder="Refereeing, Tactics, Youth Development" /></Field>
                  
                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${COLORS.hairline}` }}>
                    <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.gold, letterSpacing: "0.2em", marginBottom: 16 }}>SOCIAL & ONLINE PRESENCE (OPTIONAL)</div>
                    <Field label="Website"><Input value={data.website} onChange={v => update("website", v)} placeholder="https://yoursite.com" /></Field>
                    <Row>
                      <Field label="Twitter/X"><Input value={data.social_twitter} onChange={v => update("social_twitter", v)} placeholder="@username" /></Field>
                      <Field label="LinkedIn"><Input value={data.social_linkedin} onChange={v => update("social_linkedin", v)} placeholder="LinkedIn URL" /></Field>
                    </Row>
                    <Row>
                      <Field label="YouTube"><Input value={data.social_youtube} onChange={v => update("social_youtube", v)} placeholder="Channel URL" /></Field>
                      <Field label="Followers (total)" hint="Across platforms"><Input type="number" value={data.follower_count} onChange={v => update("follower_count", v)} placeholder="50000" /></Field>
                    </Row>
                  </div>
                </FormStep>
              )}
              
              {step === 3 && (
                <FormStep title="Your Vision for FOFA" onPrev={() => setStep(2)} onSubmit={submit} canProgress={validate(3)} submitting={submitting} isFinal>
                  <Field label="Why FOFA? *">
                    <Textarea value={data.why_fofa} onChange={v => update("why_fofa", v)} placeholder="Why does FOFA's mission resonate with you?" rows={3} />
                  </Field>
                  <Field label="What can you offer? *">
                    <Textarea value={data.what_they_offer} onChange={v => update("what_they_offer", v)} placeholder="What value will you bring to the platform?" rows={3} />
                  </Field>
                  <Field label="References (Optional)" hint="People who can vouch for you">
                    <Textarea value={data.references} onChange={v => update("references", v)} placeholder="e.g., John Smith, Director of Football at FA" rows={2} />
                  </Field>
                  
                  <div style={{ marginTop: 24, padding: 16, background: COLORS.bgSoft, border: `1px solid ${COLORS.hairline}`, borderRadius: 4, fontSize: 13, color: COLORS.body, opacity: 0.8, lineHeight: 1.6 }}>
                    <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: COLORS.gold, letterSpacing: "0.2em", marginBottom: 8 }}>⚡ AI VERIFICATION + HUMAN REVIEW</div>
                    Your application will be screened by AI and reviewed by our team. Expert applications are held to high standards. Decisions within 5-7 business days.
                  </div>
                </FormStep>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TypeSelect({ onSelect }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, opacity: 0, animation: "fadeIn 0.3s ease-out forwards" }}>
      <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.gold, letterSpacing: "0.2em", marginBottom: 8 }}>SELECT YOUR ROLE</div>
      {EXPERT_TYPES.map(type => (
        <button
          key={type.id}
          onClick={() => onSelect(type.id)}
          style={{
            background: COLORS.bgSoft,
            border: `1px solid ${COLORS.hairline}`,
            borderRadius: 4,
            padding: 24,
            cursor: "pointer",
            textAlign: "left",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.green; e.currentTarget.style.transform = "translateX(4px)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.hairline; e.currentTarget.style.transform = "translateX(0)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 36 }}>{type.icon}</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900, color: "#F2F5EE", margin: "0 0 4px", letterSpacing: "-0.01em" }}>
                {type.title}
              </h3>
              <p style={{ color: COLORS.body, opacity: 0.7, fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                {type.description}
              </p>
            </div>
            <div style={{ fontSize: 18, color: COLORS.green }}>→</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function ProgressBar({ step, totalSteps }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < step ? COLORS.green : COLORS.hairline, transition: "background 0.3s" }} />
        ))}
      </div>
      <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.6, letterSpacing: "0.15em", textTransform: "uppercase" }}>
        Step {step} of {totalSteps}
      </div>
    </div>
  );
}

function FormStep({ title, children, onPrev, onNext, onSubmit, canProgress, submitting, isFinal }) {
  return (
    <div style={{ background: COLORS.bgSoft, border: `1px solid ${COLORS.hairline}`, borderRadius: 8, padding: "32px 24px", opacity: 0, animation: "fadeIn 0.3s ease-out forwards" }}>
      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, color: "#F2F5EE", margin: "0 0 24px", letterSpacing: "-0.01em" }}>
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>{children}</div>
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${COLORS.hairline}`, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        {onPrev ? <button onClick={onPrev} style={btnGhost}>← Back</button> : <div />}
        {isFinal ? (
          <button onClick={onSubmit} disabled={!canProgress || submitting} style={{ ...btnPrimary, opacity: (!canProgress || submitting) ? 0.5 : 1 }}>
            {submitting ? "Submitting..." : "Submit Application →"}
          </button>
        ) : (
          <button onClick={onNext} disabled={!canProgress} style={{ ...btnPrimary, opacity: !canProgress ? 0.5 : 1 }}>
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}

function ResultView({ result }) {
  const isRejected = result.status === "rejected";
  return (
    <div style={{ background: COLORS.bgSoft, border: `1px solid ${isRejected ? COLORS.red : COLORS.gold}`, borderRadius: 8, padding: 40, textAlign: "center", opacity: 0, animation: "fadeIn 0.4s ease-out forwards" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>{isRejected ? "❌" : "⏳"}</div>
      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, color: isRejected ? COLORS.red : COLORS.gold, margin: "0 0 16px" }}>
        {isRejected ? "Application Not Approved" : "Under Review"}
      </h2>
      <p style={{ color: COLORS.body, fontSize: 16, lineHeight: 1.6, margin: "0 auto 24px", maxWidth: 480 }}>
        {result.ai_response}
      </p>
      <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.hairline}`, borderRadius: 4, padding: 16, marginBottom: 24, fontFamily: "'DM Mono', monospace", fontSize: 12, color: COLORS.body, textAlign: "left" }}>
        <div><span style={{ opacity: 0.6 }}>APPLICATION ID:</span> {result.application_id}</div>
        <div><span style={{ opacity: 0.6 }}>STATUS:</span> <span style={{ color: COLORS.gold }}>{result.status.toUpperCase()}</span></div>
      </div>
      <a href="/" style={btnPrimary}>Back to Site</a>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.85, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11, color: COLORS.body, opacity: 0.5, marginTop: 4, fontStyle: "italic" }}>{hint}</div>}
    </div>
  );
}

function Row({ children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="form-row">
      <style>{`@media (max-width: 600px) { .form-row { grid-template-columns: 1fr !important; } }`}</style>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} onFocus={(e) => e.target.style.borderColor = COLORS.green} onBlur={(e) => e.target.style.borderColor = COLORS.hairlineStrong} />;
}

function Textarea({ value, onChange, placeholder, rows }) {
  return <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} onFocus={(e) => e.target.style.borderColor = COLORS.green} onBlur={(e) => e.target.style.borderColor = COLORS.hairlineStrong} />;
}

const inputStyle = { width: "100%", background: COLORS.bg, border: `1px solid ${COLORS.hairlineStrong}`, color: "#F2F5EE", padding: "12px 14px", borderRadius: 4, fontSize: 14, fontFamily: "'Crimson Pro', serif", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" };
const btnPrimary = { background: COLORS.green, color: COLORS.bg, border: "none", padding: "14px 28px", fontSize: 13, fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, borderRadius: 4, cursor: "pointer", textDecoration: "none", display: "inline-block" };
const btnGhost = { background: "transparent", color: COLORS.body, border: `1px solid ${COLORS.hairlineStrong}`, padding: "14px 28px", fontSize: 13, fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", borderRadius: 4, cursor: "pointer" };

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,500;1,400&family=DM+Mono:wght@400;500&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    `}</style>
  );
}
