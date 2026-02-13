import React, { useState, useEffect } from 'react';
import { CreditCard, Wallet, Plus, Trash2, Edit2, Save, X, Download } from 'lucide-react';
import { BankAccount } from '../types';

interface CurrentAccountViewProps {
  businessName: string;
}

export const CurrentAccountView: React.FC<CurrentAccountViewProps> = ({ businessName }) => {
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  
  // Storage Key
  const storageKey = `Gestor_${businessName.replace(/\s+/g, '_')}_accounts`;

  // UI State
  const [isEditingCash, setIsEditingCash] = useState(false);
  const [tempCash, setTempCash] = useState('');
  
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newBankAmount, setNewBankAmount] = useState('');

  useEffect(() => {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '{"cash": 0, "banks": []}');
      setCashAmount(stored.cash);
      setBankAccounts(stored.banks);
  }, [businessName]);

  const saveToStorage = (cash: number, banks: BankAccount[]) => {
      const data = { cash, banks };
      localStorage.setItem(storageKey, JSON.stringify(data));
      setCashAmount(cash);
      setBankAccounts(banks);
  };

  const handleUpdateCash = () => {
      const val = parseFloat(tempCash);
      if (!isNaN(val)) {
          saveToStorage(val, bankAccounts);
      }
      setIsEditingCash(false);
  };

  const handleAddBank = () => {
      if (!newBankName || !newBankAmount) return;
      const amount = parseFloat(newBankAmount);
      if (isNaN(amount)) return;

      const newAccount: BankAccount = {
          id: Date.now(),
          name: newBankName,
          amount: amount
      };
      
      const updatedBanks = [...bankAccounts, newAccount];
      saveToStorage(cashAmount, updatedBanks);
      
      setIsAddingBank(false);
      setNewBankName('');
      setNewBankAmount('');
  };

  const handleDeleteBank = (id: number) => {
      const updated = bankAccounts.filter(b => b.id !== id);
      saveToStorage(cashAmount, updated);
  };

  const handleExport = (format: 'csv' | 'doc' | 'pdf') => {
      let content = '';
      let mime = 'text/plain';
      let extension = 'txt';
      const filename = `Tesoreria_${new Date().toLocaleDateString()}`;

      const total = cashAmount + bankAccounts.reduce((sum, b) => sum + b.amount, 0);

      if (format === 'csv') {
          mime = 'text/csv;charset=utf-8;';
          extension = 'csv';
          content = "Tipo,Nombre,Monto\n";
          content += `Efectivo,Caja General,${cashAmount}\n`;
          content += bankAccounts.map(b => `Banco,${b.name},${b.amount}`).join("\n");
          content += `\nTOTAL,Fondo Unificado,${total}`;
      } else if (format === 'doc') {
          mime = 'application/msword';
          extension = 'doc';
          content = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>Reporte de Tesorería</title></head><body>
            <h2>Estado de Cuenta Corriente</h2>
            <table border="1" style="border-collapse:collapse; width:100%">
                <thead style="background-color:#f0f0f0">
                    <tr><th>Tipo</th><th>Cuenta</th><th>Monto</th></tr>
                </thead>
                <tbody>
                    <tr><td>Efectivo</td><td>Caja General</td><td>$${cashAmount.toLocaleString()}</td></tr>
                    ${bankAccounts.map(b => `<tr><td>Banco</td><td>${b.name}</td><td>$${b.amount.toLocaleString()}</td></tr>`).join('')}
                    <tr style="font-weight:bold"><td>TOTAL</td><td>Fondo Unificado</td><td>$${total.toLocaleString()}</td></tr>
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

  const totalFunds = cashAmount + bankAccounts.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="flex flex-col h-full space-y-6 pb-24">
        {/* Header with Export */}
        <div className="flex justify-between items-center bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-xl print:bg-white print:border-black print:text-black">
            <div>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1 print:text-black">Fondo Unificado</p>
                <h1 className="text-4xl font-extrabold text-white print:text-black">${totalFunds.toLocaleString('en-US', {minimumFractionDigits: 2})}</h1>
            </div>
            <div className="flex flex-col gap-2 print:hidden">
                <div className="flex bg-slate-700/50 rounded-lg border border-slate-600">
                    <button onClick={() => handleExport('csv')} className="px-3 py-2 text-xs font-bold text-emerald-500 hover:bg-slate-700 border-r border-slate-600">XLSX</button>
                    <button onClick={() => handleExport('doc')} className="px-3 py-2 text-xs font-bold text-blue-500 hover:bg-slate-700 border-r border-slate-600">DOCX</button>
                    <button onClick={() => handleExport('pdf')} className="px-3 py-2 text-xs font-bold text-red-500 hover:bg-slate-700">PDF</button>
                </div>
            </div>
        </div>

        {/* Cash Section */}
        <section>
            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-3 px-1">Efectivo en Caja</h3>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between print:bg-white print:border-black print:text-black">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 print:text-black print:border">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <p className="font-bold text-white text-lg print:text-black">Caja General</p>
                        <p className="text-xs text-slate-500 print:text-black">Dinero físico disponible</p>
                    </div>
                </div>
                
                {isEditingCash ? (
                    <div className="flex items-center gap-2">
                         <input 
                            type="number" 
                            value={tempCash}
                            onChange={(e) => setTempCash(e.target.value)}
                            className="w-24 bg-slate-900 border border-slate-600 rounded-lg p-2 text-white font-bold outline-none"
                            autoFocus
                         />
                         <button onClick={handleUpdateCash} className="p-2 bg-emerald-500 text-white rounded-lg"><Save size={16}/></button>
                         <button onClick={() => setIsEditingCash(false)} className="p-2 bg-slate-700 text-slate-400 rounded-lg"><X size={16}/></button>
                    </div>
                ) : (
                    <div className="text-right flex items-center gap-4">
                        <span className="font-bold text-white text-xl print:text-black">${cashAmount.toLocaleString()}</span>
                        <button onClick={() => { setTempCash(cashAmount.toString()); setIsEditingCash(true); }} className="text-slate-500 hover:text-white print:hidden">
                            <Edit2 size={16} />
                        </button>
                    </div>
                )}
            </div>
        </section>

        {/* Bank Accounts Section */}
        <section>
             <div className="flex justify-between items-center mb-3 px-1">
                <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider">Cuentas Bancarias</h3>
                <button onClick={() => setIsAddingBank(true)} className="text-orange-500 text-xs font-bold flex items-center gap-1 hover:text-orange-400 print:hidden">
                    <Plus size={14} /> AGREGAR
                </button>
             </div>

             {/* Add Form */}
             {isAddingBank && (
                 <div className="bg-slate-800 p-4 rounded-xl border border-orange-500/30 mb-4 animate-in fade-in slide-in-from-top-2">
                     <div className="grid grid-cols-1 gap-3 mb-3">
                         <input 
                            type="text" 
                            placeholder="Nombre (ej. Banco Metropolitano)" 
                            value={newBankName}
                            onChange={(e) => setNewBankName(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none"
                         />
                         <input 
                            type="number" 
                            placeholder="Monto Inicial" 
                            value={newBankAmount}
                            onChange={(e) => setNewBankAmount(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none"
                         />
                     </div>
                     <div className="flex gap-3">
                         <button onClick={() => setIsAddingBank(false)} className="flex-1 py-2 rounded-lg bg-slate-700 text-slate-300 font-bold text-sm">Cancelar</button>
                         <button onClick={handleAddBank} className="flex-1 py-2 rounded-lg bg-orange-500 text-white font-bold text-sm">Guardar</button>
                     </div>
                 </div>
             )}

             <div className="space-y-3">
                 {bankAccounts.length === 0 && !isAddingBank && <p className="text-slate-600 italic text-sm text-center py-4">No hay cuentas registradas</p>}
                 {bankAccounts.map(acc => (
                     <div key={acc.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between print:bg-white print:border-black print:text-black">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 print:text-black print:border">
                                <CreditCard size={24} />
                            </div>
                            <div>
                                <p className="font-bold text-white text-lg print:text-black">{acc.name}</p>
                                <p className="text-xs text-slate-500 print:text-black">Cuenta / Tarjeta</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                             <span className="font-bold text-white text-xl print:text-black">${acc.amount.toLocaleString()}</span>
                             <button onClick={() => handleDeleteBank(acc.id)} className="text-slate-600 hover:text-red-500 transition-colors print:hidden">
                                 <Trash2 size={16} />
                             </button>
                        </div>
                    </div>
                 ))}
             </div>
        </section>
    </div>
  );
};