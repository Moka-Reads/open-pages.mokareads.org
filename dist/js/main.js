/**
 * Main JavaScript Entry Point
 * Initializes the Open Pages application
 */



// Detect if we're in production mode (GitHub Pages)
const isProduction =
  window.location.hostname.includes("github.io") ||
  window.location.hostname.includes("mokareads.org");

console.log("Environment detection:", {
  hostname: window.location.hostname,
  isProduction: isProduction,
  documentPath: document.location.pathname,
  baseURI: document.baseURI,
});

// Theme management
class ThemeManager {
  constructor() {
    this.themeSelect = document.getElementById("theme-select");
    this.initialTheme = localStorage.getItem("selectedTheme") || "default";

    this.init();
  }

  init() {
    console.log("ThemeManager.init() called");
    console.log("Initial theme:", this.initialTheme);

    // Set initial theme
    this.applyTheme(this.initialTheme);

    // Update dropdown to match current theme
    if (this.themeSelect) {
      console.log("Theme select element found:", this.themeSelect);
      this.themeSelect.value = this.initialTheme;

      // Listen for theme changes
      this.themeSelect.addEventListener("change", (e) => {
        const selectedTheme = e.target.value;
        console.log("Theme changed to:", selectedTheme);
        this.applyTheme(selectedTheme);
        localStorage.setItem("selectedTheme", selectedTheme);
      });
    } else {
      console.warn("Theme select element not found in the DOM");
    }
  }

  applyTheme(theme) {
    console.log("ThemeManager.applyTheme() called with theme:", theme);
    const link = document.getElementById("theme-stylesheet");
    if (link) {
      console.log("Theme stylesheet link found:", link);
      let newHref = "dist/css/theme-default.css"; // Default value

      switch (theme) {
        case "default":
          newHref = "dist/css/theme-default.css";
          break;
        case "maple":
          newHref = "dist/css/theme-maple.css";
          break;
        default:
          console.warn(`Unknown theme: "${theme}", falling back to default`);
          newHref = "dist/css/theme-default.css";
      }

      console.log(`Setting theme stylesheet href to: ${newHref}`);
      link.href = newHref;

      // Verify the change was applied
      setTimeout(() => {
        console.log("Current stylesheet href:", link.href);
      }, 100);
    } else {
      console.error("Theme stylesheet link element not found!");
    }
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM Content Loaded - Starting initialization");

  try {
    console.log("Initializing theme manager...");
    // Initialize theme manager
    const themeManager = new ThemeManager();
    console.log("Theme manager initialized successfully");

    // Debug info about papersManager
    console.log("About to initialize papers manager...");
    console.log("papersManager object:", papersManager);

    // Initialize papers manager with more detailed error handling
    try {
      console.log("Calling papersManager.init()...");
      await papersManager.init();
      console.log("Papers manager initialized successfully");
    } catch (paperError) {
      console.error("Error initializing papers manager:", paperError);
      document.body.innerHTML += `
        <div style="color: red; background: rgba(255,0,0,0.1); padding: 20px; margin: 20px; border-radius: 5px;">
          <h3>Error loading papers</h3>
          <p>${paperError.message}</p>
          <pre>${paperError.stack}</pre>
        </div>
      `;
      throw paperError;
    }

    // Make papersManager globally available for button handlers
    window.papersManager = papersManager;
    console.log("Set papersManager as global");

    // Remove loading state
    document.body.classList.remove("loading");
    document.body.classList.add("loaded");
    console.log("Removed loading state from body");

    // Add production class if we're in production environment
    if (isProduction) {
      document.body.classList.add("production");
      console.log("Running in production mode");
    } else {
      console.log("Running in development mode");
    }

    console.log("Application initialization complete!");
  } catch (error) {
    console.error("Failed to initialize application:", error);
    console.error("Error stack:", error.stack);
    document.body.classList.remove("loading");
    document.body.classList.add("error");

    // Add visible error message for users
    document.body.innerHTML += `
      <div style="color: red; background: rgba(255,0,0,0.1); padding: 20px; margin: 20px; border-radius: 5px;">
        <h2>Application Error</h2>
        <p>There was a problem loading the application: ${error.message}</p>
        <button onclick="location.reload()">Reload Page</button>
      </div>
    `;
  }
});
