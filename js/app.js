import { createInitialState } from "./state.js";
import { attachSwipe } from "./swipe.js";
import { calcResults } from "./calc.js";
import {
  showView,
  getEl,
  renderCounter,
  renderHints,
  renderCard,
  animateSkip,
  renderResults
} from "./ui.js";

import { encodeAnswers, decodeAnswers, buildShareUrl, shareOrCopy } from "./share.js";
import { QUESTIONS } from "./data/questions.ru.js";

export class App {
  constructor({ t }) {
    this.t = t;
    this.state = createInitialState();
    this.cleanupSwipe = null;

    this.els = {
      activeCard: getEl("active-card"),
      resBox: getEl("res-box"),
      score: getEl("score"),

      myInput: document.getElementById("code-input-my"),
      partnerInput: document.getElementById("code-input-partner"),

      btnMain: document.getElementById("btn-home-main"),
      btnResult: document.getElementById("btn-home-result"),
      btnShare: document.getElementById("btn-home-share"),
      btnClearPartner: document.getElementById("btn-clear-partner"),
      btnShareMy: document.getElementById("btn-share-my"),

    };

    // реакция на ввод: сразу обновляем подписи/кнопки
    this.els.myInput?.addEventListener("input", () => this.updateHomeButtons());
    this.els.partnerInput?.addEventListener("input", () => this.updateHomeButtons());

    // Если зашли по ссылке ?c=... — это код партнёра
    const p = new URLSearchParams(location.search);
    if (p.has("c")) {
      const raw = p.get("c");
      if (this.els.partnerInput && !this.els.partnerInput.value.trim()) {
        this.els.partnerInput.value = raw;
      }
      // попробуем декодировать заранее (не критично, но удобно)
      try {
        this.state.partner = decodeAnswers(raw);
        this.state.partnerCodeRaw = raw;
      } catch {
        // игнор
      }
    }

    this.updateHomeButtons();
  }

  showHome() {
    showView("v-home");
    this.updateHomeButtons();
  }

  // Главная логика кнопки "startNew":
  // - оба кода -> показываем результаты (кнопка startNew обычно скрыта, но на всякий случай)
  // - только мой код -> "передать телефон": переносим мой код в поле партнёра и запускаем тест
  // - иначе -> "начать тест"
  startNew() {
    const myRaw = this.els.myInput ? this.els.myInput.value.trim() : "";
    const partnerRaw = this.els.partnerInput ? this.els.partnerInput.value.trim() : "";

    const hasMy = !!myRaw;
    const hasPartner = !!partnerRaw;

    // Оба кода -> результат
    if (hasMy && hasPartner) {
      this.showResultFromHome();
      return;
    }

    // Только мой код -> "передать телефон"
    if (hasMy && !hasPartner) {
      let partnerAnswers;
      try {
        partnerAnswers = decodeAnswers(myRaw);
      } catch {
        alert(this.t("input.invalidCode"));
        return;
      }

      // теперь "код партнёра" = бывший мой код (первый игрок)
      this.state.partner = partnerAnswers;
      this.state.partnerCodeRaw = myRaw;

      if (this.els.partnerInput) this.els.partnerInput.value = myRaw;
      if (this.els.myInput) this.els.myInput.value = "";

      this.state.myAnswers = null;
      this.startQuiz();
      return;
    }

    // Только код партнёра (или ничего) -> начинаю тест как я
    if (hasPartner) {
      try {
        this.state.partner = decodeAnswers(partnerRaw);
        this.state.partnerCodeRaw = partnerRaw;
      } catch {
        alert(this.t("input.invalidCode"));
        return;
      }
    } else {
      this.state.partner = null;
      this.state.partnerCodeRaw = null;
    }

    this.state.myAnswers = null;
    this.startQuiz();
  }

  updateHomeButtons() {
    const myRaw = this.els.myInput ? this.els.myInput.value.trim() : "";
    const partnerRaw = this.els.partnerInput ? this.els.partnerInput.value.trim() : "";

    const hasMy = !!myRaw;
    const hasPartner = !!partnerRaw;


    // Скрывать action-кнопки, если поле пустое
    const wrapMy = this.els.myInput?.closest(".input-wrap");
    if (wrapMy) wrapMy.classList.toggle("is-empty", !this.els.myInput.value.trim());

    const wrapPartner = this.els.partnerInput?.closest(".input-wrap");
    if (wrapPartner) wrapPartner.classList.toggle("is-empty", !this.els.partnerInput.value.trim());



    // "Поделиться" показываем если есть мой код
    if (this.els.btnShare) this.els.btnShare.style.display = hasMy ? "" : "none";

    // Кнопка очистки — только если что-то введено в код друга
    if (this.els.btnClearPartner) {
      this.els.btnClearPartner.style.display = hasPartner ? "" : "none";
    }


    // оба заполнены -> показываем кнопку результата, скрываем основную
    if (hasMy && hasPartner) {
      if (this.els.btnMain) this.els.btnMain.style.display = "none";
      if (this.els.btnResult) this.els.btnResult.style.display = "";
      return;
    }

    // иначе -> показываем основную, скрываем "результат"
    if (this.els.btnMain) this.els.btnMain.style.display = "";
    if (this.els.btnResult) this.els.btnResult.style.display = "none";

    // если только мой код -> "Передать телефон", иначе -> "Начать тест"
    if (this.els.btnMain) {
      this.els.btnMain.textContent = hasMy ? this.t("hub.passDevice") : this.t("home.start");
    }
  }

