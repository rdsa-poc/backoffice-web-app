export type OperatorRoute =
  | { kind: "catalog" }
  | { kind: "stream-create" }
  | { kind: "stream-detail"; streamId: string }
  | { kind: "stream-edit"; streamId: string };

export function resolveOperatorRoute(pathname: string): OperatorRoute {
  if (pathname === "/" || pathname === "/streams") {
    return { kind: "catalog" };
  }

  if (pathname === "/streams/new") {
    return { kind: "stream-create" };
  }

  const editMatch = /^\/streams\/([^/]+)\/edit$/.exec(pathname);
  if (editMatch?.[1]) {
    return { kind: "stream-edit", streamId: decodeURIComponent(editMatch[1]) };
  }

  const detailMatch = /^\/streams\/([^/]+)$/.exec(pathname);
  if (detailMatch?.[1]) {
    return { kind: "stream-detail", streamId: decodeURIComponent(detailMatch[1]) };
  }

  return { kind: "catalog" };
}
