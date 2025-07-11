/**
 * Advanced Analytics & Reporting Module
 * Custom dashboards, advanced charts, export capabilities, and predictive analytics
 */

class AdvancedAnalyticsManager {
  constructor() {
    this.dashboards = new Map();
    this.chartInstances = new Map();
    this.reportTemplates = new Map();
    this.analyticsData = {
      operations: [],
      ships: [],
      performance: [],
      predictions: []
    };
    
    this.config = {
      chartLibraries: {
        chartjs: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js',
        d3: 'https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js',
        plotly: 'https://cdn.plot.ly/plotly-latest.min.js'
      },
      exportFormats: ['pdf', 'excel', 'csv', 'json'],
      refreshIntervals: {
        realtime: 5000,
        frequent: 30000,
        standard: 300000
      }
    };
    
    this.init();
  }

  /**
   * Initialize Advanced Analytics
   */
  async init() {
    await this.loadChartLibraries();
    this.initializeCustomDashboards();
    this.initializeAdvancedCharts();
    this.initializeExportSystem();
    this.initializePredictiveAnalytics();
    this.setupAnalyticsEventListeners();
    
    console.log('Advanced Analytics initialized successfully');
  }

  /**
   * Load chart libraries dynamically
   */
  async loadChartLibraries() {
    const libraries = ['chartjs', 'd3', 'plotly'];
    
    for (const lib of libraries) {
      try {
        await this.loadScript(this.config.chartLibraries[lib]);
        console.log(`${lib} loaded successfully`);
      } catch (error) {
        console.warn(`Failed to load ${lib}:`, error);
      }
    }
  }

  /**
   * Load external script
   */
  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Initialize Custom Dashboards
   */
  initializeCustomDashboards() {
    this.dashboardBuilder = new DashboardBuilder();
    this.setupDefaultDashboards();
    this.setupDashboardPersistence();
  }

  /**
   * Setup default dashboards
   */
  setupDefaultDashboards() {
    // Operations Dashboard
    this.dashboards.set('operations', {
      id: 'operations',
      name: 'Operations Overview',
      layout: 'grid',
      widgets: [
        { type: 'kpi', title: 'Total Ships', metric: 'ship_count', size: 'small' },
        { type: 'kpi', title: 'Active Operations', metric: 'active_ops', size: 'small' },
        { type: 'chart', title: 'Throughput Trend', chartType: 'line', size: 'large' },
        { type: 'chart', title: 'Port Utilization', chartType: 'gauge', size: 'medium' },
        { type: 'heatmap', title: 'Berth Activity', size: 'large' },
        { type: 'table', title: 'Recent Operations', size: 'large' }
      ]
    });

    // Performance Dashboard
    this.dashboards.set('performance', {
      id: 'performance',
      name: 'Performance Analytics',
      layout: 'flex',
      widgets: [
        { type: 'chart', title: 'Efficiency Trends', chartType: 'area', size: 'large' },
        { type: 'chart', title: 'Equipment Utilization', chartType: 'bar', size: 'medium' },
        { type: 'chart', title: 'Turnaround Times', chartType: 'scatter', size: 'medium' },
        { type: 'gantt', title: 'Operations Timeline', size: 'xlarge' },
        { type: 'sankey', title: 'Resource Flow', size: 'large' }
      ]
    });

    // Predictive Dashboard
    this.dashboards.set('predictive', {
      id: 'predictive',
      name: 'Predictive Analytics',
      layout: 'dashboard',
      widgets: [
        { type: 'forecast', title: 'Traffic Forecast', size: 'large' },
        { type: 'anomaly', title: 'Anomaly Detection', size: 'medium' },
        { type: 'optimization', title: 'Resource Optimization', size: 'medium' },
        { type: 'risk', title: 'Risk Assessment', size: 'large' }
      ]
    });
  }

