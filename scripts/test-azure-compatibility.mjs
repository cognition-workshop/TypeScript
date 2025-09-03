import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing Azure compatibility patterns...');

const testFiles = [
    '../src/compiler/utilities.ts',
    '../src/services/services.ts',
    '../src/compiler/checker.ts'
];

let passedTests = 0;
let totalTests = 0;

function testAzureCompatibility(filePath) {
    const fullPath = join(__dirname, filePath);
    
    if (!existsSync(fullPath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        return;
    }

    const content = readFileSync(fullPath, 'utf8');
    
    totalTests++;
    
    const hasAsyncPatterns = /async\s+function|await\s+/.test(content);
    const hasSyncFileOps = /readFileSync|writeFileSync|existsSync/.test(content);
    const hasProperErrorHandling = /try\s*{[\s\S]*?catch\s*\(/.test(content);
    
    if (hasAsyncPatterns && !hasSyncFileOps && hasProperErrorHandling) {
        console.log(`✅ ${filePath} - Azure compatible`);
        passedTests++;
    } else {
        console.log(`❌ ${filePath} - Needs Azure compatibility improvements`);
        if (hasSyncFileOps) {
            console.log(`   - Contains synchronous file operations`);
        }
        if (hasAsyncPatterns && !hasProperErrorHandling) {
            console.log(`   - Async code missing proper error handling`);
        }
    }
}

testFiles.forEach(testAzureCompatibility);

console.log(`\nAzure Compatibility Test Results: ${passedTests}/${totalTests} passed`);

if (passedTests === totalTests) {
    console.log('🎉 All Azure compatibility tests passed!');
    process.exit(0);
} else {
    console.log('⚠️  Some Azure compatibility issues found. See details above.');
    process.exit(1);
}
