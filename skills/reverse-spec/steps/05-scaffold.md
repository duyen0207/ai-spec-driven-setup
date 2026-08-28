# Step 5 — Scaffold (hoặc mở target), rồi set fact reverse-eng

**Nếu MỚI** — scaffold **trực tiếp vào `specs/features/`** (không qua change):

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
  intent nhiều. Trung thực — flag này báo người sau tin được bao nhiêu. (Step 9 sẽ hiệu chỉnh lại.)
- `related_code:` — footprint `<repo>:<path-or-glob>` từ Step 3 (repo key trong `spec.config.json.repos`).
- **Dòng history:** viết lại dòng `created` mà scaffold seed, dạng ghi lại việc khôi phục, newest-first:
  `"<hôm nay> · — · reverse-engineered from code (<repo>@<short-sha hoặc 'current'>)"`. Ưu tiên ghi **short-sha thật**
  của từng repo (chạy `git -C <repo> rev-parse --short HEAD` nếu là git repo) thay vì 'current'. Nếu refresh feature
  sẵn có thì **prepend** dòng này thay vì thay thế.
- `owner:` — tên người dùng nếu có.
