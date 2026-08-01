/** `FormData.get` returns `string | File | null`; only a string is meaningful here. */
export function readField(formData: FormData, name: string): string {
  const value = formData.get(name)

  return typeof value === 'string' ? value : ''
}
