"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type Catalog,
  type Category,
  type Extra,
  type FrameType,
  type Selection,
} from "@/domain/types";
import {
  buildContext,
  optionsForCategory,
  selectedFrameType,
  selectionFromComponentIds,
  validateBuild,
  type AnnotatedOption,
  type CompatContext,
} from "@/domain/compatibility";
import { defaultSelection } from "@/domain/configurator";
import { formatMoney, priceSelection } from "@/domain/pricing";
import { useConfiguratorStore, type Step } from "@/state/configuratorStore";
import { BrandLogo } from "@/components/BrandLogo";
import { BikePreview } from "./BikePreview";
import { PriceBar } from "./PriceBar";

const STEP_ORDER: Step[] = [...CATEGORY_ORDER, "extras"];
const stepLabel = (s: Step) => (s === "extras" ? "Extras" : CATEGORY_LABELS[s]);

interface Props {
  catalog: Catalog;
  initialComponentIds?: string[];
  initialExtraIds?: string[];
  presetName?: string;
}

export function Configurator({ catalog, initialComponentIds, initialExtraIds, presetName }: Props) {
  const ctx = useMemo(
    () => buildContext(catalog.components, catalog.incompatibilities),
    [catalog],
  );

  const initialized = useConfiguratorStore((s) => s.initialized);
  const selection = useConfiguratorStore((s) => s.selection);
  const extraIds = useConfiguratorStore((s) => s.extraIds);
  const currentStep = useConfiguratorStore((s) => s.currentStep);
  const notices = useConfiguratorStore((s) => s.notices);
  const initialize = useConfiguratorStore((s) => s.initialize);
  const select = useConfiguratorStore((s) => s.select);
  const toggleExtra = useConfiguratorStore((s) => s.toggleExtra);
  const goTo = useConfiguratorStore((s) => s.goTo);
  const clearNotices = useConfiguratorStore((s) => s.clearNotices);

  const initKey = `${catalog.line.id}:${initialComponentIds?.join(",") ?? "default"}:${initialExtraIds?.join(",") ?? ""}`;
  useEffect(() => {
    const base = initialComponentIds
      ? selectionFromComponentIds(initialComponentIds, ctx)
      : defaultSelection(ctx);
    initialize(base, initialExtraIds ?? [], ctx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initKey]);

  useEffect(() => {
    if (notices.length === 0) return;
    const t = setTimeout(clearNotices, 4500);
    return () => clearTimeout(t);
  }, [notices, clearNotices]);

  const price = useMemo(
    () => priceSelection(catalog.line, selection, ctx, { all: catalog.extras, selectedIds: extraIds }),
    [catalog.line, catalog.extras, selection, extraIds, ctx],
  );
  const validity = useMemo(() => validateBuild(selection, ctx), [selection, ctx]);
  const options = useMemo(
    () => (currentStep === "extras" ? [] : optionsForCategory(currentStep, selection, ctx)),
    [currentStep, selection, ctx],
  );

  const streetLegal = useMemo(
    () => catalog.extras.some((e) => e.enablesStreetLegal && extraIds.includes(e.id)),
    [catalog.extras, extraIds],
  );
  const frame = selectedFrameType(selection, ctx);

  if (!initialized) {
    return <div className="grid flex-1 place-items-center text-faint">Loading configurator…</div>;
  }

  const stepIndex = STEP_ORDER.indexOf(currentStep);
  const prev = stepIndex > 0 ? STEP_ORDER[stepIndex - 1] : null;
  const next = stepIndex < STEP_ORDER.length - 1 ? STEP_ORDER[stepIndex + 1] : null;
  const previewCategory: Category = currentStep === "extras" ? "chassis" : currentStep;

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/" aria-label="AMPERYDE home">
            <BrandLogo className="h-14 w-auto" />
          </Link>
          <span className="text-faint">/</span>
          <span className="text-sm text-muted">
            Design Your Own
            {presetName && <span className="text-faint"> · from {presetName}</span>}
          </span>
        </div>
        <Link
          href="/riders-choice"
          className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Start from a preset
        </Link>
      </header>

      <DisclaimerBanner streetLegal={streetLegal} />

      <StepRail current={currentStep} selection={selection} extraCount={extraIds.length} ctx={ctx} onGoTo={goTo} />

      <main className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_440px]">
        <section className="min-h-[340px] border-b border-line lg:border-b-0 lg:border-r">
          <BikePreview selection={selection} currentCategory={previewCategory} ctx={ctx} onSelectCategory={(c) => goTo(c)} />
        </section>

        <section className="flex flex-col overflow-y-auto">
          <div className="border-b border-line px-6 py-5">
            <p className="eyebrow">Step {stepIndex + 1} of {STEP_ORDER.length}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{stepLabel(currentStep)}</h2>
          </div>

          <div className="flex-1 space-y-3 p-6">
            {currentStep === "extras" ? (
              <ExtrasPanel
                extras={catalog.extras}
                selectedIds={extraIds}
                frame={frame}
                currency={catalog.line.currency}
                onToggle={toggleExtra}
              />
            ) : (
              options.map((opt) => (
                <OptionCard
                  key={opt.component.id}
                  option={opt}
                  currency={catalog.line.currency}
                  onSelect={() => select(currentStep, opt.component.id, ctx)}
                />
              ))
            )}
          </div>

          <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-line bg-surface/95 px-6 py-4 backdrop-blur">
            <button
              type="button"
              onClick={() => prev && goTo(prev)}
              disabled={!prev}
              className="rounded-full border border-line px-4 py-2 text-sm text-muted transition enabled:hover:text-ink disabled:opacity-40"
            >
              ← {prev ? stepLabel(prev) : "Back"}
            </button>
            <button
              type="button"
              onClick={() => next && goTo(next)}
              disabled={!next}
              className="rounded-full border border-line px-4 py-2 text-sm text-ink transition enabled:hover:border-muted disabled:opacity-40"
            >
              {next ? stepLabel(next) : "Done"} →
            </button>
          </div>
        </section>
      </main>

      {notices.length > 0 && (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-20 -translate-x-1/2 space-y-2">
          {notices.map((n, i) => (
            <div key={i} className="pointer-events-auto rounded-lg border border-line bg-surface-2 px-4 py-2 text-sm text-muted shadow-xl">
              <span className="text-brand">{CATEGORY_LABELS[n.category]}: </span>
              {n.reason}
            </div>
          ))}
        </div>
      )}

      <PriceBar price={price} validity={validity} streetLegal={streetLegal} />
    </div>
  );
}

