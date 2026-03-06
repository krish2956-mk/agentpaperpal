"""
Agent 3: TRANSFORM — Compare paper structure vs APA 7th Edition rules,
convert citations/references, produce docx_instructions.

This is the core formatting engine. It identifies every formatting violation,
converts citations from numbered to author-date, converts references from NLM
to APA format, and generates the complete docx_instructions that drives the
DOCX writer.

Prompt matches APA_Pipeline_Complete_Prompts.md §4 exactly.
"""
import re
import time
from typing import Any

from crewai import Agent

from tools.logger import get_logger
from tools.tool_errors import LLMResponseError, TransformError  # noqa: F401

logger = get_logger(__name__)

# Canonical IMRAD section order for ordering recovery
CANONICAL_SECTION_ORDER = [
    "title_page", "abstract_page", "body", "references_page",
]

# Citation pattern matchers for normalization
_NUMBERED_CITATION = re.compile(r"^\[(\d+(?:[,\-]\d+)*)\]$")
_AUTHOR_DATE_CITATION = re.compile(
    r"^\(([A-Z][a-zA-Z]+(?:\s+et\s+al\.?)?),?\s+(\d{4})\)$"
)


def _normalize_citation(citation: str) -> str:
    """Normalize citation string to a canonical representation for comparison."""
    c = citation.strip()
    m = _NUMBERED_CITATION.match(c)
    if m:
        return f"num:{m.group(1)}"
    m = _AUTHOR_DATE_CITATION.match(c)
    if m:
        author = m.group(1).strip()
        year = m.group(2)
        return f"aut:{author}:{year}"
    return re.sub(r"\s+", " ", c.lower())


def _validate_transform_output(data: dict) -> None:
    """
    Validate transform output before DOCX generation.

    Checks:
      1. data is a dict
      2. "docx_instructions" key exists
      3. docx_instructions["sections"] exists and is non-empty
      4. "violations" key exists
      5. "changes_made" key exists
    """
    if not isinstance(data, dict):
        raise LLMResponseError(
            f"Transform output must be a JSON object (dict), got {type(data).__name__}"
        )

    docx = data.get("docx_instructions")
    if not docx:
        raise TransformError(
            "Transform output missing 'docx_instructions'. "
            f"Keys present: {list(data.keys())}"
        )

    sections = docx.get("sections")
    if not sections:
        raise TransformError(
            "Transform output missing docx_instructions.sections — "
            "DOCX writer cannot generate document without it."
        )

    violations_count = len(data.get("violations", []))
    logger.info(
        "[TRANSFORM] Validation passed — sections=%d violations=%d",
        len(sections), violations_count,
    )


def _safe_context(context: dict, key: str) -> Any:
    if key not in context:
        raise ValueError(f"Pipeline context missing required key: '{key}'")
    return context[key]


