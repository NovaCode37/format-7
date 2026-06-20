"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import { SITE_DEFAULTS, type SiteSettings } from "./siteDefaults";

export function useSiteSettings(): SiteSettings {
  const [settings, setSettings] = useState<SiteSettings>(SITE_DEFAULTS);
  useEffect(() => {
    let alive = true;
    api.getSiteSettings()
      .then((data) => {
        if (alive && data && Object.keys(data).length) {
          setSettings({ ...SITE_DEFAULTS, ...data });
        }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return settings;
}
