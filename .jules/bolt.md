## 2026-05-09 - Memoizing Hidden Print Containers
**Learning:** In this application, elements hidden via CSS (like print containers with `display: none`) still execute full React render cycles. Heavy computations or loops inside them must be strongly memoized to prevent application-wide input lag on unrelated state changes.
**Action:** When modifying `app/page.tsx`, ensure complex hidden print containers heavily utilize `useMemo`.
