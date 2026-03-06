#!/usr/bin/env python3
"""
Scrape Nguyen Art Foundation main collection into a JSON array.

Output fields:
- artist
- title
- year
- medium
- dimensions
- description
- url
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import random
import re
import time
from collections import deque
from typing import Dict, Iterable, List, Optional, Set, Tuple
from urllib.parse import parse_qs, urljoin, urlparse, urlunparse

import requests
from bs4 import BeautifulSoup


DEFAULT_START_URL = "https://nguyenartfoundation.com/vn/collection/suu-tap/"
USER_AGENT = "JudoooNafScraper/1.0 (+https://judooo.art)"

LABEL_PATTERNS = {
    "artist": [r"\bartist\b", r"họa\s*sĩ", r"tác\s*giả", r"author"],
    "year": [r"\byear\b", r"\bnăm\b", r"date"],
    "medium": [r"\bmedium\b", r"chất\s*liệu", r"materials?"],
    "dimensions": [r"dimensions?", r"kích\s*thước", r"\bsize\b"],
    "description": [r"description", r"mô\s*tả", r"notes?"],
}


def clean_text(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    normalized = re.sub(r"\s+", " ", value).strip()
    return normalized or None


def slugify(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9\s-]", "", value.lower())
    normalized = re.sub(r"\s+", "-", normalized).strip("-")
    normalized = re.sub(r"-{2,}", "-", normalized)
    return normalized or "untitled-artwork"


def parse_year(value: Optional[str]) -> Optional[int]:
    if not value:
        return None
    match = re.search(r"(19|20)\d{2}", value)
    return int(match.group(0)) if match else None


def stable_price(seed_text: str, min_vnd: int = 6_000_000, max_vnd: int = 30_000_000) -> int:
    rng = random.Random(seed_text)
    raw = rng.randint(min_vnd, max_vnd)
    return int(round(raw / 100_000) * 100_000)


def normalize_url(href: str, base: str) -> str:
    if not href:
        return ""
    absolute = urljoin(base, href.strip())
    parsed = urlparse(absolute)
    if parsed.scheme not in {"http", "https"}:
        return ""
    return urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, parsed.query, ""))


def is_collection_index(url: str) -> bool:
    parsed = urlparse(url)
    path = parsed.path.rstrip("/")
    if path.endswith("/collection/suu-tap"):
        return True
    if re.search(r"/collection/suu-tap/page/\d+$", path):
        return True
    q = parse_qs(parsed.query)
    return "paged" in q


def is_detail_url(url: str) -> bool:
    parsed = urlparse(url)
    if "nguyenartfoundation.com" not in parsed.netloc:
        return False
    path = parsed.path.rstrip("/")
    if "/vn/collection/" not in path:
        return False
    if is_collection_index(url):
        return False
    if re.search(r"/collection/suu-tap/page/\d+$", path):
        return False
    return True


def first_match(html: str, patterns: Iterable[str]) -> Optional[str]:
    for pattern in patterns:
        match = re.search(pattern, html, flags=re.IGNORECASE)
        if match:
            return match.group(1)
    return None


def extract_meta_map(soup: BeautifulSoup) -> Dict[str, str]:
    meta: Dict[str, str] = {}

    for row in soup.select("tr"):
        th = clean_text(row.select_one("th").get_text(" ", strip=True) if row.select_one("th") else None)
        td = clean_text(row.select_one("td").get_text(" ", strip=True) if row.select_one("td") else None)
        if th and td and th.lower() not in meta:
            meta[th.lower()] = td

    for dt in soup.select("dt"):
        key = clean_text(dt.get_text(" ", strip=True))
        sibling = dt.find_next_sibling("dd")
        val = clean_text(sibling.get_text(" ", strip=True) if sibling else None)
        if key and val and key.lower() not in meta:
            meta[key.lower()] = val

    for block in soup.select("li, p, div"):
        strong = block.find(["strong", "b"])
        if not strong:
            continue
        key = clean_text(strong.get_text(" ", strip=True))
        full = clean_text(block.get_text(" ", strip=True))
        if not key or not full:
            continue
        value = clean_text(full.replace(key, "", 1).lstrip(": ").strip())
        if value and key.lower() not in meta:
            meta[key.lower()] = value

    return meta


def get_labeled_value(meta: Dict[str, str], label_key: str) -> Optional[str]:
    patterns = [re.compile(p, re.IGNORECASE) for p in LABEL_PATTERNS[label_key]]
    for key, value in meta.items():
        if any(p.search(key) for p in patterns):
            return clean_text(value)
    return None


def extract_links_from_listing(html: str, base_url: str) -> Tuple[Set[str], Set[str]]:
    soup = BeautifulSoup(html, "html.parser")
    detail_links: Set[str] = set()
    next_pages: Set[str] = set()

    for a in soup.select("a[href]"):
        url = normalize_url(a.get("href", ""), base_url)
        if not url:
            continue
        if is_detail_url(url):
            detail_links.add(url)
        elif is_collection_index(url):
            next_pages.add(url)

    clickable_attrs = ["data-href", "data-url", "data-link", "data-permalink", "data-target"]
    for el in soup.select("*"):
        for attr in clickable_attrs:
            val = el.get(attr)
            if not val:
                continue
            url = normalize_url(val, base_url)
            if is_detail_url(url):
                detail_links.add(url)
            elif is_collection_index(url):
                next_pages.add(url)

        onclick = el.get("onclick", "")
        if onclick:
            for m in re.finditer(r"""['"]((?:https?://|/)[^'"]+)['"]""", onclick):
                url = normalize_url(m.group(1), base_url)
                if is_detail_url(url):
                    detail_links.add(url)
                elif is_collection_index(url):
                    next_pages.add(url)

    scripts = soup.find_all("script")
    for script in scripts:
        body = script.string or script.get_text() or ""
        for m in re.finditer(r"""["']((?:https?://|/)[^"']*?/vn/collection/[^"']*)["']""", body):
            url = normalize_url(m.group(1), base_url)
            if is_detail_url(url):
                detail_links.add(url)
            elif is_collection_index(url):
                next_pages.add(url)

    parsed = urlparse(base_url)
    current_page = 1
    page_match = re.search(r"/page/(\d+)/?$", parsed.path)
    if page_match:
        current_page = int(page_match.group(1))
    else:
        q = parse_qs(parsed.query)
        if "paged" in q and q["paged"]:
            try:
                current_page = int(q["paged"][0])
            except ValueError:
                pass
    guessed_next = normalize_url(f"/vn/collection/suu-tap/page/{current_page + 1}/", base_url)
    if guessed_next:
        next_pages.add(guessed_next)

    return detail_links, next_pages


