import logging

logger = logging.getLogger(__name__)

class DataService:
    @staticmethod
    def clean_content(content: str) -> str:
        """Clean content by normalizing whitespace and removing excessive newlines."""
        if not content:
            return ""
        # Replace multiple newlines with a single newline
        content = '\n'.join(line.strip() for line in content.split('\n') if line.strip())
        # Replace multiple spaces with a single space
        content = ' '.join(content.split())
        return content