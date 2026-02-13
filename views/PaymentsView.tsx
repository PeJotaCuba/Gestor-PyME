import React, { useState, useEffect } from 'react';
import { Banknote, History, ArrowUpRight, Plus, ExternalLink } from 'lucide-react';
import { BankAccount, PaymentRecord } from '../types';

interface PaymentsViewProps {
    businessName: string;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({ businessName }) => {
    const [activeTab, setActiveTab] = useState<'register' | 'execute'>('register');
    const [history, setHistory] = useState<PaymentRecord[]>([]);
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    
    // Form State
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [sourceAccount, setSourceAccount] = useState<number | 'CASH'>('CASH');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const storageKeyPayments = `Gestor_${businessName.replace(/\s+/g, '_')}_payments`;
    const storageKeyAccounts = `Gestor_${businessName.replace(/\s+/g, '_')}_accounts`;

    useEffect(() => {
        setHistory(JSON.parse(localStorage.getItem(storageKeyPayments) || '[]'));
        const accData = JSON.parse(localStorage.getItem(storageKeyAccounts) || '{"cash": 0, "banks": []}');
        setAccounts(accData.banks);
    }, [businessName]);

    const handleRegisterPayment = () => {
        if (!amount || !description) return;
        
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) return;

        // 1. Save Record
        const newRecord: PaymentRecord = {
            id: Date.now(),
            amount: val,
            description,
            date,
            sourceAccountId: sourceAccount
        };
        const updatedHistory = [newRecord, ...history];
        setHistory(updatedHistory);
        localStorage.setItem(storageKeyPayments, JSON.stringify(updatedHistory));

        // 2. Deduct Money
        const accData = JSON.parse(localStorage.getItem(storageKeyAccounts) || '{"cash": 0, "banks": []}');
        if (sourceAccount === 'CASH') {
            accData.cash -= val;
        } else {
            const bank = accData.banks.find((b: BankAccount) => b.id === sourceAccount);
            if (bank) bank.amount -= val;
        }
        localStorage.setItem(storageKeyAccounts, JSON.stringify(accData));

        // Reset
        setAmount('');
        setDescription('');
        setSourceAccount('CASH');
        alert("Pago registrado correctamente.");
    };

    return (
        <div className="flex flex-col h-full space-y-6 pb-24">
             {/* Tabs */}
             <div className="bg-slate-800 p-1 rounded-xl flex border border-slate-700">
                 <button 
                    onClick={() => setActiveTab('register')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'register' ? 'bg-orange-500 text-white' : 'text-slate-400'}`}
                 >
                     Registrar Pago
                 </button>
                 <button 
                    onClick={() => setActiveTab('execute')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'execute' ? 'bg-orange-500 text-white' : 'text-slate-400'}`}
                 >
                     Realizar Pago (App)
                 </button>
             </div>

             {activeTab === 'register' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-4">
                         <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                             <h3 className="font-bold text-white mb-4">Detalles del Pago</h3>
                             <div className="space-y-4">
                                 <input 
                                    type="text" 
                                    placeholder="Destinatario / Motivo"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none"
                                 />
                                 <input 
                                    type="number" 
                                    placeholder="Monto ($)"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none"
                                 />
                                 <div className="grid grid-cols-2 gap-4">
                                     <input 
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none" 
                                     />
                                     <select 
                                        value={sourceAccount}
                                        onChange={(e) => setSourceAccount(e.target.value === 'CASH' ? 'CASH' : Number(e.target.value))}
                                        className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none"
                                     >
                                         <option value="CASH">Caja General</option>
                                         {accounts.map(acc => (
                                             <option key={acc.id} value={acc.id}>{acc.bankName} - {acc.name}</option>
                                         ))}
                                     </select>
                                 </div>
                                 <button 
                                    onClick={handleRegisterPayment}
                                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-500/20"
                                 >
                                     Registrar Salida de Dinero
                                 </button>
                             </div>
                         </div>
                     </div>

                     <div className="space-y-4 h-full flex flex-col">
                         <h3 className="font-bold text-slate-400 text-sm uppercase">Historial de Pagos</h3>
                         <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px]">
                             {history.length === 0 && <p className="text-slate-500 text-sm italic">No hay pagos registrados.</p>}
                             {history.map(p => (
                                 <div key={p.id} className="bg-slate-800/30 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                                     <div>
                                         <p className="font-bold text-white text-sm">{p.description}</p>
                                         <p className="text-xs text-slate-500">{new Date(p.date).toLocaleDateString()} • {p.sourceAccountId === 'CASH' ? 'Efectivo' : 'Banco'}</p>
                                     </div>
                                     <span className="font-bold text-red-500">-${p.amount.toFixed(2)}</span>
                                 </div>
                             ))}
                         </div>
                     </div>
                 </div>
             )}

             {activeTab === 'execute' && (
                 <div className="flex flex-col items-center justify-center pt-10 space-y-8">
                     <p className="text-slate-400 text-center max-w-sm">
                         Selecciona una plataforma para abrir la aplicación correspondiente en tu dispositivo.
                     </p>
                     
                     <div className="grid grid-cols-2 gap-6 w-full max-w-md">
                         <a 
                            href="tm_transfermovil://" 
                            className="flex flex-col items-center justify-center p-6 bg-slate-800 hover:bg-slate-700 rounded-2xl border border-slate-700 transition-all active:scale-95"
                         >
                             <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                                 <ArrowUpRight className="text-blue-500" size={32} />
                             </div>
                             <span className="font-bold text-white text-lg">Transfermóvil</span>
                         </a>

                         <a 
                            href="enzona://" 
                            className="flex flex-col items-center justify-center p-6 bg-slate-800 hover:bg-slate-700 rounded-2xl border border-slate-700 transition-all active:scale-95"
                         >
                             <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4">
                                 <ExternalLink className="text-indigo-500" size={32} />
                             </div>
                             <span className="font-bold text-white text-lg">EnZona</span>
                         </a>
                     </div>
                 </div>
             )}
        </div>
    );
};
