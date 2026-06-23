// 文本向量化与余弦相似度计算库

// 错误退避缓存：API 连续失败时暂停重试 60 秒
let _embedErrorUntil = 0;
const EMBED_BACKOFF_MS = 60000;

function describeEmbedError(status, bodyText) {
    if (!bodyText) return `Embedding 请求失败 (${status})`;
    try {
        const parsed = JSON.parse(bodyText);
        const detail = parsed?.error?.message || parsed?.error || parsed?.message;
        if (detail) return `Embedding 请求失败 (${status}): ${detail}`;
    } catch {
        // Keep the original body when the API returns plain text or HTML.
    }
    return `Embedding 请求失败 (${status}): ${bodyText}`;
}

/**
 * 获取文本的向量化表示 (Embeddings)
 * @param {string} text 要向量化的文本
 * @param {object} apiConfig 从 getProjectSettings().apiConfig 传入的配置
 * @returns {Promise<number[]|null>} 浮点数数组形式的向量
 */
export async function getEmbedding(text, apiConfig, options = {}) {
    const { throwOnError = false, ignoreBackoff = false } = options;
    const fail = (message) => {
        if (throwOnError) throw new Error(message);
        return null;
    };

    if (!text || text.trim() === '') return null;
    // 没有配置 Embedding Key 时静默跳过，不发请求
    if (!apiConfig?.embedApiKey && !apiConfig?.embeddingApiKey && !apiConfig?.apiKey) {
        return fail('未配置 Embedding API Key');
    }
    // 如果上次失败的退避期还没过，直接跳过
    if (!ignoreBackoff && Date.now() < _embedErrorUntil) {
        return fail('Embedding API 处于短暂失败退避中，请稍后重试');
    }

    try {
        const res = await fetch('/api/embed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, apiConfig })
        });

        if (!res.ok) {
            const errorText = await res.text();
            const log = throwOnError ? console.error : console.warn;
            log('getEmbedding HTTP error:', errorText);
            if (!ignoreBackoff) _embedErrorUntil = Date.now() + EMBED_BACKOFF_MS;
            return fail(describeEmbedError(res.status, errorText));
        }

        const data = await res.json();
        if (data.error) {
            const log = throwOnError ? console.error : console.warn;
            log('getEmbedding API error:', data.error);
            return fail(data.error);
        }

        if (!Array.isArray(data.embedding) || data.embedding.length === 0) {
            return fail('Embedding API 未返回有效向量，请检查模型是否为 embedding 模型');
        }

        return data.embedding;
    } catch (err) {
        const log = throwOnError ? console.error : console.warn;
        log('getEmbedding fetch error:', err);
        if (!ignoreBackoff) _embedErrorUntil = Date.now() + EMBED_BACKOFF_MS;
        return fail(err?.message || String(err));
    }
}

/**
 * 计算两个向量之间的余弦相似度
 * @param {number[]} vecA 向量 A
 * @param {number[]} vecB 向量 B
 * @returns {number} 相似度得分 (-1.0 到 1.0)
 */
export function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
