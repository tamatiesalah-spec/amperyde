"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type Catalog,
  type Category,
} from "@/domain/types";
import {
  buildContext,
  optionsForCategory,
  selectionFromComponentIds,
  validateBuild,
  type AnnotatedOption,
} from "@/domain/compatibility";
import { defaultSelection, nextCategory, prevCategory } from "@/domain/configurator";
import { formatUsd, priceSelection } from "@/domain/pricing";
import { useConfiguratorStore } from "@/state/configuratorStore";
import { BrandLogo } from "@/components/BrandLogo";
import { BikePreview } from "./BikePreview";
import { PriceBar } from "./PriceBar";

interface Props {
  catalog: Catalog;
  /** Preset component ids to preload; falls back to the default base build. */
  initialComponentIds?: string[];
  presetName?: string;
}

export function Configurator({ catalog, initialComponentIds, presetName }: Props) {
  const ctx = useMemo(
    () => buildContext(catalog.components, catalog.incompatibilities),
    [catalog],
  );

  const initialized = useConfiguratorStore((s) => s.initialized);
  const selection = useConfiguratorStore((s) => s.selection);
  const currentCategory = useConfiguratorStore((s) => s.currentCategory);
  const notices = useConfiguratorStore((s) => s.notices);
  const initialize = useConfiguratorStore((s) => s.initialize);
  const select = useConfiguratorStore((s) => s.select);
  const goTo = useConfiguratorStore((s) => s.goTo);
  const clearNotices = useConfiguratorStore((s) => s.clearNotices);

  // (Re)seed when the incoming build changes (e.g. arriving from a preset).
  const initKey = `${catalog.line.id}:${initialComponentIds?.join(",") ?? "default"}`;
  useEffect(() => {
    const base = initialComponentIds
      ? selectionFromComponentIds(initialComponentIds, ctx)
      : defaultSelection(ctx);
    initialize(base, ctx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initKey]);

  // Auto-dismiss cascade notices.
  useEffect(() => {
    if (notices.length === 0) return;
    const t = setTimeout(clearNotices, 4500);
    return () => clearTimeout(t);
  }, [notices, clearNotices]);

  const price = useMemo(
    () => priceSelection(catalog.line, selection, ctx),
    [catalog.line, selection, ctx],
  );
  const validity = useMemo(() => validateBuild(selection, ctx), [selection, ctx]);
  const options = useMemo(
    () => optionsForCategory(currentCategory, selection, ctx),
    [currentCategory, selection, ctx],
  );

  if (!initialized) {
    return (
      <div className="grid flex-1 place-items-center text-faint">Loading configurator…</div>
    );
  }

  const stepIndex = CATEGORY_ORDER.indexOf(currentCategory);
  const prev = prevCategory(currentCategory);
  const next = nextCategory(currentCategory);

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/" aria-label="AMPERYDE home">
            <BrandLogo className="h-8 w-auto" />
          </Link>
          <span className="text-faint">/</span>
          <span className="text-sm text-muted">
            Design Your Own
            {presetName && (
              <span className="text-faint"> · from {presetName}</span>
            )}
          </span>
        </div>
        <Link
          href="/riders-choice"
          className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Start from a preset
        </Link>
      </header>

      {/* Step rail */}
      <StepRail
        current={currentCategory}
        selection={selection}
        ctx={ctx}
        onGoTo={goTo}
      />

      {/* Body */}
      <main className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_420px]">
        <section className="min-h-[340px] border-b border-line lg:border-b-0 lg:border-r">
          <BikePreview
            selection={selection}
            currentCategory={currentCategory}
            ctx={ctx}
            onSelectCategory={goTo}
          />
        </section>

        <section className="flex flex-col overflow-y-auto">
          <div className="border-b border-line px-6 py-5">
            <p className="eyebrow">
              Step {stepIndex + 1} of {CATEGORY_ORDER.length}
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              {CATEGORY_LABELS[currentCategory]}
            </h2>
          </div>

          <div className="flex-1 space-y-3 p-6">
            {options.map((opt) => (
              <OptionCard
                key={opt.component.id}
                option={opt}
                onSelect={() => select(currentCategory, opt.component.id, ctx)}
              />
            ))}
          </div>

          <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-line bg-surface/95 px-6 py-4 backdrop-blur">
            <button
              type="button"
              onClick={() => prev && goTo(prev)}
              disabled={!prev}
              className="rounded-full border border-line px-4 py-2 text-sm text-muted transition enabled:hover:text-ink disabled:opacity-40"
            >
              ← {prev ? CATEGORY_LABELS[prev] : "Back"}
            </button>
            <button
              type="button"
              onClick={() => next && goTo(next)}
              disabled={!next}
              className="rounded-full border border-line px-4 py-2 text-sm text-ink transition enabled:hover:border-muted disabled:opacity-40"
            >
              {next ? CATEGORY_LABELS[next] : "Finish"} →
            </button>
          </div>
        </section>
      </main>

      {/* Notices */}
      {notices.length > 0 && (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-20 -translate-x-1/2 space-y-2">
          {notices.map((n, i) => (
            <div
              key={i}
              className="pointer-events-auto rounded-lg border border-line bg-surface-2 px-4 py-2 text-sm text-muted shadow-xl"
            >
              <span className="text-brand">{CATEGORY_LABELS[n.category]}: </span>
              {n.reason}
            </div>
          ))}
        </div>
      )}

      <PriceBar price={price} validity={validity} />
    </div>
  );
}

