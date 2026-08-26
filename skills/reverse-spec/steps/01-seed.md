# Step 1 — Gieo hạt tìm kiếm (chỗ ngắt DUY NHẤT)

Mục tiêu: neo được điểm bắt đầu để quét code, **và** biết chính xác **user để tài liệu bổ trợ ở đâu** (nếu có). Sau
step này không hỏi thêm — domain/slug tự suy ở Step 3–4.

## 1a. Một lần `AskUserQuestion`

1. **App** — xác nhận app (khớp `spec.config.json.app`).
2. **Loại neo** — header `Anchor`. Options: `Vị trí code (file/route/hàm)`, `Tên feature / chủ đề`,
   `Một hành vi người dùng thấy`. (Qua *Other* họ trộn được.) Chỉ để biết họ sẽ chỉ đường kiểu nào.

## 1b. Một free-text follow-up (KHÔNG phải AskUserQuestion)

> **Chỉ cho tôi feature.** Cho *bất cứ gì* bạn có — một route/URL admin, tên file, tên hàm/module, biệt danh của
> feature, hay chỉ mô tả người dùng làm gì. Một ký ức mờ cũng giúp tìm ra entry point.
>
> **Và: tài liệu liên quan (nếu có) bạn để ở ĐÂU?** PRD, note dev, FAQ, email kế hoạch, link Figma… Cho tôi **đường
> dẫn cụ thể** (folder/file/URL). Tôi **chỉ** đọc trong đúng chỗ bạn chỉ — sẽ **không** tự đi lục chỗ khác. Không có
> tài liệu nào thì nói "không có", tôi dựng spec thuần từ code.

## 1c. Chốt nguồn tài liệu (đầu vào cho Step 2 doc-hunt)

Ghi lại **chính xác** danh sách nguồn user vừa nêu — đây là **allowlist cứng** cho `steps/02-doc-hunt.md`:

- User nêu path/folder/URL cụ thể → đó là **toàn bộ** phạm vi doc-hunt. Không thêm gì khác.
- User nói "không có" / không nhắc tới → doc-hunt **bỏ qua** (không glob, không đoán chỗ). Spec dựng thuần từ code;
  ghi rõ "không có tài liệu bổ trợ" ở summary cuối.
- User mơ hồ ("chắc đâu đó trong repo") → hỏi lại **đúng một lần** cho ra path cụ thể; vẫn mơ hồ thì coi như không có.

Chuyển anchor + allowlist nguồn doc sang Step 2.
