## 2024-05-24 - React.memo with Custom Comparator on MarksheetTemplate
**Learning:** Heavy components like `MarksheetTemplate` rendered in large lists (e.g., bulk printing) suffer from continuous re-rendering due to array props (`subjectsList`) defeating React.memo's shallow comparison.
**Action:** Use `React.memo` with a custom `arePropsEqual` comparator that properly checks deep nested structures or arrays (with optional chaining) to prevent these massive, unnecessary DOM recalculations.
