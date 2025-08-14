# Open Pages

The Open Pages initiative is an effort by MoKa Reads to develop research/academic papers that are open to the public and can be accessed freely.
We believe that open access will promote collaboration, remove barriers to knowledge and accelerate progress. We provide both PDFs to be freely downloaded
and a purchase link that will help support the initiative.

## How Papers are Managed

Papers are now stored as Markdown files in the `papers/` directory. Each paper is a `.md` file with frontmatter (metadata) at the top.

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

2. After adding your paper, run the update script:
```bash
./update-papers.sh
```

This will update `papers/papers-list.json` with all markdown files in the papers directory.

3. Commit and push your changes. The website will automatically display the new paper.

## How to Run Locally

```bash
git clone https://github.com/Moka-Reads/open-pages.mokareads.org.git
cd open-pages.mokareads.org
python -m http.server
```

The website is now running on `http://localhost:8000`

## Theme Selection

The website includes three themes:
- **Current** - Original dark blue theme
- **Default** - Same as current with organized CSS variables
- **Moka** - Brown and creamy coffee-inspired theme

Users can switch themes using the selector in the top-right corner. Their preference is saved locally.