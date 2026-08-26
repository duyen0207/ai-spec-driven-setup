# Step 2 — Doc-hunt (discovery-only, user-scoped)

Gom tài liệu bổ trợ để cấp **intent** (vì sao) và **hành vi sống ngoài code** (support thủ công, email marketing,
chính sách business). Step này **chỉ tìm & gom & chuẩn hoá** — KHÔNG phân loại đúng/sai (việc đó ở
`steps/03-locate-and-map.md`, vì cần trace code mới nói được "mâu thuẫn").

## Ranh giới cứng — chỉ đọc trong nguồn user chỉ định

Nguồn hợp lệ = **đúng allowlist** chốt ở `steps/01-seed.md` (path/folder/URL user tự nêu). Ngoài ra:

- **CẤM** glob workspace cha, repo anh em, folder khác, hay "đi một vòng cho chắc". Không tự với ra path ngoài
  allowlist dù thấy có vẻ liên quan.
- **CẤM** suy ra chỗ doc từ tên feature ("chắc có trong /docs"). Chỉ nơi user nói.
- Allowlist rỗng (user nói "không có") → step này **trả rỗng ngay**, không tìm gì. Đi tiếp Step 3, dựng spec thuần từ
  code, và ghi "không có tài liệu bổ trợ" ở hand-off.
- Nếu một nguồn user nêu không đọc được (path sai, URL cần auth chưa có) → **báo lại ở summary cuối**, không tự thay
  bằng nguồn khác.

Lý do: người dùng là người duy nhất biết tài liệu nào **đáng tin & được phép dùng**. Tự đi lục dễ kéo vào bản nháp cũ,
tài liệu của app khác, hay thông tin lỗi thời — làm bẩn spec.

## Cách gom trong phạm vi cho phép

Trong đúng các nguồn allowlist:
- File/folder cục bộ → đọc trực tiếp (`*.md`, `*.docx`, `*.pdf`… trong đúng path đó).
- URL (Confluence/Jira/Figma/Drive…) → chỉ mở nếu có MCP/tool tương ứng đã kết nối; không thì ghi nhận là "user cung
  cấp, chưa truy cập được" và để user tự dán nội dung.
- Nội dung user dán/upload thẳng vào chat → luôn hợp lệ.

## Output của step

Một **danh sách doc đã chuẩn hoá** (giữ ở scratchpad), mỗi mục:
`nguồn (path/URL) · loại (PRD/FAQ/dev-note/email/design) · tóm tắt 1 dòng nó nói về gì · các claim hành vi rút ra`.

Danh sách này (kể cả khi rỗng) được liệt kê ở hand-off, và là đầu vào cho phần **đối chiếu doc** ở Step 3.
