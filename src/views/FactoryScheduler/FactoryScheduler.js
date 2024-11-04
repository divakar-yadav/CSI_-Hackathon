import React, { useState } from 'react';
import ReactJson from 'react-json-view';
import './FactoryScheduler.css';

const FactoryScheduler = () => {
  const [inputJson, setInputJson] = useState('');
  const [plannedSchedule, setPlannedSchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState(null);

  const createSchedule = async () => {
    setIsLoading(true);
    setIsCopied(false);
    setError(null);

    try {
      const parsedData = JSON.parse(inputJson);

      // POST request to the API endpoint
      const response = await fetch('https://api.syncpro.cloud/generate-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedData),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      setPlannedSchedule(data);
    } catch (apiError) {
      console.error('API request failed:', apiError);
      // Fallback to hardcoded schedule
      const fallbackSchedule = {
        "13862": {
          ProductionUnit: "BI4 Machine",
          ProcessOrder: "513904663",
          ProductionPlanStatus: "Active",
          Prod_Id: 1252,
          Forecast: {
            StartTime: 1725628920000,
            EndTime: 1725682679000,
            Quantity: 202.18,
          },
          Grade: "Grade4",
          OptimizedSchedule: {
            StartTime: 1725628920000 + 3600000,
            EndTime: 1725682679000 - 3600000,
          },
        },
      };
      setPlannedSchedule(fallbackSchedule);
      setError('Failed to fetch schedule from API. Displaying fallback schedule.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (plannedSchedule) {
      navigator.clipboard.writeText(JSON.stringify(plannedSchedule, null, 2));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset copied status after 2 seconds
    }
  };

  return (
    <div className="container">
      <h2 className="header">Factory Production Scheduler Demo</h2>
      <p className="instructions">
        Paste the order and demand JSON data below to generate an optimized production schedule.
      </p>
      <textarea
        rows="10"
        value={inputJson}
        onChange={(e) => setInputJson(e.target.value)}
        placeholder="Paste the JSON input here"
      />
      <button className="generate-button" onClick={createSchedule} disabled={isLoading}>
        {isLoading ? 'Creating Schedule...' : 'Generate Planned Schedule'}
      </button>
      {isLoading && <p className="loading-text">Processing... Please wait.</p>}
      {error && <p className="error-text">{error}</p>}
      {plannedSchedule && (
        <div className="output-container">
          <button className="copy-button" onClick={copyToClipboard}>
            {isCopied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          <h3>Generated Planned Schedule:</h3>
          <ReactJson
            src={plannedSchedule}
            theme="monokai"
            name={false}
            iconStyle="triangle"
            enableClipboard={false}
            displayDataTypes={false}
            collapsed={1} // Start with data collapsed to one level
          />
        </div>
      )}
    </div>
  );
};

export default FactoryScheduler;
