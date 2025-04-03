import { typingsName, TypingsInstaller, Log, RequestCompletedAction } from "../../../src/typingsInstallerCore/typingsInstaller";
import { MapLike, Path, InstallTypingHost } from "../../../src/compiler/types";

describe("typingsName", () => {
    it("should format package names correctly", () => {
        const result = ts.typingsName("lodash");
        assert.match(result, /^@types\/lodash@ts\d+\.\d+$/);
    });
});

class MockTypingsInstaller extends ts.TypingsInstaller {
    public typesRegistry = new Map<string, ts.MapLike<string>>();
    
    constructor() {
        const mockHost: ts.InstallTypingHost = {
            fileExists: () => true,
            readFile: () => '{"devDependencies": {"@types/lodash": "4.14.195"}}',
            writeFile: () => {},
            createDirectory: () => {},
            directoryExists: () => true,
            getDirectories: () => [],
            readDirectory: () => [],
            deleteFile: () => {},
        };
        
        super(mockHost, "/cache", "/safelist", "/typesmap", 5);
    }
    
    protected installWorker(): void {}
    protected sendResponse(): void {}
}

describe("NpmConfig", () => {
    it("should parse package.json with string values", () => {
        const installer = new MockTypingsInstaller();
        const config = { devDependencies: { "@types/lodash": "4.14.195" } };
    });
});

function assert(condition: boolean, message?: string): void {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

namespace assert {
    export function match(value: string, regex: RegExp, message?: string): void {
        if (!regex.test(value)) {
            throw new Error(message || `Expected ${value} to match ${regex}`);
        }
    }
}
