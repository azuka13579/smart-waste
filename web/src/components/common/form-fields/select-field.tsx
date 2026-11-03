import type { AnyFieldApi } from "@tanstack/react-form"
import type { ReactNode } from "react"

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { getFieldErrors } from "./field-state"

type SelectFieldProps = {
  field: AnyFieldApi
  label: string
  options: { value: string; label: string; disabled?: boolean }[]
  placeholder?: string
  description?: ReactNode
  disabled?: boolean
}

export function SelectField({ field, label, options, placeholder = "Pilih", description, disabled }: SelectFieldProps) {
  const errors = getFieldErrors(field)
  const isInvalid = errors.length > 0

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Select
        name={field.name}
        value={(field.state.value as string | undefined) ?? ""}
        onValueChange={(value) => field.handleChange(value)}
        disabled={disabled}
      >
        <SelectTrigger id={field.name} aria-invalid={isInvalid} onBlur={field.handleBlur} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && !isInvalid && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={errors} />
    </Field>
  )
}
