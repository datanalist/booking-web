// Не даёт отправить на модерацию или опубликовать объявление без обязательных полей и шести фото.

function guardListingPublish(e) {
  const HOUSING = ["Квартира", "Дом", "Комната", "Отель"]
  const record = e.record
  if (!record) {
    e.next()
    return
  }

  function str(value) {
    return value == null ? "" : String(value).trim()
  }

  function filled(field) {
    const value = str(record.get(field))
    return value !== "" && value !== "null" && value !== "undefined"
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

  const housing = str(record.get("housing_type"))
  const guests = Number(record.get("max_guests"))
  const price = Number(record.get("price_night"))
  const ready =
    filled("title") &&
    filled("city") &&
    filled("address") &&
    filled("description") &&
    filled("check_in_time") &&
    filled("check_out_time") &&
    HOUSING.indexOf(housing) !== -1 &&
    guests >= 1 &&
    price > 0 &&
    (listedPhotos() >= 6 || (listedPhotos() + uploadedPhotos()) >= 6)
  if (!ready) {
    throw new BadRequestError(
      "Чтобы отправить объявление, заполните поля и добавьте минимум 6 фотографий",
    )
  }
  e.next()
}

onRecordCreateRequest(guardListingPublish, "listings")
onRecordUpdateRequest(guardListingPublish, "listings")
