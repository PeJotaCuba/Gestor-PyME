import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, FileText, Plus, CheckCircle, Clock, Trash2, User, Download, Upload, CreditCard } from 'lucide-react';
import { Product, DailySale, ContractSale, StockMovement, BankAccount } from '../types';

interface SalesViewProps {
  businessName: string;
}

export const SalesView: React.FC<SalesViewProps> = ({ businessName }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'contract'>('daily');
  const [products, setProducts] = useState<Product[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Storage Keys
  const storageKeyProd = `Gestor_${businessName.replace(/\s+/g, '_')}_products`;
  const storageKeyMov = `Gestor_${businessName.replace(/\s+/g, '_')}_movements`;
  const storageKeyDaily = `Gestor_${businessName.replace(/\s+/g, '_')}_sales_daily`;
  const storageKeyContract = `Gestor_${businessName.replace(/\s+/g, '_')}_sales_contract`;
  const storageKeyAccount = `Gestor_${businessName.replace(/\s+/g, '_')}_accounts`;

  // Daily Sale Form State
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [qty, setQty] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'DIGITAL'>('CASH');
  const [selectedBankId, setSelectedBankId] = useState<number | ''>(''); // For Digital Payments

  // Contract Sale Form State
  const [clientName, setClientName] = useState('');
  
  // Payment Modal State
  const [payingContractId, setPayingContractId] = useState<number | null>(null);
  const [payMethod, setPayMethod] = useState<'CASH' | 'DIGITAL'>('DIGITAL');
  const [payBankId, setPayBankId] = useState<number | ''>('');

  // Lists
  const [dailySales, setDailySales] = useState<DailySale[]>([]);
  const [contractSales, setContractSales] = useState<ContractSale[]>([]);

  useEffect(() => {
    // Load Products
    setProducts(JSON.parse(localStorage.getItem(storageKeyProd) || '[]'));
    // Load Sales
    setDailySales(JSON.parse(localStorage.getItem(storageKeyDaily) || '[]'));
    setContractSales(JSON.parse(localStorage.getItem(storageKeyContract) || '[]'));
    // Load Accounts
    const accData = JSON.parse(localStorage.getItem(storageKeyAccount) || '{"cash": 0, "banks": []}');
    setBankAccounts(accData.banks);
  }, [businessName]);

  const updateAccountBalance = (amount: number, method: 'CASH' | 'DIGITAL', bankId?: number) => {
      const accData = JSON.parse(localStorage.getItem(storageKeyAccount) || '{"cash": 0, "banks": []}');
      
      if (method === 'CASH') {
          accData.cash += amount;
      } else if (method === 'DIGITAL' && bankId) {
          const bank = accData.banks.find((b: BankAccount) => b.id === bankId);
          if (bank) {
              bank.amount += amount;
          }
      }
      localStorage.setItem(storageKeyAccount, JSON.stringify(accData));
  };

  const recordStockOut = (productId: number, quantity: number, reason: 'SALE_DAILY' | 'SALE_CONTRACT', refId: number) => {
      const movements: StockMovement[] = JSON.parse(localStorage.getItem(storageKeyMov) || '[]');
      movements.push({
          id: Date.now(),
          productId,
          type: 'OUT',
          quantity,
          date: new Date().toISOString(),
          reason,
          referenceId: refId.toString()
      });
      localStorage.setItem(storageKeyMov, JSON.stringify(movements));
  };

  const handleAddDailySale = () => {
      if (!selectedProductId || qty <= 0) return;
      if (paymentMethod === 'DIGITAL' && !selectedBankId) {
          alert("Debes seleccionar una cuenta bancaria para pagos digitales.");
          return;
      }

      const product = products.find(p => p.id === Number(selectedProductId));
      if (!product) return;

      const total = product.sale * qty;
      const newSale: DailySale = {
          id: Date.now(),
          productId: product.id,
          quantity: qty,
          method: paymentMethod,
          total: total,
          date: new Date().toISOString(),
          destinationAccountId: paymentMethod === 'DIGITAL' ? Number(selectedBankId) : undefined
      };

      const updatedSales = [newSale, ...dailySales];
      setDailySales(updatedSales);
      localStorage.setItem(storageKeyDaily, JSON.stringify(updatedSales));
      
      recordStockOut(product.id, qty, 'SALE_DAILY', newSale.id);
      updateAccountBalance(total, paymentMethod, paymentMethod === 'DIGITAL' ? Number(selectedBankId) : undefined);

      // Reset
      setQty(1);
      setSelectedProductId('');
      setPaymentMethod('CASH');
      setSelectedBankId('');
  };

  const handleAddContractSale = () => {
      if (!selectedProductId || qty <= 0 || !clientName) return;
      const product = products.find(p => p.id === Number(selectedProductId));
      if (!product) return;

      const newContract: ContractSale = {
          id: Date.now(),
          clientName,
          productId: product.id,
          quantity: qty,
          total: product.sale * qty,
          date: new Date().toISOString(),
          status: 'PENDING'
      };

      const updatedContracts = [newContract, ...contractSales];
      setContractSales(updatedContracts);
      localStorage.setItem(storageKeyContract, JSON.stringify(updatedContracts));

      recordStockOut(product.id, qty, 'SALE_CONTRACT', newContract.id);

      // Reset
      setQty(1);
      setClientName('');
      setSelectedProductId('');
  };

  const handleMarkAsPaid = () => {
      if (!payingContractId) return;
      if (payMethod === 'DIGITAL' && !payBankId) {
          alert("Selecciona la cuenta bancaria de destino.");
          return;
      }

      const sale = contractSales.find(s => s.id === payingContractId);
      if (!sale) return;

      const updated = contractSales.map(s => s.id === payingContractId ? { ...s, status: 'PAID' as const, destinationAccountId: payMethod === 'DIGITAL' ? Number(payBankId) : undefined } : s);
      setContractSales(updated);
      localStorage.setItem(storageKeyContract, JSON.stringify(updated));

      updateAccountBalance(sale.total, payMethod, payMethod === 'DIGITAL' ? Number(payBankId) : undefined);
      
      setPayingContractId(null);
      setPayBankId('');
  };

  // --- Export Logic (Same as before) ---
  const handleExport = (format: 'csv' | 'doc' | 'pdf') => {
      let content = '';
      let mime = 'text/plain';
      let extension = 'txt';
      const filename = activeTab === 'daily' ? `Ventas_Diarias_${new Date().toLocaleDateString()}` : `Ventas_Contrato_${new Date().toLocaleDateString()}`;

      if (format === 'csv') {
          mime = 'text/csv;charset=utf-8;';
          extension = 'csv';
          if (activeTab === 'daily') {
              content = "ID,Fecha,Producto,Cantidad,Metodo,Total\n";
              content += dailySales.map(s => {
                  const p = products.find(pr => pr.id === s.productId);
                  return `${s.id},${new Date(s.date).toLocaleDateString()},${p?.name || '??'},${s.quantity},${s.method},${s.total}`;
              }).join("\n");
          } else {
              content = "ID,Fecha,Cliente,Producto,Cantidad,Estado,Total\n";
              content += contractSales.map(s => {
                   const p = products.find(pr => pr.id === s.productId);
                   return `${s.id},${new Date(s.date).toLocaleDateString()},${s.clientName},${p?.name || '??'},${s.quantity},${s.status},${s.total}`;
              }).join("\n");
          }
      } else if (format === 'doc') {
          mime = 'application/msword';
          extension = 'doc';
          content = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>Reporte de Ventas</title></head><body>
            <h2>Reporte de ${activeTab === 'daily' ? 'Ventas Diarias' : 'Ventas por Contrato'}</h2>
            <table border="1" style="border-collapse:collapse; width:100%">
                <thead style="background-color:#f0f0f0">
                    <tr>
                        ${activeTab === 'daily' 
                            ? '<th>Fecha</th><th>Producto</th><th>Cantidad</th><th>Método</th><th>Total</th>' 
                            : '<th>Fecha</th><th>Cliente</th><th>Producto</th><th>Cantidad</th><th>Estado</th><th>Total</th>'}
                    </tr>
                </thead>
                <tbody>
                    ${activeTab === 'daily' 
                        ? dailySales.map(s => {
                            const p = products.find(pr => pr.id === s.productId);
                            return `<tr><td>${new Date(s.date).toLocaleDateString()}</td><td>${p?.name}</td><td>${s.quantity}</td><td>${s.method}</td><td>$${s.total}</td></tr>`;
                        }).join('') 
                        : contractSales.map(s => {
                            const p = products.find(pr => pr.id === s.productId);
                            return `<tr><td>${new Date(s.date).toLocaleDateString()}</td><td>${s.clientName}</td><td>${p?.name}</td><td>${s.quantity}</td><td>${s.status}</td><td>$${s.total}</td></tr>`;
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
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex p-1 bg-slate-800 rounded-xl border border-slate-700/50 w-full md:w-auto">
              <button 
                onClick={() => setActiveTab('daily')}
                className={`flex-1 md:flex-none px-6 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'daily' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                  <ShoppingCart size={18} />
                  Ventas Diarias
              </button>
              <button 
                onClick={() => setActiveTab('contract')}
                className={`flex-1 md:flex-none px-6 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'contract' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                  <FileText size={18} />
                  Por Contrato
              </button>
          </div>
          
          <div className="flex bg-slate-800 rounded-lg border border-slate-700">
              <button onClick={() => handleExport('csv')} className="px-3 py-2 text-xs font-bold text-emerald-500 hover:bg-slate-700 border-r border-slate-700">XLSX</button>
              <button onClick={() => handleExport('doc')} className="px-3 py-2 text-xs font-bold text-blue-500 hover:bg-slate-700 border-r border-slate-700">DOCX</button>
              <button onClick={() => handleExport('pdf')} className="px-3 py-2 text-xs font-bold text-red-500 hover:bg-slate-700">PDF</button>
          </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar print:overflow-visible">
          {activeTab === 'daily' ? (
              <div className="space-y-6">
                  {/* Form */}
                  <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 print:hidden">
                      <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                          <Plus size={18} className="text-orange-500" />
                          Registrar Venta
                      </h3>
                      <div className="space-y-4">
                          <select 
                             value={selectedProductId}
                             onChange={(e) => setSelectedProductId(Number(e.target.value))}
                             className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-orange-500"
                          >
                              <option value="">Seleccionar Producto...</option>
                              {products.map(p => (
                                  <option key={p.id} value={p.id}>{p.name} - ${p.sale}</option>
                              ))}
                          </select>
                          
                          <div className="flex gap-4">
                              <div className="flex-1">
                                  <input 
                                    type="number" 
                                    min="1"
                                    value={qty}
                                    onChange={(e) => setQty(Number(e.target.value))}
                                    placeholder="Cant."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-orange-500"
                                  />
                              </div>
                              <div className="flex-1">
                                   <select 
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-orange-500"
                                    >
                                        <option value="CASH">Efectivo</option>
                                        <option value="DIGITAL">Digital</option>
                                    </select>
                              </div>
                          </div>

                          {paymentMethod === 'DIGITAL' && (
                              <div className="animate-in fade-in slide-in-from-top-2">
                                  <label className="text-xs font-bold text-slate-400 mb-1 block">Cuenta Destino</label>
                                  <select 
                                      value={selectedBankId}
                                      onChange={(e) => setSelectedBankId(Number(e.target.value))}
                                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-orange-500"
                                  >
                                      <option value="">Seleccionar Banco...</option>
                                      {bankAccounts.map(b => (
                                          <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber} ({b.name})</option>
                                      ))}
                                  </select>
                              </div>
                          )}
                          
                          <button 
                             onClick={handleAddDailySale}
                             className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/20"
                          >
                              Registrar Venta
                          </button>
                      </div>
                  </div>

                  {/* List */}
                  <div>
                      <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-3">Historial del Día</h3>
                      <div className="space-y-3">
                          {dailySales.map(sale => {
                              const prod = products.find(p => p.id === sale.productId);
                              return (
                                  <div key={sale.id} className="flex justify-between items-center bg-slate-800/30 p-4 rounded-xl border border-slate-800 print:bg-white print:text-black print:border-black">
                                      <div>
                                          <p className="font-bold text-white print:text-black">{prod?.name || 'Producto Desconocido'}</p>
                                          <p className="text-xs text-slate-500 print:text-black">
                                              {sale.quantity} unid. • {sale.method === 'CASH' ? 'Efectivo' : 'Digital'} • {new Date(sale.date).toLocaleDateString()}
                                          </p>
                                      </div>
                                      <span className="font-bold text-emerald-400 print:text-black">+${sale.total.toFixed(2)}</span>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              </div>
          ) : (
              <div className="space-y-6">
                   {/* Form */}
                  <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 print:hidden">
                      <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                          <User size={18} className="text-purple-500" />
                          Venta a Persona Jurídica
                      </h3>
                      <div className="space-y-4">
                          <input 
                                type="text" 
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                placeholder="Nombre de la Empresa / Cliente"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-orange-500"
                            />
                          <select 
                             value={selectedProductId}
                             onChange={(e) => setSelectedProductId(Number(e.target.value))}
                             className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-orange-500"
                          >
                              <option value="">Seleccionar Producto...</option>
                              {products.map(p => (
                                  <option key={p.id} value={p.id}>{p.name} - ${p.sale}</option>
                              ))}
                          </select>
                          
                          <input 
                            type="number" 
                            min="1"
                            value={qty}
                            onChange={(e) => setQty(Number(e.target.value))}
                            placeholder="Cantidad"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-orange-500"
                          />
                          
                          <button 
                             onClick={handleAddContractSale}
                             className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-500/20"
                          >
                              Registrar Contrato
                          </button>
                      </div>
                  </div>

                  {/* Accounts Receivable */}
                   <div>
                      <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-3">Cuentas por Cobrar</h3>
                      <div className="space-y-3">
                          {contractSales.filter(s => s.status === 'PENDING').map(sale => {
                              const prod = products.find(p => p.id === sale.productId);
                              return (
                                  <div key={sale.id} className="bg-slate-800/30 p-4 rounded-xl border border-slate-800 flex flex-col gap-3 print:bg-white print:text-black print:border-black">
                                      <div className="flex justify-between items-start">
                                          <div>
                                              <p className="font-bold text-white text-lg print:text-black">{sale.clientName}</p>
                                              <p className="text-sm text-slate-400 print:text-black">{prod?.name} (x{sale.quantity})</p>
                                          </div>
                                          <div className="text-right">
                                              <p className="font-bold text-white print:text-black">${sale.total.toFixed(2)}</p>
                                              <div className="flex items-center justify-end gap-1 text-amber-500 print:text-black">
                                                  <Clock size={12} />
                                                  <span className="text-[10px] font-bold">PENDIENTE</span>
                                              </div>
                                          </div>
                                      </div>
                                      <button 
                                        onClick={() => setPayingContractId(sale.id)}
                                        className="w-full py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-lg text-sm font-bold hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-2 print:hidden"
                                      >
                                          <CheckCircle size={16} />
                                          Marcar como Pagado
                                      </button>
                                  </div>
                              );
                          })}
                      </div>
                  </div>

                  {/* Paid History */}
                   <div>
                      <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-3 mt-6">Cuentas Cobradas</h3>
                       <div className="space-y-3 opacity-60">
                          {contractSales.filter(s => s.status === 'PAID').map(sale => {
                              const prod = products.find(p => p.id === sale.productId);
                              return (
                                  <div key={sale.id} className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800 print:bg-white print:text-black print:border-black">
                                      <div>
                                          <p className="font-bold text-slate-300 print:text-black">{sale.clientName}</p>
                                          <p className="text-xs text-slate-500 print:text-black">{prod?.name}</p>
                                      </div>
                                      <div className="text-right">
                                          <span className="font-bold text-emerald-500/80 print:text-black">${sale.total.toFixed(2)}</span>
                                          <p className="text-[10px] font-bold text-emerald-500 print:text-black">PAGADO</p>
                                      </div>
                                  </div>
                              );
                          })}
                       </div>
                   </div>
              </div>
          )}

          {/* Payment Modal */}
          {payingContractId && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                  <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm animate-in fade-in zoom-in">
                      <h3 className="text-lg font-bold text-white mb-4">Recibir Pago</h3>
                      <div className="space-y-4">
                          <label className="text-xs font-bold text-slate-400 uppercase">Método de Pago</label>
                          <div className="flex bg-slate-800 p-1 rounded-lg">
                              <button onClick={() => setPayMethod('CASH')} className={`flex-1 py-2 rounded text-sm font-bold ${payMethod === 'CASH' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>Efectivo</button>
                              <button onClick={() => setPayMethod('DIGITAL')} className={`flex-1 py-2 rounded text-sm font-bold ${payMethod === 'DIGITAL' ? 'bg-blue-500 text-white' : 'text-slate-400'}`}>Digital</button>
                          </div>
                          
                          {payMethod === 'DIGITAL' && (
                               <div>
                                  <label className="text-xs font-bold text-slate-400 mb-2 block uppercase">Cuenta Destino</label>
                                  <select 
                                      value={payBankId}
                                      onChange={(e) => setPayBankId(Number(e.target.value))}
                                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none"
                                  >
                                      <option value="">Seleccionar Banco...</option>
                                      {bankAccounts.map(b => (
                                          <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber} ({b.name})</option>
                                      ))}
                                  </select>
                               </div>
                          )}

                          <div className="flex gap-3 pt-2">
                              <button onClick={() => setPayingContractId(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-400 bg-slate-800">Cancelar</button>
                              <button onClick={handleMarkAsPaid} className="flex-1 py-3 rounded-xl font-bold text-white bg-emerald-500">Confirmar</button>
                          </div>
                      </div>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};
