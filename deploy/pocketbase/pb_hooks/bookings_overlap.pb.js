// Отклоняет бронь, если её даты пересекают чужую занимающую бронь или блокировку хозяина.

function guardBookingDates(e) {
  const OCCUPYING = [
    "pending_host",
    "awaiting_prepayment",
    "confirmed",
    "change_requested",
  ]
  const originalApp = e.app
  const record = e.record
  const status = record
    ? String(record.get("status") || "").trim()
    : ""
  if (!record || OCCUPYING.indexOf(status) === -1) {
    e.next()
    return
  }

  try {
    originalApp.runInTransaction((txApp) => {
      function str(value) {
        return value == null ? "" : String(value)
      }

      function dayKey(value) {
        const match = str(value).trim().match(/(\d{4}-\d{2}-\d{2})/)
        return match ? match[1] : ""
      }

      function rangesOverlap(startA, endA, startB, endB) {
        if (!startA || !endA || !startB || !endB) return false
        if (startA >= endA || startB >= endB) return false
        return startA < endB && endA > startB
      }

      function listingIdOf(row) {
        var raw = ""
        try {
          raw = row.get("listing")
        } catch (err) {}
        if (raw && typeof raw === "object") {
          try {
            if (raw.id) return str(raw.id).trim()
          } catch (err) {}
        }
        const id = str(raw).trim()
        if (id && id !== "null" && id !== "undefined" && id !== "[object Object]") {
          return id
        }
        try {
          return str(row.getString("listing")).trim()
        } catch (err) {}
        return ""
      }

      function readDay(row, field) {
        try {
          return dayKey(row.get(field))
        } catch (err) {
          return ""
        }
      }

      function reject(message) {
        throw new BadRequestError(message)
      }

      function scanBookings(listing, checkIn, checkOut, reqIn, reqOut, selfId) {
        const params = {
          listing: listing,
          status0: OCCUPYING[0],
          status1: OCCUPYING[1],
          status2: OCCUPYING[2],
          status3: OCCUPYING[3],
        }
        var filter =
          "listing = {:listing} && (" +
          "status = {:status0} || status = {:status1} || " +
          "status = {:status2} || status = {:status3})"
        if (selfId) {
          params.id = selfId
          filter += " && id != {:id}"
        }
        const found = txApp.findRecordsByFilter("bookings", filter, "", 200, 0, params)
        for (var i = 0; found && i < found.length; i++) {
          const otherIn = readDay(found[i], "check_in")
          const otherOut = readDay(found[i], "check_out")
          const otherReqIn = readDay(found[i], "requested_check_in")
          const otherReqOut = readDay(found[i], "requested_check_out")
          var hit =
            rangesOverlap(otherIn, otherOut, checkIn, checkOut) ||
            rangesOverlap(otherReqIn, otherReqOut, checkIn, checkOut)
          if (reqIn && reqOut) {
            hit =
              hit ||
              rangesOverlap(otherIn, otherOut, reqIn, reqOut) ||
              rangesOverlap(otherReqIn, otherReqOut, reqIn, reqOut)
          }
          if (hit) reject("На эти даты жилье уже занято")
        }
      }

      function scanBlocks(listing, checkIn, checkOut, reqIn, reqOut) {
        const found = txApp.findRecordsByFilter(
          "listing_blocks",
          "listing = {:listing}",
          "",
          200,
          0,
          { listing: listing },
        )
        for (var i = 0; found && i < found.length; i++) {
          const start = readDay(found[i], "start")
          const end = readDay(found[i], "end")
          var hit = rangesOverlap(start, end, checkIn, checkOut)
          if (reqIn && reqOut) hit = hit || rangesOverlap(start, end, reqIn, reqOut)
          if (hit) reject("На эти даты жилье уже занято")
        }
      }

      e.app = txApp
      const listing = listingIdOf(record)
      const checkIn = readDay(record, "check_in")
      const checkOut = readDay(record, "check_out")
      const reqIn = readDay(record, "requested_check_in")
      const reqOut = readDay(record, "requested_check_out")
      if (listing && checkIn && checkOut && checkIn < checkOut) {
        const selfId = str(record.id).trim()
        scanBookings(listing, checkIn, checkOut, reqIn, reqOut, selfId)
        scanBlocks(listing, checkIn, checkOut, reqIn, reqOut)
      }
      e.next()
    })
  } finally {
    e.app = originalApp
  }
}

onRecordCreateRequest(guardBookingDates, "bookings")
onRecordUpdateRequest(guardBookingDates, "bookings")
