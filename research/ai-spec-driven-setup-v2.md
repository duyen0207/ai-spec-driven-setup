# ai-spec-driven-setup — Research v2: phản biện v1 & phương án cho mô hình "toolkit đa-app"

> Bản này **bàn bạc, không chốt**. Nó phản biện [ai-spec-driven-setup.md](ai-spec-driven-setup.md) (gọi tắt **v1**),
> đối chiếu với yêu cầu mới của bạn, và đề xuất một kiến trúc. Chỗ nào tôi **không đồng ý** với v1 hoặc với chính ý
> tưởng mới, tôi nói thẳng và kèm lý do. Cuối bài có bảng **quyết định cần bạn chốt**.
> Ngày: 2026-08-18. Nguồn tham chiếu: repo `optis-specs` (đọc trực tiếp), v1, OpenSpec (qua v1).

---

## 0. TL;DR — 8 điểm mấu chốt

1. **Giả định lõi của v1 đã sai với nhu cầu mới.** v1 = "drop-in, bake, rồi xoá". Bạn muốn "clone 1 lần, giữ lại,
   sinh spec cho nhiều app". Đây là **generator/CLI thường trú**, không phải scaffold dùng-một-lần. Phải đổi từ gốc.
2. **Xuất hiện 3 tầng, không phải 2.** v1 có 2 artifact (pack + output). Mô hình mới có **3**: `toolkit` (thường trú) →
   `template` (khuôn có thể chọn) → `<app>-specs` (output từng app). Coupling và versioning nằm ở ranh giới giữa 3 tầng này.
3. **Skills vs Commands: đồng ý chuyển sang Skills** (Agent Skills Open Standard) — nhưng phải giải bài toán "rules
   dùng chung". Kết luận đề xuất: **rules thuộc về TEMPLATE, không thuộc về skill**. Skill là orchestrator generic;
   nó **đọc rule của template đang active** lúc chạy. Đây là cách áp dụng đúng nguyên lý "single source of variability".
4. **Changes top-level (first-class) vs per-feature:** bạn muốn `changes/` là folder top-level, mỗi change 1 task có
   `spec+acceptance+meta`. v1 chọn per-feature. **Tôi nghiêng theo bạn** (hợp thực tế "1 task đụng nhiều feature"),
   **nhưng chỉ AN TOÀN nếu bắt buộc có bước `archive`/fold + delta phân theo feature + folder `archive/`.** Không có
   fold thì `changes/` lặng lẽ trở thành nguồn-sự-thật thứ hai — đúng thứ optis sinh ra để tránh.
5. **`acceptance: happy|full` là ý hay** — giữ, nhưng tinh chỉnh: đặt tên rõ, cho `check` cảnh báo khi `live` mà vẫn
   `happy`, và tách khỏi trục `status`.
6. **Change có `spec.md` riêng là con dao hai lưỡi.** Nếu change-spec viết như spec đầy đủ → tái sinh đúng lỗi "AI
   nạp cả feature rồi re-implement". Phải giữ change-spec ở **dạng delta** (ADDED/MODIFIED/REMOVED + hàng rào
   Out-of-scope), đúng thứ v1 đã mượn từ OpenSpec. May mắn: hai ý này **ghép khít nhau**.
7. **Engine dùng chung vs tools/ per-template:** đừng copy `specs.mjs` vào mỗi template (bug fix phải sửa N chỗ).
   Engine generic (`new/index/check/archive`) sống ở toolkit-core, **bake** vào output; `tools/` của template chỉ
   chứa validator **đặc thù template**.
8. **Cảnh báo phạm vi:** thiết kế đang phình (3 tầng config, đa ngôn ngữ, catalog, per-template tools+rules+skills,
   changes first-class...). Nguyên lý #1 của chính v1 là **"simple first"**. Tôi đề xuất một **MVP cắt gọn** chứng
   minh trọn vòng lặp `generate → new-spec → change → archive → helpdoc` với **1 template, 4 skill**, rồi mới mở rộng.

---

## 1. Điểm dịch chuyển lớn nhất: "bake-rồi-xoá" → "toolkit thường trú"

v1 mô tả usage model (§1): pack được **thả vào folder cha `app-X/`**, chạy `getting-started`, **bake** ra
`<app>-specs/`, và pack *"xong có thể xoá"* — "zero runtime dependency vào pack" (§4.5). Toàn bộ kiến trúc §6 xoay
quanh giả định này.

Yêu cầu mới của bạn phá vỡ giả định đó ở 3 chỗ:

| v1 giả định | Bạn muốn | Hệ quả |
|---|---|---|
| Pack **dùng-một-lần** cho **một** app rồi xoá | Toolkit **thường trú**, dùng cho **nhiều** app | Toolkit cần một chỗ ở cố định + cơ chế cài skill toàn cục |
| 1 repo output là đủ | **Mỗi app 1 spec repo tách riêng** | Bỏ multi-app trong 1 repo (đơn giản hoá tooling); nhưng phát sinh "shared knowledge giữa các app" |
| Không có khái niệm "template" | **Nhiều template chọn được** (default, embed-shopify-app…) | Thêm hẳn một tầng: template registry + catalog + cơ chế pick |

**Đây không phải chỉnh sửa nhỏ — nó đổi bản chất sản phẩm** từ *"một scaffold"* thành *"một generator có vòng đời"*
(giống `create-*`, `cookiecutter`, `openspec` CLI). Mọi phần còn lại của bản này là hệ quả của cú xoay đó.

**Một câu hỏi mà v1 không phải trả lời nhưng mô hình mới BẮT BUỘC trả lời:**
> Sau khi `<app>-specs/` đã sinh ra, việc bảo trì spec hằng ngày (`new-spec`, `reverse-spec`, `spec-to-helpdoc`) chạy
> bằng skill **của toolkit**, hay bằng skill **đã bake vào chính repo đó**?

Đây là **câu hỏi thiết kế trung tâm** (mục 3 & 4 giải nó). Trả lời sai → hoặc là duplicate skill khắp nơi, hoặc là
generated repo phụ thuộc vĩnh viễn vào toolkit.

---

## 2. Phản biện có hệ thống v1 — giữ gì, sửa gì

v1 làm **rất tốt** phần chắt lọc từ optis + OpenSpec. Những thứ này **giữ nguyên**, đừng phát minh lại:

- ✅ **Cơ chế bất biến** (v1 §2): 1 capability = 1 folder; tách *state* (`spec.md`) vs *delta*; ngôn ngữ nghiệp vụ
  neo code ở `tech.md`; `check`/`index` là cổng chất lượng. Đây là "hồn" của optis, đúng và đáng đóng gói.
