'use client';

import { useEffect } from 'react';
import { AlertTriangle, Download, RefreshCw, Trash2 } from 'lucide-react';
import { downloadDiagnosticReport, initDiagnostics, recordDiagnosticEvent } from './lib/diagnostics';
import { recoverFromChunkLoadError } from './lib/chunk-recovery';
import { tt } from './lib/runtime-i18n';

export default function Error({ error, reset }) {
    useEffect(() => {
        if (recoverFromChunkLoadError(error)) return;
        initDiagnostics();
        recordDiagnosticEvent('react.error-boundary', error?.message || 'React error boundary', {
            error: {
                name: error?.name,
                message: error?.message,
                stack: error?.stack,
                digest: error?.digest,
            },
        }, 'error');
        console.error('Global client render error caught:', error);
    }, [error]);

    const handleExportLog = () => {
        downloadDiagnosticReport({
            source: 'error-boundary',
            error: {
                name: error?.name,
                message: error?.message,
                stack: error?.stack,
                digest: error?.digest,
            },
        });
    };

    const handleClearData = () => {
        const confirmMsg = tt(
            '警告：这将会清除浏览器本地所有的缓存数据（包括未导出的作品）、设定和状态！\n通常只有在持续白屏且刷新无法恢复时才使用此操作。\n\n确定要清空并重置吗？',
            'WARNING: This will clear ALL local cache (including unexported works), settings, and state!\nOnly use this if the screen stays blank and refresh does not help.\n\nAre you sure you want to clear and reset?',
            'ВНИМАНИЕ: Это удалит весь локальный кэш (включая неэкспортированные работы), настройки и состояние!\nИспользуйте только если экран остаётся пустым и обновление не помогает.\n\nВы уверены, что хотите очистить и сбросить?'
        );
        if (window.confirm(confirmMsg)) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/';
        }
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: '100vh', padding: '40px 20px', background: 'var(--bg-primary, #f9fafb)',
            color: 'var(--text-primary, #111827)', textAlign: 'center', fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            <div style={{
                background: 'var(--bg-card, #ffffff)', padding: '40px', borderRadius: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
                maxWidth: '600px', width: '100%', border: '1px solid var(--border-light, #e5e7eb)',
                boxSizing: 'border-box'
            }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444'
                    }}>
                        <AlertTriangle size={32} />
                    </div>
                </div>

                <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
                    {tt(
                        '啊哦，系统遇到了一个意外错误',
                        'Oops, the system encountered an unexpected error',
                        'Упс, система столкнулась с неожиданной ошибкой'
                    )}
                </h1>
                <p style={{ fontSize: '15px', color: 'var(--text-secondary, #6b7280)', margin: '0 0 24px', lineHeight: 1.6 }}>
                    {tt(
                        '应用程序在运行时发生了未捕获的异常导致崩溃。',
                        'The application crashed due to an uncaught exception.',
                        'Приложение аварийно завершило работу из-за необработанного исключения.'
                    )}
                    <br/>
                    {tt(
                        '您可以将下方的错误信息截图反馈给开发者（或截图给我）。',
                        'You can screenshot the error details below and send them to the developer.',
                        'Вы можете отправить скриншот деталей ошибки разработчику.'
                    )}
                </p>

                <div style={{
                    background: 'var(--bg-secondary, #f3f4f6)', padding: '16px', borderRadius: '12px',
                    textAlign: 'left', marginBottom: '32px', overflowX: 'auto',
                    border: '1px solid var(--border-light, #e5e7eb)'
                }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #9ca3af)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {tt('错误详情', 'Error Details', 'Детали ошибки')}
                    </div>
                    <code style={{ fontSize: '13px', color: '#e11d48', wordBreak: 'break-all', whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace' }}>
                        {error?.name}: {error?.message}
                    </code>
                </div>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px',
                            background: 'var(--accent, #3b82f6)', color: '#fff', border: 'none',
                            borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)', transition: 'all 0.2s',
                            outline: 'none'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <RefreshCw size={16} /> {tt('刷新页面', 'Refresh Page', 'Обновить страницу')}
                    </button>

                    <button
                        onClick={handleExportLog}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px',
                            background: 'transparent', color: 'var(--accent, #3b82f6)', border: '1.5px solid rgba(59, 130, 246, 0.35)',
                            borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                            transition: 'all 0.2s', outline: 'none'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.06)';
                            e.currentTarget.style.borderColor = 'var(--accent, #3b82f6)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.35)';
                        }}
                    >
                        <Download size={16} /> {tt('导出诊断日志', 'Export Diagnostic Log', 'Экспорт журнала диагностики')}
                    </button>

                    <button
                        onClick={handleClearData}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px',
                            background: 'transparent', color: '#ef4444', border: '1.5px solid rgba(239, 68, 68, 0.4)',
                            borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                            transition: 'all 0.2s', outline: 'none'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
                            e.currentTarget.style.borderColor = '#ef4444';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                        }}
                    >
                        <Trash2 size={16} /> {tt('清空重置 (危险操作)', 'Clear & Reset (Dangerous)', 'Очистить и сбросить (Опасно)')}
                    </button>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-muted, #9ca3af)', marginTop: '32px', marginBottom: 0, lineHeight: 1.5 }}>
                    {tt(
                        '提示：如果该问题频繁出现，可能是您的浏览器插件冲突（如开启了网页自动翻译插件导致 React 渲染崩溃），',
                        'Tip: If this happens frequently, it may be caused by browser extension conflicts (e.g. auto-translate extensions can crash React rendering),',
                        'Совет: Если это происходит часто, возможно, конфликт расширений браузера (например, авто-перевод может вызвать сбой React),'
                    )}
                    <br/>
                    {tt(
                        '或本地数据结构受损。持续白屏时请尝试清除缓存以恢复初始状态。',
                        'or local data corruption. If the screen stays blank, try clearing cache to restore initial state.',
                        'или повреждение локальных данных. Если экран остаётся пустым, попробуйте очистить кэш.'
                    )}
                </p>
            </div>
        </div>
    );
}
