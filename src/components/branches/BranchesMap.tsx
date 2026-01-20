import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BranchWithManager } from "@/services/branches";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, User, Building2 } from "lucide-react";

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icons
const createCustomIcon = (color: string, size: number = 25) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      ">
        <div style="
          transform: rotate(45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          color: white;
          font-size: ${size * 0.4}px;
        ">
          ●
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

const headquartersIcon = createCustomIcon("hsl(var(--primary))", 35);
const activeIcon = createCustomIcon("hsl(142, 76%, 36%)", 28);
const inactiveIcon = createCustomIcon("hsl(var(--muted-foreground))", 25);

interface BranchesMapProps {
  branches: BranchWithManager[];
}

// Component to auto-fit bounds
function FitBounds({ branches }: { branches: BranchWithManager[] }) {
  const map = useMap();

  useEffect(() => {
    const branchesWithCoords = branches.filter(
      (b) => b.latitude != null && b.longitude != null
    );

    if (branchesWithCoords.length > 0) {
      const bounds = L.latLngBounds(
        branchesWithCoords.map((b) => [b.latitude!, b.longitude!])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [branches, map]);

  return null;
}

export function BranchesMap({ branches }: BranchesMapProps) {
  const branchesWithCoords = useMemo(
    () => branches.filter((b) => b.latitude != null && b.longitude != null),
    [branches]
  );

  const getIcon = (branch: BranchWithManager) => {
    if (branch.is_headquarters) return headquartersIcon;
    if (branch.status === "Ativa") return activeIcon;
    return inactiveIcon;
  };

  // Brazil center
  const defaultCenter: [number, number] = [-14.235, -51.925];
  const defaultZoom = 4;

  if (branchesWithCoords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] bg-muted/30 rounded-lg border border-dashed">
        <MapPin className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium">Nenhuma filial com localização</h3>
        <p className="text-muted-foreground text-sm mt-1 text-center max-w-md">
          Adicione coordenadas às filiais para visualizá-las no mapa. 
          Use o botão "Buscar Coordenadas" ao editar uma filial.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[400px] rounded-lg overflow-hidden border shadow-sm">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds branches={branchesWithCoords} />
        
        {branchesWithCoords.map((branch) => (
          <Marker
            key={branch.id}
            position={[branch.latitude!, branch.longitude!]}
            icon={getIcon(branch)}
          >
            <Popup>
              <div className="min-w-[200px] p-1">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{branch.name}</span>
                  {branch.is_headquarters && (
                    <Badge variant="secondary" className="text-xs">
                      Matriz
                    </Badge>
                  )}
                </div>
                
                {(branch.city || branch.state) && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                    <MapPin className="h-3 w-3" />
                    {branch.city && branch.state
                      ? `${branch.city}, ${branch.state}`
                      : branch.city || branch.state}
                  </div>
                )}
                
                {branch.phone && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                    <Phone className="h-3 w-3" />
                    {branch.phone}
                  </div>
                )}
                
                {branch.manager && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <User className="h-3 w-3" />
                    {branch.manager.full_name}
                  </div>
                )}
                
                <Badge
                  variant={branch.status === "Ativa" ? "default" : "secondary"}
                  className={
                    branch.status === "Ativa"
                      ? "bg-green-100 text-green-800"
                      : ""
                  }
                >
                  {branch.status}
                </Badge>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
