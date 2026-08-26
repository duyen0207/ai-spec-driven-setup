# Step 10 — Trao người dùng bản tóm tắt luồng bằng ngôn ngữ thường (deliverable họ validate)

Cuối cùng, trong **chat** (không phải file), đưa một **walkthrough phi kỹ thuật về cách feature chạy** để họ đối chiếu
với thực tế. Viết cho người không đọc code:

1. **Nó là gì** — một hai câu.
2. **Luồng** — trigger → bước → bước → kết quả, bằng lời thường ("Khi người dùng bấm *Save* ở trang X, app kiểm tra…").
   Kể *hành trình*, không kể tên hàm.
3. **Luật quan trọng** — gating, giới hạn, default (chỉ thứ liên quan nghiệp vụ), với **số/danh sách thật**.
4. **Nó sống ở đâu** — footprint code một dòng, cho traceability.
5. **Nguồn tài liệu đã dùng** — liệt kê doc lấy từ nguồn user chỉ định (hoặc "không có tài liệu bổ trợ / user không
   cung cấp"). Nếu một nguồn user nêu mà không đọc được → nói rõ ở đây.
6. **Doc nói gì vs code làm gì** — nếu có mâu thuẫn, liệt kê ở đây; đây là mục giá trị nhất để người dùng phân xử.
7. **Cái tôi CHƯA chắc** — các Open questions, dạng bullet gọn về *đúng thứ cần xác nhận/sửa*.
8. **Độ tự tin của tôi** — `high/medium/low` và vì sao.

Kết bằng việc dặn người dùng chính xác phải làm: đọc bản tóm tắt luồng đối chiếu hiểu biết của họ, sửa/trả lời Open
questions thẳng trong `spec.md`, và nâng `status` khi hài lòng. Nhắc rằng đây là bản khôi phục (`origin:
reverse-engineered`) mô tả code *như hiện tại* — sửa ở đây là sửa **spec**, không phải sửa code. Ngỏ ý gấp câu trả lời
của họ trở lại, và sinh `ui.html` nếu họ muốn bản trực quan của UI đã khôi phục.
