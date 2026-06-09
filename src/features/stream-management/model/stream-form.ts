import type { StreamDetail } from "../../../entities/stream/model/stream.ts";

export type StreamFormInput = {
  imageUrl: string;
  streamUrl: string;
  summary: string;
  title: string;
};

export type StreamFormState = {
  fieldErrors?: Partial<Record<keyof StreamFormInput, string>>;
  globalError?: string;
  input: StreamFormInput;
  mode: "create" | "edit";
  streamId?: string;
};

export type MutationResult<T> =
  | { kind: "success"; value: T }
  | {
      fieldErrors?: Partial<Record<keyof StreamFormInput, string>>;
      kind: "error";
      message: string;
      statusCode: number;
    };

const EMPTY_STREAM_FORM: StreamFormInput = {
  imageUrl: "",
  streamUrl: "",
  summary: "",
  title: "",
};

export function buildEmptyStreamFormState(): StreamFormState {
  return {
    input: { ...EMPTY_STREAM_FORM },
    mode: "create",
  };
}

export function buildEditStreamFormState(detail: StreamDetail): StreamFormState {
  return {
    input: {
      imageUrl: detail.imageUrl,
      streamUrl: detail.streamUrl,
      summary: detail.summary,
      title: detail.title,
    },
    mode: "edit",
    streamId: detail.streamId,
  };
}

export function normalizeStreamFormInput(
  input: Partial<Record<keyof StreamFormInput, string>>,
): StreamFormInput {
  return {
    imageUrl: normalizeFieldValue(input.imageUrl),
    streamUrl: normalizeFieldValue(input.streamUrl),
    summary: normalizeFieldValue(input.summary),
    title: normalizeFieldValue(input.title),
  };
}

function normalizeFieldValue(value: string | undefined): string {
  return value?.trim() ?? "";
}
