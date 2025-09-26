import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, LayersControl } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, 
  Filter, 
  Eye,
  EyeOff,
  Search,
  Info,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../../contexts/AppContext';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different claim types
const createCustomIcon = (color: string, icon: any) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
      <svg width="12" height="12" fill="white" viewBox="0 0 24 24">${icon}</svg>
    </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

// Mock data for demonstration
const mockClaims = [
  {
    id: 1,
    position: [22.9734, 78.6569] as [number, number],
    type: 'IFR',
    status: 'Approved',
    claimant: 'Ram Singh',
    tribalGroup: 'Gond',
    area: 2.5,
    evidence: ['doc1.pdf', 'photo1.jpg'],
    village: 'Demo Village',
    district: 'Demo District',
    state: 'Madhya Pradesh',
    polygon: [
      [22.9734, 78.6569] as [number, number],
      [22.9744, 78.6569] as [number, number],
      [22.9744, 78.6579] as [number, number],
      [22.9734, 78.6579] as [number, number],
      [22.9734, 78.6569] as [number, number]
    ]
  },
  {
    id: 2,
    position: [22.9834, 78.6669] as [number, number],
    type: 'CR',
    status: 'Pending',
    claimant: 'Sita Devi',
    tribalGroup: 'Baiga',
    area: 1.8,
    evidence: ['doc2.pdf', 'photo2.jpg'],
    village: 'Demo Village',
    district: 'Demo District',
    state: 'Madhya Pradesh',
    polygon: [
      [22.9834, 78.6669] as [number, number],
      [22.9844, 78.6669] as [number, number],
      [22.9844, 78.6679] as [number, number],
      [22.9834, 78.6679] as [number, number],
      [22.9834, 78.6669] as [number, number]
    ]
  },
  {
    id: 3,
    position: [22.9634, 78.6469] as [number, number],
    type: 'IFR',
    status: 'Rejected',
    claimant: 'Gopal Yadav',
    tribalGroup: 'Kol',
    area: 3.2,
    evidence: ['doc3.pdf'],
    village: 'Demo Village',
    district: 'Demo District',
    state: 'Madhya Pradesh',
    polygon: [
      [22.9634, 78.6469] as [number, number],
      [22.9644, 78.6469] as [number, number],
      [22.9644, 78.6479] as [number, number],
      [22.9634, 78.6479] as [number, number],
      [22.9634, 78.6469] as [number, number]
    ]
  }
];

// Mock water bodies data
const waterBodies = [
  {
    id: 'water-1',
    name: 'Demo Lake',
    coordinates: [
      [22.9750, 78.6580] as [number, number],
      [22.9760, 78.6580] as [number, number],
      [22.9760, 78.6590] as [number, number],
      [22.9750, 78.6590] as [number, number],
      [22.9750, 78.6580] as [number, number]
    ],
    type: 'Lake',
    area: 0.5
  },
  {
    id: 'water-2',
    name: 'Forest Stream',
    coordinates: [
      [22.9800, 78.6600] as [number, number],
      [22.9810, 78.6600] as [number, number],
      [22.9810, 78.6610] as [number, number],
      [22.9800, 78.6610] as [number, number],
      [22.9800, 78.6600] as [number, number]
    ],
    type: 'Stream',
    area: 0.2
  }
];

// Mock forest areas
const forestAreas = [
  {
    id: 'forest-1',
    name: 'Dense Forest',
    coordinates: [
      [22.9700, 78.6500] as [number, number],
      [22.9750, 78.6500] as [number, number],
      [22.9750, 78.6550] as [number, number],
      [22.9700, 78.6550] as [number, number],
      [22.9700, 78.6500] as [number, number]
    ],
    type: 'Dense Forest',
    area: 2.5
  },
  {
    id: 'forest-2',
    name: 'Open Forest',
    coordinates: [
      [22.9850, 78.6700] as [number, number],
      [22.9900, 78.6700] as [number, number],
      [22.9900, 78.6750] as [number, number],
      [22.9850, 78.6750] as [number, number],
      [22.9850, 78.6700] as [number, number]
    ],
    type: 'Open Forest',
    area: 1.8
  }
];

// Mock village boundaries
const villageBoundaries = [
  {
    id: 'village-1',
    name: 'Demo Village',
    coordinates: [
      [22.97, 78.65] as [number, number],
      [22.98, 78.65] as [number, number],
      [22.98, 78.67] as [number, number],
      [22.97, 78.67] as [number, number],
      [22.97, 78.65] as [number, number]
    ],
    population: 1250,
    totalClaims: 45,
    approvedClaims: 28
  }
];

