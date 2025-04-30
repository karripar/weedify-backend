import axios from 'axios';
import {cache} from '../lib/cacheService';

interface FineliIngredient {
  id: number;
  name: {
    fi: string;
    en?: string;
    sv?: string;
  };
  energyKcal: number;
  protein: number;
  fat: number;
  carbohydrate: number;
  fiber: number;
  sugar: number;
  specialDiets?: Array<{
    description: {
      fi: string;
      en?: string;
      sv?: string;
    };
  }>;
}

interface FineliSearchResponse {
  ingredients: FineliIngredient[];
  error?: string;
}

// Search ingredients from Fineli API
export const searchFineliIngredients = async (
  searchTerm: string,
  lang = 'fi',
): Promise<FineliSearchResponse> => {
  try {
    // Check cache first
    const cacheKey = `fineli_search_${searchTerm}_${lang}`;
    const cachedResult = cache.get<FineliIngredient[]>(cacheKey);
    if (cachedResult) {
      return {ingredients: cachedResult};
    }

    // If not in cache, fetch from API
    const url = `https://fineli.fi/fineli/api/v1/foods?q=${encodeURIComponent(searchTerm)}&lang=${lang}`;
    const response = await axios.get(url);

    if (response.status !== 200) {
      throw new Error(`Failed to fetch from Fineli API: ${response.status}`);
    }

    // Cache the results (10 minutes)
    cache.set(cacheKey, response.data, 600);

    return {ingredients: response.data};
  } catch (error) {
    console.error('Fineli API error:', error);
    return {
      ingredients: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Get ingredient details from Fineli API by ID
export const getFineliIngredientById = async (
  id: number,
  lang = 'fi',
): Promise<FineliIngredient | null> => {
  try {
    // Check cache first
    const cacheKey = `fineli_ingredient_${id}_${lang}`;
    const cachedResult = cache.get<FineliIngredient>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // If not in cache, fetch from API
    const url = `https://fineli.fi/fineli/api/v1/foods/${id}?lang=${lang}`;
    const response = await axios.get(url);

    if (response.status !== 200) {
      throw new Error(
        `Failed to fetch ingredient from Fineli API: ${response.status}`,
      );
    }

    // Cache the result (1 day)
    cache.set(cacheKey, response.data, 86400);

    return response.data;
  } catch (error) {
    console.error('Fineli API error:', error);
    return null;
  }
};
