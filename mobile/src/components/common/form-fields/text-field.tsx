import type { AnyFieldApi } from "@tanstack/react-form"
import { forwardRef, type ReactNode } from "react"

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input, type InputProps, type InputRef } from "@/components/ui/input"

import { getFieldErrors } from "./field-state"

export type TextFieldProps = Omit<InputProps, "value" | "onChangeText" | "isInvalid"> & {
  field: AnyFieldApi
  label: string
  description?: ReactNode
}

export const TextField = forwardRef<InputRef, TextFieldProps>(function TextField(
  { field, label, description, onBlur, ...inputProps },
  ref,
) {
  const errors = getFieldErrors(field)
  const isInvalid = errors.length > 0

  return (
    <Field>
      <FieldLabel isInvalid={isInvalid}>{label}</FieldLabel>
      <Input
        ref={ref}
        accessibilityLabel={label}
        value={(field.state.value as string | undefined) ?? ""}
        onChangeText={field.handleChange}
        onBlur={(event) => {
          field.handleBlur()
          onBlur?.(event)
        }}
        isInvalid={isInvalid}
        {...inputProps}
      />
      {description && !isInvalid && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={errors} />
    </Field>
  )
})
