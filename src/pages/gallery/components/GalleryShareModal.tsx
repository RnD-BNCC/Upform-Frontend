import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CaretDown,
  CheckCircle,
  Copy,
  Eye,
  GlobeHemisphereWest,
  GoogleDriveLogo,
  Link,
  Lock,
  PencilSimple,
  Plus,
  Trash,
  Users,
  X,
} from "@phosphor-icons/react";
import { BaseModal, Spinner } from "@/components/ui";
import type {
  GalleryShare,
  GalleryShareMember,
  GalleryShareRole,
  GalleryShareVisibility,
} from "@/api/gallery";

type Props = {
  eventName: string;
  share?: GalleryShare;
  isLoading: boolean;
  isSaving: boolean;
  isConnectingDrive: boolean;
  onClose: () => void;
  onCopy: (url: string) => void;
  onConnectDrive: () => void;
  onChooseDriveAccount: () => void;
  onSave: (payload: {
    visibility: GalleryShareVisibility;
    publicRole: GalleryShareRole;
    driveSyncEnabled: boolean;
    members: Array<{ email: string; role: GalleryShareRole }>;
  }) => void;
};

const VISIBILITY_OPTIONS: Array<{
  value: GalleryShareVisibility;
  label: string;
  description: string;
  icon: typeof Lock;
}> = [
  {
    value: "private",
    label: "Private",
    description: "Only workspace members can open it.",
    icon: Lock,
  },
  {
    value: "restricted",
    label: "Restricted",
    description: "Only invited emails can open it.",
    icon: Users,
  },
  {
    value: "public",
    label: "Public link",
    description: "Anyone with the link can open it.",
    icon: GlobeHemisphereWest,
  },
];

const ROLE_OPTIONS: Array<{
  value: GalleryShareRole;
  label: string;
  description: string;
  icon: typeof Eye;
}> = [
  {
    value: "viewer",
    label: "Viewer",
    description: "Can browse and download.",
    icon: Eye,
  },
  {
    value: "editor",
    label: "Editor",
    description: "Can manage shared files.",
    icon: PencilSimple,
  },
];

function cleanMembers(members: GalleryShareMember[]) {
  return members.map((member) => ({
    email: member.email,
    role: member.role,
  }));
}

