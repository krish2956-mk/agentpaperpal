# ═══════════════════════════════════════════════════════════════════
# PAPERPAL FORMAT ENGINE — APA 7th Edition Module
# ═══════════════════════════════════════════════════════════════════
#
# TARGET FORMAT: APA 7th Edition (2020)
# FORMAT ID:     apa7
# VERSION:       1.0
#
# ARCHITECTURE NOTE:
# This file contains EVERYTHING specific to APA 7th Edition.
# To add IEEE, Nature, Chicago etc. — create a parallel file
# with the same structure but different rules.
#
# The pipeline has 2 layers:
#   GENERIC (same for all formats):
#     - Text extraction, line merging, section splitting
#     - Agent 1 INGEST (structural labeling)
#     - Agent 2 PARSE (JSON extraction)
#     - DOCX writer skeleton (page creation, file output)
#
#   FORMAT-SPECIFIC (this file — changes per format):
#     - apa7_rules{} dictionary
#     - Agent 3 TRANSFORM prompt (citation/reference conversion rules)
#     - Agent 4 VALIDATE prompt (scoring weights and checks)
#     - DOCX writer formatting params (font, spacing, heading styles)
#
# ═══════════════════════════════════════════════════════════════════


# ─────────────────────────────────────────────────────────────────
# SECTION 0: FORMAT RULES DICTIONARY (apa7_rules)
# ─────────────────────────────────────────────────────────────────
# This is loaded deterministically by crew.py BEFORE any LLM runs.
# For IEEE: create ieee_rules{} with different values.
# For Nature: create nature_rules{} with different values.
# ─────────────────────────────────────────────────────────────────

