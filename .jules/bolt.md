
## 2026-10-11 - Optimize Bulk Print MarksheetTemplate Rendering
**Learning:** Passing inline fallback objects (e.g., `student={data || {}}`) or newly created arrays (e.g., `subjects={getClassSubjects(...)}`) in mapped lists completely defeats `React.memo` shallow comparison.
**Action:** Extract static defaults (`defaultStudent`) outside the component and use custom `arePropsEqual` comparators for arrays when parent state changes frequently.
