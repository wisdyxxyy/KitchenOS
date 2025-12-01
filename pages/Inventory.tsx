import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Ingredient, Unit } from '../types';
import { CATEGORIES, UNITS } from '../constants';
import { Plus, Search, Trash2, Edit2, AlertCircle, Filter, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const Inventory: React.FC = () => {
  const { ingredients, addIngredient, updateIngredient, deleteIngredient } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  // Filter States
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // All, Low, Out
  
  const [newItem, setNewItem] = useState<Partial<Ingredient>>({
    name: '',
    quantity: 1,
    unit: 'pcs',
    category: 'other',
    lowStockThreshold: 1
  });

  // Auto-focus input when adding/editing starts
  useEffect(() => {
    if (isAdding && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isAdding]);

  // Check for duplicate names
  const isDuplicateName = newItem.name && ingredients.some(i => 
    i.name.trim().toLowerCase() === newItem.name!.trim().toLowerCase() && i.id !== editingId
  );

  const handleSaveItem = () => {
    if (!newItem.name) return;
    if (isDuplicateName) {
      if (!confirm("An item with this name already exists. Do you want to continue?")) return;
    }

    if (editingId) {
       // Update Mode
       updateIngredient(editingId, {
         name: newItem.name,
         quantity: Number(newItem.quantity),
         unit: newItem.unit as Unit,
         category: newItem.category as any,
         lowStockThreshold: Number(newItem.lowStockThreshold)
       });
       setEditingId(null);
    } else {
       // Create Mode
       const ing: Ingredient = {
         id: uuidv4(),
         name: newItem.name,
         quantity: Number(newItem.quantity),
         unit: newItem.unit as Unit,
         category: newItem.category as any,
         lowStockThreshold: Number(newItem.lowStockThreshold),
         updatedAt: new Date().toISOString()
       };
       addIngredient(ing);
    }
    
    setIsAdding(false);
    setNewItem({ name: '', quantity: 1, unit: 'pcs', category: 'other', lowStockThreshold: 1 });
  };

  const startEdit = (item: Ingredient) => {
    setNewItem({ ...item });
    setEditingId(item.id);
    setIsAdding(true);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewItem({ name: '', quantity: 1, unit: 'pcs', category: 'other', lowStockThreshold: 1 });
  };

  const filteredIngredients = ingredients.filter(i => {
    const matchesName = i.name.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || i.category === categoryFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'Low') {
      matchesStatus = i.quantity <= i.lowStockThreshold && i.quantity > 0;
    } else if (statusFilter === 'Out') {
      matchesStatus = i.quantity === 0;
    }

    return matchesName && matchesCategory && matchesStatus;
  });

  const inputClass = "w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm";

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Pantry & Inventory</h1>
          <p className="text-slate-500">Track your raw materials and set restock alerts.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => { setEditingId(null); setIsAdding(true); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={20} /> Add Item
          </button>
        )}
      </header>

      {/* Add/Edit Item Form */}
      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-md border border-emerald-100 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-slate-800">{editingId ? 'Edit Ingredient' : 'Add New Ingredients'}</h3>
             <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
              <input 
                ref={nameInputRef}
                type="text" 
                className={`${inputClass} ${isDuplicateName ? 'border-amber-500 focus:ring-amber-500 focus:border-amber-500' : ''}`}
                placeholder="e.g. Tomatoes"
                value={newItem.name}
                onChange={e => setNewItem({...newItem, name: e.target.value})}
              />
              {isDuplicateName && (
                <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={10} /> Name already exists
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Quantity</label>
              <input 
                type="number" 
                className={inputClass}
                value={newItem.quantity}
                onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Unit</label>
              <select 
                className={inputClass}
                value={newItem.unit}
                onChange={e => setNewItem({...newItem, unit: e.target.value as Unit})}
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
             <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
              <select 
                className={inputClass}
                value={newItem.category}
                onChange={e => setNewItem({...newItem, category: e.target.value as any})}
              >
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Alert at</label>
              <input 
                type="number" 
                className={inputClass}
                value={newItem.lowStockThreshold}
                onChange={e => setNewItem({...newItem, lowStockThreshold: Number(e.target.value)})}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={cancelEdit} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg">Cancel</button>
            <button onClick={handleSaveItem} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">
              {editingId ? 'Update Item' : 'Save Item'}
            </button>
          </div>
        </div>
      )}

      {/* Search and List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center bg-slate-50/50">
          <div className="relative flex-1 w-full">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search ingredients..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
             <select 
                className="w-full md:w-40 p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>

              <select 
                className="w-full md:w-40 p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Low">Low Stock</option>
                <option value="Out">Out of Stock</option>
              </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Ingredient</th>
                <th className="p-4">Category</th>
                <th className="p-4">Quantity</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIngredients.map(item => {
                 const cat = CATEGORIES.find(c => c.id === item.category);
                 const isLow = item.quantity <= item.lowStockThreshold && item.quantity > 0;
                 const isOut = item.quantity === 0;

                 return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-medium text-slate-800">{item.name}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${cat?.color}`}>
                        {cat?.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => updateIngredient(item.id, { quantity: Math.max(0, item.quantity - 1) })}
                          className="w-6 h-6 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
                        >-</button>
                        <span className="w-16 text-center">{item.quantity} {item.unit}</span>
                         <button 
                          onClick={() => updateIngredient(item.id, { quantity: item.quantity + 1 })}
                          className="w-6 h-6 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
                        >+</button>
                      </div>
                    </td>
                    <td className="p-4">
                      {isOut ? (
                        <span className="flex items-center gap-1 text-red-600 text-sm font-medium"><AlertCircle size={14}/> Out of Stock</span>
                      ) : isLow ? (
                         <span className="flex items-center gap-1 text-amber-600 text-sm font-medium"><AlertCircle size={14}/> Low Stock</span>
                      ) : (
                        <span className="text-emerald-600 text-sm font-medium">In Stock</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => startEdit(item)}
                        className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                       <button 
                        onClick={() => deleteIngredient(item.id)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                 );
              })}
              {filteredIngredients.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No ingredients match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};