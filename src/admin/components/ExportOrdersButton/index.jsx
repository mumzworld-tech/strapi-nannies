import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Box, Flex } from "@strapi/design-system";
import { Download } from "@strapi/icons";
import { DateRange } from "react-date-range";

const ExportOrdersButton = (props) => {
  const loc = useLocation();
  const injectedUid =
    props?.uid || props?.layout?.uid || props?.collectionType?.uid;
  const isOrders =
    injectedUid === "api::order.order" ||
    (loc &&
      loc.pathname &&
      loc.pathname.includes(
        "/content-manager/collection-types/api::order.order"
      ));
  if (!isOrders) return null;

  const [loading, setLoading] = React.useState(false);
  const [startDate, setStartDate] = React.useState(null);
  const [endDate, setEndDate] = React.useState(null);
  const [showRange, setShowRange] = React.useState(false);
  const navigate = useNavigate();
  const [count, setCount] = React.useState(null);
  const panelRef = React.useRef(null);
  const [awaitingEnd, setAwaitingEnd] = React.useState(false);
  const formatDisplayDate = (d) => {
    if (!d) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };
  const onClick = async () => {
    try {
      if (loading) return;
      setLoading(true);
      const baseUrl =
        typeof window !== "undefined" &&
        window.strapi &&
        window.strapi.backendURL
          ? window.strapi.backendURL
          : "";
      const formatDate = (d) => {
        if (!d) return "";
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", formatDate(startDate));
      if (endDate) params.set("endDate", formatDate(endDate));
      const query = params.toString();
      const res = await fetch(
        `${baseUrl}/export-orders/export${query ? `?${query}` : ""}`,
        {
          method: "GET",
          headers: {
            Accept: "text/csv",
          },
          credentials: "include",
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Export failed: ${res.status} ${text}`);
      }

      const blob = await res.blob();
      // Try to read filename from Content-Disposition header
      let suggested = "orders.csv";
      const cd =
        res.headers.get("Content-Disposition") ||
        res.headers.get("content-disposition");
      if (cd) {
        const match = cd.match(
          /filename\*=UTF-8''([^;\n]+)|filename="?([^";\n]+)"?/i
        );
        const name = match
          ? decodeURIComponent(match[1] || match[2] || "")
          : "";
        if (name) suggested = name;
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = suggested;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export error", err);
      if (typeof window !== "undefined") {
        alert("Failed to export CSV");
      }
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const fetchCount = async () => {
      try {
        const baseUrl =
          typeof window !== "undefined" &&
          window.strapi &&
          window.strapi.backendURL
            ? window.strapi.backendURL
            : "";
        const formatDate = (d) => {
          if (!d) return "";
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };
        const params = new URLSearchParams();
        if (startDate) params.set("startDate", formatDate(startDate));
        if (endDate) params.set("endDate", formatDate(endDate));
        params.set("preview", "1");
        const res = await fetch(
          `${baseUrl}/export-orders/export?${params.toString()}`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            credentials: "include",
          }
        );
        if (!res.ok) throw new Error("count failed");
        const data = await res.json();
        setCount(typeof data?.count === "number" ? data.count : 0);
      } catch {
        setCount(null);
      }
    };
    fetchCount();
  }, [startDate, endDate]);

  const applyRangeToList = () => {
    const params = new URLSearchParams(loc?.search || "");
    // Clear existing createdAt filters
    const keysToDelete = [];
    for (const key of params.keys()) {
      if (key.startsWith("filters[createdAt]")) keysToDelete.push(key);
    }
    keysToDelete.forEach((k) => params.delete(k));

    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);
      if (start) params.set("filters[createdAt][$gte]", start.toISOString());
      if (end) params.set("filters[createdAt][$lte]", end.toISOString());
      params.set("page", "1");
    }

    navigate({
      pathname:
        loc?.pathname ||
        "/admin/content-manager/collection-types/api::order.order",
      search: params.toString(),
    });
    setShowRange(false);
  };

  const applyRangeToListWith = (start, end) => {
    const params = new URLSearchParams(loc?.search || "");
    const keysToDelete = [];
    for (const key of params.keys()) {
      if (key.startsWith("filters[createdAt]")) keysToDelete.push(key);
    }
    keysToDelete.forEach((k) => params.delete(k));
    if (start || end) {
      const s = start ? new Date(start) : null;
      const e = end ? new Date(end) : null;
      if (s) s.setHours(0, 0, 0, 0);
      if (e) e.setHours(23, 59, 59, 999);
      if (s) params.set("filters[createdAt][$gte]", s.toISOString());
      if (e) params.set("filters[createdAt][$lte]", e.toISOString());
      params.set("page", "1");
    }
    navigate({
      pathname:
        loc?.pathname ||
        "/admin/content-manager/collection-types/api::order.order",
      search: params.toString(),
    });
    setShowRange(false);
  };

  React.useEffect(() => {
    if (showRange && panelRef.current) {
      // Focus and click the first input to open the calendar immediately
      const input = panelRef.current.querySelector("input");
      if (input) {
        input.focus();
        if (typeof input.click === "function") input.click();
      }
    }
  }, [showRange]);

  // Restore selected range from URL filters so the button keeps the chosen range after reload/navigation
  React.useEffect(() => {
    const params = new URLSearchParams(loc?.search || "");
    const gte = params.get("filters[createdAt][$gte]");
    const lte = params.get("filters[createdAt][$lte]");
    if (gte) {
      const d = new Date(gte);
      if (!isNaN(d)) setStartDate(d);
    }
    if (lte) {
      const d = new Date(lte);
      if (!isNaN(d)) setEndDate(d);
    }
  }, [loc?.search]);

  return (
    <Flex gap={2} alignItems="flex-end" style={{ position: "relative" }}>
      <Box>
        <Button variant="tertiary" onClick={() => setShowRange((s) => !s)}>
          {startDate && endDate
            ? `${formatDisplayDate(startDate)} → ${formatDisplayDate(endDate)}`
            : "Select date range"}
        </Button>
        {showRange ? (
          <Box
            ref={panelRef}
            style={{
              position: "absolute",
              zIndex: 10,
              //   background: "#1F1F1F",
              //   color: "#F0F0F0",
              //   boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
              padding: 12,
              borderRadius: 4,
              marginTop: 6,
            }}
          >
            <Flex gap={2}>
              <DateRange
                mode="range"
                ranges={[
                  {
                    startDate: startDate || new Date(),
                    endDate:
                      endDate ||
                      (awaitingEnd ? startDate || new Date() : new Date()),
                    key: "selection",
                  },
                ]}
                onChange={(item) => {
                  const s = item.selection.startDate;
                  const e = item.selection.endDate;
                  if (!awaitingEnd) {
                    setStartDate(s);
                    setEndDate(null);
                    setAwaitingEnd(true);
                    return;
                  }
                  setAwaitingEnd(false);
                  setStartDate(s);
                  setEndDate(e);
                  if (s && e) {
                    applyRangeToListWith(s, e);
                  }
                }}
                moveRangeOnFirstSelection={false}
                editableDateInputs={false}
              />
            </Flex>
          </Box>
        ) : null}
      </Box>
      <Button
        variant="tertiary"
        onClick={() => {
          // Clear local state
          setStartDate(null);
          setEndDate(null);
          setCount(null);
          // Remove filters from list URL
          const params = new URLSearchParams(loc?.search || "");
          const keysToDelete = [];
          for (const key of params.keys()) {
            if (key.startsWith("filters[createdAt]")) keysToDelete.push(key);
          }
          keysToDelete.forEach((k) => params.delete(k));
          params.delete("page");
          navigate({
            pathname:
              loc?.pathname ||
              "/admin/content-manager/collection-types/api::order.order",
            search: params.toString(),
          });
        }}
      >
        Clear
      </Button>
      <Button
        variant="secondary"
        startIcon={<Download />}
        onClick={onClick}
        disabled={loading || count === 0}
      >
        Export orders CSV{typeof count === "number" ? ` (${count})` : ""}
      </Button>
    </Flex>
  );
};

export default ExportOrdersButton;
