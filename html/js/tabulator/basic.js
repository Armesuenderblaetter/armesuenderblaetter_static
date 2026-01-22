let table = null; // Keep track of the current table instance
let isInitializing = false; // Prevent recursive calls

function waitForTable() {
  if (isInitializing) return; // Prevent multiple simultaneous calls

  const el = document.querySelector("#myTable");
  if (!el) {
    setTimeout(waitForTable, 100); // Try again after 100ms
    return;
  }

  // Only create the table if it doesn't exist yet
  if (table && table.element === el) {
    // Table already created for this element, do nothing
    return;
  }

  isInitializing = true;

  // Destroy existing table instance only if the element reference has changed
  if (table && table.element !== el) {
    try {
      table.destroy();
    } catch (e) {
      console.log("Error destroying table:", e);
    }
    table = null;
  }

  // Add a small delay to ensure DOM is fully ready
  setTimeout(() => {
    const tableEl = document.querySelector("#myTable");
    if (!tableEl) {
      isInitializing = false;
      waitForTable(); // Try again
      return;
    }

    table = new Tabulator("#myTable", config);
    // Expose for other scripts (best-effort interop)
    try {
      window.__noskeTabulatorTable = table;
    } catch (e) {
      // ignore
    }

    table.on("tableBuilt", function() {
      setupDownloadButtons();
      isInitializing = false; // Allow future calls after table is built
    });

  }, 50); // Small delay to ensure DOM stability
}

function setupDownloadButtons() {
  // Remove existing event listeners by cloning buttons
  const csvBtn = document.getElementById("download-csv");
  const jsonBtn = document.getElementById("download-json");
  const htmlBtn = document.getElementById("download-html");

  if (csvBtn) {
    const newCsvBtn = csvBtn.cloneNode(true);
    csvBtn.parentNode.replaceChild(newCsvBtn, csvBtn);
    newCsvBtn.addEventListener("click", function () {
      if (table) table.download("csv", "data.csv");
    });
  }

  if (jsonBtn) {
    const newJsonBtn = jsonBtn.cloneNode(true);
    jsonBtn.parentNode.replaceChild(newJsonBtn, jsonBtn);
    newJsonBtn.addEventListener("click", function () {
      if (table) table.download("json", "data.json");
    });
  }

  if (htmlBtn) {
    const newHtmlBtn = htmlBtn.cloneNode(true);
    htmlBtn.parentNode.replaceChild(newHtmlBtn, htmlBtn);
    newHtmlBtn.addEventListener("click", function () {
      if (table) table.download("html", "data.html", { style: true });
    });
  }
}

// Start waiting for #myTable to exist
waitForTable();

// Detect #myTable regeneration and re-run waitForTable
let lastTableEl = null;
const observer = new MutationObserver(() => {
  const el = document.querySelector("#myTable");
  // Only trigger if the actual #myTable element reference has changed
  // and we're not currently initializing
  if (el !== lastTableEl && !isInitializing) {
    lastTableEl = el;
    if (el) {
      setTimeout(waitForTable, 100);
    }
  }
  if (!el) {
    lastTableEl = null;
    // Do NOT destroy the table here; let it persist until a new #myTable is created
  }
});


observer.observe(document.body, { childList: true, subtree: true });