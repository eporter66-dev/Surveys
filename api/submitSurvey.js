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
    [fieldMap[key]]: { value: parseInt(form[key]) },
  })).reduce((acc, item) => ({ ...acc, ...item }), {});
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