function DisclaimerBanner({ streetLegal }: { streetLegal: boolean }) {
  if (streetLegal) {
    return (
      <div className="border-b border-line bg-surface-2/60 px-6 py-2 text-xs text-muted">
        <span className="font-semibold text-ink">Street Legal Kit added.</span> Road-legal once set up per
        the included power/speed-limiting instructions for your region.
      </div>
    );
  }
  return (
    <div className="border-b border-ember/40 bg-ember/10 px-6 py-2 text-xs text-ember">
      <span className="font-semibold uppercase tracking-wide">Private terrain only.</span> This build is
      not road-legal. Add the Street Legal Kit to ride on public roads — without it, AMPERYDE accepts no
      liability for road use.
    </div>
  );
}

function StepRail({
  current,
  selection,
  extraCount,
  ctx,
  onGoTo,
}: {
  current: Step;
  selection: Selection;
  extraCount: number;
  ctx: CompatContext;
  onGoTo: (s: Step) => void;
}) {
  return (
    <nav className="flex items-stretch gap-1 overflow-x-auto border-b border-line px-3 py-2">
      {STEP_ORDER.map((step, i) => {
        const active = step === current;
        const sublabel =
          step === "extras"
            ? extraCount > 0
              ? `${extraCount} added`
              : "Optional"
            : (selection[step] ? ctx.byId.get(selection[step]!)?.name : undefined) ?? "—";
        return (
          <button
            key={step}
            type="button"
            onClick={() => onGoTo(step)}
            className={`flex min-w-max flex-col rounded-md px-3 py-1.5 text-left transition ${active ? "bg-surface-3" : "hover:bg-surface-2"}`}
          >
            <span className="flex items-center gap-1.5">
              <span className={`grid h-4 w-4 place-items-center rounded-full text-[10px] font-semibold ${active ? "bg-brand text-white" : "bg-surface-3 text-faint"}`}>
                {step === "extras" ? "+" : i + 1}
              </span>
              <span className={`text-xs font-medium ${active ? "text-ink" : "text-muted"}`}>{stepLabel(step)}</span>
            </span>
            <span className="ml-5.5 truncate text-[11px] text-faint">{sublabel}</span>
          </button>
        );
      })}
    </nav>
  );
}

