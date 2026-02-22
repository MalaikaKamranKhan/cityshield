import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import CitizenUpload from "./CitizenUpload";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_SUBMISSIONS = [
  {
    id: "sub_001",
    incidentType: "structure_fire",
    mediaType: "video",
    thumbnail: null,
    address: "2847 Meridian Ave NW",
    district: "District 4",
    location: { lat: 40.7489, lng: -73.9684 },
    submittedAt: new Date(Date.now() - 42000),
    verifiedAt: new Date(Date.now() - 35000),
    trustScore: 0.91,
    confidenceLabel: "high",
    severityEstimate: 7,
    aiAdvisory: {
      sceneCategory: "Active Structure Fire",
      notes: "Visible flames 2nd floor, 3 windows involved, smoke column present",
      faceBlurred: true,
    },
    gpsValidated: true,
    distanceFromStation: 1.2,
    accountAge: "14 months",
    priorSubmissions: 3,
    status: "pending_review",
    color: "#FF4D4D",
  },
  {
    id: "sub_002",
    incidentType: "medical",
    mediaType: "photo",
    thumbnail: null,
    address: "520 Commerce Blvd, Unit 3F",
    district: "District 7",
    location: { lat: 40.7614, lng: -73.9776 },
    submittedAt: new Date(Date.now() - 180000),
    verifiedAt: new Date(Date.now() - 172000),
    trustScore: 0.76,
    confidenceLabel: "medium",
    severityEstimate: 5,
    aiAdvisory: {
      sceneCategory: "Medical Emergency",
      notes: "Person unresponsive on floor. Bystanders present. AED visible nearby.",
      faceBlurred: true,
    },
    gpsValidated: true,
    distanceFromStation: 0.8,
    accountAge: "6 months",
    priorSubmissions: 1,
    status: "accepted",
    color: "#F59E0B",
  },
  {
    id: "sub_003",
    incidentType: "vehicle_accident",
    mediaType: "video",
    thumbnail: null,
    address: "I-90 W, Mile Marker 44",
    district: "Highway Patrol",
    location: { lat: 40.7282, lng: -73.9942 },
    submittedAt: new Date(Date.now() - 310000),
    verifiedAt: new Date(Date.now() - 301000),
    trustScore: 0.88,
    confidenceLabel: "high",
    severityEstimate: 8,
    aiAdvisory: {
      sceneCategory: "Multi-Vehicle Collision",
      notes: "3+ vehicles involved. One vehicle off-road. Fluids visible on pavement.",
      faceBlurred: true,
    },
    gpsValidated: true,
    distanceFromStation: 4.1,
    accountAge: "22 months",
    priorSubmissions: 7,
    status: "escalated",
    color: "#EF4444",
  },
  {
    id: "sub_004",
    incidentType: "silent_witness",
    mediaType: "photo",
    thumbnail: null,
    address: "Central Park — Traverse Rd",
    district: "Transit/Park",
    location: { lat: 40.7831, lng: -73.9712 },
    submittedAt: new Date(Date.now() - 520000),
    verifiedAt: new Date(Date.now() - 511000),
    trustScore: 0.63,
    confidenceLabel: "medium",
    severityEstimate: 4,
    aiAdvisory: {
      sceneCategory: "Harassment / Disturbance",
      notes: "Altercation in progress between 2–3 individuals. No visible weapons.",
      faceBlurred: true,
    },
    gpsValidated: true,
    distanceFromStation: 2.3,
    accountAge: "2 months",
    priorSubmissions: 0,
    status: "pending_review",
    color: "#8B5CF6",
  },
  {
    id: "sub_005",
    incidentType: "hazmat",
    mediaType: "photo",
    thumbnail: null,
    address: "44 Industrial Pkwy",
    district: "District 2",
    location: { lat: 40.7195, lng: -74.0001 },
    submittedAt: new Date(Date.now() - 75000),
    verifiedAt: new Date(Date.now() - 67000),
    trustScore: 0.44,
    confidenceLabel: "low",
    severityEstimate: 3,
    aiAdvisory: {
      sceneCategory: "Chemical Spill (Unconfirmed)",
      notes: "Liquid pooling near loading dock. Color/texture consistent with industrial fluid.",
      faceBlurred: false,
    },
    gpsValidated: false,
    distanceFromStation: 3.7,
    accountAge: "3 weeks",
    priorSubmissions: 0,
    status: "pending_review",
    color: "#10B981",
  },
];

const INCIDENT_ICONS = {
  structure_fire: "🔥",
  medical: "🫀",
  vehicle_accident: "🚗",
  silent_witness: "👁",
  hazmat: "⚠️",
};

