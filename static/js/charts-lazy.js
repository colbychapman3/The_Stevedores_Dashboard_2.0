/**
 * Lazy-loaded Charts Module
 * Chart.js integration with dynamic loading
 */

class ChartManager {
  constructor() {
    this.charts = {};
    this.chartLibraryLoaded = false;
  }

  /**
   * Load Chart.js library dynamically
   */
  async loadChartLibrary() {
    if (this.chartLibraryLoaded) {
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
      script.onload = () => {
        this.chartLibraryLoaded = true;
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Chart.js library'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Initialize all charts
   */
  async initializeCharts() {
    await this.loadChartLibrary();
    
    // Initialize progress chart
    this.createProgressChart();
    
    // Initialize vehicle distribution chart
    this.createVehicleDistributionChart();
    
    // Initialize status overview chart
    this.createStatusOverviewChart();
  }

  /**
   * Create progress doughnut chart
   */
  createProgressChart() {
    const ctx = document.getElementById('progressChart');
    if (!ctx) return;

    this.charts.progress = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'In Progress', 'Pending'],
        datasets: [{
          data: [0, 0, 0],
          backgroundColor: [
            '#22c55e',
            '#3b82f6',
            '#f59e0b'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }

  /**
   * Create vehicle distribution bar chart
   */
  createVehicleDistributionChart() {
    const ctx = document.getElementById('vehicleChart');
    if (!ctx) return;

    this.charts.vehicle = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Trucks', 'Cranes', 'Forklifts', 'Containers'],
        datasets: [{
          label: 'Count',
          data: [0, 0, 0, 0],
          backgroundColor: [
            '#3b82f6',
            '#10b981',
            '#f59e0b',
            '#8b5cf6'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  /**
   * Create status overview chart
   */
  createStatusOverviewChart() {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;

    this.charts.status = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Active', 'Docked', 'Maintenance'],
        datasets: [{
          data: [0, 0, 0],
          backgroundColor: [
            '#22c55e',
            '#3b82f6',
            '#ef4444'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  /**
   * Update all charts with new data
   */
  updateCharts(shipsData) {
    if (!shipsData || shipsData.length === 0) {
      return;
    }

    this.updateProgressChart(shipsData);
    this.updateVehicleChart(shipsData);
    this.updateStatusChart(shipsData);
  }

  /**
   * Update progress chart
   */
  updateProgressChart(shipsData) {
    if (!this.charts.progress) return;

    const completed = shipsData.filter(ship => ship.status === 'completed').length;
    const inProgress = shipsData.filter(ship => ship.status === 'in_progress').length;
    const pending = shipsData.filter(ship => ship.status === 'pending').length;

    this.charts.progress.data.datasets[0].data = [completed, inProgress, pending];
    this.charts.progress.update('none');
  }

  /**
   * Update vehicle chart
   */
  updateVehicleChart(shipsData) {
    if (!this.charts.vehicle) return;

    const vehicles = shipsData.reduce((acc, ship) => {
      if (ship.vehicles) {
        acc.trucks += ship.vehicles.trucks || 0;
        acc.cranes += ship.vehicles.cranes || 0;
        acc.forklifts += ship.vehicles.forklifts || 0;
        acc.containers += ship.vehicles.containers || 0;
      }
      return acc;
    }, { trucks: 0, cranes: 0, forklifts: 0, containers: 0 });

    this.charts.vehicle.data.datasets[0].data = [
      vehicles.trucks,
      vehicles.cranes,
      vehicles.forklifts,
      vehicles.containers
    ];
    this.charts.vehicle.update('none');
  }

  /**
   * Update status chart
   */
  updateStatusChart(shipsData) {
    if (!this.charts.status) return;

    const active = shipsData.filter(ship => ship.status === 'active').length;
    const docked = shipsData.filter(ship => ship.status === 'docked').length;
    const maintenance = shipsData.filter(ship => ship.status === 'maintenance').length;

    this.charts.status.data.datasets[0].data = [active, docked, maintenance];
    this.charts.status.update('none');
  }

  /**
   * Destroy all charts
   */
  destroy() {
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    this.charts = {};
  }
}

// Create and export chart manager
const chartManager = new ChartManager();

export default {
  init: async (element) => {
    await chartManager.initializeCharts();
    return chartManager;
  },
  chartManager
};