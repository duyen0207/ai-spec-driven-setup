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

## Nguyên tắc vận hành của skill này

1. **Một hạt giống, rồi chạy tới hết.** Hỏi tối thiểu để neo được điểm bắt đầu (Step 1), sau đó tự làm **mọi** chỉnh
   sửa cho tới bản draft đã validate. **Không** dừng hỏi giữa chừng. Các quyết định bình thường phải hỏi (mới-vs-refresh,
   domain, slug) → **tự quyết rồi báo cáo** trong summary cuối để người dùng override.
2. **Neo mọi khẳng định vào code — trong `tech.md`, KHÔNG trong `spec.md`.** Mỗi mệnh đề hành vi phải truy được về
   `<repo>:path:line` hoặc một symbol, ghi ở **bảng traceability** cuối `tech.md`. `spec.md` giữ **thuần ngôn ngữ
   nghiệp vụ** (rule `rules/spec.md`) — support đọc được. Code không chứng minh được → đó là **suy đoán**, không phải
   fact: gắn tag và đẩy xuống *Open questions*.
3. **Tách "code làm gì" khỏi "vì sao" (intent).** Bạn đọc *cái gì* đáng tin; *vì sao* là phỏng đoán. Đoán được, nhưng
   phải gắn nhãn và hạ `confidence`. **Doc còn sót thắng phỏng đoán**: feature cũ thường để lại PRD, note dev, FAQ nháp,
   email kế hoạch dù ticket đã mất — gom ở Step 1, cross-check ở Step 2b thay vì đoán intent chỉ từ code.
4. **Một capability là HỢP của MỌI entry point, không phải một call tree.** Feature nặng vòng đời (billing, sync)
   thường có 5–10 entry point rời nhau: route, webhook, cron, event phát ra, script support. Trace từ một seed anchor
   duy nhất SẼ bỏ sót phần lớn — liệt kê trọn event surface (Step 2) trước khi viết.
5. **Đọc `constitution.md` trước:** §1 (một capability = một folder, không phải một task), §2 (Feature ID
   `[DOMAIN]-<slug>`, không nhét ticket key), §3 (features/ chỉ có hai writer; reverse-spec ghi trực tiếp
   `origin: reverse-engineered`), §6 (spec reverse-engineered bắt đầu ở `live`), §7 (quality bar của `spec.md`) — và
   `rules/spec.md` nếu còn gì chưa rõ.

## Step 1 — Gieo hạt tìm kiếm (một `AskUserQuestion`, rồi một free-text — chỗ ngắt duy nhất)

Một lần `AskUserQuestion`:
1. **App** — xác nhận app (khớp `spec.config.json.app`).
2. **Loại neo** — header `Anchor`. Options: `Vị trí code (file/route/hàm)`, `Tên feature / chủ đề`,
   `Một hành vi người dùng thấy`. (Qua *Other* họ trộn được.) Chỉ để biết họ sẽ chỉ đường kiểu nào.

Rồi một free-text follow-up (KHÔNG phải AskUserQuestion):

> **Chỉ cho tôi feature.** Cho *bất cứ gì* bạn có — một route/URL admin, tên file, tên hàm/module, biệt danh của
> feature, hay chỉ mô tả người dùng làm gì. Một ký ức mờ cũng giúp tìm ra entry point.
>
> **Và: còn tài liệu nào sót lại không?** PRD cũ, note dev, FAQ nháp, email kế hoạch, link Figma, macro support —
> "mất ticket" hiếm khi là "mất giấy tờ". Dán path hoặc mảnh nội dung; tôi sẽ đối chiếu code với chúng. Từ đây tôi tự
> quét code và viết trọn spec — bạn chỉ review ở cuối.

Trong lúc chờ (hoặc ngay sau), **tự săn doc — nhưng ở TRONG repo được chỉ.** Glob **chỉ repo code người dùng trỏ tới**
tìm `*.md` / `*.docx` có tên "sặc mùi" feature (PRD, note, plan, spec, keyword của feature). **Không** Glob workspace
cha, repo anh em, hay folder ngoài repo được quét. Chỉ kéo doc từ **ngoài** repo khi người dùng nêu đích danh
file/folder hoặc dán/upload — đừng tự với ra path ngoài. Đọc doc trong phạm vi liên quan; liệt kê chúng (và doc người
dùng cung cấp) ở summary cuối kể cả khi không có. Rồi tiến hành **không hỏi thêm** — domain và slug bạn sẽ tự suy từ
code ở Step 2–4.

## Step 2 — Định vị & map feature trong code (codegraph-first, grep fallback)

Dùng codegraph làm engine nếu repo được index (`codegraph_explore`, callers/callees, impact); fallback Grep/Glob/Read
cho repo không index hoặc khi hunt text thuần.