const STATUS_CONFIG = {
  pending_review: { label: "AWAITING REVIEW", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  accepted: { label: "ACCEPTED", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  escalated: { label: "ESCALATED", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  rejected: { label: "REJECTED", color: "#6B7280", bg: "rgba(107,114,128,0.12)" },
};

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

function pipelineTime(submitted, verified) {
  return Math.round((verified.getTime() - submitted.getTime()) / 1000);
}

function TrustBar({ score }) {
  const pct = Math.round(score * 100);
  const color = score >= 0.8 ? "#10B981" : score >= 0.6 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color, minWidth: 32, textAlign: "right" }}>
        {pct}%
      </span>
    </div>
  );
}

function SeverityDots({ score }) {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {Array.from({ length: 10 }, (_, i) => {
        const filled = i < score;
        const isCritical = i >= 7;
        return (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: "50%",
            background: filled ? (isCritical ? "#EF4444" : score >= 5 ? "#F59E0B" : "#10B981") : "rgba(255,255,255,0.1)",
            transition: "background 0.3s",
          }} />
        );
      })}
    </div>
  );
}

function PipelineTime({ submitted, verified }) {
  const secs = pipelineTime(submitted, verified);
  return (
    <span style={{
      fontFamily: "'DM Mono', monospace", fontSize: 10,
      color: secs <= 10 ? "#10B981" : secs <= 30 ? "#F59E0B" : "#EF4444",
      background: "rgba(255,255,255,0.05)", padding: "1px 6px", borderRadius: 3,
    }}>
      ⚡ {secs}s pipeline
    </span>
  );
}

// ─── MediaCard ────────────────────────────────────────────────────────────────

