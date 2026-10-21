# N's IT Tech Solution — deployment-ready starter

Bilingual English/Kannada responsive website for IT support in Mysore and nearby areas. Includes WhatsApp contact, customer booking, PostgreSQL-backed tickets, ticket tracking, and a simple token-protected admin dashboard at `/admin`.

## Important free-hosting notes

This package is prepared for a Render free web service plus an external PostgreSQL database (for example Neon). Free hosting may sleep when idle, so the first page load can take about a minute. Free-tier terms/limits can change. Do not use a free trial database as the only copy of business records; arrange regular backups and move to paid/persistent hosting before relying on it for business-critical tickets.

## Publish online

1. Create a GitHub account/repository and upload all files in this folder (including `render.yaml`). Do not upload `.env` or passwords.
2. Create a PostgreSQL project with a provider such as Neon. In its dashboard, copy the PostgreSQL connection string (`DATABASE_URL`). Keep it private.
3. Create a Render account and connect the GitHub repository. Render can use the included `render.yaml` Blueprint, or create a Node Web Service manually with build command `npm install` and start command `npm start`.
4. In Render's environment settings, set `DATABASE_URL` to the database connection string. Set `ADMIN_TOKEN` to a long, unique random secret (if the Blueprint generated one, keep that value private). Deploy/redeploy.
5. Open the public `onrender.com` URL. Test a booking, then track it using its ticket ID and the same phone number.
6. Open `https://YOUR-SITE.onrender.com/admin`, enter the `ADMIN_TOKEN`, and load/update tickets. Do not share this token.

Official setup references:
- Render Node.js deployment: https://render.com/docs/deploy-node-express-app
- Render free-plan limitations: https://render.com/docs/free
- Neon connection strings: https://neon.tech/docs/connect/connect-from-any-app

## Local test

Requires Node.js 20+ and a PostgreSQL database. Copy `.env.example` to `.env`, fill `DATABASE_URL` and `ADMIN_TOKEN`, then run `npm install` and `npm start`. This server does not automatically load `.env`; export the variables in your shell or use a local environment loader. Open `http://localhost:3000`.

## Admin

`/admin` is a simple dashboard. The backend checks the `Authorization: Bearer ...` token for all admin API calls. The token is held in session storage only for the current browser tab/session. Use a long random token, keep it private, and rotate it if exposed.

## Before taking real customer bookings

- Test the booking, ticket lookup and status update end-to-end.
- Add business hours, service charges, travel charges and service terms that you actually offer.
- Consider a stronger admin login/session system, audit logs, backups, monitoring, privacy/retention policy and abuse protection.
- Do not request customer passwords, OTPs or payment card details. Only remote-connect with informed customer permission.
- The starter is not a security-audited production system. Free tiers can sleep, change limits or be discontinued; verify current provider terms before launch.
