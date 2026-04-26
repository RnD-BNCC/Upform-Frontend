import { BaseModal } from "@/components/ui";
import { Spinner } from "@/components/ui";

type LoadingModalProps = {
  isOpen: boolean;
  title?: string;
  description?: string;
};

export default function LoadingModal({
  isOpen,
  title = "Processing...",
  description = "Please wait a moment while we process your request.",
}: LoadingModalProps) {
  return (
    <BaseModal isOpen={isOpen} required zIndex="z-[9999]" className="w-full max-w-75">
      <div className="flex flex-col items-center justify-center gap-6 px-9 py-10 text-center text-black">
        <Spinner size={55} className="text-primary-500" />
        <div>
          <h1 className="text-xl leading-loose font-bold">{title}</h1>
          <h2 className="text-base leading-[1.15] text-center">{description}</h2>
        </div>
      </div>
    </BaseModal>
  );
}
