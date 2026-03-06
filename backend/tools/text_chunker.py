"""
Section-aware text chunker for manuscript processing.

Splits manuscript text into labeled IMRAD sections so crew.py can inject
structured section context into agent prompts. No content is removed or
truncated — the full paper is always passed to the LLM pipeline.
"""
import re
from dataclasses import dataclass, field

from tools.logger import get_logger

logger = get_logger(__name__)

# NOTE: Truncation is disabled — Gemini 2.5 Flash has 1M token context window.
# To re-enable, uncomment smart_truncate() below and call it in crew.py
# before passing paper_content to the pipeline.
#
# _MAX_CHARS = 32_000
# _SECTION_PREVIEW_CHARS = 600
# _TRUNCATION_NOTE = "[... SECTION TRUNCATED — content continues in original document ...]"
# _ALWAYS_FULL = {"abstract", "references", "bibliography", "preamble"}

# Known section header strings — matched case-insensitively
_SECTION_ORDER: list[str] = [
    "abstract",
    "introduction",
    "background",
    "literature review",
    "related work",
    "methodology",
    "methods",
    "materials and methods",
    "experimental",
    "results",
    "results and discussion",
    "discussion",
    "conclusion",
    "conclusions",
    "acknowledgements",
    "acknowledgments",
    "keywords",
    "references",
    "bibliography",
    "appendix",
]

# Build a single regex that detects section header lines
# Matches: a line that is ONLY a section header word (possibly with numbering like "1. Introduction")
_HEADER_PATTERN = re.compile(
    r"^\s*(?:\d+[\.\s]+)?("
    + "|".join(re.escape(h) for h in _SECTION_ORDER)
    + r")s?\s*$",
    re.IGNORECASE | re.MULTILINE,
)


@dataclass
class _Section:
    name: str        # normalized lowercase section name
    raw_name: str    # original text as it appeared in document
    text: str        # full text content (excluding the header line)
    chars: int = field(init=False)

    def __post_init__(self) -> None:
        self.chars = len(self.text)

    # def priority(self) -> int:
    #     """Lower = higher priority. Preamble = 0, unknown = 999."""
    #     if self.name == "preamble":
    #         return 0
    #     try:
    #         return _SECTION_ORDER.index(self.name) + 1
    #     except ValueError:
    #         return 999


def split_into_sections(text: str) -> list[_Section]:
    """
    Split manuscript text into labeled sections.

    Uses HEADER_PATTERN to detect section boundaries. Everything before the
    first recognized header is labeled "preamble" (title, authors, affiliations).

    Returns:
        List of _Section objects in document order.
    """
    sections: list[_Section] = []
    last_end = 0
    current_label = "preamble"
    current_raw = "preamble"

    for match in _HEADER_PATTERN.finditer(text):
        # Save the text before this header
        segment = text[last_end:match.start()].strip()
        if segment:
            sections.append(_Section(
                name=current_label,
                raw_name=current_raw,
                text=segment,
            ))

        current_label = match.group(1).lower().strip()
        current_raw   = match.group(0).strip()
        last_end      = match.end()

    # Save the final section
    final_segment = text[last_end:].strip()
    if final_segment:
        sections.append(_Section(
            name=current_label,
            raw_name=current_raw,
            text=final_segment,
        ))

    # If no headers were found at all, return the whole text as preamble
    if not sections:
        sections = [_Section(name="preamble", raw_name="preamble", text=text.strip())]

    logger.debug(
        "[CHUNKER] Detected %d sections: %s",
        len(sections),
        [s.name for s in sections],
    )
    return sections


# ── smart_truncate — DISABLED (Gemini 2.5 Flash handles full papers) ──────────
# Uncomment and call in crew.py if a smaller-context model is used in future.
#
# def smart_truncate(text: str, max_chars: int = _MAX_CHARS) -> str:
#     """
#     Intelligently truncate a manuscript to fit within max_chars.
#     Always preserves: preamble, abstract, references in full.
#     Fills remaining budget with IMRAD sections in priority order.
#     Sections that don't fit get a preview + [TRUNCATED] marker.
#     """
#     if len(text) <= max_chars:
#         return text
#
#     sections = split_into_sections(text)
#     total_original = len(text)
#
#     must_have = [s for s in sections if s.name in _ALWAYS_FULL]
#     optional  = sorted(
#         [s for s in sections if s.name not in _ALWAYS_FULL],
#         key=lambda s: s.priority(),
#     )
#
#     used = sum(s.chars for s in must_have)
#     remaining = max_chars - used
#     included: list[_Section] = list(must_have)
#     truncated: list[_Section] = []
#
#     for sec in optional:
#         if remaining >= sec.chars:
#             included.append(sec)
#             remaining -= sec.chars
#         elif remaining >= _SECTION_PREVIEW_CHARS + 50:
#             preview = _Section(
#                 name=sec.name, raw_name=sec.raw_name,
#                 text=sec.text[:_SECTION_PREVIEW_CHARS].rstrip() + f"\n{_TRUNCATION_NOTE}",
#             )
#             truncated.append(preview)
#             included.append(preview)
#             remaining = 0
#             break
#         else:
#             included.append(_Section(name=sec.name, raw_name=sec.raw_name, text=_TRUNCATION_NOTE))
#
#     name_order = {s.name: i for i, s in enumerate(sections)}
#     included.sort(key=lambda s: name_order.get(s.name, 999))
#
#     parts = [
#         (f"{s.raw_name}\n{s.text}" if s.raw_name != "preamble" else s.text)
#         for s in included
#     ]
#     result = "\n\n".join(parts)
#
#     logger.warning(
#         "[CHUNKER] Paper truncated: %d → %d chars | truncated=%s",
#         total_original, len(result), [s.name for s in truncated],
#     )
#     return result
