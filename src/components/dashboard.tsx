"use client";

import { useState, useEffect, useMemo } from "react";
import { signOut } from "next-auth/react";
import { EmailCard } from "./email-card";
import { ThemeToggle } from "./theme-toggle";
import { StatsPage } from "./stats-page";
import { DocumentAnalyzer } from "./document-analyzer";
import { saveReclassification } from "@/lib/preferences";
import { executeAction, isActionCompleted } from "@/lib/actions";
import { useToast } from "./toast";
import type { ClassifiedEmail, Priority, SuggestedAction } from "@/lib/classifier";

interface DashboardProps {
  userName: string;
}

interface EmailData {
  emails: ClassifiedEmail[];
  counts: {
    must_handle: number;
    worth_reading: number;
    skip: number;
    total: number;
  };
}

type FilterType = "all" | "must_handle" | "worth_reading" | "skip";
type SortType = "priority" | "date" | "sender";
type PageType = "inbox" | "stats" | "analyze";

const PRIORITY_ORDER: Record<Priority, number> = {
  must_handle: 0,
  worth_reading: 1,
  skip: 2,
};

export function Dashboard({ userName }: DashboardProps) {
  const [data, setData] = useState<EmailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedEmail, setSelectedEmail] = useState<ClassifiedEmail | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortType>("priority");
  const [page, setPage] = useState<PageType>("inbox");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/emails");
        if (!res.ok) throw new Error("メールの取得に失敗しました");
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleReclassify = (emailId: string, newPriority: Priority) => {
    if (!data) return;
    const email = data.emails.find((e) => e.id === emailId);
    if (email && email.priority !== newPriority) {
      saveReclassification(emailId, email.from, email.subject, email.priority, newPriority);
    }
    const updated = data.emails.map((e) =>
      e.id === emailId ? { ...e, priority: newPriority } : e
    );
    const counts = recalcCounts(updated);
    setData({ emails: updated, counts });
    if (selectedEmail?.id === emailId) {
      setSelectedEmail({ ...selectedEmail, priority: newPriority });
    }
  };

  const handleBulkArchive = () => {
    if (!data) return;
    const updated = data.emails.filter((e) => e.priority !== "skip");
    const counts = recalcCounts(updated);
    setData({ emails: updated, counts });
    setActiveFilter("all");
  };

  const filtered = useMemo(() => {
    if (!data) return [];
    let result = data.emails;

    if (activeFilter !== "all") {
      result = result.filter((e) => e.priority === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.subject.toLowerCase().includes(q) ||
          e.from.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q)
      );
    }

    if (sortBy === "date") {
      result = [...result].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } else if (sortBy === "sender") {
      result = [...result].sort((a, b) => a.from.localeCompare(b.from));
    } else {
      result = [...result].sort(
        (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      );
    }

    return result;
  }, [data, activeFilter, searchQuery, sortBy]);

  const today = new Date();
  const dateStr = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] sm:text-2xl">
            AI Reading Assistant
          </h1>
          <p className="text-sm text-[var(--muted)]">
            {userName} / {dateStr}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {/* Document Analyzer */}
          <button
            onClick={() => setPage(page === "analyze" ? "inbox" : "analyze")}
            className={`rounded-lg p-2 transition ${
              page === "analyze"
                ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                : "text-[var(--muted)] hover:bg-[var(--border)]"
            }`}
            title="文書リスク分析"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </button>
          {/* Stats */}
          <button
            onClick={() => setPage(page === "stats" ? "inbox" : "stats")}
            className={`rounded-lg p-2 transition ${
              page === "stats"
                ? "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                : "text-[var(--muted)] hover:bg-[var(--border)]"
            }`}
            title="統計"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </button>
          <ThemeToggle />
          <button
            onClick={() => signOut()}
            className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] transition hover:bg-[var(--border)]"
          >
            ログアウト
          </button>
        </div>
      </header>

      {/* Document Analyzer */}
      {page === "analyze" && (
        <DocumentAnalyzer onBack={() => setPage("inbox")} />
      )}

      {/* Stats Page */}
      {page === "stats" && data && (
        <StatsPage emails={data.emails} onBack={() => setPage("inbox")} />
      )}

      {/* Inbox Page */}
      {page === "inbox" && (
        <>
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[var(--border)] border-t-blue-500" />
              <p className="text-lg font-medium text-[var(--foreground)]">
                AIがメールを分析中...
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                初回は少し時間がかかります
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-2xl bg-red-50 p-8 text-center dark:bg-red-950 animate-fade-in">
              <p className="text-lg text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-200 dark:bg-red-900 dark:text-red-300"
              >
                再試行
              </button>
            </div>
          )}

          {/* Content */}
          {data && !loading && (
            <div className="animate-fade-in">
              {/* Stats Cards */}
              <div className="mb-4 grid grid-cols-3 gap-3">
                <StatsCard
                  label="要処理"
                  count={data.counts.must_handle}
                  color="red"
                  active={activeFilter === "must_handle"}
                  onClick={() =>
                    setActiveFilter(activeFilter === "must_handle" ? "all" : "must_handle")
                  }
                />
                <StatsCard
                  label="参考"
                  count={data.counts.worth_reading}
                  color="yellow"
                  active={activeFilter === "worth_reading"}
                  onClick={() =>
                    setActiveFilter(activeFilter === "worth_reading" ? "all" : "worth_reading")
                  }
                />
                <StatsCard
                  label="不要"
                  count={data.counts.skip}
                  color="green"
                  active={activeFilter === "skip"}
                  onClick={() =>
                    setActiveFilter(activeFilter === "skip" ? "all" : "skip")
                  }
                />
              </div>

              {/* Search + Sort + Bulk */}
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                  <svg
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="メールを検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl bg-[var(--card)] py-2.5 pl-10 pr-4 text-sm text-[var(--foreground)] shadow-sm outline-none placeholder:text-[var(--muted)] focus:ring-2 focus:ring-blue-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortType)}
                    className="rounded-xl bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] shadow-sm outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="priority">優先度順</option>
                    <option value="date">日付順</option>
                    <option value="sender">差出人順</option>
                  </select>
                  {data.counts.skip > 0 && (
                    <button
                      onClick={handleBulkArchive}
                      className="whitespace-nowrap rounded-xl bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700 transition hover:bg-green-100 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900"
                    >
                      🟢 不要を一括削除
                    </button>
                  )}
                </div>
              </div>

              {/* Count + Filter Reset */}
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-[var(--muted)]">
                  {searchQuery
                    ? `${filtered.length} 件ヒット`
                    : activeFilter === "all"
                      ? `全 ${data.counts.total} 通`
                      : `${filtered.length} 通を表示中`}
                </p>
                {(activeFilter !== "all" || searchQuery) && (
                  <button
                    onClick={() => {
                      setActiveFilter("all");
                      setSearchQuery("");
                    }}
                    className="text-sm text-blue-500 hover:underline"
                  >
                    リセット
                  </button>
                )}
              </div>

              {/* Email List */}
              {filtered.length === 0 ? (
                <div className="rounded-2xl bg-[var(--card)] py-16 text-center shadow-sm">
                  <p className="text-4xl">{searchQuery ? "🔍" : "📭"}</p>
                  <p className="mt-3 text-[var(--muted)]">
                    {searchQuery
                      ? "検索結果はありません"
                      : data.counts.total === 0
                        ? "今日のメールはありません"
                        : "該当するメールはありません"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((email, i) => (
                    <div
                      key={email.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <EmailCard
                        email={email}
                        onSelect={() => setSelectedEmail(email)}
                        onReclassify={handleReclassify}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Email Detail Modal */}
      {selectedEmail && (
        <EmailDetailModal
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
          onReclassify={handleReclassify}
        />
      )}
    </div>
  );
}

function recalcCounts(emails: ClassifiedEmail[]) {
  return {
    must_handle: emails.filter((e) => e.priority === "must_handle").length,
    worth_reading: emails.filter((e) => e.priority === "worth_reading").length,
    skip: emails.filter((e) => e.priority === "skip").length,
    total: emails.length,
  };
}

function StatsCard({
  label,
  count,
  color,
  active,
  onClick,
}: {
  label: string;
  count: number;
  color: "red" | "yellow" | "green";
  active: boolean;
  onClick: () => void;
}) {
  const dots = { red: "🔴", yellow: "🟡", green: "🟢" };
  const activeBg = {
    red: "ring-2 ring-red-400 bg-red-50 text-red-900 dark:bg-red-900/20 dark:ring-red-500/50 dark:text-red-200",
    yellow: "ring-2 ring-yellow-400 bg-yellow-50 text-yellow-900 dark:bg-yellow-900/20 dark:ring-yellow-500/50 dark:text-yellow-200",
    green: "ring-2 ring-green-400 bg-green-50 text-green-900 dark:bg-green-900/20 dark:ring-green-500/50 dark:text-green-200",
  };

  return (
    <button
      onClick={onClick}
      className={`rounded-2xl bg-[var(--card)] p-4 text-center shadow-sm transition hover:shadow-md ${active ? activeBg[color] : ""}`}
    >
      <p className={`text-3xl font-bold ${active ? "text-inherit" : "text-[var(--foreground)]"}`}>{count}</p>
      <p className={`mt-1 text-sm ${active ? "text-inherit opacity-80" : "text-[var(--muted)]"}`}>
        {dots[color]} {label}
      </p>
    </button>
  );
}

function EmailDetailModal({
  email,
  onClose,
  onReclassify,
}: {
  email: ClassifiedEmail;
  onClose: () => void;
  onReclassify: (id: string, priority: Priority) => void;
}) {
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

  const priorityLabels = {
    must_handle: { dot: "🔴", label: "要処理", bg: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
    worth_reading: { dot: "🟡", label: "参考", bg: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
    skip: { dot: "🟢", label: "不要", bg: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  };

  const config = priorityLabels[email.priority];

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

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-t-2xl bg-[var(--card)] p-6 shadow-2xl sm:rounded-2xl animate-fade-in max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <span className={`rounded-lg px-3 py-1 text-sm font-medium ${config.bg}`}>
            {config.dot} {config.label}
          </span>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--muted)] transition hover:bg-[var(--border)]"
          >
            ✕
          </button>
        </div>

        {/* Subject */}
        <h2 className="mb-1 text-xl font-bold text-[var(--foreground)]">
          {email.subject || "(件名なし)"}
        </h2>
        <p className="mb-4 text-sm text-[var(--muted)]">{email.from}</p>

        {/* Summary */}
        <div className="mb-4 rounded-xl bg-[var(--background)] p-4">
          <p className="mb-1 text-xs font-medium text-[var(--muted)]">AIの要約</p>
          <p className="text-[var(--foreground)]">{email.summary}</p>
        </div>

        {/* Key Info */}
        {email.keyInfo.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-[var(--muted)]">重要情報</p>
            <div className="flex flex-wrap gap-2">
              {email.keyInfo.map((info, i) => (
                <span
                  key={i}
                  className="rounded-lg bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                >
                  {info}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reason */}
        <div className="mb-4 rounded-xl bg-[var(--background)] p-4">
          <p className="mb-1 text-xs font-medium text-[var(--muted)]">判断理由</p>
          <p className="text-sm text-[var(--foreground)]">{email.reason}</p>
        </div>

        {/* Suggested Actions */}
        {email.suggestedActions.length > 0 && (
          <div className="mb-6">
            <p className="mb-2 text-xs font-medium text-[var(--muted)]">おすすめアクション</p>
            <div className="flex flex-wrap gap-2">
              {email.suggestedActions.map((action, i) => {
                const done = completedActions.has(action.label);
                const loading = executingAction === action.label;
                return (
                  <button
                    key={i}
                    onClick={() => handleAction(action)}
                    disabled={done || loading}
                    className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                      done
                        ? "border-green-300 bg-green-50 text-green-600 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
                        : loading
                          ? "border-blue-300 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400"
                          : "border-[var(--border)] text-[var(--foreground)] hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950"
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        実行中...
                      </span>
                    ) : done ? (
                      <span>✓ {action.label}</span>
                    ) : (
                      <span>{actionIcon(action.type)} {action.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Reclassify */}
        <div className="border-t border-[var(--border)] pt-4">
          <p className="mb-2 text-xs font-medium text-[var(--muted)]">
            分類を変更（AIが学習します）
          </p>
          <div className="flex gap-2">
            {(["must_handle", "worth_reading", "skip"] as const).map((p) => {
              const cfg = priorityLabels[p];
              const isActive = email.priority === p;
              return (
                <button
                  key={p}
                  onClick={() => {
                    if (!isActive) {
                      onReclassify(email.id, p);
                      onClose();
                    }
                  }}
                  disabled={isActive}
                  className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${
                    isActive
                      ? `${cfg.bg} cursor-default`
                      : "bg-[var(--background)] text-[var(--muted)] hover:bg-[var(--border)]"
                  }`}
                >
                  {cfg.dot} {cfg.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function actionIcon(type: string): string {
  switch (type) {
    case "reply": return "💬";
    case "archive": return "📦";
    case "calendar": return "📅";
    case "reminder": return "⏰";
    case "link": return "🔗";
    default: return "▶";
  }
}
