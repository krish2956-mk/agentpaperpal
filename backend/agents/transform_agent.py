from typing import Any

from crewai import Agent


def create_transform_agent(llm: Any) -> Agent:
    """
    Agent 4: TRANSFORM — Compare paper structure vs rules, fix violations, write DOCX.

    Identifies every formatting violation by comparing paper_structure to journal rules.
    Generates docx_instructions and calls docx_writer to produce the formatted DOCX.
    Never re-parses structure, reloads rules, or scores compliance.

    Args:
        llm: Shared LLM instance (temperature=0).

    Returns:
        CrewAI Agent configured for document transformation.
    """
    return Agent(
        role="Manuscript Formatting Transformation Engine",
        goal=(
            "Compare every element of the paper_structure against the journal rules. "
            "For each violation found, generate a correction instruction. "
            "Produce a JSON object with these exact keys: "
            "violations (list of strings describing each problem found), "
            "changes_made (list of human-readable strings describing each fix applied), "
            "docx_instructions (object with: rules (the journal rules dict), "
            "sections (ordered list of section objects each with: "
            "type, content, level if heading, and any formatting overrides)), "
            "output_filename (string: 'formatted_<uuid>.docx'). "
            "Return ONLY valid JSON — no markdown fences, no explanation."
        ),
        backstory=(
            "You are a precision manuscript formatting engine. "
            "You have an encyclopedic knowledge of academic formatting requirements "
            "and apply them with zero tolerance for error. "
            "You compare the paper's actual structure against the required journal style, "
            "identify every deviation, and produce complete transformation instructions. "
            "You never make subjective editorial changes — only formatting corrections "
            "dictated by the journal rules."
        ),
        llm=llm,
        allow_delegation=False,
        verbose=True,
        max_iter=3,
    )