function RoleDropdown({
  id,
  isOpen,
  onOpenChange,
  onSelect,
  value,
}: {
  id: string;
  isOpen: boolean;
  onOpenChange: (id: string | null) => void;
  onSelect: (role: GalleryShareRole) => void;
  value: GalleryShareRole;
}) {
  const active = ROLE_OPTIONS.find((option) => option.value === value) ?? ROLE_OPTIONS[0];
  const ActiveIcon = active.icon;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 176;
      const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
      const top = Math.min(rect.bottom + 6, window.innerHeight - 132);
      setMenuPosition({ left, top });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        onClick={() => onOpenChange(isOpen ? null : id)}
        className="flex min-w-24 items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition-colors hover:border-primary-200 hover:text-primary-600"
      >
        <span className="flex items-center gap-1.5">
          <ActiveIcon size={13} weight="bold" className="text-gray-400" />
          {active.label}
        </span>
        <CaretDown size={11} weight="bold" className="text-gray-400" />
      </button>

      {isOpen && createPortal(
        <div
          className="fixed z-[10000] w-44 overflow-hidden rounded-sm border border-gray-100 bg-white py-1 shadow-[0_8px_32px_rgba(0,0,0,0.13),0_2px_8px_rgba(0,0,0,0.06)]"
          style={{ left: menuPosition.left, top: menuPosition.top }}
        >
          {ROLE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const selected = option.value === value;

            return (
              <button
                key={option.value}
                onClick={() => {
                  onSelect(option.value);
                  onOpenChange(null);
                }}
                className="flex w-full items-start gap-2 px-2.5 py-2 text-left transition-colors hover:bg-gray-50"
              >
                <Icon
                  size={14}
                  weight="bold"
                  className={selected ? "text-primary-500" : "text-gray-400"}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-gray-800">
                    {option.label}
                  </span>
                  <span className="block text-[10px] leading-snug text-gray-400">
                    {option.description}
                  </span>
                </span>
                {selected && <CheckCircle size={14} weight="fill" className="text-primary-500" />}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}

export default function GalleryShareModal({
  eventName,
  share,
  isLoading,
  isSaving,
  isConnectingDrive,
  onClose,
  onCopy,
  onConnectDrive,
  onChooseDriveAccount,
  onSave,
}: Props) {
  const [visibility, setVisibility] =
    useState<GalleryShareVisibility>("private");
  const [publicRole, setPublicRole] = useState<GalleryShareRole>("viewer");
  const [driveSyncEnabled, setDriveSyncEnabled] = useState(false);
  const [members, setMembers] = useState<
    Array<{ email: string; role: GalleryShareRole }>
  >([]);
  const [emailInput, setEmailInput] = useState("");
  const [openRoleMenu, setOpenRoleMenu] = useState<string | null>(null);

  useEffect(() => {
    if (!share) return;
    setVisibility(share.visibility);
    setPublicRole(share.publicRole);
    setDriveSyncEnabled(share.driveSyncEnabled);
    setMembers(cleanMembers(share.members));
  }, [share]);

  const canShareLink = visibility !== "private" && !!share?.shareUrl;
  const normalizedEmail = emailInput.trim().toLowerCase();
  const canAddEmail =
    !!normalizedEmail &&
    normalizedEmail.includes("@") &&
    !members.some((member) => member.email === normalizedEmail);

  const statusText = useMemo(() => {
    if (visibility === "public") return "Anyone with the link";
    if (visibility === "restricted") return `${members.length} invited`;
    return "Private";
  }, [members.length, visibility]);

  const addMember = () => {
    if (!canAddEmail) return;
    setMembers((current) => [
      ...current,
      { email: normalizedEmail, role: "viewer" },
    ]);
    setEmailInput("");
  };

  const updateMemberRole = (email: string, role: GalleryShareRole) => {
    setMembers((current) =>
      current.map((member) =>
        member.email === email ? { ...member, role } : member,
      ),
    );
  };

  const removeMember = (email: string) => {
    setMembers((current) => current.filter((member) => member.email !== email));
  };

  return (
    <BaseModal
      isOpen
      onClose={onClose}
      zIndex="z-[9999]"
      className="w-[min(92vw,34rem)]"
    >
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-gray-900 truncate">
            Share gallery
          </h2>
          <p className="text-xs text-gray-400 truncate">{eventName}</p>
        </div>
        <button
          onClick={onClose}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X size={16} weight="bold" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size={28} className="text-primary-500" />
        </div>
      ) : (
        <div className="space-y-5 px-5 py-5">
          <div className="grid gap-2 sm:grid-cols-3">
            {VISIBILITY_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = visibility === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => setVisibility(option.value)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    active
                      ? "border-primary-300 bg-primary-50 text-primary-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <Icon size={18} weight={active ? "fill" : "regular"} />
                    {active && <CheckCircle size={16} weight="fill" />}
                  </div>
                  <p className="text-xs font-bold text-gray-900">
                    {option.label}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-gray-400">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>

          {visibility === "public" && (
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <div>
                <p className="text-xs font-semibold text-gray-800">
                  Link permission
                </p>
                <p className="text-[11px] text-gray-400">{statusText}</p>
              </div>
              <RoleDropdown
                id="public-role"
                isOpen={openRoleMenu === "public-role"}
                onOpenChange={setOpenRoleMenu}
                onSelect={setPublicRole}
                value={publicRole}
              />
            </div>
          )}

          <div className="rounded-lg border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5">
              <div>
                <p className="text-xs font-bold text-gray-900">People</p>
                <p className="text-[11px] text-gray-400">
                  Invite by email and choose a role.
                </p>
              </div>
            </div>

            <div className="flex gap-2 p-3">
              <input
                value={emailInput}
                onChange={(event) => setEmailInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") addMember();
                }}
                placeholder="name@example.com"
                className="min-w-0 flex-1 rounded-md border border-gray-200 px-3 py-2 text-xs outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              />
              <button
                onClick={addMember}
                disabled={!canAddEmail}
                className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-500 text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={15} weight="bold" />
              </button>
            </div>

            {members.length > 0 ? (
              <div className="max-h-40 overflow-y-auto border-t border-gray-100">
                {members.map((member) => (
                  <div
                    key={member.email}
                    className="flex items-center gap-2 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-gray-800">
                        {member.email}
                      </p>
                    </div>
                    <RoleDropdown
                      id={`member-${member.email}`}
                      isOpen={openRoleMenu === `member-${member.email}`}
                      onOpenChange={setOpenRoleMenu}
                      onSelect={(role) => updateMemberRole(member.email, role)}
                      value={member.role}
                    />
                    <button
                      onClick={() => removeMember(member.email)}
                      className="flex size-7 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash size={13} weight="bold" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="border-t border-gray-100 px-3 py-4 text-center text-xs text-gray-400">
                No people added yet.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <GoogleDriveLogo
                  size={20}
                  weight="fill"
                  className="shrink-0 text-emerald-500"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900">
                    Google Drive
                  </p>
                  <p className="truncate text-[11px] text-gray-400">
                    {share?.driveFolderUrl
                      ? `Connected as ${share.driveOwnerEmail ?? "Google Drive"}`
                      : "Create a Drive folder for this gallery."}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {share?.driveFolderUrl && (
                  <button
                    onClick={onConnectDrive}
                    disabled={isConnectingDrive}
                    className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-primary-300 hover:text-primary-600 disabled:opacity-50"
                  >
                    {isConnectingDrive ? "Syncing..." : "Sync files"}
                  </button>
                )}
                <button
                  onClick={onChooseDriveAccount}
                  disabled={isConnectingDrive}
                  className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-primary-300 hover:text-primary-600 disabled:opacity-50"
                >
                  {share?.driveFolderUrl ? "Change" : "Choose account"}
                </button>
              </div>
            </div>

            {share?.driveFolderUrl && (
              <a
                href={share.driveFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-1.5 truncate rounded-md bg-gray-50 px-2.5 py-2 text-xs font-semibold text-primary-600 hover:bg-primary-50"
              >
                <Link size={13} weight="bold" />
                Open Drive folder
              </a>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-2">
            <input
              value={share?.shareUrl ?? ""}
              readOnly
              className="min-w-0 flex-1 bg-transparent px-2 text-xs text-gray-500 outline-none"
            />
            <button
              onClick={() => share?.shareUrl && onCopy(share.shareUrl)}
              disabled={!canShareLink}
              className="flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-xs font-bold text-gray-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Copy size={13} weight="bold" />
              Copy
            </button>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                onSave({
                  visibility,
                  publicRole,
                  driveSyncEnabled,
                  members,
                })
              }
              disabled={isSaving}
              className="rounded-md bg-primary-500 px-4 py-2 text-sm font-bold text-white hover:bg-primary-600 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </BaseModal>
  );
}
