import React, { useState, useCallback } from 'react';
import { Upload, List, Map as MapIcon } from 'lucide-react';
import { parseKMLFile, calculateLength } from './utils/kmlUtils';
import Map from './components/Map';

function App() {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showDetailed, setShowDetailed] = useState(false);
  const [summary, setSummary] = useState({});
  const [detailed, setDetailed] = useState([]);

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const kmlContent = e.target?.result;
        if (!kmlContent) return;

        const geoJson = parseKMLFile(kmlContent);
        if (!geoJson || !Array.isArray(geoJson.features)) {
          console.error('Invalid GeoJSON structure');
          return;
        }

        setGeoJsonData(geoJson);

        // Calculate summary
        const newSummary = {};
        const newDetailed = [];

        const processFeature = (feature) => {
          // Validate feature structure
          if (!feature || typeof feature !== 'object') return;
          if (!feature.geometry || typeof feature.geometry !== 'object') return;
          if (!feature.geometry.type || typeof feature.geometry.type !== 'string') return;
          if (!feature.geometry.coordinates || !Array.isArray(feature.geometry.coordinates)) return;

          const type = feature.geometry.type;
          newSummary[type] = (newSummary[type] || 0) + 1;

          if (['LineString', 'MultiLineString'].includes(type)) {
            try {
              const coordinates = type === 'LineString' ? 
                feature.geometry.coordinates : 
                feature.geometry.coordinates.flat();
              
              if (Array.isArray(coordinates) && coordinates.length > 0) {
                const length = calculateLength(coordinates);
                newDetailed.push({ type, length });
              } else {
                newDetailed.push({ type });
              }
            } catch (error) {
              console.error('Error processing coordinates:', error);
              newDetailed.push({ type });
            }
          } else {
            newDetailed.push({ type });
          }
        };

        geoJson.features.forEach(processFeature);
        
        setSummary(newSummary);
        setDetailed(newDetailed);
      } catch (error) {
        console.error('Error processing KML file:', error);
      }
    };
    reader.readAsText(file);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        
            KML Viewer
          </h1>

          <div className="mb-6">
            <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
              <div className="flex flex-col items-center space-y-2">
                <Upload className="w-6 h-6 text-gray-600" />
                <span className="font-medium text-gray-600">
                  Drop KML file or click to upload
                </span>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".kml"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setShowSummary(!showSummary)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              disabled={!geoJsonData}
            >
              Summary
            </button>
            <button
              onClick={() => setShowDetailed(!showDetailed)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
              disabled={!geoJsonData}
            >
              Detailed
            </button>
          </div>

          {showSummary && geoJsonData && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Element Summary</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Element Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Count
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(summary).map(([type, count]) => (
                      <tr key={type}>
                        <td className="px-6 py-4 whitespace-nowrap">{type}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {showDetailed && geoJsonData && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Detailed View</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Element Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Length (km)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {detailed.map((element, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">{element.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {element.length ? element.length.toFixed(2) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {geoJsonData && (
            <div className="h-[400px] w-full">
              <Map geoJsonData={geoJsonData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;