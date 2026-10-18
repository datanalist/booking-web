// Отменяет просроченные заявки: хозяин не ответил или гость не внёс предоплату.

cronAdd("expireStaleBookings", "*/5 * * * *", () => {
  $app.runInTransaction((txApp) => {
    function pbNow() {
      return new Date().toISOString().replace("T", " ")
    }

    function expire(status, untilField, reason) {
      const filter =
        "status = {:status} && " + untilField + " != '' && " + untilField + " <= {:now}"
      var guard = 0
      while (guard < 20) {
        const rows = txApp.findRecordsByFilter("bookings", filter, "", 100, 0, {
          status: status,
          now: pbNow(),
        })
        if (!rows || rows.length === 0) return
        for (var i = 0; i < rows.length; i++) {
          rows[i].set("status", "cancelled")
          rows[i].set("cancel_reason", reason)
          txApp.save(rows[i])
        }
        guard++
      }
    }

    expire("pending_host", "host_respond_until", "host_timeout")
    expire("awaiting_prepayment", "prepay_until", "prepay_timeout")
  })
})
