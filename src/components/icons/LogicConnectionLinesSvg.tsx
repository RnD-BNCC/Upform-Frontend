type LogicNodeLike = {
  id: string;
  x: number;
  y: number;
};

type LogicBranchLike = {
  id: string;
  fromId: string;
  toId: string;
  isConditional?: boolean;
  label?: string;
  conditionTree?: { items?: unknown[] };
};

type Props = {
  nodes: LogicNodeLike[];
  branches: LogicBranchLike[];
  hoveredBranchId: string | null;
  onHoverBranch: (id: string | null) => void;
  onDeleteBranch: (branch: LogicBranchLike, index: number) => void;
  nodeW: number;
  nodeH: number;
  condPanelTop: number;
  condRowH: number;
};

function getLogicBranchId(
  branch: Pick<LogicBranchLike, "id" | "fromId" | "isConditional">,
  fallbackIndex = 0,
) {
  const trimmed = branch.id?.trim();
  if (trimmed) return trimmed;

  const safeFromId = branch.fromId.trim() || "unknown";
  return branch.isConditional
    ? `cond:${safeFromId}:${fallbackIndex}`
    : `default:${safeFromId}`;
}

function getBranchConditionLabel(
  branch: Pick<LogicBranchLike, "conditionTree" | "label">,
) {
  if (branch.conditionTree?.items?.length) {
    return "Condition";
  }

  return branch.label;
}

export default function LogicConnectionLinesSvg({
  nodes,
  branches,
  hoveredBranchId,
  onHoverBranch,
  onDeleteBranch,
  nodeW,
  nodeH,
  condPanelTop,
  condRowH,
}: Props) {
  const nodeMap = Object.fromEntries(nodes.map((node) => [node.id, node]));

  const conditionalByFrom: Record<string, string[]> = {};
  for (const [branchIndex, branch] of branches.entries()) {
    if (branch.isConditional && branch.toId) {
      if (!conditionalByFrom[branch.fromId]) {
        conditionalByFrom[branch.fromId] = [];
      }
      conditionalByFrom[branch.fromId].push(getLogicBranchId(branch, branchIndex));
    }
  }

  return (
    <svg
      style={{
        position: "absolute",
        left: -5000,
        top: -5000,
        width: 20000,
        height: 20000,
      }}
    >
      <defs>
        <marker id="lm-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path
            d="M0 0 L6 3 L0 6"
            fill="none"
            stroke="#6b7280"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
        <marker id="lm-arrow-hover" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path
            d="M0 0 L6 3 L0 6"
            fill="none"
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
      <g transform="translate(5000, 5000)">
        {branches.map((branch, branchIndex) => {
          const from = nodeMap[branch.fromId];
          const to = nodeMap[branch.toId];
          if (!from || !to || !branch.toId) return null;

          const branchId = getLogicBranchId(branch, branchIndex);
          const x1 = from.x + nodeW;
          const y1 = branch.isConditional
            ? from.y +
              condPanelTop +
              Math.max(
                0,
                (conditionalByFrom[branch.fromId] ?? []).indexOf(branchId),
              ) *
                condRowH +
              condRowH / 2
            : from.y + nodeH / 2;
          const x2 = to.x;
          const y2 = to.y + nodeH / 2;
          const offset = Math.max(60, Math.abs(x2 - x1) * 0.4);
          const d = `M ${x1} ${y1} C ${x1 + offset} ${y1} ${x2 - offset} ${y2} ${x2} ${y2}`;
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          const isHovered = hoveredBranchId === branchId;
          const branchLabel = getBranchConditionLabel(branch);
          const branchKey = `${branchId}-${branch.toId}-${branchIndex}`;

          return (
            <g
              key={branchKey}
              onMouseEnter={() => onHoverBranch(branchId)}
              onMouseLeave={() => onHoverBranch(null)}
              onClick={(event) => {
                event.stopPropagation();
                onHoverBranch(branchId);
              }}
            >
              <path
                d={d}
                fill="none"
                stroke="transparent"
                strokeWidth="12"
                style={{ cursor: "pointer" }}
              />
              <path
                d={d}
                fill="none"
                stroke={isHovered ? "#ef4444" : "#6b7280"}
                strokeWidth={isHovered ? 2.5 : 2}
                markerEnd={isHovered ? "url(#lm-arrow-hover)" : "url(#lm-arrow)"}
                style={{ cursor: "pointer", transition: "stroke 0.15s" }}
              />
              {branchLabel ? (
                <text
                  x={mx}
                  y={my - 6}
                  fontSize="10"
                  fill={isHovered ? "#ef4444" : "#6b7280"}
                  textAnchor="middle"
                  fontFamily="inherit"
                >
                  {branchLabel}
                </text>
              ) : null}
              {isHovered ? (
                <foreignObject
                  x={mx - 10}
                  y={my - 10}
                  width="20"
                  height="20"
                  style={{ overflow: "visible" }}
                >
                  <button
                    data-no-drag="true"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteBranch(branch, branchIndex);
                      onHoverBranch(null);
                    }}
                    title="Delete connection"
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-colors hover:bg-red-600"
                    style={{ fontSize: "10px", cursor: "pointer", lineHeight: 1 }}
                  >
                    x
                  </button>
                </foreignObject>
              ) : null}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
