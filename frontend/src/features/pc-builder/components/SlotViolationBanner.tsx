import React from 'react';
import { AlertTriangle, ArrowRight, Info, XCircle } from 'lucide-react';
import type {
  AllBuilderSlotCode,
  CompatibilityViolation,
  SlotDiagnosticDTO,
  SlotStatusLevel,
} from '@/features/pc-builder/types/builder.types';

export interface SlotViolationBannerProps {
  slotCode: AllBuilderSlotCode | string;
  diagnostic?: SlotDiagnosticDTO;
  errors?: CompatibilityViolation[];
  warnings?: CompatibilityViolation[];
  info?: CompatibilityViolation[];
  renderQuickFix?: (violation: CompatibilityViolation) => React.ReactNode;
  onViewAllInSidebar?: () => void;
}

const SEVERITY_PRIORITY: Record<string, number> = {
  ERROR: 1,
  WARNING: 2,
  INFO: 3,
};

interface SeverityStyle {
  containerClass: string;
  badgeClass: string;
  iconClass: string;
  label: string;
  Icon: React.FC<{ className?: string }>;
}

const SEVERITY_STYLES: Record<'ERROR' | 'WARNING' | 'INFO', SeverityStyle> = {
  ERROR: {
    containerClass: 'border-smart-red bg-red-50/90 text-red-900',
    badgeClass: 'bg-red-100 text-red-800 border-red-200',
    iconClass: 'text-smart-red',
    label: 'Xung đột nghiêm trọng',
    Icon: XCircle,
  },
  WARNING: {
    containerClass: 'border-amber-400 bg-amber-50/90 text-amber-900',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    iconClass: 'text-amber-600',
    label: 'Cần lưu ý / Rủi ro',
    Icon: AlertTriangle,
  },
  INFO: {
    containerClass: 'border-blue-300 bg-blue-50/80 text-slate-800',
    badgeClass: 'bg-blue-100 text-smart-blue border-blue-200',
    iconClass: 'text-smart-blue',
    label: 'Thông tin kỹ thuật',
    Icon: Info,
  },
};

function isBannerStatus(
  status?: SlotStatusLevel
): status is 'ERROR' | 'WARNING' | 'INFO' {
  return status === 'ERROR' || status === 'WARNING' || status === 'INFO';
}

const MAX_INLINE_VIOLATIONS = 2;

export const SlotViolationBanner: React.FC<SlotViolationBannerProps> = ({
  slotCode,
  diagnostic,
  errors = [],
  warnings = [],
  info = [],
  renderQuickFix,
  onViewAllInSidebar,
}) => {
  const diagnosticStatus = diagnostic?.status;
  if (!diagnostic || !isBannerStatus(diagnosticStatus)) {
    return null;
  }

  const normalizedSlot = slotCode.trim().toUpperCase();
  const ruleIdSet = new Set(
    (diagnostic.violation_rule_ids ?? []).filter(Boolean)
  );

  const matchesSlot = (violation: CompatibilityViolation): boolean => {
    const srcCat = violation.source_product?.category_code?.trim().toUpperCase();
    const tgtCat = violation.target_product?.category_code?.trim().toUpperCase();
    const matchesCategory =
      srcCat === normalizedSlot || tgtCat === normalizedSlot;

    if (violation.rule_id && ruleIdSet.size > 0) {
      if (!ruleIdSet.has(violation.rule_id)) {
        return false;
      }
      if (srcCat || tgtCat) {
        return matchesCategory;
      }
      return true;
    }

    return matchesCategory;
  };

  const allPool: CompatibilityViolation[] = [...errors, ...warnings, ...info];
  const matched: CompatibilityViolation[] = [];
  const seenKeys = new Set<string>();

  for (const violation of allPool) {
    if (!violation || !matchesSlot(violation)) continue;
    const dedupeKey = `${violation.rule_id ?? ''}|${violation.severity}|${violation.message}|${violation.source_product?.id ?? ''}|${violation.target_product?.id ?? ''}`;
    if (seenKeys.has(dedupeKey)) continue;
    seenKeys.add(dedupeKey);
    matched.push(violation);
  }

  matched.sort(
    (a, b) =>
      (SEVERITY_PRIORITY[a.severity] ?? 99) -
      (SEVERITY_PRIORITY[b.severity] ?? 99)
  );

  const bannerTone = SEVERITY_STYLES[diagnosticStatus];
  const visibleViolations = matched.slice(0, MAX_INLINE_VIOLATIONS);
  const hiddenCount = Math.max(0, matched.length - MAX_INLINE_VIOLATIONS);

  const handleViewAll = () => {
    if (onViewAllInSidebar) {
      onViewAllInSidebar();
      return;
    }
    const el = document.getElementById('builder-diagnostics-sidebar');
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <div
      data-testid={`slot-violation-banner-${normalizedSlot}`}
      data-status={diagnosticStatus}
      className={`mt-3 rounded-xl border p-3 space-y-2.5 ${bannerTone.containerClass}`}
    >
      {visibleViolations.length === 0 ? (
        <div className="flex items-center gap-2 text-xs">
          <bannerTone.Icon
            className={`w-4 h-4 flex-shrink-0 ${bannerTone.iconClass}`}
          />
          <span className="font-bold">{bannerTone.label}</span>
          <span className="opacity-80">
            Vui lòng kiểm tra chi tiết ở Sidebar chẩn đoán bên phải.
          </span>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleViolations.map((violation, index) => {
            const itemTone =
              SEVERITY_STYLES[
                isBannerStatus(violation.severity)
                  ? violation.severity
                  : diagnosticStatus
              ];
            const ItemIcon = itemTone.Icon;
            const quickFixNode = renderQuickFix
              ? renderQuickFix(violation)
              : null;

            return (
              <div
                key={`${violation.rule_id ?? violation.rule_name}-${index}`}
                className={
                  index > 0 ? 'pt-2 border-t border-current/10 space-y-1.5' : 'space-y-1.5'
                }
              >
                <div className="flex items-start gap-2">
                  <ItemIcon
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${itemTone.iconClass}`}
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold border ${itemTone.badgeClass}`}
                      >
                        {itemTone.label}
                      </span>
                      <span className="text-xs font-extrabold">
                        {violation.rule_name}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed">
                      {violation.message}
                    </p>
                  </div>
                </div>

                {quickFixNode && (
                  <div className="pl-6">{quickFixNode}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {hiddenCount > 0 && (
        <div className="pt-1 flex justify-end">
          <button
            type="button"
            onClick={handleViewAll}
            className="inline-flex items-center gap-1 text-[11px] font-extrabold underline underline-offset-2 hover:opacity-80 transition"
          >
            <span>
              Xem tất cả trong Sidebar (+{hiddenCount} thông báo)
            </span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
