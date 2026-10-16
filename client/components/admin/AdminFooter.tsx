import { APP_VERSION } from "@/lib/app-version";

export default function AdminFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 items-center gap-3 text-xs text-muted-foreground md:grid-cols-3 md:gap-4">
          <div className="flex flex-wrap items-center justify-center gap-x-2 md:justify-start">
            <span className="font-semibold text-foreground">STC Solution</span>
            <span aria-hidden="true">•</span>
            <span>v{APP_VERSION}</span>
          </div>

          <nav className="flex items-center justify-center gap-3">
            <a
              href="/admin/privacy"
              className="transition-colors hover:text-foreground"
            >
              Privacy
            </a>
            <span aria-hidden="true">•</span>
            <a
              href="/admin/terms"
              className="transition-colors hover:text-foreground"
            >
              Terms
            </a>
          </nav>

          <div className="text-center md:text-right">
            © {currentYear} Powered by{" "}
            <a
              href="https://ekd-tech-solutions.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-primary"
            >
              EKD Tech solutions
            </a>
            .
          </div>
        </div>
      </div>
    </footer>
  );
}