apa7_rules = {
    "format_id": "apa7",
    "format_name": "APA 7th Edition",
    "manual_year": 2020,

    # ── DOCUMENT LAYOUT ──
    "document": {
        "font": "Times New Roman",
        "font_size_pt": 12,
        "font_size_halfpoints": 24,        # DOCX uses half-points
        "line_spacing": 2.0,
        "line_spacing_twips": 480,          # 240 twips per line × 2.0
        "margins_inches": 1.0,
        "margins_dxa": 1440,                # 1440 DXA = 1 inch
        "page_width_dxa": 12240,            # US Letter 8.5"
        "page_height_dxa": 15840,           # US Letter 11"
        "alignment": "left",               # NOT justified
        "first_line_indent_inches": 0.5,
        "first_line_indent_dxa": 720,
        "paragraph_spacing_before": 0,
        "paragraph_spacing_after": 0,
        "page_number_position": "top-right",
        "running_head": "professional_only",  # student papers: none
        # ── APA SPECIFIC: font alternatives allowed ──
        "allowed_fonts": [
            {"name": "Times New Roman", "size": 12},
            {"name": "Calibri", "size": 11},
            {"name": "Arial", "size": 11},
            {"name": "Georgia", "size": 11},
            {"name": "Aptos", "size": 12},
        ],
        # ── IEEE WOULD BE: single column 10pt or double column 9pt ──
        # ── Nature WOULD BE: no specific font, ~8pt body, 2-column ──
    },

    # ── TITLE PAGE ──
    "title_page": {
        "required": True,
        "separate_page": True,
        "title_bold": True,
        "title_centered": True,
        "title_case": "Title Case",
        "title_position_from_top": "3-4 lines down (~1/3 page)",
        "title_max_words": 12,              # APA recommends ≤12 words
        "author_centered": True,
        "author_bold": False,
        "affiliation_centered": True,
        "affiliation_bold": False,
        "blank_line_between_title_and_author": True,
        # student paper extras:
        "student_fields": ["course_number", "instructor_name", "due_date"],
        # professional paper extras:
        "professional_fields": ["author_note"],
        "apa_section_ref": "§2.3–2.8",
        # ── IEEE WOULD BE: title 24pt bold centered, no separate page ──
        # ── Nature WOULD BE: title bold, left-aligned, no separate page ──
    },

    # ── ABSTRACT ──
    "abstract": {
        "required": True,
        "separate_page": True,
        "label_text": "Abstract",
        "label_bold": True,
        "label_centered": True,
        "label_italic": False,
        "body_indent_first_line": False,    # NO first-line indent
        "max_words": 250,
        "keywords_required": True,
        "keywords_label": "Keywords:",
        "keywords_label_italic": True,
        "keywords_indent_first_line": True,  # 0.5" indent for Keywords line
        "keywords_separator": ", ",
        "keywords_case": "lowercase",
        "apa_section_ref": "§2.9, §2.13",
        # ── IEEE WOULD BE: "Abstract" bold italic, 150-250 words, Index Terms ──
        # ── Nature WOULD BE: no separate page, 150 words max, no keywords section ──
    },

    # ── HEADINGS ──
    "headings": {
        "levels": {
            1: {
                "bold": True,
                "italic": False,
                "centered": True,
                "case": "Title Case",
                "indent": False,
                "inline_with_text": False,
                "font_size_pt": 12,         # same as body
                "apa_section_ref": "§2.27",
            },
            2: {
                "bold": True,
                "italic": False,
                "centered": False,           # flush left
                "case": "Title Case",
                "indent": False,
                "inline_with_text": False,
                "font_size_pt": 12,
            },
            3: {
                "bold": True,
                "italic": True,
                "centered": False,
                "case": "Title Case",
                "indent": True,              # 0.5" indent
                "inline_with_text": False,
                "font_size_pt": 12,
            },
            4: {
                "bold": True,
                "italic": False,
                "centered": False,
                "case": "Title Case",
                "indent": True,
                "inline_with_text": True,    # ends with period, text continues
                "font_size_pt": 12,
            },
            5: {
                "bold": True,
                "italic": True,
                "centered": False,
                "case": "Title Case",
                "indent": True,
                "inline_with_text": True,
                "font_size_pt": 12,
            },
        },
        # ── IEEE WOULD BE: I. ROMAN NUMERAL, A. sub, 1) sub-sub, all caps L1 ──
        # ── Nature WOULD BE: freeform, bold for main sections ──
    },

    # ── CITATIONS ──
    "citations": {
        "style": "author-date",             # THE defining APA feature
        "format_parenthetical": "(Author, Year)",
        "format_narrative": "Author (Year)",
        "two_authors": "{Author1} & {Author2}",
        "three_plus_authors": "{FirstAuthor} et al.",
        "et_al_threshold": 3,
        "et_al_has_period": True,            # "et al." NOT "et al"
        "ampersand_in_parenthetical": True,  # & inside ()
        "and_in_narrative": True,            # "and" in running text
        "multiple_citation_separator": "; ",
        "multiple_citation_order": "alphabetical",
        "page_number_format": "p. {page}",  # for direct quotes
        "apa_section_ref": "§8.11, §8.17",
        # ── IEEE WOULD BE: numbered [1], [2]-[4], order of appearance ──
        # ── Nature WOULD BE: superscript numbered 1,2, order of appearance ──
    },

    # ── REFERENCES ──
    "references": {
        "label_text": "References",
        "label_bold": True,
        "label_centered": True,
        "separate_page": True,
        "ordering": "alphabetical_by_first_author",
        "hanging_indent": True,
        "hanging_indent_inches": 0.5,
        "hanging_indent_dxa": 720,
        "double_spaced": True,
        "author_format": "Last, F. M.",     # periods after initials
        "author_separator": ", ",
        "author_last_separator": ", & ",     # ampersand before last
        "max_authors_before_ellipsis": 20,   # list up to 20
        "year_format": "({year}).",
        "article_title_case": "Sentence case",
        "journal_title_case": "Title Case",
        "journal_title_italic": True,
        "volume_italic": True,
        "issue_in_parentheses": True,
        "issue_italic": False,
        "page_range_separator": "–",         # en-dash, NOT hyphen
        "doi_format": "https://doi.org/{doi}",
        "apa_section_ref": "§9.4, §9.43",

        # ── REFERENCE TYPE TEMPLATES ──
        "templates": {
            "journal": "{authors} ({year}). {title}. *{journal}*, *{volume}*({issue}), {pages}. {doi}",
            "book": "{authors} ({year}). *{title}*. {publisher}. {doi}",
            "chapter": "{authors} ({year}). {chapter_title}. In {editors} (Eds.), *{book_title}* (pp. {pages}). {publisher}. {doi}",
            "website": "{authors} ({year}, {month} {day}). *{title}*. {site_name}. {url}",
        },
        # ── IEEE WOULD BE: numbered [1], order of citation, no hanging indent ──
        # ── Nature WOULD BE: numbered, abbreviated journal, no italic ──
    },

    # ── FIGURES ──
    "figures": {
        "label_prefix": "Figure",            # NOT "Fig."
        "label_bold": True,
        "label_italic": False,
        "caption_italic": True,
        "caption_position": "below",
        "label_flush_left": True,
        "sequential_numbering": True,
        "apa_section_ref": "§7.22",
        # ── IEEE WOULD BE: "Fig." prefix, caption below, centered ──
    },

    # ── TABLES ──
    "tables": {
        "label_prefix": "Table",
        "label_bold": True,
        "label_italic": False,
        "caption_italic": True,
        "caption_position": "above",
        "label_flush_left": True,
        "sequential_numbering": True,
        "apa_section_ref": "§7.4",
    },

    # ── BODY TEXT ──
    "body": {
        "first_page_starts_with": "title_repeated",  # APA §2.11
        "introduction_label": "none",        # intro has NO "Introduction" heading
        "imrad_required": True,              # Intro/Method/Results/Discussion
        "apa_section_ref": "§2.11, §2.27",
        # ── IEEE WOULD BE: starts with "I. Introduction" heading ──
        # ── Nature WOULD BE: no IMRAD requirement ──
    },

    # ── VALIDATION WEIGHTS ──
    "validation": {
        "weights": {
            "citations": 0.25,
            "references": 0.25,
            "headings": 0.15,
            "document_format": 0.10,
            "abstract": 0.10,
            "figures": 0.075,
            "tables": 0.075,
        },
        "pass_threshold": 80,
    },
}


