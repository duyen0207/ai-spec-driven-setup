# Step 9 — Tự phản biện đối kháng (challenge chính bản reverse của mình)

Trước khi hand-off, tấn công bản draft của mình rồi gấp kết quả vào *Open questions* / *Known limitations & gaps* /
`confidence`.

## Săn mơ hồ (bắt buộc — hệ quả của nguyên tắc concrete)

Đọc lại **toàn bộ `spec.md`** và truy mọi chỗ chung chung — mỗi chỗ tìm thấy phải hoặc làm cho **cụ thể từ code**, hoặc
biến thành một Open question tường minh:
- Grep bằng mắt các cụm: "ví dụ", "như", "v.v.", "…", "một số", "tương tự", "tuỳ", "và các". Mỗi lần xuất hiện: hỏi
  "code có liệt kê đủ được không?" → có thì **enumerate ra**; không thì tag `*(inferred)*` + Open question.
- Mọi danh sách có bị cắt cụt không? (nhóm plan, segment, feature, message lỗi, view UI) → đối chiếu lại code, ghi **đủ**.
- Mọi con số đã là giá trị thật chưa? Còn "một khoảng / vài ngày / gần đây" nào không?
- Mọi công thức có 1 ví dụ tính bằng số thật chưa (kể cả ca chạm trần/sàn)?

## Các check còn lại

- **Tiêu thụ hết coverage?** Mọi entry point ở Step 3 có một dòng spec; mọi claim doc đã phân loại
  (confirmed / contradicted / not-in-code). Còn thừa = lỗ hổng.
- **Quét đủ MỌI repo?** Có repo nào trong `spec.config.json.repos` chưa mở (đặc biệt lớp storefront/client)? Nói ra nếu có.
- **Quét lại vòng đời:** chạy lại **toàn bộ** checklist `rules/spec.md` §2. Mỗi mục áp dụng được mà chưa trả lời → Open
  question, không im lặng.
- **Đọc-được-bởi-nghiệp-vụ:** `spec.md` còn path/symbol/số dòng nào không? Có → dời sang bảng traceability của `tech.md`.
- **Độ phủ:** đã trace *mọi* nhánh và caller, hay chỉ happy path? Caller nào chưa mở?
- **Hành vi ẩn:** feature flag, config, env, A/B, gating theo gói, logic data-driven mà không thấy giá trị live?
- **Ranh giới:** có gộp hai capability vào một folder, hay xé một cái ra hai? Kiểm bằng `codegraph_impact`.
- **Dead vs live:** có thứ nào không caller mà bị spec nhầm là đang chạy?
- **Rủi ro intent:** "luật" nào thực ra chỉ là *cái code tình cờ làm* và có thể là tình cờ?

Hạ `confidence` nếu các điểm trên đáng kể; bảo đảm mỗi ẩn số là một Open question tường minh, mỗi defect chắc-từ-code
là một dòng Known limitations & gaps. Nếu có khoanh vùng độ phủ ở đâu (vd không mở hết một cây caller lớn, một repo
chưa quét), **nói ra** thay vì ngụ ý đã đầy đủ.
