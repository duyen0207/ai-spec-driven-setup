---
name: fold-change
description: Fold a shipped change into its target feature(s) — deterministically apply the change's ADDED/MODIFIED/REMOVED requirements to the feature spec (or CREATE the feature for a type-Add change), prepend a history line, drop the pending pointer, and archive the change. Use inside a generated <app>-specs/ repo when a change has merged/shipped ("fold the change", "archive change X", "the change shipped", "co-evolve the spec" / "change đã ship, fold vào feature", "gấp change vào spec", "archive change").
---

# fold-change — gấp một change đã SHIP vào feature của nó

Khi một change **ship** (code của nó đã merge lên production), bạn gấp ("fold") nó vào nguồn-sự-thật —
`specs/features/`. Việc của bạn **không phải** viết lại spec: bạn xác nhận change đã thật sự ship, chạy đúng một lệnh,
rồi verify + báo cáo. Ngôn ngữ mọi nội dung sinh ra theo `spec.config.json.language`.

Ba nguyên tắc vận hành, đọc trước khi làm bất cứ bước nào:

1. **Spec dịch khi hiện thực dịch — không dịch trước.** `features/<ID>/spec.md` luôn phải đáng tin là "đang chạy gì
   trên production". Nó chỉ tiến sang trạng thái mới **khi change đã ship**, không phải lúc change được mở. Trước khi
   ship, thay đổi sống trong `specs/changes/` và feature chỉ mang con trỏ `pending_changes` ("live, có delta bay tới").
2. **Fold là DETERMINISTIC — KHÔNG có AI merge.** Engine khớp các requirement trong delta vào `## Requirements` của
   feature theo **exact title** (add / replace-by-title / remove-by-title), hoặc **tạo mới** feature cho `type: Add`.
   Bạn không tự tay biên tập, không tự "hoà giải" hai đoạn text. Nếu title không khớp, lệnh **dừng và báo lỗi** — đó là
   tính năng, không phải bug (constitution §5: fold cơ học theo exact title).
3. **`features/` là bản ghi "what's live".** Nó có đúng **hai** writer (constitution §3): `reverse-spec` (dựng từ code
   legacy) và **`archive`/fold** (một change ship). Đừng bao giờ hand-create feature folder. Fold là writer thứ hai đó.

Đây là chiều **cuối** của vòng đời một change — chiều đầu (`new-spec` viết delta) và chiều fold (skill này) khép kín:

```
new-spec → specs/changes/<Type>-<CODE>-<brief>/   (delta; feature mang con trỏ pending_changes, spec.md CHƯA đụng)
   │  … change được sửa, review, code, MERGE lên production …
   ▼
fold-change (bạn ở đây) → node tools/specs.mjs archive <change>
   │  Add   → TẠO features/<ID>/            (origin: folded)
   │  M/R/F → PATCH features/<ID>/spec.md   (khớp requirement theo exact title) + fold acceptance + history + gỡ pending_changes
   ▼
specs/changes/archive/<date>-<name>/               (change đã dùng xong, lưu trữ; spec.md giờ = trạng thái mới)
```


## Step 1 — Xác nhận change đã THẬT SỰ ship

