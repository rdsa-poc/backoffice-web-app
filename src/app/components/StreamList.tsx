import type { StreamBackendAction, StreamCatalogItem } from "../../entities/stream/model/stream.ts";
import { StreamListItem } from "./StreamListItem.tsx";

type StreamListProps = {
  currentPage: number;
  isLoading: boolean;
  query: string;
  selectedStreamId?: string;
  streams: StreamCatalogItem[];
  totalPages: number;
  totalStreams: number;
  onAction: (stream: StreamCatalogItem, action: StreamBackendAction) => void;
  onPageChange: (page: number) => void;
  onQueryChange: (value: string) => void;
  onSelect: (streamId: string) => void;
};

export function StreamList({
  currentPage,
  isLoading,
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
            placeholder="Search by title or stream ID..."
            value={query}
          />
        </label>
        <div className="field filter" role="button" tabIndex={0}>
          <span>CRUD Catalog</span>
          <span aria-hidden="true">▾</span>
        </div>
      </div>

      <div className="table-header">
        <span>Stream</span>
        <span>Status</span>
        <span>Created</span>
        <span />
      </div>

      {isLoading && streams.length === 0 ? <div className="list-empty-state">Loading stream catalog...</div> : null}
      {!isLoading && streams.length === 0 ? <div className="list-empty-state">No streams match the current view.</div> : null}

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
    return "No streams available";
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, start + pageSize - 1);
  return `Showing ${start}-${end} of ${total} streams`;
}
