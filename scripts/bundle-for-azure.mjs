import {
    existsSync,
    mkdirSync,
    writeFileSync,
} from "fs";
import {
    dirname,
    join,
} from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("Creating Azure-compatible bundle...");

const distDir = join(__dirname, "../dist");
if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
}

const azureConfig = {
    name: "typescript-compiler-azure",
    version: "1.0.0",
    description: "TypeScript Compiler optimized for Azure deployment",
    main: "lib/typescript.js",
    engines: {
        node: ">=18.0.0",
    },
    scripts: {
        start: "node lib/typescript.js",
        health: "node scripts/health-check.js",
    },
    dependencies: {
        "@azure/functions": "^4.0.0",
        "@azure/logger": "^1.0.0",
    },
    azure: {
        functionAppName: "typescript-compiler",
        resourceGroup: "typescript-rg",
        runtime: "node",
        version: "~4",
        extensionBundle: {
            id: "Microsoft.Azure.Functions.ExtensionBundle",
            version: "[4.*, 5.0.0)",
        },
    },
};

const azurePackageJson = join(distDir, "package.json");
writeFileSync(azurePackageJson, JSON.stringify(azureConfig, undefined, 2));

const healthCheckScript = `
const healthCheck = () => {
    return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        node: process.version,
        uptime: process.uptime()
    };
};

if (require.main === module) {
    console.log(JSON.stringify(healthCheck(), undefined, 2));
}

module.exports = healthCheck;
`;

const scriptsDir = join(distDir, "scripts");
if (!existsSync(scriptsDir)) {
    mkdirSync(scriptsDir, { recursive: true });
}

writeFileSync(join(scriptsDir, "health-check.js"), healthCheckScript);

console.log("✅ Azure bundle created successfully in dist/ directory");
console.log("📦 Package configuration optimized for Azure App Service");
console.log("🏥 Health check endpoint configured");
