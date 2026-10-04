"use client";

import { useEffect, useState } from "react";
import { CollegeCampusPassApp } from "@/components/CollegeCampusPassApp";

export default function CollegePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <CollegeCampusPassApp />;
}
