import React, { useState } from 'react';
import axios from 'axios';

const OCRUpload = () => {
  const [files, setFiles] = useState([]);
  const [allMetadata, setAllMetadata] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);

  const apiBaseUrl = "https://ocr-backend-production-cead.up.railway.app";

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length > 10) {
      alert('⚠️ You can upload up to 10 PDF files only.');
      return;
    }
    setFiles(selected);
    setAllMetadata([]);
    setDownloadReady(false);
  };

  const handleUploadAll = async () => {
    if (!files || files.length === 0) return;

    setLoading(true);
    try {
      const all = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await axios.post(`${apiBaseUrl}/api/ocr`, formData);
        const meta = res.data.metadata || {};
        meta['File Name'] = file.name;
        meta['Patient Signature'] = res.data.patient_signature;
        meta['Physician Signature'] = res.data.physician_signature;

        all.push(meta);

        await axios.post(`${apiBaseUrl}/api/export-excel`, { metadata: meta });
      }

      setAllMetadata(all);
      setDownloadReady(true);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    const res = await axios.post(`${apiBaseUrl}/api/export-excel`, {}, {
      responseType: 'blob'
    });
    const url = URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'metadata_output.xlsx');
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div style={{
      fontFamily: 'Segoe UI, sans-serif',
      maxWidth: '1100px',
      margin: '0 auto',
      padding: '2rem'
    }}>
      <h2 style={{ fontSize: '26px', marginBottom: '1rem' }}>
        📄 PDF-OCR EXTRACTION TOOL
      </h2>

      <div style={{ marginBottom: '1.5rem' }}>
        <input type="file" accept=".pdf" multiple onChange={handleFileChange} />
        <button onClick={handleUploadAll} style={{
          marginLeft: '1rem',
          backgroundColor: '#007BFF',
          color: '#fff',
          padding: '0.6rem 1.2rem',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 500
        }}>
          Upload All
        </button>
      </div>

      {files.length > 0 && (
        <ul style={{ listStyle: 'none', paddingLeft: 0, marginBottom: '1rem' }}>
          {files.map((file, index) => (
            <li key={index} style={{ fontSize: '14px', marginBottom: '4px' }}>📎 {file.name}</li>
          ))}
        </ul>
      )}

      {loading && <p style={{ fontWeight: 'bold' }}>⏳ Extracting metadata...</p>}

      {allMetadata.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '20px' }}>📋 Extracted Metadata</h3>

          {allMetadata.map((meta, fileIndex) => (
            <div key={fileIndex} style={{
              marginBottom: '2rem',
              border: '1px solid #ccc',
              padding: '1rem',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <h4 style={{ marginBottom: '1rem', fontWeight: '600' }}>{meta['File Name']}</h4>

              <table style={{
                borderCollapse: 'collapse',
                width: '100%',
                fontSize: '15px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                    <th style={{
                      border: '1px solid #ddd',
                      padding: '10px',
                      textAlign: 'left',
                      fontWeight: 'bold'
                    }}>Field</th>
                    <th style={{
                      border: '1px solid #ddd',
                      padding: '10px',
                      textAlign: 'left',
                      fontWeight: 'bold'
                    }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(meta).map(([key, value], i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                      <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '500' }}>{key}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                        {(key === 'Patient Signature' || key === 'Physician Signature') && value?.includes('/signatures/')
                          ? <img
                              src={`http://localhost:5000${value}`}
                              alt={key}
                              style={{
                                maxWidth: '260px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                padding: '4px',
                                background: '#fff'
                              }}
                            />
                          : value
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
