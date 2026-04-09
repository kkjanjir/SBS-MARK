const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

// Replace classFilteredStudents definition
code = code.replace(
  'const classFilteredStudents = dbStudents.filter(s => s.class_name === activeClass);',
  `// ⚡ Bolt: Memoized class students filtering to prevent O(N) array operations on every render
  const classFilteredStudents = useMemo(() => {
    return dbStudents.filter(s => s.class_name === activeClass);
  }, [dbStudents, activeClass]);

  // ⚡ Bolt: Memoized search filtering to prevent re-filtering the entire array during typing or other state changes
  const searchedStudents = useMemo(() => {
    const query = searchQuery.toUpperCase();
    if (!query) return classFilteredStudents;
    return classFilteredStudents.filter(s => (s.student_name || '').toUpperCase().includes(query));
  }, [classFilteredStudents, searchQuery]);`
);

// Replace triggerBulkPrint classStudents with classFilteredStudents
code = code.replace(
  'const classStudents = dbStudents.filter(s => s.class_name === activeClass);\n    if (classStudents.length === 0) return alert("No students in this class to print!");',
  `const classStudents = classFilteredStudents;\n    if (classStudents.length === 0) return alert("No students in this class to print!");`
);

// Replace mapping with searchedStudents
code = code.replace(
  'classFilteredStudents.filter(s => (s.student_name || \'\').toUpperCase().includes(searchQuery.toUpperCase())).map((s) => (',
  'searchedStudents.map((s) => ('
);

fs.writeFileSync('app/page.tsx', code);
