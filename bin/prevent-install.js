#!/usr/bin/env node

import chalk from "chalk";

// Detect if user is trying to INSTALL instead of RUNNING the CLI
const isInstalling =
   process.env.npm_command === "install" ||
   process.env.npm_lifecycle_event === "preinstall";

if (isInstalling) {
   console.log(`
${chalk.red.bold("✖ Wrong Installation Command!")}

${chalk.yellow("AuthScale is a CLI tool — not a dependency library.")}

${chalk.green("Correct usage:")}
   ${chalk.cyan("npx authscale <project-name>")}

${chalk.green("Examples:")}
   npx authscale my-backend
   npm create authscale my-app

${chalk.magenta("Do NOT install using:")}
   npm install authscale
   npm authscale my-backend
`);

   // Stop installation
   process.exit(1);
}
