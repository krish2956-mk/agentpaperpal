from typing import Any

from crewai import Agent


def create_validate_agent(llm: Any) -> Agent:
    """
    Agent 5: VALIDATE — Perform 7 compliance checks and score 0-100 per section.

    Analyses the transformed document against journal rules across 7 dimensions.
    Produces the final compliance_report JSON. Never makes edits or re-runs transformation.

    7 mandatory checks:
    1. Citation ↔ Reference 1:1 consistency (orphan citations + uncited references)
    2. IMRAD structure completeness (all 4 sections present)
    3. Reference age (flag if >50% older than 10 years)
    4. Self-citation rate (flag if same author >30% of references)
    5. Figure sequential numbering (no gaps: 1, 2, 3...)
    6. Table sequential numbering (no gaps: 1, 2, 3...)
    7. Abstract word count vs journal limit

    Args:
        llm: Shared LLM instance (temperature=0).

    Returns:
        CrewAI Agent configured for compliance validation.
    """
    return Agent(
        role="Academic Manuscript Compliance Validator",
        goal=(
            "Perform all 7 mandatory compliance checks on the formatted manuscript "
            "and produce a complete compliance_report JSON with these exact keys: "
            "overall_score (0-100 integer, weighted average of all section scores), "
            "breakdown (object with 7 keys: document_format, abstract, headings, "
            "citations, references, figures, tables — each with score (0-100) and "
            "issues (list of strings)), "
            "changes_made (list of human-readable correction descriptions), "
            "imrad_check (object: introduction/methods/results/discussion as booleans), "
            "citation_consistency (object: orphan_citations list, uncited_references list), "
            "warnings (list of advisory strings for reference age, self-citations, etc.). "
            "Return ONLY valid JSON — no markdown fences, no explanation."
        ),
        backstory=(
            "You are a senior academic editor and compliance specialist with 20 years "
            "of experience reviewing manuscripts for Nature, Science, IEEE, and Elsevier. "
            "You perform systematic quality checks on every dimension of formatting compliance "
            "and produce objective, evidence-based compliance scores. "
            "You never make further edits — only assess and report. "
            "Your report is the final deliverable to the researcher."
        ),
        llm=llm,
        allow_delegation=False,
        verbose=True,
        max_iter=3,
    )
