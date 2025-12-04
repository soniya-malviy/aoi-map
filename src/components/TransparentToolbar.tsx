import { Home, Layers, FolderOpen, Settings, Send, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { getAvailableBaseLayers } from "./Sidebar";
import L from 'leaflet';

export function TransparentToolbar({ baseLayer, onBaseLayerChange, onHomeClick, onProjectClick }: any) {
  const [showMenu, setShowMenu] = useState(false);

  return (
<div className="w-full h-full bg-[#0000007D] flex flex-col items-center py-6 space-y-6  shadow-lg border-r border-white/20">
      <IconBtn icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#E3CDA0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-send-icon lucide-send"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg>} />
      <IconBtn
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="#E3CDA0"
            stroke="#E3CDA0"     
            strokeWidth="1.5"
            className="w-6 h-6"
          >
            <path d="M12 2.1L1 12h3v9h7v-6h2v6h7v-9h3L12 2.1zm0 2.69L18 10.19V19h-3v-6H9v6H6V10.19L12 4.79z" />
          </svg>
        }
        onClick={onHomeClick}
      />


      <IconBtn
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="#E3CDA0"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6 text-[#E3CDA0]"
          >
            <rect width="7" height="9" x="3" y="3" rx="1"/>
            <rect width="7" height="5" x="14" y="3" rx="1"/>
            <rect width="7" height="9" x="14" y="12" rx="1"/>
            <rect width="7" height="5" x="3" y="16" rx="1"/>
          </svg>
        }
        onClick={onProjectClick}
      />

      <div className="mt-auto relative">
        <IconBtn icon={<Settings />} onClick={() => setShowMenu(!showMenu)} />

      </div>
    </div>
  );
}

function IconBtn({ icon, onClick }: any) {
  return (
    <button
      className="p-3 rounded-xl bg-transparent hover:bg-white/20 transition"
      onClick={onClick}
    >
      <div className="text-[#E3CDA0] w-6 h-6">{icon}</div>
    </button>
  );
}
