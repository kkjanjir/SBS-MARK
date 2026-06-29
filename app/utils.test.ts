import { getGrade, getDynamicSubjects, getCalculations } from './utils.ts';
import type { MarksState } from './utils.ts';
import assert from 'node:assert';
import { test, describe } from 'node:test';

describe('getGrade', () => {
  test('returns correct grades based on percentage', () => {
    assert.strictEqual(getGrade(95, 100), 'A1');
    assert.strictEqual(getGrade(85, 100), 'A2');
    assert.strictEqual(getGrade(75, 100), 'B1');
    assert.strictEqual(getGrade(65, 100), 'B2');
    assert.strictEqual(getGrade(55, 100), 'C1');
    assert.strictEqual(getGrade(45, 100), 'C2');
    assert.strictEqual(getGrade(35, 100), 'D');
    assert.strictEqual(getGrade(20, 100), 'E');
  });

  test('handles boundary cases', () => {
    assert.strictEqual(getGrade(91, 100), 'A1');
    assert.strictEqual(getGrade(90.9, 100), 'A2');
    assert.strictEqual(getGrade(33, 100), 'D');
    assert.strictEqual(getGrade(32.9, 100), 'E');
  });

  test('handles empty or invalid inputs', () => {
    assert.strictEqual(getGrade('', 100), '');
    // @ts-ignore
    assert.strictEqual(getGrade(null, 100), '');
    // @ts-ignore
    assert.strictEqual(getGrade(undefined, 100), '');
    assert.strictEqual(getGrade('NaN', 100), '');
  });
});

describe('getDynamicSubjects', () => {
  const fallback = ['MATH', 'SCIENCE'];

  test('returns fallback when mObj is empty', () => {
    assert.deepStrictEqual(getDynamicSubjects({}, fallback), fallback);
    assert.deepStrictEqual(getDynamicSubjects(null, fallback), fallback);
  });

  test('merges existing and new subjects correctly', () => {
    const mObj: MarksState = {
      'MATH': { t1: '10', t2: '20', t3: '30' },
      'ART': { t1: '10', t2: '20', t3: '30' }
    };
    assert.deepStrictEqual(getDynamicSubjects(mObj, fallback), ['MATH', 'ART']);
  });
});

describe('getCalculations', () => {
  const subjects = ['MATH', 'ENGLISH'];

  test('calculates totals correctly', () => {
    const marks: MarksState = {
      'MATH': { t1: '80', t2: '80', t3: '40' }, // 200
      'ENGLISH': { t1: '70', t2: '70', t3: '10' } // 150
    };
    const result = getCalculations(marks, subjects);
    assert.strictEqual(result.grandTotal, 350);
    assert.strictEqual(result.maxMarks, 400);
    assert.strictEqual(result.percentage, '87.5');
    assert.strictEqual(result.finalGrade, 'A2');
  });

  test('handles missing subjects in marks', () => {
    const marks: MarksState = {
      'MATH': { t1: '100', t2: '100', t3: '0' } // 200
    };
    const result = getCalculations(marks, subjects);
    assert.strictEqual(result.grandTotal, 200);
    assert.strictEqual(result.maxMarks, 400);
    assert.strictEqual(result.percentage, '50.0');
    assert.strictEqual(result.finalGrade, 'C2');
  });

  test('handles empty marks', () => {
    const result = getCalculations({}, subjects);
    assert.strictEqual(result.grandTotal, 0);
    assert.strictEqual(result.percentage, '0');
    assert.strictEqual(result.finalGrade, '');
  });

  test('handles null/undefined marks', () => {
    const result = getCalculations(null, subjects);
    assert.strictEqual(result.grandTotal, 0);
    assert.strictEqual(result.percentage, '0');
  });
});
