import { Grid } from "gridjs";
import "gridjs/dist/theme/mermaid.css";
import React, { useEffect, useRef } from 'react';

// Utility function to generate HTML table from data array
export const generateHtmlTable = (dataArray) => {
    if (!dataArray || dataArray.length === 0) return '<div>No data to display</div>';

    let tableHtml = '<table>';
    
    // Generate header row
    tableHtml += '<thead><tr>';
    Object.keys(dataArray[0]).forEach(column => {
        tableHtml += `<th>${column}</th>`;
    });
    tableHtml += '</tr></thead>';
    
    // Generate data rows
    tableHtml += '<tbody>';
    dataArray.forEach(row => {
        tableHtml += '<tr>';
        Object.values(row).forEach(cell => {
            tableHtml += `<td>${cell}</td>`;
        });
        tableHtml += '</tr>';
    });
    tableHtml += '</tbody>';
    tableHtml += '</table>'; // Close the table tag

    // Append a separate div for the row count below the table
    tableHtml += `<div class="table-row-count">Row Count: ${dataArray.length}</div>`;
    
    return tableHtml;
};

export const generateReportGrid = (dataArray) => {
    if (!dataArray || dataArray.length === 0) return null;

    // Extract column names from the first object's keys
    const columns = Object.keys(dataArray[0]).map(key => key.charAt(0).toUpperCase() + key.slice(1)); // Capitalize first letter of each column name

    // Construct the Grid object
    const grid = new Grid({
        columns: columns,
        data: dataArray.map(row => {
            // Convert each row object's keys to match the column names
            const formattedRow = {};
            Object.keys(row).forEach(key => {
                const formattedKey = key.charAt(0).toUpperCase() + key.slice(1); // Capitalize first letter
                formattedRow[formattedKey] = row[key];
            });
            return formattedRow;
        })
    });

    return grid;
};

export const GridComponent = ({ dataArray }) => {
    const gridRef = useRef(null);
  
    useEffect(() => {
      if (!dataArray || dataArray.length === 0) return '<div>No data to display</div>';
  
      // Extract column names from the first object's keys
      const columns = Object.keys(dataArray[0]);
  
      // Transform dataArray into an array of arrays for Grid.js data
      const data = dataArray.map(obj => Object.values(obj));
  
      // Initialize Grid.js with the determined columns and data
      const grid = new Grid({
        columns,
        data,
        search: true,
        sort: true,
        pagination: {
            limit: 5
        },
        fixedHeader: true,
        language: {
            'search': {
              'placeholder': 'Search for a value in any field'
            },
            'pagination': {
              'results': () => 'Records'
            }
          }
      }).render(gridRef.current);
  
      // Cleanup function to prevent memory leaks
      return () => {
        grid.destroy();
      };
    }, [dataArray]); // Re-initialize the grid if dataArray changes
  
    return <div ref={gridRef}></div>;
  };

// Utility function for syntax highlighting
export const highlightSyntax = (query, language) => {
    // Assuming you have a syntax highlighting library like highlight.js
    // This is a simplified example. Adjust according to your actual implementation.
    if (!query) return { __html: '' };
    const hljs = require('highlight.js'); // Import highlight.js
    const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
    const highlightedQuery = hljs.highlight(query, { language: validLanguage }).value;
    return { __html: highlightedQuery };
};

export const downloadReport = (reportArray, savedScenarioName, setDownloadedReportFlag) => {
    // Check if reportArray is not empty
    if (reportArray.length === 0) {
        console.error("Report array is empty.");
        return;
    }

    // Extract headers (keys of the objects)
    const headers = Object.keys(reportArray[0]);
    // Map each object to a CSV string, handling null values appropriately
    const csvRows = reportArray.map(row =>
        headers.map(fieldName => {
            const val = row[fieldName];
            // Handle null values and include quotes for strings to manage commas inside text
            return val === null ? "" : `"${val.toString().replace(/"/g, '""')}"`;
        }).join(',')
    );
    // Combine headers and rows, with headers as the first row
    const csvContent = [headers.join(','), ...csvRows].join('\n');

    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element and trigger the download
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${savedScenarioName}.csv`); // Name the file here
    document.body.appendChild(link);
    link.click();

    // Clean up by removing the temporary element and revoking the Blob URL
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadedReportFlag(true);
};