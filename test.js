const fs = require('fs');
const content = fs.readFileSync('app/page.tsx', 'utf8');
if(content.includes('const classFilteredStudents = useMemo(') && content.includes('const searchedStudents = useMemo(')) {
  console.log('Test passed. Both memoizations exist in the code.');
} else {
  console.log('Test failed.');
}
