# Step 7 — Author trọn spec từ code (phần nặng nhất)

Viết **đầy đủ** mọi file (người dùng chỉ sửa, không đồng-tác-giả), mỗi file theo rule của nó. **Đọc rule trong repo
(`rules/spec.md`, `rules/acceptance.md`, `rules/tech.md`) trước khi viết file tương ứng.**

## Chuẩn concrete — luật số 1 khi viết (đọc trước tiên)

Viết như đang **đưa hướng dẫn business cho một người mới hoàn toàn**: đọc xong họ hiểu **chính xác** hệ thống làm gì,
không phải hiểu đại khái. Cụ thể:

- **Enumerate, đừng ví dụ.** Cái gì code liệt kê ra được thì spec phải liệt kê **đủ**. Cấm các cụm: "ví dụ…", "như là…",
  "v.v.", "và các thứ tương tự", "một số…". 
  - ❌ SAI: "gói Shopify miễn phí (nhóm free: ví dụ các gói dùng thử / phát triển)".
  - ✅ ĐÚNG: "Nhóm free gồm đúng các gói: Development, Trial, Plus Trial, Inactive, Paused, Staff Business, Other,
    Shop Component, Shopify Finance."
- **Con số là giá trị thật, kèm 1 ví dụ tính cho mỗi công thức.** "một khoảng ân hạn" ❌ → "7 ngày kể từ cuối chu kỳ" ✅.
  Mọi %, giá, ngày, ngưỡng, batch size, giới hạn: ghi số. Công thức: kèm một phép tính có số thật (kể cả ca chạm sàn/
  trần, vd credit cap khiến bill = $0).
- **Mọi nhánh điều kiện code rẽ → một dòng hành vi.** Nếu code `if A / else if B / else C`, spec phải nói rõ cả 3 ca,
  và **điều kiện chính xác** dẫn tới mỗi ca. Không gộp "tuỳ trạng thái".
- **Mọi message người dùng thấy → trích đúng chữ** (lỗi, toast, badge), theo nghĩa nghiệp vụ.
- **Phân khúc/nhóm → định nghĩa một lần, đủ tiêu chí xác định**, rồi đặc tả theo từng phân khúc × sự kiện.
- Nếu một chi tiết **code không nói ra được** (giá trị config sống trong DB, intent) → đó là suy đoán: gắn `*(inferred)*`
  và đẩy thành **Open question**. Không được lấy "không chắc" làm cớ để viết chung chung — phải nói rõ *cái gì* chưa chắc.

Nguồn để concrete chính là các giá trị đã enumerate ở `steps/03-locate-and-map.md` mục 6. Nếu ở đây phát hiện còn chỗ
định viết mơ hồ vì thiếu dữ liệu → **quay lại đọc code lấy giá trị**, đừng viết "ví dụ".

## `spec.md` → theo `rules/spec.md`

Chỉ ngôn ngữ nghiệp vụ, phủ trọn vòng đời, flow theo phân khúc. Nghĩa vụ riêng của reverse-spec chồng lên rule:
- **Tiêu thụ bảng coverage của Step 3.** Mỗi entry point (route, webhook, cron, event phát ra, script support, lớp
  storefront, cột DB sở hữu) và mỗi claim doc phải rơi vào một section spec **theo taxonomy của `rules/spec.md`** — dòng
  còn thừa = lỗ hổng.
- Dùng khối `### Requirement: <tiêu đề ổn định>` → `#### Scenario:` (theo `rules/spec.md`) để delta về sau fold được.
- **Tách 2 mục khác nhau:**
  - **Known limitations & gaps** — defect/lệch **đã xác nhận từ code** (code làm X, rõ ràng X là sai/khác doc). Đây là
    fact, không phải câu hỏi.
  - **Open questions** — thứ **chưa chắc**: suy đoán intent, config không thấy giá trị live, "cố ý hay bug?", mâu thuẫn
    doc-vs-code chưa phân xử được. Mỗi cái một bullet, viết đúng câu hỏi con người cần trả lời.
- Lấy intent từ doc khi có (trích doc); nếu không, gắn `*(inferred)*`.
- **Zero code trong `spec.md`** — không path/symbol/cột/SQL; mọi neo code nằm ở bảng traceability cuối `tech.md`.

## `acceptance.md` → theo `rules/acceptance.md`

3–6 kịch bản rút từ **nhánh và edge case thật thấy trong code** (rỗng/zero, giới hạn, đường bị gate, đường lỗi). Số
trong kịch bản là số thật. Nếu code phủ đủ vòng đời → `acceptance_stage: full`.

## `tech.md` → theo `rules/tech.md` (file giàu nhất)

PHẢI có: Design overview (pattern thật + phân cấp/biến thể, vẽ sơ đồ khi cần); các lớp nối end-to-end (entry → core →
persistence → side effect; nếu app có lớp client/storefront thì tách rõ và nối hai lớp); entry point, call flow, data
model (ghi tên cột — mỗi cột mã hoá một luật), external call & side effect, bản đồ `related_code`, feature flag/config;
và **kết thúc bằng bảng Traceability** đầy đủ. Phân biệt **CERTAIN** (có trong code) vs **INFERRED** — tag `*(inferred)*`.

> **Nếu có sẵn skill `explain-code`, dùng nó để dựng `tech.md`.** Không thuộc toolkit này — **kiểm tra trước, chỉ dùng
> nếu có**. Nó trace code thật bằng CodeGraph, dựng luồng chạy + tư duy kiến trúc và **tách FACT khỏi suy luận**. Cách
> dùng: đưa nó footprint `related_code` + bảng coverage của Step 3 làm phạm vi, rồi **map kết quả vào cấu trúc
> `rules/tech.md`** (phải kết bằng bảng Traceability). **Không có skill này → tự viết theo `rules/tech.md`.**
