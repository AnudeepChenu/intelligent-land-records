'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { LayoutDashboard, Upload, CheckSquare, Settings, LogOut } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Ingestion', href: '/dashboard/upload', icon: Upload },
    { name: 'Verified', href: '/dashboard/verified', icon: CheckSquare },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] flex font-sans text-slate-900">
      
      {/* Ultra-Minimal Sidebar */}
      <aside className="w-64 bg-white border-r border-black/5 flex flex-col fixed h-screen z-10">
        <div className="h-24 flex items-center px-8">
          <h1 className="text-sm tracking-[0.2em] uppercase font-bold text-black">
            LRMS <span className="font-light opacity-50">Portal</span>
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                className={`flex items-center space-x-4 px-4 py-3 text-sm transition-all ${
                  isActive 
                    ? 'text-black font-semibold bg-black/5' 
                    : 'text-slate-400 hover:text-black hover:bg-black/5'
                }`}
              >
                <item.icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 1.5} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mb-4">
          <button 
            onClick={handleSignOut} 
            className="flex items-center space-x-4 px-4 py-3 text-sm text-slate-400 hover:text-red-500 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Spacious Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <header className="h-24 flex items-center px-12">
          <div className="ml-auto">
             <span className="text-xs font-bold tracking-widest uppercase text-black/40 border-b border-black/10 pb-1">
               Secure Session Active
             </span>
          </div>
        </header>
        
        <main className="flex-1 px-12 pb-12 max-w-6xl">
          {children}
        </main>
      </div>
    </div>
  );
}