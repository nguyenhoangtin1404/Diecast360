# Requirements: Diecast360

**Defined:** 2026-03-04
**Core Value:** A seller can publish a diecast listing with complete media and ready-to-post content in one flow.

## v1 Requirements

### Inventory

- [x] **INVT-01**: User can create, edit, archive, and list diecast items with status transitions.
- [x] **INVT-02**: User can manage brand/model/scale metadata for item classification.

### Media

- [x] **MEDI-01**: User can upload multiple item images, set a cover image, and reorder images.
- [x] **MEDI-02**: User can create spinner sets and upload ordered spinner frames.
- [x] **MEDI-03**: User can view spinner on item detail with gallery fallback.

### Public Catalog

- [x] **PBLC-01**: Visitor can browse public items and open item detail pages.
- [x] **PBLC-02**: Public item detail shows cover/status and spinner when available.
- [x] **PBLC-03**: Public catalog and item URLs resolve to a single shop tenant (slug or id); visitors cannot infer or list other shops' inventory from public endpoints when shop context is set.

### AI and Social

- [x] **AISO-01**: User can generate SEO-friendly product description from item data.
- [x] **AISO-02**: User can generate Facebook-ready caption and copy post link.
- [x] **AISO-03**: User can auto-create draft item data from uploaded image analysis.

### Platform Hardening

- [x] **PLAT-01**: Project can run via Docker Compose including database service.
- [x] **PLAT-02**: CI pipeline runs lint, test, and build for backend and frontend.
- [x] **PLAT-03**: Admin can post to Facebook via Graph API and capture posting result.

## v2 Requirements

### Multi-Tenant Shop

- [x] **MULT-01**: System supports multiple isolated shop tenants with distinct inventory, media, and settings.
- [x] **MULT-02**: Admin users can be assigned to one or more shops with role-based access.
- [x] **MULT-03**: API requests are scoped to the active tenant via header or token context.
- [x] **MULT-04**: Platform operators are distinguished from per-shop roles; tenant staff roles support read vs write separation without breaking isolation.

### UX and Operations

- [x] **RESP-01**: Admin and public pages are fully usable on mobile without layout breakage.
- [x] **ATTR-01**: Product stores inventory quantity with non-negative validation.
- [x] **ATTR-02**: Product supports flexible custom attributes (key-value metadata).

- [ ] **STOK-01**: Inventory is transaction-based with full audit trail.
- [ ] **PORD-01**: Pre-order lifecycle is managed with explicit status transitions.
  - [ ] **PORD-01a**: Public mobile page `Mo hinh Dat truoc` hien thi danh sach pre-order dang mo voi card baseline (badge, countdown, price, CTA, bottom nav).
  - [ ] **PORD-01b**: Public mobile page `Don hang cua toi` hien thi danh sach don va trang thai (dang cho/da ve/da thanh toan) kem CTA theo tung don.
  - [ ] **PORD-01c**: Admin mobile page `Tao Pre-Order Moi` cho phep tao campaign voi form day du truong du lieu va validate.
  - [ ] **PORD-01d**: Admin mobile page `Quan ly Pre-order` hien thi tong quan campaign, danh sach nguoi tham gia, va thao tac quan ly co ban.
- [ ] **RPTG-01**: Admin can view KPI dashboard with time-range filtering.
- [x] **MEMB-01**: Membership tiers are managed for customer groups.
- [x] **MEMB-02**: Points ledger records all earn/redeem/adjust events.
- [ ] **QATE-01**: Playwright phase-1 smoke suite runs in local and CI.
- [ ] **QATE-02**: Playwright phase-2 advanced coverage is enforced as release gate.

### Advanced Selling

- **SELL-01**: User can schedule social posts in advance.
- **SELL-02**: User can aggregate comment and inbox signals into one dashboard.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Native iOS/Android app | Web delivery is current priority |
| In-app payment/checkout | Current scope is catalog and social selling only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INVT-01 | Phase 1 | Complete (2026-03-05) |
| INVT-02 | Phase 1 | Complete (2026-03-05) |
| MEDI-01 | Phase 2 | Complete (2026-03-10) |
| MEDI-02 | Phase 2 | Complete (2026-03-10) |
| MEDI-03 | Phase 3 | Complete (2026-03-10) |
| PBLC-01 | Phase 3 | Complete (2026-03-10) |
| PBLC-02 | Phase 3 | Complete (2026-03-10) |
| PBLC-03 | Phase 16 | Complete (2026-04-30) |
| AISO-01 | Phase 4 | Complete (2026-03-13) |
| AISO-02 | Phase 4 | Complete (2026-03-13) |
| AISO-03 | Phase 4 | Complete (2026-03-13) |
| PLAT-01 | Phase 5 | Complete (2026-03-16) |
| PLAT-02 | Phase 5 | Complete (2026-03-16) |
| PLAT-03 | Phase 5 | Complete (2026-03-16) |
| RESP-01 | Phase 6 | Complete (2026-03-20) |
| ATTR-01 | Phase 7 | Complete (2026-04-01) — API, DB, admin UI |
| ATTR-02 | Phase 7 | Complete (2026-04-01) — API, DB, admin UI |
| MULT-01 | Phase 14 | Complete (2026-03-23) |
| MULT-02 | Phase 14 | Complete (2026-03-23) |
| MULT-03 | Phase 14 | Complete (2026-03-23) |
| MULT-04 | Phase 15 | Complete |
| STOK-01 | Phase 8 | Pending |
| PORD-01 | Phase 9 | Pending |
| PORD-01a | Phase 9 | Pending |
| PORD-01b | Phase 9 | Pending |
| PORD-01c | Phase 9 | Pending |
| PORD-01d | Phase 9 | Pending |
| RPTG-01 | Phase 10 | Pending |
| MEMB-01 | Phase 11 | Complete (2026-04-23) |
| MEMB-02 | Phase 11 | Complete (2026-04-23) |
| QATE-01 | Phase 12 | Pending |
| QATE-02 | Phase 13 | Pending |

**Coverage:**
- v1 requirements: 13 total
- v2 actionable requirements: 11 total
- Mapped to phases: 24
- Unmapped: 0

---
*Requirements defined: 2026-03-04*
*Last updated: 2026-04-30 — PBLC-03 closed with Phase 16*