1. **Tìm entry point** từ con trỏ người dùng: tên/chủ đề/hành vi → search symbol; route/URL → tìm route handler;
   file → `codegraph_explore` trên file đó.
2. **Đọc cụm** → `codegraph_explore` trên symbol entry để lấy source nguyên văn nhóm theo file.
3. **Trace luồng** → callees từ entry (validate → core logic → persistence → side effect → response/render) và callers
   (route, webhook, UI event, cron). Với một đường "trigger → outcome" cụ thể, nêu các symbol bắc cầu cho
   `codegraph_explore` để nó nối các bước dynamic (callback, re-render) mà grep không theo được.
4. **Bán kính ảnh hưởng / anh em** → `codegraph_impact` trên symbol lõi; nó cũng lộ ra bạn đang nhìn một capability hay
   vô tình bắc qua hai.
5. **Liệt kê TRỌN event surface (bảng coverage).** Một capability là hợp của **mọi** cách hệ thống tác động lên nó —
   không phải một call tree đi ra từ seed. Trước khi ngừng quét, liệt kê **hết**:
   - route/controller (mọi thao tác admin, không chỉ cái được trỏ);
   - webhook (install, uninstall, đồng bộ shop/plan…);
   - cron / scheduled task;
   - queue/event consumer **và event phát ra** (email/marketing, analytics);
   - metafield / config / feature flag được đọc hay ghi;
   - script support/ops và console command (seeder, helper sửa tay);
   - entity & cột DB feature sở hữu (mỗi cột thường mã hoá một luật — hỏi "flow nào ghi? flow nào đọc?").
   Giữ **bảng coverage** làm việc: **entry point → nó làm gì → section spec nào sẽ sở hữu**. Một entry point cuối cùng
   không có dòng spec nào = một lỗ hổng trong spec.
6. **Ghi footprint code** dần: tập `<repo>:<path-or-glob>` (repo key lấy từ `spec.config.json.repos`) backing feature
   này — đây thành `related_code`, artifact giá trị nhất của một spec reverse-engineered.

**Tự soát trước khi rời step:** Feature này *bắt đầu* và *dừng* ở đâu? Có kéo nhầm plumbing dùng chung (auth, base
client) không thuộc capability này? Có feature flag / config / env đổi hành vi? Có phần nào là dead code (không caller)?
**Đã điền bảng coverage từ MỌI loại entry point trên, hay chỉ đi ra từ seed anchor?** Ghi lại thứ chưa giải được.

## Step 2b — Đối chiếu doc còn sót (nếu có)

Nếu Step 1 lộ ra doc (PRD, note dev, FAQ nháp, email kế hoạch), khai thác — đó là nguồn *vì sao* duy nhất, và của hành
vi sống **ngoài code** (flow support thủ công, email marketing, chính sách business). Phân loại **mọi** khẳng định hành
vi trong doc thành một trong:

- **confirmed** — code đồng ý → spec nêu như fact (doc cấp phần *vì sao*);
- **contradicted** — code không đồng ý → spec nêu hành vi **của code**; mâu thuẫn thành một *Open question* tường minh
  ("doc nói X, code làm Y — cái nào đúng?");
- **not-in-code** — quy trình thủ công/ops, email do công cụ marketing gửi, hay kế hoạch chưa build → ghi vào section
  *Thông báo & comms* / *Quy trình support* / *Out of scope* của spec, gắn nhãn nguồn.

Dùng doc cho **intent** (Problem/context, lý do của luật) thay vì đoán — trích doc và gỡ tag *(inferred)* khi doc chốt
được. Doc còn **audit bảng coverage**: bất kỳ event/flow doc mô tả mà quét code chưa chạm = một lỗ quét — quay lại
Step 2 tìm cho ra trước khi viết.

## Step 3 — Map code → DOMAIN, quyết mới-vs-refresh (tự động)

- **Domain:** suy từ vị trí code, chọn trong `spec.config.json.domains` (nếu list rỗng thì ID free-form). Suy luận
  "code ở đâu → domain nào" từ chính cấu trúc `spec.config.json` + nơi code sống, **không** hardcode danh sách domain.
  Nếu code không map vào domain nào đang có, chọn cái gần nhất và cờ "có thể là domain mới" ở summary cuối (đừng tự chế
  domain mới — đó là quyết định có chủ đích của người dùng).
- **Mới hay refresh?** Liệt kê `specs/features/<DOMAIN>-*`; đọc `meta.yml.title` + đầu `spec.md` mỗi cái. Nếu capability
  này **đã được spec** (dù mới là stub), bạn **refresh cái đó**, không tạo trùng. Không khớp gì = **mới**. Quyết, và
  nêu quyết định (kèm ID đã khớp nếu có) ở summary cuối để người dùng sửa.

