import { apiGateway } from './apiGateway'
import { analyticsService } from './analyticsService'

interface IoTDevice {
  id: string
  name: string
  type: 'sensor' | 'actuator' | 'gateway' | 'controller'
  location: string
  status: 'online' | 'offline' | 'error' | 'maintenance'
  lastSeen: Date
  batteryLevel?: number
  firmwareVersion: string
  metadata: Record<string, any>
}

interface IoTSensorData {
  deviceId: string
  timestamp: Date
  metrics: Record<string, number>
  location?: { lat: number; lng: number }
  quality: 'good' | 'fair' | 'poor'
  validated: boolean
}

interface IoTAlert {
  id: string
  deviceId: string
  type: 'threshold_exceeded' | 'device_offline' | 'battery_low' | 'data_anomaly'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: Date
  acknowledged: boolean
  resolvedAt?: Date
}

interface IoTConfiguration {
  deviceId: string
  samplingRate: number // seconds
  thresholds: Record<string, { min: number; max: number }>
  alertRules: Array<{
    condition: string
    action: string
    severity: IoTAlert['severity']
  }>
  dataRetention: number // days
}

interface EnvironmentalMetrics {
  temperature: number
  humidity: number
  airQuality: number
  co2Level: number
  noiseLevel: number
  lightLevel: number
  pressure: number
  uvIndex?: number
}

interface EnergyMetrics {
  powerConsumption: number
  voltage: number
  current: number
  frequency: number
  powerFactor: number
  energyTotal: number
  peakDemand: number
}

interface WaterMetrics {
  flow: number
  pressure: number
  quality: number
  temperature: number
  ph: number
  turbidity: number
  totalConsumption: number
}

class IoTConnectorService {
  private devices = new Map<string, IoTDevice>()
  private sensorData = new Map<string, IoTSensorData[]>()
  private alerts = new Map<string, IoTAlert[]>()
  private configurations = new Map<string, IoTConfiguration>()
  private websocket: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  constructor() {
    this.initializeConnection()
    this.startDataCollection()
  }

  // Device Management
  async registerDevice(device: Omit<IoTDevice, 'lastSeen'>): Promise<void> {
    const deviceWithTimestamp: IoTDevice = {
      ...device,
      lastSeen: new Date()
    }
    
    this.devices.set(device.id, deviceWithTimestamp)
    
    // Save to database
    await apiGateway.post('/rest/v1/iot_devices', deviceWithTimestamp)
    
    // Set up default configuration
    await this.setDeviceConfiguration(device.id, {
      deviceId: device.id,
      samplingRate: 60, // 1 minute
      thresholds: this.getDefaultThresholds(device.type),
      alertRules: this.getDefaultAlertRules(device.type),
      dataRetention: 365 // 1 year
    })

    console.log(`Device ${device.name} (${device.id}) registered successfully`)
  }

  async updateDeviceStatus(deviceId: string, status: IoTDevice['status']): Promise<void> {
    const device = this.devices.get(deviceId)
    if (device) {
      device.status = status
      device.lastSeen = new Date()
      
      await apiGateway.put(`/rest/v1/iot_devices?id=eq.${deviceId}`, {
        status,
        last_seen: device.lastSeen
      })

      // Generate alert if device goes offline
      if (status === 'offline' || status === 'error') {
        await this.generateAlert({
          deviceId,
          type: status === 'offline' ? 'device_offline' : 'data_anomaly',
          severity: 'high',
          message: `Device ${device.name} is ${status}`
        })
      }
    }
  }

  async getDevices(): Promise<IoTDevice[]> {
    return Array.from(this.devices.values())
  }

  async getDevice(deviceId: string): Promise<IoTDevice | undefined> {
    return this.devices.get(deviceId)
  }

