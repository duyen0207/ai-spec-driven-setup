# Step 4 — Map code → DOMAIN, quyết mới-vs-refresh (tự động)

- **Domain:** suy từ vị trí code, chọn trong `spec.config.json.domains` (nếu list rỗng thì ID free-form). Suy luận
  "code ở đâu → domain nào" từ chính cấu trúc `spec.config.json` + nơi code sống, **không** hardcode danh sách domain.
  Nếu code không map vào domain nào đang có, chọn cái gần nhất và cờ "có thể là domain mới" ở summary cuối (đừng tự chế
  domain mới — đó là quyết định có chủ đích của người dùng).
- **Mới hay refresh?** Liệt kê `specs/features/<DOMAIN>-*`; đọc `meta.yml.title` + đầu `spec.md` mỗi cái. Nếu capability
  này **đã được spec** (dù mới là stub), bạn **refresh cái đó**, không tạo trùng. Không khớp gì = **mới**. Quyết, và
  nêu quyết định (kèm ID đã khớp nếu có) ở summary cuối để người dùng sửa.
- **Slug:** suy từ chính từ vựng code (tên module/route/hàm) để `related_code` và codegraph khớp nhau; ID là
  `<DOMAIN>-<slug>` (không ticket key).
