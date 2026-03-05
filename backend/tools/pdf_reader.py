import fitz  # PyMuPDF


def extract_pdf_text(filepath: str) -> str:
    """
    Extract all text from a PDF file using PyMuPDF.

    Args:
        filepath: Absolute path to the PDF file.

    Returns:
        Concatenated text content from all pages, separated by newlines.

    Raises:
        ValueError: If file cannot be opened or contains no extractable text
                    (e.g., scanned/image-only PDF).
    """
    try:
        doc = fitz.open(filepath)
    except Exception as e:
        raise ValueError(f"Cannot open PDF: {e}") from e

    pages_text = []
    for page in doc:
        text = page.get_text()
        if text.strip():
            pages_text.append(text)

    doc.close()

    full_text = "\n".join(pages_text).strip()
    if not full_text:
        raise ValueError(
            "No extractable text found in PDF. "
            "This may be a scanned/image-only document."
        )

    return full_text