# ─────────────────────────────────────────────────────────────────
# SECTION 1: PREPROCESSOR (GENERIC — same for all formats)
# ─────────────────────────────────────────────────────────────────
# This runs in crew.py BEFORE Agent 1. It is NOT format-specific.
# It fixes PDF extraction artifacts that affect ALL formats.
# ─────────────────────────────────────────────────────────────────

PREPROCESSOR_CODE = """
def merge_broken_lines(raw_text: str) -> str:
    '''
    GENERIC PREPROCESSOR — works for all formats.
    Merges broken PDF lines into proper paragraphs.
    '''
    lines = raw_text.split('\\n')
    merged = []
    buffer = ""
    
    for line in lines:
        stripped = line.strip()
        
        if not stripped:
            if buffer:
                merged.append(buffer)
                buffer = ""
            merged.append("")
            continue
        
        if not buffer:
            buffer = stripped
            continue
        
        # Hyphenated word break: "entero-" + "hemorrhagic"
        if buffer.endswith('-') and stripped[0].islower():
            buffer = buffer[:-1] + stripped
        # Continuation: no sentence-end + lowercase start
        elif (buffer[-1] not in '.?!:' and 
              stripped[0].islower() or stripped[0] in '(,;'):
            buffer = buffer + " " + stripped
        else:
            merged.append(buffer)
            buffer = stripped
    
    if buffer:
        merged.append(buffer)
    
    return '\\n'.join(merged)
"""


# ─────────────────────────────────────────────────────────────────
# SECTION 2: AGENT 1 — INGEST (GENERIC — same for all formats)
# ─────────────────────────────────────────────────────────────────
# Labels structural elements. Does NOT apply format rules.
# The labels are universal: titles, headings, citations, refs
# exist in ALL academic formats — just styled differently.
# ─────────────────────────────────────────────────────────────────

AGENT1_INGEST_SYSTEM_PROMPT = """You are a scientific paper structure labeler. Your ONLY job is to read raw academic paper text and ADD structural labels WITHOUT changing any text.

## TASK
Insert structural marker labels at correct positions. Return the ENTIRE paper text with labels added.

## LABELS TO INSERT

[TITLE_START]...[TITLE_END]
- The main paper title. Join multi-line titles into one line.

[AUTHORS_START]...[AUTHORS_END]
- Author names + affiliations block. Include superscript markers and institution details.

[ABSTRACT_START]...[ABSTRACT_END]
- The abstract paragraph. Located between author info and main body.
- Do NOT include the "Significance" section (PNAS papers) in abstract.

[KEYWORDS_START]...[KEYWORDS_END]
- Keywords line. May use | or , or ; as separators.

[SIGNIFICANCE_START]...[SIGNIFICANCE_END]
- Significance statement if present (PNAS/Science papers).

[HEADING_H1:Exact Text]  — Major sections: Results, Discussion, Methods, etc.
[HEADING_H2:Exact Text]  — Subsection headings
[HEADING_H3:Exact Text]  — Sub-subsection headings (rare)

[FIGURE_CAPTION_START:N]...[FIGURE_CAPTION_END:N]  — Figure caption (N=number)
[TABLE_CAPTION_START:N]...[TABLE_CAPTION_END:N]    — Table caption (N=number)

[REFERENCE_START]...[REFERENCE_END]  — Entire reference list section

[CITATION:original_text]  — EVERY in-text citation occurrence

[METADATA_START]...[METADATA_END]  — Journal chrome: DOI, dates, page numbers
[ACKNOWLEDGMENTS_START]...[ACKNOWLEDGMENTS_END]
[AUTHOR_CONTRIBUTIONS_START]...[AUTHOR_CONTRIBUTIONS_END]

## SOURCE DETECTION (insert once at top)
[CITATION_STYLE:numbered|author-date]
[SOURCE_FORMAT:NLM|APA|IEEE|Nature|other]
[SOURCE_JOURNAL:journal_name_if_detectable]

## RULES
1. NEVER modify text. Only ADD labels.
2. Every opened label MUST be closed.
3. Merge multi-line titles into single line between markers.
4. Merge hyphenated line breaks: "entero-\\nhemorrhagic" → "enterohemorrhagic"
5. If paper > 50,000 chars: first 40K + last 5K + [TRUNCATED]
"""

