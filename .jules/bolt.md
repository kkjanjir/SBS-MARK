
## 2024-06-25 - Prevent O(N) re-renders in print loops with React.memo
**Learning:** In this application, elements hidden via CSS (like print containers with `display: none`) still execute full React render cycles. Mapping over a large array of complex components (like `MarksheetTemplate` inside `#print-bulk-container`) without memoization causes severe O(N) recalculations on every minor state change, leading to input lag in the unrelated dashboard.
**Action:** Always wrap heavily-used, complex functional components like `MarksheetTemplate` with `React.memo()` to shallow-compare props and prevent unnecessary deep render trees during mapping operations. Ensure to apply this memoization properly by passing referentially stable props.
