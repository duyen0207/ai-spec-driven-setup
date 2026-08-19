---
name: spec-to-helpdoc
description: Project a capability's spec into user-facing help docs — translate business rules into benefits + clickable steps, hide internal mechanics, invent nothing, diff against existing docs to find gaps, and stop for human review (never auto-publish). Output format is a pluggable profile (markdown default). Use inside a generated <app>-specs/ repo ("write help docs for X", "generate user docs from the spec", "sinh help-doc từ spec", "viết tài liệu hướng dẫn từ spec").
---

# spec-to-helpdoc — chiếu spec thành tài liệu hướng dẫn người dùng

Một trang help-doc là **projection hướng người dùng** của spec — **KHÔNG** phải bản sao spec. Spec nói *feature làm
gì và luật gì*; help-doc nói *người dùng bấm gì để dùng được, và họ sẽ thấy gì trên màn hình*. Bạn **đề xuất** thay
đổi tài liệu rồi **DỪNG cho người review — không bao giờ tự commit/publish**.

## Ba nguyên tắc lõi (áp dụng cho mọi profile)

- **Giọng người dùng, lợi ích trước.** Mở đầu bằng lợi ích ("xem giá ngay mà không cần mở từng hoá đơn"), giấu cơ
  chế bên dưới. **Mỗi bước là một hành động bấm được**: "Vào … → bấm … → chọn …". Không mô tả cơ chế nội bộ.
- **Zero jargon.** KHÔNG path file, tên hàm/biến, tên DB/bảng/cột, tên class, số dòng, cú pháp code. Gọi mọi thứ
  theo cái người dùng **thấy trên màn hình** ("nút **Lưu**", "ô chọn **Kiểu hiển thị**").
- **KHÔNG bịa (invent nothing).** Trang chỉ được mô tả hành vi **đã có trong spec**. Thiếu thông tin → để placeholder
  rõ ràng, tuyệt đối không đoán. Con số/giới hạn → ghi **đúng giá trị** người dùng cần biết.
- **Luật nghiệp vụ → mẹo / cảnh báo.** Ví dụ spec ghi "watermark chỉ hiện ở gói free" → sinh trang "Cách gỡ nhãn"
  trỏ tới việc nâng gói. Prerequisite trong spec → bước hoặc cảnh báo đầu tiên trong tài liệu.

> Vì sao khắt khe vậy: spec đạt chuẩn constitution §7 (**chỉ ngôn ngữ nghiệp vụ**, phủ trọn vòng đời). Help-doc là
> lớp mỏng hơn nữa phía trên — mọi thứ nó nói phải **truy được ngược về spec**, nếu không thì đó là tín hiệu spec
> còn thiếu (xem "doc-ahead-of-spec" ở Step 1), không phải chỗ để bạn tự bịa.

## Trước tiên: resolve inputs

1. **Spec của feature mục tiêu** — đọc `specs/features/<ID>/spec.md` làm **hành vi chuẩn** (nguồn-sự-thật), cộng
   `acceptance.md` (các nhánh / edge case đã verify được) và `meta.yml` (`status`, `title`, link design nếu có) để
   lấy thêm tín hiệu. Nếu user chưa nêu feature nào → hỏi feature.
2. **Profile output** — đọc `spec.config.json.helpdoc.profile` (mặc định `markdown`). Nó chọn **định dạng đầu ra**:
   - **`markdown`** (mặc định) — trang Markdown thuần, portable, cắm được vào bất kỳ hệ docs nào. Cây tài liệu là
     các file `.md`; nếu có file mục lục (vd `index.md` / `README.md` / `SUMMARY.md`) thì đó là chỗ liệt kê trang.
   - **`gitbook`** — cú pháp GitBook (`{% hint %}`, `{% stepper %}`, `icon:` frontmatter). **PHASE 2 — chưa build.**
     Nếu profile là `gitbook`, báo cho user biết profile này thuộc phase 2 chưa hỗ trợ, và hỏi có muốn tạm dùng
     profile `markdown` không; **đừng tự giả định có `tools/docs.mjs` hay `docs-map.yml`** (toolkit này không có).
3. **Ngôn ngữ** — viết mọi nội dung sinh ra theo `spec.config.json.language`.

## Step 1 — Đọc CẢ HAI phía & diff (phần giá trị nhất)

Đọc **cả hai bên** rồi so sánh — đây là phần mang lại insight, đừng chỉ dịch một chiều spec → doc.

