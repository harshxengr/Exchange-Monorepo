import { User, LogOut, Radio } from "lucide-react";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";

interface HeaderProps {
    session: Session | null;
    connected: boolean;
}

export function Header({ session, connected }: HeaderProps) {
    return (
        <header className="flex h-12 items-center justify-between border-b border-[#1f2630] bg-[#12161a] px-4 shrink-0">
            <div className="flex items-center gap-8">
                <span className="text-xs font-bold text-white border-b-2 border-[#0ecb81] pb-[15px] pt-3 cursor-pointer">Exchange</span>
                <span className="text-xs font-medium text-[#707a8a] cursor-pointer hover:text-[#eaecef] transition-colors">Markets</span>
                <span className="text-xs font-medium text-[#707a8a] cursor-pointer hover:text-[#eaecef] transition-colors">Trade</span>
            </div>

            {/* Real-time authenticated profile indicators and signOut action */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 font-mono text-[10px] text-[#848e9c]">
                    <User className="w-3.5 h-3.5 text-[#0ecb81]" />
                    <span>{session?.user?.name || 'Loading Account...'}</span>
                </div>

                <button
                    onClick={() => signOut({ callbackUrl: '/signin' })}
                    className="flex items-center gap-1.5 font-mono text-[10px] text-[#707a8a] hover:text-[#f6465d] transition-colors border border-[#2b3139] px-2 py-1 rounded bg-[#1e2329]"
                >
                    <LogOut className="w-3 h-3" />
                    <span>Sign Out</span>
                </button>

                <div className="flex items-center gap-2 font-mono text-[10px] bg-[#1e2329] px-2.5 py-1 rounded border border-[#2b3139]">
                    <Radio className={`w-3 h-3 ${connected ? 'text-[#0ecb81] animate-pulse' : 'text-[#f6465d]'}`} />
                    <span>{connected ? 'Live Stream Active' : 'Disconnected'}</span>
                </div>
            </div>
        </header>
    )
}