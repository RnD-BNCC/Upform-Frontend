import { useState } from "react";
import type { FieldType } from "@/types/form";
import {
  TextTIcon,
  EnvelopeSimpleIcon,
  TextHOneIcon,
  TextAlignLeftIcon,
  MegaphoneIcon,
  CaretDownIcon,
  CheckSquareIcon,
  RadioButtonIcon,
  ListChecksIcon,
  CalendarBlankIcon,
  ClockIcon,
  StarIcon,
  SlidersHorizontalIcon,
  ImageIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  SortAscendingIcon,
  ChartBarIcon,
  TextAaIcon,
  HashIcon,
} from "@phosphor-icons/react";

type FieldItem = {
  label: string;
  icon: React.ReactNode;
  type: FieldType | null;
  onCustomClick?: () => void;
};

type Category = {
  label: string;
  iconBg: string;
  items: FieldItem[];
};

type Props = {
  onAddField: (type: FieldType) => void;
  onAddImageBlock: (file: File) => void;
};

const IMG_INPUT_ID = "field-panel-img-upload";

export default function FieldCategoryPanel({
  onAddField,
  onAddImageBlock,
}: Props) {
  const [search, setSearch] = useState("");

  const categories: Category[] = [
    {
      label: "Frequently used",
      iconBg: "bg-green-100 text-green-600",
      items: [
        {
          label: "Short answer",
          icon: <TextTIcon size={16} />,
          type: "short_text",
        },
        {
          label: "Multiple choice",
          icon: <RadioButtonIcon size={16} />,
          type: "multiple_choice",
        },
        {
          label: "Email input",
          icon: <EnvelopeSimpleIcon size={16} />,
          type: "email",
        },
      ],
    },
    {
      label: "Display text",
      iconBg: "bg-gray-100 text-gray-500",
      items: [
        {
          label: "Heading",
          icon: <TextHOneIcon size={16} />,
          type: "title_block",
        },
        {
          label: "Paragraph",
          icon: <TextAlignLeftIcon size={16} />,
          type: "paragraph",
        },
        {
          label: "Banner",
          icon: <MegaphoneIcon size={16} />,
          type: "banner_block",
        },
        {
          label: "Image",
          icon: <ImageIcon size={16} />,
          type: null,
          onCustomClick: () => document.getElementById(IMG_INPUT_ID)?.click(),
        },
      ],
    },
    {
      label: "Choices",
      iconBg: "bg-orange-100 text-orange-600",
      items: [
        {
          label: "Dropdown",
          icon: <CaretDownIcon size={16} />,
          type: "dropdown",
        },
        {
          label: "Checkboxes",
          icon: <CheckSquareIcon size={16} />,
          type: "checkbox",
        },
        {
          label: "Multiple choice",
          icon: <RadioButtonIcon size={16} />,
          type: "multiple_choice",
        },
        {
          label: "Multiselect",
          icon: <ListChecksIcon size={16} />,
          type: "checkbox",
        },
      ],
    },
    {
      label: "Rating & Ranking",
      iconBg: "bg-yellow-100 text-yellow-600",
      items: [
        {
          label: "Ranking",
          icon: <SortAscendingIcon size={16} />,
          type: "ranking",
        },
        { label: "Star Rating", icon: <StarIcon size={16} />, type: "rating" },
        {
          label: "Slider",
          icon: <SlidersHorizontalIcon size={16} />,
          type: "linear_scale",
        },
        {
          label: "Opinion scale",
          icon: <ChartBarIcon size={16} />,
          type: "opinion_scale",
        },
      ],
    },
    {
      label: "Text",
      iconBg: "bg-green-100 text-green-600",
      items: [
        {
          label: "Short answer",
          icon: <TextTIcon size={16} />,
          type: "short_text",
        },
        {
          label: "Long answer",
          icon: <TextAlignLeftIcon size={16} />,
          type: "paragraph",
        },
        {
          label: "Rich text",
          icon: <TextAaIcon size={16} />,
          type: "rich_text",
        },
      ],
    },
    {
      label: "Contact Info",
      iconBg: "bg-blue-100 text-blue-600",
      items: [
        {
          label: "Email input",
          icon: <EnvelopeSimpleIcon size={16} />,
          type: "email",
        },
        { label: "Phone number", icon: <PhoneIcon size={16} />, type: "phone" },
        { label: "Address", icon: <MapPinIcon size={16} />, type: "address" },
      ],
    },
    {
      label: "Number",
      iconBg: "bg-purple-100 text-purple-600",
      items: [
        { label: "Number", icon: <HashIcon size={16} />, type: "number" },
        {
          label: "Currency",
          icon: <CurrencyDollarIcon size={16} />,
          type: "currency",
        },
      ],
    },
    {
      label: "Time",
      iconBg: "bg-purple-100 text-purple-600",
      items: [
        {
          label: "Date picker",
          icon: <CalendarBlankIcon size={16} />,
          type: "date",
        },
        { label: "Time picker", icon: <ClockIcon size={16} />, type: "time" },
      ],
    },
  ];

  const filteredCategories = search.trim()
    ? categories
        .map((cat) => ({
          ...cat,
          items: cat.items.filter((item) =>
            item.label.toLowerCase().includes(search.toLowerCase()),
          ),
        }))
        .filter((cat) => cat.items.length > 0)
    : categories;

  return (
    <div className="w-72 shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden h-full">
      <input
        id={IMG_INPUT_ID}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onAddImageBlock(file);
          e.target.value = "";
        }}
      />

      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
          <MagnifyingGlassIcon size={14} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search fields"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-xs text-gray-700 bg-transparent outline-none placeholder:text-gray-400 min-w-0"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-4 scrollbar-thin">
        {filteredCategories.map((cat) => (
          <div key={cat.label}>
            <p className="px-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              {cat.label}
            </p>
            <div className="grid grid-cols-3 gap-1">
              {cat.items.map((item) => {
                const handleClick = () => {
                  if (item.onCustomClick) {
                    item.onCustomClick();
                  } else if (item.type) {
                    onAddField(item.type);
                  }
                };

                return (
                  <button
                    key={item.label}
                    onClick={handleClick}
                    className="flex flex-col items-center gap-1.5 rounded-xl p-2 pt-3 text-center transition-all h-20 bg-white border cursor-pointer border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    title={item.label}
                  >
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cat.iconBg}`}
                    >
                      {item.icon}
                    </span>
                    <span className="text-[9px] font-medium leading-tight text-center text-gray-600 wrap-break-word w-full">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
