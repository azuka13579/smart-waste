import { type ClassValue, clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * tailwind-merge tidak mengenal ukuran font kustom di `tailwind.config.js` dan akan menganggap `text-title-md`
 * sebagai warna, sehingga `text-white` menghapus ukurannya. Daftarkan skala tipe sebagai font-size.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["display-sm", "headline-sm", "title-lg", "title-md", "title-sm", "body-lg", "body-md", "body-sm", "label-lg", "label-md"] },
      ],
    },
  },
})

/** Gabungkan class NativeWind; class yang belakangan menang bila bertabrakan (`p-2` lalu `p-4` → `p-4`). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
