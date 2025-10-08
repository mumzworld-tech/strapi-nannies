import { prefixPluginTranslations } from "@strapi/helper-plugin";

export default {
  register(app) {
    app.registerPlugin({
      id: "download-invoice",
      name: "Download Invoice",
    });
  },

  bootstrap(app) {},

  async registerTrads(app) {
    const { locales } = app;

    const importedTrads = await Promise.all(
      (locales || []).map((locale) => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data: prefixPluginTranslations(data, "download-invoice"),
              locale,
            };
          })
          .catch(() => {
            return {
              data: {},
              locale,
            };
          });
      })
    );

    return Promise.resolve(importedTrads);
  },
};
