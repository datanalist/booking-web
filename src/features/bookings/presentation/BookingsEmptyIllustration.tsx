const ILLUSTRATION_SRC = "/bookings-empty-no-result.svg";
const ILLUSTRATION_WIDTH = 228.846;
const ILLUSTRATION_HEIGHT = 200;

export function BookingsEmptyIllustration() {
  return (
    <img
      src={ILLUSTRATION_SRC}
      alt=""
      width={ILLUSTRATION_WIDTH}
      height={ILLUSTRATION_HEIGHT}
    />
  );
}