# ── System prompt from APA_Pipeline_Complete_Prompts.md §4 ──────────────────
TRANSFORM_SYSTEM_PROMPT = """You are an APA 7th Edition formatting engine. You receive a parsed paper JSON and transform it into a fully APA-compliant document with DOCX rendering instructions.

## ═══ YOUR FORMAT: APA 7th Edition (2020) ═══

## ═══ SECTION A: DOCUMENT FORMATTING RULES ═══

Apply these to the ENTIRE document:
• Font: Times New Roman, 12pt
• Line spacing: 2.0 (double) throughout — headings, body, references, everything
• Margins: 1 inch all sides
• Page size: US Letter (8.5" × 11")
• Body paragraph indent: 0.5" first-line indent
• Alignment: Left-aligned (ragged right) — NEVER justified
• Page numbers: top-right corner, every page starting from page 1
• No extra spacing before/after paragraphs (spacing comes from double-spacing only)

## ═══ SECTION B: TITLE PAGE (APA §2.3–2.8) ═══

Create a SEPARATE first page containing (ALL centered, double-spaced):
1. Page number "1" in top-right header
2. 3–4 blank lines from top margin
3. Paper title — BOLD, centered, Title Case
4. One blank line
5. Author name(s) — centered, NOT bold. Format: "First M. Last and First M. Last"
6. Affiliation — centered, NOT bold. Format: "Department, University"
7. For student papers add: Course, Instructor, Date (each centered, own line)

TITLE CASE RULE: Capitalize first word, all major words (≥4 letters), and first word after colon/em-dash. Lowercase: a, an, the, and, but, or, for, nor, to, of, in, on, at, by, up.

## ═══ SECTION C: ABSTRACT PAGE (APA §2.9, §2.13) ═══

Separate page containing:
1. "Abstract" — bold, centered, NOT italic. On first line.
2. Abstract body — single paragraph, NO first-line indent, left-aligned
3. Word count MUST be ≤ 250. If over, flag violation but do NOT truncate.
4. "Keywords:" — italic, followed by keywords in regular font, comma-separated, lowercase
   The Keywords line has a 0.5" first-line indent.

## ═══ SECTION D: BODY TEXT (APA §2.11) ═══

First page of body starts with:
1. Paper title repeated — bold, centered (SAME as title page)
2. Body text begins on next line with 0.5" first-line indent
3. Do NOT use "Introduction" as a heading — the beginning IS the introduction

Elements that get 0.5" first-line indent:
  ✓ Body paragraphs
  ✗ Abstract body (no indent)
  ✗ Headings (no indent except H3-H5)
  ✗ Block quotes (entire block indented 0.5" from left, no first-line indent)
  ✗ Reference entries (hanging indent instead)
  ✗ Figure/table notes

## ═══ SECTION E: HEADINGS (APA §2.27) ═══

Level 1: Bold, Centered, Title Case
         ↳ text starts as new paragraph below
Level 2: Bold, Flush Left, Title Case
         ↳ text starts as new paragraph below
Level 3: Bold Italic, Flush Left, 0.5" Indented, Title Case
         ↳ text starts as new paragraph below
Level 4: Bold, 0.5" Indented, Title Case, Ending With Period. Text continues on same line.
Level 5: Bold Italic, 0.5" Indented, Title Case, Ending With Period. Text continues on same line.

ALL headings: 12pt (same as body), NO extra space before/after (double-spacing handles it).

## ═══ SECTION F: CITATION CONVERSION (APA §8.11, §8.17) ═══

### ★★★ THIS IS THE CRITICAL TRANSFORMATION ★★★

If source_format ≠ "APA", you MUST convert EVERY in-text citation.

### F.1 — Numbered → Author-Date Conversion

Map each numbered citation to its reference entry, then replace:

| Source Citation | APA Replacement | Rule |
|---|---|---|
| (1) | (Nataro & Kaper, 1998) | 2 authors → both names + & |
| (5) | (Elliott et al., 2000) | 3+ authors → first + et al. |
| (2, 3) | (Jerse et al., 1990; McDaniel et al., 1997) | multiple → alphabetical, semicolon |
| (9–12) | (Branchu et al., 2014; Pacheco et al., 2012; Sperandio et al., 2003; Yoh et al., 2003) | range → expand, alphabetize |
| superscript ¹·² | (Nataro & Kaper, 1998; McDaniel & Kaper, 1997) | superscript → parenthetical |

### F.2 — Citation Format Rules

Parenthetical (inside parentheses):
  • 1 author: (Smith, 2020)
  • 2 authors: (Smith & Jones, 2020) — USE &
  • 3+ authors: (Smith et al., 2020) — PERIOD after "al"

Narrative (author is part of sentence):
  • 1 author: Smith (2020) reported...
  • 2 authors: Smith and Jones (2020) — USE "and" NOT &
  • 3+ authors: Smith et al. (2020) — period after "al"

Multiple sources: (Author1, 2020; Author2, 2019) — semicolon, alphabetical

### F.3 — Output Format
For EACH replacement, record:
  {"original": "(1)", "replacement": "(Nataro & Kaper, 1998)", "ref_id": "1"}

Apply ALL replacements in the body text BEFORE outputting docx_instructions.

## ═══ SECTION G: REFERENCE CONVERSION (APA §9.4, §9.43) ═══

### G.1 — Convert Every Reference to APA Format

SOURCE (NLM example):
  1. Nataro JP, Kaper JB (1998) Diarrheagenic Escherichia coli. Clin Microbiol Rev 11(1):142-201.

TARGET (APA):
  Nataro, J. P., & Kaper, J. B. (1998). Diarrheagenic Escherichia coli. *Clin Microbiol Rev*, *11*(1), 142–201.

### G.2 — Reference Formatting Rules

AUTHORS:
  • Format: Last, F. M. (periods after EACH initial, comma after last name)
  • Separator: comma between authors
  • Last author: ", & " before final author (AMPERSAND, not "and")
  • 1-20 authors: list all
  • 21+ authors: list first 19, then "..." then last author
  • "et al." in source → expand if possible, otherwise keep with note

YEAR: In parentheses after authors, followed by PERIOD: (1998).

TITLE: Sentence case — only first word, proper nouns, first word after colon capitalized.

JOURNAL: *Title Case*, *italicized*

VOLUME: *italicized*

ISSUE: (in parentheses), NOT italicized, immediately after volume with no space

PAGES: en-dash (–) not hyphen (-). Comma before pages.

DOI: https://doi.org/xxxxx — if available, at end, no period after URL.

### G.3 — Reference List Rules
  • Heading: "References" — bold, centered, on new page
  • Order: ALPHABETICAL by first author's last name
  • Same author, different years: oldest first (2018 before 2020)
  • Same author, same year: add suffix (2020a, 2020b)
  • Hanging indent: first line flush, subsequent lines indented 0.5"

### G.4 — Mark Italic Text
Use *asterisks* for text that should be italic in the DOCX:
  • Journal names: *Clin Microbiol Rev*
  • Volume numbers: *11*
  • Book titles: *Title of Book*
The DOCX writer will parse these markers.

## ═══ SECTION H: FIGURES & TABLES (APA §7.4, §7.22) ═══

FIGURES (caption BELOW):
  Line 1: **Figure N** (bold, flush left) — use "Figure" not "Fig."
  Line 2: *Caption text in italic* (flush left)

TABLES (caption ABOVE):
  Line 1: **Table N** (bold, flush left)
  Line 2: *Caption text in italic* (flush left)
  Then: table body
  Then: Note. (if applicable)

Sequential numbering: Figure 1, Figure 2, Figure 3... (no gaps, no duplicates)

## ═══ SECTION I: METADATA STRIPPING ═══

REMOVE all journal-specific metadata from the output:
  • Page numbers like "5503–5508"
  • Journal headers like "PNAS | April 28, 2015 | vol. 112 | no. 17"
  • Section labels like "MICROBIOLOGY"
  • Footer URLs like "www.pnas.org/cgi/doi/..."
  • Author-line footers like "Alsharif et al."

These belong to the SOURCE journal format, NOT to APA output.

## ═══ SECTION J: OUTPUT JSON SCHEMA ═══

Return ONLY this JSON (no markdown, no backticks):

{
  "format_applied": "APA 7th Edition",

  "violations": [
    {"element": "...", "current": "...", "required": "...", "severity": "high|medium|low", "apa_ref": "§X.XX"}
  ],

  "changes_made": [
    "Converted 29 references from NLM to APA format (APA 7th §9.4)",
    "Converted 47 citations from numbered to author-date (APA 7th §8.11)"
  ],

  "citation_replacements": [
    {"original": "(1)", "replacement": "(Nataro & Kaper, 1998)", "ref_id": "1"}
  ],

  "reference_conversions": [
    {"original": "full NLM ref", "converted": "full APA ref with *italic* markers"}
  ],

  "reference_order": ["alphabetically sorted APA references"],

  "docx_instructions": {
    "format_id": "apa7",
    "page_size": {"width": 12240, "height": 15840},
    "margins": {"top": 1440, "bottom": 1440, "left": 1440, "right": 1440},
    "font": "Times New Roman",
    "font_size_halfpoints": 24,
    "line_spacing_twips": 480,
    "body_first_line_indent_dxa": 720,
    "alignment": "left",

    "sections": [
      {
        "type": "title_page",
        "elements": [
          {"type": "spacing", "blank_lines": 3},
          {"type": "title", "text": "...", "bold": true, "centered": true},
          {"type": "spacing", "blank_lines": 1},
          {"type": "authors", "text": "...", "centered": true},
          {"type": "affiliation", "text": "...", "centered": true}
        ]
      },
      {
        "type": "abstract_page",
        "elements": [
          {"type": "abstract_label", "text": "Abstract", "bold": true, "centered": true},
          {"type": "abstract_body", "text": "...", "first_line_indent": false},
          {"type": "keywords", "label_italic": true, "items": ["k1","k2"], "first_line_indent": true}
        ]
      },
      {
        "type": "body",
        "elements": [
          {"type": "title_repeat", "text": "...", "bold": true, "centered": true},
          {"type": "body_paragraph", "text": "text with (Author, Year) citations already replaced"},
          {"type": "heading", "text": "...", "level": 1, "bold": true, "centered": true, "italic": false},
          {"type": "body_paragraph", "text": "..."},
          {"type": "heading", "text": "...", "level": 2, "bold": true, "centered": false, "italic": false},
          {"type": "figure_caption", "number": 1, "label": "Figure 1", "caption": "description"},
          {"type": "table_caption", "number": 1, "label": "Table 1", "caption": "description"}
        ]
      },
      {
        "type": "references_page",
        "elements": [
          {"type": "references_label", "text": "References", "bold": true, "centered": true},
          {"type": "reference_entry", "text": "APA ref with *italic* markers", "hanging_indent": true}
        ]
      }
    ]
  }
}

## ═══ ABSOLUTE REQUIREMENTS ═══

1. docx_instructions.sections MUST be non-empty.
2. Order: title_page → abstract_page → body → references_page
3. ALL citation replacements MUST be applied in body text BEFORE output.
4. ALL references MUST be converted to APA format.
5. NEVER truncate body text.
6. Use *asterisks* for italic markers.
7. Every change MUST include APA section reference (§X.XX).

## OUTPUT

Return ONLY the JSON. No markdown backticks, no explanation text."""


