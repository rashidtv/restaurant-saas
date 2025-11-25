import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './QRGenerator.css';

const QRGenerator = ({ tables, isMobile, apiConnected }) => {
  const [selectedTable, setSelectedTable] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const qrRef = useRef();

// In your QR generator
const generateQRUrl = (tableNumber) => {
  const baseUrl = 'https://restaurant-saas-demo.onrender.com';
  const timestamp = Date.now();
  // Add session indicator to help with mobile issues
  const qrUrl = `${baseUrl}/#/menu?table=${tableNumber}&ts=${timestamp}&mobile=true`;
  console.log('🔗 Generated QR URL for mobile:', qrUrl);
  return qrUrl;
};

  const handleTableSelect = (tableNumber) => {
    console.log('🎯 Selected table for QR:', tableNumber);
    setSelectedTable(tableNumber);
    const url = generateQRUrl(tableNumber);
    setGeneratedUrl(url);
    console.log('🔗 Generated QR URL:', url);
  };

  const downloadQR = () => {
    if (!selectedTable || !qrRef.current) return;
    
    const svg = qrRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `table-${selectedTable}-menu-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  // Show ALL tables, not just available ones
  const allTables = tables;

  return (
    <div className="qr-generator-modern">
      {/* Modern Page Header */}
      <div className="page-header-modern">
        <div>
          <h2 className="page-title-modern">QR Code Generator</h2>
          <p className="page-subtitle-modern">Generate QR codes for table menus</p>
          {!apiConnected && (
            <div className="offline-badge-modern">⚠️ Offline Mode - Data may be limited</div>
          )}
        </div>
      </div>

      <div className="qr-generator-container-modern">
        <div className="qr-controls-modern">
          <div className="table-selection-modern">
            <label htmlFor="table-select" className="selection-label-modern">
              Select Table:
            </label>
            <select
              id="table-select"
              value={selectedTable}
              onChange={(e) => handleTableSelect(e.target.value)}
              className="table-select-modern"
            >
              <option value="">Choose a table</option>
              {allTables.map(table => (
                <option key={table.number} value={table.number}>
                  Table {table.number} ({table.capacity} seats) - {table.status}
                </option>
              ))}
            </select>
          </div>

          {selectedTable && (
            <div className="qr-preview-modern">
              <div className="qr-code-container-modern">
                <div className="qr-code-wrapper-modern">
                  <QRCodeSVG
                    ref={qrRef}
                    value={generatedUrl}
                    size={200}
                    level="H"
                    includeMargin={true}
                    className="qr-code-modern"
                  />
                  <div className="qr-table-label-modern">Table {selectedTable}</div>
                </div>
                
                <div className="qr-info-modern">
                  <div className="qr-url-modern">
                    <strong>URL:</strong> 
                    <span className="url-text-modern">{generatedUrl}</span>
                  </div>
                  <div className="qr-instructions-modern">
                    📱 Scan to view digital menu for Table {selectedTable}
                  </div>
                  
                  {/* TEST BUTTON - Remove in production */}
                  <button 
                    onClick={() => window.open(generatedUrl, '_blank')}
                    className="test-btn-modern"
                  >
                    🔗 Test This Link
                  </button>
                </div>
              </div>

              <div className="qr-actions-modern">
                <button 
                  onClick={downloadQR}
                  className="download-btn-modern"
                >
                  📥 Download QR Code
                </button>
                
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedUrl);
                    alert('URL copied to clipboard!');
                  }}
                  className="copy-btn-modern"
                >
                  📋 Copy URL
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="qr-instructions-section-modern">
          <h3 className="instructions-title-modern">How to Use QR Codes:</h3>
          <div className="instructions-grid-modern">
            <div className="instruction-step-modern">
              <div className="step-number-modern">1</div>
              <div className="step-content-modern">
                <strong>Select a table</strong> and download the QR code
              </div>
            </div>
            <div className="instruction-step-modern">
              <div className="step-number-modern">2</div>
              <div className="step-content-modern">
                <strong>Print the QR code</strong> and place it on the table
              </div>
            </div>
            <div className="instruction-step-modern">
              <div className="step-number-modern">3</div>
              <div className="step-content-modern">
                <strong>Customers scan</strong> with their phone camera
              </div>
            </div>
            <div className="instruction-step-modern">
              <div className="step-number-modern">4</div>
              <div className="step-content-modern">
                <strong>They'll be directed to the digital menu</strong> for that specific table
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;