## Step 4 — Scaffold (hoặc mở target), rồi set fact reverse-eng

**Nếu MỚI** — suy `slug` từ chính từ vựng code (tên module/route/hàm) để `related_code` và codegraph khớp nhau; ID là
`<DOMAIN>-<slug>` (không ticket key). Scaffold **trực tiếp vào `specs/features/`** (không qua change):

```bash
node tools/specs.mjs feature --id <DOMAIN>-<slug> --origin reverse-engineered --status live --stage <full|happy>
```

- `--stage full` **chỉ khi** code phủ đủ vòng đời; nếu chỉ chắc happy path → `--stage happy`.
- `--status live` theo constitution §6 (spec reverse-engineered bắt đầu ở `live`); chỉ hạ nếu người dùng nói rõ nó
  chưa lên production.

**Nếu REFRESH** — bỏ scaffold; mở các file sẵn có của feature đã khớp.

Rồi sửa `meta.yml` cho phản ánh spec được khôi phục từ code:
- `origin: reverse-engineered`
- `status: live` (như trên)
- `confidence:` — `high` chỉ khi code rõ ràng; `medium`/`low` khi hành vi config-driven, rải mỏng, hoặc phải đoán
  intent nhiều. Trung thực — flag này báo người sau tin được bao nhiêu.
- `related_code:` — footprint `<repo>:<path-or-glob>` từ Step 2 (repo key trong `spec.config.json.repos`).
- **Dòng history:** viết lại dòng `created` mà scaffold seed, dạng ghi lại việc khôi phục, newest-first:
  `"<hôm nay> · — · reverse-engineered from code (<repo>@<short-sha hoặc 'current'>)"`. Nếu refresh feature sẵn có thì
  **prepend** dòng này thay vì thay thế.
- `owner:` — tên người dùng nếu có.

## Step 5 — Khôi phục UI / Design từ code

Legacy thường không có Figma, nên tái dựng UI bằng chữ từ code:
- Code phía admin/back-office → màn hình admin, field, trạng thái, message validate.
- Code phía người dùng cuối → cái họ thấy và tương tác (hover/selected/disabled/loading/empty).
Viết vào `spec.md` → `## UI / Design` dạng mô tả (màn hình, trạng thái, tương tác), mỗi phần neo về component (neo để
dành cho bảng traceability của `tech.md`). Để `meta.yml.design`/`ui` là `null` trừ khi thật sự có file design. Ở summary
cuối, ngỏ ý sinh một `ui.html` tái dựng nếu người dùng muốn bản trực quan.

## Step 6 — Author trọn spec từ code (phần nặng nhất)

Viết **đầy đủ** mọi file (người dùng chỉ sửa, không đồng-tác-giả), mỗi file theo rule của nó. **Đọc rule trước khi viết
file.**

**`spec.md`** → `rules/spec.md` (chỉ ngôn ngữ nghiệp vụ, phủ trọn vòng đời, flow theo phân khúc). Nghĩa vụ riêng của
reverse-spec chồng lên rule:
- **Tiêu thụ bảng coverage của Step 2.** Mỗi entry point (route, webhook, cron, event phát ra, script support, cột DB
  sở hữu) và mỗi claim doc ở Step 2b phải rơi vào một section spec — dòng còn thừa = lỗ hổng. Phủ thêm, ngoài section
  gốc của rule: **Thông báo & comms** (mỗi email/banner/toast: trigger + đối tượng + thời điểm) và **Quy trình
  support/ops** (phần thủ công — hoàn tiền qua support, discount tay…).
- Dùng khối `### Requirement: <tiêu đề ổn định>` → `#### Scenario:` (theo `rules/spec.md`) để delta về sau fold được.
- **Open questions = checklist trung thực** (chế độ reverse-spec của rule): **mọi** suy đoán intent, **mọi** mâu thuẫn
  doc-vs-code, **mọi** config/flag không thấy giá trị live, **mọi** "cố ý hay bug?" → một bullet, viết đúng câu hỏi
  con người cần trả lời.
- Lấy intent từ doc khi có (trích doc); nếu không, gắn `*(inferred)*`.
- **Zero code trong `spec.md`** — không path/symbol/cột/SQL; mọi neo code nằm ở bảng traceability cuối `tech.md`.

**`acceptance.md`** → `rules/acceptance.md` (case reverse-spec: 3–6 kịch bản rút từ **nhánh và edge case thật thấy
trong code** — rỗng/zero, giới hạn, đường bị gate, đường lỗi). Nếu code phủ đủ → `acceptance_stage: full`.

