# PG JSON Server (Node.js + Express + TypeScript + PostgreSQL)

Dự án này là một API server linh hoạt được xây dựng trên nền tảng **Express** và **TypeScript**, sử dụng **PostgreSQL** làm cơ sở dữ liệu. Nó cung cấp các tính năng quản lý tài nguyên (resource) tương tự như `json-server` nhưng với sức mạnh của cơ sở dữ liệu quan hệ thực sự.

## 🚀 Tính năng chính

- **Dynamic Resources**: Tự động tạo các API endpoints CRUD cho bất kỳ bảng nào trong cơ sở dữ liệu (`/:resource`).
- **Xác thực & Phân quyền**:
  - Đăng ký và Đăng nhập với JWT.
  - Phân quyền theo vai trò (ví dụ: `admin` mới có quyền xóa).
- **Tính năng nâng cao**:
  - **Filtering, Pagination, Sorting**: Hỗ trợ truy vấn dữ liệu linh hoạt.
  - **Embed & Expand**: Hỗ trợ lấy dữ liệu quan hệ (tương tự json-server).
  - **Rate Limiting**: Giới hạn tần suất yêu cầu để bảo vệ server.
  - **Error Handling**: Xử lý lỗi tập trung qua middleware.
- **Cơ sở dữ liệu**: Sử dụng **Knex.js** làm query builder và quản lý migrations.
- **Docker**: Sẵn sàng triển khai với Docker và Docker Compose.

---

## 🛠 Công nghệ sử dụng

- **Backend**: Node.js, Express (v5.2.1), TypeScript.
- **Database**: PostgreSQL, Knex.js.
- **Security**: JSON Web Token (JWT), Bcrypt, Express Rate Limit.
- **Development**: Nodemon, ts-node.
- **DevOps**: Docker, Docker Compose.

---

## 📁 Cấu trúc thư mục

```text
src/
├── controllers/    # Xử lý logic nghiệp vụ
├── db/             # Cấu hình database, migrations, mock data
├── middlewares/    # Các middleware (auth, error, rate limit...)
├── routes/         # Định nghĩa các API endpoints
├── utils/          # Các hàm tiện ích (filter, pagination, validate...)
└── index.ts        # Entry point của ứng dụng
```

---

## ⚙️ Cài đặt & Chạy ứng dụng

### 1. Yêu cầu hệ thống
- Node.js (v18+)
- PostgreSQL (nếu chạy local) hoặc Docker.

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình môi trường
Tạo file `.env` dựa trên cấu trúc sau:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_db_name
JWT_SECRET=your_jwt_secret
```

### 4. Khởi chạy
#### Chế độ phát triển (Development):
```bash
npm run dev
```

#### Chế độ Production:
```bash
npm run build
npm start
```

#### Sử dụng Docker:
```bash
docker-compose up -d
```

---

## 📡 API Endpoints

### 🔐 Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Đăng ký người dùng mới |
| `POST` | `/auth/login` | Đăng nhập và nhận Token |

### 📦 Resources (CRUD)
Tài nguyên có thể là bất kỳ bảng nào như `posts`, `comments`, `users`...
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/:resource` | No | Lấy danh sách tài nguyên (Hỗ trợ filter, page) |
| `GET` | `/:resource/:id` | No | Lấy chi tiết tài nguyên theo ID |
| `POST` | `/:resource` | Yes | Thêm mới tài nguyên |
| `PUT` | `/:resource/:id` | Yes | Cập nhật toàn bộ tài nguyên |
| `PATCH` | `/:resource/:id` | Yes | Cập nhật một phần tài nguyên |
| `DELETE` | `/:resource/:id` | Admin | Xóa tài nguyên (Yêu cầu quyền admin) |

---

## 📝 Giấy phép
Dự án được phát hành dưới giấy phép **ISC**.
