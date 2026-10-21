const HOUSING = ["Квартира", "Дом", "Комната", "Отель"]

function str(value) {
  return value == null ? "" : String(value).trim()
}

function filled(value) {
  const text = str(value)
  return text !== "" && text !== "null" && text !== "undefined"
}

/**
 * Черновик можно оставить неполным.
 * На модерацию и в публикацию нужно max_guests >= 1,
 * даже если гости запрещены.
 */
function listingPublishReady(input) {
  const status = str(input.status)
  if (status !== "pending" && status !== "published") {
    return true
  }
  const guests = Number(input.maxGuests)
  const guestsOk = guests >= 1
  const price = Number(input.priceNight)
  const photos = Number(input.photoCount)
  return (
    filled(input.title) &&
    filled(input.city) &&
    filled(input.address) &&
    filled(input.description) &&
    filled(input.checkInTime) &&
    filled(input.checkOutTime) &&
    HOUSING.indexOf(str(input.housingType)) !== -1 &&
    guestsOk &&
    price > 0 &&
    photos >= 6
  )
}

module.exports = { listingPublishReady }
