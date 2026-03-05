import os
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement


def write_formatted_docx(instructions: dict, output_path: str) -> str:
    """
    Write a formatted DOCX file from structured docx_instructions.

    Args:
        instructions: Dict produced by the transform agent containing:
            - rules: journal rules dict
            - sections: list of { type, content, level, bold, italic, centered, ... }
        output_path: Absolute path where the DOCX should be saved.

    Returns:
        output_path on success.

    Raises:
        ValueError: If instructions are malformed.
    """
    doc = Document()
    rules = instructions.get("rules", {})
    sections = instructions.get("sections", [])

    doc_rules = rules.get("document", {})
    font_name = doc_rules.get("font", "Times New Roman")
    font_size = doc_rules.get("font_size", 12)
    line_spacing = doc_rules.get("line_spacing", 2.0)
    margins = doc_rules.get("margins", {})

    _set_document_margins(doc, margins)

    for section in sections:
        section_type = section.get("type", "paragraph")
        content = section.get("content", "")

        if section_type == "title":
            _add_title(doc, content, font_name, font_size)
        elif section_type == "heading":
            level = section.get("level", 1)
            heading_rules = rules.get("headings", {}).get(f"H{level}", {})
            _add_heading(doc, content, level, heading_rules, font_name, font_size)
        elif section_type == "abstract":
            abstract_rules = rules.get("abstract", {})
            _add_abstract(doc, content, abstract_rules, font_name, font_size, line_spacing)
        elif section_type == "reference":
            ref_rules = rules.get("references", {})
            _add_reference(doc, content, ref_rules, font_name, font_size)
        elif section_type == "figure_caption":
            fig_rules = rules.get("figures", {})
            _add_figure_caption(doc, content, fig_rules, font_name, font_size)
        elif section_type == "table_caption":
            tbl_rules = rules.get("tables", {})
            _add_table_caption(doc, content, tbl_rules, font_name, font_size)
        else:
            _add_paragraph(doc, content, font_name, font_size, line_spacing)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc.save(output_path)
    return output_path


def _set_document_margins(doc: Document, margins: dict) -> None:
    for section in doc.sections:
        top = margins.get("top", 1.0)
        bottom = margins.get("bottom", 1.0)
        left = margins.get("left", 1.0)
        right = margins.get("right", 1.0)
        section.top_margin = Inches(top)
        section.bottom_margin = Inches(bottom)
        section.left_margin = Inches(left)
        section.right_margin = Inches(right)


def _apply_font(run, font_name: str, font_size: int, bold: bool = False, italic: bool = False) -> None:
    run.font.name = font_name
    run.font.size = Pt(font_size)
    run.font.bold = bold
    run.font.italic = italic


def _add_paragraph(doc: Document, text: str, font_name: str, font_size: int, line_spacing: float) -> None:
    para = doc.add_paragraph()
    run = para.add_run(text)
    _apply_font(run, font_name, font_size)
    para.paragraph_format.line_spacing = line_spacing


def _add_title(doc: Document, text: str, font_name: str, font_size: int) -> None:
    para = doc.add_paragraph()
    para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = para.add_run(text)
    _apply_font(run, font_name, font_size + 2, bold=True)


def _add_heading(doc: Document, text: str, level: int, heading_rules: dict, font_name: str, font_size: int) -> None:
    para = doc.add_paragraph()
    bold = heading_rules.get("bold", True)
    italic = heading_rules.get("italic", False)
    centered = heading_rules.get("centered", False)
    case = heading_rules.get("case", "Title Case")

    if case == "UPPERCASE":
        text = text.upper()
    elif case == "Title Case":
        text = text.title()

    if centered:
        para.alignment = WD_ALIGN_PARAGRAPH.CENTER

    run = para.add_run(text)
    _apply_font(run, font_name, font_size, bold=bold, italic=italic)


def _add_abstract(doc: Document, text: str, abstract_rules: dict, font_name: str, font_size: int, line_spacing: float) -> None:
    label = abstract_rules.get("label", "Abstract")
    label_bold = abstract_rules.get("label_bold", False)
    centered = abstract_rules.get("label_centered", True)

    label_para = doc.add_paragraph()
    if centered:
        label_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    label_run = label_para.add_run(label)
    _apply_font(label_run, font_name, font_size, bold=label_bold)

    body_para = doc.add_paragraph()
    body_run = body_para.add_run(text)
    _apply_font(body_run, font_name, font_size)
    body_para.paragraph_format.line_spacing = line_spacing


def _add_reference(doc: Document, text: str, ref_rules: dict, font_name: str, font_size: int) -> None:
    para = doc.add_paragraph()
    hanging = ref_rules.get("hanging_indent", True)
    hanging_inches = ref_rules.get("hanging_indent_inches", 0.5)
    if hanging:
        para.paragraph_format.left_indent = Inches(hanging_inches)
        para.paragraph_format.first_line_indent = Inches(-hanging_inches)
    run = para.add_run(text)
    _apply_font(run, font_name, font_size)


def _add_figure_caption(doc: Document, text: str, fig_rules: dict, font_name: str, font_size: int) -> None:
    para = doc.add_paragraph()
    bold = fig_rules.get("label_bold", True)
    italic = fig_rules.get("caption_italic", False)
    run = para.add_run(text)
    _apply_font(run, font_name, font_size - 1, bold=bold, italic=italic)


def _add_table_caption(doc: Document, text: str, tbl_rules: dict, font_name: str, font_size: int) -> None:
    para = doc.add_paragraph()
    bold = tbl_rules.get("label_bold", True)
    run = para.add_run(text)
    _apply_font(run, font_name, font_size - 1, bold=bold)
