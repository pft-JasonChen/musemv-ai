"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCredits } from "@/components/providers/CreditsProvider";
import { DpIcon } from "@/components/ui/DpIcon";
import { DpDialog } from "@/components/ui/DpDialog";
import {
  MUSE_PRO_FEATURES,
  SUBSCRIPTION_PLANS,
  YEARLY_EXTRA_FEATURES,
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

function PlanCard({ plan, onSubscribe }: { plan: SubscriptionPlan; onSubscribe: () => void }) {
  const extras: ProFeature[] = plan.cadence === "Yearly" ? YEARLY_EXTRA_FEATURES : [];

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

      <div className="upgrade-dialog__details">
        <p className="upgrade-dialog__credits">
          {/* Plain <img>: the coin keeps its gold, as on the balance row. */}
          <img
            src="/assets/icons/ui/ic_credit.svg"
            alt=""
            className="upgrade-dialog__credits-icon"
          />
          <span className="upgrade-dialog__credits-number">{plan.credits.toLocaleString()}</span>
          <span className="upgrade-dialog__credits-label">{plan.cadence} Credits</span>
        </p>
        <div className="upgrade-dialog__divider" />
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
    </div>
  );
}

export function SubscribeModal({ open, onClose, onSubscribed }: Props) {
  const { subscribe, subscribed, subscribedPlan } = useAuth();
  const { addCredits } = useCredits();
  const [restored, setRestored] = useState(false);

  function confirm(plan: SubscriptionPlan) {
    subscribe(plan.id);
    addCredits(plan.credits);
    onSubscribed?.(plan.name);
    onClose();
  }

  // CR-05: already-Pro state — no plan cards, just a confirmation. DP has no
  // equivalent; without this a subscriber can buy a second subscription.
  if (subscribed) {
    const current = SUBSCRIPTION_PLANS.find((p) => p.id === subscribedPlan);
    return (
      <DpDialog
        open={open}
        onClose={onClose}
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
      onClose={onClose}
      block="upgrade-dialog"
      label="Upgrade Your Plan"
      title="Upgrade Your Plan"
    >
      <div className="upgrade-dialog__cards">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} onSubscribe={() => confirm(plan)} />
        ))}
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
