import type { AnyFieldApi } from "@tanstack/react-form"
import type { ComponentProps, ReactNode } from "react"

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { getFieldErrors } from "./field-state"

export type TextFieldProps = Omit<ComponentProps<typeof Input>, "value" | "onChange" | "onBlur" | "name" | "id"> & {
  field: AnyFieldApi
  label: string
  description?: ReactNode
  /** Elemen di kanan label, misalnya link "Lupa password?". */
  labelAction?: ReactNode
}

export function TextField({ field, label, description, labelAction, ...inputProps }: TextFieldProps) {
  const errors = getFieldErrors(field)
  const isInvalid = errors.length > 0

  return (
    <Field data-invalid={isInvalid}>
      <div className="flex items-center justify-between gap-2">
        <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
        {labelAction}
      </div>
      <Input
        id={field.name}
        name={field.name}
        value={(field.state.value as string | undefined) ?? ""}
        onChange={(event) => field.handleChange(event.target.value)}
        onBlur={field.handleBlur}
        aria-invalid={isInvalid}
        {...inputProps}
      />
      {description && !isInvalid && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={errors} />
    </Field>
  )
}
