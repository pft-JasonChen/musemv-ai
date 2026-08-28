"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCredits } from "@/components/providers/CreditsProvider";
import { DpIcon } from "@/components/ui/DpIcon";
import { DpDialog } from "@/components/ui/DpDialog";
import { ApiErrorState } from "@/components/ui/ApiErrorState";
import { useDemoFlag } from "@/components/demo/useDemo";
import {
  DEFAULT_PLAN_ID,
  MUSE_PRO_FEATURES,
  SUBSCRIPTION_PLANS,
  YEARLY_EXTRA_FEATURES,
  type PlanId,
  type ProFeature,
  type SubscriptionPlan,
} from "@/lib/user";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubscribed?: (planName: string) => void;
}

/**
 * ── MIGRATED TO THE DESIGNER UI (plan Phase 3, slice 3f) ────────────────────
 *
 * DP source: `UpgradeDialog` (Figma "Popup iAP - Pricing", 1797:33233).
 * Classes from `src/styles/designer/UpgradeDialog.css`, verbatim.
 *
 * ── DP CHANGES THE INTERACTION MODEL, AND THAT IS THE POINT ─────────────────
 *
 * WA's dialog was a RADIO LIST: pick a plan, then one Subscribe button at the
 * bottom buys the selection. DP's is three self-contained CARDS, each with its
 * own Subscribe. That is a genuine redesign, not a detail, so it is ported as
 * designed — `selected` is gone and each card subscribes to its own plan.
 * `DEFAULT_PLAN_ID` therefore no longer drives this screen; it stays exported
 * because it is the Business Model's stated default and other code may want it.
 *
 * ── S20 AGAIN: DP'S PRICES AND ITS PERIOD SUFFIX ARE BOTH WRONG ─────────────
 *
 * DP shows $9.99 for Weekly (WA: $19.99) and — more quietly — renders a literal
 * "/ week" on ALL THREE cards, including Yearly. WA models the period per plan
 * (`per`), so the yearly card correctly reads "/ year". Copying DP's markup
 * verbatim here would have shipped a $59.99-per-week plan.
 *
 * ── WHAT WA KEEPS THAT DP HAS NO SLOT FOR ───────────────────────────────────
 *
 * · CR-05 already-Pro state. DP has no such state — its dialog always sells.
 *   Dropping it would let a subscriber buy a second subscription.
 * · CR-05 Restore Purchases. A real action with real behaviour, and DP's footer
 *   has only dead `href="#"` links. It takes the footer slot, which is where a
 *   store dialog conventionally puts it.
 * · CR-03 expiry wording, per plan, from `cadence` — DP hardcodes "Weekly" on
 *   the two weekly cards and "Yearly" on the third, which agrees with WA's data
 *   today but would silently diverge if a plan's cadence ever changed.
 */
function FeatureRow({ feature }: { feature: ProFeature }) {
  return (
    <li className="upgrade-dialog__feature">
      <span className="upgrade-dialog__feature-icon-box">
        <DpIcon name={feature.icon} className="upgrade-dialog__feature-icon" />
      </span>
      {feature.label}
    </li>
  );
}

/** The credits row + feature list — identical content whether it's one plan's
 *  own card (desktop) or the summary panel above the mobile/tablet list (the
 *  plan currently selected there). Extracted so the two can't drift.
 *  `showDivider` defaults to true for the desktop card (`UpgradeDialog.css`'s
 *  own rule); the mobile/tablet summary panel drops it (product owner,
 *  2026-08-24 — Figma's List_M frames have no rule between credits and
 *  features there). */
function PlanCreditsAndFeatures({
  plan,
  showDivider = true,
}: {
  plan: SubscriptionPlan;
  showDivider?: boolean;
}) {
  const extras: ProFeature[] = plan.cadence === "Yearly" ? YEARLY_EXTRA_FEATURES : [];

  return (
    <div className="upgrade-dialog__details">
      <p className="upgrade-dialog__credits">
        {/* Plain <img>: the coin keeps its gold, as on the balance row. */}
        <img src="/assets/icons/ui/ic_credit.svg" alt="" className="upgrade-dialog__credits-icon" />
        <span className="upgrade-dialog__credits-number">{plan.credits.toLocaleString()}</span>
        <span className="upgrade-dialog__credits-label">{plan.cadence} Credits</span>
      </p>
      {showDivider && <div className="upgrade-dialog__divider" />}
      <ul className="upgrade-dialog__features">
        {MUSE_PRO_FEATURES.map((f) => (
          <FeatureRow key={f.label} feature={f} />
        ))}
        {extras.map((f) => (
          <FeatureRow key={f.label} feature={f} />
        ))}
        {/* CR-03, derived from the plan rather than hardcoded per card. */}
        <FeatureRow feature={{ label: `Credits Expire ${plan.cadence}`, icon: "ic_clock" }} />
      </ul>
    </div>
  );
}

