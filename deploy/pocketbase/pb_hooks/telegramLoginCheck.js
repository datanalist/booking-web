// Проверка подписи Telegram Login Widget. Секрет — SHA-256 токена бота, без запроса к oauth.telegram.org.

const MAX_AGE_SECONDS = 86400
const FIELDS = ["auth_date", "first_name", "id", "last_name", "photo_url", "username"]
const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]

function rotr(value, bits) {
  return ((value >>> bits) | (value << (32 - bits))) >>> 0
}

function utf8Bytes(text) {
  const out = []
  for (let i = 0; i < text.length; i += 1) {
    let code = text.charCodeAt(i)
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
      const next = text.charCodeAt(i + 1)
      if (next >= 0xdc00 && next <= 0xdfff) {
        code = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00)
        i += 1
      }
    }
    if (code < 0x80) out.push(code)
    else if (code < 0x800) out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f))
    else if (code < 0x10000) {
      out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
    } else {
      out.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      )
    }
  }
  return out
}

function sha256(message) {
  const bytes = message.slice()
  const bitLen = bytes.length * 8
  bytes.push(0x80)
  while (bytes.length % 64 !== 56) bytes.push(0)
  const hi = Math.floor(bitLen / 0x100000000)
  const lo = bitLen >>> 0
  for (let shift = 24; shift >= 0; shift -= 8) bytes.push((hi >>> shift) & 0xff)
  for (let shift = 24; shift >= 0; shift -= 8) bytes.push((lo >>> shift) & 0xff)

  let h0 = 0x6a09e667
  let h1 = 0xbb67ae85
  let h2 = 0x3c6ef372
  let h3 = 0xa54ff53a
  let h4 = 0x510e527f
  let h5 = 0x9b05688c
  let h6 = 0x1f83d9ab
  let h7 = 0x5be0cd19
  const w = new Array(64)

  for (let offset = 0; offset < bytes.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      const at = offset + index * 4
      w[index] = ((bytes[at] << 24) | (bytes[at + 1] << 16) | (bytes[at + 2] << 8) | bytes[at + 3]) >>> 0
    }
    for (let index = 16; index < 64; index += 1) {
      const s0 = (rotr(w[index - 15], 7) ^ rotr(w[index - 15], 18) ^ (w[index - 15] >>> 3)) >>> 0
      const s1 = (rotr(w[index - 2], 17) ^ rotr(w[index - 2], 19) ^ (w[index - 2] >>> 10)) >>> 0
      w[index] = (w[index - 16] + s0 + w[index - 7] + s1) >>> 0
    }
    let a = h0
    let b = h1
    let c = h2
    let d = h3
    let e = h4
    let f = h5
    let g = h6
    let h = h7
    for (let index = 0; index < 64; index += 1) {
      const s1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0
      const ch = ((e & f) ^ (~e & g)) >>> 0
      const temp1 = (h + s1 + ch + K[index] + w[index]) >>> 0
      const s0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0
      const temp2 = (s0 + maj) >>> 0
      h = g
      g = f
      f = e
      e = (d + temp1) >>> 0
      d = c
      c = b
      b = a
      a = (temp1 + temp2) >>> 0
    }
    h0 = (h0 + a) >>> 0
    h1 = (h1 + b) >>> 0
    h2 = (h2 + c) >>> 0
    h3 = (h3 + d) >>> 0
    h4 = (h4 + e) >>> 0
    h5 = (h5 + f) >>> 0
    h6 = (h6 + g) >>> 0
    h7 = (h7 + h) >>> 0
  }

  const words = [h0, h1, h2, h3, h4, h5, h6, h7]
  const out = []
  for (let index = 0; index < words.length; index += 1) {
    const word = words[index]
    out.push((word >>> 24) & 0xff, (word >>> 16) & 0xff, (word >>> 8) & 0xff, word & 0xff)
  }
  return out
}

function bytesToHex(bytes) {
  const alphabet = "0123456789abcdef"
  let hex = ""
  for (let index = 0; index < bytes.length; index += 1) {
    const byte = bytes[index]
    hex += alphabet[byte >> 4] + alphabet[byte & 0xf]
  }
  return hex
}

function hmacSha256Hex(key, message) {
  const block = 64
  let normalized = key.slice()
  if (normalized.length > block) normalized = sha256(normalized)
  while (normalized.length < block) normalized.push(0)
  const outer = []
  const inner = []
  for (let index = 0; index < block; index += 1) {
    outer.push(normalized[index] ^ 0x5c)
    inner.push(normalized[index] ^ 0x36)
  }
  return bytesToHex(sha256(outer.concat(sha256(inner.concat(message)))))
}

function str(value) {
  return value == null ? "" : String(value).trim()
}

function decimal(value) {
  const text = str(value)
  if (!/^[1-9]\d{0,19}$/.test(text) && text !== "0") return ""
  if (text === "0") return ""
  return text
}

function dataCheckString(fields) {
  const lines = []
  for (let index = 0; index < FIELDS.length; index += 1) {
    const key = FIELDS[index]
    if (!Object.prototype.hasOwnProperty.call(fields, key)) continue
    const value = fields[key]
    if (value == null || value === "") continue
    lines.push(key + "=" + String(value))
  }
  lines.sort()
  return lines.join("\n")
}

function fail(status, message) {
  return { ok: false, status: status, message: message }
}

function telegramAuthDecision(body, botToken, nowSeconds) {
  const token = str(botToken)
  if (!token) return fail(503, "Вход через Telegram не настроен")
  if (!body || typeof body !== "object") return fail(400, "Telegram не подтвердил вход")
  const id = decimal(body.id)
  const authDate = decimal(body.auth_date)
  const hash = str(body.hash).toLowerCase()
  if (!id || !authDate || !/^[0-9a-f]{64}$/.test(hash)) return fail(400, "Telegram не подтвердил вход")
  const age = Number(nowSeconds) - Number(authDate)
  if (!Number.isFinite(age) || age < -30 || age > MAX_AGE_SECONDS) {
    return fail(400, "Время входа через Telegram истекло")
  }
  const signed = {
    id: id,
    auth_date: authDate,
  }
  const firstName = str(body.first_name)
  const lastName = str(body.last_name)
  const username = str(body.username)
  const photoUrl = str(body.photo_url)
  if (firstName) signed.first_name = firstName
  if (lastName) signed.last_name = lastName
  if (username) signed.username = username
  if (photoUrl) signed.photo_url = photoUrl
  const digest = hmacSha256Hex(sha256(utf8Bytes(token)), utf8Bytes(dataCheckString(signed)))
  if (digest !== hash) return fail(400, "Telegram не подтвердил вход")
  const name = [firstName, lastName].filter((part) => part !== "").join(" ") || username
  return {
    ok: true,
    user: { id: id, firstName: firstName, lastName: lastName, name: name },
  }
}

module.exports = { telegramAuthDecision, dataCheckString, hmacSha256Hex, sha256, utf8Bytes, bytesToHex }
