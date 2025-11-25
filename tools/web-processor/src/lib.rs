use pulldown_cmark::{html, Options, Parser};
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

// Import the `console.log` function from the browser
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Define a macro for logging
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Author {
    name: String,
    affiliation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct PaperMetadata {
    title: Option<String>,
    authors: Option<Vec<Author>>,
    tags: Option<Vec<String>>,
    status: Option<String>,
    #[serde(rename = "lastUpdated")]
    last_updated: Option<String>,
    toc: Option<Vec<String>>,
    #[serde(flatten)]
    extra: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Serialize, Clone)]
pub struct Paper {
    pub title: String,
    pub slug: String,
    pub filename: String,
    pub summary: String,
    #[serde(rename = "abstract")]
    pub abstract_text: String,
    pub toc: Vec<String>,
    pub content: String,
    pub html: String,
    #[serde(rename = "lastUpdated")]
    pub last_updated: String,
    pub authors: Vec<Author>,
    pub tags: Option<Vec<String>>,
    pub status: Option<String>,
    #[serde(flatten)]
    pub extra: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct ProcessedContent {
    pub papers: Vec<Paper>,
    pub categories: Vec<String>,
}

#[wasm_bindgen]
pub struct PaperProcessor {
    papers: Vec<Paper>,
}

#[wasm_bindgen]
impl PaperProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new() -> PaperProcessor {
        console_error_panic_hook::set_once();
        PaperProcessor { papers: Vec::new() }
    }

    /// Process a single markdown file and add it to the collection
    #[wasm_bindgen]
    pub fn process_paper(&mut self, filename: &str, content: &str) -> Result<(), JsValue> {
        match self.process_single_paper(filename, content) {
            Ok(paper) => {
                self.papers.push(paper);
                Ok(())
            }
            Err(e) => {
                console_log!("Error processing {}: {}", filename, e);
                Err(JsValue::from_str(&format!(
                    "Failed to process paper: {}",
                    e
                )))
            }
        }
    }

    /// Get all processed papers as JSON
    #[wasm_bindgen]
    pub fn get_papers_json(&self) -> Result<String, JsValue> {
        serde_json::to_string_pretty(&self.papers)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize papers: {}", e)))
    }

    /// Get paper list (lighter version) as JSON
    #[wasm_bindgen]
    pub fn get_papers_list_json(&self) -> Result<String, JsValue> {
        let papers_list: Vec<_> = self
            .papers
            .iter()
            .map(|paper| {
                serde_json::json!({
                    "title": paper.title,
                    "slug": paper.slug,
                    "status": paper.status,
                    "tags": paper.tags.as_ref().unwrap_or(&vec![]),
                    "summary": paper.summary,
                    "lastUpdated": paper.last_updated,
                    "authors": paper.authors
                })
            })
            .collect();

        serde_json::to_string_pretty(&papers_list)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize papers list: {}", e)))
    }

    /// Get categories as JSON
    #[wasm_bindgen]
    pub fn get_categories_json(&self) -> Result<String, JsValue> {
        let categories = self.extract_categories();
        serde_json::to_string_pretty(&categories)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize categories: {}", e)))
    }

    /// Get a specific paper by slug as JSON
    #[wasm_bindgen]
    pub fn get_paper_by_slug(&self, slug: &str) -> Result<String, JsValue> {
        let paper = self
            .papers
            .iter()
            .find(|p| p.slug == slug)
            .ok_or_else(|| JsValue::from_str(&format!("Paper not found: {}", slug)))?;

        serde_json::to_string_pretty(paper)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize paper: {}", e)))
    }

    /// Clear all processed papers
    #[wasm_bindgen]
    pub fn clear(&mut self) {
        self.papers.clear();
    }

    /// Get count of processed papers
    #[wasm_bindgen]
    pub fn get_paper_count(&self) -> usize {
        self.papers.len()
    }

