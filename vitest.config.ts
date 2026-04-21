import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadDotEnvLocal(): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    const raw = fs.readFileSync(path.resolve(__dirname, ".env.local"), "utf-8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) result[m[1].trim()] = m[2].trim();
    }
  } catch {
    // file not present in CI — env vars provided externally
  }
  return result;
}

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: { reporter: ["text", "html"] },
    env: loadDotEnvLocal(),
    fileParallelism: false,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
