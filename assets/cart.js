class CartRemoveButton extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const cartItems = this.closest('cart-items') || this.closest('cart-drawer-items');
      if (cartItems) {
        cartItems.updateQuantity(this.dataset.index, 0, event);
      }
    });
  }
}

customElements.define('cart-remove-button', CartRemoveButton);

class CartItems extends HTMLElement {
  constructor() {
    super();
    this.lineItemStatusElement =
      document.getElementById('shopping-cart-line-item-status') || document.getElementById('CartDrawer-LineItemStatus');

    const debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, ON_CHANGE_DEBOUNCE_TIMER);

    this.addEventListener('change', debouncedOnChange.bind(this));
  }

  cartUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
      // Skip if this update was triggered by cart-items itself (prevents loops)
      if (event.source === 'cart-items') {
        return;
      }
      return this.onCartUpdate();
    });
  }

  disconnectedCallback() {
    if (this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }
  }

  resetQuantityInput(id) {
    const input = this.querySelector(`#Quantity-${id}`);
    input.value = input.getAttribute('value');
    this.isEnterPressed = false;
  }

  setValidity(event, index, message) {
    event.target.setCustomValidity(message);
    event.target.reportValidity();
    this.resetQuantityInput(index);
    event.target.select();
  }

  validateQuantity(event) {
    const inputValue = parseInt(event.target.value);
    const index = event.target.dataset.index;
    let message = '';

    // Only validate if we have the strings defined (for quick order list)
    // For cart drawer dropdowns, skip validation since values are pre-validated
    if (window.quickOrderListStrings) {
      if (event.target.dataset.min && inputValue < event.target.dataset.min) {
        message = window.quickOrderListStrings.min_error.replace('[min]', event.target.dataset.min);
      } else if (event.target.max && inputValue > parseInt(event.target.max)) {
        message = window.quickOrderListStrings.max_error.replace('[max]', event.target.max);
      } else if (event.target.step && parseInt(event.target.step) > 1 && inputValue % parseInt(event.target.step) !== 0) {
        message = window.quickOrderListStrings.step_error.replace('[step]', event.target.step);
      }
    }

    if (message) {
      this.setValidity(event, index, message);
    } else {
      event.target.setCustomValidity('');
      event.target.reportValidity();
      this.updateQuantity(
        index,
        inputValue,
        event,
        document.activeElement.getAttribute('name'),
        event.target.dataset.quantityVariantId
      );
    }
  }

  onChange(event) {
    this.validateQuantity(event);
  }

  onCartUpdate() {
    if (this.tagName === 'CART-DRAWER-ITEMS') {
      return fetch(`${routes.cart_url}?section_id=cart-drawer`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const selectors = ['cart-drawer-items', '.drawer__footer'];
          for (const selector of selectors) {
            const targetElement = document.querySelector(selector);
            const sourceElement = html.querySelector(selector);
            if (targetElement && sourceElement) {
              targetElement.replaceWith(sourceElement);
            }
          }
        })
        .catch((e) => {
          console.error(e);
        });
    } else {
      return fetch(`${routes.cart_url}?section_id=main-cart-items`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const sourceQty = html.querySelector('cart-items');
          this.innerHTML = sourceQty.innerHTML;
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }

  getSectionsToRender() {
    const mainCartItems = document.getElementById('main-cart-items');
    const mainCartFooter = document.getElementById('main-cart-footer');

    const sections = [];

    // Only add main-cart-items if it exists on the page
    if (mainCartItems) {
      sections.push({
        id: 'main-cart-items',
        section: mainCartItems.dataset.id,
        selector: '.js-contents',
      });
    }

    sections.push({
      id: 'cart-icon-bubble',
      section: 'cart-icon-bubble',
      selector: '.shopify-section',
    });

    sections.push({
      id: 'cart-live-region-text',
      section: 'cart-live-region-text',
      selector: '.shopify-section',
    });

    // Only add main-cart-footer if it exists on the page
    if (mainCartFooter) {
      sections.push({
        id: 'main-cart-footer',
        section: mainCartFooter.dataset.id,
        selector: '.js-contents',
      });
    }

    return sections;
  }

  updateQuantity(line, quantity, event, name, variantId) {
    this.enableLoading(line);

    const body = JSON.stringify({
      line: parseInt(line, 10),
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname,
    });
    const eventTarget = event.currentTarget instanceof CartRemoveButton ? 'clear' : 'change';

    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const parsedState = JSON.parse(state);

        const updateCartUI = () => {
          const quantityElement =
            document.getElementById(`Quantity-${line}`) ||
            document.getElementById(`Drawer-quantity-${line}`) ||
            document.querySelector(`[data-index="${line}"].qty-dropdown`);
          const items = document.querySelectorAll('.cart-item');

          if (parsedState.errors) {
            if (quantityElement) {
              quantityElement.value = quantityElement.getAttribute('value') || quantityElement.dataset.originalValue;
            }
            // Strip HTML from error message if present
            const errorMessage = typeof parsedState.errors === 'string'
              ? parsedState.errors.replace(/<[^>]*>/g, '')
              : parsedState.errors;
            this.updateLiveRegions(line, errorMessage);
            // Note: publish() is called after updateCartUI() completes
            return;
          }

          this.classList.toggle('is-empty', parsedState.item_count === 0);
          const cartDrawerWrapper = document.querySelector('cart-drawer');
          const cartFooter = document.getElementById('main-cart-footer');

          if (cartFooter) cartFooter.classList.toggle('is-empty', parsedState.item_count === 0);
          if (cartDrawerWrapper) cartDrawerWrapper.classList.toggle('is-empty', parsedState.item_count === 0);

          this.getSectionsToRender().forEach((section) => {
            const sectionElement = document.getElementById(section.id);
            if (!sectionElement) return;

            const elementToReplace = sectionElement.querySelector(section.selector) || sectionElement;
            if (elementToReplace && parsedState.sections && parsedState.sections[section.section]) {
              elementToReplace.innerHTML = this.getSectionInnerHTML(
                parsedState.sections[section.section],
                section.selector
              );
            }
          });

          const updatedValue = parsedState.items[line - 1] ? parsedState.items[line - 1].quantity : undefined;
          let message = '';
          if (quantityElement && items.length === parsedState.items.length && updatedValue !== parseInt(quantityElement.value)) {
            if (typeof updatedValue === 'undefined') {
              message = window.cartStrings.error;
            } else {
              message = window.cartStrings.quantityError.replace('[quantity]', updatedValue);
            }
          }
          this.updateLiveRegions(line, message);

          // Focus management with null checks
          const lineItem =
            document.getElementById(`CartItem-${line}`) || document.getElementById(`CartDrawer-Item-${line}`);
          if (lineItem && lineItem.querySelector(`[name="${name}"]`)) {
            if (cartDrawerWrapper) {
              trapFocus(cartDrawerWrapper, lineItem.querySelector(`[name="${name}"]`));
            } else {
              lineItem.querySelector(`[name="${name}"]`)?.focus();
            }
          } else if (parsedState.item_count === 0 && cartDrawerWrapper) {
            const emptyContainer = cartDrawerWrapper.querySelector('.drawer__inner-empty');
            const focusElement = cartDrawerWrapper.querySelector('a');
            if (emptyContainer && focusElement) {
              trapFocus(emptyContainer, focusElement);
            }
          } else if (document.querySelector('.cart-item') && cartDrawerWrapper) {
            const cartItemName = document.querySelector('.cart-item__name');
            if (cartItemName) trapFocus(cartDrawerWrapper, cartItemName);
          }
        };

        // Run UI update with performance tracking if available
        if (typeof CartPerformance !== 'undefined' && CartPerformance.measure) {
          CartPerformance.measure(`${eventTarget}:paint-updated-sections"`, updateCartUI);
          CartPerformance.measureFromEvent(`${eventTarget}:user-action`, event);
        } else {
          updateCartUI();
        }

        publish(PUB_SUB_EVENTS.cartUpdate, { source: 'cart-items', cartData: parsedState, variantId: variantId });
      })
      .catch((error) => {
        console.error('[Cart] Error updating cart:', error);
        this.querySelectorAll('.loading__spinner').forEach((overlay) => overlay.classList.add('hidden'));
        const errors = document.getElementById('cart-errors') || document.getElementById('CartDrawer-CartErrors');
        if (errors) errors.textContent = window.cartStrings.error;
        // Publish cartUpdate so loading overlay hides even on network errors
        publish(PUB_SUB_EVENTS.cartUpdate, { source: 'cart-items', cartData: null, variantId: variantId });
      })
      .finally(() => {
        this.disableLoading(line);
      });
  }

  updateLiveRegions(line, message) {
    const lineItemError =
      document.getElementById(`Line-item-error-${line}`) || document.getElementById(`CartDrawer-LineItemError-${line}`);
    const errorText = lineItemError?.querySelector('.cart-item__error-text');
    if (errorText) errorText.textContent = message;

    if (this.lineItemStatusElement) {
      this.lineItemStatusElement.setAttribute('aria-hidden', true);
    }

    const cartStatus =
      document.getElementById('cart-live-region-text') || document.getElementById('CartDrawer-LiveRegionText');
    if (cartStatus) {
      cartStatus.setAttribute('aria-hidden', false);

      setTimeout(() => {
        cartStatus.setAttribute('aria-hidden', true);
      }, 1000);
    }
  }

  getSectionInnerHTML(html, selector) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const element = doc.querySelector(selector);
    return element ? element.innerHTML : '';
  }

  enableLoading(line) {
    const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
    if (mainCartItems) {
      mainCartItems.classList.add('cart__items--disabled');
    }

    const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading__spinner`);
    const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading__spinner`);

    [...cartItemElements, ...cartDrawerItemElements].forEach((overlay) => overlay.classList.remove('hidden'));

    if (document.activeElement) {
      document.activeElement.blur();
    }
    if (this.lineItemStatusElement) {
      this.lineItemStatusElement.setAttribute('aria-hidden', false);
    }
  }

  disableLoading(line) {
    const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
    if (mainCartItems) {
      mainCartItems.classList.remove('cart__items--disabled');
    }

    const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading__spinner`);
    const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading__spinner`);

    cartItemElements.forEach((overlay) => overlay.classList.add('hidden'));
    cartDrawerItemElements.forEach((overlay) => overlay.classList.add('hidden'));
  }
}

