export const PINK = '#DB32BC';
export const PINK_END = '#ff1493';
export const PINK_GRADIENT = `linear-gradient(45deg, ${PINK}, ${PINK_END})`;
export const BG = '#000';
export const BORDER = 'rgba(255,255,255,0.08)';
export const TEXT_SECONDARY = 'rgba(255,255,255,0.55)';

export const gradientText: React.CSSProperties = {
  background: PINK_GRADIENT,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

/** Inline style with CSS custom properties (e.g. animation index/delay). */
export const vars = (v: Record<string, string | number>) => v as React.CSSProperties;

/** Feeds the pointer position into --mx/--my for cursor-following spotlights. */
export function trackPointer(e: React.PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
}
