import type { ImgHTMLAttributes } from "react";
import {
  BRAND_NAME,
  getBrandLogoSrc,
  type BrandLogoVariant,
} from "@/constants/brand";

type BrandLogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  variant?: BrandLogoVariant;
};

export default function BrandLogo({
  variant = "blue",
  alt = BRAND_NAME,
  className = "",
  draggable = false,
  ...props
}: BrandLogoProps) {
  return (
    <img
      src={getBrandLogoSrc(variant)}
      alt={alt}
      draggable={draggable}
      className={["block object-contain", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
