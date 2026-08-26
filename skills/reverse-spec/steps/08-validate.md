# Step 8 — Validate

```bash
node tools/specs.mjs index
node tools/specs.mjs check
```

Cả hai phải pass. Sửa mọi thứ báo lỗi (hay gặp: id≠folder, thiếu field bắt buộc, `related_code` không đúng dạng
`<repo>:path`, dòng history không bắt đầu bằng ngày).
