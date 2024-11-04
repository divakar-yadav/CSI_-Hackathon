import React, { useState, useEffect } from 'react';
import ReactJson from 'react-json-view';
import './FactoryScheduler.css';

const FactoryScheduler = () => {
  const [inputData, setInputData] = useState({
    initialPOs: '',
    inventoryGradeCount: '',
    plannedDemandConverting: '',
    plannedDemandTM: '',
    reservedTimes: '',
    SKU_Converting_Specs_Dict: '',
    SKU_Pull_Rate_Dict: '',
    SKU_TM_Specs: '',
    currentTimeUTC: '',
    scrapFactor: '',
    planningRateDict: '',
  });
  const [plannedSchedule, setPlannedSchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState(null);

  // Load cached data from localStorage on component mount
  useEffect(() => {
    const cachedData = JSON.parse(localStorage.getItem('factorySchedulerInputData'));
    if (cachedData) {
      setInputData(cachedData);
    }
  }, []);

  const handleInputChange = (e, key) => {
    const updatedInputData = {
      ...inputData,
      [key]: e.target.value,
    };
    setInputData(updatedInputData);
    localStorage.setItem('factorySchedulerInputData', JSON.stringify(updatedInputData)); // Cache the input data
  };

  const createSchedule = async () => {
    setIsLoading(true);
    setIsCopied(false);
    setError(null);

    try {
      const sanitizedData = Object.fromEntries(
        Object.entries(inputData).map(([key, value]) => {
          const sanitizedValue = value.replace(/\bNaN\b|\bInfinity\b|\bundefined\b/g, 'null');
          try {
            return [key, JSON.parse(sanitizedValue)];
          } catch (parseError) {
            console.warn(`Failed to parse value for key "${key}":`, parseError);
            return [key, null];
          }
        })
      );

      const response = await fetch('https://api.syncpro.cloud/generate-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      setPlannedSchedule(data);
    } catch (apiError) {
      console.error('API request failed:', apiError);

      const fallbackSchedule = {
        ProductionUnit: {
          "13862": "BI4 Machine"
        },
        Prod_Id: {
          "13862": 1252
        },
        ForecastStartTime: {
          "13862": 1725628920000
        },
        ForecastEndTime: {
          "13862": 1725682679000
        },
        ForecastQuantity: {
          "13862": 202.18
        },
        Grade: {
          "13862": "Grade4"
        },
        OptimizedSchedule: {
          "13862": {
            StartTime: 1725628920000 + 3600000,
            EndTime: 1725682679000 - 3600000
          }
        }
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
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const downloadSchedule = () => {
    if (plannedSchedule) {
      const blob = new Blob([JSON.stringify(plannedSchedule, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'planningSchedule.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up the URL object
    }
  };

  const clearCache = () => {
    localStorage.removeItem('factorySchedulerInputData'); // Clear cached data from localStorage
    setInputData({
      initialPOs: '',
      inventoryGradeCount: '',
      plannedDemandConverting: '',
      plannedDemandTM: '',
      reservedTimes: '',
      SKU_Converting_Specs_Dict: '',
      SKU_Pull_Rate_Dict: '',
      SKU_TM_Specs: '',
      currentTimeUTC: '',
      scrapFactor: '',
      planningRateDict: '',
    });
  };

  return (
    <div className="container">
      <h2 className="header">Kimberly Clark Production Scheduler</h2>
      <p className="instructions">
        Paste the JSON data for each required input below to generate an optimized production schedule.
      </p>
      
      {Object.keys(inputData).map((key) => (
        <div key={key} className="input-container">
          <label>{key.replace(/_/g, ' ')}:</label>
          <textarea
            rows="5"
            value={inputData[key]}
            onChange={(e) => handleInputChange(e, key)}
            placeholder={`Paste the ${key} JSON here`}
          />
        </div>
      ))}

      <button className="generate-button" onClick={createSchedule} disabled={isLoading}>
        {isLoading ? 'Creating Schedule...' : 'Generate Planned Schedule'}
      </button>

      <button className="clear-cache-button" onClick={clearCache}>
        Clear Cache
      </button>

      {isLoading && <p className="loading-text">Processing... Please wait.</p>}
      {error && <p className="error-text">{error}</p>}

      {plannedSchedule && (
        <div className="output-container">
          <button className="copy-button" onClick={copyToClipboard}>
            {isCopied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          <button className="download-button" onClick={downloadSchedule}>
            Download Schedule
          </button>
          <h3>Generated Planned Schedule:</h3>
          <ReactJson
            src={plannedSchedule}
            theme="monokai"
            name={false}
            iconStyle="triangle"
            enableClipboard={false}
            displayDataTypes={false}
            collapsed={1}
          />
        </div>
      )}
    </div>
  );
};

export default FactoryScheduler;