def parse_detail(html: str, url: str) -> Dict[str, Optional[str]]:
    soup = BeautifulSoup(html, "html.parser")
    meta_map = extract_meta_map(soup)

    title = None
    for sel in ["h1", ".entry-title", ".post-title", ".product_title", ".title"]:
        node = soup.select_one(sel)
        if node and clean_text(node.get_text(" ", strip=True)):
            title = clean_text(node.get_text(" ", strip=True))
            break
    if not title:
        title = clean_text(
            first_match(
                html,
                [
                    r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']',
                    r"<title[^>]*>([^<]+)</title>",
                ],
            )
        )

    artist = None
    for sel in [".artist", ".entry-meta .artist", ".meta-artist", "[class*='artist']"]:
        node = soup.select_one(sel)
        if node and clean_text(node.get_text(" ", strip=True)):
            artist = clean_text(node.get_text(" ", strip=True))
            break
    if not artist:
        artist = get_labeled_value(meta_map, "artist")

    year = get_labeled_value(meta_map, "year")
    medium = get_labeled_value(meta_map, "medium")
    dimensions = get_labeled_value(meta_map, "dimensions")

    description = None
    for sel in [".description", ".entry-content", ".post-content", ".single-content", "[class*='description']"]:
        node = soup.select_one(sel)
        if node and clean_text(node.get_text(" ", strip=True)):
            description = clean_text(node.get_text(" ", strip=True))
            break
    if not description:
        description = get_labeled_value(meta_map, "description")
    if not description:
        description = clean_text(
            first_match(
                html,
                [r'<meta[^>]+property=["\']og:description["\'][^>]+content=["\']([^"\']+)["\']'],
            )
        )

    image_url = clean_text(
        first_match(
            html,
            [
                r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
                r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']',
                r'<img[^>]+src=["\']([^"\']+)["\']',
            ],
        )
    )
    if image_url:
        image_url = normalize_url(image_url, url)

    return {
        "artist": artist,
        "title": title,
        "year": year,
        "medium": medium,
        "dimensions": dimensions,
        "description": description,
        "image_url": image_url,
        "url": url,
    }