    /// Get all paper slugs
    #[wasm_bindgen]
    pub fn get_paper_slugs(&self) -> js_sys::Array {
        let slugs = js_sys::Array::new();
        for paper in &self.papers {
            slugs.push(&JsValue::from_str(&paper.slug));
        }
        slugs
    }
}

impl PaperProcessor {
    fn process_single_paper(
        &self,
        filename: &str,
        content: &str,
    ) -> Result<Paper, Box<dyn std::error::Error>> {
        let (metadata, markdown) = self.parse_frontmatter(content)?;
        let sections = self.parse_markdown_sections(&markdown);
        let toc = self.extract_toc(&markdown);

        let slug = filename.strip_suffix(".md").unwrap_or(filename).to_string();

        // Warn if title is missing
        if metadata.title.is_none() {
            console_log!(
                "WARNING: Paper {} is missing a title in frontmatter!",
                filename
            );
        }

        let paper = Paper {
            title: metadata.title.clone().unwrap_or_else(|| slug.clone()),
            slug,
            filename: filename.to_string(),
            summary: sections
                .get("summary")
                .cloned()
                .unwrap_or_else(|| "No summary available".to_string()),
            abstract_text: sections.get("abstract").cloned().unwrap_or_default(),
            toc: if !toc.is_empty() {
                toc
            } else {
                metadata.toc.unwrap_or_default()
            },
            content: markdown.clone(),
            html: self.markdown_to_html(&markdown),
            last_updated: metadata.last_updated.unwrap_or_else(|| {
                // Use current timestamp in ISO format
                js_sys::Date::new_0().to_iso_string().into()
            }),
            authors: metadata.authors.unwrap_or_default(),
            tags: metadata.tags,
            status: metadata.status,
            extra: metadata.extra,
        };

        Ok(paper)
    }

    fn parse_frontmatter(
        &self,
        content: &str,
    ) -> Result<(PaperMetadata, String), Box<dyn std::error::Error>> {
        let frontmatter_regex = Regex::new(r"^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$")?;

        if let Some(captures) = frontmatter_regex.captures(content) {
            let yaml_content = &captures[1];
            let markdown_content = &captures[2];

            let metadata: PaperMetadata = serde_yaml::from_str(yaml_content)?;
            Ok((metadata, markdown_content.to_string()))
        } else {
            console_log!(
                "No frontmatter found in content. This will cause issues in the web interface."
            );
            Ok((
                PaperMetadata {
                    title: None,
                    authors: None,
                    tags: None,
                    status: None,
                    last_updated: None,
                    toc: None,
                    extra: HashMap::new(),
                },
                content.to_string(),
            ))
        }
    }

    fn parse_markdown_sections(&self, markdown: &str) -> HashMap<String, String> {
        let mut sections = HashMap::new();
        let lines: Vec<&str> = markdown.lines().collect();
        let mut current_section: Option<String> = None;
        let mut current_content = Vec::new();

        for line in lines {
            if line.starts_with("## ") {
                // Save previous section if exists
                if let Some(section) = &current_section {
                    sections.insert(
                        section.clone(),
                        current_content.join("\n").trim().to_string(),
                    );
                }
                // Start new section
                current_section = Some(line[3..].to_lowercase());
                current_content.clear();
            } else if current_section.is_some() {
                current_content.push(line);
            }
        }

        // Save final section
        if let Some(section) = current_section {
            sections.insert(section, current_content.join("\n").trim().to_string());
        }

        sections
    }

    fn extract_toc(&self, markdown: &str) -> Vec<String> {
        // Find the TOC section manually since Rust regex doesn't support lookahead
        if let Some(start) = markdown.find("## Table of Contents") {
            let after_toc = &markdown[start..];

            // Find the end by looking for the next ## header or end of string
            let end = after_toc.find("\n## ").unwrap_or(after_toc.len());
            let toc_section = &after_toc[..end];

            let item_regex = Regex::new(r"^\d+\.\s+\*\*(.*?)\*\*").unwrap();

            toc_section
                .lines()
                .filter_map(|line| item_regex.captures(line).map(|cap| cap[1].to_string()))
                .collect()
        } else {
            Vec::new()
        }
    }

