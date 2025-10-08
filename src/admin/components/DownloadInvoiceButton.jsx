import React, { useState } from "react";
import { Button } from "@strapi/design-system";
import { Download } from "@strapi/icons";

const DownloadInvoiceButton = (props) => {
  const [isDownloading, setIsDownloading] = useState(false);

  // Get the document ID from URL
  const pathParts = window.location.pathname.split('/');
  const id = pathParts[pathParts.length - 1];

  // For debugging, log
  console.log("Document ID from URL:", id);

  // Only show for Order collection
  const uid = props?.layout?.contentType?.uid || props?.layout?.uid || props?.slug;
  console.log("uid:", uid);

  // Show only for order collection
  if (uid !== "api::order.order") {
    return null;
  }

  // Show only if we have an ID
  if (!id || id === 'create') {
    return null;
  }

  const handleDownloadInvoice = async () => {
    try {
      setIsDownloading(true);

      // Get the backend URL
      const baseUrl =
        typeof window !== "undefined" &&
        window.strapi &&
        window.strapi.backendURL
          ? window.strapi.backendURL
          : "";

      // Call the plugin endpoint to download the invoice
      const response = await fetch(
        `${baseUrl}/download-invoice/download/${id}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download invoice");
      }

      // For text files, open in new tab to download
      const url = `${baseUrl}/download-invoice/download/${id}`;
      window.open(url, '_blank');

      // Show success notification (optional)
      if (typeof window !== "undefined" && window.strapi?.notification) {
        window.strapi.notification.toggle({
          type: "success",
          message: `Invoice downloaded successfully`,
        });
      }
    } catch (error) {
      console.error("Error downloading invoice:", error);
      // Show error notification (optional)
      if (typeof window !== "undefined" && window.strapi?.notification) {
        window.strapi.notification.toggle({
          type: "warning",
          message: "Failed to download invoice. Please try again.",
        });
      } else {
        alert("Failed to download invoice. Please try again.");
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownloadInvoice}
      loading={isDownloading}
      disabled={isDownloading}
      startIcon={<Download />}
      size="S"
      variant="secondary"
    >
      Download Invoice
    </Button>
  );
};

export default DownloadInvoiceButton;
