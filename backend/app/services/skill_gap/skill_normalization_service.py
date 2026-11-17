import re
from typing import Dict, Set

# Canonical alias mapping: lower-cased & stripped alias -> canonical display name
CANONICAL_ALIASES: Dict[str, str] = {
    # JavaScript & TypeScript
    "js": "JavaScript",
    "javascript": "JavaScript",
    "es6": "JavaScript",
    "es6+": "JavaScript",
    "ecmascript": "JavaScript",
    "ts": "TypeScript",
    "typescript": "TypeScript",
    
    # Frontend Frameworks & Libraries
    "react": "React",
    "reactjs": "React",
    "react.js": "React",
    "vue": "Vue.js",
    "vuejs": "Vue.js",
    "vue.js": "Vue.js",
    "angular": "Angular",
    "angularjs": "Angular",
    "next": "Next.js",
    "nextjs": "Next.js",
    "next.js": "Next.js",
    "html": "HTML5",
    "html5": "HTML5",
    "css": "CSS3",
    "css3": "CSS3",
    "tailwind": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "tailwind css": "Tailwind CSS",
    "redux": "Redux",
    "redux toolkit": "Redux",
    "rtk": "Redux",
    "tanstack query": "TanStack Query",
    "react query": "TanStack Query",
    "react-query": "TanStack Query",
    
    # Backend Runtimes & Frameworks
    "node": "Node.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "express": "Express.js",
    "expressjs": "Express.js",
    "express.js": "Express.js",
    "nest": "NestJS",
    "nestjs": "NestJS",
    "fastapi": "FastAPI",
    "fast api": "FastAPI",
    "django": "Django",
    "flask": "Flask",
    "spring": "Spring Boot",
    "spring boot": "Spring Boot",
    "springboot": "Spring Boot",
    
    # Languages
    "py": "Python",
    "python": "Python",
    "python3": "Python",
    "golang": "Go",
    "go": "Go",
    "java": "Java",
    "c#": "C#",
    "csharp": "C#",
    "c++": "C++",
    "cpp": "C++",
    "rust": "Rust",
    
    # Databases & Caching
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "psql": "PostgreSQL",
    "mongo": "MongoDB",
    "mongodb": "MongoDB",
    "mysql": "MySQL",
    "redis": "Redis",
    "sqlite": "SQLite",
    "sql": "SQL",
    
    # DevOps, Cloud & Tools
    "docker": "Docker",
    "k8s": "Kubernetes",
    "kubernetes": "Kubernetes",
    "git": "Git",
    "github": "Git",
    "gitlab": "Git",
    "ci/cd": "CI/CD",
    "cicd": "CI/CD",
    "github actions": "CI/CD",
    "gitlab ci": "CI/CD",
    "aws": "AWS",
    "amazon web services": "AWS",
    "gcp": "GCP",
    "google cloud": "GCP",
    "azure": "Azure",
    "terraform": "Terraform",
    "linux": "Linux",
    "bash": "Linux",
    "shell": "Linux",
    
    # Architecture & APIs
    "rest": "REST APIs",
    "restful": "REST APIs",
    "rest api": "REST APIs",
    "rest apis": "REST APIs",
    "graphql": "GraphQL",
    "kafka": "Kafka",
    "apache kafka": "Kafka",
    
    # Testing & Analytics
    "pytest": "Pytest",
    "jest": "Jest",
    "junit": "JUnit",
    "pandas": "Pandas",
    "tableau": "Tableau",
    "powerbi": "Power BI",
    "power bi": "Power BI",
    "excel": "Excel",
}

# Related or sub-skill mappings for partial matching (candidate_skill -> required_skill)
PARTIAL_MATCH_RELATIONS: Dict[str, Set[str]] = {
    # If role asks for Node.js, Express.js is strong partial evidence
    "express.js": {"node.js"},
    # If role asks for React, Redux or Next.js or React Query is partial evidence
    "redux": {"react"},
    "next.js": {"react"},
    # If role asks for PostgreSQL, generic SQL or MySQL indicates relational DB partial competence
    "sql": {"postgresql", "mysql"},
    "mysql": {"postgresql"},
    # If role asks for Cloud/DevOps
    "docker": {"kubernetes"},
    "ci/cd": {"devops engineer"},
    # If role asks for FastAPI, Django or Flask is partial Python framework competence
    "django": {"fastapi"},
    "flask": {"fastapi"},
    "fastapi": {"django"},
}


class SkillNormalizationService:
    """Service for canonical skill name normalization and alias resolution."""

    @staticmethod
    def clean_text(name: str) -> str:
        """Strip, lowercase, and remove extra internal spaces."""
        if not name:
            return ""
        return re.sub(r"\s+", " ", name.strip().lower())

    @classmethod
    def get_canonical_name(cls, skill_name: str) -> str:
        """
        Return the standardized canonical name for a given skill.
        Falls back to capitalized/trimmed input if no alias matches.
        """
        cleaned = cls.clean_text(skill_name)
        if not cleaned:
            return ""
        if cleaned in CANONICAL_ALIASES:
            return CANONICAL_ALIASES[cleaned]
        # Preserve Title Case if unknown
        return skill_name.strip()

    @classmethod
    def are_skills_equivalent(cls, skill_a: str, skill_b: str) -> bool:
        """Check if two skills resolve to the exact same canonical skill."""
        can_a = cls.get_canonical_name(skill_a).lower()
        can_b = cls.get_canonical_name(skill_b).lower()
        if not can_a or not can_b:
            return False
        return can_a == can_b

    @classmethod
    def is_partial_match(cls, candidate_skill: str, required_skill: str) -> bool:
        """Check if candidate skill has a recognized partial relation to the required skill."""
        cand_key = cls.get_canonical_name(candidate_skill).lower()
        req_key = cls.get_canonical_name(required_skill).lower()
        if cand_key == req_key:
            return False  # That's an exact match, not partial
        related = PARTIAL_MATCH_RELATIONS.get(cand_key, set())
        return req_key in related