  // Data Collection
  async collectSensorData(deviceId: string, data: Omit<IoTSensorData, 'deviceId' | 'timestamp'>): Promise<void> {
    const sensorData: IoTSensorData = {
      deviceId,
      timestamp: new Date(),
      ...data
    }

    // Validate data quality
    sensorData.validated = this.validateSensorData(sensorData)
    
    // Store locally
    if (!this.sensorData.has(deviceId)) {
      this.sensorData.set(deviceId, [])
    }
    this.sensorData.get(deviceId)!.push(sensorData)

    // Keep only recent data in memory (last 1000 readings)
    const deviceData = this.sensorData.get(deviceId)!
    if (deviceData.length > 1000) {
      deviceData.splice(0, deviceData.length - 1000)
    }

    // Save to database
    await apiGateway.post('/rest/v1/iot_sensor_data', sensorData)

    // Check thresholds and generate alerts
    await this.checkThresholds(deviceId, sensorData)

    // Update device last seen
    await this.updateDeviceStatus(deviceId, 'online')

    // Track analytics (placeholder until track method is implemented)
    console.log('IoT data received:', { device_id: deviceId, metrics_count: Object.keys(data.metrics).length })
  }

  // Environmental Monitoring
  async getEnvironmentalData(locationFilter?: string, timeRange = '24h'): Promise<{
    current: EnvironmentalMetrics
    historical: Array<{ timestamp: Date; metrics: EnvironmentalMetrics }>
    trends: Record<string, 'improving' | 'stable' | 'worsening'>
    alerts: IoTAlert[]
  }> {
    const environmentalDevices = Array.from(this.devices.values())
      .filter(d => d.type === 'sensor' && (!locationFilter || d.location === locationFilter))

    const allData: IoTSensorData[] = []
    environmentalDevices.forEach(device => {
      const deviceData = this.sensorData.get(device.id) || []
      allData.push(...deviceData)
    })

    // Filter by time range
    const timeRangeMs = this.parseTimeRange(timeRange)
    const cutoffTime = new Date(Date.now() - timeRangeMs)
    const filteredData = allData.filter(d => d.timestamp > cutoffTime)

    // Calculate current metrics (latest values)
    const current = this.calculateCurrentEnvironmentalMetrics(filteredData)
    
    // Historical data (hourly aggregates)
    const historical = this.aggregateEnvironmentalData(filteredData)
    
    // Calculate trends
    const trends = this.calculateEnvironmentalTrends(historical)
    
    // Get related alerts
    const alerts = this.getEnvironmentalAlerts(environmentalDevices.map(d => d.id))

    return { current, historical, trends, alerts }
  }

  // Energy Monitoring
  async getEnergyData(facilityId?: string): Promise<{
    realTime: EnergyMetrics
    consumption: Array<{ timestamp: Date; usage: number; cost: number }>
    efficiency: {
      current: number
      target: number
      improvement: number
    }
    carbonFootprint: {
      current: number
      reduction: number
      target: number
    }
    recommendations: string[]
  }> {
    const energyDevices = Array.from(this.devices.values())
      .filter(d => d.metadata?.category === 'energy')

    const energyData: IoTSensorData[] = []
    energyDevices.forEach(device => {
      const deviceData = this.sensorData.get(device.id) || []
      energyData.push(...deviceData.slice(-100)) // Last 100 readings
    })

    const realTime = this.calculateCurrentEnergyMetrics(energyData)
    const consumption = this.calculateEnergyConsumption(energyData)
    const efficiency = this.calculateEnergyEfficiency(consumption)
    const carbonFootprint = this.calculateCarbonFootprint(consumption)
    const recommendations = this.generateEnergyRecommendations(realTime, efficiency)

    return {
      realTime,
      consumption,
      efficiency,
      carbonFootprint,
      recommendations
    }
  }

