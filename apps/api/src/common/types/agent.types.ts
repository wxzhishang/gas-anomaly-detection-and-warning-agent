import { SensorData } from './sensor-data.types';
import { AnomalyResult } from './anomaly.types';
import { RootCauseResult } from './analysis.types';
import { Alert } from './alert.types';

/**
 * Agent状态接口
 */
export interface AgentState {
  deviceId: string;
  sensorData: SensorData;
  anomalyResult?: AnomalyResult;
  rootCause?: RootCauseResult;
  alert?: Alert;
  error?: Error;
}
