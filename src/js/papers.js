/**
 * Papers Management Module
 * Handles loading, displaying, filtering, and searching papers
 *
 * Supports both development and production environments
 *
 * @module papers
 */

// Add compatibility check
console.log("Loading papers.js module...");
if (typeof fetch === "undefined") {
  console.error(
    "Error: This browser doesn't support the fetch API required by this application",
  );
  alert(
    "Your browser doesn't support features needed by this application. Please use a modern browser.",
  );
}

class PapersManager {
  constructor() {
    this.papers = [];
    this.categories = [];
    this.filteredPapers = [];
    this.paperList = document.getElementById("paper-list");
    this.searchInput = document.getElementById("search-input");
    this.categoryFilter = document.getElementById("category-filter");
    this.statusFilter = document.getElementById("status-filter");
    this.sortOrder = document.getElementById("sort-order");
    this.paperModal = document.getElementById("paper-modal");
    this.modalContent = document.getElementById("modal-content");

    // Check if we're in production mode (GitHub Pages)
    this.isProduction =
      window.location.hostname.includes("github.io") ||
      window.location.hostname.includes("mokareads.org");

    // Set the base path for API requests
    this.basePath = this.isProduction ? "" : "";

    // Bind event handlers
    this.bindEvents();
  }

  /**
   * Initialize the papers manager
   */
  async init() {
    console.log("PapersManager.init() called");
    try {
      console.log("Loading papers...");
      await this.loadPapers();
      console.log("Papers loaded successfully");

      console.log("Loading categories...");
      await this.loadCategories();
      console.log("Categories loaded successfully");

      console.log("Rendering papers...");
      this.renderPapers();
      console.log("Papers rendered");

      console.log("Setting up filters...");
      this.setupFilters();
      console.log("Filters set up");

      console.log("PapersManager initialization complete!");
    } catch (error) {
      console.error("Failed to initialize papers:", error);
      this.showError("Failed to load papers. Please try again later.");
      throw error; // Re-throw to allow caller to handle
    }
  }

  /**
   * Bind all event handlers
   */
  bindEvents() {
    // Search input event
    if (this.searchInput) {
      this.searchInput.addEventListener("input", () => this.filterPapers());
    }

    // Category filter change
    if (this.categoryFilter) {
      this.categoryFilter.addEventListener("change", () => this.filterPapers());
    }

    // Status filter change
    if (this.statusFilter) {
      this.statusFilter.addEventListener("change", () => this.filterPapers());
    }

    // Sort order change
    if (this.sortOrder) {
      this.sortOrder.addEventListener("change", () => this.filterPapers());
    }

    // Close modal
    document.addEventListener("click", (event) => {
      if (event.target === this.paperModal) {
        this.closeModal();
      }
    });

    const closeButton = document.querySelector(".close-modal");
    if (closeButton) {
      closeButton.addEventListener("click", () => this.closeModal());
    }
  }