  showResultFromHome() {
    const myRaw = this.els.myInput ? this.els.myInput.value.trim() : "";
    const partnerRaw = this.els.partnerInput ? this.els.partnerInput.value.trim() : "";

    if (!myRaw || !partnerRaw) {
      // по идее сюда не попадём (кнопка появляется только при двух кодах)
      alert(this.t("input.invalidCode"));
      return;
    }

    let myAnswers, partnerAnswers;
    try {
      myAnswers = decodeAnswers(myRaw);
      partnerAnswers = decodeAnswers(partnerRaw);
    } catch {
      alert(this.t("input.invalidCode"));
      return;
    }

    this.state.myAnswers = myAnswers;
    this.state.partner = partnerAnswers;
    this.state.partnerCodeRaw = partnerRaw;

    this.calcAndShow(partnerAnswers, myAnswers);
  }


  clearPartner() {
    if (this.els.partnerInput) this.els.partnerInput.value = "";
    this.state.partner = null;
    this.state.partnerCodeRaw = null;
    this.updateHomeButtons();
  }


  startQuiz() {
    // пишем ответы текущего прохождения в p1
    this.state.p1 = {};
    this.state.q = [...QUESTIONS].sort(() => Math.random() - 0.5);
    this.state.i = 0;

    showView("v-quiz");
    this.render();
  }

  render() {
    if (this.cleanupSwipe) {
      this.cleanupSwipe();
      this.cleanupSwipe = null;
    }

    if (this.state.i >= this.state.q.length) {
      this.finish();
      return;
    }

    const q = this.state.q[this.state.i];

    renderCounter(this.state.i + 1, this.state.q.length);
    renderHints(q, this.t);

    const { inner, sL, sR } = renderCard(this.els.activeCard, q);

    this.cleanupSwipe = attachSwipe({
      wrap: this.els.activeCard,
      inner,
      sL,
      sR,
      onAnswer: (val) => {
        this.record(q.id, val);
        setTimeout(() => this.next(), 250);
      }
    });
  }

  next() {
    this.state.i += 1;
    this.render();
  }

  record(id, val) {
    this.state.p1[id] = val;
  }

  skip() {
    const q = this.state.q[this.state.i];
    this.record(q.id, undefined);
    animateSkip(this.els.activeCard, () => this.next());
  }

  finish() {
    // мои ответы = только что пройденный тест
    this.state.myAnswers = { ...this.state.p1 };

    // кладём код в "мой код"
    const myCode = encodeAnswers(this.state.myAnswers);
    if (this.els.myInput) this.els.myInput.value = myCode;

    // если партнёр был (вводом или из URL) — оставляем его поле как есть (оно уже заполнено)
    // возвращаемся на главную
    this.showHome();
  }

  async share() {
    // можно шарить даже если state.myAnswers пуст, но поле "мой код" заполнено
    let answers = this.state.myAnswers;

    if (!answers) {
      const raw = this.els.myInput ? this.els.myInput.value.trim() : "";
      if (!raw) {
        alert(this.t("share.passFirst"));
        return;
      }
      try {
        answers = decodeAnswers(raw);
      } catch {
        alert(this.t("input.invalidCode"));
        return;
      }
    }

    const encoded = encodeAnswers(answers);
    const url = buildShareUrl(encoded);

    await shareOrCopy({
      url,
      title: this.t("share.title"),
      text: this.t("share.text"),
      copiedMsg: this.t("share.copied")
    });
  }

  calcAndShow(p1, p2) {
    const data = calcResults(QUESTIONS, p1, p2);
    renderResults(this.els.resBox, this.els.score, data, this.t);
    showView("v-result");
  }

  // если где-то осталась кнопка passDevice — пусть ведёт как "мой код -> в партнёра -> тест"
  passDevice() {
    // просто делаем то же, что сценарий "только мой код"
    this.startNew();
  }
}
