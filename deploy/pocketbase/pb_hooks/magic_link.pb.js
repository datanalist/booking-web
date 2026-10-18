// Выдаёт вход по одноразовой ссылке и не возвращает otpId клиенту запроса письма.

onMailerRecordOTPSend((e) => {
  function str(value) { return value == null ? "" : String(value) }
  function htmlEscape(value) { return str(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;") }
  function queryEscape(value) { try { return encodeURIComponent(str(value)) } catch (err) { return str(value) } }
  function appUrl() {
    try { const url = str(($app.settings().meta || {}).appURL || ($app.settings().meta || {}).appUrl).replace(/\/$/, ""); if (url) return url } catch (err) {}
    return "https://pb.booking.vallome.ru"
  }
  function emailHtml(href) {
    return '<!doctype html><html lang="ru"><body style="margin:0;padding:0;background:#fff;"><table width="100%"><tr><td align="center" style="padding:56px 24px;"><table width="560" style="max-width:560px;"><tr><td align="center" style="font-family:Georgia,serif;font-size:34px;font-weight:700;padding-bottom:56px;">vallome.booking</td></tr><tr><td align="center" style="font-family:Arial,sans-serif;font-size:28px;padding-bottom:36px;">Уведомление о входе</td></tr><tr><td style="font-family:Arial,sans-serif;font-size:16px;color:#4a4a4a;padding-bottom:36px;">Нажмите кнопку ниже, чтобы продолжить.</td></tr><tr><td align="center" style="padding-bottom:48px;"><a href="' + href + '" style="display:inline-block;background:#6B8AFF;color:#fff;text-decoration:none;font-family:Arial,sans-serif;font-size:16px;padding:14px 40px;border-radius:6px;">Авторизоваться</a></td></tr><tr><td style="font-family:Arial,sans-serif;font-size:16px;color:#4a4a4a;">Ссылка действительна 10 минут с момента отправки.</td></tr></table></td></tr></table></body></html>'
  }
  try {
    const meta = e.meta || {}
    const otpId = str(meta.otpId || meta.otp_id || "")
    const password = str(meta.password || meta.otp || "")
    if (otpId && password) {
      const link = appUrl() + "/api/vallome/magic-auth?id=" + queryEscape(otpId) + "&code=" + queryEscape(password)
      e.message.subject = "Вход в vallome.booking"
      e.message.html = emailHtml(htmlEscape(link))
      e.message.text = "vallome.booking\n\nУведомление о входе\n\nОткройте ссылку: " + link + "\n\nСсылка действительна 10 минут с момента отправки."
    }
  } catch (err) { console.log("magic-link mailer: " + err) }
  e.next()
}, "users")

function magicAuthHandler(e) {
  const INVALID_MSG = "Ссылка недействительна или устарела."
  const EXPIRED_MSG = "Ссылка недействительна или устарела. Запросите новое письмо в приложении."
  const OCCUPIED_MSG = "Этот email уже занят."
  const LOCKED_MSG = "Слишком много попыток. Запросите новое письмо."

  function str(value) { return value == null ? "" : String(value) }
  function htmlEscape(value) { return str(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;") }
  function queryEscape(value) { try { return encodeURIComponent(str(value)) } catch (err) { return str(value) } }
  function mutateIndex(key, expires, drop) {
    var raw = ""
    try { raw = str($app.store().get("vallome_store_index")) } catch (err) {}
    var list = []
    try { const parsed = raw ? JSON.parse(raw) : []; if (Array.isArray(parsed)) list = parsed } catch (err) {}
    const next = []
    for (var i = 0; i < list.length; i++) { if (!list[i] || list[i].key === key) continue; next.push(list[i]) }
    if (!drop) next.push({ key: key, expires: expires })
    $app.store().set("vallome_store_index", JSON.stringify(next))
  }
  function forgetKey(key) { try { $app.store().remove(key) } catch (err) {} mutateIndex(key, 0, true) }
  function rememberKey(key, expires) { mutateIndex(key, expires, false) }
  function page(title, inner) {
    return '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + htmlEscape(title) + '</title><style>body{font-family:system-ui,sans-serif;background:#F7F7F6;color:#1A1A1A;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}.card{background:#fff;border-radius:16px;padding:32px 24px;max-width:420px;width:calc(100% - 32px);text-align:center}h1{font-size:22px;margin:0 0 12px}p{margin:0 0 16px;line-height:1.45}button,.btn{display:inline-block;background:#F88A2A;color:#fff;border:0;border-radius:16px;padding:14px 22px;font-size:16px;text-decoration:none}</style></head><body><div class="card">' + inner + "</div></body></html>"
  }
  function sendHtml(status, body) {
    try { return e.html(status, body) } catch (err) {
      try { return e.blob(status, "text/html; charset=utf-8", body) } catch (err2) { return e.string(status, body) }
    }
  }
  function readName(name) {
    var fromQuery = "", fromForm = "", fromInfo = ""
    try { fromQuery = str(e.request.url.query().get(name)) } catch (err) {}
    try { fromForm = str(e.request.formValue(name)) } catch (err) {}
    try {
      const info = e.requestInfo()
      const query = (info && info.query) || {}
      const body = (info && info.body) || {}
      fromInfo = str(query[name] || body[name] || "")
    } catch (err) {}
    return (fromQuery || fromForm || fromInfo).trim()
  }
  function contentType() {
    var ctype = ""
    try { ctype = str(e.request.header.get("Content-Type")) } catch (err) {}
    if (ctype) return ctype.toLowerCase()
    try {
      const headers = (e.requestInfo() && e.requestInfo().headers) || {}
      ctype = str(headers["content-type"] || headers["Content-Type"] || "")
    } catch (err) {}
    return ctype.toLowerCase()
  }
  function findUserByEmail(identity) {
    try { const found = e.app.findAuthRecordByEmail("users", identity); if (found) return found } catch (err) {}
    try { const found = e.app.findFirstRecordByFilter("users", "email = {:email}", { email: identity }); if (found) return found } catch (err) {}
    return null
  }
  function occupiedError(err) {
    const text = str(err).toLowerCase()
    return text.indexOf("unique") >= 0 || text.indexOf("email") >= 0
  }
  function ensureAccountStatus(user) {
    var status = ""
    try { status = str(user.get("account_status")) } catch (err) {}
    if (!status || status === "null" || status === "undefined") user.set("account_status", "active")
  }
  function clearEmailChange(userId, identity) {
    if (identity) forgetKey("emailChange:" + identity)
    if (userId) forgetKey("emailChangeUser:" + userId)
  }
  function verifyIfNeeded(user) {
    const isVerified = typeof user.verified === "function" ? user.verified() : !!user.get("verified")
    if (!isVerified && typeof user.setVerified === "function") {
      user.setVerified(true)
      ensureAccountStatus(user)
      e.app.save(user)
    }
  }
  function tokenForEmailChange(userId, email) {
    var record = null
    try { record = e.app.findRecordById("users", userId) } catch (err) {}
    if (!record) throw new Error("invalid")
    const occupier = findUserByEmail(email)
    if (occupier && occupier.id !== record.id) { clearEmailChange(record.id, email); throw new Error("occupied") }
    record.setEmail(email)
    if (typeof record.setVerified === "function") record.setVerified(true)
    ensureAccountStatus(record)
    try { e.app.save(record) } catch (err) {
      if (occupiedError(err)) { clearEmailChange(record.id, email); throw new Error("occupied") }
      throw err
    }
    clearEmailChange(record.id, email)
    return record.newAuthToken()
  }
  function tokenForLogin(email) {
    var record = findUserByEmail(email)
    if (!record) {
      record = new Record(e.app.findCollectionByNameOrId("users"))
      record.setEmail(email)
      record.setRandomPassword()
      if (typeof record.setVerified === "function") record.setVerified(true)
      ensureAccountStatus(record)
      try { e.app.save(record) } catch (err) { if (occupiedError(err)) throw new Error("occupied"); throw err }
    } else {
      verifyIfNeeded(record)
      try {
        const raw = str($app.store().get("emailChangeUser:" + record.id))
        if (raw && raw !== "null" && raw !== "undefined") {
          const prev = JSON.parse(raw)
          clearEmailChange(record.id, str(prev && prev.email).trim().toLowerCase())
        }
      } catch (err) {}
    }
    return record.newAuthToken()
  }
  function loadPending(otpId) {
    const key = "vallome_mcode_" + otpId
    var raw = ""
    try { raw = str($app.store().get(key)) } catch (err) {}
    if (!raw || raw === "null" || raw === "undefined") return null
    const pending = JSON.parse(raw)
    if (!pending) throw new Error("invalid")
    if (Number(pending.expires || 0) < Date.now()) { forgetKey(key); throw new Error("expired") }
    return { key: key, pending: pending }
  }
  function burnAttempt(entry) {
    const attempts = Number(entry.pending.attempts || 0) + 1
    if (attempts >= 5) { forgetKey(entry.key); throw new Error("locked") }
    entry.pending.attempts = attempts
    $app.store().set(entry.key, JSON.stringify(entry.pending))
    throw new Error("invalid")
  }
  function rememberWait(waitId, token, expires) {
    if (!waitId) return
    const key = "magicWait:" + waitId
    $app.store().set(key, JSON.stringify({ token: token, expires: expires }))
    rememberKey(key, expires)
  }
  function consumePending(otpId, code, waitToken, requireWait) {
    const entry = loadPending(otpId)
    if (!entry) return ""
    if (requireWait && !$security.equal(str(entry.pending.waitToken), waitToken)) burnAttempt(entry)
    if (!$security.equal(str(entry.pending.code), code)) burnAttempt(entry)
    const email = str(entry.pending.email).trim().toLowerCase()
    const userId = str(entry.pending.userId).trim()
    if (!email) throw new Error("invalid")
    const token = userId ? tokenForEmailChange(userId, email) : tokenForLogin(email)
    rememberWait(str(entry.pending.waitToken), token, Number(entry.pending.expires || 0))
    forgetKey(entry.key)
    return token
  }
  function consumeOtp(otpId, password) {
    var otp = null
    try { otp = e.app.findOTPById(otpId) } catch (err) { throw new Error("not found") }
    if (!otp) throw new Error("not found")
    const valid = typeof otp.validatePassword === "function" ? otp.validatePassword(password) : false
    if (!valid) throw new Error("invalid")
    const collectionRef = typeof otp.collectionRef === "function" ? str(otp.collectionRef()) : str(otp.get && otp.get("collectionRef"))
    const recordRef = typeof otp.recordRef === "function" ? str(otp.recordRef()) : str(otp.get && otp.get("recordRef"))
    const record = e.app.findRecordById(collectionRef, recordRef)
    verifyIfNeeded(record)
    const token = record.newAuthToken()
    try { e.app.delete(otp) } catch (err) { try { e.app.deleteAllOTPsByRecord(record) } catch (err2) {} }
    return token
  }
  function fail(status, message, asJson) {
    if (asJson) return e.json(status, { message: message })
    return sendHtml(status, page("Ошибка входа", "<h1>Не удалось войти</h1><p>" + htmlEscape(message) + "</p>"))
  }
  function successPage(token) {
    const intent = "intent://auth-callback?token=" + queryEscape(token) + "#Intent;scheme=vallome-booking;package=com.booking.booking;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end"
    return page("Вы авторизованы", "<h1>Вы авторизованы</h1><p>Вернитесь в приложение — вход уже выполнен. Это окно можно закрыть.</p><p id=\"open-wrap\" style=\"display:none\"><a class=\"btn\" id=\"open-app\" href=\"#\">Открыть приложение</a></p><script>(function(){if(!/Android/i.test(navigator.userAgent||''))return;var w=document.getElementById('open-wrap');if(w)w.style.display='block';var b=document.getElementById('open-app');if(b)b.setAttribute('href'," + JSON.stringify(intent) + ");})();</script>")
  }

  try {
    const id = readName("id") || readName("otpId")
    const code = readName("code") || readName("password")
    const waitToken = readName("waitToken")
    const asJson = contentType().indexOf("application/json") >= 0 || readName("otpId") !== ""
    const requireWait = asJson || readName("waitToken") !== ""
    var method = ""
    try { method = str(e.request.method).toUpperCase() } catch (err) {}
    if (method !== "POST") {
      if (!id || !code) return sendHtml(400, page("Ошибка входа", "<h1>Не удалось войти</h1><p>" + htmlEscape(INVALID_MSG) + "</p>"))
      return sendHtml(200, page("Вход", "<h1>Вход в vallome.booking</h1><p>Нажмите кнопку, чтобы авторизоваться и вернуться в приложение.</p><form id=\"auth\" method=\"post\" action=\"/api/vallome/magic-auth\"><input type=\"hidden\" name=\"id\" value=\"" + htmlEscape(id) + "\"><input type=\"hidden\" name=\"code\" value=\"" + htmlEscape(code) + "\"><button type=\"submit\">Авторизоваться</button></form><script>document.getElementById('auth').submit()</script>"))
    }
    if (!id || !code) return fail(400, INVALID_MSG, asJson)
    try {
      var token = consumePending(id, code, waitToken, requireWait)
      if (!token) {
        if (requireWait) throw new Error("invalid")
        token = consumeOtp(id, code)
        rememberWait(id, token, Date.now() + 10 * 60 * 1000)
      }
      if (asJson) return e.json(200, { ok: true, token: token })
      return sendHtml(200, successPage(token))
    } catch (err) {
      const text = str(err)
      if (text.indexOf("occupied") >= 0) return fail(400, OCCUPIED_MSG, asJson)
      if (text.indexOf("locked") >= 0) return fail(403, LOCKED_MSG, asJson)
      if (text.indexOf("expired") >= 0 || text.indexOf("invalid") >= 0 || text.indexOf("not found") >= 0) return fail(400, EXPIRED_MSG, asJson)
      return fail(400, "Не удалось завершить вход. Запросите новое письмо в приложении.", asJson)
    }
  } catch (err) {
    console.log("magic-auth: " + err)
    return sendHtml(400, page("Ошибка входа", "<h1>Не удалось войти</h1><p>" + htmlEscape(INVALID_MSG) + "</p>"))
  }
}

function magicRequestHandler(e) {
  const TTL_MS = 10 * 60 * 1000
  function str(value) { return value == null ? "" : String(value) }
  function htmlEscape(value) { return str(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;") }
  function queryEscape(value) { try { return encodeURIComponent(str(value)) } catch (err) { return str(value) } }
  function rememberKey(key, expires) {
    var raw = ""
    try { raw = str($app.store().get("vallome_store_index")) } catch (err) {}
    var list = []
    try { const parsed = raw ? JSON.parse(raw) : []; if (Array.isArray(parsed)) list = parsed } catch (err) {}
    const next = []
    for (var i = 0; i < list.length; i++) { if (!list[i] || list[i].key === key) continue; next.push(list[i]) }
    next.push({ key: key, expires: expires })
    $app.store().set("vallome_store_index", JSON.stringify(next))
  }
  function appUrl() {
    try { const url = str(($app.settings().meta || {}).appURL || ($app.settings().meta || {}).appUrl).replace(/\/$/, ""); if (url) return url } catch (err) {}
    return "https://pb.booking.vallome.ru"
  }
  function changeUserIdFor(email) {
    var raw = ""
    try { raw = str($app.store().get("emailChange:" + email)) } catch (err) {}
    if (!raw || raw === "null" || raw === "undefined") return ""
    var change = null
    try { change = JSON.parse(raw) } catch (err) { return "" }
    if (!change || !str(change.userId) || Number(change.expires || 0) < Date.now()) return ""
    var occupier = null
    try { occupier = e.app.findAuthRecordByEmail("users", email) } catch (err) {}
    try { if (!occupier) occupier = e.app.findFirstRecordByFilter("users", "email = {:email}", { email: email }) } catch (err) {}
    if (occupier && occupier.id !== str(change.userId)) return ""
    return str(change.userId)
  }
  try {
    var email = ""
    try { const body = (e.requestInfo() && e.requestInfo().body) || {}; email = str(body.email || body.identity || "") } catch (err) {}
    try { if (!email) email = str(e.request.formValue("email")) } catch (err) {}
    email = email.trim().toLowerCase()
    if (!(email.indexOf("@") > 0 && email.indexOf(".") > email.indexOf("@"))) return e.json(400, { message: "Введите корректный email" })
    const otpId = $security.randomString(15)
    const code = $security.randomString(32)
    const waitToken = $security.randomString(32)
    const expires = Date.now() + TTL_MS
    const key = "vallome_mcode_" + otpId
    $app.store().set(key, JSON.stringify({ email: email, code: code, expires: expires, waitToken: waitToken, attempts: 0, userId: changeUserIdFor(email) }))
    rememberKey(key, expires)
    const link = appUrl() + "/api/vallome/magic-auth?id=" + queryEscape(otpId) + "&code=" + queryEscape(code)
    const meta = $app.settings().meta || {}
    const html = '<!doctype html><html lang="ru"><body style="margin:0;background:#fff;"><table width="100%"><tr><td align="center" style="padding:56px 24px;"><table width="560" style="max-width:560px;"><tr><td align="center" style="font-family:Georgia,serif;font-size:34px;font-weight:700;padding-bottom:56px;">vallome.booking</td></tr><tr><td align="center" style="font-family:Arial,sans-serif;font-size:28px;padding-bottom:36px;">Уведомление о входе</td></tr><tr><td style="font-family:Arial,sans-serif;font-size:16px;color:#4a4a4a;padding-bottom:36px;">Нажмите кнопку ниже, чтобы продолжить.</td></tr><tr><td align="center" style="padding-bottom:48px;"><a href="' + htmlEscape(link) + '" style="display:inline-block;background:#6B8AFF;color:#fff;text-decoration:none;font-family:Arial,sans-serif;padding:14px 40px;border-radius:6px;">Авторизоваться</a></td></tr><tr><td style="font-family:Arial,sans-serif;font-size:16px;color:#4a4a4a;">Ссылка действительна 10 минут с момента отправки.</td></tr></table></td></tr></table></body></html>'
    $app.newMailClient().send(new MailerMessage({
      from: { address: str(meta.senderAddress), name: str(meta.senderName || "vallome.booking") },
      to: [{ address: email }],
      subject: "Вход в vallome.booking",
      html: html,
      text: "vallome.booking\n\nУведомление о входе\n\nОткройте ссылку: " + link + "\n\nСсылка действительна 10 минут с момента отправки.",
    }))
    return e.json(200, { ok: true, waitToken: waitToken })
  } catch (err) {
    console.log("magic-request: " + err)
    return e.json(500, { message: "Не удалось отправить письмо на эту почту" })
  }
}

routerAdd("POST", "/api/vallome/magic-request", magicRequestHandler)
routerAdd("GET", "/api/vallome/magic-auth", magicAuthHandler)
routerAdd("POST", "/api/vallome/magic-auth", magicAuthHandler)

routerAdd("GET", "/api/vallome/magic-wait", (e) => {
  function str(value) { return value == null ? "" : String(value) }
  function readWait() {
    var waitToken = "", id = ""
    try { waitToken = str(e.request.url.query().get("waitToken")).trim() } catch (err) {}
    try { id = str(e.request.url.query().get("id")).trim() } catch (err) {}
    if (waitToken) return waitToken
    try {
      const query = (e.requestInfo() && e.requestInfo().query) || {}
      return str(query.waitToken || query.id || id).trim()
    } catch (err) {}
    return id
  }
  function tokenOf(raw) {
    const text = str(raw).trim()
    if (!text || text === "null" || text === "undefined") return ""
    try { const parsed = JSON.parse(text); if (parsed && parsed.token) return str(parsed.token).trim() } catch (err) {}
    return text
  }
  function forgetKey(key) {
    try { $app.store().remove(key) } catch (err) {}
    var raw = ""
    try { raw = str($app.store().get("vallome_store_index")) } catch (err) {}
    var list = []
    try { const parsed = raw ? JSON.parse(raw) : []; if (Array.isArray(parsed)) list = parsed } catch (err) {}
    const next = []
    for (var i = 0; i < list.length; i++) { if (!list[i] || list[i].key === key) continue; next.push(list[i]) }
    $app.store().set("vallome_store_index", JSON.stringify(next))
  }
  try {
    const waitToken = readWait()
    if (!waitToken) return e.json(200, { token: "" })
    const key = "magicWait:" + waitToken
    var raw = ""
    try { raw = str($app.store().get(key)) } catch (err) {}
    const token = tokenOf(raw)
    if (!token) return e.json(200, { token: "" })
    forgetKey(key)
    return e.json(200, { token: token })
  } catch (err) {
    console.log("magic-wait: " + err)
    return e.json(200, { token: "" })
  }
})