  /**
   * Load papers from the JSON file
   */
  async loadPapers() {
    try {
      console.log("Attempting to load papers from dist/papers.json");

      // Try direct path first
      let response;
      try {
        response = await fetch("dist/papers.json");
      } catch (e) {
        console.warn("First attempt failed, trying alternate path:", e);
        // Try alternate path if first fails
        response = await fetch("./dist/papers.json");
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Papers loaded successfully:", data);

      if (!Array.isArray(data)) {
        throw new Error(
          `Invalid papers data format: expected array, got ${typeof data}`,
        );
      }

      if (data.length === 0) {
        console.warn("Warning: No papers found in the data");
      }

      this.papers = data;
      this.filteredPapers = [...this.papers];
      return this.papers;
    } catch (error) {
      console.error("Error loading papers:", error);
      this.showError(
        `Failed to load papers: ${error.message}. Make sure the build process completed successfully.`,
      );
      throw error;
    }
  }

  /**
   * Load categories from the JSON file
   */
  async loadCategories() {
    try {
      console.log("Attempting to load categories from dist/categories.json");
      const response = await fetch("dist/categories.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const categories = await response.json();
      console.log("Categories loaded successfully:", categories);
      this.categories = categories;
      return this.categories;
    } catch (error) {
      console.error("Error loading categories:", error);
      // Not throwing here as categories are optional
      this.categories = [];
      return [];
    }
  }

  /**
   * Setup filter dropdowns
   */
  setupFilters() {
    // Setup category filter
    if (this.categoryFilter) {
      this.categoryFilter.innerHTML = `
        <option value="">All Categories</option>
        ${this.categories
          .map((category) => `<option value="${category}">${category}</option>`)
          .join("")}
      `;
    }

    // Status filter is static in HTML
  }

  /**
   * Filter papers based on search, category, and status
   */
  filterPapers() {
    const searchTerm = this.searchInput
      ? this.searchInput.value.toLowerCase()
      : "";
    const categoryFilter = this.categoryFilter ? this.categoryFilter.value : "";
    const statusFilter = this.statusFilter ? this.statusFilter.value : "";
    const sortOption = this.sortOrder ? this.sortOrder.value : "title-asc";

    this.filteredPapers = this.papers.filter((paper) => {
      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        paper.title.toLowerCase().includes(searchTerm) ||
        (paper.summary && paper.summary.toLowerCase().includes(searchTerm)) ||
        (paper.tags &&
          paper.tags.some((tag) => tag.toLowerCase().includes(searchTerm))) ||
        // Search in authors
        (paper.authors &&
          paper.authors.some(
            (author) =>
              author.name.toLowerCase().includes(searchTerm) ||
              (author.affiliation &&
                author.affiliation.toLowerCase().includes(searchTerm)),
          ));

      // Category filter
      const matchesCategory =
        categoryFilter === "" ||
        (paper.tags && paper.tags.includes(categoryFilter));

      // Status filter
      const matchesStatus =
        statusFilter === "" || paper.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Apply sorting
    this.sortPapers(sortOption);

    // Render the filtered papers
    this.renderPapers();
  }

  /**
   * Sort papers based on the selected option
   */
  sortPapers(sortOption) {
    switch (sortOption) {
      case "title-asc":
        this.filteredPapers.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title-desc":
        this.filteredPapers.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "date-asc":
        this.filteredPapers.sort((a, b) => {
          // Handle missing dates by treating them as oldest
          if (!a.lastUpdated) return -1;
          if (!b.lastUpdated) return 1;
          return new Date(a.lastUpdated) - new Date(b.lastUpdated);
        });
        break;
      case "date-desc":
        this.filteredPapers.sort((a, b) => {
          // Handle missing dates by treating them as oldest
          if (!a.lastUpdated) return 1;
          if (!b.lastUpdated) return -1;
          return new Date(b.lastUpdated) - new Date(a.lastUpdated);
        });
        break;
      default:
        this.filteredPapers.sort((a, b) => a.title.localeCompare(b.title));
    }
  }

  /**
   * Render papers to the page
   */
  renderPapers() {
    if (!this.paperList) {
      console.error("Paper list element not found in the DOM");
      return;
    }

    console.log(`Rendering ${this.filteredPapers.length} papers`);

    if (this.filteredPapers.length === 0) {
      this.paperList.innerHTML = `
        <div class="no-results">
          <p>No papers found matching your criteria.</p>
          <button class="reset-btn" onclick="papersManager.resetFilters()">Reset Filters</button>
        </div>
      `;
      return;
    }

    try {
      this.paperList.innerHTML = this.filteredPapers
        .map((paper) => this.createPaperCard(paper))
        .join("");

      // Add event listeners to the paper cards
      document.querySelectorAll(".expand-btn").forEach((button) => {
        button.addEventListener("click", (event) => {
          const slug = event.target.dataset.slug;
          this.openPaperDetails(slug);
        });
      });

      console.log("Papers rendered successfully");
    } catch (error) {
      console.error("Error rendering papers:", error);
      this.showError(`Error rendering papers: ${error.message}`);
    }
  }

  /**
   * Create a paper card HTML
   */
  createPaperCard(paper) {
    try {
      if (!paper) {
        console.error("Attempt to create card with undefined paper");
        return `<div class="paper-card error">Error: Invalid paper data</div>`;
      }

      console.log(`Creating card for paper: ${paper.title || "Untitled"}`);

      const statusLabel = this.getStatusLabel(paper.status);
      const statusClass = paper.status || "unknown";
      const title = paper.title || "Untitled Paper";
      const summary = paper.summary || "No summary available";

      // Format authors if available
      const authorsHtml =
        paper.authors && paper.authors.length > 0
          ? `<div class="paper-authors">${paper.authors.map((author) => author.name).join(", ")}</div>`
          : "";

      // Format last updated date if available
      const lastUpdatedHtml = paper.lastUpdated
        ? `<div class="paper-date">Updated: ${new Date(paper.lastUpdated).toLocaleDateString()}</div>`
        : "";

      // Only show links if they're not empty and not "#" placeholders
      const githubBtn =
        paper.github && paper.github !== "#"
          ? `<a href="${paper.github}" class="action-link" target="_blank"><i class="fab fa-github"></i> GitHub</a>`
          : "";

      const pdfBtn =
        paper.pdf && paper.pdf !== "#"
          ? `<a href="${paper.pdf}" class="action-link" target="_blank"><i class="fas fa-file-pdf"></i> PDF</a>`
          : "";

      const purchaseBtn =
        paper.purchase && paper.purchase !== "#"
          ? `<a href="${paper.purchase}" class="action-link" target="_blank"><i class="fas fa-shopping-cart"></i> Purchase</a>`
          : "";

      return `
        <div class="paper-card">
          <div class="paper-header">
            <h3 class="paper-title">${title}</h3>
            <span class="status ${statusClass}">${statusLabel}</span>
          </div>
          ${authorsHtml}
          ${lastUpdatedHtml}
          <div class="tags">
            ${(paper.tags || []).map((tag) => `<span class="tag">${tag}</span>`).join("")}
          </div>
          <div class="paper-summary">${summary}</div>
          <div class="paper-actions">
            ${githubBtn}
            ${pdfBtn}
            ${purchaseBtn}
            <button class="expand-btn" data-slug="${paper.slug}">Read More</button>
          </div>
        </div>
      `;
    } catch (error) {
      console.error("Error creating paper card:", error, paper);
      return `<div class="paper-card error">Error creating card: ${error.message}</div>`;
    }
  }

  /**
   * Get the display label for a status
   */
  getStatusLabel(status) {
    switch (status) {
      case "working":
        return "Working On";
      case "idea":
        return "Idea";
      case "completed":
        return "Completed";
      default:
        return "Unknown";
    }
  }

  /**
   * Open the paper details modal
   */
  async openPaperDetails(slug) {
    try {
      // Show loading state
      this.paperModal.style.display = "block";
      this.modalContent.innerHTML =
        '<div class="loading">Loading paper details...</div>';

      console.log(`Loading paper details for: ${slug}`);

      // Fetch the paper details
      const response = await fetch(`dist/${slug}.json`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const paper = await response.json();
      console.log("Paper details loaded:", paper);

      if (!paper || !paper.title) {
        throw new Error("Invalid paper data received");
      }

      // Render the paper details
      // Format authors section if available
      const authorsSection =
        paper.authors && paper.authors.length > 0
          ? `<div class="paper-detail-authors">
            <h3>Authors</h3>
            <ul>
              ${paper.authors
                .map(
                  (author) =>
                    `<li>${author.name}${author.affiliation ? ` - ${author.affiliation}` : ""}</li>`,
                )
                .join("")}
            </ul>
          </div>`
          : "";

      // Format last updated date
      const lastUpdatedHtml = paper.lastUpdated
        ? `<div class="paper-detail-date">Last updated: ${new Date(paper.lastUpdated).toLocaleDateString()}</div>`
        : "";

      this.modalContent.innerHTML = `
        <div class="paper-detail">
          <h1 class="paper-detail-title">${paper.title}</h1>
          ${lastUpdatedHtml}
          ${authorsSection}
          <div class="paper-detail-meta">
            <span class="status ${paper.status}">${this.getStatusLabel(paper.status)}</span>
            <div class="tags">
              ${(paper.tags || []).map((tag) => `<span class="tag">${tag}</span>`).join("")}
            </div>
          </div>
          <div class="paper-detail-links">
            ${paper.github && paper.github !== "#" ? `<a href="${paper.github}" class="detail-link" target="_blank"><i class="fab fa-github"></i> GitHub</a>` : ""}
            ${paper.pdf && paper.pdf !== "#" ? `<a href="${paper.pdf}" class="detail-link" target="_blank"><i class="fas fa-file-pdf"></i> PDF</a>` : ""}
            ${paper.purchase && paper.purchase !== "#" ? `<a href="${paper.purchase}" class="detail-link" target="_blank"><i class="fas fa-shopping-cart"></i> Purchase</a>` : ""}
          </div>
          <div class="paper-detail-content">
            ${paper.html || "No content available"}
          </div>
        </div>
      `;
      console.log("Paper details rendered successfully");
    } catch (error) {
      console.error("Error loading paper details:", error);
      this.modalContent.innerHTML = `
        <div class="error">
          <p>Failed to load paper details: ${error.message}</p>
          <p>Please check the browser console for more information.</p>
          <button class="close-modal">Close</button>
        </div>
      `;
    }
  }

  /**
   * Close the paper details modal
   */
  closeModal() {
    if (this.paperModal) {
      this.paperModal.style.display = "none";
    }
  }

  /**
   * Reset all filters
   */
  resetFilters() {
    if (this.searchInput) this.searchInput.value = "";
    if (this.categoryFilter) this.categoryFilter.value = "";
    if (this.statusFilter) this.statusFilter.value = "";
    if (this.sortOrder) this.sortOrder.value = "title-asc";

    this.filteredPapers = [...this.papers];
    this.renderPapers();
  }

  /**
   * Show an error message
   */
  showError(message) {
    console.error(`Error: ${message}`);
    if (this.paperList) {
      this.paperList.innerHTML = `
        <div class="error-message">
          <p>${message}</p>
          <p>Check the browser console (F12) for more information.</p>
          <button class="reset-btn" onclick="location.reload()">Reload Page</button>
        </div>
      `;
    } else {
      alert(
        `Error: ${message}\nPlease check the browser console for more details.`,
      );
    }
  }
}

// Create a singleton instance
const papersManager = new PapersManager();

// Fix for ES modules in browsers
// This handles both ES module environments and script tag imports
try {
  if (typeof module !== "undefined" && module.exports) {
    // CommonJS environment (Node.js)
    module.exports = papersManager;
  } else {
    // Browser environment
    window.papersManager = papersManager;
  }
} catch (e) {
  // Browser environment fallback
  window.papersManager = papersManager;
  console.log("Set up papersManager in global scope");
}

// ES module export
export default papersManager;