customElements.define('cart-items', CartItems);

if (!customElements.get('cart-note')) {
  customElements.define(
    'cart-note',
    class CartNote extends HTMLElement {
      constructor() {
        super();

        this.addEventListener(
          'input',
          debounce((event) => {
            const body = JSON.stringify({ note: event.target.value });
            fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } })
              .then(() => {
                if (typeof CartPerformance !== 'undefined' && CartPerformance.measureFromEvent) {
                  CartPerformance.measureFromEvent('note-update:user-action', event);
                }
              });
          }, ON_CHANGE_DEBOUNCE_TIMER)
        );
      }
    }
  );
}

/**
 * Cart Item Selector Functions
 * Handle size and quantity selection in cart drawer
 */

// Global variable to store current selector context
let currentSelectorContext = null;

/**
 * Open variant selector bottom sheet (shows ALL options: size, color, etc.)
 */
async function openCartItemSizeSelector(element, event) {
  if (event) event.stopPropagation();

  const productId = element.dataset.productId;
  const productHandle = element.dataset.productHandle;
  const variantId = element.dataset.variantId;
  const cartItemIndex = element.dataset.cartItemIndex;

  // Show loading state
  const modal = document.getElementById('CartItemSizeSelector');
  const optionsContainer = document.getElementById('CartItemSizeOptions');
  optionsContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #E6E1E2;">Loading...</div>';

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  try {
    // Fetch product data to get all variants using handle
    const response = await fetch(`/products/${productHandle}.js`);
    const product = await response.json();

    // Get current variant
    const currentVariant = product.variants.find(v => v.id == variantId);
    if (!currentVariant) throw new Error('Current variant not found');

    // Store context for later use
    currentSelectorContext = {
      productId,
      productHandle,
      variantId,
      cartItemIndex,
      element,
      product,
      currentVariant,
      selectedOptions: [...currentVariant.options] // Clone current options
    };

    // Build ALL variant options (size, color, etc.) like quick buy
    let optionsHTML = '';

    product.options.forEach((option, optionIndex) => {
      const isColor = option.name === 'Color' || option.name === 'Colour';
      const optionClass = isColor ? 'cart-item-color-swatches' : 'cart-item-size-buttons';

      optionsHTML += `
        <div class="cart-item-option-group" data-option-index="${optionIndex}">
          <label class="cart-item-option-label">${option.name}</label>
          <div class="cart-item-option-values ${optionClass}">
      `;

      option.values.forEach(value => {
        // Check if any variant with this option value (and other selected options) is available
        const isAvailable = product.variants.some(v => {
          if (!v.available) return false;
          if (v.options[optionIndex] !== value) return false;

          // Check if matches currently selected options for other indices
          for (let i = 0; i < product.options.length; i++) {
            if (i !== optionIndex && currentSelectorContext.selectedOptions[i] !== v.options[i]) {
              return false;
            }
          }
          return true;
        });

        const isSelected = currentVariant.options[optionIndex] === value;
        const buttonClass = isColor ? 'cart-item-color-swatch cart-item-option-btn' : 'cart-item-option-btn';

        optionsHTML += `
          <button
            type="button"
            class="${buttonClass} ${isSelected ? 'selected' : ''} ${!isAvailable ? 'disabled' : ''}"
            data-option-index="${optionIndex}"
            data-option-value="${value}"
            onclick="selectCartItemOption(${optionIndex}, '${value}')"
            ${!isAvailable ? 'disabled' : ''}
            ${isColor ? `style="background-color: ${value.toLowerCase()};"` : ''}
            ${isColor ? `title="${value}"` : ''}
          >
            ${isColor ? (isSelected ? '<span class="cart-item-check">✓</span>' : '') : value}
          </button>
        `;
      });

      optionsHTML += `
          </div>
        </div>
      `;
    });

    optionsContainer.innerHTML = optionsHTML;
  } catch (error) {
    console.error('Error loading variant options:', error);
    optionsContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #B23A3A;">Error loading options</div>';
  }
}

