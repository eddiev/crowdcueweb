(() => {
  const form = document.querySelector('.guide-search');
  const input = document.querySelector('#guide-query');
  const clear = document.querySelector('#guide-clear');
  const status = document.querySelector('#guide-status');
  const empty = document.querySelector('#guide-empty');
  const sections = [...document.querySelectorAll('[data-guide-topic]')];
  const links = [...document.querySelectorAll('.guide-contents a')];
  const contents = document.querySelector('.guide-contents');
  if (!input || !sections.length) return;
  const desktop = window.matchMedia('(min-width: 901px)');
  contents.open = desktop.matches;
  desktop.addEventListener('change', event => { contents.open = event.matches; });
  const normalize = value => value.toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  function filter() {
    const words = normalize(input.value.trim()).split(/\s+/).filter(Boolean);
    let count = 0;
    for (const section of sections) {
      const matches = words.every(word => normalize(section.textContent).includes(word));
      section.hidden = !matches;
      const link = links.find(item => item.hash === '#' + section.id);
      if (link) link.hidden = !matches;
      if (matches) count++;
      section.querySelectorAll('.guide-answer').forEach(answer => { answer.open = words.length > 0 && matches; });
    }
    clear.hidden = words.length === 0;
    empty.hidden = count > 0;
    status.textContent = words.length ? `${count} matching ${count === 1 ? 'topic' : 'topics'}` : `Browse all ${sections.length} topics`;
  }
  form.addEventListener('submit', event => { event.preventDefault(); document.querySelector('[data-guide-topic]:not([hidden])')?.scrollIntoView({behavior: 'auto'}); });
  input.addEventListener('input', filter);
  clear.addEventListener('click', () => { input.value = ''; filter(); input.focus(); });
  document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', () => {
    if (input.value) { input.value = ''; filter(); }
  }));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting && !entry.target.hidden) {
        for (const link of links) {
          if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        }
      }
    }, {rootMargin: '-10% 0px -65% 0px'});
    sections.forEach(section => observer.observe(section));
  }
})();
