# SoloLead Agent - 詳細仕様書

> 📝 **注**: 実装ガイドおよび技術仕様です。ユーザーガイドは [README.md](README.md) をご参照ください。
> 最終更新: 2026年4月

---

## 1. プロジェクト概要

オリジナル版画を販売するアーティストが、Instagram を作品確認場として活用しながら、ニッチな需要を自動発掘し、Instagram DM で商談を開始するためのツール。

### 対象ユーザー
- オリジナル版画アーティスト
- ハンドメイド制作者
- 小規模 B2C ビジネス運営者

### ビジネスゴール
- 冷たい営業ではなく、**顧客のニーズに基づいた自然なアプローチ**
- Instagram を信頼できるポートフォリオとして活用
- 初期接触から商談開始までの自動化
- 月5〜10件の高質量リード獲得を目指す

---

## 2. 主要機能（MVP）

### 2.1 Artist Profile Setup
**機能**: アーティストのプロフィール情報を登録・管理

**入力項目**:
- `instagramUrl` (string): Instagram プロフィール URL
- `artStyle` (string): 作品スタイル説明（最大200文字）
- `targetScenes` (array): ターゲットシーン例：`["wedding", "newhouse", "anniversary", "gift"]`
- `language` (enum): `"ja" | "en"`

**保存先**: `localStorage` (ブラウザローカル)

### 2.2 Niche Lead Discovery
**機能**: Instagram・X・Google で需要シグナルを自動検索

**検索対象**:
- **Instagram**: ハッシュタグ + キーワード（インテリア、壁飾り、新居など）
- **X/Twitter**: キーワード検索（需要シグナルの発見）
- **Google**: 「○○ 版画」「○○ アート」での検索

**出力フォーマット**:
```json
{
  "matchScore": 0.89,
  "segment": "新築インテリアを探している人",
  "source": "Instagram",
  "sourceUrl": "https://instagram.com/...",
  "sourceText": "新居に合う壁飾りを探しています",
  "matchReasons": ["新居", "インテリア", "壁飾り"],
  "recommended": true
}
```

### 2.3 Personalized DM Generator
**機能**: AI が個人にカスタマイズした初回 DM を自動作成

**プロンプト設計**:
```
ユーザーの作品スタイル + リード情報 + トーン（丁寧・親切）
→ AI（Claude / Gemini）が自然な DM 文を生成
```

**生成ルール**:
- ✅ 必ずアーティストの Instagram リンクを含める
- ✅ 相手の投稿内容を言及する（パーソナライズ）
- ✅ スパム感を回避（長すぎない、一方的でない）
- ✅ 日本語・英語対応
- ✅ 140字以上、500字以下

**例（日本語）**:
```
新居おめでとうございます！🎉
インテリア探しのお力になれたらと思い、ご連絡させていただきました。

私の手刷り版画は新築の空間に自然に溶け込む作品が多いです。
もしよろしければ作品をこちらで確認していただけますでしょうか？

→ [Instagram URL]

お気に入りのものがあれば、ぜひお気軽にお声がけください😊
```

### 2.4 Lead Dashboard
**機能**: リード一覧、ステータス管理、エクスポート

**リード情報**:
```json
{
  "id": "uuid",
  "segment": "新築インテリア",
  "matchScore": 0.89,
  "status": "discovered",
  "dmGenerated": true,
  "dmText": "...",
  "dmSent": false,
  "note": "メモ欄",
  "createdAt": "2026-04-17T10:00:00Z",
  "followUpAt": null
}
```

**ステータス遷移**:
```
discovered → dm_generated → dm_sent → replied → deal_closed
              ↓
           dm_rejected (再生成)
```

**エクスポート形式**: Google Sheets、CSV

---

## 3. データモデルと API 仕様

### 3.1 Data Models

