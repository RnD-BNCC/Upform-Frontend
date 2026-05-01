import type { ConditionGroup, ConditionNode } from "@/types/form";

export function countConditionNodes(
  node: ConditionGroup | ConditionNode,
): number {
  if ("items" in node) {
    return node.items.reduce(
      (sum, child) => sum + countConditionNodes(child),
      0,
    );
  }

  return 1;
}
