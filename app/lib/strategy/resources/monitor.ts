// app/lib/strategy/resources/monitor.ts
import os from 'os';

/**
 * System Resource Monitor
 * Detects RAM, CPU, GPU, thermal, battery status
 */

export interface SystemResourceInfo {
  availableRAM: number;
  availableGPU: boolean;
  gpuLayers: number;
  cpuThreads: number;
  cpuUsage: number;
  temperature?: number;
  onBattery: boolean;
  batteryLevel?: number;
}

export async function getSystemResources(): Promise<SystemResourceInfo> {
  const totalRAM = os.totalmem() / 1024 / 1024; // MB
  const freeRAM = os.freemem() / 1024 / 1024;
  const availableRAM = freeRAM * 0.8; // Conservative 80%

  // CPU info
  const cpus = os.cpus();
  const cpuUsage = Math.round(
    cpus.reduce((sum, cpu) => {
      const total = Object.values(cpu.times!).reduce((a, b) => a + b, 0);
      return sum + (1 - cpu.times!.idle! / total);
    }, 0) / cpus.length * 100
  );

  // GPU detection (M4 Mac has integrated GPU, or check if Ollama configured with GPU)
  const gpuAvailable = !!(process.env.OLLAMA_HOST) || os.platform() === 'darwin';

  return {
    availableRAM,
    availableGPU: gpuAvailable,
    gpuLayers: availableRAM > 12000 ? 35 : 20, // Conservative
    cpuThreads: os.cpus().length,
    cpuUsage,
    temperature: undefined, // Requires additional libs
    onBattery: false, // Requires system libs
    batteryLevel: undefined
  };
}