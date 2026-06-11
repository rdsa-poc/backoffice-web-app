type SidebarLinkProps = {
  active?: boolean;
  label: string;
};

export function SidebarLink({ active = false, label }: SidebarLinkProps) {
  return (
    <a className={`sidebar-link${active ? " is-active" : ""}`} href="#" aria-current={active ? "page" : undefined}>
      {label}
    </a>
  );
}
