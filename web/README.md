# Mongo Auth Dashboard

Simple Next.js auth starter with Mongoose, JWT sessions, hashed passwords, hashed OTP verification, and organization management.

## Features

- Signup with name, email, password, and OTP
- Login with email and password
- JWT session cookie
- Protected dashboard and profile pages
- Organization CRUD with organizer/member roles
- Email-bound invite links for members
- Dynamic public contact forms and submission inbox
- Google OAuth login and account creation
- Score-based sales queue, agent rules, and reminders
- Optional SMTP, Google Calendar, and Google Sheets sync
- Mongoose-backed user records
- Black and gray theme

## Setup

1. Copy `.env.example` to `.env.local`.
2. Set `MONGODB_URI` and `JWT_SECRET`.
3. Run `npm install` if dependencies are missing.
4. Start the app with `npm run dev`.

## Environment

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Long random secret for signing auth tokens
- `NEXT_PUBLIC_APP_URL`: Optional base URL for redirects
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`: Google OAuth
- `GROQ_API_KEY`, `GROQ_MODEL`: Agent routing model, defaults to `llama3-8b-8192`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: Email delivery
- `GOOGLE_CALENDAR_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`: Calendar reminders
- `GOOGLE_SHEETS_SHEET_ID`: Stock sheet sync target
- `ADMIN_ALERT_EMAIL`: Optional fallback admin alert inbox

## Notes

- Passwords are hashed with bcrypt before saving.
- OTP values are hashed with bcrypt before saving.
- Users must verify their OTP once before logging in.
