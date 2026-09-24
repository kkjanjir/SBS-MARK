## 2024-05-18 - React.memo and default props
**Learning:** Using inline defaults like `{}` breaks React.memo shallow comparison and causes heavy re-renders in large lists.
**Action:** Extract defaults to static constants outside the component scope.
