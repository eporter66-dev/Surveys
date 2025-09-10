import React from "react";
import { Routes, Route } from "react-router-dom";
import SurveyHome from "./SurveyHome";
import ThirtyDaySurveyForm from "./thirtyDayStart";
import NinetyDaySurveyForm from "./ninetyDaySurvey";
import PreRenewalSurveyForm from "./preRenewalSurvey";

// Constants for Quickbase
const QB_REALM = import.meta.env.VITE_QB_REALM;
const QUICKBASE_TOKEN = import.meta.env.VITE_QB_USER_TOKEN;


// Field maps per survey
const FIELD_MAPS = {
  thirtyDay: {
    communicationOnboarding: "14",
    professionalism: "8",
    responsiveness: "9",
    serviceQuality: "10",
    scopeAlignment: "11",
    proactiveCommunication: "12",
    easeOfWorking: "13",
  },
  ninetyDay: {
    overallServiceQuality: "15",
    reliabilityOfService: "16",
    attentionToDetail: "17",
    communicationFollowThrough: "18", 
    professionalismOfStaff: "19",
    qualityOfReporting: "20",
    likelihoodToRecommend: "21",
  },
  preRenewal: {
    reliabilityConsistency: "22",
    serviceImprovements: "23",
    communicationSupport: "24",
    partnershipResponsiveness: "25",
    qualityOfEnhancements: "26",
    easeOfWorkingTogether: "27",
    renewalLikelihood: "28",
  },
};

function mapToQuickbase(form, fieldMap) {
  return Object.keys(fieldMap).map(key => ({
    [fieldMap[key]]: { value: parseInt(form[key]) }
  })).reduce((acc, item) => ({ ...acc, ...item }), {});
}

function buildSurveySubmitter(surveyType) {
  return async function sendToServerless(form) {
    const response = await fetch('/api/submitSurvey', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ form, surveyType }),
    });

    if (!response.ok) {
      alert("There was an error submitting your survey.");
      throw new Error("Survey submission failed");
    }

    return response.json();
  };
}


export default function App() {
  return (
    <Routes>
       <Route path="/" element={<SurveyHome />} />
      <Route path="/survey-one" element={
  <ThirtyDaySurveyForm onSubmit={buildSurveySubmitter("thirtyDay")} />
} />
<Route path="/survey-two" element={
  <NinetyDaySurveyForm onSubmit={buildSurveySubmitter("ninetyDay")} />
} />
<Route path="/survey-three" element={
  <PreRenewalSurveyForm onSubmit={buildSurveySubmitter("preRenewal")} />
} />

    </Routes>
  );
}
