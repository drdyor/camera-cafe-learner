#!/usr/bin/env python3
import json

d = json.load(open('data/italian-dictionary.json', encoding='utf-8'))

# Get all words by category
by_cat = {}
for word, data in d.items():
    cat = data.get('cat', 'uncategorized')
    if cat not in by_cat:
        by_cat[cat] = []
    by_cat[cat].append({
        'word': word,
        'en': data.get('en', ''),
        'g': data.get('g', ''),
    })

# Print each category with all words
for cat, words in sorted(by_cat.items(), key=lambda x: -len(x[1])):
    print(f'\n=== {cat.upper()} ({len(words)} words) ===')
    for w in words[:40]:  # First 40
        gender = w['g'] if w['g'] else '-'
        print(f"  {w['word']}: {w['en']} ({gender})")
    if len(words) > 40:
        print(f'  ... and {len(words)-40} more')
