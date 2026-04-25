import type { ConditionGroup, FormField } from "@/types/form";
import { ConditionPopup } from "@/components/builder/layout";
import { CONDITION_FIELD_TYPE_LABELS } from "@/utils/form";

type BranchConditionState = {
  conditionTree?: ConditionGroup;
};

type Props = {
  anchorEl: HTMLElement | null;
  branchId: string;
  availableFields: FormField[];
  branch: BranchConditionState;
  onUpdate: (updates: BranchConditionState) => void;
  onClose: () => void;
};

const EMPTY_CONDITION_TREE: ConditionGroup = {
  type: "group",
  logic: "and",
  items: [],
};

export default function BranchConditionPopover({
  anchorEl,
  branchId,
  availableFields,
  branch,
  onUpdate,
  onClose,
}: Props) {
  return (
    <ConditionPopup
      tree={branch.conditionTree ?? EMPTY_CONDITION_TREE}
      availableFields={availableFields}
      fieldTypeLabels={CONDITION_FIELD_TYPE_LABELS}
      onUpdate={(tree) =>
        onUpdate({
          conditionTree: tree.items.length > 0 ? tree : undefined,
        })
      }
      onClose={onClose}
      anchorEl={anchorEl}
      resetKey={branchId}
    />
  );
}
