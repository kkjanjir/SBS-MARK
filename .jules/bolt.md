## 2024-05-18 - Marksheet App Performance Issue
**Learning:** Found an expensive render cycle in a React list map where inline object creation for `coScholastic` defaults (`{sports:'A',art:'A',music:'A',discipline:'A'}`) defeats referential equality checks.
**Action:** Replace inline object creation with a static default object outside the render loop to maintain referential equality across renders, allowing React.memo to work effectively.
