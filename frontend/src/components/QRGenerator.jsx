import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './QRGenerator.css';

const QRGenerator = ({ tables, isMobile }) => {
  const [selectedTable, setSelectedTable] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const qrRef = useRef();

  // FIXED: Generate proper URL that goes directly to menu
  const generateQRUrl = (tableNumber) => {
    const baseUrl = window.location.origin;
    // Use hash-based routing that works with React Router
    return `${baseUrl}/#/menu?table=${encodeURIComponent(tableNumber)}`;
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
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">QR Code Generator</h2>
        <p className="page-subtitle">Generate QR codes for table menus</p>
      </div>

      <div className="qr-generator-container">
        <div className="qr-controls">
          <div className="table-selection">
            <label htmlFor="table-select" className="selection-label">
              Select Table:
            </label>
            <select
              id="table-select"
              value={selectedTable}
              onChange={(e) => handleTableSelect(e.target.value)}
              className="table-select"
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
            <div className="qr-preview">
              <div className="qr-code-container">
                <div className="qr-code-wrapper">
                  <QRCodeSVG
                    ref={qrRef}
                    value={generatedUrl}
                    size={200}
                    level="H"
                    includeMargin={true}
                    className="qr-code"
                  />
                  <div className="qr-table-label">Table {selectedTable}</div>
                </div>
                
                <div className="qr-info">
                  <div className="qr-url">
                    <strong>URL:</strong> 
                    <span className="url-text">{generatedUrl}</span>
                  </div>
                  <div className="qr-instructions">
                    📱 Scan to view digital menu for Table {selectedTable}
                  </div>
                  
                  {/* TEST BUTTON - Remove in production */}
                  <button 
                    onClick={() => window.open(generatedUrl, '_blank')}
                    className="test-btn"
                    style={{marginTop: '10px', padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px'}}
                  >
                    🔗 Test This Link
                  </button>
                </div>
              </div>

              <div className="qr-actions">
                <button 
                  onClick={downloadQR}
                  className="download-btn"
                >
                  📥 Download QR Code
                </button>
                
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedUrl);
                    alert('URL copied to clipboard!');
                  }}
                  className="copy-btn"
                >
                  📋 Copy URL
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="qr-instructions-section">
          <h3>How to Use QR Codes:</h3>
          <div className="instructions-grid">
            <div className="instruction-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <strong>Select a table</strong> and download the QR code
              </div>
            </div>
            <div className="instruction-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <strong>Print the QR code</strong> and place it on the table
              </div>
            </div>
            <div className="instruction-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <strong>Customers scan</strong> with their phone camera
              </div>
            </div>
            <div className="instruction-step">
              <div className="step-number">4</div>
              <div className="step-content">
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