  // Water Management
  async getWaterData(): Promise<{
    consumption: WaterMetrics
    quality: {
      score: number
      issues: string[]
      recommendations: string[]
    }
    leakDetection: {
      detected: boolean
      locations: string[]
      severity: 'minor' | 'major' | 'critical'
    }
    conservation: {
      savings: number
      target: number
      strategies: string[]
    }
  }> {
    const waterDevices = Array.from(this.devices.values())
      .filter(d => d.metadata?.category === 'water')

    const waterData: IoTSensorData[] = []
    waterDevices.forEach(device => {
      const deviceData = this.sensorData.get(device.id) || []
      waterData.push(...deviceData.slice(-50))
    })

    const consumption = this.calculateWaterMetrics(waterData)
    const quality = this.assessWaterQuality(waterData)
    const leakDetection = this.detectWaterLeaks(waterData)
    const conservation = this.calculateWaterConservation(waterData)

    return {
      consumption,
      quality,
      leakDetection,
      conservation
    }
  }

  // Alert Management
  private async generateAlert(alert: Omit<IoTAlert, 'id' | 'timestamp' | 'acknowledged'>): Promise<void> {
    const newAlert: IoTAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      acknowledged: false,
      ...alert
    }

    if (!this.alerts.has(alert.deviceId)) {
      this.alerts.set(alert.deviceId, [])
    }
    this.alerts.get(alert.deviceId)!.push(newAlert)

    // Save to database
    await apiGateway.post('/rest/v1/iot_alerts', newAlert)

    // Send real-time notification (placeholder)
    if (alert.severity === 'critical' || alert.severity === 'high') {
      console.log('Critical IoT alert:', { device_id: alert.deviceId, severity: alert.severity })
    }

