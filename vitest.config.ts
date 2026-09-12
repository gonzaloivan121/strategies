import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const srcRoot = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
    resolve: {
        alias: {
            "#applications":    resolve(srcRoot, "applications"),
            "#errors":          resolve(srcRoot, "errors"),
            "#factories":       resolve(srcRoot, "factories"),
            "#interfaces":      resolve(srcRoot, "interfaces"),
            "#persistence":     resolve(srcRoot, "persistence"),
            "#processors":      resolve(srcRoot, "processors"),
            "#products":        resolve(srcRoot, "products"),
            "#services":        resolve(srcRoot, "services"),
            "#strategies":      resolve(srcRoot, "strategies"),
            "#types":           resolve(srcRoot, "types"),
            "#workflows":       resolve(srcRoot, "workflows"),
        },
    },
    test: {
        environment: "node",
        include: ["tests/**/*.test.ts"],
    },
});
