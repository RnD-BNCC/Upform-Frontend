import type { ReactNode } from "react";
import { BrandLogo } from "@/components/layout";

type Props = {
  children: ReactNode;
};

export default function AudienceShell({ children }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <BrandLogo className="mb-6 h-8 w-auto max-w-[140px]" />
        {children}
      </div>
    </div>
  );
}
