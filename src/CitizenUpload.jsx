import { useState, useRef } from "react";
import { supabase } from "./supabase";

const INCIDENT_TYPES = [
  { key: "structure_fire", label: "Fire", icon: "🔥", description: "Building or vehicle fire" },
  { key: "medical", label: "Medical", icon: "🫀", description: "Someone needs medical help" },
  { key: "vehicle_accident", label: "Accident", icon: "🚗", description: "Vehicle collision or crash" },
  { key: "silent_witness", label: "Disturbance", icon: "👁", description: "Harassment or suspicious activity" },
  { key: "hazmat", label: "Hazard", icon: "⚠️", description: "Chemical spill or danger" },
  { key: "other", label: "Other", icon: "📢", description: "Something else" },
];

export default function CitizenUpload({ onBack }) {
  const [step, setStep] = useState(1);
  const [incidentType, setIncidentType] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [error, setError] = useState(null);
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
      () => {
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

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      setUploadProgress("Uploading media...");
      const fileExt = mediaFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(filePath, mediaFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('submissions')
        .getPublicUrl(filePath);
      const mediaUrl = urlData.publicUrl;

      setUploadProgress("Saving to database...");
      const { error: dbError } = await supabase
        .from('submissions')
        .insert({
          incident_type: incidentType.key,
          description,
          media_url: mediaUrl,
          media_type: mediaPreview.type,
          latitude: location?.lat || null,
          longitude: location?.lng || null,
          status: 'pending_review',
        });
      if (dbError) throw dbError;

      setUploadProgress("");
      setSubmitting(false);
      setStep(4);
    } catch (err) {
      setError(`Something went wrong: ${err.message}`);
      setUploadProgress("");
      setSubmitting(false);
    }
  };

  const canProceedStep2 = mediaFile !== null;
  const canSubmit = description.trim().length > 0;

  // ── Step 1 ────────────────────────────────────────────────────────────────
  if (step === 1) return (
    <div style={s.page}>
      <style>{mq}</style>
      <div style={s.card}>
        <button onClick={onBack} style={s.backBtn}>← Back to Dashboard</button>
        <div style={s.header}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🛡️</div>
          <h1 style={s.title}>City Shield</h1>
          <p style={s.subtitle}>Submit an emergency report</p>
        </div>
        <StepBar current={1} />
        <h2 style={s.sectionTitle}>What's happening?</h2>
        <p style={s.sectionSubtitle}>Select the type of emergency</p>
        <div style={s.typeGrid}>
          {INCIDENT_TYPES.map(type => (
            <button
              key={type.key}
              onClick={() => { setIncidentType(type); setStep(2); getLocation(); }}
              style={s.typeBtn}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.15)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
            >
              <span style={{ fontSize: 32 }}>{type.icon}</span>
              <span style={s.typeBtnLabel}>{type.label}</span>
              <span style={s.typeBtnDesc}>{type.description}</span>
            </button>
          ))}
        </div>
        <div style={s.disclaimer}>
          ⚠️ For life-threatening emergencies always call <strong>911</strong> first.
        </div>
      </div>
    </div>
  );

  // ── Step 2 ────────────────────────────────────────────────────────────────
  if (step === 2) return (
    <div style={s.page}>
      <style>{mq}</style>
      <div style={s.card}>
        <button onClick={() => setStep(1)} style={s.backBtn}>← Back</button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 32 }}>{incidentType.icon}</span>
          <div>
            <h2 style={{ ...s.title, fontSize: 18, marginBottom: 2 }}>{incidentType.label}</h2>
            <p style={{ ...s.subtitle, margin: 0 }}>{incidentType.description}</p>
          </div>
        </div>
        <StepBar current={2} />
        <h2 style={s.sectionTitle}>Add photo or video</h2>
        <p style={s.sectionSubtitle}>Visual evidence helps dispatchers respond faster</p>

        <div
          onClick={() => fileInputRef.current?.click()}
          style={s.uploadBox}
          onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(99,102,241,0.8)"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"}
        >
          {mediaPreview ? (
            <div>
              {mediaPreview.type === "photo"
                ? <img src={mediaPreview.url} alt="preview" style={{ maxHeight: 220, maxWidth: "100%", borderRadius: 8, marginBottom: 8 }} />
                : <video src={mediaPreview.url} controls style={{ maxHeight: 220, maxWidth: "100%", borderRadius: 8, marginBottom: 8 }} />
              }
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#10B981" }}>
                ✅ {mediaPreview.name} — tap to change
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 48, marginBottom: 10 }}>📷</div>
              <div style={{ color: "#818CF8", fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Tap to add photo or video</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#475569" }}>JPG, PNG, MP4 supported</div>
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*,video/*" capture="environment" onChange={handleFileChange} style={{ display: "none" }} />

        <div style={{ ...s.gpsPill, background: location ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${location ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.08)"}` }}>
          {locationLoading
            ? <><span>⏳</span><span style={{ fontSize: 13, color: "#94A3B8" }}>Getting your location...</span></>
            : location
            ? <><span>📍</span><span style={{ fontSize: 13, color: "#10B981", fontFamily: "'DM Mono', monospace" }}>GPS locked — ±{location.accuracy}m</span></>
            : <><span>📍</span><span style={{ fontSize: 13, color: "#EF4444" }}>{locationError || "Location not captured"}</span>
                <button onClick={getLocation} style={{ marginLeft: "auto", fontSize: 11, color: "#6366F1", background: "none", border: "none", cursor: "pointer" }}>Retry</button>
              </>
          }
        </div>

        <button
          onClick={() => setStep(3)}
          disabled={!canProceedStep2}
          style={{ ...s.primaryBtn, opacity: canProceedStep2 ? 1 : 0.4, cursor: canProceedStep2 ? "pointer" : "not-allowed" }}
        >
          Continue →
        </button>
        <p style={{ ...s.disclaimer, marginTop: 14 }}>Your identity is protected. Dispatchers never see your name.</p>
      </div>
    </div>
  );

  // ── Step 3 ────────────────────────────────────────────────────────────────
  if (step === 3) return (
    <div style={s.page}>
      <style>{mq}</style>
      <div style={s.card}>
        <button onClick={() => setStep(2)} style={s.backBtn}>← Back</button>
        <StepBar current={3} />
        <h2 style={s.sectionTitle}>Describe what you see</h2>
        <p style={s.sectionSubtitle}>Floor number, number of people, visible hazards</p>

        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="e.g. Flames visible from 2nd floor window, smoke from roof. About 3 people outside."
          rows={5}
          style={s.textarea}
        />

        <div style={s.summaryBox}>
          <div style={s.summaryLabel}>Submission Summary</div>
          {[
            { label: "Type", value: `${incidentType.icon} ${incidentType.label}` },
            { label: "Media", value: `✅ ${mediaPreview?.type === "video" ? "Video" : "Photo"} attached` },
            { label: "Location", value: location ? `📍 GPS locked ±${location.accuracy}m` : "❌ Not captured" },
          ].map((row, i) => (
            <div key={i} style={s.summaryRow}>
              <span style={s.summaryKey}>{row.label}</span>
              <span style={s.summaryVal}>{row.value}</span>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: "#EF4444" }}>
            {error}
          </div>
        )}
        {submitting && (
          <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: "#818CF8", fontFamily: "'DM Mono', monospace" }}>
            ⏳ {uploadProgress}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          style={{ ...s.primaryBtn, opacity: canSubmit && !submitting ? 1 : 0.4, cursor: canSubmit && !submitting ? "pointer" : "not-allowed" }}
        >
          {submitting ? "Uploading..." : "🚨 Submit Report"}
        </button>
        <p style={{ ...s.disclaimer, marginTop: 14 }}>False reports are a criminal offence and are cryptographically logged.</p>
      </div>
    </div>
  );

  // ── Step 4 ────────────────────────────────────────────────────────────────
  if (step === 4) return (
    <div style={s.page}>
      <style>{mq}</style>
      <div style={{ ...s.card, textAlign: "center" }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>✅</div>
        <h2 style={{ ...s.title, marginBottom: 8 }}>Report Submitted!</h2>
        <p style={{ color: "#94A3B8", marginBottom: 24, lineHeight: 1.7, fontSize: 15 }}>
          Your photo/video has been saved and your report is now in the dispatcher's queue.
        </p>
        <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: 16, marginBottom: 24, textAlign: "left" }}>
          <div style={s.summaryLabel}>What happens next</div>
          {[
            "Your media is saved securely ✅",
            "AI verification runs in ~8 seconds",
            "Dispatcher receives your media card",
            "Your identity remains fully protected",
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, fontSize: 14, color: "#94A3B8" }}>
              <span style={{ color: "#10B981" }}>→</span> {item}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => { setStep(1); setIncidentType(null); setMediaFile(null); setMediaPreview(null); setDescription(""); setLocation(null); setError(null); }}
            style={{ ...s.primaryBtn, flex: 1 }}
          >
            Submit Another
          </button>
          <button onClick={onBack} style={{ ...s.secondaryBtn, flex: 1 }}>
            Dashboard
          </button>
        </div>
        <p style={{ ...s.disclaimer, marginTop: 16 }}>Always call <strong>911</strong> for life-threatening emergencies.</p>
      </div>
    </div>
  );
}

// ─── Step Bar ─────────────────────────────────────────────────────────────────
function StepBar({ current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 28, justifyContent: "center" }}>
      {["Type", "Media", "Details", "Done"].map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center" }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: i < current - 1 ? "#10B981" : i === current - 1 ? "#6366F1" : "rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontFamily: "'DM Mono', monospace",
            color: i <= current - 1 ? "white" : "#475569",
          }}>
            {i < current - 1 ? "✓" : i + 1}
          </div>
          <span style={{ fontSize: 11, color: i === current - 1 ? "#818CF8" : i < current - 1 ? "#10B981" : "#475569", marginLeft: 5, fontFamily: "'DM Mono', monospace" }}>{s}</span>
          {i < 3 && <div style={{ width: 16, height: 1, background: "rgba(255,255,255,0.08)", margin: "0 8px" }} />}
        </div>
      ))}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: "100vh", background: "#080E17",
    display: "flex", alignItems: "flex-start", justifyContent: "center",
    padding: "20px 16px", fontFamily: "'Space Grotesk', sans-serif", color: "#F1F5F9",
  },
  card: {
    width: "100%", maxWidth: 500,
    background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, padding: "24px 20px",
  },
  backBtn: {
    background: "none", border: "none", color: "#475569",
    fontFamily: "'DM Mono', monospace", fontSize: 12, cursor: "pointer",
    padding: 0, marginBottom: 20, display: "block",
  },
  header: { textAlign: "center", marginBottom: 24 },
  title: { fontWeight: 700, fontSize: 26, color: "#F1F5F9", margin: "0 0 4px 0" },
  subtitle: { color: "#64748B", fontSize: 13, margin: 0, fontFamily: "'DM Mono', monospace" },
  sectionTitle: { fontWeight: 700, fontSize: 18, color: "#F1F5F9", margin: "0 0 6px 0" },
  sectionSubtitle: { color: "#64748B", fontSize: 13, margin: "0 0 18px 0", lineHeight: 1.5 },
  typeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 },
  typeBtn: {
    padding: "18px 12px", borderRadius: 12, cursor: "pointer",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
    transition: "all 0.15s", textAlign: "center",
  },
  typeBtnLabel: { fontWeight: 600, fontSize: 14, color: "#F1F5F9" },
  typeBtnDesc: { fontSize: 10, color: "#64748B", fontFamily: "'DM Mono', monospace", lineHeight: 1.3 },
  uploadBox: {
    border: "2px dashed rgba(99,102,241,0.4)", borderRadius: 14,
    padding: "28px 20px", textAlign: "center", cursor: "pointer",
    background: "rgba(99,102,241,0.04)", marginBottom: 14, transition: "border-color 0.2s",
  },
  gpsPill: {
    padding: "12px 14px", borderRadius: 10, marginBottom: 18,
    display: "flex", alignItems: "center", gap: 8,
  },
  primaryBtn: {
    width: "100%", padding: "15px 20px", borderRadius: 12,
    background: "linear-gradient(135deg, #6366F1, #4F46E5)",
    border: "none", color: "white",
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16,
    cursor: "pointer", transition: "opacity 0.15s",
  },
  secondaryBtn: {
    padding: "15px 20px", borderRadius: 12,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8",
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 16, cursor: "pointer",
  },
  textarea: {
    width: "100%", padding: 14, borderRadius: 10,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#F1F5F9", fontSize: 15, fontFamily: "'Space Grotesk', sans-serif",
    resize: "vertical", outline: "none", boxSizing: "border-box", marginBottom: 18, lineHeight: 1.6,
  },
  summaryBox: {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 10, padding: 14, marginBottom: 18,
  },
  summaryLabel: {
    fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#64748B",
    letterSpacing: 1, marginBottom: 10, textTransform: "uppercase",
  },
  summaryRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    paddingBottom: 8, marginBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  summaryKey: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#64748B" },
  summaryVal: { fontSize: 13, color: "#CBD5E1" },
  disclaimer: {
    fontSize: 11, color: "#475569", textAlign: "center",
    lineHeight: 1.5, fontFamily: "'DM Mono', monospace",
  },
};

// Media query CSS for mobile
const mq = `
  @media (max-width: 480px) {
    .cs-card { padding: 18px 14px !important; }
    .cs-type-grid { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
    .cs-type-btn { padding: 14px 8px !important; }
  }
`;
