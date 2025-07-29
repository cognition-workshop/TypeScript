const fs = require("fs");
const path = require("path");

class TypeScriptSecurityAnalyzer {
    constructor() {
        this.findings = [];
        this.filesScanned = 0;
        this.securityPatterns = {
            dangerous_eval: /eval\s*\(/g,
            function_constructor: /new\s+Function\s*\(/g,
            code_generation: /createSourceFile|parseSourceFile/g,
            dynamic_imports: /import\s*\(/g,
            unsafe_regex: /RegExp\s*\([^,)]*,\s*['"]g['"]?\)/g,
            potential_injection: /\.innerHTML\s*=|document\.write\s*\(/g,
        };
    }

    analyzeDirectory(dirPath) {
        const files = this.getTypeScriptFiles(dirPath);

        for (const file of files) {
            this.filesScanned++;
            const findings = this.analyzeFile(file);
            this.findings.push(...findings);
        }
    }

    getTypeScriptFiles(dirPath) {
        const files = [];

        const traverse = currentPath => {
            if (!fs.existsSync(currentPath)) return;

            const items = fs.readdirSync(currentPath);

            for (const item of items) {
                const fullPath = path.join(currentPath, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory() && !item.startsWith(".") && item !== "node_modules") {
                    traverse(fullPath);
                }
                else if (stat.isFile() && (item.endsWith(".ts") || item.endsWith(".js"))) {
                    files.push(fullPath);
                }
            }
        };

        traverse(dirPath);
        return files;
    }

    analyzeFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, "utf8");
            const findings = [];

            for (const [pattern, regex] of Object.entries(this.securityPatterns)) {
                const matches = [...content.matchAll(regex)];
                matches.forEach(match => {
                    findings.push({
                        type: pattern,
                        severity: this.getSeverity(pattern),
                        file: path.relative(process.cwd(), filePath),
                        line: this.getLineNumber(content, match.index),
                        context: this.getContext(content, match.index),
                        recommendation: this.getRecommendation(pattern),
                    });
                });
            }

            return findings;
        }
        catch (error) {
            console.error(`Error analyzing file ${filePath}:`, error.message);
            return [];
        }
    }

    getSeverity(pattern) {
        const highRisk = ["dangerous_eval", "function_constructor", "potential_injection"];
        const mediumRisk = ["unsafe_regex", "code_generation"];

        if (highRisk.includes(pattern)) return "high";
        if (mediumRisk.includes(pattern)) return "medium";
        return "low";
    }

    getRecommendation(pattern) {
        const recommendations = {
            dangerous_eval: "Avoid using eval() as it can execute arbitrary code. Use safer alternatives like JSON.parse() for data parsing.",
            function_constructor: "Avoid Function constructor as it can execute arbitrary code. Use predefined functions or safer alternatives.",
            code_generation: "Review code generation patterns for potential injection vulnerabilities. Ensure proper input validation.",
            dynamic_imports: "Review dynamic imports for security implications. Ensure imported modules are trusted.",
            unsafe_regex: "Review regex patterns for ReDoS vulnerabilities. Consider using safer regex patterns.",
            potential_injection: "Avoid innerHTML and document.write with untrusted data. Use textContent or safer DOM manipulation methods.",
        };
        return recommendations[pattern] || "Review for security best practices";
    }

    getLineNumber(content, index) {
        return content.substring(0, index).split("\n").length;
    }

    getContext(content, index) {
        const lines = content.split("\n");
        const lineNum = this.getLineNumber(content, index) - 1;
        const start = Math.max(0, lineNum - 2);
        const end = Math.min(lines.length, lineNum + 3);
        return lines.slice(start, end).join("\n");
    }

    generateReport() {
        const highRiskFindings = this.findings.filter(f => f.severity === "high");
        const mediumRiskFindings = this.findings.filter(f => f.severity === "medium");
        const lowRiskFindings = this.findings.filter(f => f.severity === "low");

        return {
            timestamp: new Date().toISOString(),
            repository: "TypeScript",
            findings: this.findings,
            summary: {
                total_files_scanned: this.filesScanned,
                security_issues_found: this.findings.length,
                high_risk_patterns: highRiskFindings.length,
                medium_risk_patterns: mediumRiskFindings.length,
                low_risk_patterns: lowRiskFindings.length,
                files_with_issues: [...new Set(this.findings.map(f => f.file))].length,
            },
            breakdown_by_type: this.getBreakdownByType(),
            top_vulnerable_files: this.getTopVulnerableFiles(),
        };
    }

    getBreakdownByType() {
        const breakdown = {};
        for (const finding of this.findings) {
            breakdown[finding.type] = (breakdown[finding.type] || 0) + 1;
        }
        return breakdown;
    }

    getTopVulnerableFiles() {
        const fileCounts = {};
        for (const finding of this.findings) {
            fileCounts[finding.file] = (fileCounts[finding.file] || 0) + 1;
        }

        return Object.entries(fileCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([file, count]) => ({ file, issues: count }));
    }
}

if (require.main === module) {
    const analyzer = new TypeScriptSecurityAnalyzer();

    const srcDir = path.join(__dirname, "..", "src");
    analyzer.analyzeDirectory(srcDir);

    const report = analyzer.generateReport();
    console.log(JSON.stringify(report, undefined, 2));
}

module.exports = TypeScriptSecurityAnalyzer;
