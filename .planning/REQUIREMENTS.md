# Requirements: Diecast360

**Defined:** 2026-03-04
**Core Value:** A seller can publish a diecast listing with complete media and ready-to-post content in one flow.

## v1 Requirements

### Inventory

- [x] **INVT-01**: User can create, edit, archive, and list diecast items with status transitions.
- [x] **INVT-02**: User can manage brand/model/scale metadata for item classification.

### Media

- [ ] **MEDI-01**: User can upload multiple item images, set a cover image, and reorder images.
- [ ] **MEDI-02**: User can create spinner sets and upload ordered spinner frames.
- [ ] **MEDI-03**: User can view spinner on item detail with gallery fallback.

### Public Catalog

- [ ] **PBLC-01**: Visitor can browse public items and open item detail pages.
- [ ] **PBLC-02**: Public item detail shows cover/status and spinner when available.

### AI and Social

- [ ] **AISO-01**: User can generate SEO-friendly product description from item data.
- [ ] **AISO-02**: User can generate Facebook-ready caption and copy post link.
- [ ] **AISO-03**: User can auto-create draft item data from uploaded image analysis.

### Platform Hardening

- [ ] **PLAT-01**: Project can run via Docker Compose including database service.
- [ ] **PLAT-02**: CI pipeline runs lint, test, and build for backend and frontend.
- [ ] **PLAT-03**: Admin can post to Facebook via Graph API and capture posting result.

## v2 Requirements

### UX and Operations

- [ ] **RESP-01**: Admin and public pages are fully usable on mobile without layout breakage.
- [ ] **ATTR-01**: Product stores inventory quantity with non-negative validation.
- [ ] **ATTR-02**: Product supports flexible custom attributes (key-value metadata).
- [ ] **STOK-01**: Inventory is transaction-based with full audit trail.
- [ ] **PORD-01**: Pre-order lifecycle is managed with explicit status transitions.
- [ ] **RPTG-01**: Admin can view KPI dashboard with time-range filtering.
- [ ] **MEMB-01**: Membership tiers are managed for customer groups.
- [ ] **MEMB-02**: Points ledger records all earn/redeem/adjust events.
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
| MEDI-01 | Phase 2 | Pending |
| MEDI-02 | Phase 2 | Pending |
| MEDI-03 | Phase 3 | Pending |
| PBLC-01 | Phase 3 | Pending |
| PBLC-02 | Phase 3 | Pending |
| AISO-01 | Phase 4 | Pending |
| AISO-02 | Phase 4 | Pending |
| AISO-03 | Phase 4 | Pending |
| PLAT-01 | Phase 5 | Pending |
| PLAT-02 | Phase 5 | Pending |
| PLAT-03 | Phase 5 | Pending |
| RESP-01 | Phase 6 | Pending |
| ATTR-01 | Phase 7 | Pending |
| ATTR-02 | Phase 7 | Pending |
| STOK-01 | Phase 8 | Pending |
| PORD-01 | Phase 9 | Pending |
| RPTG-01 | Phase 10 | Pending |
| MEMB-01 | Phase 11 | Pending |
| MEMB-02 | Phase 11 | Pending |
| QATE-01 | Phase 12 | Pending |
| QATE-02 | Phase 13 | Pending |

**Coverage:**
- v1 requirements: 13 total
- v2 actionable requirements: 10 total
- Mapped to phases: 23
- Unmapped: 0

---
*Requirements defined: 2026-03-04*
*Last updated: 2026-03-05 after Phase 1 execution*

