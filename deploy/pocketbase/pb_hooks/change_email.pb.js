// Ставит смену почты в очередь до входа по ссылке и регистрирует ключ для автоочистки.

routerAdd("POST", "/api/vallome/change-email", (e) => {
  const TTL_MS = 24 * 60 * 60 * 1000

  function str(value) {
    return value == null ? "" : String(value)
  }

  function looksLikeEmail(value) {
    return value.indexOf("@") > 0 && value.indexOf(".") > value.indexOf("@")
  }

  function collectionName(record) {
    try {
      const col = record.collection()
      if (col && col.name) return str(col.name)
    } catch (err) {}
    return ""
  }

  function readAuth() {
    var auth = e.auth
    if (auth) return auth
    try {
      const info = e.requestInfo()
      const headers = (info && info.headers) || {}
      const raw = str(headers.authorization || "")
      const token = raw.replace(/^Bearer\s+/i, "").trim()
      if (!token) return null
      return e.app.findAuthRecordByToken(token, "auth")
    } catch (err) {
      return null
    }
  }

  function fail(status, payload) {
    return e.json(status, payload)
  }

  function occupied() {
    return fail(400, {
      message: "Этот email уже занят",
      data: { email: { code: "validation_not_unique", message: "Этот email уже занят" } },
    })
  }

  function recordEmail(record) {
    var value = ""
    try {
      if (typeof record.email === "function") value = str(record.email())
    } catch (err) {}
    if (!value) value = str(record.get("email"))
    return value.trim().toLowerCase()
  }

  function findUserByEmail(email) {
    try {
      const found = e.app.findAuthRecordByEmail("users", email)
      if (found) return found
    } catch (err) {}
    try {
      const found = e.app.findFirstRecordByFilter("users", "email = {:email}", { email: email })
      if (found) return found
    } catch (err) {}
    return null
  }

  function mutateIndex(key, expires, drop) {
    var raw = ""
    try {
      raw = str($app.store().get("vallome_store_index"))
    } catch (err) {}
    var list = []
    try {
      const parsed = raw ? JSON.parse(raw) : []
      if (Array.isArray(parsed)) list = parsed
    } catch (err) {}
    const next = []
    for (var i = 0; i < list.length; i++) {
      if (!list[i] || list[i].key === key) continue
      next.push(list[i])
    }
    if (!drop) next.push({ key: key, expires: expires })
    $app.store().set("vallome_store_index", JSON.stringify(next))
  }

  function forgetKey(key) {
    try {
      $app.store().remove(key)
    } catch (err) {}
    mutateIndex(key, 0, true)
  }

  function rememberKey(key, expires) {
    mutateIndex(key, expires, false)
  }

  function clearPrevious(userId) {
    const userKey = "emailChangeUser:" + userId
    try {
      const raw = str($app.store().get(userKey))
      if (raw && raw !== "null" && raw !== "undefined") {
        const prev = JSON.parse(raw)
        const oldEmail = str(prev && prev.email).trim().toLowerCase()
        if (oldEmail) forgetKey("emailChange:" + oldEmail)
      }
    } catch (err) {}
    forgetKey(userKey)
  }

  try {
    const auth = readAuth()
    if (!auth) return fail(401, { message: "Войдите в аккаунт, чтобы сохранить данные" })
    const name = collectionName(auth)
    if (name && name !== "users") return fail(403, { message: "Не удалось сменить email" })

    var email = ""
    try {
      const info = e.requestInfo()
      const body = (info && info.body) || {}
      email = str(body.email).trim().toLowerCase()
    } catch (err) {}
    if (!looksLikeEmail(email)) return fail(400, { message: "Введите корректный email" })

    const record = e.app.findRecordById("users", auth.id)
    const current = recordEmail(record)
    if (email === current) {
      clearPrevious(auth.id)
      return e.json(200, { email: email, pending: false })
    }

    const existing = findUserByEmail(email)
    if (existing && existing.id !== record.id) return occupied()

    try {
      const raw = str($app.store().get("emailChange:" + email))
      if (raw && raw !== "null" && raw !== "undefined") {
        const other = JSON.parse(raw)
        if (
          other &&
          str(other.userId) &&
          str(other.userId) !== auth.id &&
          Number(other.expires || 0) >= Date.now()
        ) {
          return occupied()
        }
      }
    } catch (err) {}

    clearPrevious(auth.id)
    const expires = Date.now() + TTL_MS
    const payload = JSON.stringify({ userId: auth.id, email: email, expires: expires })
    const emailKey = "emailChange:" + email
    const userKey = "emailChangeUser:" + auth.id
    $app.store().set(emailKey, payload)
    $app.store().set(userKey, payload)
    rememberKey(emailKey, expires)
    rememberKey(userKey, expires)
    return e.json(200, { email: email, pending: true })
  } catch (err) {
    console.log("change-email: " + err)
    return fail(400, { message: "Не удалось сменить email" })
  }
})
