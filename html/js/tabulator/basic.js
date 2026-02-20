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
      resolvePageNumbers(table);
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

// --- Page number resolution for rows missing "Seite" values ---
// The NoSkE API often returns empty pb.n because <pb> is a TEI milestone
// element that doesn't "contain" tokens. We resolve pages by fetching the
// static HTML document and counting <span class="pb"> elements before the
// token position.

var __docHtmlCache = {};

function fetchDocHtml(docId) {
  if (__docHtmlCache[docId] !== undefined) return __docHtmlCache[docId];
  var promise = fetch("./" + docId + ".html", { credentials: "same-origin" })
    .then(function(res) {
      if (!res.ok) return null;
      return res.text();
    })
    .then(function(html) {
      if (!html) return null;
      try {
        return new DOMParser().parseFromString(html, "text/html");
      } catch (e) {
        return null;
      }
    })
    .catch(function() { return null; });
  __docHtmlCache[docId] = promise;
  return promise;
}

function countPbBeforeToken(doc, tokenId) {
  if (!doc || !tokenId) return "";
  var tokenEl = doc.getElementById(tokenId);
  if (!tokenEl) return "";

  // Prefer primary page breaks to avoid double-counting witnesses.
  var pbsPrimary = Array.from(doc.querySelectorAll("span.pb.primary"));
  var pbs = pbsPrimary.length
    ? pbsPrimary
    : Array.from(doc.querySelectorAll("span.pb"));

  var count = 0;
  for (var k = 0; k < pbs.length; k++) {
    var rel = pbs[k].compareDocumentPosition(tokenEl);
    if (rel & Node.DOCUMENT_POSITION_FOLLOWING) {
      count++;
    }
  }
  return String(Math.max(1, count));
}

async function resolvePageNumbers(tbl) {
  if (!tbl) return;
  var rows;
  try {
    rows = tbl.getRows();
  } catch (e) {
    return;
  }

  // Group rows by docId where seite is empty
  var docGroups = {};
  for (var i = 0; i < rows.length; i++) {
    var d = rows[i].getData();
    var seite = d.seite;
    if (seite && String(seite).trim() !== "") continue; // already has a page value
    var docId = d.docid;
    var tokenId = d.tokenid;
    if (!docId || !tokenId) continue;
    if (!docGroups[docId]) docGroups[docId] = [];
    docGroups[docId].push({ row: rows[i], tokenId: tokenId });
  }

  var docIds = Object.keys(docGroups);
  if (!docIds.length) return;

  // Process documents in parallel batches (max 6 concurrent fetches)
  var BATCH_SIZE = 6;
  for (var start = 0; start < docIds.length; start += BATCH_SIZE) {
    var batch = docIds.slice(start, start + BATCH_SIZE);
    var docs = await Promise.all(batch.map(function(id) { return fetchDocHtml(id); }));
    for (var j = 0; j < batch.length; j++) {
      var doc = docs[j];
      if (!doc) continue;
      var items = docGroups[batch[j]];
      for (var k = 0; k < items.length; k++) {
        var page = countPbBeforeToken(doc, items[k].tokenId);
        if (page) {
          items[k].row.update({ seite: page });
        }
      }
    }
  }
}