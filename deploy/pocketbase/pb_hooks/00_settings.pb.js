// Применяет сетевые и лимитные настройки после инициализации базы, не трогая SMTP и S3.

onBootstrap((e) => {
  e.next()

  const settings = e.app.settings()
  settings.meta.appName = "vallome.booking"
  settings.meta.appURL = "https://pb.booking.vallome.ru"

  settings.trustedProxy.headers = ["X-Real-IP"]
  settings.trustedProxy.useLeftmostIP = false

  settings.rateLimits.enabled = true
  settings.rateLimits.rules = [
    { label: "*:auth", audience: "", duration: 60, maxRequests: 20 },
    { label: "*:create", audience: "", duration: 5, maxRequests: 20 },
    { label: "POST /api/vallome/magic-request", audience: "", duration: 600, maxRequests: 5 },
    { label: "POST /api/vallome/magic-auth", audience: "", duration: 60, maxRequests: 10 },
    { label: "GET /api/vallome/magic-auth", audience: "", duration: 60, maxRequests: 10 },
    { label: "GET /api/vallome/magic-wait", audience: "", duration: 60, maxRequests: 40 },
    { label: "POST /api/vallome/change-email", audience: "", duration: 3600, maxRequests: 5 },
    { label: "/api/batch", audience: "", duration: 1, maxRequests: 3 },
    { label: "/api/", audience: "", duration: 10, maxRequests: 300 },
  ]

  settings.backups.cron = "0 3 * * *"
  settings.backups.cronMaxKeep = 7

  settings.logs.maxDays = 7
  settings.logs.logIP = true
  settings.logs.logAuthId = true

  e.app.save(settings)
})

routerUse($apis.bodyLimit(32 * 1024 * 1024))
