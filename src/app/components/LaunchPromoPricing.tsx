"use client";

import {
  isLaunchPromoActive,
  LAUNCH_PROMO_END_LABEL,
} from "@/lib/launch-promo";

export function LaunchPromoBanner({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  if (!isLaunchPromoActive()) return null;

  return (
    <div
      className={className}
      style={{
        maxWidth: 720,
        margin: "0 auto 28px",
        padding: "14px 18px",
        borderRadius: 14,
        border: "1.5px solid var(--sage)",
        background: "var(--sage-xlight, #eef5f2)",
        textAlign: "center",
        ...style,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 15,
          fontWeight: 700,
          color: "var(--ink)",
        }}
      >
        Ofertă de lansare — prima lună la jumătate de preț
      </p>
      <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>
        Standard <strong>9 EUR</strong> (în loc de 19) · Premium <strong>19 EUR</strong> (în loc de 39).
        Valabil până pe <strong>{LAUNCH_PROMO_END_LABEL}</strong>, doar la facturare lunară. Din luna a
        doua, prețul normal.
      </p>
    </div>
  );
}

export function LaunchPromoPriceBlock({
  planId,
  annual,
}: {
  planId: "standard" | "premium";
  annual: boolean;
}) {
  const promoActive = isLaunchPromoActive() && !annual;
  const normal = planId === "standard" ? 19 : 39;
  const promo = planId === "standard" ? 9 : 19;
  const display = annual ? (planId === "standard" ? 14 : 29) : promoActive ? promo : normal;

  return (
    <div className="pc-price-wrap">
      {promoActive && (
        <div
          className="pc-promo-badge"
          style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--sage)",
            background: "var(--sage-xlight, #eef5f2)",
            borderRadius: 999,
            padding: "4px 10px",
            marginBottom: 8,
          }}
        >
          −50% prima lună
        </div>
      )}
      <div className="pc-price">
        <sup>EUR</sup>
        <span>{display}</span>
        <sub>/lună</sub>
      </div>
      {promoActive && (
        <p
          style={{
            margin: "4px 0 0",
            fontSize: 14,
            color: "var(--ink-muted)",
            textDecoration: "line-through",
          }}
        >
          {normal} EUR/lună
        </p>
      )}
      <div className="pc-annual-note">
        {annual
          ? `Plată anuală: ${display * 12} EUR (12 luni achitate în avans)`
          : promoActive
            ? `Prima lună ${promo} EUR · apoi ${normal} EUR/lună`
            : "Facturare lunară"}
      </div>
    </div>
  );
}
