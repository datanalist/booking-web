/** Ошибка платёжного сценария: статус и текст для клиента, без стека. */
export class PaymentFlowError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "PaymentFlowError";
    this.status = status;
  }
}
