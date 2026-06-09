import type {
  StreamAction,
  StreamDetail,
  StreamListResponse,
} from "../../../entities/stream/model/stream.ts";
import type { MutationResult, StreamFormInput } from "../../../features/stream-management/model/stream-form.ts";
import type { AppConfig } from "../../config/app-config.ts";
import { collectFieldErrors, requestJson } from "../base-client.ts";

type FetchLike = typeof fetch;

export type StreamCatalogState =
  | { items: StreamListResponse["items"]; kind: "loaded" }
  | { kind: "error"; message: string };

export async function loadStreamCatalog(
  config: AppConfig,
  fetchImpl: FetchLike = fetch,
): Promise<StreamCatalogState> {
  const response = await requestJson<StreamListResponse>(
    `${config.apiBaseUrl}/api/streams`,
    { method: "GET" },
    fetchImpl,
  );

  if (!response.ok) {
    return {
      kind: "error",
      message: response.message,
    };
  }

  return {
    items: response.payload.items,
    kind: "loaded",
  };
}

export async function loadStreamDetail(
  config: AppConfig,
  streamId: string,
  fetchImpl: FetchLike = fetch,
) {
  return requestJson<StreamDetail>(
    `${config.apiBaseUrl}/api/streams/${encodeURIComponent(streamId)}`,
    { method: "GET" },
    fetchImpl,
  );
}

export async function createStream(
  config: AppConfig,
  input: StreamFormInput,
  fetchImpl: FetchLike = fetch,
): Promise<MutationResult<{ status: string; streamId: string }>> {
  return mutateStream(
    `${config.apiBaseUrl}/api/streams`,
    { body: JSON.stringify(input), method: "POST" },
    fetchImpl,
  );
}

export async function updateStream(
  config: AppConfig,
  streamId: string,
  input: StreamFormInput,
  fetchImpl: FetchLike = fetch,
): Promise<MutationResult<{ status: string; streamId: string }>> {
  return mutateStream(
    `${config.apiBaseUrl}/api/streams/${encodeURIComponent(streamId)}`,
    { body: JSON.stringify(input), method: "PUT" },
    fetchImpl,
  );
}

export async function performStreamAction(
  config: AppConfig,
  streamId: string,
  action: StreamAction,
  fetchImpl: FetchLike = fetch,
): Promise<MutationResult<{ deleted: boolean; streamId: string }>> {
  return mutateStream(
    `${config.apiBaseUrl}/api/streams/${encodeURIComponent(streamId)}`,
    { method: action === "delete" ? "DELETE" : "POST" },
    fetchImpl,
  );
}

async function mutateStream<T>(
  input: string,
  init: RequestInit,
  fetchImpl: FetchLike,
): Promise<MutationResult<T>> {
  const response = await requestJson<T>(
    input,
    {
      ...init,
      headers: {
        "content-type": "application/json",
      },
    },
    fetchImpl,
  );

  if (!response.ok) {
    return {
      fieldErrors: undefined,
      kind: "error",
      message: response.message,
      statusCode: response.statusCode,
    };
  }

  return {
    kind: "success",
    value: response.payload,
  };
}

export async function createStreamWithValidation(
  config: AppConfig,
  input: StreamFormInput,
  fetchImpl: FetchLike = fetch,
): Promise<MutationResult<{ status: string; streamId: string }>> {
  const response = await requestRaw(
    `${config.apiBaseUrl}/api/streams`,
    { body: JSON.stringify(input), method: "POST" },
    fetchImpl,
  );
  return mapMutationResponse(response);
}

export async function updateStreamWithValidation(
  config: AppConfig,
  streamId: string,
  input: StreamFormInput,
  fetchImpl: FetchLike = fetch,
): Promise<MutationResult<{ status: string; streamId: string }>> {
  const response = await requestRaw(
    `${config.apiBaseUrl}/api/streams/${encodeURIComponent(streamId)}`,
    { body: JSON.stringify(input), method: "PUT" },
    fetchImpl,
  );
  return mapMutationResponse(response);
}

export async function performStreamActionWithValidation(
  config: AppConfig,
  streamId: string,
  action: StreamAction,
  fetchImpl: FetchLike = fetch,
): Promise<MutationResult<{ deleted: boolean; streamId: string }>> {
  const response = await requestRaw(
    `${config.apiBaseUrl}/api/streams/${encodeURIComponent(streamId)}`,
    { method: action === "delete" ? "DELETE" : "POST" },
    fetchImpl,
  );
  return mapMutationResponse(response);
}

type RawResponse<T> =
  | { ok: true; payload: T; statusCode: number }
  | { message: string; ok: false; payload: unknown; statusCode: number };

async function requestRaw<T>(
  input: string,
  init: RequestInit,
  fetchImpl: FetchLike,
): Promise<RawResponse<T>> {
  try {
    const response = await fetchImpl(input, {
      ...init,
      headers: {
        "content-type": "application/json",
      },
    });
    const bodyText = await response.text();
    const payload = bodyText.trim() === "" ? undefined : JSON.parse(bodyText);

    if (!response.ok) {
      return {
        message:
          typeof payload?.message === "string"
            ? payload.message
            : Array.isArray(payload?.issues)
              ? payload.issues
                  .map((issue: { field?: string; message?: string }) => `${issue.field}: ${issue.message}`)
                  .join("; ")
              : `Backoffice BE APP returned HTTP ${response.status}.`,
        ok: false,
        payload,
        statusCode: response.status,
      };
    }

    return {
      ok: true,
      payload: payload as T,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      message: `Backoffice BE APP request failed: ${error instanceof Error ? error.message : String(error)}`,
      ok: false,
      payload: undefined,
      statusCode: 502,
    };
  }
}

function mapMutationResponse<T>(response: RawResponse<T>): MutationResult<T> {
  if (response.ok) {
    return {
      kind: "success",
      value: response.payload,
    };
  }

  return {
    fieldErrors: collectFieldErrors(response.payload),
    kind: "error",
    message: response.message,
    statusCode: response.statusCode,
  };
}