  /**
   * Initialize Advanced Charts
   */
  initializeAdvancedCharts() {
    this.chartTypes = {
      // Basic Charts
      line: this.createLineChart.bind(this),
      bar: this.createBarChart.bind(this),
      pie: this.createPieChart.bind(this),
      
      // Advanced Charts
      heatmap: this.createHeatmapChart.bind(this),
      gauge: this.createGaugeChart.bind(this),
      sankey: this.createSankeyChart.bind(this),
      gantt: this.createGanttChart.bind(this),
      scatter: this.createScatterChart.bind(this),
      bubble: this.createBubbleChart.bind(this),
      radar: this.createRadarChart.bind(this),
      treemap: this.createTreemapChart.bind(this),
      
      // 3D Charts
      surface: this.createSurfaceChart.bind(this),
      mesh3d: this.createMesh3DChart.bind(this),
      
      // Specialized Maritime Charts
      portLayout: this.createPortLayoutChart.bind(this),
      vesselTracker: this.createVesselTrackerChart.bind(this),
      tideChart: this.createTideChart.bind(this)
    };
  }

  /**
   * Create advanced heatmap chart
   */
  createHeatmapChart(container, data, options) {
    const config = {
      data: [{
        z: data.values,
        x: data.xLabels,
        y: data.yLabels,
        type: 'heatmap',
        colorscale: 'Viridis',
        hoverongaps: false
      }],
      layout: {
        title: options.title,
        xaxis: { title: options.xTitle },
        yaxis: { title: options.yTitle },
        responsive: true
      }
    };

    return Plotly.newPlot(container, config.data, config.layout);
  }

  /**
   * Create gauge chart
   */
  createGaugeChart(container, data, options) {
    const config = {
      data: [{
        type: 'indicator',
        mode: 'gauge+number+delta',
        value: data.value,
        domain: { x: [0, 1], y: [0, 1] },
        title: { text: options.title },
        delta: { reference: data.reference },
        gauge: {
          axis: { range: [null, data.max] },
          bar: { color: data.color },
          steps: data.steps,
          threshold: {
            line: { color: 'red', width: 4 },
            thickness: 0.75,
            value: data.threshold
          }
        }
      }],
      layout: {
        responsive: true,
        margin: { t: 25, r: 25, l: 25, b: 25 }
      }
    };

    return Plotly.newPlot(container, config.data, config.layout);
  }

  /**
   * Create Sankey diagram
   */
  createSankeyChart(container, data, options) {
    const config = {
      data: [{
        type: 'sankey',
        orientation: 'h',
        node: {
          pad: 15,
          thickness: 30,
          line: {
            color: 'black',
            width: 0.5
          },
          label: data.nodes,
          color: data.nodeColors
        },
        link: {
          source: data.sources,
          target: data.targets,
          value: data.values,
          color: data.linkColors
        }
      }],
      layout: {
        title: options.title,
        font: { size: 10 },
        responsive: true
      }
    };

    return Plotly.newPlot(container, config.data, config.layout);
  }

  /**
   * Create Gantt chart
   */
  createGanttChart(container, data, options) {
    const traces = data.tasks.map(task => ({
      x: [task.start, task.end],
      y: [task.name, task.name],
      type: 'scatter',
      mode: 'lines',
      line: {
        color: task.color,
        width: 20
      },
      hovertemplate: `<b>${task.name}</b><br>` +
                    `Start: ${task.start}<br>` +
                    `End: ${task.end}<br>` +
                    `Duration: ${task.duration}<extra></extra>`
    }));

    const config = {
      data: traces,
      layout: {
        title: options.title,
        xaxis: { 
          title: 'Timeline',
          type: 'date'
        },
        yaxis: { 
          title: 'Tasks',
          categoryorder: 'category ascending'
        },
        responsive: true,
        showlegend: false
      }
    };

    return Plotly.newPlot(container, config.data, config.layout);
  }

  /**
   * Create port layout visualization
   */
  createPortLayoutChart(container, data, options) {
    const berths = data.berths.map(berth => ({
      x: berth.x,
      y: berth.y,
      mode: 'markers+text',
      type: 'scatter',
      marker: {
        size: berth.size,
        color: berth.status === 'occupied' ? 'red' : 'green',
        symbol: 'square'
      },
      text: berth.name,
      textposition: 'middle center',
      name: 'Berths'
    }));

    const ships = data.ships.map(ship => ({
      x: ship.x,
      y: ship.y,
      mode: 'markers+text',
      type: 'scatter',
      marker: {
        size: ship.size,
        color: 'blue',
        symbol: 'triangle-up'
      },
      text: ship.name,
      textposition: 'top center',
      name: 'Ships'
    }));

    const config = {
      data: [...berths, ...ships],
      layout: {
        title: 'Port Layout',
        xaxis: { title: 'X Coordinate' },
        yaxis: { title: 'Y Coordinate' },
        responsive: true,
        showlegend: true
      }
    };

    return Plotly.newPlot(container, config.data, config.layout);
  }

