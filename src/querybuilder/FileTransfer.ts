/**
 * Offers text content as a file download from the renderer, without any
 * main-process involvement. Used for catalog JSON and query XML exports.
 */
export function downloadTextFile(
  fileName: string,
  mimeType: string,
  content: string
): void {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
