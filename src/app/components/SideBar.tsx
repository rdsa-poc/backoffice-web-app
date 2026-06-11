import { SidebarLink } from "./SidebarLink.tsx";

export function SideBar() {
  return (
    <aside className="sidebar">
      <div className="brand" aria-label="Radiosa backoffice">
        <div className="brand-mark" aria-hidden="true" />
        <div className="brand-wordmark">radiosa</div>
      </div>
      <nav className="sidebar-nav" aria-label="Primary">
        <SidebarLink label="Overview" />
        <SidebarLink active label="Streams" />
        <SidebarLink label="Schedules" />
        <SidebarLink label="Media" />
        <SidebarLink label="Playlists" />
        <SidebarLink label="Analytics" />
        <SidebarLink label="Alerts" />
        <SidebarLink label="Settings" />
      </nav>
      <div className="sidebar-footer">
        <div className="operator-avatar">OP</div>
        <div className="operator-meta">
          <span className="operator-name">Operator</span>
          <span className="operator-email">ops@radiosa.fm</span>
        </div>
      </div>
    </aside>
  );
}
