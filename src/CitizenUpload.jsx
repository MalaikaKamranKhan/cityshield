import { useState, useRef } from "react";

const INCIDENT_TYPES = [
  { key: "structure_fire", label: "Fire", icon: "🔥", description: "Building or vehicle fire" },
  { key: "medical", label: "Medical", icon: "🫀", description: "Someone needs medical help" },
  { key: "vehicle_accident", label: "Accident", icon: "🚗", description: "Vehicle collision or crash" },
  { key: "silent_witness", label: "Disturbance", icon: "👁", description: "Harassment or suspicious activity" },
  { key: "hazmat", label: "Hazard", icon: "⚠️", description: "Chemical spill or danger" },
  { key: "other", label: "Other", icon: "📢", description: "Something else" },
];

export default function CitizenUpload({ onBack }) {
  const [step, setStep] = useState(1); // 1=type, 2=media, 3=details, 4=submitted
  const [incidentType, setIncidentType] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const getLocation = () => {
    setLocationLoading(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Your browser doesn't support GPS");
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) });
        setLocationLoading(false);
      },
      (err) => {
        setLocationError("Could not get your location. Please allow location access.");
        setLocationLoading(false);
      }
    );
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setMediaPreview({ url, type: file.type.startsWith("video") ? "video" : "photo", name: file.name });
  };

  const handleSubmit = () => {
    setSubmitting(true);
    // Simulate submission delay
    setTimeout(() => {
      setSubmitting(false);
      setStep(4);
    }, 2000);
  };

  const canProceedStep2 = mediaFile !== null;
  const canProceedStep3 = location !== null;
  const canSubmit = description.trim().length > 0;

  // ── Step 1: Choose incident type ──────────────────────────────────────────
  if (step === 1) return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button onClick={onBack} style={styles.backBtn}>← Back to Dashboard</button>

        <div style={styles.header}>
          <div style={styles.headerIcon}>🛡️</div>
          <h1 style={styles.title}>City Shield</h1>
          <p style={styles.subtitle}>Submit an emergency report</p>
        </div>

        <div style={styles.stepIndicator}>
          {["Type", "Media", "Details", "Submit"].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                background: i === 0 ? "#6366F1" : "rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontFamily: "'DM Mono', monospace",
                color: i === 0 ? "white" : "#475569",
              }}>{i + 1}</div>
              <span style={{ fontSize: 10, color: i === 0 ? "#818CF8" : "#475569", marginLeft: 4, fontFamily: "'DM Mono', monospace" }}>{s}</span>
              {i < 3 && <div style={{ width: 20, height: 1, background: "rgba(255,255,255,0.08)", margin: "0 8px" }} />}
            </div>
          ))}
        </div>

        <h2 style={styles.sectionTitle}>What's happening?</h2>
        <p style={styles.sectionSubtitle}>Select the type of emergency you're reporting</p>

        <div style={styles.typeGrid}>
          {INCIDENT_TYPES.map(type => (
            <button
              key={type.key}
              onClick={() => { setIncidentType(type); setStep(2); getLocation(); }}
              style={{
                ...styles.typeBtn,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.1)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
            >
              <span style={{ fontSize: 28 }}>{type.icon}</span>
              <span style={styles.typeBtnLabel}>{type.label}</span>
              <span style={styles.typeBtnDesc}>{type.description}</span>
            </button>
          ))}
        </div>

        <div style={styles.disclaimer}>
          ⚠️ For life-threatening emergencies always call <strong>911</strong> first.
          City Shield supplements — never replaces — emergency services.
        </div>
      </div>
    </div>
  );

  // ── Step 2: Upload media ──────────────────────────────────────────────────
  if (step === 2) return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button onClick={() => setStep(1)} style={styles.backBtn}>← Back</button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <span style={{ fontSize: 28 }}>{incidentType.icon}</span>
          <div>
            <h2 style={{ ...styles.title, fontSize: 20, marginBottom: 2 }}>{incidentType.label}</h2>
            <p style={styles.sectionSubtitle}>{incidentType.description}</p>
          </div>
        </div>

        <div style={styles.stepIndicator}>
          {["Type", "Media", "Details", "Submit"].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                background: i <= 1 ? "#6366F1" : "rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontFamily: "'DM Mono', monospace",
                color: i <= 1 ? "white" : "#475569",
              }}>{i < 1 ? "✓" : i + 1}</div>
              <span style={{ fontSize: 10, color: i === 1 ? "#818CF8" : i < 1 ? "#10B981" : "#475569", marginLeft: 4, fontFamily: "'DM Mono', monospace" }}>{s}</span>
              {i < 3 && <div style={{ width: 20, height: 1, background: "rgba(255,255,255,0.08)", margin: "0 8px" }} />}
            </div>
          ))}
        </div>

        <h2 style={styles.sectionTitle}>Add photo or video</h2>
        <p style={styles.sectionSubtitle}>Visual evidence helps dispatchers assess the situation faster</p>

        {/* Upload area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: "2px dashed rgba(99,102,241,0.4)", borderRadius: 12,
            padding: 32, textAlign: "center", cursor: "pointer",
            background: "rgba(99,102,241,0.04)", marginBottom: 16,
            transition: "all 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(99,102,241,0.8)"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"}
        >
          {mediaPreview ? (
            <div>
              {mediaPreview.type === "photo" ? (
                <img src={mediaPreview.url} alt="preview" style={{ maxHeight: 200, maxWidth: "100%", borderRadius: 8, marginBottom: 8 }} />
              ) : (
                <video src={mediaPreview.url} controls style={{ maxHeight: 200, maxWidth: "100%", borderRadius: 8, marginBottom: 8 }} />
              )}
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#10B981" }}>
                ✅ {mediaPreview.name} — tap to change
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
              <div style={{ color: "#818CF8", fontWeight: 600, marginBottom: 4 }}>Tap to add photo or video</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#475569" }}>JPG, PNG, MP4 supported</div>
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileChange} style={{ display: "none" }} />

        {/* GPS status */}
        <div style={{
          padding: "10px 14px", borderRadius: 8, marginBottom: 20,
          background: location ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${location ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.08)"}`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {locationLoading ? (
            <><span>⏳</span><span style={{ fontSize: 12, color: "#94A3B8" }}>Getting your location...</span></>
          ) : location ? (
            <><span>📍</span><span style={{ fontSize: 12, color: "#10B981", fontFamily: "'DM Mono', monospace" }}>GPS locked — ±{location.accuracy}m accuracy</span></>
          ) : (
            <><span>📍</span><span style={{ fontSize: 12, color: "#EF4444" }}>{locationError || "Location not captured"}</span>
              <button onClick={getLocation} style={{ marginLeft: "auto", fontSize: 10, color: "#6366F1", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono', monospace" }}>Retry</button>
            </>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setStep(3)}
            disabled={!canProceedStep2}
            style={{
              ...styles.primaryBtn,
              opacity: canProceedStep2 ? 1 : 0.4,
              cursor: canProceedStep2 ? "pointer" : "not-allowed",
              flex: 1,
            }}
          >
            Continue →
          </button>
        </div>

        <p style={{ ...styles.disclaimer, marginTop: 12 }}>
          Your identity is protected. Dispatchers see your media but never your name or phone number.
        </p>
      </div>
    </div>
  );

  // ── Step 3: Details ───────────────────────────────────────────────────────
  if (step === 3) return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button onClick={() => setStep(2)} style={styles.backBtn}>← Back</button>

        <div style={styles.stepIndicator}>
          {["Type", "Media", "Details", "Submit"].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                background: i <= 2 ? "#6366F1" : "rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontFamily: "'DM Mono', monospace",
                color: i <= 2 ? "white" : "#475569",
              }}>{i < 2 ? "✓" : i + 1}</div>
              <span style={{ fontSize: 10, color: i === 2 ? "#818CF8" : i < 2 ? "#10B981" : "#475569", marginLeft: 4, fontFamily: "'DM Mono', monospace" }}>{s}</span>
              {i < 3 && <div style={{ width: 20, height: 1, background: "rgba(255,255,255,0.08)", margin: "0 8px" }} />}
            </div>
          ))}
        </div>

        <h2 style={styles.sectionTitle}>Describe what you see</h2>
        <p style={styles.sectionSubtitle}>Be as specific as possible — floor number, number of people, visible hazards</p>

        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="e.g. Flames visible from 2nd floor window, smoke coming from the roof. About 3 people outside."
          rows={5}
          style={{
            width: "100%", padding: 14, borderRadius: 10,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#F1F5F9", fontSize: 14, fontFamily: "'Space Grotesk', sans-serif",
            resize: "vertical", outline: "none", boxSizing: "border-box", marginBottom: 20,
            lineHeight: 1.6,
          }}
        />

        {/* Summary before submit */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 14, marginBottom: 20 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#64748B", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>
            Submission Summary
          </div>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Type</span>
            <span style={styles.summaryValue}>{incidentType.icon} {incidentType.label}</span>
          </div>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Media</span>
            <span style={styles.summaryValue}>✅ {mediaPreview?.type === "video" ? "Video" : "Photo"} attached</span>
          </div>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Location</span>
            <span style={styles.summaryValue}>{location ? `📍 GPS locked ±${location.accuracy}m` : "❌ Not captured"}</span>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          style={{
            ...styles.primaryBtn,
            width: "100%",
            opacity: canSubmit && !submitting ? 1 : 0.4,
            cursor: canSubmit && !submitting ? "pointer" : "not-allowed",
          }}
        >
          {submitting ? "⏳ Submitting securely..." : "🚨 Submit Report"}
        </button>

        <p style={{ ...styles.disclaimer, marginTop: 12 }}>
          Submitting false reports is a criminal offence. All submissions are cryptographically logged.
        </p>
      </div>
    </div>
  );

  // ── Step 4: Confirmation ──────────────────────────────────────────────────
  if (step === 4) return (
    <div style={styles.container}>
      <div style={{ ...styles.card, textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <h2 style={{ ...styles.title, marginBottom: 8 }}>Report Submitted</h2>
        <p style={{ color: "#94A3B8", marginBottom: 24, lineHeight: 1.6 }}>
          Your report is being verified and will reach the dispatcher within seconds.
          Stay safe and move to a secure location if needed.
        </p>

        <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: 16, marginBottom: 24, textAlign: "left" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#10B981", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>
            What happens next
          </div>
          {[
            "AI verification runs in ~8 seconds",
            "Dispatcher receives your media card",
            "Resources dispatched based on verified intel",
            "Your identity remains fully protected",
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 12, color: "#94A3B8" }}>
              <span style={{ color: "#10B981" }}>→</span> {item}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => { setStep(1); setIncidentType(null); setMediaFile(null); setMediaPreview(null); setDescription(""); setLocation(null); }}
            style={{ ...styles.primaryBtn, flex: 1 }}
          >
            Submit Another Report
          </button>
          <button onClick={onBack} style={{ ...styles.secondaryBtn, flex: 1 }}>
            Back to Dashboard
          </button>
        </div>

        <p style={{ ...styles.disclaimer, marginTop: 16 }}>
          Always call <strong>911</strong> for life-threatening emergencies.
        </p>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  container: {
    minHeight: "100vh",
    background: "#080E17",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "24px 16px",
    fontFamily: "'Space Grotesk', sans-serif",
    color: "#F1F5F9",
  },
  card: {
    width: "100%",
    maxWidth: 480,
    background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 28,
  },
  backBtn: {
    background: "none", border: "none", color: "#475569",
    fontFamily: "'DM Mono', monospace", fontSize: 11, cursor: "pointer",
    padding: 0, marginBottom: 20, display: "block",
  },
  header: {
    textAlign: "center", marginBottom: 24,
  },
  headerIcon: {
    fontSize: 36, marginBottom: 8,
  },
  title: {
    fontWeight: 700, fontSize: 24, color: "#F1F5F9", margin: "0 0 4px 0",
  },
  subtitle: {
    color: "#64748B", fontSize: 13, margin: 0, fontFamily: "'DM Mono', monospace",
  },
  stepIndicator: {
    display: "flex", alignItems: "center", marginBottom: 28,
    justifyContent: "center",
  },
  sectionTitle: {
    fontWeight: 700, fontSize: 17, color: "#F1F5F9", margin: "0 0 6px 0",
  },
  sectionSubtitle: {
    color: "#64748B", fontSize: 12, margin: "0 0 20px 0", lineHeight: 1.5,
  },
  typeGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20,
  },
  typeBtn: {
    padding: "16px 12px", borderRadius: 10, cursor: "pointer",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    transition: "all 0.15s", textAlign: "center",
  },
  typeBtnLabel: {
    fontWeight: 600, fontSize: 13, color: "#F1F5F9",
  },
  typeBtnDesc: {
    fontSize: 10, color: "#64748B", fontFamily: "'DM Mono', monospace",
  },
  primaryBtn: {
    padding: "13px 20px", borderRadius: 10,
    background: "linear-gradient(135deg, #6366F1, #4F46E5)",
    border: "none", color: "white",
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14,
    cursor: "pointer", transition: "opacity 0.15s",
  },
  secondaryBtn: {
    padding: "13px 20px", borderRadius: 10,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8",
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14,
    cursor: "pointer",
  },
  disclaimer: {
    fontSize: 11, color: "#475569", textAlign: "center", lineHeight: 1.5,
    fontFamily: "'DM Mono', monospace",
  },
  summaryRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    paddingBottom: 8, marginBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  summaryLabel: {
    fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#64748B",
  },
  summaryValue: {
    fontSize: 12, color: "#CBD5E1",
  },
};