AGENT1_INGEST_USER_PROMPT = """Label this paper with structural markers. Follow ALL rules.

<paper>
{paper_content}
</paper>"""

# ── STEP 1 VALIDATION (run after Agent 1, before Agent 2) ──
AGENT1_VALIDATION = """
def validate_ingest(ingest_output: str) -> dict:
    '''Check Agent 1 output has required labels.'''
    checks = {
        "has_title": "[TITLE_START]" in ingest_output and "[TITLE_END]" in ingest_output,
        "has_abstract": "[ABSTRACT_START]" in ingest_output and "[ABSTRACT_END]" in ingest_output,
        "has_references": "[REFERENCE_START]" in ingest_output and "[REFERENCE_END]" in ingest_output,
        "has_citation_style": "[CITATION_STYLE:" in ingest_output,
        "has_source_format": "[SOURCE_FORMAT:" in ingest_output,
        "citation_count": ingest_output.count("[CITATION:"),
        "heading_count": ingest_output.count("[HEADING_H"),
        "figure_count": ingest_output.count("[FIGURE_CAPTION_START:"),
    }
    checks["passed"] = all([
        checks["has_title"],
        checks["has_abstract"],
        checks["has_references"],
        checks["has_citation_style"],
        checks["citation_count"] > 0,
    ])
    return checks
"""


# ─────────────────────────────────────────────────────────────────
# SECTION 3: AGENT 2 — PARSE (GENERIC — same for all formats)
# ─────────────────────────────────────────────────────────────────
# Extracts structured JSON from labeled text.
# Generic because the JSON schema is the same regardless of
# whether the final output is APA, IEEE, or Nature.
# ─────────────────────────────────────────────────────────────────

AGENT2_PARSE_SYSTEM_PROMPT = """You are a structured data extractor. Parse the labeled paper into JSON.

## OUTPUT SCHEMA
Return ONLY valid JSON matching this structure:
{
  "metadata": {
    "citation_style": "numbered|author-date",
    "source_format": "NLM|APA|IEEE|Nature|other",
    "source_journal": "journal name"
  },
  "title": "Full title as single string",
  "authors": [
    {"name": "Full Name", "affiliations": ["a"], "is_corresponding": false}
  ],
  "affiliations": [
    {"key": "a", "text": "Department, University, City, Country"}
  ],
  "abstract": {
    "text": "Full abstract as single paragraph",
    "word_count": 150
  },
  "keywords": ["keyword1", "keyword2"],
  "sections": [
    {
      "heading": "Section Title",
      "level": 1,
      "content": "Complete section text with paragraphs preserved",
      "subsections": [
        {"heading": "Subsection", "level": 2, "content": "..."}
      ]
    }
  ],
  "figures": [{"number": 1, "caption": "Full caption"}],
  "tables": [{"number": 1, "caption": "Full caption"}],
  "citations_found": [
    {"id": "1", "original_text": "(1)", "context_snippet": "5 words around it"}
  ],
  "references": [
    {
      "id": "1",
      "original_text": "Complete reference as written",
      "parsed": {
        "authors": [{"last": "Smith", "initials": "AB"}],
        "year": 2020,
        "title": "Article title",
        "journal": "Journal Name",
        "volume": "10",
        "issue": "2",
        "pages": "100-110",
        "doi": "10.xxxx/yyyy"
      }
    }
  ],
  "acknowledgments": "text or null",
  "author_contributions": "text or null"
}

## RULES
1. NEVER truncate text in content fields — preserve everything verbatim.
2. Parse EVERY reference into components (authors, year, title, journal...).
3. Map each citation ID to its reference.
4. Count abstract words.
5. Return ONLY JSON. No markdown, no backticks, no explanation.
"""

AGENT2_PARSE_USER_PROMPT = """Parse this labeled paper:

<labeled_paper>
{ingest_output}
</labeled_paper>"""

