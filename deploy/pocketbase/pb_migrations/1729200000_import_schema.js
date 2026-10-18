migrate((app) => {
  const raw = toString($os.readFile("/pb/pb_schema.json"))
  app.importCollectionsByMarshaledJSON(raw, false)

  let blocks = null
  try {
    blocks = app.findCollectionByNameOrId("listing_blocks")
  } catch (_) {
    blocks = null
  }
  if (blocks) {
    return
  }

  const listings = app.findCollectionByNameOrId("listings")
  if (listings.id !== "pbc_3660939671") {
    throw new Error("listings collection id must be pbc_3660939671")
  }

  const collection = new Collection({
    name: "listing_blocks",
    type: "base",
    listRule: '@request.auth.id != "" && listing.host = @request.auth.id',
    viewRule: '@request.auth.id != "" && listing.host = @request.auth.id',
    createRule: '@request.auth.id != "" && @request.body.listing.host = @request.auth.id',
    updateRule:
      '@request.auth.id != "" && listing.host = @request.auth.id && (@request.body.listing:isset = false || @request.body.listing = listing)',
    deleteRule: '@request.auth.id != "" && listing.host = @request.auth.id',
    fields: [
      {
        name: "listing",
        type: "relation",
        required: true,
        collectionId: listings.id,
        maxSelect: 1,
        cascadeDelete: false,
      },
      { name: "start", type: "date", required: true },
      { name: "end", type: "date", required: true },
    ],
    indexes: [
      "CREATE INDEX idx_listing_blocks_listing_start ON listing_blocks (listing, start)",
    ],
  })
  app.save(collection)
}, (app) => {
  // данные и коллекции вниз не сносятся
})
