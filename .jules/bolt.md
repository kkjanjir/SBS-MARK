## 2024-11-02 - Unoptimized List Rendering in React
**Learning:** Found that \`MarksheetTemplate\` is used inside a map function for bulk printing without being memoized. This causes severe re-rendering bottlenecks, especially when typing in any parent component input if the class list is large.
**Action:** Always wrap heavy child components rendered inside loops with \`React.memo\`, particularly in components like Dashboards or Report Generators where large data mapping occurs. Default objects passed as props should be referentially stable.
