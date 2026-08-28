---
name: init-spec-repo
description: Bootstrap a new, self-contained <app>-specs/ repository for one app — pick a template, infer spec.config.json, bake the engine + rules in one command, and seed 1 example capability. Use when the user wants to START a spec system for an app ("set up specs for app X", "generate a spec repo", "dựng repo spec cho app", "khởi tạo hệ spec cho app").
---

# init-spec-repo — dựng repo spec cho MỘT app

Bạn tạo một repo `<app>-specs/` **tự đủ (self-contained)** để team sở hữu: không cần cài đặt gì, chỉ cần **Node 18+**.
Đây là skill **bootstrap** của toolkit `ai-spec-driven-setup`. **Mỗi app một repo riêng** — không gộp nhiều app.

**Vị trí toolkit:** skill này nằm ở `<toolkit>/skills/init-spec-repo/`; gốc toolkit (lùi hai cấp) chứa `core/` (engine
+ schema + `constitution.md` + baker `init.mjs`) và `templates/` (các template chọn được + `catalog.yml`). Phần **cơ
học** (copy engine, ghi config, chạy validate) do `core/tools/init.mjs` lo trọn; việc của bạn là phần **thông minh**
bao quanh nó — thu thập input, suy luận domain/repo, và seed một ví dụ.

> **Ngôn ngữ hỏi user (BẮT BUỘC):** MỌI câu hỏi `AskUserQuestion` trong skill này (Step 1 và Step 2) PHẢI viết bằng
> **tiếng Việt** — cả `question`, `header`, `label` và `description` của từng option. Đây là quy ước team. (Ngôn ngữ
> **nội dung spec sinh ra** thì theo `spec.config.json.language` do user chọn ở Step 1, không liên quan tới quy ước này.)

## Nguyên tắc vận hành (đọc trước khi làm)

1. **Repo sinh ra phải tự đủ & zero-install.** Baker copy nguyên engine (`tools/specs.mjs`), schema và
   `constitution.md` vào repo mới, nên sau khi bake user chỉ cần `cd` vào và chạy `node tools/specs.mjs check` —
   **không cần toolkit ở cạnh**. Đừng thêm dependency, đừng để repo mới phải trỏ ngược về toolkit.
2. **`spec.config.json` là single source of variability.** Mọi thứ đặc thù app — `app`, `language`, `domains`,
   `statuses`, `roles`, `repos`, `helpdoc.profile` — sống DUY NHẤT ở file này. **Không hardcode tên app/domain cụ thể**
   vào bất kỳ chỗ nào khác; thêm/bớt domain hay role về sau = sửa `spec.config.json`, một chỗ. Nhiệm vụ Step 1–2 của
   bạn là điền file này cho đúng.
3. **Mỗi app một repo.** Nếu user muốn dựng spec cho nhiều app, chạy skill này nhiều lần — mỗi lần ra một
   `<app>-specs/` độc lập. Đừng nhét hai app vào chung.
4. **Phần cơ học để `init.mjs` lo — bạn lo phần suy luận & seed.** Đừng tự tay tạo folder, tự viết engine, hay tự copy
   file: gọi baker. Giá trị bạn thêm vào nằm ở input đúng (Step 1), domain/repo suy luận sát code (Step 2), và một ví
   dụ capability chất lượng cao (Step 4). Giữ mỗi step gọn và high-confidence.

## Step 1 — Thu thập input (một `AskUserQuestion`, rồi confirm)

Hỏi trong **một** lần gọi `AskUserQuestion` (viết bằng **tiếng Việt** — question/header/label/description đều tiếng Việt):

1. **Tên app** — sẽ thành `app-<name>` (kebab-case). Mặc định: suy từ tên thư mục hiện tại.
2. **Ngôn ngữ output** — ngôn ngữ cho spec/doc sinh ra (`en` / `vi` / …). Mặc định lấy từ `default_language` trong
   toolkit `config.yml`.
3. **Template** — các lựa chọn = entry trong `templates/catalog.yml` (mỗi entry có `name` · `description` · `usage`).
   Mặc định: `default`. (Đọc `catalog.yml` để liệt kê đúng, đừng bịa template không tồn tại.)
4. **Code / tài liệu ở đâu?** — mặc định: quét thư mục hiện tại và thư mục cha. User có thể trỏ chỗ khác (một repo
   code, một folder docs…).

