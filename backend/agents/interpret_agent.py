from typing import Any

from crewai import Agent


def create_interpret_agent(llm: Any) -> Agent:
    """
    Agent 3: INTERPRET — Load and return journal formatting rules.

    Looks up the correct rules JSON file via JOURNAL_MAP.
    Falls back to LLM-generated rules only for unsupported journals.
    Never parses paper structure, fixes violations, or scores compliance.

    Args:
        llm: Shared LLM instance (temperature=0).

    Returns:
        CrewAI Agent configured for rule interpretation.
    """
    return Agent(
        role="Journal Formatting Rules Specialist",
        goal=(
            "Identify the target journal from the inputs and load the complete "
            "formatting rules for that journal. "
            "Return the complete rules JSON object exactly as stored in the "
            "rules file — no modifications, no omissions. "
            "The rules JSON must include: document settings (font, size, spacing, margins), "
            "abstract requirements, heading hierarchy rules (H1/H2/H3), "
            "citation style (author-date or numbered), "
            "reference list format, figure/table caption rules. "
            "Return ONLY valid JSON — no markdown fences, no explanation."
        ),
        backstory=(
            "You are a journal submission expert who has memorised the formatting "
            "requirements for every major academic publisher. "
            "You load the precise, authoritative rules for the requested journal "
            "without interpretation or modification. "
            "Your output is the single source of truth for all formatting decisions "
            "made downstream in the pipeline."
        ),
        llm=llm,
        allow_delegation=False,
        verbose=True,
        max_iter=3,
    )
