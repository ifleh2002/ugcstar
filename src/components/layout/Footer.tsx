export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-secondary text-primary">★</div>
          <div>
            <p className="font-display text-base font-semibold">StarCast</p>
            <p className="text-xs text-muted-foreground">Créateurs UGC • Workflow signé • Diffusion Screenads</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span>© 2026 StarCast Studios</span>
          <a className="hover:text-foreground" href="#">Conditions</a>
          <a className="hover:text-foreground" href="#">Confidentialité</a>
          <a className="hover:text-foreground" href="#">contact@starcast.io</a>
        </div>
      </div>
    </footer>
  );
}
