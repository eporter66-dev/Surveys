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
  { key: "reliabilityConsistency",   label: "RCI has delivered services on a consistent and reliable schedule throughout the contract period." },
  { key: "serviceImprovements",      label: "RCI has shown improvement and responsiveness to feedback or concerns over time." },
  { key: "communicationSupport",     label: "Our team has received timely, transparent, and effective communication from RCI." },
  { key: "partnershipResponsiveness",label: "RCI has acted as a true partner, proactively supporting the needs of our property/facility." },
  { key: "qualityOfEnhancements",    label: "Enhancements or suggestions made by RCI have added value to our property or operations." },
  { key: "easeOfWorkingTogether",    label: "Our working relationship with RCI has been collaborative and low-stress." },
  { key: "renewalLikelihood",        label: "We are likely to renew or extend our contract with RCI based on current satisfaction." },
];

export default function PreRenewalSurveyForm() {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const prefilledProperty = searchParams.get("property") || "";
  const qEmail      = searchParams.get("email") || "";
  const qSurveyType = searchParams.get("surveyType") || "Pre-Renew";
  const qRecordId   = searchParams.get("recordId") || "";
  const qAM         = searchParams.get("am") || "";
  const qRM         = searchParams.get("rm") || "";
  const qDM         = searchParams.get("dm") || "";

  // State
  const [propertyName, setPropertyName] = useState(prefilledProperty);
  const [form, setForm] = useState(QUESTIONS.reduce((acc, q) => ({ ...acc, [q.key]: "" }), {}));
  const [suggestions, setSuggestions] = useState("");
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
        surveyType: "preRenewal",
        form: { ...form, suggestions, propertyName },
        meta: {
          property: propertyName,
          email: qEmail,
          surveyTypeRaw: qSurveyType, // "Pre-Renew"
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
    } catch (error) {
      alert(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // “Request service” URL (same pattern as the other forms)
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
{/*}
        <button
          type="button"
          style={{ ...styles.buttonBase, marginTop: "1rem", backgroundColor: "#888" }}
          onClick={() => navigate("/")}
        >
          Back to Home
        </button>
        */}
      </div>
    );
  }

  return (
    <div style={styles.outer}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <img src={logo} alt="RCI Logo" style={styles.logo} />
        <h2 style={styles.title}>Quality Assurance Survey</h2>
        <p style={{ textAlign: "center", marginBottom: 24, fontSize: "0.95rem", color: "#555" }}>
          Please rate each statement on a scale from 1 to 5, where
          <strong> 1 = Don’t Agree</strong> and <strong>5 = Strongly Agree</strong>.
        </p>

        {/* Property (read-only if provided via URL) */}
        <div style={{ width: "100%", marginBottom: 16 }}>
          <label htmlFor="propertyName" style={styles.label}>Property</label>
          <input
            id="propertyName"
            name="propertyName"
            type="text"
            value={propertyName}
            onChange={(e) => setPropertyName(e.target.value)}
            style={{ width: "100%", borderRadius: 8, padding: 8, border: "1px solid #ccc", marginTop: 8 }}
            readOnly={Boolean(prefilledProperty)}
            placeholder="Enter property name"
            required
          />
        </div>

        {QUESTIONS.map((q, idx) => (
          <div key={q.key} style={styles.questionBlock}>
            <div style={styles.label}>{idx + 1}. {q.label}</div>

            {/* Scale with end labels */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
              <span style={{ fontSize: "0.8rem", color: "#666" }}>1 (Don’t Agree)</span>

              <div style={styles.scaleRow}>
                {[1, 2, 3, 4, 5].map((num) => (
                  <label key={num} style={styles.radioLabel}>
                    <input
                      className="custom-radio"
                      type="radio"
                      name={q.key}
                      value={num}
                      checked={form[q.key] === String(num)}
                      onChange={handleChange}
                      required
                      aria-label={`${q.label} – ${num}${num===1 ? " (Don’t Agree)" : num===5 ? " (Strongly Agree)" : ""}`}
                    />
                    {num}
                  </label>
                ))}
              </div>

              <span style={{ fontSize: "0.8rem", color: "#666" }}>5 (Strongly Agree)</span>
            </div>
          </div>
        ))}

        {/* Suggestions */}
        <div style={{ width: "100%", marginTop: 24 }}>
          <label htmlFor="suggestions" style={styles.label}>
            Do you have any suggestions for improvement or feedback you'd like to share?
          </label>
          <textarea
            id="suggestions"
            name="suggestions"
            value={suggestions}
            onChange={(e) => setSuggestions(e.target.value)}
            rows={4}
            style={{ width: "100%", borderRadius: 8, padding: 8, borderColor: "#ccc", marginTop: 8 }}
          />
        </div>

        <button type="submit" disabled={loading} style={{ ...styles.buttonBase, width: "100%", maxWidth: 220, marginTop: "1.2rem" }}>
          {loading ? "Submitting..." : "Submit"}
        </button>
        <button
          type="button"
          onClick={() => navigate("/")}
          style={{ ...styles.buttonBase, width: "100%", maxWidth: 220, marginTop: "1rem", backgroundColor: "#888" }}
        >
          Cancel / Back
        </button>
      </form>
    </div>
  );
}


// ---- STYLES ----
const styles = {
  outer: { minHeight: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f6fa", padding: 0 },
  form: { width: "100%", maxWidth: 440, margin: "0 auto", padding: "2rem 1.5rem", background: "#fff", borderRadius: 12, boxShadow: "0 4px 24px 0 rgba(44,62,80,0.12)", display: "flex", flexDirection: "column", alignItems: "center" },
  logo: { width: 140, maxWidth: "70vw", marginBottom: 24, display: "block" },
  title: { textAlign: "center", fontWeight: 700, fontSize: "1.25rem", marginBottom: 24, color: "#274a25", letterSpacing: 0.5 },
  questionBlock: { width: "100%", marginBottom: 28, textAlign: "center" },
  label: { fontWeight: 500, fontSize: "1rem", marginBottom: 12, color: "#333" },
  scaleRow: { display: "flex", justifyContent: "center", gap: 18 },
  radioLabel: { display: "flex", flexDirection: "column", alignItems: "center", fontSize: 16, cursor: "pointer", gap: 4 },
  buttonBase: {
    padding: "0.7rem 2.2rem",
    borderRadius: 7,
    fontWeight: 700,
    fontSize: "1.15rem",
    backgroundColor: "#4CAF50",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    transition: "background 0.2s",
    boxShadow: "0 2px 8px rgba(44,62,80,0.08)",
  },
  buttonFull: { width: "100%", maxWidth: 220 },
  centeredContainer: {
    position: "fixed",
    inset: 0,
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    background: "#fff",
    padding: "2rem",
  },
  thankYou: { fontWeight: 600, fontSize: "1.35rem", color: "#4CAF50", textAlign: "center", marginTop: "2rem" }
};
