# UniWork Office — license + dùng thử (single installer)

Mục tiêu: **một bản cài**. Khách **nhập license** hoặc **bắt đầu dùng thử 7 ngày** (Office + AI). Hết hạn → **khóa cả hệ thống** (không chỉ AI). Credit còn dư không mở lại app.

## Cách hoạt động

1. Một dist (không tách “bản trial” / “bản full”).
2. Lần đầu / chưa active: màn hình gate — **License** | **Dùng thử 7 ngày**.
3. Dùng thử: Hub `POST /v1/trial/start` gắn `deviceId` — **1 máy = 1 lần trial**; **10.000 Credit** AI; cửa sổ **7 ngày**.
4. License / mã kích hoạt: Hub `POST /v1/trial/activate` hoặc `/v1/activate` (ghế theo gói).
5. Main process giữ managed AI key khi có — **không ghi** vào `ai-settings.json`.
6. Mỗi lần gọi AI trừ Credit ước lượng vào `userData/trial-ai-usage.json`.
7. Hết 7 ngày hoặc không có license → gate khóa **toàn bộ Home / Workbench / editors / AI**.

## Cloud Hub

| | |
|---|---|
| Repo | `/Users/uranus/Projects/uniwork-cloud-hub` |
| Public URL | `https://uniwork-cloud-hub.lovable.app` |
| Start trial | `POST /v1/trial/start` `{ deviceId }` |
| Redeem code | `POST /v1/trial/activate` `{ code, codeHash, deviceId }` |
| `TRIAL_DAYS` | **7** |
| Trial Credit | **10 000** (plan `trial`) |

Hash mã license (không đổi): `normalized = upper(code).replace(/[^A-Z0-9]/g,"")`,  
`codeHash = sha256_hex("uniwork-trial-v1:" + normalized)`.

## Desktop defaults

| Constant | Value |
|---|---|
| `TRIAL_DURATION_DAYS` | 7 |
| `DEFAULT_TRIAL_CREDITS` / `DEFAULT_SELF_TRIAL_CREDITS` | 10 000 |
| Packaged app Hub URL | `https://uniwork-cloud-hub.lovable.app` (trừ khi `UNIWORK_TRIAL_ACTIVATION_URL=off`) |

Quy đổi: **1 USD = 1.000 Credit** → 10.000 ≈ **$10** theo meter nội bộ.

## Env / đóng gói

```bash
UNIWORK_TRIAL_OPENROUTER_KEY=sk-or-v1-…   # optional managed AI key
UNIWORK_TRIAL_CREDITS=10000              # override allowance
# UNIWORK_TRIAL_DAYS=7
# UNIWORK_TRIAL_ACTIVATION_URL=https://uniwork-cloud-hub.lovable.app
# UNIWORK_TRIAL_SKIP_ACTIVATION=1        # dev only
```

## Kiểm soát

| Lớp | Việc |
| --- | --- |
| Self-serve trial | 1 deviceId = 1 cửa sổ 7 ngày |
| License seats | Theo `max_seats` gói |
| Hết hạn | Khóa **cả app** |
| Credit local | Soft stop AI trong cửa sổ trial |
| hub-only | Không BYOK trên bản margin |

## Phase sau

- Heartbeat (revoked giữa chừng)  
- Map trial → gói khi đăng nhập Hub  
- Cộng nốt Credit trial khi mua trong N ngày (tùy chọn goodwill)  
