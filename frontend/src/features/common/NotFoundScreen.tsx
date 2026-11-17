import React from "react"
import { useNavigate } from "react-router-dom"
import { Compass, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export const NotFoundScreen: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
        <Compass className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
        Page Not Found
      </h1>
      <p className="text-sm text-muted-foreground max-w-md mb-8">
        The route you are looking for does not exist or has been relocated within the SkillBridge AI preparation system.
      </p>
      <Button onClick={() => navigate("/dashboard")}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Return to Dashboard
      </Button>
    </div>
  )
}

export default NotFoundScreen