/**
 * Select an option (size, color, etc.) - Updates UI only, doesn't apply yet
 */
function selectCartItemOption(optionIndex, value) {
  if (!currentSelectorContext) return;

  const modal = document.getElementById('CartItemSizeSelector');
  const optionGroup = modal.querySelector(`[data-option-index="${optionIndex}"]`);
  if (!optionGroup) return;

  // Update selected state in UI
  const buttons = optionGroup.querySelectorAll('.cart-item-option-btn');
  buttons.forEach(btn => {
    const isThisButton = btn.dataset.optionValue === value;
    const isColor = btn.classList.contains('cart-item-color-swatch');

    if (isThisButton) {
      btn.classList.add('selected');
      // Add checkmark for color swatches
      if (isColor && !btn.querySelector('.cart-item-check')) {
        btn.innerHTML = '<span class="cart-item-check">✓</span>';
      }
    } else {
      btn.classList.remove('selected');
      // Remove checkmark for color swatches
      if (isColor) {
        btn.innerHTML = '';
      }
    }
  });

  // Update selected options in context
  currentSelectorContext.selectedOptions[optionIndex] = value;

  // Update availability of other options based on this selection
  updateCartItemOptionAvailability();
}

/**
 * Update option availability based on currently selected options
 */
function updateCartItemOptionAvailability() {
  if (!currentSelectorContext || !currentSelectorContext.product) return;

  const { product, selectedOptions } = currentSelectorContext;
  const modal = document.getElementById('CartItemSizeSelector');

  product.options.forEach((option, optionIndex) => {
    const optionGroup = modal.querySelector(`[data-option-index="${optionIndex}"]`);
    if (!optionGroup) return;

    option.values.forEach(value => {
      const button = optionGroup.querySelector(`[data-option-value="${value}"]`);
      if (!button) return;

      // Check if any variant with this option value is available
      const isAvailable = product.variants.some(v => {
        if (!v.available) return false;
        if (v.options[optionIndex] !== value) return false;

        // Check if matches selected options for other indices
        for (let i = 0; i < product.options.length; i++) {
          if (i !== optionIndex && selectedOptions[i] !== v.options[i]) {
            return false;
          }
        }
        return true;
      });

      if (isAvailable) {
        button.classList.remove('disabled');
        button.disabled = false;
      } else {
        button.classList.add('disabled');
        button.disabled = true;
      }
    });
  });
}

