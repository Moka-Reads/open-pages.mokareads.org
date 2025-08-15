# Open Pages

The Open Pages initiative is an effort by MoKa Reads to develop research/academic papers that are open to the public and can be accessed freely.
We believe that open access will promote collaboration, remove barriers to knowledge and accelerate progress. We provide both PDFs to be freely downloaded
and a purchase link that will help support the initiative.

## How Papers are Managed

Papers are stored as Markdown files in the `papers/` directory. Each paper is a `.md` file with frontmatter (metadata) at the top. Our new system generates optimized JSON files for better web performance.

### Adding a New Paper

1. Create a new `.md` file in the `papers/` directory with this structure:

```markdown
---
title: Your Paper Title
status: working  # or 'idea' or 'completed'
tags:
  - Tag1
  - Tag2
github: "https://github.com/link"
pdf: "https://link-to-pdf"
purchase: "https://purchase-link"
---

## Summary

Short summary of the paper that appears on the card.

## Abstract

Full abstract of your paper. You can write as much as needed here
using regular markdown formatting.

## Table of Contents

1. **Introduction**
   - Background
   - Objectives

2. **Methodology**
   - Research Design
   - Data Collection

3. **Results**
   - Findings
   - Analysis

(Continue with your actual table of contents...)
```

2. After adding your paper, run the build script:
```bash
./build.sh
```

This will process all papers and generate the necessary files in the `dist/` directory.

3. Commit and push your changes. The website will automatically display the new paper.

## Project Structure

```
open-pages/
├── src/                # Source files
│   ├── js/             # JavaScript modules
│   └── css/            # CSS styles
├── dist/               # Generated files (don't edit these)
│   ├── css/            # Compiled CSS
│   ├── js/             # Compiled JS
│   └── *.json          # Generated paper data
├── papers/             # Markdown papers
│   └── assets/         # Paper-related assets
├── build.js            # Node.js build script
├── build.sh            # Build shell script
└── index.html          # Main HTML file
```

## Features

- **Markdown-based papers** - Write your papers in easy-to-edit Markdown
- **Categories and tags** - Organize papers with custom tags
- **Search and filtering** - Find papers by title, content, or category
- **Responsive design** - Works well on all devices
- **Theme selection** - Choose between different visual themes
- **Optimized for web** - Fast loading and good SEO

## How to Run Locally

```bash
# Clone the repository
git clone https://github.com/Moka-Reads/open-pages.mokareads.org.git
cd open-pages.mokareads.org

# Build the project
./build.sh

# Start a local server
python -m http.server
```

The website is now running on `http://localhost:8000`

## Theme Selection

The website includes two themes:
- **Default** - Clean dark blue theme with organized CSS variables
- **Moka** - Brown and creamy coffee-inspired theme

Users can switch themes using the selector in the top-right corner. Their preference is saved locally.

## Development

If you want to modify the project:

1. Edit files in the `src/` directory
2. Run `./build.sh` to rebuild the project
3. Test your changes locally

### Required Dependencies

For full functionality, you need:

- Node.js (for the build process)
- npm packages: marked, js-yaml, glob

The build script will attempt to install these if they're missing.

## Deployment

This project automatically deploys to GitHub Pages using GitHub Actions. The workflow handles:

1. Installing dependencies
2. Building the project
3. Deploying to GitHub Pages

### Setup GitHub Pages

To enable automatic deployment:

1. Go to your repository settings
2. Navigate to "Pages" section
3. Under "Build and deployment", select "GitHub Actions" as the source
4. Make sure your repository has the `gh-pages` branch created

### Triggering Deployments

The site will automatically deploy when:
- You push changes to the `main` branch
- You manually trigger the workflow from the Actions tab

All your papers and content will be automatically processed and published to your GitHub Pages site.