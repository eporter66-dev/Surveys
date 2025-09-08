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
  Thirty: 'https://surveys-five.vercel.app/survey-30day',
  Ninety: 'https://surveys-five.vercel.app/survey-90day',
  'Pre-Renew': 'https://surveys-five.vercel.app/survey-prerenewal',
};

// tolerant getters + defaults
const getEmail = (row) =>
  (row['Contact Email'] || row['Email'] || row['Email Address'] || row['email'] || '').trim();

const getName = (row) =>
  (row['Property Name'] || row['Name'] || row['Property'] || row['name'] || 'there').trim();

const getRecordId = (row) => (row['Record ID#'] || row['RecordID'] || '').toString().trim();
const getAM = (row) => (row['AM Email List'] || '').trim();
const getRM = (row) => (row['RM Email List'] || '').trim();
const getDM = (row) => (row['DM Email List'] || '').trim();


async function logSurveyEmailToQuickbase({ email, name, surveyType }) {
  const payload = {
    to: process.env.QB_TABLE_ID, // You must set this env var
    data: [
      {
        // Replace field IDs (e.g., "6", "7", "8") with your actual Quickbase field IDs
        "6": { value: email },
        "7": { value: name },
        "8": { value: surveyType },
        "9": { value: new Date().toISOString() }, // Optional: timestamp
      },
    ],
  };

  const res = await fetch(`https://${process.env.QUICKBASE_REALM}/v1/records`, {
    method: "POST",
    headers: {
      "Authorization": `QB-USER-TOKEN ${process.env.QUICKBASE_TOKEN}`,
      "QB-Realm-Hostname": process.env.QUICKBASE_REALM,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Quickbase logging failed:", errorText);
    // Don't throw – we don't want to block emails
  }
}

// --- helpers: subject + html + text templates ------------------------------

function subjectFor(type) {
  const map = {
    Thirty:     "How’s our service?",
    Ninety:     "Your feedback matters",
    "Pre-Renew":"Quick survey to see how we're doing!",
  };
  return map[type] || "How’s Our Service? We’d Love Your Feedback!";
}

function textTemplate({ name, surveyUrl, type }) {
  const greeting = name && name !== "there" ? `Hi ${name},` : "Hi,";
  return `${greeting}

We’re always working to improve your experience with RCI. When you have a minute, please complete a quick survey to tell us how we’re doing.

Start the survey: ${surveyUrl}

We really appreciate your feedback!

— RCI`;
}

function emailTemplate({ name, surveyUrl, type }) {
  const greetingName = name && name !== "there" ? name : "there";
  const headlineByType = {
    Thirty:     "How is it going with RCI?",
    Ninety:     "How are we doing so far?",
    "Pre-Renew":"We appreciate your feedback, how are we doing?",
  }[type] || "How are we doing?";

  // Inline CSS w/ table layout for reliability
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${subjectFor(type)}</title>
  <style>
    /* Client resets */
    body,table,td,a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table,td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }
    table { border-collapse:collapse !important; }
    body { margin:0; padding:0; width:100% !important; background:#f4f6f8; }

    /* Container */
    .wrapper { width:100%; background:#f4f6f8; padding:24px 12px; }
    .container { max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 6px 24px rgba(31,45,61,0.08); }

    /* Header */
    .header { padding:20px 24px; text-align:center; background:#ffffff; }
    .brand { display:inline-block; font-family:Arial,Helvetica,sans-serif; font-size:16px; font-weight:700; color:#274a25; letter-spacing:.2px; }

    /* Hero */
    .hero { padding:8px 24px 0 24px; text-align:center; }
    .headline { font-family:Arial,Helvetica,sans-serif; font-size:20px; line-height:28px; color:#111827; margin:12px 0 4px; font-weight:700; }
    .sub { font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:22px; color:#4b5563; margin:0 0 16px; }

    /* Card */
    .card { margin:16px 24px; padding:16px; border-radius:10px; background:#f9fbfa; border:1px solid #e5efe6; }
    .muted { font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:20px; color:#4b5563; margin:0; }

    /* CTA Button (bulletproof) */
    .btn-wrap { padding:8px 24px 24px; text-align:center; }
    .btn {
      font-family:Arial,Helvetica,sans-serif; font-size:16px; font-weight:700; line-height:20px;
      color:#ffffff; text-decoration:none; display:inline-block; padding:14px 22px; border-radius:8px;
      background:#4CAF50;
    }
    /* Outlook VML fallback handled inline below */

    /* Footer */
    .footer { padding:16px 24px 24px; text-align:center; }
    .fine { font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:18px; color:#6b7280; margin:0; }
    .link { color:#1f8bff; text-decoration:none; }

    /* Responsive */
    @media (max-width: 600px) {
      .container { border-radius:10px; }
      .headline { font-size:18px; line-height:26px; }
      .btn { width:100%; }
      .card { margin:12px; }
      .btn-wrap { padding:8px 16px 20px; }
    }
  </style>

  <!-- Preheader (hidden preview text) -->
  <meta name="description" content="${headlineByType}">
</head>
<body>
  <div class="wrapper">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <table role="presentation" class="container" width="100%" cellpadding="0" cellspacing="0" border="0">
            <!-- Header -->
            <tr>
              <td class="header">
                <!-- If you want to swap text brand for a logo image, replace this span with <img src="https://..." width="120" alt="RCI" /> -->
                <img src="https://surveys-five.vercel.app/rci-logo.png"
                   alt="RCI Logo"
                   width="140"
                   style="display:block;border:0;outline:none;text-decoration:none;margin:0 auto;" />
              </td>
            </tr>

            <!-- Hero copy -->
            <tr>
              <td class="hero">
                <h1 class="headline">${headlineByType}</h1>
                <p class="sub">Hi ${greetingName}, your input helps us serve you better. This survey takes just a minute.</p>
              </td>
            </tr>

            <!-- Info card -->
            <tr>
              <td>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr><td class="card">
                    <p class="muted">
                      Click the button below to open your ${type} survey. It’s mobile-friendly and only a few quick questions.
                    </p>
                  </td></tr>
                </table>
              </td>
            </tr>

            <!-- CTA (bulletproof with VML for Outlook) -->
            <tr>
              <td class="btn-wrap">
                <!--[if mso]>
                  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${surveyUrl}" style="height:44px;v-text-anchor:middle;width:260px;" arcsize="10%" fillcolor="#4CAF50" stroke="f">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;">
                      Start the Survey
                    </center>
                  </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-- -->
                <a class="btn" href="${surveyUrl}" target="_blank" rel="noopener">Start the Survey</a>
                <!--<![endif]-->
              </td>
            </tr>

            <!-- Secondary link + note -->
            <tr>
              <td class="footer">
                <p class="fine">
                  If the button doesn’t work, copy and paste this link into your browser:<br/>
                  <a class="link" href="${surveyUrl}" target="_blank" rel="noopener">${surveyUrl}</a>
                </p>
                <p class="fine" style="margin-top:8px;">
                  Thanks for helping us improve — we appreciate you!<br/>— The RCI Team
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}



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

    const name = getName(row); // Property Name
    const recordId = getRecordId(row);
    const am = getAM(row);
    const rm = getRM(row);
    const dm = getDM(row);

    const surveyUrl = new URL(SURVEY_LINKS[type]);
    // existing
    surveyUrl.searchParams.set("property", name);
    surveyUrl.searchParams.set("email", email);
    surveyUrl.searchParams.set("surveyType", type);
    // new
    surveyUrl.searchParams.set("recordId", recordId);
    surveyUrl.searchParams.set("am", am);
    surveyUrl.searchParams.set("rm", rm);
    surveyUrl.searchParams.set("dm", dm);

    await sgMail.send({
      to: email,
      from: 'serviceupdate@rotoloconsultants.com',
      subject: subjectFor(type),
      html: emailTemplate({ name, surveyUrl: surveyUrl.toString(), type }),
      text: textTemplate({ name, surveyUrl: surveyUrl.toString(), type }),
    });

    await logSurveyEmailToQuickbase({ email, name, surveyType: type });
  })
);
results.forEach((r, i) => {
  if (r.status === 'rejected') {
    console.error(`❌ Failed to send email for row ${i}:`, r.reason);
  }
});

        

      totalEmailsSent += results.filter((r) => r.status === 'fulfilled').length;
    }

    return res.status(200).json({ status: 'Emails sent', count: totalEmailsSent });
  } catch (err) {
    console.error('❌ Email dispatch error:', err);
    return res.status(500).json({ error: 'Failed to send survey emails', detail: err.message });
  }
}