- **Phía spec:** `spec.md` của feature (hành vi chuẩn) + `acceptance.md` + `meta.yml`.
- **Phía docs:** đọc **mọi** trang help-doc hiện có liên quan tới feature (nếu có), và lướt các trang cùng nhóm +
  file mục lục để **khớp cấu trúc đang có** và **không tạo trùng** trang.

So spec ⟷ docs hiện có, **phân loại từng phát hiện** vào đúng một trong bốn loại:

- **Missing** — một luật / flow / sự kiện vòng đời trong `spec.md` mà **không** trang nào giải thích, nhưng người
  dùng sẽ cần hoặc sẽ đi tìm (vd gỡ watermark gói free, banner "chưa đồng bộ", "xem thêm" cho danh sách dài, hành vi
  lúc hết hạn). → tạo **trang mới** hoặc **section mới**.
- **Stale / wrong** — một trang **mâu thuẫn** với spec hiện tại (spec đã đổi, doc còn cũ). → sửa **tại chỗ**, sửa
  **tối thiểu**, đừng viết lại các phần không đụng tới.
- **Thin** — trang đúng nhưng **quá sơ sài** so với những gì spec hỗ trợ. → làm giàu thêm (bổ sung bước / mẹo / con
  số mà spec đã nêu).
- **Doc-ahead-of-spec** — trang (hoặc thứ bạn định viết) khẳng định điều **spec KHÔNG hề nói tới**. → **KHÔNG** được
  đưa vào doc như sự thật. Đây là **spec gap**: `features/` chỉ có đúng hai người viết (constitution §3), tài liệu
  không phải nguồn-sự-thật, nên phải **đưa ngược qua `new-spec`** để spec có điều đó **trước**, rồi mới doc hoá.

**Chọn scope:** mặc định xử lý các hạng mục **Missing / Stale giá trị cao nhất**. Nếu có nhiều hạng mục và không rõ
ưu tiên, trình bày danh sách đã phân loại và để user chọn (**một** `AskUserQuestion`) — trừ khi user đã nói chính
xác cần làm gì.

## Step 2 — Draft theo profile & truy vết về spec

Với mỗi trang cần tạo/sửa, viết đúng định dạng của profile đang dùng, và **mọi khẳng định phải truy được về một luật
trong `spec.md`** — không bịa tính năng, không tự chế số liệu.

- **Dịch spec → doc:** lấy **lợi ích** ra trước, giấu cơ chế. Luật nghiệp vụ → mẹo/cảnh báo. Mốc/giới hạn/số → nói
  đúng số nếu người dùng cần biết, bỏ chi tiết kỹ thuật không liên quan tới thao tác của họ. Prerequisite → bước /
  cảnh báo đầu tiên. Một feature thường **rải ra nhiều trang** (mỗi mode / how-to / FAQ một trang).

  Ví dụ chuyển hoá (minh hoạ nguyên tắc, không phải data thật của app nào):
  - Spec: *"Hệ thống chỉ hiển thị 3 giá trị đầu, phần còn lại gộp vào chỉ báo `+N`."* → Doc: *"Danh sách dài sẽ hiện
    3 tuỳ chọn đầu cho gọn gàng, kèm dấu **+N** để bấm xem hết — bạn không phải làm gì thêm."*
  - Spec: *"Watermark chỉ hiện ở gói free; gói trả phí ẩn nó."* → một trang how-to **"Cách gỡ nhãn"** dẫn người dùng
    tới bước nâng gói (biến một *luật gating* thành một *việc người dùng làm được*).
  - Spec: *"Trình chọn biến thể gốc của theme phải đang bật thì tính năng mới chạy."* → **cảnh báo/bước đầu tiên**
    trong trang how-to: kiểm tra & bật nó trước khi cấu hình.

- **Khuôn theo loại trang** (áp dụng cho mọi profile — chọn khuôn theo mục đích trang, dùng cú pháp của profile để
  hiện thực):
  - **how-to** (quy trình nhiều bước): tiêu đề → 1 câu mục tiêu → **từng bước có placeholder ảnh** → lưu ý quan
    trọng (mẹo/cảnh báo) → lời mời hỗ trợ nếu vẫn kẹt.
  - **faq / câu hỏi thường gặp**: **lấy câu hỏi làm tiêu đề** (đúng giọng người dùng hỏi) → trả lời ngắn, trấn an →
    nếu có thao tác thì liệt kê bước → lưu ý quan trọng.
  - **overview / reference cấu hình**: giới thiệu ngắn → mô tả từng mục/cài đặt theo *nó làm gì cho bạn* (lợi ích),
    KHÔNG liệt kê kỹ thuật.
  Nếu chưa rõ dùng khuôn nào, **bám theo phong cách 1–2 trang cùng loại đang có** trong cây docs để giữ nhất quán.
