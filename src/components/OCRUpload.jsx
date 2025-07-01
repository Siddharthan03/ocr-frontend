import React, { useState } from 'react';
import axios from 'axios';
import MetadataTable from './MetadataTable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const OCRUpload = () => {
  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloadReady, setDownloadReady] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
      setMetadata({});
      setDownloadReady(false);
      setError("");
    } else {
      setError("Please select a valid PDF file.");
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${apiUrl}/api/ocr`, formData);
      const extracted = res.data.metadata || {};
      setMetadata(extracted);
      setDownloadReady(Object.keys(extracted).length > 0);
    } catch (err) {
      setError("OCR failed. Please check the backend logs.");
      console.error("OCR failed", err);
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

      const flatMetadata = flattenObject(metadata);
      const worksheetData = Object.entries(flatMetadata).map(([key, value]) => ({
        Field: key,
        Value: value,
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Metadata");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const blob = new Blob([excelBuffer], {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      });

      saveAs(blob, "metadata_output.xlsx");
    } catch (err) {
      setError("Failed to download Excel.");
      console.error("Excel download error:", err);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h2>📄 PDF OCR Extraction Tool</h2>
      <input type="file" accept=".pdf" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file || loading} style={{ marginLeft: "1rem" }}>
        {loading ? "Processing..." : "Upload"}
      </button>

      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}

      {!loading && Object.keys(metadata).length > 0 && (
        <MetadataTable metadata={metadata} />
      )}

      {downloadReady && (
        <button onClick={handleDownloadExcel} style={{ marginTop: "1.5rem" }}>
          📥 Download Excel
        </button>
      )}
    </div>
  );
};

export default OCRUpload;
