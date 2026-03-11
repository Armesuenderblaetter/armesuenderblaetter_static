(function () {
    function getCurrentPageParam() {
        var params = new URLSearchParams(window.location.search || '');
        var page = parseInt(params.get('page') || '', 10);
        if (Number.isFinite(page) && page > 0) {
            return { key: 'page', value: page };
        }

        var pag = parseInt(params.get('pag') || '', 10);
        if (Number.isFinite(pag) && pag > 0) {
            return { key: 'pag', value: pag };
        }

        return null;
    }

    function preservePagOnWitnessLinks() {
        var current = getCurrentPageParam();
        if (!current) {
            return;
        }

        var links = document.querySelectorAll('#witness_overview a.nav-link[role="tab"]');
        links.forEach(function (link) {
            var href = link.getAttribute('href');
            if (!href) {
                return;
            }

            try {
                var targetUrl = new URL(href, window.location.href);
                targetUrl.searchParams.set(current.key, String(current.value));
                if (current.key === 'page') {
                    targetUrl.searchParams.delete('pag');
                } else {
                    targetUrl.searchParams.delete('page');
                }
                targetUrl.searchParams.delete('tab');
                link.setAttribute('href', targetUrl.toString());
            } catch (_) {
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', preservePagOnWitnessLinks);
    } else {
        preservePagOnWitnessLinks();
    }
})();
