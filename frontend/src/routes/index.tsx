import { createBrowserRouter, Navigate } from "react-router-dom"
import AppLayout from "@/layouts/AppLayout"
import AuthLayout from "@/layouts/AuthLayout"
import ProtectedRoute from "@/features/auth/components/ProtectedRoute"
import PublicOnlyRoute from "@/features/auth/components/PublicOnlyRoute"

import LoginScreen from "@/features/auth/LoginScreen"
import RegisterScreen from "@/features/auth/RegisterScreen"
import DashboardScreen from "@/features/dashboard/DashboardScreen"
import ResumeScreen from "@/features/resume/ResumeScreen"
import SkillGapScreen from "@/features/skill-gap/SkillGapScreen"
import RoadmapScreen from "@/features/roadmap/RoadmapScreen"
import InterviewSetupScreen from "@/features/interview/InterviewSetupScreen"
import InterviewScreen from "@/features/interview/InterviewScreen"
import InterviewFeedbackScreen from "@/features/interview/InterviewFeedbackScreen"
import InterviewHistoryScreen from "@/features/interview/InterviewHistoryScreen"
import CareerAssistantScreen from "@/features/assistant/CareerAssistantScreen"
import ProfileScreen from "@/features/profile/ProfileScreen"
import NotFoundScreen from "@/features/common/NotFoundScreen"

export const router = createBrowserRouter([
  // Public-only Auth Routes (Redirects to dashboard if already authenticated)
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: "/login",
            element: <LoginScreen />,
          },
          {
            path: "/register",
            element: <RegisterScreen />,
          },
        ],
      },
    ],
  },

  // Protected Application Routes (Redirects to login if unauthenticated)
  {
    element: <ProtectedRoute />,
    children: [
      // Active Distraction-Free Interview Route (Zen Mode - outside standard sidebar)
      {
        path: "/interview/:interviewId",
        element: <InterviewScreen />,
      },

      // Authenticated Application Routes (inside AppLayout)
      {
        element: <AppLayout />,
        children: [
          {
            path: "/",
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: "/dashboard",
            element: <DashboardScreen />,
          },
          {
            path: "/resume",
            element: <ResumeScreen />,
          },
          {
            path: "/skill-gap",
            element: <SkillGapScreen />,
          },
          {
            path: "/roadmap",
            element: <RoadmapScreen />,
          },
          {
            path: "/interview/setup",
            element: <InterviewSetupScreen />,
          },
          {
            path: "/interview/:interviewId/feedback",
            element: <InterviewFeedbackScreen />,
          },
          {
            path: "/interview-history",
            element: <InterviewHistoryScreen />,
          },
          {
            path: "/career-assistant",
            element: <CareerAssistantScreen />,
          },
          {
            path: "/profile",
            element: <ProfileScreen />,
          },
          {
            path: "/settings",
            element: <ProfileScreen />,
          },
          {
            path: "*",
            element: <NotFoundScreen />,
          },
        ],
      },
    ],
  },
])

export default router
