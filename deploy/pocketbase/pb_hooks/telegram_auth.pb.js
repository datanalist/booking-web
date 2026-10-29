// Вход хозяином по id_token Telegram OIDC. Публичный ключ зашит в проверке, oauth.telegram.org с сервера не вызывается.

routerAdd("GET", "/api/vallome/telegram-nonce", (e) => {
  var rememberNonce = require(`${__hooks}/telegramLoginCheck.js`).rememberNonce
  function readNonceMap() {
    try {
      const raw = e.app.store().get("telegramNonces")
      if (typeof raw === "string" && raw !== "") return JSON.parse(raw)
    } catch (err) {}
    return {}
  }
  const now = Math.floor(Date.now() / 1000)
  const nonce = $security.randomString(32)
  e.app.store().set("telegramNonces", JSON.stringify(rememberNonce(readNonceMap(), nonce, now)))
  return e.json(200, { nonce: nonce })
})

routerAdd("POST", "/api/vallome/telegram-auth", (e) => {
  var checker = require(`${__hooks}/telegramLoginCheck.js`)
  var telegramIdTokenDecision = checker.telegramIdTokenDecision
  var consumeNonce = checker.consumeNonce
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

  function botAudience() {
    try {
      const token = str($os.getenv("TELEGRAM_BOT_TOKEN"))
      const id = token.split(":")[0]
      return /^[0-9]{6,20}$/.test(id) ? id : ""
    } catch (err) {
      return ""
    }
  }

  function takeNonce(nonce, now) {
    let map = {}
    try {
      const raw = e.app.store().get("telegramNonces")
      if (typeof raw === "string" && raw !== "") map = JSON.parse(raw)
    } catch (err) {}
    const taken = consumeNonce(map, nonce, now)
    e.app.store().set("telegramNonces", JSON.stringify(taken.map))
    return taken.ok
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
    if (user.phone) record.set("phone", user.phone)
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

  const payload = body()
  const now = Math.floor(Date.now() / 1000)
  const audience = botAudience()
  if (!audience) return e.json(503, { message: "Вход через Telegram не настроен" })
  const nonce = str(payload.nonce)
  if (!takeNonce(nonce, now)) return e.json(400, { message: "Telegram не подтвердил вход" })
  const decision = telegramIdTokenDecision(payload.id_token, audience, nonce, now)
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
