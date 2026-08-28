---
name: new-spec
description: Capture a requirement as a change — the single entry for authoring work. Scans the repo, decides whether it is a brand-new capability (type Add) or a change to an existing one (type Modify/Remove/Fix), and writes a change folder either way; the change folds into features/ only when it ships. Use inside a generated <app>-specs/ repo ("write a spec for X", "add a feature", "change how Y works", "ghi spec", "tạo change", "thêm feature", "đổi cách Y hoạt động").
---

# new-spec — biến một yêu cầu thành một "change"

Đây là **cổng vào DUY NHẤT** để author. Người dùng chỉ cần mô tả cái họ muốn; **họ KHÔNG cần biết capability đó đã tồn
tại hay chưa** — việc phán đoán đó là của bạn. Trong mô hình đồng nhất của toolkit, **MỌI** việc mới đều trở thành một
**change** dưới `specs/changes/`; `features/` chỉ được ghi khi một change **ship** (fold) hoặc do `reverse-spec`
(constitution §3, §4). Vì vậy ở đây bạn **không bao giờ** tự tay tạo folder feature — kể cả với capability hoàn toàn mới.

## Nguyên tắc vận hành

1. **Single entry — người dùng không cần biết trước.** Họ tả yêu cầu bằng ngôn ngữ thường; bạn scan repo, tự quyết định
   đây là capability mới (`type: Add`) hay thay đổi một capability đã có (`type: Modify/Remove/Fix`), rồi route đúng.
   Đừng bắt người dùng chọn giữa các luồng.
2. **Mọi thứ đều là change; feature chỉ sinh khi ship.** Cả Add lẫn Modify/Remove/Fix đều ra một folder change. Feature
   folder chỉ xuất hiện khi change được fold lúc ship (skill `fold-change`) — không phải bây giờ.
3. **`features/` là "cái gì đang / đã chạy production", luôn đáng tin.** Không viết lại `spec.md` của feature khi mở
   change; nó chỉ tiến lên khi change ship. Change là "đang bay".
4. **Rào Out-of-scope không bao giờ để trống.** Đó chính là thứ chặn coding AI đi re-implement cả feature. Đây là đòn bẩy
   đúng — quan trọng hơn việc viết spec ngắn hay dài (`rules/change.md` §2).
5. **Spec-first: chốt mọi câu hỏi ngay trong chat.** Người yêu cầu đang ở đây → giải quyết mọi open-question qua
   `AskUserQuestion`, gấp thành luật cứng trong change; change giao đi không được chứa điều chưa biết.

**Trước tiên: nạp rule đang hiệu lực.** Đọc `rules/spec.md`, `rules/acceptance.md`, `rules/change.md`, và
`constitution.md` trong repo này, rồi author theo đúng chúng. Viết nội dung sinh ra bằng `spec.config.json.language`.

## Bước 1 — Thu thập (một `AskUserQuestion`, rồi free-text)

Gọi **một** `AskUserQuestion` (kiểu popup) hỏi:

- **Domain** — options lấy từ `spec.config.json.domains` (KHÔNG hardcode danh sách domain), cộng thêm một option
  **"domain mới"** (người dùng gõ tên qua *Other*). Đặt domain khả dĩ nhất lên đầu.
- **Ticket** — `Dán link ticket` (gõ link đầy đủ qua *Other*) · `Chưa có ticket`.
- **Design** — `Dán link design` (Figma/URL qua *Other*) · `Chưa có design`.

Sau đó, dưới dạng **free text** (không phải AskUserQuestion — đây là đoạn mô tả dài):

> *"Mô tả thay đổi — (các) usecase, actor, trigger, các bước, kết quả, business rule, edge case, và những gì nó
> KHÔNG được đụng tới. Dán kèm tài liệu nếu có."*

Chờ họ trả lời xong mới đi tiếp.

## Bước 2 — Scan repo & định tuyến (quyết định TRƯỚC khi scaffold)

Scan **chỉ specs** (KHÔNG scan code): liệt kê `specs/features/<DOMAIN>-*`, đọc `title` trong `meta.yml` + phần đầu
`spec.md` của mỗi feature khả dĩ, và lướt các change đang mở trong `specs/changes/`. Phán đoán, rồi **CONFIRM với người
dùng** bằng `AskUserQuestion` — đây là **lưới an toàn** cho người dùng không biết thứ đó đã tồn tại:

