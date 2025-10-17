import os from 'os';
import fetch from 'node-fetch';

class SystemMonitor {
  constructor(config) {
    const haBaseUrl = process.env.HA_BASE_URL?.replace(/\/$/, '');
    const webhookId = process.env.WEBHOOK_ID?.replace(/%$/, ''); // Remove any trailing %
    
    if (!haBaseUrl || !webhookId) {
      throw new Error('Home Assistant configuration missing. Please check HA_BASE_URL and WEBHOOK_ID in .env');
    }

    this.config = {
      memoryThreshold: 85,
      cpuThreshold: 85,
      checkInterval: 5 * 60 * 1000,
      notificationCooldown: 15 * 60 * 1000,
      webhookUrl: `${haBaseUrl}/api/webhook/${webhookId}`,
      ...config
    };
    
    this.lastNotificationTime = {
      cpu: 0,
      memory: 0
    };
  }

  async start() {
    console.log('Starting system monitoring...');
    
    try {
      const initialMemory = this.getMemoryUsage();
      const initialCpu = await this.getCpuUsage();
      
      await this.sendNotification('startup', {
        message: `System monitoring started. Memory: ${Math.round(initialMemory)}%, CPU: ${Math.round(initialCpu)}%`,
        memory: initialMemory,
        cpu: initialCpu
      });
      
      this.interval = setInterval(() => this.check(), this.config.checkInterval);
      this.check();
    } catch (error) {
      console.error('Failed to start system monitor:', error);
    }
  }

  getMemoryUsage() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    return (used / total) * 100;
  }

  async getCpuUsage() {
    const startMeasure = os.cpus().map(cpu => ({
      idle: cpu.times.idle,
      total: Object.values(cpu.times).reduce((acc, tv) => acc + tv, 0)
    }));

    await new Promise(resolve => setTimeout(resolve, 1000));

    const endMeasure = os.cpus().map(cpu => ({
      idle: cpu.times.idle,
      total: Object.values(cpu.times).reduce((acc, tv) => acc + tv, 0)
    }));

    const cpuUsage = startMeasure.map((start, i) => {
      const end = endMeasure[i];
      const idle = end.idle - start.idle;
      const total = end.total - start.total;
      return 100 - (idle / total * 100);
    });

    return cpuUsage.reduce((acc, cpu) => acc + cpu, 0) / cpuUsage.length;
  }

  async sendNotification(type, data) {
    const now = Date.now();
    
    if (this.config.notificationCooldown > 0 && 
        type !== 'startup' && 
        now - this.lastNotificationTime[type] < this.config.notificationCooldown) {
      return;
    }

    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'system_alert',
          alert_type: type,
          ...data,
          hostname: os.hostname(),
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      this.lastNotificationTime[type] = now;
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  async check() {
    try {
      const cpuUsage = await this.getCpuUsage();
      const memoryUsage = this.getMemoryUsage();
      
      if (cpuUsage > this.config.cpuThreshold) {
        await this.sendNotification('cpu_alert', {
          message: `High CPU Alert: ${Math.round(cpuUsage)}%`,
          value: Math.round(cpuUsage)
        });
      }

      if (memoryUsage > this.config.memoryThreshold) {
        await this.sendNotification('memory_alert', {
          message: `High Memory Alert: ${Math.round(memoryUsage)}%`,
          value: Math.round(memoryUsage)
        });
      }
    } catch (error) {
      console.error('Error during system check:', error);
    }
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

export default SystemMonitor;