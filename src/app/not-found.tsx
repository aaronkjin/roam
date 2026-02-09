import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-milk p-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="border-[4px] border-night bg-white pixel-shadow p-8 space-y-4">
          <p className="font-[family-name:var(--font-press-start)] text-6xl text-jam">
            404
          </p>
          <p className="font-[family-name:var(--font-press-start)] text-sm text-night">
            Page Not Found
          </p>
          <p className="text-sm text-rock">
            Looks like this path leads nowhere. Let&apos;s get you back on track.
          </p>
          <Button asChild>
            <Link href="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
