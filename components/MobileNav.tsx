
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingBasket, ChefHat, CalendarDays, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const MobileNav: React.FC = () => {
  const { checkLowStock } = useApp();
  const lowStockCount = checkLowStock().length;

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
      isActive
        ? 'text-emerald-600'
        : 'text-slate-400 hover:text-slate-600'
    }`;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center p-2 z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <NavLink to="/" className={navClass}>
        <LayoutDashboard size={24} />
        <span className="text-[10px] font-medium mt-1">Home</span>
      </NavLink>
      
      <NavLink to="/inventory" className={navClass}>
        <div className="relative">
          <ShoppingBasket size={24} />
          {lowStockCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </div>
        <span className="text-[10px] font-medium mt-1">Pantry</span>
      </NavLink>
      
      <NavLink to="/recipes" className={navClass}>
        <ChefHat size={24} />
        <span className="text-[10px] font-medium mt-1">Recipes</span>
      </NavLink>
      
      <NavLink to="/menu" className={navClass}>
        <CalendarDays size={24} />
        <span className="text-[10px] font-medium mt-1">Menu</span>
      </NavLink>

      <NavLink to="/settings" className={navClass}>
        <Settings size={24} />
        <span className="text-[10px] font-medium mt-1">Settings</span>
      </NavLink>
    </nav>
  );
};
