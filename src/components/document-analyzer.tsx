"use client";

import { useState } from "react";
import { AnalysisResultView } from "./analysis-result";
import {
  SAMPLE_CONTRACT_TEXT,
  SAMPLE_TERMS_TEXT,
} from "@/lib/mock-documents";
import type { AnalysisResult } from "@/lib/document-types";

interface DocumentAnalyzerProps {
  onBack: () => void;
}

export function DocumentAnalyzer({ onBack }: DocumentAnalyzerProps) {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);

  const handleAnalyze = async () => {
    if (!text.trim() || text.trim().length < 10) {
      setError("10文字以上のテキストを入力してください");
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, title: title || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "分析に失敗しました");
      }

      const data = await res.json();
      setResult(data.result);
      setHistory((prev) => [data.result, ...prev]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLoadSample = (type: "contract" | "terms") => {
    if (type === "contract") {
      setText(SAMPLE_CONTRACT_TEXT);
      setTitle("クラウドサービス利用契約書");
    } else {
      setText(SAMPLE_TERMS_TEXT);
      setTitle("Google 利用規約");
    }
    setResult(null);
  };

  if (result) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--foreground)]">
            分析結果
          </h2>
          <button
            onClick={() => setResult(null)}
            className="text-sm text-blue-500 hover:underline"
          >
            新しい文書を分析
          </button>
        </div>
        <AnalysisResultView result={result} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--foreground)]">
          文書リスク分析
        </h2>
        <button
          onClick={onBack}
          className="text-sm text-blue-500 hover:underline"
        >
          受信トレイに戻る
        </button>
      </div>

      {/* Description */}
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 p-5 dark:from-indigo-950 dark:to-purple-950">
        <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
          契約書・利用規約・プライバシーポリシーを貼り付けると、AIがリスクを分析します
        </p>
        <p className="mt-1 text-xs text-indigo-500 dark:text-indigo-400">
          自動更新、解約条件、料金変更、データ共有などをチェックし、リスクスコアを算出します
        </p>
      </div>

      {/* Title Input */}
      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
          文書タイトル（任意）
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: サービス利用契約書"
          className="w-full rounded-xl bg-[var(--card)] px-4 py-2.5 text-sm text-[var(--foreground)] shadow-sm outline-none placeholder:text-[var(--muted)] focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Text Input */}
      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
          文書テキスト
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="契約書や利用規約のテキストをここに貼り付けてください..."
          rows={12}
          className="w-full resize-y rounded-xl bg-[var(--card)] px-4 py-3 text-sm leading-relaxed text-[var(--foreground)] shadow-sm outline-none placeholder:text-[var(--muted)] focus:ring-2 focus:ring-indigo-400"
        />
        <p className="mt-1 text-right text-xs text-[var(--muted)]">
          {text.length} 文字
        </p>
      </div>

      {/* Sample Buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="text-xs text-[var(--muted)] leading-7">
          サンプル:
        </span>
        <button
          onClick={() => handleLoadSample("contract")}
          className="rounded-lg border border-[var(--border)] px-3 py-1 text-xs text-[var(--foreground)] transition hover:bg-[var(--border)]"
        >
          高リスク契約書
        </button>
        <button
          onClick={() => handleLoadSample("terms")}
          className="rounded-lg border border-[var(--border)] px-3 py-1 text-xs text-[var(--foreground)] transition hover:bg-[var(--border)]"
        >
          低リスク利用規約
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={analyzing || !text.trim()}
        className="w-full rounded-xl bg-indigo-600 py-3 text-base font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {analyzing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            AIが分析中...
          </span>
        ) : (
          "リスクを分析する"
        )}
      </button>

      {/* History */}
      {history.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-medium text-[var(--muted)]">
            分析履歴
          </h3>
          <div className="space-y-2">
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => setResult(item)}
                className="flex w-full items-center justify-between rounded-xl bg-[var(--card)] p-3 text-left shadow-sm transition hover:shadow-md"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {item.title}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {new Date(item.analyzedAt).toLocaleTimeString("ja-JP")}
                  </p>
                </div>
                <RiskBadge score={item.riskScore} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RiskBadge({ score }: { score: number }) {
  const colors: Record<number, string> = {
    1: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    2: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    3: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    4: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    5: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  };

  return (
    <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${colors[score]}`}>
      {"★".repeat(score)}{"☆".repeat(5 - score)}
    </span>
  );
}
