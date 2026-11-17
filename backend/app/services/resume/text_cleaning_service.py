import re


class TextCleaningService:
    """Normalizes and cleans extracted text from resumes while preserving content."""

    @staticmethod
    def clean_text(raw_text: str) -> str:
        if not raw_text:
            return ""

        # 1. Strip null bytes and non-printable control characters (keep \n, \t, \r)
        text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", raw_text)

        # 2. Normalize Windows/Mac line endings to standard Unix \n
        text = text.replace("\r\n", "\n").replace("\r", "\n")

        # 3. Replace non-breaking spaces and unusual unicode spaces with standard space
        text = re.sub(r"[\u00a0\u2000-\u200b\u202f\u205f\u3000]", " ", text)

        # 4. Normalize common bullet point symbols to standard hyphen bullet
        text = re.sub(r"[•●○■◆▪‣⁃–—]\s*", "• ", text)

        # 5. Remove excessive horizontal whitespace on each line without altering indentation
        lines = []
        for line in text.split("\n"):
            # Collapse multiple spaces/tabs within a line
            cleaned_line = re.sub(r"[ \t]+", " ", line).strip()
            lines.append(cleaned_line)

        # 6. Recombine lines
        text = "\n".join(lines)

        # 7. Collapse more than 2 consecutive line breaks to 2
        text = re.sub(r"\n{3,}", "\n\n", text)

        # 8. Strip leading and trailing whitespace
        return text.strip()

