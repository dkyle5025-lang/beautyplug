import { useEffect, useState } from "react";
import { providers as providerApi, services as serviceApi } from "../api/resources.js";

// Bookings only carry foreign-key ids. This hook loads providers + services
// once and returns id→object maps so views can render human-readable names.
export default function useLookups() {
  const [providerMap, setProviderMap] = useState({});
  const [serviceMap, setServiceMap] = useState({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([providerApi.list(), serviceApi.list()])
      .then(([provs, svcs]) => {
        if (!active) return;
        setProviderMap(Object.fromEntries(provs.map((p) => [p.id, p])));
        setServiceMap(Object.fromEntries(svcs.map((s) => [s.id, s])));
      })
      .catch(() => {})
      .finally(() => active && setReady(true));
    return () => {
      active = false;
    };
  }, []);

  return {
    ready,
    providerName: (id) => providerMap[id]?.business_name || `Provider #${id}`,
    serviceName: (id) => serviceMap[id]?.service_name || `Service #${id}`,
    providerMap,
    serviceMap,
  };
}
