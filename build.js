#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { marked } = require("marked");
const yaml = require("js-yaml");
const glob = require("glob");

// Configuration
const PAPERS_DIR = path.join(__dirname, "papers");
const DIST_DIR = path.join(__dirname, "dist");
const ASSETS_DIR = path.join(PAPERS_DIR, "assets");

// Ensure directories exist
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// Parse frontmatter from markdown
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (match) {
    try {
      const metadata = yaml.load(match[1]);
      const markdown = match[2];
      return { metadata, markdown };
    } catch (e) {
      console.error("Error parsing frontmatter:", e);
      return { metadata: {}, markdown: content };
    }
  }
  console.warn(
    "No frontmatter found in content. This will cause issues in the web interface.",
  );
  return { metadata: {}, markdown: content };
}

// Parse markdown sections
function parseMarkdownSections(markdown) {
  const sections = {};
  const lines = markdown.split("\n");
  let currentSection = null;
  let currentContent = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (currentSection) {
        sections[currentSection] = currentContent.join("\n").trim();
      }
      currentSection = line.substring(3).toLowerCase();
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  if (currentSection) {
    sections[currentSection] = currentContent.join("\n").trim();
  }

  return sections;
}

// Extract TOC from markdown
function extractTOC(markdown) {
  const tocSection = markdown.match(/## Table of Contents[\s\S]*?(?=\n## |$)/);
  if (!tocSection) return [];

  const tocItems = [];
  const lines = tocSection[0].split("\n");

  for (const line of lines) {
    // Match numbered items with bold text
    const match = line.match(/^\d+\.\s+\*\*(.*?)\*\*/);
    if (match) {
      tocItems.push(match[1]);
    }
  }

  return tocItems;
}

// Extract categories from papers
function extractCategories(papers) {
  const categories = new Set();

  papers.forEach((paper) => {
    if (paper.tags && Array.isArray(paper.tags)) {
      paper.tags.forEach((tag) => categories.add(tag));
    }
  });

  return Array.from(categories).sort();
}

// Process all papers
function processPapers() {
  console.log("Processing papers...");

  // Find all markdown files
  const markdownFiles = glob.sync(path.join(PAPERS_DIR, "*.md"));
  const papers = [];

  markdownFiles.forEach((file) => {
    const basename = path.basename(file);
    console.log(`Processing ${basename}...`);

    try {
      const content = fs.readFileSync(file, "utf8");
      const { metadata, markdown } = parseFrontmatter(content);
      const sections = parseMarkdownSections(markdown);
      const toc = extractTOC(markdown);

      // Create paper object with all metadata and content
      // Ensure required fields are present
      if (!metadata.title) {
        console.warn(
          `WARNING: Paper ${basename} is missing a title in frontmatter!`,
        );
      }

      const paper = {
        ...metadata,
        filename: basename,
        slug: basename.replace(/\.md$/, ""),
        summary: sections.summary || "No summary available",
        abstract: sections.abstract || "",
        toc: toc.length > 0 ? toc : metadata.toc || [],
        content: markdown,
        html: marked(markdown),
        lastUpdated: metadata.lastUpdated || new Date().toISOString(),
        authors: metadata.authors || [],
        // Add fallback title if missing
        title: metadata.title || basename.replace(".md", ""),
      };

      papers.push(paper);
    } catch (err) {
      console.error(`Error processing ${basename}:`, err);
    }
  });

  // Sort papers by title
  papers.sort((a, b) => a.title.localeCompare(b.title));

  // Extract categories
  const categories = extractCategories(papers);

  // Write complete papers data
  fs.writeFileSync(
    path.join(DIST_DIR, "papers.json"),
    JSON.stringify(papers, null, 2),
  );

  // Write paper list (lighter version)
  const papersList = papers.map((paper) => ({
    title: paper.title,
    slug: paper.slug,
    status: paper.status,
    tags: paper.tags || [],
    summary: paper.summary,
    lastUpdated: paper.lastUpdated,
    authors: paper.authors || [],
  }));

  fs.writeFileSync(
    path.join(DIST_DIR, "papers-list.json"),
    JSON.stringify(papersList, null, 2),
  );

  // Write categories
  fs.writeFileSync(
    path.join(DIST_DIR, "categories.json"),
    JSON.stringify(categories, null, 2),
  );

  // Generate individual paper files
  papers.forEach((paper) => {
    fs.writeFileSync(
      path.join(DIST_DIR, `${paper.slug}.json`),
      JSON.stringify(paper, null, 2),
    );
  });

  // Verify that all papers have the required fields
  let missingFields = [];
  papers.forEach((paper) => {
    if (!paper.title) missingFields.push(`Missing title in ${paper.filename}`);
    if (!paper.slug) missingFields.push(`Missing slug in ${paper.filename}`);
    if (!paper.content)
      missingFields.push(`Missing content in ${paper.filename}`);
  });

  if (missingFields.length > 0) {
    console.warn("WARNING: Some papers have missing fields:");
    missingFields.forEach((msg) => console.warn(`- ${msg}`));
  }

  // Verify that JSON files were created
  const papersJsonPath = path.join(DIST_DIR, "papers.json");
  const categoriesJsonPath = path.join(DIST_DIR, "categories.json");

  if (!fs.existsSync(papersJsonPath)) {
    console.error("ERROR: papers.json was not created!");
  }

  if (!fs.existsSync(categoriesJsonPath)) {
    console.error("ERROR: categories.json was not created!");
  }

  console.log(`Processed ${papers.length} papers`);
  console.log(`Found ${categories.length} categories`);
  console.log("Build complete!");
}

// Main function
function main() {
  processPapers();
}

main();
