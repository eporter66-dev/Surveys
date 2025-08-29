import axios from 'axios';

const quickbaseApi = axios.create({
  baseURL: 'https://api.quickbase.com/v1',
  headers: {
    'QB-Realm-Hostname': process.env.QUICKBASE_REALM,
    'Authorization': `QB-USER-TOKEN ${process.env.QUICKBASE_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

const TABLE_IDS = {
  thirtyDay: "bvbm4zq8n",
  ninetyDay: "bvbm47nzp",
  preRenewal: "bvbm5bbtr",
};


const FIELD_MAPS = {
  thirtyDay: {
    communicationOnboarding: "6",
    professionalism: "7",
    responsiveness: "8",
    serviceQuality: "9",
    scopeAlignment: "10",
    proactiveCommunication: "12",
    easeOfWorking: "11",
    propertyName: "16",

  },
  ninetyDay: {
    overallServiceQuality: "6",
    reliabilityOfService: "7",
    attentionToDetail: "8",
    communicationFollowThrough: "9", 
    professionalismOfStaff: "10",
    qualityOfReporting: "11",
    likelihoodToRecommend: "12",
    additionalFeedback: "13",
    propertyName: "14",
  },
  preRenewal: {
    reliabilityConsistency: "6",
    serviceImprovements: "7",
    communicationSupport: "8",
    partnershipResponsiveness: "9",
    qualityOfEnhancements: "10",
    easeOfWorkingTogether: "11",
    renewalLikelihood: "12",
    propertyName: "14",
  },
};

function coerceValue(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (trimmed === "") return null;
    if (/^\d+$/.test(trimmed)) return Number(trimmed); // only pure integers become numbers
    return trimmed; // text stays text (e.g., propertyName, suggestions)
  }
  return v;
}

function mapToQuickbase(form, fieldMap) {
  const rec = {};
  for (const [formKey, fieldId] of Object.entries(fieldMap)) {
    rec[fieldId] = { value: coerceValue(form[formKey]) };
  }
  return rec;
}


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { form, surveyType } = req.body;

    if (!form || !surveyType) {
      return res.status(400).json({ error: 'Missing form data or survey type' });
    }

    const fieldMap = FIELD_MAPS[surveyType];
    const tableId = TABLE_IDS[surveyType];

    if (!fieldMap || !tableId) {
      return res.status(400).json({ error: 'Invalid survey type' });
    }

    const qbPayload = {
      to: tableId,
      data: [mapToQuickbase(form, fieldMap)],
    };

    console.log("📤 Submitting to Quickbase table:", tableId);
    console.log("🧾 Payload:", JSON.stringify(qbPayload, null, 2));

    const response = await quickbaseApi.post('/records', qbPayload);

    console.log('✅ Submission successful:', response.data);

    return res.status(200).json({ status: 'Success', result: response.data });
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Submission failed';
    console.error('❌ Submission error:', message);
    return res.status(500).json({ error: 'Quickbase submission failed', detail: message });
  }
}
