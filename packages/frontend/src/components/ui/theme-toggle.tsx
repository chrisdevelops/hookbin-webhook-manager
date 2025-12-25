import { useTheme } from "next-themes"
import { HugeiconsIcon } from "@hugeicons/react"
import { Sun01Icon, Moon02Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function ThemeToggle({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const toggleTheme = () => {
    // Use resolvedTheme for system theme, fallback to theme
    const currentTheme = resolvedTheme || theme
    setTheme(currentTheme === "dark" ? "light" : "dark")
  }

  return (
    <Button
      data-slot="theme-toggle"
      variant="ghost"
      size="icon-sm"
      className={cn(className)}
      onClick={toggleTheme}
      aria-label="Toggle theme"
      {...props}
    >
      <HugeiconsIcon
        icon={Sun01Icon}
        strokeWidth={2}
        className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
      />
      <HugeiconsIcon
        icon={Moon02Icon}
        strokeWidth={2}
        className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

export { ThemeToggle }
