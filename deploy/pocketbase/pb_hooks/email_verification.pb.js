// Заменяет письмо подтверждения кнопкой и не пускает по паролю без verified.

onMailerRecordVerificationSend((e) => {
  function str(value) { return value == null ? "" : String(value) }
  function htmlEscape(value) { return str(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;") }
  function appUrl() {
    try { const url = str(($app.settings().meta || {}).appURL || ($app.settings().meta || {}).appUrl).replace(/\/$/, ""); if (url) return url } catch (err) {}
    return "https://pb.booking.vallome.ru"
  }
  function emailHtml(href) {
    return '<!doctype html><html lang="ru"><body style="margin:0;padding:0;background:#fff;"><table width="100%"><tr><td align="center" style="padding:56px 24px;"><table width="560" style="max-width:560px;"><tr><td align="center" style="font-family:Georgia,serif;font-size:34px;font-weight:700;padding-bottom:56px;">vallome.booking</td></tr><tr><td align="center" style="font-family:Arial,sans-serif;font-size:28px;padding-bottom:36px;">Подтвердите почту</td></tr><tr><td style="font-family:Arial,sans-serif;font-size:16px;color:#4a4a4a;padding-bottom:36px;">Нажмите кнопку ниже, чтобы подтвердить почту.</td></tr><tr><td align="center" style="padding-bottom:48px;"><a href="' + href + '" style="display:inline-block;background:#6B8AFF;color:#fff;text-decoration:none;font-family:Arial,sans-serif;font-size:16px;padding:14px 40px;border-radius:6px;">Подтвердить почту</a></td></tr><tr><td style="font-family:Arial,sans-serif;font-size:16px;color:#4a4a4a;">Ссылка действительна 24 часа.</td></tr></table></td></tr></table></body></html>'
  }
  try {
    const meta = e.meta || {}
    const token = str(meta.token || "")
    if (token) {
      const link = appUrl() + "/api/vallome/confirm-verification?token=" + encodeURIComponent(token)
      e.message.subject = "Подтвердите почту в vallome.booking"
      e.message.html = emailHtml(htmlEscape(link))
      e.message.text = "vallome.booking\n\nПодтвердите почту\n\nОткройте ссылку: " + link + "\n\nСсылка действительна 24 часа."
    }
  } catch (err) { console.log("email-verification mailer: " + err) }
  e.next()
}, "users")

routerAdd("GET", "/api/vallome/confirm-verification", (e) => {
  const INVALID_MSG = "Ссылка недействительна или устарела"

  function str(value) { return value == null ? "" : String(value) }
  function htmlEscape(value) { return str(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;") }
  function cabinetUrl() {
    var raw = ""
    try { raw = str($os.getenv("CABINET_URL")).trim() } catch (err) {}
    raw = raw.replace(/\/+$/, "")
    if (!raw) return "http://127.0.0.1:5173"
    return raw
  }
  function readToken() {
    var token = ""
    try { token = str(e.request.url.query().get("token")).trim() } catch (err) {}
    if (token) return token
    try {
      const query = (e.requestInfo() && e.requestInfo().query) || {}
      return str(query.token || "").trim()
    } catch (err) {}
    return ""
  }
  function page(message) {
    return '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + htmlEscape(message) + '</title></head><body><p>' + htmlEscape(message) + "</p></body></html>"
  }
  function sendHtml(status, body) {
    try { return e.html(status, body) } catch (err) {
      try { return e.blob(status, "text/html; charset=utf-8", body) } catch (err2) { return e.string(status, body) }
    }
  }

  try {
    const token = readToken()
    if (!token) return sendHtml(400, page(INVALID_MSG))
    const record = e.app.findAuthRecordByToken(token, "verification")
    if (!record) return sendHtml(400, page(INVALID_MSG))
    if (typeof record.setVerified === "function") record.setVerified(true)
    else record.set("verified", true)
    e.app.save(record)
    e.response.header().set("Referrer-Policy", "no-referrer")
    return e.redirect(302, cabinetUrl() + "/login?verified=1")
  } catch (err) {
    console.log("confirm-verification: " + err)
    return sendHtml(400, page(INVALID_MSG))
  }
})

onRecordAuthWithPasswordRequest((e) => {
  const record = e.record
  if (record) {
    var verified = false
    try {
      verified = typeof record.verified === "function" ? !!record.verified() : !!record.get("verified")
    } catch (err) {}
    if (!verified) throw new BadRequestError("Подтвердите почту по кнопке в письме")
  }
  e.next()
}, "users")
