import { NextRequest, NextResponse } from "next/server";
import {
  MOCK_ANALYSIS_HIGH_RISK,
  MOCK_ANALYSIS_LOW_RISK,
} from "@/lib/mock-documents";
import type { AnalysisResult, RiskItem } from "@/lib/document-types";

const IS_DEMO = !process.env.ANTHROPIC_API_KEY;

export async function POST(req: NextRequest) {
  const { text, title } = await req.json();

  if (!text || text.trim().length < 10) {
    return NextResponse.json(
      { error: "テキストが短すぎます" },
      { status: 400 }
    );
  }

  if (IS_DEMO) {
    await new Promise((r) => setTimeout(r, 1500));

    const hasRisk =
      text.includes("自動") ||
      text.includes("解約") ||
      text.includes("違約") ||
      text.includes("料金") ||
      text.includes("変更") ||
      text.length > 500;

    const result = hasRisk
      ? { ...MOCK_ANALYSIS_HIGH_RISK, title: title || MOCK_ANALYSIS_HIGH_RISK.title, textPreview: text.slice(0, 200) }
      : { ...MOCK_ANALYSIS_LOW_RISK, title: title || MOCK_ANALYSIS_LOW_RISK.title, textPreview: text.slice(0, 200) };

    return NextResponse.json({ result });
  }

  // Real analysis with Claude API
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: `あなたは契約書・利用規約の専門アナリストです。文書を分析し、以下のJSON形式で結果を返してください。

{
  "type": "contract" | "terms" | "privacy" | "agreement" | "other",
  "riskScore": 1-5の数値,
  "summary": "文書全体の要約（2-3文）",
  "recommendation": "ユーザーへの推奨アクション（1文）",
  "riskItems": [
    {
      "label": "リスク項目名",
      "found": true/false,
      "detail": "具体的な内容",
      "severity": "high" | "medium" | "low"
    }
  ]
}

必ず以下の6項目をチェック：
1. 自動更新（自動續費）
2. 解約条件
3. 料金変更権
4. データ共有・第三者提供
5. 責任制限
6. 知的財産権

riskScore基準：
1 = リスクなし、2 = 低リスク、3 = 中リスク、4 = 高リスク、5 = 最高リスク

JSON のみ返してください。`,
    messages: [
      {
        role: "user",
        content: `以下の文書を分析してください：\n\n${text.slice(0, 8000)}`,
      },
    ],
  });

  const responseText =
    response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    return NextResponse.json(
      { error: "分析に失敗しました" },
      { status: 500 }
    );
  }

  const parsed = JSON.parse(jsonMatch[0]);

  const result: AnalysisResult = {
    id: `doc-${Date.now()}`,
    title: title || "文書分析",
    type: parsed.type ?? "other",
    riskScore: parsed.riskScore ?? 3,
    summary: parsed.summary ?? "",
    recommendation: parsed.recommendation ?? "",
    riskItems: parsed.riskItems ?? [],
    analyzedAt: new Date().toISOString(),
    textPreview: text.slice(0, 200),
  };

  return NextResponse.json({ result });
}
