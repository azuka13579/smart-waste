import type { ComponentProps } from "react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

type SubmitButtonProps = ComponentProps<typeof Button> & {
  isSubmitting?: boolean
  submittingText?: string
}

export function SubmitButton({ isSubmitting = false, submittingText, children, disabled, ...props }: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={disabled || isSubmitting} {...props}>
      {isSubmitting && <Spinner />}
      {isSubmitting && submittingText ? submittingText : children}
    </Button>
  )
}
