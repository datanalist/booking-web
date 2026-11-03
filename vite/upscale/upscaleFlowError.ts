/** Единая причина изменения: ошибка апскейла с HTTP-статусом и текстом без секретов. */

export class UpscaleFlowError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "UpscaleFlowError";
    this.status = status;
  }
}
