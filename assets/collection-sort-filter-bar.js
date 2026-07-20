/**
 * Collection Sort & Filter Bar
 * Mobile-optimized bottom bar with drawer UI that uses custom AJAX filtering engine
 * Replaces Dawn's facets.js with collection-filter-ajax.js
 */
class CollectionSortFilterBar {
  constructor(sectionId) {
    this.sectionId = sectionId
    this.section = document.querySelector(`[data-section-id="${sectionId}"]`)
    if (!this.section) {
      console.warn(`[CollectionSortFilterBar] Section not found: ${sectionId}`)
      return
    }
    if (!this.validate()) return
    this.initElements()
    this.initState()
    this.attachEventListeners()
    this.initializeFiltersFromURL()
    this.listenToAjaxEvents()

    // Register cleanup on section unload (for theme editor)
    document.addEventListener('shopify:section:unload', (e) => {
      if (e.detail.sectionId === this.sectionId) {
        this.cleanup()
      }
    })
  }

  validate() {
    const productGrid = document.getElementById("ProductGridContainer")
    if (!productGrid) {
      console.warn(
        "[CollectionSortFilterBar] Missing #ProductGridContainer - filters will not work. Add collection-grid section to this page.",
      )
      return false
    }
    // Check for custom AJAX engine
    if (!window.collectionFilterAjax) {
      console.warn("[CollectionSortFilterBar] Custom AJAX engine not loaded - will fallback to page reloads.")
    }
    return true
  }

  initElements() {
    this.sortDrawer = document.getElementById(`sort-drawer-${this.sectionId}`)
    this.filterDrawer = document.getElementById(`filter-drawer-${this.sectionId}`)
    this.filterBadge = this.section.querySelector("[data-filter-badge]")
    this.filterCount = this.filterDrawer.querySelector("[data-filter-count]")
    this.chipsContainer = this.filterDrawer.querySelector("[data-chips-container]")
    this.filterChipsList = this.filterDrawer.querySelector("[data-filter-chips-list]")
    this.applyBtn = this.filterDrawer.querySelector("[data-apply-filters]")
    this.applyText = this.filterDrawer.querySelector("[data-apply-text]")
  }

  initState() {
    this.selectedFilters = new Map()
    this.priceRange = { min: null, max: null }
    this.isLoading = false
    this.listeners = [] // Track event listeners for cleanup
    this.previousFocus = null // Store focus for restoration
    this.focusTrapHandler = null // Store focus trap handler
    this.sortDrawerOpen = false // Track if sort drawer is open
    this.filterDrawerOpen = false // Track if filter drawer is open
    this.historyStateAdded = false // Track if we added a history state
  }

  // Initialize price slider with native range inputs
  initPriceSlider(container, priceMinInput, priceMaxInput) {
    const sliderMin = container.querySelector('.price-slider-min')
    const sliderMax = container.querySelector('.price-slider-max')
    const track = container.querySelector('.price-slider-track')
    const rangeMax = parseFloat(container.dataset.rangeMax) || 10000
    const trackPadding = 10 // Must match CSS left offset

    if (!sliderMin || !sliderMax || !track) return

    // Update the yellow track between handles
    const updateTrack = () => {
      const minVal = parseFloat(sliderMin.value) || 0
      const maxVal = parseFloat(sliderMax.value) || rangeMax
      const minPercent = (minVal / rangeMax) * 100
      const maxPercent = (maxVal / rangeMax) * 100
      const trackableWidth = container.offsetWidth - (trackPadding * 2)

      // Position yellow track using pixels relative to the padded track area
      const leftPx = trackPadding + (minPercent / 100) * trackableWidth
      const widthPx = ((maxPercent - minPercent) / 100) * trackableWidth

      track.style.left = `${leftPx}px`
      track.style.width = `${widthPx}px`
    }

    // Min slider input handler
    sliderMin.addEventListener('input', () => {
      const minVal = parseFloat(sliderMin.value)
      const maxVal = parseFloat(sliderMax.value)

      // Prevent min from exceeding max
      if (minVal > maxVal) {
        sliderMin.value = maxVal
      }

      if (priceMinInput) priceMinInput.value = sliderMin.value
      this.priceRange.min = parseFloat(sliderMin.value) || null
      updateTrack()
      this.updateFilterUI()
    })

    // Max slider input handler
    sliderMax.addEventListener('input', () => {
      const minVal = parseFloat(sliderMin.value)
      const maxVal = parseFloat(sliderMax.value)

      // Prevent max from going below min
      if (maxVal < minVal) {
        sliderMax.value = minVal
      }

      if (priceMaxInput) priceMaxInput.value = sliderMax.value
      this.priceRange.max = parseFloat(sliderMax.value) || null
      updateTrack()
      this.updateFilterUI()
    })

    // Initial track position
    updateTrack()

    // Store reference for updates from text inputs
    this.priceSliderState = { container, sliderMin, sliderMax, track, rangeMax, updateTrack }
  }

