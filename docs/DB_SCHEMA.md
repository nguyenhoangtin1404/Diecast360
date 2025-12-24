# Database Schema – Diecast360

## Quy ước chung
- DB: PostgreSQL, UUID cho mọi khóa chính.
- Timestamps dùng `timestamptz`, lưu ISO8601 cho API.
- Soft delete cho `items` bằng `deleted_at` (nullable).
- Prisma làm ORM; schema phải bám sát domain, không tự ý đổi tên/kiểu khi chưa cập nhật docs.

## Bảng & cột

### users
| Column | Type | Constraints/Notes |
| --- | --- | --- |
| id | uuid | PK |
| email | varchar | NOT NULL, UNIQUE |
| password_hash | varchar | NOT NULL |
| full_name | varchar | NULL |
| role | varchar | NOT NULL, default `admin` |
| is_active | boolean | NOT NULL, default `true` |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, default now() |

### refresh_tokens
| Column | Type | Constraints/Notes |
| --- | --- | --- |
| id | uuid | PK |
| user_id | uuid | FK → users(id) ON DELETE CASCADE |
| token_hash | varchar | NOT NULL, UNIQUE (lưu hash, không lưu plain) |
| expires_at | timestamptz | NOT NULL |
| revoked_at | timestamptz | NULL |
| created_at | timestamptz | NOT NULL, default now() |

### items
| Column | Type | Constraints/Notes |
| --- | --- | --- |
| id | uuid | PK |
| name | varchar | NOT NULL |
| description | text | NULL |
| scale | varchar | NOT NULL, default `1:64` |
| brand | varchar | NULL |
| status | enum | NOT NULL, values: `con_hang` \| `giu_cho` \| `da_ban`, default `con_hang` |
| is_public | boolean | NOT NULL, default `false` |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, default now() |
| deleted_at | timestamptz | NULL (soft delete) |

### item_images
| Column | Type | Constraints/Notes |
| --- | --- | --- |
| id | uuid | PK |
| item_id | uuid | FK → items(id) ON DELETE CASCADE |
| file_path | text | NOT NULL (đường dẫn lưu trữ) |
| thumbnail_path | text | NULL |
| is_cover | boolean | NOT NULL, default `false` |
| display_order | integer | NOT NULL, default `0` |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, default now() |

### spin_sets
| Column | Type | Constraints/Notes |
| --- | --- | --- |
| id | uuid | PK |
| item_id | uuid | FK → items(id) ON DELETE CASCADE |
| label | varchar | NULL (mô tả ngắn, ví dụ "24 frames default") |
| is_default | boolean | NOT NULL, default `false` |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, default now() |

### spin_frames
| Column | Type | Constraints/Notes |
| --- | --- | --- |
| id | uuid | PK |
| spin_set_id | uuid | FK → spin_sets(id) ON DELETE CASCADE |
| frame_index | integer | NOT NULL, 0-based, liên tục |
| file_path | text | NOT NULL |
| thumbnail_path | text | NULL |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, default now() |

## Ràng buộc bắt buộc
- `(spin_set_id, frame_index)` UNIQUE.
- Spin set default: UNIQUE (item_id) WHERE is_default = true.
- Item soft delete: mọi query business phải filter `deleted_at IS NULL`.
- Khi xóa ảnh/frames, đảm bảo cập nhật order/index liên tục và cover/default hợp lệ.

## Index đề xuất
- `items(status)` – lọc theo trạng thái kho.
- `items(created_at)` – sort danh sách.
- `item_images(item_id, display_order)` – render gallery.
- `spin_frames(spin_set_id, frame_index)` – tải spinner tuần tự.
