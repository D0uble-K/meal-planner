# HƯỚNG DẪN 3 BƯỚC KẾT NỐI GOOGLE SHEETS

Ứng dụng **"Hôm Nay Ăn Gì - Family Meal Planner"** sử dụng Google Sheets cá nhân của gia đình bạn làm cơ sở dữ liệu đám mây miễn phí, bảo mật và đồng bộ tức thì giữa hai máy của Ba và Mẹ.

---

### BƯỚC 1: TẠO FILE GOOGLE SHEETS & MỞ APPS SCRIPT
1. Mở trình duyệt và truy cập: [https://sheets.new](https://sheets.new) để tạo một bảng tính Google Sheets mới.
2. Đặt tên bảng tính là: `Hom Nay An Gi - Database` (hoặc tên tùy thích).
3. Trên thanh menu trên cùng, bấm chọn **Tiện ích mở rộng** (Extensions) -> **Apps Script**.

---

### BƯỚC 2: DÁN MÃ NGUỒN VÀ TRIỂN KHAI WEB APP
1. Tại cửa sổ soạn thảo Apps Script, xóa toàn bộ code mặc định (`function myFunction() { ... }`).
2. Mở file [`backend/Code.gs`](file:///f:/Antigravity_Projects/11W.%20Meal_List/backend/Code.gs) trong thư mục dự án này, copy toàn bộ nội dung và dán vào Apps Script.
3. Bấm biểu tượng **Lưu** (hình đĩa mềm hoặc phím `Ctrl + S`).
4. Ở góc trên cùng bên phải, bấm nút xanh **Triển khai** (Deploy) -> **Quản lý bản triển khai mới** (New deployment).
5. Bấm vào biểu tượng bánh răng ⚙️ (chọn loại) -> Chọn **Ứng dụng web** (Web app):
   * **Mô tả (Description):** `API Hôm Nay Ăn Gì`
   * **Thực thi dưới dạng (Execute as):** Chọn **Tôi (Email của bạn)** *(Me)*
   * **Ai có quyền truy cập (Who has access):** Chọn **Bất kỳ ai** *(Anyone)* — *Lưu ý: Bắt buộc chọn "Bất kỳ ai" để cả điện thoại của Ba và Mẹ đều đồng bộ được mà không gặp lỗi phân quyền tài khoản Google.*
6. Bấm nút **Triển khai** (Deploy).
7. Nếu Google yêu cầu xác thực quyền: Bấm *Xem xét quyền (Review Permissions)* -> Chọn tài khoản Google của bạn -> Bấm *Nâng cao (Advanced)* -> Bấm *Đi tới [Tên dự án] (không an toàn)* -> Bấm *Cho phép (Allow)*.
8. Sau khi triển khai xong, Google sẽ cung cấp một đường link **URL ứng dụng web** (Web App URL) có định dạng:
   `https://script.google.com/macros/s/AKfycb.../exec`
9. Bấm nút **Sao chép** (Copy) đường link URL này.

---

### BƯỚC 3: DÁN URL VÀO ỨNG DỤNG
1. Mở ứng dụng **Hôm Nay Ăn Gì** trên trình duyệt điện thoại hoặc máy tính.
2. Tại màn hình Thiết lập (hoặc trong mục Cài đặt):
   * Dán đường link URL vừa sao chép vào ô **Đường dẫn Web App URL**.
   * Chọn vai trò của thiết bị: **Tôi là Bố** hoặc **Tôi là Mẹ**.
   * Bấm **Bắt đầu sử dụng**.
3. Hệ thống sẽ tự động khởi tạo 3 Sheet dữ liệu (`MON_AN`, `LICH_SU_VA_KE_HOACH`, `BINH_CHON`) kèm sẵn **15 món ăn mẫu** chuẩn của gia đình!

---

> [!TIP]
> **Cách ghim ứng dụng ra màn hình chính điện thoại (Add to Home Screen):**
> * **Trên iPhone (Safari):** Bấm nút Chia sẻ (biểu tượng hình vuông có mũi tên trỏ lên) -> Chọn **"Thêm vào màn hình chính"** (Add to Home Screen).
> * **Trên Android (Chrome):** Bấm nút menu 3 chấm ở góc phải -> Chọn **"Thêm vào màn hình chính"** hoặc **"Cài đặt ứng dụng"**.
