import * as htmlToImage from 'html-to-image';
import React, { useEffect, useRef, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer } from 'react-leaflet';
import { TrashLocation } from '../types/location';

interface MapExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: TrashLocation[];
  stats: {
    total: number;
    baik: number;
    penuh: number;
    rusak: number;
  };
}

// Koordinat pusat Kelurahan Tamansari, Bandung Wetan
const TAMANSARI_CENTER: [number, number] = [-6.8998, 107.6086];
const TAMANSARI_ZOOM = 15;

export const MapExportModal: React.FC<MapExportModalProps> = ({
  isOpen,
  onClose,
  locations,
  stats,
}) => {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mapLayoutRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleDownloadPng = async () => {
    if (!mapLayoutRef.current) return;
    setIsExporting(true);
    setErrorMessage(null);

    try {
      // Tunggu tile Leaflet ter-render sempurna
      await new Promise((resolve) => setTimeout(resolve, 800));

      const dataUrl = await htmlToImage.toPng(mapLayoutRef.current, {
        quality: 0.98,
        pixelRatio: 2, // Resolusi tinggi tajam
        skipFonts: true,
        cacheBust: false,
      });

      const filename = `Peta_Inisiatif_Sampah_Tamansari_${new Date()
        .toISOString()
        .slice(0, 10)}.png`;

      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err: any) {
      console.warn('Gagal render canvas toPng, menggunakan alternatif cetak:', err);
      setErrorMessage(
        'Browser membatasi pengambilan gambar tile peta secara langsung. Silakan gunakan tombol "Cetak / Simpan PDF" di samping.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="map-export-modal-backdrop" role="dialog" aria-modal="true">
      <div className="map-export-modal-card">
        {/* Modal Top Control Bar */}
        <div className="map-export-control-bar">
          <div className="export-bar-info">
            <h3 className="export-bar-title">Ekspor Foto Peta Kartografis</h3>
            <span className="export-bar-sub">
              Format Layout Formal GIS — Kelurahan Tamansari, Kota Bandung
            </span>
          </div>

          <div className="export-bar-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm btn-export-png"
              onClick={handleDownloadPng}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <span className="spinner-border spinner-xs"></span>
                  <span>Memproses Foto...</span>
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>Unduh Foto Peta (.PNG HD)</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm btn-export-print"
              onClick={handlePrint}
              title="Cetak langsung atau simpan sebagai dokumen PDF"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              <span>Cetak / Simpan PDF</span>
            </button>

            <button
              type="button"
              className="btn-modal-close"
              onClick={onClose}
              aria-label="Tutup"
            >
              &times;
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="export-alert-warn">
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Scrollable Preview Area */}
        <div className="map-export-scroll-container">
          {/* Cartographic Map Sheet (Persis seperti layout ArcGIS/QGIS di foto pengguna) */}
          <div className="gis-cartographic-sheet" ref={mapLayoutRef}>
            {/* Outer Neatline Border */}
            <div className="gis-neatline-outer">
              <div className="gis-neatline-inner">
                {/* 1. Main Map Frame (Kiri) */}
                <div className="gis-map-frame">
                  <div className="gis-map-header-tag">Kawasan Kelurahan Tamansari</div>

                  <MapContainer
                    center={TAMANSARI_CENTER}
                    zoom={TAMANSARI_ZOOM}
                    className="gis-leaflet-canvas"
                    zoomControl={false}
                    attributionControl={false}
                    dragging={false}
                    scrollWheelZoom={false}
                    doubleClickZoom={false}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      maxZoom={19}
                    />

                    {/* Render titik-titik inisiatif persampahan */}
                    {locations.map((loc) => {
                      const color =
                        loc.condition === 'Baik'
                          ? '#10B981'
                          : loc.condition === 'Penuh'
                          ? '#F59E0B'
                          : '#EF4444';

                      return (
                        <CircleMarker
                          key={loc.id}
                          center={[loc.latitude, loc.longitude]}
                          radius={6.5}
                          pathOptions={{
                            fillColor: color,
                            fillOpacity: 0.95,
                            color: '#ffffff',
                            weight: 2,
                          }}
                        />
                      );
                    })}
                  </MapContainer>

                  {/* Watermark koordinat batas wilayah */}
                  <div className="gis-coord-overlay coord-top-left">107°36'00"E / 6°53'30"S</div>
                  <div className="gis-coord-overlay coord-bottom-right">107°37'00"E / 6°54'30"S</div>
                </div>

                {/* 2. Cartographic Sidebar (Kanan) */}
                <div className="gis-sidebar-frame">
                  {/* Title Box */}
                  <div className="gis-title-box">
                    <h1 className="gis-main-title">
                      PETA INISIATIF PENGELOLAAN SAMPAH
                    </h1>
                    <div className="gis-subtitle">
                      Kelurahan Tamansari, Bandung
                    </div>
                    <div className="gis-sub-region">
                      Kecamatan Bandung Wetan, Kota Bandung
                    </div>
                  </div>

                  <div className="gis-divider"></div>

                  {/* Legend Box */}
                  <div className="gis-legend-box">
                    <h2 className="gis-legend-heading">Legenda</h2>

                    <div className="gis-legend-section">
                      <span className="gis-section-label">Kondisi / Status Inisiatif:</span>
                      <div className="gis-legend-item">
                        <span className="legend-symbol symbol-dot symbol-green"></span>
                        <span className="legend-name">🟢 Baik (Aktif): <strong>{stats.baik}</strong> titik</span>
                      </div>
                      <div className="gis-legend-item">
                        <span className="legend-symbol symbol-dot symbol-orange"></span>
                        <span className="legend-name">🟠 Penuh (Kapasitas Maks): <strong>{stats.penuh}</strong> titik</span>
                      </div>
                      <div className="gis-legend-item">
                        <span className="legend-symbol symbol-dot symbol-red"></span>
                        <span className="legend-name">🔴 Perlu Perbaikan: <strong>{stats.rusak}</strong> titik</span>
                      </div>
                    </div>

                    <div className="gis-legend-section">
                      <span className="gis-section-label">Fasilitas / Tempat Pengelolaan:</span>
                      <div className="gis-legend-item">
                        <span className="legend-symbol symbol-box bg-maggot"></span>
                        <span className="legend-name">Budidaya Maggot</span>
                      </div>
                      <div className="gis-legend-item">
                        <span className="legend-symbol symbol-box bg-kompos"></span>
                        <span className="legend-name">Pengomposan</span>
                      </div>
                      <div className="gis-legend-item">
                        <span className="legend-symbol symbol-box bg-banksampah"></span>
                        <span className="legend-name">Bank Sampah</span>
                      </div>
                      <div className="gis-legend-item">
                        <span className="legend-symbol symbol-box bg-tps3r"></span>
                        <span className="legend-name">TPS3R / Pemilahan</span>
                      </div>
                    </div>

                    <div className="gis-legend-section">
                      <span className="gis-section-label">Batas Wilayah & Transportasi:</span>
                      <div className="gis-legend-item">
                        <span className="legend-symbol symbol-line line-kelurahan"></span>
                        <span className="legend-name">Batas Kelurahan Tamansari</span>
                      </div>
                      <div className="gis-legend-item">
                        <span className="legend-symbol symbol-line line-arteri"></span>
                        <span className="legend-name">Jalan Utama / Arteri</span>
                      </div>
                      <div className="gis-legend-item">
                        <span className="legend-symbol symbol-line line-lokal"></span>
                        <span className="legend-name">Jalan Lokal / Lingkungan</span>
                      </div>
                      <div className="gis-legend-item">
                        <span className="legend-symbol symbol-line line-sungai"></span>
                        <span className="legend-name">Sungai Cikapundung</span>
                      </div>
                    </div>
                  </div>

                  <div className="gis-divider"></div>

                  {/* North Arrow & Scale Bar */}
                  <div className="gis-scale-compass-box">
                    {/* North Arrow SVG (Klasik Kartografi N) */}
                    <div className="gis-north-arrow">
                      <svg width="42" height="52" viewBox="0 0 100 120" fill="none">
                        <polygon points="50,15 35,65 50,55" fill="#1e293b" />
                        <polygon points="50,15 65,65 50,55" fill="#64748b" />
                        <polygon points="50,95 35,65 50,55" fill="#94a3b8" />
                        <polygon points="50,95 65,65 50,55" fill="#cbd5e1" />
                        <text x="50" y="12" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#0f172a">
                          N
                        </text>
                      </svg>
                    </div>

                    {/* Scale block */}
                    <div className="gis-scale-block">
                      <div className="gis-scale-text">SKALA 1:8.000</div>
                      <div className="gis-scale-bar-graphic">
                        <div className="scale-segment seg-black"></div>
                        <div className="scale-segment seg-white"></div>
                        <div className="scale-segment seg-black"></div>
                        <div className="scale-segment seg-white"></div>
                      </div>
                      <div className="gis-scale-labels">
                        <span>0</span>
                        <span>100m</span>
                        <span>200m</span>
                        <span>400m</span>
                      </div>
                    </div>
                  </div>

                  <div className="gis-divider"></div>

                  {/* Cartographic Metadata / Source */}
                  <div className="gis-metadata-box">
                    <div className="gis-meta-row">
                      <span className="meta-key">Tanggal Pembuatan:</span>
                      <span className="meta-val">{todayFormatted}</span>
                    </div>
                    <div className="gis-meta-row">
                      <span className="meta-key">Sistem Proyeksi:</span>
                      <span className="meta-val">WGS 1984 / UTM Zone 48S</span>
                    </div>
                    <div className="gis-meta-row">
                      <span className="meta-key">Sumber Data:</span>
                      <span className="meta-val">Survei Lapangan Tamansari & OpenStreetMap</span>
                    </div>
                    <div className="gis-meta-row">
                      <span className="meta-key">Total Terdata:</span>
                      <span className="meta-val">{stats.total} Inisiatif Sampah</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default MapExportModal;