# ── STEP 2 VALIDATION (run after Agent 2, before Agent 3) ──
AGENT2_VALIDATION = """
import json

def validate_parse(parse_output_str: str) -> dict:
    '''Check Agent 2 output is valid JSON with required fields.'''
    try:
        data = json.loads(parse_output_str)
    except json.JSONDecodeError as e:
        return {"passed": False, "error": f"Invalid JSON: {e}"}
    
    checks = {
        "has_title": bool(data.get("title")),
        "has_abstract": bool(data.get("abstract", {}).get("text")),
        "has_sections": len(data.get("sections", [])) > 0,
        "has_references": len(data.get("references", [])) > 0,
        "has_citations": len(data.get("citations_found", [])) > 0,
        "references_parsed": all(
            "parsed" in ref and "authors" in ref["parsed"]
            for ref in data.get("references", [])
        ),
        "reference_count": len(data.get("references", [])),
        "citation_count": len(data.get("citations_found", [])),
        "abstract_word_count": data.get("abstract", {}).get("word_count", 0),
        "source_format": data.get("metadata", {}).get("source_format", "unknown"),
    }
    checks["passed"] = all([
        checks["has_title"],
        checks["has_abstract"],
        checks["has_sections"],
        checks["has_references"],
        checks["references_parsed"],
    ])
    return checks
"""


# ═══════════════════════════════════════════════════════════════════
# SECTION 4: AGENT 3 — TRANSFORM  ★ APA-SPECIFIC ★
# ═══════════════════════════════════════════════════════════════════
# THIS IS THE HEART OF APA FORMATTING.
# Every single rule below is specific to APA 7th Edition.
# For IEEE/Nature: write a completely different TRANSFORM prompt.
# ═══════════════════════════════════════════════════════════════════

AGENT3_TRANSFORM_APA7_SYSTEM_PROMPT = """You are an APA 7th Edition formatting engine. You receive a parsed paper JSON and transform it into a fully APA-compliant document with DOCX rendering instructions.

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
"""

AGENT3_TRANSFORM_APA7_USER_PROMPT = """Transform this paper to APA 7th Edition format. Convert ALL citations and references.

<parsed_paper>
{parse_output}
</parsed_paper>

<target_format>APA 7th Edition</target_format>"""

# ── STEP 3 VALIDATION (run after Agent 3, before Agent 4) ──
AGENT3_VALIDATION_APA7 = """
import json

def validate_transform_apa7(transform_output_str: str, parse_data: dict) -> dict:
    '''APA-SPECIFIC validation of TRANSFORM output.'''
    try:
        data = json.loads(transform_output_str)
    except json.JSONDecodeError as e:
        return {"passed": False, "error": f"Invalid JSON: {e}"}
    
    instructions = data.get("docx_instructions", {})
    sections = instructions.get("sections", [])
    
    checks = {
        # ── FORMAT IDENTITY ──
        "format_is_apa7": data.get("format_applied") == "APA 7th Edition",
        "format_id_correct": instructions.get("format_id") == "apa7",
        
        # ── DOCUMENT SETTINGS ──
        "font_correct": instructions.get("font") == "Times New Roman",
        "font_size_correct": instructions.get("font_size_halfpoints") == 24,
        "line_spacing_correct": instructions.get("line_spacing_twips") == 480,
        "indent_correct": instructions.get("body_first_line_indent_dxa") == 720,
        "alignment_correct": instructions.get("alignment") == "left",
        "page_width_correct": instructions.get("page_size", {}).get("width") == 12240,
        "page_height_correct": instructions.get("page_size", {}).get("height") == 15840,
        
        # ── SECTIONS EXIST ──
        "has_sections": len(sections) > 0,
        "has_title_page": any(s["type"] == "title_page" for s in sections),
        "has_abstract_page": any(s["type"] == "abstract_page" for s in sections),
        "has_body": any(s["type"] == "body" for s in sections),
        "has_references_page": any(s["type"] == "references_page" for s in sections),
        
        # ── SECTION ORDER ──
        "correct_order": (
            [s["type"] for s in sections] ==
            ["title_page", "abstract_page", "body", "references_page"]
        ) if len(sections) == 4 else False,
        
        # ── CITATIONS CONVERTED ──
        "has_citation_replacements": len(data.get("citation_replacements", [])) > 0,
        "citation_count": len(data.get("citation_replacements", [])),
        "no_numbered_citations_remain": not any(
            r["replacement"].startswith("(") and r["replacement"][1:].split(")")[0].isdigit()
            for r in data.get("citation_replacements", [])
        ),
        
        # ── REFERENCES CONVERTED ──
        "has_reference_conversions": len(data.get("reference_conversions", [])) > 0,
        "reference_count": len(data.get("reference_conversions", [])),
        "references_alphabetical": _check_alphabetical(data.get("reference_order", [])),
        
        # ── APA-SPECIFIC CHECKS ──
        "references_have_hanging_indent": all(
            el.get("hanging_indent") == True
            for s in sections if s["type"] == "references_page"
            for el in s.get("elements", []) if el.get("type") == "reference_entry"
        ),
        "abstract_no_indent": all(
            el.get("first_line_indent") == False
            for s in sections if s["type"] == "abstract_page"
            for el in s.get("elements", []) if el.get("type") == "abstract_body"
        ),
        "title_is_bold_centered": all(
            el.get("bold") == True and el.get("centered") == True
            for s in sections if s["type"] == "title_page"
            for el in s.get("elements", []) if el.get("type") == "title"
        ),
    }
    
    # Count critical failures
    critical_checks = [
        "font_correct", "font_size_correct", "line_spacing_correct",
        "has_title_page", "has_abstract_page", "has_body", "has_references_page",
        "has_citation_replacements", "has_reference_conversions",
    ]
    checks["critical_failures"] = [k for k in critical_checks if not checks.get(k)]
    checks["passed"] = len(checks["critical_failures"]) == 0
    
    return checks

def _check_alphabetical(refs):
    if len(refs) < 2:
        return True
    for i in range(len(refs) - 1):
        if refs[i].lower() > refs[i+1].lower():
            return False
    return True
"""


