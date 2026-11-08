import { Rng, stir } from "./rng.js";
import { MODES, POS_CN, cast } from "./divination.js";

const app = document.getElementById("app");

let DATA = [];
const BY_BITS = new Map();
let result = null;
let castToken = 0;
let abortFlag = false;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* 手势熵：指针移动时持续搅拌随机池 */
let lastX = 0, lastY = 0, lastT = 0;
addEventListener("pointermove", (e) => {
  const t = performance.now();
  stir(e.clientX - lastX, e.clientY - lastY, t - lastT);
  lastX = e.clientX; lastY = e.clientY; lastT = t;
}, { passive: true });

/* ================= 启动 ================= */

boot();

async function boot() {
  try {
    const res = await fetch("data/gua.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(res.status);
    DATA = await res.json();
    DATA.forEach((h) => BY_BITS.set(h.bits.join(""), h));
  } catch (err) {
    app.innerHTML = `<p class="loading">卦象数据载入失败<br><small>请用本地服务器打开（见 README）</small></p>`;
    return;
  }
  addEventListener("hashchange", route);
  route();
}

function route() {
  const parts = (location.hash.replace(/^#\/?/, "") || "").split("/").filter(Boolean);
  if (!parts.length) return renderHome();
  const [head, key] = parts;
  if (head === "m" && MODES[key]) return renderMode(key);
  if (head === "cast" && MODES[key]) return startCast(key);
  abortFlag = true;                       // 离开演算页，停止动画
  if (head === "r" && result) return renderResult();
  location.replace("#/");
}

/* ================= 图形 ================= */

function ensoPath(cx, cy, r, startDeg, sweepDeg, wMax, wMin, wob) {
  const N = 150;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const th = ((startDeg + sweepDeg * t) * Math.PI) / 180;
    const w = wMin + (wMax - wMin) * Math.pow(1 - t, 0.72);
    const rr = r + wob * Math.sin(t * Math.PI * 2.6 + 1.2);
    pts.push({ th, outer: rr + w / 2, inner: rr - w / 2 });
  }
  let d = "";
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const x = cx + p.outer * Math.cos(p.th);
    const y = cy + p.outer * Math.sin(p.th);
    d += (i ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2);
  }
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    const x = cx + p.inner * Math.cos(p.th);
    const y = cy + p.inner * Math.sin(p.th);
    d += "L" + x.toFixed(2) + " " + y.toFixed(2);
  }
  return d + "Z";
}

const ENSO_ARGS = [100, 100, 55, 138, 312, 17, 1.8, 1.6];
const ENSO = ensoPath(...ENSO_ARGS);

function ensoPoint(t, cx, cy, r, startDeg, sweepDeg, wMax, wMin, wob) {
  const th = ((startDeg + sweepDeg * t) * Math.PI) / 180;
  const w = wMin + (wMax - wMin) * Math.pow(1 - t, 0.72);
  const rr = r + wob * Math.sin(t * Math.PI * 2.6 + 1.2);
  return { x: cx + rr * Math.cos(th), y: cy + rr * Math.sin(th), r: w / 2 };
}

const ENSO_CAPS = [0, 1].map((t) => ensoPoint(t, ...ENSO_ARGS))
  .map((c) => `<circle cx="${c.x.toFixed(2)}" cy="${c.y.toFixed(2)}" r="${c.r.toFixed(2)}" fill="#1e1a15"/>`)
  .join("");

function orbSvg() {
  return `<svg viewBox="0 0 200 200" aria-hidden="true">
    <circle cx="100" cy="100" r="95" fill="url(#ink-wash)"/>
    <g filter="url(#enso-edge)" opacity=".93">
      <path d="${ENSO}" fill="#1e1a15"/>${ENSO_CAPS}
    </g>
    <g fill="#211d17" opacity=".42" filter="url(#ink-edge-soft)">
      <circle cx="164" cy="60" r="2.3"/><circle cx="172" cy="74" r="1.1"/><circle cx="38" cy="140" r="1.7"/>
    </g>
    <g class="spin-rev" opacity=".45">
      <circle cx="100" cy="100" r="88" fill="none" stroke="#211e19" stroke-width=".6"
              stroke-opacity=".22" stroke-dasharray="1 8"/>
    </g>
  </svg>`;
}

function bars(yang) {
  return yang ? "<i></i>" : "<i></i><i></i>";
}

