const USERS_COLLECTION_ID = "_pb_users_auth_";

const PAYMENT_INDEXES = [
  "CREATE UNIQUE INDEX idx_payments_yookassa_id ON payments (yookassa_payment_id) WHERE yookassa_payment_id != ''",
  "CREATE UNIQUE INDEX idx_payments_idempotence ON payments (idempotence_key)",
];

const CREDIT_INDEXES = [
  "CREATE UNIQUE INDEX idx_payment_credits_payment ON payment_credits (payment)",
];

/** Клиент не создаёт и не меняет платежи. Смотреть можно только свои. */
export function paymentsCollectionDefinition(): Record<string, unknown> {
  return {
    name: "payments",
    type: "base",
    listRule: "user = @request.auth.id",
    viewRule: "user = @request.auth.id",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    indexes: PAYMENT_INDEXES,
    fields: [
      {
        name: "user",
        type: "relation",
        required: true,
        collectionId: USERS_COLLECTION_ID,
        maxSelect: 1,
        cascadeDelete: false,
      },
      { name: "yookassa_payment_id", type: "text", required: false },
      { name: "idempotence_key", type: "text", required: true },
      {
        name: "amount",
        type: "number",
        required: true,
        onlyInt: true,
        min: 1,
        max: 1_000_000,
      },
      {
        name: "status",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["pending", "succeeded", "canceled"],
      },
      { name: "credited", type: "bool", required: false },
    ],
  };
}

/** Строка зачисления с уникальным платежом — замок от повторного начисления. */
export function creditsCollectionDefinition(paymentsCollectionId: string): Record<string, unknown> {
  return {
    name: "payment_credits",
    type: "base",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    indexes: CREDIT_INDEXES,
    fields: [
      {
        name: "payment",
        type: "relation",
        required: true,
        collectionId: paymentsCollectionId,
        maxSelect: 1,
        cascadeDelete: false,
      },
      {
        name: "user",
        type: "relation",
        required: true,
        collectionId: USERS_COLLECTION_ID,
        maxSelect: 1,
        cascadeDelete: false,
      },
      {
        name: "amount",
        type: "number",
        required: true,
        onlyInt: true,
        min: 1,
        max: 1_000_000,
      },
      { name: "applied", type: "bool", required: false },
    ],
  };
}
