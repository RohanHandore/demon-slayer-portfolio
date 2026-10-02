#!/usr/bin/env python3
"""Bring the blog and interview-guide pages onto the rebuilt design system.

- renames "Behavioral interview/" to "behavioral-interview/"
- swaps the Google Fonts + Font Awesome + EmailJS CDN tags for the self-hosted
  local equivalents
- removes the per-page dark theme blocks (blog) or replaces them with a block
  built on the shared design tokens (behavioural guides)
- repairs canonical URLs and cross-links that pointed at the old folder name
- guarantees lang, viewport and favicon on every page
"""
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

BEHAVIOURAL_CSS = """
<style>
/* Layout for the behavioural interview guides. Type, colour and the icon set
   come from the root stylesheet; this block only describes this section. */
.top-nav{position:sticky;top:0;z-index:100;display:flex;justify-content:space-between;align-items:center;gap:1rem;
  padding:0.85rem max(var(--gutter),calc((100% - var(--wrap))/2 + var(--gutter)));
  background:var(--paper);border-bottom:1px solid var(--line);
  font-family:var(--mono);font-size:0.72rem;letter-spacing:0.08em;text-transform:uppercase}
.top-nav a{color:var(--muted);display:inline-flex;align-items:center;gap:0.45rem}
.top-nav a:hover{color:var(--accent)}
.top-nav .icon,.top-nav i{inline-size:0.9em;block-size:0.9em}

.container{padding-block:clamp(2rem,4vw,3rem) clamp(3rem,6vw,4.5rem)}
header{padding-bottom:1.5rem;margin-bottom:2rem;border-bottom:1px solid var(--line)}
header h1{font-size:var(--step-3);margin-bottom:0.5rem;max-width:32ch}
.subtitle{color:var(--ink-2);max-width:62ch}
.meta{display:flex;flex-wrap:wrap;gap:0.5rem 1.25rem;font-family:var(--mono);font-size:0.72rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted)}
.meta span{display:inline-flex;align-items:center;gap:0.4rem}

.content{max-width:46rem}
.content h2{font-size:var(--step-2);margin-top:2.6rem}
.content h2:first-of-type{margin-top:0}
.content h3{font-size:1.15rem;margin-top:2rem}
.content p{margin-bottom:1.1rem}
.content li{color:var(--ink-2)}
.content li::marker{color:var(--accent)}
.content pre{background:var(--paper-2);border:1px solid var(--line);border-radius:var(--radius);padding:1.1rem 1.2rem;overflow-x:auto}
.content pre code{background:none;border:0;padding:0}
.intro-text{font-size:var(--step-1);color:var(--ink-2);margin-bottom:1.5rem}
.question,.question-box{border:1px solid var(--line);border-left:3px solid var(--accent);
  border-radius:0 var(--radius) var(--radius) 0;background:var(--paper-2);padding:1.15rem 1.25rem;margin:1.6rem 0}
.question-box p{color:var(--ink-2)}
.question p,.question-box p:last-child{margin-bottom:0}
.key-points,.star-section,.star-framework{border:1px solid var(--line);border-radius:var(--radius);
  padding:1.1rem 1.25rem;margin:1.5rem 0;background:var(--surface)}
.key-points h3,.star-section h4{font-family:var(--mono);font-size:0.72rem;letter-spacing:0.12em;text-transform:uppercase;
  color:var(--muted);font-weight:400;margin:0 0 0.6rem}
.key-points ul,.star-section ul{margin:0;padding-left:1.1rem}
.star-section p{margin-bottom:0.6rem}
.star-section p:last-child{margin-bottom:0}
.star-item{border-top:1px solid var(--line);padding:0.7rem 0}
.star-item:first-child{border-top:0}
.star-item strong{display:block;margin-bottom:0.15rem}
.example-box{border:1px solid var(--line);border-radius:var(--radius);padding:1.1rem 1.25rem;margin:1.5rem 0;background:var(--surface)}
.example-box.good,.example-box.strong{border-left:3px solid #1E7F4F}
.example-box.bad,.example-box.weak{border-left:3px solid var(--accent)}
.example-box p:last-child{margin-bottom:0}
.example-label{display:inline-block;font-family:var(--mono);font-size:0.68rem;letter-spacing:0.1em;
  text-transform:uppercase;margin-bottom:0.5rem;color:var(--muted)}
.example-label.good{color:#1E7F4F}
.example-label.bad{color:var(--accent)}

.nav-buttons{display:flex;flex-wrap:wrap;gap:0.6rem;margin-top:2.5rem;padding-top:1.5rem;border-top:1px solid var(--line)}
.nav-btn{display:inline-flex;align-items:center;gap:0.5rem;padding:0.6rem 1.1rem;border:1px solid var(--line-2);
  border-radius:999px;font-size:0.85rem;color:var(--ink)}
.nav-btn:hover{border-color:var(--ink);color:var(--ink)}
.prev-btn,.next-btn{border-color:var(--accent);color:var(--accent)}
.prev-btn:hover,.next-btn:hover{background:var(--accent);border-color:var(--accent);color:#fff}
.back-to-index:hover{border-color:var(--ink)}
.nav-btn i,.nav-btn .icon,.back-to-index i{inline-size:0.85em;block-size:0.85em}

.category-section{margin-top:2.5rem}
.category-title{display:flex;align-items:center;gap:0.6rem;font-family:var(--mono);font-size:0.74rem;
  letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);padding-bottom:0.6rem;
  border-bottom:1px solid var(--line);margin:0}
.category-title i,.category-title .icon{color:var(--accent);inline-size:0.95em;block-size:0.95em}
.topics-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(17rem,1fr))}
.topic-card{display:block;padding:1.1rem 0;border-bottom:1px solid var(--line);color:var(--ink)}
.topic-card h3{font-size:1.02rem;margin-bottom:0.25rem}
.topic-card p{font-size:0.9rem;color:var(--ink-2);margin:0}
.topic-card:hover h3{color:var(--accent)}
footer{border-top:1px solid var(--line);padding:1.75rem var(--gutter);font-size:0.85rem;color:var(--muted);text-align:center}
footer a{color:var(--accent)}
@media (max-width:620px){
  .top-nav{font-size:0.66rem;gap:0.5rem}
  .content h2{font-size:1.35rem}
  .nav-btn{padding:0.5rem 0.9rem;font-size:0.8rem}
}
</style>
"""

