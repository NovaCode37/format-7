"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CatalogRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/services/${slug}`);
  }, [slug, router]);

  return null;
}
