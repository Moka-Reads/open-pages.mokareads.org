#!/usr/bin/env node

/**
 * Open Pages Diagnostic Tool
 *
 * This script helps diagnose issues with the Open Pages system.
 * It checks for common problems and provides suggestions to fix them.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
const PAPERS_DIR = path.join(__dirname, "papers");
const DIST_DIR = path.join(__dirname, "dist");
const SRC_DIR = path.join(__dirname, "src");

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

// Print header
console.log(
  `\n${colors.cyan}${colors.bold}================================${colors.reset}`,
);
console.log(
  `${colors.cyan}${colors.bold} OPEN PAGES DIAGNOSTIC TOOL ${colors.reset}`,
);
console.log(
  `${colors.cyan}${colors.bold}================================${colors.reset}\n`,
);

// Track overall diagnostic state
let errors = 0;
let warnings = 0;

// Helper functions
function checkSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function checkWarning(message) {
  warnings++;
  console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

function checkError(message) {
  errors++;
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

function checkInfo(message) {
  console.log(`${colors.blue}ℹ ${message}${colors.reset}`);
}

function checkSection(title) {
  console.log(`\n${colors.magenta}${colors.bold}${title}${colors.reset}`);
  console.log(`${colors.magenta}${"-".repeat(title.length)}${colors.reset}`);
}

// 1. Check directory structure
checkSection("Directory Structure");

const requiredDirs = [
  PAPERS_DIR,
  DIST_DIR,
  SRC_DIR,
  path.join(SRC_DIR, "js"),
  path.join(SRC_DIR, "css"),
];

requiredDirs.forEach((dir) => {
  if (fs.existsSync(dir)) {
    checkSuccess(`Directory exists: ${path.relative(__dirname, dir)}`);
  } else {
    checkError(`Directory missing: ${path.relative(__dirname, dir)}`);
  }
});

// 2. Check required files
checkSection("Required Files");

const requiredFiles = [
  { path: path.join(__dirname, "index.html"), name: "Main HTML file" },
  { path: path.join(__dirname, "build.js"), name: "Build script" },
  { path: path.join(__dirname, "build.sh"), name: "Build shell script" },
  { path: path.join(SRC_DIR, "js", "papers.js"), name: "Papers JS module" },
  { path: path.join(SRC_DIR, "js", "main.js"), name: "Main JS module" },
  { path: path.join(SRC_DIR, "css", "style.css"), name: "Main CSS" },
];

requiredFiles.forEach((file) => {
  if (fs.existsSync(file.path)) {
    checkSuccess(`File exists: ${file.name}`);
  } else {
    checkError(`File missing: ${file.name}`);
  }
});

// 3. Check paper markdown files
checkSection("Paper Markdown Files");

try {
  const paperFiles = fs
    .readdirSync(PAPERS_DIR)
    .filter((file) => file.endsWith(".md"));

  if (paperFiles.length === 0) {
    checkError("No markdown paper files found in papers/ directory");
  } else {
    checkSuccess(`Found ${paperFiles.length} paper markdown files`);

    // Check the structure of each paper file
    paperFiles.forEach((file) => {
      const filePath = path.join(PAPERS_DIR, file);
      const content = fs.readFileSync(filePath, "utf8");

      // Check for frontmatter
      if (!content.startsWith("---")) {
        checkError(
          `Paper file ${file} is missing frontmatter (should start with ---)`,
        );
      }

      // Check for required frontmatter fields
      const frontmatterEnd = content.indexOf("---", 3);
      if (frontmatterEnd === -1) {
        checkError(
          `Paper file ${file} has incomplete frontmatter (missing ending ---)`,
        );
      } else {
        const frontmatter = content.substring(3, frontmatterEnd).trim();

        if (!frontmatter.includes("title:")) {
          checkError(`Paper file ${file} is missing 'title' in frontmatter`);
        }

        if (!frontmatter.includes("status:")) {
          checkWarning(`Paper file ${file} is missing 'status' in frontmatter`);
        }

        if (!frontmatter.includes("tags:")) {
          checkWarning(`Paper file ${file} is missing 'tags' in frontmatter`);
        }
      }

      // Check for required sections
      if (!content.includes("## Summary")) {
        checkWarning(`Paper file ${file} is missing '## Summary' section`);
      }

      if (!content.includes("## Abstract")) {
        checkWarning(`Paper file ${file} is missing '## Abstract' section`);
      }
    });
  }
} catch (err) {
  checkError(`Error reading papers directory: ${err.message}`);
}

// 4. Check build output
checkSection("Build Output");

const distFiles = [
  { path: path.join(DIST_DIR, "papers.json"), name: "Main papers data file" },
  { path: path.join(DIST_DIR, "papers-list.json"), name: "Papers list file" },
  { path: path.join(DIST_DIR, "categories.json"), name: "Categories file" },
  { path: path.join(DIST_DIR, "css", "style.css"), name: "Main CSS file" },
  {
    path: path.join(DIST_DIR, "css", "theme-default.css"),
    name: "Default theme",
  },
  { path: path.join(DIST_DIR, "css", "theme-maple.css"), name: "Maple theme" },
];

let buildOutputExists = true;
distFiles.forEach((file) => {
  if (fs.existsSync(file.path)) {
    checkSuccess(`File exists: ${file.name}`);
  } else {
    checkError(`File missing: ${file.name}`);
    buildOutputExists = false;
  }
});

// Check papers.json content if it exists
const papersJsonPath = path.join(DIST_DIR, "papers.json");
if (fs.existsSync(papersJsonPath)) {
  try {
    const papersData = JSON.parse(fs.readFileSync(papersJsonPath, "utf8"));
    checkSuccess(`papers.json is valid JSON with ${papersData.length} papers`);

    // Check for common issues in papers data
    papersData.forEach((paper, index) => {
      if (!paper.title) {
        checkError(`Paper #${index + 1} in papers.json is missing a title`);
      }
      if (!paper.slug) {
        checkError(`Paper #${index + 1} in papers.json is missing a slug`);
      }
      if (!paper.content && !paper.html) {
        checkError(`Paper #${index + 1} in papers.json is missing content`);
      }
    });
  } catch (err) {
    checkError(`papers.json is not valid JSON: ${err.message}`);
  }
} else if (buildOutputExists) {
  checkError("papers.json file is missing, build process may have failed");
}

// 5. Check theme consistency
checkSection("Theme Consistency");

// Check theme references in index.html
try {
  const indexHtml = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const themeOptionRegex = /<select id="theme-select">[^]*?<\/select>/;
  const themeOptionsItemRegex = /<option value="(.*?)">/g;
  const themeOptions = [];
  let match;

  const themeSelectSection = indexHtml.match(themeOptionRegex);
  if (themeSelectSection) {
    while (
      (match = themeOptionsItemRegex.exec(themeSelectSection[0])) !== null
    ) {
      if (match[1] !== "") {
        // Skip empty values
        themeOptions.push(match[1]);
      }
    }
  }

  checkInfo(`Themes referenced in index.html: ${themeOptions.join(", ")}`);

  // Check if these themes exist in src/css and dist/css
  themeOptions.forEach((theme) => {
    const srcThemePath = path.join(SRC_DIR, "css", `theme-${theme}.css`);
    const distThemePath = path.join(DIST_DIR, "css", `theme-${theme}.css`);

    if (!fs.existsSync(srcThemePath)) {
      checkError(
        `Theme '${theme}' is referenced in index.html but theme-${theme}.css not found in src/css`,
      );
    }

    if (!fs.existsSync(distThemePath)) {
      checkError(
        `Theme '${theme}' is referenced in index.html but theme-${theme}.css not found in dist/css`,
      );
    }
  });

  // Check main.js for theme references
  const mainJs = fs.readFileSync(path.join(SRC_DIR, "js", "main.js"), "utf8");
  themeOptions.forEach((theme) => {
    if (!mainJs.includes(`case "${theme}":`)) {
      checkError(
        `Theme '${theme}' is in index.html but not handled in main.js switch statement`,
      );
    }
  });
} catch (err) {
  checkError(`Error checking theme consistency: ${err.message}`);
}

// 6. Check build script permissions
checkSection("Build Script Permissions");

try {
  const buildShPath = path.join(__dirname, "build.sh");
  const buildJsPath = path.join(__dirname, "build.js");

  // Check if build.sh is executable
  try {
    const buildShStats = fs.statSync(buildShPath);
    const isExecutable = !!(buildShStats.mode & 0o111); // Check if executable bit is set

    if (isExecutable) {
      checkSuccess("build.sh is executable");
    } else {
      checkWarning("build.sh is not executable. Run: chmod +x build.sh");
    }
  } catch (err) {
    checkError(`Error checking build.sh permissions: ${err.message}`);
  }

  // Check if build.js is executable
  try {
    const buildJsStats = fs.statSync(buildJsPath);
    const isExecutable = !!(buildJsStats.mode & 0o111); // Check if executable bit is set

    if (isExecutable) {
      checkSuccess("build.js is executable");
    } else {
      checkWarning("build.js is not executable. Run: chmod +x build.js");
    }
  } catch (err) {
    checkError(`Error checking build.js permissions: ${err.message}`);
  }
} catch (err) {
  checkError(`Error checking build script permissions: ${err.message}`);
}

// 7. Try running the build script
checkSection("Build Process");

try {
  checkInfo("Attempting to run build.sh to verify build process...");

  try {
    const buildOutput = execSync("./build.sh", { encoding: "utf8" });
    checkSuccess("Build process completed successfully");
    checkInfo("Build output:");
    console.log("------------------------");
    console.log(buildOutput);
    console.log("------------------------");
  } catch (err) {
    checkError(`Build process failed: ${err.message}`);
    if (err.stdout) {
      checkInfo("Build output:");
      console.log("------------------------");
      console.log(err.stdout);
      console.log("------------------------");
    }
    if (err.stderr) {
      checkInfo("Build error output:");
      console.log("------------------------");
      console.log(err.stderr);
      console.log("------------------------");
    }
  }
} catch (err) {
  checkError(`Error executing build script: ${err.message}`);
}

// 8. Check file paths in JavaScript
checkSection("JavaScript Path References");

try {
  const papersJs = fs.readFileSync(
    path.join(SRC_DIR, "js", "papers.js"),
    "utf8",
  );
  const mainJs = fs.readFileSync(path.join(SRC_DIR, "js", "main.js"), "utf8");

  // Check fetch URLs
  const fetchRegex = /fetch\(['"]([^'"]+)['"]\)/g;
  const papersJsFetches = [];
  let match;

  while ((match = fetchRegex.exec(papersJs)) !== null) {
    papersJsFetches.push(match[1]);
  }

  checkInfo(`Fetch URLs in papers.js: ${papersJsFetches.join(", ")}`);

  // Check for leading slashes which can cause issues
  const badPaths = papersJsFetches.filter((url) => url.startsWith("/"));
  if (badPaths.length > 0) {
    checkError(
      `Found fetch URLs with leading slashes which may cause issues in GitHub Pages: ${badPaths.join(", ")}`,
    );
    checkInfo("Consider removing leading slashes from these paths.");
  } else {
    checkSuccess(
      "No fetch URLs with problematic leading slashes found in papers.js",
    );
  }
  let hasBadPaths = badPaths && badPaths.length > 0;

  // Check link href paths in main.js
  const hrefRegex = /link\.href\s*=\s*['"]([^'"]+)['"]/g;
  const mainJsHrefs = [];
  while ((match = hrefRegex.exec(mainJs)) !== null) {
    mainJsHrefs.push(match[1]);
  }

  checkInfo(`CSS href paths in main.js: ${mainJsHrefs.join(", ")}`);

  // Check for leading slashes which can cause issues
  const badHrefs = mainJsHrefs.filter((url) => url.startsWith("/"));
  if (badHrefs.length > 0) {
    checkError(
      `Found CSS href paths with leading slashes which may cause issues in GitHub Pages: ${badHrefs.join(", ")}`,
    );
    checkInfo("Consider removing leading slashes from these paths.");
  } else {
    checkSuccess(
      "No CSS href paths with problematic leading slashes found in main.js",
    );
  }
  let hasBadHrefs = badHrefs && badHrefs.length > 0;
} catch (err) {
  checkError(`Error checking JavaScript path references: ${err.message}`);
}

// 9. Check HTML path references
checkSection("HTML Path References");

try {
  const indexHtml = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

  // Check for script and link tags with absolute paths
  const scriptRegex = /<script[^>]*src=["']([^"']+)["'][^>]*>/g;
  const linkRegex = /<link[^>]*href=["']([^"']+)["'][^>]*>/g;

  const scriptPaths = [];
  const linkPaths = [];
  let match;

  while ((match = scriptRegex.exec(indexHtml)) !== null) {
    if (!match[1].startsWith("http")) {
      // Ignore external URLs
      scriptPaths.push(match[1]);
    }
  }

  while ((match = linkRegex.exec(indexHtml)) !== null) {
    if (!match[1].startsWith("http")) {
      // Ignore external URLs
      linkPaths.push(match[1]);
    }
  }

  checkInfo(`Script paths in index.html: ${scriptPaths.join(", ")}`);
  checkInfo(`Link paths in index.html: ${linkPaths.join(", ")}`);

  // Check for problematic paths
  const badScriptPaths = scriptPaths.filter((path) => path.startsWith("/"));
  const badLinkPaths = linkPaths.filter((path) => path.startsWith("/"));

  if (badScriptPaths.length > 0) {
    checkError(
      `Found script tags with leading slashes which may cause issues in GitHub Pages: ${badScriptPaths.join(", ")}`,
    );
  } else {
    checkSuccess(
      "No script tags with problematic leading slashes found in index.html",
    );
  }

  if (badLinkPaths.length > 0) {
    checkError(
      `Found link tags with leading slashes which may cause issues in GitHub Pages: ${badLinkPaths.join(", ")}`,
    );
  } else {
    checkSuccess(
      "No link tags with problematic leading slashes found in index.html",
    );
  }

  let hasBadScriptPaths = badScriptPaths && badScriptPaths.length > 0;
  let hasBadLinkPaths = badLinkPaths && badLinkPaths.length > 0;
} catch (err) {
  checkError(`Error checking HTML path references: ${err.message}`);
}

// 10. Check for GitHub Pages configuration
checkSection("GitHub Pages Configuration");

try {
  if (fs.existsSync(path.join(__dirname, ".nojekyll"))) {
    checkSuccess(
      "Found .nojekyll file to disable Jekyll processing on GitHub Pages",
    );
  } else {
    checkWarning(
      "No .nojekyll file found. This might cause issues with files that start with underscores on GitHub Pages",
    );
  }

  if (fs.existsSync(path.join(__dirname, "CNAME"))) {
    const cname = fs.readFileSync(path.join(__dirname, "CNAME"), "utf8").trim();
    checkInfo(`Found CNAME file with domain: ${cname}`);
  } else {
    checkInfo(
      "No CNAME file found. This is only needed if you use a custom domain with GitHub Pages",
    );
  }

  const workflowsDir = path.join(__dirname, ".github", "workflows");
  if (fs.existsSync(workflowsDir)) {
    const workflows = fs
      .readdirSync(workflowsDir)
      .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"));

    if (workflows.length > 0) {
      checkSuccess(
        `Found ${workflows.length} GitHub Actions workflow files: ${workflows.join(", ")}`,
      );
    } else {
      checkWarning(
        "No GitHub Actions workflow files found in .github/workflows",
      );
    }
  } else {
    checkWarning(
      "No .github/workflows directory found. You might not have GitHub Actions set up for automatic deployment",
    );
  }
} catch (err) {
  checkError(`Error checking GitHub Pages configuration: ${err.message}`);
}

// Summary
checkSection("Diagnostic Summary");

if (errors === 0 && warnings === 0) {
  console.log(
    `${colors.green}${colors.bold}All checks passed! No issues detected.${colors.reset}`,
  );
} else {
  if (errors > 0) {
    console.log(
      `${colors.red}${colors.bold}Found ${errors} error(s)${colors.reset}`,
    );
  }
  if (warnings > 0) {
    console.log(
      `${colors.yellow}${colors.bold}Found ${warnings} warning(s)${colors.reset}`,
    );
  }

  // Provide potential solutions
  console.log("\n");
  checkSection("Suggested Actions");

  if (errors > 0 || warnings > 0) {
    console.log(
      `${colors.cyan}Based on the diagnostic results, here are some actions to consider:${colors.reset}\n`,
    );

    // Suggestions for common issues
    if (!buildOutputExists) {
      console.log(`${colors.bold}1. Run the build process:${colors.reset}`);
      console.log("   ./build.sh");
      console.log(
        "   This will generate the required files in the dist/ directory.\n",
      );
    }

    if (hasBadPaths || hasBadHrefs || hasBadScriptPaths || hasBadLinkPaths) {
      console.log(`${colors.bold}2. Fix problematic paths:${colors.reset}`);
      console.log(
        "   Remove leading slashes from file paths in JavaScript and HTML files.",
      );
      console.log(
        "   For GitHub Pages, relative paths work better than absolute paths.\n",
      );
    }

    console.log(`${colors.bold}3. Debug in browser:${colors.reset}`);
    console.log(
      "   Open your site in a browser and check the console (F12) for JavaScript errors.",
    );
    console.log("   Look for network errors when fetching JSON files.\n");

    console.log(`${colors.bold}4. Check paper Markdown files:${colors.reset}`);
    console.log(
      "   Ensure all paper files have proper frontmatter with required fields.",
    );
    console.log(
      "   Each paper should have at least a title, status, and tags.\n",
    );

    console.log(`${colors.bold}5. Verify GitHub Pages setup:${colors.reset}`);
    console.log(
      "   Make sure GitHub Pages is enabled in your repository settings.",
    );
    console.log(
      "   Verify that the GitHub Actions workflow is running correctly.\n",
    );
  }
}

// Footer
console.log(
  `\n${colors.cyan}${colors.bold}=============================\nDiagnostic completed\n=============================\n${colors.reset}`,
);
