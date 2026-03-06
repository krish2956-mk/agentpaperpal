"""
Live Journal Rule Extractor Tool.

Fetches a journal's Instructions for Authors page and returns clean plain text
for LLM analysis. Enables the Interpret agent to work with journals not in the
pre-built rules database.
"""
from bs4 import BeautifulSoup
from crewai.tools import tool

from tools.logger import get_logger

logger = get_logger(__name__)

# Maximum chars returned to avoid LLM context overflow
_MAX_CHARS = 8_000

# Tags that add no content value
_NOISE_TAGS = ["script", "style", "nav", "footer", "header", "aside", "iframe"]


@tool("Live Journal Rule Extractor")
def extract_journal_rules_from_url(url: str) -> str:
    """
    Fetch a journal's Instructions for Authors page and return its plain text content.

    Strips HTML boilerplate (nav, footer, scripts, styles) and truncates to 8 000
    characters so the LLM can parse the formatting rules without hitting context limits.

    Use this tool when the target journal is NOT in the pre-built rules database
    (APA 7th Edition, IEEE, Vancouver, Springer, Chicago). Provide the direct URL
    to the journal's author guidelines or instructions-for-authors page.

    Args:
        url: Full URL to the journal's instructions-for-authors page.

    Returns:
        Plain-text content of the page (up to 8 000 characters), or an
        EXTRACTION_FAILED message if the fetch fails.
    """
    try:
        import httpx  # imported here so the module loads even if httpx is absent

        logger.info("[RULE_EXTRACTOR] Fetching URL: %s", url)
        headers = {"User-Agent": "Mozilla/5.0 (academic research tool; citation formatting)"}
        resp = httpx.get(url, headers=headers, timeout=15, follow_redirects=True)
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(_NOISE_TAGS):
            tag.decompose()

        text = soup.get_text(separator="\n", strip=True)
        # Collapse runs of blank lines
        import re
        text = re.sub(r"\n{3,}", "\n\n", text)

        truncated = len(text) > _MAX_CHARS
        result = text[:_MAX_CHARS]
        if truncated:
            result += f"\n\n[... TRUNCATED at {_MAX_CHARS} chars ...]"

        logger.info(
            "[RULE_EXTRACTOR] Extracted %d chars (truncated=%s) from %s",
            len(result), truncated, url,
        )
        return result

    except ImportError:
        return "EXTRACTION_FAILED: httpx is not installed. Run: pip install httpx"
    except Exception as e:
        logger.warning("[RULE_EXTRACTOR] Fetch failed for %s: %s", url, e)
        return f"EXTRACTION_FAILED: {e}"
