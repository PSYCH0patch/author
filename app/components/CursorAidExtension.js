'use client';

// 光标辅助扩展：
//   ① 高亮当前段落（光标所在的最近 textblock），加 class `cursor-aid-block`
//   ② 失焦时在原光标位置渲染一个“假光标” widget（class `cursor-aid-caret`）
// 插件本身无条件计算 decoration；是否显示底色由容器 class + CSS 控制（① 受设置开关），
// 失焦假光标默认显示（只在失焦且为折叠光标时出现，不干扰正常编辑）。

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const cursorAidPluginKey = new PluginKey('cursorAid');

function buildDecorations(state, focused) {
    const { selection, doc } = state;
    const decorations = [];

    // ① 当前段：从光标位置向上找最近的 textblock（段落/标题等）
    const { $head } = selection;
    for (let depth = $head.depth; depth > 0; depth--) {
        const node = $head.node(depth);
        if (node?.isTextblock) {
            const from = $head.before(depth);
            decorations.push(Decoration.node(from, from + node.nodeSize, { class: 'cursor-aid-block' }));
            break;
        }
    }

    // ② 失焦时在折叠光标处渲染假光标（有选区时不渲染，选区本身已可见）
    if (!focused && selection.empty) {
        decorations.push(Decoration.widget(selection.head, () => {
            const caret = document.createElement('span');
            caret.className = 'cursor-aid-caret';
            caret.setAttribute('aria-hidden', 'true');
            return caret;
        }, { side: 1, ignoreSelection: true, key: 'cursor-aid-caret' }));
    }

    return DecorationSet.create(doc, decorations);
}

export const CursorAidExtension = Extension.create({
    name: 'cursorAid',

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: cursorAidPluginKey,
                state: {
                    init: () => ({ focused: true }),
                    apply(tr, value) {
                        const meta = tr.getMeta(cursorAidPluginKey);
                        if (meta && typeof meta.focused === 'boolean') return { focused: meta.focused };
                        return value;
                    },
                },
                props: {
                    decorations(state) {
                        const pluginState = cursorAidPluginKey.getState(state);
                        return buildDecorations(state, pluginState ? pluginState.focused : true);
                    },
                    handleDOMEvents: {
                        focus(view) {
                            if (!cursorAidPluginKey.getState(view.state)?.focused) {
                                view.dispatch(view.state.tr.setMeta(cursorAidPluginKey, { focused: true }));
                            }
                            return false;
                        },
                        blur(view) {
                            if (cursorAidPluginKey.getState(view.state)?.focused) {
                                view.dispatch(view.state.tr.setMeta(cursorAidPluginKey, { focused: false }));
                            }
                            return false;
                        },
                    },
                },
            }),
        ];
    },
});

export default CursorAidExtension;
