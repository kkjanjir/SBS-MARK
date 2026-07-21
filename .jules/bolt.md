## 2026-07-21 - Component Memoization with Fallback Properties
**Learning:** In heavily mapped list rendering (like printing multiple bulk items), `React.memo()` is often bypassed when parents pass inline fallback props like `{...} || {}`. These objects fail shallow equality checks and cause severe re-renders in large loops.
**Action:** Always extract default objects out of component bodies to ensure a stable reference, enabling proper `React.memo` functionality and drastically reducing unnecessary renders across bulk operations.
