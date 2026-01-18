
import { useState, useEffect } from 'react';
import { EurostatData, eurostatService } from '../services/eurostatService';

export const useEurostat = (nutsCode: string | null) => {
    const [data, setData] = useState<EurostatData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!nutsCode) {
            setData(null);
            return;
        }

        let isMounted = true;
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await eurostatService.getRegionalData(nutsCode);
                if (isMounted) {
                    setData(result);
                }
            } catch (e) {
                if (isMounted) {
                    setError('Eurostat-Daten konnten nicht geladen werden.');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [nutsCode]);

    return { data, loading, error };
};
