import React, { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "./assets/rci-logo.png";

const RADIO_GREEN = "#4CAF50";

// Inject custom radio styles once
const customRadioStyles = `
.custom-radio {
  appearance: none;
  width: 1.4em;
  height: 1.4em;
  border: 2px solid ${RADIO_GREEN};
  border-radius: 50%;
  outline: none;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s;
  position: relative;
  vertical-align: middle;
  margin-right: 0.5em;
}
.custom-radio:checked {
  border-color: ${RADIO_GREEN};
  background: radial-gradient(circle at center, ${RADIO_GREEN} 60%, #fff 62%);
}
.custom-radio:focus {
  box-shadow: 0 0 2px 2px ${RADIO_GREEN}22;
}
`;

if (typeof document !== "undefined" && !document.getElementById("custom-radio-style")) {
  const style = document.createElement("style");
  style.id = "custom-radio-style";
  style.innerHTML = customRadioStyles;
  document.head.appendChild(style);
}

const QUESTIONS = [
  { key: "overallServiceQuality", label: "The overall quality of landscape maintenance has consistently met or exceeded expectations." },
  { key: "reliabilityOfService",   label: "RCI has consistently delivered services according to the agreed schedule." },
  { key: "attentionToDetail",      label: "Crews have shown thoroughness and attention to detail during maintenance visits." },
  { key: "communicationFollowThrough", label: "RCI communicates effectively and follows through on requests, concerns, and recommendations." },
  { key: "professionalismOfStaff", label: "RCI staff continue to represent the company with professionalism and courtesy." },
  { key: "qualityOfReporting",     label: "Reports, updates, or service documentation have been timely and useful." },
  { key: "likelihoodToRecommend",  label: "Based on the service so far, I would recommend RCI to others." },
];

export default function NinetyDaySurveyForm({ onSubmit }) {
  const navigate = useNavigate();
  const location = useLocation();

    // Read query params (same as 30-day)
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const prefilledProperty = searchParams.get("property") || "";
  const qEmail      = searchParams.get("email") || "";
  const qSurveyType = searchParams.get("surveyType") || "Ninety";
  const qRecordId   = searchParams.get("recordId") || "";
  const qAM         = searchParams.get("am") || "";
  const qRM         = searchParams.get("rm") || "";
  const qDM         = searchParams.get("dm") || "";

  // State
  const [propertyName, setPropertyName] = useState(prefilledProperty);
  const [lockProperty, setLockProperty] = useState(Boolean(prefilledProperty));
  const [form, setForm] = useState(QUESTIONS.reduce((acc, q) => ({ ...acc, [q.key]: "" }), {}));
  const [additionalFeedback, setAdditionalFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        surveyType: "ninetyDay",
        form: { ...form, additionalFeedback, propertyName },
        meta: {
          property: propertyName,
          email: qEmail,
          surveyTypeRaw: qSurveyType, // "Ninety"
          recordId: qRecordId,
          am: qAM,
          rm: qRM,
          dm: qDM,
          submittedAt: new Date().toISOString(),
        },
      };

      const res = await fetch("/api/submitSurvey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Submission failed");
      setSubmitted(true);
    } catch (err) {
      alert(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Build the same “service request” link shown on the 30-day thank-you page
  const serviceRequestBase = "https://employee-safe-space.vercel.app/service-request";
  const serviceRequestUrl = useMemo(() => {
    const u = new URL(serviceRequestBase);
    u.searchParams.set("clientName", propertyName || "");
    u.searchParams.set("clientEmail", qEmail || "");
    const firstManager =
      (qAM.split(",").map(s => s.trim()).find(Boolean)) ||
      (qRM.split(",").map(s => s.trim()).find(Boolean)) ||
      (qDM.split(",").map(s => s.trim()).find(Boolean)) || "";
    u.searchParams.set("managerEmail", firstManager);
    u.searchParams.set("recordId", qRecordId || "");
    return u.toString();
  }, [propertyName, qEmail, qAM, qRM, qDM, qRecordId]);

  if (submitted) {
    return (
      <div style={styles.centeredContainer}>
        <div style={styles.thankYou}>Thank you for your feedback!</div>

        {/* Request Service CTA (same pattern as 30-day) */}
        <a
          href={serviceRequestUrl}
          style={{
            display: "inline-block",
            padding: "0.7rem 2.2rem",
            borderRadius: 7,
            fontWeight: 700,
            fontSize: "1.05rem",
            backgroundColor: "#4CAF50",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            marginTop: "1rem",
            boxShadow: "0 2px 8px rgba(44,62,80,0.08)",
            textDecoration: "none",
          }}
        >
          Submit a Service Request
        </a>

        <button
          type="button"
          style={{
            ...styles.button,
            width: "auto",
            minWidth: 180,
            marginTop: "1rem",
            alignSelf: "center",
            backgroundColor: "#888",
          }}
          onClick={() => navigate("/")}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div style={styles.outer}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <img src={logo} alt="RCI Logo" style={styles.logo} />
        <h2 style={styles.title}>90-Day Satisfaction Survey</h2>

        {/* Property (prefill + lock toggle) */}
        <div style={{ width: "100%", marginBottom: 16 }}>
          <label htmlFor="propertyName" style={styles.label}>Property</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              id="propertyName"
              name="propertyName"
              type="text"
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
              style={{ flex: 1, borderRadius: 8, padding: 8, border: "1px solid #ccc", marginTop: 8 }}
              readOnly={lockProperty}
              placeholder="Enter property name"
              required
            />
            {prefilledProperty && (
              <button
                type="button"
                onClick={() => setLockProperty(v => !v)}
                style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
              >
                {lockProperty ? "Edit" : "Lock"}
              </button>
            )}
          </div>
        </div>

        {QUESTIONS.map((q, idx) => (
          <div key={q.key} style={styles.questionBlock}>
            <div style={styles.label}>{idx + 1}. {q.label}</div>
            <div style={styles.scaleRow}>
              {[1,2,3,4,5].map(num => (
                <label key={num} style={styles.radioLabel}>
                  <input
                    className="custom-radio"
                    type="radio"
                    name={q.key}
                    value={num}
                    checked={form[q.key] === String(num)}
                    onChange={handleChange}
                    required
                  />
                  {num}
                </label>
              ))}
            </div>
          </div>
        ))}

        {/* Freeform feedback */}
        <div style={{ width: "100%", marginTop: 24 }}>
          <label htmlFor="additionalFeedback" style={styles.label}>
            Is there anything else you’d like to share about your experience so far?
          </label>
          <textarea
            id="additionalFeedback"
            name="additionalFeedback"
            value={additionalFeedback}
            onChange={(e) => setAdditionalFeedback(e.target.value)}
            rows={4}
            style={{ width: "100%", borderRadius: 8, padding: 8, borderColor: "#ccc", marginTop: 8 }}
          />
        </div>

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Submitting..." : "Submit"}
        </button>
        <button
          type="button"
          onClick={() => navigate("/")}
          style={{ ...styles.button, marginTop: "1rem", backgroundColor: "#888" }}
        >
          Cancel / Back
        </button>
      </form>
    </div>
  );
}


// ---- STYLES ---- (unchanged)
const styles = {
  outer: { minHeight: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f6fa", padding: 0, },
  form: { width: "100%", maxWidth: 440, margin: "0 auto", padding: "2rem 1.5rem", background: "#fff", borderRadius: 12, boxShadow: "0 4px 24px 0 rgba(44,62,80,0.12)", display: "flex", flexDirection: "column", alignItems: "center", },
  logo: { width: 140, maxWidth: "70vw", marginBottom: 24, display: "block", },
  title: { textAlign: "center", fontWeight: 700, fontSize: "1.25rem", marginBottom: 24, color: "#274a25", letterSpacing: 0.5, },
  questionBlock: { width: "100%", marginBottom: 28, textAlign: "center", },
  label: { fontWeight: 500, fontSize: "1rem", marginBottom: 12, color: "#333", },
  scaleRow: { display: "flex", justifyContent: "center", gap: 18, },
  radioLabel: { display: "flex", flexDirection: "column", alignItems: "center", fontSize: 16, cursor: "pointer", gap: 4, },
  button: { padding: "0.7rem 2.2rem", borderRadius: 7, fontWeight: 700, fontSize: "1.15rem", marginTop: "1.2rem", backgroundColor: "#4CAF50", color: "#fff", border: "none", cursor: "pointer", width: "100%", maxWidth: 220, transition: "background 0.2s", boxShadow: "0 2px 8px 0 rgba(44,62,80,0.08)", },
  centeredContainer: {
  position: "fixed",
  inset: 0,
  display: "grid",
  placeItems: "center",
  textAlign: "center",
  background: "#fff",
  padding: "2rem",
},
  thankYou: { fontWeight: 600, fontSize: "1.35rem", color: "#4CAF50", textAlign: "center", marginTop: "2rem", },
};
