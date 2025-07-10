import SurveyForm from "./SurveyForm";

// Replace with your values
const QB_REALM = "rotoloconsultants.quickbase.com";
const QB_TABLE_ID = "bu947ida4";
const QB_USER_TOKEN = "b9qytm_ppjb_0_8znjjguci98qcnyffg8ddrjpa7";

// Map your survey keys to Quickbase field IDs:
const FIELD_MAP = {
  communicationOnboarding: "14",   // Replace with your field IDs!
  professionalism: "8",
  responsiveness: "9",
  serviceQuality: "10",
  scopeAlignment: "11",
  proactiveCommunication: "12",
  easeOfWorking: "13",
};

function mapToQuickbase(form) {
  // Quickbase wants field ID as key and value object
  return Object.keys(FIELD_MAP).map(key => ({
    [FIELD_MAP[key]]: { value: parseInt(form[key]) }
  })).reduce((acc, item) => ({ ...acc, ...item }), {});
}

async function sendToQuickbase(form) {
  const qbData = {
    to: QB_TABLE_ID,
    data: [
      mapToQuickbase(form)
    ]
  };

  const response = await fetch(`https://${QB_REALM}/v1/records`, {
    method: "POST",
    headers: {
      "QB-Realm-Hostname": QB_REALM,
      "User-Agent": "SurveyApp",
      "Authorization": `QB-USER-TOKEN ${QB_USER_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(qbData)
  });

  if (!response.ok) {
    alert("There was an error submitting your survey.");
    throw new Error("Quickbase error");
  }
  return response.json();
}

export default function App() {
  return (
    <div>
      <SurveyForm onSubmit={sendToQuickbase} />
    </div>
  );
}
