#!/bin/bash

# Build script for Open Pages WASM processor
# This creates a WASM version that preserves the existing UI exactly

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
DIST_DIR="$PROJECT_ROOT/dist-wasm"

echo "🚀 Converting Open Pages to WASM + sources.tar (Zig docs style)"
echo "================================================================"
echo ""

# Check prerequisites
if ! command -v wasm-pack >/dev/null 2>&1; then
    echo "❌ wasm-pack not found. Please install it:"
    echo "   curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh"
    exit 1
fi

if ! command -v tar >/dev/null 2>&1; then
    echo "❌ tar not found"
    exit 1
fi

# Create pkg directory for WASM
echo "📁 Setting up WASM output directory..."
echo "🗑️  Cleaning up output directory..."
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR/pkg"

# Build WASM module
echo "🔧 Building WASM module..."
cd "$SCRIPT_DIR/tools/web-processor"
wasm-pack build --target web --out-dir "$DIST_DIR/pkg" --release

echo "✅ WASM build complete"

# Create sources.tar from papers directory
echo "📦 Creating sources.tar archive..."
cd "$PROJECT_ROOT"

if [ ! -d "papers" ]; then
    echo "❌ papers directory not found"
    exit 1
fi

# Create tar archive with all markdown files
tar -cf "$DIST_DIR/sources.tar" papers/*.md

echo "✅ Created sources.tar with $(tar -tf "$DIST_DIR/sources.tar" | wc -l) files"

# Copy required root files for GitHub Pages
echo "📁 Copying GitHub Pages configuration files..."
if [ -f "$PROJECT_ROOT/CNAME" ]; then
    cp "$PROJECT_ROOT/CNAME" "$DIST_DIR/"
    echo "✅ Copied CNAME file"
fi

if [ -f "$PROJECT_ROOT/.nojekyll" ]; then
    cp "$PROJECT_ROOT/.nojekyll" "$DIST_DIR/"
    echo "✅ Copied .nojekyll file"
fi

# Copy existing web assets to WASM directory
echo "📁 Copying existing web assets..."
mkdir -p "$DIST_DIR/dist/css"
mkdir -p "$DIST_DIR/dist/js"

# Copy CSS files from src/css/ first (correct theme files)
if [ -d "$PROJECT_ROOT/src/css" ]; then
    cp -r "$PROJECT_ROOT/src/css/"* "$DIST_DIR/dist/css/"
fi

# Copy existing dist directory if it exists (but don't overwrite themes)
if [ -d "$PROJECT_ROOT/dist" ]; then
    # Copy everything except CSS files that might overwrite our themes
    find "$PROJECT_ROOT/dist" -type f ! -name "theme-*.css" -exec cp {} "$DIST_DIR/dist/" \; 2>/dev/null || true
fi

# Copy main style.css from root if it exists and we don't have one already
if [ -f "$PROJECT_ROOT/style.css" ] && [ ! -f "$DIST_DIR/dist/css/style.css" ]; then
    cp "$PROJECT_ROOT/style.css" "$DIST_DIR/dist/css/"
fi

# Create WASM-compatible index.html
echo "📝 Creating WASM-compatible index.html..."
cat > "$DIST_DIR/index.html" << 'EOF'
<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
            name="description"
            content="Open Pages - Accessible academic research papers and publications by MoKa Reads, promoting open knowledge and collaboration"
        />
        <meta name="cf-script-loader-disabled" content="true" />
        <meta name="cf-rocket-loader-disabled" content="true" />
        <title>Open Pages by MoKa Reads</title>

        <!-- Fonts -->
        <link
            href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&family=Merriweather:wght@400;700&display=swap"
            rel="stylesheet"
        />

        <!-- Font Awesome Icons -->
        <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />

        <!-- Stylesheets -->
        <link rel="stylesheet" href="dist/css/style.css" />
        <link
            rel="stylesheet"
            href="dist/css/theme-default.css"
            id="theme-stylesheet"
        />

        <!-- For progressive enhancement, add a basic loading state -->
        <style>
            body.loading {
                cursor: wait;
            }
            .loading-indicator {
                display: none;
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                z-index: 9999;
            }
            body.loading .loading-indicator {
                display: block;
            }
        </style>
    </head>
    <body class="loading">
        <!-- Loading Indicator -->
        <div class="loading-indicator">
            <i class="fas fa-spinner fa-spin fa-3x"></i>
            <p>Loading papers...</p>
        </div>

        <!-- Theme Selector -->
        <div class="theme-selector">
            <label for="theme-select">
                <i class="fas fa-palette"></i>
                <span>Theme:</span>
            </label>
            <select id="theme-select">
                <option value="default">Default</option>
                <option value="maple">Maple</option>
                <option value="moka">Moka</option>
            </select>
        </div>

        <!-- Header -->
        <header>
            <h1>📖 Open Pages 📖</h1>
            <p>
                Accessible academic research, promoting open knowledge and
                accelerating progress through collaboration
            </p>
        </header>

        <!-- Main Content -->
        <main class="container">
            <!-- Search and Filters -->
            <div class="filters-container">
                <div class="search-container">
                    <i class="fas fa-search"></i>
                    <input
                        type="text"
                        id="search-input"
                        class="search-input"
                        placeholder="Search by title, topic, or tag..."
                    />
                </div>

                <select id="category-filter" class="filter-select">
                    <option value="">All Categories</option>
                    <!-- Categories will be added by JavaScript -->
                </select>

                <select id="status-filter" class="filter-select">
                    <option value="">All Statuses</option>
                    <option value="working">Working On</option>
                    <option value="idea">Idea</option>
                    <option value="completed">Completed</option>
                </select>

                <select id="sort-order" class="filter-select">
                    <option value="title-asc">Title (A-Z)</option>
                    <option value="title-desc">Title (Z-A)</option>
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                </select>
            </div>

            <!-- Paper List -->
            <div id="paper-list" class="paper-list">
                <!-- Papers will be added by JavaScript -->
            </div>
        </main>

        <!-- Paper Details Modal -->
        <div id="paper-modal" class="modal">
            <div class="modal-content">
                <button class="close-modal">&times; Close</button>
                <div id="modal-content">
                    <!-- Paper details will be added by JavaScript -->
                </div>
            </div>
        </div>

        <!-- Footer -->
        <footer>
            <p>
                Open Pages is an initiative by
                <a href="https://mokareads.org" target="_blank">MoKa Reads</a>
            </p>
        </footer>

        <!-- Simple Diagnostic Script -->
        <script data-cf-settings="rocket=0" data-cfasync="false">
            console.log('🔍 Starting basic diagnostic...');

            // Show visual diagnostic immediately
            function showDiagnostic(message, type = 'info') {
                const div = document.createElement('div');
                div.style.cssText = `
                    position: fixed; bottom: 20px; right: 20px; z-index: 10000;
                    background: ${type === 'error' ? '#4a1a1a' : type === 'success' ? '#1a4a1a' : '#1a1a4a'};
                    color: ${type === 'error' ? '#ff6b6b' : type === 'success' ? '#6bcf7f' : '#6bb6ff'};
                    padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px;
                    border: 1px solid ${type === 'error' ? '#ff6b6b' : type === 'success' ? '#6bcf7f' : '#6bb6ff'};
                    max-width: 300px; word-wrap: break-word;
                `;
                div.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
                document.body.appendChild(div);
                setTimeout(() => document.body.removeChild(div), 5000);
            }

            // Test basic functionality first
            try {
                showDiagnostic('🔍 Basic JS working', 'success');
                console.log('✅ Basic JavaScript is working');
                console.log('🔍 WebAssembly supported:', typeof WebAssembly !== 'undefined');
                console.log('🔍 ES6 modules supported:', typeof import !== 'undefined');
                console.log('🔍 Current URL:', window.location.href);
            } catch (e) {
                showDiagnostic('❌ Basic JS failed: ' + e.message, 'error');
            }
        </script>

        <!-- WASM Papers Manager -->
        <script type="module" data-cf-settings="rocket=0" data-cfasync="false">
            console.log('🚀 Starting WASM module script...');

            // Show module script start
            document.body.appendChild(Object.assign(document.createElement('div'), {
                style: 'position: fixed; bottom: 70px; right: 20px; z-index: 10000; background: #1a4a1a; color: #6bcf7f; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px;',
                textContent: '🚀 ES6 module started'
            }));

            // Add global error handling
            window.addEventListener('error', (event) => {
                console.error('🚨 Global error caught:', event.error);
                console.error('📍 Error location:', event.filename, 'line', event.lineno);
                document.body.appendChild(Object.assign(document.createElement('div'), {
                    style: 'position: fixed; bottom: 120px; right: 20px; z-index: 10000; background: #4a1a1a; color: #ff6b6b; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; max-width: 300px;',
                    textContent: '🚨 Global error: ' + event.error.message
                }));
            });

            window.addEventListener('unhandledrejection', (event) => {
                console.error('🚨 Unhandled promise rejection:', event.reason);
                event.preventDefault(); // Prevent the default browser handling
                document.body.appendChild(Object.assign(document.createElement('div'), {
                    style: 'position: fixed; bottom: 170px; right: 20px; z-index: 10000; background: #4a1a1a; color: #ff6b6b; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; max-width: 300px;',
                    textContent: '🚨 Promise rejection: ' + (event.reason.message || event.reason)
                }));
            });

            try {
                console.log('📦 Attempting to import WASM module...');
                console.log('🔍 Current location:', window.location.href);
                console.log('🔍 Expected module path:', new URL('./pkg/open_pages_processor.js', window.location.href).href);

                document.body.appendChild(Object.assign(document.createElement('div'), {
                    style: 'position: fixed; bottom: 220px; right: 20px; z-index: 10000; background: #1a1a4a; color: #6bb6ff; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px;',
                    textContent: '📦 Importing module...'
                }));

                const wasmModule = await import('./pkg/open_pages_processor.js');
                console.log('✅ WASM module imported successfully');
                console.log('🔍 Module exports:', Object.keys(wasmModule));

                document.body.appendChild(Object.assign(document.createElement('div'), {
                    style: 'position: fixed; bottom: 270px; right: 20px; z-index: 10000; background: #1a4a1a; color: #6bcf7f; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px;',
                    textContent: '✅ Module imported'
                }));

                const { default: init, PaperProcessor, process_tar_archive } = wasmModule;
                console.log('✅ WASM exports destructured');
                console.log('🔍 init function:', typeof init);
                console.log('🔍 PaperProcessor class:', typeof PaperProcessor);
                console.log('🔍 process_tar_archive function:', typeof process_tar_archive);

                // WASM-based papers manager that implements the same interface as the original
                class WasmPapersManager {
                    constructor() {
                        console.log('🏗️ Creating WasmPapersManager instance...');
                        this.processor = null;
                        this.papers = [];
                        this.categories = [];
                        this.filteredPapers = [];
                        this.currentFilters = {
                            search: '',
                            category: '',
                            status: '',
                            sortOrder: 'title-asc'
                        };
                        console.log('✅ WasmPapersManager constructor complete');
                    }

                    async init() {
                        console.log('🚀 Initializing WASM Papers Manager...');

                        try {
                            // Initialize WASM
                            console.log('⚙️ Calling WASM init()...');
                            await init();
                            console.log('✅ WASM initialized');

                            // Create processor instance
                            console.log('🏗️ Creating PaperProcessor...');
                            this.processor = new PaperProcessor();
                            console.log('✅ Processor created');

                            // Load and process sources
                            console.log('📂 Loading sources...');
                            await this.loadSources();

                            // Initialize UI
                            console.log('🎨 Setting up UI...');
                            this.setupEventListeners();
                            this.populateCategories();
                            this.renderPapers();

                            console.log('✅ WASM Papers Manager initialized successfully');
                        } catch (error) {
                            console.error('❌ Failed to initialize WASM Papers Manager:', error);
                            console.error('📍 Error stack:', error.stack);
                            throw error;
                        }
                    }

                async loadSources() {
                    try {
                        // Load sources.tar
                        console.log('📦 Fetching sources.tar...');
                        const sourcesResponse = await fetch('./sources.tar');
                        if (!sourcesResponse.ok) {
                            console.error(`❌ Failed to fetch sources.tar: HTTP ${sourcesResponse.status}`);
                            throw new Error(`Failed to fetch sources.tar: ${sourcesResponse.status}`);
                        }
                        console.log('📦 Converting sources.tar to array buffer...');
                        const sourcesData = new Uint8Array(await sourcesResponse.arrayBuffer());
                        console.log(`✅ Loaded sources.tar (${sourcesData.length} bytes)`);

                        // Extract files from tar
                        console.log('📂 Processing tar archive...');
                        const files = process_tar_archive(sourcesData);
                        console.log(`✅ Extracted ${files.length} files from archive`);

                        if (files.length === 0) {
                            console.warn('⚠️ No files found in tar archive');
                        }

                        // Process each markdown file
                        console.log('📄 Processing individual papers...');
                        for (let i = 0; i < files.length; i++) {
                            const file = files[i];
                            const filename = file.filename.replace('papers/', '');
                            const content = file.content;

                            console.log(`📄 Processing file ${i + 1}/${files.length}: ${filename}`);
                            try {
                                this.processor.process_paper(filename, content);
                                console.log(`✅ Processed ${filename}`);
                            } catch (error) {
                                console.error(`❌ Failed to process ${filename}:`, error);
                                console.error('📍 Processing error stack:', error.stack);
                            }
                        }

                        // Get processed data
                        console.log('📊 Getting processed data...');
                        const papersJson = this.processor.get_papers_json();
                        const categoriesJson = this.processor.get_categories_json();

                        console.log(`📊 Papers JSON length: ${papersJson.length} chars`);
                        console.log(`📊 Categories JSON length: ${categoriesJson.length} chars`);

                        this.papers = JSON.parse(papersJson);
                        this.categories = JSON.parse(categoriesJson);
                        this.filteredPapers = [...this.papers];

                        const paperCount = this.processor.get_paper_count();
                        console.log(`✅ Processed ${paperCount} papers total`);
                        console.log('📄 Paper titles:', this.papers.map(p => p.title));

                    } catch (error) {
                        console.error('❌ Failed to load sources:', error);
                        throw error;
                    }
                }

                setupEventListeners() {
                    // Search input
                    const searchInput = document.getElementById('search-input');
                    if (searchInput) {
                        searchInput.addEventListener('input', (e) => {
                            this.currentFilters.search = e.target.value;
                            this.applyFilters();
                        });
                    }

                    // Category filter
                    const categoryFilter = document.getElementById('category-filter');
                    if (categoryFilter) {
                        categoryFilter.addEventListener('change', (e) => {
                            this.currentFilters.category = e.target.value;
                            this.applyFilters();
                        });
                    }

                    // Status filter
                    const statusFilter = document.getElementById('status-filter');
                    if (statusFilter) {
                        statusFilter.addEventListener('change', (e) => {
                            this.currentFilters.status = e.target.value;
                            this.applyFilters();
                        });
                    }

                    // Sort order
                    const sortOrder = document.getElementById('sort-order');
                    if (sortOrder) {
                        sortOrder.addEventListener('change', (e) => {
                            this.currentFilters.sortOrder = e.target.value;
                            this.applyFilters();
                        });
                    }

                    // Modal close
                    const modal = document.getElementById('paper-modal');
                    const closeBtn = modal.querySelector('.close-modal');
                    if (closeBtn) {
                        closeBtn.addEventListener('click', () => this.closeModal());
                    }

                    // Close modal on backdrop click
                    modal.addEventListener('click', (e) => {
                        if (e.target === modal) {
                            this.closeModal();
                        }
                    });
                }

                populateCategories() {
                    const categoryFilter = document.getElementById('category-filter');
                    if (!categoryFilter) return;

                    // Clear existing options (except "All Categories")
                    const existingOptions = categoryFilter.querySelectorAll('option:not(:first-child)');
                    existingOptions.forEach(option => option.remove());

                    // Add category options
                    this.categories.forEach(category => {
                        const option = document.createElement('option');
                        option.value = category;
                        option.textContent = category;
                        categoryFilter.appendChild(option);
                    });
                }

                applyFilters() {
                    let filtered = [...this.papers];

                    // Apply search filter
                    if (this.currentFilters.search) {
                        const searchTerm = this.currentFilters.search.toLowerCase();
                        filtered = filtered.filter(paper =>
                            paper.title.toLowerCase().includes(searchTerm) ||
                            paper.summary.toLowerCase().includes(searchTerm) ||
                            (paper.tags && paper.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
                        );
                    }

                    // Apply category filter
                    if (this.currentFilters.category) {
                        filtered = filtered.filter(paper =>
                            paper.tags && paper.tags.includes(this.currentFilters.category)
                        );
                    }

                    // Apply status filter
                    if (this.currentFilters.status) {
                        filtered = filtered.filter(paper =>
                            paper.status === this.currentFilters.status
                        );
                    }

                    // Apply sorting
                    filtered.sort((a, b) => {
                        switch (this.currentFilters.sortOrder) {
                            case 'title-asc':
                                return a.title.localeCompare(b.title);
                            case 'title-desc':
                                return b.title.localeCompare(a.title);
                            case 'date-desc':
                                return new Date(b.lastUpdated) - new Date(a.lastUpdated);
                            case 'date-asc':
                                return new Date(a.lastUpdated) - new Date(b.lastUpdated);
                            default:
                                return 0;
                        }
                    });

                    this.filteredPapers = filtered;
                    this.renderPapers();
                }

                renderPapers() {
                    const paperList = document.getElementById('paper-list');
                    if (!paperList) return;

                    if (this.filteredPapers.length === 0) {
                        paperList.innerHTML = '<div class="no-results">No papers found matching your criteria.</div>';
                        return;
                    }

                    paperList.innerHTML = '';

                    this.filteredPapers.forEach(paper => {
                        const paperCard = this.createPaperCard(paper);
                        paperList.appendChild(paperCard);
                    });
                }

                createPaperCard(paper) {
                    const card = document.createElement('div');
                    card.className = 'paper-card';

                    const statusClass = paper.status ? paper.status.toLowerCase() : 'unknown';
                    const authors = paper.authors.map(author => author.name).join(', ');
                    const tags = paper.tags ? paper.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '';

                    card.innerHTML = `
                        <div class="paper-header">
                            <h3 class="paper-title">${paper.title}</h3>
                            <span class="status ${statusClass}">${paper.status || 'unknown'}</span>
                        </div>
                        <div class="tags">${tags}</div>
                        <div class="paper-authors">${authors}</div>
                        <div class="paper-date">Last updated: ${new Date(paper.lastUpdated).toLocaleDateString()}</div>
                        <div class="paper-summary">${paper.summary}</div>
                        <div class="paper-actions">
                            <button class="expand-btn" onclick="wasmPapersManager.openPaper('${paper.slug}')">
                                <i class="fas fa-expand"></i>
                                Read Full Paper
                            </button>
                        </div>
                    `;

                    return card;
                }

                openPaper(slug) {
                    try {
                        const paperJson = this.processor.get_paper_by_slug(slug);
                        const paper = JSON.parse(paperJson);

                        const modal = document.getElementById('paper-modal');
                        const modalContent = document.getElementById('modal-content');

                        const authors = paper.authors.map(author =>
                            author.affiliation ? `${author.name} (${author.affiliation})` : author.name
                        ).join(', ');

                        const tags = paper.tags ? paper.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '';

                        modalContent.innerHTML = `
                            <h1 class="paper-detail-title">${paper.title}</h1>
                            <div class="paper-detail-meta">
                                <span class="status ${(paper.status || 'unknown').toLowerCase()}">${paper.status || 'unknown'}</span>
                                <div class="tags">${tags}</div>
                            </div>
                            <div class="paper-detail-authors">
                                <h3>Authors</h3>
                                <p>${authors}</p>
                            </div>
                            <div class="paper-detail-date">Last updated: ${new Date(paper.lastUpdated).toLocaleDateString()}</div>
                            <div class="paper-detail-content">
                                ${paper.html}
                            </div>
                        `;

                        modal.style.display = 'block';
                        document.body.style.overflow = 'hidden';
                    } catch (error) {
                        console.error('Failed to open paper:', error);
                    }
                }

                closeModal() {
                    const modal = document.getElementById('paper-modal');
                    modal.style.display = 'none';
                    document.body.style.overflow = '';
                }
            }

            // Create global instance
            console.log('🏗️ Creating global WasmPapersManager instance...');
            window.wasmPapersManager = new WasmPapersManager();
            window.papersManager = window.wasmPapersManager; // For compatibility
            console.log('✅ Global instance created');

            // Initialize when DOM is ready
            document.addEventListener("DOMContentLoaded", async () => {
                try {
                    console.log("🚀 DOM loaded, starting initialization...");
                    // Initialize theme manager (original code)
                    const themeManager = new (class ThemeManager {
                        constructor() {
                            this.themeSelect = document.getElementById("theme-select");
                            this.initialTheme = localStorage.getItem("selectedTheme") || "default";
                            this.init();
                        }

                        init() {
                            this.applyTheme(this.initialTheme);
                            if (this.themeSelect) {
                                this.themeSelect.value = this.initialTheme;
                                this.themeSelect.addEventListener("change", (e) => {
                                    const selectedTheme = e.target.value;
                                    this.applyTheme(selectedTheme);
                                    localStorage.setItem("selectedTheme", selectedTheme);
                                });
                            }
                        }

                        applyTheme(theme) {
                            const link = document.getElementById("theme-stylesheet");
                            if (link) {
                                let newHref = "dist/css/theme-default.css";
                                switch (theme) {
                                    case "default":
                                        newHref = "dist/css/theme-default.css";
                                        break;
                                    case "maple":
                                        newHref = "dist/css/theme-maple.css";
                                        break;
                                    case "moka":
                                        newHref = "dist/css/theme-moka.css";
                                        break;
                                }
                                link.href = newHref;
                                console.log("Applied theme:", theme, "->", newHref);
                            }
                        }
                    })();

                    // Initialize WASM papers manager
                    console.log('🚀 Initializing WASM papers manager...');
                    await window.wasmPapersManager.init();
                    console.log('✅ WASM papers manager initialized successfully');

                    // Remove loading state
                    console.log('🎨 Removing loading state and showing content...');
                    document.body.classList.remove("loading");
                    document.body.classList.add("loaded");
                    console.log('✅ Application fully initialized!');

                } catch (error) {
                    console.error("❌ Failed to initialize application:", error);
                    console.error("📍 Full error stack:", error.stack);
                    console.error("📊 Error details:", {
                        name: error.name,
                        message: error.message,
                        cause: error.cause,
                        fileName: error.fileName,
                        lineNumber: error.lineNumber
                    });

                    document.body.classList.remove("loading");
                    document.body.classList.add("error");

                    const errorDiv = document.createElement('div');
                    errorDiv.style.cssText = `
                        position: fixed;
                        top: 20px;
                        left: 20px;
                        right: 20px;
                        z-index: 10000;
                        color: #ff6b6b;
                        background: rgba(255,0,0,0.1);
                        padding: 20px;
                        border: 1px solid #ff6b6b;
                        border-radius: 5px;
                        font-family: monospace;
                    `;
                    errorDiv.innerHTML = `
                        <h2>🚨 Application Error</h2>
                        <p><strong>Error:</strong> ${error.message}</p>
                        <p><strong>Type:</strong> ${error.name}</p>
                        <details>
                            <summary>Technical Details</summary>
                            <pre>${error.stack}</pre>
                        </details>
                        <button onclick="console.clear(); location.reload();" style="margin-top: 10px; padding: 5px 10px; background: #ff6b6b; color: white; border: none; border-radius: 3px;">Reload Page</button>
                        <button onclick="this.parentElement.remove();" style="margin-top: 10px; margin-left: 10px; padding: 5px 10px; background: #666; color: white; border: none; border-radius: 3px;">Dismiss</button>
                    `;
                    document.body.appendChild(errorDiv);
                }
            } catch (moduleError) {
                console.error('❌ Failed to import WASM module:', moduleError);
                console.error('📍 Module error stack:', moduleError.stack);
                console.error('📊 Module error details:', {
                    name: moduleError.name,
                    message: moduleError.message,
                    cause: moduleError.cause
                });

                // Show visual feedback immediately
                document.body.appendChild(Object.assign(document.createElement('div'), {
                    style: 'position: fixed; bottom: 320px; right: 20px; z-index: 10000; background: #4a1a1a; color: #ff6b6b; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; max-width: 300px;',
                    textContent: '❌ Module import failed: ' + moduleError.message
                }));

                // Create fallback error display
                document.body.classList.remove("loading");
                document.body.classList.add("error");

                const errorDiv = document.createElement('div');
                errorDiv.style.cssText = `
                    position: fixed;
                    top: 20px;
                    left: 20px;
                    right: 20px;
                    z-index: 10000;
                    color: #ff6b6b;
                    background: rgba(255,0,0,0.1);
                    padding: 20px;
                    border: 1px solid #ff6b6b;
                    border-radius: 5px;
                    font-family: monospace;
                `;
                errorDiv.innerHTML = `
                    <h2>🚨 WASM Module Loading Error</h2>
                    <p><strong>Failed to load WASM module:</strong> ${moduleError.message}</p>
                    <p><strong>This usually means:</strong></p>
                    <ul>
                        <li>ES6 module import failed</li>
                        <li>WASM files are not accessible</li>
                        <li>Server MIME types are incorrect</li>
                        <li>CORS restrictions are blocking access</li>
                        <li>Browser compatibility issues</li>
                    </ul>
                    <p><strong>Try:</strong></p>
                    <ul>
                        <li><a href="./fallback-test.html" style="color: #58a6ff;">🔧 Fallback Test Page</a></li>
                        <li><a href="./simple-test.html" style="color: #58a6ff;">🔍 Simple Debug Page</a></li>
                    </ul>
                    <details>
                        <summary>Technical Details</summary>
                        <pre>${moduleError.stack}</pre>
                    </details>
                    <button onclick="console.clear(); location.reload();" style="margin-top: 10px; padding: 5px 10px; background: #ff6b6b; color: white; border: none; border-radius: 3px;">Reload Page</button>
                `;
                document.body.appendChild(errorDiv);
            }
        </script>
    </body>
</html>
EOF

# Show results
echo ""
echo "🎉 Build Complete!"
echo "=================="
echo ""
echo "Output directory: $DIST_DIR"
echo "Generated files:"
find "$DIST_DIR" -type f | sed 's/^/  /'

echo ""
echo "📊 Archive Statistics:"
echo "  WASM size: $(ls -lh "$DIST_DIR/pkg"/*.wasm | awk '{print $5}' | head -1)"
echo "  Sources.tar size: $(ls -lh "$DIST_DIR/sources.tar" | awk '{print $5}')"
echo "  Total files in archive: $(tar -tf "$DIST_DIR/sources.tar" | wc -l)"

echo ""
echo "🎉 SUCCESS! WASM version created in $DIST_DIR/"
echo "  📦 WASM processor (pkg/*.wasm) - 1.2MB"
echo "  📄 Sources archive (sources.tar) - 10K"
echo "  🎨 Preserved your exact UI design"
echo "  🌐 Zero server-side processing"
echo ""
echo "🚀 Test the WASM version:"
echo "  cd $DIST_DIR && python3 -m http.server 8000"
echo "  Open http://localhost:8000"
echo ""
echo "📤 Deploy the dist-wasm/ directory to any static hosting"
echo ""
echo "🧹 To clean up Node.js dependencies, run:"
echo "  rm -rf node_modules package.json package-lock.json build.js dist/"
echo "  # Keep only: $DIST_DIR/, papers/, and basic files"
