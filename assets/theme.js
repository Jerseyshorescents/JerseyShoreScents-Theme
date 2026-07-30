document.documentElement.classList.add('js');

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  const notification = document.querySelector('[data-cart-notification]');
  let notificationTimer;

  const hideCartNotification = () => {
    if (!notification) return;
    notification.classList.remove('is-visible');
    window.setTimeout(() => {
      if (!notification.classList.contains('is-visible')) notification.hidden = true;
    }, 250);
  };

  const showCartNotification = (message, isError = false) => {
    if (!notification) return;
    window.clearTimeout(notificationTimer);
    notification.hidden = false;
    notification.classList.toggle('is-error', isError);
    notification.querySelector('[data-cart-notification-title]').textContent = isError ? 'Unable to add item' : 'Added to your cart';
    notification.querySelector('[data-cart-notification-message]').textContent = message || '';
    window.requestAnimationFrame(() => notification.classList.add('is-visible'));
    notificationTimer = window.setTimeout(hideCartNotification, 7000);
  };

  document.querySelectorAll('[data-cart-notification-close]').forEach((button) => {
    button.addEventListener('click', hideCartNotification);
  });

  document.addEventListener('submit', async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.matches('form[action*="/cart/add"]')) return;

    const isQuickAdd = form.classList.contains('collection-product-card__form');
    if (!isQuickAdd && event.submitter && event.submitter.name !== 'add') return;

    event.preventDefault();

    const submitButton = event.submitter || form.querySelector('[type="submit"]');
    const submitText = submitButton?.querySelector('[data-add-to-cart-text]');
    const originalButtonText = submitText ? submitText.textContent : submitButton?.textContent;

    if (submitButton) submitButton.disabled = true;
    if (submitText) submitText.textContent = 'Adding…';

    try {
      const root = window.Shopify?.routes?.root || '/';
      const response = await fetch(`${root}cart/add.js`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: new FormData(form)
      });
      const item = await response.json();

      if (!response.ok) throw new Error(item.description || 'Please check your selection and try again.');

      const cartResponse = await fetch(`${root}cart.js`, {
        headers: { Accept: 'application/json' }
      });
      const updatedCart = await cartResponse.json();
      document.querySelectorAll('[data-cart-count]').forEach((count) => {
        count.textContent = updatedCart.item_count;
      });

      showCartNotification(item.product_title || item.title || 'Your item was added.');
    } catch (error) {
      showCartNotification(error.message, true);
    } finally {
      if (submitButton) submitButton.disabled = false;
      if (submitText) submitText.textContent = originalButtonText;
    }
  });
});
