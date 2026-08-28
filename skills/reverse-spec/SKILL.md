---
name: reverse-spec
description: Recover a capability's spec from existing (legacy) production code when no ticket/spec survives — scan the code, infer the spec, and write the whole feature autonomously, then hand a plain-language flow summary to validate. Use inside a generated <app>-specs/ repo ("reverse engineer the spec for X", "dựng lại spec từ code", "document this existing feature").
---

# reverse-spec — dựng lại spec từ code

Bạn khôi phục spec của một capability **đã chạy trên production** nhưng **không còn ticket/spec nào sống sót** — code
cũ, ticket thất lạc, không ai nhớ requirement. Việc của bạn: **đọc code, suy ra spec, tự viết trọn bộ**, để người dùng
chỉ phải **xác nhận kết quả cuối** — không đồng-tác-giả.

Tương phản với `new-spec` (spec-first: người dùng biết requirement, chưa có code): đây là **code-first** — code là sự
thật duy nhất, requirement phải được tái dựng từ nó. Vì vậy `meta.yml` mang `origin: reverse-engineered`.

`reverse-spec` là **một trong HAI** writer được phép ghi vào `specs/features/` (constitution §3): nó ghi feature **trực
tiếp** (`origin: reverse-engineered`), vì nó tài liệu hoá **thực tế**, không phải một thay đổi đề xuất. Writer còn lại
là `archive` (fold khi một change ship). **Không bao giờ hand-create folder feature** ngoài hai đường này.

**Trước tiên: nạp rule đang hiệu lực.** Đọc `rules/spec.md`, `rules/acceptance.md`, `rules/tech.md`, và
`constitution.md` trong repo này, rồi author mọi file **theo đúng** chúng (chỉ fallback bản bundle trong skill nếu repo
không có). Sinh nội dung bằng ngôn ngữ ở `spec.config.json.language`.

## Nguyên tắc vận hành (đọc trước, áp cho mọi step)

1. **Một hạt giống, rồi chạy tới hết.** Hỏi tối thiểu để neo được điểm bắt đầu (Step 1), sau đó tự làm **mọi** chỉnh
   sửa cho tới bản draft đã validate. **Không** dừng hỏi giữa chừng. Các quyết định bình thường phải hỏi (mới-vs-refresh,
   domain, slug) → **tự quyết rồi báo cáo** trong summary cuối để người dùng override.
2. **Concrete tới từng ngõ ngách — viết như dạy business cho một người mới.** Đây là quality bar cao nhất của skill
   này. Cái gì **code nói ra được** thì phải **liệt kê tường minh**, KHÔNG viết mơ hồ. "Nhóm free gồm ví dụ các gói
   dùng thử/phát triển" là **SAI** — phải là "Nhóm free gồm đúng: Development, Trial, Plus Trial, Inactive, Paused,
   Staff Business, Other, Shop Component, Shopify Finance". Mọi danh sách (gói, segment, feature, trạng thái, message
   lỗi), mọi con số (ngày, %, giá, ngưỡng, giới hạn), mọi nhánh điều kiện code rẽ — **enumerate hết**, đừng "v.v.",
   đừng "ví dụ", đừng "và các thứ tương tự". Một người chưa từng thấy code phải hiểu **chính xác** hệ thống làm gì chỉ
   từ `spec.md`. Nếu code không nói ra được → đó là suy đoán (tag + Open question), không phải cái cớ để viết chung
   chung. Chi tiết: `steps/07-author.md`; step 8 sẽ đi săn mọi chỗ mơ hồ còn sót.
3. **Neo mọi khẳng định vào code — trong `tech.md`, KHÔNG trong `spec.md`.** Mỗi mệnh đề hành vi phải truy được về
   `<repo>:path:line` hoặc một symbol, ghi ở **bảng traceability** cuối `tech.md`. `spec.md` giữ **thuần ngôn ngữ
   nghiệp vụ** (rule `rules/spec.md`) — support đọc được. Code không chứng minh được → **suy đoán**: gắn tag, đẩy
   xuống *Open questions*.
4. **Tách "code làm gì" khỏi "vì sao" (intent).** Bạn đọc *cái gì* đáng tin; *vì sao* là phỏng đoán. Đoán được, nhưng
   phải gắn nhãn và hạ `confidence`. **Doc còn sót thắng phỏng đoán** — nhưng chỉ lấy doc từ **đúng nguồn user chỉ
   định** (`steps/02-doc-hunt.md`), cross-check ở `steps/03-locate-and-map.md`.
