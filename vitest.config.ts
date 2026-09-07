import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const srcRoot = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
    resolve: {
        alias: {
            "#factories": resolve(srcRoot, "factories"),
            "#interfaces": resolve(srcRoot, "interfaces"),
            "#processors": resolve(srcRoot, "processors"),
            "#products": resolve(srcRoot, "products"),
            "#strategies": resolve(srcRoot, "strategies"),
            "#types": resolve(srcRoot, "types"),
        },
    },
    test: {
        environment: "node",
        include: ["tests/**/*.test.ts"],
    },
});
