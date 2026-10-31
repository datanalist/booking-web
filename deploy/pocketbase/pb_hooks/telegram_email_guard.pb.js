// Служебные адреса @telegram.vallome.ru выдаёт только вход через Telegram: занять такой адрес вручную нельзя.

onRecordCreateRequest((e) => {
  const email = String(e.record.get("email") || "").trim().toLowerCase()
  if (/@telegram\.vallome\.ru$/.test(email)) {
    throw new BadRequestError("Этот адрес зарезервирован для входа через Telegram")
  }
  e.next()
}, "users")
