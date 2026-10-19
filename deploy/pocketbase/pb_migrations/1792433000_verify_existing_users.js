migrate((app) => {
  const records = app.findAllRecords("users")
  for (let index = 0; index < records.length; index++) {
    const record = records[index]
    if (!record) continue
    if (typeof record.setVerified === "function") record.setVerified(true)
    else record.set("verified", true)
    app.save(record)
  }
}, (app) => {
  // Откат пустой: не снимаем verified у уже существующих пользователей.
})
