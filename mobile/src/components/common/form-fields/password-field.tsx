import type { AnyFieldApi } from "@tanstack/react-form"
import { EyeIcon, EyeOffIcon } from "lucide-react-native"
import { forwardRef, type ReactNode, useState } from "react"
import { Pressable, View } from "react-native"

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input, type InputProps, type InputRef } from "@/components/ui/input"
import { colors } from "@/lib/theme"

import { getFieldErrors } from "./field-state"

type PasswordFieldProps = Omit<InputProps, "value" | "onChangeText" | "isInvalid" | "secureTextEntry"> & {
  field: AnyFieldApi
  label: string
  description?: ReactNode
}

export const PasswordField = forwardRef<InputRef, PasswordFieldProps>(function PasswordField(
  { field, label, description, onBlur, ...inputProps },
  ref,
) {
  const [isVisible, setIsVisible] = useState(false)
  const errors = getFieldErrors(field)
  const isInvalid = errors.length > 0
  const Icon = isVisible ? EyeOffIcon : EyeIcon

  return (
    <Field>
      <FieldLabel isInvalid={isInvalid}>{label}</FieldLabel>
      <View className="justify-center">
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
          secureTextEntry={!isVisible}
          autoCapitalize="none"
          autoCorrect={false}
          className="pr-14"
          {...inputProps}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isVisible ? "Sembunyikan password" : "Tampilkan password"}
          onPress={() => setIsVisible((value) => !value)}
          className="absolute right-1 h-12 w-12 items-center justify-center rounded-full active:bg-muted"
        >
          <Icon size={22} color={colors.mutedForeground} />
        </Pressable>
      </View>
      {description && !isInvalid && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={errors} />
    </Field>
  )
})