**`tech.md`** → `rules/tech.md` (case reverse-spec: file **giàu nhất**). PHẢI có: Design overview (§1 của rule — pattern
thật + phân cấp/biến thể, vẽ sơ đồ khi cần); các lớp nối end-to-end (entry → core → persistence → side effect); entry
point, call flow, data model, external call & side effect, bản đồ `related_code`, feature flag/config; và **kết thúc
bằng bảng Traceability** đầy đủ. Phân biệt **CERTAIN** (có trong code) vs **INFERRED** (suy đoán) — tag `*(inferred)*`
là đủ.

## Step 7 — Validate

```bash
node tools/specs.mjs index
node tools/specs.mjs check
```

Cả hai phải pass. Sửa mọi thứ báo lỗi (hay gặp: id≠folder, thiếu field bắt buộc, `related_code` không đúng dạng
`<repo>:path`, dòng history không bắt đầu bằng ngày).

## Step 8 — Tự phản biện đối kháng (challenge chính bản reverse của mình)

Trước khi hand-off, tấn công bản draft của mình rồi gấp kết quả vào *Open questions* / `confidence`:
- **Tiêu thụ hết coverage?** Mọi entry point ở Step 2 có một dòng spec; mọi claim doc ở Step 2b đã phân loại
  (confirmed / contradicted / not-in-code). Còn thừa = lỗ hổng.
- **Quét lại vòng đời:** chạy lại checklist `rules/spec.md` §2 — install/reinstall/uninstall, hành vi lúc mỗi mốc thời
  gian hết hạn, cancel→reactivate, hoàn tiền, store paused/closed/frozen, input lạ, thông báo, đường support, lưu giữ
  dữ liệu. Gì chưa trả lời → thành Open question, không im lặng.
- **Đọc-được-bởi-nghiệp-vụ:** `spec.md` còn một path/symbol/số dòng nào không? Có → dời sang bảng traceability của
  `tech.md`. Chạy checklist review của `rules/spec.md`.
- **Độ phủ:** đã trace *mọi* nhánh và caller, hay chỉ happy path? Caller nào chưa mở?
- **Hành vi ẩn:** feature flag, config, env, A/B, gating theo gói, hay logic data-driven mà không thấy giá trị live?
- **Ranh giới:** có gộp hai capability vào một folder, hay xé một cái ra hai? Kiểm lại bằng `codegraph_impact`.
- **Dead vs live:** có thứ nào không caller mà bị spec nhầm là đang chạy?
- **Rủi ro intent:** "luật" nào thực ra chỉ là *cái code tình cờ làm* và có thể là tình cờ?
Hạ `confidence` nếu các điểm trên đáng kể, và bảo đảm mỗi ẩn số là một Open question tường minh — không lặng lẽ bỏ.
Nếu có khoanh vùng độ phủ ở đâu (vd không mở hết một cây caller lớn), **nói ra** thay vì ngụ ý đã đầy đủ.

## Step 9 — Trao người dùng bản tóm tắt luồng bằng ngôn ngữ thường (deliverable họ validate)

Cuối cùng, trong **chat** (không phải file), đưa một **walkthrough phi kỹ thuật về cách feature chạy** để họ đối chiếu
với thực tế. Viết cho người không đọc code:

1. **Nó là gì** — một hai câu.
2. **Luồng** — trigger → bước → bước → kết quả, bằng lời thường ("Khi người dùng bấm *Save* ở trang X, app kiểm tra…").
   Kể *hành trình*, không kể tên hàm.
3. **Luật quan trọng** — gating, giới hạn, default (chỉ thứ liên quan nghiệp vụ).
4. **Nó sống ở đâu** — footprint code một dòng, cho traceability.
5. **Doc nói gì vs code làm gì** — nếu Step 2b có mâu thuẫn, liệt kê ở đây; đây là mục giá trị nhất để người dùng phân xử.
6. **Cái tôi CHƯA chắc** — các Open questions, dạng bullet gọn về *đúng thứ cần xác nhận/sửa*.
7. **Độ tự tin của tôi** — `high/medium/low` và vì sao.

Kết bằng việc dặn người dùng chính xác phải làm: đọc bản tóm tắt luồng đối chiếu hiểu biết của họ, sửa/trả lời Open
questions thẳng trong `spec.md`, và nâng `status` khi hài lòng. Nhắc rằng đây là bản khôi phục (`origin:
reverse-engineered`) mô tả code *như hiện tại* — sửa ở đây là sửa **spec**, không phải sửa code. Ngỏ ý gấp câu trả lời
của họ trở lại, và sinh `ui.html` nếu họ muốn bản trực quan của UI đã khôi phục.
