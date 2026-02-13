(() => {
  const isHome = document.body.classList.contains("page--home");
  if (!isHome) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    document.body.classList.add("stage-swirl", "stage-avatars", "stage-copy");
    return;
  }

  window.addEventListener("load", () => {
    document.body.classList.add("stage-swirl");

    window.setTimeout(() => {
      document.body.classList.add("stage-avatars");
    }, 1150);

    window.setTimeout(() => {
      document.body.classList.add("stage-copy");
    }, 1860);
  });
})();
