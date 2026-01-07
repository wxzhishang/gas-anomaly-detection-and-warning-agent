-- 燃气调压器异常检测系统数据库初始化脚本

-- 创建设备表
CREATE TABLE IF NOT EXISTS devices (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建传感器数据表（时序表）
CREATE TABLE IF NOT EXISTS sensor_data (
    time TIMESTAMP WITH TIME ZONE NOT NULL,
    device_id VARCHAR(50) NOT NULL,
    inlet_pressure DOUBLE PRECISION NOT NULL,
    outlet_pressure DOUBLE PRECISION NOT NULL,
    temperature DOUBLE PRECISION NOT NULL,
    flow_rate DOUBLE PRECISION NOT NULL,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- 将sensor_data转换为TimescaleDB超表
SELECT create_hypertable('sensor_data', 'time', if_not_exists => TRUE);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_sensor_data_device_time ON sensor_data (device_id, time DESC);

-- 创建预警表
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    anomalies JSONB,
    root_cause JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- 创建预警索引
CREATE INDEX IF NOT EXISTS idx_alerts_device_id ON alerts (device_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_level ON alerts (level);

-- 创建基线统计表
CREATE TABLE IF NOT EXISTS baselines (
    device_id VARCHAR(50) PRIMARY KEY,
    inlet_pressure_mean DOUBLE PRECISION,
    inlet_pressure_std DOUBLE PRECISION,
    outlet_pressure_mean DOUBLE PRECISION,
    outlet_pressure_std DOUBLE PRECISION,
    temperature_mean DOUBLE PRECISION,
    temperature_std DOUBLE PRECISION,
    flow_rate_mean DOUBLE PRECISION,
    flow_rate_std DOUBLE PRECISION,
    sample_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- 插入示例设备数据
INSERT INTO devices (id, name, status) VALUES
    ('REG-001', '1号调压器', 'active'),
    ('REG-002', '2号调压器', 'active'),
    ('REG-003', '3号调压器', 'active')
ON CONFLICT (id) DO NOTHING;

-- 设置数据保留策略（可选，保留90天数据）
-- SELECT add_retention_policy('sensor_data', INTERVAL '90 days', if_not_exists => TRUE);

COMMENT ON TABLE devices IS '设备信息表';
COMMENT ON TABLE sensor_data IS '传感器数据时序表';
COMMENT ON TABLE alerts IS '预警记录表';
COMMENT ON TABLE baselines IS '设备基线统计表';
