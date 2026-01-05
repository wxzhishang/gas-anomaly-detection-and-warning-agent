-- 燃气调压器异常检测系统数据库初始化脚本

-- 启用TimescaleDB扩展
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- 创建设备表
CREATE TABLE IF NOT EXISTS devices (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建传感器数据表
CREATE TABLE IF NOT EXISTS sensor_data (
  time TIMESTAMPTZ NOT NULL,
  device_id VARCHAR(50) NOT NULL,
  inlet_pressure DOUBLE PRECISION,
  outlet_pressure DOUBLE PRECISION,
  temperature DOUBLE PRECISION,
  flow_rate DOUBLE PRECISION,
  CONSTRAINT fk_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- 将sensor_data转换为超表
SELECT create_hypertable('sensor_data', 'time', if_not_exists => TRUE);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_sensor_device_time 
  ON sensor_data (device_id, time DESC);

-- 创建预警表
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(50) NOT NULL,
  level VARCHAR(20) NOT NULL,
  message TEXT,
  anomalies JSONB,
  root_cause JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_alert_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- 创建预警索引
CREATE INDEX IF NOT EXISTS idx_alerts_device_time 
  ON alerts (device_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_level 
  ON alerts (level);

-- 添加数据保留策略（可选，保留90天数据）
-- SELECT add_retention_policy('sensor_data', INTERVAL '90 days', if_not_exists => TRUE);

-- 插入测试设备
INSERT INTO devices (id, name, status) 
VALUES ('device-001', '测试调压器-001', 'active')
ON CONFLICT (id) DO NOTHING;

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为devices表添加更新时间戳触发器
DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
CREATE TRIGGER update_devices_updated_at
    BEFORE UPDATE ON devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 显示创建的表
\dt

-- 显示超表信息
SELECT * FROM timescaledb_information.hypertables;
