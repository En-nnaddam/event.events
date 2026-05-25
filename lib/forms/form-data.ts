export function getText(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

export function getNullableText(formData: FormData, key: string) {
  const value = getText(formData, key)
  return value.length > 0 ? value : null
}

export function getRepeatedText(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter(
      (value): value is string => typeof value === "string" && value.length > 0
    )
}

export function isDuplicateSlugError(error: {
  code?: string
  message?: string
}) {
  return (
    error.code === "23505" ||
    Boolean(error.message?.toLowerCase().includes("duplicate"))
  )
}