#### Profile
```typescript
interface Profile {
  id: string;              // UUID
  instagramUrl: string;    // https://instagram.com/...
  artStyle: string;        // 最大200文字
  targetScenes: string[];  // ["wedding", "newhouse", "anniversary"]
  language: "ja" | "en";
  createdAt: ISO8601;
  updatedAt: ISO8601;
}
```

#### Lead
```typescript
interface Lead {
  id: string;              // UUID
  profileId: string;       // FK
  segment: string;
  matchScore: number;      // 0.0 - 1.0
  source: "instagram" | "twitter" | "google";
  sourceUrl: string;
  sourceText: string;
  matchReasons: string[];
  status: LeadStatus;      // 下記参照
  dmText: string | null;
  dmSentAt: ISO8601 | null;
  repliedAt: ISO8601 | null;
  notes: string;
  followUpAt: ISO8601 | null;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

type LeadStatus = "discovered" | "dm_generated" | "dm_sent" | "replied" | "deal_closed" | "rejected";
```

#### SearchResult
```typescript
interface SearchResult {
  id: string;
  matchScore: number;
  segment: string;
  source: string;
  sourceUrl: string;
  sourceText: string;
  matchReasons: string[];
  recommended: boolean;
  timestamp: ISO8601;
}
```

### 3.2 API Endpoints (将来の Web Dashboard 用)

| Method | Endpoint | 説明 |
|--------|----------|------|
| GET | `/api/profile` | プロフィール取得 |
| POST/PUT | `/api/profile` | プロフィール保存 |
| POST | `/api/search` | リード検索を実行 |
| GET | `/api/leads` | リード一覧取得 |
| PUT | `/api/leads/:id` | リード情報更新 |
| DELETE | `/api/leads/:id` | リード削除 |
| POST | `/api/leads/:id/generate-dm` | DM 再生成 |
| GET | `/api/leads/export` | CSV/Sheets エクスポート |

---

## 4. システムアーキテクチャ

### 4.1 Current Structure (Phase 1)
```
sololead-agent/
├── index.html              # メイン UI（Single Page App）
├── README.md
├── SPEC.md
└── .git/
```

### 4.2 Planned Structure (Phase 2)
```
sololead-agent/
├── frontend/
│   ├── index.html
│   ├── js/
│   │   ├── app.js          # メイン JS
│   │   ├── api.js          # API クライアント
│   │   ├── storage.js      # localStorage 管理
│   │   └── utils.js        # ユーティリティ
│   ├── css/
│   │   └── style.css
│   └── assets/
├── backend/                # (オプション)
│   ├── server.js
│   └── routes/
├── config/
│   └── .env.example        # API キー設定
├── README.md
├── SPEC.md
└── package.json
```

---

## 5. AI Integration Specification

### 5.1 AI Provider Selection
| Provider | コスト | 速度 | 品質 | 選定基準 |
|----------|-------|------|------|---------|
| **Claude 3.5 Sonnet** | 中 | 中 | ⭐⭐⭐⭐⭐ | **推奨（日本語対応が優秀）** |
| Gemini Pro | 低 | 中 | ⭐⭐⭐⭐ | 代替案 |
| GPT-4 | 高 | 高 | ⭐⭐⭐⭐⭐ | コスト重視の場合は GPT-4o |

### 5.2 DM Generation Prompt Template

```markdown
# 指示

以下の情報に基づいて、自然で親切な初回DM文を日本語で作成してください。

## 作品情報
- スタイル: {artStyle}
- ターゲット: {targetScenes}

## 顧客情報
- 投稿内容: {sourceText}
- マッチ理由: {matchReasons.join(", ")}

## 制約
- 140字以上500字以下
- 敬語を使用
- 相手の投稿に言及する
- 相手のアカウントへのリフォローまたは好感を示す
- 最後に必ず {instagramUrl} へのリンクを含める
- スパム的に見えない
- 一方的すぎない（相手の返信を促す質問を含める）

## 出力フォーマット
DM文のみを出力してください。説明は不要です。
```

