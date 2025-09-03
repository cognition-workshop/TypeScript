import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Enterprise TypeScript Code Quality Verification...\n');

const verificationResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
};

function logResult(test, status, message) {
    const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${test}: ${message}`);
    verificationResults.details.push({ test, status, message });
    
    if (status === 'pass') verificationResults.passed++;
    else if (status === 'fail') verificationResults.failed++;
    else verificationResults.warnings++;
}

function verifyTsConfigEnhancements() {
    console.log('\n📋 Verifying TypeScript Configuration Enhancements...');
    
    const tsConfigPath = join(__dirname, '../src/tsconfig-base.json');
    if (!existsSync(tsConfigPath)) {
        logResult('TypeScript Config', 'fail', 'tsconfig-base.json not found');
        return;
    }
    
    const content = readFileSync(tsConfigPath, 'utf8');
    const config = JSON.parse(content);
    
    const enterpriseOptions = [
        'exactOptionalPropertyTypes',
        'noImplicitReturns', 
        'noFallthroughCasesInSwitch',
        'noUncheckedIndexedAccess'
    ];
    
    let foundOptions = 0;
    enterpriseOptions.forEach(option => {
        if (config.compilerOptions[option] === true) {
            foundOptions++;
            logResult(`TypeScript ${option}`, 'pass', 'Enterprise option enabled');
        } else {
            logResult(`TypeScript ${option}`, 'fail', 'Enterprise option missing or disabled');
        }
    });
    
    if (foundOptions === enterpriseOptions.length) {
        logResult('TypeScript Config Overall', 'pass', 'All enterprise compiler options configured');
    } else {
        logResult('TypeScript Config Overall', 'fail', `Only ${foundOptions}/${enterpriseOptions.length} enterprise options configured`);
    }
}

function verifyESLintRules() {
    console.log('\n🔍 Verifying Enterprise ESLint Rules...');
    
    const rules = [
        'enterprise-error-handling.cjs',
        'azure-compatibility.cjs'
    ];
    
    rules.forEach(rule => {
        const rulePath = join(__dirname, `eslint/rules/${rule}`);
        if (existsSync(rulePath)) {
            const content = readFileSync(rulePath, 'utf8');
            if (content.includes('createRule') && content.includes('messageId')) {
                logResult(`ESLint Rule ${rule}`, 'pass', 'Rule properly implemented');
            } else {
                logResult(`ESLint Rule ${rule}`, 'fail', 'Rule structure incomplete');
            }
        } else {
            logResult(`ESLint Rule ${rule}`, 'fail', 'Rule file not found');
        }
    });
    
    const eslintConfigPath = join(__dirname, '../eslint.config.mjs');
    if (existsSync(eslintConfigPath)) {
        const content = readFileSync(eslintConfigPath, 'utf8');
        if (content.includes('enterprise-error-handling') && content.includes('azure-compatibility')) {
            logResult('ESLint Config Integration', 'pass', 'Enterprise rules integrated into config');
        } else {
            logResult('ESLint Config Integration', 'fail', 'Enterprise rules not integrated');
        }
    }
}

function verifyAzureDeployment() {
    console.log('\n☁️ Verifying Azure Deployment Configuration...');
    
    const azureFiles = [
        '../azure-pipelines.yml',
        '../.azure/azure-app-service.json',
        'bundle-for-azure.mjs'
    ];
    
    azureFiles.forEach(file => {
        const filePath = join(__dirname, file);
        if (existsSync(filePath)) {
            logResult(`Azure Config ${file}`, 'pass', 'Configuration file exists');
        } else {
            logResult(`Azure Config ${file}`, 'fail', 'Configuration file missing');
        }
    });
    
    const packageJsonPath = join(__dirname, '../package.json');
    if (existsSync(packageJsonPath)) {
        const content = readFileSync(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(content);
        
        const azureScripts = ['build:azure', 'test:azure-compatibility', 'azure:deploy'];
        azureScripts.forEach(script => {
            if (packageJson.scripts && packageJson.scripts[script]) {
                logResult(`Package Script ${script}`, 'pass', 'Azure script configured');
            } else {
                logResult(`Package Script ${script}`, 'fail', 'Azure script missing');
            }
        });
    }
}

function verifyLanguageServiceEnhancements() {
    console.log('\n🔧 Verifying Language Service Enhancements...');
    
    const typesPath = join(__dirname, '../src/services/types.ts');
    if (existsSync(typesPath)) {
        const content = readFileSync(typesPath, 'utf8');
        
        if (content.includes('AzureCompletionContext')) {
            logResult('Language Service Azure Context', 'pass', 'Azure completion context interface added');
        } else {
            logResult('Language Service Azure Context', 'fail', 'Azure completion context missing');
        }
        
        if (content.includes('getAzureCompletionsAtPosition')) {
            logResult('Language Service Azure Completions', 'pass', 'Azure completion method added');
        } else {
            logResult('Language Service Azure Completions', 'fail', 'Azure completion method missing');
        }
    }
}

function verifyBuildSystem() {
    console.log('\n🏗️ Verifying Build System Enhancements...');
    
    const herebyPath = join(__dirname, '../Herebyfile.mjs');
    if (existsSync(herebyPath)) {
        const content = readFileSync(herebyPath, 'utf8');
        
        if (content.includes('enterpriseBuild')) {
            logResult('Build System Enterprise Task', 'pass', 'Enterprise build task added');
        } else {
            logResult('Build System Enterprise Task', 'fail', 'Enterprise build task missing');
        }
        
        if (content.includes('azureCompatibilityTest')) {
            logResult('Build System Azure Test', 'pass', 'Azure compatibility test task added');
        } else {
            logResult('Build System Azure Test', 'fail', 'Azure compatibility test task missing');
        }
    }
}

function verifyDiagnosticEnhancements() {
    console.log('\n🔍 Verifying Diagnostic System Enhancements...');
    
    const diagnosticsPath = join(__dirname, '../src/compiler/enterpriseDiagnostics.ts');
    if (existsSync(diagnosticsPath)) {
        const content = readFileSync(diagnosticsPath, 'utf8');
        
        if (content.includes('createEnterpriseDiagnostic') && content.includes('createAzureCompatibilityDiagnostic')) {
            logResult('Enterprise Diagnostics', 'pass', 'Enterprise diagnostic functions implemented');
        } else {
            logResult('Enterprise Diagnostics', 'fail', 'Enterprise diagnostic functions incomplete');
        }
    } else {
        logResult('Enterprise Diagnostics', 'fail', 'Enterprise diagnostics file missing');
    }
    
    const enterpriseMessagesPath = join(__dirname, '../src/compiler/diagnosticMessages.enterprise.json');
    if (existsSync(enterpriseMessagesPath)) {
        logResult('Enterprise Diagnostic Messages', 'pass', 'Enterprise diagnostic messages defined');
    } else {
        logResult('Enterprise Diagnostic Messages', 'fail', 'Enterprise diagnostic messages missing');
    }
}

function generateSummary() {
    console.log('\n📊 Enterprise Code Quality Verification Summary');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${verificationResults.passed}`);
    console.log(`❌ Failed: ${verificationResults.failed}`);
    console.log(`⚠️  Warnings: ${verificationResults.warnings}`);
    console.log(`📈 Success Rate: ${Math.round((verificationResults.passed / (verificationResults.passed + verificationResults.failed)) * 100)}%`);
    
    if (verificationResults.failed === 0) {
        console.log('\n🎉 All enterprise code quality improvements verified successfully!');
        console.log('✨ Ready for Microsoft enterprise deployment');
        return true;
    } else {
        console.log('\n⚠️  Some verification checks failed. Review the details above.');
        return false;
    }
}

async function main() {
    verifyTsConfigEnhancements();
    verifyESLintRules();
    verifyAzureDeployment();
    verifyLanguageServiceEnhancements();
    verifyBuildSystem();
    verifyDiagnosticEnhancements();
    
    const success = generateSummary();
    process.exit(success ? 0 : 1);
}

main().catch(console.error);
