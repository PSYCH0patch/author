'use client';

import { persistGet, persistSet } from './persistence';

const STORAGE_KEY_PREFIX = 'author-generation-archive-';
const MAX_ARCHIVE_ITEMS = 200;

export function generationArchiveKey(workId) {
    return `${STORAGE_KEY_PREFIX}${workId || 'work-default'}`;
}

export function normalizeGenerationArchive(archive) {
    if (!Array.isArray(archive)) return [];
    return archive
        .filter(item => item && typeof item === 'object' && String(item.text || '').trim())
        .slice(-MAX_ARCHIVE_ITEMS);
}

export async function loadGenerationArchive(workId) {
    try {
        return normalizeGenerationArchive(await persistGet(generationArchiveKey(workId)));
    } catch {
        return [];
    }
}

export async function saveGenerationArchive(workId, archive) {
    try {
        await persistSet(generationArchiveKey(workId), normalizeGenerationArchive(archive));
    } catch { }
}
