import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import * as PhosphorIcons from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import {
  ImagesSquareIcon,
  ImageIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  UploadSimpleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useQueryGalleryMedia } from "@/api/gallery";
import { useMutationUploadImage } from "@/api/upload";
import { Spinner } from "@/components/ui";
import { createThemeLogoIconValue } from "@/utils/form/themeLogo";

type PickerTab = "unsplash" | "link" | "gallery" | "icon" | "uploads";

type ImagePickerModalProps = {
  isOpen: boolean;
  showIconTab?: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
};

type UnsplashImage = {
  alt: string;
  url: string;
};

type IconOption = {
  Icon: Icon;
  label: string;
  name: string;
};

const UNSPLASH_IMAGES: UnsplashImage[] = [
  {
    alt: "Colorful gradient waves",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&q=80",
  },
  {
    alt: "Blue abstract surface",
    url: "https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?auto=format&fit=crop&w=1080&q=80",
  },
  {
    alt: "Teal fabric folds",
    url: "https://images.unsplash.com/photo-1557683311-eac922347aa1?auto=format&fit=crop&w=1080&q=80",
  },
  {
    alt: "Soft pastel sphere",
    url: "https://images.unsplash.com/photo-1614850715649-1d0106293bd1?auto=format&fit=crop&w=1080&q=80",
  },
  {
    alt: "Purple night sky",
    url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1080&q=80",
  },
  {
    alt: "Golden light strands",
    url: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1080&q=80",
  },
  {
    alt: "Color smoke",
    url: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1080&q=80",
  },
  {
    alt: "Minimal white shapes",
    url: "https://images.unsplash.com/photo-1618172193622-ae2d025f4032?auto=format&fit=crop&w=1080&q=80",
  },
  {
    alt: "Purple light ribbon",
    url: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=1080&q=80",
  },
  {
    alt: "Dark copper smoke",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=80",
  },
];

const ICON_OPTIONS: IconOption[] = Object.entries(PhosphorIcons)
  .filter(([name, value]) => name.endsWith("Icon") && value != null)
  .map(([name, value]) => ({
    Icon: value as Icon,
    label: name.replace(/Icon$/, "").replace(/([a-z])([A-Z])/g, "$1 $2"),
    name,
  }))
  .sort((left, right) => left.label.localeCompare(right.label));

