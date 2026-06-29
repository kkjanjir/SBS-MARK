## 2025-05-22 - O(1) Student Lookup in AI Draft Application

**Learning:** Repeatedly searching through a large array (dbStudents) using multiple string comparisons in a tight loop or frequent UI action (applyAiDraftRow) leads to O(N) performance degradation as the database grows. In this React app, even if the action is triggered by a button click, the latency becomes noticeable with thousands of records.

**Action:** Use 'useMemo' to build indexing Maps (name-to-index and roll-to-index) whenever the underlying data changes. This transforms the search complexity from O(N) to O(1). To maintain 'Array.prototype.find' equivalence (first match), store indices in the Maps and use the minimum index when multiple fields match.
