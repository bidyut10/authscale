#!/usr/bin/env node

// ANSI color codes
const red = "\x1b[31m";
const green = "\x1b[32m";
const yellow = "\x1b[33m";
const cyan = "\x1b[36m";
const magenta = "\x1b[35m";
const reset = "\x1b[0m";

// Detect if user is trying to INSTALL instead of RUNNING the CLI
const isInstalling =
   process.env.npm_command === "install" ||
   process.env.npm_lifecycle_event === "preinstall";

if (isInstalling) {
   console.log(`
${red}✖ Wrong Installation Command!${reset}

${yellow}AuthScale is a CLI tool — not a dependency library.${reset}

${green}Correct usage:${reset}
   ${cyan}npx authscale <project-name>${reset}

${green}Examples:${reset}
   npx authscale my-backend

${magenta}Do NOT install using:${reset}
   npm install authscale
   npm authscale my-backend
`);

   // Stop installation
   process.exit(1);
}
