import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import CitizenUpload from "./CitizenUpload";
import { supabase } from "./supabase";

const INCIDENT_ICONS = {
  structure_fire: "🔥", medical: "🫀", vehicle_accident: "🚗",
  silent_witness: "👁", hazmat: "⚠️", other: "📢",
};

const INCIDENT_COLORS = {
  structure_fire: "#FF4D4D", medical: "#F59E0B", vehicle_accident: "#EF4444",
  silent_witness: "#8B5CF6", hazmat: "#10B981", other: "#6366F1",
};

const STATUS_CONFIG = {
  pending_review: { label: "AWAITING REVIEW", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  accepted: { label: "ACCEPTED", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  escalated: { label: "ESCALATED", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  rejected: { label: "REJECTED", color: "#6B7280", bg: "rgba(107,114,128,0.12)" },
};

// ─── Fake scenarios (always shown) ───────────────────────────────────────────
const MOCK_SUBMISSIONS = [
  {
    id: "mock_001",
    isMock: true,
    incident_type: "structure_fire",
    description: "Visible flames 2nd floor, 3 windows involved, smoke column present",
    media_type: "video",
    media_url: null,
    latitude: 40.7489,
    longitude: -73.9684,
    created_at: new Date(Date.now() - 42000).toISOString(),
    status: "pending_review",
  },
  {
    id: "mock_002",
    isMock: true,
    incident_type: "medical",
    description: "Person unresponsive on floor. Bystanders present. AED visible nearby.",
    media_type: "photo",
    media_url: null,
    latitude: 40.7614,
    longitude: -73.9776,
    created_at: new Date(Date.now() - 180000).toISOString(),
    status: "accepted",
  },
  {
    id: "mock_003",
    isMock: true,
    incident_type: "vehicle_accident",
    description: "3+ vehicles involved. One vehicle off-road. Fluids visible on pavement.",
    media_type: "video",
    media_url: null,
    latitude: 40.7282,
    longitude: -73.9942,
    created_at: new Date(Date.now() - 310000).toISOString(),
    status: "escalated",
  },
  {
    id: "mock_004",
    isMock: true,
    incident_type: "silent_witness",
    description: "Altercation in progress between 2–3 individuals. No visible weapons.",
    media_type: "photo",
    media_url: null,
    latitude: 40.7831,
    longitude: -73.9712,
    created_at: new Date(Date.now() - 520000).toISOString(),
    status: "pending_review",
  },
  {
    id: "mock_005",
    isMock: true,
    incident_type: "hazmat",
    description: "Liquid pooling near loading dock. Color/texture consistent with industrial fluid.",
    media_type: "photo",
    media_url: null,
    latitude: 40.7195,
    longitude: -74.0001,
    created_at: new Date(Date.now() - 75000).toISOString(),
    status: "pending_review",
  },
];

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

// ─── MediaCard ────────────────────────────────────────────────────────────────
function MediaCard({ sub, isSelected, onClick }) {
  const status = STATUS_CONFIG[sub.status] || STATUS_CONFIG.pending_review;
  const color = INCIDENT_COLORS[sub.incident_type] || "#6366F1";
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isSelected ? "rgba(255,255,255,0.07)" : hovered ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.025)",
        border: `1px solid ${isSelected ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 10, padding: "14px 16px", cursor: "pointer",
        transition: "all 0.15s ease", marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>{INCIDENT_ICONS[sub.incident_type] || "📢"}</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, color: "#F1F5F9" }}>
                {(sub.incident_type || "incident").replace("_", " ").toUpperCase()}
              </div>
              {sub.isMock && (
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 8, color: "#475569",
                  background: "rgba(255,255,255,0.05)", padding: "1px 5px", borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.08)"
                }}>DEMO</span>
              )}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#64748B", marginTop: 1 }}>
              {timeAgo(sub.created_at)}
            </div>
          </div>
        </div>
        <div style={{
          padding: "2px 8px", borderRadius: 4,
          background: status.bg, border: `1px solid ${status.color}40`,
          fontFamily: "'DM Mono', monospace", fontSize: 9, color: status.color, fontWeight: 700,
        }}>
          {status.label}
        </div>
      </div>
      <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5, marginBottom: 8 }}>
        {sub.description || "No description"}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <span style={{ fontSize: 10, color: "#64748B", fontFamily: "'DM Mono', monospace" }}>
          {sub.media_type === "video" ? "▶ VIDEO" : "📷 PHOTO"}
        </span>
        <span style={{ fontSize: 10, color: sub.latitude ? "#10B981" : "#EF4444", fontFamily: "'DM Mono', monospace" }}>
          {sub.latitude ? "📍 GPS ✓" : "📍 No GPS"}
        </span>
      </div>
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function DetailPanel({ sub, onAction, onClose, isMobile }) {
  if (!sub) {
    if (isMobile) return null;
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.4 }}>📡</div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, color: "#475569" }}>
          Select a submission to review
        </div>
      </div>
    );
  }

  const panelStyle = isMobile ? {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "#080E17", zIndex: 100, overflowY: "auto", padding: "20px 16px",
  } : {
    flex: 1, overflowY: "auto", padding: "20px 24px",
  };

  return (
    <div style={panelStyle}>
      {isMobile && (
        <button onClick={onClose} style={{
          background: "none", border: "none", color: "#475569",
          fontFamily: "'DM Mono', monospace", fontSize: 12, cursor: "pointer",
          padding: 0, marginBottom: 16, display: "block",
        }}>← Back to list</button>
      )}

      {/* Title */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 24 }}>{INCIDENT_ICONS[sub.incident_type] || "📢"}</span>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: "#F1F5F9", margin: 0 }}>
            {(sub.incident_type || "incident").replace("_", " ").toUpperCase()}
          </h2>
          {sub.isMock && (
            <span style={{
              fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#475569",
              background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.08)"
            }}>DEMO SCENARIO</span>
          )}
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#64748B" }}>
          Submitted {timeAgo(sub.created_at)}
        </div>
      </div>

      {/* Map */}
      {sub.latitude && sub.longitude ? (
        <div style={{ height: 200, borderRadius: 10, marginBottom: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
          <MapContainer
            key={`${sub.latitude}-${sub.longitude}`}
            center={[sub.latitude, sub.longitude]}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
            zoomControl={true}
            scrollWheelZoom={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[sub.latitude, sub.longitude]}>
              <Popup>{sub.incident_type}</Popup>
            </Marker>
          </MapContainer>
        </div>
      ) : (
        <div style={{ height: 60, borderRadius: 10, marginBottom: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#475569" }}>No GPS location</span>
        </div>
      )}

      {/* Media */}
      <div style={{ borderRadius: 10, marginBottom: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
        {sub.media_url ? (
          sub.media_type === "video"
            ? <video src={sub.media_url} controls style={{ width: "100%", maxHeight: 300, display: "block" }} />
            : <img src={sub.media_url} alt="submission" style={{ width: "100%", maxHeight: 300, objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>
              {sub.media_type === "video" ? "▶" : "📷"}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#475569" }}>
              {sub.isMock ? "Demo scenario — no real media" : "No media attached"}
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#64748B", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
          {sub.isMock ? "Demo Description" : "Citizen Description"}
        </div>
        <div style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.6 }}>
          {sub.description || "No description provided"}
        </div>
      </div>

      {/* Action buttons — only for real submissions */}
      {!sub.isMock && sub.status === "pending_review" && (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onAction(sub.id, "accepted")} style={{
            flex: 1, padding: "13px 0",
            background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)",
            borderRadius: 8, color: "#10B981",
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}>✓ Accept</button>
          <button onClick={() => onAction(sub.id, "escalated")} style={{
            flex: 1, padding: "13px 0",
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.35)",
            borderRadius: 8, color: "#EF4444",
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}>↑ Escalate</button>
          <button onClick={() => onAction(sub.id, "rejected")} style={{
            flex: 1, padding: "13px 0",
            background: "rgba(107,114,128,0.1)", border: "1px solid rgba(107,114,128,0.25)",
            borderRadius: 8, color: "#94A3B8",
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}>✕ Reject</button>
        </div>
      )}

      {sub.isMock && (
        <div style={{
          padding: "10px 14px", borderRadius: 8,
          background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)",
          fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#6366F1", textAlign: "center"
        }}>
          This is a demo scenario. Real submissions from citizens will show Accept / Escalate / Reject buttons.
        </div>
      )}
    </div>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function StatPill({ label, value, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 14px", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 700, color: color || "#F1F5F9", lineHeight: 1 }}>{value}</span>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "#475569", marginTop: 2, letterSpacing: 0.5 }}>{label}</span>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function CityShieldDashboard() {
  const [realSubmissions, setRealSubmissions] = useState([]);
  const [mockSubmissions, setMockSubmissions] = useState(MOCK_SUBMISSIONS);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showCitizenForm, setShowCitizenForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchSubmissions = async () => {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setRealSubmissions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubmissions();
    const interval = setInterval(fetchSubmissions, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id, action) => {
    await supabase.from('submissions').update({ status: action }).eq('id', id);
    setRealSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: action } : s));
    if (selected?.id === id) setSelected(prev => ({ ...prev, status: action }));
  };

  if (showCitizenForm) {
    return <CitizenUpload onBack={() => { setShowCitizenForm(false); fetchSubmissions(); }} />;
  }

  // Real submissions first, then mock scenarios at the bottom
  const allSubmissions = [...realSubmissions, ...mockSubmissions];

  const filtered = filter === "all"
    ? allSubmissions
    : filter === "pending"
    ? allSubmissions.filter(s => s.status === "pending_review")
    : allSubmissions.filter(s => s.incident_type === filter);

  const pending = allSubmissions.filter(s => s.status === "pending_review").length;
  const realPending = realSubmissions.filter(s => s.status === "pending_review").length;

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif", background: "#080E17", height: "100vh", color: "#F1F5F9", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background: "rgba(255,255,255,0.025)", borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "0 16px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 52, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, #3B82F6, #6366F1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🛡️</div>
          <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: 0.5 }}>City Shield</div>
        </div>

        {!isMobile && (
          <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
            <StatPill label="REAL PENDING" value={realPending} color="#F59E0B" />
            <StatPill label="REAL SUBMISSIONS" value={realSubmissions.length} color="#10B981" />
            <StatPill label="TOTAL W/ DEMO" value={allSubmissions.length} color="#CBD5E1" />
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {isMobile && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#F59E0B" }}>
              {realPending} real pending
            </span>
          )}
          <button
            onClick={fetchSubmissions}
            style={{ padding: "5px 10px", borderRadius: 5, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#64748B", cursor: "pointer" }}
          >↻</button>
          <button
            onClick={() => setShowCitizenForm(true)}
            style={{ padding: "6px 12px", borderRadius: 6, background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", color: "#818CF8", fontFamily: "'DM Mono', monospace", fontSize: 10, cursor: "pointer" }}
          >+ Report</button>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Left: Feed */}
        <div style={{
          width: isMobile ? "100%" : 400,
          borderRight: isMobile ? "none" : "1px solid rgba(255,255,255,0.07)",
          display: isMobile && selected ? "none" : "flex",
          flexDirection: "column", flexShrink: 0,
        }}>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 4, overflowX: "auto" }}>
            {[
              { key: "all", label: "All" },
              { key: "pending", label: `Pending (${pending})` },
              { key: "structure_fire", label: "🔥" },
              { key: "medical", label: "🫀" },
              { key: "vehicle_accident", label: "🚗" },
              { key: "silent_witness", label: "👁" },
            ].map(tab => (
              <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
                padding: "5px 10px", borderRadius: 5, border: "none",
                background: filter === tab.key ? "rgba(99,102,241,0.2)" : "transparent",
                color: filter === tab.key ? "#818CF8" : "#475569",
                fontFamily: "'DM Mono', monospace", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap",
                outline: filter === tab.key ? "1px solid rgba(99,102,241,0.3)" : "none",
              }}>{tab.label}</button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
            {loading ? (
              <div style={{ textAlign: "center", color: "#475569", paddingTop: 40, fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                Loading...
              </div>
            ) : (
              <>
                {/* Real submissions section */}
                {realSubmissions.length > 0 && (
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#10B981", letterSpacing: 1, marginBottom: 8, padding: "0 4px" }}>
                    ● LIVE SUBMISSIONS
                  </div>
                )}
                {filtered.filter(s => !s.isMock).map(sub => (
                  <MediaCard key={sub.id} sub={sub} isSelected={selected?.id === sub.id} onClick={() => setSelected(sub)} />
                ))}

                {/* Demo section divider */}
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#334155", letterSpacing: 1, margin: "12px 0 8px 4px" }}>
                  ○ DEMO SCENARIOS
                </div>
                {filtered.filter(s => s.isMock).map(sub => (
                  <MediaCard key={sub.id} sub={sub} isSelected={selected?.id === sub.id} onClick={() => setSelected(sub)} />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Right: Detail */}
        {(!isMobile || selected) && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {!isMobile && (
              <div style={{ padding: "7px 24px", borderBottom: "1px solid rgba(99,102,241,0.15)", background: "rgba(99,102,241,0.04)", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11 }}>ℹ️</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#6366F1" }}>
                  AI scores are advisory. Human dispatchers retain full authority.
                </span>
              </div>
            )}
            <DetailPanel sub={selected} onAction={handleAction} onClose={() => setSelected(null)} isMobile={isMobile} />
          </div>
        )}
      </div>
    </div>
  );
}