    console.log(`IoT Alert: ${alert.message} (${alert.severity})`)
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    for (const deviceAlerts of this.alerts.values()) {
      const alert = deviceAlerts.find(a => a.id === alertId)
      if (alert) {
        alert.acknowledged = true
        await apiGateway.put(`/rest/v1/iot_alerts?id=eq.${alertId}`, {
          acknowledged: true
        })
        break
      }
    }
  }

  async getAlerts(deviceId?: string, severity?: IoTAlert['severity']): Promise<IoTAlert[]> {
    let alerts: IoTAlert[] = []
    
    if (deviceId) {
      alerts = this.alerts.get(deviceId) || []
    } else {
      for (const deviceAlerts of this.alerts.values()) {
        alerts.push(...deviceAlerts)
      }
    }

    if (severity) {
      alerts = alerts.filter(a => a.severity === severity)
    }

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Configuration Management
  async setDeviceConfiguration(deviceId: string, config: IoTConfiguration): Promise<void> {
    this.configurations.set(deviceId, config)
    
    await apiGateway.post('/rest/v1/iot_configurations', config)
    
    // Send configuration to device via WebSocket
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'configure',
        deviceId,
        config
      }))
    }
  }

  async getDeviceConfiguration(deviceId: string): Promise<IoTConfiguration | undefined> {
    return this.configurations.get(deviceId)
  }

  // Real-time Communication
  private initializeConnection(): void {
    try {
      const wsUrl = import.meta.env.VITE_IOT_WEBSOCKET_URL || 'ws://localhost:3001/iot'
      this.websocket = new WebSocket(wsUrl)

      this.websocket.onopen = () => {
        console.log('IoT WebSocket connected')
        this.reconnectAttempts = 0
      }

      this.websocket.onmessage = (event) => {
        this.handleWebSocketMessage(JSON.parse(event.data))
      }

      this.websocket.onclose = () => {
        console.log('IoT WebSocket disconnected')
        this.handleReconnection()
      }

      this.websocket.onerror = (error) => {
        console.error('IoT WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to initialize IoT connection:', error)
    }
  }

  private handleWebSocketMessage(message: any): void {
    switch (message.type) {
      case 'sensor_data':
        this.collectSensorData(message.deviceId, message.data)
        break
      case 'device_status':
        this.updateDeviceStatus(message.deviceId, message.status)
        break
      case 'alert':
        this.generateAlert(message.alert)
        break
      default:
        console.log('Unknown IoT message type:', message.type)
    }
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => {
        console.log(`Attempting IoT reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        this.initializeConnection()
      }, Math.pow(2, this.reconnectAttempts) * 1000)
    }
  }

  // Data Processing Helpers
  private validateSensorData(data: IoTSensorData): boolean {
    // Basic validation rules
    if (!data.metrics || Object.keys(data.metrics).length === 0) return false
    
    // Check for reasonable values
    for (const [key, value] of Object.entries(data.metrics)) {
      if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
        return false
      }
    }

    return true
  }

  private async checkThresholds(deviceId: string, data: IoTSensorData): Promise<void> {
    const config = this.configurations.get(deviceId)
    if (!config) return

    for (const [metric, value] of Object.entries(data.metrics)) {
      const threshold = config.thresholds[metric]
      if (!threshold) continue

      if (value < threshold.min || value > threshold.max) {
        await this.generateAlert({
          deviceId,
          type: 'threshold_exceeded',
          severity: this.calculateThresholdSeverity(value, threshold),
          message: `${metric} value ${value} exceeds threshold (${threshold.min}-${threshold.max})`
        })
      }
    }
  }

  private calculateThresholdSeverity(value: number, threshold: { min: number; max: number }): IoTAlert['severity'] {
    const deviation = Math.max(
      Math.abs(value - threshold.min) / Math.abs(threshold.min),
      Math.abs(value - threshold.max) / Math.abs(threshold.max)
    )

    if (deviation > 2) return 'critical'
    if (deviation > 1.5) return 'high'
    if (deviation > 1) return 'medium'
    return 'low'
  }

  private getDefaultThresholds(deviceType: IoTDevice['type']): Record<string, { min: number; max: number }> {
    const thresholds: Record<string, Record<string, { min: number; max: number }>> = {
      sensor: {
        temperature: { min: -20, max: 50 },
        humidity: { min: 0, max: 100 },
        co2: { min: 0, max: 5000 },
        noise: { min: 0, max: 120 }
      }
    }

    return thresholds[deviceType] || {}
  }

  private getDefaultAlertRules(deviceType: IoTDevice['type']): IoTConfiguration['alertRules'] {
    return [
      {
        condition: 'value > threshold.max',
        action: 'generate_alert',
        severity: 'medium'
      }
    ]
  }

  private startDataCollection(): void {
    // Simulate periodic data collection for demo
    setInterval(() => {
      this.simulateDeviceData()
    }, 30000) // Every 30 seconds
  }

  private simulateDeviceData(): void {
    // Simulate some environmental sensors
    const mockDevices = ['env_001', 'env_002', 'energy_001', 'water_001']
    
    mockDevices.forEach(deviceId => {
      if (!this.devices.has(deviceId)) {
        // Register mock device
        this.registerDevice({
          id: deviceId,
          name: `Mock ${deviceId}`,
          type: 'sensor',
          location: 'Building A',
          status: 'online',
          batteryLevel: 80 + Math.random() * 20,
          firmwareVersion: '1.0.0',
          metadata: { category: deviceId.includes('env') ? 'environmental' : deviceId.includes('energy') ? 'energy' : 'water' }
        })
      }

      // Generate mock data
      const metrics = this.generateMockMetrics(deviceId)
      this.collectSensorData(deviceId, {
        metrics,
        quality: 'good',
        validated: true
      })
    })
  }

  private generateMockMetrics(deviceId: string): Record<string, number> {
    if (deviceId.includes('env')) {
      return {
        temperature: 20 + Math.random() * 10,
        humidity: 40 + Math.random() * 30,
        co2: 400 + Math.random() * 600,
        noise: 30 + Math.random() * 40,
        airQuality: 50 + Math.random() * 50
      }
    } else if (deviceId.includes('energy')) {
      return {
        power: 1000 + Math.random() * 5000,
        voltage: 220 + Math.random() * 20,
        current: 5 + Math.random() * 20,
        frequency: 50 + Math.random() * 2
      }
    } else if (deviceId.includes('water')) {
      return {
        flow: 10 + Math.random() * 50,
        pressure: 2 + Math.random() * 3,
        quality: 70 + Math.random() * 30,
        temperature: 15 + Math.random() * 10
      }
    }
    return {}
  }

  // Environmental metrics calculations
  private calculateCurrentEnvironmentalMetrics(data: IoTSensorData[]): EnvironmentalMetrics {
    if (data.length === 0) {
      return {
        temperature: 0,
        humidity: 0,
        airQuality: 0,
        co2Level: 0,
        noiseLevel: 0,
        lightLevel: 0,
        pressure: 0
      }
    }

    const latest = data.slice(-10) // Last 10 readings
    return {
      temperature: this.average(latest, 'temperature'),
      humidity: this.average(latest, 'humidity'),
      airQuality: this.average(latest, 'airQuality'),
      co2Level: this.average(latest, 'co2'),
      noiseLevel: this.average(latest, 'noise'),
      lightLevel: this.average(latest, 'light') || 0,
      pressure: this.average(latest, 'pressure') || 0
    }
  }

  private aggregateEnvironmentalData(data: IoTSensorData[]): Array<{ timestamp: Date; metrics: EnvironmentalMetrics }> {
    // Group by hour and calculate averages
    const hourlyData = new Map<string, IoTSensorData[]>()
    
    data.forEach(d => {
      const hour = new Date(d.timestamp).toISOString().substring(0, 13)
      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, [])
      }
      hourlyData.get(hour)!.push(d)
    })

    return Array.from(hourlyData.entries()).map(([hour, hourData]) => ({
      timestamp: new Date(hour + ':00:00.000Z'),
      metrics: this.calculateCurrentEnvironmentalMetrics(hourData)
    }))
  }

  private calculateEnvironmentalTrends(historical: Array<{ timestamp: Date; metrics: EnvironmentalMetrics }>): Record<string, 'improving' | 'stable' | 'worsening'> {
    if (historical.length < 2) {
      return {
        temperature: 'stable',
        humidity: 'stable',
        airQuality: 'stable',
        co2Level: 'stable'
      }
    }

    const recent = historical.slice(-6) // Last 6 hours
    const older = historical.slice(-12, -6) // Previous 6 hours

    return {
      temperature: this.calculateTrend(recent, older, 'temperature'),
      humidity: this.calculateTrend(recent, older, 'humidity'),
      airQuality: this.calculateTrend(recent, older, 'airQuality'),
      co2Level: this.calculateTrend(recent, older, 'co2Level')
    }
  }

  private getEnvironmentalAlerts(deviceIds: string[]): IoTAlert[] {
    const alerts: IoTAlert[] = []
    deviceIds.forEach(deviceId => {
      const deviceAlerts = this.alerts.get(deviceId) || []
      alerts.push(...deviceAlerts.slice(-5)) // Last 5 alerts per device
    })
    return alerts
  }

  // Energy metrics calculations
  private calculateCurrentEnergyMetrics(data: IoTSensorData[]): EnergyMetrics {
    if (data.length === 0) {
      return {
        powerConsumption: 0,
        voltage: 0,
        current: 0,
        frequency: 0,
        powerFactor: 0,
        energyTotal: 0,
        peakDemand: 0
      }
    }

    const latest = data.slice(-5)
    return {
      powerConsumption: this.average(latest, 'power'),
      voltage: this.average(latest, 'voltage'),
      current: this.average(latest, 'current'),
      frequency: this.average(latest, 'frequency'),
      powerFactor: this.average(latest, 'powerFactor') || 0.85,
      energyTotal: this.sum(data, 'power') * 0.001, // Convert to kWh
      peakDemand: this.max(data, 'power')
    }
  }

  private calculateEnergyConsumption(data: IoTSensorData[]): Array<{ timestamp: Date; usage: number; cost: number }> {
    return data.slice(-24).map(d => ({
      timestamp: d.timestamp,
      usage: d.metrics.power || 0,
      cost: (d.metrics.power || 0) * 0.15 // $0.15 per kWh
    }))
  }

  private calculateEnergyEfficiency(consumption: Array<{ timestamp: Date; usage: number; cost: number }>): {
    current: number
    target: number
    improvement: number
  } {
    const averageUsage = consumption.reduce((sum, c) => sum + c.usage, 0) / consumption.length
    const target = averageUsage * 0.8 // 20% reduction target
    
    return {
      current: averageUsage,
      target,
      improvement: ((averageUsage - target) / averageUsage) * 100
    }
  }

  private calculateCarbonFootprint(consumption: Array<{ timestamp: Date; usage: number; cost: number }>): {
    current: number
    reduction: number
    target: number
  } {
    const totalUsage = consumption.reduce((sum, c) => sum + c.usage, 0)
    const carbonFactor = 0.5 // kg CO2 per kWh
    const current = totalUsage * carbonFactor
    const target = current * 0.7 // 30% reduction
    
    return {
      current,
      reduction: current - target,
      target
    }
  }

  private generateEnergyRecommendations(metrics: EnergyMetrics, efficiency: any): string[] {
    const recommendations = []
    
    if (metrics.powerConsumption > 5000) {
      recommendations.push('Consider implementing load balancing during peak hours')
    }
    if (metrics.powerFactor < 0.9) {
      recommendations.push('Install power factor correction equipment')
    }
    if (efficiency.current > efficiency.target * 1.2) {
      recommendations.push('Upgrade to energy-efficient equipment')
    }

    return recommendations
  }

  // Water metrics calculations
  private calculateWaterMetrics(data: IoTSensorData[]): WaterMetrics {
    if (data.length === 0) {
      return {
        flow: 0,
        pressure: 0,
        quality: 0,
        temperature: 0,
        ph: 0,
        turbidity: 0,
        totalConsumption: 0
      }
    }

    const latest = data.slice(-5)
    return {
      flow: this.average(latest, 'flow'),
      pressure: this.average(latest, 'pressure'),
      quality: this.average(latest, 'quality'),
      temperature: this.average(latest, 'temperature'),
      ph: this.average(latest, 'ph') || 7,
      turbidity: this.average(latest, 'turbidity') || 0,
      totalConsumption: this.sum(data, 'flow')
    }
  }

  private assessWaterQuality(data: IoTSensorData[]): {
    score: number
    issues: string[]
    recommendations: string[]
  } {
    const latest = data.slice(-5)
    const avgQuality = this.average(latest, 'quality')
    const issues: string[] = []
    const recommendations: string[] = []

    if (avgQuality < 70) {
      issues.push('Water quality below acceptable threshold')
      recommendations.push('Increase filtration frequency')
    }

    const avgPh = this.average(latest, 'ph') || 7
    if (avgPh < 6.5 || avgPh > 8.5) {
      issues.push('pH levels outside normal range')
      recommendations.push('Adjust water treatment chemicals')
    }

    return {
      score: avgQuality,
      issues,
      recommendations
    }
  }

  private detectWaterLeaks(data: IoTSensorData[]): {
    detected: boolean
    locations: string[]
    severity: 'minor' | 'major' | 'critical'
  } {
    // Simple leak detection based on flow anomalies
    const flows = data.map(d => d.metrics.flow || 0)
    const avgFlow = flows.reduce((sum, f) => sum + f, 0) / flows.length
    const maxFlow = Math.max(...flows)
    
    const detected = maxFlow > avgFlow * 1.5
    
    return {
      detected,
      locations: detected ? ['Main supply line'] : [],
      severity: maxFlow > avgFlow * 2 ? 'critical' : maxFlow > avgFlow * 1.8 ? 'major' : 'minor'
    }
  }

  private calculateWaterConservation(data: IoTSensorData[]): {
    savings: number
    target: number
    strategies: string[]
  } {
    const totalConsumption = this.sum(data, 'flow')
    const target = totalConsumption * 0.8 // 20% reduction
    
    return {
      savings: totalConsumption - target,
      target,
      strategies: [
        'Install low-flow fixtures',
        'Implement rainwater harvesting',
        'Optimize irrigation schedules'
      ]
    }
  }

  // Utility methods
  private average(data: IoTSensorData[], metric: string): number {
    const values = data.map(d => d.metrics[metric]).filter(v => v !== undefined)
    return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0
  }

  private sum(data: IoTSensorData[], metric: string): number {
    return data.reduce((sum, d) => sum + (d.metrics[metric] || 0), 0)
  }

  private max(data: IoTSensorData[], metric: string): number {
    const values = data.map(d => d.metrics[metric]).filter(v => v !== undefined)
    return values.length > 0 ? Math.max(...values) : 0
  }

  private calculateTrend(recent: any[], older: any[], metric: string): 'improving' | 'stable' | 'worsening' {
    const recentAvg = recent.reduce((sum, r) => sum + r.metrics[metric], 0) / recent.length
    const olderAvg = older.reduce((sum, o) => sum + o.metrics[metric], 0) / older.length
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100
    
    if (Math.abs(change) < 5) return 'stable'
    
    // For air quality, CO2, noise - lower is better
    const improvingMetrics = ['co2Level', 'noiseLevel']
    const isImproving = improvingMetrics.includes(metric) ? change < 0 : change > 0
    
    return isImproving ? 'improving' : 'worsening'
  }

  private parseTimeRange(range: string): number {
    const unit = range.slice(-1)
    const value = parseInt(range.slice(0, -1))
    
    switch (unit) {
      case 'h': return value * 60 * 60 * 1000
      case 'd': return value * 24 * 60 * 60 * 1000
      case 'w': return value * 7 * 24 * 60 * 60 * 1000
      default: return 24 * 60 * 60 * 1000 // Default to 24 hours
    }
  }

  // Public API methods
  getConnectionStatus(): {
    connected: boolean
    devicesOnline: number
    totalDevices: number
    lastDataReceived?: Date
  } {
    const devices = Array.from(this.devices.values())
    const onlineDevices = devices.filter(d => d.status === 'online')
    
    return {
      connected: this.websocket?.readyState === WebSocket.OPEN,
      devicesOnline: onlineDevices.length,
      totalDevices: devices.length,
      lastDataReceived: devices.length > 0 ? 
        new Date(Math.max(...devices.map(d => d.lastSeen.getTime()))) : 
        undefined
    }
  }

  async getDashboardSummary(): Promise<{
    devices: { online: number; offline: number; error: number }
    alerts: { critical: number; high: number; medium: number; low: number }
    dataPoints: number
    lastUpdate: Date
  }> {
    const devices = Array.from(this.devices.values())
    const allAlerts: IoTAlert[] = []
    
    for (const deviceAlerts of this.alerts.values()) {
      allAlerts.push(...deviceAlerts)
    }

    const totalDataPoints = Array.from(this.sensorData.values())
      .reduce((sum, deviceData) => sum + deviceData.length, 0)

    return {
      devices: {
        online: devices.filter(d => d.status === 'online').length,
        offline: devices.filter(d => d.status === 'offline').length,
        error: devices.filter(d => d.status === 'error').length
      },
      alerts: {
        critical: allAlerts.filter(a => a.severity === 'critical').length,
        high: allAlerts.filter(a => a.severity === 'high').length,
        medium: allAlerts.filter(a => a.severity === 'medium').length,
        low: allAlerts.filter(a => a.severity === 'low').length
      },
      dataPoints: totalDataPoints,
      lastUpdate: new Date()
    }
  }
}

export const iotConnectorService = new IoTConnectorService()
export type {
  IoTDevice,
  IoTSensorData,
  IoTAlert,
  IoTConfiguration,
  EnvironmentalMetrics,
  EnergyMetrics,
  WaterMetrics
}
