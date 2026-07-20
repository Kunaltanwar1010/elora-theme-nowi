/**
 * Quick Buy Modal JavaScript
 * Handles opening/closing modals, variant selection, and add to cart
 */

// Open quick buy modal
function openQuickBuyModal(modalId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Auto-select first available option for each option group if none selected
    initializeQuickBuyOptions(modal);

    // Add click outside to close
    modal.addEventListener('click', handleModalBackdropClick);
  }
}

// Initialize variant options - auto-select first available if none selected
function initializeQuickBuyOptions(modal) {
  const productId = modal.dataset.productId;
  if (!productId) return;

  const optionGroups = modal.querySelectorAll('.quick-buy-option-group');
  let needsUpdate = false;

  optionGroups.forEach(group => {
    const selectedBtn = group.querySelector('.quick-buy-option-btn.selected');

    // If no option is selected, select the first available one
    if (!selectedBtn) {
      const firstAvailable = group.querySelector('.quick-buy-option-btn:not(.disabled)');
      if (firstAvailable) {
        firstAvailable.classList.add('selected');

        // Add checkmark for color swatches
        if (firstAvailable.classList.contains('quick-buy-color-swatch')) {
          const check = document.createElement('span');
          check.className = 'quick-buy-check';
          check.textContent = '✓';
          firstAvailable.appendChild(check);
        }

        needsUpdate = true;
      }
    }
  });

  // Update variant if we made selections
  if (needsUpdate) {
    updateQuickBuyVariant(productId);
  }
}

// Close quick buy modal
function closeQuickBuyModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    modal.removeEventListener('click', handleModalBackdropClick);
  }
  // Always release the scroll lock, even if the modal element was
  // removed/replaced (e.g. by a cart-drawer recommendations refresh)
  // while it was open — otherwise the page stays unscrollable.
  if (!document.querySelector('.quick-buy-modal-overlay.active')) {
    document.body.style.overflow = '';
  }
}

// Handle clicking outside modal content
function handleModalBackdropClick(event) {
  if (event.target.classList.contains('quick-buy-modal-overlay')) {
    closeQuickBuyModal(event.target.id);
  }
}

// Handle escape key to close modal
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    const activeModal = document.querySelector('.quick-buy-modal-overlay.active');
    if (activeModal) {
      closeQuickBuyModal(activeModal.id);
    }
  }
});

// Select variant option
function selectQuickBuyOption(button, productId) {
  const optionIndex = parseInt(button.dataset.optionIndex);
  const optionValue = button.dataset.optionValue;
  const optionGroup = button.closest('.quick-buy-option-group');

  // Update selected state visually
  optionGroup.querySelectorAll('.quick-buy-option-btn').forEach(btn => {
    btn.classList.remove('selected');
    const check = btn.querySelector('.quick-buy-check');
    if (check) check.remove();
  });

  button.classList.add('selected');

  // Add checkmark for color swatches
  if (button.classList.contains('quick-buy-color-swatch')) {
    const check = document.createElement('span');
    check.className = 'quick-buy-check';
    check.textContent = '✓';
    button.appendChild(check);
  }

  // Update variant selection
  updateQuickBuyVariant(productId);
}

// Update variant based on selected options
function updateQuickBuyVariant(productId) {
  const modal = document.querySelector(`[data-product-id="${productId}"]`);
  if (!modal) return;

  const variantsJson = document.getElementById(`QuickBuyVariants-${productId}`);
  if (!variantsJson) return;

  const variants = JSON.parse(variantsJson.textContent);
  const selectedOptions = [];

  // Gather selected options
  modal.querySelectorAll('.quick-buy-option-group').forEach((group, index) => {
    const selectedBtn = group.querySelector('.quick-buy-option-btn.selected');
    if (selectedBtn) {
      selectedOptions[index] = selectedBtn.dataset.optionValue;
    }
  });

  // Find matching variant
  const matchingVariant = variants.find(variant => {
    return variant.options.every((option, index) => {
      return selectedOptions[index] === undefined || option === selectedOptions[index];
    });
  });

  if (matchingVariant) {
    // Update variant ID
    const variantInput = modal.querySelector('.quick-buy-variant-id');
    if (variantInput) {
      variantInput.value = matchingVariant.id;
    }

    // Update price display
    const priceEl = modal.querySelector('[data-quick-buy-price]');
    if (priceEl) {
      priceEl.textContent = formatMoney(matchingVariant.price);
    }

    // Update compare at price
    const comparePriceEl = modal.querySelector('[data-quick-buy-compare-price]');
    if (comparePriceEl) {
      if (matchingVariant.compare_at_price && matchingVariant.compare_at_price > matchingVariant.price) {
        comparePriceEl.textContent = formatMoney(matchingVariant.compare_at_price);
        comparePriceEl.style.display = '';
      } else {
        comparePriceEl.style.display = 'none';
      }
    }

    // Update button availability for Add to Cart mode
    const addBtn = modal.querySelector('.quick-buy-add-btn');
    if (addBtn) {
      const addText = addBtn.querySelector('.quick-buy-add-text');
      if (matchingVariant.available) {
        addBtn.disabled = false;
        if (addText) addText.textContent = 'Add to Cart';
      } else {
        addBtn.disabled = true;
        if (addText) addText.textContent = 'Sold Out';
      }
    }

    // Update payment button availability for Buy Now mode
    const paymentButtonWrapper = modal.querySelector('.quick-buy-payment-button');
    if (paymentButtonWrapper) {
      const paymentButton = paymentButtonWrapper.querySelector('button, [role="button"]');
      if (paymentButton) {
        if (matchingVariant.available) {
          paymentButton.disabled = false;
          paymentButtonWrapper.classList.remove('disabled');
        } else {
          paymentButton.disabled = true;
          paymentButtonWrapper.classList.add('disabled');
        }
      }
    }

    // Update other option availability based on this selection
    updateOptionAvailability(modal, variants, selectedOptions);
  }
}

