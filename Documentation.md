# TÀI LIỆU ĐẶC TẢ YÊU CẦU HỆ THỐNG (SRS)

## Hệ thống quản lý nhân sự cho dự án phần mềm theo kinh nghiệm làm việc

---

# 1. Tổng quan hệ thống

## 1.1 Tên dự án

**HR Resource Allocation Management System**

(Hệ thống quản lý và phân bổ nguồn lực nhân sự cho dự án phần mềm)

---

## 1.2 Mục tiêu hệ thống

Xây dựng hệ thống hỗ trợ quản lý và phân bổ nguồn lực nhân sự trong các dự án phần mềm dựa trên:

* **Kinh nghiệm làm việc**
* **Chuyên môn**
* **Available efforts (%)**
* **Thời gian phân bổ resource**

Hệ thống cho phép Project Manager:

* Xem năng lực và trạng thái available của nhân sự
* Tính toán resource cần thiết cho dự án
* Request resource phù hợp
* Theo dõi phân bổ resource theo thời gian

---

## 1.3 Bài toán nghiệp vụ

Hiện tại việc phân bổ nhân sự thường:

* Thực hiện thủ công
* Khó tracking available efforts
* Dễ over-allocation
* Thiếu căn cứ theo năng lực chuyên môn

Ví dụ:

Employee A:

* Chuyên môn: Back-end Developer
* Level: Middle
* Đang allocated:

  * Project A: 50%

=> Available còn lại: **50%**

Project Manager chỉ có thể request tối đa **50%**

---

# 2. Phạm vi hệ thống

Hệ thống quản lý:

* User & Authentication
* Role management
* Employee skill profile
* Project management
* Resource request & allocation
* Available effort calculation

---

# 3. Actors & Roles

## 3.1 Admin

Quyền:

* Quản lý toàn bộ user
* CRUD employee
* CRUD project
* Phân role
* Assign PM cho project
* Xem toàn bộ resource allocation

---

## 3.2 Project Manager (PM)

Quyền:

* Xem project được assign
* Tạo resource request
* Xem available resource
* Theo dõi allocation của project mình

---

## 3.3 Developer

Quyền:

* Xem profile cá nhân
* Xem allocation hiện tại

---

## 3.4 Tester

Quyền:

* Xem profile cá nhân
* Xem allocation hiện tại

---

## 3.5 Business Analyst

Quyền:

* Xem profile cá nhân
* Xem allocation hiện tại

---

# 4. Functional Requirements

---

# FR-01: Authentication

## Mô tả

Cho phép đăng nhập hệ thống theo role.

## Input

* Username / Email
* Password

## Output

* Dashboard tương ứng role

## Business Rules

* User phải active
* Sai thông tin > báo lỗi
* Session timeout configurable

---

# FR-02: User Management

## Mô tả

Admin quản lý user.

## Chức năng

### Create User

Input:

* Full name
* Email
* Password
* Role

---

### Read User

Danh sách user:

* ID
* Name
* Email
* Role
* Status

---

### Update User

Cho phép chỉnh:

* Role
* Status
* Password reset

---

### Delete User

Soft delete

---

## Role options

* Developer
* Tester
* Project Manager
* Business Analyst
* Admin

---

# FR-03: Employee Skill Management

## Mô tả

Quản lý năng lực chuyên môn của nhân sự.

---

## Thuộc tính employee

### Basic Information

* Employee ID
* Full name
* Email
* Contract start date
* Status

---

### Skill Information

### Chuyên môn (Specialization)

Giá trị:

* Front-end Developer
* Back-end Developer
* Automation Tester
* Manual Tester
* Business Analyst

---

### Years of Experience

Tự động tính:

**Current Date - Contract Start Date**

Ví dụ:

Contract Start Date: 01/01/2022
Current Date: 01/01/2026

=> 4 years

---

### Experience Level Mapping

| Years       | Level  |
| ----------- | ------ |
| < 2 years   | Junior |
| 2 - 5 years | Middle |
| > 5 years   | Senior |

---

### Available Efforts

Mặc định:

**100%**

Công thức:

Available Effort = 100% - Σ Allocated Efforts

Ví dụ:

Allocated:

* Project A: 30%
* Project B: 20%

Available = 50%

---

## Validation Rules

Available effort:

* Không âm
* Không vượt quá 100%

---

# FR-04: Project Management

## Mô tả

Admin quản lý dự án.

---

## Create Project

Input:

* Project name
* Description
* Start date
* End date
* Assigned PM

---

## Update Project

Cho phép update:

* End date
* Description
* PM assignment

---

## Delete Project

Soft delete

---

## Project Status

Auto-calculated:

* Planned
* Active
* Completed
* Extended