Chốt lại 4 giá trị này với user trước khi sang Step 2.

## Step 2 — Suy luận `domains` & `repos`, rồi confirm

Đọc `templates/<template>/spec.config.template.json` làm **bản gốc** (nó có sẵn `domains`/`repos` mẫu — đây chỉ là
placeholder, KHÔNG dùng nguyên). Từ code/docs mà user trỏ ở Step 1, **suy luận và đề xuất**:

- **`domains`** — các nhóm capability cấp cao của app (nhóm route, module, mục nav, thư mục tính năng). Đây là
  `DOMAIN` (viết HOA) dùng trong feature ID `[DOMAIN]-<slug>`.
- **`repos`** — các key repo code mà feature sẽ neo vào qua `related_code` (ví dụ `web`, `api`, `cms`, `tae`).
- Kiểm lại **`roles` / `language` / `app`** nếu cần điều chỉnh so với mặc định.

Trình bày đề xuất và **confirm với user** bằng `AskUserQuestion` (câu hỏi **tiếng Việt**). Nhắc lại: `spec.config.json`
là **single source of variability** — tất cả những gì đặc thù app nằm ở đây, nên chốt cho đúng ngay từ đầu sẽ đỡ phải
bake lại. Nếu code chưa rõ để suy luận, cứ đề xuất tối thiểu và để user bổ sung — đừng bịa domain không có căn cứ.

## Step 3 — Bake repo (một lệnh)

Chạy baker cơ học với các giá trị đã chốt. Nó sẽ: copy **thân template** (`rules/`, `skeletons/`, `.claude/`,
`tools/`, `specs/AGENTS.md`) + **core engine** (`tools/specs.mjs`, `schema/`, `constitution.md`, `VERSION`); tạo
`specs/features/` và `specs/changes/` **RỖNG** (seed demo của template bị loại trừ mặc định); ghi `spec.config.json`
từ template + các override; rồi tự chạy `index` + `check`:

```bash
node <toolkit>/core/tools/init.mjs --app <name> --template <template> --language <lang> --domains <A,B> --repos <web,api> [--dest <dir>]
```

- `--app` bắt buộc, kebab-case (`--app checkout` → sinh ra `app-checkout-specs/`).
- `--domains` và `--repos` nhận danh sách ngăn bằng dấu phẩy, không khoảng trắng thừa.
- Thêm `--with-seed` **chỉ khi** user muốn GIỮ capability demo của template làm tham chiếu (mặc định loại bỏ để repo
  sạch). Thêm `--force` để ghi đè nếu `<app>-specs/` đã tồn tại.
- `--dest <dir>` để đổi nơi xuất ra (mặc định là thư mục hiện tại).

Xác nhận dòng cuối cùng của baker báo `check` **PASS** trước khi sang Step 4. Nếu `check` fail, đọc lỗi và sửa
(thường do `spec.config.json` — domain/repo/role không nhất quán) rồi chạy lại (kèm `--force`).

## Step 4 — Seed ĐÚNG 1 capability ví dụ (bounded)

Chọn **một** capability rõ ràng nhất, chắc chắn nhất trong code hiện có và reverse-engineer nó **đầy đủ** làm một ví
dụ mẫu — chạy theo skill `reverse-spec` **bên trong repo mới** (nó là 1 trong 2 writer hợp lệ của `features/`, ghi
feature trực tiếp với `origin: reverse-engineered`, `status: live`, mọi claim neo về `repo:path`).

**Handoff đúng cách sang `reverse-spec`** (nó vừa được tách thành `steps/`; bạn đã có sẵn ngữ cảnh từ Step 1–2 nên
đừng để nó hỏi lại):
- **Anchor:** đưa thẳng capability đã chọn (tên feature + vài entry point/route/file bạn thấy khi suy luận domain) —
  reverse-spec khỏi phải chạy `AskUserQuestion` của Step 1.
- **Phủ đủ repo:** dặn nó quét event surface trên **MỌI** repo trong `spec.config.json.repos` (không chỉ repo chứa
  anchor) — lớp storefront/client hay ở repo khác và dễ bị bỏ sót.