### 5.3 API Key Management
```javascript
// .env (要 .gitignore に追加)
VITE_AI_PROVIDER=claude          // "claude" | "gemini" | "gpt4"
VITE_AI_API_KEY=sk-ant-...       // Anthropic API Key
VITE_GOOGLE_API_KEY=AIza...      // Gemini の場合
VITE_OPENAI_API_KEY=sk-proj-...  // GPT-4 の場合
```

---

## 6. 実装タスク分割 (Phase 別)

### Phase 1: MVP（現在進行中）
**完成度**: 70%

- [x] プロフィール登録 UI
- [x] localStorage への保存
- [x] 入力値検証
- [ ] リード検出ロジック（AI 連携なしモック版）
- [ ] DM 生成ロジック（AI 連携なしモック版）
- [ ] ダッシュボード UI（シンプル版）

**成果物**: `index.html` 単一ファイル

---

### Phase 2: 自動化＋フルスタック
**期間**: 2〜3週間

**タスク**:
1. バックエンド構築（Node.js + Express）
2. AI API 統合（Claude / Gemini）
3. リアルタイム検索機能
4. データベース構築（SQLite / Supabase）
5. Google Sheets API 統合
6. スケジューラー（週次自動化）

**新ファイル**: `backend/`, `package.json`

---

### Phase 3: 会話支援＋Chrome Extension
**期間**: 1ヶ月以上

**タスク**:
1. Chrome Extension 開発
2. チャットボット機能（Claude API）
3. 自動フォローアップメッセージ
4. Analytics ダッシュボード

---

## 7. セキュリティ要件

### 7.1 API Key 管理
- ✅ キーを `.env` に格納（`.gitignore` に追加）
- ✅ フロント側では環境変数から読み込み
- ✅ バックエンド経由で API 呼び出し（キー秘匿）
- ❌ フロント側で直接 API キーを使用しない

### 7.2 データ保護
- ✅ localStorage のデータは暗号化対象外（ローカル PC のため）
- ✅ バックエンド DB では暗号化必須
- ✅ 個人情報（顧客メール等）は取得しない
- ✅ 公開投稿のみ参照

### 7.3 Rate Limiting
- API 呼び出し: 10回/分
- リード検索: 3回/日
- DM 生成: 5回/日

### 7.4 CORS 設定
```javascript
// バックエンド (Phase 2)
const cors = require('cors');
app.use(cors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true
}));
```

---

## 8. 注意事項＆コンプライアンス

### Instagram 利用規約
- ❌ スクレイピングは禁止（API のみ使用）
- ❌ スパム DM は禁止（1日3〜5件程度に抑止）
- ✅ 公開投稿情報のみ参照
- ✅ 最終 DM 送信は常に手動

### 個人情報保護
- 顧客情報（メール・本名）を意図的に取得しない
- 取得した投稿情報は責任持って管理
- GDPR・個人情報保護法への準拠

---

## 9. テスト計画

### Unit テスト
- [ ] Profile バリデーション
- [ ] Lead ステータス遷移
- [ ] DM 生成ロジック（モック）

### Integration テスト
- [ ] localStorage 動作
- [ ] API エンドポイント（Phase 2）
- [ ] AI API 呼び出し（Claude）

### E2E テスト
- [ ] プロフィール登録 → DM 生成 → エクスポート の一連フロー

---

## 10. デプロイメント

### Phase 1 (現在)
- ブラウザで `index.html` を直接開く
- または簡易サーバー: `python -m http.server 8000`

### Phase 2
- Vercel / Netlify へのデプロイ（フロント）
- Render / Railway / Heroku（バックエンド）

### Phase 3
- Chrome Web Store への登録

---

## 11. References & Resources

- [Claude API Documentation](https://docs.anthropic.com)
- [Instagram API (Best Practices)](https://developers.facebook.com/docs/instagram-api)
- [Google Search API](https://developers.google.com/custom-search)
- [Tailwind CSS](https://tailwindcss.com)