Chỉ fold cái đã **có trên production**. Kiểm tra code của change đã merge (đúng tinh thần "spec dịch khi hiện thực
dịch"). Ba tình huống:

- **Đã ship (code merged production)** → đi tiếp Step 2.
- **Chưa ship** → **DỪNG.** Change vẫn "in-flight"; để nguyên trong `specs/changes/`, `features/` vẫn là bản ghi
  "what's live" đáng tin. Đừng fold sớm — fold một thứ chưa chạy sẽ làm bẩn nguồn-sự-thật bằng một tương lai chưa có
  thật.
- **Bị huỷ / đổi scope** → **chỉ xoá thư mục change** (`specs/changes/<Type>-<CODE>-<brief>/`). Nguồn-sự-thật chưa từng
  bị đụng (constitution §4: change chỉ SAFE vì nó fold khi ship; huỷ thì bỏ đi là xong), nên không cần dọn dẹp gì thêm.

Nếu không chắc change đã ship hay chưa, hỏi lại người dùng — đừng đoán.

## Step 2 — Fold

```bash
node tools/specs.mjs archive <change-folder-name>
```

Lệnh này chạy **theo từng target** trong `depends_on` của change, dựa trên `type` của nó:

- **`type: Add`** → **TẠO** `specs/features/<ID>/` từ block `## <ID>` (promote H3 → H2). Feature mới có
  `origin: folded`, `status` = trạng thái "shipped" (mặc định `live` nếu config có), `acceptance.md` lấy từ change,
  và dòng `history` đầu tiên "folded from change (created)". (Add mà feature đã tồn tại → lệnh báo lỗi, dùng Modify.)
- **`type: Modify | Remove | Fix`** → **patch** `## Requirements` của feature: khớp `#### Requirement: <title>` theo
  **exact title** rồi *add* (title mới) / *replace* (title trùng) / *remove* (title trong `### REMOVED`). Rồi:
  - **fold acceptance mới/đổi** vào cuối `acceptance.md` của feature, có provenance `## From <task> (<date>)`;
  - **prepend một dòng `history`** (`<date> · <task_code> · <title change>`, mới nhất trên đầu);
  - **gỡ con trỏ `pending_changes`** trỏ tới task này;
  - **hạ `acceptance_stage` xuống mức non nhất** giữa feature và change (theo thứ tự `spec.config.json.acceptance_stages`
    — một feature chỉ trưởng thành bằng phần non nhất của nó); bump `updated`; giữ nguyên `status` shipped.
  - (Modify/Remove/Fix mà feature chưa tồn tại → lệnh báo lỗi, dùng Add để tạo trước.)

Sau khi fold xong mọi target, lệnh **chuyển change** sang `specs/changes/archive/<date>-<name>/` và đánh dấu
`status: archived`. Đừng đổi tên lệnh hay flag — luồng này là cơ học và config-driven, không hardcode app/domain.

**Ví dụ MODIFIED (để thấy "khớp exact title" nghĩa là gì).** Feature live có `### Requirement: Grace period after
cancel`. Change mang block:

```md
## BILLING-subscription
### MODIFIED Requirements
#### Requirement: Grace period after cancel
… (đoạn "After": 14 ngày kể từ cuối chu kỳ, kèm 1 ví dụ tính) …
```

Vì title **trùng khít**, engine thay đúng requirement đó tại chỗ (replace-by-title) — không đẻ bản thứ hai. Muốn **đổi
tên** một requirement thì đó là REMOVE title cũ + ADD title mới, **không** phải sửa chữ trong title (constitution §5).
Title lệch một ký tự = engine coi là requirement khác → hoặc thêm nhầm bản mới, hoặc báo lỗi không tìm thấy để remove.

## Step 3 — Verify & báo cáo

```bash
node tools/specs.mjs index && node tools/specs.mjs check
```

Cả hai **phải pass**. Rồi làm ba việc trước khi báo:

- **Đọc lại `spec.md` của feature vừa fold như "current state".** Nó phải đọc trôi chảy như hành vi hiện tại: không
  còn text "before" thừa sót lại, title requirement nhất quán (một MODIFIED thay đúng một requirement cùng title, không
  đẻ ra bản trùng). Nếu thấy dấu vết delta lộ ra (đoạn cũ chưa bị thay, hai requirement gần trùng), gần như chắc chắn
  title trong change **không khớp** title live — sửa title trong change rồi fold lại, **đừng** tự tay biên tập feature
  spec (giữ nguyên tính deterministic).
- **Xử lý mọi WARNING của `check`.** Điển hình: "status shipped nhưng `acceptance_stage` vẫn `happy`" → nhắc owner
  (role QA/tester trong `spec.config.json.roles`) hoàn thiện **full acceptance** cho capability đã ship, rồi bump
  `acceptance_stage: full`. Warning không chặn fold nhưng là việc còn nợ — nêu rõ trong report.
- **Report cho user** (trong chat, ngắn gọn): (1) **feature nào dịch chuyển** — ID + Add tạo mới hay Modify/Remove/Fix
  patch; (2) **dòng history mới** vừa prepend; (3) **đường dẫn change đã archive** (`specs/changes/archive/<date>-<name>/`);
  (4) mọi warning còn tồn (vd acceptance_stage cần lên full).

> **Note (MVP):** hiện fold từ **"intent"** của change — tức đoạn text "After" trong delta của change, **không phải**
> từ diff code merge thật. Fold từ code merge thật (co-evolve đúng nghĩa) là phase sau. Vì vậy trước khi chạy `archive`,
> đảm bảo text "After" của change **khớp đúng cái đã ship thật** trên production — nếu dev đổi hành vi giữa chừng so với
> spec đề xuất, sửa "After" của change cho khớp code trước, rồi mới fold. Fold một intent lệch với hiện thực sẽ đẩy một
> spec sai vào nguồn-sự-thật.
