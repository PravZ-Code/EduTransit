"use client";

import { useEffect, useState } from "react";
import { DriverCabinApp } from "@/components/DriverCabinApp";

export default function DriverPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <DriverCabinApp />;
}
