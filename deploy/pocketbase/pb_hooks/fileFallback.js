// Адрес файла в публичном S3, если на диске сервера его уже нет (его унёс rclone).
// Ключ в бакете совпадает с локальным: <collectionId>/<recordId>/<filename>.

// Ключ оригинала по пути, который PocketBase отдаёт для файла или его миниатюры:
// <collectionId>/<recordId>/<filename> или <collectionId>/<recordId>/thumbs_<filename>/<size>_<filename>.
function originalFileKey(servedPath) {
  const segments = String(servedPath || "").split("/")
  if (segments.length < 3) {
    return ""
  }
  const name = segments[2].indexOf("thumbs_") === 0 ? segments[2].slice("thumbs_".length) : segments[2]
  return name ? segments[0] + "/" + segments[1] + "/" + name : ""
}

function s3FallbackLocation(baseUrl, key) {
  const base = String(baseUrl || "").trim().replace(/\/+$/, "")
  if (!/^https?:\/\//i.test(base)) {
    return ""
  }
  const segments = String(key || "").split("/")
  if (segments.length !== 3) {
    return ""
  }
  for (const segment of segments) {
    if (segment === "" || segment === "." || segment === ".." || segment.indexOf("\\") >= 0) {
      return ""
    }
  }
  return base + "/" + segments.map((segment) => encodeURIComponent(segment)).join("/")
}

module.exports = { originalFileKey, s3FallbackLocation }