/**
 * Apply the selected variant when Done button is clicked
 */
async function applyCartItemVariantSelection() {
  if (!currentSelectorContext) return;

  const { product, variantId, selectedOptions } = currentSelectorContext;

  try {
    // Find the matching variant based on selected options
    const newVariant = product.variants.find(v => {
      if (!v.available) return false;
      return v.options.every((opt, idx) => opt === selectedOptions[idx]);
    });

    if (!newVariant) {
      showQuickBuyToast('This variant is not available', 'error');
      return;
    }

    // If same variant, just close
    if (newVariant.id == variantId) {
      closeCartItemSelector('CartItemSizeSelector');
      return;
    }

    // Get current quantity from cart
    const cartResponse = await fetch('/cart.js');
    const cart = await cartResponse.json();
    const cartItem = cart.items.find(item => item.id == variantId);
    const quantity = cartItem ? cartItem.quantity : 1;

    // Update cart by changing variant
    const updates = {
      updates: {
        [variantId]: 0  // Remove old variant
      }
    };

    await fetch('/cart/update.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    // Add new variant with same quantity
    const addData = {
      items: [{
        id: newVariant.id,
        quantity: quantity
      }]
    };

    await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addData)
    });

    // Close modal
    closeCartItemSelector('CartItemSizeSelector');

    // Trigger cart update
    publish(PUB_SUB_EVENTS.cartUpdate, { source: 'cart-item-selector' });

    showQuickBuyToast('Options updated', 'success');
  } catch (error) {
    console.error('Error updating variant:', error);
    showQuickBuyToast('Error updating options', 'error');
  }
}

