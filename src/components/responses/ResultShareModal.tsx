import {
  CaretDownIcon,
  CheckCircleIcon,
  CopyIcon,
  EyeIcon,
  GlobeHemisphereWestIcon,
  LockIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BaseModal, Spinner } from "@/components/ui";
import type {
  ResultShare,
  ResultShareMember,
  ResultShareRole,
  ResultShareVisibility,
} from "@/types/resultsShare";

type Props = {
  formTitle?: string;
  isLoading: boolean;
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onCopy: (url: string) => void;
  onSave: (
    visibility: ResultShareVisibility,
    publicRole: ResultShareRole,
    members: Array<{ email: string; role: ResultShareRole }>,
  ) => void;
  share?: ResultShare;
};

const OPTIONS: Array<{
  description: string;
  icon: typeof LockIcon;
  label: string;
  value: ResultShareVisibility;
}> = [
  {
    description: "Only workspace members can open it.",
    icon: LockIcon,
    label: "Private",
    value: "private",
  },
  {
    description: "Only invited emails can open the link.",
    icon: UsersIcon,
    label: "Restricted",
    value: "restricted",
  },
  {
    description: "Anyone with the link can open it.",
    icon: GlobeHemisphereWestIcon,
    label: "Public link",
    value: "public",
  },
];