5. **Một capability là HỢP của MỌI entry point, không phải một call tree.** Feature nặng vòng đời (billing, sync)
   thường có 5–10 entry point rời nhau: route, webhook, cron, event phát ra, script support. Trace từ một seed anchor
   duy nhất SẼ bỏ sót phần lớn — liệt kê trọn event surface **trên MỌI repo trong `spec.config.json.repos`** (đừng bỏ
   sót lớp storefront/client) trước khi viết.
6. **Đọc `constitution.md` trước:** §1 (một capability = một folder), §2 (Feature ID `[DOMAIN]-<slug>`, không nhét
   ticket key), §3 (features/ chỉ hai writer), §6 (spec reverse-engineered bắt đầu ở `live`), §7 (quality bar
   `spec.md`).

## Workflow

Chạy các step theo thứ tự. **Nạp file step khi tới step đó — đừng đọc hết một lượt lên đầu** (tiết kiệm context).

| Step | File | Cho ra |
|---|---|---|
| 1. Gieo hạt (anchor + nguồn doc) | `steps/01-seed.md` | Anchor để bắt đầu tìm + **danh sách nguồn tài liệu do user chỉ định** (hoặc "không có") |
| 2. Doc-hunt (discovery-only) | `steps/02-doc-hunt.md` | Danh sách doc đã gom & chuẩn hoá — **chỉ trong nguồn user cho phép** |
| 3. Định vị & map + đối chiếu doc | `steps/03-locate-and-map.md` | Bảng coverage (mọi entry point → spec section) + footprint `related_code` + phân loại claim của doc |
| 4. Domain & target | `steps/04-domain-and-target.md` | DOMAIN + quyết mới-vs-refresh + slug |
| 5. Scaffold | `steps/05-scaffold.md` | Folder feature + `meta.yml` set fact reverse-eng |
| 6. Khôi phục UI/Design | `steps/06-ui.md` | Mô tả UI/state trong `## UI / Design` |
| 7. Author trọn spec | `steps/07-author.md` | `spec.md` + `acceptance.md` + `tech.md` đầy đủ, concrete |
| 8. Validate | `steps/08-validate.md` | `index` + `check` PASS |
| 9. Tự phản biện đối kháng | `steps/09-self-challenge.md` | Open questions + `confidence` đã hiệu chỉnh; **mọi chỗ mơ hồ đã bị săn** |
| 10. Hand-off | `steps/10-handoff.md` | Walkthrough phi kỹ thuật trong chat để user validate |

## Ranh giới nguồn tài liệu (doc-hunt) — QUAN TRỌNG

Doc bổ trợ (PRD/FAQ/dev-note) **chỉ được lấy từ đúng chỗ user chỉ định lúc gọi reverse-spec**. Nếu user nói "tài liệu
để ở `abc`" thì **chỉ** tìm trong `abc`. **Cấm** tự rà workspace cha, repo anh em, folder khác, hay glob lung tung để
"tìm thêm". User không chỉ nguồn nào → doc-hunt trả rỗng (hỏi ngắn 1 lần nếu cần, xem `steps/02-doc-hunt.md`). Đây là
ranh giới cứng — khác với việc **quét code** (quét trên các repo trong `spec.config.json.repos`, đó là đối tượng
reverse-engineer, hợp lệ).

## Working directory

Bảng coverage (Step 3) là artifact làm việc chính — giữ nó (scratchpad) tới khi hand-off, vì Step 7/9 tiêu thụ nó.
Chỉ các file trong `specs/features/<ID>/` là output thật đổ vào repo.

## Rule ownership (sửa ở đây, không nơi khác)

| Muốn đổi… | Sửa |
|---|---|
| Ranh giới nguồn doc / cách gom doc | `steps/02-doc-hunt.md` |
| Cách quét code / bảng coverage / event surface | `steps/03-locate-and-map.md` |
| Chuẩn "viết concrete, hết mơ hồ" khi author | `steps/07-author.md` |
| Danh sách check phản biện cuối | `steps/09-self-challenge.md` |
| Chuẩn nội dung `spec.md`/`acceptance.md`/`tech.md` | `rules/*.md` **trong repo sinh ra** (không phải ở đây) |
