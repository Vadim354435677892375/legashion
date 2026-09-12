import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { fetchDaDataSuggestions } from '../lib/dadata.js';
import { fetchNominatimSuggestions } from '../lib/nominatim.js';

export const geocodeRouter = Router();

const DEFAULT_COUNTRY_CODE = 'RU';

const querySchema = z.object({
  query: z.string().trim().min(2),
  countryCode: z.string().trim().length(2).default(DEFAULT_COUNTRY_CODE),
  mode: z.enum(['city', 'address']),
  city: z.string().trim().optional(), // город, если ищем адрес (для сужения зарубежного поиска)
  region: z.string().trim().optional(), // регион, если ищем адрес в России (сужение DaData)
});

// GET /api/geocode/suggest?query=...&countryCode=RU&mode=city|address[&city=...&region=...]
// Логика источника подсказок 1-в-1 повторяет utils/geocoding.js с фронта,
// только токен DaData теперь не покидает сервер.
geocodeRouter.get(
  '/suggest',
  asyncHandler(async (req, res) => {
    const { query, countryCode, mode, city, region } = querySchema.parse(req.query);

    if (countryCode === DEFAULT_COUNTRY_CODE) {
      if (mode === 'city') {
        const suggestions = await fetchDaDataSuggestions(query, {
          fromBound: { value: 'city' },
          toBound: { value: 'settlement' },
        });
        return res.json(suggestions);
      }
      const locations = region || city ? [{ region, city }] : undefined;
      const suggestions = await fetchDaDataSuggestions(query, {
        fromBound: { value: 'street' },
        toBound: { value: 'house' },
        locations,
      });
      return res.json(suggestions);
    }

    const suggestions = await fetchNominatimSuggestions(query, {
      countryCode,
      mode,
      cityContext: mode === 'address' ? city : undefined,
    });
    res.json(suggestions);
  })
);
