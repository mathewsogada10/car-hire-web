import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { NavigationContent } from "./navigation-content";
import { navigationTitle } from "./navigation";

type Props = {
  authenticated: boolean;
  view: string;
  onNavigate: (view: string) => void;
  onSignOut: () => Promise<void>;
  children: ReactNode;
};

export function WorkspaceShell({
  authenticated,
  view,
  onNavigate,
  onSignOut,
  children,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const expanded = authenticated && menuOpen;

  useEffect(() => {
    const menu = dialog.current;
    if (!expanded || !menu) return;
    const overflow = document.body.style.overflow;
    menu.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      menu.close();
      document.body.style.overflow = overflow;
    };
  }, [expanded]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 851px)");
    const resize = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    desktop.addEventListener("change", resize);
    return () => desktop.removeEventListener("change", resize);
  }, []);

  function navigate(next: string) {
    if (next !== view) onNavigate(next);
    setMenuOpen(false);
  }

  function signOut() {
    setMenuOpen(false);
    void onSignOut();
  }

  const navigation = { view, onNavigate: navigate, onSignOut: signOut };
  return (
    <>
      <aside
        id="workspace-sidebar"
        className="desktop-sidebar"
        hidden={sidebarCollapsed}
        inert={!authenticated}
      >
        <NavigationContent {...navigation} />
      </aside>
      <dialog
        ref={dialog}
        id="workspace-menu"
        className="navigation-drawer"
        aria-label="Navigation menu"
        onClose={() => setMenuOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setMenuOpen(false);
        }}
      >
        <NavigationContent {...navigation} onClose={() => setMenuOpen(false)} />
      </dialog>
      <main
        id="workspace"
        className={sidebarCollapsed ? "sidebar-collapsed" : undefined}
        inert={!authenticated}
      >
        <header>
          <button
            className="quiet sidebar-toggle"
            aria-label={
              sidebarCollapsed
                ? "Expand navigation menu"
                : "Collapse navigation menu"
            }
            aria-controls="workspace-sidebar"
            aria-expanded={!sidebarCollapsed}
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                d={
                  sidebarCollapsed
                    ? "M4 4v16m5-14 6 6-6 6"
                    : "M4 4v16m11-14-6 6 6 6"
                }
              />
            </svg>
            {sidebarCollapsed ? "Expand menu" : "Collapse menu"}
          </button>
          <button
            className="quiet navigation-toggle"
            aria-label="Open navigation menu"
            aria-controls="workspace-menu"
            aria-expanded={expanded}
            onClick={() => setMenuOpen(true)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
            Menu
          </button>
          <span className="workspace-location">{navigationTitle(view)}</span>
          <span className="badge">Owner</span>
        </header>
        {children}
      </main>
    </>
  );
}
