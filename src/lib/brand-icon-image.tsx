import {
  BRAND_MARK_BG,
  BRAND_MARK_FG,
  GRADUATION_CAP_PATHS,
} from "@/lib/brand";

export function BrandIconImage({
  size,
  radius,
  iconSize,
}: {
  size: number;
  radius: number;
  iconSize: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BRAND_MARK_BG,
        borderRadius: radius,
      }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke={BRAND_MARK_FG}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {GRADUATION_CAP_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    </div>
  );
}
