export type StreamStatus = "draft" | "inactive" | "active";
export type StreamAction = "delete";
export type StreamLifecycleAction = "publish" | "unpublish";
export type VisibleStreamAction = StreamAction | StreamLifecycleAction | "edit" | "view";

export type StreamListItem = {
  availableActions: VisibleStreamAction[];
  createdAt: string;
  imageUrl: string;
  position: number;
  status: StreamStatus;
  streamId: string;
  summary: string;
  title: string;
};

export type StreamListResponse = {
  items: StreamListItem[];
};

export type StreamDetail = {
  createdAt: string;
  imageUrl: string;
  projectionSyncState: "in_sync" | "sync_error";
  publishedAt: string | null;
  status: StreamStatus;
  streamId: string;
  streamUrl: string;
  summary: string;
  title: string;
  updatedAt: string;
};