// Update which options are available based on current selection
function updateOptionAvailability(modal, variants, selectedOptions) {
  modal.querySelectorAll('.quick-buy-option-group').forEach((group, groupIndex) => {
    group.querySelectorAll('.quick-buy-option-btn').forEach(btn => {
      const optionValue = btn.dataset.optionValue;

      // Check if any variant exists with this option value combined with other selected options
      const isAvailable = variants.some(variant => {
        // Check if this variant has the option value
        if (variant.options[groupIndex] !== optionValue) return false;

        // Check if other selected options match
        for (let i = 0; i < selectedOptions.length; i++) {
          if (i !== groupIndex && selectedOptions[i] && variant.options[i] !== selectedOptions[i]) {
            return false;
          }
        }

        return variant.available;
      });

      if (isAvailable) {
        btn.classList.remove('disabled');
        btn.disabled = false;
      } else {
        btn.classList.add('disabled');
        btn.disabled = true;
      }
    });
  });
}

// Format money - uses Shopify's built-in formatMoney if available
function formatMoney(cents) {
  if (typeof Shopify !== 'undefined' && Shopify.formatMoney) {
    return Shopify.formatMoney(cents);
  }

  // Fallback: use the shop's money format from theme settings if available
  // or default to basic formatting with currency symbol from page
  const moneyFormat = window.theme?.moneyFormat || window.Shopify?.money_format;
  if (moneyFormat) {
    const amount = (cents / 100).toFixed(2);
    return moneyFormat.replace('{{amount}}', amount).replace('{{ amount }}', amount);
  }

  // Ultimate fallback - format as number with 2 decimals
  const amount = (cents / 100).toFixed(2);
  return amount.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Show error notification instead of alert
function showQuickBuyError(message, modal) {
  // Try to show error in a more elegant way
  const errorEl = modal.querySelector('.quick-buy-error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    setTimeout(() => {
      errorEl.style.display = 'none';
    }, 5000);
    return;
  }

  // Create temporary error notification
  const errorNotification = document.createElement('div');
  errorNotification.className = 'quick-buy-error-toast';
  errorNotification.textContent = message;
  errorNotification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #B23A3A;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    animation: slideUp 0.3s ease;
  `;
  document.body.appendChild(errorNotification);

  setTimeout(() => {
    errorNotification.style.animation = 'slideDown 0.3s ease';
    setTimeout(() => errorNotification.remove(), 300);
  }, 3000);
}

// Add to cart directly (for single-variant products - skips modal)
function addToCartDirect(productId, variantId, button, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (!button) return;

  // Show loading state on button
  button.classList.add('loading');
  const originalContent = button.innerHTML;
  button.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
    <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
    </path>
  </svg>`;

  // Prepare form data
  const formData = {
    items: [{
      id: parseInt(variantId),
      quantity: 1
    }]
  };

  // Get cart sections to update
  const cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
  if (cart && typeof cart.getSectionsToRender === 'function') {
    formData.sections = cart.getSectionsToRender().map(section => section.id);
    formData.sections_url = window.location.pathname;
  }

  // Make add to cart request
  fetch(window.Shopify?.routes?.cart_add_url || '/cart/add.js', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(formData)
  })
  .then(response => response.json())
  .then(response => {
    if (response.status) {
      // Error occurred
      console.error('Add to cart error:', response.description);
      button.classList.remove('loading');
      button.innerHTML = originalContent;
      showQuickBuyToast(response.description || 'Failed to add to cart', 'error');
      return;
    }

    // Success
    button.classList.remove('loading');
    button.classList.add('success');
    button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>`;

    // Trigger cart update
    if (typeof publish !== 'undefined' && typeof PUB_SUB_EVENTS !== 'undefined') {
      publish(PUB_SUB_EVENTS.cartUpdate, {
        source: 'quick-buy-direct',
        productVariantId: variantId,
        cartData: response
      });
    }

    // Update cart drawer/notification
    if (cart && typeof cart.renderContents === 'function') {
      cart.renderContents(response);
    }

    // Show success toast
    showQuickBuyToast('Added to cart!', 'success');

    // Reset button after delay
    setTimeout(() => {
      button.classList.remove('success');
      button.innerHTML = originalContent;
    }, 1500);
  })
  .catch(error => {
    console.error('Add to cart error:', error);
    button.classList.remove('loading');
    button.innerHTML = originalContent;
    showQuickBuyToast('Failed to add to cart. Please try again.', 'error');
  });
}

// Show toast notification
function showQuickBuyToast(message, type = 'info') {
  // Remove existing toast if any
  const existingToast = document.querySelector('.quick-buy-toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = 'quick-buy-toast';
  toast.textContent = message;

  // Error toasts use red, success/info use black
  const bgColor = type === 'error' ? '#B23A3A' : '#111111';
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: ${bgColor};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    animation: slideUp 0.3s ease;
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideDown 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// Add to cart functionality
function addToCartQuickBuy(productId, modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  const variantInput = modal.querySelector('.quick-buy-variant-id');
  const addBtn = modal.querySelector('.quick-buy-add-btn');

  if (!variantInput || !addBtn) return;

  const variantId = variantInput.value;

  // Show loading state
  addBtn.classList.add('loading');

  // Prepare form data
  const formData = {
    items: [{
      id: parseInt(variantId),
      quantity: 1
    }]
  };

  // Get cart sections to update
  const cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
  if (cart && typeof cart.getSectionsToRender === 'function') {
    formData.sections = cart.getSectionsToRender().map(section => section.id);
    formData.sections_url = window.location.pathname;
  }

  // Make add to cart request
  fetch(window.Shopify?.routes?.cart_add_url || '/cart/add.js', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(formData)
  })
  .then(response => response.json())
  .then(response => {
    if (response.status) {
      // Error occurred
      console.error('Add to cart error:', response.description);
      addBtn.classList.remove('loading');
      showQuickBuyError(response.description || 'Failed to add to cart', modal);
      return;
    }

    // Success - show success state briefly
    addBtn.classList.remove('loading');
    addBtn.classList.add('success');
    const addText = addBtn.querySelector('.quick-buy-add-text');
    if (addText) addText.textContent = 'Added!';

    // Trigger cart update
    if (typeof publish !== 'undefined' && typeof PUB_SUB_EVENTS !== 'undefined') {
      publish(PUB_SUB_EVENTS.cartUpdate, {
        source: 'quick-buy',
        productVariantId: variantId,
        cartData: response
      });
    }

    // Update cart drawer/notification
    if (cart && typeof cart.renderContents === 'function') {
      cart.renderContents(response);
    }

    // Close modal after short delay
    setTimeout(() => {
      closeQuickBuyModal(modalId);

      // Reset button state
      addBtn.classList.remove('success');
      if (addText) addText.textContent = 'Add to Cart';
    }, 800);
  })
  .catch(error => {
    console.error('Add to cart error:', error);
    addBtn.classList.remove('loading');
    showQuickBuyError('Failed to add to cart. Please try again.', modal);
  });
}

// Touch swipe to close on mobile
let touchStartY = 0;
let touchCurrentY = 0;

document.addEventListener('touchstart', function(e) {
  const modalContent = e.target.closest('.quick-buy-modal-content');
  if (modalContent) {
    touchStartY = e.touches[0].clientY;
  }
}, { passive: true });

document.addEventListener('touchmove', function(e) {
  const modalContent = e.target.closest('.quick-buy-modal-content');
  if (modalContent && touchStartY !== 0) {
    touchCurrentY = e.touches[0].clientY;
    const diff = touchCurrentY - touchStartY;

    // Only allow dragging down
    if (diff > 0 && modalContent.scrollTop === 0) {
      modalContent.style.transform = `translateY(${diff}px)`;
    }
  }
}, { passive: true });

document.addEventListener('touchend', function(e) {
  const modalContent = e.target.closest('.quick-buy-modal-content');
  if (modalContent && touchStartY !== 0) {
    const diff = touchCurrentY - touchStartY;

    // If dragged more than 100px, close the modal
    if (diff > 100) {
      const modal = modalContent.closest('.quick-buy-modal-overlay');
      if (modal) {
        closeQuickBuyModal(modal.id);
      }
    }

    // Reset transform
    modalContent.style.transform = '';
    touchStartY = 0;
    touchCurrentY = 0;
  }
}, { passive: true });