export default function ImagePickerModal({
  isOpen,
  showIconTab = true,
  onClose,
  onSelect,
}: ImagePickerModalProps) {
  const [activeTab, setActiveTab] = useState<PickerTab>("unsplash");
  const [search, setSearch] = useState("");
  const [linkValue, setLinkValue] = useState("");
  const [uploadError, setUploadError] = useState("");
  const queryClient = useQueryClient();
  const uploadImage = useMutationUploadImage();
  const galleryQuery = useQueryGalleryMedia(
    1,
    60,
    isOpen && activeTab === "gallery",
  );
  const tabs: Array<{
    Icon: Icon;
    key: PickerTab;
    label: string;
  }> = [
    { Icon: ImageIcon, key: "unsplash", label: "Unsplash" },
    { Icon: LinkIcon, key: "link", label: "Link" },
    { Icon: ImagesSquareIcon, key: "gallery", label: "Gallery" },
    ...(showIconTab
      ? [{ Icon: PhosphorIcons.SmileyIcon, key: "icon" as const, label: "Icon" }]
      : []),
    { Icon: UploadSimpleIcon, key: "uploads", label: "Uploads" },
  ];

  const normalizedSearch = search.trim().toLowerCase();
  const filteredImages = useMemo(
    () =>
      normalizedSearch
        ? UNSPLASH_IMAGES.filter((image) =>
            image.alt.toLowerCase().includes(normalizedSearch),
          )
        : UNSPLASH_IMAGES,
    [normalizedSearch],
  );

  const filteredIcons = useMemo(
    () =>
      normalizedSearch
        ? ICON_OPTIONS.filter((icon) =>
            icon.label.toLowerCase().includes(normalizedSearch),
          )
        : ICON_OPTIONS,
    [normalizedSearch],
  );
  const filteredGalleryImages = useMemo(() => {
    const items = galleryQuery.data?.items ?? [];

    return normalizedSearch
      ? items.filter((item) =>
          item.filename.toLowerCase().includes(normalizedSearch),
        )
      : items;
  }, [galleryQuery.data?.items, normalizedSearch]);

  if (!isOpen) {
    return null;
  }

  const handleSelect = (url: string) => {
    onSelect(url);
    onClose();
    setSearch("");
    setLinkValue("");
    setUploadError("");
  };

  const handleFiles = (files: FileList | File[]) => {
    const file = Array.from(files).find((item) => item.type.startsWith("image/"));
    if (!file) {
      return;
    }

    setUploadError("");
    uploadImage.mutate(file, {
      onSuccess: ({ url }) => {
        void queryClient.invalidateQueries({ queryKey: ["gallery-media"] });
        handleSelect(url);
      },
      onError: () => {
        setUploadError("Upload failed. Please try another image.");
      },
    });
  };

  const modal = (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-gray-900/55 px-4 py-6">
      <div className="relative flex max-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col rounded-sm bg-white shadow-2xl">
        <div className="shrink-0 px-8 pt-5">
          <div className="flex items-start justify-between border-b border-gray-200">
            <div className="flex">
              {tabs.map(({ Icon, key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setActiveTab(key);
                    setSearch("");
                  }}
                  className={`flex h-11 items-center gap-2 border-b px-5 text-sm font-medium transition-colors ${
                    activeTab === key
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon size={18} weight={activeTab === key ? "bold" : "regular"} />
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close image picker"
            >
              <XIcon size={20} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
          {activeTab === "link" ? (
            <div className="space-y-3">
              <textarea
                value={linkValue}
                onChange={(event) => setLinkValue(event.target.value)}
                placeholder="https://images.unsplash.com/photo..."
                rows={4}
                className="w-full resize-none rounded-sm border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-primary-500"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const url = linkValue.trim();
                    if (url) {
                      handleSelect(url);
                    }
                  }}
                  className="h-9 rounded-sm bg-primary-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!linkValue.trim()}
                >
                  Set image
                </button>
              </div>
            </div>
          ) : null}

          {activeTab === "uploads" ? (
            <div className="space-y-3">
              <label
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  if (uploadImage.isPending) return;
                  handleFiles(event.dataTransfer.files);
                }}
                className={`flex h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500 transition-colors hover:border-primary-300 hover:bg-primary-50/40 ${
                  uploadImage.isPending ? "pointer-events-none opacity-70" : ""
                }`}
              >
                {uploadImage.isPending ? (
                  <Spinner size={20} />
                ) : null}
                <span>
                  {uploadImage.isPending ? "Uploading image..." : "Drag & drop a file or "}
                  {!uploadImage.isPending ? (
                    <span className="underline underline-offset-2">browse</span>
                  ) : null}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadImage.isPending}
                  className="sr-only"
                  onChange={(event) => {
                    if (event.target.files) {
                      handleFiles(event.target.files);
                    }
                    event.target.value = "";
                  }}
                />
              </label>
              {uploadError ? (
                <p className="text-xs font-medium text-red-500">{uploadError}</p>
              ) : null}
            </div>
          ) : null}

          {activeTab === "gallery" ? (
            <div className="space-y-4">
              <div className="flex h-10 items-center gap-2 rounded-sm border border-gray-300 bg-white px-3 focus-within:border-primary-500">
                <MagnifyingGlassIcon size={17} className="text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search gallery"
                  className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                />
              </div>

              {galleryQuery.isLoading ? (
                <div className="flex h-44 items-center justify-center">
                  <Spinner size={24} />
                </div>
              ) : galleryQuery.isError ? (
                <div className="flex h-44 items-center justify-center rounded-sm border border-dashed border-gray-200 text-sm text-gray-400">
                  Failed to load gallery images.
                </div>
              ) : filteredGalleryImages.length ? (
                <div className="grid grid-cols-3 gap-2.5">
                  {filteredGalleryImages.map((image) => (
                    <button
                      key={image.key || image.url}
                      type="button"
                      onClick={() => handleSelect(image.url)}
                      className="group overflow-hidden rounded-sm bg-gray-100"
                      title={image.filename}
                    >
                      <img
                        src={image.url}
                        alt={image.filename}
                        className="h-24 w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex h-44 items-center justify-center rounded-sm border border-dashed border-gray-200 text-sm text-gray-400">
                  No gallery images found.
                </div>
              )}
            </div>
          ) : null}

          {activeTab === "unsplash" ? (
            <div className="space-y-4">
              <div className="flex h-10 items-center gap-2 rounded-sm border border-gray-300 bg-white px-3 focus-within:border-primary-500">
                <MagnifyingGlassIcon size={17} className="text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search images"
                  className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                />
              </div>
              <p className="text-xs text-gray-400">
                Images by{" "}
                <a
                  href="https://unsplash.com"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                >
                  Unsplash
                </a>
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {filteredImages.map((image) => (
                  <button
                    key={image.url}
                    type="button"
                    onClick={() => handleSelect(image.url)}
                    className="group overflow-hidden rounded-sm bg-gray-100"
                    title={image.alt}
                  >
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="h-24 w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "icon" && showIconTab ? (
            <div className="space-y-4">
              <div className="flex h-10 items-center gap-2 rounded-sm border border-gray-300 bg-white px-3 focus-within:border-primary-500">
                <MagnifyingGlassIcon size={17} className="text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search icons"
                  className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-10 gap-2">
                {filteredIcons.slice(0, 240).map(({ Icon, label, name }) => (
                  <button
                    key={name}
                    type="button"
                    title={label}
                    onClick={() => handleSelect(createThemeLogoIconValue(name))}
                    className="flex h-10 w-10 items-center justify-center rounded-sm text-gray-500 transition-colors hover:bg-primary-50 hover:text-primary-600"
                  >
                    <Icon size={25} />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return modal;
  }

  return createPortal(modal, document.body);
}
