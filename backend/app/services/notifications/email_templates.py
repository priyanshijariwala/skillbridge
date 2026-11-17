import html
from typing import Any, Dict, Tuple
from app.core.config import settings


def _base_email_layout(title: str, content_html: str, action_url: str = "", action_text: str = "") -> str:
    action_button_html = ""
    if action_url and action_text:
        action_button_html = f"""
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0 16px 0;">
          <tr>
            <td align="center">
              <a href="{html.escape(action_url)}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block;">
                {html.escape(action_text)} &rarr;
              </a>
            </td>
          </tr>
        </table>
        """

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{html.escape(title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0f172a; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0f172a; border-bottom: 1px solid #334155;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <span style="font-size: 18px; font-weight: 700; color: #f8fafc; letter-spacing: -0.5px;">⚡ SkillBridge AI</span>
                  </td>
                  <td align="right">
                    <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; background-color: #1e293b; padding: 4px 8px; border-radius: 4px; border: 1px solid #334155;">
                      Career Platform
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #f8fafc;">{html.escape(title)}</h1>
              <div style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                {content_html}
              </div>
              {action_button_html}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #0f172a; border-top: 1px solid #334155; font-size: 12px; color: #64748b; text-align: center;">
              <p style="margin: 0 0 8px 0;">SkillBridge AI &bull; Autonomous Career Preparation & Assessment</p>
              <p style="margin: 0;">You received this email because of your account activity. Manage your preferences in <a href="{html.escape(settings.FRONTEND_URL)}/settings/notifications" style="color: #38bdf8; text-decoration: none;">Notification Settings</a>.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


class EmailTemplateService:
    @staticmethod
    def render(template_name: str, context: Dict[str, Any]) -> Tuple[str, str, str]:
        """
        Renders (subject, html_content, text_content) for a given template name and context dictionary.
        """
        name = html.escape(str(context.get("name", "Candidate")))
        base_url = settings.FRONTEND_URL.rstrip("/")

        if template_name == "welcome":
            subject = "Welcome to SkillBridge AI — Ready for your career transformation?"
            action_url = f"{base_url}/dashboard"
            action_text = "Go to Dashboard"
            content = f"""
            <p>Hi <strong>{name}</strong>,</p>
            <p>Welcome to <strong>SkillBridge AI</strong> — your personalized, AI-powered career accelerator.</p>
            <p>Here's what you can do next to fast-track your job readiness:</p>
            <ul>
              <li>Upload your resume for deep extraction and industry benchmarking.</li>
              <li>Analyze your skill gaps against market expectations for your target role.</li>
              <li>Generate an adaptive learning roadmap tailored to your specific gaps.</li>
              <li>Practice with AI-powered mock interviews and coding challenges.</li>
            </ul>
            <p>We're excited to partner with you on your career journey.</p>
            """
            text = f"Hi {context.get('name', 'Candidate')},\n\nWelcome to SkillBridge AI! Your personalized career journey starts now.\nUpload your resume, analyze skill gaps, and practice with AI interviews and coding assessments.\n\nAccess your dashboard: {action_url}\n\nSkillBridge AI Team"

        elif template_name == "resume_analysis_completed":
            subject = "Your Resume Analysis is Ready — SkillBridge AI"
            role = html.escape(str(context.get("target_role", "Target Role")))
            score = context.get("score", 0)
            action_url = f"{base_url}/resume"
            action_text = "View Resume Analysis"
            content = f"""
            <p>Hi <strong>{name}</strong>,</p>
            <p>Great news! Your resume has been analyzed against <strong>{role}</strong> requirements.</p>
            <p style="background-color: #0f172a; padding: 12px 16px; border-radius: 8px; border: 1px solid #334155;">
              Overall Profile Match: <strong style="color: #38bdf8; font-size: 16px;">{score}%</strong>
            </p>
            <p>Our AI model identified key strengths, high-impact phrasing suggestions, and structural improvements to help you get more recruiter callbacks.</p>
            """
            text = f"Hi {context.get('name', 'Candidate')},\n\nYour resume analysis for {context.get('target_role', 'Target Role')} is ready! Overall Match: {score}%.\n\nView details: {action_url}\n\nSkillBridge AI Team"

        elif template_name == "skill_gap_analysis_completed":
            subject = "Skill Gap Analysis Complete — Discover What to Learn Next"
            role = html.escape(str(context.get("target_role", "Target Role")))
            gaps_count = context.get("gaps_count", 0)
            action_url = f"{base_url}/skill-gap"
            action_text = "Review Skill Gaps"
            content = f"""
            <p>Hi <strong>{name}</strong>,</p>
            <p>Your skill-gap evaluation for <strong>{role}</strong> is complete.</p>
            <p>We found <strong>{gaps_count} target skills</strong> that will give you the strongest hiring edge once mastered.</p>
            <p>Check out your personalized recommendations and kickstart targeted preparation.</p>
            """
            text = f"Hi {context.get('name', 'Candidate')},\n\nYour skill gap analysis for {context.get('target_role', 'Target Role')} has identified {gaps_count} key skills to focus on.\n\nReview your skill gaps: {action_url}\n\nSkillBridge AI Team"

        elif template_name == "roadmap_generated":
            subject = "Your Personalized Learning Roadmap is Ready — SkillBridge AI"
            milestones_count = context.get("milestones_count", 4)
            action_url = f"{base_url}/roadmap"
            action_text = "Explore Roadmap"
            content = f"""
            <p>Hi <strong>{name}</strong>,</p>
            <p>We've generated an adaptive, step-by-step learning roadmap with <strong>{milestones_count} core milestones</strong> tailored directly to your skill assessment.</p>
            <p>Track your weekly progress, study curated resources, and verify your mastery with integrated assessments.</p>
            """
            text = f"Hi {context.get('name', 'Candidate')},\n\nYour learning roadmap with {milestones_count} milestones is ready.\n\nStart learning: {action_url}\n\nSkillBridge AI Team"

        elif template_name == "interview_completed":
            subject = "Mock Interview Feedback & Evaluation — SkillBridge AI"
            role = html.escape(str(context.get("role_title", "Technical Role")))
            overall_score = context.get("overall_score", 0)
            interview_id = context.get("interview_id", "")
            action_url = f"{base_url}/interview/{interview_id}/feedback" if interview_id else f"{base_url}/interview-history"
            action_text = "View Interview Feedback"
            content = f"""
            <p>Hi <strong>{name}</strong>,</p>
            <p>You completed a mock interview for <strong>{role}</strong>.</p>
            <p style="background-color: #0f172a; padding: 12px 16px; border-radius: 8px; border: 1px solid #334155;">
              Overall Performance Score: <strong style="color: #10b981; font-size: 16px;">{overall_score}/100</strong>
            </p>
            <p>Detailed question-by-question feedback, behavioral communication cues, and AI improvement recommendations are now available.</p>
            """
            text = f"Hi {context.get('name', 'Candidate')},\n\nYour mock interview for {context.get('role_title', 'Technical Role')} is complete! Overall score: {overall_score}/100.\n\nView detailed feedback: {action_url}\n\nSkillBridge AI Team"

        elif template_name == "coding_assessment_evaluated":
            subject = "Coding Assessment Result — SkillBridge AI"
            problem_title = html.escape(str(context.get("problem_title", "Coding Problem")))
            verdict = html.escape(str(context.get("verdict", "Evaluated")).replace("_", " ").upper())
            passed = context.get("passed_count", 0)
            total = context.get("total_count", 0)
            submission_id = context.get("submission_id", "")
            action_url = f"{base_url}/coding/submissions" if not submission_id else f"{base_url}/coding/problems/{context.get('problem_slug', '')}"
            action_text = "Review Submission"
            verdict_color = "#10b981" if "ACCEPTED" in verdict else "#f43f5e"
            content = f"""
            <p>Hi <strong>{name}</strong>,</p>
            <p>Your solution for <strong>{problem_title}</strong> has been evaluated by our isolated sandbox.</p>
            <p style="background-color: #0f172a; padding: 12px 16px; border-radius: 8px; border: 1px solid #334155;">
              Verdict: <strong style="color: {verdict_color}; font-size: 15px;">{verdict}</strong> ({passed}/{total} test cases passed)
            </p>
            <p>Click below to inspect runtime diagnostics and review your AI code analysis.</p>
            """
            text = f"Hi {context.get('name', 'Candidate')},\n\nYour solution for '{context.get('problem_title', 'Coding Problem')}' finished evaluation. Verdict: {verdict} ({passed}/{total} passed).\n\nReview: {action_url}\n\nSkillBridge AI Team"

        elif template_name == "security_alert":
            subject = "Security Alert: Important Account Activity — SkillBridge AI"
            activity = html.escape(str(context.get("activity", "Account Security Change")))
            action_url = f"{base_url}/profile"
            action_text = "Check Account Security"
            content = f"""
            <p>Hi <strong>{name}</strong>,</p>
            <p>We detected the following security-sensitive activity on your SkillBridge AI account:</p>
            <p style="background-color: #0f172a; padding: 12px 16px; border-radius: 8px; border: 1px solid #f43f5e; color: #fca5a5;">
              <strong>{activity}</strong>
            </p>
            <p>If you authorized this change, you can safely disregard this email. If you did not make this change, please sign in and change your credentials immediately.</p>
            """
            text = f"Hi {context.get('name', 'Candidate')},\n\nSecurity Alert: {context.get('activity', 'Account Security Change')}.\nIf you did not perform this action, please secure your account immediately: {action_url}\n\nSkillBridge AI Security Team"

        else:
            subject = str(context.get("subject", "SkillBridge AI Notification"))
            message = html.escape(str(context.get("message", "You have a new notification.")))
            action_url = f"{base_url}/notifications"
            action_text = "View Notifications"
            content = f"<p>Hi <strong>{name}</strong>,</p><p>{message}</p>"
            text = f"Hi {context.get('name', 'Candidate')},\n\n{context.get('message', 'You have a new notification.')}\n\nView notifications: {action_url}\n\nSkillBridge AI Team"

        html_body = _base_email_layout(title=subject, content_html=content, action_url=action_url, action_text=action_text)
        return subject, html_body, text

