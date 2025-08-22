// api/sendSurveyEmails.js  (ESM on Vercel)
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const SURVEY_CSV_FILES = {
  Thirty: 'thirty.csv',
  Ninety: 'ninety.csv',
  'Pre-Renew': 'prerenew.csv',
};

const SURVEY_LINKS = {
  Thirty: 'https://https://surveys-five.vercel.app/survey-30day',
  Ninety: 'https://surveys-five.vercel.app/survey-90day',
  'Pre-Renew': 'https://surveys-five.vercel.app/survey-prerenewal',
};

// tolerant getters + defaults
const getEmail = (row) =>
  (row['Contact Email'] || row['Email'] || row['Email Address'] || row['email'] || '').trim();
const getName = (row) =>
  (row['Property Name'] || row['Name'] || row['Property'] || row['name'] || 'there').trim();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const basePath = (() => {
      const p = process.env.SURVEY_BASE_PATH;
      return p ? (path.isAbsolute(p) ? p : path.join(process.cwd(), p))
               : path.join(process.cwd(), 'data');  // repo-root /data
    })();

    // optional: /api/sendSurveyEmails?type=Ninety
    const url = new URL(req.url, `http://${req.headers.host}`);
    const typeFilter = url.searchParams.get('type');

    const entries = typeFilter
      ? Object.entries(SURVEY_CSV_FILES).filter(([t]) => t.toLowerCase() === typeFilter.toLowerCase())
      : Object.entries(SURVEY_CSV_FILES);

    let totalEmailsSent = 0;

    for (const [type, filename] of entries) {
      const filePath = path.join(basePath, filename);
      if (!fs.existsSync(filePath)) continue;

      let content = fs.readFileSync(filePath, 'utf8');
      if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1); // strip BOM
      const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });

      const surveyLink = SURVEY_LINKS[type];
      if (!surveyLink) continue; // safety if a CSV exists with no link

      const results = await Promise.allSettled(
        records.map(async (row) => {
          const email = getEmail(row);
          if (!email) return;
          const name = getName(row);

          await sgMail.send({
            to: email,
            from: 'serviceupdate@rotoloconsultants.com', // must be verified in SendGrid
            subject: `Your ${type} Survey is Ready`,
            html: `
              <p>Hi ${name},</p>
              <p>Please take a moment to complete your <strong>${type}</strong> survey:</p>
              <p><a href="${surveyLink}">${surveyLink}</a></p>
              <p>Thank you!</p>
            `,
          });
        })
      );

      totalEmailsSent += results.filter((r) => r.status === 'fulfilled').length;
    }

    return res.status(200).json({ status: 'Emails sent', count: totalEmailsSent });
  } catch (err) {
    console.error('❌ Email dispatch error:', err);
    return res.status(500).json({ error: 'Failed to send survey emails', detail: err.message });
  }
}
