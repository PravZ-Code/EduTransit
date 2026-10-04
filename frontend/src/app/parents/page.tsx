"use client";

import { useEffect, useState } from "react";
import { ParentsJourneyApp } from "@/components/ParentsJourneyApp";

export default function ParentsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <ParentsJourneyApp />;
}
