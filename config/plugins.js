module.exports = ({ env }) => ({
  email: {
    config: {
      provider: "amazon-ses",
      providerOptions: {
        key: env("AWS_SES_KEY"),
        secret: env("AWS_SES_SECRET"),
        amazon: "https://email.us-east-1.amazonaws.com",
      },
      settings: {
        defaultFrom: "no-reply@mumzworld.com",
        defaultReplyTo: "no-reply@mumzworld.com",
      },
    },
  },
  "export-orders": {
    enabled: true,
    resolve: "./src/plugins/export-orders",
  },
  "download-invoice": {
    enabled: true,
    resolve: "./src/plugins/download-invoice",
  },
  coupon: {
    enabled: true,
    resolve: "./node_modules/mumz-strapi-plugin-coupon",
  },
});