---

Logic:

* Current date < start date → Planned
* start ≤ current ≤ end → Active
* current > end → Completed
* end date updated > original end date → Extended

---

# FR-05: Define Resource Requirements

## Mô tả

Xác định nhu cầu resource của dự án.

PM nhập requirement theo chuyên môn.

---

## Input

Ví dụ:

* Back-end Developer: 300%
* Front-end Developer: 150%
* Manual Tester: 50%

---

## Ý nghĩa

300% Back-end =

Có thể:

* 3 người x 100%

hoặc

* 6 người x 50%

---

## Validation

* Tổng resource > 0
* Chỉ nhập chuyên môn hợp lệ

---

# FR-06: Resource Request Management

## Mô tả

PM request resource cho project.

---

## Input

* Project
* Employee
* Requested effort (%)
* Allocation start date
* Allocation end date

---

## Validation Rules

### Rule 1: Available Effort Check

Requested effort ≤ Employee available effort

Ví dụ:

Available = 50%
Request = 60%

→ Reject

---

### Rule 2: Date within Project Period

Allocation period phải nằm trong:

Project Start Date ≤ Allocation Date ≤ Project End Date

---

### Rule 3: No Overlapping Over-allocation

Tổng allocation trong cùng thời gian ≤ 100%

---

## Output

Request status:

* Pending
* Approved
* Rejected
* Auto Released

---

# FR-07: Auto Resource Release

## Mô tả

Resource tự động release khi request hết hạn.

---

## Logic

Nếu:

Current Date > Allocation End Date

Thì:

* Allocation status = Released
* Available effort được cộng lại

---

Ví dụ:

Employee A allocated:

50% đến 30/06/2026

Ngày 01/07/2026:

Available tăng thêm 50%

---

# FR-08: Resource Calculation Dashboard

## Mô tả

PM xem resource hiện có.

---

## Hiển thị

Theo employee:

* Name
* Specialization
* Experience level
* Allocated %
* Available %

---

## Filter

* By specialization
* By level
* By available effort
* By date range

---

# 5. Non-Functional Requirements

## Performance

* Response time < 2s
* Concurrent users: 100+

---

## Security

* Role-based access control (RBAC)
* Password hashing
* Session expiration

---

## Reliability

* Data consistency for allocation
* Transaction rollback on invalid allocation

---

## Scalability

Hỗ trợ mở rộng:

* 1000+ employees
* 500+ projects

---

# 6. Database Design

## Users

```sql
User
- id
- full_name
- email
- password
- role
- status
- created_at
```

---

## Employees

```sql
Employee
- id
- user_id
- contract_start_date
- specialization
- available_effort
```

---

## Projects

```sql
Project
- id
- name
- description
- start_date
- end_date
- pm_id
- status
```

---

## Project Resource Requirement

```sql
ProjectRequirement
- id
- project_id
- specialization
- required_effort
```

---

## Resource Allocation

```sql
ResourceAllocation
- id
- project_id
- employee_id
- allocated_effort
- start_date
- end_date
- status
```

---

# 7. API Requirements

## Authentication

```http
POST /api/auth/login
POST /api/auth/logout
```

---

## User

```http
GET /api/users
POST /api/users
PUT /api/users/{id}
DELETE /api/users/{id}
```

---

## Employee

```http
GET /api/employees
POST /api/employees
PUT /api/employees/{id}
```

---

## Project

```http
GET /api/projects
POST /api/projects
PUT /api/projects/{id}
DELETE /api/projects/{id}
```

---

## Resource Requests

```http
POST /api/resource-requests
GET /api/resource-requests
PUT /api/resource-requests/{id}/approve
PUT /api/resource-requests/{id}/reject
```

---

# 8. Core Business Logic (Pseudo Logic)

## Calculate Available Effort

```pseudo
available_effort = 100 - sum(active_allocations)
```

---

## Validate Resource Request

```pseudo
IF requested_effort > available_effort
   REJECT
```

---

## Auto Release

```pseudo
IF current_date > allocation_end_date
   release_resource()
```

---

# 9. Suggested Tech Stack for Vibe Coding

## Frontend

* React / Next.js
* TailwindCSS

---

## Backend

* Node.js + Express

---

## Database

* PostgreSQL

---

## Authentication

* JWT

---

## ORM

* Prisma

---

# 10. Acceptance Criteria

Hệ thống hoàn thành khi:

✅ PM chỉ request trong available effort
✅ Không over-allocate >100%
✅ Auto release đúng hạn
✅ Tính level tự động theo years of experience
✅ Resource dashboard filter chính xác
✅ Role-based access đúng quyền
✅ CRUD đầy đủ theo scope