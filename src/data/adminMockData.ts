// Mock data for Admin Dashboard

export interface KPIData {
  usuariosTotais: number;
  novosUsuarios: number;
  engajamento: number;
  taxaErro: number;
}

export interface OnlineUsersData {
  current: number;
  sparklineData: { time: string; value: number }[];
}

export interface NotificationData {
  entregues: number;
  falhas: number;
  silenciadas: number;
}

export interface ModuleUsageData {
  name: string;
  value: number;
}

export interface RetentionData {
  period: string;
  d1: number;
  d7: number;
  d30: number;
}

export interface FunnelData {
  stage: string;
  users: number;
  percentage: number;
}

export interface AderenciaData {
  week: string;
  percentage: number;
}

export interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

export interface FeatureFlag {
  name: string;
  key: string;
  enabled: boolean;
  description: string;
}

export interface Integration {
  name: string;
  key: string;
  enabled: boolean;
  type: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  service: string;
}

// Mock data
export const kpiData: KPIData = {
  usuariosTotais: 18420,
  novosUsuarios: 1206,
  engajamento: 62,
  taxaErro: 0.7
};

export const generateOnlineUsers = (): OnlineUsersData => {
  const baseUsers = 128;
  const variation = Math.floor(Math.random() * 10) - 5; // ±5 users
  const current = Math.max(95, baseUsers + variation);
  
  // Generate 15 minute sparkline data
  const sparklineData = Array.from({ length: 15 }, (_, i) => ({
    time: `${14 - i}m`,
    value: Math.max(90, current + Math.floor(Math.random() * 20) - 10)
  }));
  
  return { current, sparklineData };
};

export const notificationData: NotificationData = {
  entregues: 82,
  falhas: 12,
  silenciadas: 6
};

export const moduleUsageData: ModuleUsageData[] = [
  { name: 'Medicações', value: 3.2 },
  { name: 'Agenda', value: 2.4 },
  { name: 'Conquistas', value: 1.8 },
  { name: 'Relatórios', value: 0.9 },
  { name: 'Configurações', value: 0.6 }
];

export const retentionData: RetentionData[] = [
  { period: 'Janeiro', d1: 85, d7: 42, d30: 23 },
  { period: 'Fevereiro', d1: 88, d7: 45, d30: 25 },
  { period: 'Março', d1: 82, d7: 38, d30: 21 },
  { period: 'Abril', d1: 90, d7: 48, d30: 29 },
  { period: 'Maio', d1: 87, d7: 44, d30: 27 }
];

export const funnelData: FunnelData[] = [
  { stage: 'Signup', users: 1000, percentage: 100 },
  { stage: 'Ativação', users: 780, percentage: 78 },
  { stage: '1ª Adição', users: 520, percentage: 52 },
  { stage: 'Notificação', users: 410, percentage: 41 },
  { stage: 'Retorno 7d', users: 290, percentage: 29 }
];

export const aderenciaData: AderenciaData[] = [
  { week: 'Sem 1', percentage: 62 },
  { week: 'Sem 2', percentage: 65 },
  { week: 'Sem 3', percentage: 68 },
  { week: 'Sem 4', percentage: 64 },
  { week: 'Sem 5', percentage: 70 }
];

export const statusDistribution: StatusDistribution[] = [
  { name: 'Concluídos', value: 68, color: 'hsl(var(--success))' },
  { name: 'Faltando', value: 17, color: 'hsl(var(--accent))' },
  { name: 'Atrasados', value: 10, color: 'hsl(var(--destructive))' },
  { name: 'Excluídos', value: 5, color: 'hsl(var(--muted))' }
];

export const featureFlags: FeatureFlag[] = [
  { name: 'Relatórios V2', key: 'reports_v2', enabled: true, description: 'Nova versão dos relatórios com mais funcionalidades' },
  { name: 'Widget de Metas', key: 'goals_widget', enabled: true, description: 'Widget de metas na dashboard principal' },
  { name: 'Notificações WhatsApp', key: 'whatsapp_notifications', enabled: false, description: 'Sistema de notificações via WhatsApp' },
  { name: 'Modo Escuro', key: 'dark_mode', enabled: true, description: 'Suporte a tema escuro' },
  { name: 'Gamificação Avançada', key: 'advanced_gamification', enabled: false, description: 'Sistema avançado de conquistas' }
];

export const integrations: Integration[] = [
  { name: 'Push Web (PWA)', key: 'push_web', enabled: true, type: 'notification' },
  { name: 'E-mail Provider', key: 'email_provider', enabled: true, type: 'notification' },
  { name: 'WhatsApp Provider', key: 'whatsapp_provider', enabled: false, type: 'notification' },
  { name: 'Google Analytics', key: 'google_analytics', enabled: true, type: 'analytics' },
  { name: 'Sentry (Error Tracking)', key: 'sentry', enabled: true, type: 'monitoring' }
];

export const logEntries: LogEntry[] = [
  { id: '1', timestamp: '2024-01-15 14:32:15', level: 'INFO', message: 'User authentication successful', service: 'auth-service' },
  { id: '2', timestamp: '2024-01-15 14:31:45', level: 'WARN', message: 'High memory usage detected', service: 'api-gateway' },
  { id: '3', timestamp: '2024-01-15 14:30:12', level: 'ERROR', message: 'Database connection timeout', service: 'db-service' },
  { id: '4', timestamp: '2024-01-15 14:29:33', level: 'INFO', message: 'Medication reminder sent successfully', service: 'notification-service' },
  { id: '5', timestamp: '2024-01-15 14:28:56', level: 'INFO', message: 'User profile updated', service: 'user-service' },
  { id: '6', timestamp: '2024-01-15 14:27:21', level: 'WARN', message: 'Rate limit exceeded for user 12345', service: 'api-gateway' },
  { id: '7', timestamp: '2024-01-15 14:26:44', level: 'ERROR', message: 'Failed to send push notification', service: 'notification-service' },
  { id: '8', timestamp: '2024-01-15 14:25:17', level: 'INFO', message: 'Daily report generated', service: 'report-service' }
];

export const catalogData = {
  especialidades: [
    'Cardiologia', 'Endocrinologia', 'Oftalmologia', 'Neurologia', 
    'Ortopedia', 'Dermatologia', 'Ginecologia', 'Urologia'
  ],
  tiposExame: [
    'Hemograma', 'USG Abdominal', 'ECG', 'Raio-X', 'Ressonância Magnética',
    'Tomografia', 'Ecocardiograma', 'Mamografia'
  ],
  tiposAtividade: [
    'Pilates', 'Fisioterapia', 'Caminhada', 'Natação', 'Yoga',
    'Musculação', 'Hidroginástica', 'Terapia Ocupacional'
  ]
};

// Session time mock data
export const sessionTimeData = Array.from({ length: 30 }, (_, i) => ({
  day: `${30 - i}d`,
  time: Math.floor(Math.random() * 120) + 240 // 4-8 minutes in seconds
}));

// Latency mock data
export const latencyData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  latency: Math.floor(Math.random() * 50) + 20 // 20-70ms
}));

// Error rate mock data
export const errorRateData = [
  { endpoint: '/api/auth', errors: 12 },
  { endpoint: '/api/medications', errors: 8 },
  { endpoint: '/api/appointments', errors: 5 },
  { endpoint: '/api/notifications', errors: 15 },
  { endpoint: '/api/reports', errors: 3 }
];