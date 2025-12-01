
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingBasket, ChefHat, CalendarDays, BarChart3, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Sidebar: React.FC = () => {
  const { checkLowStock } = useApp();
  const lowStockCount = checkLowStock().length;

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
      isActive
        ? 'bg-emerald-50 text-emerald-600 shadow-sm'
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 flex flex-col z-20 hidden md:flex">
      <div className="p-6 border-b border-slate-100">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent flex items-center gap-2">
          <ChefHat className="text-emerald-500" />
          KitchenOS
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <NavLink to="/" className={navClass}>
          <LayoutDashboard size={20} />
          <span className="font-medium">Overview</span>
        </NavLink>
        <NavLink to="/inventory" className={navClass}>
          <div className="relative">
            <ShoppingBasket size={20} />
            {lowStockCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </div>
          <span className="font-medium">Inventory</span>
        </NavLink>
        <NavLink to="/recipes" className={navClass}>
          <ChefHat size={20} />
          <span className="font-medium">Recipes</span>
        </NavLink>
        <NavLink to="/menu" className={navClass}>
          <CalendarDays size={20} />
          <span className="font-medium">Menu Plan</span>
        </NavLink>
         <NavLink to="/stats" className={navClass}>
          <BarChart3 size={20} />
          <span className="font-medium">Statistics</span>
        </NavLink>
         <div className="pt-4 mt-4 border-t border-slate-100">
           <NavLink to="/settings" className={navClass}>
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </NavLink>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 p-4 rounded-xl">
          <p className="text-xs text-slate-500 mb-1">Stock Alerts</p>
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700">{lowStockCount} items</span>
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">Low</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
