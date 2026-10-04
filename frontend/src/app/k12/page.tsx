"use client";

import { useEffect, useState } from "react";
import { K12GuardianApp } from "@/components/K12GuardianApp";

export default function K12Page() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <K12GuardianApp />;
}
