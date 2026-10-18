// Удаляет из памяти процесса просроченные ключи входа и смены почты, к которым уже никто не обращается.

cronAdd("sweepAuthStore", "*/10 * * * *", () => {
  function str(value) {
    return value == null ? "" : String(value)
  }

  function allowed(key) {
    return (
      key.indexOf("vallome_mcode_") === 0 ||
      key.indexOf("magicWait:") === 0 ||
      key.indexOf("emailChange:") === 0 ||
      key.indexOf("emailChangeUser:") === 0
    )
  }

  function loadIndex() {
    var raw = ""
    try {
      raw = str($app.store().get("vallome_store_index"))
    } catch (err) {}
    if (!raw || raw === "null" || raw === "undefined") return []
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch (err) {
      return []
    }
  }

  function expiresOf(item, key) {
    var expires = Number(item && item.expires ? item.expires : 0)
    if (expires) return expires
    try {
      const parsed = JSON.parse(str($app.store().get(key)))
      return Number(parsed && parsed.expires ? parsed.expires : 0)
    } catch (err) {
      return 0
    }
  }

  const now = Date.now()
  const list = loadIndex()
  const keep = []
  for (var i = 0; i < list.length; i++) {
    const item = list[i]
    const key = str(item && item.key).trim()
    if (!key || !allowed(key)) continue
    var current = null
    try {
      current = $app.store().get(key)
    } catch (err) {}
    const missing = current == null || str(current) === "" || str(current) === "null"
    const expires = expiresOf(item, key)
    const expired = expires > 0 && expires <= now
    if (missing || expired) {
      try {
        $app.store().remove(key)
      } catch (err) {}
      continue
    }
    keep.push(item)
  }
  $app.store().set("vallome_store_index", JSON.stringify(keep))
})
