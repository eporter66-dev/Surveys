
# Quickbase Survey Application

Automates delivery of customer satisfaction surveys (30-Day, 90-Day, Pre-Renewal, Yearly) for **Rotolo Consultants**, using Quickbase API data and a Vercel-deployed React app.

---

## Overview

- **Frontend**: React + Vite (deployed on Vercel)
- **Backend**: Vercel Serverless Function (`/api/sendSurvey`)
- **Data Source**: Quickbase Table
- **Email Delivery**: SendGrid
- **Automation**: Bash script to fetch and process CSV data
- **Output Files**:
  - `thirty.csv`
  - `ninety.csv`
  - `prerenew.csv`
  - `yearly.csv`

---

## Project Structure

```
quickbase-survey/
├── api/                     # Serverless functions + CSV output
│   ├── sendSurvey.js        # Email dispatcher
│   ├── thirty.csv
│   ├── ninety.csv
│   ├── prerenew.csv
│   └── yearly.csv
├── src/                     # React survey app
│   ├── SurveyHome.jsx
│   ├── thirtyDayStart.jsx
│   ├── ninetyDaySurvey.jsx
│   ├── preRenewalSurvey.jsx
│   └── yearlySurvey.jsx
├── export_surveys.sh        # Bash script for Quickbase CSV export
├── .env                     # (Optional for local testing only)
└── README.md
```

---

##  Workflow Summary

### 1. Fetch Records from Quickbase

Use the script `export_surveys.sh` to query Quickbase and generate CSVs.

```bash
./export_surveys.sh
```

This will:
- Query active properties from Quickbase using:
  - Field **190 = "Active Contract"**
  - Field **241 = "Thirty"**, **"Ninety"**, **"Pre-Renew"**, or **"Yearly"**
  - Field **41** must have a valid email (excluding `@rotoloconsultants.com`)
- Save to:
  - `api/thirty.csv`
  - `api/ninety.csv`
  - `api/prerenew.csv`
  - `api/yearly.csv`

### 2. Deploy to Vercel

Commit and push your updates. Then deploy:

```bash
vercel deploy --prod
```

### 3. Configure Environment Variables in Vercel

| Key                  | Value                                           |
|----------------------|-------------------------------------------------|
| `SENDGRID_API_KEY`   | Your SendGrid API key (starts with `SG.`)       |
| `VITE_QB_REALM`      | `rotoloconsultants.quickbase.com`               |
| `VITE_QB_USER_TOKEN` | Your Quickbase personal user token              |

**Important**: Do _not_ prefix `SENDGRID_API_KEY` with `VITE_` — it's used server-side.

---

## Sending Survey Emails

After deployment, call the API endpoint:

```bash
curl https://<your-vercel-project-url>/api/sendSurvey
```

Example:

```bash
curl https://surveys-kf0j08s7j-elizabeth-porters-projects.vercel.app/api/sendSurvey
```

This will:
- Read each survey-type CSV
- Use the file to construct personalized email messages
- Send them through SendGrid
- Return a response like:

```json
{ "status": "Emails sent", "count": 8 }
```

---

## Survey Type Routing

Each survey email includes a link to its corresponding form:

| Survey Type | Frontend Route                          |
|-------------|------------------------------------------|
| Thirty      | `/thirtyDayStart`                        |
| Ninety      | `/ninetyDaySurvey`                       |
| Pre-Renew   | `/preRenewalSurvey`                      |
| Yearly      | `/yearlySurvey`                          |

---

## Testing Tips

- Limit a CSV to one row with your email to test (e.g., `ninety.csv`)
- Check Vercel logs for success/failure (`Functions` tab or `vercel logs`)
- Add `console.log()` in `sendSurvey.js` to debug

---

## Future Improvements

- Mark surveys as “sent” in Quickbase (Field ID 243)
- Schedule the Bash script via `cron`
- Add form access authentication (optional)
- Write back survey results into Quickbase