# ═══════════════════════════════════════════════════════════════════
# SECTION 5: AGENT 4 — VALIDATE  ★ APA-SPECIFIC ★
# ═══════════════════════════════════════════════════════════════════
# Scoring weights and check criteria are APA-specific.
# IEEE would have different weights (e.g., no abstract word limit check).
# ═══════════════════════════════════════════════════════════════════

AGENT4_VALIDATE_APA7_SYSTEM_PROMPT = """You are an APA 7th Edition compliance scorer. Score the transformed paper against 7 weighted checks.

## FORMAT: APA 7th Edition

## 7 COMPLIANCE CHECKS

### CHECK 1 — Citations (weight: 25%)
✓ ALL citations use author-date: (Author, Year)
✓ 2 authors: & in parenthetical, "and" in narrative
✓ 3+ authors: "et al." with period
✓ ZERO numbered citations remain — no (1), no [1], no superscripts
✓ Every citation has matching reference
Scoring: 100 base. -10 per numbered citation remaining. -5 per format error.

### CHECK 2 — References (weight: 25%)
✓ APA format: Author, F. M. (Year). Title. *Journal*, *Vol*(Issue), pages.
✓ Alphabetical order by first author
✓ Hanging indent specified
✓ "References" label: bold + centered
✓ & before last author
✓ Periods after initials
✓ en-dash for page ranges
✓ Every reference cited in text
Scoring: 100 base. -5 per format error. -10 per missing field.

### CHECK 3 — Headings (weight: 15%)
✓ H1: bold + centered + Title Case + NOT italic
✓ H2: bold + flush left + Title Case + NOT italic
✓ H3: bold + italic + flush left + Title Case
✓ IMRAD present (Introduction/Method/Results/Discussion)
Scoring: 100 base. -25 per missing IMRAD section. -10 per wrong heading format.

### CHECK 4 — Document Format (weight: 10%)
✓ font = "Times New Roman"
✓ font_size = 24 half-points (12pt)
✓ line_spacing = 480 twips (double)
✓ margins = 1440 DXA all sides
✓ page size = 12240 × 15840 (US Letter)
✓ body indent = 720 DXA (0.5")
✓ alignment = "left"
Scoring: 100 base. -15 per wrong setting.

### CHECK 5 — Abstract (weight: 10%)
✓ Word count ≤ 250
✓ "Abstract" label: bold + centered
✓ Body: no first-line indent
✓ Keywords present with italic label
Scoring: 100 base. -15 if over word limit. -10 per missing element.

### CHECK 6 — Figures (weight: 7.5%)
✓ "Figure N" label (not "Fig.")
✓ Label bold, caption italic
✓ Position: below figure
✓ Sequential numbering
Scoring: 100 base. -10 per violation.

### CHECK 7 — Tables (weight: 7.5%)
✓ "Table N" label bold, caption italic
✓ Position: above table
✓ Sequential numbering
Scoring: 100 base. -10 per violation.

## SCORING FORMULA
overall = (citations × 0.25) + (references × 0.25) + (headings × 0.15) + (doc_format × 0.10) + (abstract × 0.10) + (figures × 0.075) + (tables × 0.075)

submission_ready = overall ≥ 80

## WARNINGS (don't reduce score)
- >50% references older than 10 years
- >30% self-citations
- No DOIs in references

## OUTPUT
Return ONLY JSON with scores per check, overall_score, submission_ready, and summary.
"""