- ✅ **Mượn structured-delta của OpenSpec** (v1 §3, §7): delta viết `ADDED/MODIFIED/REMOVED Requirements`, spec có
  block `### Requirement:` đánh địa chỉ được → **`archive` fold deterministic, không cần AI**. Đây là điểm **hay nhất**
  của v1 và là mảnh ghép cứu mô hình "changes first-class" của bạn (mục 5).
- ✅ **Single source of variability = `spec.config.json`** (v1 §4.1): fix coupling smell "thêm domain phải sửa 3 chỗ"
  của optis. Giữ, nhưng nâng thành **3 tầng config** (mục 7).
- ✅ **Coupling boundary = `check`** (v1 §4.3): skill thay thế chỉ cần đẻ ra feature pass `check`. Đây là câu trả lời
  đúng cho "custom mạnh mà không vỡ". Giữ và làm rõ thành "customization contract" (mục 9).
- ✅ **Bỏ toàn bộ phần Shopify/BSS** khỏi core (v1 §5). Đúng.

Những thứ **phải sửa vì mô hình mới** (phần còn lại của bài):

| v1 nói | Vì sao phải sửa |
|---|---|
| Pack thả-vào-rồi-xoá, entry point duy nhất là `getting-started` | Toolkit thường trú; `getting-started` chỉ là **1 trong nhiều** skill (mục 3) |
| Skill sống ở `.claude/skills/…`, rule ở `core/claude/rules`, dùng **commands** Claude-only | Bạn muốn **Skills chuẩn mở, portable**; rule phải đổi chỗ (mục 4) |
| Delta **per-feature** `features/<ID>/changes/<TICKET>.md` | Bạn muốn `changes/` **top-level, first-class** (mục 5) |
| `meta.yml` không có khái niệm acceptance-maturity | Bạn thêm `acceptance: happy|full` (mục 6) |
| 1 loại output (generic) | **Nhiều template** chọn qua catalog (mục 7, 8) |
| "Bake rồi biến mất" | Toolkit **được giữ** → phát sinh versioning/propagation (mục 10) + install story (mục 11) |

---

## 3. Kiến trúc 3 tầng đề xuất