// Mock demographic data for heatmap
const demographicData = [
  { lat: 22.9734, lng: 78.6569, intensity: 0.8, population: 1250 },
  { lat: 22.9834, lng: 78.6669, intensity: 0.6, population: 890 },
  { lat: 22.9634, lng: 78.6469, intensity: 0.4, population: 650 },
  { lat: 22.9934, lng: 78.6769, intensity: 0.9, population: 1450 },
  { lat: 22.9534, lng: 78.6369, intensity: 0.3, population: 420 }
];

const MapView: React.FC = () => {
  const { } = useTranslation();
  const { toggleLayer } = useApp();
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLayers, setActiveLayers] = useState({
    water: true,
    vegetation: true,
    forest: true,
    builtup: false,
    bareland: false,
    claims: true,
    villages: true,
    population: true
  });
  const mapRef = useRef<L.Map>(null);

  // Base map layers
  const baseMaps = {
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    standard: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
  };

  // Thematic layers (GEE-derived)
  const thematicLayers = [
    { name: 'Water Bodies', color: '#0066CC', visible: true, type: 'water' },
    { name: 'Vegetation', color: '#00CC66', visible: true, type: 'vegetation' },
    { name: 'Forest Cover', color: '#006600', visible: true, type: 'forest' },
    { name: 'Built-up Areas', color: '#CC6600', visible: true, type: 'builtup' },
    { name: 'Bare Land', color: '#CCCC99', visible: true, type: 'bareland' }
  ];


  // Demographic layers
  const demographicLayers = [
    { name: 'Population Density', color: '#FF6600', visible: true, type: 'population' },
    { name: 'Claim Density', color: '#6600FF', visible: true, type: 'claimdensity' }
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Mock search functionality
    const foundClaim = mockClaims.find(claim => 
      claim.id.toString() === query || 
      claim.claimant.toLowerCase().includes(query.toLowerCase()) ||
      claim.village.toLowerCase().includes(query.toLowerCase())
    );
    if (foundClaim && mapRef.current) {
      mapRef.current.setView(foundClaim.position, 15);
    }
  };

  const handleExportMap = (format: 'png' | 'pdf') => {
    // Mock export functionality
    console.log(`Exporting map as ${format}`);
    alert(`Map exported as ${format.toUpperCase()}`);
  };

  const handleDownloadData = (format: 'csv' | 'geojson') => {
    // Mock download functionality
    console.log(`Downloading data as ${format}`);
    alert(`Data downloaded as ${format.toUpperCase()}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return '#10B981';
      case 'Pending': return '#F59E0B';
      case 'Rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'IFR': return '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>';
      case 'CR': return '<path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/>';
      default: return '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Grama Sabha WebGIS</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Madhya Pradesh</span>
            <span className="text-sm text-gray-400">•</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">Demo District</span>
            <span className="text-sm text-gray-400">•</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">Demo Village</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search village or claim ID..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          
          {/* Control Buttons */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowLayerPanel(!showLayerPanel)}
            className={`p-2 rounded-lg transition-colors ${
              showLayerPanel ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Layers className="w-5 h-5" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`p-2 rounded-lg transition-colors ${
              showFilterPanel ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Filter className="w-5 h-5" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowLegend(!showLegend)}
            className={`p-2 rounded-lg transition-colors ${
              showLegend ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Info className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Side Panels */}
        <div className="flex flex-shrink-0">
          {/* Layer Panel */}
          <AnimatePresence>
            {showLayerPanel && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 300, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Layers</h3>
                </div>
                
                <div className="p-4 space-y-6">
                  {/* Base Maps */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Base Maps</h4>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3">
                        <input type="radio" name="basemap" defaultChecked className="text-emerald-600" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Satellite Imagery</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input type="radio" name="basemap" className="text-emerald-600" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Standard Map</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input type="radio" name="basemap" className="text-emerald-600" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Terrain</span>
                      </label>
                    </div>
                  </div>

                  {/* Thematic Layers */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Thematic Layers (GEE)</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 rounded bg-blue-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Water Bodies</span>
                        </div>
                        <button
                          onClick={() => setActiveLayers(prev => ({ ...prev, water: !prev.water }))}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          {activeLayers.water ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 rounded bg-green-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Forest Areas</span>
                        </div>
                        <button
                          onClick={() => setActiveLayers(prev => ({ ...prev, forest: !prev.forest }))}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          {activeLayers.forest ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 rounded bg-orange-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Built-up Areas</span>
                        </div>
                        <button
                          onClick={() => setActiveLayers(prev => ({ ...prev, builtup: !prev.builtup }))}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          {activeLayers.builtup ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 rounded bg-yellow-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Bare Land</span>
                        </div>
                        <button
                          onClick={() => setActiveLayers(prev => ({ ...prev, bareland: !prev.bareland }))}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          {activeLayers.bareland ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* FRA Layers */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">FRA Overlays</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 rounded bg-red-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Claim Boundaries</span>
                        </div>
                        <button
                          onClick={() => setActiveLayers(prev => ({ ...prev, claims: !prev.claims }))}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          {activeLayers.claims ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 rounded bg-blue-600" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Village Boundaries</span>
                        </div>
                        <button
                          onClick={() => setActiveLayers(prev => ({ ...prev, villages: !prev.villages }))}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          {activeLayers.villages ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Demographic Layers */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Demographic Heatmaps</h4>
                    <div className="space-y-2">
                      {demographicLayers.map((layer, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: layer.color }}
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{layer.name}</span>
                          </div>
                          <button
                            onClick={() => toggleLayer(layer.name)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilterPanel && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 300, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
                </div>
                
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">State</label>
                    <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option>Madhya Pradesh</option>
                      <option>Chhattisgarh</option>
                      <option>Odisha</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">District</label>
                    <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option>Demo District</option>
                      <option>District 2</option>
                      <option>District 3</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Village</label>
                    <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option>Demo Village</option>
                      <option>Village 2</option>
                      <option>Village 3</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tribal Group</label>
                    <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option>All Groups</option>
                      <option>Gond</option>
                      <option>Baiga</option>
                      <option>Kol</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Claim Status</label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="text-emerald-600" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Approved</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="text-emerald-600" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="text-emerald-600" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Rejected</span>
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative overflow-hidden map-container">
          <MapContainer
            center={[22.9734, 78.6569] as [number, number]}
            zoom={13}
            className="h-full w-full"
            ref={mapRef}
            style={{ height: '100%', width: '100%' }}
          >
            <LayersControl>
              <LayersControl.BaseLayer checked name="Satellite Imagery">
                <TileLayer
                  url={baseMaps.satellite}
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Standard Map">
                <TileLayer
                  url={baseMaps.standard}
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Terrain">
                <TileLayer
                  url={baseMaps.terrain}
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            {/* Water Bodies */}
            {activeLayers.water && waterBodies.map((water) => (
              <Polygon
                key={water.id}
                positions={water.coordinates}
                pathOptions={{
                  color: "#0066CC",
                  weight: 2,
                  fillColor: "#0066CC",
                  fillOpacity: 0.6
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold text-blue-900">{water.name}</h3>
                    <p className="text-sm text-gray-600">Type: {water.type}</p>
                    <p className="text-sm text-gray-600">Area: {water.area} hectares</p>
                  </div>
                </Popup>
              </Polygon>
            ))}

            {/* Forest Areas */}
            {activeLayers.forest && forestAreas.map((forest) => (
              <Polygon
                key={forest.id}
                positions={forest.coordinates}
                pathOptions={{
                  color: "#006600",
                  weight: 2,
                  fillColor: "#006600",
                  fillOpacity: 0.4
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold text-green-900">{forest.name}</h3>
                    <p className="text-sm text-gray-600">Type: {forest.type}</p>
                    <p className="text-sm text-gray-600">Area: {forest.area} hectares</p>
                  </div>
                </Popup>
              </Polygon>
            ))}

            {/* Village Boundaries */}
            {activeLayers.villages && villageBoundaries.map((village) => (
              <Polygon
                key={village.id}
                positions={village.coordinates}
                pathOptions={{
                  color: "#0000FF",
                  weight: 2,
                  fillOpacity: 0.1
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold text-gray-900">{village.name}</h3>
                    <p className="text-sm text-gray-600">Population: {village.population}</p>
                    <p className="text-sm text-gray-600">Total Claims: {village.totalClaims}</p>
                    <p className="text-sm text-gray-600">Approved Claims: {village.approvedClaims}</p>
                  </div>
                </Popup>
              </Polygon>
            ))}

            {/* Claim Polygons */}
            {activeLayers.claims && mockClaims.map((claim) => (
              <Polygon
                key={`polygon-${claim.id}`}
                positions={claim.polygon}
                pathOptions={{
                  color: getStatusColor(claim.status),
                  weight: 2,
                  fillColor: getStatusColor(claim.status),
                  fillOpacity: 0.3
                }}
              >
                <Popup>
                  <div className="p-3 min-w-[250px]">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">Claim #{claim.id}</h3>
                      <span 
                        className="px-2 py-1 text-xs rounded-full text-white"
                        style={{ backgroundColor: getStatusColor(claim.status) }}
                      >
                        {claim.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Claimant:</span>
                        <span className="ml-2 text-gray-600">{claim.claimant}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Type:</span>
                        <span className="ml-2 text-gray-600">{claim.type}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Tribal Group:</span>
                        <span className="ml-2 text-gray-600">{claim.tribalGroup}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Area:</span>
                        <span className="ml-2 text-gray-600">{claim.area} hectares</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Village:</span>
                        <span className="ml-2 text-gray-600">{claim.village}</span>
                      </div>
                      
                      {claim.evidence && claim.evidence.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">Evidence:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {claim.evidence.map((doc, index) => (
                              <span 
                                key={index}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded"
                              >
                                {doc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Polygon>
            ))}

            {/* Claim Markers */}
            {activeLayers.claims && mockClaims.map((claim) => (
              <Marker
                key={`marker-${claim.id}`}
                position={claim.position}
                icon={createCustomIcon(getStatusColor(claim.status), getTypeIcon(claim.type))}
              >
                <Popup>
                  <div className="p-3 min-w-[250px]">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">Claim #{claim.id}</h3>
                      <span 
                        className="px-2 py-1 text-xs rounded-full text-white"
                        style={{ backgroundColor: getStatusColor(claim.status) }}
                      >
                        {claim.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Claimant:</span>
                        <span className="ml-2 text-gray-600">{claim.claimant}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Type:</span>
                        <span className="ml-2 text-gray-600">{claim.type}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Tribal Group:</span>
                        <span className="ml-2 text-gray-600">{claim.tribalGroup}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Area:</span>
                        <span className="ml-2 text-gray-600">{claim.area} hectares</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Village:</span>
                        <span className="ml-2 text-gray-600">{claim.village}</span>
                      </div>
                      
                      {claim.evidence && claim.evidence.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">Evidence:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {claim.evidence.map((doc, index) => (
                              <span 
                                key={index}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded"
                              >
                                {doc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 space-y-2 z-[1000]">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => mapRef.current?.setView([22.9734, 78.6569], 13)}
              className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => mapRef.current?.zoomIn()}
              className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => mapRef.current?.zoomOut()}
              className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </motion.button>
          </div>

          {/* Export Controls */}
          <div className="absolute bottom-4 left-4 space-y-2 z-[1000]">
            <div className="flex flex-col space-y-2">
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleExportMap('png')}
                  className="px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Export PNG
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleExportMap('pdf')}
                  className="px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Export PDF
                </motion.button>
              </div>
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleDownloadData('csv')}
                  className="px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Download CSV
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleDownloadData('geojson')}
                  className="px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Download GeoJSON
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Legend Panel */}
        <AnimatePresence>
          {showLegend && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 250, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Legend</h3>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Thematic Classes */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thematic Classes</h4>
                  <div className="space-y-1">
                    {thematicLayers.map((layer, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: layer.color }}
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400">{layer.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Claim Status */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Claim Status</h4>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Approved</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Pending</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Rejected</span>
                    </div>
                  </div>
                </div>

                {/* Heatmap Scale */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Population Density</h4>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded bg-red-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">High (1000+)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded bg-orange-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Medium (500-999)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded bg-yellow-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Low (&lt;500)</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowInfo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Map Help & Information</h2>
                <button
                  onClick={() => setShowInfo(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Layer Controls</h3>
                  <p>• Click the Layers button to toggle thematic layers, FRA overlays, and demographic heatmaps</p>
                  <p>• Use the eye icons to show/hide individual layers</p>
                  <p>• Layers can be reordered by dragging them up or down</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Filters & Search</h3>
                  <p>• Use the Filter panel to filter by state, district, village, or tribal group</p>
                  <p>• Search for specific villages or claim IDs using the search box</p>
                  <p>• Filters update the map view dynamically</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Map Interactions</h3>
                  <p>• Click and drag to pan around the map</p>
                  <p>• Use mouse wheel or pinch gestures to zoom in/out</p>
                  <p>• Click on claim markers or village boundaries for detailed information</p>
                  <p>• Use the reset button to return to the default view</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Export & Download</h3>
                  <p>• Export current map view as PNG or PDF</p>
                  <p>• Download filtered data as CSV or GeoJSON</p>
                  <p>• All exports include active layers and visible claims</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MapView;