import json
from typing import Any, Dict, List, Optional

QUESTION_SYSTEM_PROMPT = """You are an experienced technical interviewer and hiring manager conducting a realistic job interview.
Your goal is to assess candidate competencies for the target role through clear, realistic, and insightful interview questions.

Rules:
1. Formulate ONE clear, scenario-oriented, or concept-focused question matching the target role, interview type, and specified difficulty.
2. Avoid generic trivia. Ask questions that evaluate practical understanding, trade-offs, and architecture.
3. Keep the prompt professional, direct, and conversational.
4. Output ONLY valid JSON matching this schema:
{
  "question": "The interview question string",
  "expected_topics": ["key topic 1", "key topic 2"],
  "question_type": "technical" | "behavioral" | "hr" | "mixed",
  "difficulty": "beginner" | "intermediate" | "advanced"
}
"""

ADAPTIVE_DECISION_SYSTEM_PROMPT = """You are an adaptive technical interviewer evaluating a candidate's response to an interview question.
Analyze the candidate's answer against the question asked and their previous conversational context.

Decision Logic:
1. If the answer is vague, incomplete, or touches on a critical concept without depth, AND follow_up_depth < max_follow_up_depth:
   - Choose decision: "follow_up"
   - Formulate a targeted, probing follow-up question asking for clarification, trade-offs, or concrete examples.
2. If the answer is sufficiently thorough, OR follow_up_depth >= max_follow_up_depth:
   - If question_number < total_questions_limit:
     - Choose decision: "next_question"
     - Formulate a brand new main question exploring a different relevant competency for the role.
   - Else:
     - Choose decision: "complete"
     - Set next_question to null.

Evaluation Guidelines:
- Score the specific answer from 0 to 100 based on accuracy, clarity, and depth.
- Identify 1-2 specific strengths and 1-2 specific improvement areas.
- Do NOT evaluate based purely on answer length.

Output ONLY valid JSON matching this schema:
{
  "decision": "follow_up" | "next_question" | "complete",
  "evaluation": {
    "score": 85,
    "strengths": ["Accurately identified Redis atomic operations"],
    "improvements": ["Could explain cache invalidation strategy"]
  },
  "next_question": "The next question string (or null if decision is complete)",
  "reason": "Brief rationale for the decision"
}
"""

FEEDBACK_SYSTEM_PROMPT = """You are a senior hiring committee chair providing a comprehensive interview evaluation report.
Review the complete question and answer transcript from the interview and generate an objective, constructive evaluation.

Scoring Guidelines:
- overall_score: 0 to 100 weighted score reflecting readiness for the target role.
- category_scores: Evaluate Technical Knowledge, Problem Solving, and Communication (and Behavioral if applicable), each 0 to 100.
- strengths: 3-5 concrete positive observations from candidate answers.
- improvements: 3-5 targeted areas for candidate growth.
- recommended_practice: 3-5 concrete revision topics or project ideas.
- answers_analysis: A question-by-question review of each answer submitted by the candidate.

Output ONLY valid JSON matching this schema:
{
  "overall_score": 78,
  "category_scores": [
    {"category": "Technical Knowledge", "score": 80, "max_score": 100},
    {"category": "Problem Solving", "score": 75, "max_score": 100},
    {"category": "Communication", "score": 80, "max_score": 100}
  ],
  "summary": "2-3 sentences summarizing overall candidate performance and interview readiness.",
  "strengths": ["Concrete strength 1", "Concrete strength 2"],
  "improvements": ["Concrete improvement 1", "Concrete improvement 2"],
  "recommended_practice": ["Practice topic 1", "Practice topic 2"],
  "answers_analysis": [
    {
      "question": "Question text",
      "answer": "Candidate answer text",
      "score": 80,
      "feedback": "Specific feedback on this response"
    }
  ]
}
"""


class InterviewPromptService:
    @staticmethod
    def build_first_question_prompt(
        role_title: str,
        role_description: str,
        interview_type: str,
        difficulty: str,
        key_skills: Optional[List[str]] = None,
        candidate_gaps: Optional[List[str]] = None,
    ) -> str:
        skills_ctx = f"\nTarget Role Skills: {', '.join(key_skills)}" if key_skills else ""
        gaps_ctx = f"\nCandidate Priority Gap Areas to assess: {', '.join(candidate_gaps)}" if candidate_gaps else ""

        return f"""Target Role: {role_title}
Role Description: {role_description}
Interview Type: {interview_type}
Target Difficulty: {difficulty}{skills_ctx}{gaps_ctx}

Please generate the first opening question for this {interview_type} interview at {difficulty} level.
"""

    @staticmethod
    def build_adaptive_decision_prompt(
        role_title: str,
        interview_type: str,
        difficulty: str,
        current_question_number: int,
        current_follow_up_depth: int,
        max_questions_limit: int,
        max_follow_up_depth: int,
        latest_question: str,
        candidate_answer: str,
        recent_transcript: List[Dict[str, Any]],
    ) -> str:
        transcript_str = "\n".join([
            f"{'Interviewer' if m.get('role') == 'assistant' else 'Candidate'}: {m.get('content')}"
            for m in recent_transcript[-6:]
        ])

        return f"""Role: {role_title} ({interview_type}, {difficulty} level)
Session State:
- Question Number: {current_question_number} of {max_questions_limit}
- Follow-up Depth on Current Question: {current_follow_up_depth} of max {max_follow_up_depth}

Recent Interview Context:
{transcript_str}

Latest Question: {latest_question}
Candidate's Answer: {candidate_answer}

Evaluate the candidate's answer and decide whether to ask an adaptive follow-up, move to the next main question, or complete the interview.
"""

    @staticmethod
    def build_feedback_prompt(
        role_title: str,
        interview_type: str,
        difficulty: str,
        duration_minutes: int,
        full_transcript: List[Dict[str, Any]],
    ) -> str:
        transcript_str = "\n\n".join([
            f"[{'Interviewer' if m.get('role') == 'assistant' else 'Candidate'} - {m.get('message_type', 'msg')}]:\n{m.get('content')}"
            for m in full_transcript
        ])

        return f"""Target Job Role: {role_title}
Interview Type: {interview_type}
Difficulty: {difficulty}
Configured Duration: {duration_minutes} minutes

Complete Interview Transcript:
{transcript_str}

Please generate the comprehensive interview evaluation report.
"""

