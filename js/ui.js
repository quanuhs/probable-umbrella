export function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

export function getEl(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el;
}

export function renderCounter(i, total) {
  setText("counter", `${i}/${total}`);
}

export function renderHints(q, t) {
  setText("hint-l", t("quiz.hintNoPrefix") + q.L);
  setText("hint-r", q.R + t("quiz.hintYesSuffix"));
}

export function resetCardWrapper(wrap) {
  wrap.style.transition = "none";
  wrap.style.transform = "";
  wrap.style.opacity = "1";
}

export function renderCard(wrap, q) {
  clear(wrap);
  resetCardWrapper(wrap);

  const tpl = document.getElementById("tpl-card");
  if (!tpl) throw new Error("Missing <template id='tpl-card'>");

  const frag = tpl.content.cloneNode(true);

  frag.querySelector(".card-cat").textContent = q.cat;
  frag.querySelector(".card-title").textContent = q.title;
  frag.querySelector(".card-title-back").textContent = q.title;
  frag.querySelector(".card-desc").textContent = q.desc;

  const inner = frag.querySelector(".card-inner");

  const sL = document.createElement("div");
  sL.className = "stamp stamp-no";
  sL.textContent = q.L;

  const sR = document.createElement("div");
  sR.className = "stamp stamp-yes";
  sR.textContent = q.R;

  if (q.logic === "role") {
    sL.style.color = "#6C63FF";
    sL.style.borderColor = "#6C63FF";
    sR.style.color = "#6C63FF";
    sR.style.borderColor = "#6C63FF";
  }

  wrap.appendChild(frag);
  wrap.appendChild(sL);
  wrap.appendChild(sR);

  return { inner, sL, sR };
}

export function animateSkip(wrap, onDone) {
  wrap.style.transition = "all 0.4s ease";
  wrap.style.transform = "translateY(-50px) scale(0.95)";
  wrap.style.opacity = "0";
  setTimeout(onDone, 400);
}

export function renderResults(box, scoreEl, data, t) {
  clear(box);

  if (data.items.length === 0) {
    const emptyTpl = document.getElementById("tpl-empty-result");
    if (!emptyTpl) throw new Error("Missing <template id='tpl-empty-result'>");
    const frag = emptyTpl.content.cloneNode(true);
    frag.querySelector(".res-empty").textContent = t("result.empty");
    box.appendChild(frag);

    scoreEl.textContent = t("result.compareFallbackTitle");
    return;
  }

  scoreEl.textContent = t("result.intro");

  const itemTpl = document.getElementById("tpl-result-item");
  const badgeTpl = document.getElementById("tpl-badge");
  if (!itemTpl) throw new Error("Missing <template id='tpl-result-item'>");
  if (!badgeTpl) throw new Error("Missing <template id='tpl-badge'>");

  for (const it of data.items) {
    const frag = itemTpl.content.cloneNode(true);

    const label = it.kind === "match" ? t("result.matchLabel") : t("result.roleLabel");
    frag.querySelector(".res-title").textContent = `${it.title} (${label})`;

    const badgeBox = frag.querySelector(".badge-container");
    for (const b of it.badges) {
      const bFrag = badgeTpl.content.cloneNode(true);
      const badge = bFrag.querySelector(".badge");
      badge.style.background = b.col;
      badge.textContent = t(b.textKey) + b.value;
      badgeBox.appendChild(bFrag);
    }

    box.appendChild(frag);
  }
}