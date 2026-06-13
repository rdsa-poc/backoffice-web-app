import { useEffect, useRef, useState } from "react";

import type { StreamBackendAction, StreamCatalogItem } from "../../entities/stream/model/stream.ts";
import { StatusBadge } from "./StatusBadge.tsx";

type StreamListItemProps = {
  isSelected: boolean;
  item: StreamCatalogItem;
  onAction: (stream: StreamCatalogItem, action: StreamBackendAction) => void;
  onSelect: (streamId: string) => void;
};

export function StreamListItem({ isSelected, item, onAction, onSelect }: StreamListItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const visibleActions = item.availableActions;

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
          <p className="stream-position">#{item.position}</p>
          <h3 className="stream-title">{item.title}</h3>
          <p className="stream-summary">{item.streamId}</p>
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
              {visibleActions.map((action) => (
                <button
                  className="menu-item"
                  key={action}
                  onClick={() => {
                    setIsMenuOpen(false);
                    onAction(item, action);
                  }}
                  type="button"
                >
                  {getActionLabel(item, action)}
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

function getActionLabel(item: StreamCatalogItem, action: StreamBackendAction) {
  if (action === "publish") {
    return item.status === "active" ? "Republish" : "Publish";
  }

  if (action === "unpublish") {
    return "Unpublish";
  }

  if (action === "view") {
    return "View Details";
  }

  if (action === "edit") {
    return "Edit";
  }

  return "Delete";
}
