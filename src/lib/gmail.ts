import { google } from "googleapis";

export interface RawEmail {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
  labels: string[];
}

function decodeBase64(data: string): string {
  const decoded = Buffer.from(
    data.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  );
  return decoded.toString("utf-8");
}

function extractBody(payload: any): string {
  if (payload.body?.data) {
    return decodeBase64(payload.body.data);
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64(part.body.data);
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        const html = decodeBase64(part.body.data);
        return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      }
    }
    for (const part of payload.parts) {
      if (part.parts) {
        const nested = extractBody(part);
        if (nested) return nested;
      }
    }
  }
  return "";
}

function getHeader(headers: any[], name: string): string {
  return headers?.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

export async function fetchTodayEmails(accessToken: string): Promise<RawEmail[]> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const after = Math.floor(today.getTime() / 1000);

  const res = await gmail.users.messages.list({
    userId: "me",
    q: `after:${after}`,
    maxResults: 50,
  });

  const messageIds = res.data.messages ?? [];
  if (messageIds.length === 0) return [];

  const emails: RawEmail[] = [];

  for (const msg of messageIds) {
    const detail = await gmail.users.messages.get({
      userId: "me",
      id: msg.id!,
      format: "full",
    });

    const headers = detail.data.payload?.headers ?? [];
    const body = extractBody(detail.data.payload);

    emails.push({
      id: msg.id!,
      from: getHeader(headers, "From"),
      subject: getHeader(headers, "Subject"),
      snippet: detail.data.snippet ?? "",
      body: body.slice(0, 3000),
      date: getHeader(headers, "Date"),
      labels: detail.data.labelIds ?? [],
    });
  }

  return emails;
}
