import React, { useState } from 'react';
import axios from 'axios';
import MetadataTable from './MetadataTable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const OCRUpload = () => {
  const [files, setFiles] = useState([]);
  const [allMetadata, setAllMetadata] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloadReady, setDownloadReady] = useState(false);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length > 10) {
      setError("⚠️ You can upload up to 10 PDF files only.");
      return;
    }
    setFiles(selected);
    setAllMetadata([]);
    setDownloadReady(false);
    setError("");
  };

  const handleUploadAll = async () => {
    if (!files || files.length === 0) return;

    setLoading(true);
    setError("");
    try {
      const all = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await axios.post('https://ocr-backend-production-cead.up.railway.app/api/ocr', formData);
        const meta = res.data.metadata || {};
        meta['File Name'] = file.name;
        meta['Patient Signature'] = res.data.patient_signature;
        meta['Physician Signature'] = res.data.physician_signature;

        all.push(meta);
      }

      setAllMetadata(all);
      setDownloadReady(true);
    } catch (err) {
      console.error('Upload failed:', err);
      setError("OCR failed. Please check the backend logs.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = () => {
    try {
      const flattenObject = (obj, parentKey = '') => {
        return Object.entries(obj).reduce((acc, [key, value]) => {
          const fullKey = parentKey ? `${parentKey}.${key}` : key;
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            Object.assign(acc, flattenObject(value, fullKey));
          } else if (Array.isArray(value)) {
            acc[fullKey] = value.map((item) =>
              typeof item === 'object' ? JSON.stringify(item) : item
            ).join('; ');
          } else {
            acc[fullKey] = value;
          }
          return acc;
        }, {});
      };

      const excelRows = allMetadata.map((record) => flattenObject(record));

      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Metadata");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      });

      saveAs(blob, "metadata_output.xlsx");
    } catch (err) {
      setError("Failed to download Excel.");
      console.error("Excel download error:", err);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Segoe UI, sans-serif", maxWidth: "1100px", margin: "0 auto" }}>
      <h2 style={{ fontSize: '26px', marginBottom: '1rem' }}>
        📄 Upload Up to 10 PDFs to Extract Metadata
      </h2>

      <div style={{ marginBottom: '1.5rem' }}>
        <input type="file" accept=".pdf" multiple onChange={handleFileChange} />
        <button onClick={handleUploadAll} disabled={loading} style={{
          marginLeft: '1rem',
          backgroundColor: '#007BFF',
          color: '#fff',
          padding: '0.6rem 1.2rem',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 500
        }}>
          {loading ? "Processing..." : "Upload All"}
        </button>
      </div>

      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}

      {!loading && allMetadata.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '20px' }}>📋 Extracted Metadata</h3>
          {allMetadata.map((meta, idx) => (
            <MetadataTable key={idx} metadata={meta} />
          ))}
        </div>
      )}

      {downloadReady && (
        <button onClick={handleDownloadExcel} style={{
          backgroundColor: '#28a745',
          color: '#fff',
          padding: '0.6rem 1.4rem',
          border: 'none',
          borderRadius: '5px',
          marginTop: '1.5rem',
          fontWeight: '500',
          cursor: 'pointer'
        }}>
          ⬇️ Download Excel
        </button>
      )}
    </div>
  );
};

export default OCRUpload;
