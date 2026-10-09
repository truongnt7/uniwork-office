# UniWork Office — AI dùng thử (managed trial)

Mục tiêu: khách **cài xong dùng AI ngay**, không nhận API key OpenRouter qua chat; anh **kiểm soát hạn mức** (mặc định **50.000 Credit**).

## Cách hoạt động

1. Bản trial được đóng gói với metadata `uniworkTrialAi` (key + credits).
2. Main process giữ key — **không ghi** vào `ai-settings.json`, không bắt khách dán key.
3. Mỗi lần gọi AI (My AI / Docs…) trừ Credit ước lượng vào `userData/trial-ai-usage.json`.
4. Hết hạn mức → AI báo lỗi credits; khách có thể dán **key riêng** (BYOK) hoặc nâng gói.

Quy đổi Credit (đã có sẵn trong app): **1 USD Token Hub = 1.000 Credit** → 50.000 Credit ≈ **$50** OpenRouter.

## Đóng gói bản trial

Tạo **một OpenRouter key riêng cho trial** (không dùng key master unlimited):

1. OpenRouter → Keys → Create key  
2. Gắn **limit ≈ $50** (hoặc đúng ngân sách trial)  
3. Build:

```bash
export UNIWORK_TRIAL_OPENROUTER_KEY='sk-or-v1-…'
export UNIWORK_TRIAL_CREDITS=50000   # optional, default 50000
npm run dist:mac   # hoặc dist:win / dist:linux
```

Hoặc trong `apps/shell/electron-builder.env` (gitignored):

```
UNIWORK_TRIAL_OPENROUTER_KEY=sk-or-v1-…
UNIWORK_TRIAL_CREDITS=50000
```

Dev không đóng gói:

```bash
UNIWORK_TRIAL_OPENROUTER_KEY='sk-or-v1-…' UNIWORK_TRIAL_CREDITS=50000 npm run dev
```

### Checklist trước khi gửi bản trial

1. Key **riêng** trên OpenRouter, limit ≈ ngân sách trial (không dùng key master).
2. `apps/shell/electron-builder.env` (gitignored) có `UNIWORK_TRIAL_*` — hoặc export trong CI.
3. Preflight (không in key):

```bash
node tools/check-trial-ai-env.mjs
# sau khi dist:
node tools/check-trial-ai-env.mjs --asar apps/shell/release/win-unpacked/resources/app.asar
```

4. Cài bản mới → Ví Credit hiện `Dùng thử · còn …` → một câu My AI chạy được.
5. Hết Credit (hoặc hạ allowance test) → lỗi rõ + CTA Cài đặt AI / mua gói.

## Kiểm soát & bảo mật

| Lớp | Việc làm |
| --- | --- |
| OpenRouter limit | Hard stop chi tiêu thật trên Hub |
| Local Credit meter | Soft stop trong app (UI Ví Credit “Dùng thử”) |
| Key riêng per batch trial | Revoke key khi hết đợt dùng thử |
| Không chat key cho khách | Key chỉ trong bản cài / env CI |

**Lưu ý:** key trong `extraMetadata` vẫn có thể bị reverse-engineer từ binary. Đây là chấp nhận được cho **vòng dùng thử kín**; production lâu dài nên chuyển sang **proxy UniWork** (device đăng ký → server gọi OpenRouter, không nhúng key).

## UI khách thấy

- Ví Credit: `Dùng thử · còn X`
- Settings → AI: banner “AI dùng thử UniWork đã sẵn sàng — không cần dán API key”
- Hết Credit: lỗi rõ; có thể tự gắn Token Hub key riêng

## Phase sau (khuyến nghị)

- `POST /api/trial/provision` theo `deviceId` → cấp key/limit từng máy  
- Đồng bộ usage lên server để chống cài lại để reset quota  
- Map trial → plan Free/Personal khi đăng nhập UniWork
