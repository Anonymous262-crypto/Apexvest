"use client";

import { Eye, EyeOff, Lock, type LucideIcon } from "lucide-react";
import { useState } from "react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

import { FIELD_ICONS } from "./icon-input";

/** Password field with a leading lock icon and an eye button to show or hide the text. */
export function PasswordInput({
  icon,
  iconKey,
  name,
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type"> & {
  icon?: LucideIcon;
  iconKey?: string;
}) {
  const [visible, setVisible] = useState(false);
  const Icon = icon ?? FIELD_ICONS[iconKey ?? name ?? ""] ?? Lock;
  const Toggle = visible ? EyeOff : Eye;

  return (
    <InputGroup className={className ?? "h-10"}>
      <InputGroupInput
        name={name}
        type={visible ? "text" : "password"}
        {...props}
      />
      <InputGroupAddon align="inline-start">
        <Icon aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          title={visible ? "Hide password" : "Show password"}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setVisible((v) => !v)}
        >
          <Toggle aria-hidden="true" />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