function MediaCard({ sub, onAction, isSelected, onClick }) {
  const status = STATUS_CONFIG[sub.status];
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isSelected ? "rgba(255,255,255,0.07)" : hovered ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.025)",
        border: `1px solid ${isSelected ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`,
        borderLeft: `3px solid ${sub.color}`,
        borderRadius: 10,
        padding: "14px 16px",
        cursor: "pointer",
        transition: "all 0.15s ease",
        marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{INCIDENT_ICONS[sub.incidentType]}</span>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, color: "#F1F5F9" }}>
              {sub.aiAdvisory.sceneCategory}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#64748B", marginTop: 1 }}>
              {sub.address}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            display: "inline-block", padding: "2px 8px", borderRadius: 4,
            background: status.bg, border: `1px solid ${status.color}40`,
            fontFamily: "'DM Mono', monospace", fontSize: 9, color: status.color, letterSpacing: 1, fontWeight: 700,
          }}>
            {status.label}
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#475569", marginTop: 4 }}>
            {timeAgo(sub.submittedAt)}
          </div>
        </div>
      </div>

      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "8px 10px", marginBottom: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#64748B", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>
          AI Advisory — Not a determination
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "#94A3B8" }}>Severity estimate</span>
          <SeverityDots score={sub.severityEstimate} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#94A3B8" }}>Trust score</span>
          <div style={{ width: 140 }}><TrustBar score={sub.trustScore} /></div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.5, marginBottom: 10 }}>
        {sub.aiAdvisory.notes}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <PipelineTime submitted={sub.submittedAt} verified={sub.verifiedAt} />
          {sub.gpsValidated
            ? <span style={{ fontSize: 9, color: "#10B981", fontFamily: "'DM Mono', monospace" }}>📍 GPS ✓</span>
            : <span style={{ fontSize: 9, color: "#EF4444", fontFamily: "'DM Mono', monospace" }}>📍 GPS FAIL</span>}
          <span style={{ fontSize: 9, color: "#64748B", fontFamily: "'DM Mono', monospace" }}>
            {sub.mediaType === "video" ? "▶ VIDEO" : sub.mediaType === "photo" ? "📷 PHOTO" : "🎙 AUDIO"}
          </span>
        </div>
        <span style={{ fontSize: 10, color: "#475569", fontFamily: "'DM Mono', monospace" }}>
          {sub.distanceFromStation}km from station
        </span>
      </div>
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({ sub, onAction }) {
  if (!sub) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.4 }}>📡</div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, color: "#475569" }}>
          Select a submission to review
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 24 }}>{INCIDENT_ICONS[sub.incidentType]}</span>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: "#F1F5F9", margin: 0 }}>
            {sub.aiAdvisory.sceneCategory}
          </h2>
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#64748B" }}>
          {sub.address} · {sub.district}
        </div>
      </div>

      {/* Real Map */}
      <div style={{ height: 200, borderRadius: 10, marginBottom: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
        <MapContainer
          key={`${sub.location.lat}-${sub.location.lng}`}
          center={[sub.location.lat, sub.location.lng]}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
          scrollWheelZoom={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[sub.location.lat, sub.location.lng]}>
            <Popup>{sub.aiAdvisory.sceneCategory} — {sub.address}</Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Media preview */}
      <div style={{
        height: 140, borderRadius: 10, marginBottom: 20,
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>
            {sub.mediaType === "video" ? "▶" : sub.mediaType === "photo" ? "📷" : "🎙"}
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#475569" }}>
            {sub.mediaType.toUpperCase()} · PII REDACTED
          </div>
        </div>
        {sub.aiAdvisory.faceBlurred && (
          <div style={{
            position: "absolute", top: 8, right: 8,
            fontFamily: "'DM Mono', monospace", fontSize: 8, color: "#8B5CF6",
            background: "rgba(139,92,246,0.12)", padding: "2px 6px", borderRadius: 3,
            border: "1px solid rgba(139,92,246,0.3)",
          }}>
            FACES BLURRED
          </div>
        )}
      </div>

      {/* Verification breakdown */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#64748B", letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" }}>
          Verification Pipeline Results
        </div>
        {[
          { label: "GPS + Metadata Match", pass: sub.gpsValidated, detail: sub.gpsValidated ? "Device GPS matches EXIF & cell data" : "GPS mismatch flagged" },
          { label: "Deepfake Detection", pass: sub.trustScore > 0.5, detail: `Authenticity score: ${Math.round(sub.trustScore * 100)}%` },
          { label: "Account Verification", pass: true, detail: `Phone verified · ${sub.accountAge} account` },
          { label: "Prior History", pass: sub.priorSubmissions >= 1, detail: `${sub.priorSubmissions} prior verified submissions` },
        ].map((check, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            paddingBottom: i < 3 ? 10 : 0,
            borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none",
            marginBottom: i < 3 ? 10 : 0,
          }}>
            <span style={{ fontSize: 12, marginTop: 1 }}>{check.pass ? "✅" : "❌"}</span>
            <div>
              <div style={{ fontSize: 12, color: "#CBD5E1", fontWeight: 500 }}>{check.label}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#475569", marginTop: 2 }}>{check.detail}</div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Advisory */}
      <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, padding: 14, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 12 }}>🤖</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#818CF8", letterSpacing: 1, textTransform: "uppercase" }}>
            AI Scene Analysis — Advisory Only
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6 }}>{sub.aiAdvisory.notes}</div>
        <div style={{ marginTop: 10, fontSize: 10, color: "#475569", fontStyle: "italic" }}>
          This analysis is advisory. All dispatch decisions remain with human dispatchers.
        </div>
      </div>

      {/* Action buttons */}
      {sub.status === "pending_review" && (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onAction(sub.id, "accepted")} style={{
            flex: 1, padding: "11px 0",
            background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)",
            borderRadius: 8, color: "#10B981",
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}>✓ Accept</button>
          <button onClick={() => onAction(sub.id, "escalated")} style={{
            flex: 1, padding: "11px 0",
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.35)",
            borderRadius: 8, color: "#EF4444",
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}>↑ Escalate</button>
          <button onClick={() => onAction(sub.id, "rejected")} style={{
            flex: 1, padding: "11px 0",
            background: "rgba(107,114,128,0.1)", border: "1px solid rgba(107,114,128,0.25)",
            borderRadius: 8, color: "#94A3B8",
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}>✕ Reject</button>
        </div>
      )}
    </div>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function StatPill({ label, value, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 20px", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 700, color: color || "#F1F5F9", lineHeight: 1 }}>{value}</span>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#475569", marginTop: 3, letterSpacing: 0.5 }}>{label}</span>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function CityShieldDashboard() {
  const [submissions, setSubmissions] = useState(MOCK_SUBMISSIONS);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [tick, setTick] = useState(0);
  const [newAlert, setNewAlert] = useState(null);
  const [showCitizenForm, setShowCitizenForm] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const newSub = {
        id: `sub_live_${Date.now()}`,
        incidentType: "medical",
        mediaType: "video",
        thumbnail: null,
        address: "189 Greenway Dr, Apt 2B",
        district: "District 9",
        location: { lat: 40.7589, lng: -73.9851 },
        submittedAt: new Date(),
        verifiedAt: new Date(Date.now() + 8000),
        trustScore: 0.82,
        confidenceLabel: "high",
        severityEstimate: 6,
        aiAdvisory: {
          sceneCategory: "Medical Emergency",
          notes: "Individual collapsed, bystander performing CPR. AED not visible.",
          faceBlurred: true,
        },
        gpsValidated: true,
        distanceFromStation: 0.6,
        accountAge: "11 months",
        priorSubmissions: 2,
        status: "pending_review",
        color: "#F59E0B",
        isNew: true,
      };
      setSubmissions(prev => [newSub, ...prev]);
      setNewAlert(newSub.id);
      setTimeout(() => setNewAlert(null), 3000);
    }, 7000);
    return () => clearTimeout(timeout);
  }, []);

  // ── If citizen form is open, show it full screen ──
  if (showCitizenForm) {
    return <CitizenUpload onBack={() => setShowCitizenForm(false)} />;
  }

  const filtered = filter === "all"
    ? submissions
    : filter === "pending"
    ? submissions.filter(s => s.status === "pending_review")
    : submissions.filter(s => s.incidentType === filter);

  const pending = submissions.filter(s => s.status === "pending_review").length;
  const highConf = submissions.filter(s => s.confidenceLabel === "high").length;
  const avgPipeline = Math.round(
    submissions.reduce((acc, s) => acc + pipelineTime(s.submittedAt, s.verifiedAt), 0) / submissions.length
  );

  const handleAction = (id, action) => {
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: action } : s));
    if (selected?.id === id) setSelected(prev => ({ ...prev, status: action }));
  };

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif", background: "#080E17", minHeight: "100vh", color: "#F1F5F9", display: "flex", flexDirection: "column" }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: "rgba(255,255,255,0.025)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #3B82F6, #6366F1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🛡️</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: 0.5 }}>City Shield</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#475569", letterSpacing: 1 }}>DISPATCH INTELLIGENCE PLATFORM</div>
          </div>
        </div>

        <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
          <StatPill label="PENDING REVIEW" value={pending} color="#F59E0B" />
          <StatPill label="HIGH CONFIDENCE" value={highConf} color="#10B981" />
          <StatPill label="AVG PIPELINE" value={`${avgPipeline}s`} color="#6366F1" />
          <StatPill label="LIVE TODAY" value={submissions.length} color="#CBD5E1" />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B981", animation: "blink 2s infinite" }} />
          <style>{`@keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }`}</style>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#10B981" }}>WS LIVE</span>
          <div style={{ marginLeft: 8, padding: "4px 10px", borderRadius: 5, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#64748B" }}>
            Dispatcher: Kim, J. · Div 3
          </div>
          <button
            onClick={() => setShowCitizenForm(true)}
            style={{
              marginLeft: 8, padding: "6px 14px", borderRadius: 6,
              background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)",
              color: "#818CF8", fontFamily: "'DM Mono', monospace", fontSize: 10, cursor: "pointer",
            }}
          >
            + Citizen Form
          </button>
        </div>
      </div>

      {/* Alert banner */}
      {newAlert && (
        <div style={{ background: "rgba(239,68,68,0.15)", borderBottom: "1px solid rgba(239,68,68,0.3)", padding: "8px 24px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444", animation: "blink 0.5s infinite" }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#FCA5A5", letterSpacing: 0.5 }}>
            NEW VERIFIED SUBMISSION — Medical Emergency · 189 Greenway Dr — Click to review
          </span>
        </div>
      )}

      {/* Main layout */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ width: 400, borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 4, overflowX: "auto" }}>
            {[
              { key: "all", label: "All" },
              { key: "pending", label: `Pending (${pending})` },
              { key: "structure_fire", label: "🔥 Fire" },
              { key: "medical", label: "🫀 Medical" },
              { key: "vehicle_accident", label: "🚗 Vehicle" },
              { key: "silent_witness", label: "👁 Silent" },
            ].map(tab => (
              <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
                padding: "4px 10px", borderRadius: 5, border: "none",
                background: filter === tab.key ? "rgba(99,102,241,0.2)" : "transparent",
                color: filter === tab.key ? "#818CF8" : "#475569",
                fontFamily: "'DM Mono', monospace", fontSize: 10, cursor: "pointer",
                whiteSpace: "nowrap",
                outline: filter === tab.key ? "1px solid rgba(99,102,241,0.3)" : "none",
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px" }}>
            {filtered.map(sub => (
              <MediaCard
                key={sub.id}
                sub={sub}
                onAction={handleAction}
                isSelected={selected?.id === sub.id}
                onClick={() => setSelected(sub)}
              />
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "8px 24px", borderBottom: "1px solid rgba(99,102,241,0.15)", background: "rgba(99,102,241,0.04)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12 }}>ℹ️</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#6366F1" }}>
              All AI scores are advisory estimates. Human dispatchers retain full authority over all decisions.
            </span>
          </div>
          <DetailPanel sub={selected} onAction={handleAction} />
        </div>
      </div>
    </div>
  );
}
