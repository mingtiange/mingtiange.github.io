#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成六十四卦静态页、索引页与 sitemap。

用法：python3 scripts/build_pages.py
输出：gua/01.html … gua/64.html、gua/index.html、sitemap.xml
"""

import json
import html
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "gua.json"
BASE = "https://mingtiange.github.io"
SITE = "观象 · 周易占卜"
TODAY = "2026-11-08"

CN = "零一二三四五六七八九"


def cn_num(n: int) -> str:
    if n < 10:
        return CN[n]
    if n == 10:
        return "十"
    if n < 20:
        return "十" + CN[n % 10]
    tens, ones = divmod(n, 10)
    return CN[tens] + "十" + (CN[ones] if ones else "")


def esc(s: str) -> str:
    return html.escape(s, quote=False)


def attr(s: str) -> str:
    return html.escape(s, quote=True)


def hex_html(bits):
    rows = []
    for i in range(5, -1, -1):
        yang = bits[i] == 1
        cls = "yang" if yang else "yin"
        inner = "<i></i>" if yang else "<i></i><i></i>"
        rows.append(f'<div class="row {cls}">{inner}</div>')
    return "".join(rows)


def yao_html(ln):
    return f'''<div class="yao-item">
        <h3>{esc(ln["title"])}</h3>
        <p class="classic">{esc(ln["text"])}</p>
        <p class="mini"><span class="lbl">象曰</span>{esc(ln["xiang"])}</p>
        <p class="plain">{esc(ln["plain"])}</p>
        <p class="plain">《象传》说：{esc(ln["xiangPlain"])}</p>
      </div>'''


PAGE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>__TITLE__</title>
<meta name="description" content="__DESC__">
<meta name="keywords" content="__KEYWORDS__">
<meta name="robots" content="index,follow">
<link rel="canonical" href="__CANONICAL__">
<meta name="theme-color" content="#f4efe4">
<meta property="og:type" content="article">
<meta property="og:site_name" content="观象 · 周易占卜">
<meta property="og:locale" content="zh_CN">
<meta property="og:title" content="__TITLE__">
<meta property="og:description" content="__DESC__">
<meta property="og:url" content="__CANONICAL__">
<meta property="og:image" content="__BASE__/assets/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="__TITLE__">
<meta name="twitter:description" content="__DESC__">
<meta name="twitter:image" content="__BASE__/assets/og.jpg">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Ccircle cx='100' cy='100' r='92' fill='%23f4efe4'/%3E%3Cpath d='M100 38a62 62 0 1 1-44 106' fill='none' stroke='%231e1a15' stroke-width='18' stroke-linecap='round'/%3E%3C/svg%3E">
<link rel="manifest" href="/manifest.json">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="观象">
<link rel="apple-touch-icon" href="/assets/icons/icon-192.png">
<link rel="stylesheet" href="/assets/css/style.css">
<link rel="stylesheet" href="/assets/css/page.css">
<script type="application/ld+json">__LDJSON__</script>
</head>
<body>
<div class="grain" aria-hidden="true"></div>
<div class="wash" aria-hidden="true"></div>
<main class="app page">
  <nav class="crumb" aria-label="面包屑">
    <a href="/">观象</a><span>/</span><a href="/gua/">六十四卦</a><span>/</span><span aria-current="page">__NAME__</span>
  </nav>

  <header class="gua-head">
    <p class="eyebrow">第 __CN__ 卦</p>
    <h1>__NAME__卦<span class="gua-full">__FULL__</span></h1>
    <div class="gua-figure" role="img" aria-label="__NAME__卦卦画，上__UPPER__下__LOWER__">__HEX__</div>
    <p class="gua-meta">上 __UPPER__ · 下 __LOWER__</p>
  </header>

  <article class="gua-body">
    <section>
      <h2>卦 辞</h2>
      <p class="classic">__NAME__：__GUA__</p>
      <p class="plain">__GUAPLAIN__</p>
    </section>
    <section>
      <h2>彖 传</h2>
      <p class="classic">__TUAN__</p>
      <p class="plain">《彖传》说：__TUANPLAIN__</p>
    </section>
    <section>
      <h2>大 象</h2>
      <p class="classic">__XIANG__</p>
      <p class="plain">《象传》说：__XIANGPLAIN__</p>
    </section>
    <section>
      <h2>六 爻<span class="n">自初至上</span></h2>
      __YAOS__
    </section>
  </article>

  <nav class="pager" aria-label="翻页">
    <span>__PREV__</span>
    <span>__NEXT__</span>
  </nav>

  <div class="actions">
    <a class="btn" href="/#/m/advanced">以蓍草起卦</a>
    <a class="btn ghost" href="/gua/">六十四卦</a>
  </div>

  <footer class="foot">
    <p>静 心 · 凝 神 · 问 易</p>
  </footer>
</main>
<script>if("serviceWorker"in navigator){addEventListener("load",function(){navigator.serviceWorker.register("/sw.js").catch(function(){})})}</script>
</body>
</html>
"""

