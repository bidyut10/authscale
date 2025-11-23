#!/usr/bin/env node

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CLI Title Banner
console.log(chalk.bold.blue(`
╔════════════════════════════════════════╗
║         AuthScale CLI v1.1.2           ║
║   Create Production-Ready Backends     ║
╚════════════════════════════════════════╝
`));


// Get project name from arguments
const projectName = process.argv[2];

if (!projectName) {
  console.log(chalk.red("✖ ERROR: No project name provided."));
  console.log(
    chalk.yellow("Usage: ") +
    chalk.cyan("npx authscale <project-name>\n")
  );
  process.exit(1);
}


// Validate project name
if (!/^[a-z0-9-]+$/i.test(projectName)) {
  console.log(chalk.red("✖ ERROR: Project name must contain only letters, numbers, and hyphens."));
  process.exit(1);
}

const templatePath = path.join(__dirname, "..", "template");
const targetPath = path.join(process.cwd(), projectName);


// Main logic
(async () => {
  try {
    if (await fs.pathExists(targetPath)) {
      console.log(chalk.red(`✖ ERROR: Directory "${projectName}" already exists.`));
      process.exit(1);
    }

    console.log(chalk.green(`\n✔ Creating backend project: `) + chalk.cyan(projectName));

    await fs.ensureDir(targetPath);

    await fs.copy(templatePath, targetPath, {
      filter: (src) => {
        const basename = path.basename(src);
        return basename !== "node_modules" && basename !== "package-lock.json";
      },
    });

    // Update project name inside package.json
    const packageJsonPath = path.join(targetPath, "package.json");
    const packageJson = await fs.readJson(packageJsonPath);
    packageJson.name = projectName;
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

    console.log(chalk.green("\n✔ Backend template successfully generated!"));

    // Final instructions
    console.log(chalk.bold.magenta(`
==========================
   🎯 Next Steps
==========================
`));

    console.log(chalk.green("1. Navigate to your project:"));
    console.log(chalk.cyan(`   cd ${projectName}\n`));

    console.log(chalk.green("2. Install and update dependencies:"));
    console.log(chalk.cyan("   npm install"));
    console.log(chalk.cyan("   npm update\n"));

    console.log(chalk.green("3. Setup environment:"));
    console.log(chalk.cyan("   cp .env.example .env\n"));

    console.log(chalk.green("4. Start the development server:"));
    console.log(chalk.cyan("   npm run dev\n"));

    console.log(chalk.bold.green("✨ You're all set! Build something amazing."));
    console.log(chalk.gray("\n📘 Check README.md for full documentation.\n"));
  } catch (err) {
    console.log(chalk.red("✖ ERROR while creating project: "), err.message);

    if (await fs.pathExists(targetPath)) {
      await fs.remove(targetPath);
    }

    process.exit(1);
  }
})();
