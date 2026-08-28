# ai-spec-driven-setup — Phân tích & Plan thiết kế

> Tài liệu ghi lại **phân tích + quyết định thiết kế** cho setup pack `ai-spec-driven-setup`.
> Trạng thái: **plan đã chốt, chưa code**. Cập nhật lần cuối: 2026-08-18.

---

## 1. Mục tiêu

Xây một **setup pack** để team/app khác clone/thả về và **tự dựng nên một hệ thống lưu trữ spec** giống `optis-specs`,
với ba ràng buộc:

- **Đơn giản trước** (simple first).
- **Khả biến cao** — team custom được template, lắp skill của họ vào, chỉnh rule (vd họ thay skill viết spec của mình
  bằng skill của họ nếu cách làm khác).
- **Coupling thấp nhất có thể** — theo nguyên lý design pattern: càng ít phụ thuộc càng dễ mở rộng.

### Usage model đích (cách pack được dùng)

```
app-X/                              ← user tạo folder app
  <source-repo-a>/  <source-repo-b>/   ← code app
  docs/                                ← tài liệu ngổn ngang: helpdoc, .docx requirement,
                                          test .csv, .pdf, notion export
  ai-spec-driven-setup/                ← THẢ pack vào đây (toolkit; xong có thể xoá)
    .claude/skills/getting-started/    ← entry point duy nhất (1 skill)
    core/ …                            ← phần sẽ được "bake" ra output
  app-X-specs/                         ← OUTPUT skill sinh ra (self-contained, team sở hữu)
```

- User gọi skill `getting-started`, kèm prompt mô tả sơ app / vị trí source / vị trí docs.
- Không nói gì → mặc định quét **folder cha của pack** (`app-X/`).
- Skill hỗ trợ dựng hệ thống spec **từ đầu cho app brownfield** (đã / đang phát triển).
- Kết quả: tạo folder `<app>-specs/` (giống `openspec init`), dựng sẵn khung spec + giải thích cho user hiểu.

---

## 2. Phản biện `optis-specs` (rút ra cái tái dùng được)

`optis-specs` trộn **2 tầng** vào một:

| Tầng | Nội dung | Đem cho team khác? |
|---|---|---|
| **Cơ chế bất biến (universal)** | 1 capability = 1 folder (không phải 1 task); tách *state* (`spec.md`) vs *delta* (work order); SoT + read-only projection + human-accept; spec ngôn ngữ nghiệp vụ / code neo ở `tech.md`; commands **đọc** rules chứ không inline; `index`/`check` là cổng chất lượng | ✅ Phần đáng đóng gói |
| **Cụ thể-hóa BSS/Shopify (variant)** | DOMAIN dictionary (VARIANT-DISPLAY…); repo `api/cms/tae`; tách in-app vs storefront trong `tech.md`; pipeline GitBook; Figma/ui.html; role BA/QA/Techlead | ❌ Riêng OPTIS — phải thay được hết |

**Coupling smell nặng nhất của optis (phải fix khi đóng pack):** thêm 1 domain phải **sửa 3 chỗ** —
`constitution.md §5`, `schema/meta.schema.json` enum, mảng `DOMAINS` trong `tools/specs.mjs`. Đúng thứ vi phạm
"ít phụ thuộc". Pack gom về **một nguồn duy nhất** (`spec.config.json`).

---

## 3. OpenSpec — nghiên cứu & bản đồ đối chiếu

`openspec init` tạo folder `openspec/` gồm `specs/` (sự thật hiện tại) · `changes/` (proposal đang làm) ·
`changes/archive/` (đã xong, đặt tên theo ngày) + `project.md` + `AGENTS.md`.
Workflow: **explore → propose → apply → archive**; `openspec archive` là **CLI merge deterministic** delta vào specs.

**Phát hiện chính:** OpenSpec và optis-specs **hội tụ gần như hoàn toàn** ở ý tưởng lõi — tách *trạng thái hiện tại*
khỏi *thay đổi đang bay*. Điều này xác nhận thiết kế optis đúng, và chỉ ra vài chỗ OpenSpec gọn hơn để mượn.

| Khái niệm | OpenSpec | optis-specs |
|---|---|---|
| Sự thật hiện tại | `specs/<cap>/spec.md` | `features/<ID>/spec.md` |
| Delta đang bay | `changes/<name>/` (proposal + specs delta + tasks + design) | `features/<ID>/changes/<TICKET>.md` (work order) |
| Gấp delta vào spec | `openspec archive` (**CLI thuần, deterministic**) | co-evolve job (**AI đọc code merged**) |
| Format delta | `## ADDED/MODIFIED/REMOVED Requirements` + `### Requirement` + `#### Scenario WHEN/THEN` | bảng Before→After + In/Out-scope + anchors (**prose**) |
| Granularity | 1 capability, requirement + scenario | 1 capability, **4 file theo role** (spec/acc/tech/meta) |
| AI wiring | `AGENTS.md` (đa tool) + `/opsx:*` | `.claude/{commands,rules}` (Claude-only) |
| Brownfield onboard | `/opsx:onboard` | `/reverse-spec` |
| Validate | `openspec validate` | `specs.mjs check` |

