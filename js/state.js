export function createInitialState() {
  return {
    mode: "p1",          // "p1" | "p2"
    p1: {},              // ответы p1: { [id]: true|false|undefined }
    p2: {},              // ответы p2
    q: [],               // shuffled questions
    i: 0,                // current index
    partner: null,       // ответы партнера из ссылки/кода
    myAnswers: null      // ответы текущего завершившего тест (для share/compare)
  };
}