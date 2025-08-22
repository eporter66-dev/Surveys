// api/sendSurveyEmails.js  (Vercel serverless function, ESM)
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Map CSV filenames by group
const SURVEY_CSV_FILES = {
  Thirty: 'thirty.csv',
  Ninety: 'ninety.csv',
  'Pre-Renew': 'prerenew.csv',
  Yearly: 'yearly.csv',
};

// Links to include in the email body
const SURVEY_LINKS = {
  Thirty: 'https://surveys-kf0j08s7j-elizabeth-porters-projects.vercel.app/thirtyDayStart',
  Ninety: 'https://surveys-kf0j08s7j-elizabeth-porters-projects.vercel.app/ninetyDaySurvey',
  'Pre-Renew': 'https://surveys-kf0j08s7j-elizabeth-porters-projects.vercel.app/preRenewalSurvey',
  Yearly: 'https://surveys-kf0j08s7j-elizabeth-porters-projects.vercel.app/yearlySurvey',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Read optional ?type=Ninety filter from query string
    const url = new URL(req.url, `http://${req.headers.host}`);
    const typeFilter = url.searchParams.get('type'); // optional

    // Keep your CSVs in /data at the repo root, or set SURVEY_BASE_PATH
    const basePath = process.env.SURVEY_BASE_PATH || path.join(process.cwd(), 'data');

    const entries = typeFilter
      ? Object.entries(SURVEY_CSV_FILES).filter(([t]) => t === typeFilter)
      : Object.entries(SURVEY_CSV_FILES);

    let totalSent = 0;

    for (const [type, filename] of entries) {
      const filePath = path.join(basePath, filename);
      if (!fs.existsSync(filePath)) continue;

      const content = fs.readFileSync(filePath, 'utf8');
      const records = parse(content, { columns: true, skip_empty_lines: true });

      const surveyLink = SURVEY_LINKS[type];
      const results = await Promise.allSettled(
        records.map(async (row) => {
          const name = row['Property Name'];
          const email = row['Contact Email'];
          if (!email) return;

          await sgMail.send({
            to: email,
            from: 'serviceupdate@rotoloconsultants.com', // must be a verified sender/domain in SendGrid
            subject: `Your ${type} Survey is Ready`,
            html: `
              <p>Hi ${name || 'there'},</p>
              <p>Please take a moment to complete your <strong>${type}</strong> survey:</p>
              <p><a href="${surveyLink}">${surveyLink}</a></p>
              <p>Thank you!</p>
            `,
          });
        })
      );

      totalSent += results.filter(r => r.status === 'fulfilled').length;
    }

    return res.status(200).json({ status: 'Emails sent', count: totalSent });
  } catch (err) {
    console.error('❌ Email dispatch error:', err);
    return res.status(500).json({ error: 'Failed to send survey emails', detail: err.message });
  }
}
