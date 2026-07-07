import type { ClassifiedEmail } from "./classifier";

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600000).toISOString();
}

export const MOCK_EMAILS: ClassifiedEmail[] = [
  {
    id: "1",
    from: "Amazon.co.jp <store-news@amazon.co.jp>",
    subject: "お支払い方法の確認が必要です",
    date: hoursAgo(1),
    priority: "must_handle",
    reason: "支払い方法に問題があり、対応しないと注文がキャンセルされる可能性があります",
    summary: "登録されたクレジットカードの有効期限切れ。更新しないと進行中の注文が保留になります。",
    keyInfo: ["期限: 今日23:59", "対象: 注文#503-1234567"],
    suggestedActions: [
      { label: "支払い方法を更新", type: "link" },
      { label: "アーカイブ", type: "archive" },
    ],
  },
  {
    id: "2",
    from: "Google <no-reply@accounts.google.com>",
    subject: "セキュリティ通知: 新しいログインがありました",
    date: hoursAgo(0.5),
    priority: "must_handle",
    reason: "通常と異なるデバイスからのログインが検出されました。不正アクセスの可能性があります",
    summary: "大阪から新しいWindows PCでGoogleアカウントにログインがありました。心当たりがない場合はすぐに対応が必要です。",
    keyInfo: ["場所: 大阪", "デバイス: Windows PC", "時刻: 14:32"],
    suggestedActions: [
      { label: "ログイン履歴を確認", type: "link" },
      { label: "パスワードを変更", type: "link" },
    ],
  },
  {
    id: "3",
    from: "ランサーズ <info@lancers.jp>",
    subject: "【採用通知】Next.js管理画面修正の件",
    date: hoursAgo(2),
    priority: "must_handle",
    reason: "案件に採用されました。クライアントからの返信が必要です",
    summary: "応募したNext.js管理画面修正案件に採用されました。クライアントが作業開始の確認を待っています。",
    keyInfo: ["報酬: ¥3,000", "納期: 7/3"],
    suggestedActions: [
      { label: "返信する", type: "reply" },
      { label: "カレンダーに追加", type: "calendar" },
    ],
  },
  {
    id: "4",
    from: "YouTube <noreply@youtube.com>",
    subject: "チャンネル更新: 3本の新しい動画",
    date: hoursAgo(3),
    priority: "worth_reading",
    reason: "フォロー中のチャンネルから新しいコンテンツが投稿されました",
    summary: "登録チャンネルから3本の新しい動画が公開されました。Tech系チャンネルのNext.js 16解説が含まれています。",
    keyInfo: ["動画数: 3本", "推定視聴時間: 45分"],
    suggestedActions: [
      { label: "後で見る", type: "reminder" },
      { label: "アーカイブ", type: "archive" },
    ],
  },
  {
    id: "5",
    from: "Qiita <notifications@qiita.com>",
    subject: "今週のトレンド記事まとめ",
    date: hoursAgo(4),
    priority: "worth_reading",
    reason: "技術トレンドの情報収集に役立つ内容です",
    summary: "今週のQiitaトレンド記事。Claude API活用法とSupabase Edge Functionsの記事がランクイン。",
    keyInfo: ["記事数: 10本", "推定閲読: 5分"],
    suggestedActions: [
      { label: "後で読む", type: "reminder" },
      { label: "アーカイブ", type: "archive" },
    ],
  },
  {
    id: "6",
    from: "楽天市場 <news@emagazine.rakuten.co.jp>",
    subject: "【期間限定】ポイント10倍キャンペーン実施中",
    date: hoursAgo(5),
    priority: "worth_reading",
    reason: "過去に楽天で買い物をした履歴があります。セール情報に興味がある可能性があります",
    summary: "楽天スーパーセール開催中。エントリーでポイント10倍。対象期間は7/1まで。",
    keyInfo: ["期間: 〜7/1", "ポイント10倍"],
    suggestedActions: [
      { label: "アーカイブ", type: "archive" },
    ],
  },
  {
    id: "7",
    from: "UNIQLO <mail@uniqlo.com>",
    subject: "新作アイテムのご紹介",
    date: hoursAgo(6),
    priority: "skip",
    reason: "プロモーションメール。過去のクリック履歴から、このカテゴリへの興味度は低いです",
    summary: "ユニクロ新作コレクションの紹介メール。",
    keyInfo: [],
    suggestedActions: [
      { label: "アーカイブ", type: "archive" },
    ],
  },
  {
    id: "8",
    from: "LinkedIn <messages-noreply@linkedin.com>",
    subject: "3人があなたのプロフィールを閲覧しました",
    date: hoursAgo(7),
    priority: "skip",
    reason: "LinkedInの定期通知。緊急性はありません",
    summary: "LinkedInプロフィール閲覧通知。",
    keyInfo: [],
    suggestedActions: [
      { label: "アーカイブ", type: "archive" },
    ],
  },
  {
    id: "9",
    from: "GitHub <notifications@github.com>",
    subject: "Dependabot: 2 security updates",
    date: hoursAgo(8),
    priority: "skip",
    reason: "自動生成されたセキュリティ更新通知。critical severity ではありません",
    summary: "Dependabotがmoderate severityの依存関係更新を2件検出。",
    keyInfo: ["severity: moderate"],
    suggestedActions: [
      { label: "アーカイブ", type: "archive" },
    ],
  },
  {
    id: "10",
    from: "ヤマト運輸 <mail@kuronekoyamato.co.jp>",
    subject: "お届け予定通知",
    date: hoursAgo(9),
    priority: "skip",
    reason: "配達通知。特に対応不要です",
    summary: "荷物が本日配達予定。時間指定なし。",
    keyInfo: ["配達予定: 本日中"],
    suggestedActions: [
      { label: "アーカイブ", type: "archive" },
    ],
  },
];
