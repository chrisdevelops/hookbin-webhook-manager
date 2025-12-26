import React, { type FormEvent } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field"
import { useAuth } from "@/contexts/AuthContext"

interface LoginFormProps {
  className?: string
  onSuccess?: () => void
}

function LoginForm({ className, onSuccess }: LoginFormProps) {
  const { login, error: authError } = useAuth()
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)

    // Basic validation
    if (!username.trim()) {
      setFormError("Username is required")
      return
    }
    if (!password) {
      setFormError("Password is required")
      return
    }

    setIsSubmitting(true)

    try {
      await login(username, password)
      onSuccess?.()
    } catch (err) {
      // Error is handled by AuthContext and exposed via authError
      // but we can also set a local form error for immediate feedback
      setFormError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayError = formError || authError

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("w-full", className)}
      data-slot="login-form"
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            autoComplete="username"
            autoFocus
            disabled={isSubmitting}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={isSubmitting}
          />
        </Field>

        {displayError && (
          <FieldError>{displayError}</FieldError>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </FieldGroup>
    </form>
  )
}

export { LoginForm }
