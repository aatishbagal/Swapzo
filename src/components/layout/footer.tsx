import Link from "next/link"

export function Footer() {
  const currentYear = new Date().getFullYear()
  return (
    <footer className="border-t border-border/40 py-8">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row max-w-screen-2xl">
        <p className="text-sm text-muted-foreground">
          &copy; {currentYear} SwapZo. All rights reserved.
        </p>
        <nav className="flex gap-4">
          <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
            Privacy Policy
          </Link>
          <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  )
}
