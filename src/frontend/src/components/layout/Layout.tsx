import { SignInButton } from "@/components/InternetIdentity";
import { AccessibilityControls } from "@/components/accessibility/AccessibilityControls";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  Accessibility,
  Brain,
  Eye,
  Menu,
  MessageCircle,
  Sparkles,
  X,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { CORE_NAV, MODULE_NAV, type NavItem } from "./nav-config";

const ICONS = {
  sparkles: Sparkles,
  eye: Eye,
  "message-circle": MessageCircle,
  brain: Brain,
  accessibility: Accessibility,
} as const;

function NavLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const Icon = ICONS[item.icon];
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      activeOptions={{ exact: item.to === "/" }}
      className="group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-smooth hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      activeProps={{
        className:
          "bg-sidebar-accent text-sidebar-accent-foreground shadow-subtle",
      }}
      data-ocid={`nav.link.${item.to === "/" ? "core" : item.to.slice(1)}`}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-4 py-5">
      <Link
        to="/"
        onClick={onNavigate}
        className="flex items-center gap-2.5 rounded-lg px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        data-ocid="nav.brand_link"
      >
        <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
          <Accessibility aria-hidden="true" className="size-5" />
        </span>
        <span className="flex flex-col leading-none">
          <span className="font-display text-lg font-bold tracking-tight text-sidebar-foreground">
            ACCESSAI
          </span>
          <span className="text-[0.625rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Access for everyone
          </span>
        </span>
      </Link>

      <nav aria-label="Primary" className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Workspace
          </p>
          <NavLink item={CORE_NAV} onNavigate={onNavigate} />
        </div>
        <div className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Accessibility tools
          </p>
          {MODULE_NAV.map((item) => (
            <NavLink key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      </nav>

      <div className="mt-auto flex flex-col gap-4">
        <AccessibilityControls compact />

        <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-4">
          <p className="font-display text-sm font-semibold text-sidebar-foreground">
            Adaptive AI core
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            One space. Your kind of support — available from every module.
          </p>
        </div>

        <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-4">
          <p className="font-display text-sm font-semibold text-sidebar-foreground">
            Your account
          </p>
          <p className="mt-1 mb-3 text-xs leading-relaxed text-muted-foreground">
            Sign in to save your pathway and conversation history to your own
            private workspace.
          </p>
          <SignInButton className="w-full rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition-smooth hover:opacity-90 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" />
        </div>
      </div>
    </div>
  );
}

/**
 * App shell: skip link, persistent sidebar on desktop, a slide-over drawer on
 * mobile, and a distinct content surface.
 */
export function Layout({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a href="#main-content" className="skip-link" data-ocid="nav.skip_link">
        Skip to main content
      </a>

      <div className="flex min-h-dvh">
        <aside
          aria-label="Sidebar"
          className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block"
        >
          <div className="sticky top-0 h-dvh">
            <SidebarContent />
          </div>
        </aside>

        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-background/70 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
              data-ocid="nav.drawer_backdrop"
            />
            <dialog
              open
              aria-label="Navigation"
              className="absolute inset-y-0 left-0 m-0 h-dvh w-72 max-w-[85vw] border-r border-sidebar-border bg-sidebar p-0 text-sidebar-foreground shadow-elevated"
              data-ocid="nav.drawer"
            >
              <div className="flex justify-end p-2">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close navigation"
                  className="flex size-11 items-center justify-center rounded-lg text-sidebar-foreground hover:bg-sidebar-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  data-ocid="nav.drawer_close_button"
                >
                  <X aria-hidden="true" className="size-5" />
                </button>
              </div>
              <div className="h-[calc(100dvh-3.5rem)]">
                <SidebarContent onNavigate={() => setDrawerOpen(false)} />
              </div>
            </dialog>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 shadow-subtle backdrop-blur lg:hidden">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
              className="flex size-11 items-center justify-center rounded-lg border border-border text-foreground hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              data-ocid="nav.drawer_open_button"
            >
              <Menu aria-hidden="true" className="size-5" />
            </button>
            <span className="font-display text-base font-bold tracking-tight">
              ACCESSAI
            </span>
            <div className="ml-auto">
              <SignInButton className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition-smooth hover:bg-accent/10 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" />
            </div>
          </header>

          <main
            id="main-content"
            tabIndex={-1}
            className={cn(
              "flex-1 bg-background px-4 py-6 sm:px-6 lg:px-10 lg:py-10",
            )}
          >
            {children}
          </main>

          <footer className="border-t border-border bg-card px-4 py-5 sm:px-6 lg:px-10">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()}. Built with love using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                  typeof window !== "undefined" ? window.location.hostname : "",
                )}`}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                caffeine.ai
              </a>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