/* ================= 首页 ================= */

function renderHome() {
  scrollTo(0, 0);
  app.innerHTML = `
  <header class="brand fade-up">
    <h1>观象</h1>
    <p class="sub">周 易 占 卜</p>
    <p class="quote">寂然不动，感而遂通天下之故。<span class="from">——《系辞上传》</span></p>
  </header>

  <section class="notice fade-up" style="--i:1">
    <h2>占 卜 须 知</h2>
    <ul>
      <li>一事不二问。同一件事，不可用不同问法反复占问，此谓<em>渎</em>。</li>
      <li>重要事情请先斋戒沐浴（或可于沐浴后）；平时问卜，如厕之后请先洗手，并稍候再问。</li>
      <li>诚心冥想你的问题，心念弟子某某某，何事问卦……</li>
      <li>若问某事吉凶，可如此提问：所问何事，弟子欲做何选择／决定，想问吉凶……</li>
      <li>每天卜卦次数不要超过三次。</li>
      <li>卜以决疑，不疑何卜。所得仅供参考，抉择仍在己心。</li>
    </ul>
  </section>

  <section class="modes">
    ${Object.values(MODES).map((m, i) => `
      <a class="mode-card fade-up" style="--i:${i + 2}" href="#/m/${m.key}">
        <span class="orb">${orbSvg()}</span>
        <span>
          <span class="kicker">${m.tag}</span>
          <h3>${m.name} · ${m.title}</h3>
          <p>${m.desc}</p>
        </span>
        <span class="count">${m.count}</span>
      </a>`).join("")}
  </section>

  <a class="gua-entry fade-up" style="--i:5" href="/gua/">
    <span class="kicker">六十四卦</span>
    <h3>卦辞 · 爻辞 · 白话</h3>
    <p>逐卦查阅六十四卦的卦辞、彖传、大象与三百八十四爻。</p>
  </a>

  <footer class="foot fade-up" style="--i:6">
    <p>易 者 象 也 · 象 也 者 像 也</p>
  </footer>`;
}

/* ================= 模式页 ================= */

function renderMode(key) {
  const m = MODES[key];
  scrollTo(0, 0);
  app.innerHTML = `
  <a class="back" href="#/">← 返回</a>

  <header class="mode-head fade-up">
    <p class="eyebrow">${m.name}</p>
    <h2>${m.title}</h2>
    <p class="lede">${m.desc}</p>
    <div class="rules">${m.rules.map((r) => `<span>${r}</span>`).join("")}</div>
    ${m.note ? `<p class="mode-note">${m.note}</p>` : ""}
  </header>

  ${m.prayer ? `<section class="prayer fade-up" style="--i:1">
    <h3>${m.prayer.title}</h3>
    <div class="verse">${m.prayer.lines.map((l) => `<p>${l}</p>`).join("")}</div>
    <p class="note">${m.prayer.note}</p>
    <span class="seal" aria-hidden="true">诚</span>
  </section>` : ""}

  <div class="ritual fade-up" style="--i:2">
    <button class="ritual-target" id="cast-btn" aria-label="起卦">${orbSvg()}</button>
    <p class="hint">静心默想所问之事，<strong>按下图起卦</strong></p>
  </div>`;

  document.getElementById("cast-btn").addEventListener("click", () => {
    location.hash = "#/cast/" + key;
  });
}

/* ================= 演算 ================= */

async function startCast(key) {
  const token = ++castToken;
  abortFlag = false;

  app.innerHTML = `
  <div class="cast">
    <p class="cast-label" id="label">凝 神</p>
    <div class="stage" id="stage"></div>
    <div class="builder" id="builder"></div>
    <div class="cast-foot"><button class="skip" id="skip">跳过演算</button></div>
  </div>`;

  const builder = document.getElementById("builder");
  for (let i = 0; i < 6; i++) {
    const slot = document.createElement("div");
    slot.className = "hex-line";
    builder.appendChild(slot);
  }

  document.getElementById("skip").addEventListener("click", () => {
    abortFlag = true;
    location.replace("#/r");
  });

  const rng = new Rng(key);
  result = cast(key, rng);



  try {
    await playCast(key, result, token);
  } catch (err) {
    if (err.name !== "AbortError") throw err;
  }

  if (token !== castToken || abortFlag) return;
  location.replace("#/r");
}