- **Capability hoàn toàn mới** → `type: Add`. Chọn feature ID mới `[DOMAIN]-<slug>` (slug rút từ từ vựng code khả dĩ —
  module/route/hàm — để `related_code` và code search khớp nhau). Block `spec.md` của change sẽ chứa **spec đầy đủ**
  viết ở mức H3 (khi fold sẽ được nâng lên H2 và tạo feature).
- **Thay đổi một capability đã có** → `type: Modify` (hoặc `Remove`/`Fix`). Target đúng feature ID đó. Block chứa
  **delta** (`### ADDED/MODIFIED/REMOVED Requirements`, mỗi cái có `#### Requirement: <title>` **khớp** đúng title live).

Nêu trong một dòng *vì sao* bạn nghĩ nó khớp (dùng title của feature đang có) để người dùng tự phán. Options gồm
`Cập nhật <ID> — "<title>"` cho từng match gần (khả dĩ nhất trước) **cộng** `Đây là capability MỚI`.

**Không bao giờ** mở folder thứ hai cho một capability đã tồn tại — route sang một Modify change.

## Bước 3 — Scaffold change (đúng lệnh)

```bash
node tools/specs.mjs change --task <CODE|NOTICKET> --type <Add|Modify|Remove|Fix> --brief <slug> --target <FEATURE-ID> --title "…"
```

Folder = `specs/changes/<Type>-<CODE>-<brief>/` (không có timestamp; ngày chỉ được đóng dấu khi archive). Với capability
mới, `<FEATURE-ID>` là ID mới bạn vừa chọn ở Bước 2 — lệnh này **không** tạo feature folder, chỉ tạo change trỏ tới ID đó.

- `--task`: mã ticket (vd `OPCS-142`) nếu có; nếu người dùng chưa có ticket thì dùng `NOTICKET`.
- `--brief`: slug kebab ngắn tóm tắt việc (vd `bulk-import`, `fix-expiry-timer`).
- `--target`: ID feature đích. Nhiều target cách nhau bằng dấu phẩy (`<ID>,<ID>`) nếu change đụng nhiều capability.

> ⚠️ Dùng **đúng** lệnh `change` này. KHÔNG dùng `work-order`, KHÔNG dùng `new` — toolkit không có các lệnh đó; mọi việc
> mới (Add lẫn Modify/Remove/Fix) đều đi qua `specs.mjs change`.

## Bước 4 — Author change (theo `rules/change.md`)

**Hai loại change — MỘT format.** "Full vs delta" không phải hai định dạng khác nhau, mà là cùng một format: một Add chỉ
tình cờ là *all-ADDED*. Cả hai đều dùng block `## <FEATURE-ID>`, cùng cấu trúc requirement (`#### Requirement:` +
`#### Scenario:`) và cùng chuẩn chất lượng của `rules/spec.md` cho phần "After" (constitution §5). Khác biệt chỉ ở heading
level: Add viết sâu một cấp (H3) vì khi fold sẽ được nâng thành spec feature (H2); delta neo theo title live.

Điền change vừa scaffold, viết "After" đạt chuẩn của `rules/spec.md` (ngôn ngữ nghiệp vụ — không path/symbol/số dòng; số
chính xác + 1 ví dụ tính cho mỗi công thức; phủ vòng đời cho những gì change đưa vào, không chỉ happy path):

- **Block `## <FEATURE-ID>`** — một block cho mỗi target trong `depends_on`:
  - **Add:** spec **đầy đủ** ở mức H3 (`### Problem / context`, `### Requirements` với `#### Requirement: <title>`,
    `### Business rules`, `### Use cases`, …). Đây là all-ADDED.
  - **Modify/Remove/Fix:** **chỉ delta** — `### ADDED / MODIFIED / REMOVED Requirements`, mỗi cái chứa
    `#### Requirement: <title>` với title **khớp chính xác** requirement đang sống trong feature (fold match theo title).
- **In scope** — danh sách **đầy đủ** những gì task này giao. Không nằm trong danh sách = không thuộc task.
- **Out of scope — KHÔNG được sửa** — cái rào (§2 của `rules/change.md`). **Không bao giờ để trống**: liệt kê các flow
  cũ, styling, feature kề bên mà AI phải để yên. Đây là thứ chặn AI re-implement feature.
