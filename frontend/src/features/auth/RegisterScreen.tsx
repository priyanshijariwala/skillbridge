import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate } from "react-router-dom"
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  registerSchema,
  type RegisterFormValues,
} from "@/features/auth/schemas/auth.schema"
import { useAuth } from "@/features/auth/hooks/useAuth"

export const RegisterScreen: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const passwordValue = watch("password") || ""

  // Calculate simple password strength (1-4 segments)
  const getPasswordStrength = (pwd: string) => {
    let score = 0
    if (pwd.length >= 8) score += 1
    if (/[A-Z]/.test(pwd)) score += 1
    if (/[0-9]/.test(pwd)) score += 1
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1
    return score
  }

  const passwordStrength = getPasswordStrength(passwordValue)

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true)
    setAuthError(null)
    setSuccessMessage(null)

    try {
      await registerUser(data)
      setSuccessMessage("Account created successfully! Redirecting to login...")
      setTimeout(() => {
        navigate("/login", {
          state: {
            registeredMessage: `Registration successful for ${data.email}. You can now sign in.`,
          },
        })
      }, 1200)
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Registration failed. Please review your details and try again."
      setAuthError(errorMessage)
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
        <CardDescription>
          Start your personalized AI-driven career preparation today
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          {successMessage && (
            <div
              role="status"
              className="p-3 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {authError && (
            <div
              role="alert"
              className="p-3 rounded-lg text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="name"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
            >
              <UserIcon className="w-3.5 h-3.5" />
              Full Name
            </label>
            <Input
              id="name"
              type="text"
              placeholder="e.g. Alex Vance"
              disabled={isLoading}
              error={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs font-medium text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="alex@example.com"
              disabled={isLoading}
              error={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs font-medium text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              Password (min. 8 characters)
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                disabled={isLoading}
                error={!!errors.password}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs font-medium text-destructive">{errors.password.message}</p>
            )}

            {/* Password Strength Indicator */}
            {passwordValue.length > 0 && (
              <div className="pt-1 space-y-1">
                <div className="flex gap-1 h-1.5 w-full">
                  <div
                    className={`flex-1 rounded-full ${
                      passwordStrength >= 1 ? "bg-rose-500" : "bg-muted"
                    }`}
                  />
                  <div
                    className={`flex-1 rounded-full ${
                      passwordStrength >= 2 ? "bg-amber-500" : "bg-muted"
                    }`}
                  />
                  <div
                    className={`flex-1 rounded-full ${
                      passwordStrength >= 3 ? "bg-blue-500" : "bg-muted"
                    }`}
                  />
                  <div
                    className={`flex-1 rounded-full ${
                      passwordStrength >= 4 ? "bg-emerald-500" : "bg-muted"
                    }`}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {passwordStrength === 1 && "Weak password"}
                  {passwordStrength === 2 && "Fair password"}
                  {passwordStrength === 3 && "Good password"}
                  {passwordStrength === 4 && "Strong password"}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="confirmPassword"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Confirm Password
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                disabled={isLoading}
                error={!!errors.confirmPassword}
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs font-medium text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            disabled={isLoading || !!successMessage}
          >
            <span>Create Account</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

export default RegisterScreen
