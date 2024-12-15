import React, { useState } from 'react';
import { User, LogOut, Crown } from 'lucide-react';
import { useAuth } from '../lib/auth';

interface AccountMenuProps {
  onShowAuth: () => void;
  onShowSubscription: () => void;
}

export function AccountMenu({ onShowAuth, onShowSubscription }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, subscription, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const handleSubscribeClick = () => {
    if (!user) {
      onShowAuth();
    } else {
      onShowSubscription();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full bg-white/10 backdrop-blur-lg hover:bg-white/20 transition-all duration-200 border border-white/20"
        title={user ? 'Account Menu' : 'Sign In'}
      >
        <User className="w-6 h-6 text-white" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl bg-gray-900/90 backdrop-blur-xl border border-white/10 z-50 transform transition-all duration-200 scale-100">
            <div className="py-1" role="menu">
              {user ? (
                <>
                  <div className="px-4 py-3 text-sm text-gray-300 border-b border-white/10">
                    {user.email}
                  </div>
                  <button
                    onClick={handleSubscribeClick}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2 group"
                  >
                    <Crown className={`w-4 h-4 ${subscription ? 'text-yellow-400' : 'text-gray-400'} group-hover:scale-110 transition-transform`} />
                    {subscription ? 'Manage Subscription' : 'Subscribe'}
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2 group"
                  >
                    <LogOut className="w-4 h-4 text-gray-400 group-hover:scale-110 transition-transform" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      onShowAuth();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={handleSubscribeClick}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2 group"
                  >
                    <Crown className="w-4 h-4 text-gray-400 group-hover:scale-110 transition-transform" />
                    Subscribe
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
