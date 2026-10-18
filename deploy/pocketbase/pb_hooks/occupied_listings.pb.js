// Отдаёт id занятых объявлений и диапазоны календаря, отбирая брони фильтром PocketBase.

routerAdd("GET", "/api/vallome/occupied-listings", (e) => {
  const OCCUPYING = ["pending_host", "awaiting_prepayment", "confirmed", "change_requested"]

  function str(value) {
    return value == null ? "" : String(value)
  }

  function readQuery(name) {
    try {
      const value = str(e.request.url.query().get(name)).trim()
      if (value) return value
    } catch (err) {}
    try {
      const info = e.requestInfo()
      return str((info && info.query && info.query[name]) || "").trim()
    } catch (err) {}
    return ""
  }

  function dayKey(value) {
    const match = str(value).trim().match(/(\d{4}-\d{2}-\d{2})/)
    return match ? match[1] : ""
  }

  function listingIdOf(record) {
    var raw = ""
    try { raw = record.get("listing") } catch (err) {}
    if (raw && typeof raw === "object") {
      try { if (raw.length) return str(raw[0]).trim() } catch (err) {}
      try { if (raw.id) return str(raw.id).trim() } catch (err) {}
    }
    const id = str(raw).trim()
    if (id && id !== "null" && id !== "undefined") return id
    try { return str(record.getString("listing")).trim() } catch (err) {}
    return ""
  }

  function stayOverlaps(startRaw, endRaw, checkInDay, checkOutDay) {
    const start = dayKey(startRaw)
    const end = dayKey(endRaw)
    if (!start || !end || start >= end) return false
    return start < checkOutDay && end > checkInDay
  }

  function collectListingIds(collection, filter, params) {
    const ids = []
    var offset = 0
    while (offset < 10000) {
      var found
      try { found = e.app.findRecordsByFilter(collection, filter, "", 200, offset, params) } catch (err) { break }
      if (!found || found.length === 0) break
      for (var i = 0; i < found.length; i++) {
        const id = listingIdOf(found[i])
        if (!id) continue
        const startField = collection === "listing_blocks" ? "start" : "check_in"
        const endField = collection === "listing_blocks" ? "end" : "check_out"
        var overlaps = stayOverlaps(found[i].get(startField), found[i].get(endField), checkInDay, checkOutDay)
        if (!overlaps && collection === "bookings") {
          try {
            overlaps = stayOverlaps(found[i].get("requested_check_in"), found[i].get("requested_check_out"), checkInDay, checkOutDay)
          } catch (err) {}
        }
        if (overlaps) ids.push(id)
      }
      if (found.length < 200) break
      offset += 200
    }
    return ids
  }

  const checkInDay = dayKey(readQuery("checkIn") || readQuery("check_in"))
  const checkOutDay = dayKey(readQuery("checkOut") || readQuery("check_out"))
  if (!checkInDay || !checkOutDay || checkInDay >= checkOutDay) return e.json(200, { listingIds: [] })

  const from = checkInDay + " 00:00:00.000Z"
  const bookingParams = { from: from }
  const statusParts = []
  for (var s = 0; s < OCCUPYING.length; s++) {
    bookingParams["status" + s] = OCCUPYING[s]
    statusParts.push("status = {:status" + s + "}")
  }
  const bookingFilter = "(" + statusParts.join(" || ") + ") && (check_out > {:from} || requested_check_out > {:from})"
  const unique = {}
  const fromBookings = collectListingIds("bookings", bookingFilter, bookingParams)
  for (var b = 0; b < fromBookings.length; b++) unique[fromBookings[b]] = true
  try {
    e.app.findCollectionByNameOrId("listing_blocks")
    const fromBlocks = collectListingIds("listing_blocks", "end > {:from}", { from: from })
    for (var i = 0; i < fromBlocks.length; i++) unique[fromBlocks[i]] = true
  } catch (err) {}
  return e.json(200, { listingIds: Object.keys(unique) })
})

routerAdd("GET", "/api/vallome/occupied-dates", (e) => {
  const OCCUPYING = ["pending_host", "awaiting_prepayment", "confirmed", "change_requested"]

  function str(value) {
    return value == null ? "" : String(value)
  }

  function readQuery(name) {
    try {
      const value = str(e.request.url.query().get(name)).trim()
      if (value) return value
    } catch (err) {}
    try {
      const info = e.requestInfo()
      return str((info && info.query && info.query[name]) || "").trim()
    } catch (err) {}
    return ""
  }

  function bindId(value) {
    const raw = str(value).trim()
    if (!raw || raw.length > 32 || !/^[A-Za-z0-9]+$/.test(raw)) return ""
    return raw
  }

  function dayValue(value) {
    const match = str(value).trim().match(/^(\d{4}-\d{2}-\d{2})/)
    return match ? match[1] : ""
  }

  function pushRange(ranges, startRaw, endRaw) {
    const start = dayValue(startRaw)
    const end = dayValue(endRaw)
    if (start && end && start < end) ranges.push({ start: start, end: end })
  }

  function collectRanges(collection, filter, params, startField, endField, altStart, altEnd) {
    const ranges = []
    var offset = 0
    while (offset < 10000) {
      var found
      try { found = e.app.findRecordsByFilter(collection, filter, "", 200, offset, params) } catch (err) { break }
      if (!found || found.length === 0) break
      for (var i = 0; i < found.length; i++) {
        pushRange(ranges, found[i].get(startField), found[i].get(endField))
        if (altStart && altEnd) {
          var altFrom = ""
          var altTo = ""
          try { altFrom = found[i].get(altStart) } catch (err) {}
          try { altTo = found[i].get(altEnd) } catch (err) {}
          pushRange(ranges, altFrom, altTo)
        }
      }
      if (found.length < 200) break
      offset += 200
    }
    return ranges
  }

  const listing = bindId(readQuery("listing"))
  if (!listing) return e.json(200, { ranges: [] })
  const params = { listing: listing }
  const statusExpr = OCCUPYING.map(function (status, i) {
    params["status" + i] = status
    return "status = {:status" + i + "}"
  }).join(" || ")
  var filter = "listing = {:listing} && (" + statusExpr + ")"
  const excludeId = bindId(readQuery("excludeBookingId") || readQuery("exclude_booking_id"))
  if (excludeId) {
    params.excludeId = excludeId
    filter += " && id != {:excludeId}"
  }
  const ranges = collectRanges("bookings", filter, params, "check_in", "check_out", "requested_check_in", "requested_check_out")
  try {
    e.app.findCollectionByNameOrId("listing_blocks")
    const blocks = collectRanges("listing_blocks", "listing = {:listing}", { listing: listing }, "start", "end")
    for (var i = 0; i < blocks.length; i++) ranges.push(blocks[i])
  } catch (err) {}
  return e.json(200, { ranges: ranges })
})