INDEX = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>__TITLE__</title>
<meta name="description" content="__DESC__">
<meta name="keywords" content="六十四卦,周易,易经,卦辞,爻辞,彖传,象传,白话">
<meta name="robots" content="index,follow">
<link rel="canonical" href="__BASE__/gua/">
<meta name="theme-color" content="#f4efe4">
<meta property="og:type" content="website">
<meta property="og:site_name" content="观象 · 周易占卜">
<meta property="og:locale" content="zh_CN">
<meta property="og:title" content="__TITLE__">
<meta property="og:description" content="__DESC__">
<meta property="og:url" content="__BASE__/gua/">
<meta property="og:image" content="__BASE__/assets/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="__TITLE__">
<meta name="twitter:description" content="__DESC__">
<meta name="twitter:image" content="__BASE__/assets/og.jpg">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Ccircle cx='100' cy='100' r='92' fill='%23f4efe4'/%3E%3Cpath d='M100 38a62 62 0 1 1-44 106' fill='none' stroke='%231e1a15' stroke-width='18' stroke-linecap='round'/%3E%3C/svg%3E">
<link rel="manifest" href="/manifest.json">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="观象">
<link rel="apple-touch-icon" href="/assets/icons/icon-192.png">
<link rel="stylesheet" href="/assets/css/style.css">
<link rel="stylesheet" href="/assets/css/page.css">
<script type="application/ld+json">__LDJSON__</script>
</head>
<body>
<div class="grain" aria-hidden="true"></div>
<div class="wash" aria-hidden="true"></div>
<main class="app page">
  <nav class="crumb" aria-label="面包屑">
    <a href="/">观象</a><span>/</span><span aria-current="page">六十四卦</span>
  </nav>

  <header class="gua-head">
    <p class="eyebrow">周易</p>
    <h1>六十四卦<span class="gua-full">卦辞 · 爻辞 · 白话</span></h1>
  </header>

  <p class="intro">六十四卦由八卦两两相重而成，每卦六爻，共三百八十四爻。下列各卦均收录<strong>卦辞、彖传、大象</strong>，以及自初爻至上爻的<strong>爻辞、小象与白话译文</strong>，可逐卦查阅。</p>

  <div class="gua-grid">
    __GRID__
  </div>

  <div class="actions">
    <a class="btn" href="/#/">回到占卜</a>
    <a class="btn ghost" href="/#/m/advanced">以蓍草起卦</a>
  </div>

  <footer class="foot">
    <p>静 心 · 凝 神 · 问 易</p>
  </footer>