/**
 * Open quantity selector bottom sheet
 */
function openCartItemQuantitySelector(element, event) {
  if (event) event.stopPropagation();

  const cartItemIndex = element.dataset.cartItemIndex;
  const variantId = element.dataset.variantId;
  const currentQty = parseInt(element.dataset.currentQty);
  const maxQty = parseInt(element.dataset.maxQty);

  // Store context
  currentSelectorContext = {
    cartItemIndex,
    variantId,
    currentQty,
    maxQty,
    element
  };

  // Build quantity options - Circular buttons
  const modal = document.getElementById('CartItemQuantitySelector');
  const optionsContainer = document.getElementById('CartItemQuantityOptions');

  let optionsHTML = '';
  for (let i = 1; i <= maxQty; i++) {
    const isSelected = i === currentQty;
    optionsHTML += `
      <button
        type="button"
        class="cart-item-selector-option ${isSelected ? 'selected' : ''}"
        onclick="selectCartItemQuantity(${i})"
      >
        ${i}
      </button>
    `;
  }

  // Add option for current quantity if it exceeds max
  if (currentQty > maxQty) {
    optionsHTML += `
      <button
        type="button"
        class="cart-item-selector-option selected"
        onclick="selectCartItemQuantity(${currentQty})"
      >
        ${currentQty}
      </button>
    `;
  }

  optionsContainer.innerHTML = optionsHTML;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Scroll to selected item
  setTimeout(() => {
    const selectedOption = optionsContainer.querySelector('.cart-item-selector-option.selected');
    if (selectedOption) {
      selectedOption.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, 100);
}

/**
 * Select quantity and update cart
 */
async function selectCartItemQuantity(quantity) {
  if (!currentSelectorContext) return;

  const { variantId, currentQty } = currentSelectorContext;

  if (quantity === currentQty) {
    closeCartItemSelector('CartItemQuantitySelector');
    return;
  }

  try {
    const updates = {
      updates: {
        [variantId]: quantity
      }
    };

    await fetch('/cart/update.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    // Close modal
    closeCartItemSelector('CartItemQuantitySelector');

    // Trigger cart update
    publish(PUB_SUB_EVENTS.cartUpdate, { source: 'cart-item-selector' });

    showQuickBuyToast('Quantity updated', 'success');
  } catch (error) {
    console.error('Error updating quantity:', error);
    showQuickBuyToast('Error updating quantity', 'error');
  }
}

/**
 * Close selector bottom sheet
 */
function closeCartItemSelector(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.remove('active');
  document.body.style.overflow = '';
  currentSelectorContext = null;
}

// Close on backdrop click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('cart-item-selector-overlay')) {
    const modalId = e.target.id;
    closeCartItemSelector(modalId);
  }
});

// Close on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const activeModal = document.querySelector('.cart-item-selector-overlay.active');
    if (activeModal) {
      closeCartItemSelector(activeModal.id);
    }
  }
});
