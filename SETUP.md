# 设定指南

## 1. Google Cloud Console（OAuth + Gmail API）

### 1.1 打开 Google Cloud Console

https://console.cloud.google.com

### 1.2 选择或创建项目

- 可以用之前的项目（如 `jp-news-hourly`），也可以点击上方项目选择器 → 「新しいプロジェクト」
- 项目名随意，如 `ai-reading-assistant`

### 1.3 启用 Gmail API

1. 左侧菜单 → 「APIとサービス」→「ライブラリ」
2. 搜索栏输入 `Gmail API`
3. 点击搜索结果中的 `Gmail API`
4. 点击「有効にする」

### 1.4 创建 OAuth 同意画面

1. 左侧菜单 → 「APIとサービス」→「OAuth同意画面」
2. User Type 选择「外部」→「作成」
3. 填写：
   - アプリ名: `AI Reading Assistant`
   - ユーザーサポートメール: 你的Gmail地址
   - デベロッパーの連絡先: 你的Gmail地址
4. 「保存して次へ」
5. スコープ画面 →「スコープを追加または削除」→ 搜索 `gmail.readonly` → 勾选 → 「更新」→「保存して次へ」
6. テストユーザー →「ADD USERS」→ 输入你的Gmail地址 → 「追加」→「保存して次へ」
7. 「ダッシュボードに戻る」

### 1.5 创建 OAuth クライアントID

1. 左侧菜单 → 「APIとサービス」→「認証情報」
2. 上方点击「認証情報を作成」→「OAuthクライアントID」
3. 填写：
   - アプリケーションの種類: 「ウェブアプリケーション」
   - 名前: `AI Reading Assistant`
   - 承認済みのリダイレクトURI: 点击「URIを追加」，输入:
     ```
     http://localhost:3000/api/auth/callback/google
     ```
4. 点击「作成」
5. 弹窗会显示「クライアントID」和「クライアントシークレット」→ **复制并保存这两个值**

## 2. Anthropic API Key

### 2.1 打开 Anthropic Console

https://console.anthropic.com

### 2.2 登录

- 可以用Google账号登录（和ChatGPT/Claude分开的）
- 如果是新账号，需要充值（最低$5）

### 2.3 创建 API Key

1. 左侧菜单点击「API Keys」
2. 点击「Create Key」
3. 名前随意，如 `ai-reading-assistant`
4. **复制Key**（只显示一次）

## 3. 写入 .env.local

打开项目根目录的 `.env.local` 文件：

```
C:\Users\youyo\projects\ai-reading-assistant\.env.local
```

填入以下内容：

```env
GOOGLE_CLIENT_ID=你的クライアントID
GOOGLE_CLIENT_SECRET=你的クライアントシークレット
ANTHROPIC_API_KEY=你的Anthropic API Key
AUTH_SECRET=随机字符串（见下方生成方法）
AUTH_URL=http://localhost:3000
```

### AUTH_SECRET 生成方法

在终端运行以下命令，复制输出的字符串：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 4. 启动

```bash
npm run dev
```

打开 http://localhost:3000 → 会显示登录画面 → 用Google账号登录 → 开始使用

## 常见问题

### 登录后出现 "redirect_uri_mismatch"
→ 检查 Google Cloud Console 的リダイレクトURI是否完全一致：`http://localhost:3000/api/auth/callback/google`

### 登录后没有邮件显示
→ 检查 Gmail API 是否已启用。如果今天没有收到邮件，会显示空列表

### 文书分析报错
→ 检查 ANTHROPIC_API_KEY 是否正确，账户是否有余额
