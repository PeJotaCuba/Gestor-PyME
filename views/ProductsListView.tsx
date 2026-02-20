
import React, { useState, useEffect } from 'react';
import { Package, Plus, History, X, TrendingUp, TrendingDown, Edit2, Lock, Unlock } from 'lucide-react';
import { Product, StockMovement } from '../types';

interface ProductsListViewProps {
  businessName: string;
  onAddNew: () => void;
  onEditProduct: (product: Product) => void;
}

export const ProductsListView: React.FC<ProductsListViewProps> = ({ businessName, onAddNew, onEditProduct }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  
  // Storage Keys
  const storageKeyProd = `Gestor_${businessName.replace(/\s+/g, '_')}_products`;
  const storageKeyMov = `Gestor_${businessName.replace(/\s+/g, '_')}_movements`;

  // UI State
  const [editingStockId, setEditingStockId] = useState<number | null>(null);
  const [stockInput, setStockInput] = useState('');
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN');
  const [viewingHistoryId, setViewingHistoryId] = useState<number | null>(null);
  
  useEffect(() => {
    loadData();
  }, [businessName]);

  const loadData = () => {
      const prods: Product[] = JSON.parse(localStorage.getItem(storageKeyProd) || '[]');
      const movs: StockMovement[] = JSON.parse(localStorage.getItem(storageKeyMov) || '[]');
      setProducts(prods);
      setMovements(movs);
  };

  const getStock = (productId: number) => {
      const inQty = movements.filter(m => m.productId === productId && m.type === 'IN').reduce((sum, m) => sum + m.quantity, 0);
      const outQty = movements.filter(m => m.productId === productId && m.type === 'OUT').reduce((sum, m) => sum + m.quantity, 0);
      return inQty - outQty;
  };

  const recalculateCosts = (currentMovements: StockMovement[]) => {
      const storageKeyExp = `Gestor_${businessName.replace(/\s+/g, '_')}_expenses`;
      
      // We use 'products' from state as base, but we need to be careful if it's stale. 
      // Better to read from local storage to be safe, or use the state if we are sure it's up to date.
      // Since we are inside the component, 'products' state should be fine, BUT we are updating it.
      // Let's read from LS to ensure we have the latest version of products (e.g. if edited elsewhere).
      const currentProducts: Product[] = JSON.parse(localStorage.getItem(storageKeyProd) || '[]');
      const expenses: Record<string, any> = JSON.parse(localStorage.getItem(storageKeyExp) || '{}');

      // 1. Calculate Total Inventory Value
      let totalInventoryValue = 0;
      const productStocks = new Map<number, number>();

      currentProducts.forEach(p => {
           const inQty = currentMovements.filter(m => m.productId === p.id && m.type === 'IN').reduce((sum, m) => sum + m.quantity, 0);
           const outQty = currentMovements.filter(m => m.productId === p.id && m.type === 'OUT').reduce((sum, m) => sum + m.quantity, 0);
           const stock = inQty - outQty;
           
           productStocks.set(p.id, stock > 0 ? stock : 1); 
           if (stock > 0) totalInventoryValue += (stock * p.price);
      });
      
      if (totalInventoryValue === 0) totalInventoryValue = 1;

      // 2. Prepare Expense List
      const expenseList: any[] = [];
      Object.entries(expenses).forEach(([key, val]: [string, any]) => {
          if (key !== 'taxes' && val.amount) {
              const amount = parseFloat(val.amount);
              if (!isNaN(amount) && amount > 0) expenseList.push({ id: key, ...val });
          }
      });

      // 3. Tax Percent
      let totalTaxPercent = 0;
      if (expenses.taxes && expenses.taxes.taxList) {
           expenses.taxes.taxList.forEach((t: any) => totalTaxPercent += (parseFloat(t.percent) || 0));
      }

      // 4. Update Each Product
      const updatedProducts = currentProducts.map(product => {
          if (product.isConsolidated) return product; // Skip consolidated

          const stock = productStocks.get(product.id) || 1;
          let totalApplicableFixedExpenses = 0;
          const productDate = new Date(product.date).toISOString().split('T')[0];
          const productExpenses = product.applicableExpenses || expenseList.map(e => e.id);

          expenseList.forEach(exp => {
              if (productExpenses.includes(exp.id)) {
                  if (exp.id === 'transport') {
                      if (exp.date === productDate) totalApplicableFixedExpenses += parseFloat(exp.amount);
                  } else if (exp.isFixed) {
                      totalApplicableFixedExpenses += parseFloat(exp.amount);
                  }
              }
          });

          // Deduce markup history
          const oldBaseCost = product.price + (product.transport || 0);
          const oldTaxAmount = Math.round((oldBaseCost * (totalTaxPercent / 100)) * 100) / 100;
          const oldFinalCost = oldBaseCost + oldTaxAmount;
          
          let markupFactor = 1.3;
          if (oldFinalCost > 0 && product.sale > 0) {
              markupFactor = product.sale / oldFinalCost;
          }
          if (markupFactor < 1) markupFactor = 1.3;

          // New Proration Share based on UNIT WEIGHT (1 unidad / Inventario Total)
          const allocationFactor = product.price / totalInventoryValue;
          const newProratedCost = Math.round((totalApplicableFixedExpenses * allocationFactor) * 100) / 100;
          
          const newBaseCost = product.price + newProratedCost;
          const newTaxAmount = Math.round((newBaseCost * (totalTaxPercent / 100)) * 100) / 100;
          const newFinalCost = newBaseCost + newTaxAmount;

          const newSalePrice = Math.round((newFinalCost * markupFactor) * 100) / 100;

          return {
              ...product,
              transport: newProratedCost,
              sale: newSalePrice
          };
      });

      localStorage.setItem(storageKeyProd, JSON.stringify(updatedProducts));
      setProducts(updatedProducts);
  };

  const handleAddStock = () => {
      if (!editingStockId || !stockInput) return;
      const qty = parseInt(stockInput);
      if (isNaN(qty) || qty <= 0) return;

      const newMovement: StockMovement = {
          id: Date.now(),
          productId: editingStockId,
          type: movementType,
          quantity: qty,
          date: new Date().toISOString(),
          reason: movementType === 'IN' ? 'PROVISION' : 'ADJUSTMENT'
      };

      const updatedMovs = [...movements, newMovement];
      localStorage.setItem(storageKeyMov, JSON.stringify(updatedMovs));
      setMovements(updatedMovs);
      
      // Trigger Recalculation
      recalculateCosts(updatedMovs);
      
      setEditingStockId(null);
      setStockInput('');
  };

  const toggleConsolidated = (product: Product) => {
      const updatedProducts = products.map(p => {
          if (p.id === product.id) {
              return { ...p, isConsolidated: !p.isConsolidated };
          }
          return p;
      });
      setProducts(updatedProducts);
      localStorage.setItem(storageKeyProd, JSON.stringify(updatedProducts));
  };

  return (
    <div className="flex flex-col h-full space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="text-orange-500" />
              Inventario
          </h2>
          <button 
              onClick={onAddNew} 
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
          >
              <Plus size={18} />
              Nuevo Producto
          </button>
      </div>

      {/* Product List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-1 print:gap-2">
          {products.map(product => {
              const currentStock = getStock(product.id);
              return (
                  <div key={product.id} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-all shadow-sm print:bg-white print:border-black print:text-black">
                      <div className="relative">
                          <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-slate-900 dark:text-white text-lg print:text-black">{product.name}</h3>
                              <div className="flex gap-2">
                                  <button
                                      onClick={() => toggleConsolidated(product)}
                                      className={`p-2 rounded-lg transition-colors ${product.isConsolidated ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'}`}
                                      title={product.isConsolidated ? "Precio Consolidado (Fijo)" : "Precio Dinámico"}
                                  >
                                      {product.isConsolidated ? <Lock size={14} /> : <Unlock size={14} />}
                                  </button>
                                  <button 
                                      onClick={() => onEditProduct(product)}
                                      className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:text-white print:hidden"
                                  >
                                      <Edit2 size={14} />
                                  </button>
                              </div>
                          </div>
                          
                          <div className="flex items-baseline gap-1 mb-4">
                              <span className="text-3xl font-extrabold text-orange-500 print:text-black">{currentStock}</span>
                              <span className="text-sm text-slate-500 font-medium print:text-black">en stock</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4 print:text-black">
                              <div>Costo: ${ (product.price + product.transport).toFixed(2) }</div>
                              <div>Venta: ${ product.sale.toFixed(2) }</div>
                          </div>
                          
                          <div className="mb-3">
                              <span className="bg-slate-100 dark:bg-slate-700 text-xs px-2 py-1 rounded text-slate-600 dark:text-slate-300 print:border print:bg-white print:text-black">
                                  {product.category || 'General'}
                              </span>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 print:hidden">
                          <button 
                             onClick={() => { setEditingStockId(product.id); setStockInput(''); setMovementType('IN'); }}
                             className="flex items-center justify-center gap-2 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-500/20 rounded-xl font-bold text-xs hover:bg-emerald-500 hover:text-white transition-all"
                          >
                              <Plus size={16} />
                              Entrada
                          </button>
                          <button 
                             onClick={() => setViewingHistoryId(product.id)}
                             className="flex items-center justify-center gap-2 py-2 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:text-white transition-all"
                          >
                              <History size={16} />
                              Historial
                          </button>
                      </div>
                  </div>
              );
          })}
      </div>

      {/* Add Stock Modal */}
      {editingStockId && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 print:hidden">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl w-full max-w-sm animate-in fade-in zoom-in shadow-xl">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Gestión de Stock</h3>
                  
                  <div className="flex gap-2 mb-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                      <button 
                          onClick={() => setMovementType('IN')} 
                          className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${movementType === 'IN' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                      >
                          Entrada
                      </button>
                      <button 
                          onClick={() => setMovementType('OUT')} 
                          className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${movementType === 'OUT' ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                      >
                          Salida
                      </button>
                  </div>

                  <input 
                      type="number" 
                      value={stockInput}
                      onChange={(e) => setStockInput(e.target.value)}
                      placeholder="Cantidad"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl p-4 text-slate-900 dark:text-white text-xl font-bold mb-4 outline-none focus:border-orange-500 transition-colors"
                      autoFocus
                  />
                  <div className="flex gap-3">
                      <button onClick={() => setEditingStockId(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700">Cancelar</button>
                      <button onClick={handleAddStock} className="flex-1 py-3 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600">Guardar</button>
                  </div>
              </div>
          </div>
      )}

      {/* History Modal */}
      {viewingHistoryId && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 print:hidden">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md h-[70vh] flex flex-col animate-in fade-in zoom-in shadow-xl">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <h3 className="font-bold text-slate-900 dark:text-white">Historial de Stock</h3>
                      <button onClick={() => setViewingHistoryId(null)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white"><X size={20}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {movements.filter(m => m.productId === viewingHistoryId).sort((a,b) => b.id - a.id).map(mov => (
                          <div key={mov.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                              <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${mov.type === 'IN' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500' : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500'}`}>
                                      {mov.type === 'IN' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                  </div>
                                  <div>
                                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                                          {mov.reason === 'PROVISION' ? 'Entrada Manual' : 
                                           mov.reason === 'SALE_DAILY' ? 'Venta Diaria' : 
                                           mov.reason === 'SALE_CONTRACT' ? 'Venta Contrato' : 'Ajuste'}
                                      </p>
                                      <p className="text-[10px] text-slate-500">{new Date(mov.date).toLocaleDateString()}</p>
                                  </div>
                              </div>
                              <span className={`font-bold ${mov.type === 'IN' ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                                  {mov.type === 'IN' ? '+' : '-'}{mov.quantity}
                              </span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
