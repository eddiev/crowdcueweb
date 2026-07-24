(() => {
  const scenes = [...document.querySelectorAll(".stelli-hero__scenes img")];
  const controls = [...document.querySelectorAll(".stelli-scene-controls button")];
  const caption = document.querySelector(".stelli-hero__caption");
  const labels = ["Friends at sunset", "A shared game", "A guided place"];

  if (!scenes.length) return;

  let current = 0;
  const show = (index) => {
    current = index;
    scenes.forEach((scene, sceneIndex) => scene.classList.toggle("is-active", sceneIndex === index));
    controls.forEach((control, controlIndex) => control.classList.toggle("is-current", controlIndex === index));
    if (caption) caption.textContent = labels[index];
  };

  controls.forEach((control, index) => control.addEventListener("click", () => show(index)));

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.setInterval(() => show((current + 1) % scenes.length), 6500);
  }
})();
