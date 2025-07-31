import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "./assets/rci-logo.png";

export default function SurveyHome() {
  const navigate = useNavigate();

  const surveys = [
    {
      title: "30-Day After Start of Service",
      description: "Feedback after the first month of service.",
      route: "/survey-30day",
    },
    {
      title: "90-Day Satisfaction Survey",
      description: "Check-in to assess mid-term performance.",
      route: "/survey-90day",
    },
    {
      title: "Pre-Renewal Satisfaction Survey",
      description: "Evaluate satisfaction before contract renewal.",
      route: "/survey-prerenewal",
    },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <img src={logo} alt="RCI Logo" style={styles.logo} />
        <h1 style={styles.heading}>Select a Survey</h1>
        <div style={styles.grid}>
          {surveys.map((survey) => (
            <div
              key={survey.title}
              style={styles.card}
              onClick={() => navigate(survey.route)}
              onTouchStart={(e) => e.currentTarget.classList.add("touched")}
              onTouchEnd={(e) => e.currentTarget.classList.remove("touched")}
            >
              <h2 style={styles.cardTitle}>{survey.title}</h2>
              <p style={styles.cardText}>{survey.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100vw",
    background: "#f0f4f8",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "1rem",
    boxSizing: "border-box",
  },
  container: {
    width: "100%",
    maxWidth: "960px",
    textAlign: "center",
  },
  logo: {
    width: 140,
    maxWidth: "60vw",
    marginBottom: 20,
  },
  heading: {
    fontSize: "1.8rem",
    fontWeight: 700,
    marginBottom: 24,
    color: "#274a25",
    padding: "0 1rem",
  },
  grid: {
    display: "grid",
    gap: 20,
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    width: "100%",
    padding: "0 1rem",
    boxSizing: "border-box",
  },
  card: {
    background: "#fff",
    padding: "1.5rem",
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    touchAction: "manipulation",
  },
  cardTitle: {
    fontSize: "1.15rem",
    fontWeight: 600,
    marginBottom: 10,
    color: "#2e7d32",
  },
  cardText: {
    fontSize: "0.95rem",
    color: "#444",
    lineHeight: 1.4,
  },
};
