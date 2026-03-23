# Database Schema – Diecast360

## Quy ước chung
- DB: PostgreSQL
- UUID cho mọi khóa chính
- Timestamps: DateTime (TIMESTAMP trong PostgreSQL)
- Soft delete cho `items` bằng `deleted_at` (nullable)
- Prisma làm ORM; schema phải bám sát domain, không tự ý đổi tên/kiểu khi chưa cập nhật docs

## Lựa chọn Database

| Mode | Kết nối | Ghi chú |
|------|----------|---------|
| PostgreSQL Local | `postgresql://postgres:postgres@localhost:5432/diecast360` | Dùng cho dev/self-host |
| PostgreSQL Neon | Runtime dùng pooler + migrate dùng direct | Dùng cho production managed |

## Bảng & cột

### shops
| Column | Type | Constraints/Notes |
|--------|------|-------------------|
| id | uuid | PK |
| name | varchar | NOT NULL |
| slug | varchar | NOT NULL, UNIQUE |
| is_active | boolean | NOT NULL, default `true` |
| created_at | datetime | NOT NULL, default now() |
| updated_at | datetime | NOT NULL, auto update |

### user_shop_roles
| Column | Type | Constraints/Notes |
|--------|------|-------------------|
| user_id | uuid | FK → users(id) ON DELETE CASCADE |
| shop_id | uuid | FK → shops(id) ON DELETE CASCADE |
| role | enum | NOT NULL, values: `super_admin` \| `shop_admin`, default `shop_admin` |

### users
| Column | Type | Constraints/Notes |
|--------|------|-------------------|
| id | uuid | PK |
| email | varchar | NOT NULL, UNIQUE |
| password_hash | varchar | NOT NULL |
| full_name | varchar | NULL |
| role | varchar | NOT NULL, default `admin` |
| is_active | boolean | NOT NULL, default `true` |
| created_at | datetime | NOT NULL, default now() |
| updated_at | datetime | NOT NULL, auto update |

### refresh_tokens
| Column | Type | Constraints/Notes |
|--------|------|-------------------|
| id | uuid | PK |
| user_id | uuid | FK → users(id) ON DELETE CASCADE |
| token_hash | varchar | NOT NULL, UNIQUE (lưu hash, không lưu plain) |
| expires_at | datetime | NOT NULL |
| revoked_at | datetime | NULL |
| created_at | datetime | NOT NULL, default now() |

### items
| Column | Type | Constraints/Notes |
|--------|------|-------------------|
| id | uuid | PK |
| shop_id | uuid | NULL, FK → shops(id) ON DELETE CASCADE |
| name | varchar | NOT NULL |
| description | text | NULL |
| scale | varchar | NOT NULL, default `1:64` |
| brand | varchar | NULL |
| car_brand | varchar | NULL |
| model_brand | varchar | NULL |
| condition | varchar | NULL |
| price | decimal | NULL |
| original_price | decimal | NULL |
| status | enum | NOT NULL, values: `con_hang` \| `giu_cho` \| `da_ban`, default `con_hang` |
| is_public | boolean | NOT NULL, default `false` |
| created_at | datetime | NOT NULL, default now() |
| updated_at | datetime | NOT NULL, auto update |
| deleted_at | datetime | NULL (soft delete) |
| fb_post_content | text | NULL (nội dung bài FB do AI hoặc user tạo) |

### item_images
| Column | Type | Constraints/Notes |
|--------|------|-------------------|
| id | uuid | PK |
| item_id | uuid | FK → items(id) ON DELETE CASCADE |
| file_path | text | NOT NULL (đường dẫn lưu trữ) |
| thumbnail_path | text | NULL |
| is_cover | boolean | NOT NULL, default `false` |
| display_order | integer | NOT NULL, default `0` |
| created_at | datetime | NOT NULL, default now() |
| updated_at | datetime | NOT NULL, auto update |

### spin_sets
| Column | Type | Constraints/Notes |
|--------|------|-------------------|
| id | uuid | PK |
| item_id | uuid | FK → items(id) ON DELETE CASCADE |
| label | varchar | NULL (mô tả ngắn, ví dụ "24 frames default") |
| is_default | boolean | NOT NULL, default `false` |
| created_at | datetime | NOT NULL, default now() |
| updated_at | datetime | NOT NULL, auto update |

### spin_frames
| Column | Type | Constraints/Notes |
|--------|------|-------------------|
| id | uuid | PK |
| spin_set_id | uuid | FK → spin_sets(id) ON DELETE CASCADE |
| frame_index | integer | NOT NULL, 0-based, liên tục |
| file_path | text | NOT NULL |
| thumbnail_path | text | NULL |
| created_at | datetime | NOT NULL, default now() |
| updated_at | datetime | NOT NULL, auto update |

### ai_item_drafts
| Column | Type | Constraints/Notes |
|--------|------|-------------------|
| id | uuid | PK |
| images_json | text | NOT NULL (JSON string danh sách image paths) |
| extracted_text | text | NULL (text trích xuất từ ảnh) |
| ai_json | text | NOT NULL (JSON string dữ liệu item do AI phân tích) |
| confidence_json | text | NULL (JSON string confidence scores) |
| status | varchar | NOT NULL, default `PENDING`, values: `PENDING` \| `CONFIRMED` \| `REJECTED` |
| created_at | datetime | NOT NULL, default now() |
| updated_at | datetime | NOT NULL, auto update |

## Ràng buộc bắt buộc
- `(spin_set_id, frame_index)` UNIQUE
- Spin set default: UNIQUE (item_id) WHERE is_default = true
- Item soft delete: mọi query business phải filter `deleted_at IS NULL`
- Khi xóa ảnh/frames, đảm bảo cập nhật order/index liên tục và cover/default hợp lệ

## Index đề xuất
- `shops(is_active)` – filter active shops
- `user_shop_roles(user_id)` – lookup user's assigned shops
- `items(shop_id)` – tenant isolation lookup
- `items(status)` – lọc theo trạng thái kho
- `items(created_at)` – sort danh sách
- `items(deleted_at)` – filter soft delete
- `items(car_brand)` – filter theo hãng xe
- `items(model_brand)` – filter theo hãng mô hình
- `items(condition)` – filter theo tình trạng
- `item_images(item_id, display_order)` – render gallery
- `spin_frames(spin_set_id, frame_index)` – tải spinner tuần tự

## Nguyên tắc migration
- Không chỉnh sửa migration đã apply ở bất kỳ môi trường nào.
- Khi cần đổi schema: tạo migration mới thay vì sửa file migration cũ.
- Nếu phát hiện checksum cũ đã được apply ở môi trường bất kỳ, revert migration file về đúng blob đã apply trước khi rollout migration mới.
