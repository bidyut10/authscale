#!/usr/bin/env node

import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get project name from command line arguments
const projectName = process.argv[2];

if (!projectName) {
  console.error("❌ Error: Please provide a project name");
  console.log("Usage: npx authscale <project-name>");
  process.exit(1);
}

// Validate project name
if (!/^[a-z0-9-]+$/i.test(projectName)) {
  console.error("❌ Error: Project name can only contain letters, numbers, and hyphens");
  process.exit(1);
}

const templatePath = path.join(__dirname, "..", "template");
const targetPath = path.join(process.cwd(), projectName);

(async () => {
  try {
    // Check if directory already exists
    if (await fs.pathExists(targetPath)) {
      console.error(`❌ Error: Directory "${projectName}" already exists`);
      process.exit(1);
    }

    console.log(`✅ Creating corporate backend project: ${projectName}...`);

    // Create target directory
    await fs.ensureDir(targetPath);

    // Copy template files
    await fs.copy(templatePath, targetPath, {
      filter: (src) => {
        // Skip node_modules and package-lock.json if they exist
        const basename = path.basename(src);
        return basename !== "node_modules" && basename !== "package-lock.json";
      },
    });

    // Read and update package.json with project name
    const packageJsonPath = path.join(targetPath, "package.json");
    const packageJson = await fs.readJson(packageJsonPath);
    packageJson.name = projectName;
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

    console.log("✅ Backend project created successfully!");
    console.log("\n👉 Next steps:");
    console.log(`   cd ${projectName}`);
    console.log("   npx npm-check-updates -u && npm install");
    console.log("   cp .env.example .env");
    console.log("   npm run dev");
    console.log("\n📚 Check README.md for detailed documentation");
  } catch (err) {
    console.error("❌ Error creating project:", err.message);
    // Clean up on error
    if (await fs.pathExists(targetPath)) {
      await fs.remove(targetPath);
    }
    process.exit(1);
  }
})();
