function kopecks(value) {
  const number = Number(value)
  if (!isFinite(number)) return null
  return Math.round(number * 100)
}

/** Пустая строка — можно зачислять. Иначе текст ошибки для BadRequestError. */
function creditBlockReason(payment, credit) {
  if (!payment) return "Платёж не найден"
  if (payment.credited === true) return "Платёж уже зачислен"
  if (payment.status !== "succeeded") return "Платёж не оплачен"
  if (String(payment.user) !== String(credit.user)) return "Платёж принадлежит другому пользователю"
  const expected = kopecks(payment.amount)
  const got = kopecks(credit.amount)
  if (expected === null || got === null || expected !== got || expected <= 0) return "Сумма не совпадает"
  return ""
}

function nextBalance(balance, amount) {
  const base = kopecks(balance == null ? 0 : balance)
  const add = kopecks(amount)
  if (base === null || add === null) return null
  return (base + add) / 100
}

module.exports = { creditBlockReason, nextBalance }
