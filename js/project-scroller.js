(() => {
  const scroller = document.querySelector("[data-project-scroller]");
  if (!scroller) {
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const speed = 12;
  let direction = 1;
  let previousTime = 0;
  let frame = 0;
  let stopped = false;

  function stopAutoscroll() {
    stopped = true;
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }

  function startAutoscroll() {
    if (!stopped && !frame && !reducedMotion.matches) {
      frame = requestAnimationFrame(animate);
    }
  }

  function animate(time) {
    frame = 0;
    if (stopped || document.hidden || reducedMotion.matches) {
      previousTime = 0;
      return;
    }

    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
    if (maxScroll <= 1) {
      previousTime = 0;
      return;
    }

    if (previousTime) {
      const elapsed = Math.min(time - previousTime, 50) / 1000;
      scroller.scrollLeft += direction * speed * elapsed;
      if (scroller.scrollLeft >= maxScroll) {
        scroller.scrollLeft = maxScroll;
        direction = -1;
      } else if (scroller.scrollLeft <= 0) {
        scroller.scrollLeft = 0;
        direction = 1;
      }
    }

    previousTime = time;
    frame = requestAnimationFrame(animate);
  }

  ["pointerenter", "pointerdown", "touchstart", "wheel", "keydown", "focusin"].forEach((eventName) => {
    scroller.addEventListener(eventName, stopAutoscroll, { passive: true });
  });
  document.addEventListener("visibilitychange", () => {
    previousTime = 0;
    if (!document.hidden) {
      startAutoscroll();
    }
  });
  window.addEventListener("resize", () => {
    scroller.scrollLeft = Math.min(scroller.scrollLeft, scroller.scrollWidth - scroller.clientWidth);
    startAutoscroll();
  });
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      previousTime = 0;
    } else {
      startAutoscroll();
    }
  });
  new MutationObserver(startAutoscroll).observe(scroller, { childList: true });

  startAutoscroll();
})();
