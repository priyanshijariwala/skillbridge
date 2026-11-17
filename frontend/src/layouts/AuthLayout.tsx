import React from "react"
import { Outlet, NavLink } from "react-router-dom"
import { CheckCircle2 } from "lucide-react"

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background">
      {/* Left Column: Platform Value Hero (Desktop Only) */}
      <div className="hidden lg:flex lg:col-span-5 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="relative z-10">
          <NavLink to="/login" className="flex items-center gap-2.5 font-bold text-xl">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold shadow-sm">
              ⚡
            </div>
            <span>SkillBridge AI</span>
          </NavLink>

          <div className="mt-16 space-y-6">
            <h1 className="text-3xl font-bold tracking-tight leading-tight">
              Master technical interviews with adaptive AI preparation.
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Connect your verified resume experience with market-calibrated skill gap analyses, custom weekly learning roadmaps, and realistic mock interview rehearsals.
            </p>

            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Deterministic resume parsing & competency audits</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Adaptive follow-up questions tailored to your answers</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Personalized 4-week actionable study roadmaps</span>
              </div>
            </div>
          </div>
        </div>

        {/* Advisory Quote Card */}
        <div className="relative z-10 p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 backdrop-blur-xs">
          <p className="text-xs text-slate-300 italic">
            "SkillBridge's adaptive technical questions immediately exposed the race condition edge-cases I was glossing over in caching rounds."
          </p>
          <div className="mt-3 text-xs font-semibold text-white">Alex Vance • Senior Backend Engineer</div>
        </div>
      </div>

      {/* Right Column: Form Workspace */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex items-center gap-2.5 font-bold text-lg text-foreground">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
              ⚡
            </div>
            <span>SkillBridge AI</span>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
