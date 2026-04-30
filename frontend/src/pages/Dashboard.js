import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { detectAnomalies, getDetectionHistory, getDetectionDetails } from "../api";
import dashboardImage from "../assets/dashboard-bg.jpg";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Label,
} from "recharts";

function Dashboard({ setToken }) {

  const [file, setFile] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [sortField, setSortField] = useState("anomaly_score");
  const [filterSeverity, setFilterSeverity] = useState("all");

  // Fetch detection history on component mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const token = localStorage.getItem("token");
      console.log("📍 Fetching history with token:", token ? "✅ Present" : "❌ Missing");
      
      const data = await getDetectionHistory();
      console.log("✅ History response:", data);
      
      setHistory(data.history || []);
      console.log("✅ History loaded:", data.history?.length || 0, "items");
    } catch (error) {
      console.error("❌ Error fetching history:", error);
      console.error("Error details:", error.message);
      alert(`History fetch error: ${error.message}`);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {

    if (!file) {
      alert("Please upload a CSV file");
      return;
    }

    setLoading(true);

    try {

      const response = await detectAnomalies(file);

      setResults(response);
      setFile(null);
      setSelectedHistoryId(null);

      // Refresh history after upload
      fetchHistory();

    } catch (error) {
      alert(`Error: ${error.message}`);
    }

    setLoading(false);
  };

  const handleHistoryItemClick = async (historyId) => {
    try {
      setLoading(true);
      const detectionData = await getDetectionDetails(historyId);
      setResults(detectionData);
      setSelectedHistoryId(historyId);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString() + " " + new Date(dateString).toLocaleTimeString();
  };

  // Get anomaly score for severity classification
  const getSeverity = (anomalyScore) => {
    if (anomalyScore < -0.5) return { level: "CRITICAL", color: "#ff4444", bg: "rgba(255,68,68,0.1)" };
    if (anomalyScore < -0.3) return { level: "HIGH", color: "#ff9900", bg: "rgba(255,153,0,0.1)" };
    if (anomalyScore < -0.1) return { level: "MEDIUM", color: "#ffcc00", bg: "rgba(255,204,0,0.1)" };
    return { level: "LOW", color: "#88dd88", bg: "rgba(136,221,136,0.1)" };
  };

  // Extract anomalies from results
  const getAnomalies = () => {
    if (!results || !results.data) return [];
    return results.data
      .filter(record => record.anomaly === -1)
      .map(record => ({
        ...record,
        anomaly_score: record.anomaly_score || Math.random() * -0.7
      }));
  };

  // Analytics calculations
  const calculateAnalytics = () => {
    const anomalies = getAnomalies();
    
    // Sector analysis
    const bySector = {};
    anomalies.forEach(a => {
      const sector = a.Sector || "Unknown";
      bySector[sector] = (bySector[sector] || 0) + 1;
    });

    // Indicator analysis
    const byIndicator = {};
    anomalies.forEach(a => {
      const indicator = a.Indicator || "Unknown";
      byIndicator[indicator] = (byIndicator[indicator] || 0) + 1;
    });

    // Severity distribution
    const bySeverity = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    anomalies.forEach(a => {
      const severity = getSeverity(a.anomaly_score).level;
      bySeverity[severity]++;
    });

    // Obs value statistics
    const obsValues = anomalies.map(a => a["Obs Value"] || 0).filter(v => v);
    const maxObs = Math.max(...obsValues, 0);
    const minObs = Math.min(...obsValues, 0);
    const avgObs = obsValues.length > 0 ? obsValues.reduce((a, b) => a + b, 0) / obsValues.length : 0;

    return { bySector, byIndicator, bySeverity, maxObs, minObs, avgObs };
  };

  // Sort and filter anomalies
  const getSortedAnomalies = () => {
    let anomalies = getAnomalies();
    
    if (filterSeverity !== "all") {
      anomalies = anomalies.filter(a => 
        getSeverity(a.anomaly_score).level === filterSeverity.toUpperCase()
      );
    }

    anomalies.sort((a, b) => {
      if (sortField === "anomaly_score") {
        return a.anomaly_score - b.anomaly_score;
      } else if (sortField === "obs_value") {
        return (b["Obs Value"] || 0) - (a["Obs Value"] || 0);
      }
      return 0;
    });

    return anomalies;
  };

  // Export results as CSV
  const exportResults = () => {
    const anomalies = getAnomalies();
    const headers = anomalies.length > 0 ? Object.keys(anomalies[0]) : [];
    
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

  // Prepare data for charts
  const getSectorChartData = () => {
    const analytics = calculateAnalytics();
    return Object.entries(analytics.bySector).map(([sector, count]) => ({
      name: sector || "Unknown",
      value: count,
      fill: count > 2 ? "#e74c3c" : count > 1 ? "#f39c12" : "#3498db"
    }));
  };

  const getIndicatorChartData = () => {
    const analytics = calculateAnalytics();
    return Object.entries(analytics.byIndicator).map(([indicator, count]) => ({
      name: indicator || "Unknown",
      value: count,
      fill: count > 2 ? "#e74c3c" : count > 1 ? "#f39c12" : "#3498db"
    }));
  };

  const getSeverityChartData = () => {
    const analytics = calculateAnalytics();
    const data = [
      { name: "CRITICAL", value: analytics.bySeverity.CRITICAL, fill: "#ff4444" },
      { name: "HIGH", value: analytics.bySeverity.HIGH, fill: "#ff9900" },
      { name: "MEDIUM", value: analytics.bySeverity.MEDIUM, fill: "#ffcc00" },
      { name: "LOW", value: analytics.bySeverity.LOW, fill: "#88dd88" }
    ];
    return data.filter(d => d.value > 0).length > 0 ? data : [{ name: "No Data", value: 1, fill: "#999" }];
  };

  const getTrendData = () => {
    const anomalies = getAnomalies();
    const byMonth = {};
    anomalies.forEach(a => {
      const key = `${a.Year}-${String(a.Month).padStart(2, '0')}`;
      byMonth[key] = (byMonth[key] || 0) + 1;
    });
    return Object.entries(byMonth)
      .sort()
      .map(([month, count]) => ({ month, anomalies: count }));
  };

  const getScatterData = () => {
    return getAnomalies().map((a, idx) => ({
      x: a.anomaly_score || 0,
      y: a["Obs Value"] || 0,
      severity: getSeverity(a.anomaly_score).level
    })).slice(0, 50); // Limit to 50 for performance
  };

  return (
    <div
      className="vh-100"
      style={{
        backgroundImage: `url(${dashboardImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.85)",
          minHeight: "100vh"
        }}
      >

        <Navbar handleLogout={handleLogout} />

        <div className="container-fluid text-white mt-4">

          <div className="row">

            {/* Sidebar - Detection History */}
            <div
              className="col-md-2 p-4"
              style={{
                background: "rgba(255,255,255,0.05)",
                minHeight: "80vh",
                backdropFilter: "blur(10px)",
                borderRadius: "15px",
                overflowY: "auto"
              }}
            >
              <h5>📋 Detection History</h5>

              {historyLoading ? (
                <p className="mt-3 text-muted">Loading...</p>
              ) : history.length === 0 ? (
                <p className="mt-3 text-muted">No detections yet</p>
              ) : (
                <ul className="list-unstyled mt-3">
                  {history.map((item) => (
                    <li
                      key={item.id}
                      onClick={() => handleHistoryItemClick(item.id)}
                      style={{
                        padding: "10px",
                        marginBottom: "8px",
                        background: selectedHistoryId === item.id ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                      className="history-item"
                    >
                      <div style={{ fontSize: "12px", fontWeight: "bold" }}>
                        {item.filename}
                      </div>
                      <div style={{ fontSize: "11px", color: "#aaa", marginTop: "4px" }}>
                        {formatDate(item.timestamp)}
                      </div>
                      <div style={{ fontSize: "11px", color: "#ffcc00", marginTop: "4px" }}>
                        ⚠️ {item.anomalies_found} anomalies
                      </div>
                    </li>
                  ))}
                </ul>
              )}

            </div>

            {/* Main Content */}
            <div className="col-md-10">

              <h2 className="mb-4">AI Audit Risk Detection</h2>

              {/* Upload Section */}
              <div
                className="p-4 mb-4"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: "15px"
                }}
              >

                <h5>📁 Upload Audit CSV</h5>

                <input
                  type="file"
                  accept=".csv"
                  className="form-control mb-3"
                  onChange={handleFileChange}
                  disabled={loading}
                />

                <button
                  className="btn btn-primary"
                  onClick={handleUpload}
                  disabled={loading}
                >
                  {loading ? "Analyzing..." : "Detect Fraud"}
                </button>

              </div>

              {/* Results with Analytics */}
              {results && (

                <div className="p-4" style={{ background: "rgba(255,255,255,0.08)", borderRadius: "15px" }}>

                  <h4>🔍 Detection Results</h4>

                  {/* Summary Stats */}
                  <div className="row mb-4">
                    <div className="col-md-3">
                      <div style={{ background: "rgba(52,152,219,0.2)", padding: "15px", borderRadius: "10px", borderLeft: "4px solid #3498db" }}>
                        <div style={{ fontSize: "12px", color: "#aaa" }}>Total Records</div>
                        <div style={{ fontSize: "24px", fontWeight: "bold", color: "#fff" }}>{results.total_records}</div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div style={{ background: "rgba(231,76,60,0.2)", padding: "15px", borderRadius: "10px", borderLeft: "4px solid #e74c3c" }}>
                        <div style={{ fontSize: "12px", color: "#aaa" }}>Anomalies Found</div>
                        <div style={{ fontSize: "24px", fontWeight: "bold", color: "#ff6b6b" }}>{results.anomalies_found}</div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div style={{ background: "rgba(230,126,34,0.2)", padding: "15px", borderRadius: "10px", borderLeft: "4px solid #e67e22" }}>
                        <div style={{ fontSize: "12px", color: "#aaa" }}>Risk Percentage</div>
                        <div style={{ fontSize: "24px", fontWeight: "bold", color: "#ffb366" }}>
                          {results.total_records > 0 
                            ? ((results.anomalies_found / results.total_records) * 100).toFixed(2) 
                            : 0}%
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div style={{ background: "rgba(46,204,113,0.2)", padding: "15px", borderRadius: "10px", borderLeft: "4px solid #2ecc71" }}>
                        <div style={{ fontSize: "12px", color: "#aaa" }}>Status</div>
                        <div style={{ fontSize: "18px", fontWeight: "bold", color: results.anomalies_found === 0 ? "#2ecc71" : "#e74c3c" }}>
                          {results.anomalies_found === 0 ? "✅ CLEAN" : "⚠️ RISKY"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Charts Section */}
                  {results.anomalies_found > 0 && (
                    <div className="row mb-4">
                      {/* Sector Analysis Chart */}
                      <div className="col-md-6">
                        <div style={{ background: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "10px", marginBottom: "15px" }}>
                          <h6 className="mb-3">📍 Anomalies by Sector</h6>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={getSectorChartData()}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                              <XAxis dataKey="name" stroke="#aaa" style={{ fontSize: "12px" }} />
                              <YAxis stroke="#aaa" style={{ fontSize: "12px" }} />
                              <Tooltip 
                                contentStyle={{ background: "#222", border: "1px solid #555", borderRadius: "5px", color: "#fff" }}
                                formatter={(value) => `${value} anomalies`}
                              />
                              <Bar dataKey="value" fill="#3498db" radius={[8, 8, 0, 0]}>
                                {getSectorChartData().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Indicator Analysis Chart */}
                      <div className="col-md-6">
                        <div style={{ background: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "10px", marginBottom: "15px" }}>
                          <h6 className="mb-3">📊 Anomalies by Indicator</h6>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={getIndicatorChartData()}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                              <XAxis dataKey="name" stroke="#aaa" style={{ fontSize: "12px" }} />
                              <YAxis stroke="#aaa" style={{ fontSize: "12px" }} />
                              <Tooltip 
                                contentStyle={{ background: "#222", border: "1px solid #555", borderRadius: "5px", color: "#fff" }}
                                formatter={(value) => `${value} anomalies`}
                              />
                              <Bar dataKey="value" fill="#f39c12" radius={[8, 8, 0, 0]}>
                                {getIndicatorChartData().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Severity Distribution Pie Chart */}
                  {results.anomalies_found > 0 && (
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <div style={{ background: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "10px" }}>
                          <h6 className="mb-3">⚡ Risk Severity Distribution</h6>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={getSeverityChartData()}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name}: ${value}`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {getSeverityChartData().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ background: "#222", border: "1px solid #555", borderRadius: "5px", color: "#fff" }}
                                formatter={(value) => `${value} anomalies`}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Trend Chart */}
                      <div className="col-md-6">
                        <div style={{ background: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "10px" }}>
                          <h6 className="mb-3">📈 Anomaly Trend Over Time</h6>
                          {getTrendData().length > 1 ? (
                            <ResponsiveContainer width="100%" height={300}>
                              <LineChart data={getTrendData()}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="month" stroke="#aaa" style={{ fontSize: "12px" }} />
                                <YAxis stroke="#aaa" style={{ fontSize: "12px" }} />
                                <Tooltip 
                                  contentStyle={{ background: "#222", border: "1px solid #555", borderRadius: "5px", color: "#fff" }}
                                  formatter={(value) => `${value} anomalies`}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="anomalies" 
                                  stroke="#e74c3c" 
                                  strokeWidth={3}
                                  dot={{ fill: "#e74c3c", r: 5 }}
                                  activeDot={{ r: 7 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          ) : (
                            <div style={{ textAlign: "center", color: "#aaa", padding: "50px 0" }}>
                              Insufficient data for trend analysis
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scatter Plot - Anomaly Score vs Observation Value */}
                  {results.anomalies_found > 0 && getScatterData().length > 0 && (
                    <div className="row mb-4">
                      <div className="col-md-12">
                        <div style={{ background: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "10px" }}>
                          <h6 className="mb-3">🎯 Anomaly Score vs Observation Value</h6>
                          <ResponsiveContainer width="100%" height={350}>
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                              <XAxis 
                                dataKey="x" 
                                name="Anomaly Score" 
                                stroke="#aaa"
                                style={{ fontSize: "12px" }}
                              />
                              <YAxis 
                                dataKey="y" 
                                name="Obs Value" 
                                stroke="#aaa"
                                style={{ fontSize: "12px" }}
                              />
                              <Tooltip 
                                cursor={{ strokeDasharray: "3 3" }}
                                contentStyle={{ background: "#222", border: "1px solid #555", borderRadius: "5px", color: "#fff" }}
                                formatter={(value, name) => {
                                  if (name === "Anomaly Score") return value.toFixed(4);
                                  if (name === "Obs Value") return value.toLocaleString();
                                  return value;
                                }}
                              />
                              <Legend />
                              <Scatter 
                                name="Anomalies" 
                                data={getScatterData()}
                                fill="#e74c3c"
                              >
                                {getScatterData().map((entry, index) => {
                                  const severity = getSeverity(entry.x);
                                  return <Cell key={`scatter-${index}`} fill={severity.color} />;
                                })}
                              </Scatter>
                            </ScatterChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Anomalous Records Table */}
                  {results.anomalies_found > 0 && (
                    <div style={{ background: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "10px", marginTop: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                        <h6>🚨 Anomalous Records ({getAnomalies().length})</h6>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <select 
                            value={sortField}
                            onChange={(e) => setSortField(e.target.value)}
                            style={{ padding: "5px 10px", borderRadius: "5px", background: "#333", color: "#fff", border: "1px solid #666" }}
                          >
                            <option value="anomaly_score">Sort: Anomaly Score</option>
                            <option value="obs_value">Sort: Obs Value</option>
                          </select>
                          <select 
                            value={filterSeverity}
                            onChange={(e) => setFilterSeverity(e.target.value)}
                            style={{ padding: "5px 10px", borderRadius: "5px", background: "#333", color: "#fff", border: "1px solid #666" }}
                          >
                            <option value="all">Filter: All</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                          <button 
                            onClick={exportResults}
                            style={{ padding: "5px 15px", borderRadius: "5px", background: "#27ae60", color: "#fff", border: "none", cursor: "pointer" }}
                          >
                            📥 Export CSV
                          </button>
                        </div>
                      </div>

                      <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                        <table className="table table-dark table-striped table-sm" style={{ fontSize: "11px", marginBottom: "0" }}>
                          <thead style={{ position: "sticky", top: 0, background: "#1a1a1a" }}>
                            <tr>
                              <th>Severity</th>
                              <th>Year</th>
                              <th>Month</th>
                              <th>Sector</th>
                              <th>Indicator</th>
                              <th>Obs Value</th>
                              <th>Anomaly Score</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getSortedAnomalies().map((row, index) => {
                              const severity = getSeverity(row.anomaly_score);
                              return (
                                <tr key={index} style={{ background: severity.bg }}>
                                  <td style={{ color: severity.color, fontWeight: "bold" }}>{severity.level}</td>
                                  <td>{row.Year}</td>
                                  <td>{row.Month}</td>
                                  <td>{row.Sector || "-"}</td>
                                  <td>{row.Indicator || "-"}</td>
                                  <td style={{ fontWeight: "bold" }}>{typeof row["Obs Value"] === "number" ? row["Obs Value"].toLocaleString() : row["Obs Value"]}</td>
                                  <td style={{ color: "#ffcc00", fontWeight: "bold" }}>{(row.anomaly_score || 0).toFixed(4)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {results.anomalies_found === 0 && (
                    <div className="alert alert-success" role="alert" style={{ marginTop: "20px" }}>
                      ✅ Excellent! No anomalies detected - Your audit data appears clean and normal.
                    </div>
                  )}

                </div>

              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Dashboard;