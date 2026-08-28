# Step 3 — Định vị & map feature trong code, rồi đối chiếu doc

Codegraph-first nếu repo được index (`codegraph_explore`, callers/callees, impact); fallback Grep/Glob/Read cho repo
không index hoặc khi hunt text thuần.

## 3a. Trace code → dựng bảng coverage

1. **Tìm entry point** từ anchor: tên/chủ đề/hành vi → search symbol; route/URL → tìm route handler; file →
   `codegraph_explore` trên file đó.
2. **Đọc cụm** → `codegraph_explore` trên symbol entry để lấy source nguyên văn nhóm theo file.
3. **Trace luồng** → callees từ entry (validate → core logic → persistence → side effect → response/render) và callers
   (route, webhook, UI event, cron). Với một đường "trigger → outcome" cụ thể, nêu các symbol bắc cầu cho
   `codegraph_explore` để nó nối các bước dynamic (callback, re-render) mà grep không theo được.
4. **Bán kính ảnh hưởng / anh em** → `codegraph_impact` trên symbol lõi; nó cũng lộ ra bạn đang nhìn một capability hay
   vô tình bắc qua hai.
5. **Liệt kê TRỌN event surface — trên MỌI repo trong `spec.config.json.repos`.** Một capability là hợp của **mọi**
   cách hệ thống tác động lên nó. **Quét một lượt cho từng repo** (đừng dừng ở repo chứa seed anchor — lớp
   storefront/client thường ở repo khác và hay bị bỏ sót). Trước khi ngừng, liệt kê hết:
   - route/controller (mọi thao tác admin, không chỉ cái được trỏ);
   - webhook / callback từ hệ thống ngoài;
   - cron / scheduled task;
   - queue/event consumer **và event phát ra** (email/marketing, analytics);
   - config / feature flag / metadata ngoài được đọc hay ghi;
   - script support/ops và console command (seeder, helper sửa tay);
   - **lớp client/storefront** đọc & thực thi config gì (nếu app có);
   - entity & cột DB feature sở hữu (mỗi cột thường mã hoá một luật — "flow nào ghi? flow nào đọc?").
   Giữ **bảng coverage**: **entry point → nó làm gì → section spec nào sẽ sở hữu**. Entry point không có dòng spec = lỗ hổng.
6. **Enumerate giá trị cụ thể ngay khi gặp** (phục vụ nguyên tắc #2 — concrete). Khi thấy một danh sách/hằng số quyết
   định hành vi, **chép ra đủ giá trị**, đừng để "sẽ điền sau": các nhóm/danh sách (vd danh sách plan free vs paid),
   enum trạng thái, message lỗi, con số (ngày, %, giá, ngưỡng, batch size), và **mọi nhánh `if` rẽ hành vi**. Đây là
   nguyên liệu để Step 7 viết không mơ hồ; thiếu ở đây thì Step 7 sẽ "ví dụ…" — không được.
7. **Ghi footprint code** dần: tập `<repo>:<path-or-glob>` (repo key trong `spec.config.json.repos`) — thành
   `related_code`, artifact giá trị nhất của spec reverse-engineered.

**Tự soát trước khi rời phần này:** Feature *bắt đầu* và *dừng* ở đâu? Có kéo nhầm plumbing dùng chung (auth, base
client)? Có feature flag/config/env đổi hành vi? Có dead code (không caller)? **Đã quét đủ MỌI repo, hay chỉ repo của
seed?** Ghi lại thứ chưa giải được.

## 3b. Đối chiếu doc còn sót (nếu Step 2 có trả về doc)

Với danh sách doc từ `steps/02-doc-hunt.md`, phân loại **mọi** claim hành vi trong doc thành một trong:

- **confirmed** — code đồng ý → spec nêu như fact (doc cấp phần *vì sao*);
- **contradicted** — code không đồng ý → spec nêu hành vi **của code**; mâu thuẫn thành một **Known limitations & gaps**
  (nếu đã chắc từ code) hoặc **Open question** (nếu chưa chắc): "doc nói X, code làm Y — cái nào đúng?";
- **not-in-code** — quy trình thủ công/ops, email do công cụ marketing gửi, hay kế hoạch chưa build → ghi vào section
  *Thông báo & comms* / *Quy trình support* / *Out of scope* của spec, gắn nhãn nguồn.

Dùng doc cho **intent** (Problem/context, lý do của luật) thay vì đoán — trích doc và gỡ tag *(inferred)* khi doc chốt
được. Doc còn **audit bảng coverage**: bất kỳ event/flow doc mô tả mà quét code chưa chạm = một lỗ quét — quay lại 3a
tìm cho ra trước khi viết.
