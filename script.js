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

  const dialog = document.querySelector('#demo-player');
  const video = dialog?.querySelector('video');
  const names = {'sunset-sessions': 'Sunset Sessions', 'ball-game': 'Ball Game', 'game-night': 'Game Night'};
  let trigger = null;
  document.querySelectorAll('[data-demo]').forEach(button => button.addEventListener('click', () => {
    const slug = button.dataset.demo;
    if (!Object.hasOwn(names, slug) || !dialog || !video) return;
    trigger = button;
    document.querySelector('#demo-title').textContent = names[slug];
    video.src = `assets/demos/${slug}.mp4`; video.poster = `assets/demos/${slug}.webp`;
    video.setAttribute('aria-label', `${names[slug]} Stelli demonstration`);
    dialog.showModal(); document.body.classList.add('dialog-open');
    video.play().catch(() => { /* Native controls remain available if playback is blocked. */ });
  }));
  dialog?.querySelector('.demo-close').addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  dialog?.addEventListener('close', () => { video.pause(); video.removeAttribute('src'); video.load(); document.body.classList.remove('dialog-open'); trigger?.focus(); });
})();
