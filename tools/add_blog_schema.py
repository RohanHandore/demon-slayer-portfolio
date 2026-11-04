#!/usr/bin/env python3
"""Inject BlogPosting JSON-LD into blog posts, fix duplicate lang attributes."""
import json, re, pathlib, datetime

ROOT = pathlib.Path('/root/portfolio-build')
MONTHS = {m: i for i, m in enumerate(
    ['January','February','March','April','May','June','July','August',
     'September','October','November','December'], 1)}
MODIFIED = '2026-11-04'
changed = []


def iso(text):
    m = re.search(r'(%s) (\d{1,2}), (\d{4})' % '|'.join(MONTHS), text)
    if not m:
        return None
    return '%s-%02d-%02d' % (m.group(3), MONTHS[m.group(1)], int(m.group(2)))


def one(pattern, html, flags=re.S):
    m = re.search(pattern, html, flags)
    return m.group(1).strip() if m else None


for post in sorted((ROOT / 'blog').glob('*.html')):
    html = post.read_text(encoding='utf-8')
    if 'BlogPosting' in html or post.name == 'index.html':
        continue
    title = one(r'<title>(.*?)</title>', html)
    desc = one(r'<meta\s+name="description"\s+content="(.*?)"', html)
    canonical = one(r'<link\s+rel="canonical"\s+href="(.*?)"', html)
    published = iso(html)
    if not (title and desc and canonical and published):
        print('SKIP', post.name, bool(title), bool(desc), bool(canonical), published)
        continue
    headline = re.sub(r'\s*\|\s*Rohan Handore\s*$', '', title)
    schema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": headline,
        "description": desc,
        "url": canonical,
        "mainEntityOfPage": {"@type": "WebPage", "@id": canonical},
        "datePublished": published,
        "dateModified": MODIFIED,
        "inLanguage": "en",
        "author": {"@type": "Person", "name": "Rohan Handore", "url": "https://rohanhandore.com/"},
        "publisher": {"@type": "Person", "name": "Rohan Handore", "url": "https://rohanhandore.com/"},
        "image": "https://rohanhandore.com/assets/images/og-image.jpg",
    }
    block = ('    <!-- Structured data -->\n'
             '    <script type="application/ld+json">\n'
             + json.dumps(schema, indent=2, ensure_ascii=False)
             + '\n    </script>\n')
    html = html.replace('</head>', block + '</head>', 1)
    post.write_text(html, encoding='utf-8')
    changed.append(post.name)

# duplicate lang attribute (invalid HTML) on every page
fixed_lang = 0
for f in list(ROOT.rglob('*.html')):
    if '.git' in f.parts or '.worktrees' in f.parts:
        continue
    t = f.read_text(encoding='utf-8')
    if '<html lang="en" lang="en">' in t:
        f.write_text(t.replace('<html lang="en" lang="en">', '<html lang="en">'), encoding='utf-8')
        fixed_lang += 1

print('schema added:', changed)
print('lang fixed:', fixed_lang)