- **Nguồn tài liệu (doc-hunt):** truyền lại **đúng** chỗ user đã trỏ tài liệu ở Step 1 (nếu có). User **không** nêu
  tài liệu → nói rõ "không có tài liệu bổ trợ, dựng thuần từ code"; reverse-spec **không được tự đi lục** doc ngoài
  chỗ đó (ranh giới cứng của `steps/02-doc-hunt.md`).

**CHỈ MỘT — không hơn.** Lý do: nếu domain/config suy luận ở Step 2 hoá ra sai, user sẽ bake lại từ đầu; lúc đó mọi
capability đã seed đều phải làm lại — seed nhiều chỉ **phí công**. Một ví dụ chất lượng cao đủ để team thấy hình hài
một feature hoàn chỉnh và tự chạy `reverse-spec` cho phần còn lại sau. Giữ step này nhỏ, high-confidence; đừng seed
capability mà bạn không chắc ranh giới.

## Step 5 — Giải thích cho user

Chạy lại `node tools/specs.mjs index && node tools/specs.mjs check` trong repo (đảm bảo cả index lẫn check pass sau khi
seed), rồi tóm tắt ngắn cho user:

**Layout repo:**

```
<app>-specs/
  constitution.md          # LUẬT của repo — đọc trước khi author/sửa spec
  spec.config.json         # single source of variability (app, language, domains, statuses, roles, repos)
  specs/
    AGENTS.md              # hướng dẫn tổ chức repo cho AI (đa công cụ) — đọc trước
    features/<ID>/         # capability đang/đã ở production: meta.yml, spec.md, acceptance.md, tech.md
    changes/<Type>-...     # công việc đang bay: mỗi change một folder, fold vào features/ khi ship
  rules/                   # chuẩn author spec.md / acceptance.md / tech.md / change.md
  tools/specs.mjs          # engine: new/feature · change · index · check · archive
```

**`features/` có ĐÚNG 2 writer** (theo `constitution.md`):

- **`reverse-spec`** — code đã ở production nhưng chưa có spec → viết feature trực tiếp (`origin: reverse-engineered`).
- **`fold-change` (archive)** — một change kiểu **Add** *ship* → tạo feature (`origin: folded`); change kiểu
  Modify/Remove/Fix ship → vá feature đó.

Không có writer thứ ba: **đừng tự tay tạo folder feature.** Feature nào không phải reverse-engineered và cũng không
truy được về một change đã fold sẽ bị `check` cảnh báo.

**Mọi công việc mới là một "change"** — dù là capability hoàn toàn mới (`type: Add`) hay thay đổi capability sẵn có
(`Modify/Remove/Fix`), đều bắt đầu bằng một **change** dưới `specs/changes/`, và **chỉ fold vào `features/` khi ship**.
Chỉ cho user hai lối vào:

- **`new-spec`** — bắt một requirement. Nó quét repo, tự quyết định capability mới (Add) hay đổi cái đã có, rồi viết
  một change folder theo cả hai hướng. Đây là entry point authoring duy nhất user cần nhớ.
- **`fold-change`** — khi change đã merge/ship, fold nó vào feature đích (áp delta ADDED/MODIFIED/REMOVED theo tên
  requirement, prepend dòng history, archive change). Fold là cơ học — không cần AI merge tay.

Kết lại: trỏ user đọc **`constitution.md`** (luật: ID, hai writer của `features/`, state-vs-delta, fold) và
**`specs/AGENTS.md`** (bản đồ tổ chức repo + danh sách skill). Nhắc mọi thứ đặc thù app chỉ sửa ở `spec.config.json`.

## Self-check trước khi kết thúc

- [ ] Đã hỏi user bằng **tiếng Việt** ở cả Step 1 và Step 2 (question/header/label/description).
- [ ] Đã **confirm** `domains`/`repos`/`language`/`app` với user trước khi bake — `spec.config.json` phản ánh đúng cái
      user chốt (không hardcode tên app/domain ở nơi khác).
- [ ] Baker báo `check` **PASS**; chạy lại `index && check` sau khi seed vẫn pass.
- [ ] Đã seed **ĐÚNG 1** capability (không nhiều hơn), high-confidence, qua `reverse-spec`.
- [ ] `specs/features/` và `specs/changes/` khởi tạo rỗng (trừ ví dụ đã seed); không có folder feature tự tay tạo.
- [ ] Đã trỏ user tới `constitution.md` và `specs/AGENTS.md`, và giải thích `new-spec` / `fold-change`.
