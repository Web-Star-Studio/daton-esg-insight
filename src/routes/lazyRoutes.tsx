/**
 * Lazy-loaded route components for code splitting
 * Splits the bundle into smaller chunks loaded on demand
 */

import { lazyLoad } from '@/utils/lazyLoad';

// Auth routes
export const Auth = lazyLoad(() => import('@/pages/Auth'));

// Main application routes
export const Index = lazyLoad(() => import('@/pages/Index'));
export const Dashboard = lazyLoad(() => import('@/pages/Dashboard'));

// Document management
export const Documentos = lazyLoad(() => import('@/pages/Documentos'));
export const DocumentosHub = lazyLoad(() => import('@/pages/DocumentosHub'));
export const ExtracoesDocumentos = lazyLoad(() => import('@/pages/ExtracoesDocumentos'));
export const ControleDocumentos = lazyLoad(() => import('@/pages/ControleDocumentos'));

// ESG modules
export const InventarioGEE = lazyLoad(() => import('@/pages/InventarioGEE'));
export const Metas = lazyLoad(() => import('@/pages/Metas'));
export const Residuos = lazyLoad(() => import('@/pages/Residuos'));
export const Licenciamento = lazyLoad(() => import('@/pages/Licenciamento'));
export const GestaoESG = lazyLoad(() => import('@/pages/GestaoESG'));

// Advanced features
export const AdvancedAnalytics = lazyLoad(() => import('@/pages/AdvancedAnalytics'));
export const IAInsights = lazyLoad(() => import('@/pages/IAInsights'));
export const IntelligenceCenter = lazyLoad(() => import('@/pages/IntelligenceCenter'));

// Admin and settings
export const GestaoUsuarios = lazyLoad(() => import('@/pages/GestaoUsuarios'));
export const Configuracao = lazyLoad(() => import('@/pages/Configuracao'));

// Help and support
export const FAQ = lazyLoad(() => import('@/pages/FAQ'));

// Phase 5-8: New ESG pages
export const Fornecedores = lazyLoad(() => import('@/pages/Fornecedores'));
export const IndicadoresESG = lazyLoad(() => import('@/pages/IndicadoresESG'));
export const Materialidade = lazyLoad(() => import('@/pages/Materialidade'));

// Monitoring pages (FASE 1)
export const MonitoramentoAgua = lazyLoad(() => import('@/pages/MonitoramentoAgua'));
export const MonitoramentoEnergia = lazyLoad(() => import('@/pages/MonitoramentoEnergia'));
export const MonitoramentoEmissoes = lazyLoad(() => import('@/pages/MonitoramentoEmissoes'));
export const MonitoramentoResiduos = lazyLoad(() => import('@/pages/MonitoramentoResiduos'));
