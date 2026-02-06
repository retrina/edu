
import React, { useState, useEffect, useRef } from 'react';
import { User, NewsItem, Transaction } from '../types';
import { fetchFundNews } from '../services/geminiService';
import { GoogleGenAI } from "@google/genai";

interface AppPageProps {
  user: User;
  onLogout: () => void;
}

const AppPage: React.FC<AppPageProps> = ({ user, onLogout }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: `Welcome, ${user.fullName.split(' ')[0]}. How can I help you today?` }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  
  const [sampleNotifications] = useState([
    { id: 1, title: 'Quarterly Dividend', body: 'A dividend of AED 450.00 was credited to your account.', time: '2h ago' },
    { id: 2, title: 'Security Alert', body: 'New login detected from Safari on iPhone.', time: '5h ago' },
    { id: 3, title: 'Market Report', body: 'The Q3 Energy Sector report is now available for download.', time: '1d ago' }
  ]);

  // Transaction states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadNews = async () => {
      const data = await fetchFundNews();
      setNews(data);
    };
    loadNews();
    
    const savedTxs = localStorage.getItem('nwf_txs');
    if (savedTxs) {
      setTransactions(JSON.parse(savedTxs));
    }
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: "You are the AI Assistant for 'New Way Fund'. Be professional, mobile-friendly, and helpful. Note: All fund values are in AED."
        }
      });
      
      setChatMessages(prev => [...prev, { role: 'ai', text: response.text || "I'm sorry, I couldn't process that." }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'ai', text: "Service temporarily unavailable." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const openTransactionModal = (type: 'BUY' | 'SELL') => {
    setModalType(type);
    setQuantity('');
    setIsModalOpen(true);
  };

  const removeTransaction = (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    localStorage.setItem('nwf_txs', JSON.stringify(updated));
  };

  const handleTransactionConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseFloat(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) return;

    setIsProcessing(true);

    setTimeout(() => {
      const newTx: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        type: modalType,
        amount: qtyNum,
        status: 'PENDING',
        timestamp: new Date()
      };

      const updatedTxs = [newTx, ...transactions];
      setTransactions(updatedTxs);
      localStorage.setItem('nwf_txs', JSON.stringify(updatedTxs));
      
      setIsProcessing(false);
      setIsModalOpen(false);
      
      setChatMessages(prev => [...prev, { 
        role: 'ai', 
        text: `Success! Your ${modalType.toLowerCase()} request for ${qtyNum} shares is now PENDING.` 
      }]);
    }, 1200);
  };

  const formattedValue = (user.shares * user.shareValue).toLocaleString('en-AE', {
    style: 'currency',
    currency: 'AED',
  });

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] flex flex-col pb-24 font-sans">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex items-center justify-between transition-all">
        <div className="flex items-center space-x-2">
          {/* Coin Icon Logo */}
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xl font-black text-gray-900 tracking-tight">New Way</span>
        </div>
        
        <div className="flex items-center space-x-1">
          {/* Chat Icon */}
          <button 
            onClick={() => setIsChatOpen(true)}
            className="p-2 text-gray-400 hover:text-indigo-600 active:scale-90 transition-all relative"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
            </span>
          </button>

          {/* Notification Icon */}
          <button 
            onClick={() => setIsNotificationOpen(true)}
            className="p-2 text-gray-400 hover:text-indigo-600 active:scale-90 transition-all relative"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          </button>

          {/* Logout Icon */}
          <button onClick={onLogout} className="p-2 text-gray-400 hover:text-red-500 active:scale-90 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <div className="px-6 py-6 space-y-8">
        {/* Modern Portfolio Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-700 p-8 rounded-[2.5rem] shadow-2xl text-white">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl -ml-16 -mb-16"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-indigo-100 text-sm font-semibold opacity-90 uppercase tracking-widest">Total Valuation</p>
              {/* Eye Visibility Toggle */}
              <button 
                onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                {isBalanceVisible ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                )}
              </button>
            </div>
            <h2 className="text-4xl font-black mb-10 tracking-tight leading-none">
              {isBalanceVisible ? formattedValue : 'AED ••••••'}
            </h2>
            
            <div className="flex gap-4">
              <button 
                onClick={() => openTransactionModal('BUY')}
                className="flex-1 bg-white text-indigo-700 font-extrabold py-4 px-4 rounded-2xl flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-xl hover:shadow-white/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                <span>Buy</span>
              </button>
              <button 
                onClick={() => openTransactionModal('SELL')}
                className="flex-1 bg-white/10 backdrop-blur-md text-white border border-white/20 font-extrabold py-4 px-4 rounded-2xl flex items-center justify-center space-x-2 active:scale-95 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4" /></svg>
                <span>Sell</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-50">
            <p className="text-[10px] text-gray-400 font-black uppercase mb-1 tracking-widest">Total Shares</p>
            <p className="text-lg font-black text-gray-900">
              {isBalanceVisible ? user.shares.toLocaleString() : '••••'}
            </p>
          </div>
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-50">
            <p className="text-[10px] text-gray-400 font-black uppercase mb-1 tracking-widest">NAV (Price)</p>
            <p className="text-lg font-black text-indigo-600">AED {user.shareValue.toLocaleString()}</p>
          </div>
        </div>

        {/* Activity Feed */}
        {transactions.length > 0 && (
          <section>
            <h3 className="text-xs font-black text-gray-400 mb-5 uppercase tracking-[0.2em] px-1">Transactions</h3>
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-50 p-6 space-y-6">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between group">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${tx.type === 'BUY' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {tx.type === 'BUY' ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 13l-5 5m0 0l-5-5m5 5V6" /></svg>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-[15px] font-bold text-gray-900">{tx.type} Shares</p>
                        {/* Remove Icon for Pending Requests */}
                        <button 
                          onClick={() => removeTransaction(tx.id)}
                          className="p-1 text-gray-300 hover:text-rose-500 transition-colors"
                          title="Remove Request"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 font-medium">{new Date(tx.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[15px] font-black text-gray-900">{tx.amount} Units</p>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${
                      tx.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>{tx.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* News Feed */}
        <section>
          <h3 className="text-xs font-black text-gray-400 mb-5 uppercase tracking-[0.2em] px-1">Market Insights</h3>
          <div className="space-y-4">
            {news.length > 0 ? news.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 active:scale-[0.98] transition-all">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-lg">{item.category}</span>
                  <span className="text-[10px] text-gray-300 font-bold tracking-tighter">{item.date}</span>
                </div>
                <h4 className="text-[17px] font-extrabold text-gray-900 leading-snug mb-2">{item.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{item.summary}</p>
              </div>
            )) : (
              <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="h-32 bg-white rounded-[2rem] animate-pulse"></div>)}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Transaction Modal (Bottom Sheet) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => !isProcessing && setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-t-[3rem] shadow-2xl p-10 pb-12 transform transition-transform animate-slide-up">
            <div className="w-14 h-1.5 bg-gray-100 rounded-full mx-auto mb-10"></div>
            
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-3xl font-black text-gray-900 tracking-tight">
                {modalType === 'BUY' ? 'Purchase' : 'Redemption'}
              </h3>
              <div className={`px-4 py-2 rounded-2xl ${modalType === 'BUY' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                <p className="text-xs font-black uppercase tracking-widest">AED {user.shareValue.toLocaleString()}</p>
              </div>
            </div>

            <form onSubmit={handleTransactionConfirm} className="space-y-8">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">Shares Quantity</label>
                <div className="relative group">
                  <input
                    autoFocus
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    className="w-full bg-gray-50 border-transparent border-2 px-6 py-6 rounded-3xl text-3xl font-black text-gray-900 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-gray-300 uppercase tracking-widest pointer-events-none group-focus-within:text-indigo-400 transition-colors">Units</span>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-3xl flex items-center justify-between border border-gray-100">
                <span className="text-sm font-bold text-gray-400">Total Value</span>
                <span className="text-2xl font-black text-gray-900">
                  AED {((parseFloat(quantity) || 0) * user.shareValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isProcessing}
                  className="flex-1 py-5 text-gray-400 font-bold rounded-3xl hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isProcessing || !quantity || parseFloat(quantity) <= 0}
                  className={`flex-[2] py-5 rounded-3xl font-black text-white shadow-xl active:scale-95 transition-all ${
                    modalType === 'BUY' ? 'bg-indigo-600' : 'bg-rose-600'
                  } disabled:opacity-30`}
                >
                  {isProcessing ? 'Processing...' : `Confirm Order`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notifications Bottom Sheet */}
      {isNotificationOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setIsNotificationOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md h-[60vh] rounded-t-[3rem] shadow-2xl flex flex-col transform transition-transform animate-slide-up overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-black text-2xl text-gray-900">Notifications</h3>
              <button onClick={() => setIsNotificationOpen(false)} className="p-2 text-gray-300 hover:text-gray-500">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {sampleNotifications.map((notif) => (
                <div key={notif.id} className="p-5 rounded-3xl bg-gray-50 border border-gray-100">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-gray-900">{notif.title}</h4>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">{notif.time}</span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{notif.body}</p>
                </div>
              ))}
            </div>
            <div className="p-6 bg-white border-t border-gray-100 text-center">
              <button className="text-indigo-600 font-bold text-sm">Clear All Notifications</button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Bottom Sheet */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setIsChatOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md h-[85vh] rounded-t-[3rem] shadow-2xl flex flex-col transform transition-transform animate-slide-up">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 rounded-t-[3rem]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-black text-gray-900 leading-none mb-1">Fund Assistant</h3>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">AI Agent Online</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="p-2 text-gray-300 hover:text-gray-500">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-5 py-3.5 rounded-3xl shadow-sm text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-5 py-3 rounded-3xl rounded-tl-none flex space-x-1.5">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-gray-100">
              <div className="relative group">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="How can I assist you?"
                  className="w-full bg-gray-50 border-2 border-transparent px-6 py-4 pr-14 rounded-[1.5rem] focus:border-indigo-500 focus:bg-white transition-all text-[15px] outline-none"
                />
                <button 
                  type="submit" 
                  disabled={!chatInput.trim() || isTyping} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg active:scale-90 transition-all disabled:bg-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Animations */}
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};

export default AppPage;
