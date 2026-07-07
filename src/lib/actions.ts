import type { SuggestedAction } from "./classifier";

export interface ActionResult {
  success: boolean;
  message: string;
}

export interface CompletedAction {
  emailId: string;
  action: SuggestedAction;
  completedAt: number;
}

const COMPLETED_KEY = "ai-reading-completed-actions";

export function getCompletedActions(): CompletedAction[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(COMPLETED_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function markActionCompleted(
  emailId: string,
  action: SuggestedAction
) {
  const completed = getCompletedActions();
  completed.push({ emailId, action, completedAt: Date.now() });
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(completed));
}

export function isActionCompleted(
  emailId: string,
  actionLabel: string
): boolean {
  return getCompletedActions().some(
    (c) => c.emailId === emailId && c.action.label === actionLabel
  );
}

export async function executeAction(
  emailId: string,
  action: SuggestedAction,
  emailSubject: string
): Promise<ActionResult> {
  // Simulate processing
  await new Promise((r) => setTimeout(r, 600));

  markActionCompleted(emailId, action);

  switch (action.type) {
    case "reply":
      return {
        success: true,
        message: `「${emailSubject}」への返信ドラフトを作成しました`,
      };
    case "archive":
      return {
        success: true,
        message: `「${emailSubject}」をアーカイブしました`,
      };
    case "calendar":
      return {
        success: true,
        message: `「${emailSubject}」のイベントをカレンダーに追加しました`,
      };
    case "reminder":
      return {
        success: true,
        message: `「${emailSubject}」のリマインダーを設定しました`,
      };
    case "link":
      return {
        success: true,
        message: `「${emailSubject}」のリンクを開きました`,
      };
    default:
      return {
        success: true,
        message: `アクションを実行しました`,
      };
  }
}
