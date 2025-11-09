import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './QRGenerator.css';

const QRGenerator = ({ tables, isMobile }) => {
  const [selectedTable, setSelectedTable] = useState(tables[0]?.number || 'T01');
  const [qrSize, setQrSize] = useState(isMobile ? 200 : 256);

  const baseUrl = window.location.origin;
  const qrValue = `${baseUrl}/menu?table=${selectedTable}`;

  const downloadQRCode = () => {
    const svg = document.getElementById('qrcode-svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `table-${selectedTable}-qrcode.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  const printQRCode = () => {
    const svg = document.getElementById('qrcode-svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code for Table ${selectedTable}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 40px;
              }
              .header { 
                margin-bottom: 20px; 
              }
              .instructions {
                margin-top: 20px;
                color: #666;
                font-size: 14px;
              }
              .qr-code {
                width: 300px;
                height: 300px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>Table ${selectedTable} - Digital Menu</h2>
              <p>Scan to view menu and order</p>
            </div>
            <div class="qr-code">
              ${svgData}
            </div>
            <div class="instructions">
              <p>Place this QR code on Table ${selectedTable}</p>
              <p>Customers can scan to view menu and place orders directly</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">QR Code Generator</h2>
        <p className="page-subtitle">Generate QR codes for table ordering</p>
      </div>

      <div className="qr-generator">
        <div className="qr-controls">
          <div className="control-group">
            <label className="control-label">Select Table:</label>
            <select 
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="control-select"
            >
              {tables.map(table => (
                <option key={table.id} value={table.number}>
                  Table {table.number} ({table.capacity} seats)
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">QR Code Size:</label>
            <select 
              value={qrSize}
              onChange={(e) => setQrSize(Number(e.target.value))}
              className="control-select"
            >
              <option value={128}>Small (128px)</option>
              <option value={200}>Medium (200px)</option>
              <option value={256}>Large (256px)</option>
              <option value={384}>Extra Large (384px)</option>
            </select>
          </div>

          <div className="qr-actions">
            <button className="btn btn-primary" onClick={downloadQRCode}>
              📥 Download QR Code
            </button>
            <button className="btn btn-secondary" onClick={printQRCode}>
              🖨️ Print QR Code
            </button>
          </div>
        </div>

        <div className="qr-preview">
          <div className="qr-card">
            <div className="qr-header">
              <h3 className="qr-title">Table {selectedTable}</h3>
              <p className="qr-subtitle">Scan to order from digital menu</p>
            </div>
            
            <div className="qr-code-container">
              <QRCodeSVG 
                id="qrcode-svg"
                value={qrValue}
                size={qrSize}
                level="H"
                includeMargin
                className="qr-code"
              />
            </div>

            <div className="qr-info">
              <div className="qr-url">
                <strong>URL:</strong> {qrValue}
              </div>
              <div className="qr-instructions">
                <p>📱 Customers scan this code to:</p>
                <ul className="instruction-list">
                  <li>View the digital menu</li>
                  <li>Place orders directly</li>
                  <li>Pay via QR/card</li>
                  <li>Track order status</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk QR Generator */}
      <div className="bulk-qr-section">
        <h3 className="section-title">Bulk QR Generation</h3>
        <div className="bulk-qr-grid">
          {tables.map(table => (
            <div key={table.id} className="table-qr-card">
              <div className="table-qr-header">
                <h4>Table {table.number}</h4>
                <span className={`table-status-small status-${table.status}`}>
                  {table.status.replace('_', ' ')}
                </span>
              </div>
              <div className="small-qr-container">
                <QRCodeSVG 
                  value={`${baseUrl}/menu?table=${table.number}`}
                  size={isMobile ? 100 : 120}
                  level="H"
                />
              </div>
              <button 
                className="download-small-btn"
                onClick={() => {
                  setSelectedTable(table.number);
                  setTimeout(downloadQRCode, 100);
                }}
              >
                Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;