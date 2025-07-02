import React from 'react';

const MetadataTable = ({ metadata }) => {
  if (!metadata || Object.keys(metadata).length === 0) return null;

  const apiBaseUrl = 'https://ocr-backend-production-cead.up.railway.app';

  const flattenObject = (obj, parentKey = '') => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const fullKey = parentKey ? `${parentKey}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(acc, flattenObject(value, fullKey));
      } else if (Array.isArray(value)) {
        acc[fullKey] = value.map((item, idx) =>
          typeof item === 'object' ? JSON.stringify(item) : item
        ).join('; ');
      } else {
        acc[fullKey] = value;
      }
      return acc;
    }, {});
  };

  const flatMetadata = flattenObject(metadata);

  return (
    <div className="my-6 bg-white shadow-lg rounded-md overflow-hidden border border-gray-200">
      <h2 className="text-lg font-semibold p-4 bg-gray-100 border-b">
        🧾 Extracted Patient / Procedure Details
      </h2>
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-200 text-gray-700">
          <tr>
            <th className="px-4 py-2 border-r w-1/3">Field</th>
            <th className="px-4 py-2">Value</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(flatMetadata).map(([key, value], index) => (
            <tr key={index} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2 font-medium text-gray-800">{key}</td>
              <td className="px-4 py-2 text-gray-700">
                {(key === 'Patient Signature' || key === 'Physician Signature') &&
                typeof value === 'string' &&
                value.includes('/signatures/') ? (
                  <img
                    src={`${apiBaseUrl}${value}`}
                    alt={key}
                    className="max-w-xs border rounded p-1 bg-white"
                    style={{ maxHeight: '100px' }}
                  />
                ) : (
                  value || '-'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MetadataTable;
