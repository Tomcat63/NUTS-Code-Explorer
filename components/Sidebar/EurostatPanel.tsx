
import React from 'react';
import { useEurostat } from '../../hooks/useEurostat';
import { NutsNode, Theme } from '../../types/nuts';

interface EurostatPanelProps {
    node: NutsNode;
    currentTheme: Theme;
}

export const EurostatPanel: React.FC<EurostatPanelProps> = ({ node, currentTheme }) => {
    const { data, loading, error } = useEurostat(node.id);
    const isDark = currentTheme.id !== 'white';

    if (!node || node.level < 1) return null; // Eurostat mostly has data for E1-E3

    return (
        <div className={`mt-4 rounded-2xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-blue-50/20 border-blue-500/10'} overflow-hidden shadow-sm`}>
            <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? 'border-white/5' : 'border-blue-500/10'}`}>
                <div className="flex flex-col">
                    <h3 className="text-[10px] font-black uppercase opacity-60 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                        Eurostat Regional-Statistik
                    </h3>
                    <div className="text-[7px] font-bold text-blue-500/60 uppercase tracking-widest mt-0.5 ml-3.5 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></span>
                        Live API Abfrage • {node.id}
                    </div>
                </div>
                <div title="KKS = Kaufkraftstandards (PPS). Ermöglicht den Vergleich der Wirtschaftskraft unabhängig vom Preisniveau." className="cursor-help px-1.5 py-0.5 rounded bg-blue-500 text-white text-[7px] font-black uppercase shadow-sm">
                    KKS Info
                </div>
            </div>

            <div className="p-4 space-y-4">
                {loading && (
                    <div className="flex flex-col gap-2 py-2">
                        <div className={`h-12 w-full animate-pulse rounded-lg ${isDark ? 'bg-white/5' : 'bg-slate-200/50'}`} />
                        <div className={`h-12 w-full animate-pulse rounded-lg ${isDark ? 'bg-white/5' : 'bg-slate-200/50'}`} />
                    </div>
                )}

                {error && (
                    <div className="text-[10px] text-amber-500 font-medium py-2 text-center bg-amber-500/5 rounded-lg border border-amber-500/10">
                        {error}
                    </div>
                )}

                {!loading && !error && data && (
                    <div className="grid grid-cols-1 gap-2.5">
                        {/* BIP / GDP */}
                        {data.gdp && (
                            <div className={`p-3 rounded-xl border transition-all ${isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-blue-500/5 hover:border-blue-500/20'} flex flex-col group`}>
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[9px] font-bold uppercase opacity-40 group-hover:opacity-60 transition-opacity">Wirtschaftskraft (BIP)</span>
                                    <span className="text-[8px] opacity-30 font-mono">{data.gdp.year}</span>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-sm font-black text-blue-500">{data.gdp.value.toLocaleString()}</span>
                                    <span className="text-[9px] font-bold opacity-50">KKS pro Kopf</span>
                                </div>
                            </div>
                        )}

                        {/* ALQ / Unemployment */}
                        {data.unemployment && (
                            <div className={`p-3 rounded-xl border transition-all ${isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-emerald-500/5 hover:border-emerald-500/20'} flex flex-col group`}>
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[9px] font-bold uppercase opacity-40 group-hover:opacity-60 transition-opacity">Arbeitslosenquote</span>
                                    <span className="text-[8px] opacity-30 font-mono">{data.unemployment.year}</span>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-sm font-black text-emerald-500">{data.unemployment.value}%</span>
                                    <span className="text-[9px] font-bold opacity-50">der Erwerbspersonen</span>
                                </div>
                            </div>
                        )}

                        {/* Bildung / Education */}
                        {data.education && (
                            <div className={`p-3 rounded-xl border transition-all ${isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-purple-500/5 hover:border-purple-500/20'} flex flex-col group`}>
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold uppercase opacity-40 group-hover:opacity-60 transition-opacity">Bildungsstand (Tertiär)</span>
                                        {node.level === 3 && <span className="text-[7px] text-amber-500/60 uppercase font-black leading-none mt-0.5">Regionale Daten (NUTS-2)</span>}
                                    </div>
                                    <span className="text-[8px] opacity-30 font-mono">{data.education.year}</span>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-sm font-black text-purple-500">{data.education.value}%</span>
                                    <span className="text-[9px] font-bold opacity-50">Akademikerquote</span>
                                </div>
                            </div>
                        )}

                        {!data.gdp && !data.unemployment && !data.education && (
                            <div className="text-[10px] opacity-40 italic py-2 text-center">
                                Für diesen NUTS-Standort sind bei Eurostat aktuell keine regionalen Profildaten hinterlegt.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
