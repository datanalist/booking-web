// Зачисляет баланс в той же транзакции, что и строка payment_credits.
// Повторная вставка с тем же payment откатывается уникальным индексом.

onRecordCreateRequest((e) => {
  // Хелперы внутри колбэка: Goja не видит function, объявленный снаружи, и падает ReferenceError.
  const { creditBlockReason, nextBalance } = require(`${__hooks}/paymentCredit.js`)
  const relationId = (value) => {
    if (Array.isArray(value)) {
      return value.length ? String(value[0]) : ""
    }
    return value == null ? "" : String(value)
  }

  const record = e.record
  if (!record) {
    e.next()
    return
  }

  let payment = null
  try {
    payment = e.app.findRecordById("payments", relationId(record.get("payment")))
  } catch (err) {
    payment = null
  }

  const reason = creditBlockReason(
    payment
      ? {
          credited: payment.get("credited") === true,
          status: String(payment.get("status") || ""),
          user: relationId(payment.get("user")),
          amount: payment.get("amount"),
        }
      : null,
    {
      user: relationId(record.get("user")),
      amount: record.get("amount"),
    },
  )
  if (reason) {
    throw new BadRequestError(reason)
  }

  const user = e.app.findRecordById("users", relationId(record.get("user")))
  const balance = nextBalance(user.get("balance"), payment.get("amount"))
  if (balance === null) {
    throw new BadRequestError("Сумма не совпадает")
  }
  user.set("balance", balance)
  e.app.save(user)
  payment.set("credited", true)
  e.app.save(payment)
  record.set("applied", true)
  e.next()
}, "payment_credits")
