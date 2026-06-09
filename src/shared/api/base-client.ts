type FetchLike = typeof fetch;

export type ApiResponse<T> =
  | { ok: true; payload: T; statusCode: number }
  | { message: string; ok: false; statusCode: number };

type ApiErrorPayload = {
  error?: string;
  issues?: Array<{ field?: string; message?: string }>;
  message?: string;
};

export async function requestJson<T>(
  input: string,
  init: RequestInit | undefined,
  fetchImpl: FetchLike = fetch,
): Promise<ApiResponse<T>> {
  try {
    const response = await fetchImpl(input, init);
    const payloadText = await response.text();
    const payload = tryParseJson(payloadText);

    if (!response.ok) {
      return {
        message: formatApiError(payload, response.status, payloadText),
        ok: false,
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
      message: `Backoffice BE APP request failed: ${formatErrorMessage(error)}`,
      ok: false,
      statusCode: 502,
    };
  }
}

export function collectFieldErrors(
  payload: unknown,
): Partial<Record<string, string>> | undefined {
  if (!isApiErrorPayload(payload) || !Array.isArray(payload.issues)) {
    return undefined;
  }

  const fieldErrors: Partial<Record<string, string>> = {};
  for (const issue of payload.issues) {
    if (typeof issue.field === "string" && typeof issue.message === "string") {
      fieldErrors[issue.field] = issue.message;
    }
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
}

function tryParseJson(text: string): unknown {
  if (text.trim() === "") {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function formatApiError(payload: unknown, statusCode: number, fallbackText: string): string {
  if (isApiErrorPayload(payload)) {
    if (Array.isArray(payload.issues) && payload.issues.length > 0) {
      return payload.issues
        .map((issue) => `${issue.field ?? "request"}: ${issue.message ?? "invalid"}`)
        .join("; ");
    }

    if (typeof payload.message === "string" && payload.message.trim() !== "") {
      return payload.message;
    }

    if (typeof payload.error === "string" && payload.error.trim() !== "") {
      return payload.error;
    }
  }

  const message = fallbackText.trim();
  if (message !== "") {
    return message;
  }

  return `Backoffice BE APP returned HTTP ${statusCode}.`;
}

function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function isApiErrorPayload(payload: unknown): payload is ApiErrorPayload {
  return typeof payload === "object" && payload !== null;
}
