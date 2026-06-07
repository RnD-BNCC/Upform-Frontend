import { useMemo } from "react";
import { useQueryUsers } from "@/api/users";
import ConditionSelect, {
  type ConditionSelectOption,
} from "@/components/builder/layout/reference/ConditionSelect";

type UserSearchSelectProps = {
  enabled?: boolean;
  value: string;
  onChange: (email: string) => void;
  triggerClassName?: string;
};

export default function UserSearchSelect({
  enabled = true,
  value,
  onChange,
  triggerClassName,
}: UserSearchSelectProps) {
  const usersQuery = useQueryUsers({ take: 50 }, enabled);
  const options = useMemo<ConditionSelectOption[]>(
    () =>
      (usersQuery.data?.data ?? []).map((targetUser) => ({
        value: targetUser.email,
        label: targetUser.name?.trim() || targetUser.email,
        subtitle: targetUser.email,
        searchText: `${targetUser.name ?? ""} ${targetUser.email} ${targetUser.role}`,
      })),
    [usersQuery.data?.data],
  );

  return (
    <ConditionSelect
      value={value}
      placeholder={usersQuery.isLoading ? "Loading users..." : "Choose user"}
      options={options}
      searchable
      searchPlaceholder="Search user email or name..."
      emptyLabel="No users found"
      menuWidth={420}
      onChange={onChange}
      triggerClassName={triggerClassName}
    />
  );
}
