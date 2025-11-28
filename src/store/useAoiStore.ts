import { create } from "zustand";

export type AOI = {
  id: string;
  name?: string;
  geojson: GeoJSON.GeoJSON;
  createdAt: string;
  visible: boolean;
};

type Store = {
  aois: AOI[];

  addAoi: (a: AOI) => void;
  updateAoi: (a: AOI) => void;
  removeAoi: (id: string) => void;

  toggleVisibility: (id: string) => void;

  loadFromDisk: () => void;
};

export const useAoiStore = create<Store>((set) => ({
  aois: [],

  // ADD AOI
  addAoi: (a) =>
    set((s) => {
      const next = [...s.aois, { ...a, visible: true }];
      localStorage.setItem("aois:v1", JSON.stringify(next));
      return { aois: next };
    }),

  // UPDATE AOI (edit, redraw)
  updateAoi: (a) =>
    set((s) => {
      const next = s.aois.map((x) => (x.id === a.id ? a : x));
      localStorage.setItem("aois:v1", JSON.stringify(next));
      return { aois: next };
    }),

  // DELETE AOI
  removeAoi: (id) =>
    set((s) => {
      const next = s.aois.filter((x) => x.id !== id);
      localStorage.setItem("aois:v1", JSON.stringify(next));
      return { aois: next };
    }),

  // SHOW/HIDE AOI
  toggleVisibility: (id) =>
    set((s) => {
      const next = s.aois.map((x) =>
        x.id === id ? { ...x, visible: !x.visible } : x
      );
      localStorage.setItem("aois:v1", JSON.stringify(next));
      return { aois: next };
    }),

  // LOAD FROM LOCALSTORAGE
  loadFromDisk: () =>
    set(() => {
      const raw = localStorage.getItem("aois:v1");
      if (!raw) return { aois: [] };
      return { aois: JSON.parse(raw) };
    }),
}));
