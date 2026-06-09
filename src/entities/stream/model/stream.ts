export type StreamStatus = "draft" | "inactive" | "active";
export type StreamAction = "delete";
export type StreamLifecycleAction = "activate" | "deactivate" | "publish";
export type VisibleStreamAction = StreamAction | StreamLifecycleAction | "edit" | "view";

export type StreamListItem = {
  availableActions: VisibleStreamAction[];
  imageUrl: string;
  position: number;
  status: StreamStatus;
  streamId: string;
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
