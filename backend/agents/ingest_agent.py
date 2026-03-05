from typing import Any

from crewai import Agent


def create_ingest_agent(llm: Any) -> Agent:
    """
    Agent 1: INGEST — Structure and label raw paper content.

    Receives raw extracted text and marks up each content element
    (title, abstract, headings, body paragraphs, references, figures, tables).
    This agent does NOT parse structure, apply rules, or write files.

    Args:
        llm: Shared LLM instance (temperature=0).

    Returns:
        CrewAI Agent configured for content ingestion.
    """
    return Agent(
        role="Document Content Ingestion Specialist",
        goal=(
            "Read the raw extracted paper text and label every content element "
            "with its type: TITLE, ABSTRACT, KEYWORD, HEADING_H1, HEADING_H2, "
            "HEADING_H3, BODY_PARAGRAPH, IN_TEXT_CITATION, FIGURE_CAPTION, "
            "TABLE_CAPTION, REFERENCE_ENTRY. "
            "Produce a clean, labeled version of the document content."
        ),
        backstory=(
            "You are a meticulous document analyst who reads raw academic paper "
            "text and identifies the role of every block of content. You never "
            "interpret formatting rules — you only label what is already there. "
            "Your output feeds into the structural parser."
        ),
        llm=llm,
        allow_delegation=False,
        verbose=True,
        max_iter=3,
    )
