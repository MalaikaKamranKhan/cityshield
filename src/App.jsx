import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import CitizenUpload from "./CitizenUpload";
import { supabase } from "./supabase";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg:         "#0D1B2A",
  bgCard:     "rgba(255,255,255,0.03)",
  bgCardHov:  "rgba(255,255,255,0.055)",
  bgCardSel:  "rgba(255,255,255,0.07)",
  border:     "rgba(255,255,255,0.07)",
  borderMid:  "rgba(255,255,255,0.12)",
  gold:       "#C9A84C",
  goldDim:    "rgba(201,168,76,0.15)",
  goldBorder: "rgba(201,168,76,0.3)",
  blue:       "#2E6FD8",
  green:      "#2ECC71",
  greenDim:   "rgba(46,204,113,0.12)",
  greenBorder:"rgba(46,204,113,0.3)",
  red:        "#E74C3C",
  redDim:     "rgba(231,76,60,0.12)",
  redBorder:  "rgba(231,76,60,0.3)",
  amber:      "#F39C12",
  amberDim:   "rgba(243,156,18,0.12)",
  amberBorder:"rgba(243,156,18,0.3)",
  gray:       "#6B7280",
  grayDim:    "rgba(107,114,128,0.12)",
  textPrimary:"#E8EDF2",
  textSecond: "#8A9BB0",
  textDim:    "#4A5568",
  fontMain:   "'IBM Plex Sans', sans-serif",
  fontMono:   "'IBM Plex Mono', monospace",
};

const INCIDENT_ICONS = {
  structure_fire: "🔥", medical: "🫀", vehicle_accident: "🚗",
  silent_witness: "👁", hazmat: "⚠️", other: "📢",
};

const INCIDENT_COLORS = {
  structure_fire: "#E74C3C", medical: "#F39C12", vehicle_accident: "#E67E22",
  silent_witness: "#8E44AD", hazmat: "#27AE60", other: "#2E6FD8",
};

const STATUS_CONFIG = {
  pending_review: { label: "AWAITING REVIEW", color: C.amber,  bg: C.amberDim, border: C.amberBorder },
  accepted:       { label: "ACCEPTED",         color: C.green,  bg: C.greenDim, border: C.greenBorder },
  escalated:      { label: "ESCALATED",        color: C.red,    bg: C.redDim,   border: C.redBorder },
  rejected:       { label: "REJECTED",         color: C.gray,   bg: C.grayDim,  border: "rgba(107,114,128,0.25)" },
};

const AI_PROFILES = {
  structure_fire: { sceneCategory: "Structure Fire — Unverified", notes: "Citizen-reported fire incident. Visual media submitted for review. AI scene classification pending full pipeline processing.", severity: 7, trust: 0.72 },
  medical:        { sceneCategory: "Medical Emergency — Unverified", notes: "Citizen-reported medical incident. Submission includes media evidence. Recommend immediate dispatcher review.", severity: 6, trust: 0.68 },
  vehicle_accident:{ sceneCategory: "Vehicle Incident — Unverified", notes: "Citizen-reported vehicle incident. GPS coordinates captured. Media submitted for scene assessment.", severity: 5, trust: 0.74 },
  silent_witness: { sceneCategory: "Disturbance Report — Unverified", notes: "Silent witness submission received. Identity protected. Scene details available in media and description.", severity: 4, trust: 0.61 },
  hazmat:         { sceneCategory: "Hazardous Situation — Unverified", notes: "Citizen-reported hazardous material incident. Exercise caution. Verification pipeline running.", severity: 6, trust: 0.55 },
  other:          { sceneCategory: "General Incident — Unverified", notes: "Citizen report received. Incident type requires manual classification by dispatcher.", severity: 3, trust: 0.60 },
};

