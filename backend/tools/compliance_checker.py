"""
Deterministic compliance checker — Python-only scoring independent of LLM output.

The LLM (validate agent) handles subjective checks (style quality, content).
This module handles checks that can be computed exactly from the paper_structure
and journal rules, producing scores that are always identical for the same input.

Checks implemented:
  1. Abstract Word Count   — exact (word count vs max_words)
  2. Citation Format Match — regex pattern match per journal format
  3. Reference Ordering    — alphabetical sort check (APA, Chicago, Springer)
"""
import re
from dataclasses import dataclass, field
from typing import Optional

from tools.logger import get_logger

logger = get_logger(__name__)

# Maps each deterministic check to the breakdown section it overrides
_CHECK_TO_SECTION = {
    "abstract_word_count":   "abstract",
    "citation_format":       "citations",
    "citation_consistency":  "citations",
    "reference_ordering":    "references",
}

# Citation format regex patterns — keyed by journal rules.citations.style value
_CITATION_PATTERNS: dict[str, re.Pattern] = {
    "numbered":     re.compile(r"^\[?\d+\]?$"),
    "author_date":  re.compile(r"^\(?[A-Z][a-z]+[\w\s\-&,\.]{0,60}\d{4}[a-z]?\)?$"),
    "author-date":  re.compile(r"^\(?[A-Z][a-z]+[\w\s\-&,\.]{0,60}\d{4}[a-z]?\)?$"),
}


@dataclass
class DeterministicCheck:
    """Result of a single deterministic compliance check."""
    check_id: str           # internal key (maps to breakdown section)
    section: str            # breakdown section overridden
    check_name: str         # human-readable name shown in UI
    score: int              # 0–100, deterministic
    passed: bool
    issue: Optional[str]    # added to section.issues if not passed
    detail: str             # always shown (pass or fail)
    rule_reference: str


def run_deterministic_checks(
    paper_structure: dict,
    rules: dict,
) -> list[DeterministicCheck]:
    """
    Run all deterministic compliance checks.

    Args:
        paper_structure: JSON output from the parse agent.
        rules: Journal rules dict (from rules/*.json).

    Returns:
        List of DeterministicCheck results. Empty if paper_structure is unusable.
    """
    results: list[DeterministicCheck] = []

    try:
        results += _check_abstract_word_count(paper_structure, rules)
    except Exception as e:
        logger.warning("[CHECKER] abstract_word_count failed: %s", e)

    try:
        results += _check_citation_format(paper_structure, rules)
    except Exception as e:
        logger.warning("[CHECKER] citation_format failed: %s", e)

    try:
        results += _check_reference_ordering(paper_structure, rules)
    except Exception as e:
        logger.warning("[CHECKER] reference_ordering failed: %s", e)

    try:
        results += _check_citation_consistency(paper_structure, rules)
    except Exception as e:
        logger.warning("[CHECKER] citation_consistency failed: %s", e)

    logger.info(
        "[CHECKER] %d deterministic checks run — passed=%d failed=%d",
        len(results),
        sum(1 for c in results if c.passed),
        sum(1 for c in results if not c.passed),
    )
    return results


def apply_deterministic_checks(
    compliance_report: dict,
    checks: list[DeterministicCheck],
    section_weights: dict,
) -> dict:
    """
    Override LLM scores in compliance_report with deterministic check results.

    For each check:
      - Sets breakdown[section].score to the deterministic value
      - Marks the section as verified (adds "verified": True)
      - Appends the issue to breakdown[section].issues if not passed
      - Removes any LLM-generated issue for the same topic if the check passed

    After all overrides, recomputes overall_score using section_weights.

    Args:
        compliance_report: Parsed compliance report from validate agent.
        checks: Results from run_deterministic_checks().
        section_weights: SECTION_WEIGHTS dict from validate_agent (sums to 1.0).

    Returns:
        Updated compliance_report dict.
    """
    if not checks:
        return compliance_report

    breakdown = compliance_report.setdefault("breakdown", {})

    for check in checks:
        section_data = breakdown.setdefault(check.section, {"score": 50, "issues": []})
        issues = section_data.setdefault("issues", [])

        # Override score with deterministic value
        old_score = section_data.get("score", "N/A")
        section_data["score"]    = check.score
        section_data["verified"] = True

        logger.info(
            "[CHECKER] %s: score overridden %s → %d (passed=%s)",
            check.section, old_score, check.score, check.passed,
        )

        if not check.passed and check.issue:
            # Prepend with [Verified] tag so it stands out in UI
            verified_issue = f"[Verified] {check.issue}"
            if verified_issue not in issues:
                issues.insert(0, verified_issue)
        elif check.passed:
            # Remove any LLM issues that contradict the passing deterministic check
            # (e.g. LLM said "abstract too long" but word count check says it passed)
            issues[:] = [
                i for i in issues
                if not _issue_contradicts_passing_check(i, check.check_id)
            ]
            # Add a concise confirmation for transparency
            issues.insert(0, f"[Verified] {check.detail}")

    # Recompute overall_score after overrides
    weighted_sum = 0.0
    total_weight = 0.0
    for section_key, weight in section_weights.items():
        section_data = breakdown.get(section_key, {})
        raw_score = section_data.get("score", 0)
        try:
            clamped = max(0, min(100, int(float(raw_score))))
        except (TypeError, ValueError):
            clamped = 0
        weighted_sum += clamped * weight
        total_weight += weight

    if total_weight > 0:
        new_overall = round(weighted_sum / total_weight)
        compliance_report["overall_score"] = max(0, min(100, new_overall))
        logger.info(
            "[CHECKER] overall_score recomputed: %s → %d",
            compliance_report.get("overall_score"), compliance_report["overall_score"],
        )

    # submission_ready threshold: 80+
    compliance_report["submission_ready"] = compliance_report["overall_score"] >= 80

    return compliance_report


