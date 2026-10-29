import { request } from './api';

export interface Recipe {
  id: string;
  user_id: string;
  name: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
  /** Composition is immutable on the server: set on create, never changed afterwards */
  product_ids: string[];
}

export interface Product {
  id: string;
  name: string;
}

export interface RecipeCreate {
  name: string;
  product_ids: string[];
}

export interface RecipeUpdate {
  name?: string;
  archived?: boolean;
}

export const recipesApi = {
  list: async (includeArchived = false): Promise<Recipe[]> => {
    return request<Recipe[]>(`/recipes?include_archived=${includeArchived}`);
  },

  create: async (data: RecipeCreate): Promise<Recipe> => {
    return request<Recipe>('/recipes', { method: 'POST', body: JSON.stringify(data) });
  },

  update: async (id: string, data: RecipeUpdate): Promise<Recipe> => {
    return request<Recipe>(`/recipes/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /** Rejects with ApiError 409 while dishes or frequent dishes reference the recipe */
  remove: async (id: string): Promise<void> => {
    return request<void>(`/recipes/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  /** Products of the current account; used to resolve recipe product ids to names */
  listProducts: async (): Promise<Product[]> => {
    return request<Product[]>('/products');
  },
};
