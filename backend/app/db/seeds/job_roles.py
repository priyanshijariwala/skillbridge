import logging
from datetime import datetime, timezone
from typing import Any, Dict, List
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

INITIAL_JOB_ROLES: List[Dict[str, Any]] = [
    {
        "slug": "frontend-developer",
        "title": "Frontend Developer",
        "category": "Frontend Engineering",
        "description": "Build high-performance, accessible, and responsive user interfaces using modern web technologies.",
        "experience_level": "Mid",
        "required_skills": [
            {"name": "JavaScript", "importance": 5, "category": "Languages", "description": "Core modern ES6+ JavaScript"},
            {"name": "TypeScript", "importance": 4, "category": "Languages", "description": "Static typing, interfaces, generics"},
            {"name": "React", "importance": 5, "category": "Frameworks", "description": "Component architecture, hooks, state management"},
            {"name": "HTML5", "importance": 4, "category": "Frontend", "description": "Semantic markup, accessibility (a11y)"},
            {"name": "CSS3", "importance": 4, "category": "Frontend", "description": "Flexbox, Grid, animations, responsive design"},
            {"name": "Tailwind CSS", "importance": 3, "category": "Frontend", "description": "Utility-first styling"},
            {"name": "Git", "importance": 4, "category": "Tools", "description": "Version control, branching, PR workflows"},
        ],
        "optional_skills": [
            {"name": "Next.js", "importance": 3, "category": "Frameworks", "description": "SSR, SSG, App Router"},
            {"name": "GraphQL", "importance": 2, "category": "APIs", "description": "Querying and Apollo Client"},
            {"name": "Jest", "importance": 3, "category": "Testing", "description": "Unit and integration testing"},
            {"name": "Webpack", "importance": 2, "category": "Build Tools", "description": "Bundling and optimization"},
        ],
        "is_active": True,
    },
    {
        "slug": "backend-developer",
        "title": "Backend Developer",
        "category": "Backend Engineering",
        "description": "Design and build robust, scalable server-side systems, RESTful microservices, and databases.",
        "experience_level": "Mid",
        "required_skills": [
            {"name": "Python", "importance": 5, "category": "Languages", "description": "Core language proficiency"},
            {"name": "FastAPI", "importance": 4, "category": "Frameworks", "description": "Async web APIs, Pydantic validation"},
            {"name": "REST APIs", "importance": 5, "category": "Architecture", "description": "HTTP status codes, RESTful API design"},
            {"name": "PostgreSQL", "importance": 4, "category": "Databases", "description": "Relational schema design, queries, transactions"},
            {"name": "MongoDB", "importance": 3, "category": "Databases", "description": "Document storage, aggregation"},
            {"name": "Git", "importance": 4, "category": "Tools", "description": "Version control, collaborative code reviews"},
            {"name": "Docker", "importance": 4, "category": "DevOps", "description": "Containerization, multi-stage builds"},
        ],
        "optional_skills": [
            {"name": "Redis", "importance": 3, "category": "Databases", "description": "In-memory caching and session store"},
            {"name": "Kafka", "importance": 3, "category": "Messaging", "description": "Event-driven messaging and streaming"},
            {"name": "Kubernetes", "importance": 2, "category": "DevOps", "description": "Container orchestration"},
            {"name": "CI/CD", "importance": 3, "category": "DevOps", "description": "Automated build and deployment pipelines"},
        ],
        "is_active": True,
    },
    {
        "slug": "full-stack-developer",
        "title": "Full Stack Developer",
        "category": "Software Engineering",
        "description": "Deliver end-to-end features spanning modern client-side interfaces and scalable backend services.",
        "experience_level": "Mid",
        "required_skills": [
            {"name": "JavaScript", "importance": 5, "category": "Languages", "description": "Client and server scripting"},
            {"name": "TypeScript", "importance": 4, "category": "Languages", "description": "Typed frontend and backend code"},
            {"name": "React", "importance": 5, "category": "Frontend", "description": "Interactive UI development"},
            {"name": "Node.js", "importance": 5, "category": "Backend", "description": "Asynchronous runtime, event loop"},
            {"name": "Express.js", "importance": 4, "category": "Backend", "description": "Routing, middleware, HTTP services"},
            {"name": "MongoDB", "importance": 4, "category": "Databases", "description": "NoSQL document persistence"},
            {"name": "REST APIs", "importance": 4, "category": "Architecture", "description": "API contracts and integration"},
            {"name": "Git", "importance": 4, "category": "Tools", "description": "Version control workflows"},
            {"name": "Docker", "importance": 3, "category": "DevOps", "description": "Containerized development"},
        ],
        "optional_skills": [
            {"name": "Next.js", "importance": 3, "category": "Frameworks", "description": "Fullstack React frameworks"},
            {"name": "PostgreSQL", "importance": 3, "category": "Databases", "description": "Relational data modeling"},
            {"name": "AWS", "importance": 3, "category": "Cloud", "description": "Cloud hosting and services"},
            {"name": "GraphQL", "importance": 2, "category": "APIs", "description": "Schema-driven data access"},
        ],
        "is_active": True,
    },
    {
        "slug": "react-developer",
        "title": "React Developer",
        "category": "Frontend Engineering",
        "description": "Specialize in React ecosystem applications, complex state management, and component architecture.",
        "experience_level": "Mid",
        "required_skills": [
            {"name": "React", "importance": 5, "category": "Frameworks", "description": "Hooks, context, lifecycle, performance tuning"},
            {"name": "JavaScript", "importance": 5, "category": "Languages", "description": "ES6+, async/await, closures"},
            {"name": "TypeScript", "importance": 4, "category": "Languages", "description": "Type-safe React props and state"},
            {"name": "Redux", "importance": 4, "category": "State Management", "description": "Redux Toolkit or modern global store"},
            {"name": "HTML5", "importance": 4, "category": "Frontend", "description": "Semantic markup and accessibility"},
            {"name": "CSS3", "importance": 4, "category": "Frontend", "description": "Styling, CSS modules, responsive layouts"},
            {"name": "Git", "importance": 4, "category": "Tools", "description": "Version control"},
        ],
        "optional_skills": [
            {"name": "Next.js", "importance": 4, "category": "Frameworks", "description": "Server-side rendering and static export"},
            {"name": "TanStack Query", "importance": 3, "category": "State Management", "description": "Server state caching and sync"},
            {"name": "Tailwind CSS", "importance": 3, "category": "Frontend", "description": "Utility CSS styling"},
            {"name": "Jest", "importance": 3, "category": "Testing", "description": "Unit testing React components"},
        ],
        "is_active": True,
    },
    {
        "slug": "python-developer",
        "title": "Python Developer",
        "category": "Software Engineering",
        "description": "Develop data pipelines, automation engines, and backend services using Python and its ecosystem.",
        "experience_level": "Mid",
        "required_skills": [
            {"name": "Python", "importance": 5, "category": "Languages", "description": "Idiomatic Python, OOP, data structures"},
            {"name": "Django", "importance": 4, "category": "Frameworks", "description": "Django ORM, authentication, admin"},
            {"name": "FastAPI", "importance": 4, "category": "Frameworks", "description": "High-performance async APIs"},
            {"name": "PostgreSQL", "importance": 4, "category": "Databases", "description": "Relational schema and queries"},
            {"name": "REST APIs", "importance": 4, "category": "Architecture", "description": "API design and documentation"},
            {"name": "Git", "importance": 4, "category": "Tools", "description": "Version control and branching"},
            {"name": "Pytest", "importance": 3, "category": "Testing", "description": "Unit and integration testing"},
        ],
        "optional_skills": [
            {"name": "Docker", "importance": 3, "category": "DevOps", "description": "Application containerization"},
            {"name": "Celery", "importance": 3, "category": "Async Tasks", "description": "Distributed background queues"},
            {"name": "Redis", "importance": 3, "category": "Databases", "description": "Caching and message broker"},
            {"name": "Pandas", "importance": 2, "category": "Data", "description": "Data analysis and transformation"},
        ],
        "is_active": True,
    },
    {
        "slug": "node-js-developer",
        "title": "Node.js Developer",
        "category": "Backend Engineering",
        "description": "Build high-throughput, non-blocking asynchronous microservices and API gateways on Node.js.",
        "experience_level": "Mid",
        "required_skills": [
            {"name": "Node.js", "importance": 5, "category": "Backend", "description": "Event loop, streams, buffers, clustering"},
            {"name": "JavaScript", "importance": 5, "category": "Languages", "description": "Asynchronous programming, promises"},
            {"name": "TypeScript", "importance": 4, "category": "Languages", "description": "Static typing in backend Node services"},
            {"name": "Express.js", "importance": 4, "category": "Frameworks", "description": "Middleware, routing, HTTP handling"},
            {"name": "MongoDB", "importance": 4, "category": "Databases", "description": "Mongoose / Mongo native driver"},
            {"name": "REST APIs", "importance": 4, "category": "Architecture", "description": "Microservices communication"},
            {"name": "Git", "importance": 4, "category": "Tools", "description": "Version control"},
        ],
        "optional_skills": [
            {"name": "NestJS", "importance": 3, "category": "Frameworks", "description": "Enterprise modular architecture"},
            {"name": "PostgreSQL", "importance": 3, "category": "Databases", "description": "Relational queries with Prisma/TypeORM"},
            {"name": "Docker", "importance": 3, "category": "DevOps", "description": "Containerizing Node apps"},
            {"name": "Redis", "importance": 3, "category": "Databases", "description": "Caching and pub/sub"},
        ],
        "is_active": True,
    },
    {
        "slug": "java-developer",
        "title": "Java Developer",
        "category": "Enterprise Engineering",
        "description": "Construct enterprise-scale, mission-critical distributed systems and microservices with Java and Spring.",
        "experience_level": "Mid",
        "required_skills": [
            {"name": "Java", "importance": 5, "category": "Languages", "description": "Java 17+, OOP, concurrency, streams"},
            {"name": "Spring Boot", "importance": 5, "category": "Frameworks", "description": "Spring MVC, Data, Security, dependency injection"},
            {"name": "PostgreSQL", "importance": 4, "category": "Databases", "description": "Hibernate / JPA and relational databases"},
            {"name": "REST APIs", "importance": 4, "category": "Architecture", "description": "Enterprise REST endpoints"},
            {"name": "Maven", "importance": 3, "category": "Build Tools", "description": "Dependency management and lifecycle"},
            {"name": "Git", "importance": 4, "category": "Tools", "description": "Version control"},
            {"name": "JUnit", "importance": 3, "category": "Testing", "description": "Unit testing and Mockito"},
        ],
        "optional_skills": [
            {"name": "Kafka", "importance": 3, "category": "Messaging", "description": "Event streaming in microservices"},
            {"name": "Docker", "importance": 3, "category": "DevOps", "description": "Containerizing Spring Boot apps"},
            {"name": "Kubernetes", "importance": 2, "category": "DevOps", "description": "Cloud deployment"},
            {"name": "AWS", "importance": 3, "category": "Cloud", "description": "Cloud hosting"},
        ],
        "is_active": True,
    },
    {
        "slug": "data-analyst",
        "title": "Data Analyst",
        "category": "Data & Analytics",
        "description": "Transform complex datasets into actionable business intelligence, dashboards, and strategic insights.",
        "experience_level": "Mid",
        "required_skills": [
            {"name": "SQL", "importance": 5, "category": "Databases", "description": "Complex joins, window functions, aggregations"},
            {"name": "Python", "importance": 4, "category": "Languages", "description": "Data processing and scripting"},
            {"name": "Pandas", "importance": 4, "category": "Libraries", "description": "Data cleaning, merging, and reshaping"},
            {"name": "Tableau", "importance": 4, "category": "BI Tools", "description": "Interactive dashboard design (or PowerBI)"},
            {"name": "Excel", "importance": 4, "category": "Tools", "description": "Pivot tables, VLOOKUP, statistical modeling"},
            {"name": "Data Visualization", "importance": 4, "category": "Analytics", "description": "Storytelling with charts and metrics"},
        ],
        "optional_skills": [
            {"name": "Power BI", "importance": 3, "category": "BI Tools", "description": "DAX, data flows, reporting"},
            {"name": "R", "importance": 2, "category": "Languages", "description": "Statistical computing"},
            {"name": "Git", "importance": 3, "category": "Tools", "description": "Version control for analyst scripts"},
            {"name": "BigQuery", "importance": 3, "category": "Cloud Data", "description": "Cloud data warehousing"},
        ],
        "is_active": True,
    },
    {
        "slug": "devops-engineer",
        "title": "DevOps Engineer",
        "category": "Infrastructure & Operations",
        "description": "Automate cloud infrastructure, optimize continuous integration and delivery pipelines, and ensure reliability.",
        "experience_level": "Mid",
        "required_skills": [
            {"name": "Linux", "importance": 5, "category": "OS", "description": "Shell scripting, networking, system administration"},
            {"name": "Docker", "importance": 5, "category": "Containers", "description": "Container architecture and optimization"},
            {"name": "Kubernetes", "importance": 4, "category": "Orchestration", "description": "Deployments, services, ingress, Helm"},
            {"name": "CI/CD", "importance": 5, "category": "Automation", "description": "GitHub Actions, GitLab CI, or Jenkins"},
            {"name": "AWS", "importance": 4, "category": "Cloud", "description": "EC2, S3, IAM, VPC, ECS/EKS"},
            {"name": "Terraform", "importance": 4, "category": "IaC", "description": "Infrastructure as code provisioning"},
            {"name": "Git", "importance": 4, "category": "Tools", "description": "GitOps and version control"},
        ],
        "optional_skills": [
            {"name": "Python", "importance": 3, "category": "Languages", "description": "Automation scripts and tooling"},
            {"name": "Prometheus", "importance": 3, "category": "Monitoring", "description": "Metrics collection and Grafana dashboards"},
            {"name": "Ansible", "importance": 2, "category": "Automation", "description": "Configuration management"},
            {"name": "GCP", "importance": 2, "category": "Cloud", "description": "Google Cloud Platform"},
        ],
        "is_active": True,
    },
]


async def seed_job_roles(db: AsyncIOMotorDatabase) -> int:
    """
    Seed initial job roles into the 'job_roles' collection idempotently.
    Uses upsert based on 'slug'. Returns count of upserted/processed roles.
    """
    collection = db["job_roles"]
    now = datetime.now(timezone.utc)
    seeded_count = 0

    for role_data in INITIAL_JOB_ROLES:
        slug = role_data["slug"]
        update_doc = {**role_data, "updated_at": now}
        await collection.update_one(
            {"slug": slug},
            {
                "$set": update_doc,
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
        )
        seeded_count += 1

    logger.info("Seeded %d job roles idempotently.", seeded_count)
    return seeded_count