function StepRail({
  current,
  selection,
  ctx,
  onGoTo,
}: {
  current: Category;
  selection: import("@/domain/types").Selection;
  ctx: import("@/domain/compatibility").CompatContext;
  onGoTo: (c: Category) => void;
}) {
  return (
    <nav className="flex items-stretch gap-1 overflow-x-auto border-b border-line px-3 py-2">
      {CATEGORY_ORDER.map((cat, i) => {
        const active = cat === current;
        const chosen = selection[cat] ? ctx.byId.get(selection[cat]!) : undefined;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onGoTo(cat)}
            className={`flex min-w-max flex-col rounded-md px-3 py-1.5 text-left transition ${
              active ? "bg-surface-3" : "hover:bg-surface-2"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span
                className={`grid h-4 w-4 place-items-center rounded-full text-[10px] font-semibold ${
                  active ? "bg-brand text-white" : "bg-surface-3 text-faint"
                }`}
              >
                {i + 1}
              </span>
              <span className={`text-xs font-medium ${active ? "text-ink" : "text-muted"}`}>
                {CATEGORY_LABELS[cat]}
              </span>
            </span>
            <span className="ml-5.5 truncate text-[11px] text-faint">
              {chosen?.name ?? "—"}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function OptionCard({
  option,
  onSelect,
}: {
  option: AnnotatedOption;
  onSelect: () => void;
}) {
  const { component, result, isSelected } = option;
  const disabled = !result.ok && !isSelected;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={isSelected}
      className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${
        isSelected
          ? "border-brand bg-brand/5"
          : disabled
            ? "cursor-not-allowed border-line/60 opacity-55"
            : "border-line hover:border-muted hover:bg-surface-2"
      }`}
    >
      {/* Swatch placeholder (stands in for the option's close-up asset). */}
      <span
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg border text-xs font-semibold ${
          isSelected ? "border-brand/50 text-brand" : "border-line text-faint"
        } bg-surface-2`}
      >
        {initials(component.name)}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-medium">{component.name}</span>
          {isSelected && (
            <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white">
              Selected
            </span>
          )}
        </span>
        {component.description && (
          <span className="mt-0.5 block truncate text-sm text-muted">
            {component.description}
          </span>
        )}
        {disabled && result.reasons[0] && (
          <span className="mt-1 block text-xs text-ember">{result.reasons[0]}</span>
        )}
      </span>

      <span className="shrink-0 text-right font-mono text-sm">
        {component.priceDeltaCents === 0 ? (
          <span className="text-faint">Included</span>
        ) : (
          <span className="text-ink">+{formatUsd(component.priceDeltaCents)}</span>
        )}
      </span>
    </button>
  );
}

function initials(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
