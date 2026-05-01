import type { FormField } from "@/types/form";
import type {
  ResultDatabaseView,
  ResultFilterGroup,
  ResultSortRule,
} from "@/types/results";
import { DownloadSimpleIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { RefreshButton } from "@/components/ui";
import DateRangePopover, {
  type AnalyticsDateFilter,
} from "../analytics/DateRangePopover";
import FilterPopover from "./FilterPopover";
import HideFieldsPopover from "./HideFieldsPopover";
import SortPopover from "./SortPopover";
import ViewPopover from "./ViewPopover";

type DatabaseToolbarProps = {
  activeView: ResultDatabaseView;
  dateFilter?: AnalyticsDateFilter;
  fields: FormField[];
  searchValue?: string;
  showDateFilter?: boolean;
  showSearch?: boolean;
  showViewSelector?: boolean;
  views: ResultDatabaseView[];
  onCreateView: () => void;
  onDateFilterChange?: (filter: AnalyticsDateFilter) => void;
  onDeleteView: (viewId: string) => void;
  onDuplicateView: (viewId: string) => void;
  onExportList?: () => void;
  onExportView: (viewId: string) => void;
  onFieldHiddenChange: (hiddenFieldIds: string[]) => void;
  onFieldOrderChange: (fieldOrder: string[]) => void;
  onFilterChange: (filterGroup: ResultFilterGroup) => void;
  onRefresh: () => void | Promise<void>;
  onRenameView: (viewId: string, name: string) => void;
  onSearchChange?: (value: string) => void;
  onSelectView: (viewId: string) => void;
  onSortChange: (sortRules: ResultSortRule[]) => void;
};

export default function DatabaseToolbar({
  activeView,
  dateFilter,
  fields,
  onCreateView,
  onDateFilterChange,
  onDeleteView,
  onDuplicateView,
  onExportList,
  onExportView,
  onFieldHiddenChange,
  onFieldOrderChange,
  onFilterChange,
  onRefresh,
  onRenameView,
  onSearchChange,
  onSelectView,
  onSortChange,
  searchValue = "",
  showDateFilter = false,
  showSearch = false,
  showViewSelector = true,
  views,
}: DatabaseToolbarProps) {
  return (
    <div className="flex min-h-14 shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-3">
      {showViewSelector ? (
        <ViewPopover
          activeView={activeView}
          views={views}
          onCreateView={onCreateView}
          onDeleteView={onDeleteView}
          onDuplicateView={onDuplicateView}
          onExportView={onExportView}
          onRenameView={onRenameView}
          onSelectView={onSelectView}
        />
      ) : null}
      <SortPopover
        fields={fields}
        sortRules={activeView.sortRules}
        onChange={onSortChange}
      />
      <HideFieldsPopover
        fields={fields}
        fieldOrder={activeView.fieldOrder}
        hiddenFieldIds={activeView.hiddenFieldIds}
        onHiddenChange={onFieldHiddenChange}
        onOrderChange={onFieldOrderChange}
      />
      <FilterPopover
        fields={fields}
        filterGroup={activeView.filterGroup}
        onChange={onFilterChange}
      />
      {showSearch ? (
        <div className="relative ml-auto w-64">
          <MagnifyingGlassIcon
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder="Search responses..."
            className="h-10 w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 shadow-sm outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400"
          />
        </div>
      ) : null}
      {showDateFilter && dateFilter && onDateFilterChange ? (
        <DateRangePopover value={dateFilter} onChange={onDateFilterChange} />
      ) : null}
      {!showViewSelector && onExportList ? (
        <button
          type="button"
          onClick={onExportList}
          className="flex h-10 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
        >
          <DownloadSimpleIcon size={15} />
          Export to Excel
        </button>
      ) : null}
      <RefreshButton
        onRefresh={onRefresh}
        className={showSearch ? "" : "ml-auto"}
        ariaLabel="Refresh responses"
      />
    </div>
  );
}