AGENT4_VALIDATE_APA7_USER_PROMPT = """Validate this APA 7th Edition transformation:

<transform_output>
{transform_output}
</transform_output>"""


# ═══════════════════════════════════════════════════════════════════
# SECTION 6: DOCX WRITER  ★ APA-SPECIFIC PARAMETERS ★
# ═══════════════════════════════════════════════════════════════════
# The writer SKELETON is generic (create doc, add sections, save).
# The PARAMETERS are format-specific (font, spacing, heading styles).
# ═══════════════════════════════════════════════════════════════════

DOCX_WRITER_APA7_CONFIG = {
    "description": """
    This config drives the DOCX writer for APA 7th Edition.
    The writer code reads these values — NOT hardcoded.
    To support IEEE: create DOCX_WRITER_IEEE_CONFIG with different values.
    """,

    # Document defaults
    "font": "Times New Roman",
    "font_size_pt": 12,
    "line_spacing": 2.0,
    "alignment": "LEFT",         # WD_ALIGN_PARAGRAPH.LEFT
    "margins_inches": 1.0,
    "page_width_inches": 8.5,
    "page_height_inches": 11,
    "first_line_indent_inches": 0.5,

    # Heading styles
    "heading_styles": {
        1: {"bold": True, "italic": False, "centered": True, "indent": False, "size_pt": 12, "color": "000000"},
        2: {"bold": True, "italic": False, "centered": False, "indent": False, "size_pt": 12, "color": "000000"},
        3: {"bold": True, "italic": True,  "centered": False, "indent": True,  "size_pt": 12, "color": "000000"},
    },

    # Abstract
    "abstract_label_bold": True,
    "abstract_label_centered": True,
    "abstract_body_indent": False,
    "keywords_label_italic": True,
    "keywords_indent": True,

    # References
    "references_label_bold": True,
    "references_label_centered": True,
    "reference_hanging_indent_inches": 0.5,

    # Figures & Tables
    "figure_label_bold": True,
    "figure_caption_italic": True,
    "table_label_bold": True,
    "table_caption_italic": True,

    # Page numbers
    "page_number_position": "header_right",
    "running_head": False,  # True for professional papers

    # What IEEE would change:
    # "font": "Times New Roman", "font_size_pt": 10,
    # "line_spacing": 1.0, "columns": 2,
    # "heading_styles": {1: {"bold": True, "centered": True, "case": "ALL_CAPS"}}
}


# ═══════════════════════════════════════════════════════════════════
# SECTION 7: FORMAT COMPARISON — What changes per publication style
# ═══════════════════════════════════════════════════════════════════

FORMAT_COMPARISON = """
┌──────────────────┬────────────────────┬────────────────────┬────────────────────┐
│ Feature          │ APA 7th            │ IEEE               │ Nature             │
├──────────────────┼────────────────────┼────────────────────┼────────────────────┤
│ Citation Style   │ (Author, Year)     │ [1], [2]-[4]       │ Superscript 1,2    │
│ Reference Order  │ Alphabetical       │ Order of citation  │ Order of citation  │
│ Reference Format │ Author, F.M. (Yr)  │ F.M. Author,       │ Author, F.M.       │
│ Font             │ Times New Roman    │ Times New Roman    │ Any serif          │
│ Font Size        │ 12pt               │ 10pt               │ ~8-9pt             │
│ Line Spacing     │ Double (2.0)       │ Single (1.0)       │ Single             │
│ Columns          │ 1                  │ 2                  │ 2                  │
│ Margins          │ 1" all sides       │ 0.75" all sides    │ Journal-specific   │
│ Title Page       │ Separate page      │ No (inline)        │ No (inline)        │
│ Abstract Page    │ Separate page      │ No (inline)        │ No (inline)        │
│ Abstract Label   │ Bold, centered     │ Bold, italic       │ Bold               │
│ Abstract Limit   │ 250 words          │ 150-250 words      │ 150 words          │
│ Keywords Label   │ "Keywords:" italic │ "Index Terms"      │ None               │
│ Heading L1       │ Bold, centered     │ I. ALL CAPS        │ Bold               │
│ Heading L2       │ Bold, flush left   │ A. Italic          │ Bold italic        │
│ Fig. Label       │ "Figure 1"         │ "Fig. 1"           │ "Fig. 1"           │
│ Fig. Caption     │ Below, italic      │ Below, centered    │ Below              │
│ Table Caption    │ Above, italic      │ Above              │ Above              │
│ Ref. Indent      │ Hanging 0.5"       │ [1] numbered       │ Numbered           │
│ Ref. Label       │ "References"       │ "References"       │ "References"       │
│ et al. threshold │ 3+ authors         │ 3+ authors (ref)   │ 3+ authors         │
│ DOI Format       │ https://doi.org/x  │ doi: x             │ https://doi.org/x  │
│ Body Indent      │ 0.5" first-line    │ None               │ None               │
│ Page Numbers     │ Top-right          │ Bottom-center      │ None in manuscript  │
│ IMRAD Required   │ Yes                │ No (flexible)      │ Yes                │
└──────────────────┴────────────────────┴────────────────────┴────────────────────┘

FILES THAT CHANGE PER FORMAT:
  • apa7_rules / ieee_rules / nature_rules    → Section 0
  • Agent 3 TRANSFORM prompt                   → Section 4
  • Agent 4 VALIDATE prompt                    → Section 5
  • DOCX_WRITER_CONFIG                         → Section 6

FILES THAT STAY THE SAME:
  • Preprocessor (merge_broken_lines)          → Section 1
  • Agent 1 INGEST prompt                      → Section 2
  • Agent 2 PARSE prompt                       → Section 3
  • DOCX writer skeleton code                  → Generic
"""


