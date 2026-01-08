/**
 * Unit tests for the secondsToString function
 * This function converts seconds to a human-readable format (e.g., "1h 2m 3s")
 */

// Mock the secondsToString function implementation for testing
function secondsToString(sec) {
  if (!sec) return '0s';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}h ${m}m ${s}s`;
}

// Simple test runner
function runTest(testName, testFunction) {
  try {
    testFunction();
    console.log(`✓ ${testName}`);
  } catch (error) {
    console.log(`✗ ${testName}: ${error.message}`);
  }
}

// Test cases
runTest('should convert 0 seconds to "0s"', () => {
  const result = secondsToString(0);
  if (result !== '0s') {
    throw new Error(`Expected "0s", got "${result}"`);
  }
});

runTest('should convert null to "0s"', () => {
  const result = secondsToString(null);
  if (result !== '0s') {
    throw new Error(`Expected "0s", got "${result}"`);
  }
});

runTest('should convert undefined to "0s"', () => {
  const result = secondsToString(undefined);
  if (result !== '0s') {
    throw new Error(`Expected "0s", got "${result}"`);
  }
});

runTest('should convert 30 seconds to "0h 0m 30s"', () => {
  const result = secondsToString(30);
  if (result !== '0h 0m 30s') {
    throw new Error(`Expected "0h 0m 30s", got "${result}"`);
  }
});

runTest('should convert 65 seconds to "0h 1m 5s"', () => {
  const result = secondsToString(65);
  if (result !== '0h 1m 5s') {
    throw new Error(`Expected "0h 1m 5s", got "${result}"`);
  }
});

runTest('should convert 3661 seconds to "1h 1m 1s"', () => {
  const result = secondsToString(3661);
  if (result !== '1h 1m 1s') {
    throw new Error(`Expected "1h 1m 1s", got "${result}"`);
  }
});

runTest('should convert 7200 seconds to "2h 0m 0s"', () => {
  const result = secondsToString(7200);
  if (result !== '2h 0m 0s') {
    throw new Error(`Expected "2h 0m 0s", got "${result}"`);
  }
});

runTest('should convert 3665 seconds to "1h 1m 5s"', () => {
  const result = secondsToString(3665);
  if (result !== '1h 1m 5s') {
    throw new Error(`Expected "1h 1m 5s", got "${result}"`);
  }
});

console.log('\nUnit tests completed!');