```
┌─ TẦNG 1 · TOOLKIT (clone 1 lần, thường trú) ────────────────────────────────┐
│  ai-spec-driven-setup/                                                        │
│    config.yml                 # setting toolkit: ngôn ngữ mặc định, template mặc định
│    skills/                    # skill BOOTSTRAP + skill AUTHORING (nguồn-sự-thật của skill)
│      init-spec-repo/          #   (đổi tên từ getting-started) — sinh 1 spec repo cho 1 app
│      new-spec/  reverse-spec/  fold-change/  spec-to-helpdoc/    # (change gộp vào new-spec — mục 17.3)
│    templates/                 # các khuôn spec-repo chọn được
│      catalog.yml              #   mục lục: name · description · usage · version
│      default/                 #   khuôn general
│      embed-shopify-app/       #   khuôn đặc thù (phase sau)
│    core/                      # engine dùng chung được BAKE vào output
│      tools/specs.mjs          #   config-driven: new | index | check | archive
│      schema/*.schema.json     #   contract structural, KHÔNG hard-code enum
│    docs/                      # customizing.md · skill-contract.md · philosophy/constitution (điền sau)
└──────────────────────────────────────────────────────────────────────────────┘
            │  init-spec-repo: pick template → clone → bake core → infer config
            ▼
┌─ TẦNG 2 · TEMPLATE (1 khuôn = 1 folder, có thể tự thêm) ─────────────────────┐
│  templates/default/                                                            │
│    .claude/                   # command/skill ĐẶC THÙ repo (team tự lắp thêm)  │
│    rules/                     # ★ authoring rules: cách viết spec/acc/tech/change (thuộc TEMPLATE) │
│    skeletons/                 # khung fill-in để engine sinh feature/change mới (research đầu BỎ SÓT) │
│    specs/                     # (D8: src→specs) phần được clone-&-rename thành thân repo    │
│      features/                #   feature mẫu (0–2 seed)                        │
│      changes/                 #   change mẫu (rỗng + 1 ví dụ)                   │
│      AGENTS.md                #   (D9: agent.md→AGENTS.md) mô tả kiến trúc cho AI │
│    tools/                     # validator ĐẶC THÙ template (KHÔNG copy engine)  │
│    spec.config.template.json  # giá trị mặc định cho spec.config.json của output │
└──────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─ TẦNG 3 · OUTPUT <app>-specs/ (team sở hữu) ────────────────────────────────┐
│    spec.config.json           # domains/statuses/roles/language — single source
│    constitution.md            # luật (bake từ core, tham chiếu config)          │
│    AGENTS.md · README.md                                                        │
│    rules/                     # bake từ template — team sửa tự do sau này        │
│    skeletons/                 # bake từ template (khung fill-in cho feature/change)             │
│    schema/ · tools/specs.mjs  # bake từ core (engine dùng chung)                │
│    .claude/skills/            # bake bản PIN của skill authoring (mục 10)        │
│    specs/features/<ID>/{meta.yml,spec.md,acceptance.md,tech.md,[ui.html]}       │
│    specs/changes/<Type>-<TASK>-<brief>/{meta.yml,spec.md,acceptance.md,[tech.md]}│
│    specs/changes/archive/…    # change đã ship & fold (D5: đóng dấu ngày ở đây)  │
│    SPECS_INDEX.md · CHANGES_INDEX.md   # tự sinh                                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

Điểm quan trọng của kiến trúc này (và là chỗ tôi **khác v1**):

- **Skill là nguồn-sự-thật ở toolkit** (Tầng 1). Khi generate, ta **bake một bản PIN** của skill authoring vào
  output (Tầng 3) để repo tự chạy được kể cả khi không mở toolkit — nhưng bản pin có ghi version để về sau
  `update` được (mục 10). Skill bootstrap (`init-spec-repo`) **không** bake (chỉ chạy ở toolkit).
- **Rules thuộc Template** (Tầng 2), không thuộc skill và không thuộc core. Đây là mấu chốt (mục 4).
- **Engine `specs.mjs` sống ở core, bake xuống output.** Template **không** giữ bản copy engine (mục 8).

---

## 4. Skills theo chuẩn mở — và bài toán "rules dùng chung"

### 4.1 Đồng ý bỏ Commands, dùng Skills

optis dùng `.claude/commands/*.md` (Claude slash-command) + `.claude/rules/*.md` (rule mà command **đọc**). Map sang
Agent Skills Open Standard rất tự nhiên:

- 1 command optis → 1 **skill folder** với `SKILL.md` (frontmatter `name` + `description` là tín hiệu routing) +
  các file bước/tham chiếu đi kèm (progressive disclosure).
- Ưu điểm đúng như bạn muốn: **portable** (không khoá vào Claude), người khác nạp vào tool của họ được, và "skill của
  họ lắp vào" chỉ là thả thêm một folder.

### 4.2 Vấn đề khó: rule dùng chung bởi nhiều skill

Trong optis, **3 command dùng chung** `rules/spec.md`, `rules/acceptance.md`, `rules/tech.md`. Triết lý optis:
*"sửa rule một chỗ, mọi command dùng bản mới; KHÔNG inline rule vào command"*. Nhưng Agent Skills chuẩn lại thích
skill **self-contained** (để nhấc một skill ra dùng chỗ khác). **Hai mục tiêu này đá nhau.**

Ba lối đi:

| Cách | Mô tả | Đánh giá |
|---|---|---|
| (a) Duplicate rule vào từng skill | Mỗi skill mang bản copy `spec-rule.md`… | ❌ Vi phạm thẳng triết lý optis (sửa N chỗ) |
| (b) Một skill/reference chung, skill khác trỏ path tương đối | `skills/_shared/rules/…` | ⚠️ DRY nhưng skill hết self-contained |
| (c) **Rule thuộc TEMPLATE; skill đọc rule của template active** | Skill generic, không chứa rule | ✅ Đề xuất |

### 4.3 Vì sao (c) là đúng — không chỉ tiện, mà đúng bản chất

Đọc lại optis `rules/spec.md` và `rules/tech.md`: chúng **không generic**. `rules/tech.md` bắt buộc *"tách in-app
(api+cms) vs storefront (tae)"*, *"nối chặt cms↔api"*, *"khung `ProductSwatch`"* — đây là **luật đặc thù cho một loại
app (embedded Shopify)**, không phải luật vũ trụ. Một `new-spec` generic **không được** hard-code "chia in-app vs
storefront".

→ Kết luận: **cách viết spec/acc/tech/change LÀ một phần của template.** Template `default` có rule generic; template
`embed-shopify-app` có rule đòi tách layer storefront. **Skill chỉ là orchestrator**: nó hỏi, quét, scaffold, rồi
**"đọc `rules/spec.md` của repo đang làm và tuân theo"** — y hệt cách optis command nói *"Read .claude/rules/spec.md
first and author to it"*, nhưng nguồn rule giờ là **repo/template**, không phải bản thân skill.

Lợi ích kép:
- **Single source of variability** áp dụng đúng: đổi cách viết spec = sửa **rule trong template/repo**, không đụng skill.
- **Skill thật sự portable & generic**: cùng một `new-spec` chạy cho mọi template, vì phần "đặc thù" nằm ở rule.
- Đây chính là "Rule = Strategy slot" của v1 (§4.2) — nhưng đặt slot **đúng chỗ** (template/repo), không phải trong core.

> Hệ quả cho SKILL.md: mỗi skill authoring mở đầu bằng bước *"Resolve active rules: đọc `rules/{spec,acceptance,tech,change}.md`
> trong repo hiện tại; nếu không có, fallback về bản generic đi kèm skill"*. Fallback này cho skill vẫn chạy được cả
> khi bị nhấc ra ngoài (thoả tinh thần self-contained), mà bình thường vẫn ưu tiên rule của template.

### 4.4 Taxonomy skill đề xuất (rõ vai trò hơn v1)

| Skill | Tầng | Vai trò | Gốc từ optis |
|---|---|---|---|
| `init-spec-repo` | Toolkit (bootstrap) | Pick template → scaffold `<app>-specs/` → infer `spec.config.json` → seed 1–2 | mới (thay `getting-started`) |
| `reverse-spec` | Bake vào repo | Dựng lại spec từ code (codegraph-first, có fallback grep) | `/reverse-spec` |
| `new-spec` | Bake vào repo | Ghi nhận yêu cầu mới / định tuyến new-vs-change | `/new-spec` |
| `change-spec` | Bake vào repo | 1 task → 1 change folder (delta + hàng rào scope) | `/task-spec` |
| `fold-change` | Bake vào repo | `archive`: fold change đã ship vào feature spec (deterministic) | mới (từ OpenSpec archive) |
| `spec-to-helpdoc` | Bake vào repo | Spec → doc hướng người dùng (format pluggable) | `/spec-to-gitbook` (generic hoá) |

**Phản biện tên `getting-started`:** nghe như trang tài liệu, không như một generator. Đề xuất `init-spec-repo`
(hoặc `new-app`, `scaffold-spec`). Nhỏ nhưng quan trọng cho khám phá skill.

---

## 5. Changes: top-level first-class vs per-feature — và vì sao BẮT BUỘC có fold

Đây là **divergence lớn nhất về cấu trúc** giữa bạn và v1.

- **optis / v1:** delta sống **trong feature** — `features/<ID>/changes/<TICKET>.md`. Work order là **một file**, cố ý
  **không phải feature** (không meta, `check`/`index` bỏ qua), **disposable**, để `spec.md` giữ ngôi nguồn-sự-thật.
- **Bạn muốn:** `changes/` **top-level**, mỗi change = folder task `<ts>-<Type>-<TASK>-<brief>/` có `spec + acceptance`
  (+ optional `tech`) + `meta.yml` với `depends_on: [feature-ids]`, `status`. → change là **first-class, có tracking**.

### 5.1 Cân nhắc thẳng thắn

**Ủng hộ mô hình của bạn:**
- Một task thực tế **hiếm khi map 1:1 với một capability** — nó thường đụng 2–3 feature. Top-level + `depends_on`
  xử lý đa-feature **tự nhiên**; per-feature của optis thì phải xé task ra nhiều folder.
- `changes/` đọc như một **work log theo thời gian** — tên có timestamp sort được, đúng nhu cầu "đang làm gì".
- Trùng khớp mô hình **OpenSpec `changes/<name>/`** (proposal first-class) mà chính v1 đã nghiên cứu và khen.

**Rủi ro (chí mạng nếu bỏ qua):**
- optis biến work order thành *disposable & không-tracked* **có chủ đích** — để không ai đọc `changes/` mà tưởng đó
  là hiện trạng. Bạn cho change có `meta+status+spec` → nó **giống một nguồn-sự-thật**. Nếu không có bước fold, sau 6
  tháng `changes/` tích 200 folder và **feature `spec.md` không còn phản ánh production** — đúng cơn ác mộng optis
  sinh ra để diệt.

### 5.2 Điều kiện để mô hình của bạn AN TOÀN (không thương lượng)

**Adopt top-level changes, nhưng BẮT BUỘC 3 thứ:**

1. **Bước `fold`/`archive` deterministic** (skill `fold-change` + `specs.mjs archive`). Khi change ship → fold delta
   vào feature `spec.md`, prepend `history`, gỡ `pending_changes`, **chuyển change sang `changes/archive/`**. Đây
   **chính là** cơ chế v1 đã mượn từ OpenSpec — nó là mảnh ghép cứu mô hình của bạn, không phải tính năng phụ.
2. **Change-spec viết ở dạng DELTA, phân theo feature** (không phải spec đầy đủ — xem mục 6). Multi-feature change
   thì `spec.md` chia block theo `### <FEATURE-ID>` để fold biết rót phần nào vào đâu.
3. **`changes/archive/`** tách active khỏi đã-ship, để `CHANGES_INDEX` và người đọc phân biệt "đang bay" vs "lịch sử".

Nếu **không** làm được (1), thì **đừng** cho change first-class — quay về per-feature disposable của optis. First-class
mà thiếu fold là cái bẫy.

### 5.3 Cấu trúc change đề xuất

```
changes/Add-OPCS-142-cap-collection-swatches/     # (D5 cách B) không timestamp; archive mới đóng dấu ngày
  meta.yml
  spec.md          # DELTA nếu sửa feature cũ; full-as-ADDED nếu feature mới (mục 17.3)
  acceptance.md    # AC mới/đổi (hoặc full nếu feature mới)
  tech.md          # optional
```

`changes/…/meta.yml`:
```yaml
task_code: OPCS-142
type: Add                 # Add | Modify | Remove | Fix (cảm hứng openspec)
title: Cap collection-card swatches at 5 with a +N overflow chip
status: in-dev            # proposed | in-dev | merged | archived
acceptance_stage: happy   # happy | full  (mục 17.2; trực giao với status)
depends_on:               # feature(s) mà change này fold vào
  - PRODUCT-GROUPS-combined-listing
jira_url: https://…/OPCS-142
created: 2026-08-18
```

**Phản biện về timestamp trong tên folder:** timestamp `<ngày-giờ>` cho work-log tuyệt vời (sort + unique). Nhưng nó
**khoá identity vào thời điểm tạo** — muốn tìm "change của OPCS-142" phải quét. Hai lựa chọn:
- (A) Giữ timestamp (bạn đang muốn) → tốt cho worklog; `task_code` trong meta để tra cứu.
- (B) Bỏ timestamp, tên `<Type>-<TASK>-<brief>`, chỉ **đóng dấu ngày khi archive** (`archive/2026-08-18-…`) — đúng
  cách OpenSpec làm. Sạch hơn, nhưng mất thứ tự thời gian ở folder active.
Tôi nghiêng (A) vì khớp ý bạn, miễn là `task_code` là khoá tra cứu chính thức trong meta + index.

---

## 6. Feature 4-file + `acceptance: happy|full` + change-spec là DELTA

### 6.1 `acceptance: happy|full` — giữ, tinh chỉnh

Ý của bạn: dev **tự test pass happy-case** mới được chuyển tester; giai đoạn đầu tester chỉ viết happy checklist; dev
code xong mới lên full list. **Đây là insight tốt** — nó mã hoá **độ chín của acceptance** thành tín hiệu first-class,
và **gate bàn giao dev→tester**. Tinh chỉnh:

- **Đặt tên rõ:** `acceptance_stage: happy | full` (tránh nhầm `acceptance` = nội dung file). Trục này **trực giao**
  với `status` (status = vòng đời spec; acceptance_stage = độ chín của bộ test).
- **Biến thành cổng chất lượng:** `check` cảnh báo nếu `status ∈ {implemented, live}` mà `acceptance_stage: happy`
  → "đã ship mà acceptance chưa full". Lúc này field không chỉ ghi chú mà **enforce** được → mạnh.
- **Ai sở hữu chuyển trạng thái:** happy (đầu, tester/QA phác) → dev tự-test pass → full (QA hoàn thiện). Ghi rõ ai
  bump, trong `rules/acceptance.md` của template.
- **Ẩn ý về ROLE:** cách bạn nói ("dev tự test rồi chuyển tester") cho thấy role model của bạn là **dev + tester**,
  khác optis (**BA/QA/Techlead**). → Role **phải config-driven** (`spec.config.json.roles`), rule + template không
  được hard-code tên role. v1 §4.1 đã nói roles nằm trong config — giữ và nhấn mạnh.

### 6.2 Change-spec PHẢI là delta, không phải spec đầy đủ (điểm dễ sai nhất)

Bạn cho mỗi change có `spec.md` riêng. **Rủi ro:** nếu người ta viết change-`spec.md` như một spec đầy đủ của
capability, ta tái sinh **đúng** vấn đề optis chống: *"đưa cả spec cho AI → AI re-implement cả feature"*
(PHILOSOPHY §5, rule work-order §4: *"hàng rào Out-of-scope mới là thứ chặn AI làm lố, không phải spec ngắn"*).

**May mắn: ý bạn + mảnh ghép OpenSpec của v1 ghép khít.** Change-`spec.md` nên là **delta** theo đúng format v1 đã chọn:

```md
## PRODUCT-GROUPS-combined-listing        <!-- feature đích; nhiều feature thì nhiều block -->

### Delta (Before → After)
| Aspect | Before (đang live) | After (task này) |
|---|---|---|
| Số swatch trên card | hiện hết | tối đa 5 + chip "+N" |

### MODIFIED Requirements
### Requirement: Collection-card swatch rendering
The system SHALL show at most 5 swatches on a collection card; remaining values collapse into a "+N" chip.
#### Scenario: more than five values
- WHEN a product group has > 5 values
- THEN the card shows the first 5 and a "+N" chip

### In scope
- …
### Out of scope — do NOT modify   ← HÀNG RÀO, không bao giờ để trống
- variant picker, styling, main product page
### Code anchors
- cms:app/components/product-groups/** — …
```

Như vậy change-`spec.md`:
- **là delta** (giữ hàng rào Out-of-scope + Before→After — thứ thật sự chặn AI làm lố),
- **fold deterministic** vào feature `spec.md` qua `archive` (match `### Requirement: <title>`),
- **phân theo feature** nên đa-feature vẫn fold đúng chỗ.

→ **change-`acceptance.md`** tương tự: chỉ AC mới/đổi, fold vào feature `acceptance.md` khi ship.

> Gợi ý đặt tên: cân nhắc gọi file này là `delta.md` thay vì `spec.md` để người viết **không bị dụ** viết spec đầy đủ.
> Nhưng nếu bạn thích symmetry (change và feature cùng bộ tên) thì giữ `spec.md` + ép format delta trong `rules/change.md`.

### 6.3 4 file của feature: lấy từ optis template, chỉnh gì

Giữ 4 file `meta.yml / spec.md / acceptance.md / tech.md` (bake từ `templates/*` của optis). Chỉnh cho generic:
- **`spec.md`**: bỏ mọi thứ Shopify (in-app/storefront, `BSS_SE`); thêm block `## Requirements` với `### Requirement:`
  đánh địa chỉ được (để fold hoạt động) — đây là thay đổi v1 §7 đã nêu.
- **`tech.md`**: bỏ luật "tách api/cms/tae"; giữ **Design overview + Traceability map** (phần generic, giá trị nhất).
  Luật tách-layer chuyển thành **rule của template `embed-shopify-app`**, không nằm ở `default`.
- **`meta.yml`**: thêm `acceptance_stage`; đổi `related_code` pattern từ `^(api|cms|tae):` (hard-code repo Shopify)
  sang **đọc danh sách repo từ `spec.config.json`** (single source — fix coupling smell optis).

---

## 7. Cấu hình: 3 tầng, JSON hay YAML, đa ngôn ngữ

### 7.1 Ba tầng config (không phải một)

| Config | Ở đâu | Ai đọc | Nội dung |
|---|---|---|---|
| **Toolkit** | `ai-spec-driven-setup/config.yml` | skill bootstrap | ngôn ngữ mặc định, template mặc định |
| **Catalog** | `templates/catalog.yml` | skill + người | mỗi template: `name·description·usage·version` |
| **Per-repo** | `<app>-specs/spec.config.json` | `specs.mjs` + mọi skill | domains, statuses, roles, repos, language — **single source** |

`spec.config.json` (per-repo) là cái v1 §4.1 đã đúng — nó là **ranh giới biến thiên**. Ví dụ:
```json
{
  "app": "app-x",
  "language": "vi",
  "template": "default@1.0.0",
  "roles": ["dev", "tester", "ba"],
  "domains": ["CHECKOUT", "CART", "ACCOUNT"],
  "statuses": ["draft","reviewed","ready-for-dev","implemented","live","deprecated"],
  "repos": ["web", "api"]
}
```
`specs.mjs check` đối chiếu enum `domain/status/repo` **với config này** (không hard-code như optis). Thêm domain =
sửa **1 chỗ** (fix trực tiếp coupling smell "sửa 3 chỗ" của optis).

### 7.2 JSON hay YAML — quyết định theo "ai parse"

optis dùng **tiny-YAML-subset parser tự viết** (`parseMeta`, dependency-free) — chỉ đọc được scalar phẳng + list 1
cấp. Config lồng nhau sẽ **vượt** khả năng parser đó.

Đề xuất **theo người đọc**:
- **`spec.config.json` → JSON.** `specs.mjs` (cổng `check`) phải parse **chắc chắn, dependency-free** → `JSON.parse`
  native là an toàn nhất. Mất comment, nhưng đây là file máy.
- **`config.yml` + `catalog.yml` → YAML.** Chủ yếu **người + skill (AI)** đọc, không cần `specs.mjs` parse cứng →
  YAML có comment, dễ chịu hơn, đúng tinh thần "custom dễ dùng".
- **`meta.yml` (feature/change) → giữ tiny-YAML** như optis (scalar + list phẳng là đủ).

> Nếu muốn **đồng nhất một format**, chọn JSON cho tất cả file máy-đọc và chịu mất comment — nhưng tôi thấy **mix
> theo vai trò** phục vụ "custom dễ" tốt hơn. Đây là một quyết định cần bạn chốt (bảng cuối).

### 7.3 Đa ngôn ngữ (vi/en)

Quan sát: optis **rules viết tiếng Việt**, **commands + template + schema tiếng Anh**. Cho mục tiêu "người khác cũng
dùng được", đề xuất:
- **SKILL.md + core viết tiếng Anh** (portable, universal).
- **`config.language` điều khiển NGÔN NGỮ OUTPUT** skill sinh ra (spec/doc tiếng vi hay en).
- **Rules trong template**: cho phép song ngữ — hoặc để mỗi template một biến thể ngôn ngữ, hoặc rule tiếng Anh +
  chỉ thị "viết spec bằng `config.language`". Đơn giản nhất cho MVP: rule tiếng Anh, output theo `config.language`.

---

## 8. Tooling: engine dùng chung vs `tools/` per-template

Bạn muốn **mỗi template có `tools/` mjs** để "xây và đảm bảo kiến trúc". Rủi ro: nếu mỗi template ôm một bản copy
`specs.mjs`, thì **một bug fix phải sửa ở N template + M repo đã sinh**. Đây là coupling smell mới, còn tệ hơn cái
optis mắc.

**Tách đôi rõ ràng:**
- **Engine generic** (`new | index | check | archive`) — **sống một chỗ ở `core/tools/specs.mjs`**, config-driven,
  **bake** vào output lúc generate. Template **không** giữ bản copy. Engine ổn định vì mọi biến thiên đã đẩy vào
  `spec.config.json`.
- **`tools/` của template** = validator **đặc thù template** (vd `embed-shopify-app` có `check-metafield-naming.mjs`).
  Nhỏ, ít, chỉ tồn tại khi template thật sự cần luật riêng. `default` có thể **không có** `tools/` riêng.

Như vậy vẫn đúng ý bạn ("template có thể mang tools riêng") mà **không** duplicate engine.

> Cơ chế bake: `init-spec-repo` copy `core/tools/specs.mjs` + `core/schema/*` vào output, rồi copy `template/tools/*`
> (nếu có) chồng lên. Output tự chạy `node tools/specs.mjs check` không cần toolkit — thoả "self-contained".

---

## 9. Bề mặt customization — "mạnh mà không vỡ"

Đây là chỗ trả lời trực tiếp mong muốn *"tính custom phải mạnh, dễ dùng"*. Nguyên tắc (kế thừa v1 §4.3): **contract
(schema + `check`) là ranh giới coupling ổn định; mọi thứ khác swap được.** 5 bề mặt custom, xếp theo độ khó tăng dần:

| # | Muốn custom | Làm gì | Đụng tới |
|---|---|---|---|
| 1 | **Ngôn ngữ / template mặc định** | sửa `config.yml` | 1 dòng |
| 2 | **Chọn/khởi tạo template khác cho app** | `init-spec-repo` → pick trong `catalog.yml` | 0 code |
| 3 | **Cách viết spec/acc/tech/change** | sửa `rules/*.md` trong template/repo | 1 file rule |
| 4 | **Vocabulary (domains/statuses/roles/repos)** | sửa `spec.config.json` | 1 chỗ (không phải 3 như optis) |
| 5 | **Thêm/thay hẳn một skill** | thả folder skill vào `skills/` hoặc `.claude/skills/` của repo | contract: chỉ cần đẻ ra feature/change **pass `check`** |
| 6 | **Thêm loại app mới hẳn** | tạo template mới + entry trong `catalog.yml` | 1 folder template |

**Ranh giới bất khả xâm phạm = `docs/skill-contract.md`:** một skill thay thế (vd team viết `new-spec` kiểu khác) chỉ
phải cam kết: *output là feature/change pass `specs.mjs check`*. Không couple vào implementation của skill khác → phụ
thuộc thấp nhất. Đây là câu trả lời "custom mạnh" **có kỷ luật**.

**Phản biện chính mình (cảnh báo over-engineering):** 6 bề mặt custom = 6 khái niệm người dùng phải hiểu. Nguyên lý
"simple first" đòi **progressive disclosure**: 90% người dùng chỉ chạm #1–#3 (pick template, đổi ngôn ngữ, sửa rule).
#4–#6 là "power user" — tài liệu hoá nhưng **không bắt buộc**, và **không** phơi ra ở luồng mặc định. Nếu mọi bề mặt
đều nổi bật ngang nhau, "dễ dùng" biến mất.

---

## 10. Propagation / versioning — hệ quả của "giữ toolkit"

v1 né được vấn đề này nhờ "bake rồi xoá". Bạn **giữ** toolkit và **bake skill/engine/rule** xuống nhiều repo → kinh
điển: **output là snapshot, toolkit tiến lên, snapshot cũ dần.** Hai mô hình:

| Mô hình | Cơ chế | Ưu | Nhược |
|---|---|---|---|
| **Snapshot (bake, cắt dây)** | output độc lập hoàn toàn | đơn giản, self-contained, đúng tinh thần optis | fix ở toolkit **không** tự chảy về repo cũ |
| **Linked-but-pinned** | output ghi `template@version`, có skill `update` re-bake/migrate | fix chảy về được | thêm phức tạp, cần migration |

**Đề xuất:** **Phase 1 = Snapshot thuần** (đơn giản, chứng minh vòng lặp). Nhưng **ngay từ đầu đóng dấu version**:
`spec.config.json.template = "default@1.0.0"` + `core` có `VERSION`. Phase 2 thêm skill `update-spec-repo` đọc version
chênh lệch → re-bake engine/rule (giữ nguyên `features/` + `changes/` của team). Đây là con đường `openspec update` /
`create-*` upgrade. Chi phí đóng dấu version ~0 mà mở đường nâng cấp về sau.

---

## 11. Install / distribution — "clone once" nghĩa là gì về mặt vận hành

Mô hình mới **bắt buộc** trả lời: skill của toolkit được Claude (và tool khác) **khám phá** kiểu gì khi bạn làm việc
trong một app **bất kỳ**?

- Claude Code nạp skill từ `~/.claude/skills/` (personal, mọi project) hoặc `.claude/skills/` (per-project) hoặc
  plugin. "Clone 1 lần dùng cho nhiều app" ⇒ **cài skill bootstrap ở tầng personal/global**, không phải drop-in từng
  project (khác hẳn v1).
- Đề xuất install story:
  1. `git clone ai-spec-driven-setup` về một chỗ cố định.
  2. **Symlink `skills/` → `~/.claude/skills/`** (hoặc đóng gói thành plugin marketplace). Từ đó `init-spec-repo`,
     `new-spec`… gọi được ở bất kỳ workspace nào.
  3. Trong workspace app: chạy `init-spec-repo`, trỏ tới source + docs → sinh `<app>-specs/`.
  4. Repo `<app>-specs/` đã **bake bản pin** skill authoring vào `.claude/skills/` của nó → team clone repo đó là có
     skill, **không cần** toolkit.
- Với **portability cho người khác** (chuẩn mở): ngoài đường Claude, tài liệu hoá `SKILL.md` là chuẩn Agent Skills để
  tool khác nạp; file chỉ-dẫn AI trung lập nên là **`AGENTS.md`** (chuẩn đa-tool), không phải `CLAUDE.md` hay
  `agent.md` tự chế.

> Đây là điểm v1 hoàn toàn không bàn, mà mô hình mới **không thể bỏ qua** — nó là hệ quả trực tiếp của cú xoay ở mục 1.

---

## 12. `spec-to-helpdoc` — generic hoá từ gitbook

optis `spec-to-gitbook` **rất** đặc thù: GitBook syntax (`{% stepper %}`, `{% hint %}`, `icon:`), `docs-map.yml`,
"merchant voice", Shopify. Phần **tái dùng được** (giá trị lõi) là:

- doc là **projection hướng người dùng** của spec, **không** phải bản sao;
- dịch **luật nghiệp vụ → lợi ích + bước bấm được**, giấu cơ chế;
- **không bịa** — mọi khẳng định truy được về spec; diff spec ⟷ doc hiện có để tìm gap;
- **không auto-publish** — dừng cho người review.

Phần **đặc thù** (GitBook syntax, giọng merchant, docs-map) → đẩy thành **"doc profile" pluggable**:
- `default` profile: **plain Markdown** (portable).
- `gitbook` profile: syntax GitBook + docs-map (cho ai dùng GitBook).
- profile chọn trong `spec.config.json.helpdoc.profile`.

Như vậy `spec-to-helpdoc` generic, GitBook chỉ là **một** profile — khớp "custom mạnh".

---

## 13. Naming nits (nhỏ nhưng nên chốt sớm)

| v1 / bạn dùng | Vấn đề | Đề xuất |
|---|---|---|
| `getting-started` | nghe như trang docs, không như generator | ✅ `init-spec-repo` |
| `src/` (trong template) | spec repo **không có source code** → gây hiểu nhầm | ✅ `specs/` (bạn chốt) |
| `agent.md` | không phải chuẩn nào | ✅ `AGENTS.md` (chuẩn đa-tool) |
| `changes/<TICKET>.md` (optis) | 1 file | ✅ folder `<Type>-<TASK>-<brief>/` (không timestamp — D5 cách B) |
| `spec.md` trong change | dụ người viết spec đầy đủ | ✅ giữ `spec.md`, ép format delta khi là delta (mục 17.3) |
| `work order` | thuật ngữ optis | `change` (đồng ý — dễ hiểu hơn) |

---

## 14. Phạm vi bản đầu (cập nhật theo D10)

> **Bạn chốt D10: LÀM TRỌN thiết kế** — structure vốn simple. Mục dưới giữ làm tham chiếu, nhưng phần "Hoãn" nay thu
> về đúng 2 thứ nặng thật (co-evolve-từ-code, update/migration) — xem **mục 17.4**. Skill chốt = **5** (change gộp vào
> `new-spec`, mục 17.3).

Thiết kế đầy đủ (3 tầng, đa template, đa ngôn ngữ runtime, catalog, per-template tools, linked-update) **quá lớn cho
lần một**. Chính v1 đặt "simple first" làm nguyên lý #1 rồi lại kê Phase-1 = "trọn bộ pack". Tôi cắt lại:

**MVP (Phase 1) — chứng minh trọn vòng lặp với phạm vi tối thiểu:**
- **1 template `default`** (generic), **không** đa template chọn lựa (catalog có nhưng chỉ 1 entry).
- **Engine core** `specs.mjs`: `new | index | check | archive` — config-driven, đọc `spec.config.json`.
- **4 skill authoring**: `new-spec`, `reverse-spec`, `change-spec`, `fold-change` + **1 skill bootstrap** `init-spec-repo`.
- **Rules thuộc template** (generic spec/acc/tech/change).
- **Output single-app**, `changes/` top-level first-class **có `archive`** (điều kiện an toàn mục 5.2).
- **`acceptance_stage: happy|full`** + `check` cảnh báo khi live-mà-happy.
- Config: `spec.config.json` (JSON) + `config.yml`/`catalog.yml` (YAML).
- **Ngôn ngữ**: rule/skill tiếng Anh, output theo `config.language`.
- **Version stamp** `template@x.y.z` (chưa cần update skill).
- **Nghiệm thu**: chạy được chuỗi `init-spec-repo` (seed 1 feature) → `new-spec` → `change-spec` → `fold-change`
  (archive) → `check` xanh → `spec-to-helpdoc` (profile markdown). Nếu chuỗi này chạy trơn trên 1 app thật → kiến
  trúc đúng.

**Hoãn:**
- Phase 2: template thứ hai (`embed-shopify-app`) → **kiểm chứng "rule thuộc template"** thật sự tách được đặc thù.
  `spec-to-helpdoc` profile gitbook. `update-spec-repo`.
- Phase 3: co-evolve-từ-code (fold từ code merged, không chỉ từ intent — v1 §9 Phase 2), cross-app shared knowledge,
  đa ngôn ngữ rule đầy đủ, skill-registry cho custom skill.

**Lý do cắt như vậy:** rủi ro lớn nhất **không** phải thiếu template — mà là **chưa chứng minh được "skill generic +
rule thuộc template + changes first-class + fold deterministic" chạy khớp nhau**. Làm 1 template cho chuỗi đó chạy
trơn rồi thêm template thứ hai để **chứng minh tính tách rời** là thứ tự đúng.

---

## 15. Quyết định — trạng thái sau thảo luận vòng 1

| # | Ngã rẽ | ✅ Chốt (vòng 1) |
|---|---|---|
| D1 | Vai trò toolkit sau khi sinh repo | **Snapshot cắt-dây cho bản đầu** + đóng dấu `template@version` sẵn cho update về sau |
| D2 | Rule sống ở đâu | **Trong template** (skill đọc rule của repo active) — 4.3 cách c |
| D3 | Changes | **Top-level first-class + BẮT BUỘC fold/archive** |
| D4 | File delta trong change | **Giữ `spec.md`**; nếu là delta thì ép format delta (mục 17.3) |
| D5 | Timestamp trong tên change folder | **Cách B**: KHÔNG timestamp ở folder active; chỉ đóng dấu ngày khi archive |
| D6 | Format config | **Mix theo vai trò**: JSON cho `spec.config.json`; YAML cho `config.yml`/`catalog.yml`/`meta.yml` |
| D7 | Tên skill bootstrap | **`init-spec-repo`** |
| D8 | Tên folder chứa spec content | **`specs/`** (trong template & output) |
| D9 | File chỉ-dẫn AI | **`AGENTS.md`** (chưa phản đối → tạm chốt) |
| D10 | Phạm vi bản đầu | **Làm trọn thiết kế** — chỉ hoãn co-evolve-từ-code + update/migration (mục 17.4) |
| **D11** | **Mô hình new-vs-change** | **✅ Uniform "mọi thứ là change" — `features/` ghi bởi ĐÚNG 2 nguồn: `fold` (change ship) + `reverse-spec` (ghi legacy). Không đường nào khác.** |

---

## 16. Việc tiếp theo (sau khi chốt bảng trên)

- [x] D1–D11 đã khoá. Kiến trúc chốt → sẵn sàng dựng repo thật.
- [ ] Viết `PHILOSOPHY.md` (kế thừa optis: state vs delta; capability không phải task; thêm: "rule thuộc template",
      "toolkit thường trú sinh nhiều app") + `constitution.md` generic (trỏ `spec.config.json`).
- [ ] Dựng `core/tools/specs.mjs` config-driven + `archive` (fold change→feature deterministic, phân theo feature).
- [ ] Dựng template `default`: `rules/`, `scaffold/{features,changes}`, `AGENTS.md`, `spec.config.template.json`.
- [ ] Viết 5 skill (SKILL.md chuẩn mở) — mở đầu mỗi skill bằng bước "resolve active rules của repo".
- [ ] Nghiệm thu chuỗi vòng lặp lõi trên 1 app thật (mục 14).

---

## 17. Cập nhật sau thảo luận vòng 1

### 17.2 `acceptance_stage` — giải thích (trả lời "mục 5")

Field `acceptance: happy|full` của bạn giữ nguyên ý, chỉnh 3 điểm:

1. **Đổi tên khỏi nhầm với file `acceptance.md`:** đặt **`acceptance_stage: happy | full`**. `happy` = "mới có
   checklist happy-path"; `full` = "đã phủ trọn vòng đời".
2. **Cho `check` biến field thành CỔNG, không chỉ ghi chú:** nếu `status ∈ {implemented, live}` (đã ship) mà
   `acceptance_stage: happy` → **cảnh báo** (không chặn) "đã ship nhưng acceptance chưa full". Bắt đúng khoảng trống
   chất lượng: code lên production mà test mới có happy-path.
3. **Trực giao với `status` — hai trục riêng, đừng gộp.** `status` = vòng đời spec (phối hợp role);
   `acceptance_stage` = độ chín bộ test. Không đi cùng nhịp:

   | status | acceptance_stage | nghĩa |
   |---|---|---|
   | ready-for-dev | happy | spec duyệt để build, tester mới có happy checklist — **giai đoạn đầu của bạn** |
   | live | full | đã ship + test đầy đủ — **trạng thái khoẻ mạnh** |
   | live | happy | ⚠️ **cờ đỏ** `check` bắt (điểm 2) |

   Đừng nhồi độ-chín-test vào `status` (không đẻ status "live-happy"). Tách rời để `check` **đối chiếu chéo** được.

### 17.3 Mô hình new-vs-change: "uniform" — **ĐÃ CHỐT (D11)**

Bạn nhận ra feature mới cũng đi qua `changes/`, và change kiểu đó cần **spec đầy đủ**, không phải delta. Đúng — bạn
vừa tự tới **mô hình OpenSpec**: *mọi thứ là change; `features/` do bước fold sinh ra* — **cộng thêm** `reverse-spec`
(xem bên dưới). Tôi **khuyến nghị theo hướng này** vì cho bất biến mạnh nhất và khớp trực giác của bạn.

**Chìa khoá — "2 loại change" nhưng CHUNG một format** (đều dùng block `### Requirement:`):
- **Feature mới (`type: Add`)** → mọi requirement dưới `## ADDED Requirements`. Đây *chính là* spec đầy đủ, chỉ mang
  nhãn ADDED.
- **Sửa cái cũ (`type: Modify|Remove|Fix`)** → chỉ phần đụng tới, dưới `## ADDED / ## MODIFIED / ## REMOVED`.

→ "full vs delta" **không phải hai format** — cùng một format; feature mới thì tình cờ mọi thứ đều ADDED. `new-spec`
ép format; lượng nội dung khác, cấu trúc thì không. (Đúng ý bạn ở 6.2: giữ `spec.md`, delta thì ép format delta.)

**Bước `fold` (archive) xử lý cả hai:**
- `Add` trỏ feature-id **chưa có** → **TẠO** `specs/features/<ID>/` (spec.md từ ADDED + scaffold acceptance/tech/meta),
  set `status: live`.
- `Modify/Remove` trỏ feature **đã có** → **vá** spec.md (match `### Requirement: <title>`).

**Bất biến mua được:** `features/` = **CHỈ** thứ đang/đã là production, luôn luôn. Có **đúng HAI người ghi** vào
`features/` — không đường nào khác:
- **`fold`** (chiều thuận) — một Add-change **ship** → tạo feature; một Modify/Remove ship → vá feature.
- **`reverse-spec`** (ghi lại thực tại) — code **đã** ở production nhưng chưa có spec → viết thẳng feature (`live`).

Cả hai đều chỉ viết thứ *đang/đã chạy thật*. Feature mới **đang xây** (chưa ship, không phải legacy) thì sống ở
`changes/` (Add-change) và chỉ hiện ở `features/` khi ship + fold. Đọc `features/` = hiện trạng thật, không "vaporware".

**Ba luồng:**
1. **`reverse-spec`** — code ĐÃ production, chưa spec → viết THẲNG `specs/features/` (`live`). *Ghi lại thực tại*, không
   phải đề xuất → **ngoại lệ duy nhất** không qua `changes/`.
2. **`new-spec` (Add)** — capability mới → `changes/` (full-as-ADDED) → fold → `features/` khi ship.
3. **`new-spec` (Modify)** — sửa feature live → `changes/` (delta) → fold → `features/` khi ship.

(2 & 3 **cùng một skill** `new-spec`, tự định tuyến bằng quét repo. → **Không cần** skill `change-spec` riêng; khớp
đúng danh sách skill bạn đưa. Taxonomy chốt **5 skill**: `init-spec-repo`, `reverse-spec`, `new-spec`, `fold-change`,
`spec-to-helpdoc`.)

**Hệ quả đẹp:** feature "draft chưa ship" = một Add-change bạn cứ sửa trong `changes/` tới khi ship → **không cần**
luồng "sửa draft trong features/" như optis. Đơn giản hơn optis.

**Đánh đổi (nói thẳng):** lúc đang xây, spec feature mới nằm ở `changes/`, chưa ở `features/`. Nếu bạn thích thấy
"feature đang xây" ngay trong `features/` dạng draft thì mô hình này không làm vậy — nhưng với luồng của bạn
(reverse-spec đổ đầy `features/`; việc mới tới dạng change) thì nó **nhất quán hơn**.

### 17.4 Phạm vi (trả lời "mục 8")

Đồng ý: **structure vốn simple, làm trọn luôn.** Ba tầng + catalog + template `default` chuẩn + engine `archive` +
config + version stamp — machinery rẻ, làm hết. Thứ tự nhiên tới sau (vì *chưa có nhu cầu*, không phải vì phức tạp
thiết kế):
- **template thứ hai `embed-shopify-app`** — viết được khi bạn cần (nó kiểm chứng "rule tách theo template");
- **co-evolve-từ-code** (fold từ code đã merge, không chỉ intent) — cần AI-tại-merge, nặng thật → sau;
- **update/migration** khi toolkit lên version — version stamp cắm sẵn từ đầu, tooling để sau.

---

### Phụ lục — bảng đối chiếu nhanh optis → toolkit mới

| optis | toolkit mới | ghi chú |
|---|---|---|
| 1 repo, `app-swatch/` + `app-option/` | **N repo**, mỗi app 1 repo | bỏ multi-app trong tooling |
| `.claude/commands/*` (Claude-only) | `skills/*/SKILL.md` (chuẩn mở) | portable |
| `.claude/rules/*` (thuộc repo) | `rules/*` **thuộc template** | rule generic-hoá, đặc thù đẩy sang template khác |
| `DOMAINS`/`STATUSES` hard-code 3 chỗ | `spec.config.json` (1 chỗ) | fix coupling smell |
| `related_code: ^(api\|cms\|tae):` | repos đọc từ `spec.config.json` | bỏ hard-code Shopify |
| work order 1 file, không-tracked | change folder first-class + `archive` | first-class an toàn nhờ fold |
| co-evolve fold từ code (AI) | `archive` fold từ intent (deterministic) + co-evolve Phase 3 | mượn OpenSpec |
| `spec-to-gitbook` (GitBook/Shopify) | `spec-to-helpdoc` + profile (markdown/gitbook) | generic hoá |
| `CLAUDE.md` | `AGENTS.md` | đa-tool |
```
