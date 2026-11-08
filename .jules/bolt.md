## 2025-02-12 - Prevent unnecessary re-renders of MarksheetTemplate in bulk print
**Learning:** Returning new array instances from helper functions (like `getClassSubjects`) and using inline fallback objects (like `{}`) defeats `React.memo`'s shallow equality check, causing massive unnecessary re-renders in bulk print mapping during simple input state changes.
**Action:** Extract default objects outside the component to guarantee referential stability and utilize a custom `arePropsEqual` comparator in `React.memo` to safely handle dynamic arrays that cannot be easily memoized at their source.
