import { supabase } from '../lib/supabase';
import type { AOIFeature } from '../lib/supabase';

const STORAGE_KEY = 'aoi_features_backup';

export const aoiService = {
  async saveFeature(feature: Omit<AOIFeature, 'id' | 'created_at' | 'updated_at'>): Promise<AOIFeature | null> {
    try {
      const { data, error } = await supabase
        .from('aoi_features')
        .insert({
          name: feature.name,
          geometry: feature.geometry,
          properties: feature.properties,
        })
        .select()
        .single();

      if (error) throw error;

      this.syncToLocalStorage();
      return data;
    } catch (error) {
      console.error('Error saving feature to Supabase:', error);
      this.saveToLocalStorage(feature);
      return null;
    }
  },

  async getFeatures(): Promise<AOIFeature[]> {
    try {
      const { data, error } = await supabase
        .from('aoi_features')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const features = data || [];
      this.saveAllToLocalStorage(features);
      return features;
    } catch (error) {
      console.error('Error fetching features from Supabase:', error);
      return this.getFromLocalStorage();
    }
  },

  async deleteFeature(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('aoi_features')
        .delete()
        .eq('id', id);

      if (error) throw error;

      this.syncToLocalStorage();
      return true;
    } catch (error) {
      console.error('Error deleting feature from Supabase:', error);
      this.deleteFromLocalStorage(id);
      return false;
    }
  },

  async updateFeature(id: string, updates: Partial<AOIFeature>): Promise<AOIFeature | null> {
    try {
      const { data, error } = await supabase
        .from('aoi_features')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      this.syncToLocalStorage();
      return data;
    } catch (error) {
      console.error('Error updating feature in Supabase:', error);
      return null;
    }
  },

  saveToLocalStorage(feature: Omit<AOIFeature, 'id' | 'created_at' | 'updated_at'>): void {
    try {
      const stored = this.getFromLocalStorage();
      const newFeature: AOIFeature = {
        ...feature,
        id: `local-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      stored.push(newFeature);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  getFromLocalStorage(): AOIFeature[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  },

  saveAllToLocalStorage(features: AOIFeature[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(features));
    } catch (error) {
      console.error('Error saving all to localStorage:', error);
    }
  },

  deleteFromLocalStorage(id: string): void {
    try {
      const stored = this.getFromLocalStorage();
      const filtered = stored.filter((f) => f.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting from localStorage:', error);
    }
  },

  async syncToLocalStorage(): Promise<void> {
    const features = await this.getFeatures();
    this.saveAllToLocalStorage(features);
  },
};
