"use client";

import { useSearchParams } from "next/navigation";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportCsvLink() {
  const searchParams = useSearchParams();
  const href = `/api/transactions/export?${searchParams.toString()}`;

  return (
    <Button variant="outline" size="icon-sm" asChild>
      <a href={href} download>
        <Download className="size-4" />
      </a>
    </Button>
  );
}
