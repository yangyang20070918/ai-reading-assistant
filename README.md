# AI Reading Assistant

让AI先替你阅读，再决定你是否需要阅读。

## 功能

- Gmail邮件自动分类（要処理 / 参考 / 不要）+ 判断理由
- AI建议下一步动作（回复、加日历、归档等）一键执行
- 合同/利用规约风险评分（★5段阶）
- 个人偏好学习（越用越懂你）
- 搜索、排序、一括操作
- 统计页面
- 暗黑模式

## 技术栈

- Next.js 16 + TypeScript + Tailwind CSS
- NextAuth.js (Google OAuth)
- Gmail API
- Claude API (Anthropic)

## 快速开始（Demo模式）

不需要任何API Key，直接用模拟数据运行：

```bash
npm install
npm run dev
```

打开 http://localhost:3000 即可看到Demo画面。

## 正式使用（需要设定API Key）

详见 [SETUP.md](./SETUP.md)

## 测试

详见 [TEST.md](./TEST.md)
