export enum ControllerType {
    P = 'P',
    PI = 'PI',
    PD = 'PD',
    PID = 'PID',
  }
  
  export class PIDController {
    name: string;
    kp: number;
    ki: number;
    kd: number;
    type: ControllerType;
    integral: number;
    previousError: number;
  
    constructor(name: string, kp: number, ki: number, kd: number, type: ControllerType) {
      this.name = name;
      this.kp = kp;
      this.ki = ki;
      this.kd = kd;
      this.type = type;
      this.integral = 0;
      this.previousError = 0;
    }
  
    update(error: number, dt: number): number {
      this.integral += error * dt;
      const derivative = (error - this.previousError) / dt;
      this.previousError = error;
  
      let output = 0;
      switch (this.type) {
        case ControllerType.P:
          output = this.kp * error;
          break;
        case ControllerType.PI:
          output = this.kp * error + this.ki * this.integral;
          break;
        case ControllerType.PD:
          output = this.kp * error + this.kd * derivative;
          break;
        case ControllerType.PID:
          output = this.kp * error + this.ki * this.integral + this.kd * derivative;
          break;
      }
  
      return output;
    }
  }
  
  export interface SystemCharacteristics {
    processGain: number;
    timeConstant: number;
    deadTime: number;
  }
  
  export function autoTune(system: SystemCharacteristics): { kp: number; ki: number; kd: number } {
    // Ziegler-Nichols method
    const ku = 0.6 * system.processGain * (system.timeConstant / system.deadTime);
    const tu = 2 * system.deadTime;
  
    const kp = 0.6 * ku;
    const ki = 1.2 * ku / tu;
    const kd = 0.075 * ku * tu;
  
    return { kp, ki, kd };
  }
  

