import React, { useState, useEffect } from 'react';
import { Package, Plus, History, X, TrendingUp, TrendingDown, Download, Edit2, Save } from 'lucide-react';
import { Product, StockMovement } from '../types';

interface ProductsListViewProps {
  businessName: string;
}

export const ProductsListView: React.FC<ProductsListViewProps> = ({ businessName }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  
  // Storage Keys
  const storageKeyProd = `Gestor_${businessName.replace(/\s+/g, '_')}_products`;
  const storageKeyMov = `Gestor_${businessName.replace(/\s+/g, '_')}_movements`;

  // UI State
  const [editingStockId, setEditingStockId] = useState<number | null>(null);
  const [stockInput, setStockInput] = useState('');
  const [viewingHistoryId, setViewingHistoryId] = useState<number | null>(null);
  
  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editSale, setEditSale] = useState('');

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

  const handleAddStock = () => {
      if (!editingStockId || !stockInput) return;
      const qty = parseInt(stockInput);
      if (isNaN(qty) || qty <= 0) return;

      const newMovement: StockMovement = {
          id: Date.now(),
          productId: editingStockId,
          type: 'IN',
          quantity: qty,
          date: new Date().toISOString(),
          reason: 'PROVISION'
      };

      const updatedMovs = [...movements, newMovement];
      localStorage.setItem(storageKeyMov, JSON.stringify(updatedMovs));
      setMovements(updatedMovs);
      
      setEditingStockId(null);
      setStockInput('');
  };

  const openEditProduct = (prod: Product) => {
      setEditingProduct(prod);
      setEditName(prod.name);
      setEditPrice(prod.price.toString());
      setEditSale(prod.sale.toString());
  };

  const saveEditedProduct = () => {
      if (!editingProduct) return;
      
      const updatedProducts = products.map(p => {
          if (p.id === editingProduct.id) {
              return {
                  ...p,
                  name: editName,
                  price: parseFloat(editPrice) || 0,
                  sale: parseFloat(editSale) || 0
              };
          }
          return p;
      });

      localStorage.setItem(storageKeyProd, JSON.stringify(updatedProducts));
      setProducts(updatedProducts);
      setEditingProduct(null);
  };

  const handleExport = (format: 'csv' | 'doc' | 'pdf') => {
      let content = '';
      let mime = 'text/plain';
      let extension = 'txt';
      const filename = `Inventario_${new Date().toLocaleDateString()}`;

      if (format === 'csv') {
          mime = 'text/csv;charset=utf-8;';
          extension = 'csv';
          content = "ID,Nombre,Categoria,Costo,Venta,Stock\n";
          content += products.map(p => {
              const stock = getStock(p.id);
              return `${p.id},${p.name},${p.category || 'General'},${(p.price + p.transport).toFixed(2)},${p.sale.toFixed(2)},${stock}`;
          }).join("\n");
      } else if (format === 'doc') {
          mime = 'application/msword';
          extension = 'doc';
          content = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>Reporte de Inventario</title></head><body>
            <h2>Reporte de Inventario Actual</h2>
            <table border="1" style="border-collapse:collapse; width:100%">
                <thead style="background-color:#f0f0f0">
                    <tr><th>Producto</th><th>Categoría</th><th>Costo</th><th>Venta</th><th>Stock</th></tr>
                </thead>
                <tbody>
                    ${products.map(p => {
                        const stock = getStock(p.id);
                        return `<tr><td>${p.name}</td><td>${p.category || 'General'}</td><td>$${(p.price + p.transport).toFixed(2)}</td><td>$${p.sale.toFixed(2)}</td><td>${stock}</td></tr>`;
                    }).join('')}
                </tbody>
            </table></body></html>`;
      } else if (format === 'pdf') {
          window.print();
          return;
      }

      const blob = new Blob([content], { type: mime });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.${extension}`;
      link.click();
  };

  return (
    <div className="flex flex-col h-full space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Package className="text-orange-500" />
              Inventario
          </h2>
          <div className="flex bg-slate-800 rounded-lg border border-slate-700">
              <button onClick={() => handleExport('csv')} className="px-3 py-2 text-xs font-bold text-emerald-500 hover:bg-slate-700 border-r border-slate-700">XLSX</button>
              <button onClick={() => handleExport('doc')} className="px-3 py-2 text-xs font-bold text-blue-500 hover:bg-slate-700 border-r border-slate-700">DOCX</button>
              <button onClick={() => handleExport('pdf')} className="px-3 py-2 text-xs font-bold text-red-500 hover:bg-slate-700">PDF</button>
          </div>
      </div>

      {/* Product List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-1 print:gap-2">
          {products.map(product => {
              const currentStock = getStock(product.id);
              return (
                  <div key={product.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 flex flex-col justify-between hover:bg-slate-800 transition-colors print:bg-white print:border-black print:text-black">
                      <div className="relative">
                          <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-white text-lg print:text-black">{product.name}</h3>
                              <span className="bg-slate-700 text-xs px-2 py-1 rounded text-slate-300 print:border print:bg-white print:text-black">{product.category || 'General'}</span>
                          </div>
                          
                          {/* Edit Button */}
                          <button 
                             onClick={() => openEditProduct(product)}
                             className="absolute top-0 right-0 p-2 bg-slate-700 rounded-lg text-slate-300 hover:text-white print:hidden"
                          >
                              <Edit2 size={14} />
                          </button>

                          <div className="flex items-baseline gap-1 mb-4">
                              <span className="text-3xl font-extrabold text-orange-500 print:text-black">{currentStock}</span>
                              <span className="text-sm text-slate-500 font-medium print:text-black">en stock</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-4 print:text-black">
                              <div>Costo: ${product.price + product.transport}</div>
                              <div>Venta: ${product.sale}</div>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 print:hidden">
                          <button 
                             onClick={() => { setEditingStockId(product.id); setStockInput(''); }}
                             className="flex items-center justify-center gap-2 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl font-bold text-xs hover:bg-emerald-500 hover:text-white transition-all"
                          >
                              <Plus size={16} />
                              Entrada
                          </button>
                          <button 
                             onClick={() => setViewingHistoryId(product.id)}
                             className="flex items-center justify-center gap-2 py-2 bg-slate-700/50 text-slate-300 border border-slate-600 rounded-xl font-bold text-xs hover:bg-slate-700 hover:text-white transition-all"
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
              <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm animate-in fade-in zoom-in">
                  <h3 className="text-lg font-bold text-white mb-4">Aprovisionamiento</h3>
                  <input 
                      type="number" 
                      value={stockInput}
                      onChange={(e) => setStockInput(e.target.value)}
                      placeholder="Cantidad a agregar"
                      className="w-full bg-slate-800 border border-slate-600 rounded-xl p-4 text-white text-xl font-bold mb-4 outline-none focus:border-orange-500"
                      autoFocus
                  />
                  <div className="flex gap-3">
                      <button onClick={() => setEditingStockId(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-400 bg-slate-800 hover:bg-slate-700">Cancelar</button>
                      <button onClick={handleAddStock} className="flex-1 py-3 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600">Guardar</button>
                  </div>
              </div>
          </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 print:hidden">
              <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm animate-in fade-in zoom-in">
                  <h3 className="text-lg font-bold text-white mb-4">Editar Producto</h3>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs text-slate-400 font-bold uppercase">Nombre</label>
                          <input 
                              type="text" 
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white outline-none"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs text-slate-400 font-bold uppercase">Costo Base</label>
                              <input 
                                  type="number" 
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(e.target.value)}
                                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white outline-none"
                              />
                          </div>
                          <div>
                              <label className="text-xs text-slate-400 font-bold uppercase">Precio Venta</label>
                              <input 
                                  type="number" 
                                  value={editSale}
                                  onChange={(e) => setEditSale(e.target.value)}
                                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white outline-none"
                              />
                          </div>
                      </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                      <button onClick={() => setEditingProduct(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-400 bg-slate-800 hover:bg-slate-700">Cancelar</button>
                      <button onClick={saveEditedProduct} className="flex-1 py-3 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 flex items-center justify-center gap-2">
                          <Save size={16} /> Guardar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* History Modal */}
      {viewingHistoryId && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 print:hidden">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md h-[70vh] flex flex-col animate-in fade-in zoom-in">
                  <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                      <h3 className="font-bold text-white">Historial de Stock</h3>
                      <button onClick={() => setViewingHistoryId(null)} className="text-slate-500 hover:text-white"><X size={20}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {movements.filter(m => m.productId === viewingHistoryId).sort((a,b) => b.id - a.id).map(mov => (
                          <div key={mov.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                              <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${mov.type === 'IN' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                                      {mov.type === 'IN' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                  </div>
                                  <div>
                                      <p className="text-sm font-bold text-white">
                                          {mov.reason === 'PROVISION' ? 'Entrada Manual' : 
                                           mov.reason === 'SALE_DAILY' ? 'Venta Diaria' : 
                                           mov.reason === 'SALE_CONTRACT' ? 'Venta Contrato' : 'Ajuste'}
                                      </p>
                                      <p className="text-[10px] text-slate-500">{new Date(mov.date).toLocaleDateString()}</p>
                                  </div>
                              </div>
                              <span className={`font-bold ${mov.type === 'IN' ? 'text-emerald-500' : 'text-red-500'}`}>
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