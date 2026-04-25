import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function AudienceShell({ children }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <p className="text-lg font-bold italic text-gray-900 mb-6">UpForm</p>
        {children}
      </div>
    </div>
  );
}