function PlanCard({ plan, onSubscribe }: { plan: SubscriptionPlan; onSubscribe: () => void }) {
  return (
    <div
      className={`upgrade-dialog__card${plan.featured ? " upgrade-dialog__card--featured" : ""}`}
    >
      <div className="upgrade-dialog__card-top">
        <div className="upgrade-dialog__plan-row">
          <div className="upgrade-dialog__plan-name-group">
            <p className="upgrade-dialog__plan-name">{plan.name}</p>
          </div>
          {plan.badge && (
            <span
              className={`upgrade-dialog__tag upgrade-dialog__tag--${
                plan.badge === "BEST VALUE" ? "purple" : "green"
              }`}
            >
              {plan.badge}
            </span>
          )}
        </div>
        <p className="upgrade-dialog__plan-desc">{plan.description}</p>
        <p className="upgrade-dialog__price">
          {plan.price}
          {/* Per-plan, not DP's hardcoded "/ week". */}
          <span className="upgrade-dialog__price-period"> / {plan.per}</span>
        </p>
      </div>

      <button
        type="button"
        className={`upgrade-dialog__cta upgrade-dialog__cta--${plan.cta}`}
        onClick={onSubscribe}
      >
        Subscribe
      </button>

      <PlanCreditsAndFeatures plan={plan} />
    </div>
  );
}

/**
 * ── TABLET/MOBILE: LIST INSTEAD OF THREE STACKED CARDS ───────────────────────
 *
 * Product owner, 2026-08-24 (Figma "IAP — Subscribe {Weekly,Wkly Pro,Yr} Plan
 * - List_M", nodes 2881:54660 / 55450 / 56030). Below 1024px the three
 * self-contained cards are replaced by ONE credits/features summary — for
 * whichever plan is currently selected — above a tappable list of slim plan
 * rows; a single shared Subscribe button buys the selection. Desktop keeps
 * the three-card grid unchanged (`PlanCard`, above).
 *
 * Each row's badge (`plan.badge`) is a fixed property of that plan and stays
 * put regardless of selection — only the border/background highlight moves.
 * The "PRO" pill reuses `.upgrade-dialog__pro-badge`, defined in the gated
 * `UpgradeDialog.css` but never applied by the three-card layout — the CSS
 * was already ahead of the port.
 */
function PlanListRow({
  plan,
  active,
  onSelect,
}: {
  plan: SubscriptionPlan;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <div className="upgrade-dialog__list-item">
      {plan.badge && (
        <div className="upgrade-dialog__list-badge-row">
          <span
            className={`upgrade-dialog__tag upgrade-dialog__tag--${
              plan.badge === "BEST VALUE" ? "purple" : "green"
            }`}
          >
            {plan.badge}
          </span>
        </div>
      )}
      <button
        type="button"
        className={`upgrade-dialog__list-card${active ? " upgrade-dialog__list-card--active" : ""}`}
        onClick={onSelect}
        aria-pressed={active}
      >
        <span className="upgrade-dialog__list-name-group">
          <span className="upgrade-dialog__list-name">
            {plan.featured ? plan.name.replace(" Pro", "") : plan.name}
          </span>
          {plan.featured && <span className="upgrade-dialog__pro-badge">PRO</span>}
        </span>
        <span className="upgrade-dialog__list-price">{plan.price}</span>
      </button>
    </div>
  );
}