# ═══════════════════════════════════════════════════════════════════
# SECTION 8: PIPELINE FLOW WITH VALIDATION GATES
# ═══════════════════════════════════════════════════════════════════

PIPELINE_FLOW = """
INPUT: Raw paper text
  │
  ├── crew.py loads format config: apa7_rules (or ieee_rules, nature_rules)
  │
  ▼
STEP 0: PREPROCESS (generic)
  │ merge_broken_lines(raw_text) → cleaned text
  │ split_into_sections(cleaned) → sections dict
  │
  ▼
STEP 1: AGENT 1 — INGEST (generic prompt)
  │ Input:  cleaned text
  │ Output: labeled text with [TITLE], [HEADING], [CITATION], etc.
  │
  ├── ★ GATE 1: validate_ingest() ★
  │   ✓ Has [TITLE_START/END]?
  │   ✓ Has [ABSTRACT_START/END]?
  │   ✓ Has [REFERENCE_START/END]?
  │   ✓ Has [CITATION_STYLE:]?
  │   ✓ Citation count > 0?
  │   → FAIL? Retry Agent 1 with error feedback.
  │
  ▼
STEP 2: AGENT 2 — PARSE (generic prompt)
  │ Input:  labeled text
  │ Output: structured JSON (title, authors, sections, citations, refs)
  │
  ├── ★ GATE 2: validate_parse() ★
  │   ✓ Valid JSON?
  │   ✓ Has title, abstract, sections, references?
  │   ✓ All references have parsed components?
  │   ✓ Citation count matches Step 1?
  │   → FAIL? Retry Agent 2 with error feedback.
  │
  ▼
STEP 3: AGENT 3 — TRANSFORM (★ APA-SPECIFIC PROMPT ★)
  │ Input:  parsed JSON + apa7_rules
  │ Output: violations[] + citation_replacements[] + reference_conversions[] + docx_instructions{}
  │
  ├── ★ GATE 3: validate_transform_apa7() ★
  │   ✓ format_id = "apa7"?
  │   ✓ font = "Times New Roman", size = 24 halfpoints?
  │   ✓ line_spacing = 480 twips?
  │   ✓ Has title_page, abstract_page, body, references_page?
  │   ✓ Correct section order?
  │   ✓ Citations converted (count > 0)?
  │   ✓ References converted (count > 0)?
  │   ✓ Hanging indent on references?
  │   ✓ Abstract has no first-line indent?
  │   → FAIL? Retry Agent 3 with specific failures listed.
  │
  ▼
STEP 4: AGENT 4 — VALIDATE (★ APA-SPECIFIC PROMPT ★)
  │ Input:  transform output
  │ Output: 7-check weighted score + submission_ready
  │
  ├── ★ GATE 4: score ≥ 80? ★
  │   → If < 80: return score + issues to user, suggest fixes
  │   → If ≥ 80: proceed to DOCX generation
  │
  ▼
STEP 5: DOCX WRITER (generic skeleton + ★ APA config ★)
  │ Input:  docx_instructions from Step 3 + DOCX_WRITER_APA7_CONFIG
  │ Output: formatted .docx file
  │
  ├── ★ GATE 5: Post-generation check ★
  │   ✓ File is valid .docx (can be opened)?
  │   ✓ Page count > 0?
  │   ✓ Font in styles.xml = "Times New Roman"?
  │   ✓ Line spacing in styles.xml = 480?
  │   → FAIL? Log error, return partial result.
  │
  ▼
OUTPUT: APA-formatted .docx file + validation report
"""