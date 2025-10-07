export default [
  {
    method: "GET",
    path: "/export",
    handler: "exportOrders.index",
    config: {
      auth: false, // change to true if only authenticated users should access
    },
  },
];
