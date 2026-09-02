'use client';

import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { 
  LayoutDashboard, 
  Upload, 
  CheckSquare, 
  Folder, 
  LogOut 
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navItems = [
    { name: 'Home Progress', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Ingestion', href: '/dashboard/upload', icon: Upload },
    { name: 'Verification', href: '/dashboard/verified', icon: CheckSquare },
    { name: 'Archive', href: '/dashboard/documents', icon: Folder },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] flex font-sans text-slate-900 overflow-hidden">
      
      {/* Fixed Ultra-Minimal Sidebar */}
      <aside className="w-64 bg-white border-r border-black/5 flex flex-col fixed h-screen z-20">
        <div className="h-24 flex items-center px-8 flex-shrink-0">
          <h1 className="text-sm tracking-[0.2em] uppercase font-bold text-black truncate">
            LRMS <span className="font-light opacity-50">Portal</span>
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto mt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              /* CRITICAL FIX: 
                Using standard <a> tags instead of Next.js <Link> 
                This forces a fresh page load, completely bypassing the 
                stale Next.js cache so your database data is always 100% accurate.
              */
              <a 
                key={item.name} 
                href={item.href} 
                className={`flex items-center py-3 px-4 text-sm rounded-md transition-all ${
                  isActive 
                    ? 'text-black font-semibold bg-black/5' 
                    : 'text-slate-400 hover:text-black hover:bg-black/5'
                } space-x-4`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={isActive ? 2.5 : 1.5} />
                <span>{item.name}</span>
              </a>
            );
          })}
        </nav>

        <div className="p-4 mb-4">
          <button 
            type="button"
            onClick={handleSignOut} 
            className="flex items-center py-3 px-4 text-sm rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all w-full space-x-4"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Spacious Content Area */}
      <div className="ml-64 flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="h-24 flex items-center px-12 flex-shrink-0">
        </header>
        
        <main className="flex-1 px-12 pb-12 max-w-[1600px]">
          {children}
        </main>
      </div>
      
    </div>
  );
}