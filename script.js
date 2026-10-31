(() => {
  const scenes = [...document.querySelectorAll('.stelli-hero__scenes img')];
  const controls = [...document.querySelectorAll('.stelli-scene-controls button:not(.scene-pause)')];
  const pause = document.querySelector('.scene-pause');
  const caption = document.querySelector('.stelli-hero__caption');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const labels = ['Friends at sunset', 'A shared game', 'A guided place'];
  let current = 0, timer = null, paused = reducedMotion.matches;
  const show = index => {
    current = index;
    scenes.forEach((scene, i) => scene.classList.toggle('is-active', i === index));
    controls.forEach((control, i) => { control.classList.toggle('is-current', i === index); control.setAttribute('aria-pressed', String(i === index)); });
    if (caption) caption.textContent = labels[index];
  };
  const updateTimer = () => {
    clearInterval(timer); timer = null;
    if (!paused && !document.hidden && scenes.length) timer = setInterval(() => show((current + 1) % scenes.length), 6500);
    if (pause) { pause.textContent = paused ? 'Play' : 'Pause'; pause.setAttribute('aria-label', paused ? 'Resume changing scenes' : 'Pause changing scenes'); }
  };
  controls.forEach((control, index) => control.addEventListener('click', () => { show(index); paused = true; updateTimer(); }));
  pause?.addEventListener('click', () => { paused = !paused; updateTimer(); });
  reducedMotion.addEventListener('change', event => { if (event.matches) paused = true; updateTimer(); });
  document.addEventListener('visibilitychange', updateTimer); updateTimer();

  const carousel = document.querySelector('.demo-carousel');
  const track = carousel?.querySelector('.demo-track');
  if (track) {
    const cards = [...track.querySelectorAll('.demo-card')];
    const previous = carousel.querySelector('.demo-carousel__previous');
    const next = carousel.querySelector('.demo-carousel__next');
    const status = carousel.querySelector('.demo-carousel__status');
    const step = () => cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap);
    const update = () => {
      const size = step();
      const visible = Math.max(1, Math.round((track.clientWidth + parseFloat(getComputedStyle(track).columnGap)) / size));
      const first = Math.min(cards.length - visible, Math.max(0, Math.round(track.scrollLeft / size)));
      const text = visible === 1 ? `${first + 1} of ${cards.length}` : `${first + 1}–${Math.min(cards.length, first + visible)} of ${cards.length}`;
      if (status.textContent !== text) status.textContent = text;
      previous.disabled = track.scrollLeft < 2;
      next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
    };
    const move = direction => track.scrollBy({left: direction * step(), behavior: reducedMotion.matches ? 'instant' : 'smooth'});
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    track.addEventListener('scroll', update, {passive: true});
    track.addEventListener('keydown', event => {
      if (event.target !== track) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); }
      if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); track.scrollTo({left: event.key === 'Home' ? 0 : track.scrollWidth, behavior: reducedMotion.matches ? 'instant' : 'smooth'}); }
    });
    new ResizeObserver(update).observe(track);
    carousel.querySelector('.demo-carousel__controls').hidden = false;
    update();
  }

  const dialog = document.querySelector('#demo-player');
  const video = dialog?.querySelector('video');
  const names = {'sunset-sessions': 'Sunset Sessions', 'wedding-remote': 'Wedding', 'discover-museum': 'Discover', 'ball-game': 'Ball Game', 'game-night': 'D&D'};
  let trigger = null;
  document.querySelectorAll('[data-demo]').forEach(button => button.addEventListener('click', () => {
    const slug = button.dataset.demo;
    if (!Object.hasOwn(names, slug) || !dialog || !video) return;
    trigger = button;
    document.querySelector('#demo-title').textContent = names[slug];
    const revision = slug === 'ball-game' ? '?v=9-20261031' : slug === 'wedding-remote' ? '?v=4-james-20261031' : '';
    video.src = `assets/demos/${slug}.mp4${revision}`; video.poster = `assets/demos/${slug}.webp`;
    video.setAttribute('aria-label', `${names[slug]} Stelli demonstration`);
    dialog.showModal(); document.body.classList.add('dialog-open');
    video.play().catch(() => { /* Native controls remain available if playback is blocked. */ });
  }));
  dialog?.querySelector('.demo-close').addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  dialog?.addEventListener('close', () => { video.pause(); video.removeAttribute('src'); video.load(); document.body.classList.remove('dialog-open'); trigger?.focus(); });
})();
