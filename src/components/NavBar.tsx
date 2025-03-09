// src/components/NavBar.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Camera, List, ShoppingCart, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NavBar({ currentPage = 'home' }) {
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-2 z-10">
      <div className="flex justify-around max-w-md mx-auto">
        <button 
          onClick={() => router.push('/')}
          className={cn(
            "p-2 rounded-full flex flex-col items-center",
            currentPage === 'home' ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Camera size={24} />
          <span className="text-xs mt-1">Scan</span>
        </button>
        
        <button 
          onClick={() => router.push('/results')}
          className={cn(
            "p-2 rounded-full flex flex-col items-center",
            currentPage === 'results' ? "text-primary" : "text-muted-foreground"
          )}
        >
          <List size={24} />
          <span className="text-xs mt-1">Lists</span>
        </button>
        
        <button 
          onClick={() => router.push('/cart')}
          className={cn(
            "p-2 rounded-full flex flex-col items-center",
            currentPage === 'cart' ? "text-primary" : "text-muted-foreground"
          )}
        >
          <ShoppingCart size={24} />
          <span className="text-xs mt-1">Cart</span>
        </button>
        
        <button 
          onClick={() => router.push('/settings')}
          className={cn(
            "p-2 rounded-full flex flex-col items-center",
            currentPage === 'settings' ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Settings size={24} />
          <span className="text-xs mt-1">Settings</span>
        </button>
      </div>
    </nav>
  );
}