  /**
   * Initialize Export System
   */
  initializeExportSystem() {
    this.exportManager = new ExportManager();
    this.setupExportTemplates();
  }

  /**
   * Setup export templates
   */
  setupExportTemplates() {
    this.reportTemplates.set('operations_summary', {
      name: 'Operations Summary',
      type: 'summary',
      sections: ['overview', 'charts', 'tables', 'recommendations'],
      schedule: 'daily'
    });

    this.reportTemplates.set('performance_analysis', {
      name: 'Performance Analysis',
      type: 'analysis',
      sections: ['kpis', 'trends', 'comparisons', 'insights'],
      schedule: 'weekly'
    });

    this.reportTemplates.set('executive_dashboard', {
      name: 'Executive Dashboard',
      type: 'executive',
      sections: ['summary', 'highlights', 'alerts', 'projections'],
      schedule: 'monthly'
    });
  }

  /**
   * Initialize Predictive Analytics
   */
  initializePredictiveAnalytics() {
    this.predictiveEngine = new PredictiveEngine();
    this.setupPredictiveModels();
    this.setupAnomalyDetection();
  }

  /**
   * Setup predictive models
   */
  setupPredictiveModels() {
    this.models = {
      trafficForecast: new TrafficForecastModel(),
      maintenancePrediction: new MaintenancePredictionModel(),
      resourceOptimization: new ResourceOptimizationModel(),
      riskAssessment: new RiskAssessmentModel()
    };
  }

  /**
   * Setup anomaly detection
   */
  setupAnomalyDetection() {
    this.anomalyDetector = new AnomalyDetector({
      threshold: 2.5,
      windowSize: 100,
      features: ['throughput', 'turnaround_time', 'efficiency']
    });
  }

  /**
   * Setup analytics event listeners
   */
  setupAnalyticsEventListeners() {
    // Real-time data updates
    document.addEventListener('dataUpdate', (event) => {
      this.handleDataUpdate(event.detail);
    });

    // Dashboard interactions
    document.addEventListener('dashboardInteraction', (event) => {
      this.handleDashboardInteraction(event.detail);
    });

    // Export requests
    document.addEventListener('exportRequest', (event) => {
      this.handleExportRequest(event.detail);
    });
  }

  /**
   * Handle data update
   */
  handleDataUpdate(data) {
    // Update analytics data
    this.analyticsData[data.type] = data.payload;
    
    // Refresh affected charts
    this.refreshCharts(data.type);
    
    // Run predictive analysis
    this.runPredictiveAnalysis(data);
    
    // Detect anomalies
    this.detectAnomalies(data);
  }

  /**
   * Refresh charts
   */
  refreshCharts(dataType) {
    this.chartInstances.forEach((chart, id) => {
      if (chart.dataType === dataType) {
        this.updateChart(id, this.analyticsData[dataType]);
      }
    });
  }

  /**
   * Update chart
   */
  updateChart(chartId, data) {
    const chart = this.chartInstances.get(chartId);
    if (chart && chart.update) {
      chart.update(data);
    }
  }

  /**
   * Run predictive analysis
   */
  async runPredictiveAnalysis(data) {
    try {
      const predictions = await Promise.all([
        this.models.trafficForecast.predict(data),
        this.models.maintenancePrediction.predict(data),
        this.models.resourceOptimization.optimize(data),
        this.models.riskAssessment.assess(data)
      ]);

      this.analyticsData.predictions = predictions;
      this.updatePredictiveCharts(predictions);
    } catch (error) {
      console.error('Predictive analysis failed:', error);
    }
  }

  /**
   * Detect anomalies
   */
  detectAnomalies(data) {
    const anomalies = this.anomalyDetector.detect(data);
    
    if (anomalies.length > 0) {
      this.handleAnomalies(anomalies);
    }
  }

  /**
   * Handle anomalies
   */
  handleAnomalies(anomalies) {
    anomalies.forEach(anomaly => {
      // Create alert
      const alert = {
        type: 'anomaly',
        severity: anomaly.severity,
        message: `Anomaly detected in ${anomaly.feature}: ${anomaly.description}`,
        timestamp: Date.now(),
        data: anomaly
      };

      // Trigger notification
      if (window.advancedPWAManager) {
        window.advancedPWAManager.sendLocalNotification('alert_critical', alert);
      }

      // Update anomaly dashboard
      this.updateAnomalyDashboard(anomaly);
    });
  }

