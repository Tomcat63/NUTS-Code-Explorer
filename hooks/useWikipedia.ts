
import { useState, useEffect } from 'react';
import { NutsNode, WikiData } from '../types/nuts';

export const useWikipedia = (selectedNode: NutsNode | null, enabled: boolean) => {
  const [wikiData, setWikiData] = useState<WikiData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedNode || !enabled) {
      setWikiData(null);
      return;
    }

    const fetchWiki = async () => {
      setIsLoading(true);
      let cleanName = selectedNode.name
        .replace(/, Stadt/g, '').replace(/, Lk\./g, '').replace(/Regierungsbezirk /g, '')
        .replace(/Landkreis /g, '').replace(/Kreisfreie Stadt /g, '').trim();
      
      if (selectedNode.id === "DE") cleanName = "Deutschland";

      try {
        const resp = await fetch(`https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName)}`);
        if (resp.ok) {
          const data = await resp.json();
          setWikiData({
            title: data.title, extract: data.extract, thumbnail: data.thumbnail?.source,
            url: data.content_urls?.desktop?.page,
            coords: data.coordinates ? { lat: data.coordinates.lat, lon: data.coordinates.lon } : undefined
          });
        } else { setWikiData(null); }
      } catch (e) { setWikiData(null); } finally { setIsLoading(false); }
    };
    fetchWiki();
  }, [selectedNode, enabled]);

  return { wikiData, isLoading };
};
