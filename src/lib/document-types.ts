export interface RiskItem {
  label: string;
  found: boolean;
  detail: string;
  severity: "high" | "medium" | "low";
}

export interface AnalysisResult {
  id: string;
  title: string;
  type: "contract" | "terms" | "privacy" | "agreement" | "other";
  riskScore: number; // 1-5
  summary: string;
  recommendation: string;
  riskItems: RiskItem[];
  analyzedAt: string;
  textPreview: string;
}

export const RISK_LABELS: Record<number, { label: string; color: string; description: string }> = {
  1: { label: "★☆☆☆☆", color: "text-green-600 dark:text-green-400", description: "リスクなし — 安心して同意できます" },
  2: { label: "★★☆☆☆", color: "text-green-600 dark:text-green-400", description: "低リスク — 一般的な内容です" },
  3: { label: "★★★☆☆", color: "text-yellow-600 dark:text-yellow-400", description: "中リスク — 確認をおすすめします" },
  4: { label: "★★★★☆", color: "text-orange-600 dark:text-orange-400", description: "高リスク — 慎重に検討してください" },
  5: { label: "★★★★★", color: "text-red-600 dark:text-red-400", description: "最高リスク — 同意は推奨しません" },
};

export const DOCUMENT_TYPES: Record<string, string> = {
  contract: "契約書",
  terms: "利用規約",
  privacy: "プライバシーポリシー",
  agreement: "同意書",
  other: "その他",
};
