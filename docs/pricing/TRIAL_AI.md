# UniWork Office — AI dùng thử (managed trial)

Mục tiêu: khách **cài bộ trial → nhập mã kích hoạt → dùng AI** (key đã gắn sẵn); anh **kiểm soát ai được mở** và **hạn mức Credit** (mặc định **50.000**).

## Cách hoạt động

1. Bản trial đóng gói với `uniworkTrialAi` (key + credits + activation).
2. Lần đầu mở app: **bắt buộc Activate code** — chưa kích hoạt thì không vào Home / không gọi AI.
3. Main process giữ key — **không ghi** vào `ai-settings.json`.
4. Mỗi lần gọi AI trừ Credit ước lượng vào `userData/trial-ai-usage.json`.
5. Hết hạn mức → mua gói UniWork (bản margin **không** mở BYOK).

## Quản lý mã — 1 mã = 1 máy (Cloud Hub)

App **không** cho kích hoạt offline nữa (trừ `UNIWORK_TRIAL_ALLOW_LOCAL_ACTIVATION=1` khi debug).  
Ledger + CMS: **[uniwork-cloud-hub](https://github.com/truongnt7/uniwork-cloud-hub)** — sửa từ **Cursor**; Lovable chỉ Cloud.

| | |
|---|---|
| Repo (Cursor) | `/Users/uranus/Projects/uniwork-cloud-hub` |
| Multi-root | `/Users/uranus/Projects/uniwork.code-workspace` |
| Public URL | `https://uniwork-cloud-hub.lovable.app` |
| Activate | `POST /v1/trial/activate` `{ code, codeHash, deviceId }` |
| Admin CMS | `/admin` (đăng nhập email trong `ADMIN_EMAILS`) |

Desktop mặc định trỏ URL trên khi có trial key (override bằng `UNIWORK_TRIAL_ACTIVATION_URL`).

| Kết quả | Ý |
| --- | --- |
| `ok: true` | Gắn mã ↔ deviceId |
| `already_used` | Mã đã dùng máy khác — **chặn** |
| `invalid` | Sai mã |
| `revoked` | Anh thu hồi |
| `rate_limited` | Quá nhiều lần thử |

Hash (phải khớp desktop): `normalized = upper(code).replace(/[^A-Z0-9]/g,"")`,  
`codeHash = sha256_hex("uniwork-trial-v1:" + normalized)`.

### Seed 100 mã lên Cloud Hub

```bash
# One-shot (DB còn trống) — sau khi Lovable đã deploy bootstrap route:
node tools/seed-cloud-hub-trial-codes.mjs

# Hoặc admin JWT:
UNIWORK_CLOUD_ADMIN_TOKEN='…' node tools/seed-cloud-hub-trial-codes.mjs
```

Hoặc CMS Admin → import batch / SQL migration `0001_seed_trial_batch_100.sql` trong repo cloud-hub.

### Batch 100 mã (Office)

| File | |
| --- | --- |
| `docs/pricing/trial-activation-codes-100.xlsx` | Plaintext + cột Recipient (**gitignored**) |
| `apps/shell/build/trial-activation-hashes.json` | Hash nhúng bản cài |

```bash
python3 tools/gen-trial-activation-batch.py 100   # tạo lại nếu cần
```

### Quy trình gửi khách

1. Seed 100 mã lên Cloud Hub (một lần).  
2. Build trial với OpenRouter key (URL Cloud Hub đã default).  
3. Gửi **file cài + 1 mã** từ Excel; điền Recipient.  
4. Khách khác dùng chung mã → lỗi “already used on another device”.  
5. Lộ → revoke mã trên CMS / đổi batch + (tuỳ) revoke key OpenRouter.

## Activate code (client)

- Chuẩn hóa mã: bỏ dấu `-` / khoảng trắng, uppercase.  
- Hash: `sha256("uniwork-trial-v1:" + normalized)`.  
- Tắt gate tạm (dev): `UNIWORK_TRIAL_SKIP_ACTIVATION=1`.

## Khoá mô hình (Token margin)

`uniworkManagedAi.hubOnly`: chỉ UniAI + catalog Token Hub; không BYOK.  
Debug: `UNIWORK_ALLOW_BYOK=1`.

Quy đổi: **1 USD = 1.000 Credit** → 50.000 ≈ **$50**.

## Đóng gói

```bash
# electron-builder.env (hoặc export):
UNIWORK_TRIAL_OPENROUTER_KEY=sk-or-v1-…
UNIWORK_TRIAL_CREDITS=50000
# optional override — default = https://uniwork-cloud-hub.lovable.app
# UNIWORK_TRIAL_ACTIVATION_URL=https://uniwork-cloud-hub.lovable.app

node tools/check-trial-ai-env.mjs
npm run dist:mac   # hoặc dist:win
```

Dev trỏ Cloud Hub (default) hoặc local stub:

```bash
UNIWORK_TRIAL_OPENROUTER_KEY='…' \
npm run dev

# stub local (tools/trial-activation-server) nếu cần:
UNIWORK_TRIAL_ACTIVATION_URL='http://127.0.0.1:8787' npm run dev
```

## Kiểm soát

| Lớp | Việc |
| --- | --- |
| Cloud Hub redeem | **1 mã = 1 deviceId** |
| Activate UI | Chưa mã không vào app |
| OpenRouter limit | Hard stop tiền |
| Credit local | Soft stop |
| hub-only | Không BYOK |
| CMS revoke | Thu hồi đợt lộ |

## Phase sau

- Heartbeat định kỳ (revoked giữa chừng)  
- Proxy OpenRouter (không nhúng key)  
- Map trial → gói khi đăng nhập UniWork Cloud Hub  
- Billing checkout (đang blocked seller country trên Lovable)
