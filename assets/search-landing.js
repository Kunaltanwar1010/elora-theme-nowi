/**
 * Search Landing - localStorage for recent searches
 * Note: The default view (trending, suggestions) stays visible while typing.
 * Predictive search results overlay the content when they arrive via fixed positioning.
 */

class SearchLanding extends HTMLElement {
  constructor() {
    super();
    this.storageKey = 'nowi_recent_searches';
    this.maxRecentSearches = parseInt(this.dataset.maxRecent) || 5;

    this.searchInput = this.querySelector('input[type="search"]');
    this.searchForm = this.querySelector('form');
    this.recentSection = this.querySelector('[data-recent-section]');
    this.recentContainer = this.querySelector('[data-recent-searches]');
    this.clearAllBtn = this.querySelector('[data-clear-all]');

    this.init();
  }

  init() {
    this.renderRecentSearches();
    this.setupEvents();
  }

  setupEvents() {
    if (this.searchInput) {
      // Don't hide default view on input - let predictive search overlay handle it
      // The predictive search has position: fixed and will naturally cover content when results arrive

      // ESC key to clear input or go back
      this.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          if (this.searchInput.value.trim().length > 0) {
            // Trigger form reset to properly close predictive search
            const form = this.searchInput.form;
            if (form) {
              form.reset();
            }
          } else {
            // If already empty, use smart back navigation
            if (typeof handleSearchBackClick === 'function') {
              handleSearchBackClick();
            } else {
              window.location.href = '/';
            }
          }
        }
      });
    }

    if (this.searchForm) {
      this.searchForm.addEventListener('submit', () => {
        const query = this.searchInput.value.trim();
        if (query) this.saveSearch(query);
      });
    }

    if (this.clearAllBtn) {
      this.clearAllBtn.addEventListener('click', () => this.clearAll());
    }

    if (this.recentContainer) {
      this.recentContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-delete]');
        if (btn) {
          e.preventDefault();
          e.stopPropagation();
          this.deleteSearch(btn.dataset.delete);
        }
      });
    }

    // Auto-focus search input on page load
    if (this.searchInput && !this.searchInput.value) {
      setTimeout(() => this.searchInput.focus(), 100);
    }
  }


  getSearches() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data).filter(s => s && s.term) : [];
    } catch { return []; }
  }

  saveSearch(term) {
    if (!term) return;
    try {
      let searches = this.getSearches().filter(s => s.term.toLowerCase() !== term.toLowerCase());
      searches.unshift({ term, ts: Date.now() });
      searches = searches.slice(0, this.maxRecentSearches);
      localStorage.setItem(this.storageKey, JSON.stringify(searches));
      this.renderRecentSearches();
    } catch { }
  }

  deleteSearch(term) {
    try {
      const searches = this.getSearches().filter(s => s.term !== term);
      localStorage.setItem(this.storageKey, JSON.stringify(searches));
      this.renderRecentSearches();
    } catch { }
  }

  clearAll() {
    try {
      localStorage.removeItem(this.storageKey);
      this.renderRecentSearches();
    } catch { }
  }

  renderRecentSearches() {
    if (!this.recentContainer || !this.recentSection) return;

    const searches = this.getSearches();

    if (searches.length === 0) {
      this.recentSection.classList.add('hidden');
      if (this.clearAllBtn) this.clearAllBtn.classList.add('hidden');
      this.recentContainer.innerHTML = '';
      return;
    }

    this.recentSection.classList.remove('hidden');
    if (this.clearAllBtn) this.clearAllBtn.classList.remove('hidden');

    this.recentContainer.innerHTML = searches.map(s => `
      <div class="recent-chip">
        <a href="/search?q=${encodeURIComponent(s.term)}">${this.escape(s.term)}</a>
        <button type="button" class="delete-btn" data-delete="${this.escape(s.term)}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `).join('');
  }

  escape(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

customElements.define('search-landing', SearchLanding);
