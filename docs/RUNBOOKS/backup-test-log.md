# Backup restore-test log

Append-only log of quarterly backup restore tests, per the checklist in [`backup.md`](backup.md) section *Test restore*.

**Rule:** mỗi lần chạy checklist quarterly, append 1 entry. Không xoá entry cũ — lịch sử pass/fail là evidence cho audit + cho biết backup có ổn định không.

## Template

```
## YYYY-MM-DD — <Tester name>

- Target: <R2 | USB | both>
- Snapshot ID: <restic snapshot id>
- Source dir count: <find ... | wc -l>
- Restored dir count: <find ... | wc -l>
- Sample diff (5 file random): <PASS | FAIL — details>
- Duration: <minutes>
- Notes: <any anomaly, missing file, performance issue>
- Status: ✅ PASS | ❌ FAIL — action required
```

## History

_Chưa có lần test nào. Lần đầu chạy checklist sau khi backup setup theo `backup.md`._
