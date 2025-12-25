// ========= js/swipe.js =========
export function attachSwipe({ wrap, inner, sL, sR, onAnswer, onFlip }) {
  let pointerId = null;

  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;

  let isDown = false;
  let moved = false;
  let startTime = 0;

  const MOVE_THRESHOLD = 10;   // сколько px можно "дрожать" и всё ещё считать тапом
  const SWIPE_THRESHOLD = 90;  // сколько px нужно для засчитывания свайпа
  const TAP_MAX_TIME = 450;    // максимальное время тапа (мс)

  function resetVisual() {
    wrap.style.transition = "transform 0.3s ease";
    wrap.style.transform = "translateX(0)";
    sL.style.opacity = "0";
    sR.style.opacity = "0";
  }

  function updateStamps(dx) {
    if (dx > 0) {
      sR.style.opacity = String(Math.min(dx / 100, 1));
      sL.style.opacity = "0";
    } else {
      sL.style.opacity = String(Math.min(Math.abs(dx) / 100, 1));
      sR.style.opacity = "0";
    }
  }

  function onPointerDown(e) {
    // Не реагируем на второй палец/доп. указатели
    if (isDown) return;

    isDown = true;
    moved = false;
    startTime = Date.now();

    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    currentX = startX;
    currentY = startY;

    // Важно: захватываем pointer, чтобы move/up приходили даже если палец/мышь ушли за элемент
    wrap.setPointerCapture(pointerId);

    wrap.style.transition = "none";
  }

  function onPointerMove(e) {
    if (!isDown || e.pointerId !== pointerId) return;

    currentX = e.clientX;
    currentY = e.clientY;

    const dx = currentX - startX;
    const dy = currentY - startY;

    // Если движение ещё маленькое — не считаем drag'ом (иначе тап на таче часто ломается)
    if (!moved) {
      if (Math.hypot(dx, dy) < MOVE_THRESHOLD) return;
      moved = true;
    }

    // drag
    wrap.style.transform = `translateX(${dx}px) rotate(${dx * 0.05}deg)`;
    updateStamps(dx);

    // чтобы на touch не происходил скролл/зум-жесты
    e.preventDefault?.();
  }

  function onPointerUp(e) {
    if (!isDown || e.pointerId !== pointerId) return;

    isDown = false;

    try { wrap.releasePointerCapture(pointerId); } catch {}
    const dx = currentX - startX;
    const dt = Date.now() - startTime;

    // TAP -> flip
    if (!moved && dt <= TAP_MAX_TIME) {
      inner.classList.toggle("flipped");
      resetVisual();
      onFlip?.();
      return;
    }

    // SWIPE commit
    wrap.style.transition = "transform 0.3s ease";

    if (Math.abs(dx) >= SWIPE_THRESHOLD) {
      const val = dx > 0; // right -> true, left -> false
      onAnswer(val);

      const endX = dx > 0 ? window.innerWidth : -window.innerWidth;
      wrap.style.transform = `translateX(${endX}px)`;
      // дальше App сам сделает next() с таймаутом как у тебя
      return;
    }

    // Not enough -> snap back
    resetVisual();
  }

  function onPointerCancel(e) {
    if (!isDown || e.pointerId !== pointerId) return;
    isDown = false;
    resetVisual();
  }

  // Вешаем именно addEventListener, чтобы не конфликтовать с другими обработчиками
  wrap.addEventListener("pointerdown", onPointerDown, { passive: true });
  wrap.addEventListener("pointermove", onPointerMove, { passive: false });
  wrap.addEventListener("pointerup", onPointerUp, { passive: true });
  wrap.addEventListener("pointercancel", onPointerCancel, { passive: true });

  return () => {
    wrap.removeEventListener("pointerdown", onPointerDown);
    wrap.removeEventListener("pointermove", onPointerMove);
    wrap.removeEventListener("pointerup", onPointerUp);
    wrap.removeEventListener("pointercancel", onPointerCancel);
  };
}