def scrape_collection(
    start_url: str,
    delay_seconds: float = 0.6,
    max_pages: int = 200,
    timeout: int = 30,
) -> List[Dict[str, Optional[str]]]:
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT, "Accept-Language": "vi,en;q=0.9"})

    queue: deque[str] = deque([start_url])
    visited_pages: Set[str] = set()
    detail_urls: Set[str] = set()

    while queue and len(visited_pages) < max_pages:
        page_url = queue.popleft()
        if page_url in visited_pages:
            continue
        visited_pages.add(page_url)

        try:
            resp = session.get(page_url, timeout=timeout)
            if resp.status_code >= 400:
                continue
            detail_links, next_pages = extract_links_from_listing(resp.text, page_url)
            for url in detail_links:
                if url not in detail_urls:
                    detail_urls.add(url)
            for next_url in next_pages:
                if next_url not in visited_pages and next_url not in queue:
                    queue.append(next_url)
        except requests.RequestException:
            pass

        time.sleep(delay_seconds)

    results: List[Dict[str, Optional[str]]] = []
    crawled_details: Set[str] = set()
    for url in sorted(detail_urls):
        if url in crawled_details:
            continue
        crawled_details.add(url)
        try:
            resp = session.get(url, timeout=timeout)
            if resp.status_code >= 400:
                continue
            results.append(parse_detail(resp.text, url))
        except requests.RequestException:
            pass
        time.sleep(delay_seconds)

    return results


def supabase_request(
    method: str,
    supabase_url: str,
    supabase_key: str,
    path_with_query: str,
    json_payload: Optional[object] = None,
    extra_headers: Optional[Dict[str, str]] = None,
) -> Tuple[int, object]:
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
    }
    if extra_headers:
        headers.update(extra_headers)

    response = requests.request(
        method=method,
        url=f"{supabase_url.rstrip('/')}/rest/v1/{path_with_query.lstrip('/')}",
        headers=headers,
        json=json_payload,
        timeout=40,
    )
    try:
        body = response.json()
    except ValueError:
        body = response.text
    return response.status_code, body


def get_seller_profile_id(supabase_url: str, supabase_key: str) -> Optional[str]:
    status, body = supabase_request(
        "GET",
        supabase_url,
        supabase_key,
        "profiles?select=id&role=in.(artist,gallery,art_dealer)&order=created_at.asc&limit=1",
    )
    if status >= 400:
        return None
    if isinstance(body, list) and body:
        return body[0].get("id")
    return None


def get_or_create_artist_id(supabase_url: str, supabase_key: str, profile_id: str) -> Optional[str]:
    status, body = supabase_request(
        "GET",
        supabase_url,
        supabase_key,
        f"artists?select=id&profile_id=eq.{profile_id}&limit=1",
    )
    if status < 400 and isinstance(body, list) and body:
        return body[0].get("id")

    status, body = supabase_request(
        "POST",
        supabase_url,
        supabase_key,
        "artists",
        json_payload={
            "profile_id": profile_id,
            "display_name": "Nguyen Collection Artist",
            "city": "Ho Chi Minh City",
            "disciplines": ["painting"],
        },
        extra_headers={"Prefer": "return=representation"},
    )
    if status < 400 and isinstance(body, list) and body:
        return body[0].get("id")
    return None