function OptionCard({
  option,
  currency,
  onSelect,
}: {
  option: AnnotatedOption;
  currency: string;
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
      {component.swatch ? (
        <span
          className={`h-12 w-12 shrink-0 rounded-lg border ${isSelected ? "border-brand" : "border-line"}`}
          style={{ backgroundColor: component.swatch }}
        />
      ) : (
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg border text-xs font-semibold ${isSelected ? "border-brand/50 text-brand" : "border-line text-faint"} bg-surface-2`}>
          {initials(component.name)}
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-medium">{component.name}</span>
          {isSelected && (
            <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white">Selected</span>
          )}
        </span>
        {component.description && <span className="mt-0.5 block truncate text-sm text-muted">{component.description}</span>}
        {disabled && result.reasons[0] && <span className="mt-1 block text-xs text-ember">{result.reasons[0]}</span>}
      </span>

      <span className="shrink-0 text-right font-mono text-sm">
        {component.priceDeltaCents === 0 ? (
          <span className="text-faint">Included</span>
        ) : (
          <span className="text-ink">+{formatMoney(component.priceDeltaCents, currency)}</span>
        )}
      </span>
    </button>
  );
}

function ExtrasPanel({
  extras,
  selectedIds,
  frame,
  currency,
  onToggle,
}: {
  extras: Extra[];
  selectedIds: string[];
  frame: FrameType | undefined;
  currency: string;
  onToggle: (id: string) => void;
}) {
  const ordered = [...extras].sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">Optional add-ons. Choose any that apply — priced on top of your build.</p>
      {ordered.map((extra) => {
        const selected = selectedIds.includes(extra.id);
        const incompatible = extra.compatibleFrameTypes && frame && !extra.compatibleFrameTypes.includes(frame);
        return (
          <button
            key={extra.id}
            type="button"
            onClick={() => !incompatible && onToggle(extra.id)}
            disabled={!!incompatible}
            aria-pressed={selected}
            className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition ${
              selected
                ? "border-brand bg-brand/5"
                : incompatible
                  ? "cursor-not-allowed border-line/60 opacity-55"
                  : "border-line hover:border-muted hover:bg-surface-2"
            }`}
          >
            <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border ${selected ? "border-brand bg-brand text-white" : "border-line text-transparent"}`}>
              ✓
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="font-medium">{extra.name}</span>
                {extra.enablesStreetLegal && (
                  <span className="rounded-full border border-line px-1.5 py-0.5 text-[10px] text-muted">makes road-legal</span>
                )}
              </span>
              {extra.description && <span className="mt-0.5 block text-sm text-muted">{extra.description}</span>}
              {extra.note && <span className="mt-1 block text-xs text-ember">{extra.note}</span>}
            </span>
            <span className="shrink-0 font-mono text-sm text-ink">+{formatMoney(extra.priceDeltaCents, currency)}</span>
          </button>
        );
      })}
    </div>
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
