// Пропускает только разрешённые переходы статуса брони гостя, хозяина, cron и суперпользователя.

onRecordUpdateRequest((e) => {
  const DENY = "Этот переход статуса недоступен"
  const record = e.record
  if (!record) {
    e.next()
    return
  }

  function str(value) {
    return value == null ? "" : String(value).trim()
  }

  function relId(row, field) {
    var raw = ""
    try {
      raw = row.get(field)
    } catch (err) {}
    if (raw && typeof raw === "object") {
      try {
        if (raw.id) return str(raw.id)
      } catch (err) {}
    }
    const id = str(raw)
    if (id && id !== "null" && id !== "[object Object]") return id
    try {
      return str(row.getString(field))
    } catch (err) {}
    return ""
  }

  function dayKey(value) {
    const match = str(value).match(/(\d{4}-\d{2}-\d{2})/)
    return match ? match[1] : ""
  }

  function isSuperuser() {
    try {
      return typeof e.hasSuperuserAuth === "function" && e.hasSuperuserAuth()
    } catch (err) {
      return false
    }
  }

  function previousOf() {
    return e.app.findRecordById("bookings", record.id)
  }

  function actorOf() {
    if (isSuperuser()) return "super"
    var authId = ""
    try {
      authId = str(e.auth && e.auth.id)
    } catch (err) {}
    if (!authId) return "cron"
    if (authId === relId(record, "guest")) return "guest"
    if (authId === relId(record, "host")) return "host"
    return "other"
  }

  function datesOrdered() {
    const start = dayKey(record.get("requested_check_in"))
    const end = dayKey(record.get("requested_check_out"))
    return !!(start && end && start < end)
  }

  function dayEq(left, right) {
    const a = dayKey(left)
    const b = dayKey(right)
    if (!a && !b) return str(left) === str(right)
    return a === b
  }

  function guestAllowed(from, to, reason) {
    if (to === "cancelled" && reason === "guest") {
      return (
        from === "pending_host" ||
        from === "awaiting_prepayment" ||
        from === "confirmed" ||
        from === "change_requested"
      )
    }
    if (from === "confirmed" && to === "cancel_requested") return true
    if (to === "change_requested" && datesOrdered()) {
      return from === "pending_host" || from === "awaiting_prepayment" || from === "confirmed"
    }
    return false
  }

  function hostAllowed(from, to, reason) {
    if (from === "pending_host" && to === "awaiting_prepayment") return true
    if (to === "cancelled" && reason === "host") {
      return (
        from === "pending_host" ||
        from === "awaiting_prepayment" ||
        from === "confirmed" ||
        from === "change_requested"
      )
    }
    if (from === "cancel_requested" && to === "cancelled" && reason === "guest") return true
    if (to === "confirmed") return from === "cancel_requested" || from === "change_requested"
    return false
  }

  function cronAllowed(from, to, reason) {
    if (to !== "cancelled") return false
    if (from === "pending_host" && reason === "host_timeout") return true
    return from === "awaiting_prepayment" && reason === "prepay_timeout"
  }

  function allowed(actor, from, to, reason) {
    if (actor === "super" || from === to) return true
    if (actor === "guest") return guestAllowed(from, to, reason)
    if (actor === "host") return hostAllowed(from, to, reason)
    if (actor === "cron") return cronAllowed(from, to, reason)
    return false
  }

  const previous = previousOf()
  const from = str(previous.get("status"))
  const to = str(record.get("status"))
  const reason = str(record.get("cancel_reason"))
  const actor = actorOf()
  const prepaidBefore = str(previous.get("prepaid_at"))
  const prepaidAfter = str(record.get("prepaid_at"))
  if (actor !== "super" && prepaidBefore !== prepaidAfter) {
    throw new BadRequestError("Дату предоплаты может записать только администратор")
  }
  if (!allowed(actor, from, to, reason)) throw new BadRequestError(DENY)
  const checksSame =
    dayEq(previous.get("check_in"), record.get("check_in")) &&
    dayEq(previous.get("check_out"), record.get("check_out"))
  const hostAccepts = actor === "host" && from === "change_requested" && to === "confirmed"
  const explicitReject =
    hostAccepts &&
    !str(record.get("requested_check_in")) &&
    !str(record.get("requested_check_out")) &&
    checksSame
  const checksMatchRequested =
    dayEq(record.get("check_in"), previous.get("requested_check_in")) &&
    dayEq(record.get("check_out"), previous.get("requested_check_out"))
  if (actor !== "super" && !hostAccepts && !checksSame) {
    throw new BadRequestError("Даты заезда и выезда меняет только перенос брони")
  }
  if (hostAccepts && !explicitReject && !checksSame && !checksMatchRequested) {
    throw new BadRequestError("Даты заезда можно заменить только на запрошенные")
  }
  if (hostAccepts) {
    if (!explicitReject && str(previous.get("requested_check_in")) && str(previous.get("requested_check_out"))) {
      record.set("check_in", previous.get("requested_check_in"))
      record.set("check_out", previous.get("requested_check_out"))
    }
    record.set("requested_check_in", "")
    record.set("requested_check_out", "")
  }
  if (actor === "host" && from === "pending_host" && to === "awaiting_prepayment") {
    if (!str(record.get("prepay_until"))) {
      record.set("prepay_until", new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString())
    }
  }
  e.next()
}, "bookings")