### Mượn gì từ OpenSpec (4 thứ giá trị)

1. **Delta có cấu trúc → `archive` deterministic.** Điểm OpenSpec **hơn hẳn** optis: delta viết bằng
   `ADDED/MODIFIED/REMOVED Requirements` nên gấp vào spec là **merge văn bản thuần, không cần AI**. optis phải dựa
   AI co-evolve (kém tin cậy cho bước cơ học). → Cho spec có block `### Requirement:` đánh địa chỉ được; delta tham
   chiếu chúng; `specs.mjs archive` gấp tự động; AI chỉ *soạn* delta, không *merge*.
2. **`/onboard` = xác nhận ý tưởng `getting-started`.** OpenSpec đã có first-class brownfield onboarding.
3. **`AGENTS.md` (đa-tool)** — file chỉ dẫn AI trung lập (Claude/Cursor/Copilot) — portable hơn `.claude/` thuần.
4. **`explore` trước `propose`** — bước bàn bạc không cam kết, hợp BA còn mơ hồ.

### Cái optis làm tốt hơn — GIỮ

Role-separation 4 file (spec=BA / acc=QA / tech=Techlead) · rules-đọc-bởi-command (Strategy slot để lắp skill team) ·
`meta.yml` + schema + history · bar chất lượng "business-language + phủ vòng đời" · quy tắc "không viết lại spec live
lúc mở task".

