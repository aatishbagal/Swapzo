
"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center flex-grow text-center px-4 py-10">
      <h1 className="text-8xl font-bold text-primary mb-6">404</h1>
      <h2 className="text-3xl font-semibold mb-3 text-foreground">Page Not Found</h2>
      <p className="text-muted-foreground mb-10 max-w-md text-lg">
        Oops! The page you&#39;re looking for doesn&#39;t seem to exist. It might have been moved or deleted.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Button onClick={() => router.back()} variant="outline" size="lg">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Go Back
        </Button>
        <Button asChild size="lg">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    </div>
  );
}
