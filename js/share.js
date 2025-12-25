export function encodeAnswers(answers) {
  // Чтобы безопасно кодировать любые символы — через encodeURIComponent
  const json = JSON.stringify(answers);
  const safe = encodeURIComponent(json);
  return btoa(safe);
}

export function decodeAnswers(codeOrUrl) {
  let val = String(codeOrUrl || "").trim();
  if (!val) throw new Error("empty");

  // вытащим ?c=... если дали ссылку
  const idx = val.indexOf("?c=");
  if (idx !== -1) val = val.slice(idx + 3);

  const safe = atob(val);
  const json = decodeURIComponent(safe);
  return JSON.parse(json);
}

export function buildShareUrl(encoded) {
  return `${location.origin}${location.pathname}?c=${encoded}`;
}

export async function shareOrCopy({ url, title, text, copiedMsg }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return { ok: true, via: "share" };
    } catch {
      // фоллбек в копирование (часто на десктопе)
    }
  }
  await copyToClipboard(url, copiedMsg);
  return { ok: true, via: "copy" };
}

export async function copyToClipboard(text, successMessage) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      alert(successMessage);
      return;
    } catch {
      // упадём в prompt
    }
  }
  prompt("Code:", text);
}
