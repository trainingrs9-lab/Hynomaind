# HypnoMind website redesign

A responsive static website concept with separate Clinical Hypnotherapy, Online Hypnosis, Mentalism, Courses, About and Contact sections. It includes a Supabase-backed enquiry workflow and a private admin dashboard scaffold.

## Preview locally

Open `index.html` in a browser. The enquiry form will display a setup message until Supabase is configured. No enquiry is transmitted in preview mode.

## Configure enquiries and admin dashboard

1. Create a Supabase project.
2. In Supabase SQL Editor, run `supabase/schema.sql`.
3. Copy the Project URL and anon/public key into `config.js`.
4. Deploy the Edge Function in `supabase/functions/submit-enquiry`:
   `supabase functions deploy submit-enquiry`
5. Set Edge Function secrets (never place these in `config.js`):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `NOTIFY_EMAIL=trainingrs9@gmail.com`
   - `EMAIL_FROM=HypnoMind Website <verified-sender@your-domain.com>`
6. Verify your sender domain with Resend and set `EMAIL_FROM` to that verified sender. If `RESEND_API_KEY` is absent, enquiries are still saved but no email is sent.
7. Create an admin user in Supabase Authentication. Assign the custom app metadata claim `{"role":"admin"}` to that user using the Supabase dashboard or a trusted server-side admin process. Never grant this role from the public website.
8. Open `admin.html`, sign in with that admin account, and manage enquiry status.

## Publish

Upload the contents of this folder to a GitHub repository and enable GitHub Pages (Settings → Pages → Deploy from branch). Keep `index.html`, `styles.css`, `script.js`, `config.js`, `admin.html` and `admin.js` at the published root. Supabase runs separately as the backend.

## Important

- This package is a new redesign source bundle; it does not modify the live GitHub Pages website automatically.
- The admin page is protected by Supabase Auth and database row-level security once configured. Do not expose the service-role key or Resend API key in browser files.
- Replace placeholder Supabase values before publishing. Test submissions and email delivery before making the form public.
- Review the service descriptions, credentials, course syllabus, fees, availability and legal/privacy wording before launch. Do not claim clinical outcomes or professional credentials that you cannot substantiate.
