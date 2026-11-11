## 2024-05-24 - Prevent unnecessary re-renders of MarksheetTemplate
**Learning:** Using `React.memo` with a custom comparator on complex map-rendered list components (like `MarksheetTemplate` rendered in bulk) is ineffective if inline fallback objects (e.g., `{sports:'A'}`) continuously recreate object references, breaking shallow equality.
**Action:** Always extract static defaults outside the component scope when using them as prop fallbacks to maintain referential equality.
