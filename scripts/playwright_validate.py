import asyncio
import sys


async def main():
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print("Playwright for Python is not installed.")
        print("Run: pip install playwright && python -m playwright install")
        return 1

    url = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 980})
        await page.goto(url, wait_until="networkidle")
        title = await page.locator("h1").inner_text()
        nav_count = await page.locator(".nav-link").count()
        print({"title": title, "navCount": nav_count, "url": url})
        await page.screenshot(path="playwright-home.png", full_page=True)
        await browser.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
