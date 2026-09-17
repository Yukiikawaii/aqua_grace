import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

interface NavItem {
  label: string;
  path: string;
  icon: JSX.Element;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Home", path: "/admin/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    label: "Account", path: "/admin/dashboard/account",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    label: "Orders", path: "/admin/dashboard/orders",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    label: "Deliveries", path: "/admin/dashboard/deliveries",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8Z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    label: "Stocks", path: "/admin/dashboard/stocks",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2" />
        <rect x="3" y="8" width="18" height="13" rx="1" />
        <path d="M9 8v13M15 8v13" />
      </svg>
    ),
  },
  {
    label: "Sales", path: "/admin/dashboard/sales",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {mobileOpen && (
        <div className="sidebar__overlay" aria-hidden="true" onClick={onMobileClose} />
      )}
      <aside
        className={`sidebar ${expanded ? "sidebar--expanded" : ""} ${mobileOpen ? "sidebar--mobile-open" : ""}`}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        aria-label="Admin navigation"
      >
        <div className="sidebar__brand">
          <span className="sidebar__brand-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3.5c3.2 4 6 7.3 6 10.7a6 6 0 1 1-12 0c0-3.4 2.8-6.7 6-10.7Z" />
            </svg>
          </span>
          <span className="sidebar__brand-label">Aqua Grace</span>
        </div>

        <nav className="sidebar__nav">
          <ul className="sidebar__list">
            {NAV_ITEMS.map((item) => (
              <li key={item.label} className="sidebar__item">
                <NavLink
                  to={item.path}
                  end={item.path === "/admin/dashboard"}
                  className={({ isActive }) => `sidebar__link ${isActive ? "sidebar__link--active" : ""}`}
                  onClick={onMobileClose}
                >
                  <span className="sidebar__icon" aria-hidden="true">{item.icon}</span>
                  <span className="sidebar__label">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar__footer">
          <button type="button" className="sidebar__signout" onClick={() => window.location.href = "/"}>
            <span className="sidebar__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <span className="sidebar__label">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
