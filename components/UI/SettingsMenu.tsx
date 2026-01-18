
import React from 'react';
import { Theme } from '../../types/nuts';
import { APP_THEMES } from '../../constants/themes';

interface SettingsMenuProps {
  currentTheme: Theme;
  setTheme: (t: Theme) => void;
  scale: number;
  setScale: (s: (prev: number) => number) => void;
  resetScale: () => void;
  showWiki: boolean;
  setShowWiki: (v: boolean) => void;
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  currentTheme, setTheme, scale, setScale, resetScale, showWiki, setShowWiki, showSettings, setShowSettings
}) => {
  const isDark = currentTheme.id !== 'white';

  return (
    <div className="p-4 border-t border-white/5 relative">
      <button onClick={() => setShowSettings(!showSettings)} className={`w-10 h-10 border rounded-full flex items-center justify-center transition-all ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" fill="none" strokeWidth="2" /></svg>
      </button>
      {showSettings && (
        <div className={`absolute bottom-full left-4 mb-4 w-56 backdrop-blur-2xl border rounded-2xl p-3 shadow-3xl z-50 ${isDark ? 'bg-black/90 border-white/10' : 'bg-white/95 border-slate-200'}`}>
          <div className="mb-3">
            <h3 className="text-[9px] font-black uppercase text-slate-500 px-1 mb-1">Zoom</h3>
            <div className="grid grid-cols-3 gap-1">
              <button onClick={() => setScale(s => Math.min(s * 1.2, 3))} className="h-7 rounded bg-blue-500/10 text-xs font-bold">+</button>
              <button onClick={() => setScale(s => Math.max(s * 0.8, 0.2))} className="h-7 rounded bg-blue-500/10 text-xs font-bold">-</button>
              <button onClick={resetScale} className="h-7 rounded bg-blue-500/10 text-[8px] font-bold">RESET</button>
            </div>
          </div>
          <div className="mb-3">
            <h3 className="text-[9px] font-black uppercase text-slate-500 px-1 mb-1">Ansicht</h3>
            <div className="flex flex-col gap-1.5 px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="radio" className="sr-only" checked={showWiki} onChange={() => setShowWiki(true)} />
                <div className={`w-3.5 h-3.5 rounded-full border-2 ${showWiki ? 'bg-blue-500 border-blue-500' : 'border-slate-500'}`} />
                <span className="text-[10px] font-bold">API-Call AN</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="radio" className="sr-only" checked={!showWiki} onChange={() => setShowWiki(false)} />
                <div className={`w-3.5 h-3.5 rounded-full border-2 ${!showWiki ? 'bg-blue-500 border-blue-500' : 'border-slate-500'}`} />
                <span className="text-[10px] font-bold">API-Call AUS</span>
              </label>
            </div>
          </div>
          <div className="mb-3">
            <h3 className="text-[9px] font-black uppercase text-slate-500 px-1 mb-1">Themes</h3>
            <div className="grid grid-cols-4 gap-1.5">{APP_THEMES.map(t => <button key={t.id} onClick={() => setTheme(t)} title={t.name} className={`h-7 rounded border ${t.bg} ${currentTheme.id === t.id ? 'ring-2 ring-blue-500' : 'border-white/10'}`} />)}</div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-500/10">
            <h3 className="text-[9px] font-black uppercase text-slate-500 px-1 mb-0.5">About</h3>
            <div className="px-1 mt-2 text-[10px] leading-tight opacity-40">
              Team ET1, 01.2026<br />
              TERCET NUTS v2024
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

