/**
 * Modern Account Page JavaScript
 * Handles reorder functionality, order card interactions, and address management
 */

class AccountModern {
  constructor() {
    this.init();
  }

  init() {
    this.bindReorderButtons();
    this.bindAddressActions();
    this.bindEditProfile();
    this.bindAddressFormSubmit();
  }

  /**
   * Bind click handlers to all reorder buttons
   */
  bindReorderButtons() {
    const reorderButtons = document.querySelectorAll('.reorder-btn');
    reorderButtons.forEach((button) => {
      button.addEventListener('click', (e) => this.handleReorder(e));
    });
  }

  /**
   * Handle reorder button click - add all items to cart
   */
  async handleReorder(event) {
    const button = event.currentTarget;
    const lineItemsData = button.dataset.lineItems;

    if (!lineItemsData) {
      console.error('No line items data found');
      return;
    }

    let lineItems;
    try {
      lineItems = JSON.parse(lineItemsData);
    } catch (e) {
      console.error('Failed to parse line items:', e);
      return;
    }

    // Show loading state
    const originalContent = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `
      <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Adding...
    `;

    try {
      // Filter out items with invalid variant IDs
      const validItems = lineItems.filter((item) => item.id && item.quantity > 0);

      if (validItems.length === 0) {
        throw new Error('No valid items to add');
      }

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ items: validItems }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.description || 'Failed to add items to cart');
      }

      // Success - redirect to cart
      window.location.href = '/cart';
    } catch (error) {
      console.error('Reorder failed:', error);

      // Extract short error message for user
      let errorMsg = 'Failed';
      const errorText = error.message || '';
      if (errorText.includes('sold out')) {
        errorMsg = 'Sold out';
      } else if (errorText.includes('not available')) {
        errorMsg = 'Unavailable';
      }

      // Show error state briefly
      button.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        ${errorMsg}
      `;
      button.classList.remove('bg-gray-900', 'hover:bg-gray-800');
      button.classList.add('bg-red-600');

      // Reset after 2 seconds
      setTimeout(() => {
        button.innerHTML = originalContent;
        button.disabled = false;
        button.classList.remove('bg-red-600');
        button.classList.add('bg-gray-900', 'hover:bg-gray-800');
      }, 2000);
    }
  }

  /**
   * Bind address management actions
   */
  bindAddressActions() {
    // Add address button
    const addAddressBtn = document.getElementById('AddAddressBtn');
    const addAddressForm = document.getElementById('AddAddressForm');
    const closeAddFormBtns = document.querySelectorAll('.close-add-form-btn');

    if (addAddressBtn && addAddressForm) {
      addAddressBtn.addEventListener('click', () => {
        addAddressForm.classList.remove('hidden');
        addAddressBtn.classList.add('hidden');
        addAddressForm.querySelector('input')?.focus();
      });

      closeAddFormBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          addAddressForm.classList.add('hidden');
          addAddressBtn.classList.remove('hidden');
        });
      });
    }

    // Edit address buttons
    const editBtns = document.querySelectorAll('.edit-address-btn');
    editBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const addressId = btn.dataset.addressId;
        const editForm = document.querySelector(`[data-edit-form="${addressId}"]`);
        const card = btn.closest('[data-address-card]');

        if (editForm) {
          editForm.classList.toggle('hidden');
          card?.classList.toggle('editing');
          if (!editForm.classList.contains('hidden')) {
            editForm.querySelector('input')?.focus();
          }
        }
      });
    });

    // Cancel form buttons
    const cancelBtns = document.querySelectorAll('.cancel-form-btn');
    cancelBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const formId = btn.dataset.formId;

        if (formId === 'new') {
          // Close add form
          addAddressForm?.classList.add('hidden');
          addAddressBtn?.classList.remove('hidden');
        } else {
          // Close edit form
          const editForm = document.querySelector(`[data-edit-form="${formId}"]`);
          const card = editForm?.closest('[data-address-card]');
          editForm?.classList.add('hidden');
          card?.classList.remove('editing');
        }
      });
    });

    // Delete address buttons
    const deleteBtns = document.querySelectorAll('.delete-address-btn');
    const deleteModal = document.getElementById('DeleteConfirmModal');
    const deleteMessage = document.getElementById('DeleteConfirmMessage');
    const confirmDeleteBtn = document.getElementById('ConfirmDeleteBtn');
    const modalCancel = deleteModal?.querySelector('[data-modal-cancel]');

    // Store the target address URL for the delete operation
    let targetAddressUrl = null;

    deleteBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const addressUrl = btn.dataset.addressUrl;
        const confirmMessage = btn.dataset.deleteMessage || 'Are you sure you want to delete this address?';

        if (addressUrl && deleteMessage && deleteModal) {
          targetAddressUrl = addressUrl;
          deleteMessage.textContent = confirmMessage;
          deleteModal.style.display = 'block';
          document.body.style.overflow = 'hidden';
        }
      });
    });

    // Confirm delete button handler - use Shopify.postLink for proper CSRF handling
    confirmDeleteBtn?.addEventListener('click', () => {
      if (targetAddressUrl && Shopify && Shopify.postLink) {
        // Show loading state
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.innerHTML = `
          <svg class="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Deleting...</span>
        `;

        Shopify.postLink(targetAddressUrl, {
          parameters: { _method: 'delete' },
        });
      }
    });

    // Close modal handlers
    const closeDeleteModal = () => {
      if (deleteModal) {
        deleteModal.style.display = 'none';
        document.body.style.overflow = '';
        targetAddressUrl = null;
      }
    };

    // Close on backdrop click (click on modal itself, not children)
    deleteModal?.addEventListener('click', (e) => {
      if (e.target === deleteModal || e.target.parentElement === deleteModal) {
        closeDeleteModal();
      }
    });
    modalCancel?.addEventListener('click', closeDeleteModal);

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && deleteModal && deleteModal.style.display !== 'none') {
        closeDeleteModal();
      }
    });
  }

  /**
   * Bind address form submit to show loading state
   */
  bindAddressFormSubmit() {
    const addressForms = document.querySelectorAll('form[action*="/account/addresses"]');

    addressForms.forEach((form) => {
      form.addEventListener('submit', (e) => {
        const submitBtn = form.querySelector('.address-form-submit');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `
            <svg class="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Saving...</span>
          `;
        }
      });
    });
  }

  /**
   * Bind edit profile modal
   */
  bindEditProfile() {
    const editBtn = document.getElementById('EditProfileBtn');
    const modal = document.getElementById('EditProfileModal');
    const closeBtn = document.getElementById('EditProfileCloseBtn');

    if (!editBtn || !modal) return;

    editBtn.addEventListener('click', () => this.openEditModal());
    closeBtn?.addEventListener('click', () => this.closeEditModal());

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.parentElement === modal) {
        this.closeEditModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display !== 'none') {
        this.closeEditModal();
      }
    });
  }

  openEditModal() {
    const modal = document.getElementById('EditProfileModal');
    const content = document.getElementById('EditProfileModalContent');

    if (!modal || !content) return;

    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      content.style.transform = 'scale(1)';
      content.style.opacity = '1';
    });
  }

  closeEditModal() {
    const modal = document.getElementById('EditProfileModal');
    const content = document.getElementById('EditProfileModalContent');

    if (!modal || !content) return;

    content.style.transform = 'scale(0.95)';
    content.style.opacity = '0';

    setTimeout(() => {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }, 300);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new AccountModern());
} else {
  new AccountModern();
}
