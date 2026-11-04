import { ImageManipulator, SaveFormat } from "expo-image-manipulator"
import * as ImagePicker from "expo-image-picker"

import { REPORT_PHOTO, type LocalPhoto } from "@/lib/schemas/report"

export type PhotoSource = "camera" | "library"

export type PickPhotoResult =
  | { status: "picked"; photo: LocalPhoto }
  | { status: "cancelled" }
  /** Izin ditolak permanen: user harus mengaktifkannya dari pengaturan HP. */
  | { status: "denied"; canAskAgain: boolean }

/**
 * Foto kamera HP bisa 5–12 MB dan berformat HEIC. Diperkecil ke sisi terpanjang 1600 px (sama dengan batas backend)
 * dan dikonversi ke JPEG agar upload cepat dan selalu diterima server.
 */
async function toUploadablePhoto(uri: string): Promise<LocalPhoto> {
  const context = ImageManipulator.manipulate(uri, { maxWidth: REPORT_PHOTO.maxDimension, maxHeight: REPORT_PHOTO.maxDimension })
  const image = await context.renderAsync()
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: REPORT_PHOTO.quality })
  return { uri: result.uri, width: result.width, height: result.height }
}

export async function pickPhoto(source: PhotoSource): Promise<PickPhotoResult> {
  const permission =
    source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!permission.granted) return { status: "denied", canAskAgain: permission.canAskAgain }

  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 1, exif: false }
  const result = source === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options)
  if (result.canceled || !result.assets[0]) return { status: "cancelled" }

  return { status: "picked", photo: await toUploadablePhoto(result.assets[0].uri) }
}
