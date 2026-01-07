'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { WebSocketMessage } from '@/lib/types';

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onReconnecting?: () => void;
  onReconnected?: () => void;
  autoConnect?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onReconnecting,
    onReconnected,
    autoConnect = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const wasConnectedRef = useRef(false);

  // 使用ref存储回调函数，避免依赖变化导致重连
  const onMessageRef = useRef(onMessage);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const onReconnectingRef = useRef(onReconnecting);
  const onReconnectedRef = useRef(onReconnected);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;
    onReconnectingRef.current = onReconnecting;
    onReconnectedRef.current = onReconnected;
  }, [onMessage, onConnect, onDisconnect, onReconnecting, onReconnected]);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    try {
      const socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
      });

      socket.on('connect', () => {
        console.log('WebSocket连接成功');
        setIsConnected(true);
        setError(null);
        
        if (wasConnectedRef.current) {
          // 这是重连
          onReconnectedRef.current?.();
        }
        wasConnectedRef.current = true;
        onConnectRef.current?.();
      });

      socket.on('disconnect', () => {
        console.log('WebSocket断开连接');
        setIsConnected(false);
        onDisconnectRef.current?.();
      });

      socket.on('reconnect_attempt', () => {
        console.log('WebSocket尝试重连...');
        onReconnectingRef.current?.();
      });

      socket.on('connect_error', (err) => {
        console.error('WebSocket连接错误:', err);
        setError(err.message);
        setIsConnected(false);
      });

      // 监听所有消息类型
      socket.onAny((eventName, data) => {
        console.log(`[WebSocket] 收到事件: ${eventName}`, data);
        
        const currentOnMessage = onMessageRef.current;
        if (currentOnMessage) {
          let message: WebSocketMessage;
          
          if (eventName === 'connection') {
            message = { type: 'connection', message: data };
          } else if (eventName === 'sensor_data' || eventName === 'sensor-data') {
            message = { type: 'sensor_data', data: data.data || data };
          } else if (eventName === 'alert') {
            console.log('[WebSocket] 📢 收到预警消息:', data);
            message = { type: 'alert', data: data.data || data };
          } else if (eventName === 'device-status') {
            message = { type: 'device_status', data: data.data || data };
          } else {
            return; // 忽略未知消息类型
          }
          
          console.log('[WebSocket] 处理后的消息:', message);
          currentOnMessage(message);
        }
      });

      socketRef.current = socket;
    } catch (err) {
      console.error('创建WebSocket连接失败:', err);
      setError(err instanceof Error ? err.message : '连接失败');
    }
  }, []); // 移除所有依赖，使用ref代替

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在mount时执行一次

  return {
    isConnected,
    error,
    connect,
    disconnect,
  };
}
