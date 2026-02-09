import { useState, useEffect, useCallback } from "react";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  module: string;
  message: string;
  details?: any;
}

const LOGS_KEY = 'bet_balance_boss_logs';
const MAX_LOGS = 500;

const getStoredLogs = (): LogEntry[] => {
  try {
    const stored = localStorage.getItem(LOGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

const saveLogs = (logs: LogEntry[]) => {
  try {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(0, MAX_LOGS)));
    window.dispatchEvent(new CustomEvent('system_logs_updated'));
  } catch (e) {
    console.error("Erro ao salvar logs", e);
  }
};

export function useLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const refreshLogs = useCallback(() => {
    setLogs(getStoredLogs());
  }, []);

  useEffect(() => {
    refreshLogs();
    window.addEventListener('system_logs_updated', refreshLogs);
    return () => window.removeEventListener('system_logs_updated', refreshLogs);
  }, [refreshLogs]);

  const logActivity = useCallback((level: LogEntry['level'], message: string, module: string = 'Geral', details?: any) => {
    const newEntry: LogEntry = {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      details,
    };
    const currentLogs = getStoredLogs();
    saveLogs([newEntry, ...currentLogs]);
  }, []);

  const clearLogs = useCallback(() => {
    localStorage.removeItem(LOGS_KEY);
    setLogs([]);
    window.dispatchEvent(new CustomEvent('system_logs_updated'));
  }, []);

  return { logs, logActivity, clearLogs, refreshLogs };
}

export const logger = {
  log: (level: LogEntry['level'], message: string, module: string = 'Sistema', details?: any) => {
    const newEntry: LogEntry = {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      details,
    };
    const currentLogs = getStoredLogs();
    saveLogs([newEntry, ...currentLogs]);
    console[level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'log'](`[${module}] ${message}`, details || '');
  },
  info: (msg: string, mod?: string, det?: any) => logger.log('INFO', msg, mod, det),
  success: (msg: string, mod?: string, det?: any) => logger.log('SUCCESS', msg, mod, det),
  warn: (msg: string, mod?: string, det?: any) => logger.log('WARN', msg, mod, det),
  error: (msg: string, mod?: string, det?: any) => logger.log('ERROR', msg, mod, det),
};

export function initGlobalLogging() {
  if (typeof window === 'undefined') return;
  window.onerror = (msg, src, line, col, err) => {
    logger.error(`Erro Global: ${msg}`, 'Sistema', { src, line, col, stack: err?.stack });
    return false;
  };
  window.onunhandledrejection = (e) => {
    logger.error(`Promessa Rejeitada: ${e.reason}`, 'Sistema');
  };
  logger.info('Monitoramento de logs iniciado');
}