const ROLE_OPTIONS: Array<{
  description: string;
  icon: typeof EyeIcon;
  label: string;
  value: ResultShareRole;
}> = [
  {
    description: "Can browse and export results.",
    icon: EyeIcon,
    label: "Viewer",
    value: "viewer",
  },
  {
    description: "Can manage result records.",
    icon: PencilSimpleIcon,
    label: "Editor",
    value: "editor",
  },
];

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
  onSelect: (role: ResultShareRole) => void;
  value: ResultShareRole;
}) {
  const active =
    ROLE_OPTIONS.find((option) => option.value === value) ?? ROLE_OPTIONS[0];
  const ActiveIcon = active.icon;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 176;
      const left = Math.max(
        8,
        Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8),
      );
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
        type="button"
        onClick={() => onOpenChange(isOpen ? null : id)}
        className="flex min-w-24 items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition-colors hover:border-primary-200 hover:text-primary-600"
      >
        <span className="flex items-center gap-1.5">
          <ActiveIcon size={13} weight="bold" className="text-gray-400" />
          {active.label}
        </span>
        <CaretDownIcon size={11} weight="bold" className="text-gray-400" />
      </button>

      {isOpen
        ? createPortal(
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
                    type="button"
                    onClick={() => {
                      onSelect(option.value);
                      onOpenChange(null);
                    }}
                    className="flex w-full items-start gap-2 px-2.5 py-2 text-left transition-colors hover:bg-gray-50"
                  >
                    <Icon
                      size={14}
                      weight="bold"
                      className={
                        selected ? "text-primary-500" : "text-gray-400"
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-gray-800">
                        {option.label}
                      </span>
                      <span className="block text-[10px] leading-snug text-gray-400">
                        {option.description}
                      </span>
                    </span>
                    {selected ? (
                      <CheckCircleIcon
                        size={14}
                        weight="fill"
                        className="text-primary-500"
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export default function ResultShareModal({
  share,
  isLoading,
  ...props
}: Props) {
  return (
    <ResultShareModalContent
      key={share?.id ?? (isLoading ? "loading" : "empty")}
      share={share}
      isLoading={isLoading}
      {...props}
    />
  );
}

function ResultShareModalContent({
  formTitle,
  isLoading,
  isOpen,
  isSaving,
  onClose,
  onCopy,
  onSave,
  share,
}: Props) {
  const [visibility, setVisibility] = useState<ResultShareVisibility>(
    share?.visibility ?? "private",
  );
  const [publicRole, setPublicRole] = useState<ResultShareRole>(
    share?.publicRole ?? "viewer",
  );
  const [members, setMembers] = useState<ResultShareMember[]>(
    () => share?.members ?? [],
  );
  const [emailInput, setEmailInput] = useState("");
  const [openRoleMenu, setOpenRoleMenu] = useState<string | null>(null);
  const savedVisibility = share?.visibility ?? "private";
  const savedPublicRole = share?.publicRole ?? "viewer";
  const savedMembers = useMemo(
    () =>
      (share?.members ?? [])
        .map((member) => `${member.email}:${member.role}`)
        .sort(),
    [share?.members],
  );
  const currentMembers = useMemo(
    () => members.map((member) => `${member.email}:${member.role}`).sort(),
    [members],
  );
  const hasChanges =
    visibility !== savedVisibility ||
    publicRole !== savedPublicRole ||
    JSON.stringify(currentMembers) !== JSON.stringify(savedMembers);
  const canCopy = savedVisibility !== "private" && Boolean(share?.shareUrl);
  const normalizedEmail = emailInput.trim().toLowerCase();
  const canAddEmail =
    normalizedEmail.includes("@") &&
    !members.some((member) => member.email === normalizedEmail);

  useEffect(() => {
    setVisibility(share?.visibility ?? "private");
    setPublicRole(share?.publicRole ?? "viewer");
    setMembers(share?.members ?? []);
  }, [share?.id, share?.publicRole, share?.visibility, share?.members]);

  const addMember = () => {
    if (!canAddEmail) return;
    setMembers((current) => [
      ...current,
      { email: normalizedEmail, role: "viewer" },
    ]);
    setEmailInput("");
  };

  const updateMemberRole = (email: string, role: ResultShareRole) => {
    setMembers((current) =>
      current.map((member) =>
        member.email === email ? { ...member, role } : member,
      ),
    );
  };

  const removeMember = (email: string) => {
    setMembers((current) => current.filter((member) => member.email !== email));
  };

  const handleSave = () => {
    onSave(
      visibility,
      publicRole,
      members.map((member) => ({ email: member.email, role: member.role })),
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      zIndex="z-[9999]"
      className="w-[min(92vw,30rem)]"
    >
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold text-gray-900">
            Share results
          </h2>
          <p className="truncate text-xs text-gray-400">
            {formTitle || "Untitled form"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <XIcon size={16} weight="bold" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size={28} className="text-primary-500" />
        </div>
      ) : (
        <div className="space-y-5 px-5 py-5">
          <div className="grid gap-2 sm:grid-cols-3">
            {OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = visibility === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setVisibility(option.value)}
                  disabled={isSaving}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    active
                      ? "border-primary-300 bg-primary-50 text-primary-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  } disabled:opacity-60`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <Icon size={18} weight={active ? "fill" : "regular"} />
                    {active ? <CheckCircleIcon size={16} weight="fill" /> : null}
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

          {visibility === "public" ? (
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <div>
                <p className="text-xs font-semibold text-gray-800">
                  Link permission
                </p>
                <p className="text-[11px] text-gray-400">
                  Anyone with the link
                </p>
              </div>
              <RoleDropdown
                id="public-role"
                isOpen={openRoleMenu === "public-role"}
                onOpenChange={setOpenRoleMenu}
                onSelect={setPublicRole}
                value={publicRole}
              />
            </div>
          ) : null}

          {visibility === "restricted" ? (
            <div className="rounded-lg border border-gray-200">
              <div className="border-b border-gray-100 px-3 py-2.5">
                <p className="text-xs font-bold text-gray-900">People</p>
                <p className="text-[11px] text-gray-400">
                  Invite emails that can view shared results.
                </p>
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
                  type="button"
                  onClick={addMember}
                  disabled={!canAddEmail || isSaving}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-500 text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <PlusIcon size={15} weight="bold" />
                </button>
              </div>
              {members.length > 0 ? (
                <div className="max-h-40 overflow-y-auto border-t border-gray-100">
                  {members.map((member) => (
                    <div
                      key={member.email}
                      className="flex items-center gap-2 px-3 py-2"
                    >
                      <p className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-800">
                        {member.email}
                      </p>
                      <RoleDropdown
                        id={`member-${member.email}`}
                        isOpen={openRoleMenu === `member-${member.email}`}
                        onOpenChange={setOpenRoleMenu}
                        onSelect={(role) =>
                          updateMemberRole(member.email, role)
                        }
                        value={member.role}
                      />
                      <button
                        type="button"
                        onClick={() => removeMember(member.email)}
                        disabled={isSaving}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                      >
                        <TrashIcon size={13} weight="bold" />
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
          ) : null}

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
            <div className="flex items-center gap-2">
              <input
                value={share?.shareUrl ?? ""}
                readOnly
                className="min-w-0 flex-1 bg-transparent px-2 text-xs text-gray-500 outline-none"
              />
              <button
                type="button"
                onClick={() => share?.shareUrl && onCopy(share.shareUrl)}
                disabled={!canCopy}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-white px-3 text-xs font-bold text-gray-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CopyIcon size={13} weight="bold" />
                Copy
              </button>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-gray-400">
            This link only shows form results. It does not expose builder,
            share settings, logs, permissions, or editing tools.
          </p>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="rounded-md bg-primary-500 px-4 py-2 text-sm font-bold text-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </BaseModal>
  );
}
