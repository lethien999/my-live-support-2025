import React, { useState, useEffect, useMemo } from 'react';
import { usePerformanceMonitor, useMemoryMonitor } from './PerformanceOptimizedComponents';

interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  memoryUsed: number;
  memoryTotal: number;
  socketConnections: number;
  messageCount: number;
  typingUsers: number;
  onlineUsers: number;
}

const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    memoryUsed: 0,
    memoryTotal: 0,
    socketConnections: 0,
    messageCount: 0,
    typingUsers: 0,
    onlineUsers: 0
  });

  const [isVisible, setIsVisible] = useState(false);
  const performanceMetrics = usePerformanceMonitor();
  const memoryInfo = useMemoryMonitor();

  // Update metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(prev => ({
        ...prev,
        renderCount: performanceMetrics.renderCount,
        lastRenderTime: performanceMetrics.lastRenderTime,
        averageRenderTime: performanceMetrics.averageRenderTime,
        memoryUsed: memoryInfo?.usedJSHeapSize || 0,
        memoryTotal: memoryInfo?.totalJSHeapSize || 0
      }));
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 1000);

    return () => clearInterval(interval);
  }, [performanceMetrics, memoryInfo]);

  // Format memory size
  const formatMemorySize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format time
  const formatTime = (ms: number) => {
    return ms.toFixed(2) + ' ms';
  };

  // Performance status color
  const getPerformanceColor = (renderTime: number) => {
    if (renderTime < 16) return '#4CAF50'; // Good (< 16ms for 60fps)
    if (renderTime < 33) return '#FFC107'; // Warning (< 33ms for 30fps)
    return '#f44336'; // Poor (> 33ms)
  };

  // Memory usage percentage
  const memoryUsagePercentage = useMemo(() => {
    if (metrics.memoryTotal === 0) return 0;
    return (metrics.memoryUsed / metrics.memoryTotal) * 100;
  }, [metrics.memoryUsed, metrics.memoryTotal]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '20px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}
        title="Performance Monitor"
      >
        📊
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '300px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      border: '1px solid #e0e0e0',
      zIndex: 1000,
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        backgroundColor: '#f5f5f5',
        borderRadius: '12px 12px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>
          Performance Monitor
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#666'
          }}
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        {/* Render Performance */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>
            Render Performance
          </h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: '#666' }}>Last Render:</span>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: 'bold',
              color: getPerformanceColor(metrics.lastRenderTime)
            }}>
              {formatTime(metrics.lastRenderTime)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: '#666' }}>Average:</span>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: 'bold',
              color: getPerformanceColor(metrics.averageRenderTime)
            }}>
              {formatTime(metrics.averageRenderTime)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: '#666' }}>Render Count:</span>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
              {metrics.renderCount}
            </span>
          </div>
        </div>

        {/* Memory Usage */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>
            Memory Usage
          </h4>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ 
              width: '100%', 
              height: '8px', 
              backgroundColor: '#e0e0e0', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${memoryUsagePercentage}%`,
                height: '100%',
                backgroundColor: memoryUsagePercentage > 80 ? '#f44336' : 
                               memoryUsagePercentage > 60 ? '#FFC107' : '#4CAF50',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
            <div style={{ 
              fontSize: '11px', 
              color: '#666', 
              textAlign: 'center',
              marginTop: '4px'
            }}>
              {memoryUsagePercentage.toFixed(1)}%
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: '#666' }}>Used:</span>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
              {formatMemorySize(metrics.memoryUsed)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: '#666' }}>Total:</span>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
              {formatMemorySize(metrics.memoryTotal)}
            </span>
          </div>
        </div>

        {/* Chat Metrics */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>
            Chat Metrics
          </h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: '#666' }}>Messages:</span>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
              {metrics.messageCount}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: '#666' }}>Online:</span>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#4CAF50' }}>
              {metrics.onlineUsers}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: '#666' }}>Typing:</span>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#FFC107' }}>
              {metrics.typingUsers}
            </span>
          </div>
        </div>

        {/* Performance Tips */}
        <div style={{
          padding: '8px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          fontSize: '11px',
          color: '#666'
        }}>
          <strong>Tips:</strong>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
            <li>Keep render time &lt; 16ms for 60fps</li>
            <li>Monitor memory usage regularly</li>
            <li>Use React.memo for expensive components</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
