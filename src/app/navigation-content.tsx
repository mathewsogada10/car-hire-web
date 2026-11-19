import { useId } from "react";
import { navigationGroups } from "./navigation";

type Props = {
  view: string;
  onNavigate: (view: string) => void;
  onSignOut: () => void;
  onClose?: () => void;
};

export function NavigationContent({
  view,
  onNavigate,
  onSignOut,
  onClose,
}: Props) {
  const id = useId();
  return (
    <div className="navigation-content">
      <div className="brand">
        <div className="brand-mark">CH</div>
        <strong>
          Car Hire<span>OWNER WORKSPACE</span>
        </strong>
        {onClose && (
          <button
            className="quiet navigation-close"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            Close menu
          </button>
        )}
      </div>
      <p className="navigation-hint">All sections below. Scroll to see more.</p>
      <nav aria-label="Main navigation">
        {navigationGroups.map((group, index) => (
          <section
            className="navigation-group"
            key={group.title}
            aria-labelledby={`${id}-${index}`}
          >
            <h2 className="navigation-group-title" id={`${id}-${index}`}>
              {group.title}
            </h2>
            {group.items.map(([key, title]) => (
              <button
                key={key}
                aria-current={view === key ? "page" : undefined}
                onClick={() => onNavigate(key)}
              >
                {title}
              </button>
            ))}
          </section>
        ))}
      </nav>
      <div className="sidebar-footer">
        <span>KES / Nairobi</span>
        <button className="quiet" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </div>
  );
}
