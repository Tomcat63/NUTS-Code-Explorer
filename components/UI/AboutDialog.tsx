
import React from 'react';
import { Theme } from '../../types/nuts';

interface AboutDialogProps {
    isOpen: boolean;
    onClose: () => void;
    totalCodes: number;
    totalPlz: number;
    theme: Theme;
}

export const AboutDialog: React.FC<AboutDialogProps> = ({ isOpen, onClose, totalCodes, totalPlz, theme }) => {
    if (!isOpen) return null;

    const isDark = theme.id !== 'white';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/40 animate-in fade-in duration-300" onClick={onClose}>
            <div
                className={`w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border transition-all animate-in zoom-in-95 duration-300 ${isDark ? 'bg-slate-900/90 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex flex-col items-center text-center gap-6">
                    {/* Header Title */}
                    <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-[#A855F7] via-[#6366F1] to-[#22D3EE] bg-clip-text text-transparent drop-shadow-sm">
                        NUTS Explorer
                    </h1>

                    {/* Large Logo */}
                    <div className="w-48 h-48 rounded-[3rem] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl ring-8 ring-blue-500/5">
                        <img src="/assets/logo_big.png" alt="NUTS Explorer Big Logo" className="w-full h-full object-cover scale-110" />
                    </div>

                    {/* Statistics Section */}
                    <div className="w-full grid grid-cols-2 gap-4 mt-2">
                        <div className={`p-4 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="text-2xl font-black text-blue-500">{totalCodes}</div>
                            <div className="text-[10px] font-black uppercase opacity-40 tracking-widest">NUTS Codes</div>
                        </div>
                        <div className={`p-4 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="text-2xl font-black text-blue-500">{totalPlz}</div>
                            <div className="text-[10px] font-black uppercase opacity-40 tracking-widest">PLZ Zuordnungen</div>
                        </div>
                    </div>

                    {/* About Footer Info */}
                    <div className="space-y-3 mt-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Projekt Entwicklung</p>
                            <p className="text-sm font-bold opacity-80">Team ET1, 01.2026</p>
                        </div>

                        <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Datenquellen</p>
                            <a
                                href="https://ec.europa.eu/eurostat/de/web/products-manuals-and-guidelines/w/ks-gq-23-010"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] font-bold text-blue-500 hover:text-blue-400 transition-colors flex items-center justify-center gap-1 group"
                            >
                                EU NUTS CODE v2024
                                <svg className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                            <a
                                href="https://gisco-services.ec.europa.eu/tercet/flat-files"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] font-bold text-blue-500 hover:text-blue-400 transition-colors flex items-center justify-center gap-1 group"
                            >
                                EU DE-Plz zu NUTS CODE (2025)
                                <svg className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className={`mt-4 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                    >
                        Schließen
                    </button>
                </div>
            </div>
        </div>
    );
};
