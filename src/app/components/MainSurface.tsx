import type { ReactNode } from "react";

type MainSurfaceProps = {
  children: ReactNode;
};

export function MainSurface({ children }: MainSurfaceProps) {
  return <section className="content">{children}</section>;
}
