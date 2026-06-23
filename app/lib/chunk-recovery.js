const CHUNK_RECOVERY_KEY = 'author-chunk-recovery-v1';
const CHUNK_RECOVERY_PARAM = '__chunk_reload';
const CHUNK_RECOVERY_COOLDOWN_MS = 60_000;

function errorText(error) {
    return [
        error?.name,
        error?.message,
        typeof error === 'string' ? error : '',
    ].filter(Boolean).join(': ');
}

export function isChunkLoadError(error) {
    return /ChunkLoadError|Failed to load chunk|Loading chunk .+ failed|CSS_CHUNK_LOAD_FAILED|error loading dynamically imported module|Importing a module script failed/i
        .test(errorText(error));
}

export function recoverFromChunkLoadError(error) {
    if (typeof window === 'undefined' || !isChunkLoadError(error)) return false;

    const now = Date.now();
    const url = new URL(window.location.href);
    if (url.searchParams.has(CHUNK_RECOVERY_PARAM)) return false;

    const fingerprint = errorText(error).slice(0, 500);
    try {
        const previous = JSON.parse(sessionStorage.getItem(CHUNK_RECOVERY_KEY) || 'null');
        if (previous?.fingerprint === fingerprint && now - Number(previous?.at || 0) < CHUNK_RECOVERY_COOLDOWN_MS) {
            return false;
        }
        sessionStorage.setItem(CHUNK_RECOVERY_KEY, JSON.stringify({ fingerprint, at: now }));
    } catch { }

    url.searchParams.set(CHUNK_RECOVERY_PARAM, String(now));
    window.location.replace(url.toString());
    return true;
}

export async function importWithChunkRecovery(loader) {
    try {
        return await loader();
    } catch (error) {
        recoverFromChunkLoadError(error);
        throw error;
    }
}

export function clearChunkRecoveryQuery() {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has(CHUNK_RECOVERY_PARAM)) return;
    url.searchParams.delete(CHUNK_RECOVERY_PARAM);
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}
