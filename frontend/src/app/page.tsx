"use client";

import { useEffect, useState } from "react";
import { SupervisorDashboard } from "@/components/SupervisorDashboard";

export default function Page() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <SupervisorDashboard />;
}
