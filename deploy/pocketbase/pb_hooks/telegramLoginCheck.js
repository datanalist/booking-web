// Проверка id_token нового входа Telegram (OIDC, RS256). Ключ публичный, запроса к oauth.telegram.org нет.

const ISSUER = "https://oauth.telegram.org"
const CLOCK_SKEW_SECONDS = 60
const SHA256_DIGEST_INFO = [
  0x30, 0x31, 0x30, 0x0d, 0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01, 0x05, 0x00, 0x04, 0x20,
]
const TELEGRAM_RS256_KEYS = [
  {
    kid: "oidc-1",
    n: "5RneLtsKvVcxdv6gu6gxEQu30Cru5NiMQnY6SNr9ZyZFZ4ya-pfHNuaZXJ6QPG0JSFwoxeOkEO2-eZN_REVPm448PvjjsR1eQdZ5QpEkNxnItFcmxkHH91v5cgf52_EI9BGO-MT6f1vaBSg3uWHFlDxI7J2AYxNvd1_Nf3TkgrrR7gyJFTmEIai5RefGnA0KGNYDlRIGUzrz2F05n6gTaHFT_iHL5UHatTZA4GCiUSjIOuwqu5pE5uZge20TFv3cxXMQaFw_xv1pgQt_Rq8eoCN7TS0RQ0zjWKiad-W286BcFectXsUm03p5Nq_kY4mf_7rqwX_B8yy_bBreyKn7RQ",
    e: "AQAB",
  },
]
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

function str(value) {
  return value == null ? "" : String(value).trim()
}

function decimal(value) {
  const text = str(value)
  if (!/^[1-9]\d{0,19}$/.test(text) && text !== "0") return ""
  if (text === "0") return ""
  return text
}

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

function fail(status, message) {
  return { ok: false, status: status, message: message }
}

function b64urlToBytes(text) {
  const cleaned = String(text).replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/, "")
  if (cleaned.length === 0 || /[^A-Za-z0-9+/]/.test(cleaned)) return null
  const pad = cleaned.length % 4 === 0 ? "" : "====".slice(cleaned.length % 4)
  const source = cleaned + pad
  const out = []
  for (let index = 0; index < source.length; index += 4) {
    const a = B64.indexOf(source[index])
    const b = B64.indexOf(source[index + 1])
    const cChar = source[index + 2]
    const dChar = source[index + 3]
    const c = cChar === "=" ? -1 : B64.indexOf(cChar)
    const d = dChar === "=" ? -1 : B64.indexOf(dChar)
    if (a < 0 || b < 0 || (c < 0 && cChar !== "=") || (d < 0 && dChar !== "=")) return null
    out.push((a << 2) | (b >> 4))
    if (c >= 0) out.push(((b & 15) << 4) | (c >> 2))
    if (d >= 0) out.push(((c & 3) << 6) | d)
  }
  return out
}

function bytesToUtf8(bytes) {
  let out = ""
  for (let index = 0; index < bytes.length; index += 1) {
    const byte = bytes[index]
    if (byte < 0x80) out += String.fromCharCode(byte)
    else if ((byte & 0xe0) === 0xc0 && index + 1 < bytes.length) {
      out += String.fromCharCode(((byte & 0x1f) << 6) | (bytes[index + 1] & 0x3f))
      index += 1
    } else if ((byte & 0xf0) === 0xe0 && index + 2 < bytes.length) {
      out += String.fromCharCode(((byte & 0x0f) << 12) | ((bytes[index + 1] & 0x3f) << 6) | (bytes[index + 2] & 0x3f))
      index += 2
    } else if ((byte & 0xf8) === 0xf0 && index + 3 < bytes.length) {
      const code = ((byte & 0x07) << 18) | ((bytes[index + 1] & 0x3f) << 12) | ((bytes[index + 2] & 0x3f) << 6) | (bytes[index + 3] & 0x3f)
      const shifted = code - 0x10000
      out += String.fromCharCode(0xd800 + (shifted >> 10), 0xdc00 + (shifted & 0x3ff))
      index += 3
    } else return ""
  }
  return out
}

