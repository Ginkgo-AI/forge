import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useTourStore } from "../../stores/tour.ts";
import { Button } from "../ui/Button.tsx";

type Rect = { top: number; left: number; width: number; height: number };

const PADDING = 8;
const TOOLTIP_GAP = 12;

function getClipPath(rect: Rect): string {
  const t = rect.top - PADDING;
  const l = rect.left - PADDING;
  const r = rect.left + rect.width + PADDING;
  const b = rect.top + rect.height + PADDING;
  const radius = 8;

  // Outer rectangle (full viewport) with inner rounded-rect cutout
  return `polygon(
    0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
    ${l + radius}px ${t}px,
    ${r - radius}px ${t}px,
    ${r}px ${t + radius}px,
    ${r}px ${b - radius}px,
    ${r - radius}px ${b}px,
    ${l + radius}px ${b}px,
    ${l}px ${b - radius}px,
    ${l}px ${t + radius}px,
    ${l + radius}px ${t}px
  )`;
}

function getTooltipPosition(
  rect: Rect,
  placement: "top" | "bottom" | "left" | "right",
  tooltipWidth: number,
  tooltipHeight: number
) {
  const style: { top?: number; left?: number } = {};

  switch (placement) {
    case "top":
      style.top = rect.top - PADDING - TOOLTIP_GAP - tooltipHeight;
      style.left = rect.left + rect.width / 2 - tooltipWidth / 2;
      break;
    case "bottom":
      style.top = rect.top + rect.height + PADDING + TOOLTIP_GAP;
      style.left = rect.left + rect.width / 2 - tooltipWidth / 2;
      break;
    case "left":
      style.top = rect.top + rect.height / 2 - tooltipHeight / 2;
      style.left = rect.left - PADDING - TOOLTIP_GAP - tooltipWidth;
      break;
    case "right":
      style.top = rect.top + rect.height / 2 - tooltipHeight / 2;
      style.left = rect.left + rect.width + PADDING + TOOLTIP_GAP;
      break;
  }

  // Clamp to viewport
  const maxLeft = window.innerWidth - tooltipWidth - 16;
  const maxTop = window.innerHeight - tooltipHeight - 16;
  style.left = Math.max(16, Math.min(style.left ?? 0, maxLeft));
  style.top = Math.max(16, Math.min(style.top ?? 0, maxTop));

  return style;
}

export function TourOverlay() {
  const { isActive, currentStep, steps, nextStep, prevStep, skipTour } =
    useTourStore();
  const navigate = useNavigate();
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [tooltipSize, setTooltipSize] = useState({ width: 320, height: 180 });

  const step = steps[currentStep];

  const updateTargetRect = useCallback(() => {
    if (!step?.target) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setTargetRect(null);
    }
  }, [step?.target]);

  // Navigate to the step's route if needed
  useEffect(() => {
    if (!isActive || !step?.route) return;
    navigate(step.route);
  }, [isActive, step?.route, navigate]);

  // Find and observe target element
  useEffect(() => {
    if (!isActive || !step?.target) {
      setTargetRect(null);
      return;
    }

    // Delay slightly to allow route navigation to render
    const timeout = setTimeout(() => {
      updateTargetRect();

      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (!el) return;

      const resizeObserver = new ResizeObserver(updateTargetRect);
      resizeObserver.observe(el);

      window.addEventListener("resize", updateTargetRect);
      window.addEventListener("scroll", updateTargetRect, true);

      return () => {
        resizeObserver.disconnect();
        window.removeEventListener("resize", updateTargetRect);
        window.removeEventListener("scroll", updateTargetRect, true);
      };
    }, 100);

    return () => clearTimeout(timeout);
  }, [isActive, step?.target, updateTargetRect]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isActive) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") skipTour();
      if (e.key === "ArrowRight") nextStep();
      if (e.key === "ArrowLeft") prevStep();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isActive, skipTour, nextStep, prevStep]);

  // Measure tooltip
  const tooltipRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const { width, height } = node.getBoundingClientRect();
      setTooltipSize({ width, height });
    }
  }, []);

  if (!isActive || !step) return null;

  const isLastStep = currentStep === steps.length - 1;
  const isCentered = !step.target;
  const hasTarget = targetRect && step.target;

  const tooltipPos = hasTarget
    ? getTooltipPosition(targetRect, step.placement, tooltipSize.width, tooltipSize.height)
    : {};

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      {/* Dark overlay with spotlight cutout */}
      <div
        className="absolute inset-0 bg-black/60 transition-all duration-300"
        style={
          hasTarget
            ? { clipPath: getClipPath(targetRect) }
            : undefined
        }
        onClick={skipTour}
      />

      {/* Highlight ring around target */}
      {hasTarget && (
        <div
          className="absolute ring-2 ring-forge-accent rounded-lg pointer-events-none transition-all duration-300"
          style={{
            top: targetRect.top - PADDING,
            left: targetRect.left - PADDING,
            width: targetRect.width + PADDING * 2,
            height: targetRect.height + PADDING * 2,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={`absolute bg-forge-surface border border-forge-border rounded-lg shadow-xl p-5 w-80 transition-all duration-300 ${
          isCentered
            ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            : ""
        }`}
        style={isCentered ? {} : tooltipPos}
      >
        {/* Step counter */}
        <div className="text-xs text-forge-text-muted mb-2">
          {currentStep + 1} of {steps.length}
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold mb-1">{step.title}</h3>

        {/* Content */}
        <p className="text-sm text-forge-text-muted mb-4">{step.content}</p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={skipTour}
            className="text-xs text-forge-text-muted hover:text-forge-text transition-colors"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button variant="secondary" size="sm" onClick={prevStep}>
                Back
              </Button>
            )}
            <Button size="sm" onClick={nextStep}>
              {isLastStep ? "Done" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
