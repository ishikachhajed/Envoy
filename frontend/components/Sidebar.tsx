import Link from "next/link";
import { FolderGit2, Users, Shield, Settings, LogOut } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-border/50 glass-panel flex flex-col h-screen fixed left-0 top-0 rounded-none border-t-0 border-l-0 border-b-0">
      <div className="p-6 flex items-center gap-3 border-b border-white/5">
        <Shield className="w-8 h-8 text-primary" />
        <span className="font-bold text-xl tracking-tight">Envoy</span>
      </div>
      <nav className="flex-1 p-4 flex flex-col gap-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">Menu</div>
        <Link href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary font-medium transition-colors">
          <FolderGit2 className="w-5 h-5" />
          Projects
        </Link>
        <Link href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
          <Users className="w-5 h-5" />
          Team Settings
        </Link>
        <Link href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
          <Settings className="w-5 h-5" />
          General Settings
        </Link>
      </nav>
      <div className="p-4 border-t border-white/5">
        <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors">
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