function bytesToBigInt(bytes) {
  let value = BigInt(0)
  const eight = BigInt(8)
  for (let index = 0; index < bytes.length; index += 1) value = (value << eight) + BigInt(bytes[index])
  return value
}

function bigIntToFixedBytes(value, length) {
  const out = []
  const eight = BigInt(8)
  const mask = BigInt(255)
  const zero = BigInt(0)
  for (let index = 0; index < length; index += 1) out.push(0)
  for (let index = length - 1; index >= 0; index -= 1) {
    out[index] = Number(value & mask)
    value >>= eight
  }
  if (value !== zero) return null
  return out
}

function modPow(base, exp, mod) {
  let result = BigInt(1)
  const one = BigInt(1)
  const zero = BigInt(0)
  let exponent = exp
  let value = base % mod
  while (exponent > zero) {
    if ((exponent & one) === one) result = (result * value) % mod
    exponent >>= one
    value = (value * value) % mod
  }
  return result
}

function bytesEqual(left, right) {
  if (!left || !right || left.length !== right.length) return false
  let diff = 0
  for (let index = 0; index < left.length; index += 1) diff |= left[index] ^ right[index]
  return diff === 0
}

function pkcs1Encode(hash, size) {
  const infoLength = SHA256_DIGEST_INFO.length + hash.length
  if (size < infoLength + 11) return null
  const encoded = [0x00, 0x01]
  const padding = size - infoLength - 3
  for (let index = 0; index < padding; index += 1) encoded.push(0xff)
  encoded.push(0x00)
  for (let index = 0; index < SHA256_DIGEST_INFO.length; index += 1) encoded.push(SHA256_DIGEST_INFO[index])
  for (let index = 0; index < hash.length; index += 1) encoded.push(hash[index])
  return encoded
}

function verifyRs256(modulusB64, exponentB64, signingInput, signature) {
  const modulus = b64urlToBytes(modulusB64)
  const exponent = b64urlToBytes(exponentB64)
  if (!modulus || !exponent || !signature || signature.length !== modulus.length) return false
  const encoded = pkcs1Encode(sha256(utf8Bytes(signingInput)), modulus.length)
  const decoded = bigIntToFixedBytes(
    modPow(bytesToBigInt(signature), bytesToBigInt(exponent), bytesToBigInt(modulus)),
    modulus.length,
  )
  return bytesEqual(decoded, encoded)
}

function unixSeconds(value) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.floor(value)
  if (typeof value === "string" && /^[0-9]+$/.test(value)) return Number(value)
  return null
}

function audienceMatches(aud, expected) {
  const want = str(expected)
  if (want === "") return false
  if (Array.isArray(aud)) {
    for (let index = 0; index < aud.length; index += 1) {
      if (str(aud[index]) === want) return true
    }
    return false
  }
  return str(aud) === want
}

function findKey(keys, kid) {
  const want = str(kid)
  for (let index = 0; index < keys.length; index += 1) {
    if (str(keys[index].kid) === want) return keys[index]
  }
  return null
}

function phoneClaim(value) {
  const digits = str(value).replace(/\D/g, "")
  return digits === "" ? "" : "+" + digits
}

const NONCE_STORE_LIMIT = 200

function blankNonceMap() {
  return Object.create(null)
}

function nonceEntries(map) {
  const entries = []
  if (!map || typeof map !== "object") return entries
  const names = Object.keys(map)
  for (let index = 0; index < names.length; index += 1) {
    const name = names[index]
    const descriptor = Object.getOwnPropertyDescriptor(map, name)
    if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, "value")) continue
    entries.push({ name: name, expires: Number(descriptor.value) })
  }
  return entries
}

