import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { PersonalCard } from "./PersonalCard";

afterEach(() => {
  cleanup();
});

const FILLED = {
  name: "Анна Иваненко",
  phone: "+7 (900) 123-45-67",
  email: "hello@gmail.com",
} as const;

test("без фото показывает иллюстрацию и не показывает фото профиля", () => {
  const { container } = render(<PersonalCard {...FILLED} />);

  const illustration = container.querySelector(
    'img[src="/profile/photo-empty-illustration.svg"]',
  );
  expect(illustration).not.toBeNull();
  expect(illustration).toHaveAttribute("alt", "");
  expect(illustration).toHaveAttribute("width", "188");
  expect(illustration).toHaveAttribute("height", "159");
  expect(illustration?.parentElement?.className).toContain("rounded-[12px]");
  expect(illustration?.parentElement?.className).toContain(
    "border-[rgba(251,192,40,0.17)]",
  );
  expect(screen.queryByRole("img", { name: "Фото профиля" })).toBeNull();
});

test("пустой photoUrl тоже считается отсутствием фото", () => {
  const { container } = render(<PersonalCard {...FILLED} photoUrl="" />);

  expect(
    container.querySelector('img[src="/profile/photo-empty-illustration.svg"]'),
  ).not.toBeNull();
  expect(screen.queryByRole("img", { name: "Фото профиля" })).toBeNull();
});

test("с фото показывает снимок и скрывает иллюстрацию", () => {
  const { container } = render(
    <PersonalCard {...FILLED} photoUrl="https://example.com/photo.jpg" />,
  );

  const photo = screen.getByRole("img", { name: "Фото профиля" });
  expect(photo).toHaveAttribute("src", "https://example.com/photo.jpg");
  expect(photo.className).toContain("object-cover");
  expect(photo.className).toContain("rounded-lg");
  expect(photo.className).toContain("h-[244px]");
  expect(
    container.querySelector('img[src="/profile/photo-empty-illustration.svg"]'),
  ).toBeNull();
});

test("показывает подписи и значения, подпись связана с полем", () => {
  render(<PersonalCard {...FILLED} />);

  expect(screen.getByLabelText("Имя")).toHaveValue("Анна Иваненко");
  expect(screen.getByLabelText("Номер телефона")).toHaveValue(
    "+7 (900) 123-45-67",
  );
  expect(screen.getByLabelText("Email:")).toHaveValue("hello@gmail.com");
});

test("поля только для чтения", () => {
  render(<PersonalCard {...FILLED} />);

  for (const label of ["Имя", "Номер телефона", "Email:"]) {
    expect(screen.getByLabelText(label)).toHaveAttribute("readonly");
  }
});

test("сырые цифры телефона показывает маской", () => {
  render(<PersonalCard {...FILLED} phone="79001234567" />);

  expect(screen.getByLabelText("Номер телефона")).toHaveValue(
    "+7 (900) 123-45-67",
  );
});
