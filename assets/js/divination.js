/**
 * 三档筮法
 * ------------------------------------------------------------
 * 初阶：三枚铜钱 × 6，只取阴阳，不取动爻。
 * 中阶：三钱成卦后，另摇七签（静·初·二·三·四·五·上）定变爻。
 *   每支签 1/7，六十四卦 × 七种变化 = 448 态，等概率。
 * 高阶：大衍筮法。四十九策，分二、挂一、揲四、归奇，三变成一爻。
 *   分堆点按「余数等概率」抽取，以复现《易学启蒙》的
 *   老阳 3/16、少阴 7/16、少阳 5/16、老阴 1/16。
 */

export const MODES = {
  beginner: {
    key: "beginner",
    name: "初阶",
    title: "三钱成卦",
    tag: "易 经 牌",
    count: "六十四",
    desc: "三枚铜钱，六次成卦。只看卦象，不取动爻，以卦辞、彖传、大象解之。",
    rules: ["六爻自下而上", "每爻掷三枚铜钱", "静卦，无变爻"],
    note: "",
  },
  middle: {
    key: "middle",
    name: "中阶",
    title: "摇卦问爻",
    tag: "最 常 用",
    count: "四百四十八",
    desc: "六爻成卦之后，摇签请爻。或六爻安静，或独发一爻，共四百四十八种变化。",
    rules: ["六爻自下而上", "另摇七签定变爻", "无变，或仅一爻变"],
    note: "按：七签定爻为本站设制，取签筒请神、六爻独发之意，非古籍成法。",
  },
  advanced: {
    key: "advanced",
    name: "高阶",
    title: "蓍草十八变",
    tag: "大 衍 筮 法",
    count: "四千零九十六",
    desc: "五十蓍草，其用四十有九。分二、挂一、揲四、归奇，三变成爻，十八变成卦。变爻可至六爻。",
    rules: ["四十九策，三变成一爻", "六爻凡十八变", "变爻零至六"],
    note: "按：法本《系辞上传》，概率依朱熹《易学启蒙》。",
    prayer: {
      title: "祝 辞",
      lines: [
        "假尔泰筮有常，",
        "假尔泰筮有常。",
        "弟子○○○，",
        "自报姓名，续陈所问。",
        "吉凶悔吝，尚明告知。",
      ],
      note: "泰筮，筮神之称，筮音「是」。静心默念三遍，再按下图起卦。",
    },
  },
};

export const POS_CN = ["初", "二", "三", "四", "五", "上"];

/* ---------------- 三钱 ---------------- */

function castCoins(mode, rng) {
  const faces = [];
  const raw = [];

  for (let i = 0; i < 6; i++) {
    const f = [rng.int(2), rng.int(2), rng.int(2)]; // 1 = 字面
    faces.push(f);
    raw.push(6 + f.reduce((a, b) => a + b, 0)); // 6 老阴 · 7 少阳 · 8 少阴 · 9 老阳
  }

  let moving = [];
  let sign = -1;
  if (mode === "middle") {
    sign = rng.int(7); // 0 = 静，1..6 = 自初爻起
    moving = sign > 0 ? [sign - 1] : [];
  }

  // 初阶、中阶只论阴阳，不取老少
  const lines = raw.map((v) => (v === 6 ? 8 : v === 9 ? 7 : v));
  return assemble(mode, lines, moving, { coins: faces, sign, raw });
}

/* ---------------- 大衍 ---------------- */

/** 在 [1, N-1] 中取 L，且 L ≡ r (mod 4)，使四类余数等概率 */
function pickWithResidue(N, r, rng) {
  const hi = N - 1;
  const first = 1 + (((r - 1) % 4) + 4) % 4;
  const count = Math.floor((hi - first) / 4) + 1;
  return first + 4 * rng.int(count);
}

function castYarrow(rng) {
  const lines = [];
  const trace = [];

  for (let i = 0; i < 6; i++) {
    let stalk = 49;
    const steps = [];

    for (let b = 0; b < 3; b++) {
      const before = stalk;
      const r = rng.int(4);
      const L = pickWithResidue(stalk, r, rng);
      const R = stalk - L;

      const left = L % 4 === 0 ? 4 : L % 4;
      const right = (R - 1) % 4 === 0 ? 4 : (R - 1) % 4;
      const take = 1 + left + right; // 一变 5/9，二三变 4/8
      stalk -= take;

      steps.push({ before, take, after: stalk, left, right });
    }

    lines.push(stalk / 4); // 36→9 老阳 · 32→8 少阴 · 28→7 少阳 · 24→6 老阴
    trace.push(steps);
  }

  const moving = [];
  lines.forEach((v, i) => {
    if (v === 6 || v === 9) moving.push(i);
  });
  return assemble("advanced", lines, moving, { yarrow: trace });
}

/* ---------------- 组装 ---------------- */

function assemble(mode, lines, moving, trace) {
  const bits = lines.map((v) => v & 1); // 7/9 → 阳(1)，6/8 → 阴(0)
  const zhiBits = bits.slice();
  for (const i of moving) zhiBits[i] = 1 - zhiBits[i];
  return { mode, lines, bits, moving, zhiBits, trace };
}

export function cast(mode, rng) {
  return mode === "advanced" ? castYarrow(rng) : castCoins(mode, rng);
}