# ─────────────────────────────────────────────────────────────────────────────
# Individual check implementations
# ─────────────────────────────────────────────────────────────────────────────

def _check_abstract_word_count(
    paper_structure: dict,
    rules: dict,
) -> list[DeterministicCheck]:
    """
    Check abstract length against rules.abstract.max_words.

    Score formula: 100 if within limit, else max(0, 100 - (over_by / max_words * 100))
    This produces a gradual penalty: 10% over limit → 90/100; 100% over → 0/100.
    """
    abstract = paper_structure.get("abstract", {})
    if isinstance(abstract, str):
        text = abstract
    elif isinstance(abstract, dict):
        text = abstract.get("text", "")
    else:
        return []

    max_words = rules.get("abstract", {}).get("max_words")
    if not text or not max_words:
        return []

    word_count = len(text.split())
    passed = word_count <= max_words
    over_by = max(0, word_count - max_words)

    if passed:
        score = 100
        detail = f"Abstract: {word_count} words — within {max_words}-word limit. ✓"
        issue = None
    else:
        penalty = min(1.0, over_by / max_words)
        score = max(0, round(100 * (1.0 - penalty)))
        detail = f"Abstract: {word_count} words — exceeds {max_words}-word limit by {over_by} words."
        issue = f"Abstract is {over_by} words over the {max_words}-word limit ({word_count} words total). Trim to comply."

    rule_ref = rules.get("abstract", {}).get("rule_ref", "Abstract §word-limit")

    return [DeterministicCheck(
        check_id="abstract_word_count",
        section="abstract",
        check_name="Abstract Word Count",
        score=score,
        passed=passed,
        issue=issue,
        detail=detail,
        rule_reference=rule_ref,
    )]


def _check_citation_format(
    paper_structure: dict,
    rules: dict,
) -> list[DeterministicCheck]:
    """
    Check that in-text citations match the journal's format (numbered or author_date).

    Collects citations from all sections' in_text_citations lists.
    Score = fraction of citations matching the expected pattern × 100.
    A score ≥ 90 is considered passing.
    """
    citations_rules = rules.get("citations", {})
    citation_format = citations_rules.get("format") or citations_rules.get("style")
    pattern = _CITATION_PATTERNS.get(citation_format) if citation_format else None
    if not pattern:
        return []  # Unknown format — skip deterministic check

    # Gather all in-text citations from sections
    all_citations: list[str] = []
    for section in paper_structure.get("sections", []):
        all_citations.extend(section.get("in_text_citations", []))

    if not all_citations:
        return []

    total = len(all_citations)
    matched = sum(1 for c in all_citations if pattern.match(c.strip()))
    ratio = matched / total
    score = round(ratio * 100)
    passed = ratio >= 0.90

    detail = (
        f"{matched}/{total} in-text citations match {citation_format} format "
        f"({score}% compliance)."
    )
    issue = (
        f"{total - matched} citations do not match the required {citation_format} "
        f"format. Review and reformat to comply."
        if not passed else None
    )
    rule_ref = rules.get("citations", {}).get("rule_ref", f"Citation format ({citation_format})")

    return [DeterministicCheck(
        check_id="citation_format",
        section="citations",
        check_name="Citation Format Match",
        score=score,
        passed=passed,
        issue=issue,
        detail=detail,
        rule_reference=rule_ref,
    )]


