import Anthropic from "@anthropic-ai/sdk";
import type { RawEmail } from "./gmail";

export type Priority = "must_handle" | "worth_reading" | "skip";

export interface SuggestedAction {
  label: string;
  type: "reply" | "archive" | "calendar" | "reminder" | "link" | "none";
}

export interface ClassifiedEmail {
  id: string;
  from: string;
  subject: string;
  date: string;
  priority: Priority;
  reason: string;
  summary: string;
  keyInfo: string[];
  suggestedActions: SuggestedAction[];
}

const SYSTEM_PROMPT = `あなたはユーザーのAIメール秘書です。メールを分析して、ユーザーが読むべきかどうかを判断します。

各メールについて、以下のJSON形式で回答してください：

{
  "priority": "must_handle" | "worth_reading" | "skip",
  "reason": "なぜこの判断をしたか（1文）",
  "summary": "メールの要点（1-2文）",
  "keyInfo": ["重要な日付", "金額", "期限など"],
  "suggestedActions": [
    {"label": "アクション名", "type": "reply|archive|calendar|reminder|link|none"}
  ]
}

分類基準：
- must_handle（🔴）: 返信が必要、期限がある、金銭に関わる、ログイン異常などセキュリティ関連
- worth_reading（🟡）: 参考になるが急がない。フォロー中のチャンネル更新、業界ニュース、セール情報（ユーザーの興味に合うもの）
- skip（🟢）: 広告、自動通知、メルマガ、興味と合わないプロモーション

重要：
- ユーザーが判断できるように「理由」を必ず書く
- 日付・金額・期限は keyInfo に抽出する
- suggestedActions は具体的に（「返信する」「カレンダーに追加」「アーカイブ」など）`;

export async function classifyEmails(
  emails: RawEmail[]
): Promise<ClassifiedEmail[]> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const emailsForPrompt = emails.map((e, i) => ({
    index: i,
    from: e.from,
    subject: e.subject,
    body: e.body.slice(0, 1500),
    date: e.date,
  }));

  const userPrompt = `以下の${emails.length}件のメールを分析してください。各メールについてJSON形式で回答し、結果を配列で返してください。

メール一覧：
${JSON.stringify(emailsForPrompt, null, 2)}

JSON配列のみを返してください。他の説明は不要です。`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response");
  }

  const results = JSON.parse(jsonMatch[0]);

  return emails.map((email, i) => ({
    id: email.id,
    from: email.from,
    subject: email.subject,
    date: email.date,
    priority: results[i]?.priority ?? "skip",
    reason: results[i]?.reason ?? "",
    summary: results[i]?.summary ?? email.snippet,
    keyInfo: results[i]?.keyInfo ?? [],
    suggestedActions: results[i]?.suggestedActions ?? [],
  }));
}
