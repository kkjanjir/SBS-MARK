
## $(date +%Y-%m-%d) - Memoizing bulk print containers
**Learning:** Elements hidden via CSS (like print containers) still execute full React render cycles. If they contain heavy array maps (like mapping over all students for bulk printing), this causes severe input lag on unrelated state changes. Wrapping the mapping output in a top-level `useMemo` eliminates this overhead.
**Action:** Always memoize the rendering of hidden off-screen elements that perform O(N) map operations, and define the `useMemo` at the top level (above any early returns) to obey the Rules of Hooks.
