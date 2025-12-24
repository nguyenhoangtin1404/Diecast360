# Database Schema

## Table: users
| Column | Type | Note |
|------|-----|------|
| id | uuid | PK |
| email | varchar | unique |
| password_hash | varchar | |
| full_name | varchar | |
| status | varchar | ACTIVE / INACTIVE |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## Constraints
- Unique(email)
- Index(status)

---

## Notes
- Không xoá cột khi chưa migration
- AI không được tự ý đổi schema