</main>
<script>if("serviceWorker"in navigator){addEventListener("load",function(){navigator.serviceWorker.register("/sw.js").catch(function(){})})}</script>
</body>
</html>
"""


def main():
    data = json.loads(DATA.read_text(encoding="utf-8"))
    out = ROOT / "gua"
    out.mkdir(exist_ok=True)
    urls = []

    for i, h in enumerate(data):
        num = i + 1
        slug = f"{num:02d}.html"
        canonical = f"{BASE}/gua/{slug}"
        title = f'{h["name"]}卦（{h["full"]}）：卦辞、爻辞、彖传、大象与白话详解｜{SITE}'
        desc = (f'{h["name"]}卦（{h["full"]}），六十四卦第{cn_num(num)}卦。'
                f'列{h["name"]}卦卦辞、彖传、大象，以及自{h["lines"][0]["title"]}至'
                f'{h["lines"][-1]["title"]}的爻辞、小象与白话译文。')
        keywords = f'{h["name"]}卦,{h["full"]},{h["name"]}卦卦辞,{h["name"]}卦爻辞,六十四卦,周易,易经'

        yaos = "\n      ".join(yao_html(ln) for ln in h["lines"])
        if h.get("extra"):
            e = h["extra"]
            yaos += f'''
      <div class="yao-item">
        <h3>{esc(e["title"])}</h3>
        <p class="classic">{esc(e["text"])}</p>
        <p class="mini"><span class="lbl">象曰</span>{esc(e["xiang"])}</p>
        <p class="plain">{esc(e["plain"])}</p>
        <p class="plain">《象传》说：{esc(e["xiangPlain"])}</p>
      </div>'''

        prev_h = data[(i - 1) % 64]
        next_h = data[(i + 1) % 64]
        prev_slug = f"{(i - 1) % 64 + 1:02d}.html"
        next_slug = f"{(i + 1) % 64 + 1:02d}.html"
        prev = f'<a href="{prev_slug}"><span class="dir">上一卦</span>{esc(prev_h["name"])} · {esc(prev_h["full"])}</a>'
        nxt = f'<a href="{next_slug}"><span class="dir">下一卦</span>{esc(next_h["name"])} · {esc(next_h["full"])}</a>'

        ld = {
            "@context": "https://schema.org",
            "@graph": [
                {
                    "@type": "Article",
                    "@id": canonical + "#article",
                    "headline": f'{h["name"]}卦（{h["full"]}）',
                    "description": desc,
                    "inLanguage": "zh-CN",
                    "isPartOf": {"@id": BASE + "/#website"},
                    "mainEntityOfPage": {"@id": canonical},
                    "publisher": {"@type": "Organization", "name": SITE},
                },
                {
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        {"@type": "ListItem", "position": 1, "name": "观象", "item": BASE + "/"},
                        {"@type": "ListItem", "position": 2, "name": "六十四卦", "item": BASE + "/gua/"},
                        {"@type": "ListItem", "position": 3, "name": h["name"] + "卦", "item": canonical},
                    ],
                },
            ],
        }

        page = (PAGE
                .replace("__TITLE__", attr(title))
                .replace("__DESC__", attr(desc))
                .replace("__KEYWORDS__", attr(keywords))
                .replace("__CANONICAL__", canonical)
                .replace("__BASE__", BASE)
                .replace("__LDJSON__", json.dumps(ld, ensure_ascii=False))
                .replace("__NAME__", esc(h["name"]))
                .replace("__FULL__", esc(h["full"]))
                .replace("__CN__", cn_num(num))
                .replace("__UPPER__", esc(h["upper"]))
                .replace("__LOWER__", esc(h["lower"]))
                .replace("__HEX__", hex_html(h["bits"]))
                .replace("__GUA__", esc(h["gua"]))
                .replace("__GUAPLAIN__", esc(h["guaPlain"]))
                .replace("__TUAN__", esc(h["tuan"]))
                .replace("__TUANPLAIN__", esc(h["tuanPlain"]))
                .replace("__XIANG__", esc(h["xiang"]))
                .replace("__XIANGPLAIN__", esc(h["xiangPlain"]))
                .replace("__YAOS__", yaos)
                .replace("__PREV__", prev)
                .replace("__NEXT__", nxt))
        (out / slug).write_text(page, encoding="utf-8")
        urls.append(canonical)

    # 索引页
    grid = "\n    ".join(
        f'<a href="{i + 1:02d}.html"><span class="num">{i + 1:02d}</span>'
        f'<span class="nm">{esc(h["name"])}</span><span class="fl">{esc(h["full"])}</span></a>'
        for i, h in enumerate(data)
    )
    idx_title = "六十四卦卦辞爻辞白话全解｜观象 · 周易占卜"
    idx_desc = ("周易六十四卦全览：乾、坤、屯、蒙、需、讼……自乾至未济，逐卦收录卦辞、彖传、"
                "大象、六爻爻辞、小象与白话译文。")
    idx_ld = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "@id": BASE + "/gua/#page",
                "name": "六十四卦",
                "description": idx_desc,
                "inLanguage": "zh-CN",
                "isPartOf": {"@id": BASE + "/#website"},
            },
            {
                "@type": "ItemList",
                "itemListElement": [
                    {"@type": "ListItem", "position": i + 1, "url": f"{BASE}/gua/{i + 1:02d}.html",
                     "name": h["name"] + "卦"}
                    for i, h in enumerate(data)
                ],
            },
        ],
    }
    index = (INDEX
             .replace("__TITLE__", attr(idx_title))
             .replace("__DESC__", attr(idx_desc))
             .replace("__BASE__", BASE)
             .replace("__LDJSON__", json.dumps(idx_ld, ensure_ascii=False))
             .replace("__GRID__", grid))
    (out / "index.html").write_text(index, encoding="utf-8")

    # sitemap
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, prio in [(BASE + "/", "1.0"), (BASE + "/gua/", "0.9")] + [(u, "0.8") for u in urls]:
        lines.append(f"  <url><loc>{loc}</loc><lastmod>{TODAY}</lastmod><priority>{prio}</priority></url>")
    lines.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"生成 {len(urls)} 个卦页 + 1 个索引页 + sitemap.xml")


if __name__ == "__main__":
    main()
