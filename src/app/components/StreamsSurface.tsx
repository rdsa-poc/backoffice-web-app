import type { ReactNode } from "react";

type StreamsSurfaceProps = {
  children: ReactNode;
};

export function StreamsSurface({ children }: StreamsSurfaceProps) {
  return <section className="streams-surface">{children}</section>;
}
