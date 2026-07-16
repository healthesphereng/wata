export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-background p-8 text-foreground">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-3xl font-bold text-primary-foreground">
        w
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">wata</h1>
      <p className="max-w-xs text-center text-sm text-muted-foreground">
        The one-handed baby tracker. Feeds, sleep, and diapers — logged in a tap or two, even at 3
        AM, even offline.
      </p>
      <p className="text-xs text-muted-foreground/60">Scaffold ready — auth arrives next.</p>
    </main>
  );
}
