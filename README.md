# constructOS — Hệ thống Web Quản lý Bán hàng & Kho Bãi Vật liệu Xây dựng

Hệ thống ERP chuyên nghiệp thiết kế đặc thù cho ngành phân phối & bán lẻ vật liệu xây dựng (xi măng, sắt thép, cát đá, gạch ngói, sơn & điện nước).

- **Frontend Domain:** `https://construct.bloxtcgshop.com`
- **Backend Domain:** `https://api-construct.bloxtcgshop.com`
- **Design Philosophy:** Anti-slop, utilitarian industrial design, 0 to 2px low border-radius, high tabular data density, monospace financial alignment, quick POS entry under 1 minute.

---

## 1. Tính năng nổi bật

1. **Bán nhanh tại quầy (POS - F2):**
   - Tìm kiếm vật tư siêu tốc theo tên hoặc mã SKU.
   - Hỗ trợ nhiều đơn vị tính & quy đổi tự động (1 Tấn = 20 Bao xi măng, 1 Bó = 100 Cây thép, 1 Xe = 3 m3 cát...).
   - Tự động áp giá theo bảng giá từng nhóm khách (Lẻ / Thợ thi công / Đại lý công trình).
   - Kiểm tra hạn mức nợ và hiển thị tức thì dư nợ hiện tại của khách hàng.
   - Hiển thị tồn kho tức thì và hỗ trợ nghiệp vụ bán âm (có cảnh báo).
   - In hóa đơn bán hàng & biên bản bàn giao vật tư khổ A4 chuyên nghiệp có logo, chữ ký 4 bên và mã QR VietQR chuyển khoản ngân hàng.

2. **Quản lý Mua hàng & Giá vốn bình quân:**
   - Phiếu nhập kho GRN tự động cập nhật giá vốn bình quân gia quyền:
     $$\text{Giá vốn mới} = \frac{\text{Tồn cũ} \times \text{Giá vốn cũ} + \text{SL nhập} \times \text{Giá nhập}}{\text{Tồn cũ} + \text{SL nhập}}$$
   - Tự động ghi nhận nợ phải trả nhà cung cấp.

3. **Quản lý Kho bãi & Thẻ kho:**
   - Hỗ trợ phân bổ đa kho (Kho Tổng, Bãi Cát Đá, Kho Phụ Kiện).
   - Thẻ kho (Stock movements) ghi nhận toàn bộ biến động theo từng dòng chứng từ.
   - Phiếu kiểm kê điều chỉnh kho và phiếu điều chuyển giữa các kho bãi.

4. **Công nợ & Phân bổ FIFO:**
   - Báo cáo phân tích tuổi nợ 4 cấp độ (Trong hạn 0-30 ngày, 31-60 ngày, 61-90 ngày, Quá hạn nghiêm trọng >90 ngày).
   - Lập phiếu thu tiền tự động cấn trừ vào các hóa đơn cũ nhất trước (FIFO).

5. **Dữ liệu Demo & Tài khoản mẫu:**
   - **Chủ cửa hàng (Admin):** `admin` / `Admin@123`
   - **Nhân viên bán hàng (Sales):** `sales` / `Sales@123`
   - **Thủ kho (Warehouse):** `warehouse` / `Warehouse@123`
   - **Kế toán (Accountant):** `accountant` / `Accountant@123`

---

## 2. Triển khai nhanh bằng Docker Compose

```bash
# Khởi chạy toàn bộ hệ thống (PostgreSQL + API + Web + Nginx)
docker compose -f docker-compose.demo.yml up -d --build

# Xem log các container
docker compose logs -f
```

---

## 3. Cấu trúc mã nguồn

```
apps/
  ├── api/           # NestJS + Prisma ORM + PostgreSQL API
  └── web/           # React 18 + Vite + TypeScript + TailwindCSS
docker/
  ├── Dockerfile.api # Multi-stage build API container
  ├── Dockerfile.web # Nginx static SPA container
  └── nginx/         # Reverse proxy cấu hình định tuyến cho cả 2 domain
deploy/
  └── setup-vps.sh   # Script tự động triển khai trên VPS
```