async function playCast(mode, res, token) {
  const ctx = {
    stage: document.getElementById("stage"),
    builder: document.getElementById("builder"),
    label: document.getElementById("label"),
    alive: () => token === castToken && !abortFlag,
  };
  if (mode === "advanced") await playYarrow(res, ctx);
  else await playCoins(res, ctx, mode);
}

function check(ctx) {
  if (!ctx.alive()) throw Object.assign(new Error("stopped"), { name: "AbortError" });
}

function addLine(builder, i, value, moving) {
  const yang = value % 2 === 1;
  const el = builder.children[i];
  el.className = "hex-line" + (moving ? " moving" : "");
  el.innerHTML = `<span class="pos">${POS_CN[i]}</span>
    <span class="bars ${yang ? "yang" : "yin"}">${bars(yang)}</span>
    <span class="dot"></span>`;
  requestAnimationFrame(() => el.classList.add("in"));
}

async function playCoins(res, ctx, mode) {
  const { stage, builder, label } = ctx;

  const coins = [0, 1, 2].map(() => {
    const c = document.createElement("div");
    c.className = "coin tails";
    c.innerHTML = `<span class="glyphs"><span>元</span><span>亨</span><span>利</span><span>贞</span></span><span class="hole"></span>`;
    stage.appendChild(c);
    return c;
  });

  for (let i = 0; i < 6; i++) {
    label.textContent = `第 ${POS_CN[i]} 爻`;
    coins.forEach((c) => c.classList.add("flipping"));
    await sleep(520); check(ctx);

    const faces = res.trace.coins[i];
    coins.forEach((c, j) => {
      c.classList.remove("flipping");
      c.classList.toggle("tails", faces[j] === 0);
    });
    await sleep(170); check(ctx);

    addLine(builder, i, res.lines[i], false);
    await sleep(120); check(ctx);
  }

  if (mode === "middle") {
    label.textContent = "请 爻";
    await playTube(res.trace.sign, ctx);
    check(ctx);
    if (res.trace.sign > 0) {
      const el = builder.children[res.trace.sign - 1];
      if (el) el.classList.add("moving");
    }
    await sleep(520);
  }
}

async function playTube(sign, ctx) {
  const { stage, label } = ctx;
  const labels = ["静", "初", "二", "三", "四", "五", "上"];

  stage.innerHTML = `<div class="tube-wrap"><div class="tube" id="tube">
    ${labels.map((s, i) => `<div class="stick" data-i="${i}"><span>${s}</span></div>`).join("")}
  </div></div>`;

  await sleep(240); check(ctx);
  const tube = document.getElementById("tube");
  tube.classList.add("shaking");
  await sleep(1150); check(ctx);
  tube.classList.remove("shaking");
  tube.querySelector(`.stick[data-i="${sign}"]`).classList.add("picked");
  label.textContent = sign === 0 ? "签 曰 ： 静" : `签 曰 ： ${labels[sign]} 爻`;
  await sleep(850);
}

async function playYarrow(res, ctx) {
  const { stage, builder, label } = ctx;

  stage.innerHTML = `<div class="yarrow">
    <div class="stalks" id="stalks">${"<span class='stalk'></span>".repeat(49)}</div>
    <div class="yarrow-read" id="yread">四十九策</div>
  </div>`;

  const stalks = [...document.querySelectorAll("#stalks .stalk")];
  const yread = document.getElementById("yread");

  for (let i = 0; i < 6; i++) {
    label.textContent = `第 ${POS_CN[i]} 爻`;
    stalks.forEach((s) => s.classList.remove("gone"));
    yread.textContent = "四十九策";
    await sleep(200); check(ctx);

    for (let b = 0; b < 3; b++) {
      const st = res.trace.yarrow[i][b];
      label.textContent = `第 ${POS_CN[i]} 爻 · 第 ${"一二三"[b]} 变`;
      const left = stalks.filter((s) => !s.classList.contains("gone"));
      left.slice(-st.take).forEach((s) => s.classList.add("gone"));
      yread.innerHTML = `挂扐 <b>${st.take}</b> 策 · 余 <b>${st.after}</b> 策`;
      await sleep(260); check(ctx);
    }

    addLine(builder, i, res.lines[i], res.moving.includes(i));
    await sleep(200); check(ctx);
  }
}

