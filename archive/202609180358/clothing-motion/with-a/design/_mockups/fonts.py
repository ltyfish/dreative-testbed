# -*- coding: utf-8 -*-
"""Download the three families as self-hosted woff2 + emit @font-face CSS."""
import os, re, urllib.request

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"}
OUT = "public/fonts"
os.makedirs(OUT, exist_ok=True)

SPECS = [
    # (google css2 query, local family name, [(weight, style, filename)])
    ("family=Bodoni+Moda:ital,opsz,wght@0,96,700;0,96,900;1,96,400&display=swap",
     "Bodoni Moda", None),
    ("family=IBM+Plex+Mono:wght@400;500&display=swap", "IBM Plex Mono", None),
    ("family=Archivo:wght@400;500;600&display=swap", "Archivo", None),
]

css_out = []
for query, family, _ in SPECS:
    url = "https://fonts.googleapis.com/css2?" + query
    css = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read().decode()
    # keep only latin blocks
    blocks = re.findall(r"/\*\s*([a-z0-9\-]+)\s*\*/\s*@font-face\s*\{(.*?)\}", css, re.S)
    n = 0
    for subset, body in blocks:
        if subset != "latin":
            continue
        weight = re.search(r"font-weight:\s*([^;]+);", body).group(1).strip()
        style = re.search(r"font-style:\s*([^;]+);", body).group(1).strip()
        src = re.search(r"url\((https://[^)]+\.woff2)\)", body).group(1)
        slug = family.lower().replace(" ", "-")
        fname = f"{slug}-{weight}-{style}.woff2"
        data = urllib.request.urlopen(urllib.request.Request(src, headers=UA), timeout=40).read()
        open(os.path.join(OUT, fname), "wb").write(data)
        unicode_range = re.search(r"unicode-range:\s*([^;]+);", body).group(1).strip()
        css_out.append(
            "@font-face{font-family:'%s';font-style:%s;font-weight:%s;font-display:swap;"
            "src:url('/fonts/%s') format('woff2');unicode-range:%s}"
            % (family, style, weight, fname, unicode_range))
        n += 1
        print(fname, len(data) // 1024, "KB")
    print(family, "->", n, "faces")

open("src/fonts.css", "w", encoding="utf-8").write("\n".join(css_out) + "\n")
print("wrote src/fonts.css")
