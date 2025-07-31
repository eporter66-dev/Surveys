// /api/sendSurveys.js
import fetch from 'node-fetch';
import sgMail from '@sendgrid/mail';

const QB_REALM = process.env.QB_REALM;
const QB_USER_TOKEN = process.env.QB_USER_TOKEN;
const TABLE_ID = process.env.QB_TABLE_ID;
const FIELD_SURVEY_TYPE = 241;
const FIELD_EMAIL = 3;
const FIELD_NAME = 6;
const FIELD_SENT_FLAG = 243; // checkbox field to mark as sent

const SURVEY_LINKS = {
  Thirty: "https://yourdomain.com/survey-30day",
  Ninety: "https://yourdomain.com/survey-90day",
  "Pre-Renew": "https://yourdomain.com/survey-prerenewal"
};

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  try {
    if (!QB_REALM || !QB_USER_TOKEN || !TABLE_ID || !process.env.SENDGRID_API_KEY) {
      return res.status(500).json({ error: "Missing environment configuration" });
    }

    const queryPayload = {
      from: TABLE_ID,
      select: [FIELD_EMAIL, FIELD_SURVEY_TYPE, FIELD_NAME],
      where: `{${FIELD_SURVEY_TYPE}.EX.'Thirty'} OR {${FIELD_SURVEY_TYPE}.EX.'Ninety'} OR {${FIELD_SURVEY_TYPE}.EX.'Pre-Renew'} AND {${FIELD_SENT_FLAG}.EX.''}`
    };

    const qbRes = await fetch(`https://${QB_REALM}/v1/records/query`, {
      method: "POST",
      headers: {
        "QB-Realm-Hostname": QB_REALM,
        "Authorization": `QB-USER-TOKEN ${QB_USER_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(queryPayload)
    });

    if (!qbRes.ok) {
      const errText = await qbRes.text();
      throw new Error(`Quickbase query failed: ${errText}`);
    }

    const { data } = await qbRes.json();

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(200).json({ status: "No matching records found." });
    }

    const results = await Promise.allSettled(
      data.map(async (record) => {
        const surveyType = record?.[FIELD_SURVEY_TYPE]?.value;
        const email = record?.[FIELD_EMAIL]?.value;
        const name = record?.[FIELD_NAME]?.value || "Valued Client";
        const recordId = record?.id;

        const surveyLink = SURVEY_LINKS[surveyType];
        if (!email || !surveyLink || !recordId) {
          throw new Error(`Missing data for record ${recordId || '[unknown]'}`);
        }

        const msg = {
          to: email,
          from: 'you@yourdomain.com',
          subject: `Your ${surveyType} Survey Is Ready`,
          html: `
            <p>Hi ${name},</p>
            <p>Please complete your <strong>${surveyType}</strong> survey below:</p>
            <p><a href="${surveyLink}">${surveyLink}</a></p>
            <p>Thank you!</p>
          `
        };

        await sgMail.send(msg);

        const updatePayload = {
          to: TABLE_ID,
          data: [{
            id: recordId,
            [FIELD_SENT_FLAG]: { value: true }
          }]
        };

        const updateRes = await fetch(`https://${QB_REALM}/v1/records`, {
          method: "POST",
          headers: {
            "QB-Realm-Hostname": QB_REALM,
            "Authorization": `QB-USER-TOKEN ${QB_USER_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(updatePayload)
        });

        if (!updateRes.ok) {
          const errorText = await updateRes.text();
          throw new Error(`Failed to update record ${recordId}: ${errorText}`);
        }
      })
    );

    const success = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected');

    return res.status(200).json({
      status: "Survey dispatch complete",
      processed: results.length,
      sent: success,
      failed: failed.length,
      failedDetails: failed.map(f => f.reason?.message || "Unknown error")
    });

  } catch (err) {
    console.error("Error sending surveys:", err);
    return res.status(500).json({ error: "Survey dispatch failed", detail: err.message });
  }
}
