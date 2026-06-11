import type { ReactNode } from "react";

type MetaRowProps = {
  label: string;
  value: ReactNode;
};

export function MetaRow({ label, value }: MetaRowProps) {
  return (
    <div className="meta-row">
      <span className="meta-label">{label}</span>
      <span className="meta-value">{value}</span>
    </div>
  );
}
