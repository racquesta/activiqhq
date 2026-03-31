/**
 * Loads message catalogs for a locale (FR-016). v1 ships English only.
 */
export async function loadMessages(locale: string) {
  switch (locale) {
    case "en":
      return (await import("../../messages/en.json")).default;
    default:
      return (await import("../../messages/en.json")).default;
  }
}
