migrate((app) => {
  let payments = null
  try {
    payments = app.findCollectionByNameOrId("payments")
  } catch (_) {
    payments = null
  }

  if (!payments) {
    const users = app.findCollectionByNameOrId("users")
    payments = new Collection({
      name: "payments",
      type: "base",
      listRule: "user = @request.auth.id",
      viewRule: "user = @request.auth.id",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: "user",
          type: "relation",
          required: true,
          collectionId: users.id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: "yookassa_payment_id", type: "text", required: false },
        { name: "idempotence_key", type: "text", required: true },
        { name: "amount", type: "number", required: true, onlyInt: true, min: 1, max: 1000000 },
        {
          name: "status",
          type: "select",
          required: true,
          maxSelect: 1,
          values: ["pending", "succeeded", "canceled"],
        },
        { name: "credited", type: "bool", required: false },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_payments_yookassa_id ON payments (yookassa_payment_id) WHERE yookassa_payment_id != ''",
        "CREATE UNIQUE INDEX idx_payments_idempotence ON payments (idempotence_key)",
      ],
    })
    app.save(payments)
    payments = app.findCollectionByNameOrId("payments")
  }

  let credits = null
  try {
    credits = app.findCollectionByNameOrId("payment_credits")
  } catch (_) {
    credits = null
  }
  if (credits) {
    return
  }

  const users = app.findCollectionByNameOrId("users")
  const collection = new Collection({
    name: "payment_credits",
    type: "base",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      {
        name: "payment",
        type: "relation",
        required: true,
        collectionId: payments.id,
        maxSelect: 1,
        cascadeDelete: false,
      },
      {
        name: "user",
        type: "relation",
        required: true,
        collectionId: users.id,
        maxSelect: 1,
        cascadeDelete: false,
      },
      { name: "amount", type: "number", required: true, onlyInt: true, min: 1, max: 1000000 },
      { name: "applied", type: "bool", required: false },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_payment_credits_payment ON payment_credits (payment)",
    ],
  })
  app.save(collection)
}, (app) => {
  // Откат пустой: платежи и зачисления не удаляем.
})
