
## 2024-05-28 - Optimize Hidden Print Containers
**Learning:** Hidden print containers that map over large arrays can cause severe input lag if not memoized.
**Action:** Use useMemo to cache the rendered output of hidden containers and extract pure functions outside component scope.
