import { pickLang, getDict, makeT, applyI18n } from "./i18n/index.js";
import { App } from "./app.js";

const lang = pickLang();
const dict = getDict(lang);
const t = makeT(dict);

document.documentElement.lang = lang;
applyI18n(t);

const app = new App({ t });

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const act = btn.dataset.action;

  if (act === "startNew") app.startNew();
  if (act === "showResultHome") app.showResultFromHome();
  if (act === "skip") app.skip();
  if (act === "passDevice") app.passDevice();
  if (act === "share") app.share();
  if (act === "backHome") app.showHome();
  if (act === "clearPartner") app.clearPartner();

});
