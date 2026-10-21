// Не даёт отправить на модерацию или опубликовать объявление без обязательных полей и шести фото.

const { listingPublishReady } = require(`${__hooks}/listingPublishReady.js`)

function guardListingPublish(e) {
  const record = e.record
  if (!record) {
    e.next()
    return
  }

  function str(value) {
    return value == null ? "" : String(value).trim()
  }

  function listedPhotos() {
    var value = null
    try {
      value = record.get("photos")
    } catch (err) {}
    if (Array.isArray(value)) {
      var count = 0
      for (var i = 0; i < value.length; i++) {
        if (str(value[i])) count++
      }
      return count
    }
    const text = str(value)
    if (!text || text === "null" || text === "[]") return 0
    if (text.charAt(0) === "[") {
      try {
        const parsed = JSON.parse(text)
        if (Array.isArray(parsed)) return parsed.length
      } catch (err) {}
    }
    return 1
  }

  function uploadedPhotos() {
    try {
      if (typeof e.findUploadedFiles !== "function") return 0
      const files = e.findUploadedFiles("photos")
      return Array.isArray(files) ? files.length : 0
    } catch (err) {
      return 0
    }
  }

  const status = str(record.get("status"))
  if (status !== "pending" && status !== "published") {
    e.next()
    return
  }

  const listed = listedPhotos()
  const uploaded = uploadedPhotos()
  const ready = listingPublishReady({
    status,
    title: record.get("title"),
    city: record.get("city"),
    address: record.get("address"),
    description: record.get("description"),
    checkInTime: record.get("check_in_time"),
    checkOutTime: record.get("check_out_time"),
    housingType: record.get("housing_type"),
    maxGuests: record.get("max_guests"),
    guestsForbidden: record.get("guests_forbidden") === true,
    priceNight: record.get("price_night"),
    photoCount: listed >= 6 ? listed : listed + uploaded,
  })
  if (!ready) {
    throw new BadRequestError(
      "Чтобы отправить объявление, заполните поля и добавьте минимум 6 фотографий",
    )
  }
  e.next()
}

onRecordCreateRequest(guardListingPublish, "listings")
onRecordUpdateRequest(guardListingPublish, "listings")
