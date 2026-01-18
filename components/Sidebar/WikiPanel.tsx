
import React from 'react';
import { WikiData, Theme } from '../../types/nuts';

interface WikiPanelProps {
  wikiData: WikiData | null;
  isLoading: boolean;
  theme: Theme;
}

export const WikiPanel: React.FC<WikiPanelProps> = ({ wikiData, isLoading, theme }) => {
  const isDark = theme.id !== 'white';

  if (isLoading) {
    return <div className="h-full flex items-center justify-center p-12"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div></div>;
  }

  if (!wikiData) {
    return <div className="h-full flex flex-col items-center justify-center opacity-40 p-12 text-center text-xs font-bold"><p>Kein Wikipedia-Eintrag gefunden</p></div>;
  }

  return (
    <div className="flex flex-col animate-in slide-in-from-right duration-300">
      {wikiData.thumbnail && (
        <div className="h-44 overflow-hidden relative">
          <img src={wikiData.thumbnail} className="w-full h-full object-cover" alt={wikiData.title} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}
      <div className="p-6">
        <h3 className="text-xl font-black mb-3">{wikiData.title}</h3>
        <p className="text-sm opacity-80 leading-relaxed mb-6">{wikiData.extract}</p>
        {wikiData.coords && (
          <div className="mb-6 rounded-xl overflow-hidden border border-blue-500/20">
            <iframe 
              title="OSM Map"
              width="100%" 
              height="150" 
              frameBorder="0" 
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${wikiData.coords.lon-0.05}%2C${wikiData.coords.lat-0.05}%2C${wikiData.coords.lon+0.05}%2C${wikiData.coords.lat+0.05}&layer=mapnik&marker=${wikiData.coords.lat}%2C${wikiData.coords.lon}`} 
              style={{ filter: isDark ? 'grayscale(0.8) invert(0.9) contrast(1.2)' : 'none' }}
            ></iframe>
          </div>
        )}
        <a href={wikiData.url} target="_blank" rel="noreferrer" className="inline-block px-4 py-2 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors">Wiki Artikel</a>
      </div>
    </div>
  );
};
