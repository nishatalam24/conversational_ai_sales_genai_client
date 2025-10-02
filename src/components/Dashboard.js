import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getApiUrl } from '../config';

const Dashboard = ({ data, onFilterChange }) => {
  const [activeFilters, setActiveFilters] = useState({});
  const [availableStates] = useState(['California', 'Texas', 'Florida', 'New York', 'Nevada', 'Illinois']);
  const [availableCategories] = useState(['Furniture', 'Technology', 'Office Supplies']);
  const [chartsLoaded, setChartsLoaded] = useState(false);
  const [googleChartsLoaded, setGoogleChartsLoaded] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const scriptRef = useRef(null);
  const dashboardRef = useRef(null); // Add ref for PDF capture
  
  const chartRefs = {
    pieChart: useRef(null),
    barChart: useRef(null),
    lineChart: useRef(null),
    geoChart: useRef(null)
  };

  // PDF Download Function
  const downloadPDF = async () => {
    if (!data || !dashboardRef.current) {
      alert('No data available to generate report');
      return;
    }

    setIsGeneratingPDF(true);
    
    try {
      // Create a clone of the dashboard for PDF generation
      const element = dashboardRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Remove interactive elements from clone
          const interactiveElements = clonedDoc.querySelectorAll('button, select, input');
          interactiveElements.forEach(el => el.style.display = 'none');
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 10);
      const location = data.summary?.location || 'All-Regions';
      const filename = `Sales-Report-${location}-${timestamp}.pdf`;

      pdf.save(filename);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // ... (keep all your existing chart drawing logic) ...
  const drawCharts = useCallback(() => {
    console.log('🎨 Drawing enhanced charts...');
    console.log('📊 Data received:', data);
    console.log('📊 Chart data:', data?.chartData);
    
    if (!data || !window.google?.visualization || !data.summary) {
      console.log('❌ Requirements not met:', {
        hasData: !!data,
        hasGoogle: !!window.google?.visualization,
        hasSummary: !!data?.summary
      });
      return;
    }

    const { chartData } = data;

    // 1. Enhanced Category Pie Chart
    if (chartData?.categoryBreakdown?.length > 0 && chartRefs.pieChart.current) {
      console.log('🥧 Drawing pie chart with', chartData.categoryBreakdown.length, 'categories');
      
      try {
        const pieData = new window.google.visualization.DataTable();
        pieData.addColumn('string', 'Category');
        pieData.addColumn('number', 'Sales');
        
        chartData.categoryBreakdown.forEach(item => {
          pieData.addRow([item.category || 'Unknown', item.sales || 0]);
        });

        const pieOptions = {
          title: 'Sales Distribution by Category',
          titleTextStyle: { 
            fontSize: 20, 
            color: '#2d3748', 
            bold: true,
            fontName: 'Segoe UI'
          },
          pieHole: 0.45,
          colors: [
            '#667eea', '#764ba2', '#f093fb', '#f5576c', 
            '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
          ],
          backgroundColor: 'transparent',
          legend: { 
            position: 'bottom', 
            textStyle: { 
              fontSize: 14, 
              color: '#4a5568',
              fontName: 'Segoe UI'
            },
            alignment: 'center'
          },
          chartArea: { 
            width: '90%', 
            height: '75%', 
            top: 70,
            left: 20,
            right: 20
          },
          pieSliceText: 'value',
          pieSliceTextStyle: { 
            fontSize: 13, 
            color: 'white',
            bold: true
          },
          tooltip: { 
            textStyle: { fontSize: 14 },
            showColorCode: true,
            trigger: 'both'
          },
          pieStartAngle: 45,
          sliceVisibilityThreshold: 0.02
        };

        const pieChart = new window.google.visualization.PieChart(chartRefs.pieChart.current);
        pieChart.draw(pieData, pieOptions);
        console.log('✅ Pie chart drawn successfully');
      } catch (error) {
        console.error('❌ Error drawing pie chart:', error);
      }
    }

    // 2. Enhanced Bar Chart
    if (chartData?.cityBreakdown?.length > 0 && chartRefs.barChart.current) {
      console.log('📊 Drawing bar chart with', chartData.cityBreakdown.length, 'cities');
      
      try {
        const barData = new window.google.visualization.DataTable();
        barData.addColumn('string', 'City');
        barData.addColumn('number', 'Sales');
        barData.addColumn({type: 'string', role: 'style'});
        
        const colors = [
          '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe',
          '#00f2fe', '#43e97b', '#38f9d7', '#fa709a', '#fee140'
        ];

        chartData.cityBreakdown.slice(0, 10).forEach((item, index) => {
          barData.addRow([
            item.city || 'Unknown', 
            item.sales || 0,
            `fill-color: ${colors[index % colors.length]}`
          ]);
        });

        const barOptions = {
          title: 'Top 10 Cities Performance',
          titleTextStyle: { 
            fontSize: 20, 
            color: '#2d3748', 
            bold: true,
            fontName: 'Segoe UI'
          },
          hAxis: { 
            title: 'Sales Revenue ($)', 
            format: 'currency',
            titleTextStyle: { fontSize: 16, color: '#4a5568', bold: true },
            textStyle: { fontSize: 13, color: '#4a5568' },
            gridlines: { color: '#e2e8f0', count: 5 }
          },
          vAxis: { 
            title: 'Cities',
            titleTextStyle: { fontSize: 16, color: '#4a5568', bold: true },
            textStyle: { fontSize: 13, color: '#4a5568' }
          },
          backgroundColor: 'transparent',
          chartArea: { 
            width: '75%', 
            height: '75%', 
            top: 70,
            left: 120
          },
          bar: { groupWidth: '80%' },
          animation: { 
            duration: 1500, 
            easing: 'out',
            startup: true
          },
          tooltip: {
            textStyle: { fontSize: 14 }
          }
        };

        const barChart = new window.google.visualization.BarChart(chartRefs.barChart.current);
        barChart.draw(barData, barOptions);
        console.log('✅ Bar chart drawn successfully');
      } catch (error) {
        console.error('❌ Error drawing bar chart:', error);
      }
    }

    // 3. Enhanced Line Chart
    if (chartData?.timeSeries?.length > 0 && chartRefs.lineChart.current) {
      console.log('📈 Drawing line chart with', chartData.timeSeries.length, 'data points');
      
      try {
        const lineData = new window.google.visualization.DataTable();
        lineData.addColumn('date', 'Date');
        lineData.addColumn('number', 'Sales');
        
        chartData.timeSeries.forEach(item => {
          const date = new Date(item.date);
          if (!isNaN(date.getTime())) {
            lineData.addRow([date, item.sales || 0]);
          }
        });

        if (lineData.getNumberOfRows() > 0) {
          const lineOptions = {
            title: 'Sales Trends Over Time',
            titleTextStyle: { 
              fontSize: 20, 
              color: '#2d3748', 
              bold: true,
              fontName: 'Segoe UI'
            },
            hAxis: { 
              title: 'Time Period', 
              format: 'MMM yyyy',
              titleTextStyle: { fontSize: 16, color: '#4a5568', bold: true },
              textStyle: { fontSize: 13, color: '#4a5568' },
              gridlines: { color: '#e2e8f0' }
            },
            vAxis: { 
              title: 'Sales Revenue ($)', 
              format: 'currency',
              titleTextStyle: { fontSize: 16, color: '#4a5568', bold: true },
              textStyle: { fontSize: 13, color: '#4a5568' },
              gridlines: { color: '#e2e8f0' }
            },
            backgroundColor: 'transparent',
            colors: ['#667eea'],
            chartArea: { 
              width: '80%', 
              height: '75%', 
              top: 70,
              left: 80
            },
            lineWidth: 4,
            pointSize: 8,
            curveType: 'function',
            animation: { 
              duration: 1500, 
              easing: 'out',
              startup: true
            },
            areaOpacity: 0.2,
            tooltip: {
              textStyle: { fontSize: 14 }
            }
          };

          const lineChart = new window.google.visualization.AreaChart(chartRefs.lineChart.current);
          lineChart.draw(lineData, lineOptions);
          console.log('✅ Line chart drawn successfully');
        }
      } catch (error) {
        console.error('❌ Error drawing line chart:', error);
      }
    }

    // 4. Enhanced Geographic Chart
    if (data.mapData?.length > 0 && chartRefs.geoChart.current) {
      console.log('🗺️ Drawing geo chart with', data.mapData.length, 'locations');
      
      try {
        const geoData = new window.google.visualization.DataTable();
        geoData.addColumn('string', 'State');
        geoData.addColumn('number', 'Sales');
        
        const stateData = {};
        data.mapData.forEach(item => {
          const state = item.state || 'Unknown';
          if (state !== 'Unknown' && state) {
            stateData[state] = (stateData[state] || 0) + (item.sales || 0);
          }
        });

        Object.entries(stateData).forEach(([state, sales]) => {
          if (sales > 0) {
            geoData.addRow([state, sales]);
          }
        });

        if (geoData.getNumberOfRows() > 0) {
          const geoOptions = {
            title: 'Geographic Sales Distribution',
            titleTextStyle: { 
              fontSize: 20, 
              color: '#2d3748', 
              bold: true,
              fontName: 'Segoe UI'
            },
            region: 'US',
            resolution: 'provinces',
            backgroundColor: 'transparent',
            colorAxis: { 
              colors: ['#e3f2fd', '#667eea', '#764ba2'],
              minValue: 0
            },
            chartArea: { 
              width: '90%', 
              height: '80%', 
              top: 70
            },
            tooltip: { 
              textStyle: { fontSize: 14 }
            }
          };

          const geoChart = new window.google.visualization.GeoChart(chartRefs.geoChart.current);
          geoChart.draw(geoData, geoOptions);
          console.log('✅ Geo chart drawn successfully');
        }
      } catch (error) {
        console.error('❌ Error drawing geo chart:', error);
      }
    }

    setChartsLoaded(true);
  }, [data]);

  // ... (keep all your existing useEffect hooks) ...
  useEffect(() => {
    if (window.google?.charts) {
      setGoogleChartsLoaded(true);
      if (data) {
        drawCharts();
      }
      return;
    }

    if (!document.querySelector('script[src*="gstatic.com/charts/loader.js"]') && !scriptRef.current) {
      console.log('📚 Loading Google Charts...');
      
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/charts/loader.js';
      script.async = true;
      scriptRef.current = script;
      
      script.onload = () => {
        console.log('📚 Google Charts script loaded');
        if (window.google?.charts) {
          window.google.charts.load('current', { 
            packages: ['corechart', 'geochart']
          });
          window.google.charts.setOnLoadCallback(() => {
            console.log('📚 Google Charts packages loaded');
            setGoogleChartsLoaded(true);
            if (data) {
              setTimeout(drawCharts, 100);
            }
          });
        }
      };
      
      script.onerror = () => {
        console.error('❌ Failed to load Google Charts');
        scriptRef.current = null;
      };
      
      document.head.appendChild(script);
    }

    return () => {
      if (scriptRef.current && document.head.contains(scriptRef.current)) {
        try {
          document.head.removeChild(scriptRef.current);
        } catch (error) {
          console.warn('Script already removed:', error.message);
        }
        scriptRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (data && googleChartsLoaded && window.google?.visualization) {
      console.log('📊 Data changed, redrawing charts...');
      drawCharts();
    }
  }, [data, googleChartsLoaded, drawCharts]);

  // ... (keep all your existing filter functions) ...
  const applyFilter = async (filterType, value) => {
    const newFilters = { ...activeFilters, [filterType]: value };
    setActiveFilters(newFilters);
    
    if (onFilterChange) {
      try {
      const response = await fetch(getApiUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `Show me sales data for ${Object.entries(newFilters).map(([k,v]) => `${k}: ${v}`).join(', ')}`,
            chatHistory: []
          })
        });
        
        const result = await response.json();
        if (result.dashboardData) {
          onFilterChange(result.dashboardData);
        }
      } catch (error) {
        console.error('Error applying filter:', error);
      }
    }
  };

  const clearFilters = async () => {
    setActiveFilters({});
    if (onFilterChange) {
      try {
        const response = await fetch('http://localhost:5001/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: 'Show me all sales data',
            chatHistory: []
          })
        });
        
        const result = await response.json();
        if (result.dashboardData) {
          onFilterChange(result.dashboardData);
        }
      } catch (error) {
        console.error('Error clearing filters:', error);
      }
    }
  };

  if (!data || !data.summary) {
    return (
      <div className="dashboard-placeholder">
        <div className="placeholder-header">
          <h2>🚀 AI Sales Analytics Hub</h2>
          <p>Transform your data into actionable insights with intelligent visualizations!</p>
        </div>
        
        <div className="quick-filters">
          <h3>🎯 Quick Analysis:</h3>
          <div className="filter-buttons">
            {availableStates.map(state => (
              <button 
                key={state}
                onClick={() => applyFilter('state', state)}
                className="filter-btn state-btn"
              >
                📍 {state}
              </button>
            ))}
            {availableCategories.map(category => (
              <button 
                key={category}
                onClick={() => applyFilter('category', category)}
                className="filter-btn category-btn"
              >
                📦 {category}
              </button>
            ))}
          </div>
        </div>

        <div className="placeholder-grid">
          <div className="placeholder-card regional">
            <div className="card-icon">📍</div>
            <h3>Regional Performance</h3>
            <p>"Analyze California vs Texas sales"</p>
            <div className="card-accent"></div>
          </div>
          <div className="placeholder-card category">
            <div className="card-icon">📊</div>
            <h3>Category Insights</h3>
            <p>"Compare Furniture vs Technology"</p>
            <div className="card-accent"></div>
          </div>
          <div className="placeholder-card trends">
            <div className="card-icon">📈</div>
            <h3>Trend Analysis</h3>
            <p>"Show sales growth over time"</p>
            <div className="card-accent"></div>
          </div>
          <div className="placeholder-card performance">
            <div className="card-icon">🏆</div>
            <h3>Top Performers</h3>
            <p>"Find best selling products"</p>
            <div className="card-accent"></div>
          </div>
        </div>
      </div>
    );
  }

  const { summary, insights } = data;

  return (
    <div className="dashboard" ref={dashboardRef}>
      {/* Enhanced Header with PDF Download */}
      <div className="dashboard-header">
        <div className="header-background"></div>
        <div className="header-content">
          <div className="header-top">
            <div className="header-title">
              <h2>📊 Sales Analytics Dashboard</h2>
              <p className="dashboard-subtitle">{summary.location || 'All Regions'}</p>
            </div>
            
            {/* PDF Download Button */}
            <div className="header-actions">
              <button 
                onClick={downloadPDF}
                disabled={isGeneratingPDF}
                className="pdf-download-btn"
              >
                {isGeneratingPDF ? (
                  <>
                    <div className="pdf-loading-spinner"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    📄 Download PDF
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="header-stats">
            <span className="stat-bubble">💰 ${(summary.totalSales || 0).toLocaleString()}</span>
            <span className="stat-bubble">🛒 {(summary.totalTransactions || 0).toLocaleString()}</span>
            <span className="stat-bubble">💵 ${(summary.avgTransactionValue || 0).toLocaleString()}</span>
          </div>
        </div>
        
        {/* Enhanced Filter Controls */}
        <div className="filter-controls">
          <div className="filter-row">
            <div className="select-wrapper">
              <select 
                value={activeFilters.state || ''} 
                onChange={(e) => applyFilter('state', e.target.value)}
                className="filter-select"
              >
                <option value="">🌎 All States</option>
                {availableStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            
            <div className="select-wrapper">
              <select 
                value={activeFilters.category || ''} 
                onChange={(e) => applyFilter('category', e.target.value)}
                className="filter-select"
              >
                <option value="">📦 All Categories</option>
                {availableCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <button onClick={clearFilters} className="clear-filters-btn">
              🗑️ Clear All
            </button>
          </div>
          
          {Object.keys(activeFilters).length > 0 && (
            <div className="active-filters">
              <span className="filter-label">🔍 Active Filters:</span>
              {Object.entries(activeFilters).map(([key, value]) => (
                <span key={key} className="filter-tag">
                  {key}: {value}
                  <button 
                    onClick={() => {
                      const newFilters = {...activeFilters};
                      delete newFilters[key];
                      setActiveFilters(newFilters);
                    }}
                    className="remove-filter"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced KPI Cards */}
      <div className="kpi-section">
        <h3 className="section-title">📊 Key Performance Indicators</h3>
        <div className="kpi-grid">
          <div className="kpi-card revenue">
            <div className="kpi-background"></div>
            <div className="kpi-icon">💰</div>
            <div className="kpi-content">
              <h4>Total Revenue</h4>
              <p className="kpi-value">${(summary.totalSales || 0).toLocaleString()}</p>
              <span className="kpi-trend">📈 Sales Performance</span>
            </div>
            <div className="kpi-sparkline"></div>
          </div>
          
          <div className="kpi-card transactions">
            <div className="kpi-background"></div>
            <div className="kpi-icon">🛒</div>
            <div className="kpi-content">
              <h4>Total Orders</h4>
              <p className="kpi-value">{(summary.totalTransactions || 0).toLocaleString()}</p>
              <span className="kpi-trend">📦 Transaction Volume</span>
            </div>
            <div className="kpi-sparkline"></div>
          </div>
          
          <div className="kpi-card average">
            <div className="kpi-background"></div>
            <div className="kpi-icon">💵</div>
            <div className="kpi-content">
              <h4>Average Order Value</h4>
              <p className="kpi-value">${(summary.avgTransactionValue || 0).toLocaleString()}</p>
              <span className="kpi-trend">💎 Order Value</span>
            </div>
            <div className="kpi-sparkline"></div>
          </div>
        </div>
      </div>

      {/* Enhanced Insights */}
      {insights && insights.length > 0 && (
        <div className="insights-section">
          <h3 className="section-title">🔍 AI-Powered Insights</h3>
          <div className="insights-grid">
            {insights.map((insight, index) => (
              <div key={index} className="insight-card">
                <div className="insight-background"></div>
                <span className="insight-icon">💡</span>
                <p className="insight-text">{insight}</p>
                <div className="insight-accent"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Charts Section */}
      <div className="charts-section">
        <h3 className="section-title">📈 Interactive Visualizations</h3>
        <div className="charts-grid">
          <div className="chart-card pie-chart-card">
            <div className="chart-header">
              <h4>📊 Category Distribution</h4>
              <div className="chart-controls">
                <button className="chart-btn">📷</button>
                <button className="chart-btn">🔄</button>
              </div>
            </div>
            <div className="chart-container">
              <div ref={chartRefs.pieChart} className="google-chart">
                {!chartsLoaded && !googleChartsLoaded && (
                  <div className="chart-loading">
                    <div className="loading-spinner"></div>
                    <p>Generating visualization...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="chart-card bar-chart-card">
            <div className="chart-header">
              <h4>🏙️ City Performance</h4>
              <div className="chart-controls">
                <button className="chart-btn">📷</button>
                <button className="chart-btn">🔄</button>
              </div>
            </div>
            <div className="chart-container">
              <div ref={chartRefs.barChart} className="google-chart">
                {!chartsLoaded && !googleChartsLoaded && (
                  <div className="chart-loading">
                    <div className="loading-spinner"></div>
                    <p>Generating visualization...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="chart-card line-chart-card">
            <div className="chart-header">
              <h4>📈 Sales Timeline</h4>
              <div className="chart-controls">
                <button className="chart-btn">📷</button>
                <button className="chart-btn">🔄</button>
              </div>
            </div>
            <div className="chart-container">
              <div ref={chartRefs.lineChart} className="google-chart">
                {!chartsLoaded && !googleChartsLoaded && (
                  <div className="chart-loading">
                    <div className="loading-spinner"></div>
                    <p>Generating visualization...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="chart-card geo-chart-card">
            <div className="chart-header">
              <h4>🗺️ Geographic Heatmap</h4>
              <div className="chart-controls">
                <button className="chart-btn">📷</button>
                <button className="chart-btn">🔄</button>
              </div>
            </div>
            <div className="chart-container">
              <div ref={chartRefs.geoChart} className="google-chart">
                {!chartsLoaded && !googleChartsLoaded && (
                  <div className="chart-loading">
                    <div className="loading-spinner"></div>
                    <p>Generating visualization...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;