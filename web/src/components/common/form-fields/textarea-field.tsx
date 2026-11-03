import type { AnyFieldApi } from "@tanstack/react-form"
import type { ComponentProps, ReactNode } from "react"

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"

import { getFieldErrors } from "./field-state"

type TextareaFieldProps = Omit<ComponentProps<typeof Textarea>, "value" | "onChange" | "onBlur" | "name" | "id"> & {
  field: AnyFieldApi
  label: string
  description?: ReactNode
}

export function TextareaField({ field, label, description, ...textareaProps }: TextareaFieldProps) {
  const errors = getFieldErrors(field)
  const isInvalid = errors.length > 0

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Textarea
        id={field.name}
        name={field.name}
        value={(field.state.value as string | undefined) ?? ""}
        onChange={(event) => field.handleChange(event.target.value)}
        onBlur={field.handleBlur}
        aria-invalid={isInvalid}
        {...textareaProps}
      />
      {description && !isInvalid && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={errors} />
    </Field>
  )
}