const MOCK_SUBMISSIONS = [
  { id: "mock_001", isMock: true, incident_type: "structure_fire", aiAdvisory: { sceneCategory: "Active Structure Fire", notes: "Visible flames 2nd floor, 3 windows involved, smoke column present", faceBlurred: true }, media_type: "video", media_url: null, latitude: 40.7489, longitude: -73.9684, created_at: new Date(Date.now() - 42000).toISOString(), status: "pending_review", trustScore: 0.91, severityEstimate: 7, gpsValidated: true, distanceFromStation: 1.2, accountAge: "14 months", priorSubmissions: 3 },
  { id: "mock_002", isMock: true, incident_type: "medical", aiAdvisory: { sceneCategory: "Medical Emergency", notes: "Person unresponsive on floor. Bystanders present. AED visible nearby.", faceBlurred: true }, media_type: "photo", media_url: null, latitude: 40.7614, longitude: -73.9776, created_at: new Date(Date.now() - 180000).toISOString(), status: "accepted", trustScore: 0.76, severityEstimate: 5, gpsValidated: true, distanceFromStation: 0.8, accountAge: "6 months", priorSubmissions: 1 },
  { id: "mock_003", isMock: true, incident_type: "vehicle_accident", aiAdvisory: { sceneCategory: "Multi-Vehicle Collision", notes: "3+ vehicles involved. One vehicle off-road. Fluids visible on pavement.", faceBlurred: true }, media_type: "video", media_url: null, latitude: 40.7282, longitude: -73.9942, created_at: new Date(Date.now() - 310000).toISOString(), status: "escalated", trustScore: 0.88, severityEstimate: 8, gpsValidated: true, distanceFromStation: 4.1, accountAge: "22 months", priorSubmissions: 7 },
  { id: "mock_004", isMock: true, incident_type: "silent_witness", aiAdvisory: { sceneCategory: "Harassment / Disturbance", notes: "Altercation in progress between 2–3 individuals. No visible weapons.", faceBlurred: true }, media_type: "photo", media_url: null, latitude: 40.7831, longitude: -73.9712, created_at: new Date(Date.now() - 520000).toISOString(), status: "pending_review", trustScore: 0.63, severityEstimate: 4, gpsValidated: true, distanceFromStation: 2.3, accountAge: "2 months", priorSubmissions: 0 },
  { id: "mock_005", isMock: true, incident_type: "hazmat", aiAdvisory: { sceneCategory: "Chemical Spill (Unconfirmed)", notes: "Liquid pooling near loading dock. Color/texture consistent with industrial fluid.", faceBlurred: false }, media_type: "photo", media_url: null, latitude: 40.7195, longitude: -74.0001, created_at: new Date(Date.now() - 75000).toISOString(), status: "pending_review", trustScore: 0.44, severityEstimate: 3, gpsValidated: false, distanceFromStation: 3.7, accountAge: "3 weeks", priorSubmissions: 0 },
];

function getAI(sub) {
  if (sub.isMock) return sub.aiAdvisory;
  const p = AI_PROFILES[sub.incident_type] || AI_PROFILES.other;
  return { sceneCategory: p.sceneCategory, notes: p.notes, faceBlurred: true };
}
function getTrust(sub) { return sub.isMock ? sub.trustScore : (AI_PROFILES[sub.incident_type]?.trust || 0.65); }
function getSeverity(sub) { return sub.isMock ? sub.severityEstimate : (AI_PROFILES[sub.incident_type]?.severity || 5); }

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function TrustBar({ score }) {
  const pct = Math.round((score || 0.5) * 100);
  const color = pct >= 80 ? C.green : pct >= 60 ? C.amber : C.red;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontFamily: C.fontMono, fontSize: 10, color, minWidth: 32, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}

function SeverityDots({ score }) {
  const s = score || 5;
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i < s ? (i >= 7 ? C.red : s >= 5 ? C.amber : C.green) : "rgba(255,255,255,0.08)" }} />
      ))}
    </div>
  );
}

