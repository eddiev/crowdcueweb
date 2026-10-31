(() => {
  document.querySelectorAll('[data-launch-form]').forEach(form => {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!form.reportValidity() || form.dataset.sending === 'true') return;
      const button = form.querySelector('[type="submit"]');
      const status = form.querySelector('.form-status');
      const original = button.textContent;
      form.dataset.sending = 'true'; button.disabled = true; button.textContent = 'Saving…';
      status.textContent = ''; status.classList.remove('is-error');
      try {
        const response = await fetch('/api/launch-updates', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email: form.elements.email.value, website: form.elements.website.value, consent: true, source: form.dataset.source || 'homepage'})});
        const result = await response.json();
        if (!response.ok || result.ok !== true) throw new Error(result.error || 'We couldn’t save your email. Please try again.');
        form.reset(); status.textContent = 'You’re on the list. We’ll email you when Stelli is ready.';
        button.textContent = 'You’re on the list';
      } catch (error) {
        status.textContent = error.message || 'Please try again, or email support@stelliapp.com.'; status.classList.add('is-error'); button.textContent = original;
      } finally { button.disabled = false; form.dataset.sending = 'false'; }
    });
  });
})();
