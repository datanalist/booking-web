import { expect, test } from "vitest";
import { NAME_MAX, NAME_MIN } from "../../../config";
import { parseProfileEditValues } from "./parseProfileEditValues";
import type { ProfileEditValues } from "./ProfileEditValues";

const VALID: ProfileEditValues = {
  name: "Ирина",
  phone: "+7 (900) 123-45-67",
  email: "hello@gmail.com",
};

test("принимает имя на границах длины и обрезает пробелы", () => {
  const min = parseProfileEditValues({ ...VALID, name: "  Ан  " });
  const maxName = "Я".repeat(NAME_MAX);
  const max = parseProfileEditValues({ ...VALID, name: `  ${maxName}  ` });
  expect(min).toEqual({
    status: "ok",
    values: { ...VALID, name: "Ан" },
  });
  expect(NAME_MIN).toBe(2);
  if (max.status !== "ok") {
    throw new Error("длинное имя должно проходить");
  }
  expect(max.values.name).toBe(maxName);
});

test("отклоняет короткое и слишком длинное имя", () => {
  const short = parseProfileEditValues({ ...VALID, name: " А " });
  const long = parseProfileEditValues({
    ...VALID,
    name: "Я".repeat(NAME_MAX + 1),
  });
  expect(short).toEqual({
    status: "errors",
    errors: { name: "Введите имя от 2 до 50 символов" },
  });
  expect(long.status).toBe("errors");
});

test("телефон: маска, 10 цифр и префикс 8 приводятся к +7", () => {
  const masked = parseProfileEditValues(VALID);
  const digits = parseProfileEditValues({ ...VALID, phone: "79001234567" });
  const trunk = parseProfileEditValues({ ...VALID, phone: "89001234567" });
  const expected = "+7 (900) 123-45-67";
  expect(masked).toEqual({ status: "ok", values: { ...VALID, phone: expected } });
  expect(digits).toEqual({ status: "ok", values: { ...VALID, phone: expected } });
  expect(trunk).toEqual({ status: "ok", values: { ...VALID, phone: expected } });
});

test("отклоняет неполный телефон", () => {
  const result = parseProfileEditValues({ ...VALID, phone: "+7 (900) 123-45" });
  expect(result).toEqual({
    status: "errors",
    errors: { phone: "Введите корректный номер телефона" },
  });
});

test("email нормализуется, пустой и кривой отклоняются", () => {
  const ok = parseProfileEditValues({ ...VALID, email: "  Hello@Gmail.com " });
  const empty = parseProfileEditValues({ ...VALID, email: "   " });
  const bad = parseProfileEditValues({ ...VALID, email: "не-email" });
  expect(ok).toEqual({
    status: "ok",
    values: { ...VALID, email: "hello@gmail.com" },
  });
  expect(empty).toEqual({
    status: "errors",
    errors: { email: "Обязательное поле" },
  });
  expect(bad).toEqual({
    status: "errors",
    errors: { email: "Введите корректный email" },
  });
});

test("пустое фото опускается, непустое сохраняется", () => {
  const missing = parseProfileEditValues({ ...VALID, photoUrl: "  " });
  const kept = parseProfileEditValues({
    ...VALID,
    photoUrl: " data:image/png;base64,abc ",
  });
  expect(missing).toEqual({ status: "ok", values: VALID });
  expect(kept).toEqual({
    status: "ok",
    values: { ...VALID, photoUrl: "data:image/png;base64,abc" },
  });
});

test("собирает ошибки всех полей сразу", () => {
  const result = parseProfileEditValues({
    name: "",
    phone: "+7",
    email: "bad",
  });
  expect(result.status).toBe("errors");
  if (result.status !== "errors") {
    return;
  }
  expect(result.errors.name).toBe("Введите имя от 2 до 50 символов");
  expect(result.errors.phone).toBe("Введите корректный номер телефона");
  expect(result.errors.email).toBe("Введите корректный email");
});
