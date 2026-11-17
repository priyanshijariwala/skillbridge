"""Resume API tests — Day 7."""
import io
import pytest
from httpx import AsyncClient

from tests.conftest import register_and_login

pytestmark = pytest.mark.asyncio

# ---------------------------------------------------------------------------
# Minimal valid file fixtures (real magic bytes)
# ---------------------------------------------------------------------------

MINIMAL_PDF = (
    b"%PDF-1.4\n"
    b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
    b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
    b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\n"
    b"xref\n0 4\n0000000000 65535 f \n"
    b"trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n9\n%%EOF"
)

# Minimal DOCX: a valid ZIP file with PK magic bytes
MINIMAL_DOCX = bytes([
    0x50, 0x4B, 0x03, 0x04,  # PK magic
    0x14, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00,
    # local file header + content placeholder
    *b"[Content_Types].xml\x00" + b"x" * 100,
])


def _pdf_file(name: str = "resume.pdf") -> dict:
    return {
        "file": (name, io.BytesIO(MINIMAL_PDF), "application/pdf"),
    }


def _docx_file(name: str = "resume.docx") -> dict:
    return {
        "file": (
            name,
            io.BytesIO(MINIMAL_DOCX),
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ),
    }


class TestResumeUpload:
    async def test_upload_pdf_success(self, async_client_full: AsyncClient):
        headers = await register_and_login(async_client_full, email="pdf@example.com")
        resp = await async_client_full.post(
            "/api/v1/resumes",
            files=_pdf_file(),
            headers=headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["file_type"] == "pdf"
        assert data["status"] == "uploaded"
        assert data["original_filename"] == "resume.pdf"
        assert "storage_key" not in data  # never expose internal path

    async def test_upload_docx_success(self, async_client_full: AsyncClient):
        headers = await register_and_login(async_client_full, email="docx@example.com")
        resp = await async_client_full.post(
            "/api/v1/resumes",
            files=_docx_file(),
            headers=headers,
        )
        assert resp.status_code == 201
        assert resp.json()["file_type"] == "docx"

    async def test_upload_unsupported_extension(self, async_client_full: AsyncClient):
        headers = await register_and_login(async_client_full, email="ext@example.com")
        resp = await async_client_full.post(
            "/api/v1/resumes",
            files={"file": ("resume.exe", io.BytesIO(b"MZ\x90\x00"), "application/octet-stream")},
            headers=headers,
        )
        assert resp.status_code == 400
        assert "UNSUPPORTED_FILE_TYPE" in resp.json()["error"]["code"]

    async def test_upload_wrong_mime_type(self, async_client_full: AsyncClient):
        headers = await register_and_login(async_client_full, email="mime@example.com")
        resp = await async_client_full.post(
            "/api/v1/resumes",
            files={"file": ("resume.pdf", io.BytesIO(MINIMAL_PDF), "text/plain")},
            headers=headers,
        )
        assert resp.status_code == 400

    async def test_upload_empty_file(self, async_client_full: AsyncClient):
        headers = await register_and_login(async_client_full, email="empty@example.com")
        resp = await async_client_full.post(
            "/api/v1/resumes",
            files={"file": ("empty.pdf", io.BytesIO(b""), "application/pdf")},
            headers=headers,
        )
        assert resp.status_code == 400

    async def test_upload_oversized_file(self, async_client_full: AsyncClient):
        headers = await register_and_login(async_client_full, email="big@example.com")
        # 6 MB file
        big_content = b"%PDF-" + b"x" * (6 * 1024 * 1024)
        resp = await async_client_full.post(
            "/api/v1/resumes",
            files={"file": ("big.pdf", io.BytesIO(big_content), "application/pdf")},
            headers=headers,
        )
        assert resp.status_code == 400
        assert "FILE_TOO_LARGE" in resp.json()["error"]["code"]

    async def test_upload_unauthenticated(self, async_client_full: AsyncClient):
        resp = await async_client_full.post(
            "/api/v1/resumes",
            files=_pdf_file(),
        )
        assert resp.status_code == 401

    async def test_upload_stores_metadata_in_db(self, async_client_full: AsyncClient):
        headers = await register_and_login(async_client_full, email="meta@example.com")
        resp = await async_client_full.post(
            "/api/v1/resumes", files=_pdf_file(), headers=headers
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["id"] is not None
        assert data["file_size_bytes"] == len(MINIMAL_PDF)


class TestResumeList:
    async def test_list_own_resumes(self, async_client_full: AsyncClient):
        headers = await register_and_login(async_client_full, email="list@example.com")
        await async_client_full.post("/api/v1/resumes", files=_pdf_file(), headers=headers)
        await async_client_full.post("/api/v1/resumes", files=_pdf_file(), headers=headers)
        resp = await async_client_full.get("/api/v1/resumes", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    async def test_list_only_own_resumes(self, async_client_full: AsyncClient):
        """User A's resumes should not appear in User B's list."""
        headers_a = await register_and_login(
            async_client_full, email="lista@example.com"
        )
        headers_b = await register_and_login(
            async_client_full, email="listb@example.com"
        )
        await async_client_full.post("/api/v1/resumes", files=_pdf_file(), headers=headers_a)

        resp_b = await async_client_full.get("/api/v1/resumes", headers=headers_b)
        assert resp_b.status_code == 200
        assert resp_b.json() == []

    async def test_list_unauthenticated(self, async_client_full: AsyncClient):
        resp = await async_client_full.get("/api/v1/resumes")
        assert resp.status_code == 401


class TestResumeDownload:
    async def test_download_own_resume(self, async_client_full: AsyncClient):
        headers = await register_and_login(async_client_full, email="dl@example.com")
        upload_resp = await async_client_full.post(
            "/api/v1/resumes", files=_pdf_file(), headers=headers
        )
        resume_id = upload_resp.json()["id"]

        resp = await async_client_full.get(
            f"/api/v1/resumes/{resume_id}/download", headers=headers
        )
        assert resp.status_code == 200
        assert resp.content == MINIMAL_PDF
        assert "attachment" in resp.headers.get("content-disposition", "")

    async def test_download_other_users_resume_returns_404(
        self, async_client_full: AsyncClient
    ):
        headers_a = await register_and_login(
            async_client_full, email="dla@example.com"
        )
        headers_b = await register_and_login(
            async_client_full, email="dlb@example.com"
        )
        upload_resp = await async_client_full.post(
            "/api/v1/resumes", files=_pdf_file(), headers=headers_a
        )
        resume_id = upload_resp.json()["id"]

        resp = await async_client_full.get(
            f"/api/v1/resumes/{resume_id}/download", headers=headers_b
        )
        assert resp.status_code == 404


class TestResumeDelete:
    async def test_delete_own_resume(self, async_client_full: AsyncClient):
        headers = await register_and_login(async_client_full, email="del@example.com")
        upload_resp = await async_client_full.post(
            "/api/v1/resumes", files=_pdf_file(), headers=headers
        )
        resume_id = upload_resp.json()["id"]

        del_resp = await async_client_full.delete(
            f"/api/v1/resumes/{resume_id}", headers=headers
        )
        assert del_resp.status_code == 200
        assert del_resp.json()["resume_id"] == resume_id

        # Confirm it is gone from the listing
        list_resp = await async_client_full.get("/api/v1/resumes", headers=headers)
        assert list_resp.json() == []

    async def test_delete_other_users_resume_returns_404(
        self, async_client_full: AsyncClient
    ):
        headers_a = await register_and_login(async_client_full, email="da@example.com")
        headers_b = await register_and_login(async_client_full, email="db@example.com")

        upload_resp = await async_client_full.post(
            "/api/v1/resumes", files=_pdf_file(), headers=headers_a
        )
        resume_id = upload_resp.json()["id"]

        resp = await async_client_full.delete(
            f"/api/v1/resumes/{resume_id}", headers=headers_b
        )
        assert resp.status_code == 404

    async def test_delete_nonexistent_resume(self, async_client_full: AsyncClient):
        headers = await register_and_login(async_client_full, email="dne@example.com")
        resp = await async_client_full.delete(
            "/api/v1/resumes/000000000000000000000000", headers=headers
        )
        assert resp.status_code == 404

    async def test_delete_unauthenticated(self, async_client_full: AsyncClient):
        resp = await async_client_full.delete(
            "/api/v1/resumes/000000000000000000000000"
        )
        assert resp.status_code == 401

