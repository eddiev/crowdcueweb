(() => {
  document.querySelectorAll('[data-contact-form]').forEach(form => {
    let requestId;
    let previousPayload;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!form.reportValidity() || form.dataset.sending === 'true') return;
      const button = form.querySelector('[type="submit"]');
      const status = form.querySelector('.form-status');
      const fields = {name: form.elements.name.value, email: form.elements.email.value, message: form.elements.message.value, website: form.elements.website.value};
      const payload = JSON.stringify(fields);
      if (payload !== previousPayload) { requestId = crypto.randomUUID(); previousPayload = payload; }
      form.dataset.sending = 'true'; button.disabled = true; button.textContent = 'Sending…';
      status.textContent = ''; status.classList.remove('is-error');
      try {
        const response = await fetch('/api/contact', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({...fields, requestId}), signal: AbortSignal.timeout(20000)});
        const result = await response.json().catch(() => { throw new Error('We couldn’t send your message. Please try again or email support@stelliapp.com.'); });
        if (!response.ok || result.ok !== true) throw new Error(result.error || 'We couldn’t send your message. Please try again or email support@stelliapp.com.');
        // Preserve any new draft typed while this message was sending.
        const current = JSON.stringify({name: form.elements.name.value, email: form.elements.email.value, message: form.elements.message.value, website: form.elements.website.value});
        if (current === payload) form.reset();
        previousPayload = undefined;
        status.textContent = 'Thanks for reaching out. Your message has been sent to the Stelli team.';
      } catch (error) {
        status.textContent = error.name === 'TimeoutError' ? 'The request timed out. Please try again or email support@stelliapp.com.' : (error.message || 'Please try again or email support@stelliapp.com.');
        status.classList.add('is-error');
      } finally { button.disabled = false; button.textContent = 'Send message'; form.dataset.sending = 'false'; }
    });
  });
})();