def build_artwork_payload(
    record: Dict[str, Optional[str]],
    seller_id: str,
    artist_id: Optional[str],
) -> Dict[str, object]:
    title = record.get("title") or "Untitled Vietnamese Artwork"
    source_url = record.get("url") or ""
    year_value = parse_year(record.get("year"))
    image_url = record.get("image_url") or "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1200"
    desc = record.get("description") or f"Imported from Nguyen Art Foundation collection detail page: {source_url}"
    digest = hashlib.sha1(f"{title}|{source_url}".encode("utf-8")).hexdigest()[:10]
    slug = f"naf-{slugify(title)}-{digest}"

    return {
        "artist_id": artist_id,
        "created_by": seller_id,
        "title": title,
        "slug": slug,
        "description": desc,
        "art_form": "painting",
        "medium": record.get("medium") or "Mixed media",
        "dimensions": record.get("dimensions") or "Unknown",
        "year_created": year_value,
        "image_url": image_url,
        "image_urls": [image_url],
        "sale_type": "fixed",
        "currency": "VND",
        "price": stable_price(f"{title}|{source_url}"),
        "availability": "active",
        "moderation": "approved",
        "style": "Imported Reference",
        "city": "Ho Chi Minh City",
        "country": "Vietnam",
        "provenance": "Imported from Nguyen Art Foundation main collection.",
        "authenticity": "Reference listing. Verify with seller before purchase.",
        "condition_report": "Good",
        "story": desc,
        "source_url": DEFAULT_START_URL,
        "source_item_url": source_url,
        "imported_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


def upsert_to_supabase(
    records: List[Dict[str, Optional[str]]],
    supabase_url: str,
    supabase_key: str,
) -> None:
    seller_id = get_seller_profile_id(supabase_url, supabase_key)
    if not seller_id:
        raise RuntimeError("No seller profile found in public.profiles (artist/gallery/art_dealer).")
    artist_id = get_or_create_artist_id(supabase_url, supabase_key, seller_id)

    payloads = [build_artwork_payload(r, seller_id, artist_id) for r in records]

    status, body = supabase_request(
        "POST",
        supabase_url,
        supabase_key,
        "artworks?on_conflict=slug",
        json_payload=payloads,
        extra_headers={"Prefer": "resolution=merge-duplicates,return=representation"},
    )

    if status < 400:
        inserted = len(body) if isinstance(body, list) else len(records)
        print(f"Upserted {inserted} records into public.artworks")
        return

    # Compatibility fallback for stricter/legacy schemas
    fallback_payloads = []
    for row in payloads:
        fallback_payloads.append(
            {
                "created_by": row["created_by"],
                "title": row["title"],
                "slug": row["slug"],
                "description": row["description"],
                "sale_type": "fixed",
                "price": row["price"],
                "medium": row["medium"],
                "dimensions": row["dimensions"],
                "image_url": row["image_url"],
                "availability": "active",
                "moderation": "approved",
            }
        )

    status2, body2 = supabase_request(
        "POST",
        supabase_url,
        supabase_key,
        "artworks?on_conflict=slug",
        json_payload=fallback_payloads,
        extra_headers={"Prefer": "resolution=merge-duplicates,return=representation"},
    )
    if status2 >= 400:
        raise RuntimeError(f"Supabase upsert failed: {body2}")
    inserted = len(body2) if isinstance(body2, list) else len(fallback_payloads)
    print(f"Upserted {inserted} records into public.artworks (fallback payload)")


def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape Nguyen Art Foundation main collection.")
    parser.add_argument("--start-url", default=DEFAULT_START_URL, help="Collection index URL")
    parser.add_argument("--output", default="naf_main_collection.json", help="Output JSON file path")
    parser.add_argument("--delay", type=float, default=0.6, help="Delay between requests in seconds")
    parser.add_argument("--max-pages", type=int, default=200, help="Max listing pages to scan")
    parser.add_argument("--timeout", type=int, default=30, help="HTTP timeout in seconds")
    parser.add_argument("--to-supabase", action="store_true", help="Also upsert scraped records into Supabase artworks")
    parser.add_argument("--supabase-url", default=os.getenv("SUPABASE_URL", ""), help="Supabase project URL")
    parser.add_argument(
        "--supabase-key",
        default=os.getenv("SUPABASE_SERVICE_ROLE_KEY", "") or os.getenv("SUPABASE_ANON_KEY", ""),
        help="Supabase key (service role recommended)",
    )
    args = parser.parse_args()

    records = scrape_collection(
        start_url=args.start_url,
        delay_seconds=args.delay,
        max_pages=args.max_pages,
        timeout=args.timeout,
    )

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    print(f"Scraped {len(records)} records")
    print(f"Saved JSON array to: {args.output}")

    if args.to_supabase:
        if not args.supabase_url or not args.supabase_key:
            raise RuntimeError("Missing --supabase-url/--supabase-key (or SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY env vars).")
        upsert_to_supabase(records, args.supabase_url, args.supabase_key)


if __name__ == "__main__":
    main()
