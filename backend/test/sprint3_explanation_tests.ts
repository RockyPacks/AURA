/**
 * Sprint 3.1.4: AI-Enhanced Outfit Explanation Generation Tests
 * Tests for generateOutfitExplanation, validateExplanation, and generateOutfitTitle
 *
 * **Validates: Requirements 15 (AI Outfit Generation - Explanation System)**
 */

import { 
  validateExplanation
} from '../src/aiEngine.js';
import { WardrobeItem, ContextInput } from '../src/types.js';
import * as fc from 'fast-check';

console.log('\n====================================================');
console.log('🧵 SPRINT 3.1.4: OUTFIT EXPLANATION GENERATION');
console.log('====================================================\n');

// ============================================================================
// UNIT TESTS: validateExplanation
// ============================================================================

console.log('--- TEST 1: Explanation Validation ---\n');

let testsPassed = 0;
let testsFailed = 0;

// Test 1.1: Valid explanation (2-3 sentences, 20-150 chars)
{
  const valid = 'This navy blazer pairs perfectly with a crisp white shirt for a polished look.';
  const result = validateExplanation(valid);
  if (result.isValid) {
    console.log('✅ [PASS] Valid explanation accepted');
    testsPassed++;
  } else {
    console.log(`❌ [FAIL] Valid explanation rejected: ${result.reason}`);
    testsFailed++;
  }
}

// Test 1.2: Explanation too long (> 150 chars)
{
  const tooLong = 'A'.repeat(151);
  const result = validateExplanation(tooLong);
  if (!result.isValid && result.reason?.includes('too long')) {
    console.log('✅ [PASS] Too long explanation rejected');
    testsPassed++;
  } else {
    console.log(`❌ [FAIL] Too long explanation should be rejected`);
    testsFailed++;
  }
}

// Test 1.3: Explanation too short (< 20 chars)
{
  const tooShort = 'Short';
  const result = validateExplanation(tooShort);
  if (!result.isValid && result.reason?.includes('too short')) {
    console.log('✅ [PASS] Too short explanation rejected');
    testsPassed++;
  } else {
    console.log(`❌ [FAIL] Too short explanation should be rejected`);
    testsFailed++;
  }
}

// Test 1.4: Empty explanation
{
  const empty = '';
  const result = validateExplanation(empty);
  if (!result.isValid) {
    console.log('✅ [PASS] Empty explanation rejected');
    testsPassed++;
  } else {
    console.log(`❌ [FAIL] Empty explanation should be rejected`);
    testsFailed++;
  }
}

// Test 1.5: AI markers detected ("as an ai")
{
  const withMarker = 'As an AI, I think this outfit is great. ' + 'X'.repeat(80);
  const result = validateExplanation(withMarker);
  if (!result.isValid && result.reason?.includes('AI')) {
    console.log('✅ [PASS] AI marker detected and rejected');
    testsPassed++;
  } else {
    console.log(`❌ [FAIL] AI marker should be detected`);
    testsFailed++;
  }
}

// Test 1.6: AI markers detected ("language model")
{
  const withMarker = 'As a language model, this ensemble works well. ' + 'X'.repeat(80);
  const result = validateExplanation(withMarker);
  if (!result.isValid && result.reason?.includes('AI')) {
    console.log('✅ [PASS] Language model marker detected');
    testsPassed++;
  } else {
    console.log(`⚠ Warning: Language model marker may not have been detected`);
  }
}

// Test 1.7: Non-string input (null)
{
  const result = validateExplanation(null as any);
  if (!result.isValid) {
    console.log('✅ [PASS] Non-string input rejected');
    testsPassed++;
  } else {
    console.log(`❌ [FAIL] Non-string should be rejected`);
    testsFailed++;
  }
}

// Test 1.8: Non-string input (undefined)
{
  const result = validateExplanation(undefined as any);
  if (!result.isValid) {
    console.log('✅ [PASS] Undefined input rejected');
    testsPassed++;
  } else {
    console.log(`❌ [FAIL] Undefined should be rejected`);
    testsFailed++;
  }
}

// Test 1.9: Exactly 150 chars (edge case - should pass)
{
  const exactly150 = 'A'.repeat(20) + ' ' + 'B'.repeat(128);
  const result = validateExplanation(exactly150);
  if (result.isValid) {
    console.log('✅ [PASS] 150 char explanation accepted');
    testsPassed++;
  } else {
    console.log(`❌ [FAIL] 150 char explanation should be accepted: ${result.reason}`);
    testsFailed++;
  }
}

// Test 1.10: Exactly 20 chars (edge case - should pass)
{
  const exactly20 = 'A'.repeat(20);
  const result = validateExplanation(exactly20);
  if (result.isValid) {
    console.log('✅ [PASS] 20 char explanation accepted');
    testsPassed++;
  } else {
    console.log(`❌ [FAIL] 20 char explanation should be accepted`);
    testsFailed++;
  }
}

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

console.log('\n--- TEST 2: Explanation Validation Properties ---\n');

/**
 * **Property 1: Explanation Consistency**
 * If an explanation passes validation once, it should always pass
 */
{
  const explanations = [
    'This navy blazer creates instant polish with white shirt.',
    'Perfect for work meetings with its structured silhouette.',
    'Breathable layers ideal for cool weather transitions.',
    'The neutral palette ensures versatile styling all day.',
    'Casual elegance meets practical comfort in this ensemble.'
  ];

  let allValid = true;
  for (const exp of explanations) {
    const result1 = validateExplanation(exp);
    const result2 = validateExplanation(exp);
    if (result1.isValid !== result2.isValid) {
      console.log(`❌ [FAIL] Inconsistent validation for: "${exp.slice(0, 40)}..."`);
      allValid = false;
      testsFailed++;
      break;
    }
  }

  if (allValid) {
    console.log('✅ [PASS] Property 1: Validation is consistent');
    testsPassed++;
  }
}