  // Update slider positions when text inputs change
  updatePriceSliderFromInputs() {
    if (!this.priceSliderState) return
    const { sliderMin, sliderMax, rangeMax, updateTrack } = this.priceSliderState

    const priceMinInput = this.filterDrawer.querySelector(".price-min")
    const priceMaxInput = this.filterDrawer.querySelector(".price-max")

    const minVal = parseFloat(priceMinInput?.value) || 0
    const maxVal = parseFloat(priceMaxInput?.value) || rangeMax

    sliderMin.value = minVal
    sliderMax.value = maxVal

    updateTrack()
  }

  attachEventListeners() {
    // Sort drawer - section-scoped button
    const sectionSortBtn = this.section.querySelector("[data-open-sort]")
    if (sectionSortBtn) {
      sectionSortBtn.addEventListener("click", () => this.openSortDrawer())
    }

    // Sort drawer - document-level buttons (for desktop bar in collection-grid)
    document.querySelectorAll("[data-open-sort]").forEach((btn) => {
      // Skip if already handled (inside this section)
      if (this.section.contains(btn)) return
      btn.addEventListener("click", () => this.openSortDrawer())
    })

    this.sortDrawer.querySelectorAll("[data-close-sort]").forEach((btn) => {
      btn.addEventListener("click", () => this.closeSortDrawer())
    })
    this.sortDrawer.addEventListener("click", (e) => {
      if (e.target === this.sortDrawer || e.target.classList.contains("sort-drawer-backdrop")) {
        this.closeSortDrawer()
      }
    })
    this.sortDrawer.querySelectorAll(".sort-option").forEach((option) => {
      option.addEventListener("click", () => {
        if (this.isLoading) return
        const sortValue = option.dataset.sortValue
        this.applySort(sortValue)
      })
    })

    // Filter drawer - section-scoped button
    const sectionFilterBtn = this.section.querySelector("[data-open-filter]")
    if (sectionFilterBtn) {
      sectionFilterBtn.addEventListener("click", () => this.openFilterDrawer())
    }

    // Filter drawer - document-level buttons (for desktop bar in collection-grid)
    document.querySelectorAll("[data-open-filter]").forEach((btn) => {
      // Skip if already handled (inside this section)
      if (this.section.contains(btn)) return
      btn.addEventListener("click", () => this.openFilterDrawer())
    })
    this.filterDrawer.querySelectorAll("[data-close-filter]").forEach((btn) => {
      btn.addEventListener("click", () => this.closeFilterDrawer())
    })
    this.filterDrawer.addEventListener("click", (e) => {
      if (e.target === this.filterDrawer || e.target.classList.contains("filter-drawer-backdrop")) {
        this.closeFilterDrawer()
      }
    })

    this.filterDrawer.querySelectorAll(".filter-category-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const category = btn.dataset.filterCategory

        // Update active button
        this.filterDrawer.querySelectorAll(".filter-category-btn").forEach((b) => b.classList.remove("active"))
        btn.classList.add("active")

        // Show corresponding filter section
        this.filterDrawer.querySelectorAll(".filter-section").forEach((section) => section.classList.remove("active"))
        const targetSection = this.filterDrawer.querySelector(`[data-filter-section="${category}"]`)
        if (targetSection) {
          targetSection.classList.add("active")
        }
      })
    })

    const clearAllHeader = this.filterDrawer.querySelector("[data-clear-filters-header]")
    if (clearAllHeader) {
      clearAllHeader.addEventListener("click", () => {
        if (this.isLoading) return
        this.clearAllFilters()
      })
    }

    // Filter checkboxes
    this.filterDrawer.querySelectorAll(".filter-checkbox").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const param = checkbox.dataset.filterParam
        const value = checkbox.dataset.filterValue
        const label = checkbox.dataset.filterLabel
        const key = `${param}=${value}`
        if (checkbox.checked) {
          this.selectedFilters.set(key, { param, value, label })
        } else {
          this.selectedFilters.delete(key)
        }
        this.updateFilterUI()
      })
    })

    // Price range with drag-based slider
    const priceMinInput = this.filterDrawer.querySelector(".price-min")
    const priceMaxInput = this.filterDrawer.querySelector(".price-max")
    const priceSliderContainer = this.filterDrawer.querySelector(".price-slider-container")

    // Initialize price slider drag functionality
    if (priceSliderContainer) {
      this.initPriceSlider(priceSliderContainer, priceMinInput, priceMaxInput)
    }

    if (priceMinInput) {
      // Validate on input: only allow numbers, remove leading zeros
      priceMinInput.addEventListener("input", (e) => {
        let value = e.target.value.replace(/[^\d]/g, '')
        // Remove leading zeros
        if (value.length > 1) {
          value = String(parseInt(value) || '')
        }
        e.target.value = value
      })

      priceMinInput.addEventListener("change", () => {
        // Validate: only numbers, no negatives, no leading zeros
        let value = priceMinInput.value.replace(/[^\d]/g, '')
        value = value ? String(parseInt(value)) : ''
        priceMinInput.value = value

        this.priceRange.min = value ? parseInt(value) : null

        // Update slider handle position
        if (priceSliderContainer) {
          this.updatePriceSliderFromInputs()
        }
        this.updateFilterUI()
      })
    }

    if (priceMaxInput) {
      // Validate on input: only allow numbers, remove leading zeros
      priceMaxInput.addEventListener("input", (e) => {
        let value = e.target.value.replace(/[^\d]/g, '')
        // Remove leading zeros
        if (value.length > 1) {
          value = String(parseInt(value) || '')
        }
        e.target.value = value
      })

      priceMaxInput.addEventListener("change", () => {
        // Validate: only numbers, no negatives, no leading zeros
        let value = priceMaxInput.value.replace(/[^\d]/g, '')
        value = value ? String(parseInt(value)) : ''
        priceMaxInput.value = value

        this.priceRange.max = value ? parseInt(value) : null

        // Validate: max must be >= min
        if (this.priceRange.min && this.priceRange.max && this.priceRange.max < this.priceRange.min) {
          priceMaxInput.setCustomValidity('Maximum price must be greater than or equal to minimum price')
          priceMaxInput.reportValidity()
        } else {
          priceMaxInput.setCustomValidity('')
        }

        // Update slider handle position
        if (priceSliderContainer) {
          this.updatePriceSliderFromInputs()
        }
        this.updateFilterUI()
      })
    }

    // Apply and clear buttons
    this.filterDrawer.querySelector("[data-apply-filters]").addEventListener("click", () => {
      if (this.isLoading) return
      this.applyFilters()
    })

    this.filterDrawer.querySelector("[data-close-filter]").addEventListener("click", () => {
      this.closeFilterDrawer()
    })

    // Escape key to close drawers
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (this.sortDrawer.classList.contains("is-open")) {
          this.closeSortDrawer()
        }
        if (this.filterDrawer.classList.contains("is-open")) {
          this.closeFilterDrawer()
        }
      }
    })

    // Flag to prevent reload when closing drawer programmatically
    this.isClosingDrawer = false

    // Back button support: close drawers on browser back, or reload page for filter navigation
    this.handlePopState = () => {
      // If we're programmatically closing a drawer, don't reload
      if (this.isClosingDrawer) {
        this.isClosingDrawer = false
        return
      }

      // If a drawer is open, just close it
      if (this.sortDrawerOpen) {
        this.closeSortDrawer(true) // Pass true to skip history.back()
        return
      }
      if (this.filterDrawerOpen) {
        this.closeFilterDrawer(true) // Pass true to skip history.back()
        return
      }

      // If no drawer is open, user is navigating through filter history
      // Re-initialize filters from URL and apply them via AJAX
      if (window.collectionFilterAjax) {
        window.collectionFilterAjax.initializeFromURL()
        window.collectionFilterAjax.applyFilters({ replaceHistory: true })

        // Also update all UI elements (desktop sidebar, mobile drawer) from URL
        if (window.collectionFilterUI) {
          window.collectionFilterUI.syncFromURL()
        }
      } else {
        // Fallback to page reload if AJAX not available
        window.location.reload()
      }
    }
    window.addEventListener("popstate", this.handlePopState)
  }


  // Initialize filters from URL parameters
  initializeFiltersFromURL() {
    const urlParams = new URLSearchParams(window.location.search)

    // Initialize checkboxes
    this.filterDrawer.querySelectorAll(".filter-checkbox").forEach((checkbox) => {
      const param = checkbox.dataset.filterParam
      const value = checkbox.dataset.filterValue
      const currentValue = urlParams.get(param)
      if (currentValue && currentValue.split(",").includes(value)) {
        checkbox.checked = true
        this.selectedFilters.set(`${param}=${value}`, {
          param: param,
          value: value,
          label: checkbox.dataset.filterLabel,
        })
      }
    })

    // Initialize price range with new slider structure
    const priceMinInput = this.filterDrawer.querySelector(".price-min")
    const priceMaxInput = this.filterDrawer.querySelector(".price-max")
    const priceSliderContainer = this.filterDrawer.querySelector(".price-slider-container")

    if (priceMinInput && urlParams.get("filter.v.price.gte")) {
      this.priceRange.min = urlParams.get("filter.v.price.gte")
      priceMinInput.value = this.priceRange.min
    }

    if (priceMaxInput && urlParams.get("filter.v.price.lte")) {
      this.priceRange.max = urlParams.get("filter.v.price.lte")
      priceMaxInput.value = this.priceRange.max
    }

    // Update slider handle positions
    if (priceSliderContainer && this.priceSliderState) {
      const { sliderMin, sliderMax, rangeMax, updateTrack } = this.priceSliderState
      const minVal = parseFloat(this.priceRange.min) || 0
      const maxVal = parseFloat(this.priceRange.max) || rangeMax
      sliderMin.value = minVal
      sliderMax.value = maxVal
      updateTrack()
    }

    // Initialize sort UI if sort_by is in URL
    const sortBy = urlParams.get('sort_by')
    if (sortBy) {
      this.updateSortUI(sortBy)
    }

    this.updateFilterUI()
  }

  // Update filter count and chips
  updateFilterUI() {
    const totalFilters = this.selectedFilters.size + (this.priceRange.min || this.priceRange.max ? 1 : 0)

    // Update badge (section-scoped)
    if (totalFilters > 0) {
      this.filterBadge.textContent = totalFilters
      this.filterBadge.classList.add("show")
    } else {
      this.filterBadge.classList.remove("show")
    }

    // Update all document-level badges (for desktop bar in collection-grid)
    document.querySelectorAll("[data-filter-badge]").forEach((badge) => {
      if (this.section.contains(badge)) return // Skip section-scoped badge (already handled)
      if (totalFilters > 0) {
        badge.textContent = totalFilters
        badge.classList.add("show")
      } else {
        badge.classList.remove("show")
      }
    })

    // Update filter count text
    this.filterCount.textContent = totalFilters === 1 ? "1 filter applied" : `${totalFilters} filters applied`

    // Update chips
    this.updateFilterChips()
  }

  // Create filter chips
  updateFilterChips() {
    this.filterChipsList.innerHTML = ""

    // Add filter value chips
    this.selectedFilters.forEach((filter, key) => {
      const chip = this.createChip(filter.label, () => this.removeFilter(key))
      this.filterChipsList.appendChild(chip)
    })

    // Add price range chip
    if (this.priceRange.min || this.priceRange.max) {
      let priceLabel = "Price: "
      const currencySymbol = this.getCurrencySymbol()
      if (this.priceRange.min && this.priceRange.max) {
        priceLabel += `${currencySymbol}${this.priceRange.min} - ${currencySymbol}${this.priceRange.max}`
      } else if (this.priceRange.min) {
        priceLabel += `Over ${currencySymbol}${this.priceRange.min}`
      } else {
        priceLabel += `Under ${currencySymbol}${this.priceRange.max}`
      }
      const chip = this.createChip(priceLabel, () => {
        this.priceRange = { min: null, max: null }
        const priceMinInput = this.filterDrawer.querySelector(".price-min")
        const priceMaxInput = this.filterDrawer.querySelector(".price-max")
        if (priceMinInput) priceMinInput.value = ""
        if (priceMaxInput) priceMaxInput.value = ""
        // Reset slider handles
        if (this.priceSliderState) {
          const { sliderMin, sliderMax, rangeMax, updateTrack } = this.priceSliderState
          sliderMin.value = 0
          sliderMax.value = rangeMax
          updateTrack()
        }
        this.updateFilterUI()
      })
      this.filterChipsList.appendChild(chip)
    }

    // Show/hide chips container
    if (this.selectedFilters.size > 0 || this.priceRange.min || this.priceRange.max) {
      this.chipsContainer.classList.remove("hidden")
    } else {
      this.chipsContainer.classList.add("hidden")
    }
  }

  // Get currency symbol from the page
  getCurrencySymbol() {
    return "₹"
  }

  // Create chip element
  createChip(label, onRemove) {
    const chip = document.createElement("div")
    chip.className = "filter-chip"
    chip.innerHTML = `
      <span>${label}</span>
      <button type="button" aria-label="Remove ${label}">
        <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <path d="M6 6L18 18M6 18L18 6" stroke-linecap="round"/>
        </svg>
      </button>
    `
    const removeBtn = chip.querySelector("button")
    removeBtn.addEventListener("click", () => {
      chip.style.animation = "chip-remove 0.3s ease-out forwards"
      setTimeout(() => {
        onRemove()
      }, 250)
    })
    return chip
  }

  // Remove individual filter
  removeFilter(key) {
    this.selectedFilters.delete(key)
    const [param, value] = key.split("=")
    const checkbox = this.filterDrawer.querySelector(`[data-filter-param="${param}"][data-filter-value="${value}"]`)
    if (checkbox) checkbox.checked = false
    this.updateFilterUI()
  }

  // Build search params from current selections
  buildSearchParams() {
    const url = new URL(window.location)
    const params = new URLSearchParams(url.search)

    // Remove existing filter params
    Array.from(params.keys())
      .filter((key) => key.startsWith("filter."))
      .forEach((key) => params.delete(key))

    // Group filters by param
    const filterGroups = new Map()
    this.selectedFilters.forEach((filter) => {
      if (!filterGroups.has(filter.param)) {
        filterGroups.set(filter.param, [])
      }
      filterGroups.get(filter.param).push(filter.value)
    })

    // Add grouped filters
    filterGroups.forEach((values, param) => {
      values.forEach((value) => {
        params.append(param, value)
      })
    })

    // Add price range
    if (this.priceRange.min) {
      params.set("filter.v.price.gte", this.priceRange.min)
    }
    if (this.priceRange.max) {
      params.set("filter.v.price.lte", this.priceRange.max)
    }

    return params.toString()
  }

  // Apply sort using custom AJAX engine
  applySort(sortValue) {
    if (this.isLoading) return

    const ajax = window.collectionFilterAjax
    if (!ajax) {
      // Fallback to page reload
      const url = new URL(window.location)
      if (sortValue) {
        url.searchParams.set("sort_by", sortValue)
      } else {
        url.searchParams.delete("sort_by")
      }
      window.location.href = url.toString()
      return
    }

    // Set sort value and apply filters
    ajax.setSort(sortValue)
    // Use replaceState to replace drawer's history entry (prevents history pollution)
    ajax.applyFilters({ replaceHistory: this.sortDrawerOpen })

    // Reset history flag since we replaced the drawer state with sorted state
    if (this.sortDrawerOpen) {
      this.historyStateAdded = false
    }

    // Update sort UI to show active indicator
    this.updateSortUI(sortValue)

    this.closeSortDrawer()
  }

  // Update sort drawer UI to show active sort option
  updateSortUI(activeSortValue) {
    this.sortDrawer.querySelectorAll('.sort-option').forEach(option => {
      const sortValue = option.dataset.sortValue
      const isActive = activeSortValue && sortValue === activeSortValue

      // Update background
      if (isActive) {
        option.classList.add('bg-[#111111]/10')
      } else {
        option.classList.remove('bg-[#111111]/10')
      }

      // Update text styling
      const textSpan = option.querySelector('.flex-1')
      if (textSpan) {
        if (isActive) {
          textSpan.classList.add('text-gray-900', 'font-bold')
          textSpan.classList.remove('text-gray-600')
        } else {
          textSpan.classList.add('text-gray-600')
          textSpan.classList.remove('text-gray-900', 'font-bold')
        }
      }

      // Show/hide checkmark icon
      let checkmark = option.querySelector('.checkmark-icon')
      if (isActive) {
        if (!checkmark) {
          // Create checkmark icon if it doesn't exist
          checkmark = document.createElement('svg')
          checkmark.className = 'checkmark-icon w-6 h-6 text-[#111111]'
          checkmark.setAttribute('fill', 'currentColor')
          checkmark.setAttribute('viewBox', '0 0 20 20')
          checkmark.innerHTML = '<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>'
          option.appendChild(checkmark)
        }
      } else {
        if (checkmark) {
          checkmark.remove()
        }
      }

      // Update aria-checked
      option.setAttribute('aria-checked', isActive ? 'true' : 'false')
    })
  }

  // Apply filters using custom AJAX engine
  applyFilters() {
    if (this.isLoading) return

    const ajax = window.collectionFilterAjax
    if (!ajax) {
      // Fallback to page reload
      const searchParams = this.buildSearchParams()
      window.location.href = window.location.pathname + (searchParams ? "?" + searchParams : "")
      return
    }

    this.isLoading = true
    this.applyBtn.classList.add("loading")
    this.applyBtn.disabled = true

    const applyTextEl = this.applyBtn.querySelector("[data-apply-text]")
    const applyLoadingEl = this.applyBtn.querySelector("[data-apply-loading]")
    if (applyTextEl) applyTextEl.classList.add("hidden")
    if (applyLoadingEl) applyLoadingEl.classList.remove("hidden")

    // Sync state from UI to AJAX engine
    ajax.clearAllFilters()

    // Add all selected filters
    this.selectedFilters.forEach((filter) => {
      ajax.addFilter(filter.param, filter.value, filter.label)
    })

    // Add price range
    ajax.setPriceRange(this.priceRange.min, this.priceRange.max)

    // Trigger AJAX request
    // Use replaceHistory if we already have a filter history entry
    // This ensures browser back clears ALL filters at once
    const filterUI = window.collectionFilterUI
    const hasFilterEntry = filterUI ? filterUI.hasFilterHistoryEntry : false
    const useReplace = hasFilterEntry || this.filterDrawerOpen
    ajax.applyFilters({ replaceHistory: useReplace })

    // Mark that we now have a filter history entry
    if (filterUI) {
      filterUI.hasFilterHistoryEntry = true
    }

    // Reset drawer history flag since we replaced the drawer state with filtered state
    if (this.filterDrawerOpen) {
      this.historyStateAdded = false
    }

    // Reset loading state after a delay (AJAX engine shows its own loading state)
    setTimeout(() => {
      this.isLoading = false
      this.applyBtn.classList.remove("loading")
      this.applyBtn.disabled = false
      if (applyTextEl) applyTextEl.classList.remove("hidden")
      if (applyLoadingEl) applyLoadingEl.classList.add("hidden")
    }, 600)

    this.closeFilterDrawer()
  }

  // Clear all filters using custom AJAX engine
  clearAllFilters() {
    if (this.isLoading) return

    const ajax = window.collectionFilterAjax
    if (!ajax) {
      // Fallback to page reload
      const url = new URL(window.location)
      Array.from(url.searchParams.keys())
        .filter((key) => key.startsWith("filter."))
        .forEach((key) => url.searchParams.delete(key))
      window.location.href = url.toString()
      return
    }

    // Clear UI state
    this.selectedFilters.clear()
    this.priceRange = { min: null, max: null }

    // Clear mobile drawer checkboxes
    this.filterDrawer.querySelectorAll(".filter-checkbox").forEach((cb) => (cb.checked = false))

    // Clear mobile drawer price inputs
    const priceMinInput = this.filterDrawer.querySelector(".price-min")
    const priceMaxInput = this.filterDrawer.querySelector(".price-max")

    if (priceMinInput) priceMinInput.value = ""
    if (priceMaxInput) priceMaxInput.value = ""

    // Reset slider handles to default positions
    if (this.priceSliderState) {
      const { sliderMin, sliderMax, rangeMax, updateTrack } = this.priceSliderState
      sliderMin.value = 0
      sliderMax.value = rangeMax
      updateTrack()
    }

    // Clear sort UI
    this.updateSortUI(null)

    this.updateFilterUI()

    // Clear AJAX engine state and apply
    ajax.clearAllFilters()

    // Use replaceHistory if we have a filter history entry
    const filterUI = window.collectionFilterUI
    const hasFilterEntry = filterUI ? filterUI.hasFilterHistoryEntry : false
    const useReplace = hasFilterEntry || this.filterDrawerOpen
    ajax.applyFilters({ replaceHistory: useReplace })

    // Reset filter history flag since we're now unfiltered
    if (filterUI) {
      filterUI.hasFilterHistoryEntry = false
    }

    // Reset drawer history flag since we replaced the drawer state with cleared state
    if (this.filterDrawerOpen) {
      this.historyStateAdded = false
    }

    this.closeFilterDrawer()
  }

  // Focus trap for accessibility
  trapFocus(container) {
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length === 0) return

    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    this.focusTrapHandler = (e) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus()
          e.preventDefault()
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus()
          e.preventDefault()
        }
      }
    }

    container.addEventListener('keydown', this.focusTrapHandler)
  }

  removeFocusTrap(container) {
    if (this.focusTrapHandler) {
      container.removeEventListener('keydown', this.focusTrapHandler)
      this.focusTrapHandler = null
    }
  }

  // Event listener cleanup to prevent memory leaks
  cleanup() {
    // Remove all tracked event listeners
    this.listeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options)
    })
    this.listeners = []

    // Remove popstate listener for back button support
    if (this.handlePopState) {
      window.removeEventListener("popstate", this.handlePopState)
    }

    // Clear any timers
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    if (this.updateUITimer) clearTimeout(this.updateUITimer)

    // Remove focus trap
    if (this.sortDrawer) this.removeFocusTrap(this.sortDrawer)
    if (this.filterDrawer) this.removeFocusTrap(this.filterDrawer)

    console.log('[CollectionSortFilterBar] Cleanup complete')
  }

  // Drawer management with focus trap
  openSortDrawer() {
    // Store current focus
    this.previousFocus = document.activeElement

    this.sortDrawer.classList.remove("hidden")
    requestAnimationFrame(() => {
      this.sortDrawer.classList.add("is-open")
    })

    this.sortDrawer.setAttribute("aria-hidden", "false")
    this.sortDrawer.setAttribute("aria-modal", "true")
    document.body.style.overflow = "hidden"

    // Track drawer state and add history state for back button support
    this.sortDrawerOpen = true
    if (!this.historyStateAdded) {
      window.history.pushState({ drawer: 'sort' }, '')
      this.historyStateAdded = true
    }

    // Trap focus and focus first interactive element
    this.trapFocus(this.sortDrawer)
    const firstOption = this.sortDrawer.querySelector('.sort-option')
    if (firstOption) {
      setTimeout(() => firstOption.focus(), 100)
    }
  }

  closeSortDrawer(fromPopState = false) {
    this.sortDrawer.classList.remove("is-open")
    setTimeout(() => {
      this.sortDrawer.classList.add("hidden")
    }, 300)

    this.sortDrawer.setAttribute("aria-hidden", "true")
    this.sortDrawer.removeAttribute("aria-modal")
    document.body.style.overflow = ""

    // Track drawer state and handle history
    this.sortDrawerOpen = false
    if (this.historyStateAdded && !fromPopState) {
      this.isClosingDrawer = true
      window.history.back()
    }
    if (fromPopState) {
      this.historyStateAdded = false
    }

    // Remove focus trap and restore focus
    this.removeFocusTrap(this.sortDrawer)
    if (this.previousFocus) {
      this.previousFocus.focus()
      this.previousFocus = null
    }
  }

  openFilterDrawer() {
    // Store current focus
    this.previousFocus = document.activeElement

    this.filterDrawer.classList.remove("hidden")
    requestAnimationFrame(() => {
      this.filterDrawer.classList.add("is-open")

      const firstCategoryBtn = this.filterDrawer.querySelector(".filter-category-btn")
      if (firstCategoryBtn && !this.filterDrawer.querySelector(".filter-category-btn.active")) {
        firstCategoryBtn.click()
      }
    })

    setTimeout(() => {
      this.filterDrawer.setAttribute("aria-hidden", "false")
      this.filterDrawer.setAttribute("aria-modal", "true")
    }, 50)
    document.body.style.overflow = "hidden"

    // Track drawer state and add history state for back button support
    this.filterDrawerOpen = true
    if (!this.historyStateAdded) {
      window.history.pushState({ drawer: 'filter' }, '')
      this.historyStateAdded = true
    }

    // Trap focus and focus first interactive element
    this.trapFocus(this.filterDrawer)
    const firstButton = this.filterDrawer.querySelector('.filter-category-btn')
    if (firstButton) {
      setTimeout(() => firstButton.focus(), 150)
    }
  }

  closeFilterDrawer(fromPopState = false) {
    this.filterDrawer.classList.remove("is-open")
    this.filterDrawer.setAttribute("aria-hidden", "true")
    this.filterDrawer.removeAttribute("aria-modal")
    setTimeout(() => {
      this.filterDrawer.classList.add("hidden")
    }, 400)
    document.body.style.overflow = ""

    // Track drawer state and handle history
    this.filterDrawerOpen = false
    if (this.historyStateAdded && !fromPopState) {
      this.isClosingDrawer = true
      window.history.back()
    }
    if (fromPopState) {
      this.historyStateAdded = false
    }

    // Remove focus trap and restore focus
    this.removeFocusTrap(this.filterDrawer)
    if (this.previousFocus) {
      this.previousFocus.focus()
      this.previousFocus = null
    }
  }

  // Listen to AJAX engine events
  listenToAjaxEvents() {
    // Update UI when AJAX filtering completes
    document.addEventListener("collection:filtered", () => {
      this.syncUIFromAjaxState()
    })
  }

  // Sync UI from AJAX engine state
  syncUIFromAjaxState() {
    // Update filter chips if needed
    this.updateFilterUI()
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCollectionSortFilterBars)
} else {
  initCollectionSortFilterBars()
}

function initCollectionSortFilterBars() {
  document.querySelectorAll(".section-collection-sort-filter-bar").forEach((section) => {
    const sectionId = section.dataset.sectionId
    if (sectionId) {
      // Store instance on window for cross-controller communication
      window.collectionSortFilterBar = new CollectionSortFilterBar(sectionId)
    }
  })
}
