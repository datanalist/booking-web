// Переносит чаты и брони на нового хозяина после смены listings.host.

onRecordAfterUpdateSuccess((e) => {
  const record = e.record
  if (!record) return

  const listingId = record.id
  const newHost = record.getString("host")
  if (!listingId || !newHost) return

  try {
    const chats = $app.findRecordsByFilter(
      "chats",
      'kind = "listing" && listing = {:listing} && host != {:host}',
      "-created",
      200,
      0,
      { listing: listingId, host: newHost },
    )
    const chatRows = chats || []
    for (var i = 0; i < chatRows.length; i++) {
      chatRows[i].set("host", newHost)
      $app.save(chatRows[i])
    }
  } catch (err) {
    console.error("chats_sync_listing_host: chats", err)
  }

  try {
    const bookings = $app.findRecordsByFilter(
      "bookings",
      "listing = {:listing} && host != {:host}",
      "-created",
      500,
      0,
      { listing: listingId, host: newHost },
    )
    const bookingRows = bookings || []
    for (var j = 0; j < bookingRows.length; j++) {
      bookingRows[j].set("host", newHost)
      $app.save(bookingRows[j])
    }
  } catch (err) {
    console.error("chats_sync_listing_host: bookings", err)
  }
}, "listings")
