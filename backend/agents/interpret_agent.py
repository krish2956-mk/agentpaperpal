"""
Agent 3: INTERPRET — Load and return journal formatting rules verbatim.

This agent does NOT call the LLM to generate rules for supported journals.
Rules are loaded from rules/*.json via the load_journal_rules tool and returned
exactly as stored — no modification, no summarization.
"""
import json
import time
from typing import Any

from crewai import Agent
from crewai.tools import tool

from tools.logger import get_logger
from tools.rule_loader import load_rules as _load_rules
from tools.tool_errors import LLMResponseError, RuleLoadError  # noqa: F401 — available for callers

logger = get_logger(__name__)

# All 11 top-level keys that a valid rules JSON must contain (Improvement 3)
REQUIRED_INTERPRET_KEYS = [
    "style_name", "document", "title_page", "abstract", "headings",
    "citations", "references", "figures", "tables", "equations", "general_rules",
]

# In-memory cache so repeated runs don't re-read disk (Improvement 12)
_RULE_ENGINE_CACHE: dict[str, dict] = {}


@tool("Journal Rules Loader")
def load_journal_rules(journal_style: str) -> str:
    """
    Load the complete formatting rules for a specific journal style.

    Supported journals: APA 7th Edition, IEEE, Vancouver, Springer, Chicago.
    Returns exact JSON content from the rules file — no interpretation.
    Results are cached in-memory so repeated calls for the same journal
    avoid redundant disk reads (Improvement 12).

    Args:
        journal_style: Journal name (e.g., 'APA 7th Edition', 'IEEE', 'Vancouver').

    Returns:
        JSON string of the complete formatting rules.

    Raises:
        RuleLoadError: If journal is not supported or rules file is corrupted.
    """
    # Cache hit — skip disk read (Improvement 12)
    if journal_style in _RULE_ENGINE_CACHE:
        logger.info(
            "[INTERPRET] Cache hit — journal=%s (skipping disk read)", journal_style
        )
        return json.dumps(_RULE_ENGINE_CACHE[journal_style], indent=2)

    try:
        t0 = time.time()
        rules = _load_rules(journal_style)
        elapsed = time.time() - t0

        # Validate required keys (Improvement 3)
        _validate_interpret_output(rules)

        # Populate cache
        _RULE_ENGINE_CACHE[journal_style] = rules

        logger.info(
            "[INTERPRET] Rules loaded — journal=%s keys=%d elapsed=%.3fs",
            journal_style, len(rules), elapsed,
        )
        return json.dumps(rules, indent=2)
    except RuleLoadError:
        raise
    except Exception as e:
        raise RuleLoadError(str(e)) from e


def _validate_interpret_output(data: dict) -> None:
    """
    Validate that loaded rules contain all 11 required top-level keys.

    Args:
        data: Parsed rules dict.

    Raises:
        RuleLoadError: If required keys are missing.
        LLMResponseError: If data is not a dict.
    """
    if not isinstance(data, dict):
        raise LLMResponseError(
            f"Interpret output must be a JSON object (dict), got {type(data).__name__}"
        )
    missing = [k for k in REQUIRED_INTERPRET_KEYS if k not in data]
    if missing:
        raise RuleLoadError(
            f"Rules JSON missing required top-level keys: {missing}. "
            f"All 11 keys required: {REQUIRED_INTERPRET_KEYS}"
        )
    logger.info(
        "[INTERPRET] Rules validation passed — all %d required keys present",
        len(REQUIRED_INTERPRET_KEYS),
    )


def _safe_context(context: dict, key: str) -> Any:
    """
    Defensively access a required key from a pipeline context dict.

    Args:
        context: Pipeline context dictionary.
        key: Required key name.

    Returns:
        Value at context[key].

    Raises:
        ValueError: If key is absent.
    """
    if key not in context:
        raise ValueError(f"Pipeline context missing required key: '{key}'")
    return context[key]


def create_interpret_agent(llm: Any) -> Agent:
    """
    Agent 3: INTERPRET — Return exact journal rules JSON.

    Critical constraints:
      - Does NOT call LLM to generate rules for supported journals
      - Returns rules JSON exactly as loaded — no modification, no omission
      - Uses load_journal_rules @tool as authoritative source
      - Results are cached in _RULE_ENGINE_CACHE for repeated runs
      - Raises RuleLoadError for unsupported journals

    Required output keys (all 11 must be present):
      style_name, document, title_page, abstract, headings,
      citations, references, figures, tables, equations, general_rules

    Args:
        llm: Shared LLM string at temperature=0.

    Returns:
        CrewAI Agent configured for rule loading.
    """
    logger.info("[INTERPRET] Agent created")

    return Agent(
        role="Journal Formatting Rules Authority",
        goal=(
            "Load and return the exact formatting rules for the requested journal style. "
            "The rules are provided in your task context — return them exactly as-is.\n\n"
            "CRITICAL CONSTRAINTS:\n"
            "  1. Return the rules JSON EXACTLY as provided — zero modifications\n"
            "  2. Do NOT rewrite, reword, summarize, or interpret any rule values\n"
            "  3. Do NOT generate rules from memory — always use the loaded JSON\n"
            "  4. If rules are not in context, use the 'Journal Rules Loader' tool\n"
            "  5. For unsupported journals, raise RuleLoadError with supported journal list\n\n"
            "SUPPORTED JOURNALS:\n"
            "  APA 7th Edition | IEEE | Vancouver | Springer | Chicago\n\n"
            "REQUIRED OUTPUT — all 11 top-level keys must be present:\n"
            "  style_name, document, title_page, abstract, headings,\n"
            "  citations, references, figures, tables, equations, general_rules\n\n"
            "VALIDATION SELF-CHECK:\n"
            "  Before returning, confirm all 11 keys are present in your output.\n"
            "  If any key is missing, use the 'Journal Rules Loader' tool to reload.\n\n"
            "Return ONLY valid JSON — no markdown fences, no explanation, no commentary."
        ),
        backstory=(
            "You are the authoritative source for academic journal formatting rules in "
            "the Agent Paperpal pipeline. You have memorised the exact, official submission "
            "guidelines for all five supported journals: APA 7th Edition, IEEE style, "
            "Vancouver/ICMJE, Springer Basic, and Chicago Manual of Style. "
            "You never paraphrase or interpret — you retrieve and return the precise, "
            "machine-readable rules exactly as defined in the official guidelines. "
            "The Transform agent consumes your output directly to check every formatting "
            "element against journal requirements. Any modification to the rules — even a "
            "single value change — would cause incorrect formatting decisions downstream. "
            "Your job is retrieval, not interpretation. "
            "Rules are cached in memory — if you have already loaded the rules for a journal "
            "in this session, the cached version is returned instantly without disk access, "
            "making repeated runs significantly faster during hackathon demos."
        ),
        llm=llm,
        tools=[load_journal_rules],
        allow_delegation=False,
        verbose=True,
        max_iter=3,
    )
