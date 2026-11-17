# Thiết kế hệ thống Web quản lý bán hàng Vật liệu xây dựng

*Tech stack: React + Vite + TypeScript · NestJS · PostgreSQL*

## 1. Tổng quan & phạm vi

**Mục tiêu:** web app giúp cửa hàng/đại lý vật liệu xây dựng (xi măng, sắt thép, gạch, cát đá, sơn, ống nước, điện…) quản lý toàn bộ vòng đời: **Nhà cung cấp → Mua hàng → Kho → Bán hàng → Công nợ → Báo cáo**.

**Nguyên tắc thiết kế:** nghiệp vụ gọn, dễ dùng, thao tác nhanh (nhập đơn < 1 phút), có sẵn dữ liệu demo để trình diễn ngay.

### Trong phạm vi (MVP)

| Module | Chức năng chính |
| --- | --- |
| Danh mục | Sản phẩm, nhóm hàng, đơn vị tính & quy đổi, kho |
| Khách hàng | Hồ sơ, nhóm KH, công trình, hạn mức nợ |
| Nhà cung cấp | Hồ sơ NCC, điều khoản thanh toán |
| Mua hàng | Đơn đặt hàng, phiếu nhập kho, trả hàng NCC |
| Bán hàng | Báo giá (tùy chọn), đơn bán, phiếu xuất/giao hàng, trả hàng |
| Kho | Tồn kho, thẻ kho, kiểm kê/điều chỉnh |
| Công nợ | Phải thu (KH), phải trả (NCC), phiếu thu/chi, đối trừ |
| Báo cáo | Doanh thu, lợi nhuận, tồn kho, công nợ, top hàng/khách |
| Hệ thống | Người dùng, phân quyền, nhật ký thao tác, cấu hình |

### Ngoài phạm vi (giai đoạn sau)

Kế toán đầy đủ (sổ cái, thuế), hóa đơn điện tử, đa chi nhánh phức tạp, app mobile native, tích hợp Zalo OA (SePay xem mục 5.9, làm tùy chọn), quản lý vận chuyển nâng cao.

## 2. Vai trò & phân quyền (RBAC)

| Vai trò | Quyền chính |
| --- | --- |
| **Admin / Chủ cửa hàng** | Toàn quyền, xem giá vốn & lợi nhuận, cấu hình, phân quyền |
| **Quản lý** | Duyệt đơn, xem báo cáo, điều chỉnh kho, không sửa cấu hình hệ thống |
| **Nhân viên bán hàng** | Tạo đơn bán, xem tồn, thu tiền; **không** thấy giá vốn |
| **Thủ kho** | Nhập/xuất kho, kiểm kê; không thấy giá bán/công nợ |
| **Kế toán/Thu ngân** | Phiếu thu/chi, công nợ, báo cáo tài chính |

Phân quyền theo **permission** dạng `module:action` (ví dụ `sales_order:create`, `report:profit:view`). Role = tập permission, cấu hình được trong UI. Backend kiểm tra bằng Guard; frontend ẩn/hiện menu và nút theo permission.

## 3. Kiến trúc hệ thống

```
[Browser: React SPA]
      │ HTTPS (REST/JSON, JWT)
[Nginx reverse proxy + static FE]
      │
[NestJS API]  ──  [Redis (cache, queue - tùy chọn)]
      │
[PostgreSQL]  ──  [File storage: local/S3-compatible cho ảnh, đính kèm]
```