// ─── MediaCard ────────────────────────────────────────────────────────────────
function MediaCard({ sub, isSelected, onClick, isMobile }) {
  const status = STATUS_CONFIG[sub.status] || STATUS_CONFIG.pending_review;
  const color = INCIDENT_COLORS[sub.incident_type] || C.blue;
  const [hovered, setHovered] = useState(false);
  const ai = getAI(sub);
  const trust = getTrust(sub);
  const severity = getSeverity(sub);
  const incidentId = `INC-${sub.id.toString().slice(-5).toUpperCase()}`;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => !isMobile && setHovered(true)}
      onMouseLeave={() => !isMobile && setHovered(false)}
      style={{
        background: isSelected && !isMobile ? C.bgCardSel : hovered ? C.bgCardHov : C.bgCard,
        border: `1px solid ${isSelected && !isMobile ? C.borderMid : C.border}`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 10, padding: isMobile ? "16px 14px" : "13px 15px",
        cursor: "pointer", transition: "all 0.15s ease", marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: isMobile ? 22 : 16 }}>{INCIDENT_ICONS[sub.incident_type] || "📢"}</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <span style={{ fontFamily: C.fontMono, fontWeight: 600, fontSize: isMobile ? 13 : 11, color: C.textPrimary, letterSpacing: 0.5 }}>
                {ai.sceneCategory}
              </span>
              {sub.isMock && (
                <span style={{ fontFamily: C.fontMono, fontSize: 7, color: C.textDim, background: "rgba(255,255,255,0.04)", padding: "1px 4px", borderRadius: 2, border: `1px solid ${C.border}` }}>DEMO</span>
              )}
            </div>
            <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.textDim }}>
              {incidentId} · {timeAgo(sub.created_at)}
            </div>
          </div>
        </div>
        <div style={{ padding: "3px 8px", borderRadius: 4, background: status.bg, border: `1px solid ${status.border}`, fontFamily: C.fontMono, fontSize: isMobile ? 9 : 8, color: status.color, letterSpacing: 0.8, fontWeight: 700, whiteSpace: "nowrap" }}>
          {status.label}
        </div>
      </div>

      <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 6, padding: "8px 10px", marginBottom: 8, border: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: C.fontMono, fontSize: 8, color: C.textDim, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>AI Advisory — Not a determination</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: C.textSecond, fontFamily: C.fontMono }}>Severity</span>
          <SeverityDots score={severity} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: C.textSecond, fontFamily: C.fontMono }}>Trust</span>
          <div style={{ width: 140 }}><TrustBar score={trust} /></div>
        </div>
      </div>

      <div style={{ fontSize: isMobile ? 13 : 11, color: C.textSecond, lineHeight: 1.6, marginBottom: 10, fontFamily: C.fontMain }}>
        {sub.description || ai.notes}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontFamily: C.fontMono, fontSize: 9, color: C.green, background: C.greenDim, padding: "2px 6px", borderRadius: 3 }}>⚡ 8s</span>
          {(sub.gpsValidated || sub.latitude)
            ? <span style={{ fontSize: 9, color: C.green, fontFamily: C.fontMono }}>📍 GPS ✓</span>
            : <span style={{ fontSize: 9, color: C.red, fontFamily: C.fontMono }}>📍 GPS ✗</span>}
          <span style={{ fontSize: 9, color: C.textDim, fontFamily: C.fontMono }}>{sub.media_type === "video" ? "▶ VID" : "◼ IMG"}</span>
        </div>
        {isMobile && <span style={{ fontSize: 12, color: C.textDim }}>›</span>}
        {!isMobile && sub.distanceFromStation && <span style={{ fontSize: 9, color: C.textDim, fontFamily: C.fontMono }}>{sub.distanceFromStation}km</span>}
      </div>
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function DetailPanel({ sub, onAction, onBack, isMobile }) {
  if (!sub) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <div style={{ fontSize: 36, opacity: 0.2 }}>📡</div>
        <div style={{ fontFamily: C.fontMono, fontSize: 12, color: C.textDim, letterSpacing: 1 }}>SELECT AN INCIDENT TO REVIEW</div>
      </div>
    );
  }

  const ai = getAI(sub);
  const trust = getTrust(sub);
  const severity = getSeverity(sub);
  const incidentId = `INC-${sub.id.toString().slice(-5).toUpperCase()}`;
  const status = STATUS_CONFIG[sub.status] || STATUS_CONFIG.pending_review;

  const panelStyle = isMobile ? {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: C.bg, zIndex: 200, overflowY: "auto",
    padding: "0 0 100px 0",
  } : {
    flex: 1, overflowY: "auto", padding: "20px 24px",
  };

  return (
    <div style={panelStyle}>
      {/* Mobile back header */}
      {isMobile && (
        <div style={{ position: "sticky", top: 0, zIndex: 10, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", color: C.textPrimary, fontFamily: C.fontMono, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            ← BACK
          </button>
          <div>
            <div style={{ fontFamily: C.fontMono, fontWeight: 700, fontSize: 13, color: C.textPrimary }}>{ai.sceneCategory}</div>
            <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.textDim }}>{incidentId}</div>
          </div>
          <div style={{ marginLeft: "auto", padding: "3px 8px", borderRadius: 4, background: status.bg, border: `1px solid ${status.border}`, fontFamily: C.fontMono, fontSize: 8, color: status.color, fontWeight: 700 }}>
            {status.label}
          </div>
        </div>
      )}

      <div style={{ padding: isMobile ? "16px 16px" : "0" }}>
        {/* Desktop title */}
        {!isMobile && (
          <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{INCIDENT_ICONS[sub.incident_type] || "📢"}</span>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h2 style={{ fontFamily: C.fontMono, fontWeight: 700, fontSize: 18, color: C.textPrimary, margin: 0 }}>{ai.sceneCategory}</h2>
                  {sub.isMock && <span style={{ fontFamily: C.fontMono, fontSize: 8, color: C.textDim, background: "rgba(255,255,255,0.04)", padding: "2px 7px", borderRadius: 3, border: `1px solid ${C.border}` }}>DEMO</span>}
                </div>
                <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.textDim, marginTop: 3 }}>{incidentId} · Submitted {timeAgo(sub.created_at)}</div>
              </div>
              <div style={{ marginLeft: "auto", padding: "3px 10px", borderRadius: 4, background: status.bg, border: `1px solid ${status.border}`, fontFamily: C.fontMono, fontSize: 9, color: status.color, fontWeight: 700 }}>{status.label}</div>
            </div>
          </div>
        )}

        {/* Map */}
        <div style={{ height: isMobile ? 200 : 160, borderRadius: 10, marginBottom: 16, overflow: "hidden", border: `1px solid ${C.border}` }}>
          {sub.latitude && sub.longitude ? (
            <MapContainer key={`${sub.latitude}-${sub.longitude}`} center={[sub.latitude, sub.longitude]} zoom={15} style={{ height: "100%", width: "100%" }} zoomControl={false} scrollWheelZoom={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[sub.latitude, sub.longitude]}><Popup>{ai.sceneCategory}</Popup></Marker>
            </MapContainer>
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: C.bgCard }}>
              <span style={{ fontFamily: C.fontMono, fontSize: 11, color: C.textDim }}>NO GPS DATA</span>
            </div>
          )}
        </div>

        {/* Media */}
        <div style={{ borderRadius: 10, marginBottom: 16, overflow: "hidden", border: `1px solid ${C.border}`, background: "#000", position: "relative" }}>
          {sub.media_url ? (
            sub.media_type === "video" ? (
              <video src={sub.media_url} controls style={{ width: "100%", maxHeight: isMobile ? 250 : 280, display: "block" }} />
            ) : (
              <>
                <img src={sub.media_url} alt="submission" onClick={() => window.open(sub.media_url, '_blank')} style={{ width: "100%", maxHeight: isMobile ? 250 : 280, objectFit: "contain", background: "#000", display: "block", cursor: "zoom-in" }} />
                <div onClick={() => window.open(sub.media_url, '_blank')} style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.75)", borderRadius: 5, padding: "6px 12px", fontFamily: C.fontMono, fontSize: 10, color: C.textPrimary, cursor: "pointer", border: `1px solid ${C.border}` }}>⛶ FULL SCREEN</div>
              </>
            )
          ) : (
            <div style={{ padding: 28, textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{sub.media_type === "video" ? "▶" : "◼"}</div>
              <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.textDim }}>{sub.isMock ? "DEMO — NO REAL MEDIA" : "NO MEDIA ATTACHED"}</div>
            </div>
          )}
        </div>

        {/* Citizen description */}
        {!sub.isMock && sub.description && (
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: C.fontMono, fontSize: 8, color: C.textDim, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>Citizen Description</div>
            <div style={{ fontSize: isMobile ? 14 : 13, color: C.textSecond, lineHeight: 1.6, fontFamily: C.fontMain }}>{sub.description}</div>
          </div>
        )}

        {/* Verification */}
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ fontFamily: C.fontMono, fontSize: 8, color: C.textDim, letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" }}>Verification Pipeline</div>
          {[
            { label: "GPS + Metadata Match", pass: sub.gpsValidated || !!sub.latitude, detail: (sub.gpsValidated || !!sub.latitude) ? "Device GPS matches EXIF & cell data" : "GPS mismatch flagged" },
            { label: "Deepfake Detection", pass: trust > 0.5, detail: `Authenticity score: ${Math.round(trust * 100)}%` },
            { label: "Account Verification", pass: true, detail: `Phone verified · ${sub.accountAge || "verified account"}` },
            { label: "Prior Submission History", pass: (sub.priorSubmissions || 0) >= 1, detail: `${sub.priorSubmissions || 0} prior verified submissions` },
          ].map((check, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, paddingBottom: i < 3 ? 10 : 0, borderBottom: i < 3 ? `1px solid ${C.border}` : "none", marginBottom: i < 3 ? 10 : 0 }}>
              <span style={{ fontSize: 12, marginTop: 1 }}>{check.pass ? "✅" : "❌"}</span>
              <div>
                <div style={{ fontSize: isMobile ? 13 : 11, color: C.textPrimary, fontFamily: C.fontMain, fontWeight: 500 }}>{check.label}</div>
                <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.textDim, marginTop: 2 }}>{check.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {/* AI Advisory */}
        <div style={{ background: C.goldDim, border: `1px solid ${C.goldBorder}`, borderRadius: 10, padding: 14, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 12 }}>🤖</span>
            <span style={{ fontFamily: C.fontMono, fontSize: 8, color: C.gold, letterSpacing: 1, textTransform: "uppercase" }}>AI Scene Analysis — Advisory Only</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: C.textSecond, fontFamily: C.fontMono }}>Severity estimate</span>
            <SeverityDots score={severity} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: C.textSecond, fontFamily: C.fontMono }}>Trust score</span>
            <div style={{ width: 160 }}><TrustBar score={trust} /></div>
          </div>
          <div style={{ fontSize: isMobile ? 14 : 12, color: C.textSecond, lineHeight: 1.6, fontFamily: C.fontMain }}>{ai.notes}</div>
          <div style={{ marginTop: 10, fontSize: 9, color: C.textDim, fontFamily: C.fontMono }}>Advisory only. All dispatch decisions remain with human operators.</div>
        </div>

        {/* Action buttons */}
        {!sub.isMock && sub.status === "pending_review" && (
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => onAction(sub.id, "accepted")} style={{ flex: 1, padding: isMobile ? "15px 0" : "11px 0", background: C.greenDim, border: `1px solid ${C.greenBorder}`, borderRadius: 8, color: C.green, fontFamily: C.fontMono, fontWeight: 600, fontSize: isMobile ? 13 : 11, cursor: "pointer", letterSpacing: 1 }}>✓ ACCEPT</button>
            <button onClick={() => onAction(sub.id, "escalated")} style={{ flex: 1, padding: isMobile ? "15px 0" : "11px 0", background: C.redDim, border: `1px solid ${C.redBorder}`, borderRadius: 8, color: C.red, fontFamily: C.fontMono, fontWeight: 600, fontSize: isMobile ? 13 : 11, cursor: "pointer", letterSpacing: 1 }}>↑ ESCALATE</button>
            <button onClick={() => onAction(sub.id, "rejected")} style={{ flex: 1, padding: isMobile ? "15px 0" : "11px 0", background: C.grayDim, border: `1px solid rgba(107,114,128,0.25)`, borderRadius: 8, color: C.gray, fontFamily: C.fontMono, fontWeight: 600, fontSize: isMobile ? 13 : 11, cursor: "pointer", letterSpacing: 1 }}>✕ REJECT</button>
          </div>
        )}

        {sub.isMock && (
          <div style={{ padding: "12px 14px", borderRadius: 8, background: C.goldDim, border: `1px solid ${C.goldBorder}`, fontFamily: C.fontMono, fontSize: 9, color: C.gold, textAlign: "center", letterSpacing: 0.5 }}>
            DEMO SCENARIO — Real submissions show action buttons here
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function StatPill({ label, value, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "7px 18px", borderRight: `1px solid ${C.border}` }}>
      <span style={{ fontFamily: C.fontMono, fontSize: 20, fontWeight: 700, color: color || C.textPrimary, lineHeight: 1 }}>{value}</span>
      <span style={{ fontFamily: C.fontMono, fontSize: 8, color: C.textDim, marginTop: 3, letterSpacing: 0.8 }}>{label}</span>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function CityShieldDashboard() {
  const [realSubmissions, setRealSubmissions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showCitizenForm, setShowCitizenForm] = useState(false);
  const [newAlert, setNewAlert] = useState(null);
  const [time, setTime] = useState(new Date());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const tick = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const fetchSubmissions = async () => {
    const { data, error } = await supabase.from('submissions').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setRealSubmissions(prev => {
        if (data.length > prev.length && prev.length > 0) {
          setNewAlert(data[0].id);
          setTimeout(() => setNewAlert(null), 4000);
        }
        return data;
      });
    }
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
    if (isMobile) setSelected(null); // go back to list after action on mobile
  };

  if (showCitizenForm) {
    return <CitizenUpload onBack={() => { setShowCitizenForm(false); fetchSubmissions(); }} />;
  }

  const allSubmissions = [...realSubmissions, ...MOCK_SUBMISSIONS];
  const filtered = filter === "all" ? allSubmissions
    : filter === "pending" ? allSubmissions.filter(s => s.status === "pending_review")
    : allSubmissions.filter(s => s.incident_type === filter);

  const pending = allSubmissions.filter(s => s.status === "pending_review").length;
  const timeStr = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const dateStr = time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).toUpperCase();

  // ── Mobile layout ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ fontFamily: C.fontMain, background: C.bg, minHeight: "100vh", color: C.textPrimary }}>
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
        <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} } * { -webkit-tap-highlight-color: transparent; }`}</style>

        {/* Mobile header */}
        <div style={{ background: C.gold, padding: "5px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: C.fontMono, fontSize: 8, color: "#0D1B2A", fontWeight: 700, letterSpacing: 1 }}>CITY SHIELD — AUTHORIZED PERSONNEL ONLY</span>
          <span style={{ fontFamily: C.fontMono, fontSize: 8, color: "#0D1B2A", fontWeight: 600 }}>{timeStr}</span>
        </div>

        <div style={{ background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${C.border}`, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo.png" alt="City Shield" style={{ width: 32, height: 32, borderRadius: 6, objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
            <div>
              <div style={{ fontFamily: C.fontMono, fontWeight: 700, fontSize: 13, letterSpacing: 1.5, color: C.textPrimary }}>CITY SHIELD</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, animation: "blink 2s infinite" }} />
                <span style={{ fontFamily: C.fontMono, fontSize: 8, color: C.green, letterSpacing: 1 }}>SYSTEM LIVE</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ textAlign: "center", padding: "4px 10px", background: C.amberDim, border: `1px solid ${C.amberBorder}`, borderRadius: 6 }}>
              <div style={{ fontFamily: C.fontMono, fontSize: 16, fontWeight: 700, color: C.amber, lineHeight: 1 }}>{pending}</div>
              <div style={{ fontFamily: C.fontMono, fontSize: 7, color: C.textDim, letterSpacing: 0.5 }}>PENDING</div>
            </div>
            <button onClick={fetchSubmissions} style={{ padding: "8px 10px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: C.textDim, fontFamily: C.fontMono, fontSize: 13, cursor: "pointer" }}>↻</button>
          </div>
        </div>

        {/* Alert banner */}
        {newAlert && (
          <div style={{ background: C.redDim, borderBottom: `1px solid ${C.redBorder}`, padding: "8px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.red, animation: "blink 0.5s infinite", flexShrink: 0 }} />
            <span style={{ fontFamily: C.fontMono, fontSize: 10, color: C.red, letterSpacing: 0.5 }}>▲ NEW SUBMISSION RECEIVED — TAP TO REVIEW</span>
          </div>
        )}

        {/* Filter tabs — scrollable */}
        <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 6, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          {[
            { key: "all", label: "ALL" },
            { key: "pending", label: `PENDING (${pending})` },
            { key: "structure_fire", label: "🔥" },
            { key: "medical", label: "🫀" },
            { key: "vehicle_accident", label: "🚗" },
            { key: "silent_witness", label: "👁" },
            { key: "hazmat", label: "⚠️" },
          ].map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
              padding: "7px 12px", borderRadius: 6, border: "none", flexShrink: 0,
              background: filter === tab.key ? C.goldDim : "rgba(255,255,255,0.04)",
              color: filter === tab.key ? C.gold : C.textDim,
              fontFamily: C.fontMono, fontSize: 10, cursor: "pointer",
              outline: filter === tab.key ? `1px solid ${C.goldBorder}` : "none",
              letterSpacing: 0.8,
            }}>{tab.label}</button>
          ))}
        </div>

        {/* Card list */}
        <div style={{ padding: "12px 14px", paddingBottom: 100 }}>
          {realSubmissions.length > 0 && (
            <div style={{ fontFamily: C.fontMono, fontSize: 8, color: C.green, letterSpacing: 1.5, marginBottom: 10 }}>● LIVE SUBMISSIONS</div>
          )}
          {filtered.filter(s => !s.isMock).map(sub => (
            <MediaCard key={sub.id} sub={sub} isSelected={false} onClick={() => setSelected(sub)} isMobile={true} />
          ))}
          <div style={{ fontFamily: C.fontMono, fontSize: 8, color: C.textDim, letterSpacing: 1.5, margin: "14px 0 10px 0" }}>○ DEMO SCENARIOS</div>
          {filtered.filter(s => s.isMock).map(sub => (
            <MediaCard key={sub.id} sub={sub} isSelected={false} onClick={() => setSelected(sub)} isMobile={true} />
          ))}
        </div>

        {/* Detail overlay */}
        {selected && (
          <DetailPanel sub={selected} onAction={handleAction} onBack={() => setSelected(null)} isMobile={true} />
        )}

        {/* Bottom navigation bar */}
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
          background: "#0A1520", borderTop: `1px solid ${C.border}`,
          display: "flex", alignItems: "stretch",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}>
          <button
            onClick={() => { setSelected(null); setShowCitizenForm(false); }}
            style={{ flex: 1, padding: "14px 0", background: "transparent", border: "none", borderRight: `1px solid ${C.border}`, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
          >
            <span style={{ fontSize: 20 }}>📋</span>
            <span style={{ fontFamily: C.fontMono, fontSize: 8, color: C.textDim, letterSpacing: 0.8 }}>INCIDENTS</span>
          </button>
          <button
            onClick={() => setShowCitizenForm(true)}
            style={{ flex: 1, padding: "14px 0", background: C.goldDim, border: "none", borderRight: `1px solid ${C.border}`, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
          >
            <span style={{ fontSize: 20 }}>📤</span>
            <span style={{ fontFamily: C.fontMono, fontSize: 8, color: C.gold, letterSpacing: 0.8 }}>REPORT</span>
          </button>
          <button
            onClick={fetchSubmissions}
            style={{ flex: 1, padding: "14px 0", background: "transparent", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
          >
            <span style={{ fontSize: 20 }}>↻</span>
            <span style={{ fontFamily: C.fontMono, fontSize: 8, color: C.textDim, letterSpacing: 0.8 }}>REFRESH</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Desktop layout ─────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: C.fontMain, background: C.bg, minHeight: "100vh", color: C.textPrimary, display: "flex", flexDirection: "column" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>

      <div style={{ background: C.gold, padding: "4px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: C.fontMono, fontSize: 9, color: "#0D1B2A", fontWeight: 600, letterSpacing: 1.5 }}>● CITY SHIELD — DISPATCH INTELLIGENCE PLATFORM — AUTHORIZED PERSONNEL ONLY</span>
        <span style={{ fontFamily: C.fontMono, fontSize: 9, color: "#0D1B2A", fontWeight: 600 }}>{dateStr} · {timeStr}</span>
      </div>

      <div style={{ background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${C.border}`, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 54, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/logo.png" alt="City Shield" style={{ width: 38, height: 38, borderRadius: 8, objectFit: "contain" }} onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
          <div style={{ width: 38, height: 38, borderRadius: 6, background: `linear-gradient(135deg, ${C.blue}, ${C.gold})`, alignItems: "center", justifyContent: "center", fontSize: 18, display: "none" }}>🛡️</div>
          <div>
            <div style={{ fontFamily: C.fontMono, fontWeight: 700, fontSize: 14, letterSpacing: 1.5, color: C.textPrimary }}>CITY SHIELD</div>
            <div style={{ fontFamily: C.fontMono, fontSize: 8, color: C.textDim, letterSpacing: 1 }}>REAL-TIME CITIZEN INTELLIGENCE</div>
          </div>
        </div>

        <div style={{ display: "flex", background: "rgba(255,255,255,0.02)", borderRadius: 6, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <StatPill label="PENDING" value={pending} color={C.amber} />
          <StatPill label="REAL SUBMISSIONS" value={realSubmissions.length} color={C.green} />
          <StatPill label="TOTAL INCIDENTS" value={allSubmissions.length} color={C.textSecond} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, boxShadow: `0 0 8px ${C.green}`, animation: "blink 2s infinite" }} />
          <span style={{ fontFamily: C.fontMono, fontSize: 9, color: C.green, letterSpacing: 1 }}>SYSTEM LIVE</span>
          <div style={{ marginLeft: 8, padding: "4px 12px", borderRadius: 4, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, fontFamily: C.fontMono, fontSize: 9, color: C.textDim }}>DISPATCHER: KIM, J. · DIV 3</div>
          <button onClick={fetchSubmissions} style={{ padding: "5px 10px", borderRadius: 4, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, fontFamily: C.fontMono, fontSize: 10, color: C.textDim, cursor: "pointer" }}>↻</button>
          <button onClick={() => setShowCitizenForm(true)} style={{ padding: "6px 14px", borderRadius: 4, background: C.goldDim, border: `1px solid ${C.goldBorder}`, color: C.gold, fontFamily: C.fontMono, fontSize: 9, cursor: "pointer", letterSpacing: 1, fontWeight: 600 }}>+ CITIZEN REPORT</button>
        </div>
      </div>

      {newAlert && (
        <div style={{ background: C.redDim, borderBottom: `1px solid ${C.redBorder}`, padding: "7px 24px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.red, animation: "blink 0.5s infinite" }} />
          <span style={{ fontFamily: C.fontMono, fontSize: 10, color: C.red, letterSpacing: 0.8 }}>▲ NEW VERIFIED SUBMISSION RECEIVED — CLICK TO REVIEW</span>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ width: 400, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 3, overflowX: "auto" }}>
            {[
              { key: "all", label: "ALL" },
              { key: "pending", label: `PENDING (${pending})` },
              { key: "structure_fire", label: "🔥 FIRE" },
              { key: "medical", label: "🫀 MEDICAL" },
              { key: "vehicle_accident", label: "🚗 VEHICLE" },
              { key: "silent_witness", label: "👁 SILENT" },
            ].map(tab => (
              <button key={tab.key} onClick={() => setFilter(tab.key)} style={{ padding: "4px 10px", borderRadius: 4, border: "none", background: filter === tab.key ? C.goldDim : "transparent", color: filter === tab.key ? C.gold : C.textDim, fontFamily: C.fontMono, fontSize: 9, cursor: "pointer", whiteSpace: "nowrap", outline: filter === tab.key ? `1px solid ${C.goldBorder}` : "none", letterSpacing: 0.8 }}>{tab.label}</button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
            {realSubmissions.length > 0 && <div style={{ fontFamily: C.fontMono, fontSize: 8, color: C.green, letterSpacing: 1.5, marginBottom: 8, padding: "0 4px" }}>● LIVE SUBMISSIONS</div>}
            {filtered.filter(s => !s.isMock).map(sub => (
              <MediaCard key={sub.id} sub={sub} isSelected={selected?.id === sub.id} onClick={() => setSelected(sub)} isMobile={false} />
            ))}
            <div style={{ fontFamily: C.fontMono, fontSize: 8, color: C.textDim, letterSpacing: 1.5, margin: "12px 0 8px 4px" }}>○ DEMO SCENARIOS</div>
            {filtered.filter(s => s.isMock).map(sub => (
              <MediaCard key={sub.id} sub={sub} isSelected={selected?.id === sub.id} onClick={() => setSelected(sub)} isMobile={false} />
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "7px 24px", borderBottom: `1px solid ${C.goldBorder}`, background: C.goldDim, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11 }}>⚠️</span>
            <span style={{ fontFamily: C.fontMono, fontSize: 9, color: C.gold, letterSpacing: 0.5 }}>ALL AI SCORES ARE ADVISORY ESTIMATES — HUMAN DISPATCHERS RETAIN FULL AUTHORITY</span>
          </div>
          <DetailPanel sub={selected} onAction={handleAction} onBack={() => setSelected(null)} isMobile={false} />
        </div>
      </div>
    </div>
  );
}
