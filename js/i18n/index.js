import { ru } from "./ru.js";
// import { en } from "./en.js";

export function pickLang() {
  const urlLang = new URLSearchParams(location.search).get("lang");
  if (urlLang === "ru") return "ru";
  // if (urlLang === "en") return "en";
  return "ru";
}

export function getDict(lang) {
  const dicts = { ru /*, en */ };
  return dicts[lang] ?? dicts.ru;
}

// очень простой t: t("home.title")
export function makeT(dict) {
  return (key) => key.split(".").reduce((acc, k) => acc?.[k], dict) ?? key;
}

export function applyI18n(t) {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    const val = t(key);
    // поддержим переносы строк
    el.textContent = String(val).replaceAll("\\n", "\n");
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    el.setAttribute("placeholder", t(key));
  });
}
