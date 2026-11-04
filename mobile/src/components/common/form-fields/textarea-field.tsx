import type { AnyFieldApi } from "@tanstack/react-form"
import type { ReactNode } from "react"

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input, type InputProps } from "@/components/ui/input"

import { getFieldErrors } from "./field-state"

type TextareaFieldProps = Omit<InputProps, "value" | "onChangeText" | "isInvalid" | "multiline"> & {
  field: AnyFieldApi
  label: string
  description?: ReactNode
  /** Tampilkan "120/2000" di bawah field. */
  maxLength?: number
}

export function TextareaField({ field, label, description, maxLength, onBlur, ...inputProps }: TextareaFieldProps) {
  const errors = getFieldErrors(field)
  const isInvalid = errors.length > 0
  const value = (field.state.value as string | undefined) ?? ""

  return (
    <Field>
      <FieldLabel isInvalid={isInvalid}>{label}</FieldLabel>
      <Input
        accessibilityLabel={label}
        value={value}
        onChangeText={field.handleChange}
        onBlur={(event) => {
          field.handleBlur()
          onBlur?.(event)
        }}
        isInvalid={isInvalid}
        multiline
        maxLength={maxLength}
        textAlignVertical="top"
        className="h-32 py-3"
        {...inputProps}
      />
      {description && !isInvalid && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={errors} />
      {/* Penghitung karakter rata kanan, seperti supporting text Material 3 */}
      {maxLength !== undefined && (
        <FieldDescription className="-mt-1 text-right">
          {value.length}/{maxLength}
        </FieldDescription>
      )}
    </Field>
  )
}
