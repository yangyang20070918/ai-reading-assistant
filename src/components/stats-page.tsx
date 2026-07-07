"use client";

import { useMemo } from "react";
import { getReclassifications, getSenderRules } from "@/lib/preferences";
import type { ClassifiedEmail } from "@/lib/classifier";

interface StatsPageProps {
  emails: ClassifiedEmail[];
  onBack: () => void;
}

export function StatsPage({ emails, onBack }: StatsPageProps) {
  const reclassifications = useMemo(() => getReclassifications(), []);
  const senderRules = useMemo(() => getSenderRules(), []);

  const totalEmails = emails.length;
  const mustHandle = emails.filter((e) => e.priority === "must_handle").length;
  const worthReading = emails.filter((e) => e.priority === "worth_reading").length;
  const skip = emails.filter((e) => e.priority === "skip").length;

  const mustPct = totalEmails > 0 ? Math.round((mustHandle / totalEmails) * 100) : 0;
  const worthPct = totalEmails > 0 ? Math.round((worthReading / totalEmails) * 100) : 0;
  const skipPct = totalEmails > 0 ? Math.round((skip / totalEmails) * 100) : 0;

  const topSenders = useMemo(() => {
    const map = new Map<string, { count: number; priority: string }>();
    for (const email of emails) {
      const domain = extractDomain(email.from);
      const existing = map.get(domain);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(domain, { count: 1, priority: email.priority });
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);
  }, [emails]);

  const timeSaved = totalEmails > 0
    ? Math.round(skip * 0.5 + worthReading * 0.3)
    : 0;

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--foreground)]">統計</h2>
        <button
          onClick={onBack}
          className="text-sm text-blue-500 hover:underline"
        >
          受信トレイに戻る
        </button>
      </div>

      {/* Overview */}
      <div className="mb-6 rounded-2xl bg-[var(--card)] p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-medium text-[var(--muted)]">今日の概要</h3>
        <div className="mb-4 text-center">
          <p className="text-5xl font-bold text-[var(--foreground)]">{totalEmails}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">通のメール</p>
        </div>

        {/* Bar Chart */}
        {totalEmails > 0 && (
          <div className="space-y-3">
            <BarRow label="🔴 要処理" count={mustHandle} pct={mustPct} color="bg-red-500" />
            <BarRow label="🟡 参考" count={worthReading} pct={worthPct} color="bg-yellow-500" />
            <BarRow label="🟢 不要" count={skip} pct={skipPct} color="bg-green-500" />
          </div>
        )}
      </div>

      {/* Time Saved */}
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm dark:from-blue-950 dark:to-indigo-950">
        <p className="text-sm text-blue-600 dark:text-blue-400">節約した時間（推定）</p>
        <p className="mt-1 text-4xl font-bold text-blue-700 dark:text-blue-300">
          {timeSaved} 分
        </p>
        <p className="mt-1 text-sm text-blue-500 dark:text-blue-400">
          {skip} 通の不要メールを読まずに済みました
        </p>
      </div>

      {/* Top Senders */}
      {topSenders.length > 0 && (
        <div className="mb-6 rounded-2xl bg-[var(--card)] p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-medium text-[var(--muted)]">
            よく届く差出人
          </h3>
          <div className="space-y-3">
            {topSenders.map(([domain, info]) => (
              <div key={domain} className="flex items-center justify-between">
                <span className="text-sm text-[var(--foreground)]">{domain}</span>
                <span className="rounded-lg bg-[var(--background)] px-2.5 py-1 text-xs font-medium text-[var(--muted)]">
                  {info.count} 通
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learning Status */}
      <div className="mb-6 rounded-2xl bg-[var(--card)] p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-medium text-[var(--muted)]">
          AIの学習状況
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-[var(--background)] p-4 text-center">
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {reclassifications.length}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">分類の修正回数</p>
          </div>
          <div className="rounded-xl bg-[var(--background)] p-4 text-center">
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {senderRules.length}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">学習済み差出人</p>
          </div>
        </div>

        {/* Learned Sender Rules */}
        {senderRules.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs text-[var(--muted)]">学習したルール</p>
            <div className="space-y-2">
              {senderRules.slice(0, 5).map((rule) => {
                const dots = {
                  must_handle: "🔴",
                  worth_reading: "🟡",
                  skip: "🟢",
                };
                return (
                  <div
                    key={rule.sender}
                    className="flex items-center justify-between rounded-lg bg-[var(--background)] px-3 py-2"
                  >
                    <span className="text-sm text-[var(--foreground)]">
                      {rule.sender}
                    </span>
                    <span className="text-sm">
                      {dots[rule.priority]} ({rule.count}回)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {reclassifications.length === 0 && senderRules.length === 0 && (
          <p className="mt-2 text-center text-sm text-[var(--muted)]">
            メールの分類を変更すると、AIがあなたの好みを学習します
          </p>
        )}
      </div>
    </div>
  );
}

function BarRow({
  label,
  count,
  pct,
  color,
}: {
  label: string;
  count: number;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-[var(--foreground)]">{label}</span>
        <span className="text-[var(--muted)]">
          {count} 通 ({pct}%)
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--background)]">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
    </div>
  );
}

function extractDomain(from: string): string {
  const match = from.match(/@([^>]+)/);
  return match ? match[1].toLowerCase() : from;
}