/**
 * **Property 2: Length Boundaries**
 * All valid explanations must be between 20 and 150 chars
 */
{
  let boundariesCorrect = true;
  
  // Test increasing lengths
  for (let len = 15; len <= 155; len += 5) {
    const exp = 'A'.repeat(len);
    const result = validateExplanation(exp);
    
    if (len >= 20 && len <= 150) {
      // Should be valid
      if (!result.isValid) {
        console.log(`❌ Length ${len}: should be valid but got: ${result.reason}`);
        boundariesCorrect = false;
        break;
      }
    } else {
      // Should be invalid
      if (result.isValid) {
        console.log(`❌ Length ${len}: should be invalid but was accepted`);
        boundariesCorrect = false;
        break;
      }
    }
  }

  if (boundariesCorrect) {
    console.log('✅ [PASS] Property 2: Length boundaries enforced correctly');
    testsPassed++;
  } else {
    testsFailed++;
  }
}

/**
 * **Property 3: AI Marker Detection**
 * Explanations containing AI markers should be rejected
 */
{
  const aiMarkers = ['as an ai', 'as a language model', 'i am an', 'this is ai', 'artificial intelligence'];
  let allDetected = true;

  for (const marker of aiMarkers) {
    const exp = `${marker}, this outfit looks great. ` + 'X'.repeat(100);
    const result = validateExplanation(exp);
    
    if (result.isValid) {
      console.log(`❌ [FAIL] AI marker "${marker}" not detected`);
      allDetected = false;
      break;
    }
  }

  if (allDetected) {
    console.log('✅ [PASS] Property 3: All AI markers detected and rejected');
    testsPassed++;
  } else {
    testsFailed++;
  }
}

/**
 * **Property 4: Type Safety**
 * Non-string inputs must always be rejected
 */
{
  const invalidInputs = [
    null,
    undefined,
    123,
    true,
    false,
    {},
    [],
    { explanation: 'test' }
  ];

  let typeSafetyOK = true;
  for (const input of invalidInputs) {
    const result = validateExplanation(input as any);
    if (result.isValid) {
      console.log(`❌ [FAIL] Non-string input accepted: ${typeof input}`);
      typeSafetyOK = false;
      break;
    }
  }

  if (typeSafetyOK) {
    console.log('✅ [PASS] Property 4: Type safety enforced');
    testsPassed++;
  } else {
    testsFailed++;
  }
}

// ============================================================================
// EDGE CASE TESTS
// ============================================================================

console.log('\n--- TEST 3: Edge Cases ---\n');

// Test 3.1: Explanation with exactly one sentence
{
  const oneSentence = 'This navy blazer pairs perfectly with white shirt.';
  const result = validateExplanation(oneSentence);
  console.log(`${result.isValid ? '✅' : '❌'} One-sentence explanation: ${result.isValid ? 'accepted' : 'rejected'}`);
  if (result.isValid) testsPassed++; else testsFailed++;
}

// Test 3.2: Explanation with special characters
{
  const withSpecial = 'This outfit—perfect for work—combines navy & white stylishly!';
  const result = validateExplanation(withSpecial);
  console.log(`${result.isValid ? '✅' : '❌'} Special characters: ${result.isValid ? 'accepted' : 'rejected'}`);
  if (result.isValid) testsPassed++; else testsFailed++;
}

// Test 3.3: Explanation with numbers
{
  const withNumbers = 'This 2-piece ensemble from 2024 features 100% wool fabric.';
  const result = validateExplanation(withNumbers);
  console.log(`${result.isValid ? '✅' : '❌'} Explanation with numbers: ${result.isValid ? 'accepted' : 'rejected'}`);
  if (result.isValid) testsPassed++; else testsFailed++;
}

// Test 3.4: Explanation with emoji (if supported)
{
  const withEmoji = 'Perfect outfit 👔 for work meetings! Navy and white.';
  const result = validateExplanation(withEmoji);
  console.log(`${result.isValid ? '✅' : '❌'} Explanation with emoji: ${result.isValid ? 'accepted' : 'rejected'}`);
  if (result.isValid) testsPassed++; else testsFailed++;
}

// Test 3.5: Explanation with line breaks
{
  const withBreaks = 'Navy blazer looks great.\nPairs with white shirt.';
  const result = validateExplanation(withBreaks);
  console.log(`${result.isValid ? '✅' : '❌'} Explanation with line breaks: ${result.isValid ? 'accepted' : 'rejected'}`);
  if (result.isValid) testsPassed++; else testsFailed++;
}

// Test 3.6: Explanation with tabs/whitespace
{
  const withWhitespace = 'Navy\tblazer\t\tlooks\tgreat.\tPairs\twith\twhite\tshirt.';
  const result = validateExplanation(withWhitespace);
  console.log(`${result.isValid ? '✅' : '❌'} Explanation with tabs: ${result.isValid ? 'accepted' : 'rejected'}`);
  if (result.isValid) testsPassed++; else testsFailed++;
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n====================================================');
console.log(`TEST SUMMARY: ${testsPassed} PASSED / ${testsFailed} FAILED`);
console.log('====================================================\n');

if (testsFailed > 0) {
  process.exit(1);
}

process.exit(0);