/* ================= 结果 ================= */

function hexFigure(bits, moving, hex, tag) {
  const rows = [];
  for (let i = 5; i >= 0; i--) {
    const yang = bits[i] === 1;
    rows.push(`<div class="hex-line${moving.includes(i) ? " moving" : ""}">
      <span class="bars ${yang ? "yang" : "yin"}">${bars(yang)}</span>
    </div>`);
  }
  return `<figure class="hex-fig">
    <div class="lines">${rows.join("")}</div>
    <figcaption>
      <span class="hex-name">${esc(hex.name)}</span>
      <span class="hex-full">${esc(hex.full)}</span>
      <span class="tag">${tag}</span>
    </figcaption>
  </figure>`;
}

function readingHtml(hex, label, i) {
  return `<section class="reading fade-up" style="--i:${i}">
    <h3><span>${label}</span><span class="n">${esc(hex.full)}</span></h3>

    <div class="block">
      <h4>卦 辞</h4>
      <p class="classic">${esc(hex.name)}：${esc(hex.gua)}</p>
      <p class="plain">${esc(hex.guaPlain)}</p>
    </div>

    <div class="block">
      <h4>彖 曰</h4>
      <p class="classic">${esc(hex.tuan)}</p>
      <p class="plain"><span class="zhuan">《彖传》说：</span>${esc(hex.tuanPlain)}</p>
    </div>

    <div class="block">
      <h4>象 曰</h4>
      <p class="classic">${esc(hex.xiang)}</p>
      <p class="plain"><span class="zhuan">《象传》说：</span>${esc(hex.xiangPlain)}</p>
    </div>
  </section>`;
}

function yaoBlock(i, ben, zhi, isMain) {
  const b = ben.lines[i];
  const z = zhi.lines[i];
  const badge = isMain ? '<span class="yao-main">主</span>' : "";
  return `<article class="yao-block fade-up">
    <h4>${esc(b.title)}${badge}</h4>
    <div class="yao-sides">
      <div class="yao-side">
        <span class="tag">本卦 · ${esc(ben.name)}</span>
        <p class="classic">${esc(b.text)}</p>
        <p class="mini"><span class="lbl">象曰</span>${esc(b.xiang)}</p>
        <p class="mini plain">${esc(b.plain)}</p>
        <p class="mini plain"><span class="lbl">《象传》说：</span>${esc(b.xiangPlain)}</p>
      </div>
      <div class="yao-side">
        <span class="tag">变卦 · ${esc(zhi.name)}</span>
        <p class="classic">${esc(z.text)}</p>
        <p class="mini"><span class="lbl">象曰</span>${esc(z.xiang)}</p>
        <p class="mini plain">${esc(z.plain)}</p>
        <p class="mini plain"><span class="lbl">《象传》说：</span>${esc(z.xiangPlain)}</p>
      </div>
    </div>
  </article>`;
}

function yaoStillBlock(i, ben, zhi, isMain) {
  const b = ben.lines[i];
  const z = zhi.lines[i];
  const badge = isMain ? '<span class="yao-main">主</span>' : "";
  const side = (hex, line, label, qu) => `
      <div class="yao-side">
        <span class="tag">${label} · ${esc(hex.name)}${qu ? ' <em class="qu">取用</em>' : ""}</span>
        <p class="classic">${esc(line.text)}</p>
        <p class="mini"><span class="lbl">象曰</span>${esc(line.xiang)}</p>
        <p class="mini plain">${esc(line.plain)}</p>
        <p class="mini plain"><span class="lbl">《象传》说：</span>${esc(line.xiangPlain)}</p>
      </div>`;
  return `<article class="yao-block fade-up">
    <h4>${esc(b.title)}${badge}</h4>
    <div class="yao-sides">
      ${side(ben, b, "本卦", false)}
      ${side(zhi, z, "变卦", true)}
    </div>
  </article>`;
}

function yaoExtra(ben) {
  const e = ben.extra;
  return `<article class="yao-block fade-up">
    <h4>${esc(e.title)}</h4>
    <div class="yao-sides single">
      <div class="yao-side">
        <span class="tag">本卦 · ${esc(ben.name)}</span>
        <p class="classic">${esc(e.text)}</p>
        <p class="mini"><span class="lbl">象曰</span>${esc(e.xiang)}</p>
        <p class="mini plain">${esc(e.plain)}</p>
        <p class="mini plain"><span class="lbl">《象传》说：</span>${esc(e.xiangPlain)}</p>
      </div>
    </div>
  </article>`;
}

