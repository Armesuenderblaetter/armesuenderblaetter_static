// Add resource loading check
function checkExternalResources() {
    const scripts = document.querySelectorAll('script[src*="gitlab.oeaw.ac.at"]');
    scripts.forEach(script => {
        script.onerror = function() {
            console.warn('Failed to load external resource:', this.src);
            // Initialize fallback handlers
            if (window.fallbackHandlers) {
                Object.keys(window.fallbackHandlers).forEach(key => {
                    window.fallbackHandlers[key]();
                });
            }
        };
    });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    checkExternalResources();
    // ...existing code...
});