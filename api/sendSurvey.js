// /api/sendSurveyEmails.js
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const SURVEY_CSV_FILES = {
  Thirty: "thirty.csv",
  Ninety: "ninety.csv",
  "Pre-Renew": "prerenew.csv",
  Yearly: "yearly.csv"
};

const SURVEY_LINKS = {
  Thirty: "https://surveys-kf0j08s7j-elizabeth-porters-projects.vercel.app/thirtyDayStart",
  Ninety: "https://surveys-kf0j08s7j-elizabeth-porters-projects.vercel.app/ninetyDaySurvey",
  "Pre-Renew": "https://surveys-kf0j08s7j-elizabeth-porters-projects.vercel.app/preRenewalSurvey",
  Yearly: "https://surveys-kf0j08s7j-elizabeth-porters-projects.vercel.app/yearlySurvey" // if needed
};


export default async function handler(req, res) {
  try {
    const basePath = path.resolve('./api');
    let totalEmailsSent = 0;

    for (const [type, filename] of Object.entries(SURVEY_CSV_FILES)) {
      const filePath = path.join(basePath, filename);
      if (!fs.existsSync(filePath)) continue;

      const content = fs.readFileSync(filePath, 'utf8');
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true
      });

      const surveyLink = SURVEY_LINKS[type];
      const results = await Promise.allSettled(
        records.map(async ({ "Property Name": name, "Contact Email": email }) => {
          if (!email) return;

          const msg = {
            to: email,
            from: 'serviceupdate@rotoloconsultants.com', // ✅ Replace with verified sender
            subject: `Your ${type} Survey is Ready`,
            html: `
              <p>Hi ${name},</p>
              <p>Please take a moment to complete your <strong>${type}</strong> survey:</p>
              <p><a href="${surveyLink}">${surveyLink}</a></p>
              <p>Thank you!</p>
            `
          };
          await sgMail.send(msg);
        })
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      totalEmailsSent += successCount;
    }

    res.status(200).json({ status: "Emails sent", count: totalEmailsSent });
  } catch (err) {
    console.error("❌ Email dispatch error:", err);
    res.status(500).json({ error: "Failed to send survey emails", detail: err.message });
  }
}