- **Trang mới** → ghi file vào **cây docs** đúng nhóm, **và** cập nhật **mục lục** nếu profile có dùng file mục lục
  (vd `index.md` / `SUMMARY.md` cho profile `markdown`). Chèn đúng nhóm, đúng thứ tự với các trang lân cận.
- **Trang cũ** → sửa **tối thiểu**; đừng reflow các section không đụng tới, đừng đổi giọng/format các trang ngoài
  phạm vi task.
- **Ảnh** → để placeholder có mô tả (`alt` / caption nói rõ ảnh cần chụp gì) để người soạn đính screenshot sau.
  **KHÔNG bịa URL/tên ảnh có thật.**

## Step cuối — KHÔNG commit/publish · insight report

Bạn là **người đề xuất, không phải người xuất bản**. Sau khi draft:

1. Nếu repo có lệnh kiểm tra tài liệu thì chạy để bắt lỗi cứng (vd `node tools/specs.mjs index && node tools/specs.mjs check`
   cho phần spec); sửa lỗi nó báo. **Đừng** giả định có công cụ docs riêng nếu profile hiện tại không định nghĩa.
2. **KHÔNG** `git commit` / `push` / publish. In một **insight report** cho user gồm:
   - **Trang đã tạo / sửa** (đường dẫn), và với mỗi trang: **luật spec nào** nó đang phủ, vì sao;
   - **Gap còn lại** cho feature này mà bạn **chưa** làm (để user biết còn thiếu gì);
   - Các hạng mục **doc-ahead-of-spec** cần **đưa qua `new-spec` trước** (spec phải có điều đó trước khi doc hoá) —
     ghi rõ từng cái là câu hỏi/điều cần bổ sung vào spec.
3. Nhắc user: **tự review** thay đổi trong working tree, **đính screenshot** vào các placeholder, rồi **tự publish**.

## Ranh giới (đừng vượt)

- **Không đưa rule chưa có trong spec vào doc.** Nếu thấy doc *cần* nói điều spec chưa có → đó là tín hiệu chạy
  `new-spec` để bổ sung spec **trước**, KHÔNG tự bịa trong doc. (Đây chính là hạng mục doc-ahead-of-spec ở Step 1.)
- **Không sửa giọng/format các trang lân cận** ngoài phạm vi task; trang cũ chỉ sửa tối thiểu đúng chỗ lệch với spec.
- **Không tự commit / push / publish** — chỉ ghi file vào working tree để người review.
- **Không giả định hạ tầng docs không có.** Toolkit này KHÔNG kèm `tools/docs.mjs` hay `docs-map.yml`; đừng gọi
  chúng. Nếu profile là `gitbook` (phase 2 chưa build) → báo user, đề xuất tạm dùng `markdown`, đừng tự phịa công cụ.
- **Chỉ cập nhật mục lục khi (và chỉ khi) thêm trang mới** — chèn đúng nhóm, đúng thứ tự, nếu profile có file mục lục.

## Checklist review (tự soi trước khi report)

- [ ] Zero jargon — chỉ thứ người dùng thấy trên màn hình; mỗi bước là một hành động bấm được.
- [ ] Mọi khẳng định **truy được về `spec.md`** — không bịa tính năng / số liệu; thiếu thì để placeholder.
- [ ] Đã phân loại đủ **4 loại** (Missing / Stale / Thin / Doc-ahead-of-spec); doc-ahead-of-spec **không** vào doc,
      mà route qua `new-spec`.
- [ ] Draft đúng **profile** đang cấu hình (markdown mặc định; gitbook = phase 2, đã báo user); nội dung đúng
      `spec.config.json.language`.
- [ ] Trang mới đã vào cây docs **và** cập nhật mục lục (nếu profile dùng); trang cũ sửa **tối thiểu**.
- [ ] **Không** commit/publish — chỉ đề xuất + report, nhắc user tự review + đính ảnh + publish.
