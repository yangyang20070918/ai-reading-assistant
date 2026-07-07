import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchTodayEmails } from "@/lib/gmail";
import { classifyEmails } from "@/lib/classifier";
import { MOCK_EMAILS } from "@/lib/mock-data";

const IS_DEMO = !process.env.GOOGLE_CLIENT_ID;

export async function GET() {
  if (IS_DEMO) {
    const emails = MOCK_EMAILS;
    const counts = {
      must_handle: emails.filter((e) => e.priority === "must_handle").length,
      worth_reading: emails.filter((e) => e.priority === "worth_reading").length,
      skip: emails.filter((e) => e.priority === "skip").length,
      total: emails.length,
    };
    return NextResponse.json({ emails, counts });
  }

  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = (session as any).accessToken;
  if (!accessToken) {
    return NextResponse.json(
      { error: "No access token" },
      { status: 401 }
    );
  }

  const rawEmails = await fetchTodayEmails(accessToken);

  if (rawEmails.length === 0) {
    return NextResponse.json({ emails: [], counts: { must_handle: 0, worth_reading: 0, skip: 0, total: 0 } });
  }

  const classified = await classifyEmails(rawEmails);

  const counts = {
    must_handle: classified.filter((e) => e.priority === "must_handle").length,
    worth_reading: classified.filter((e) => e.priority === "worth_reading").length,
    skip: classified.filter((e) => e.priority === "skip").length,
    total: classified.length,
  };

  const sorted = [
    ...classified.filter((e) => e.priority === "must_handle"),
    ...classified.filter((e) => e.priority === "worth_reading"),
    ...classified.filter((e) => e.priority === "skip"),
  ];

  return NextResponse.json({ emails: sorted, counts });
}