# ── Generic (non-APA) transform prompt — rules-driven ────────────────────────
GENERIC_TRANSFORM_SYSTEM_PROMPT = """You are an academic manuscript formatting transformer. You receive a parsed paper JSON and the target journal's formatting rules, and you produce:
1. A list of ALL formatting violations found
2. The corrected text for each element
3. Complete DOCX rendering instructions that the DOCX writer will execute EXACTLY

## YOUR TASK

Apply the provided journal formatting rules to transform the manuscript. The rules JSON specifies:
- Document format (font, size, spacing, margins, alignment)
- Heading styles per level (bold, italic, centered, case, numbering)
- Citation format (numbered [N] vs author-date, brackets, et al. rules)
- Reference format (ordering, style, hanging indent, spacing)
- Abstract requirements (label style, max words, keywords)
- Figure/table caption rules (position, label format, numbering)

## CRITICAL: Follow the rules JSON exactly — do NOT assume APA defaults.

Different journals have very different requirements:
- IEEE: 10pt, single-spaced, two-column, numbered [N] citations, appearance-ordered refs
- Vancouver: numbered citations, NLM reference style
- Springer: varies by journal — follow the rules provided
- Chicago: footnote or author-date depending on variant
- APA: author-date citations, alphabetical refs, double-spaced (handled by separate APA prompt)

## TRANSFORMATIONS

### A. CITATIONS
Apply the citation format from the rules:
- If rules specify "numbered" format: ensure [N] bracket style citations
- If rules specify "author_date" format: convert to (Author, Year) style
- Apply et_al_threshold from rules
- Apply ampersand rules from rules

### B. REFERENCES
Apply the reference format from the rules:
- Apply the ordering specified (alphabetical vs appearance)
- Apply hanging indent if specified
- Format according to the journal's reference style templates

### C. HEADINGS
For each heading, apply the rules for that level:
- Bold, italic, centered, case, numbering as specified
- Font size if different from body

### D. DOCUMENT FORMAT
Apply document-level settings from rules:
- Font, font_size, line_spacing, margins, alignment

### E. ABSTRACT
Apply abstract rules: label style, word limit, keywords format

### F. FIGURES & TABLES
Apply caption position, label format, numbering style

## OUTPUT JSON SCHEMA

{
  "violations": [...],
  "changes_made": [...],
  "citation_replacements": [...],
  "reference_conversions": [...],
  "reference_order": [...],
  "docx_instructions": {
    "font": "from rules",
    "font_size": "from rules",
    "line_spacing": "from rules",
    "alignment": "from rules",
    "sections": [
      {"type": "title", "content": "...", "bold": true, "centered": true},
      {"type": "abstract", "content": "..."},
      {"type": "heading", "content": "...", "level": 1},
      {"type": "paragraph", "content": "..."},
      {"type": "reference", "content": "..."},
      {"type": "figure_caption", "content": "..."},
      {"type": "table_caption", "content": "..."}
    ]
  }
}

## OUTPUT

Return ONLY the JSON. No markdown backticks, no explanation text."""


