(function initNoskeLoadMoreAndScrollToTop(){
  // Client-side pagination: all results are fetched at once, we show/hide rows.
  const VISIBLE_STEP = 50;
  let visibleCount = VISIBLE_STEP;

  // Get all result rows from the NoskeSearch table
  function getAllRows() {
    const hitsRoot = document.getElementById("custom-noske-hits");
    if (!hitsRoot) return [];
    return Array.from(hitsRoot.querySelectorAll("tbody tr"));
  }

  // Show/hide rows based on visibleCount
  function applyVisibility() {
    const rows = getAllRows();
    rows.forEach((row, idx) => {
      row.style.display = idx < visibleCount ? "" : "none";
    });
  }

  // Create a TOC-like "Mehr laden" control in #pagination
  (function initLoadMoreButton(){
    const paginationEl = document.getElementById("pagination");
    if (!paginationEl) return;

    const loadMoreWrapper = document.createElement("div");
    loadMoreWrapper.className = "load-more-wrapper";
    loadMoreWrapper.style.display = "none"; // Hidden until results arrive

    const loadMoreBtn = document.createElement("button");
    loadMoreBtn.type = "button";
    loadMoreBtn.className = "site-button load-more-btn";
    loadMoreBtn.innerHTML = '<i class="bi bi-chevron-double-down" aria-hidden="true"></i>';

    const label = document.createElement("span");
    label.className = "load-more-label";
    label.textContent = "MEHR LADEN";

    loadMoreWrapper.appendChild(loadMoreBtn);
    loadMoreWrapper.appendChild(label);
    paginationEl.appendChild(loadMoreWrapper);

    function updateButtonVisibility() {
      const rows = getAllRows();
      const totalRows = rows.length;
      const hasMore = totalRows > visibleCount;

      // Show button only if there are hidden rows
      loadMoreWrapper.style.display = hasMore ? "" : "none";

      // Also apply visibility to rows
      applyVisibility();
    }

    loadMoreBtn.addEventListener("click", function() {
      visibleCount += VISIBLE_STEP;
      applyVisibility();
      updateButtonVisibility();
    });

    // Observe DOM changes in hits container (NoskeSearch renders asynchronously)
    (function observeHits() {
      const hitsEl = document.getElementById("custom-noske-hits");
      if (!hitsEl) {
        setTimeout(observeHits, 100);
        return;
      }

      let lastRowCount = 0;
      const obs = new MutationObserver(() => {
        const rows = getAllRows();
        // Detect new search: row count changed significantly (new results)
        if (rows.length !== lastRowCount) {
          // Reset to show only first batch when new results arrive
          visibleCount = VISIBLE_STEP;
          lastRowCount = rows.length;
        }
        applyVisibility();
        updateButtonVisibility();
      });
      obs.observe(hitsEl, { childList: true, subtree: true });

      // Initial check
      updateButtonVisibility();
    })();

    // Periodic fallback checks
    setTimeout(updateButtonVisibility, 300);
    setTimeout(updateButtonVisibility, 800);
    setTimeout(updateButtonVisibility, 1500);
  })();

  // Scroll to top button (same behavior as toc.html)
  (function initScrollToTop(){
    const scrollBtn = document.getElementById("scrollToTopBtn");
    const siteTopInner = document.querySelector(".site-top-inner");
    const main = document.querySelector("main");
    if (!scrollBtn || !siteTopInner) return;

    const baseBottom = 0;
    const baseRight = 0;

    const topObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          scrollBtn.classList.toggle("visible", !entry.isIntersecting);
        });
      },
      { threshold: 0 }
    );

    topObserver.observe(siteTopInner);

    function updateScrollButtonPosition(){
      if (main) {
        const mainRect = main.getBoundingClientRect();
        const rightOffset = Math.max(baseRight, window.innerWidth - mainRect.right + baseRight);
        scrollBtn.style.right = `${rightOffset}px`;

        const gapBelowMain = Math.max(0, window.innerHeight - mainRect.bottom);
        scrollBtn.style.bottom = `${baseBottom + gapBelowMain}px`;
        return;
      }

      scrollBtn.style.right = `${baseRight}px`;
      scrollBtn.style.bottom = `${baseBottom}px`;
    }

    updateScrollButtonPosition();
    window.addEventListener("scroll", updateScrollButtonPosition, { passive: true });
    window.addEventListener("resize", updateScrollButtonPosition, { passive: true });

    scrollBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  })();
})();