    fn markdown_to_html(&self, markdown: &str) -> String {
        let mut options = Options::empty();
        options.insert(Options::ENABLE_STRIKETHROUGH);
        options.insert(Options::ENABLE_TABLES);
        options.insert(Options::ENABLE_FOOTNOTES);
        options.insert(Options::ENABLE_TASKLISTS);

        let parser = Parser::new_ext(markdown, options);
        let mut html_output = String::new();
        html::push_html(&mut html_output, parser);

        // Add id attributes to headings to match Node.js marked behavior
        let heading_regex = Regex::new(r"<h(\d)>([^<]+)</h\d>").unwrap();
        heading_regex
            .replace_all(&html_output, |caps: &regex::Captures| {
                let level = &caps[1];
                let text = &caps[2];
                let id = text.to_lowercase().replace(" ", "-").replace(
                    &[
                        '!', '?', ':', ';', ',', '.', '"', '\'', '(', ')', '[', ']', '{', '}',
                    ],
                    "",
                );
                format!("<h{} id=\"{}\">{}</h{}>", level, id, text, level)
            })
            .to_string()
    }

    fn extract_categories(&self) -> Vec<String> {
        let mut categories = std::collections::HashSet::new();

        for paper in &self.papers {
            if let Some(ref tags) = paper.tags {
                for tag in tags {
                    categories.insert(tag.clone());
                }
            }
        }

        let mut sorted_categories: Vec<String> = categories.into_iter().collect();
        sorted_categories.sort();
        sorted_categories
    }
}

/// Utility function to extract files from a tar archive
#[wasm_bindgen]
pub fn process_tar_archive(tar_data: &[u8]) -> Result<js_sys::Array, JsValue> {
    let files = js_sys::Array::new();

    // Simple tar parsing - this is a basic implementation
    // For production, you might want to use a proper tar library
    let mut offset = 0;

    while offset + 512 <= tar_data.len() {
        let header = &tar_data[offset..offset + 512];

        // Check if this is the end of the archive (all zeros)
        if header.iter().all(|&b| b == 0) {
            break;
        }

        // Parse filename (first 100 bytes, null-terminated)
        let filename_bytes = &header[0..100];
        let filename_end = filename_bytes.iter().position(|&b| b == 0).unwrap_or(100);
        let filename = String::from_utf8_lossy(&filename_bytes[..filename_end]).to_string();

        // Parse file size (12 bytes starting at offset 124, octal)
        let size_bytes = &header[124..136];
        let size_end = size_bytes
            .iter()
            .position(|&b| b == 0 || b == b' ')
            .unwrap_or(12);
        let size_str = String::from_utf8_lossy(&size_bytes[..size_end]);
        let size = u64::from_str_radix(&size_str, 8).unwrap_or(0);

        offset += 512; // Move past header

        if size > 0 && filename.ends_with(".md") {
            let content_end = offset + size as usize;
            if content_end <= tar_data.len() {
                let content = &tar_data[offset..content_end];
                let content_str = String::from_utf8_lossy(content).to_string();

                let file_obj = js_sys::Object::new();
                js_sys::Reflect::set(&file_obj, &"filename".into(), &filename.into())?;
                js_sys::Reflect::set(&file_obj, &"content".into(), &content_str.into())?;
                files.push(&file_obj);
            }

            // Round up to next 512-byte boundary
            let padded_size = ((size + 511) / 512) * 512;
            offset += padded_size as usize;
        } else {
            // Skip non-markdown files or empty files
            let padded_size = ((size + 511) / 512) * 512;
            offset += padded_size as usize;
        }
    }

    Ok(files)
}
