"use client";

import { useState } from "react";
import { RISK_LABELS, DOCUMENT_TYPES } from "@/lib/document-types";
import type { AnalysisResult, RiskItem } from "@/lib/document-types";

export function AnalysisResultView({ result }: { result: AnalysisResult }) {
  const [showOriginal, setShowOriginal] = useState(false);
  const riskLabel = RISK_LABELS[result.riskScore];
  const docType = DOCUMENT_TYPES[result.type] ?? "文書";

  const highRisk = result.riskItems.filter(
    (r) => r.found && r.severity === "high"
  );
  const mediumRisk = result.riskItems.filter(
    (r) => r.found && r.severity === "medium"
  );
  const safeItems = result.riskItems.filter((r) => !r.found);

  return (
    <div className="space-y-4">
      {/* Risk Score Card */}
      <div
        className={`rounded-2xl p-6 text-center shadow-sm ${
          result.riskScore >= 4
            ? "bg-red-50 dark:bg-red-950"
            : result.riskScore >= 3
              ? "bg-yellow-50 dark:bg-yellow-950"
              : "bg-green-50 dark:bg-green-950"
        }`}
      >
        <p className="mb-1 text-sm text-[var(--muted)]">{docType}</p>
        <h3 className="mb-3 text-xl font-bold text-[var(--foreground)]">
          {result.title}
        </h3>
        <p className={`text-4xl font-bold tracking-wider ${riskLabel.color}`}>
          {riskLabel.label}
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">リスクレベル</p>
        <p className={`mt-3 text-base font-medium ${riskLabel.color}`}>
          {riskLabel.description}
        </p>
      </div>

      {/* Recommendation */}
      <div
        className={`rounded-2xl p-5 shadow-sm ${
          result.riskScore >= 4
            ? "border-2 border-red-300 bg-[var(--card)] dark:border-red-800"
            : "bg-[var(--card)]"
        }`}
      >
        <p className="mb-1 text-xs font-medium text-[var(--muted)]">
          AIの推奨
        </p>
        <p className="text-base font-medium text-[var(--foreground)]">
          {result.recommendation}
        </p>
      </div>

      {/* Summary */}
      <div className="rounded-2xl bg-[var(--card)] p-5 shadow-sm">
        <p className="mb-1 text-xs font-medium text-[var(--muted)]">要約</p>
        <p className="text-sm leading-relaxed text-[var(--foreground)]">
          {result.summary}
        </p>
      </div>

      {/* Risk Items */}
      <div className="rounded-2xl bg-[var(--card)] p-5 shadow-sm">
        <p className="mb-4 text-xs font-medium text-[var(--muted)]">
          チェック項目
        </p>

        {/* High Risk */}
        {highRisk.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-red-600 dark:text-red-400">
              🔴 高リスク（{highRisk.length}件）
            </p>
            <div className="space-y-2">
              {highRisk.map((item, i) => (
                <RiskItemRow key={i} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Medium Risk */}
        {mediumRisk.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-yellow-600 dark:text-yellow-400">
              🟡 注意（{mediumRisk.length}件）
            </p>
            <div className="space-y-2">
              {mediumRisk.map((item, i) => (
                <RiskItemRow key={i} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Safe */}
        {safeItems.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-green-600 dark:text-green-400">
              🟢 問題なし（{safeItems.length}件）
            </p>
            <div className="space-y-2">
              {safeItems.map((item, i) => (
                <RiskItemRow key={i} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Original Text Toggle */}
      <div className="rounded-2xl bg-[var(--card)] shadow-sm">
        <button
          onClick={() => setShowOriginal(!showOriginal)}
          className="flex w-full items-center justify-between p-5 text-left"
        >
          <span className="text-sm font-medium text-[var(--muted)]">
            原文を表示
          </span>
          <span className="text-[var(--muted)]">
            {showOriginal ? "▲" : "▼"}
          </span>
        </button>
        {showOriginal && (
          <div className="border-t border-[var(--border)] p-5 animate-slide-down">
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--muted)]">
              {result.textPreview}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function RiskItemRow({ item }: { item: RiskItem }) {
  const [expanded, setExpanded] = useState(false);

  const severityColors = {
    high: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
    medium:
      "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800",
    low: "bg-[var(--background)] border-[var(--border)]",
  };

  return (
    <div
      className={`rounded-xl border p-3 transition ${severityColors[item.severity]} cursor-pointer`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">
            {item.found ? (
              item.severity === "high" ? "❌" : "⚠️"
            ) : (
              "✅"
            )}
          </span>
          <span className="text-sm font-medium text-[var(--foreground)]">
            {item.label}
          </span>
        </div>
        <span className="text-xs text-[var(--muted)]">
          {expanded ? "▲" : "▼"}
        </span>
      </div>
      {expanded && (
        <p className="mt-2 text-xs leading-relaxed text-[var(--muted)] animate-fade-in">
          {item.detail}
        </p>
      )}
    </div>
  );
}
