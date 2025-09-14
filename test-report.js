#!/usr/bin/env node

const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🧪 Starting Comprehensive Test Suite\n')
console.log('=' .repeat(50))

const testResults = {
  unit: { passed: 0, failed: 0, total: 0 },
  integration: { passed: 0, failed: 0, total: 0 },
  e2e: { passed: 0, failed: 0, total: 0 },
  coverage: null,
  timestamp: new Date().toISOString(),
  errors: []
}

// Function to run tests and capture results
function runTest(command, testType) {
  return new Promise((resolve) => {
    console.log(`\n📊 Running ${testType} tests...`)
    console.log('-'.repeat(40))

    exec(command, (error, stdout, stderr) => {
      console.log(stdout)

      if (error) {
        console.error(`❌ ${testType} tests encountered errors:`)
        console.error(stderr)
        testResults.errors.push({
          type: testType,
          error: error.message,
          stderr: stderr
        })
      }

      // Parse test results from output
      const passMatch = stdout.match(/(\d+) passed/g)
      const failMatch = stdout.match(/(\d+) failed/g)
      const totalMatch = stdout.match(/(\d+) test/g)

      if (passMatch) {
        const passed = parseInt(passMatch[0].split(' ')[0])
        testResults[testType].passed = passed
      }

      if (failMatch) {
        const failed = parseInt(failMatch[0].split(' ')[0])
        testResults[testType].failed = failed
      }

      if (totalMatch) {
        const total = parseInt(totalMatch[0].split(' ')[0])
        testResults[testType].total = total
      }

      resolve()
    })
  })
}

// Main test runner
async function runAllTests() {
  try {
    // Run Jest tests (unit and integration)
    await runTest('npm run test -- --passWithNoTests', 'unit')

    // Install Playwright browsers if needed
    console.log('\n🎭 Setting up Playwright browsers...')
    await new Promise((resolve) => {
      exec('npx playwright install', (error, stdout) => {
        if (!error) {
          console.log('✅ Playwright browsers installed')
        }
        resolve()
      })
    })

    // Run E2E tests with Playwright
    await runTest('npm run test:e2e -- --reporter=list', 'e2e')

    // Generate final report
    console.log('\n' + '='.repeat(50))
    console.log('📈 TEST RESULTS SUMMARY')
    console.log('='.repeat(50))

    console.log('\n🔬 Unit & Integration Tests:')
    console.log(`   ✅ Passed: ${testResults.unit.passed}`)
    console.log(`   ❌ Failed: ${testResults.unit.failed}`)
    console.log(`   📊 Total: ${testResults.unit.total}`)

    console.log('\n🌐 E2E Tests:')
    console.log(`   ✅ Passed: ${testResults.e2e.passed}`)
    console.log(`   ❌ Failed: ${testResults.e2e.failed}`)
    console.log(`   📊 Total: ${testResults.e2e.total}`)

    const totalPassed = testResults.unit.passed + testResults.e2e.passed
    const totalFailed = testResults.unit.failed + testResults.e2e.failed
    const totalTests = testResults.unit.total + testResults.e2e.total

    console.log('\n📊 Overall Summary:')
    console.log(`   Total Tests: ${totalTests}`)
    console.log(`   ✅ Passed: ${totalPassed}`)
    console.log(`   ❌ Failed: ${totalFailed}`)
    console.log(`   Success Rate: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%`)

    if (testResults.errors.length > 0) {
      console.log('\n⚠️  Errors Encountered:')
      testResults.errors.forEach((err, index) => {
        console.log(`   ${index + 1}. ${err.type}: ${err.error}`)
      })
    }

    // Save results to file
    const reportPath = path.join(__dirname, 'test-results.json')
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2))
    console.log(`\n💾 Detailed results saved to: ${reportPath}`)

    console.log('\n' + '='.repeat(50))
    console.log('✨ Test suite completed!')
    console.log('='.repeat(50))

  } catch (error) {
    console.error('Fatal error running tests:', error)
    process.exit(1)
  }
}

// Run the tests
runAllTests()