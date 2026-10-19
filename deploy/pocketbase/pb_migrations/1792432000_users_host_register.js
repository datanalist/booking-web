migrate((app) => {
  const users = app.findCollectionByNameOrId("users")
  users.createRule = '@request.body.roles:length = 1 && @request.body.roles:each = "host" && @request.body.account_status = "active" && (@request.body.emailVisibility:isset = false || @request.body.emailVisibility = false) && @request.body.verified:isset = false && @request.body.verified_host:isset = false && @request.body.balance:isset = false && @request.body.rating:isset = false && @request.body.reviews_count:isset = false && @request.body.years_hosting:isset = false && @request.body.staff_tasks:isset = false'
  app.save(users)
}, (app) => {
  const users = app.findCollectionByNameOrId("users")
  users.createRule = null
  app.save(users)
})
