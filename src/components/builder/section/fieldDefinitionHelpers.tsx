import type { ComponentType, SVGProps } from "react";
import type { FieldType, FormField } from "@/types/form";
import type {
  CreateFieldOptions,
  FieldPlugin,
  FieldPluginIconProps,
} from "@/types/builder";

export function createFieldFactory(
  type: FieldType,
  defaults: Omit<FormField, "id" | "type">,
) {
  return (options?: CreateFieldOptions): FormField => ({
    id: options?.id ?? crypto.randomUUID(),
    type,
    ...defaults,
    ...(options?.initialImageUrl
      ? {
          headerImage: options.initialImageUrl,
          imageAlign: "left" as const,
          imageWidth: 100,
        }
      : {}),
    ...options?.overrides,
  });
}

export function createFieldPlugin(plugin: FieldPlugin) {
  return plugin;
}

export function wrapSvgIcon(
  Icon: ComponentType<SVGProps<SVGSVGElement>>,
): ComponentType<FieldPluginIconProps> {
  return function WrappedSvgIcon({ className, size = 16 }: FieldPluginIconProps) {
    return <Icon className={className} width={size} height={size} />;
  };
}
