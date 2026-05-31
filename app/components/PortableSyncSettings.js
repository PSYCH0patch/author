'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    CheckCircle2, Copy, DownloadCloud, HardDrive, Link, RefreshCw,
    Save, TestTube2, UploadCloud, Wifi, XCircle,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 12,
    outline: 'none',
};

const labelStyle = {
    display: 'block',
    fontSize: 11,
    color: 'var(--text-muted)',
    marginBottom: 6,
};

const buttonStyle = {
    padding: '8px 12px',
    fontSize: 12,
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
};

function formatTime(ts) {
    if (!ts) return '';
    try {
        return new Date(ts).toLocaleTimeString();
    } catch {
        return '';
    }
}

export default function PortableSyncSettings() {
    const { showToast } = useAppStore();
    const [sync, setSync] = useState(null);
    const [form, setForm] = useState(null);
    const [password, setPassword] = useState('');
    const [hasPassword, setHasPassword] = useState(false);
    const [status, setStatus] = useState(null);
    const [busy, setBusy] = useState('');
    const [lanShare, setLanShare] = useState(null);
    const [lanSource, setLanSource] = useState('');

    useEffect(() => {
        let mounted = true;
        let unsubscribe = null;
        (async () => {
            const mod = await import('../lib/portable-sync');
            if (!mounted) return;
            setSync(mod);
            setForm(mod.loadPortableSyncSettings());
            const storedPassword = await mod.hasPortableSyncSecret('webdav-password');
            if (!mounted) return;
            setHasPassword(storedPassword);
            unsubscribe = mod.onPortableSyncStatusChange(next => {
                if (mounted) setStatus(next);
            });
        })();
        return () => {
            mounted = false;
            if (unsubscribe) unsubscribe();
        };
    }, []);

    const presets = useMemo(() => sync?.getWebDavPresets?.() || {}, [sync]);
    const selectedPreset = form?.webdav?.preset || 'custom';
    const presetInfo = presets[selectedPreset] || presets.custom || {};

    if (!form || !sync) return null;

    const updateWebDav = (patch) => {
        setForm(prev => ({
            ...prev,
            webdav: { ...prev.webdav, ...patch },
        }));
    };

    const updateLan = (patch) => {
        setForm(prev => ({
            ...prev,
            lan: { ...prev.lan, ...patch },
        }));
    };

    const saveSettings = async (extra = {}) => {
        const secrets = {};
        if (extra.savePassword && password) {
            secrets.webdavPassword = password;
        }
        const normalized = await sync.savePortableSyncSettings(form, secrets);
        setForm(normalized);
        const storedPassword = await sync.hasPortableSyncSecret('webdav-password');
        setHasPassword(storedPassword);
        if (extra.savePassword && password) setPassword('');
        return normalized;
    };

    const withBusy = async (key, action) => {
        setBusy(key);
        try {
            return await action();
        } finally {
            setBusy('');
        }
    };

    const handlePresetChange = (preset) => {
        const defaults = sync.getWebDavPresetDefaults(preset);
        updateWebDav({
            preset,
            endpoint: defaults.endpoint || form.webdav.endpoint,
            basePath: defaults.basePath || form.webdav.basePath,
        });
    };

    const handleSave = async () => {
        await withBusy('save', async () => {
            await saveSettings({ savePassword: !!password });
            showToast(password ? 'WebDAV 配置和密码已保存' : 'WebDAV 配置已保存', 'success');
        });
    };

    const handleTest = async () => {
        await withBusy('test', async () => {
            const saved = await saveSettings({ savePassword: !!password });
            await sync.testWebDavConnection({
                ...saved,
                webdav: {
                    ...saved.webdav,
                    ...(password ? { password } : {}),
                },
            });
            if (password) {
                setHasPassword(true);
                setPassword('');
            }
            showToast('WebDAV 连接测试成功', 'success');
        }).catch(err => showToast(err.message, 'error'));
    };

    const flushEditor = async () => {
        await useAppStore.getState().flushPendingEditorSave();
    };

    const handlePush = async () => {
        await withBusy('push', async () => {
            await flushEditor();
            await saveSettings({ savePassword: !!password });
            const count = await sync.pushAllToWebDav();
            if (password) {
                setHasPassword(true);
                setPassword('');
            }
            showToast(`已推送 ${count} 项数据到 WebDAV`, 'success');
        }).catch(err => showToast(err.message, 'error'));
    };

    const handlePull = async () => {
        const confirmed = window.confirm('从 WebDAV 拉取会用远端作品/章节/设定覆盖本机同名数据。继续前会自动创建本机快照。确认继续吗？');
        if (!confirmed) return;
        await withBusy('pull', async () => {
            await flushEditor();
            const { createSnapshot } = await import('../lib/snapshots');
            await createSnapshot('从 WebDAV 同步前的备份', 'manual', { syncLatestToCloud: false });
            await saveSettings({ savePassword: !!password });
            const count = await sync.pullAllFromWebDav();
            showToast(`已从 WebDAV 拉取 ${count} 项数据，即将刷新`, 'success');
            setTimeout(() => window.location.reload(), 1200);
        }).catch(err => showToast(err.message, 'error'));
    };

    const handleFlush = async () => {
        await withBusy('flush', async () => {
            await saveSettings({ savePassword: !!password });
            await sync.flushPortableSync({ throwOnError: true });
            showToast('WebDAV 待同步队列已处理', 'success');
        }).catch(err => showToast(err.message, 'error'));
    };

    const handleCreateLanShare = async () => {
        await withBusy('lan-share', async () => {
            await flushEditor();
            await saveSettings();
            const share = await sync.createLanShare(form.lan.shareMinutes);
            setLanShare(share);
            showToast(`局域网分享已创建，包含 ${share.entryCount} 项数据`, 'success');
        }).catch(err => showToast(err.message, 'error'));
    };

    const handleCopy = async (text) => {
        await navigator.clipboard?.writeText(text);
        showToast('已复制局域网同步链接', 'success');
    };

    const handleLanImport = async () => {
        const confirmed = window.confirm('从局域网导入会覆盖本机同名作品/章节/设定。继续前会自动创建本机快照。确认继续吗？');
        if (!confirmed) return;
        await withBusy('lan-import', async () => {
            await flushEditor();
            const { createSnapshot } = await import('../lib/snapshots');
            await createSnapshot('从局域网同步前的备份', 'manual', { syncLatestToCloud: false });
            const count = await sync.importLanShare(lanSource);
            showToast(`已导入 ${count} 项数据，即将刷新`, 'success');
            setTimeout(() => window.location.reload(), 1200);
        }).catch(err => showToast(err.message, 'error'));
    };

    const canUseWebDav = form.webdav.endpoint && form.webdav.username && (password || hasPassword);
    const isBusy = (key) => busy === key;

    return (
        <>
            <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <HardDrive size={15} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>WebDAV 同步</span>
                    <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={!!form.webdav.enabled}
                            onChange={e => updateWebDav({ enabled: e.target.checked })}
                        />
                        启用
                    </label>
                </div>

                <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    可使用坚果云、123 云盘或自建 NAS/Nextcloud 等 WebDAV 服务。应用密码只保存在本机，不参与云同步。
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div>
                        <label style={labelStyle}>服务商</label>
                        <select
                            value={selectedPreset}
                            onChange={e => handlePresetChange(e.target.value)}
                            style={inputStyle}
                        >
                            {Object.entries(presets).map(([key, item]) => (
                                <option key={key} value={key}>{item.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>远端目录</label>
                        <input
                            value={form.webdav.basePath}
                            onChange={e => updateWebDav({ basePath: e.target.value })}
                            placeholder="/AuthorSync"
                            style={inputStyle}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: 10 }}>
                    <label style={labelStyle}>WebDAV 地址</label>
                    <input
                        value={form.webdav.endpoint}
                        onChange={e => updateWebDav({ endpoint: e.target.value })}
                        placeholder="https://dav.example.com/dav/"
                        style={inputStyle}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div>
                        <label style={labelStyle}>账号</label>
                        <input
                            value={form.webdav.username}
                            onChange={e => updateWebDav({ username: e.target.value })}
                            placeholder="邮箱或用户名"
                            autoComplete="username"
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>{hasPassword ? '应用密码（已保存，留空不变）' : '应用密码 / 授权码'}</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder={hasPassword ? '已保存，输入新密码可替换' : '请输入应用密码'}
                            autoComplete="new-password"
                            style={inputStyle}
                        />
                    </div>
                </div>

                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.4 }}>
                    {presetInfo.note}
                    {status?.pending > 0 ? ` · ${status.pending} 项待同步` : ''}
                    {status?.lastSync ? ` · 上次同步 ${formatTime(status.lastSync)}` : ''}
                    {status?.error ? <span style={{ color: '#ef4444' }}> · {status.error}</span> : null}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <button style={buttonStyle} onClick={handleSave} disabled={!!busy}>
                        {isBusy('save') ? <RefreshCw size={13} className="spin" /> : <Save size={13} />}
                        保存配置
                    </button>
                    <button style={buttonStyle} onClick={handleTest} disabled={!!busy || !canUseWebDav}>
                        {isBusy('test') ? <RefreshCw size={13} className="spin" /> : <TestTube2 size={13} />}
                        测试连接
                    </button>
                    <button style={buttonStyle} onClick={handleFlush} disabled={!!busy || !canUseWebDav}>
                        {isBusy('flush') ? <RefreshCw size={13} className="spin" /> : <CheckCircle2 size={13} />}
                        同步队列
                    </button>
                    <button style={buttonStyle} onClick={handlePush} disabled={!!busy || !canUseWebDav}>
                        {isBusy('push') ? <RefreshCw size={13} className="spin" /> : <UploadCloud size={13} />}
                        推送本机
                    </button>
                    <button style={buttonStyle} onClick={handlePull} disabled={!!busy || !canUseWebDav}>
                        {isBusy('pull') ? <RefreshCw size={13} className="spin" /> : <DownloadCloud size={13} />}
                        拉取远端
                    </button>
                </div>
            </div>

            <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Wifi size={15} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>局域网同步</span>
                </div>

                <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    同一 Wi-Fi 下临时分享作品、章节和设定。分享链接只在本机应用运行期间有效。
                </p>

                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 10 }}>
                    <div style={{ width: 120 }}>
                        <label style={labelStyle}>有效分钟</label>
                        <input
                            type="number"
                            min="5"
                            max="120"
                            value={form.lan.shareMinutes}
                            onChange={e => updateLan({ shareMinutes: e.target.value })}
                            style={inputStyle}
                        />
                    </div>
                    <button style={buttonStyle} onClick={handleCreateLanShare} disabled={!!busy}>
                        {isBusy('lan-share') ? <RefreshCw size={13} className="spin" /> : <Link size={13} />}
                        创建分享链接
                    </button>
                </div>

                {lanShare?.urls?.length > 0 && (
                    <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {lanShare.urls.map(url => (
                            <div key={url} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <input value={url} readOnly style={{ ...inputStyle, fontFamily: 'monospace' }} />
                                <button style={{ ...buttonStyle, padding: '8px 10px' }} onClick={() => handleCopy(url)} title="复制">
                                    <Copy size={13} />
                                </button>
                            </div>
                        ))}
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            分享码：{lanShare.token} · {lanShare.entryCount} 项 · 到期 {formatTime(lanShare.expiresAt)}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>导入链接、分享码或同步快照</label>
                        <input
                            value={lanSource}
                            onChange={e => setLanSource(e.target.value)}
                            placeholder="http://192.168.x.x:3000/api/sync/lan?token=... 或粘贴手机复制的快照"
                            style={inputStyle}
                        />
                    </div>
                    <button style={buttonStyle} onClick={handleLanImport} disabled={!!busy || !lanSource.trim()}>
                        {isBusy('lan-import') ? <RefreshCw size={13} className="spin" /> : <DownloadCloud size={13} />}
                        导入
                    </button>
                </div>

                {lanShare && !lanShare.urls?.length && (
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#ef4444' }}>
                        <XCircle size={12} /> 未获取到可用局域网地址，请检查网络连接。
                    </div>
                )}
            </div>
        </>
    );
}
