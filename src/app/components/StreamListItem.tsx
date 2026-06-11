import { useEffect, useRef, useState } from "react";

import type { StreamListItem as StreamListItemModel, VisibleStreamAction } from "../../entities/stream/model/stream.ts";
import { StatusBadge } from "./StatusBadge.tsx";

type StreamListItemProps = {
  isSelected: boolean;
  item: StreamListItemModel;
  onAction: (streamId: string, action: VisibleStreamAction) => void;
  onSelect: (streamId: string) => void;
};

export function StreamListItem({ isSelected, item, onAction, onSelect }: StreamListItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  return (
    <article className={`stream-row${isSelected ? " is-selected" : ""}`} onClick={() => onSelect(item.streamId)}>
      <div className="stream-main">
        <img alt={`${item.title} cover art`} className="stream-thumb" src={item.imageUrl} />
        <div className="stream-copy">
          <h3 className="stream-title">{item.title}</h3>
          <p className="stream-summary">{item.summary}</p>
        </div>
      </div>
      <div className="stream-status">
        <StatusBadge status={item.status} />
      </div>
      <div className="stream-created">{formatDate(item.createdAt)}</div>
      <div className="menu-wrap" onClick={(event) => event.stopPropagation()} ref={menuRef}>
        <div className={`menu${isMenuOpen ? " is-open" : ""}`}>
          <button
            aria-expanded={isMenuOpen}
            aria-label={`Open actions for ${item.title}`}
            className="menu-trigger"
            onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
            type="button"
          >
            <span aria-hidden="true" className="menu-dots">
              <span />
              <span />
              <span />
            </span>
          </button>
          {isMenuOpen ? (
            <div className="menu-panel">
              {item.availableActions.map((action) => (
                <button
                  className="menu-item"
                  key={action}
                  onClick={() => {
                    setIsMenuOpen(false);
                    onAction(item.streamId, action);
                  }}
                  type="button"
                >
                  {action === "view"
                    ? "View Details"
                    : action === "edit"
                      ? "Edit"
                      : action === "publish"
                        ? "Publish"
                        : action === "unpublish"
                          ? "Unpublish"
                          : "Delete"}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
