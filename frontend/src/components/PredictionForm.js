import React, { useState } from "react";
import { detectAnomalies } from "../api";

function PredictionForm() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setError("");
    } else {
      setError("Please select a valid CSV file");
      setFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a CSV file");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await detectAnomalies(file);
      setResult(response);
    } catch (err) {
      setError(err.message || "Failed to detect anomalies");
    } finally {
      setLoading(false);
    }
  };

  // Get anomalies from data
  const getAnomalies = () => {
    if (!result || !result.data) return [];
    return result.data.filter(record => record.anomaly === -1);
  };

  // Export anomalies as CSV
  const exportAnomalies = () => {
    const anomalies = getAnomalies();
    if (anomalies.length === 0) {
      alert("No anomalies to export");
      return;
    }

    const headers = Object.keys(anomalies[0]);
    let csv = headers.join(",") + "\n";
    anomalies.forEach(row => {
      csv += headers.map(h => {
        const val = row[h];
        return typeof val === "string" && val.includes(",") ? `"${val}"` : val;
      }).join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anomalies_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="card shadow p-4">
      <h4 className="mb-4">🔍 Advanced Anomaly Detection</h4>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="csvFile" className="form-label">
            Upload Audit CSV File
          </label>
          <input
            type="file"
            className="form-control"
            id="csvFile"
            accept=".csv"
            onChange={handleFileChange}
            required
          />
          <small className="form-text text-muted">
            Required columns: Year, Month, Sector, Indicator, Obs Value
          </small>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !file}
        >
          {loading ? "⏳ Analyzing..." : "🚀 Detect Anomalies"}
        </button>
      </form>

      {result && (
        <div className="mt-4">
          {/* Summary Cards */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="card" style={{ background: "rgba(52,152,219,0.1)", borderLeft: "4px solid #3498db" }}>
                <div className="card-body">
                  <h5 className="card-title">📊 Total Records</h5>
                  <p className="card-text" style={{ fontSize: "28px", fontWeight: "bold", color: "#3498db" }}>
                    {result.total_records}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card" style={{ background: "rgba(231,76,60,0.1)", borderLeft: "4px solid #e74c3c" }}>
                <div className="card-body">
                  <h5 className="card-title">⚠️ Anomalies Found</h5>
                  <p className="card-text" style={{ fontSize: "28px", fontWeight: "bold", color: "#e74c3c" }}>
                    {result.anomalies_found}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="alert alert-info">
            <strong>📈 Detection Analysis</strong>
            <p className="mt-2">
              <strong>Risk Percentage:</strong> {result.total_records > 0 ? ((result.anomalies_found / result.total_records) * 100).toFixed(2) : 0}%
              <br />
              <strong>Status:</strong> {result.anomalies_found === 0 ? "✅ CLEAN" : "🚨 RISKY"}
            </p>
          </div>

          {/* Anomalous Records Table */}
          {result.anomalies_found > 0 && (
            <div className="mt-3">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <strong>🚨 Anomalous Records ({getAnomalies().length}):</strong>
                <button
                  className="btn btn-sm btn-success"
                  onClick={exportAnomalies}
                >
                  📥 Export as CSV
                </button>
              </div>
              <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto" }}>
                <table className="table table-sm table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      {getAnomalies().length > 0 &&
                        Object.keys(getAnomalies()[0]).map((key) => (
                          <th key={key} style={{ fontSize: "12px" }}>{key}</th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {getAnomalies().map((row, idx) => (
                      <tr key={idx} style={{ background: "rgba(231,76,60,0.05)" }}>
                        {Object.entries(row).map(([key, val]) => (
                          <td key={key} style={{ fontSize: "11px" }}>
                            {typeof val === "number" ? val.toFixed(4) : val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {result.anomalies_found === 0 && (
            <div className="alert alert-success" role="alert">
              ✅ No anomalies detected - Your audit data looks clean!
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PredictionForm;
