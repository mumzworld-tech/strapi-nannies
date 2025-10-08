module.exports = [
  {
    method: "GET",
    path: "/generate/:orderId",
    handler: "invoice.generate",
    config: {
      auth: false,
    },
  },
  {
    method: "GET",
    path: "/download/:id",
    handler: "invoice.download",
    config: {
      auth: false,
      policies: [],
    },
  },
];