  /**
   * Create custom dashboard
   */
  createCustomDashboard(config) {
    const dashboard = new CustomDashboard(config);
    this.dashboards.set(config.id, dashboard);
    return dashboard;
  }

  /**
   * Export dashboard
   */
  async exportDashboard(dashboardId, format, options = {}) {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    return this.exportManager.export(dashboard, format, options);
  }

  /**
   * Generate report
   */
  async generateReport(templateId, options = {}) {
    const template = this.reportTemplates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const report = await this.reportGenerator.generate(template, options);
    return report;
  }

  /**
   * Schedule report
   */
  scheduleReport(templateId, schedule, recipients) {
    const template = this.reportTemplates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    return this.reportScheduler.schedule(template, schedule, recipients);
  }

  /**
   * Get analytics insights
   */
  getAnalyticsInsights() {
    const insights = {
      performance: this.calculatePerformanceMetrics(),
      trends: this.identifyTrends(),
      predictions: this.analyticsData.predictions,
      anomalies: this.getRecentAnomalies(),
      recommendations: this.generateRecommendations()
    };

    return insights;
  }

  /**
   * Calculate performance metrics
   */
  calculatePerformanceMetrics() {
    const data = this.analyticsData.operations;
    
    return {
      throughput: this.calculateThroughput(data),
      efficiency: this.calculateEfficiency(data),
      turnaroundTime: this.calculateTurnaroundTime(data),
      utilization: this.calculateUtilization(data)
    };
  }

  /**
   * Calculate throughput
   */
  calculateThroughput(data) {
    const totalContainers = data.reduce((sum, op) => sum + op.containers, 0);
    const totalTime = data.reduce((sum, op) => sum + op.duration, 0);
    return totalContainers / (totalTime / 3600); // containers per hour
  }

  /**
   * Calculate efficiency
   */
  calculateEfficiency(data) {
    const completed = data.filter(op => op.status === 'completed').length;
    return (completed / data.length) * 100;
  }

  /**
   * Identify trends
   */
  identifyTrends() {
    const data = this.analyticsData.operations;
    const trends = {};

    // Throughput trend
    trends.throughput = this.calculateTrendDirection(
      data.map(op => op.throughput)
    );

    // Efficiency trend
    trends.efficiency = this.calculateTrendDirection(
      data.map(op => op.efficiency)
    );

    return trends;
  }

  /**
   * Calculate trend direction
   */
  calculateTrendDirection(values) {
    if (values.length < 2) return 'stable';
    
    const recent = values.slice(-10);
    const slope = this.calculateSlope(recent);
    
    if (slope > 0.1) return 'increasing';
    if (slope < -0.1) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate slope
   */
  calculateSlope(values) {
    const n = values.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    const metrics = this.calculatePerformanceMetrics();
    const trends = this.identifyTrends();
    const recommendations = [];

    // Performance recommendations
    if (metrics.efficiency < 80) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Improve Operational Efficiency',
        description: 'Current efficiency is below target. Consider optimizing resource allocation.',
        actions: ['Review staffing levels', 'Optimize equipment deployment', 'Analyze bottlenecks']
      });
    }

    // Trend recommendations
    if (trends.throughput === 'decreasing') {
      recommendations.push({
        type: 'trend',
        priority: 'medium',
        title: 'Address Declining Throughput',
        description: 'Throughput has been declining. Investigation recommended.',
        actions: ['Analyze recent changes', 'Review maintenance schedules', 'Check equipment status']
      });
    }

    return recommendations;
  }

  /**
   * Get recent anomalies
   */
  getRecentAnomalies() {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return this.anomalyDetector.getAnomalies()
      .filter(anomaly => anomaly.timestamp > oneDayAgo);
  }
}

/**
 * Dashboard Builder Class
 */
class DashboardBuilder {
  constructor() {
    this.widgets = new Map();
    this.layouts = ['grid', 'flex', 'dashboard'];
  }

  createWidget(type, config) {
    const widget = new Widget(type, config);
    this.widgets.set(widget.id, widget);
    return widget;
  }

  createLayout(type, widgets) {
    return new Layout(type, widgets);
  }
}

