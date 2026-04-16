import { google } from "googleapis";

export async function createCalendarReminder(input: {
  title: string;
  description: string;
  dueAt: Date;
  attendees: string[];
}) {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!calendarId || !serviceAccountEmail || !privateKey) {
    return { skipped: true };
  }

  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  const calendar = google.calendar({ version: "v3", auth });

  await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: input.title,
      description: input.description,
      start: { dateTime: input.dueAt.toISOString() },
      end: { dateTime: new Date(input.dueAt.getTime() + 30 * 60 * 1000).toISOString() },
      attendees: input.attendees.map((email) => ({ email })),
    },
  });

  return { skipped: false };
}