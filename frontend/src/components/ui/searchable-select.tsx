"use client";

import { Check, ChevronDown, CirclePlus, X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/cn";
import { Badge } from "./badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./command";
import { inputClasses } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

/**
 * Searchable dropdown - pick one or many options from a list you can type to filter.
 *
 *   // Toolbar filter (compact, shows "Status: Failed" or "Status · 3")
 *   <SearchableSelect label="Status" options={statusOptions} multiple value={statuses} onChange={setStatuses} />
 *
 *   // Form field (input-like, full width) - works inside <Field>
 *   <Field label="Payee"><SearchableSelect variant="field" label="Payee" options={payees} value={payee} onChange={setPayee} /></Field>
 *
 * Keyboard: Enter/Space opens, type to search, ↑/↓ to move, Enter to pick, Esc to close.
 */
export type SearchableOption = {
  value: string;
  label: string;
  /** Second line, also searchable (e.g. an account number). */
  description?: string;
  /** Leading icon or avatar. */
  icon?: React.ReactNode;
  /** Group heading this option is listed under. */
  group?: string;
  disabled?: boolean;
};

type BaseProps = {
  options: SearchableOption[];
  /** What is being chosen: "Status", "Account". Used in the trigger and for screen readers. */
  label: string;
  /** "filter" = compact toolbar button (default); "field" = full-width form control. */
  variant?: "filter" | "field";
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** Show a "Clear" action when something is selected (default true). */
  clearable?: boolean;
  disabled?: boolean;
  align?: "start" | "center" | "end";
  className?: string;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

type SingleProps = BaseProps & {
  multiple?: false;
  value: string | null;
  onChange: (value: string | null) => void;
};

type MultiProps = BaseProps & {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
};

export type SearchableSelectProps = SingleProps | MultiProps;

export function SearchableSelect(props: SearchableSelectProps) {
  const {
    options,
    label,
    variant = "filter",
    placeholder,
    searchPlaceholder = `Search ${label.toLowerCase()}`,
    emptyText = "No matches",
    clearable = true,
    disabled,
    align = "start",
    className,
    id,
  } = props;
  const [open, setOpen] = React.useState(false);

  const selected: string[] = props.multiple
    ? props.value
    : props.value
      ? [props.value]
      : [];
  const selectedOptions = options.filter((o) => selected.includes(o.value));
  const firstSelected = selectedOptions[0];

  const toggle = (value: string) => {
    if (props.multiple) {
      props.onChange(
        selected.includes(value)
          ? selected.filter((v) => v !== value)
          : [...selected, value],
      );
    } else {
      props.onChange(value === props.value ? null : value);
      setOpen(false);
    }
  };

  const clear = () => {
    if (props.multiple) props.onChange([]);
    else props.onChange(null);
  };

  const groups = React.useMemo(() => {
    const map = new Map<string, SearchableOption[]>();
    for (const option of options) {
      const key = option.group ?? "";
      map.set(key, [...(map.get(key) ?? []), option]);
    }
    return [...map.entries()];
  }, [options]);

  const summary =
    selectedOptions.length === 0
      ? null
      : selectedOptions.length === 1
        ? (firstSelected?.label ?? null)
        : props.multiple && selectedOptions.length === 2
          ? selectedOptions.map((o) => o.label).join(", ")
          : `${selectedOptions.length} selected`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {variant === "field" ? (
          <button
            type="button"
            id={id}
            role="combobox"
            aria-expanded={open}
            aria-label={summary ? undefined : label}
            aria-invalid={props["aria-invalid"]}
            aria-describedby={props["aria-describedby"]}
            disabled={disabled}
            data-slot="input"
            className={cn(
              inputClasses,
              "cursor-pointer items-center justify-between gap-2 text-left",
              !summary && "text-subtle-foreground",
              className,
            )}
          >
            <span className="flex min-w-0 items-center gap-2 truncate">
              {selectedOptions.length === 1 && firstSelected?.icon}
              <span className="truncate">
                {summary ?? placeholder ?? `Select ${label.toLowerCase()}`}
              </span>
            </span>
            <ChevronDown
              className="size-4 shrink-0 text-subtle-foreground"
              aria-hidden="true"
            />
          </button>
        ) : (
          <button
            type="button"
            id={id}
            role="combobox"
            aria-expanded={open}
            aria-label={summary ? `${label}: ${summary}` : label}
            disabled={disabled}
            className={cn(
              "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-3 font-medium text-label transition-colors duration-fast disabled:cursor-not-allowed disabled:opacity-50",
              summary
                ? "border-border-strong bg-surface text-foreground hover:bg-surface-subtle"
                : "border-border-strong border-dashed bg-surface text-muted-foreground hover:bg-surface-subtle hover:text-foreground",
              className,
            )}
          >
            {!summary && <CirclePlus className="size-3.5" aria-hidden="true" />}
            {label}
            {summary && (
              <>
                <span
                  className="h-3.5 w-px bg-border-strong"
                  aria-hidden="true"
                />
                {selectedOptions.length > 2 || !props.multiple ? (
                  <span className="max-w-40 truncate font-normal">
                    {summary}
                  </span>
                ) : (
                  <Badge tone="neutral" className="font-normal">
                    {summary}
                  </Badge>
                )}
              </>
            )}
            <ChevronDown
              className="size-3.5 text-subtle-foreground"
              aria-hidden="true"
            />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className={cn(
          "p-0",
          variant === "field"
            ? "w-(--radix-popover-trigger-width) min-w-60"
            : "w-64",
        )}
      >
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {groups.map(([group, items]) => (
              <CommandGroup key={group || "_"} heading={group || undefined}>
                {items.map((option) => {
                  const isSelected = selected.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      keywords={[option.label, option.description ?? ""]}
                      disabled={option.disabled}
                      onSelect={() => toggle(option.value)}
                    >
                      {props.multiple ? (
                        <span
                          className={cn(
                            "flex size-4 items-center justify-center rounded-sm border",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input",
                          )}
                          aria-hidden="true"
                        >
                          {isSelected && (
                            <Check className="size-3!" strokeWidth={3} />
                          )}
                        </span>
                      ) : null}
                      {option.icon}
                      <span className="grid min-w-0 flex-1">
                        <span className="truncate">{option.label}</span>
                        {option.description && (
                          <span className="truncate text-caption text-muted-foreground">
                            {option.description}
                          </span>
                        )}
                      </span>
                      {!props.multiple && isSelected && (
                        <Check className="text-brand" aria-hidden="true" />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
            {clearable && selected.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    value="__clear__"
                    keywords={[]}
                    onSelect={() => {
                      clear();
                      setOpen(false);
                    }}
                    className="justify-center text-muted-foreground"
                  >
                    <X aria-hidden="true" />
                    Clear {props.multiple ? "selection" : label.toLowerCase()}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
