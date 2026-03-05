from docx import Document


def extract_docx_text(filepath: str) -> str:
    """
    Extract all text from a DOCX file using python-docx.

    Args:
        filepath: Absolute path to the DOCX file.

    Returns:
        Concatenated text content from all paragraphs, separated by newlines.

    Raises:
        ValueError: If file cannot be opened or contains no extractable text.
    """
    try:
        doc = Document(filepath)
    except Exception as e:
        raise ValueError(f"Cannot open DOCX: {e}") from e

    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    full_text = "\n".join(paragraphs).strip()

    if not full_text:
        raise ValueError("No extractable text found in DOCX.")

    return full_text
