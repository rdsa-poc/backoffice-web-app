export type StreamStatus = "draft" | "inactive" | "active";
export type StreamBackendAction = "delete" | "edit" | "publish" | "unpublish" | "view";
export type StreamLifecycleAction = "publish" | "unpublish";

export type StreamCatalogItem = {
  availableActions: StreamBackendAction[];
  createdAt: string;
  imageUrl: string;
  position: number;
  status: StreamStatus;
  streamId: string;
  title: string;
};

export type StreamListResponse = {
  items: StreamCatalogItem[];
};

export type StreamDetail = {
  createdAt: string;
  imageUrl: string;
  status: StreamStatus;
  streamId: string;
  streamUrl: string;
  summary: string;
  title: string;
  updatedAt: string;
};

export type StreamMutationInput = {
  imageUrl: string;
  streamUrl: string;
  summary: string;
  title: string;
};

export type StreamMutationResult = {
  status: StreamStatus;
  streamId: string;
  updatedAt?: string;
};

export type StreamDeleteResult = {
  deleted: true;
  streamId: string;
};

export type StreamPublishResult = {
  projectionTarget: string;
  status: "active";
  streamId: string;
};

export type StreamUnpublishResult = {
  projectionRemoved: true;
  status: "inactive";
  streamId: string;
};

export type StreamApiIssue = {
  field: string;
  message: string;
};
