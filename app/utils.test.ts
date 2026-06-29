import { calculateClassRank } from './utils';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

const mockStudents = [
  { class_name: '10A', extra_data: { total: 100 } },
  { class_name: '10A', extra_data: { total: 80 } },
  { class_name: '10B', extra_data: { total: 95 } },
];

try {
  console.log('Running tests for calculateClassRank...\n');

  // 1. Standard ranking
  assert(calculateClassRank(90, '10A', mockStudents) === '2', 'Should be rank 2 for 90 in 10A (100, 90, 80)');

  // 2. Tie handling
  const tieStudents = [
    { class_name: '10A', extra_data: { total: 100 } },
    { class_name: '10A', extra_data: { total: 100 } },
    { class_name: '10A', extra_data: { total: 80 } },
  ];
  assert(calculateClassRank(100, '10A', tieStudents) === '1', 'Should be rank 1 for 100 with ties');
  assert(calculateClassRank(80, '10A', tieStudents) === '3', 'Should be rank 3 for 80 when two others have 100');

  // 3. Zero total
  assert(calculateClassRank(0, '10A', mockStudents) === '', 'Should return empty string for total 0');

  // 4. Empty student list
  assert(calculateClassRank(100, '10A', []) === '1', 'Should return rank 1 for empty student list');

  // 5. Filtering by class
  assert(calculateClassRank(90, '10B', mockStudents) === '2', 'Should be rank 2 for 90 in 10B (95, 90)');

  console.log('\nAll tests passed!');
} catch (error: any) {
  console.error('\nTest failed!');
  console.error(error.message);
  // @ts-ignore
  if (typeof process !== 'undefined') process.exit(1);
}
