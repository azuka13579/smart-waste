import { EyeIcon, EyeOffIcon } from "lucide-react"
import { useState } from "react"

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { getFieldErrors } from "./field-state"
import type { TextFieldProps } from "./text-field"

/** `TextField` dengan tombol tampilkan/sembunyikan password. */
export function PasswordField({ field, label, description, labelAction, ...inputProps }: Omit<TextFieldProps, "type">) {
  const [isVisible, setIsVisible] = useState(false)
  const errors = getFieldErrors(field)
  const isInvalid = errors.length > 0
  const ToggleIcon = isVisible ? EyeOffIcon : EyeIcon

  return (
    <Field data-invalid={isInvalid}>
      <div className="flex items-center justify-between gap-2">
        <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
        {labelAction}
      </div>
      <div className="relative">
        <Input
          id={field.name}
          name={field.name}
          type={isVisible ? "text" : "password"}
          value={(field.state.value as string | undefined) ?? ""}
          onChange={(event) => field.handleChange(event.target.value)}
          onBlur={field.handleBlur}
          aria-invalid={isInvalid}
          className="pr-10"
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setIsVisible((value) => !value)}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          aria-label={isVisible ? "Sembunyikan password" : "Tampilkan password"}
        >
          <ToggleIcon className="size-4" />
        </button>
      </div>
      {description && !isInvalid && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={errors} />
    </Field>
  )
}
