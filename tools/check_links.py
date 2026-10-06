#!/usr/bin/env python3
"""Prüft alle externen Links aus data/stationen.json (auf deinem Rechner mit Internet ausführen).
Aufruf: python3 tools/check_links.py   (im Ordner der App)"""
import json, urllib.request, concurrent.futures as cf
d = json.load(open('data/stationen.json', encoding='utf-8'))
urls = {}
for s in d['stationen']:
    for l in s['links']: urls.setdefault(l['u'], s['titel'])
for l in d['info']['allg']: urls.setdefault(l['u'], 'Allgemein')
def chk(u):
    try:
        r = urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}), timeout=15)
        return u, r.status
    except Exception as e:
        return u, str(e)
bad = 0
with cf.ThreadPoolExecutor(8) as ex:
    for u, st in ex.map(chk, urls):
        ok = st == 200
        bad += (not ok)
        print(('OK   ' if ok else 'FEHLER'), st, u, '←', urls[u])
print(f'\n{len(urls)} Links, {bad} auffällig (403/429 kann auch Bot-Schutz sein)')
