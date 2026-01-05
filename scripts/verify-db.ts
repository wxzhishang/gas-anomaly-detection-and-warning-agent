#!/usr/bin/env bun

/**
 * 数据库验证脚本
 * 验证数据库表结构是否正确创建
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/gas_regulator',
});

async function verifyDatabase() {
  console.log('🔍 开始验证数据库...\n');

  try {
    // 1. 验证连接
    console.log('1️⃣ 验证数据库连接...');
    await pool.query('SELECT NOW()');
    console.log('✅ 数据库连接成功\n');

    // 2. 验证TimescaleDB扩展
    console.log('2️⃣ 验证TimescaleDB扩展...');
    const extResult = await pool.query(
      "SELECT * FROM pg_extension WHERE extname = 'timescaledb'"
    );
    if (extResult.rows.length > 0) {
      console.log('✅ TimescaleDB扩展已安装\n');
    } else {
      console.log('❌ TimescaleDB扩展未安装\n');
      process.exit(1);
    }

    // 3. 验证表是否存在
    console.log('3️⃣ 验证表结构...');
    const tables = ['devices', 'sensor_data', 'alerts'];
    for (const table of tables) {
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        )`,
        [table]
      );
      if (result.rows[0].exists) {
        console.log(`✅ 表 ${table} 存在`);
      } else {
        console.log(`❌ 表 ${table} 不存在`);
        process.exit(1);
      }
    }
    console.log();

    // 4. 验证超表
    console.log('4️⃣ 验证超表...');
    const hypertableResult = await pool.query(
      `SELECT * FROM timescaledb_information.hypertables WHERE hypertable_name = 'sensor_data'`
    );
    if (hypertableResult.rows.length > 0) {
      console.log('✅ sensor_data 超表已创建\n');
    } else {
      console.log('❌ sensor_data 超表未创建\n');
      process.exit(1);
    }

    // 5. 验证索引
    console.log('5️⃣ 验证索引...');
    const indexes = [
      'idx_sensor_device_time',
      'idx_alerts_device_time',
      'idx_alerts_level',
    ];
    for (const index of indexes) {
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM pg_indexes 
          WHERE indexname = $1
        )`,
        [index]
      );
      if (result.rows[0].exists) {
        console.log(`✅ 索引 ${index} 存在`);
      } else {
        console.log(`⚠️  索引 ${index} 不存在（可能是可选的）`);
      }
    }
    console.log();

    // 6. 验证测试设备
    console.log('6️⃣ 验证测试数据...');
    const deviceResult = await pool.query(
      `SELECT * FROM devices WHERE id = 'device-001'`
    );
    if (deviceResult.rows.length > 0) {
      console.log('✅ 测试设备已创建');
      console.log(`   设备名称: ${deviceResult.rows[0].name}`);
      console.log(`   设备状态: ${deviceResult.rows[0].status}\n`);
    } else {
      console.log('⚠️  测试设备未创建\n');
    }

    // 7. 显示表统计
    console.log('7️⃣ 表统计信息...');
    for (const table of tables) {
      const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`   ${table}: ${countResult.rows[0].count} 条记录`);
    }
    console.log();

    console.log('✅ 数据库验证完成！所有检查通过。\n');
  } catch (error) {
    console.error('❌ 数据库验证失败:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyDatabase();
