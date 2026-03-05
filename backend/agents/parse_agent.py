from typing import Any

from crewai import Agent


def create_parse_agent(llm: Any) -> Agent:
    """
    Agent 2: PARSE — Detect paper structure and return paper_structure JSON.

    Uses Gemini at temperature=0 to identify all structural elements.
    Output MUST be valid JSON matching the paper_structure schema.
    Never loads rules, fixes violations, or scores compliance.

    Args:
        llm: Shared LLM instance (temperature=0).

    Returns:
        CrewAI Agent configured for structural parsing.
    """
    return Agent(
        role="Academic Paper Structure Parser",
        goal=(
            "Analyse the labelled document content and extract the complete "
            "paper structure as a JSON object with these exact keys: "
            "title (string), authors (list of strings), "
            "abstract (object with text and word_count), "
            "keywords (list of strings), "
            "imrad (object with introduction/methods/results/discussion as booleans), "
            "sections (list of objects: heading, level H1/H2/H3, content_preview, in_text_citations), "
            "figures (list of objects: id, caption), "
            "tables (list of objects: id, caption), "
            "references (list of full reference strings). "
            "Return ONLY valid JSON — no markdown fences, no explanation."
        ),
        backstory=(
            "You are a structural analysis expert in academic publishing. "
            "You have parsed thousands of research papers across all disciplines. "
            "You extract precise structural metadata — never guessing, always "
            "grounding your output in what the document actually contains. "
            "You output deterministic, parseable JSON every time."
        ),
        llm=llm,
        allow_delegation=False,
        verbose=True,
        max_iter=3,
    )