function yaoSection(r, ben, zhi) {
  const n = r.moving.length;
  if (n === 0) return "";

  const movingList = r.moving.slice().sort((a, b) => a - b);

  if (n === 3) {
    return `<section class="moving-head fade-up" style="--i:5">
      <h3>变 爻</h3>
      <p>三爻变，变与不变之力相当，故不列爻辞；以本卦、变卦卦辞互参。</p>
    </section>`;
  }

  if (n === 6) {
    return `<section class="moving-head fade-up" style="--i:5">
      <h3>变 爻</h3>
      <p>六爻皆变，故不列爻辞。乾用九、坤用六；余卦以变卦卦辞占。</p>
    </section>
    ${ben.extra ? yaoExtra(ben) : ""}`;
  }

  if (n === 4 || n === 5) {
    const still = [0, 1, 2, 3, 4, 5].filter((i) => !r.moving.includes(i));
    const main = still[0]; // 下爻为主
    return `<section class="moving-head fade-up" style="--i:5">
      <h3>不变之爻</h3>
      <p>${n === 4
        ? "四爻变，变为主；取变卦两不变之爻，下爻为主。本卦、变卦并列，以便对照。"
        : "五爻变，变为主；取变卦不变之一爻。本卦、变卦并列，以便对照。"}</p>
    </section>
    ${still.map((i) => yaoStillBlock(i, ben, zhi, i === main)).join("")}`;
  }

  const main = n === 2 ? movingList[movingList.length - 1] : -1;
  return `<section class="moving-head fade-up" style="--i:5">
    <h3>变 爻</h3>
    <p>${n === 1 ? "独发一爻，以该爻爻辞为主。" : "两爻变，以本卦两变爻爻辞占，上爻为主。"}</p>
  </section>
  ${movingList.map((i) => yaoBlock(i, ben, zhi, i === main)).join("")}`;
}

function verdictText(r, ben, zhi) {
  const n = r.moving.length;
  const hl = (s) => `<span class="hl">${s}</span>`;
  if (n === 0) return `得${hl(ben.full)}，六爻安静，以本卦卦辞占。`;
  const head = `遇${hl(ben.name)}之${hl(zhi.name)}，`;
  if (n === 1) return head + `以本卦${hl(ben.lines[r.moving[0]].title)}爻辞占。`;
  if (n === 2) return head + `以本卦两变爻爻辞占，上爻为主。`;
  if (n === 3) return head + `三爻变，变与不变相当，以两卦卦辞互参。`;
  if (n === 4) return head + `四爻变，变为主，取变卦两不变爻，下爻为主。`;
  if (n === 5) return head + `五爻变，取变卦不变之一爻。`;
  return head + (ben.extra
    ? `六爻皆变，取${ben.extra.title}占，并参变卦卦辞。`
    : `六爻皆变，以变卦卦辞占。`);
}

function renderResult() {
  const r = result;
  const ben = BY_BITS.get(r.bits.join(""));
  if (!ben) { location.replace("#/"); return; }
  const zhi = r.moving.length ? BY_BITS.get(r.zhiBits.join("")) : null;

  scrollTo(0, 0);

  const html = `
  <section class="result-head">
    <p class="eyebrow fade-up">卦 成</p>
    <div class="hex-pair fade-up" style="--i:1">
      ${hexFigure(r.bits, r.moving, ben, "本卦")}
      ${zhi ? `<div class="zhi">之</div>${hexFigure(r.zhiBits, r.moving, zhi, "变卦")}` : ""}
    </div>
    <p class="verdict fade-up" style="--i:2">${verdictText(r, ben, zhi)}</p>
  </section>

  ${readingHtml(ben, "本 卦", 3)}
  ${zhi ? readingHtml(zhi, "变 卦", 4) : ""}

  ${yaoSection(r, ben, zhi)}

  <div class="actions fade-up" style="--i:6">
    <a class="btn" href="#/m/${r.mode}">再占一卦</a>
    <a class="btn ghost" href="#/">返回</a>
  </div>

  <footer class="foot">
    <p>静 心 · 凝 神 · 问 易</p>
  </footer>`;

  app.innerHTML = html;
}
