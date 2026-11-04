// Хранилище PocketBase локальное. Файлы, которые rclone уже перенёс в S3, читаем оттуда.
// Если файл есть на диске, отдаёт PocketBase. Если нет, редирект на публичный адрес в S3.
// Для миниатюры без оригинала на диске тоже отдаём оригинал из S3.
// Хук срабатывает после проверки прав доступа к файлу.

onFileDownloadRequest((e) => {
  // Хелперы внутри колбэка: Goja не видит function, объявленный снаружи.
  const { originalFileKey, s3FallbackLocation } = require(`${__hooks}/fileFallback.js`)

  let location = ""
  try {
    const base = $os.getenv("S3_PUBLIC_BASE_URL")
    const key = originalFileKey(e.servedPath)
    if (base && key) {
      let onDisk = true
      try {
        $os.stat(`${$app.dataDir()}/storage/${key}`)
      } catch (err) {
        onDisk = false
      }
      if (!onDisk) {
        location = s3FallbackLocation(base, key)
      }
    }
  } catch (err) {
    // Ошибка fallback не должна ломать выдачу файла с диска.
    console.log("files_s3_fallback:", String(err))
  }

  if (!location) {
    e.next()
    return
  }
  e.response.header().set("Cache-Control", "no-cache")
  e.redirect(302, location)
})
