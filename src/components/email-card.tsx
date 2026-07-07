"use client";

import { useState } from "react";
import { useToast } from "./toast";
import { executeAction, isActionCompleted } from "@/lib/actions";
import type { ClassifiedEmail, Priority, SuggestedAction } from "@/lib/classifier";

const priorityConfig = {
  must_handle: {
    border: "border-l-red-500",
    badge: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    label: "要処理",
    dot: "🔴",
  },
  worth_reading: {
    border: "border-l-yellow-500",
    badge:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    label: "参考",
    dot: "🟡",
  },
  skip: {
    border: "border-l-green-500",
    badge:
      "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    label: "不要",
    dot: "🟢",
  },
};

function extractSenderName(from: string): string {
  const match = from.match(/^"?([^"<]+)"?\s*</);
  if (match) return match[1].trim();
  return from.split("@")[0];
}

export function EmailCard({
  email,
  onSelect,
  onReclassify,
}: {
  email: ClassifiedEmail;
  onSelect: () => void;
  onReclassify: (id: string, priority: Priority) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  const [completedActions, setCompletedActions] = useState<Set<string>>(
    () => {
      const set = new Set<string>();
      for (const a of email.suggestedActions) {
        if (isActionCompleted(email.id, a.label)) set.add(a.label);
      }
      return set;
    }
  );
  const { showToast } = useToast();
  const config = priorityConfig[email.priority];

  const handleAction = async (action: SuggestedAction) => {
    if (completedActions.has(action.label)) return;
    setExecutingAction(action.label);
    const result = await executeAction(email.id, action, email.subject);
    setExecutingAction(null);
    if (result.success) {
      setCompletedActions((prev) => new Set(prev).add(action.label));
      showToast(result.message, "success");
    } else {
      showToast(result.message, "error");
    }
  };

  return (
    <div
      className={`rounded-2xl border-l-4 ${config.border} bg-[var(--card)] p-4 shadow-sm transition hover:shadow-md cursor-pointer`}
      onClick={onSelect}
    >
      {/* Top Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <span
              className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-medium ${config.badge}`}
            >
              {config.dot} {config.label}
            </span>
            <span className="truncate text-xs text-[var(--muted)]">
              {extractSenderName(email.from)}
            </span>
          </div>
          <h3 className="font-medium text-[var(--foreground)] leading-snug">
            {email.subject || "(件名なし)"}
          </h3>
        </div>

        {/* Quick reclassify */}
        <div className="relative shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="rounded-lg p-1.5 text-[var(--muted)] transition hover:bg-[var(--border)]"
            title="分類を変更"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="8" cy="3" r="1" />
              <circle cx="8" cy="8" r="1" />
              <circle cx="8" cy="13" r="1" />
            </svg>
          </button>

          {showMenu && (
            <div
              className="absolute right-0 top-8 z-10 w-36 rounded-xl bg-[var(--card)] p-1.5 shadow-lg border border-[var(--border)] animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              {(["must_handle", "worth_reading", "skip"] as const)
                .filter((p) => p !== email.priority)
                .map((p) => {
                  const cfg = priorityConfig[p];
                  return (
                    <button
                      key={p}
                      onClick={() => {
                        onReclassify(email.id, p);
                        setShowMenu(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--background)]"
                    >
                      {cfg.dot} {cfg.label}に変更
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
        {email.summary}
      </p>

      {/* Key Info Tags */}
      {email.keyInfo.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {email.keyInfo.map((info, i) => (
            <span
              key={i}
              className="rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            >
              {info}
            </span>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      {email.suggestedActions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {email.suggestedActions.map((action, i) => {
            const done = completedActions.has(action.label);
            const loading = executingAction === action.label;
            return (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(action);
                }}
                disabled={done || loading}
                className={`rounded-lg border px-3 py-1 text-xs font-medium transition ${
                  done
                    ? "border-green-300 bg-green-50 text-green-600 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
                    : loading
                      ? "border-blue-300 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400"
                      : "border-[var(--border)] text-[var(--muted)] hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                {loading ? (
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    実行中...
                  </span>
                ) : done ? (
                  <span>✓ {action.label}</span>
                ) : (
                  <span>
                    {actionIcon(action.type)} {action.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function actionIcon(type: string): string {
  switch (type) {
    case "reply":
      return "💬";
    case "archive":
      return "📦";
    case "calendar":
      return "📅";
    case "reminder":
      return "⏰";
    case "link":
      return "🔗";
    default:
      return "▶";
  }
}