def _check_reference_ordering(
    paper_structure: dict,
    rules: dict,
) -> list[DeterministicCheck]:
    """
    Check that the reference list is in the correct order per journal rules.

    For alphabetical styles (APA, Chicago, Springer): compares first-author
    surnames to a sorted version. 100 if sorted, 40 if not.

    Numbered styles (IEEE, Vancouver) are skipped — ordering is by first
    appearance, which can't be verified from structure alone.
    """
    ordering = rules.get("references", {}).get("ordering", "alphabetical")
    if ordering != "alphabetical":
        return []  # Only check alphabetical styles deterministically

    refs = paper_structure.get("references", [])
    if isinstance(refs, dict):
        refs = refs.get("list", [])
    ref_texts = [r for r in refs if isinstance(r, str) and r.strip()]

    if len(ref_texts) < 2:
        return []  # Nothing to sort-check with fewer than 2 references

    # Extract first-author surnames: take text before first comma
    surnames = [r.split(",")[0].strip().lower() for r in ref_texts]
    is_sorted = surnames == sorted(surnames)

    if is_sorted:
        score = 100
        detail = f"Reference list is correctly sorted alphabetically ({len(ref_texts)} references). ✓"
        issue = None
    else:
        score = 40
        # Find the first out-of-order pair for a helpful message
        first_violation = next(
            (f"'{surnames[i]}' before '{surnames[i-1]}'"
             for i in range(1, len(surnames)) if surnames[i] < surnames[i-1]),
            "ordering violation detected",
        )
        detail = f"Reference list is NOT alphabetically ordered ({len(ref_texts)} refs). First violation: {first_violation}."
        issue = f"References must be alphabetically ordered by first author surname. {detail}"

    rule_ref = rules.get("references", {}).get("rule_ref", "Reference ordering (alphabetical)")

    return [DeterministicCheck(
        check_id="reference_ordering",
        section="references",
        check_name="Reference List Ordering",
        score=score,
        passed=is_sorted,
        issue=issue,
        detail=detail,
        rule_reference=rule_ref,
    )]


def _check_citation_consistency(
    paper_structure: dict,
    rules: dict,
) -> list[DeterministicCheck]:
    """
    Check citation ↔ reference bi-directional consistency.

    Orphan citations: cited in-text but have no matching reference entry.
    Uncited references: in reference list but never cited in-text.

    Uses first-author surname matching as the link key (robust to formatting
    differences between in-text style and reference list style).

    Score: 100 - (total_issues × 10), clamped to [0, 100].
    """
    # Extract in-text citation author surnames from sections
    in_text_surnames: set[str] = set()
    for section in paper_structure.get("sections", []):
        for citation in section.get("in_text_citations", []):
            # Extract first word that looks like a surname (capitalized, ≥2 chars)
            m = re.search(r"\b([A-Z][a-z]{1,})\b", citation)
            if m:
                in_text_surnames.add(m.group(1).lower())

    # Extract first-author surnames from reference list
    refs = paper_structure.get("references", [])
    if isinstance(refs, dict):
        refs = refs.get("list", [])
    ref_surnames: set[str] = set()
    for ref in refs:
        if isinstance(ref, str) and ref.strip():
            surname = ref.split(",")[0].strip().lower()
            if surname:
                ref_surnames.add(surname)

    # Skip check if no data (parse agent may not have extracted citations)
    if not in_text_surnames and not ref_surnames:
        return []

    orphans  = in_text_surnames - ref_surnames   # cited but no reference
    uncited  = ref_surnames - in_text_surnames   # reference but never cited
    total_issues = len(orphans) + len(uncited)

    score   = max(0, 100 - total_issues * 10)
    passed  = total_issues == 0

    if passed:
        detail = f"All {len(ref_surnames)} references have matching in-text citations. ✓"
        issue  = None
    else:
        parts = []
        if orphans:
            parts.append(f"orphan citations (no reference): {sorted(orphans)[:5]}")
        if uncited:
            parts.append(f"uncited references: {sorted(uncited)[:5]}")
        detail = f"Citation consistency issues: {'; '.join(parts)}."
        issue  = detail

    return [DeterministicCheck(
        check_id="citation_consistency",
        section="citations",
        check_name="Citation ↔ Reference Consistency",
        score=score,
        passed=passed,
        issue=issue,
        detail=detail,
        rule_reference="Citation traceability (all citations must have references)",
    )]


def _issue_contradicts_passing_check(issue_text: str, check_id: str) -> bool:
    """
    Heuristic: detect if an LLM-generated issue text is about a topic
    that our deterministic check has already confirmed passes.
    Only removes the LLM issue when there's a confident keyword match.
    """
    _KEYWORDS: dict[str, list[str]] = {
        "abstract_word_count":  ["abstract", "word", "word count", "250", "300", "words"],
        "reference_ordering":   ["alphabetical", "reference order", "sorted"],
        "citation_format":      ["citation format", "author-date", "numbered citation"],
        "citation_consistency": ["orphan", "uncited", "no matching reference", "consistency"],
    }
    keywords = _KEYWORDS.get(check_id, [])
    lower = issue_text.lower()
    return any(kw in lower for kw in keywords)
