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
  coupon: {
    enabled: true,
    resolve: "./node_modules/mumz-strapi-plugin-coupon",
  },
});