LOCAL_LINKS = """<link rel="stylesheet" href="{p}assets/fonts/fonts.css">
    <link rel="stylesheet" href="{p}assets/icons/icons.css">
    <link rel="stylesheet" href="{p}style.css?v=2026-10-rebuild">"""

THIRD_PARTY = [
    r'\s*<link[^>]*fonts\.googleapis\.com[^>]*>',
    r'\s*<link[^>]*cdnjs\.cloudflare\.com[^>]*>',
    r'\s*<link[^>]*fonts\.gstatic\.com[^>]*>',
    r'\s*<script[^>]*cdn\.jsdelivr\.net[^>]*>\s*</script>',
]


def migrate(path, prefix, behaviour):
    with open(path, encoding='utf-8') as fh:
        html = fh.read()
    before = html

    for pattern in THIRD_PARTY:
        html = re.sub(pattern, '', html)

    # one local stylesheet block, in place of the old style.css link
    links = LOCAL_LINKS.format(p=prefix)
    if re.search(r'<link[^>]*href="[^"]*style\.css[^"]*"[^>]*>', html):
        html = re.sub(r'\s*<link[^>]*href="[^"]*style\.css[^"]*"[^>]*>', '\n    ' + links, html, count=1)
    else:
        html = html.replace('</head>', '    ' + links + '\n</head>', 1)

    if behaviour == 'blog':
        html = re.sub(r'\s*<style[^>]*>.*?</style>', '', html, flags=re.S)
    elif behaviour == 'behavioural':
        if re.search(r'<style[^>]*>.*?</style>', html, re.S):
            html = re.sub(r'\s*<style[^>]*>.*?</style>', BEHAVIOURAL_CSS, html, count=1, flags=re.S)
        else:
            html = html.replace('</head>', BEHAVIOURAL_CSS + '</head>', 1)

    # housekeeping: lang, viewport, favicon
    if not re.match(r'<html[^>]*\slang=', html, re.I):
        html = re.sub(r'<html([^>]*)>', r'<html\1 lang="en">', html, count=1)
    if 'name="viewport"' not in html:
        html = html.replace('<head>', '<head>\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">', 1)
    if 'favicon' not in html:
        html = html.replace('</head>', '    <link rel="icon" type="image/png" href="' + prefix + 'assets/icons/favicon-32.png">\n</head>', 1)

    # the folder used to have a space in it
    html = html.replace('https://rohanhandore.com/Behavioral-interview/', 'https://rohanhandore.com/behavioral-interview/')
    html = html.replace('href="Behavioral interview/', 'href="behavioral-interview/')
    html = html.replace('../Behavioral interview/', '../behavioral-interview/')

    if html != before:
        with open(path, 'w', encoding='utf-8') as fh:
            fh.write(html)
        return True
    return False


def main():
    if os.path.isdir('Behavioral interview'):
        subprocess.run(['git', 'mv', 'Behavioral interview', 'behavioral-interview'], check=True)
        print('renamed: Behavioral interview/ -> behavioral-interview/')

    targets = []
    for name in sorted(os.listdir('blog')):
        if name.endswith('.html'):
            targets.append((os.path.join('blog', name), '../', 'blog'))
    for name in sorted(os.listdir('behavioral-interview')):
        if name.endswith('.html'):
            targets.append((os.path.join('behavioral-interview', name), '../', 'behavioural'))

    changed = 0
    for path, prefix, behaviour in targets:
        if migrate(path, prefix, behaviour):
            changed += 1
    print(f'migrated {changed} of {len(targets)} subpages')


if __name__ == '__main__':
    sys.exit(main())
