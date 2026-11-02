import { cn } from "cn"
import { ImageUpIcon, RefreshCwIcon, XIcon } from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"

import { Button } from "@/components/ui/button"

type PhotoDropzoneProps = {
  value: File | null
  onChange: (file: File | null) => void
  /** Daftar MIME yang diterima, misalnya "image/jpeg,image/png". */
  accept: string
  hint?: string
  isInvalid?: boolean
  disabled?: boolean
}

/** Pilih foto lewat klik atau seret-lepas, lalu tampilkan pratinjaunya. */
export function PhotoDropzone({ value, onChange, accept, hint, isInvalid = false, disabled = false }: PhotoDropzoneProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // URL pratinjau dibuat dari file lokal dan wajib dilepas agar tidak bocor memori
  useEffect(() => {
    if (!value) return setPreviewUrl(null)
    const url = URL.createObjectURL(value)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  const pickFile = (files: FileList | null) => {
    const file = files?.[0]
    if (file) onChange(file)
  }

  const input = (
    <input
      ref={inputRef}
      id={inputId}
      type="file"
      accept={accept}
      className="sr-only"
      disabled={disabled}
      onChange={(event) => {
        pickFile(event.target.files)
        event.target.value = ""
      }}
    />
  )

  if (value && previewUrl) {
    return (
      <div className="flex flex-col gap-2">
        {input}
        <div className="relative overflow-hidden rounded-lg border bg-muted">
          <img src={previewUrl} alt="Pratinjau foto laporan" className="max-h-80 w-full object-contain" />
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="truncate text-muted-foreground">{value.name}</span>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => inputRef.current?.click()}>
              <RefreshCwIcon />
              Ganti
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => onChange(null)}>
              <XIcon />
              Hapus
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <label
      htmlFor={inputId}
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setIsDragging(false)
        if (!disabled) pickFile(event.dataTransfer.files)
      }}
      aria-invalid={isInvalid}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center transition-colors hover:bg-muted/50",
        isDragging && "border-primary bg-secondary",
        isInvalid && "border-destructive",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      {input}
      <ImageUpIcon className="size-6 text-muted-foreground" />
      <span className="text-sm font-medium">Pilih foto atau seret ke sini</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}
