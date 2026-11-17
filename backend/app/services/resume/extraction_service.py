import io
import logging
import zipfile
from fastapi import status
from pypdf import PdfReader
from pypdf.errors import PdfReadError
import docx

from app.core.errors import AppException
from app.services.resume.text_cleaning_service import TextCleaningService

logger = logging.getLogger(__name__)

# Minimum character count to distinguish valid text resumes from scanned/empty documents
MIN_MEANINGFUL_TEXT_LENGTH = 50


class DocumentExtractionService:
    """Extracts raw text from PDF and DOCX resume documents."""

    def __init__(self, cleaning_service: TextCleaningService | None = None) -> None:
        self.cleaning_service = cleaning_service or TextCleaningService()

    def extract_text(self, content: bytes, file_type: str) -> str:
        """
        Extract and clean text from raw file bytes.
        Validates structure and detects scanned/empty documents.
        Returns cleaned text.
        """
        norm_type = file_type.lower().lstrip(".")
        if norm_type == "pdf":
            raw_text = self._extract_pdf(content)
        elif norm_type == "docx":
            raw_text = self._extract_docx(content)
        else:
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                code="UNSUPPORTED_FILE_TYPE",
                message=f"Extraction does not support file format '{file_type}'.",
            )

        cleaned_text = self.cleaning_service.clean_text(raw_text)

        if len(cleaned_text) < MIN_MEANINGFUL_TEXT_LENGTH:
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                code="SCANNED_OR_EMPTY_DOCUMENT",
                message=(
                    "The uploaded document contains no readable text. If this is a scanned PDF "
                    "or image-based resume, please upload a text-based PDF or DOCX file."
                ),
            )

        return cleaned_text

    def _extract_pdf(self, content: bytes) -> str:
        try:
            reader = PdfReader(io.BytesIO(content))
        except PdfReadError as e:
            logger.warning("Corrupted PDF upload: %s", e)
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                code="CORRUPTED_DOCUMENT",
                message="The PDF file appears to be corrupted or invalid.",
            )
        except Exception as e:
            logger.warning("Failed to parse PDF: %s", e)
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                code="CORRUPTED_DOCUMENT",
                message="Failed to read the PDF document. Please verify the file.",
            )

        if reader.is_encrypted:
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                code="DOCUMENT_ENCRYPTED",
                message="The uploaded PDF is password-protected or encrypted. Please upload an unencrypted file.",
            )

        if len(reader.pages) == 0:
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                code="EMPTY_DOCUMENT",
                message="The PDF document has no pages.",
            )

        page_texts = []
        for i, page in enumerate(reader.pages):
            try:
                page_text = page.extract_text() or ""
                if page_text.strip():
                    page_texts.append(page_text)
            except Exception as e:
                logger.warning("Error extracting page %d of PDF: %s", i + 1, e)

        return "\n\n".join(page_texts)

    def _extract_docx(self, content: bytes) -> str:
        try:
            doc = docx.Document(io.BytesIO(content))
        except (zipfile.BadZipFile, docx.opc.exceptions.PackageNotFoundError) as e:
            logger.warning("Corrupted DOCX upload: %s", e)
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                code="CORRUPTED_DOCUMENT",
                message="The Word document (.docx) appears to be corrupted or invalid.",
            )
        except Exception as e:
            logger.warning("Failed to parse DOCX: %s", e)
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                code="CORRUPTED_DOCUMENT",
                message="Failed to read the Word document. Please verify the file.",
            )

        parts = []

        # Extract text from paragraphs
        for paragraph in doc.paragraphs:
            text = paragraph.text.strip()
            if text:
                parts.append(text)

        # Extract text from tables
        for table in doc.tables:
            for row in table.rows:
                row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_cells:
                    parts.append(" | ".join(row_cells))

        return "\n\n".join(parts)

