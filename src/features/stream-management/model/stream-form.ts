import type { StreamDetail, StreamMutationInput } from "../../../entities/stream/model/stream.ts";

export type StreamFormFieldName = keyof StreamMutationInput;
export type StreamFormValues = StreamMutationInput;

export const STREAM_FORM_FIELDS: ReadonlyArray<{
  autoComplete: string;
  label: string;
  name: Exclude<StreamFormFieldName, "summary">;
  placeholder: string;
  type: "text" | "url";
}> = [
  {
    autoComplete: "off",
    label: "Title",
    name: "title",
    placeholder: "Night Jazz",
    type: "text",
  },
  {
    autoComplete: "off",
    label: "Stream URL",
    name: "streamUrl",
    placeholder: "https://radio.example.com/night-jazz.m3u8",
    type: "url",
  },
  {
    autoComplete: "off",
    label: "Image URL",
    name: "imageUrl",
    placeholder: "https://cdn.example.com/streams/night-jazz.jpg",
    type: "url",
  },
];

export function buildEmptyStreamFormValues(): StreamFormValues {
  return {
    imageUrl: "",
    streamUrl: "",
    summary: "",
    title: "",
  };
}

export function buildStreamFormValues(stream: StreamDetail): StreamFormValues {
  return {
    imageUrl: stream.imageUrl,
    streamUrl: stream.streamUrl,
    summary: stream.summary,
    title: stream.title,
  };
}

export function normalizeStreamFormValues(values: StreamFormValues): StreamMutationInput {
  return {
    imageUrl: values.imageUrl.trim(),
    streamUrl: values.streamUrl.trim(),
    summary: values.summary.trim(),
    title: values.title.trim(),
  };
}
