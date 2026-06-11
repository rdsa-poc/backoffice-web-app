import type { StreamListItem as StreamListItemModel, VisibleStreamAction } from "../../entities/stream/model/stream.ts";
import { StreamListItem } from "./StreamListItem.tsx";

type StreamListProps = {
  currentPage: number;
  query: string;
  selectedStreamId?: string;
  streams: StreamListItemModel[];
  totalPages: number;
  totalStreams: number;
  onAction: (streamId: string, action: VisibleStreamAction) => void;
  onPageChange: (page: number) => void;
  onQueryChange: (value: string) => void;
  onSelect: (streamId: string) => void;
};

export function StreamList({
  currentPage,
  query,
  selectedStreamId,
  streams,
  totalPages,
  totalStreams,
  onAction,
  onPageChange,
  onQueryChange,
  onSelect,
}: StreamListProps) {
  return (
    <div className="list-card">
      <div className="toolbar">
        <label aria-label="Search streams" className="field search">
          <span aria-hidden="true" className="field-icon" />
          <input
            className="search-input"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search streams..."
            value={query}
          />
        </label>
        <div className="field filter" role="button" tabIndex={0}>
          <span>All Status</span>
          <span aria-hidden="true">▾</span>
        </div>
      </div>

      <div className="table-header">
        <span>Stream</span>
        <span>Status</span>
        <span>Created</span>
        <span />
      </div>

      {streams.map((stream) => (
        <StreamListItem
          isSelected={selectedStreamId === stream.streamId}
          item={stream}
          key={stream.streamId}
          onAction={onAction}
          onSelect={onSelect}
        />
      ))}

      <div className="pagination">
        <span>{buildShowingLabel(totalStreams, currentPage, streams.length)}</span>
        <nav aria-label="Pagination" className="pagination-nav">
          <button
            className="pagination-link"
            disabled={currentPage === 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            type="button"
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              className={`pagination-link${page === currentPage ? " is-current" : ""}`}
              key={page}
              onClick={() => onPageChange(page)}
              type="button"
            >
              {page}
            </button>
          ))}
          <button
            className="pagination-link"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            type="button"
          >
            ›
          </button>
        </nav>
      </div>
    </div>
  );
}

function buildShowingLabel(total: number, page: number, pageSize: number) {
  if (total === 0) {
    return "No streams match the current filter";
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, start + pageSize - 1);
  return `Showing ${start}-${end} of ${total} streams`;
}