**Nguồn:** [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) ·
[OpenSpec CLI docs](https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md) ·
[OpenSpec deep dive](https://redreamality.com/garden/notes/openspec-guide/)

---

## 4. Nguyên lý thiết kế cho pack (low-coupling)

1. **Single source of variability** — mọi thứ đặc thù team (apps, domains, roles, statuses, repos) nằm trong **1 file
   `spec.config.json`**. `specs.mjs` + `check` đọc config lúc chạy thay vì hard-code (*Dependency Inversion* — sửa 1
   chỗ thay vì 3). Fix trực tiếp coupling smell của optis.
2. **Rule = Strategy slot** — command trỏ `.claude/rules/*.md` theo path. Team muốn thay "cách viết spec" → **thay file
   rule** hoặc **thay hẳn command** bằng skill của họ; không đụng gì khác. Swap = *thay file*, không registry.
3. **Ranh giới coupling = verifier `check`**, không phải nội dung skill. Skill thay thế chỉ cần đẻ ra feature **pass
   `check`**. Team couple vào *output contract*, không couple vào *implementation* → mức phụ thuộc thấp nhất.
4. **Module opt-in, độc lập** (dự phòng tương lai) — core không biết gì về projection/gitbook/design; mỗi module tự
   chứa; thêm module không sửa core (*Open/Closed*).
5. **Bake rồi biến mất** — chạy skill xong, `<app>-specs/` là repo bình thường team sở hữu, **zero runtime dependency**
   vào pack.

---

## 5. Quyết định đã chốt (qua 2 lượt hỏi-đáp)

| Ngã rẽ | Chốt |
|---|---|
| Mô hình phân phối | **Drop-in pack + skill `getting-started` sinh repo** (AI đọc artifact thật; tốt hơn wizard Q&A cho brownfield) |
| Phần Shopify của optis | **Bỏ hẳn** — pack generic thuần |
| Độ rộng MVP | **core-spec only** (spec/acceptance/tech/work-order + tooling) |
| Mô hình soạn spec + gấp delta | **Hybrid** — role files + `### Requirement`/`#### Scenario` + delta `ADDED/MODIFIED/REMOVED` + `archive` deterministic |
| Độ sâu getting-started | **Skeleton + backlog + seed 1–2** (phần còn lại để `/reverse-spec` chạy dần) |
| Nơi chứa delta | **Per-feature** `features/<ID>/changes/<TICKET>.md` + `CHANGES_INDEX` tự sinh |

---

## 6. Kiến trúc — hai artifact

### 6.1 Pack `ai-spec-driven-setup/` (thả vào `app-X/`, xong xoá được)

```
README.md                     # là gì + cách dùng (thả vào → gọi skill)
PHILOSOPHY.md                 # cơ chế bất biến + lý do mượn structured-delta của OpenSpec
.claude/
  skills/getting-started/SKILL.md   # ★ entry point: orchestrator 6 bước brownfield
  settings.json
core/                         # phần được BAKE vào <app>-specs/
  tools/specs.mjs             # config-driven: new | wo | index | check | archive
  schema/meta.schema.json     # structural, KHÔNG hard-code enum
  spec.config.schema.json     # contract cho spec.config.json
  constitution.md             # luật generic; domain/role/status/repo → trỏ config
  templates/                  # meta · spec(có Requirement/Scenario) · acceptance · tech ·
                              #   work-order(ADDED/MODIFIED/REMOVED)
  claude/{rules,commands}/    # rules{spec,acc,tech,work-order} ·
                              #   commands{new-spec,task-spec,reverse-spec,archive}
  AGENTS.md.template          # (nhỏ) chỉ dẫn AI đa-tool, optional
presets/                      # web-service.json · minimal.json
docs/customizing.md · docs/skill-contract.md
```

### 6.2 Output `app-X-specs/` (team sở hữu, độc lập pack)

```
spec.config.json              # skill suy luận + user xác nhận
constitution.md · README.md   # README do skill viết: giải thích khung + bước tiếp
CAPABILITY_BACKLOG.md         # inventory: module code/doc phát hiện → capability ứng viên
SPECS_INDEX.md · CHANGES_INDEX.md   # tự sinh
schema/ · templates/ · tools/specs.mjs · .claude/{rules,commands}
app-X/features/<ID>/{meta.yml,spec.md,acceptance.md,tech.md,changes/}   # 1–2 seed mẫu
```

---

## 7. Điểm kỹ thuật mới so với optis

- **`specs.mjs archive`** (mượn OpenSpec): match `### Requirement:` theo tiêu đề, áp `ADDED/MODIFIED/REMOVED` từ work
  order vào `spec.md` bằng **merge văn bản thuần** — gấp delta không cần AI; đồng thời prepend `history`, gỡ
  `pending_changes`. (Khác optis co-evolve đọc code merged; MVP fold từ *intent của work order* — deterministic, đơn
  giản hơn; co-evolve-từ-code để dành optional Phase 2.)
- **Config single-source**: `DOMAINS/STATUSES/repos` đọc từ `spec.config.json`; `check` đối chiếu enum với config;
  schema chỉ giữ cấu trúc. Thêm domain = sửa **1 chỗ**.
- **Bỏ** `init/pull` (projection) + toàn bộ phần Shopify.
- **Coupling boundary = `check`**: `docs/skill-contract.md` quy định skill thay thế chỉ cần đẻ ra feature pass `check`.

### Cấu trúc spec.md (hybrid)

Giữ các section prose (Problem/context, Business rules, Use cases, UI/Design, Out of scope) nhưng **Requirement** thành
block đánh địa chỉ được:

```md
## Requirements
### Requirement: <title>
The system SHALL <behavior>.
#### Scenario: <name>
- WHEN <trigger>
- THEN <outcome>
```

Work order dùng delta OpenSpec-style, `archive` match theo tiêu đề Requirement:

```md
## MODIFIED Requirements
### Requirement: <title>
<full text mới>
#### Scenario: …

## ADDED Requirements
### Requirement: …

## REMOVED Requirements
### Requirement: <title>
```

---

## 8. `getting-started` — 6 bước (bounded)

1. **Discover** — quét scope (mặc định folder cha của pack; prompt override được); phân loại repo source (codegraph nếu
   có) + docs (helpdoc / requirement / test-data / pdf / notion).
2. **Infer config** — đề xuất apps/repos/domains/roles → **user xác nhận** (AskUserQuestion) → ghi `spec.config.json`.
3. **Scaffold** — tạo `<app>-specs/`, bake core self-contained. Sau bước này xoá pack vẫn chạy.
4. **Inventory** — sinh `CAPABILITY_BACKLOG.md` (module/doc → capability ứng viên) làm lưới an toàn chống bỏ sót.
5. **Seed 1–2** — reverse-engineer đầy đủ 1–2 capability rõ nhất làm **ví dụ mẫu**; phần còn lại để `/reverse-spec`
   chạy dần → giữ getting-started gọn, tránh dump spec kém tin cậy.
6. **Explain** — viết README trong `<app>-specs/` + dẫn user đi một vòng.

---

## 9. Phân pha

- **Phase 1 (MVP):** trọn bộ pack §6.1 — core config-driven (`new/wo/index/check/archive`), templates hybrid, rules +
  commands core-spec, **skill getting-started 6 bước**, 2 preset, 2 docs. Nghiệm thu: tự chạy `check` + demo `archive`
  trên seed để chứng minh chạy được.
- **Phase 2:** co-evolve-từ-code (thay vì chỉ archive-từ-intent); `AGENTS.md` đa-tool đầy đủ; wizard non-AI fallback.
- **Phase 3:** đóng gói lại projection / gitbook thành module opt-in nếu team cần.

---

## 10. Việc tiếp theo

- [ ] Chờ duyệt plan → bắt tay Phase 1.
- [ ] (Khi làm) dựng pack theo §6.1, generic-hóa nội dung từ optis, chuyển `specs.mjs` sang config-driven, thêm
      `archive`.
- [ ] (Khi làm) viết skill `getting-started` theo §8.
- [ ] (Khi làm) nghiệm thu bằng `check` + demo `archive`.
