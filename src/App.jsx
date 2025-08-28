import React from "react";
import { Routes, Route } from "react-router-dom";
import SurveyHome from "./SurveyHome";
import ThirtyDaySurveyForm from "./thirtyDayStart";
import NinetyDaySurveyForm from "./ninetyDaySurvey";
import PreRenewalSurveyForm from "./preRenewalSurvey";

// Constants for Quickbase
const QB_REALM = import.meta.env.VITE_QB_REALM;
const QB_USER_TOKEN = import.meta.env.VITE_QB_USER_TOKEN;


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

function buildQuickbaseSender(tableId, fieldMap) {
  return async function sendToQuickbase(form) {
    const qbData = {
      to: tableId,
      data: [mapToQuickbase(form, fieldMap)],
    };

    const response = await fetch(`https://${QB_REALM}/v1/records`, {
      method: "POST",
      headers: {
        "QB-Realm-Hostname": QB_REALM,
        "User-Agent": "SurveyApp",
        "Authorization": `QB-USER-TOKEN ${QUICKBASE_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(qbData),
    });


    if (!response.ok) {
      alert("There was an error submitting your survey.");
      throw new Error("Quickbase error");
    }
    return response.json();
  };
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SurveyHome />} />
      <Route path="/survey-30day" element={
        <ThirtyDaySurveyForm onSubmit={buildQuickbaseSender("bu947ida4", FIELD_MAPS.thirtyDay)} />
      } />
      <Route path="/survey-90day" element={
        <NinetyDaySurveyForm onSubmit={buildQuickbaseSender("bu947ida4", FIELD_MAPS.ninetyDay)} />
      } />
      <Route path="/survey-prerenewal" element={
        <PreRenewalSurveyForm onSubmit={buildQuickbaseSender("bu947ida4", FIELD_MAPS.preRenewal)} />
      } />
    </Routes>
  );
}
