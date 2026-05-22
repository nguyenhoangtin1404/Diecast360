# INDEX MASTER — Diecast360 Project Documentation

---
**Version:** 1.0  
**Ngày tạo:** 2026-05-22  
**Người tạo:** Nguyễn Hoàng Tin (PM / Tech Lead)  
**Dự án:** Diecast360  
**Mô tả dự án:** Web app quản lý và bán mô hình xe diecast tỉ lệ 1:64 — hỗ trợ catalog công khai, viewer 360°, pre-order, loyalty points, social selling Facebook, và AI tạo mô tả sản phẩm.  
**Thời gian:** 10/2025 – hiện tại (05/2026)  
**Quy mô team:** 10 người

---

## Mục lục nhanh

| Nhóm | Tài liệu | File |
|------|----------|------|
| [Nhóm 1 – PM/PMO](#nhóm-1--tài-liệu-quản-lý-dự-án-pmmo) | 6 tài liệu | `group1-pm/` |
| [Nhóm 2 – Sản phẩm](#nhóm-2--tài-liệu-sản-phẩm-po--ba) | 8 tài liệu | `group2-product/` |
| [Nhóm 3 – Kỹ thuật](#nhóm-3--tài-liệu-kỹ-thuật-tech-lead--architect) | 8 tài liệu | `group3-technical/` |
| [Nhóm 4 – Thiết kế](#nhóm-4--tài-liệu-thiết-kế-uiux-designer) | 3 tài liệu | `group4-design/` |
| [Nhóm 5 – Dev/DevOps](#nhóm-5--tài-liệu-phát-triển--vận-hành-dev--devops) | 5 tài liệu | `group5-devops/` |
| [Nhóm 6 – QA/QC](#nhóm-6--tài-liệu-kiểm-thử-qaqc) | 4 tài liệu | `group6-qa/` |
| [Nhóm 7 – Bàn giao](#nhóm-7--tài-liệu-bàn-giao--vận-hành) | 6 tài liệu | `group7-handover/` |
| **Tổng** | **40 tài liệu** | |

---

## Nhóm 1 — Tài liệu Quản lý Dự án (PM/PMO)

| # | Tên tài liệu | Mục đích | Người chịu trách nhiệm | Trạng thái | File |
|---|-------------|----------|------------------------|-----------|------|
| 01 | **Project Charter** | Điều lệ dự án — mục tiêu, phạm vi, stakeholder, KPI, milestones chính | PM (Nguyễn Hoàng Tin) | ✅ Hoàn thành | [01_project_charter.md](group1-pm/01_project_charter.md) |
| 02 | **Project Plan / Roadmap** | Lộ trình chi tiết 18 sprint theo 3 phase, timeline, dependencies | PM | ✅ Hoàn thành | [02_project_plan_roadmap.md](group1-pm/02_project_plan_roadmap.md) |
| 03 | **Risk Register** | Đánh giá 15+ rủi ro — likelihood, impact, mitigation | PM + Tech Lead | ✅ Hoàn thành | [03_risk_register.md](group1-pm/03_risk_register.md) |
| 04 | **RACI Matrix** | Ma trận phân công trách nhiệm toàn bộ 10 thành viên | PM | ✅ Hoàn thành | [04_raci_matrix.md](group1-pm/04_raci_matrix.md) |
| 05 | **Meeting Minutes Template** | Mẫu biên bản họp chuẩn kèm ví dụ Sprint Planning | PM | ✅ Hoàn thành | [05_meeting_minutes_template.md](group1-pm/05_meeting_minutes_template.md) |
| 06 | **Status Report Template** | Mẫu báo cáo tiến độ hàng tuần (RAG status) | PM | ✅ Hoàn thành | [06_status_report_template.md](group1-pm/06_status_report_template.md) |

---

## Nhóm 2 — Tài liệu Sản phẩm (PO / BA)

| # | Tên tài liệu | Mục đích | Người chịu trách nhiệm | Trạng thái | File |
|---|-------------|----------|------------------------|-----------|------|
| 07 | **Product Vision & Scope** | Vision, mission, target users, in/out scope, success metrics | BA/PO | ✅ Hoàn thành | [07_product_vision_scope.md](group2-product/07_product_vision_scope.md) |
| 08 | **Stakeholder Analysis** | Phân tích stakeholder, power/interest matrix, engagement strategy | PM + BA/PO | ✅ Hoàn thành | [08_stakeholder_analysis.md](group2-product/08_stakeholder_analysis.md) |
| 09 | **Business Requirements (BRD)** | 30+ business requirements đầy đủ từng nghiệp vụ | BA/PO | ✅ Hoàn thành | [09_brd_business_requirements.md](group2-product/09_brd_business_requirements.md) |
| 10 | **Functional Requirements (FRS)** | 80+ functional requirements với acceptance criteria | BA/PO + Tech Lead | ✅ Hoàn thành | [10_frs_functional_requirements.md](group2-product/10_frs_functional_requirements.md) |
| 11 | **User Story Map** | 10 Epic → Stories → Tasks toàn bộ product | BA/PO | ✅ Hoàn thành | [11_user_story_map.md](group2-product/11_user_story_map.md) |
| 12 | **Product Backlog** | 50+ user stories với story points, acceptance criteria, sprint | BA/PO | ✅ Hoàn thành | [12_product_backlog.md](group2-product/12_product_backlog.md) |
| 13 | **Use Case Descriptions** | 15 use cases chi tiết với main/alt/exception flows | BA/PO + Tech Lead | ✅ Hoàn thành | [13_use_case_descriptions.md](group2-product/13_use_case_descriptions.md) |
| 14 | **User Journey Map** | 3 personas × journey (Shop Owner, Staff, Customer) | BA/PO + UI/UX | ✅ Hoàn thành | [14_user_journey_map.md](group2-product/14_user_journey_map.md) |

---

## Nhóm 3 — Tài liệu Kỹ thuật (Tech Lead / Architect)

| # | Tên tài liệu | Mục đích | Người chịu trách nhiệm | Trạng thái | File |
|---|-------------|----------|------------------------|-----------|------|
| 15 | **System Architecture** | Kiến trúc tổng thể — component, deployment, data flow, security | Tech Lead | ✅ Hoàn thành | [15_system_architecture.md](group3-technical/15_system_architecture.md) |
| 16 | **Technical Specification (TSD)** | Chi tiết kỹ thuật từng module, pipeline, caching, security impl | Tech Lead | ✅ Hoàn thành | [16_technical_specification.md](group3-technical/16_technical_specification.md) |
| 17 | **Database Design** | ERD, data dictionary, indexes, migration principles | Tech Lead + Backend Dev | ✅ Hoàn thành | [17_database_design.md](group3-technical/17_database_design.md) |
| 18 | **API Documentation** | Tất cả endpoints, request/response, error codes | Backend Dev | ✅ Hoàn thành | [18_api_documentation.md](group3-technical/18_api_documentation.md) |
| 19 | **Sequence Diagrams** | 10 luồng xử lý chính (auth, upload, pre-order, AI, points...) | Tech Lead | ✅ Hoàn thành | [19_sequence_diagrams.md](group3-technical/19_sequence_diagrams.md) |
| 20 | **Non-Functional Requirements (NFR)** | Performance, Security, Scalability, Availability targets | Tech Lead + PM | ✅ Hoàn thành | [20_non_functional_requirements.md](group3-technical/20_non_functional_requirements.md) |
| 21 | **Tech Stack Justification** | Lý do chọn từng công nghệ, trade-offs | Tech Lead | ✅ Hoàn thành | [21_tech_stack_justification.md](group3-technical/21_tech_stack_justification.md) |
| 22 | **Coding Standards & Conventions** | Backend/Frontend conventions, Git workflow, code review checklist | Tech Lead | ✅ Hoàn thành | [22_coding_standards.md](group3-technical/22_coding_standards.md) |

---

## Nhóm 4 — Tài liệu Thiết kế (UI/UX Designer)

| # | Tên tài liệu | Mục đích | Người chịu trách nhiệm | Trạng thái | File |
|---|-------------|----------|------------------------|-----------|------|
| 23 | **Design System** | Color palette, typography, component library, Tailwind specs | UI/UX Designer | ✅ Hoàn thành | [23_design_system.md](group4-design/23_design_system.md) |
| 24 | **Wireframe Descriptions** | Mô tả chi tiết layout từng màn hình Admin + Public | UI/UX Designer | ✅ Hoàn thành | [24_wireframe_descriptions.md](group4-design/24_wireframe_descriptions.md) |
| 25 | **UI/UX Style Guide** | Design principles, patterns, accessibility, micro-interactions | UI/UX Designer | ✅ Hoàn thành | [25_ui_ux_style_guide.md](group4-design/25_ui_ux_style_guide.md) |

---

## Nhóm 5 — Tài liệu Phát triển & Vận hành (Dev / DevOps)

| # | Tên tài liệu | Mục đích | Người chịu trách nhiệm | Trạng thái | File |
|---|-------------|----------|------------------------|-----------|------|
| 26 | **Dev Environment Setup** | Hướng dẫn cài đặt môi trường dev từ A→Z | Tech Lead + DevOps | ✅ Hoàn thành | [26_dev_environment_setup.md](group5-devops/26_dev_environment_setup.md) |
| 27 | **Git Branching Strategy** | GitFlow, commit conventions, PR template, branch protection | Tech Lead | ✅ Hoàn thành | [27_git_branching_strategy.md](group5-devops/27_git_branching_strategy.md) |
| 28 | **CI/CD Pipeline** | GitHub Actions workflows, build/test/deploy pipeline | DevOps | ✅ Hoàn thành | [28_cicd_pipeline.md](group5-devops/28_cicd_pipeline.md) |
| 29 | **Deployment Guide** | Step-by-step cho dev/staging/production | DevOps | ✅ Hoàn thành | [29_deployment_guide.md](group5-devops/29_deployment_guide.md) |
| 30 | **Environment Config Guide** | .env reference, secrets management, production config | DevOps + Tech Lead | ✅ Hoàn thành | [30_environment_config_guide.md](group5-devops/30_environment_config_guide.md) |

---

## Nhóm 6 — Tài liệu Kiểm thử (QA/QC)

| # | Tên tài liệu | Mục đích | Người chịu trách nhiệm | Trạng thái | File |
|---|-------------|----------|------------------------|-----------|------|
| 31 | **Test Plan** | Kế hoạch kiểm thử — scope, strategy, tools, schedule | QA Lead | ✅ Hoàn thành | [31_test_plan.md](group6-qa/31_test_plan.md) |
| 32 | **Test Cases** | 100+ test cases chi tiết cho mọi tính năng | QA Lead | ✅ Hoàn thành | [32_test_cases.md](group6-qa/32_test_cases.md) |
| 33 | **Bug Report Template** | Template báo cáo lỗi + 3 ví dụ thực tế | QA Lead | ✅ Hoàn thành | [33_bug_report_template.md](group6-qa/33_bug_report_template.md) |
| 34 | **UAT Plan & Checklist** | Kế hoạch user acceptance testing + checklist sign-off | QA Lead + BA/PO | ✅ Hoàn thành | [34_uat_plan_checklist.md](group6-qa/34_uat_plan_checklist.md) |

---

## Nhóm 7 — Tài liệu Bàn giao & Vận hành

| # | Tên tài liệu | Mục đích | Người chịu trách nhiệm | Trạng thái | File |
|---|-------------|----------|------------------------|-----------|------|
| 35 | **System Admin Guide** | Hướng dẫn quản trị hệ thống — PM2, DB, storage, monitoring | DevOps + Tech Lead | ✅ Hoàn thành | [35_system_admin_guide.md](group7-handover/35_system_admin_guide.md) |
| 36 | **User Manual** | Hướng dẫn sử dụng cho Shop Owner/Admin | BA/PO + UI/UX | ✅ Hoàn thành | [36_user_manual.md](group7-handover/36_user_manual.md) |
| 37 | **Maintenance & Support Runbook** | Runbook vận hành — routine tasks, incident playbooks | DevOps | ✅ Hoàn thành | [37_maintenance_runbook.md](group7-handover/37_maintenance_runbook.md) |
| 38 | **Handover Document** | Tài liệu bàn giao cuối dự án — deliverables, access, sign-off | PM + Tech Lead | ✅ Hoàn thành | [38_handover_document.md](group7-handover/38_handover_document.md) |
| 39 | **Post-Mortem Template** | Template lessons learned + 3 ví dụ thực tế từ dự án | PM | ✅ Hoàn thành | [39_post_mortem_template.md](group7-handover/39_post_mortem_template.md) |
| 40 | **SLA Document** | Service Level Agreement — uptime, response time, incident SLO | PM + Tech Lead | ✅ Hoàn thành | [40_sla_document.md](group7-handover/40_sla_document.md) |

---

## Tổng hợp thống kê

| Nhóm | Số tài liệu | Người chịu trách nhiệm chính |
|------|------------|------------------------------|
| PM/PMO | 6 | PM |
| Sản phẩm | 8 | BA/PO |
| Kỹ thuật | 8 | Tech Lead |
| Thiết kế | 3 | UI/UX Designer |
| Dev/DevOps | 5 | DevOps + Tech Lead |
| QA/QC | 4 | QA Lead |
| Bàn giao | 6 | PM + Tech Lead |
| **Tổng** | **40** | |

---

## Cách sử dụng bộ tài liệu này

### Onboarding thành viên mới
1. Đọc `07_product_vision_scope.md` → hiểu sản phẩm
2. Đọc `15_system_architecture.md` → hiểu kiến trúc
3. Đọc `26_dev_environment_setup.md` → setup môi trường
4. Đọc `22_coding_standards.md` → convention

### Khi bắt đầu Sprint
1. Xem `12_product_backlog.md` → sprint items
2. Dùng `05_meeting_minutes_template.md` → sprint planning meeting
3. Update `06_status_report_template.md` → weekly status

### Khi fix bug
1. Dùng `33_bug_report_template.md` → report bug
2. Tham chiếu `32_test_cases.md` → tìm test case liên quan
3. Đọc `19_sequence_diagrams.md` → hiểu flow

### Khi deploy
1. Theo `29_deployment_guide.md` → deployment steps
2. Kiểm tra `30_environment_config_guide.md` → env variables
3. Chạy `28_cicd_pipeline.md` → CI/CD workflow

### Khi bàn giao dự án
1. Dùng `38_handover_document.md` → checklist bàn giao
2. Dùng `39_post_mortem_template.md` → lessons learned
3. Ký `40_sla_document.md` → SLA agreement

---

## Lịch sử cập nhật

| Ngày | Phiên bản | Thay đổi | Người thực hiện |
|------|----------|---------|----------------|
| 2026-05-22 | 1.0 | Tạo bộ tài liệu đầy đủ (40 tài liệu) | Nguyễn Hoàng Tin |

---

> **Lưu ý:** Mọi thay đổi về API, database schema, business rules phải đồng bộ với các tài liệu liên quan. Xem `CLAUDE.md` tại root repo để biết tài liệu nào cần update khi thay đổi code.
