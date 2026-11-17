from typing import Any, Dict, List, Optional, Set
from app.services.skill_gap.skill_normalization_service import SkillNormalizationService


class SkillComparisonResult:
    def __init__(
        self,
        match_percentage: int,
        matched_skills: List[Dict[str, Any]],
        partially_matched_skills: List[Dict[str, Any]],
        missing_skills: List[Dict[str, Any]],
        optional_skills: List[Dict[str, Any]],
        counts: Dict[str, int],
    ) -> None:
        self.match_percentage = match_percentage
        self.matched_skills = matched_skills
        self.partially_matched_skills = partially_matched_skills
        self.missing_skills = missing_skills
        self.optional_skills = optional_skills
        self.counts = counts


class SkillMatchingService:
    """Compares candidate skills against job role requirements and calculates weighted scores."""

    @classmethod
    def extract_candidate_skills(
        cls, resume_analysis: Dict[str, Any]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Extract and canonicalize candidate skills from resume analysis.
        Returns a dictionary mapping canonical_lower_name -> skill metadata dict.
        """
        candidate_map: Dict[str, Dict[str, Any]] = {}

        # 1. From detected_skills in resume analysis
        detected_list = resume_analysis.get("detected_skills", [])
        if isinstance(detected_list, list):
            for item in detected_list:
                if isinstance(item, dict):
                    raw_name = item.get("name") or item.get("skill") or ""
                elif isinstance(item, str):
                    raw_name = item
                    item = {"name": raw_name}
                else:
                    continue

                canonical = SkillNormalizationService.get_canonical_name(raw_name)
                if not canonical:
                    continue
                key = canonical.lower()
                candidate_map[key] = {
                    "name": canonical,
                    "raw_name": raw_name,
                    "category": item.get("category", "General"),
                    "status": item.get("status", "verified"),
                    "evidence": item.get("evidence_snippet") or item.get("evidence"),
                }

        # 2. From extracted_data.skills
        extracted = resume_analysis.get("extracted_data", {})
        if isinstance(extracted, dict):
            extracted_skills = extracted.get("skills", [])
            if isinstance(extracted_skills, list):
                for raw_name in extracted_skills:
                    if not isinstance(raw_name, str):
                        continue
                    canonical = SkillNormalizationService.get_canonical_name(raw_name)
                    if not canonical:
                        continue
                    key = canonical.lower()
                    if key not in candidate_map:
                        candidate_map[key] = {
                            "name": canonical,
                            "raw_name": raw_name,
                            "category": "General",
                            "status": "verified",
                            "evidence": f"Identified in resume skills section: {raw_name}",
                        }

        return candidate_map

    @classmethod
    def match_role(
        cls,
        candidate_skills_map: Dict[str, Dict[str, Any]],
        required_skills: List[Dict[str, Any]],
        optional_skills: List[Dict[str, Any]],
    ) -> SkillComparisonResult:
        """
        Compare candidate skills map against required and optional skills.
        Calculates weighted match percentage based strictly on required skills.
        """
        matched_skills: List[Dict[str, Any]] = []
        partially_matched_skills: List[Dict[str, Any]] = []
        missing_skills: List[Dict[str, Any]] = []
        evaluated_optional_skills: List[Dict[str, Any]] = []

        total_required_weight = 0.0
        earned_weight = 0.0

        # Evaluate required skills
        for req in required_skills:
            name = req.get("name", "")
            importance = int(req.get("importance", 3))
            category = req.get("category", "General")
            canonical_req = SkillNormalizationService.get_canonical_name(name)
            req_key = canonical_req.lower()

            total_required_weight += importance

            # 1. Exact canonical or alias match
            if req_key in candidate_skills_map:
                cand_info = candidate_skills_map[req_key]
                # Check if detected_skills indicated partial
                if cand_info.get("status") == "partial":
                    earned_weight += 0.5 * importance
                    partially_matched_skills.append({
                        "name": canonical_req,
                        "importance": importance,
                        "category": category,
                        "reason": cand_info.get("evidence") or f"Partial proficiency demonstrated for {canonical_req}",
                    })
                else:
                    earned_weight += 1.0 * importance
                    matched_skills.append({
                        "name": canonical_req,
                        "importance": importance,
                        "category": category,
                        "evidence": cand_info.get("evidence") or f"Verified resume evidence for {canonical_req}",
                    })
                continue

            # 2. Check partial relations from related skills candidate has
            partial_found = False
            for cand_key, cand_info in candidate_skills_map.items():
                if SkillNormalizationService.is_partial_match(cand_info["name"], canonical_req):
                    partial_found = True
                    earned_weight += 0.5 * importance
                    partially_matched_skills.append({
                        "name": canonical_req,
                        "importance": importance,
                        "category": category,
                        "reason": f"Demonstrated background in {cand_info['name']}, which transfers to {canonical_req}.",
                    })
                    break

            if not partial_found:
                # 3. Missing skill
                missing_skills.append({
                    "name": canonical_req,
                    "importance": importance,
                    "category": category,
                })

        # Calculate percentage (0 to 100)
        if total_required_weight > 0:
            match_percentage = min(100, max(0, round((earned_weight / total_required_weight) * 100)))
        else:
            match_percentage = 100

        # Evaluate optional skills (does not penalize required score)
        for opt in optional_skills:
            name = opt.get("name", "")
            importance = int(opt.get("importance", 3))
            category = opt.get("category", "General")
            canonical_opt = SkillNormalizationService.get_canonical_name(name)
            opt_key = canonical_opt.lower()

            if opt_key in candidate_skills_map:
                cand_info = candidate_skills_map[opt_key]
                evaluated_optional_skills.append({
                    "name": canonical_opt,
                    "importance": importance,
                    "category": category,
                    "status": "matched" if cand_info.get("status") != "partial" else "partial",
                })
            else:
                evaluated_optional_skills.append({
                    "name": canonical_opt,
                    "importance": importance,
                    "category": category,
                    "status": "missing",
                })

        counts = {
            "matched": len(matched_skills),
            "partial": len(partially_matched_skills),
            "missing": len(missing_skills),
            "optional": len(evaluated_optional_skills),
            "total_required": len(required_skills),
        }

        return SkillComparisonResult(
            match_percentage=match_percentage,
            matched_skills=matched_skills,
            partially_matched_skills=partially_matched_skills,
            missing_skills=missing_skills,
            optional_skills=evaluated_optional_skills,
            counts=counts,
        )