export function SubscribeModal({ open, onClose, onSubscribed }: Props) {
  const { subscribe, subscribed, subscribedPlan } = useAuth();
  const { addCredits } = useCredits();
  const [restored, setRestored] = useState(false);
  // Only read by the mobile/tablet list below — the three-card layout has no
  // selection concept, each card subscribes to its own plan directly.
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>(DEFAULT_PLAN_ID);
  const selectedPlan =
    SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId) ?? SUBSCRIPTION_PLANS[0];
  // `apiError` (`?demo=1` panel) simulates the plan list itself failing to
  // LOAD — Figma "Popup/Dialog - Edit" → "Error Message" (node 3232:73535):
  // "We couldn't load this right now", shown BEFORE the plans (or the
  // already-Pro card) rather than after a Subscribe attempt. Checked once
  // when the dialog opens (like a real fetch-on-mount), not kept live in
  // sync with the flag while it stays open — Retry re-checks it the same
  // way a real retry would re-fetch.
  const apiError = useDemoFlag("apiError");
  const [failed, setFailed] = useState(false);
  // Adjusting state on a prop change, done during render rather than in an
  // effect — React's own documented pattern (same one `TopPicksSection` uses
  // for `suspend`) — so a fresh "attempt" is checked exactly once per open,
  // not every render while it stays open.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setFailed(apiError);
  }

  function confirm(plan: SubscriptionPlan) {
    subscribe(plan.id);
    addCredits(plan.credits);
    onSubscribed?.(plan.name);
    onClose();
  }

  // The dialog stays mounted (inert) while closed, per `DpDialog` — reset the
  // error so reopening later never shows a stale failure.
  function close() {
    setFailed(false);
    onClose();
  }

  if (failed) {
    return (
      <DpDialog
        open={open}
        onClose={close}
        block="upgrade-dialog"
        label="Upgrade Your Plan"
        title="Upgrade Your Plan"
      >
        <ApiErrorState onRetry={() => setFailed(apiError)} />
      </DpDialog>
    );
  }

  // CR-05: already-Pro state — no plan cards, just a confirmation. DP has no
  // equivalent; without this a subscriber can buy a second subscription.
  if (subscribed) {
    const current = SUBSCRIPTION_PLANS.find((p) => p.id === subscribedPlan);
    return (
      <DpDialog
        open={open}
        onClose={close}
        block="upgrade-dialog"
        label="Muse Pro"
        title="Muse Pro"
      >
        <div className="upgrade-dialog__cards">
          <div className="upgrade-dialog__card upgrade-dialog__card--featured">
            <div className="upgrade-dialog__card-top">
              <div className="upgrade-dialog__plan-row">
                <div className="upgrade-dialog__plan-name-group">
                  <p className="upgrade-dialog__plan-name">You&apos;re already on Muse Pro</p>
                </div>
              </div>
              <p className="upgrade-dialog__plan-desc">
                {current
                  ? `Enjoy your ${current.credits.toLocaleString()} ${current.cadence.toLowerCase()} credits, watermark-free MVs, and full playback.`
                  : "Enjoy your Muse Pro credits, watermark-free MVs, and full playback."}
              </p>
            </div>
            <button
              type="button"
              className="upgrade-dialog__cta upgrade-dialog__cta--gradient"
              onClick={onClose}
            >
              Done
            </button>
            <div className="upgrade-dialog__details">
              <ul className="upgrade-dialog__features">
                {MUSE_PRO_FEATURES.map((f) => (
                  <FeatureRow key={f.label} feature={f} />
                ))}
              </ul>
            </div>
          </div>
        </div>
      </DpDialog>
    );
  }

  return (
    <DpDialog
      open={open}
      onClose={close}
      block="upgrade-dialog"
      label="Upgrade Your Plan"
      title="Upgrade Your Plan"
    >
      {/* `--plans` distinguishes this grid from the already-subscribed branch's
          own (single-card) `.upgrade-dialog__cards` above — only THIS one is
          hidden below 1024px in favour of `.upgrade-dialog__mobile`. */}
      <div className="upgrade-dialog__cards upgrade-dialog__cards--plans">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} onSubscribe={() => confirm(plan)} />
        ))}
      </div>

      <div className="upgrade-dialog__mobile">
        <PlanCreditsAndFeatures plan={selectedPlan} showDivider={false} />
        <div className="upgrade-dialog__list">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <PlanListRow
              key={plan.id}
              plan={plan}
              active={plan.id === selectedPlanId}
              onSelect={() => setSelectedPlanId(plan.id)}
            />
          ))}
        </div>
        <p className="upgrade-dialog__renew-note">Automatically renew and cancel at any time</p>
        <button
          type="button"
          className="upgrade-dialog__cta upgrade-dialog__cta--gradient"
          onClick={() => confirm(selectedPlan)}
        >
          Subscribe
        </button>
      </div>

      {/* CR-05. DP's footer is two dead `#` links; this is the one real action
          that belongs there, so it takes the slot instead. */}
      <div className="upgrade-dialog__footer">
        <button type="button" onClick={() => setRestored(true)}>
          Restore Purchases
        </button>
        <span aria-hidden="true">|</span>
        <span>Demo only — no real payment</span>
      </div>
      {restored && (
        <p className="upgrade-dialog__footer" role="status">
          No previous purchases found on this account.
        </p>
      )}
    </DpDialog>
  );
}