- **Code anchors** — copy các dòng `repo:path` liên quan từ **bảng traceability của `tech.md`** thuộc target feature
  (áp dụng cho Modify/Fix). Với Add chưa có feature nên chưa có anchor — ghi rõ là dự kiến/suy đoán.
- **acceptance.md** — chỉ các tiêu chí **mới/đổi** (theo `rules/acceptance.md`): stub ngắn 2–4 kịch bản hiển nhiên +
  checklist rút từ spec, đánh dấu `<!-- DRAFT: tester to refine -->`. Set `acceptance_stage: happy` khi còn đang build.
- Giữ nguyên khối **Notes for the coding AI** (thay đổi nhỏ nhất, không refactor code không đụng tới).

## Bước 5 — Với Modify/Remove/Fix: đánh dấu feature live (KHÔNG sửa `spec.md` của nó)

Thêm một con trỏ vào `meta.yml` của target feature để người đọc thấy "đang live, có change bay tới" — và **không đổi gì
khác**:

```yaml
pending_changes:
  - "<CODE> · changes/<Type>-<CODE>-<brief> · <tóm tắt một dòng>"
```

Feature `spec.md` chỉ fold-forward khi change **archive** (skill `fold-change`), đọc code đã ship + change làm intent.
Cố ý giữ vậy: viết lại spec live sang tương lai ngay lúc mở task sẽ (a) mất tài liệu "đang chạy gì", (b) làm bẩn
nguồn-sự-thật nếu task bị huỷ/đổi scope, (c) hai task song song giành một file. Với một **Add** thì **chưa có feature** —
không có gì để đánh dấu.

## Bước 6 — Phản biện, chốt open-question trong chat, rồi validate + hand-off

Phản biện như một reviewer sắc bén — chạy checklist vòng đời trong `rules/spec.md` §2 lên bản nháp: sự kiện thiếu
(rỗng/zero, giới hạn/max, concurrency, gating theo gói/quyền, mobile, i18n, lỗi), requirement mâu thuẫn, và rủi ro scope
(thứ trông như in-scope nhưng có lẽ không nên).

Rồi **RESOLVE**, không park unknown vào change:

1. Hỏi mọi quyết định mức-requirement trong chat qua `AskUserQuestion` (popup, ≤4 câu/lần, mỗi câu có option cụ thể và
   một default khuyến nghị đứng đầu — ghi `… (Khuyến nghị)`). Lặp theo vòng tới khi không còn gì chặn.
2. Gấp mỗi câu trả lời vào change **thành luật cứng** (Requirement / Business rule / Out of scope), viết dạng đã-chốt,
   không phải câu hỏi.
3. Chi tiết external là **con trỏ, không phải open question** — "danh sách cột do `<template>` định nghĩa", "spacing theo
   design" → ghi như đã chốt, kèm nguồn.

Sau đó validate:

```bash
node tools/specs.mjs index && node tools/specs.mjs check
```

Cả hai phải pass (change không xuất hiện trong index của features, và `spec.md` feature không đổi — đều đúng như mong đợi).

**Hand-off (trong chat):**
1. **Loại change** (Add / Modify / Remove / Fix) + target feature ID (và với Modify/Remove/Fix: đã thêm con trỏ
   `pending_changes`).
2. **Task này giao gì** — danh sách In-scope, một dòng.
3. **Đường dẫn folder change** — `specs/changes/<Type>-<CODE>-<brief>/`. Nói rõ: *"đưa THƯ MỤC CHANGE này cho coding AI,
   KHÔNG đưa cả feature spec — để nó chỉ build đúng delta."*
4. **Cái rào** — một hai thứ AI tuyệt đối không được đụng.
5. **Khi nào spec tiến:** *không phải bây giờ.* Change **fold vào feature khi nó ship** (`fold-change`) — với Add thì tạo
   feature mới, với Modify/Remove/Fix thì patch feature theo delta. Tới lúc đó `features/` vẫn là bản ghi "đang chạy gì".

Change là artifact dùng-xong-bỏ; bản ghi bền vững là feature `spec.md` đã fold + dòng `history` mà `fold-change` prepend.
Nếu task bị huỷ, chỉ cần xoá folder change — nguồn-sự-thật chưa hề bị đụng.
