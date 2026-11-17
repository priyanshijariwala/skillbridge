"""Tests for Day 8: Resume Parsing and AI Analysis."""
import io
from typing import Any, Dict
import docx
import pytest
from httpx import AsyncClient
from pypdf import PdfWriter

from app.core.errors import AppException
from app.integrations.ai.base import BaseAIProvider
from app.integrations.ai.providers.openai_provider import OpenAIProvider
from app.schemas.resume_analysis import ResumeAnalysisResult
from app.services.resume.extraction_service import DocumentExtractionService
from app.services.resume.text_cleaning_service import TextCleaningService
from tests.conftest import register_and_login  # noqa: F401

# ---------------------------------------------------------------------------
# Synthetic Document Fixtures
# ---------------------------------------------------------------------------

VALID_PDF_BYTES = (
    b"%PDF-1.4\n"
    b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
    b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
    b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n"
    b"4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
    b"5 0 obj\n<< /Length 130 >>\nstream\n"
    b"BT\n/F1 12 Tf\n50 700 Td\n(Alex Vance - Senior Backend Engineer with extensive experience in Python, FastAPI, and Docker systems) Tj\nET\n"
    b"endstream\nendobj\n"
    b"xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000317 00000 n \n"
    b"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n492\n%%EOF"
)


def make_valid_docx() -> bytes:
    doc = docx.Document()
    doc.add_heading("Alex Vance", 0)
    doc.add_paragraph("Senior Backend Engineer with 5 years experience in Python, FastAPI, and PostgreSQL.")
    table = doc.add_table(rows=1, cols=2)
    table.rows[0].cells[0].text = "Core Competencies"
    table.rows[0].cells[1].text = "Microservices, Distributed Systems, Redis, Docker"
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def make_blank_pdf() -> bytes:
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


MOCK_AI_ANALYSIS: Dict[str, Any] = {
    "overall_score": 85,
    "score_breakdown": {
        "content_quality": 84,
        "skills_presentation": 88,
        "experience_descriptions": 82,
        "structure_readability": 86,
        "ats_readability": 85,
    },
    "summary": "Strong technical profile with demonstrated backend architecture and microservices experience.",
    "extracted_data": {
        "headline": "Senior Backend Engineer",
        "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Redis"],
        "experience": [
            {
                "title": "Senior Software Engineer",
                "company": "Tech Innovations Inc.",
                "duration": "2022 - Present",
                "highlights": ["Designed distributed APIs handling 10k requests/sec"],
            }
        ],
        "education": [
            {
                "degree": "B.S. Computer Science",
                "institution": "Tech University",
                "graduation_year": 2020,
            }
        ],
        "projects": [
            {
                "name": "Cloud Gate",
                "description": "High performance API gateway",
                "technologies": ["Python", "FastAPI"],
            }
        ],
        "certifications": ["AWS Certified Solutions Architect"],
    },
    "strengths": [
        {
            "id": "str_1",
            "type": "strength",
            "title": "Clear Technical Leadership",
            "description": "Demonstrated ownership of high-concurrency microservices.",
        }
    ],
    "improvements": [
        {
            "id": "imp_1",
            "type": "improvement",
            "title": "Quantified Testing Ratios",
            "description": "Specify unit test coverage percentages.",
            "recommendation": "Mention test coverage figures (>85% with Pytest).",
        }
    ],
    "recommendations": [
        "Include CI/CD pipeline specifics in recent roles.",
        "Highlight database index tuning metrics.",
    ],
    "missing_information": [
        "Automated testing coverage percentage",
    ],
    "ats_observations": [
        "Standard header names are parseable by major ATS engines.",
        "High density of backend technical keywords.",
    ],
    "detected_skills": [
        {
            "id": "sk_1",
            "name": "Python",
            "category": "Languages",
            "status": "verified",
            "evidence_snippet": "Extensive experience in Python backend development",
        },
        {
            "id": "sk_2",
            "name": "FastAPI",
            "category": "Frameworks",
            "status": "verified",
            "evidence_snippet": "Designed APIs using FastAPI",
        },
    ],
    "recommended_roles": [
        "Senior Backend Engineer",
        "Distributed Systems Engineer",
    ],
}


