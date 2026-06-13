import type {
  StreamApiIssue,
  StreamCatalogItem,
  StreamDeleteResult,
  StreamDetail,
  StreamListResponse,
  StreamMutationInput,
  StreamMutationResult,
  StreamPublishResult,
  StreamUnpublishResult,
} from "../../../entities/stream/model/stream.ts";
import type { AppConfig } from "../../config/app-config.ts";

type FetchLike = typeof fetch;

type ApiErrorPayload = {
  issues?: StreamApiIssue[];
  message?: string;
};

export class StreamApiError extends Error {
  readonly issues: StreamApiIssue[];
  readonly status: number;

  constructor(status: number, message: string, issues: StreamApiIssue[] = []) {
    super(message);
    this.name = "StreamApiError";
    this.status = status;
    this.issues = issues;
  }
}

export async function listStreams(config: AppConfig, fetchImpl: FetchLike = fetch): Promise<StreamCatalogItem[]> {
  const response = await requestJson<StreamListResponse>(`${config.apiBaseUrl}/api/streams`, { method: "GET" }, fetchImpl);
  return response.items;
}

export function getStreamDetail(
  config: AppConfig,
  streamId: string,
  fetchImpl: FetchLike = fetch,
): Promise<StreamDetail> {
  return requestJson<StreamDetail>(
    `${config.apiBaseUrl}/api/streams/${encodeURIComponent(streamId)}`,
    { method: "GET" },
    fetchImpl,
  );
}

export function createStream(
  config: AppConfig,
  input: StreamMutationInput,
  fetchImpl: FetchLike = fetch,
): Promise<StreamMutationResult> {
  return requestJson<StreamMutationResult>(
    `${config.apiBaseUrl}/api/streams`,
    {
      body: JSON.stringify(input),
      headers: { "content-type": "application/json" },
      method: "POST",
    },
    fetchImpl,
  );
}

export function updateStream(
  config: AppConfig,
  streamId: string,
  input: StreamMutationInput,
  fetchImpl: FetchLike = fetch,
): Promise<StreamMutationResult> {
  return requestJson<StreamMutationResult>(
    `${config.apiBaseUrl}/api/streams/${encodeURIComponent(streamId)}`,
    {
      body: JSON.stringify(input),
      headers: { "content-type": "application/json" },
      method: "PATCH",
    },
    fetchImpl,
  );
}

export function deleteStream(
  config: AppConfig,
  streamId: string,
  fetchImpl: FetchLike = fetch,
): Promise<StreamDeleteResult> {
  return requestJson<StreamDeleteResult>(
    `${config.apiBaseUrl}/api/streams/${encodeURIComponent(streamId)}`,
    { method: "DELETE" },
    fetchImpl,
  );
}

export function publishStream(
  config: AppConfig,
  streamId: string,
  fetchImpl: FetchLike = fetch,
): Promise<StreamPublishResult> {
  return requestJson<StreamPublishResult>(
    `${config.apiBaseUrl}/api/streams/${encodeURIComponent(streamId)}/publish`,
    { method: "POST" },
    fetchImpl,
  );
}

export function unpublishStream(
  config: AppConfig,
  streamId: string,
  fetchImpl: FetchLike = fetch,
): Promise<StreamUnpublishResult> {
  return requestJson<StreamUnpublishResult>(
    `${config.apiBaseUrl}/api/streams/${encodeURIComponent(streamId)}/unpublish`,
    { method: "POST" },
    fetchImpl,
  );
}

async function requestJson<T>(url: string, init: RequestInit, fetchImpl: FetchLike): Promise<T> {
  const response = await fetchImpl(url, init);
  const payload = await readPayload(response);

  if (!response.ok) {
    const errorPayload = payload as ApiErrorPayload;
    throw new StreamApiError(
      response.status,
      errorPayload.message ?? `Backoffice request failed with status ${response.status}.`,
      errorPayload.issues ?? [],
    );
  }

  return payload as T;
}

async function readPayload(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return {
    message: (await response.text()).trim(),
  };
}
