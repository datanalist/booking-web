// Вход хозяином по подписи Telegram Login Widget. Токен бота читается из окружения и наружу не отдаётся.

const { telegramAuthDecision } = require(`${__hooks}/telegramLoginCheck.js`)

routerAdd("POST", "/api/vallome/telegram-auth", (e) => {
  function str(value) {
    return value == null ? "" : String(value).trim()
  }

  function body() {
    try {
      const info = e.requestInfo()
      if (info && info.body && typeof info.body === "object") return info.body
    } catch (err) {}
    return {}
  }

  function botToken() {
    try {
      return str($os.getenv("TELEGRAM_BOT_TOKEN"))
    } catch (err) {
      return ""
    }
  }

  function findLinked(providerId) {
    const users = e.app.findCollectionByNameOrId("users")
    try {
      const found = e.app.findAuthRecordByExternalAuth(users, "telegram", providerId)
      if (found) return found
    } catch (err) {}
    try {
      const found = e.app.findAuthRecordByExternalAuth("users", "telegram", providerId)
      if (found) return found
    } catch (err) {}
    return null
  }

  function statusOf(record) {
    try {
      return str(record.get("account_status"))
    } catch (err) {
      return ""
    }
  }

  function createHost(user) {
    const users = e.app.findCollectionByNameOrId("users")
    const record = new Record(users)
    record.setRandomPassword()
    if (typeof record.setVerified === "function") record.setVerified(true)
    record.set("roles", ["host"])
    record.set("account_status", "active")
    record.set("name", user.name)
    record.set("first_name", user.firstName)
    record.set("last_name", user.lastName)
    e.app.save(record)
    const link = new Record(e.app.findCollectionByNameOrId("_externalAuths"))
    link.set("collectionRef", users.id)
    link.set("recordRef", record.id)
    link.set("provider", "telegram")
    link.set("providerId", user.id)
    try {
      e.app.save(link)
    } catch (err) {
      try { e.app.delete(record) } catch (err2) {}
      throw err
    }
    return record
  }

  const decision = telegramAuthDecision(body(), botToken(), Math.floor(Date.now() / 1000))
  if (!decision.ok) return e.json(decision.status, { message: decision.message })

  try {
    let record = findLinked(decision.user.id)
    if (!record) record = createHost(decision.user)
    const status = statusOf(record)
    if (status === "blocked" || status === "rejected") {
      return e.json(403, { message: "Аккаунт заблокирован" })
    }
    return $apis.recordAuthResponse(e, record, "telegram")
  } catch (err) {
    return e.json(500, { message: "Не удалось войти через Telegram" })
  }
})