/**
 * Export Manager Class
 */
class ExportManager {
  constructor() {
    this.formats = ['pdf', 'excel', 'csv', 'json', 'png'];
  }

  async export(data, format, options = {}) {
    switch (format) {
      case 'pdf':
        return this.exportToPDF(data, options);
      case 'excel':
        return this.exportToExcel(data, options);
      case 'csv':
        return this.exportToCSV(data, options);
      case 'json':
        return this.exportToJSON(data, options);
      case 'png':
        return this.exportToPNG(data, options);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  async exportToPDF(data, options) {
    // Implementation for PDF export
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.text('Stevedores Dashboard Report', 20, 20);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
    
    // Add data sections
    let yPos = 50;
    Object.entries(data).forEach(([key, value]) => {
      doc.text(`${key}: ${JSON.stringify(value)}`, 20, yPos);
      yPos += 10;
    });
    
    return doc.output('blob');
  }

  async exportToExcel(data, options) {
    // Implementation for Excel export using SheetJS
    const XLSX = window.XLSX;
    const wb = XLSX.utils.book_new();
    
    Object.entries(data).forEach(([sheetName, sheetData]) => {
      const ws = XLSX.utils.json_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });
    
    return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  }

  exportToCSV(data, options) {
    const csv = this.convertToCSV(data);
    return new Blob([csv], { type: 'text/csv' });
  }

  exportToJSON(data, options) {
    const json = JSON.stringify(data, null, 2);
    return new Blob([json], { type: 'application/json' });
  }

  convertToCSV(data) {
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(header => row[header]).join(','));
    return [headers.join(','), ...rows].join('\n');
  }
}

/**
 * Predictive Engine Classes
 */
class PredictiveEngine {
  constructor() {
    this.models = new Map();
  }

  addModel(name, model) {
    this.models.set(name, model);
  }

  async predict(modelName, data) {
    const model = this.models.get(modelName);
    if (!model) {
      throw new Error(`Model ${modelName} not found`);
    }
    return model.predict(data);
  }
}

class TrafficForecastModel {
  async predict(data) {
    // Simple linear regression for demonstration
    const values = data.historical.map(d => d.traffic);
    const trend = this.calculateTrend(values);
    const seasonal = this.calculateSeasonality(values);
    
    return {
      forecast: values[values.length - 1] + trend,
      confidence: 0.8,
      seasonality: seasonal
    };
  }

  calculateTrend(values) {
    // Simple trend calculation
    const n = values.length;
    const recent = values.slice(-10);
    const older = values.slice(-20, -10);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    return recentAvg - olderAvg;
  }

  calculateSeasonality(values) {
    // Basic seasonality detection
    return values.reduce((sum, val, i) => sum + Math.sin(i * 2 * Math.PI / 12), 0) / values.length;
  }
}

class AnomalyDetector {
  constructor(config) {
    this.threshold = config.threshold || 2.5;
    this.windowSize = config.windowSize || 100;
    this.features = config.features || [];
    this.anomalies = [];
  }

  detect(data) {
    const anomalies = [];
    
    this.features.forEach(feature => {
      const values = data.map(d => d[feature]).filter(v => v != null);
      const anomaly = this.detectFeatureAnomaly(feature, values);
      if (anomaly) {
        anomalies.push(anomaly);
      }
    });

    this.anomalies.push(...anomalies);
    return anomalies;
  }

  detectFeatureAnomaly(feature, values) {
    if (values.length < this.windowSize) return null;
    
    const recent = values.slice(-this.windowSize);
    const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
    const std = Math.sqrt(recent.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recent.length);
    
    const latest = values[values.length - 1];
    const zScore = Math.abs(latest - mean) / std;
    
    if (zScore > this.threshold) {
      return {
        feature,
        value: latest,
        zScore,
        severity: zScore > 3 ? 'high' : 'medium',
        description: `${feature} value ${latest} is ${zScore.toFixed(2)} standard deviations from normal`,
        timestamp: Date.now()
      };
    }
    
    return null;
  }

  getAnomalies() {
    return this.anomalies;
  }
}

// Initialize Advanced Analytics Manager
const advancedAnalyticsManager = new AdvancedAnalyticsManager();

// Export for global use
window.advancedAnalyticsManager = advancedAnalyticsManager;

export default advancedAnalyticsManager;