- **Monolith module hóa (Modular Monolith)** trên NestJS: mỗi module độc lập (auth, catalog, partner, purchase, sales, inventory, debt, report). Dễ phát triển, dễ triển khai, đủ cho quy mô cửa hàng VLXD; sau này tách service nếu cần.
- **Triển khai:** Docker Compose (nginx, api, postgres) trên VPS riêng (Ubuntu LTS, Let's Encrypt, tường lửa chỉ mở 80/443/SSH; 2 vCPU, 4 GB RAM, 40 GB SSD là đủ cho 2 người dùng đồng thời); có `docker-compose.demo.yml` seed sẵn dữ liệu demo.
- **CI/CD:** GitHub Actions: lint → test → build image → deploy.
- **Backup:** `pg_dump` hằng ngày, giữ 7–30 bản, đồng bộ thêm một bản sao ra ngoài VPS.

### Công nghệ chi tiết

| Lớp | Lựa chọn |
| --- | --- |
| FE | React 18, Vite, TypeScript, React Router, **TanStack Query** (server state), **Zustand** (UI state), **React Hook Form + Zod** (form/validate), **Ant Design** (UI, bảng/form mạnh cho back-office), dayjs, Recharts/ECharts, i18n (vi mặc định) |
| BE | NestJS, TypeORM (hoặc Prisma) + migration, class-validator/class-transformer, Passport-JWT, Swagger (OpenAPI), Pino logger, `@nestjs/schedule`, Jest |
| DB | PostgreSQL 15+, `numeric` cho tiền & số lượng, index theo truy vấn, `pg_trgm` để tìm kiếm tên hàng/khách |
| Khác | ESLint + Prettier, Husky, Docker, Swagger → sinh API client cho FE (openapi-typescript) |

## 4. Nghiệp vụ đặc thù vật liệu xây dựng

Những điểm khiến phần mềm VLXD khác bán lẻ thông thường, cần hỗ trợ ngay từ thiết kế:

1. **Nhiều đơn vị tính & quy đổi:** ví dụ xi măng: bao / tấn (1 tấn = 20 bao); gạch: viên / bó / pallet; cát đá: m³ / xe; sắt thép: cây / kg / tấn. Mỗi sản phẩm có **đơn vị cơ bản** + danh sách đơn vị quy đổi. Tồn kho luôn lưu theo đơn vị cơ bản.
2. **Bảng giá theo nhóm khách:** giá lẻ, giá thợ, giá đại lý/công trình. Giá có thể ghi đè theo từng khách. Giá nhập theo từng lần nhập.
3. **Bán chịu / công nợ là chủ yếu:** khách thợ, công trình mua chịu, thanh toán theo kỳ. Cần hạn mức nợ, hạn thanh toán, cảnh báo nợ quá hạn.
4. **Công trình (project/site):** một khách có thể có nhiều công trình/địa chỉ giao; công nợ và báo cáo xem được theo công trình.
5. **Giao hàng:** bán xong có thể giao nhiều đợt; ghi địa chỉ, xe, tài xế, phí vận chuyển.
6. **Chiết khấu & phí:** chiết khấu theo dòng hoặc tổng đơn, phí vận chuyển/bốc xếp tính riêng.
7. **Giá vốn bình quân gia quyền** (mặc định) để tính lãi gộp; cấu hình ẩn giá vốn với nhân viên.
8. **Tồn kho âm:** cho phép bán khi hết tồn nhưng luôn cảnh báo và yêu cầu xác nhận trước khi tiếp tục (thực tế nhiều cửa hàng bán trước nhập sau).

## 5. Mô tả chức năng theo module

### 5.1 Danh mục

- **Sản phẩm:** mã (SKU), tên, nhóm, thương hiệu, đơn vị cơ bản, đơn vị quy đổi, giá nhập gần nhất, giá bán theo bảng giá, tồn tối thiểu, ảnh, trạng thái.
- **Nhóm hàng:** dạng cây 2 cấp (Xi măng, Sắt thép, Gạch, Cát đá, Sơn…).
- **Kho:** danh sách kho/bãi, mặc định 1 kho.
- Nhập/xuất Excel danh mục sản phẩm.

### 5.2 Khách hàng

Mã KH tự sinh, tên, SĐT, địa chỉ, MST (tùy chọn), nhóm khách (→ bảng giá), hạn mức nợ, số ngày được nợ, ghi chú. Nhập từ Excel khách cũ: tải file mẫu, upload, xem trước và báo lỗi từng dòng (trùng SĐT/mã, thiếu tên), có thể kèm số dư nợ đầu kỳ; ghi audit log. Tab: **Đơn hàng · Công nợ · Công trình · Lịch sử thu tiền**.

### 5.3 Nhà cung cấp

Mã NCC, tên, liên hệ, địa chỉ, MST, điều khoản thanh toán (số ngày nợ), tab **Đơn nhập · Công nợ phải trả**.

### 5.4 Mua hàng

Luồng: **Đơn đặt hàng (PO)** → **Phiếu nhập kho (GRN)** → ghi nhận công nợ NCC → thanh toán.

- PO trạng thái: `Nháp → Đã đặt → Đã nhận một phần → Đã nhận đủ → Hủy`.
- Phiếu nhập: cập nhật tồn kho + giá vốn bình quân. Có thể nhập thẳng không qua PO.
- Trả hàng NCC: giảm tồn kho, giảm công nợ.

### 5.5 Bán hàng

Luồng: **(Báo giá) → Đơn bán → Xuất kho/Giao hàng → Thu tiền / Ghi nợ**.

- Màn **Bán nhanh (POS-like)** cho quầy: chọn khách, tìm hàng theo tên/mã, chọn ĐVT, nhập số lượng, hệ thống tự điền giá theo nhóm khách.
- Trạng thái đơn: `Nháp → Xác nhận → Đã xuất kho (một phần/đủ) → Hoàn tất → Hủy`.
- Thanh toán: trả đủ / trả một phần / ghi nợ; hình thức tiền mặt, chuyển khoản.
- Kiểm tra hạn mức nợ và tồn kho khi xác nhận đơn (chỉ cảnh báo, không chặn cứng: vượt hạn mức nợ, khách có đơn quá hạn hoặc hết tồn thì phải xác nhận mới tiếp tục, và việc xác nhận được ghi audit log).
- In: **phiếu giao hàng / hóa đơn bán hàng khổ A4 có logo**, mẫu dựng bằng HTML/CSS, logo và tên/địa chỉ/SĐT cửa hàng lấy từ Cài đặt, xuất PDF phía server hoặc in thẳng từ trình duyệt; gửi file PDF qua Zalo.
- Trả hàng: tăng tồn kho, giảm công nợ hoặc hoàn tiền.

### 5.6 Kho

- **Tồn kho** theo sản phẩm/kho, cảnh báo dưới mức tối thiểu; hỗ trợ 2–4 kho, chọn kho trên mỗi phiếu nhập/xuất.
- **Thẻ kho:** mọi biến động (nhập, xuất, trả, điều chỉnh) có chứng từ liên kết, số dư sau giao dịch.
- **Kiểm kê/điều chỉnh:** nhập số thực tế, hệ thống sinh phiếu điều chỉnh chênh lệch. Có phiếu chuyển kho giữa các kho (trừ kho đi, cộng kho đến, ghi hai dòng thẻ kho).

### 5.7 Công nợ

- **Phải thu:** tổng nợ theo khách/công trình, tuổi nợ (0–30, 31–60, 61–90, >90 ngày), danh sách quá hạn.
- **Phải trả:** tương tự theo NCC.
- **Phiếu thu / Phiếu chi:** thu tiền khách (gắn vào đơn cụ thể hoặc thu chung rồi **phân bổ tự động theo đơn cũ nhất trước**), chi trả NCC.
- **Sao kê công nợ** theo kỳ: dư đầu, phát sinh tăng (bán), phát sinh giảm (thu/trả hàng), dư cuối; xuất PDF/Excel gửi khách đối chiếu.

### 5.8 Báo cáo

| Báo cáo | Nội dung |
| --- | --- |
| Dashboard | Doanh thu hôm nay/tháng, lãi gộp, tổng nợ phải thu/phải trả, hàng sắp hết, đơn chờ xử lý, biểu đồ 30 ngày |
| Doanh thu | Theo ngày/tháng, theo nhóm hàng, theo khách, theo nhân viên |
| Lợi nhuận gộp | Theo đơn/sản phẩm/nhóm (chỉ vai trò được phép) |
| Mua hàng | Theo NCC, theo kỳ |
| Tồn kho | Tồn hiện tại, giá trị tồn, nhập–xuất–tồn theo kỳ |
| Công nợ | Tổng hợp, chi tiết, tuổi nợ |
| Top | Top hàng bán chạy, top khách mua nhiều/nợ nhiều |

Mọi báo cáo: lọc theo kỳ, xuất **Excel/PDF**.

### 5.9 Tích hợp SePay (tùy chọn, giai đoạn sau)

Khách chuyển khoản vào tài khoản ngân hàng của cửa hàng, SePay phát hiện giao dịch và gọi webhook về hệ thống. Thiết kế sẵn điểm cắm này để bật sau mà không phải sửa lõi công nợ.

- Endpoint `POST /integrations/sepay/webhook`, xác thực bằng khóa bí mật lưu trong Cài đặt, chỉ nhận qua HTTPS.
- Lưu nguyên giao dịch vào bảng `bank_transactions`; mã giao dịch của SePay là khóa duy nhất để không xử lý trùng khi webhook gửi lại.
- Đối chiếu nội dung chuyển khoản với mã đơn hoặc mã khách (ví dụ `BH-2611-0001`): khớp thì tự tạo phiếu thu và phân bổ vào đơn; không khớp thì vào hàng chờ "chưa đối chiếu" để thu ngân gán tay.
- Mẫu in A4 và màn hình đơn có thể hiện mã QR chuyển khoản với nội dung là mã đơn.
- Phiếu thu sinh tự động đều ghi audit log; có công tắc bật/tắt tích hợp.

Chi tiết payload và cách xác thực lấy theo tài liệu SePay hiện hành khi triển khai.

## 6. Thiết kế cơ sở dữ liệu (PostgreSQL)

### 6.1 Quy ước

- Khóa chính `id uuid` (hoặc `bigint identity`), cột chung: `created_at`, `updated_at`, `created_by`, `deleted_at` (soft delete cho danh mục); chứng từ có thêm cột version để khóa lạc quan khi 2 người sửa cùng lúc.
- Tiền: `numeric(18,2)`; số lượng: `numeric(18,3)`; tên bảng `snake_case` số nhiều.
- Chứng từ có `code` duy nhất, sinh theo mẫu `BH-YYMM-0001`, `NH-YYMM-0001`, `PT-…`, `PC-…`.

### 6.2 Sơ đồ quan hệ (rút gọn)

```
users ─< user_roles >─ roles ─< role_permissions >─ permissions

product_categories ─< products ─< product_units (quy đổi)
products ─< product_prices >─ price_lists

customer_groups ─< customers ─< customer_sites (công trình)
suppliers

purchase_orders ─< purchase_order_items
goods_receipts ─< goods_receipt_items      (nhập kho)

sales_orders ─< sales_order_items
deliveries ─< delivery_items               (xuất kho/giao hàng)

warehouses ─< stock_balances               (tồn hiện tại)
stock_movements                            (thẻ kho: mọi biến động)

payments (thu/chi) ─< payment_allocations  (phân bổ vào đơn)
debt_ledger                                (sổ công nợ KH/NCC)
audit_logs
```

### 6.3 Các bảng chính

**products**

| Cột | Kiểu | Ghi chú |
| --- | --- | --- |
| id | uuid PK |  |
| sku | varchar(50) unique | Mã hàng |
| name | varchar(255) | index trigram |
| category\_id | FK |  |
| base\_unit | varchar(20) | Đơn vị cơ bản (bao, viên, kg…) |
| cost\_price | numeric(18,2) | Giá vốn bình quân hiện tại |
| min\_stock | numeric(18,3) | Tồn tối thiểu |
| is\_active | bool |  |

**product\_units** — `product_id`, `unit_name`, `factor` (số lượng đơn vị cơ bản trong 1 đơn vị này, ví dụ tấn = 20 bao), `is_default_sale`, `is_default_purchase`.

**price\_lists / product\_prices** — bảng giá (Lẻ, Thợ, Đại lý); `product_prices(price_list_id, product_id, unit_name, price, effective_from)`.

**customers** — `code`, `name`, `phone`, `address`, `tax_code`, `group_id` (→ price\_list), `credit_limit`, `payment_term_days`, `is_active`. **customer\_sites** — `customer_id`, `name`, `address`, `contact`.

**suppliers** — `code`, `name`, `phone`, `address`, `tax_code`, `payment_term_days`.

**sales\_orders**

| Cột | Kiểu | Ghi chú |
| --- | --- | --- |
| code | varchar unique | BH-2611-0001 |
| customer\_id, site\_id | FK |  |
| order\_date, due\_date | date | Hạn thanh toán |
| status | enum | draft/confirmed/delivered/completed/cancelled |
| subtotal, discount\_amount, shipping\_fee, total | numeric |  |
| paid\_amount | numeric | Đã thu |
| payment\_status | enum | unpaid/partial/paid |
| note, salesperson\_id |  |  |

**sales\_order\_items** — `order_id`, `product_id`, `unit_name`, `quantity`, `base_quantity` (đã quy đổi), `unit_price`, `discount_pct`, `line_total`, `cost_at_sale` (giá vốn tại thời điểm bán, để tính lãi chính xác).

**purchase\_orders / goods\_receipts** — cấu trúc tương tự bán; `goods_receipt_items` lưu `unit_cost` để cập nhật giá vốn bình quân.

**deliveries / delivery\_items** — gắn `sales_order_id`, người nhận, địa chỉ, xe/tài xế, số lượng giao từng dòng; hỗ trợ giao nhiều đợt.

**stock\_balances** — `warehouse_id`, `product_id`, `quantity` (đơn vị cơ bản), unique (warehouse, product).

**stock\_movements** — `product_id`, `warehouse_id`, `movement_type` (purchase\_in/sale\_out/return\_in/return\_out/transfer\_in/transfer\_out/adjust), `quantity` (+/-), `balance_after`, `ref_type`, `ref_id`, `unit_cost`, `created_at`.

**payments** — `code`, `type` (receipt/payment), `partner_type` (customer/supplier), `partner_id`, `amount`, `method` (cash/transfer), `paid_at`, `note`. **payment\_allocations** — `payment_id`, `order_type`, `order_id`, `amount`.

**debt\_ledger** — `partner_type`, `partner_id`, `ref_type`, `ref_id`, `debit`, `credit`, `balance_after`, `created_at`. Dùng để sao kê và tính tuổi nợ nhanh.

**audit\_logs** — `user_id`, `action`, `entity`, `entity_id`, `before` (jsonb), `after` (jsonb), `ip`, `created_at`.

### 6.4 Index & ràng buộc quan trọng

- `sales_orders(customer_id, order_date)`, `sales_orders(status)`, `sales_orders(payment_status, due_date)` (truy vấn nợ quá hạn).
- `stock_movements(product_id, created_at)`, `debt_ledger(partner_type, partner_id, created_at)`.
- GIN trigram trên `products.name`, `customers.name`, `customers.phone`.
- CHECK: `quantity > 0` trên dòng chứng từ, `paid_amount <= total`; `stock_balances.quantity >= 0` chỉ áp dụng khi tắt cho phép tồn âm trong cấu hình (mặc định bật: bán âm có cảnh báo).

## 7. Quy tắc nghiệp vụ lõi

**Giá vốn bình quân gia quyền** khi nhập kho:

`giá vốn mới = (tồn cũ × giá vốn cũ + SL nhập × giá nhập) / (tồn cũ + SL nhập)`

**Xác nhận đơn bán (trong 1 DB transaction):**

1. Validate dữ liệu, kiểm tra hạn mức nợ và đơn quá hạn, vượt thì cảnh báo và yêu cầu xác nhận (`dư nợ hiện tại + phần chưa thu của đơn ≤ credit_limit`).
2. Kiểm tra tồn kho (cảnh báo nếu tồn âm, yêu cầu xác nhận và gắn cờ bán âm để rà soát khi nhập hàng), khóa dòng `stock_balances` bằng `SELECT … FOR UPDATE` để tránh bán trùng.
3. Trừ tồn, ghi `stock_movements`, ghi `cost_at_sale` vào từng dòng.
4. Ghi `debt_ledger` ghi nợ phần chưa thu.
5. Cập nhật trạng thái đơn.

**Thu tiền:** tạo `payments` + `payment_allocations`, cập nhật `paid_amount`/`payment_status` của đơn, ghi `debt_ledger` ghi có. Thu chung → phân bổ tự động đơn cũ nhất trước (FIFO), cho phép sửa tay.

**Hủy/sửa chứng từ đã xác nhận:** không xóa cứng; tạo bút toán đảo (reverse) hoặc phiếu trả hàng; mọi thay đổi ghi `audit_logs`. Đơn đã khóa kỳ không được sửa.

**Làm tròn:** tiền VND làm tròn đến đồng; số lượng giữ 3 chữ số thập phân.

## 8. Thiết kế API (REST, prefix `/api/v1`)

Chuẩn chung: JWT Bearer, phân trang `?page=&limit=&q=&sort=`, response lỗi thống nhất `{ statusCode, code, message, details }`, tài liệu Swagger tại `/api/docs`.

| Nhóm | Endpoint chính |
| --- | --- |
| Auth | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| Users/Roles | `CRUD /users`, `CRUD /roles`, `GET /permissions` |
| Catalog | `CRUD /products`, `/product-categories`, `/price-lists`, `/warehouses`; `POST /products/import` |
| Partners | `CRUD /customers`, `/customers/:id/sites`, `CRUD /suppliers`, POST /customers/import (nhập Excel, kèm số dư nợ đầu kỳ) |
| Purchase | `CRUD /purchase-orders`, `POST /purchase-orders/:id/confirm`, `POST /goods-receipts`, `POST /purchase-returns` |
| Sales | `CRUD /sales-orders`, `POST /sales-orders/:id/confirm`, `POST /sales-orders/:id/cancel`, `POST /sales-orders/:id/deliveries`, `POST /sales-returns`, `GET /sales-orders/:id/print?format=pdf` |
| Inventory | `GET /stock`, `GET /stock/:productId/ledger`, `POST /stock-adjustments` |
| Debt | `GET /debts/customers`, `GET /debts/suppliers`, `GET /debts/:partnerType/:id/statement?from=&to=`, `GET /debts/aging` |
| Payments | `POST /payments` (receipt/payment), `POST /payments/:id/allocate`, `GET /payments` |
| Reports | `GET /reports/dashboard`, `/reports/sales`, `/reports/profit`, `/reports/inventory`, `/reports/debt`; thêm `?export=xlsx` |
| System | `GET /audit-logs`, `GET/PUT /settings` |

**Cấu trúc module NestJS:** mỗi module gồm `controller → service → repository/entity → dto`. Logic giao dịch nhiều bảng đặt trong service với `DataSource.transaction`. Dùng `ValidationPipe` global, `ClassSerializerInterceptor`, `RolesGuard/PermissionsGuard`, `AllExceptionsFilter`.

## 9. Thiết kế Frontend

### 9.1 Cấu trúc thư mục

```
src/
  app/            # router, providers, layout, auth guard
  api/            # client axios + hooks TanStack Query theo module
  features/
    auth/ catalog/ customers/ suppliers/
    purchase/ sales/ inventory/ debt/ reports/ settings/
  components/     # DataTable, FormField, MoneyInput, UnitQtyInput, ProductPicker, PartnerPicker
  hooks/ utils/ types/ locales/
```

Mỗi feature gồm `pages/`, `components/`, `schemas/` (Zod), `hooks/`.

### 9.2 Sơ đồ màn hình

| Menu | Màn hình |
| --- | --- |
| **Tổng quan** | Dashboard |
| **Bán hàng** | Bán nhanh · Danh sách đơn bán · Chi tiết/In đơn · Trả hàng |
| **Mua hàng** | Đơn đặt hàng · Phiếu nhập kho · Trả hàng NCC |
| **Kho** | Tồn kho · Thẻ kho · Kiểm kê/điều chỉnh |
| **Đối tác** | Khách hàng (+ công trình) · Nhà cung cấp |
| **Công nợ** | Phải thu · Phải trả · Phiếu thu/chi · Sao kê |
| **Danh mục** | Sản phẩm · Nhóm hàng · Bảng giá · Kho |
| **Báo cáo** | Doanh thu · Lợi nhuận · Tồn kho · Công nợ · Top |
| **Hệ thống** | Người dùng · Phân quyền · Nhật ký · Cấu hình |

### 9.3 Màn hình trọng tâm: Tạo đơn bán

```
┌ Khách hàng [tìm theo tên/SĐT] ▾   Công trình ▾   Ngày   Hạn TT ┐
│ Nợ hiện tại: 12.500.000đ | Hạn mức: 50.000.000đ  (cảnh báo)  │
├───────────────────────────────────────────────────────────────┤
│ # │ Hàng hóa [tìm nhanh] │ ĐVT ▾ │ SL │ Đơn giá │ CK% │ Thành tiền │
│ 1 │ Xi măng Hà Tiên PCB40 │ Bao  │ 100│ 92.000  │  0  │ 9.200.000  │
│ 2 │ Thép phi 10 CB300     │ Cây  │  50│ 98.000  │  0  │ 4.900.000  │
│ + thêm dòng (Enter / phím tắt)       Tồn: 320 bao (hiển thị)  │
├───────────────────────────────────────────────────────────────┤
│ Tạm tính · Chiết khấu · Phí vận chuyển · TỔNG                 │
│ Thanh toán: [Đã trả ____] [Tiền mặt/CK]   Còn nợ: ____        │
│ [Lưu nháp] [Xác nhận & In phiếu] [Xác nhận & Giao hàng]       │
└───────────────────────────────────────────────────────────────┘
```

Điểm UX: tìm hàng theo tên/mã không dấu, tự điền giá theo nhóm khách, hiển thị tồn tại dòng nhập, phím tắt thêm dòng/lưu, tự tính quy đổi ĐVT, cảnh báo vượt hạn mức/hết tồn ngay trên form.

### 9.4 Chuẩn UI chung

Responsive (dùng được trên tablet/điện thoại cho nhân viên tại kho/bãi), bảng có lọc/sắp xếp/phân trang phía server, định dạng tiền `1.234.567 ₫` và số theo locale `vi-VN`, trạng thái dùng tag màu thống nhất, xác nhận trước các thao tác hủy/xóa, toast thông báo kết quả, skeleton khi tải.

## 10. Bảo mật & phi chức năng

- **Xác thực:** JWT access token ngắn hạn (15 phút) + refresh token (httpOnly cookie), băm mật khẩu bằng argon2/bcrypt, khóa tạm khi đăng nhập sai nhiều lần.
- **Bảo vệ API:** Helmet, CORS whitelist, rate limit (`@nestjs/throttler`), validate toàn bộ input, dùng query tham số hóa (chống SQL injection).
- **Dữ liệu:** HTTPS bắt buộc, backup tự động, audit log cho mọi thao tác thêm/sửa/xóa/duyệt/hủy chứng từ và danh mục (ai, lúc nào, giá trị trước/sau), khóa lạc quan (cột version) để 2 người sửa cùng một đơn không ghi đè nhau.
- **Hiệu năng:** phân trang mọi danh sách, index theo truy vấn, cache dashboard 1–5 phút; mục tiêu API < 300ms cho thao tác thường.
- **Chất lượng:** unit test cho nghiệp vụ lõi (giá vốn, công nợ, phân bổ thu tiền), e2e cho luồng mua–bán–thu tiền, ESLint/Prettier/CI bắt buộc.
- **Khả năng mở rộng:** thiết kế sẵn `branch_id`/`warehouse_id` để nâng lên đa chi nhánh sau này.

## 11. Dữ liệu demo (seed)

Để có sản phẩm demo ngay khi bàn giao:

- 3 kho, 5 nhóm hàng, \~40 sản phẩm thực tế (xi măng, thép, gạch, cát đá, sơn, ống nước, điện) kèm ĐVT quy đổi.
- 3 bảng giá (Lẻ / Thợ / Đại lý); 15 khách hàng (có công trình); 6 nhà cung cấp, kèm file Excel mẫu để demo nhập khách cũ.
- Khoảng 60 ngày giao dịch mẫu: đơn nhập, đơn bán, phiếu thu/chi, vài khoản nợ quá hạn để minh họa báo cáo tuổi nợ.
- 4 tài khoản demo theo 4 vai trò (admin, bán hàng, thủ kho, kế toán).
- Triển khai demo một lệnh: `docker compose -f docker-compose.demo.yml up`.

## 12. Kế hoạch triển khai đề xuất

| Giai đoạn | Nội dung | Thời gian ước tính |
| --- | --- | --- |
| 0. Chuẩn bị | Khởi tạo repo, CI, Docker, auth + phân quyền, layout FE | 1 tuần |
| 1. Danh mục & đối tác | Sản phẩm, ĐVT, bảng giá, khách hàng, NCC | 1 tuần |
| 2. Mua hàng & kho | PO, nhập kho, tồn kho, thẻ kho, giá vốn | 1,5 tuần |
| 3. Bán hàng | Đơn bán, bán nhanh, giao hàng, in phiếu, trả hàng | 2 tuần |
| 4. Công nợ & thu chi | Phiếu thu/chi, phân bổ, sao kê, tuổi nợ | 1,5 tuần |
| 5. Báo cáo & dashboard | Các báo cáo + xuất Excel/PDF | 1 tuần |
| 6. Hoàn thiện | Seed demo, test, tối ưu, tài liệu, triển khai | 1 tuần |

**Tổng ước tính: khoảng 9–10 tuần (đã gồm nhiều kho và nhập Excel; SePay làm thêm khoảng 1 tuần)** cho 1 dev fullstack (có thể rút xuống còn 5–6 tuần nếu 2 dev chia FE/BE). Đây là ước tính sơ bộ, cần chốt lại sau khi làm rõ yêu cầu.

## 13. Yêu cầu đã chốt & câu hỏi còn lại

**Đã chốt với khách:** 1 cửa hàng, 2–4 kho, 2 người dùng đồng thời, giá vốn bình quân gia quyền, không tích hợp hóa đơn điện tử/kế toán thuế.

- Có bán chịu; cảnh báo khi vượt hạn mức nợ hoặc có đơn quá hạn, không chặn cứng.
- Tồn kho âm: vẫn bán được nhưng cảnh báo.
- 2–4 kho, có chuyển kho giữa các kho.
- 2 người dùng đồng thời, nên cần audit log và khóa lạc quan.
- In mẫu A4 có logo.
- Nhập Excel danh sách khách cũ.
- Không tích hợp hóa đơn điện tử; SePay thanh toán là tùy chọn, làm sau.
- Triển khai trên VPS riêng của bên bạn.

**Còn cần xác nhận:**

1. Mẫu A4 cần những chứng từ nào (phiếu giao hàng, hóa đơn bán hàng, phiếu thu, sao kê công nợ)? Đã có file logo và thông tin cửa hàng chưa?
2. File Excel khách cũ có những cột nào, có số dư nợ đầu kỳ không?
3. Cảnh báo công nợ tính theo hạn mức, theo số ngày quá hạn, hay cả hai?
4. SePay: dùng ngân hàng nào, có cần mã QR và đối soát tự động ngay từ đầu không?
5. Cấu hình VPS (CPU, RAM, hệ điều hành), tên miền, và ai phụ trách backup?
6. Nhân viên có bị giới hạn chỉ thấy kho của mình không?
