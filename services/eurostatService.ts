
/**
 * Eurostat API Service
 * Fetching regional data for GDP, Unemployment, and Education.
 */

const BASE_URL = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data';

export interface EurostatData {
    gdp?: { value: number; unit: string; year: string };
    unemployment?: { value: number; unit: string; year: string };
    education?: { value: number; unit: string; year: string };
}

class EurostatService {
    private cache: Record<string, { data: EurostatData; timestamp: number }> = {};
    private readonly CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

    async getRegionalData(nutsCode: string): Promise<EurostatData | null> {
        const cached = this.cache[nutsCode];
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }

        try {
            const gdp = await this.fetchSingleMetric('nama_10r_3gdp', nutsCode, 'PPS_EU27_2020_HAB');
            const unemployment = await this.fetchSingleMetric('lfst_r_lfu3rt', nutsCode, 'PC_ACT');

            // Education is NUTS 2. We use the first 4 chars of the NUTS 3 code for NUTS 2.
            const nuts2Code = nutsCode.substring(0, 4);
            const education = await this.fetchSingleMetric('edat_lfse_04', nuts2Code, 'PC');

            const data: EurostatData = {
                gdp: gdp || undefined,
                unemployment: unemployment || undefined,
                education: education || undefined,
            };

            this.cache[nutsCode] = { data, timestamp: Date.now() };
            return data;
        } catch (error) {
            console.error('[EurostatService] Error fetching data:', error);
            return null;
        }
    }

    private async fetchSingleMetric(dataset: string, nutsId: string, unit: string): Promise<{ value: number; unit: string; year: string } | null> {
        try {
            // We try to get the most recent data (usually 2022 or 2023)
            // Eurostat API format: [BASE]/[DATASET]?format=JSON&geo=[NUTS]&unit=[UNIT]&lang=EN
            const url = `${BASE_URL}/${dataset}?format=JSON&geo=${nutsId}&unit=${unit}&lang=EN`;
            const response = await fetch(url);
            if (!response.ok) return null;

            const json = await response.json();
            if (!json.value || Object.keys(json.value).length === 0) return null;

            // The last entry in json.value is usually the most recent
            const keys = Object.keys(json.value);
            const lastKey = keys[keys.length - 1];
            const val = json.value[lastKey];

            // Map index to year
            const timeKeys = Object.keys(json.dimension.time.category.label);
            const year = timeKeys[parseInt(lastKey)];

            return {
                value: Math.round(val * 10) / 10,
                unit: json.dimension.unit.category.label[unit] || unit,
                year: year
            };
        } catch (e) {
            return null;
        }
    }
}

export const eurostatService = new EurostatService();