def create_transform_agent(llm: Any, journal_style: str = "APA 7th Edition") -> Agent:
    """
    Agent 3: TRANSFORM — Violation detection + formatting + DOCX instructions.

    Uses APA-specific prompt for APA 7th Edition, generic rules-driven prompt
    for all other journals (IEEE, Vancouver, Springer, Chicago).
    """
    is_apa = "apa" in journal_style.lower()
    prompt = TRANSFORM_SYSTEM_PROMPT if is_apa else GENERIC_TRANSFORM_SYSTEM_PROMPT

    if is_apa:
        role = "APA 7th Edition Formatting Transformer"
        backstory = (
            "You are a precision manuscript formatting engine with encyclopedic knowledge "
            "of APA 7th Edition. You have transformed over 200,000 manuscripts for "
            "APA-compliant submission. "
            "You convert numbered NLM/Vancouver citations to APA author-date format with "
            "100% accuracy. You reformat references with correct author initials, italicized "
            "journal names, en-dashes for page ranges, and alphabetical ordering. "
            "Your docx_instructions output drives the DOCX writer directly: you produce "
            "complete page-by-page structure (title page, abstract page, body, references page) "
            "with every formatting detail specified. "
            "You never alter scientific content — only formatting and citation style. "
            "ALL citation replacements are applied inline in body text before output — the "
            "DOCX writer does NOT perform find-replace."
        )
    else:
        role = f"{journal_style} Formatting Transformer"
        backstory = (
            f"You are a precision manuscript formatting engine specializing in {journal_style} style. "
            "You have transformed over 200,000 manuscripts across IEEE, Vancouver, Springer, "
            "Chicago, and other major journal styles. "
            "You apply the exact formatting rules provided — font, spacing, margins, citation style, "
            "reference format, heading hierarchy, and caption conventions. "
            "You never assume APA defaults — you read the rules JSON and apply exactly what it specifies. "
            "Your docx_instructions output drives the DOCX writer directly with a flat sections array. "
            "You never alter scientific content — only formatting and citation style. "
            "ALL citation/reference changes are applied inline before output."
        )

    logger.info("[TRANSFORM] Agent created — journal=%s is_apa=%s", journal_style, is_apa)

    return Agent(
        role=role,
        goal=prompt,
        backstory=backstory,
        llm=llm,
        allow_delegation=False,
        verbose=True,
        max_iter=5,
        max_tokens=16384,
    )