class MockAIProvider(BaseAIProvider):
    def __init__(self, response_data: Dict[str, Any] = MOCK_AI_ANALYSIS) -> None:
        self.response_data = response_data

    @property
    def provider_name(self) -> str:
        return "mock"

    @property
    def model_name(self) -> str:
        return "mock-model"

    async def generate_json(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        return self.response_data


# ---------------------------------------------------------------------------
# Unit Tests: Extraction & Cleaning
# ---------------------------------------------------------------------------


class TestDocumentExtraction:
    def test_extract_valid_pdf(self):
        service = DocumentExtractionService()
        text = service.extract_text(VALID_PDF_BYTES, "pdf")
        assert len(text) >= 50
        assert "Alex Vance" in text
        assert "Python" in text

    def test_extract_valid_docx(self):
        service = DocumentExtractionService()
        docx_bytes = make_valid_docx()
        text = service.extract_text(docx_bytes, "docx")
        assert len(text) >= 50
        assert "Alex Vance" in text
        assert "PostgreSQL" in text
        assert "Microservices" in text

    def test_empty_or_scanned_pdf_rejected(self):
        service = DocumentExtractionService()
        blank_pdf = make_blank_pdf()
        with pytest.raises(AppException) as exc_info:
            service.extract_text(blank_pdf, "pdf")
        assert exc_info.value.code == "SCANNED_OR_EMPTY_DOCUMENT"

    def test_corrupted_pdf_rejected(self):
        service = DocumentExtractionService()
        corrupted = b"%PDF-1.4\nCorrupted content without valid xref structure"
        with pytest.raises(AppException) as exc_info:
            service.extract_text(corrupted, "pdf")
        assert exc_info.value.code == "CORRUPTED_DOCUMENT"

    def test_corrupted_docx_rejected(self):
        service = DocumentExtractionService()
        corrupted = b"PK\x03\x04not-a-valid-zip-content"
        with pytest.raises(AppException) as exc_info:
            service.extract_text(corrupted, "docx")
        assert exc_info.value.code == "CORRUPTED_DOCUMENT"

    def test_unsupported_file_type_rejected(self):
        service = DocumentExtractionService()
        with pytest.raises(AppException) as exc_info:
            service.extract_text(b"some content", "exe")
        assert exc_info.value.code == "UNSUPPORTED_FILE_TYPE"


class TestTextCleaning:
    def test_clean_text_normalizes_whitespace_and_lines(self):
        dirty = "\t\tAlex Vance\r\n\r\n\r\n\r\nSenior   Developer\t\t\n• Python\n● FastAPI"
        cleaned = TextCleaningService.clean_text(dirty)
        assert "Alex Vance" in cleaned
        assert "\r" not in cleaned
        assert "\n\n\n" not in cleaned
        assert "• Python" in cleaned
        assert "• FastAPI" in cleaned

    def test_clean_text_strips_null_bytes(self):
        text_with_null = "Hello\x00World\x08Resume"
        cleaned = TextCleaningService.clean_text(text_with_null)
        assert "\x00" not in cleaned
        assert "HelloWorldResume" == cleaned


# ---------------------------------------------------------------------------
# Unit Tests: AI Provider & Schema Validation
# ---------------------------------------------------------------------------


class TestAIProviderAndValidation:
    def test_validate_valid_ai_schema(self):
        result = ResumeAnalysisResult.model_validate(MOCK_AI_ANALYSIS)
        assert result.overall_score == 85
        assert result.score_breakdown.content_quality == 84
        assert len(result.strengths) == 1
        assert len(result.detected_skills) == 2

    def test_validate_missing_required_field_raises(self):
        bad_data = {**MOCK_AI_ANALYSIS}
        del bad_data["overall_score"]
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            ResumeAnalysisResult.model_validate(bad_data)

    @pytest.mark.asyncio
    async def test_unconfigured_openai_provider_raises_503(self):
        provider = OpenAIProvider(api_key=None)
        with pytest.raises(AppException) as exc_info:
            await provider.generate_json("system", "user")
        assert exc_info.value.status_code == 503
        assert exc_info.value.code == "AI_PROVIDER_NOT_CONFIGURED"


# ---------------------------------------------------------------------------
# Integration Tests: Resume Analysis Endpoints
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
class TestResumeAnalysisEndpoints:
    async def test_start_analysis_success(
        self, async_client_full: AsyncClient, monkeypatch: pytest.MonkeyPatch
    ):
        # Override AI provider to use MockAIProvider
        monkeypatch.setattr(
            "app.services.resume.resume_analysis_service.get_ai_provider",
            lambda: MockAIProvider(),
        )

        headers = await register_and_login(async_client_full, email="analyze@example.com")

        # 1. Upload valid PDF
        upload_resp = await async_client_full.post(
            "/api/v1/resumes",
            files={"file": ("resume.pdf", io.BytesIO(VALID_PDF_BYTES), "application/pdf")},
            headers=headers,
        )
        assert upload_resp.status_code == 201
        resume_id = upload_resp.json()["id"]

        # 2. Trigger analysis
        analyze_resp = await async_client_full.post(
            f"/api/v1/resumes/{resume_id}/analysis",
            headers=headers,
        )
        assert analyze_resp.status_code == 201
        data = analyze_resp.json()
        assert data["resume_id"] == resume_id
        assert data["overall_score"] == 85
        assert data["status"] == "completed"
        assert "score_breakdown" in data
        assert data["score_breakdown"]["content_quality"] == 84
        assert len(data["strengths"]) == 1
        assert len(data["detected_skills"]) == 2

        # 3. Verify get latest analysis endpoint returns the same record
        get_resp = await async_client_full.get(
            f"/api/v1/resumes/{resume_id}/analysis",
            headers=headers,
        )
        assert get_resp.status_code == 200
        assert get_resp.json()["id"] == data["id"]
        assert get_resp.json()["overall_score"] == 85

    async def test_start_analysis_docx_success(
        self, async_client_full: AsyncClient, monkeypatch: pytest.MonkeyPatch
    ):
        monkeypatch.setattr(
            "app.services.resume.resume_analysis_service.get_ai_provider",
            lambda: MockAIProvider(),
        )

        headers = await register_and_login(async_client_full, email="docx_analyze@example.com")
        docx_bytes = make_valid_docx()

        upload_resp = await async_client_full.post(
            "/api/v1/resumes",
            files={
                "file": (
                    "resume.docx",
                    io.BytesIO(docx_bytes),
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                )
            },
            headers=headers,
        )
        resume_id = upload_resp.json()["id"]

        analyze_resp = await async_client_full.post(
            f"/api/v1/resumes/{resume_id}/analysis",
            headers=headers,
        )
        assert analyze_resp.status_code == 201
        assert analyze_resp.json()["overall_score"] == 85

    async def test_analysis_cross_user_isolation(
        self, async_client_full: AsyncClient, monkeypatch: pytest.MonkeyPatch
    ):
        """User B cannot trigger or view User A's resume analysis."""
        monkeypatch.setattr(
            "app.services.resume.resume_analysis_service.get_ai_provider",
            lambda: MockAIProvider(),
        )

        headers_a = await register_and_login(async_client_full, email="usera@example.com")
        headers_b = await register_and_login(async_client_full, email="userb@example.com")

        # User A uploads resume
        upload_resp = await async_client_full.post(
            "/api/v1/resumes",
            files={"file": ("resume.pdf", io.BytesIO(VALID_PDF_BYTES), "application/pdf")},
            headers=headers_a,
        )
        resume_id = upload_resp.json()["id"]

        # User B attempts to trigger analysis on User A's resume -> 404
        post_b_resp = await async_client_full.post(
            f"/api/v1/resumes/{resume_id}/analysis",
            headers=headers_b,
        )
        assert post_b_resp.status_code == 404

        # User A triggers analysis
        await async_client_full.post(
            f"/api/v1/resumes/{resume_id}/analysis",
            headers=headers_a,
        )

        # User B attempts to fetch User A's analysis -> 404
        get_b_resp = await async_client_full.get(
            f"/api/v1/resumes/{resume_id}/analysis",
            headers=headers_b,
        )
        assert get_b_resp.status_code == 404

    async def test_get_analysis_not_yet_analyzed_returns_404(
        self, async_client_full: AsyncClient
    ):
        headers = await register_and_login(async_client_full, email="notyet@example.com")
        upload_resp = await async_client_full.post(
            "/api/v1/resumes",
            files={"file": ("resume.pdf", io.BytesIO(VALID_PDF_BYTES), "application/pdf")},
            headers=headers,
        )
        resume_id = upload_resp.json()["id"]

        resp = await async_client_full.get(
            f"/api/v1/resumes/{resume_id}/analysis",
            headers=headers,
        )
        assert resp.status_code == 404
        assert resp.json()["error"]["code"] == "ANALYSIS_NOT_FOUND"

    async def test_analysis_unauthenticated_returns_401(
        self, async_client_full: AsyncClient
    ):
        post_resp = await async_client_full.post("/api/v1/resumes/someid/analysis")
        assert post_resp.status_code == 401

        get_resp = await async_client_full.get("/api/v1/resumes/someid/analysis")
        assert get_resp.status_code == 401
