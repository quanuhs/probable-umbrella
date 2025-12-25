
export function calcResults(questions, p1, p2) {
  let matches = 0;
  const items = [];

  for (const q of questions) {
    const v1 = p1[q.id];
    const v2 = p2[q.id];
    if (v1 === undefined || v2 === undefined) continue;

    if (q.logic === "match") {
      if (v1 === v2) {
        matches++;
        const val = v1 ? q.R : q.L;
        items.push({
          title: q.title,
          kind: "match",
          badges: [{ textKey: "result.bothPrefix", value: val, col: "#4CAF50" }]
        });
      }
    } else if (q.logic === "role") {
      if (v1 !== v2) {
        matches++;
        items.push({
          title: q.title,
          kind: "role",
          badges: [
            { textKey: "result.partner1Prefix", value: (v1 ? q.R : q.L), col: "#3F51B5" },
            { textKey: "result.partner2Prefix", value: (v2 ? q.R : q.L), col: "#6C63FF" }
          ]
        });
      }
    }
  }

  return { matches, items };
}
