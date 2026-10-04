## 2024-10-04 - React.memo and Inline Prop Fallbacks
**Learning:** In heavily mapped components like MarksheetTemplate inside bulk print containers, providing inline object fallbacks (like `|| {}`) defeats `React.memo`'s shallow equality check, leading to severe O(N) re-renders when the parent's unrelated state updates.
**Action:** Extract static fallback objects (e.g., `const defaultStudent = {}`) outside the component scope and wrap the heavily rendered component with `React.memo()`.
