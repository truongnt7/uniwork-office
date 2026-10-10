# UniWork Office — AI dùng thử (managed trial)

Mục tiêu: khách **cài bộ trial → nhập mã kích hoạt → dùng AI** (key đã gắn sẵn); anh **kiểm soát ai được mở** và **hạn mức Credit** (mặc định **50.000**).

## Cách hoạt động

1. Bản trial đóng gói với `uniworkTrialAi` (key + credits + activation).
2. Lần đầu mở app: **bắt buộc Activate code** — chưa kích hoạt thì không vào Home / không gọi AI.
3. Main process giữ key — **không ghi** vào `ai-settings.json`.
4. Mỗi lần gọi AI trừ Credit ước lượng vào `userData/trial-ai-usage.json`.
5. Hết hạn mức → mua gói UniWork (bản margin **không** mở BYOK).

## Quản lý mã — 1 mã = 1 máy (bắt buộc)

App **không** cho kích hoạt offline nữa (trừ `UNIWORK_TRIAL_ALLOW_LOCAL_ACTIVATION=1` khi debug).  
Phải có server ledger: máy 2 dùng chung mã → `already_used`.

### Server có sẵn trong repo

```bash
# 1) Nạp 100 hash vào sổ
node tools/trial-activation-server/seed.mjs

# 2) Chạy server (máy anh / VPS)
HOST=0.0.0.0 PORT=8787 node tools/trial-activation-server/server.mjs
```

Public URL (ngrok / domain) → ghi vào build:

```
UNIWORK_TRIAL_ACTIVATION_URL=https://your-host.example.com
UNIWORK_TRIAL_OPENROUTER_KEY=sk-or-v1-…
UNIWORK_TRIAL_CREDITS=50000
```

API:

`POST {URL}/v1/trial/activate`  
`{ "code", "codeHash", "deviceId" }`

| Kết quả | Ý |
| --- | --- |
| `ok: true` | Gắn mã ↔ deviceId |
| `already_used` | Mã đã dùng máy khác — **chặn** |
| `invalid` | Sai mã |
| `revoked` | Anh thu hồi |

`GET /v1/trial/status` — tổng / đã dùng / còn trống.  
`POST /v1/trial/revoke` + `Authorization: Bearer $ADMIN_TOKEN` — hủy mã.

Ledger file (gitignored): `tools/trial-activation-server/data/ledger.json`.

### Batch 100 mã

| File | |
| --- | --- |
| `docs/pricing/trial-activation-codes-100.xlsx` | Plaintext + cột Recipient (**gitignored**) |
| `apps/shell/build/trial-activation-hashes.json` | Hash nhúng bản cài + seed server |

```bash
python3 tools/gen-trial-activation-batch.py 100   # tạo lại nếu cần
node tools/trial-activation-server/seed.mjs       # nạp hash vào ledger
```

### Quy trình gửi khách

1. Chạy / deploy activation server, seed 100 mã.  
2. Build trial với `UNIWORK_TRIAL_ACTIVATION_URL` + OpenRouter key.  
3. Gửi **file cài + 1 mã** từ Excel; điền Recipient.  
4. Khách khác dùng chung mã → lỗi “already used on another device”.  
5. Lộ → revoke mã / đổi batch + (tuỳ) revoke key OpenRouter.

## Activate code (client)

- Chuẩn hóa mã: bỏ dấu `-` / khoảng trắng, uppercase.  
- Hash: `sha256("uniwork-trial-v1:" + normalized)`.  
- Tắt gate tạm (dev): `UNIWORK_TRIAL_SKIP_ACTIVATION=1`.

## Khoá mô hình (Token margin)

`uniworkManagedAi.hubOnly`: chỉ UniAI + catalog Token Hub; không BYOK.  
Debug: `UNIWORK_ALLOW_BYOK=1`.

Quy đổi: **1 USD = 1.000 Credit** → 50.000 ≈ **$50**.

## Đóng gói (bắt buộc qua server)

```bash
# Terminal 1 — ledger + API (giữ chạy / deploy VPS)
node tools/trial-activation-server/seed.mjs
HOST=0.0.0.0 PORT=8787 node tools/trial-activation-server/server.mjs

# electron-builder.env (hoặc export):
UNIWORK_TRIAL_OPENROUTER_KEY=sk-or-v1-…
UNIWORK_TRIAL_CREDITS=50000
UNIWORK_TRIAL_ACTIVATION_URL=https://YOUR-PUBLIC-HOST   # ngrok / domain trỏ :8787

node tools/check-trial-ai-env.mjs   # phải có key + URL
npm run dist:mac   # hoặc dist:win
```

Dev app trỏ server local:

```bash
UNIWORK_TRIAL_OPENROUTER_KEY='…' \
UNIWORK_TRIAL_ACTIVATION_URL='http://127.0.0.1:8787' \
npm run dev
```

## Kiểm soát

| Lớp | Việc |
| --- | --- |
| Server redeem | **1 mã = 1 deviceId** |
| Activate UI | Chưa mã không vào app |
| OpenRouter limit | Hard stop tiền |
| Credit local | Soft stop |
| hub-only | Không BYOK |
| Batch + revoke | Thu hồi đợt lộ |

## Phase sau

- Heartbeat định kỳ (revoked giữa chừng)  
- Proxy OpenRouter (không nhúng key)  
- Map trial → gói khi đăng nhập UniWork
