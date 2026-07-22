/**
 * Soft background decoration — organic pastel blobs with speckle-dot texture,
 * bleeding off the canvas edges. Purely decorative: aria-hidden, never
 * interactive, and rendered before content so it always sits underneath.
 */
export function PastelBlobs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-16 -right-20 h-56 w-64 rounded-[58%_42%_55%_45%/55%_48%_52%_45%] bg-pink/50" />
      <div className="absolute top-24 right-8 size-14 rounded-[52%_48%_60%_40%/55%_45%_55%_45%] bg-pink-deep/40" />
      <div className="absolute top-1/3 -left-24 size-60 rounded-[45%_55%_48%_52%/52%_45%_55%_48%] bg-primary/20 [background-image:radial-gradient(rgb(255_255_255/0.55)_1.5px,transparent_1.5px)] [background-size:18px_18px]" />
      <div className="absolute -bottom-20 -left-16 size-52 rounded-[55%_45%_52%_48%/48%_55%_45%_52%] bg-primary/15" />
      <div className="absolute -right-16 -bottom-24 size-60 rounded-[48%_52%_45%_55%/55%_48%_52%_45%] bg-pink/45 [background-image:radial-gradient(rgb(255_255_255/0.55)_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
    </div>
  );
}
