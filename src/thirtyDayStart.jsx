import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  {
    key: "communicationOnboarding",
    label: "The onboarding process was clear, timely, and well-communicated.",
  },
  {
    key: "professionalism",
    label: "RCI staff have been professional and courteous during all interactions.",
  },
  {
    key: "responsiveness",
    label: "Questions, concerns, or requests have been addressed promptly.",
  },
  {
    key: "serviceQuality",
    label: "The appearance and condition of the landscaped areas meet expectations.",
  },
  {
    key: "scopeAlignment",
    label: "The services provided align with the expectations outlined in the agreement.",
  },
  {
    key: "proactiveCommunication",
    label: "RCI has kept us informed of issues, changes, or recommendations proactively.",
  },
  {
    key: "easeOfWorking",
    label: "Working with RCI has been straightforward and hassle-free.",
  },
];

export default function ThirtyDaySurveyForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState(
    QUESTIONS.reduce((acc, q) => ({ ...acc, [q.key]: "" }), {})
  );
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/submitSurvey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surveyType: "thirtyDay",
          form: { ...form },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Submission failed");
      }

      setSubmitted(true);
    } catch (error) {
      alert(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div style={styles.centeredContainer}>
        <div style={styles.thankYou}>Thank you for your feedback!</div>
        <button
          style={{ ...styles.button, marginTop: "1.5rem" }}
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
        <h2 style={styles.title}>30 Days After Start of Service Survey</h2>
        {QUESTIONS.map((q, idx) => (
          <div key={q.key} style={styles.questionBlock}>
            <div style={styles.label}>
              {idx + 1}. {q.label}
            </div>
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
                  />
                  {num}
                </label>
              ))}
            </div>
          </div>
        ))}
        <button
          type="submit"
          disabled={loading}
          style={styles.button}
        >
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

// ---- STYLES ----
const styles = {
  outer: {
    minHeight: "100vh",
    width: "100vw",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f6fa",
    padding: 0,
  },
  form: {
    width: "100%",
    maxWidth: 420,
    margin: "0 auto",
    padding: "2rem 1.5rem",
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 4px 24px 0 rgba(44,62,80,0.12)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  logo: {
    width: 140,
    maxWidth: "70vw",
    marginBottom: 24,
    display: "block",
  },
  title: {
    textAlign: "center",
    fontWeight: 700,
    fontSize: "1.25rem",
    marginBottom: 24,
    color: "#274a25",
    letterSpacing: 0.5,
  },
  questionBlock: {
    width: "100%",
    marginBottom: 28,
    textAlign: "center",
  },
  label: {
    fontWeight: 500,
    fontSize: "1rem",
    marginBottom: 12,
    color: "#333",
  },
  scaleRow: {
    display: "flex",
    justifyContent: "center",
    gap: 18,
  },
  radioLabel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontSize: 16,
    cursor: "pointer",
    gap: 4,
  },
  button: {
    padding: "0.7rem 2.2rem",
    borderRadius: 7,
    fontWeight: 700,
    fontSize: "1.15rem",
    marginTop: "1.2rem",
    backgroundColor: "#4CAF50",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    width: "100%",
    maxWidth: 220,
    transition: "background 0.2s",
    boxShadow: "0 2px 8px 0 rgba(44,62,80,0.08)",
  },
  centeredContainer: {
    minHeight: "70vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
  },
  thankYou: {
    fontWeight: 600,
    fontSize: "1.35rem",
    color: "#4CAF50",
    textAlign: "center",
    marginTop: "2rem",
  },
};
