import ExportOrdersButton from "./components/ExportOrdersButton";
import DownloadInvoiceButton from "./components/DownloadInvoiceButton";
import cssText from "./styles/date-range.css?inline";
import AuthLogo from "./extensions/logo.svg";
import MenuLogo from "./extensions/menu-logo.svg";

const config = {
  locales: [],
  auth: {
    logo: AuthLogo,
  },
  menu: {
    logo: MenuLogo,
  },
  translations: {
    en: {
      "app.components.LeftMenu.navbrand.title": "Mumzworld | Nannies",
      "app.components.LeftMenu.navbrand.workplace": "Admin Panel",
      "Auth.form.welcome.title": "Welcome to Nannies Strapi!",
    },
  },
};

const bootstrap = (app) => {
  try {
    if (typeof document !== "undefined" && cssText) {
      const id = "date-range-inline-css";
      if (!document.getElementById(id)) {
        const style = document.createElement("style");
        style.id = id;
        style.textContent = cssText;
        document.head.appendChild(style);
      }
    }
  } catch {}
  app.getPlugin("content-manager").injectComponent("listView", "actions", {
    name: "ExportOrdersButton",
    Component: ExportOrdersButton,
  });
  app.getPlugin("content-manager").injectComponent("editView", "right-links", {
    name: "DownloadInvoiceButton",
    Component: DownloadInvoiceButton,
  });
};

export default {
  config,
  bootstrap,
};
