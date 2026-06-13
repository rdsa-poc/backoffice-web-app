import { useEffect, useId, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { StreamMutationInput } from "../../../entities/stream/model/stream.ts";
import {
  STREAM_FORM_FIELDS,
  normalizeStreamFormValues,
  type StreamFormFieldName,
  type StreamFormValues,
} from "../model/stream-form.ts";

type StreamFormCardProps = {
  initialValues: StreamFormValues;
  isSubmitting: boolean;
  mode: "create" | "edit";
  onCancel: () => void;
  onSubmit: (values: StreamMutationInput) => void | Promise<void>;
};

type FieldErrors = Partial<Record<StreamFormFieldName, string>>;

export function StreamFormCard({
  initialValues,
  isSubmitting,
  mode,
  onCancel,
  onSubmit,
}: StreamFormCardProps) {
  const summaryId = useId();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    setErrors({});
    setValues(initialValues);
  }, [initialValues]);

  return (
    <article className="detail-card">
      <div className="detail-body detail-body--form">
        <div>
          <h2 className="detail-title">{mode === "create" ? "Create Draft Stream" : "Edit Stream"}</h2>
          <p className="detail-kicker">
            {mode === "create"
              ? "New streams are created as draft records through the backoffice API."
              : "Editable fields stay in sync with the backend CRUD contract."}
          </p>
        </div>

        <form
          className="stream-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            if (!form.reportValidity()) {
              syncFormErrors(form, setErrors);
              return;
            }

            await onSubmit(normalizeStreamFormValues(values));
          }}
        >
          {STREAM_FORM_FIELDS.map((field) => {
            const error = errors[field.name];

            return (
              <label className="form-field" key={field.name}>
                <span className="form-label">
                  {field.label}
                  <span aria-hidden="true" className="form-required">
                    *
                  </span>
                </span>
                <input
                  aria-describedby={error ? `${field.name}-error` : undefined}
                  aria-invalid={error ? true : undefined}
                  autoComplete={field.autoComplete}
                  className="form-input"
                  name={field.name}
                  onBlur={(event) => syncFieldError(event.currentTarget, setErrors)}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;
                    setValues((current) => ({ ...current, [field.name]: nextValue }));
                    if (errors[field.name]) {
                      syncFieldError(event.currentTarget, setErrors);
                    }
                  }}
                  onInvalid={(event) => syncFieldError(event.currentTarget, setErrors)}
                  placeholder={field.placeholder}
                  required
                  type={field.type}
                  value={values[field.name]}
                />
                {error ? (
                  <span className="field-error" id={`${field.name}-error`} role="alert">
                    <span aria-hidden="true">!</span>
                    {error}
                  </span>
                ) : null}
              </label>
            );
          })}

          <label className="form-field">
            <span className="form-label">
              Summary
              <span aria-hidden="true" className="form-required">
                *
              </span>
            </span>
            <textarea
              aria-describedby={errors.summary ? `${summaryId}-error` : undefined}
              aria-invalid={errors.summary ? true : undefined}
              className="form-input form-textarea"
              name="summary"
              onBlur={(event) => syncFieldError(event.currentTarget, setErrors)}
              onChange={(event) => {
                const nextValue = event.currentTarget.value;
                setValues((current) => ({ ...current, summary: nextValue }));
                if (errors.summary) {
                  syncFieldError(event.currentTarget, setErrors);
                }
              }}
              onInvalid={(event) => syncFieldError(event.currentTarget, setErrors)}
              placeholder="Late-night jazz programming with host-led transitions."
              required
              rows={6}
              value={values.summary}
            />
            {errors.summary ? (
              <span className="field-error" id={`${summaryId}-error`} role="alert">
                <span aria-hidden="true">!</span>
                {errors.summary}
              </span>
            ) : null}
          </label>

          <div className="form-actions">
            <button className="secondary-button" onClick={onCancel} type="button">
              Cancel
            </button>
            <button className="primary-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Saving..." : mode === "create" ? "Create Stream" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </article>
  );
}

function syncFormErrors(form: HTMLFormElement, setErrors: Dispatch<SetStateAction<FieldErrors>>) {
  const nextErrors: FieldErrors = {};

  for (const element of Array.from(form.elements)) {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      const message = element.validationMessage.trim();
      if (message) {
        nextErrors[element.name as StreamFormFieldName] = message;
      }
    }
  }

  setErrors(nextErrors);
}

function syncFieldError(
  field: HTMLInputElement | HTMLTextAreaElement,
  setErrors: Dispatch<SetStateAction<FieldErrors>>,
) {
  const message = field.validationMessage.trim();
  setErrors((current) => ({
    ...current,
    [field.name]: message || undefined,
  }));
}