function rememberNonce(map, nonce, now) {
  const next = blankNonceMap()
  const key = String(nonce)
  const fresh = []
  const entries = nonceEntries(map)
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]
    if (!(entry.expires >= now)) continue
    if (entry.name === key) continue
    fresh.push(entry)
  }
  fresh.push({ name: key, expires: Number(now) + 600 })
  const start = fresh.length > NONCE_STORE_LIMIT ? fresh.length - NONCE_STORE_LIMIT : 0
  for (let index = start; index < fresh.length; index += 1) {
    next[fresh[index].name] = fresh[index].expires
  }
  return next
}

function consumeNonce(map, nonce, now) {
  const next = blankNonceMap()
  const entries = nonceEntries(map)
  let ok = false
  const want = String(nonce)
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]
    if (!(entry.expires >= now)) continue
    if (entry.name === want) ok = true
    else next[entry.name] = entry.expires
  }
  return { ok: ok, map: next }
}

function claimPresent(value) {
  return value != null && str(value) !== ""
}

function telegramUserId(payload) {
  const idPresent = claimPresent(payload.id)
  const subPresent = claimPresent(payload.sub)
  const id = decimal(payload.id)
  const sub = decimal(payload.sub)
  // Telegram отдаёт в sub непрозрачный идентификатор (19 цифр), настоящий id пользователя лежит в id.
  if (idPresent) return id
  if (subPresent) return sub
  return ""
}

function telegramIdTokenDecision(idToken, audience, nonce, nowSeconds, keys) {
  const token = str(idToken)
  const parts = token.split(".")
  if (parts.length !== 3 || token.length > 8192) return fail(400, "Telegram не подтвердил вход")
  const headerBytes = b64urlToBytes(parts[0])
  const payloadBytes = b64urlToBytes(parts[1])
  const signature = b64urlToBytes(parts[2])
  if (!headerBytes || !payloadBytes || !signature) return fail(400, "Telegram не подтвердил вход")
  let header = null
  let payload = null
  try {
    header = JSON.parse(bytesToUtf8(headerBytes))
    payload = JSON.parse(bytesToUtf8(payloadBytes))
  } catch (err) {
    return fail(400, "Telegram не подтвердил вход")
  }
  if (!header || header.alg !== "RS256") return fail(400, "Telegram не подтвердил вход")
  if (header.typ != null && header.typ !== "JWT") return fail(400, "Telegram не подтвердил вход")
  const keyList = Array.isArray(keys) && keys.length > 0 ? keys : TELEGRAM_RS256_KEYS
  const key = findKey(keyList, header.kid)
  if (!key || !verifyRs256(key.n, key.e, parts[0] + "." + parts[1], signature)) {
    return fail(400, "Telegram не подтвердил вход")
  }
  if (!payload || payload.iss !== ISSUER) return fail(400, "Telegram не подтвердил вход")
  if (str(audience) === "") return fail(503, "Вход через Telegram не настроен")
  if (!audienceMatches(payload.aud, audience)) return fail(400, "Telegram не подтвердил вход")
  const now = Number(nowSeconds)
  const exp = unixSeconds(payload.exp)
  const iat = unixSeconds(payload.iat)
  if (exp == null || exp + CLOCK_SKEW_SECONDS < now) return fail(400, "Время входа через Telegram истекло")
  if (iat != null && iat > now + CLOCK_SKEW_SECONDS) return fail(400, "Telegram не подтвердил вход")
  if (str(nonce) === "" || str(payload.nonce) !== str(nonce)) return fail(400, "Telegram не подтвердил вход")
  const id = telegramUserId(payload)
  if (!id) return fail(400, "Telegram не подтвердил вход")
  const firstName = str(payload.given_name)
  const lastName = str(payload.family_name)
  const username = str(payload.preferred_username)
  const name = str(payload.name) || [firstName, lastName].filter((part) => part !== "").join(" ") || username
  return {
    ok: true,
    user: {
      id: id,
      firstName: firstName,
      lastName: lastName,
      name: name,
      phone: phoneClaim(payload.phone_number),
    },
  }
}

module.exports = { telegramIdTokenDecision, rememberNonce, consumeNonce, sha256, utf8Bytes, bytesToHex }
