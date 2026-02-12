module.exports = [
"[project]/web/lib/api.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getAssets",
    ()=>getAssets,
    "getEdits",
    ()=>getEdits,
    "getTranscript",
    ()=>getTranscript,
    "listRuns",
    ()=>listRuns,
    "mediaUrl",
    ()=>mediaUrl,
    "pipelineStreamUrl",
    ()=>pipelineStreamUrl,
    "saveEdits",
    ()=>saveEdits,
    "triggerPipeline",
    ()=>triggerPipeline,
    "uploadVideo",
    ()=>uploadVideo
]);
const BASE = "/api";
async function fetchJson(url, init) {
    const res = await fetch(url, init);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
    }
    return res.json();
}
async function listRuns() {
    return fetchJson(`${BASE}/runs`);
}
async function getTranscript(runId) {
    return fetchJson(`${BASE}/runs/${runId}/transcript`);
}
async function getAssets(runId) {
    return fetchJson(`${BASE}/runs/${runId}/assets`);
}
async function getEdits(runId) {
    return fetchJson(`${BASE}/runs/${runId}/edits`);
}
async function saveEdits(runId, shorts) {
    await fetchJson(`${BASE}/runs/${runId}/edits`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(shorts)
    });
}
async function uploadVideo(video, script) {
    const formData = new FormData();
    formData.append("video", video);
    formData.append("script", script);
    const res = await fetch(`${BASE}/upload`, {
        method: "POST",
        body: formData
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Upload failed: ${res.status}: ${text}`);
    }
    return res.json();
}
function mediaUrl(relativePath) {
    return `${BASE}/media?path=${encodeURIComponent(relativePath)}`;
}
async function triggerPipeline(stage, body) {
    return fetchJson(`${BASE}/pipeline/${stage}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
}
function pipelineStreamUrl(stage, jobId) {
    return `${BASE}/pipeline/${stage}/stream?jobId=${jobId}`;
}
}),
"[project]/web/lib/timeline-utils.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "concatToSourceTime",
    ()=>concatToSourceTime,
    "findSegmentAt",
    ()=>findSegmentAt,
    "formatTime",
    ()=>formatTime,
    "formatTimeShort",
    ()=>formatTimeShort,
    "getWordsInSegments",
    ()=>getWordsInSegments,
    "pixelToTime",
    ()=>pixelToTime,
    "remapWordsToConcatTime",
    ()=>remapWordsToConcatTime,
    "sourceToConcatTime",
    ()=>sourceToConcatTime,
    "timeToPixel",
    ()=>timeToPixel,
    "totalConcatDuration",
    ()=>totalConcatDuration
]);
function sourceToConcatTime(sourceTime, segments) {
    let concatOffset = 0;
    for (const seg of segments){
        if (sourceTime >= seg.start && sourceTime <= seg.end) {
            return concatOffset + (sourceTime - seg.start);
        }
        concatOffset += seg.end - seg.start;
    }
    return null; // sourceTime is in a gap (removed content)
}
function concatToSourceTime(concatTime, segments) {
    let remaining = concatTime;
    for (const seg of segments){
        const segDuration = seg.end - seg.start;
        if (remaining <= segDuration) {
            return seg.start + remaining;
        }
        remaining -= segDuration;
    }
    // Past end - return end of last segment
    const last = segments[segments.length - 1];
    return last ? last.end : 0;
}
function totalConcatDuration(segments) {
    return segments.reduce((sum, seg)=>sum + (seg.end - seg.start), 0);
}
function findSegmentAt(sourceTime, segments) {
    return segments.findIndex((seg)=>sourceTime >= seg.start && sourceTime <= seg.end);
}
function pixelToTime(x, zoom, scrollX) {
    return (x + scrollX) / zoom;
}
function timeToPixel(time, zoom, scrollX) {
    return time * zoom - scrollX;
}
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toFixed(1).padStart(4, "0")}`;
}
function formatTimeShort(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}
function remapWordsToConcatTime(words, segments) {
    return words.map((w)=>{
        const start = sourceToConcatTime(w.start, segments);
        const end = sourceToConcatTime(w.end, segments);
        if (start === null || end === null) return null;
        return {
            ...w,
            start,
            end
        };
    }).filter((w)=>w !== null);
}
function getWordsInSegments(allWords, segments) {
    return allWords.filter((w)=>segments.some((seg)=>w.start >= seg.start && w.end <= seg.end));
}
}),
"[project]/web/lib/store.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useEditorStore",
    ()=>useEditorStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/zustand/esm/react.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$zundo$2f$dist$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/zundo/dist/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/api.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/timeline-utils.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
function getActiveShort(shorts, id) {
    if (id === null) return undefined;
    return shorts.find((s)=>s.id === id);
}
const useEditorStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$zundo$2f$dist$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["temporal"])((set, get)=>({
        // Initial state
        runs: [],
        currentRunId: null,
        transcript: null,
        assets: null,
        shorts: [],
        activeShortId: null,
        zoom: 80,
        scrollX: 0,
        cursorTime: 0,
        isPlaying: false,
        activeTool: "select",
        selectedItems: [],
        duration: 0,
        pipelineStatus: {
            pull: "idle",
            transcribe: "idle",
            analyze: "idle",
            align: "idle",
            edit: "idle",
            subtitles: "idle"
        },
        pipelineLogs: [],
        activeJob: null,
        isDirty: false,
        fetchRuns: async ()=>{
            const runs = await __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["listRuns"]();
            set({
                runs
            });
        },
        loadRun: async (runId)=>{
            set({
                currentRunId: runId,
                shorts: [],
                activeShortId: null
            });
            try {
                const [transcript, assets, edits] = await Promise.allSettled([
                    __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getTranscript"](runId),
                    __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAssets"](runId),
                    __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getEdits"](runId)
                ]);
                set({
                    transcript: transcript.status === "fulfilled" ? transcript.value : null,
                    assets: assets.status === "fulfilled" ? assets.value : null,
                    shorts: edits.status === "fulfilled" ? edits.value : []
                });
                // Auto-select first short
                const shorts = edits.status === "fulfilled" ? edits.value : [];
                if (shorts.length > 0) {
                    get().selectShort(shorts[0].id);
                }
            } catch (e) {
                console.error("Failed to load run:", e);
            }
        },
        selectShort: (shortId)=>{
            const short = getActiveShort(get().shorts, shortId);
            set({
                activeShortId: shortId,
                cursorTime: 0,
                scrollX: 0,
                selectedItems: [],
                duration: short ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["totalConcatDuration"])(short.segmentsToKeep) : 0
            });
        },
        setZoom: (zoom)=>set({
                zoom: Math.max(10, Math.min(500, zoom))
            }),
        setScrollX: (scrollX)=>set({
                scrollX: Math.max(0, scrollX)
            }),
        setCursorTime: (cursorTime)=>set({
                cursorTime: Math.max(0, cursorTime)
            }),
        setIsPlaying: (isPlaying)=>set({
                isPlaying
            }),
        togglePlay: ()=>set((s)=>({
                    isPlaying: !s.isPlaying
                })),
        setActiveTool: (activeTool)=>set({
                activeTool
            }),
        setSelectedItems: (selectedItems)=>set({
                selectedItems
            }),
        clearSelection: ()=>set({
                selectedItems: []
            }),
        updateShort: (shortId, updates)=>{
            set((s)=>({
                    shorts: s.shorts.map((sh)=>sh.id === shortId ? {
                            ...sh,
                            ...updates
                        } : sh),
                    isDirty: true
                }));
        },
        splitSegment: (segmentIndex, sourceTime)=>{
            const { activeShortId, shorts } = get();
            const short = getActiveShort(shorts, activeShortId);
            if (!short) return;
            const seg = short.segmentsToKeep[segmentIndex];
            if (!seg || sourceTime <= seg.start || sourceTime >= seg.end) return;
            const newSegments = [
                ...short.segmentsToKeep
            ];
            newSegments.splice(segmentIndex, 1, {
                start: seg.start,
                end: sourceTime
            }, {
                start: sourceTime,
                end: seg.end
            });
            get().updateShort(short.id, {
                segmentsToKeep: newSegments
            });
        },
        deleteSegment: (segmentIndex)=>{
            const { activeShortId, shorts } = get();
            const short = getActiveShort(shorts, activeShortId);
            if (!short || short.segmentsToKeep.length <= 1) return;
            const newSegments = short.segmentsToKeep.filter((_, i)=>i !== segmentIndex);
            get().updateShort(short.id, {
                segmentsToKeep: newSegments
            });
            set({
                duration: (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["totalConcatDuration"])(newSegments),
                selectedItems: []
            });
        },
        moveOverlay: (overlayIndex, newStartAt)=>{
            const { activeShortId, shorts } = get();
            const short = getActiveShort(shorts, activeShortId);
            if (!short) return;
            const newOverlays = [
                ...short.overlays
            ];
            newOverlays[overlayIndex] = {
                ...newOverlays[overlayIndex],
                startAt: newStartAt
            };
            get().updateShort(short.id, {
                overlays: newOverlays
            });
        },
        resizeOverlay: (overlayIndex, newStartAt, newDuration)=>{
            const { activeShortId, shorts } = get();
            const short = getActiveShort(shorts, activeShortId);
            if (!short) return;
            const newOverlays = [
                ...short.overlays
            ];
            newOverlays[overlayIndex] = {
                ...newOverlays[overlayIndex],
                startAt: newStartAt,
                duration: Math.max(0.5, newDuration)
            };
            get().updateShort(short.id, {
                overlays: newOverlays
            });
        },
        addOverlay: (overlay)=>{
            const { activeShortId, shorts } = get();
            const short = getActiveShort(shorts, activeShortId);
            if (!short) return;
            get().updateShort(short.id, {
                overlays: [
                    ...short.overlays,
                    overlay
                ]
            });
        },
        deleteOverlay: (overlayIndex)=>{
            const { activeShortId, shorts } = get();
            const short = getActiveShort(shorts, activeShortId);
            if (!short) return;
            get().updateShort(short.id, {
                overlays: short.overlays.filter((_, i)=>i !== overlayIndex)
            });
            set({
                selectedItems: []
            });
        },
        moveSfx: (sfxIndex, newAt)=>{
            const { activeShortId, shorts } = get();
            const short = getActiveShort(shorts, activeShortId);
            if (!short) return;
            const newSfx = [
                ...short.sfx
            ];
            newSfx[sfxIndex] = {
                ...newSfx[sfxIndex],
                at: newAt
            };
            get().updateShort(short.id, {
                sfx: newSfx
            });
        },
        addSfx: (sfx)=>{
            const { activeShortId, shorts } = get();
            const short = getActiveShort(shorts, activeShortId);
            if (!short) return;
            get().updateShort(short.id, {
                sfx: [
                    ...short.sfx,
                    sfx
                ]
            });
        },
        deleteSfx: (sfxIndex)=>{
            const { activeShortId, shorts } = get();
            const short = getActiveShort(shorts, activeShortId);
            if (!short) return;
            get().updateShort(short.id, {
                sfx: short.sfx.filter((_, i)=>i !== sfxIndex)
            });
            set({
                selectedItems: []
            });
        },
        trimSegment: (segmentIndex, edge, newTime)=>{
            const { activeShortId, shorts } = get();
            const short = getActiveShort(shorts, activeShortId);
            if (!short) return;
            const seg = short.segmentsToKeep[segmentIndex];
            if (!seg) return;
            const newSegments = [
                ...short.segmentsToKeep
            ];
            if (edge === "left") {
                newSegments[segmentIndex] = {
                    start: Math.min(newTime, seg.end - 0.1),
                    end: seg.end
                };
            } else {
                newSegments[segmentIndex] = {
                    start: seg.start,
                    end: Math.max(newTime, seg.start + 0.1)
                };
            }
            get().updateShort(short.id, {
                segmentsToKeep: newSegments
            });
            set({
                duration: (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["totalConcatDuration"])(newSegments)
            });
        },
        updateSubtitleWord: (wordIndex, newWord)=>{
            const { activeShortId, shorts } = get();
            const short = getActiveShort(shorts, activeShortId);
            if (!short) return;
            const newWords = [
                ...short.subtitleWords
            ];
            newWords[wordIndex] = {
                ...newWords[wordIndex],
                word: newWord
            };
            get().updateShort(short.id, {
                subtitleWords: newWords
            });
        },
        saveEdits: async ()=>{
            const { currentRunId, shorts } = get();
            if (!currentRunId) return;
            await __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["saveEdits"](currentRunId, shorts);
            set({
                isDirty: false
            });
        },
        triggerStage: async (stage, extra = {})=>{
            const { currentRunId, activeShortId } = get();
            if (!currentRunId) return;
            set((s)=>({
                    pipelineStatus: {
                        ...s.pipelineStatus,
                        [stage]: "running"
                    },
                    pipelineLogs: []
                }));
            try {
                const body = {
                    runId: currentRunId,
                    ...extra
                };
                if ((stage === "edit" || stage === "subtitles") && activeShortId !== null) {
                    body.shortId = activeShortId;
                }
                const { jobId } = await __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["triggerPipeline"](stage, body);
                set({
                    activeJob: {
                        stage,
                        jobId
                    }
                });
                // Open SSE stream
                const eventSource = new EventSource(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pipelineStreamUrl"](stage, jobId));
                eventSource.onmessage = (event)=>{
                    try {
                        const data = JSON.parse(event.data);
                        if (data.type === "log") {
                            set((s)=>({
                                    pipelineLogs: [
                                        ...s.pipelineLogs,
                                        data.data
                                    ]
                                }));
                        } else if (data.type === "done") {
                            set((s)=>({
                                    pipelineStatus: {
                                        ...s.pipelineStatus,
                                        [stage]: "success"
                                    },
                                    activeJob: null
                                }));
                            eventSource.close();
                            // Reload data after successful stage
                            if (stage === "analyze") {
                                get().loadRun(currentRunId);
                            }
                        } else if (data.type === "error") {
                            set((s)=>({
                                    pipelineStatus: {
                                        ...s.pipelineStatus,
                                        [stage]: "error"
                                    },
                                    activeJob: null
                                }));
                            eventSource.close();
                        }
                    } catch  {
                        // Non-JSON message, treat as log
                        set((s)=>({
                                pipelineLogs: [
                                    ...s.pipelineLogs,
                                    event.data
                                ]
                            }));
                    }
                };
                eventSource.onerror = ()=>{
                    set((s)=>({
                            pipelineStatus: {
                                ...s.pipelineStatus,
                                [stage]: "error"
                            },
                            activeJob: null
                        }));
                    eventSource.close();
                };
            } catch (e) {
                console.error("Pipeline trigger failed:", e);
                set((s)=>({
                        pipelineStatus: {
                            ...s.pipelineStatus,
                            [stage]: "error"
                        },
                        activeJob: null
                    }));
            }
        }
    }), {
    partialize: (state)=>({
            shorts: state.shorts
        }),
    limit: 50
}));
}),
"[project]/web/components/panels/RunPicker.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>RunPicker
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/store.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function RunPicker() {
    const runs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.runs);
    const currentRunId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.currentRunId);
    const fetchRuns = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.fetchRuns);
    const loadRun = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.loadRun);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        fetchRuns();
    }, [
        fetchRuns
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-center gap-2 px-3 py-2 border-b",
        style: {
            borderColor: "var(--border)"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "text-xs font-medium",
                style: {
                    color: "var(--text-secondary)"
                },
                children: "Run"
            }, void 0, false, {
                fileName: "[project]/web/components/panels/RunPicker.tsx",
                lineNumber: 18,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                value: currentRunId || "",
                onChange: (e)=>e.target.value && loadRun(e.target.value),
                className: "flex-1 text-sm",
                style: {
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    borderRadius: 6,
                    padding: "4px 8px"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                        value: "",
                        children: "Select a run..."
                    }, void 0, false, {
                        fileName: "[project]/web/components/panels/RunPicker.tsx",
                        lineNumber: 36,
                        columnNumber: 9
                    }, this),
                    runs.map((run)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                            value: run.id,
                            children: [
                                run.id,
                                run.hasEdits ? ` (${run.shortsCount} shorts)` : "",
                                !run.hasARoll ? " [no video]" : ""
                            ]
                        }, run.id, true, {
                            fileName: "[project]/web/components/panels/RunPicker.tsx",
                            lineNumber: 38,
                            columnNumber: 11
                        }, this))
                ]
            }, void 0, true, {
                fileName: "[project]/web/components/panels/RunPicker.tsx",
                lineNumber: 24,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>fetchRuns(),
                className: "text-xs px-2 py-1 rounded",
                style: {
                    background: "var(--bg-tertiary)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border)"
                },
                children: "Refresh"
            }, void 0, false, {
                fileName: "[project]/web/components/panels/RunPicker.tsx",
                lineNumber: 45,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/web/components/panels/RunPicker.tsx",
        lineNumber: 17,
        columnNumber: 5
    }, this);
}
}),
"[project]/web/components/panels/ShortsList.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ShortsList
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/store.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/timeline-utils.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function ShortsList() {
    const shorts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.shorts);
    const activeShortId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.activeShortId);
    const selectShort = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.selectShort);
    if (shorts.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-4 text-center text-sm",
            style: {
                color: "var(--text-muted)"
            },
            children: "No shorts found. Run the Analyze stage to generate edits."
        }, void 0, false, {
            fileName: "[project]/web/components/panels/ShortsList.tsx",
            lineNumber: 13,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-1 p-2 overflow-y-auto",
        style: {
            maxHeight: "calc(100vh - 400px)"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-xs font-semibold uppercase tracking-wider px-2 py-1",
                style: {
                    color: "var(--text-muted)"
                },
                children: [
                    "Shorts (",
                    shorts.length,
                    ")"
                ]
            }, void 0, true, {
                fileName: "[project]/web/components/panels/ShortsList.tsx",
                lineNumber: 24,
                columnNumber: 7
            }, this),
            shorts.map((short)=>{
                const duration = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["totalConcatDuration"])(short.segmentsToKeep);
                const isActive = short.id === activeShortId;
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: ()=>selectShort(short.id),
                    className: "w-full text-left rounded-lg px-3 py-2.5 transition-colors",
                    style: {
                        background: isActive ? "var(--accent-muted)" : "transparent",
                        border: isActive ? "1px solid var(--accent)" : "1px solid transparent"
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center justify-between",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-xs font-mono",
                                    style: {
                                        color: isActive ? "var(--accent)" : "var(--text-muted)"
                                    },
                                    children: [
                                        "#",
                                        short.id
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/web/components/panels/ShortsList.tsx",
                                    lineNumber: 47,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-xs font-mono",
                                    style: {
                                        color: "var(--text-muted)"
                                    },
                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatTimeShort"])(duration)
                                }, void 0, false, {
                                    fileName: "[project]/web/components/panels/ShortsList.tsx",
                                    lineNumber: 55,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/web/components/panels/ShortsList.tsx",
                            lineNumber: 46,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-sm mt-0.5 truncate",
                            style: {
                                color: isActive ? "var(--text-primary)" : "var(--text-secondary)"
                            },
                            children: short.title
                        }, void 0, false, {
                            fileName: "[project]/web/components/panels/ShortsList.tsx",
                            lineNumber: 62,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex gap-2 mt-1 text-xs",
                            style: {
                                color: "var(--text-muted)"
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: [
                                        short.segmentsToKeep.length,
                                        " segs"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/web/components/panels/ShortsList.tsx",
                                    lineNumber: 76,
                                    columnNumber: 15
                                }, this),
                                short.overlays.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    style: {
                                        color: "var(--broll)"
                                    },
                                    children: [
                                        short.overlays.length,
                                        " overlays"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/web/components/panels/ShortsList.tsx",
                                    lineNumber: 78,
                                    columnNumber: 17
                                }, this),
                                short.sfx.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    style: {
                                        color: "var(--sfx)"
                                    },
                                    children: [
                                        short.sfx.length,
                                        " sfx"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/web/components/panels/ShortsList.tsx",
                                    lineNumber: 83,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/web/components/panels/ShortsList.tsx",
                            lineNumber: 72,
                            columnNumber: 13
                        }, this)
                    ]
                }, short.id, true, {
                    fileName: "[project]/web/components/panels/ShortsList.tsx",
                    lineNumber: 35,
                    columnNumber: 11
                }, this);
            })
        ]
    }, void 0, true, {
        fileName: "[project]/web/components/panels/ShortsList.tsx",
        lineNumber: 23,
        columnNumber: 5
    }, this);
}
}),
"[project]/web/components/pipeline/PipelineControls.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PipelineControls
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/store.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
const STAGES = [
    {
        key: "pull",
        label: "Pull",
        description: "Download video & assets from Drive"
    },
    {
        key: "transcribe",
        label: "Transcribe",
        description: "Transcribe audio with Whisper"
    },
    {
        key: "analyze",
        label: "Auto Edit",
        description: "AI generates shorts from transcript"
    },
    {
        key: "edit",
        label: "Render",
        description: "FFmpeg renders the short video"
    },
    {
        key: "subtitles",
        label: "Subtitles",
        description: "Add animated captions"
    }
];
const STATUS_ICONS = {
    idle: {
        icon: "○",
        color: "var(--text-muted)"
    },
    running: {
        icon: "◎",
        color: "var(--accent)"
    },
    success: {
        icon: "●",
        color: "var(--success)"
    },
    error: {
        icon: "●",
        color: "var(--error)"
    }
};
function PipelineControls() {
    const currentRunId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.currentRunId);
    const pipelineStatus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.pipelineStatus);
    const pipelineLogs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.pipelineLogs);
    const activeJob = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.activeJob);
    const triggerStage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.triggerStage);
    const [showLogs, setShowLogs] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [pullSource, setPullSource] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const logsEndRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        logsEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [
        pipelineLogs
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-1 p-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-xs font-semibold uppercase tracking-wider px-2 py-1",
                style: {
                    color: "var(--text-muted)"
                },
                children: "Pipeline"
            }, void 0, false, {
                fileName: "[project]/web/components/pipeline/PipelineControls.tsx",
                lineNumber: 59,
                columnNumber: 7
            }, this),
            STAGES.map(({ key, label, description })=>{
                const status = pipelineStatus[key];
                const { icon, color } = STATUS_ICONS[status];
                const isRunning = status === "running";
                const isDisabled = isRunning || !currentRunId && key !== "pull";
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    children: [
                        key === "pull" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            type: "text",
                            placeholder: "Drive ID or local path...",
                            value: pullSource,
                            onChange: (e)=>setPullSource(e.target.value),
                            className: "w-full text-xs mb-1 px-2 py-1.5 rounded",
                            style: {
                                background: "var(--bg-tertiary)",
                                border: "1px solid var(--border)",
                                color: "var(--text-primary)"
                            }
                        }, void 0, false, {
                            fileName: "[project]/web/components/pipeline/PipelineControls.tsx",
                            lineNumber: 76,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>{
                                const extra = {};
                                if (key === "pull" && pullSource) {
                                    extra.source = pullSource;
                                }
                                triggerStage(key, extra);
                                setShowLogs(true);
                            },
                            disabled: isDisabled,
                            className: "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all",
                            style: {
                                background: isRunning ? "var(--accent-muted)" : "var(--bg-tertiary)",
                                border: "1px solid var(--border)",
                                opacity: isDisabled && !isRunning ? 0.5 : 1,
                                cursor: isDisabled ? "not-allowed" : "pointer"
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    style: {
                                        color,
                                        fontSize: 14
                                    },
                                    className: isRunning ? "animate-pulse" : "",
                                    children: icon
                                }, void 0, false, {
                                    fileName: "[project]/web/components/pipeline/PipelineControls.tsx",
                                    lineNumber: 109,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex-1 min-w-0",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-sm font-medium",
                                            style: {
                                                color: isRunning ? "var(--accent)" : "var(--text-primary)"
                                            },
                                            children: label
                                        }, void 0, false, {
                                            fileName: "[project]/web/components/pipeline/PipelineControls.tsx",
                                            lineNumber: 116,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-xs truncate",
                                            style: {
                                                color: "var(--text-muted)"
                                            },
                                            children: description
                                        }, void 0, false, {
                                            fileName: "[project]/web/components/pipeline/PipelineControls.tsx",
                                            lineNumber: 126,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/web/components/pipeline/PipelineControls.tsx",
                                    lineNumber: 115,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/web/components/pipeline/PipelineControls.tsx",
                            lineNumber: 89,
                            columnNumber: 13
                        }, this)
                    ]
                }, key, true, {
                    fileName: "[project]/web/components/pipeline/PipelineControls.tsx",
                    lineNumber: 74,
                    columnNumber: 11
                }, this);
            }),
            showLogs && pipelineLogs.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-2 rounded-lg overflow-hidden",
                style: {
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between px-2 py-1",
                        style: {
                            borderBottom: "1px solid var(--border)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs font-medium",
                                style: {
                                    color: "var(--text-muted)"
                                },
                                children: "Logs"
                            }, void 0, false, {
                                fileName: "[project]/web/components/pipeline/PipelineControls.tsx",
                                lineNumber: 151,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setShowLogs(false),
                                className: "text-xs px-1",
                                style: {
                                    color: "var(--text-muted)"
                                },
                                children: "×"
                            }, void 0, false, {
                                fileName: "[project]/web/components/pipeline/PipelineControls.tsx",
                                lineNumber: 157,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/components/pipeline/PipelineControls.tsx",
                        lineNumber: 147,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-2 overflow-y-auto font-mono text-xs leading-relaxed",
                        style: {
                            maxHeight: 160,
                            color: "var(--text-secondary)",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-all"
                        },
                        children: [
                            pipelineLogs.map((log, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: log
                                }, i, false, {
                                    fileName: "[project]/web/components/pipeline/PipelineControls.tsx",
                                    lineNumber: 175,
                                    columnNumber: 15
                                }, this)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                ref: logsEndRef
                            }, void 0, false, {
                                fileName: "[project]/web/components/pipeline/PipelineControls.tsx",
                                lineNumber: 177,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/components/pipeline/PipelineControls.tsx",
                        lineNumber: 165,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/web/components/pipeline/PipelineControls.tsx",
                lineNumber: 140,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/web/components/pipeline/PipelineControls.tsx",
        lineNumber: 58,
        columnNumber: 5
    }, this);
}
}),
"[project]/web/components/editor/VideoPlayer.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>VideoPlayer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/store.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/api.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/timeline-utils.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
function VideoPlayer() {
    const videoRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const animRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(0);
    const currentRunId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.currentRunId);
    const shorts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.shorts);
    const activeShortId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.activeShortId);
    const isPlaying = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.isPlaying);
    const cursorTime = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.cursorTime);
    const duration = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.duration);
    const setCursorTime = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.setCursorTime);
    const setIsPlaying = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.setIsPlaying);
    const activeShort = shorts.find((s)=>s.id === activeShortId);
    const segments = activeShort?.segmentsToKeep ?? [];
    const videoSrc = currentRunId ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mediaUrl"])(`runs/${currentRunId}/a-roll.mp4`) : "";
    // Seek video when cursor time changes (from timeline click etc.)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!videoRef.current || segments.length === 0) return;
        const sourceTime = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["concatToSourceTime"])(cursorTime, segments);
        const currentSourceTime = videoRef.current.currentTime;
        if (Math.abs(currentSourceTime - sourceTime) > 0.1) {
            videoRef.current.currentTime = sourceTime;
        }
    }, [
        cursorTime,
        segments
    ]);
    // Playback loop: sync video time to store, handle segment jumps
    const playbackLoop = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (!videoRef.current || segments.length === 0) return;
        const sourceTime = videoRef.current.currentTime;
        // Find which segment we're in
        const currentSegIdx = segments.findIndex((seg)=>sourceTime >= seg.start - 0.05 && sourceTime <= seg.end + 0.05);
        if (currentSegIdx === -1) {
            // We're in a gap - jump to the nearest next segment
            const nextSeg = segments.find((seg)=>seg.start > sourceTime);
            if (nextSeg) {
                videoRef.current.currentTime = nextSeg.start;
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
                return;
            }
        } else if (sourceTime >= segments[currentSegIdx].end - 0.03) {
            // End of current segment - jump to next or stop
            if (currentSegIdx < segments.length - 1) {
                videoRef.current.currentTime = segments[currentSegIdx + 1].start;
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
                return;
            }
        }
        // Update cursor time from video position
        const concatTime = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sourceToConcatTime"])(videoRef.current.currentTime, segments);
        if (concatTime !== null) {
            setCursorTime(concatTime);
        }
        animRef.current = requestAnimationFrame(playbackLoop);
    }, [
        segments,
        setCursorTime,
        setIsPlaying
    ]);
    // Start/stop playback
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!videoRef.current) return;
        if (isPlaying) {
            const sourceTime = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["concatToSourceTime"])(cursorTime, segments);
            videoRef.current.currentTime = sourceTime;
            videoRef.current.play().catch(()=>setIsPlaying(false));
            animRef.current = requestAnimationFrame(playbackLoop);
        } else {
            videoRef.current.pause();
            cancelAnimationFrame(animRef.current);
        }
        return ()=>cancelAnimationFrame(animRef.current);
    }, [
        isPlaying
    ]);
    const handleFrameStep = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((direction)=>{
        const frameTime = 1 / 30;
        const newTime = Math.max(0, Math.min(duration, cursorTime + direction * frameTime));
        setCursorTime(newTime);
    }, [
        cursorTime,
        duration,
        setCursorTime
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col h-full",
        style: {
            background: "var(--bg-primary)"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 flex items-center justify-center overflow-hidden relative",
                children: videoSrc ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("video", {
                    ref: videoRef,
                    src: videoSrc,
                    className: "max-h-full max-w-full object-contain",
                    style: {
                        borderRadius: 4
                    },
                    preload: "auto"
                }, void 0, false, {
                    fileName: "[project]/web/components/editor/VideoPlayer.tsx",
                    lineNumber: 123,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-sm",
                    style: {
                        color: "var(--text-muted)"
                    },
                    children: "Select a run to load video"
                }, void 0, false, {
                    fileName: "[project]/web/components/editor/VideoPlayer.tsx",
                    lineNumber: 131,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/web/components/editor/VideoPlayer.tsx",
                lineNumber: 121,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-3 px-4 py-2 border-t",
                style: {
                    borderColor: "var(--border)",
                    background: "var(--bg-secondary)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>handleFrameStep(-1),
                        className: "p-1.5 rounded hover:opacity-80",
                        style: {
                            color: "var(--text-secondary)"
                        },
                        title: "Previous frame (←)",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            width: "16",
                            height: "16",
                            viewBox: "0 0 24 24",
                            fill: "currentColor",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                d: "M6 6h2v12H6zm3.5 6 8.5 6V6z"
                            }, void 0, false, {
                                fileName: "[project]/web/components/editor/VideoPlayer.tsx",
                                lineNumber: 156,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/web/components/editor/VideoPlayer.tsx",
                            lineNumber: 155,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/web/components/editor/VideoPlayer.tsx",
                        lineNumber: 149,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"].getState().togglePlay(),
                        className: "p-2 rounded-full",
                        style: {
                            background: "var(--accent)",
                            color: "#fff"
                        },
                        title: "Play/Pause (Space)",
                        children: isPlaying ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            width: "18",
                            height: "18",
                            viewBox: "0 0 24 24",
                            fill: "currentColor",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                d: "M6 4h4v16H6zM14 4h4v16h-4z"
                            }, void 0, false, {
                                fileName: "[project]/web/components/editor/VideoPlayer.tsx",
                                lineNumber: 177,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/web/components/editor/VideoPlayer.tsx",
                            lineNumber: 171,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            width: "18",
                            height: "18",
                            viewBox: "0 0 24 24",
                            fill: "currentColor",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                d: "M8 5v14l11-7z"
                            }, void 0, false, {
                                fileName: "[project]/web/components/editor/VideoPlayer.tsx",
                                lineNumber: 186,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/web/components/editor/VideoPlayer.tsx",
                            lineNumber: 180,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/web/components/editor/VideoPlayer.tsx",
                        lineNumber: 161,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>handleFrameStep(1),
                        className: "p-1.5 rounded hover:opacity-80",
                        style: {
                            color: "var(--text-secondary)"
                        },
                        title: "Next frame (→)",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            width: "16",
                            height: "16",
                            viewBox: "0 0 24 24",
                            fill: "currentColor",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                d: "M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"
                            }, void 0, false, {
                                fileName: "[project]/web/components/editor/VideoPlayer.tsx",
                                lineNumber: 199,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/web/components/editor/VideoPlayer.tsx",
                            lineNumber: 198,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/web/components/editor/VideoPlayer.tsx",
                        lineNumber: 192,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1"
                    }, void 0, false, {
                        fileName: "[project]/web/components/editor/VideoPlayer.tsx",
                        lineNumber: 204,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "font-mono text-sm tabular-nums",
                        style: {
                            color: "var(--text-secondary)"
                        },
                        children: [
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatTime"])(cursorTime),
                            " / ",
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatTime"])(duration)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/components/editor/VideoPlayer.tsx",
                        lineNumber: 205,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/web/components/editor/VideoPlayer.tsx",
                lineNumber: 141,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/web/components/editor/VideoPlayer.tsx",
        lineNumber: 116,
        columnNumber: 5
    }, this);
}
}),
"[project]/web/components/editor/Toolbar.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Toolbar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/store.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/timeline-utils.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function Toolbar() {
    const activeTool = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.activeTool);
    const setActiveTool = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.setActiveTool);
    const zoom = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.zoom);
    const setZoom = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.setZoom);
    const cursorTime = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.cursorTime);
    const duration = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.duration);
    const isDirty = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.isDirty);
    const saveEdits = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.saveEdits);
    const triggerStage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.triggerStage);
    const activeShortId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.activeShortId);
    const tools = [
        {
            key: "select",
            label: "Select",
            shortcut: "V",
            icon: "↖"
        },
        {
            key: "cut",
            label: "Cut",
            shortcut: "C",
            icon: "✂"
        },
        {
            key: "trim",
            label: "Trim",
            shortcut: "T",
            icon: "⇔"
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-center gap-2 px-3 py-1.5 border-t",
        style: {
            borderColor: "var(--border)",
            background: "var(--bg-secondary)"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-1",
                children: tools.map((tool)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setActiveTool(tool.key),
                        className: "flex items-center gap-1 px-2.5 py-1 rounded text-sm transition-colors",
                        title: `${tool.label} (${tool.shortcut})`,
                        style: {
                            background: activeTool === tool.key ? "var(--accent-muted)" : "transparent",
                            color: activeTool === tool.key ? "var(--accent)" : "var(--text-secondary)",
                            border: activeTool === tool.key ? "1px solid var(--accent)" : "1px solid transparent"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: tool.icon
                            }, void 0, false, {
                                fileName: "[project]/web/components/editor/Toolbar.tsx",
                                lineNumber: 60,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs",
                                children: tool.label
                            }, void 0, false, {
                                fileName: "[project]/web/components/editor/Toolbar.tsx",
                                lineNumber: 61,
                                columnNumber: 13
                            }, this)
                        ]
                    }, tool.key, true, {
                        fileName: "[project]/web/components/editor/Toolbar.tsx",
                        lineNumber: 40,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/web/components/editor/Toolbar.tsx",
                lineNumber: 38,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-px h-5 mx-1",
                style: {
                    background: "var(--border)"
                }
            }, void 0, false, {
                fileName: "[project]/web/components/editor/Toolbar.tsx",
                lineNumber: 66,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-1.5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setZoom(zoom * 0.8),
                        className: "px-1.5 py-0.5 rounded text-xs",
                        style: {
                            color: "var(--text-secondary)",
                            background: "var(--bg-tertiary)"
                        },
                        children: "−"
                    }, void 0, false, {
                        fileName: "[project]/web/components/editor/Toolbar.tsx",
                        lineNumber: 73,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "range",
                        min: 10,
                        max: 500,
                        value: zoom,
                        onChange: (e)=>setZoom(Number(e.target.value)),
                        className: "w-20 h-1 accent-indigo-500",
                        style: {
                            accentColor: "var(--accent)"
                        }
                    }, void 0, false, {
                        fileName: "[project]/web/components/editor/Toolbar.tsx",
                        lineNumber: 83,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setZoom(zoom * 1.2),
                        className: "px-1.5 py-0.5 rounded text-xs",
                        style: {
                            color: "var(--text-secondary)",
                            background: "var(--bg-tertiary)"
                        },
                        children: "+"
                    }, void 0, false, {
                        fileName: "[project]/web/components/editor/Toolbar.tsx",
                        lineNumber: 92,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-xs font-mono w-12",
                        style: {
                            color: "var(--text-muted)"
                        },
                        children: [
                            Math.round(zoom),
                            "px/s"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/components/editor/Toolbar.tsx",
                        lineNumber: 102,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/web/components/editor/Toolbar.tsx",
                lineNumber: 72,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1"
            }, void 0, false, {
                fileName: "[project]/web/components/editor/Toolbar.tsx",
                lineNumber: 110,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "font-mono text-sm tabular-nums",
                style: {
                    color: "var(--text-secondary)"
                },
                children: [
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatTime"])(cursorTime),
                    " / ",
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatTime"])(duration)
                ]
            }, void 0, true, {
                fileName: "[project]/web/components/editor/Toolbar.tsx",
                lineNumber: 113,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-px h-5 mx-1",
                style: {
                    background: "var(--border)"
                }
            }, void 0, false, {
                fileName: "[project]/web/components/editor/Toolbar.tsx",
                lineNumber: 120,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"].temporal.getState().undo(),
                className: "px-2 py-1 rounded text-xs",
                style: {
                    color: "var(--text-secondary)",
                    background: "var(--bg-tertiary)"
                },
                title: "Undo (Ctrl+Z)",
                children: "Undo"
            }, void 0, false, {
                fileName: "[project]/web/components/editor/Toolbar.tsx",
                lineNumber: 126,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"].temporal.getState().redo(),
                className: "px-2 py-1 rounded text-xs",
                style: {
                    color: "var(--text-secondary)",
                    background: "var(--bg-tertiary)"
                },
                title: "Redo (Ctrl+Shift+Z)",
                children: "Redo"
            }, void 0, false, {
                fileName: "[project]/web/components/editor/Toolbar.tsx",
                lineNumber: 137,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-px h-5 mx-1",
                style: {
                    background: "var(--border)"
                }
            }, void 0, false, {
                fileName: "[project]/web/components/editor/Toolbar.tsx",
                lineNumber: 149,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>saveEdits(),
                className: "px-3 py-1 rounded text-xs font-medium transition-colors",
                style: {
                    background: isDirty ? "var(--accent)" : "var(--bg-tertiary)",
                    color: isDirty ? "#fff" : "var(--text-secondary)"
                },
                title: "Save (Ctrl+S)",
                children: isDirty ? "Save*" : "Saved"
            }, void 0, false, {
                fileName: "[project]/web/components/editor/Toolbar.tsx",
                lineNumber: 155,
                columnNumber: 7
            }, this),
            activeShortId !== null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: async ()=>{
                    await saveEdits();
                    await triggerStage("edit");
                },
                className: "px-3 py-1 rounded text-xs font-medium",
                style: {
                    background: "var(--bg-tertiary)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border)"
                },
                title: "Re-render current short",
                children: "Re-render"
            }, void 0, false, {
                fileName: "[project]/web/components/editor/Toolbar.tsx",
                lineNumber: 169,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/web/components/editor/Toolbar.tsx",
        lineNumber: 30,
        columnNumber: 5
    }, this);
}
}),
"[project]/web/components/editor/Timeline.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Timeline
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/store.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/timeline-utils.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
// Track config
const TRACKS = [
    {
        id: "aroll",
        type: "aroll",
        label: "A-Roll",
        height: 72,
        color: "#3b82f6"
    },
    {
        id: "overlay",
        type: "overlay",
        label: "Overlays",
        height: 56,
        color: "#6366f1"
    },
    {
        id: "subtitle",
        type: "subtitle",
        label: "Subtitles",
        height: 44,
        color: "#a855f7"
    },
    {
        id: "sfx",
        type: "sfx",
        label: "SFX",
        height: 36,
        color: "#f59e0b"
    }
];
const RULER_HEIGHT = 28;
const TRACK_GAP = 2;
const LABEL_WIDTH = 72;
function Timeline() {
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [dragState, setDragState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        mode: "idle"
    });
    const [canvasSize, setCanvasSize] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        width: 0,
        height: 0
    });
    const shorts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.shorts);
    const activeShortId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.activeShortId);
    const zoom = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.zoom);
    const scrollX = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.scrollX);
    const cursorTime = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.cursorTime);
    const duration = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.duration);
    const activeTool = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.activeTool);
    const selectedItems = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.selectedItems);
    const setCursorTime = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.setCursorTime);
    const setZoom = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.setZoom);
    const setScrollX = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.setScrollX);
    const setSelectedItems = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.setSelectedItems);
    const splitSegment = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.splitSegment);
    const moveOverlay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.moveOverlay);
    const resizeOverlay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.resizeOverlay);
    const moveSfx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.moveSfx);
    const trimSegment = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.trimSegment);
    const deleteSegment = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.deleteSegment);
    const deleteOverlay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.deleteOverlay);
    const deleteSfx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.deleteSfx);
    const activeShort = shorts.find((s)=>s.id === activeShortId);
    // Compute total height
    const totalTrackHeight = TRACKS.reduce((sum, t)=>sum + t.height + TRACK_GAP, 0);
    const canvasHeight = RULER_HEIGHT + totalTrackHeight + 8;
    // Resize observer
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const container = containerRef.current;
        if (!container) return;
        const observer = new ResizeObserver((entries)=>{
            const { width } = entries[0].contentRect;
            setCanvasSize({
                width,
                height: canvasHeight
            });
        });
        observer.observe(container);
        return ()=>observer.disconnect();
    }, [
        canvasHeight
    ]);
    // Helper: get Y offset for a track
    const getTrackY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((trackIndex)=>{
        let y = RULER_HEIGHT;
        for(let i = 0; i < trackIndex; i++){
            y += TRACKS[i].height + TRACK_GAP;
        }
        return y;
    }, []);
    // Helper: find which track a Y coordinate falls in
    const getTrackAtY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((y)=>{
        let currentY = RULER_HEIGHT;
        for(let i = 0; i < TRACKS.length; i++){
            if (y >= currentY && y < currentY + TRACKS[i].height) return i;
            currentY += TRACKS[i].height + TRACK_GAP;
        }
        return -1;
    }, []);
    // Render canvas
    const render = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        const canvas = canvasRef.current;
        if (!canvas || !activeShort) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvasSize.width * dpr;
        canvas.height = canvasSize.height * dpr;
        ctx.scale(dpr, dpr);
        const w = canvasSize.width;
        const h = canvasSize.height;
        // Clear
        ctx.fillStyle = "#0f0f17";
        ctx.fillRect(0, 0, w, h);
        const txp = (time)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["timeToPixel"])(time, zoom, scrollX) + LABEL_WIDTH;
        // --- Ruler ---
        ctx.fillStyle = "#151520";
        ctx.fillRect(0, 0, w, RULER_HEIGHT);
        ctx.strokeStyle = "#2a2a3a";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, RULER_HEIGHT);
        ctx.lineTo(w, RULER_HEIGHT);
        ctx.stroke();
        // Time ticks
        const tickInterval = getTickInterval(zoom);
        const startTime = Math.floor((0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pixelToTime"])(-LABEL_WIDTH + scrollX, zoom, 0) / tickInterval) * tickInterval;
        const endTime = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pixelToTime"])(w - LABEL_WIDTH + scrollX, zoom, 0);
        ctx.font = "10px -apple-system, sans-serif";
        ctx.fillStyle = "#606078";
        ctx.textAlign = "center";
        for(let t = startTime; t <= endTime; t += tickInterval){
            if (t < 0) continue;
            const x = txp(t);
            if (x < LABEL_WIDTH || x > w) continue;
            // Major tick
            ctx.strokeStyle = "#2a2a3a";
            ctx.beginPath();
            ctx.moveTo(x, RULER_HEIGHT - 8);
            ctx.lineTo(x, RULER_HEIGHT);
            ctx.stroke();
            ctx.fillText((0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatTimeShort"])(t), x, RULER_HEIGHT - 12);
            // Minor ticks
            const minorInterval = tickInterval / 4;
            for(let mt = t + minorInterval; mt < t + tickInterval; mt += minorInterval){
                const mx = txp(mt);
                if (mx < LABEL_WIDTH || mx > w) continue;
                ctx.strokeStyle = "#1e1e2a";
                ctx.beginPath();
                ctx.moveTo(mx, RULER_HEIGHT - 4);
                ctx.lineTo(mx, RULER_HEIGHT);
                ctx.stroke();
            }
        }
        // --- Track labels ---
        TRACKS.forEach((track, i)=>{
            const y = getTrackY(i);
            ctx.fillStyle = "#12121a";
            ctx.fillRect(0, y, LABEL_WIDTH, track.height);
            ctx.strokeStyle = "#2a2a3a";
            ctx.strokeRect(0, y, LABEL_WIDTH, track.height);
            ctx.fillStyle = "#9090a8";
            ctx.font = "11px -apple-system, sans-serif";
            ctx.textAlign = "left";
            ctx.fillText(track.label, 8, y + track.height / 2 + 4);
        });
        // --- Track backgrounds ---
        TRACKS.forEach((track, i)=>{
            const y = getTrackY(i);
            ctx.fillStyle = "#0d0d15";
            ctx.fillRect(LABEL_WIDTH, y, w - LABEL_WIDTH, track.height);
        });
        // --- A-Roll segments ---
        const arollY = getTrackY(0);
        const arollH = TRACKS[0].height;
        let concatOffset = 0;
        activeShort.segmentsToKeep.forEach((seg, i)=>{
            const segDuration = seg.end - seg.start;
            const x = txp(concatOffset);
            const segW = segDuration * zoom;
            const isSelected = selectedItems.some((s)=>s.type === "segment" && s.index === i);
            if (x + segW > LABEL_WIDTH && x < w) {
                // Segment body
                const clampX = Math.max(LABEL_WIDTH, x);
                const clampW = Math.min(x + segW, w) - clampX;
                ctx.fillStyle = isSelected ? "rgba(59, 130, 246, 0.45)" : "rgba(59, 130, 246, 0.25)";
                ctx.fillRect(clampX, arollY + 2, clampW, arollH - 4);
                // Border
                ctx.strokeStyle = isSelected ? "#60a5fa" : "#3b82f6";
                ctx.lineWidth = isSelected ? 2 : 1;
                ctx.strokeRect(clampX, arollY + 2, clampW, arollH - 4);
                // Label
                if (segW > 40) {
                    ctx.fillStyle = "#93bbfc";
                    ctx.font = "10px -apple-system, sans-serif";
                    ctx.textAlign = "left";
                    const labelX = Math.max(clampX + 6, LABEL_WIDTH + 6);
                    ctx.fillText(`${(0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatTimeShort"])(seg.start)}–${(0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatTimeShort"])(seg.end)}`, labelX, arollY + 16);
                }
                // Trim handles (when selected)
                if (isSelected) {
                    // Left handle
                    ctx.fillStyle = "#60a5fa";
                    ctx.fillRect(clampX, arollY + 2, 4, arollH - 4);
                    // Right handle
                    ctx.fillRect(clampX + clampW - 4, arollY + 2, 4, arollH - 4);
                }
            }
            // Segment boundary marker
            if (i > 0) {
                ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
                ctx.setLineDash([
                    3,
                    3
                ]);
                ctx.beginPath();
                ctx.moveTo(x, arollY);
                ctx.lineTo(x, arollY + arollH);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            concatOffset += segDuration;
        });
        // --- Overlays ---
        const overlayY = getTrackY(1);
        const overlayH = TRACKS[1].height;
        activeShort.overlays.forEach((overlay, i)=>{
            const concatStart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sourceToConcatTime"])(overlay.startAt, activeShort.segmentsToKeep);
            if (concatStart === null) return;
            const x = txp(concatStart);
            const ovW = overlay.duration * zoom;
            const isSelected = selectedItems.some((s)=>s.type === "overlay" && s.index === i);
            if (x + ovW > LABEL_WIDTH && x < w) {
                const clampX = Math.max(LABEL_WIDTH, x);
                const clampW = Math.min(x + ovW, w) - clampX;
                const color = overlay.type === "broll" ? "rgba(99, 102, 241, 0.35)" : "rgba(34, 197, 94, 0.35)";
                const borderColor = overlay.type === "broll" ? "#818cf8" : "#4ade80";
                ctx.fillStyle = isSelected ? overlay.type === "broll" ? "rgba(99, 102, 241, 0.55)" : "rgba(34, 197, 94, 0.55)" : color;
                ctx.fillRect(clampX, overlayY + 2, clampW, overlayH - 4);
                ctx.strokeStyle = isSelected ? "#fff" : borderColor;
                ctx.lineWidth = isSelected ? 2 : 1;
                ctx.strokeRect(clampX, overlayY + 2, clampW, overlayH - 4);
                if (ovW > 30) {
                    ctx.fillStyle = "#fff";
                    ctx.font = "10px -apple-system, sans-serif";
                    ctx.textAlign = "left";
                    const labelX = Math.max(clampX + 4, LABEL_WIDTH + 4);
                    ctx.fillText(overlay.matchLabel, labelX, overlayY + overlayH / 2 + 3);
                }
                // Resize handles
                if (isSelected) {
                    ctx.fillStyle = "#fff";
                    ctx.fillRect(clampX, overlayY + 2, 3, overlayH - 4);
                    ctx.fillRect(clampX + clampW - 3, overlayY + 2, 3, overlayH - 4);
                }
            }
        });
        // --- Subtitles ---
        const subY = getTrackY(2);
        const subH = TRACKS[2].height;
        const WORDS_PER_GROUP = 5;
        if (activeShort.subtitleWords.length > 0) {
            for(let gi = 0; gi < activeShort.subtitleWords.length; gi += WORDS_PER_GROUP){
                const groupWords = activeShort.subtitleWords.slice(gi, gi + WORDS_PER_GROUP);
                const firstWord = groupWords[0];
                const lastWord = groupWords[groupWords.length - 1];
                const concatStart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sourceToConcatTime"])(firstWord.start, activeShort.segmentsToKeep);
                const concatEnd = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sourceToConcatTime"])(lastWord.end, activeShort.segmentsToKeep);
                if (concatStart === null || concatEnd === null) continue;
                const x = txp(concatStart);
                const subW = (concatEnd - concatStart) * zoom;
                const isSelected = selectedItems.some((s)=>s.type === "subtitle" && s.index === gi);
                if (x + subW > LABEL_WIDTH && x < w && subW > 2) {
                    const clampX = Math.max(LABEL_WIDTH, x);
                    const clampW = Math.min(x + subW, w) - clampX;
                    ctx.fillStyle = isSelected ? "rgba(168, 85, 247, 0.45)" : "rgba(168, 85, 247, 0.2)";
                    ctx.fillRect(clampX, subY + 2, clampW, subH - 4);
                    ctx.strokeStyle = isSelected ? "#c084fc" : "rgba(168, 85, 247, 0.4)";
                    ctx.lineWidth = 1;
                    ctx.strokeRect(clampX, subY + 2, clampW, subH - 4);
                    if (subW > 20) {
                        ctx.fillStyle = "#d8b4fe";
                        ctx.font = "9px -apple-system, sans-serif";
                        ctx.textAlign = "left";
                        const text = groupWords.map((w)=>w.word).join(" ");
                        const labelX = Math.max(clampX + 3, LABEL_WIDTH + 3);
                        ctx.fillText(text, labelX, subY + subH / 2 + 3, clampW - 6);
                    }
                }
            }
        }
        // --- SFX ---
        const sfxY = getTrackY(3);
        const sfxH = TRACKS[3].height;
        activeShort.sfx.forEach((sfx, i)=>{
            const concatStart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sourceToConcatTime"])(sfx.at, activeShort.segmentsToKeep);
            if (concatStart === null) return;
            const x = txp(concatStart);
            const isSelected = selectedItems.some((s)=>s.type === "sfx" && s.index === i);
            if (x > LABEL_WIDTH && x < w) {
                // Diamond marker
                ctx.fillStyle = isSelected ? "rgba(245, 158, 11, 0.8)" : "rgba(245, 158, 11, 0.5)";
                ctx.beginPath();
                const size = 8;
                ctx.moveTo(x, sfxY + sfxH / 2 - size);
                ctx.lineTo(x + size, sfxY + sfxH / 2);
                ctx.moveTo(x, sfxY + sfxH / 2 + size);
                ctx.lineTo(x - size, sfxY + sfxH / 2);
                ctx.closePath();
                ctx.fill();
                // Vertical line
                ctx.strokeStyle = isSelected ? "rgba(245, 158, 11, 0.8)" : "rgba(245, 158, 11, 0.3)";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, sfxY);
                ctx.lineTo(x, sfxY + sfxH);
                ctx.stroke();
                // Label
                ctx.fillStyle = "#fbbf24";
                ctx.font = "9px -apple-system, sans-serif";
                ctx.textAlign = "left";
                ctx.fillText(sfx.matchLabel, x + 6, sfxY + 12);
            }
        });
        // --- Emphasis word markers on a-roll track ---
        activeShort.emphasisWords.forEach((ew)=>{
            const concatT = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sourceToConcatTime"])(ew.timestamp, activeShort.segmentsToKeep);
            if (concatT === null) return;
            const x = txp(concatT);
            if (x < LABEL_WIDTH || x > w) return;
            // Small triangle above a-roll
            ctx.fillStyle = "#ffd700";
            ctx.beginPath();
            ctx.moveTo(x - 4, arollY + arollH - 2);
            ctx.lineTo(x + 4, arollY + arollH - 2);
            ctx.lineTo(x, arollY + arollH - 10);
            ctx.closePath();
            ctx.fill();
        });
        // --- Playhead ---
        const playheadX = txp(cursorTime);
        if (playheadX >= LABEL_WIDTH && playheadX <= w) {
            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(playheadX, 0);
            ctx.lineTo(playheadX, h);
            ctx.stroke();
            // Playhead triangle
            ctx.fillStyle = "#ef4444";
            ctx.beginPath();
            ctx.moveTo(playheadX - 6, 0);
            ctx.lineTo(playheadX + 6, 0);
            ctx.lineTo(playheadX, 8);
            ctx.closePath();
            ctx.fill();
        }
        // --- Cut tool cursor line ---
        if (activeTool === "cut" && dragState.mode === "idle") {
        // Will be rendered on mousemove via separate state
        }
    }, [
        canvasSize,
        activeShort,
        zoom,
        scrollX,
        cursorTime,
        selectedItems,
        activeTool,
        duration,
        getTrackY,
        dragState
    ]);
    // Render loop
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const frame = requestAnimationFrame(render);
        return ()=>cancelAnimationFrame(frame);
    }, [
        render
    ]);
    // Hit test: what's at this position?
    const hitTest = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((canvasX, canvasY)=>{
        if (!activeShort) return null;
        const time = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pixelToTime"])(canvasX - LABEL_WIDTH + scrollX, zoom, 0);
        const trackIdx = getTrackAtY(canvasY);
        if (trackIdx === 0) {
            // A-Roll segments
            let concatOffset = 0;
            for(let i = 0; i < activeShort.segmentsToKeep.length; i++){
                const seg = activeShort.segmentsToKeep[i];
                const segDur = seg.end - seg.start;
                if (time >= concatOffset && time <= concatOffset + segDur) {
                    // Check trim edges (8px threshold)
                    const leftEdgeTime = concatOffset;
                    const rightEdgeTime = concatOffset + segDur;
                    const threshold = 8 / zoom; // pixels to time
                    if (Math.abs(time - leftEdgeTime) < threshold) {
                        return {
                            item: {
                                type: "segment",
                                index: i
                            },
                            edge: "left"
                        };
                    }
                    if (Math.abs(time - rightEdgeTime) < threshold) {
                        return {
                            item: {
                                type: "segment",
                                index: i
                            },
                            edge: "right"
                        };
                    }
                    return {
                        item: {
                            type: "segment",
                            index: i
                        }
                    };
                }
                concatOffset += segDur;
            }
        } else if (trackIdx === 1) {
            // Overlays
            for(let i = 0; i < activeShort.overlays.length; i++){
                const ov = activeShort.overlays[i];
                const concatStart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sourceToConcatTime"])(ov.startAt, activeShort.segmentsToKeep);
                if (concatStart === null) continue;
                if (time >= concatStart && time <= concatStart + ov.duration) {
                    const threshold = 8 / zoom;
                    if (Math.abs(time - concatStart) < threshold) {
                        return {
                            item: {
                                type: "overlay",
                                index: i
                            },
                            edge: "left"
                        };
                    }
                    if (Math.abs(time - (concatStart + ov.duration)) < threshold) {
                        return {
                            item: {
                                type: "overlay",
                                index: i
                            },
                            edge: "right"
                        };
                    }
                    return {
                        item: {
                            type: "overlay",
                            index: i
                        }
                    };
                }
            }
        } else if (trackIdx === 2) {
            // Subtitles
            const WORDS_PER_GROUP = 5;
            for(let gi = 0; gi < activeShort.subtitleWords.length; gi += WORDS_PER_GROUP){
                const group = activeShort.subtitleWords.slice(gi, gi + WORDS_PER_GROUP);
                const first = group[0];
                const last = group[group.length - 1];
                const concatStart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sourceToConcatTime"])(first.start, activeShort.segmentsToKeep);
                const concatEnd = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sourceToConcatTime"])(last.end, activeShort.segmentsToKeep);
                if (concatStart !== null && concatEnd !== null) {
                    if (time >= concatStart && time <= concatEnd) {
                        return {
                            item: {
                                type: "subtitle",
                                index: gi
                            }
                        };
                    }
                }
            }
        } else if (trackIdx === 3) {
            // SFX
            for(let i = 0; i < activeShort.sfx.length; i++){
                const sfx = activeShort.sfx[i];
                const concatStart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sourceToConcatTime"])(sfx.at, activeShort.segmentsToKeep);
                if (concatStart !== null && Math.abs(time - concatStart) < 12 / zoom) {
                    return {
                        item: {
                            type: "sfx",
                            index: i
                        }
                    };
                }
            }
        }
        return null;
    }, [
        activeShort,
        zoom,
        scrollX,
        getTrackAtY
    ]);
    // Mouse handlers
    const handleMouseDown = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
        if (!activeShort) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const time = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pixelToTime"])(x - LABEL_WIDTH + scrollX, zoom, 0);
        // Ruler click = scrub
        if (y < RULER_HEIGHT) {
            setCursorTime(Math.max(0, Math.min(duration, time)));
            setDragState({
                mode: "scrubbing"
            });
            return;
        }
        // Cut tool
        if (activeTool === "cut") {
            const hit = hitTest(x, y);
            if (hit && hit.item.type === "segment") {
                const sourceTime = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["concatToSourceTime"])(time, activeShort.segmentsToKeep);
                splitSegment(hit.item.index, sourceTime);
            }
            return;
        }
        // Select tool
        const hit = hitTest(x, y);
        if (hit) {
            setSelectedItems([
                hit.item
            ]);
            if (hit.edge) {
                // Start trimming
                setDragState({
                    mode: "trimming",
                    item: hit.item,
                    edge: hit.edge,
                    startX: x,
                    startTime: time
                });
            } else {
                // Start dragging
                setDragState({
                    mode: "dragging",
                    item: hit.item,
                    startX: x,
                    startTime: time,
                    originalValue: getItemTime(hit.item, activeShort)
                });
            }
        } else {
            // Click on empty space = seek
            setSelectedItems([]);
            setCursorTime(Math.max(0, Math.min(duration, time)));
            setDragState({
                mode: "scrubbing"
            });
        }
    }, [
        activeShort,
        zoom,
        scrollX,
        duration,
        activeTool,
        hitTest,
        setCursorTime,
        setSelectedItems,
        splitSegment
    ]);
    const handleMouseMove = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
        if (!activeShort || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pixelToTime"])(x - LABEL_WIDTH + scrollX, zoom, 0);
        // Cursor style
        const y = e.clientY - rect.top;
        if (activeTool === "cut") {
            canvasRef.current.style.cursor = "crosshair";
        } else {
            const hit = hitTest(x, y);
            if (hit?.edge) {
                canvasRef.current.style.cursor = "col-resize";
            } else if (hit) {
                canvasRef.current.style.cursor = "grab";
            } else {
                canvasRef.current.style.cursor = "default";
            }
        }
        if (dragState.mode === "scrubbing") {
            setCursorTime(Math.max(0, Math.min(duration, time)));
        } else if (dragState.mode === "dragging" && dragState.item && dragState.startTime !== undefined && dragState.originalValue !== undefined) {
            const delta = time - dragState.startTime;
            const newTime = Math.max(0, dragState.originalValue + delta);
            if (dragState.item.type === "overlay") {
                const concatTime = newTime;
                const sourceTime = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["concatToSourceTime"])(concatTime, activeShort.segmentsToKeep);
                moveOverlay(dragState.item.index, sourceTime);
            } else if (dragState.item.type === "sfx") {
                const sourceTime = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["concatToSourceTime"])(newTime, activeShort.segmentsToKeep);
                moveSfx(dragState.item.index, sourceTime);
            }
        } else if (dragState.mode === "trimming" && dragState.item && dragState.edge) {
            if (dragState.item.type === "segment") {
                const sourceTime = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["concatToSourceTime"])(time, activeShort.segmentsToKeep);
                trimSegment(dragState.item.index, dragState.edge, sourceTime);
            } else if (dragState.item.type === "overlay") {
                const ov = activeShort.overlays[dragState.item.index];
                const concatStart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sourceToConcatTime"])(ov.startAt, activeShort.segmentsToKeep);
                if (concatStart === null) return;
                if (dragState.edge === "left") {
                    const newConcatStart = Math.max(0, time);
                    const newDuration = concatStart + ov.duration - newConcatStart;
                    const newSourceStart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["concatToSourceTime"])(newConcatStart, activeShort.segmentsToKeep);
                    resizeOverlay(dragState.item.index, newSourceStart, newDuration);
                } else {
                    const newDuration = Math.max(0.5, time - concatStart);
                    resizeOverlay(dragState.item.index, ov.startAt, newDuration);
                }
            }
        }
    }, [
        activeShort,
        zoom,
        scrollX,
        duration,
        activeTool,
        dragState,
        hitTest,
        setCursorTime,
        moveOverlay,
        moveSfx,
        trimSegment,
        resizeOverlay
    ]);
    const handleMouseUp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        setDragState({
            mode: "idle"
        });
    }, []);
    // Wheel: zoom/scroll
    const handleWheel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setZoom(zoom * delta);
        } else {
            setScrollX(scrollX + e.deltaX + e.deltaY);
        }
    }, [
        zoom,
        scrollX,
        setZoom,
        setScrollX
    ]);
    // Keyboard
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const handler = (e)=>{
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            switch(e.key){
                case "Delete":
                case "Backspace":
                    if (selectedItems.length > 0) {
                        e.preventDefault();
                        const item = selectedItems[0];
                        if (item.type === "segment") deleteSegment(item.index);
                        else if (item.type === "overlay") deleteOverlay(item.index);
                        else if (item.type === "sfx") deleteSfx(item.index);
                    }
                    break;
                case " ":
                    e.preventDefault();
                    __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"].getState().togglePlay();
                    break;
                case "v":
                case "V":
                    __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"].getState().setActiveTool("select");
                    break;
                case "c":
                case "C":
                    if (!e.ctrlKey && !e.metaKey) {
                        __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"].getState().setActiveTool("cut");
                    }
                    break;
                case "ArrowLeft":
                    e.preventDefault();
                    setCursorTime(Math.max(0, cursorTime - (e.shiftKey ? 1 : 1 / 30)));
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    setCursorTime(Math.min(duration, cursorTime + (e.shiftKey ? 1 : 1 / 30)));
                    break;
                case "s":
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"].getState().saveEdits();
                    }
                    break;
                case "z":
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        if (e.shiftKey) {
                            __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"].temporal.getState().redo();
                        } else {
                            __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"].temporal.getState().undo();
                        }
                    }
                    break;
            }
        };
        window.addEventListener("keydown", handler);
        return ()=>window.removeEventListener("keydown", handler);
    }, [
        selectedItems,
        cursorTime,
        duration,
        setCursorTime,
        deleteSegment,
        deleteOverlay,
        deleteSfx
    ]);
    // Drop handler for assets
    const handleDrop = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
        e.preventDefault();
        if (!activeShort) return;
        try {
            const data = JSON.parse(e.dataTransfer.getData("application/json"));
            const rect = canvasRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const concatTime = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pixelToTime"])(x - LABEL_WIDTH + scrollX, zoom, 0);
            const sourceTime = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["concatToSourceTime"])(concatTime, activeShort.segmentsToKeep);
            if (data.type === "broll" || data.type === "graph") {
                __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"].getState().addOverlay({
                    type: data.type,
                    matchLabel: data.label,
                    filePath: data.path,
                    startAt: sourceTime,
                    duration: 5
                });
            } else if (data.type === "sfx") {
                __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"].getState().addSfx({
                    matchLabel: data.label,
                    filePath: data.path,
                    at: sourceTime
                });
            }
        } catch  {
        // Invalid drop data
        }
    }, [
        activeShort,
        zoom,
        scrollX
    ]);
    if (!activeShort) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            ref: containerRef,
            className: "flex items-center justify-center h-full",
            style: {
                background: "#0f0f17",
                color: "var(--text-muted)"
            },
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-sm",
                children: "Select a short to view the timeline"
            }, void 0, false, {
                fileName: "[project]/web/components/editor/Timeline.tsx",
                lineNumber: 913,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/web/components/editor/Timeline.tsx",
            lineNumber: 908,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: containerRef,
        className: "w-full overflow-hidden relative",
        style: {
            background: "#0f0f17"
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
            ref: canvasRef,
            width: canvasSize.width,
            height: canvasSize.height,
            style: {
                width: canvasSize.width,
                height: canvasSize.height,
                display: "block"
            },
            onMouseDown: handleMouseDown,
            onMouseMove: handleMouseMove,
            onMouseUp: handleMouseUp,
            onMouseLeave: handleMouseUp,
            onWheel: handleWheel,
            onDragOver: (e)=>e.preventDefault(),
            onDrop: handleDrop
        }, void 0, false, {
            fileName: "[project]/web/components/editor/Timeline.tsx",
            lineNumber: 924,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/web/components/editor/Timeline.tsx",
        lineNumber: 919,
        columnNumber: 5
    }, this);
}
// Helpers
function getTickInterval(zoom) {
    const targetPixels = 80;
    const rawInterval = targetPixels / zoom;
    const intervals = [
        0.1,
        0.25,
        0.5,
        1,
        2,
        5,
        10,
        15,
        30,
        60,
        120,
        300
    ];
    for (const interval of intervals){
        if (interval >= rawInterval) return interval;
    }
    return 600;
}
function getItemTime(item, short) {
    if (item.type === "overlay") {
        const ov = short.overlays[item.index];
        const ct = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sourceToConcatTime"])(ov.startAt, short.segmentsToKeep);
        return ct ?? 0;
    }
    if (item.type === "sfx") {
        const sfx = short.sfx[item.index];
        const ct = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sourceToConcatTime"])(sfx.at, short.segmentsToKeep);
        return ct ?? 0;
    }
    return 0;
}
}),
"[project]/web/components/panels/AssetBrowser.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AssetBrowser
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/store.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function AssetBrowser() {
    const assets = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.assets);
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("broll");
    if (!assets) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-4 text-center text-sm",
            style: {
                color: "var(--text-muted)"
            },
            children: "No assets loaded"
        }, void 0, false, {
            fileName: "[project]/web/components/panels/AssetBrowser.tsx",
            lineNumber: 14,
            columnNumber: 7
        }, this);
    }
    const tabs = [
        {
            key: "broll",
            label: "B-Roll",
            count: assets.broll.length,
            color: "var(--broll)"
        },
        {
            key: "graphs",
            label: "Graphs",
            count: assets.graphs.length,
            color: "var(--graph)"
        },
        {
            key: "sfx",
            label: "SFX",
            count: assets.sfx.length,
            color: "var(--sfx)"
        }
    ];
    const items = assets[activeTab];
    const handleDragStart = (e, item)=>{
        const type = activeTab === "broll" ? "broll" : activeTab === "graphs" ? "graph" : "sfx";
        e.dataTransfer.setData("application/json", JSON.stringify({
            type,
            label: item.label,
            path: item.path
        }));
        e.dataTransfer.effectAllowed = "copy";
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col h-full",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-xs font-semibold uppercase tracking-wider px-3 py-2",
                style: {
                    color: "var(--text-muted)"
                },
                children: "Assets"
            }, void 0, false, {
                fileName: "[project]/web/components/panels/AssetBrowser.tsx",
                lineNumber: 66,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex border-b",
                style: {
                    borderColor: "var(--border)"
                },
                children: tabs.map((tab)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setActiveTab(tab.key),
                        className: "flex-1 py-1.5 text-xs font-medium transition-colors",
                        style: {
                            color: activeTab === tab.key ? tab.color : "var(--text-muted)",
                            borderBottom: activeTab === tab.key ? `2px solid ${tab.color}` : "2px solid transparent"
                        },
                        children: [
                            tab.label,
                            " (",
                            tab.count,
                            ")"
                        ]
                    }, tab.key, true, {
                        fileName: "[project]/web/components/panels/AssetBrowser.tsx",
                        lineNumber: 79,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/web/components/panels/AssetBrowser.tsx",
                lineNumber: 74,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 overflow-y-auto p-2",
                children: items.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-xs text-center py-4",
                    style: {
                        color: "var(--text-muted)"
                    },
                    children: [
                        "No ",
                        activeTab,
                        " assets"
                    ]
                }, void 0, true, {
                    fileName: "[project]/web/components/panels/AssetBrowser.tsx",
                    lineNumber: 102,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col gap-1",
                    children: items.map((item, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            draggable: true,
                            onDragStart: (e)=>handleDragStart(e, item),
                            className: "flex items-center gap-2 px-2 py-2 rounded-md cursor-grab active:cursor-grabbing transition-colors",
                            style: {
                                background: "var(--bg-tertiary)",
                                border: "1px solid var(--border)"
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-2 h-2 rounded-full flex-shrink-0",
                                    style: {
                                        background: activeTab === "broll" ? "var(--broll)" : activeTab === "graphs" ? "var(--graph)" : "var(--sfx)"
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/web/components/panels/AssetBrowser.tsx",
                                    lineNumber: 121,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-xs truncate",
                                    style: {
                                        color: "var(--text-primary)"
                                    },
                                    children: item.label
                                }, void 0, false, {
                                    fileName: "[project]/web/components/panels/AssetBrowser.tsx",
                                    lineNumber: 132,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, i, true, {
                            fileName: "[project]/web/components/panels/AssetBrowser.tsx",
                            lineNumber: 111,
                            columnNumber: 15
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/web/components/panels/AssetBrowser.tsx",
                    lineNumber: 109,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/web/components/panels/AssetBrowser.tsx",
                lineNumber: 100,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-3 py-2 text-xs",
                style: {
                    color: "var(--text-muted)",
                    borderTop: "1px solid var(--border)"
                },
                children: "Drag assets onto the timeline"
            }, void 0, false, {
                fileName: "[project]/web/components/panels/AssetBrowser.tsx",
                lineNumber: 144,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/web/components/panels/AssetBrowser.tsx",
        lineNumber: 65,
        columnNumber: 5
    }, this);
}
}),
"[project]/web/components/panels/PropertiesPanel.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PropertiesPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/store.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/timeline-utils.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function PropertiesPanel() {
    const shorts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.shorts);
    const activeShortId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.activeShortId);
    const selectedItems = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.selectedItems);
    const activeShort = shorts.find((s)=>s.id === activeShortId);
    if (!activeShort || selectedItems.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-3",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-xs font-semibold uppercase tracking-wider mb-2",
                    style: {
                        color: "var(--text-muted)"
                    },
                    children: "Properties"
                }, void 0, false, {
                    fileName: "[project]/web/components/panels/PropertiesPanel.tsx",
                    lineNumber: 16,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-xs",
                    style: {
                        color: "var(--text-muted)"
                    },
                    children: "Select an item on the timeline"
                }, void 0, false, {
                    fileName: "[project]/web/components/panels/PropertiesPanel.tsx",
                    lineNumber: 22,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/web/components/panels/PropertiesPanel.tsx",
            lineNumber: 15,
            columnNumber: 7
        }, this);
    }
    const item = selectedItems[0];
    if (item.type === "segment") {
        const seg = activeShort.segmentsToKeep[item.index];
        if (!seg) return null;
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-3",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-xs font-semibold uppercase tracking-wider mb-2",
                    style: {
                        color: "var(--text-muted)"
                    },
                    children: "A-Roll Segment"
                }, void 0, false, {
                    fileName: "[project]/web/components/panels/PropertiesPanel.tsx",
                    lineNumber: 39,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(PropRow, {
                    label: "Index",
                    value: `${item.index + 1} of ${activeShort.segmentsToKeep.length}`
                }, void 0, false, {
                    fileName: "[project]/web/components/panels/PropertiesPanel.tsx",
                    lineNumber: 45,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(PropRow, {
                    label: "Source Start",
                    value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatTime"])(seg.start)
                }, void 0, false, {
                    fileName: "[project]/web/components/panels/PropertiesPanel.tsx",
                    lineNumber: 46,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(PropRow, {
                    label: "Source End",
                    value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatTime"])(seg.end)
                }, void 0, false, {
                    fileName: "[project]/web/components/panels/PropertiesPanel.tsx",
                    lineNumber: 47,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(PropRow, {
                    label: "Duration",
                    value: `${(seg.end - seg.start).toFixed(2)}s`
                }, void 0, false, {
                    fileName: "[project]/web/components/panels/PropertiesPanel.tsx",
                    lineNumber: 48,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/web/components/panels/PropertiesPanel.tsx",
            lineNumber: 38,
            columnNumber: 7
        }, this);
    }
    if (item.type === "overlay") {
        const ov = activeShort.overlays[item.index];
        if (!ov) return null;
        const concatStart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sourceToConcatTime"])(ov.startAt, activeShort.segmentsToKeep);
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-3",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-xs font-semibold uppercase tracking-wider mb-2",
                    style: {
                        color: "var(--text-muted)"
                    },
                    children: [
                        ov.type === "broll" ? "B-Roll" : "Graph",
                        " Overlay"
                    ]
                }, void 0, true, {
                    fileName: "[project]/web/components/panels/PropertiesPanel.tsx",
                    lineNumber: 59,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(PropRow, {
                    label: "Label",
                    value: ov.matchLabel
                }, void 0, false, {
                    fileName: "[project]/web/components/panels/PropertiesPanel.tsx",
                    lineNumber: 65,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(PropRow, {
                    label: "Source At",
                    value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatTime"])(ov.startAt)
                }, void 0, false, {
                    fileName: "[project]/web/components/panels/PropertiesPanel.tsx",
                    lineNumber: 66,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(PropRow, {
                    label: "Timeline At",
                    value: concatStart !== null ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatTime"])(concatStart) : "—"
                }, void 0, false, {
                    fileName: "[project]/web/components/panels/PropertiesPanel.tsx",
                    lineNumber: 67,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(PropRow, {
                    label: "Duration",
                    value: `${ov.duration.toFixed(2)}s`
                }, void 0, false, {
                    fileName: "[project]/web/components/panels/PropertiesPanel.tsx",
                    lineNumber: 68,
                    columnNumber: 9
                }, this),
                ov.filePath && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(PropRow, {
                    label: "File",
                    value: ov.filePath.split("/").pop() || ""
                }, void 0, false, {
                    fileName: "[project]/web/components/panels/PropertiesPanel.tsx",
                    lineNumber: 69,
                    columnNumber: 25
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/web/components/panels/PropertiesPanel.tsx",
            lineNumber: 58,
            columnNumber: 7
        }, this);
    }
    if (item.type === "sfx") {
        const sfx = activeShort.sfx[item.index];
        if (!sfx) return null;
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-3",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-xs font-semibold uppercase tracking-wider mb-2",
                    style: {
                        color: "var(--text-muted)"
                    },
                    children: "Sound Effect"
                }, void 0, false, {
                    fileName: "[project]/web/components/panels/PropertiesPanel.tsx",
                    lineNumber: 79,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(PropRow, {
                    label: "Label",
                    value: sfx.matchLabel
                }, void 0, false, {
                    fileName: "[project]/web/components/panels/PropertiesPanel.tsx",
                    lineNumber: 85,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(PropRow, {
                    label: "Source At",
                    value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatTime"])(sfx.at)
                }, void 0, false, {
                    fileName: "[project]/web/components/panels/PropertiesPanel.tsx",
                    lineNumber: 86,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/web/components/panels/PropertiesPanel.tsx",
            lineNumber: 78,
            columnNumber: 7
        }, this);
    }
    return null;
}
function PropRow({ label, value }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-center justify-between py-1",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-xs",
                style: {
                    color: "var(--text-muted)"
                },
                children: label
            }, void 0, false, {
                fileName: "[project]/web/components/panels/PropertiesPanel.tsx",
                lineNumber: 97,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-xs font-mono",
                style: {
                    color: "var(--text-secondary)"
                },
                children: value
            }, void 0, false, {
                fileName: "[project]/web/components/panels/PropertiesPanel.tsx",
                lineNumber: 103,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/web/components/panels/PropertiesPanel.tsx",
        lineNumber: 96,
        columnNumber: 5
    }, this);
}
}),
"[project]/web/components/panels/SubtitleEditor.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SubtitleEditor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/store.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/timeline-utils.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function SubtitleEditor() {
    const shorts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.shorts);
    const activeShortId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.activeShortId);
    const selectedItems = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.selectedItems);
    const updateSubtitleWord = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.updateSubtitleWord);
    const activeShort = shorts.find((s)=>s.id === activeShortId);
    const subtitleSelection = selectedItems.find((s)=>s.type === "subtitle");
    if (!activeShort || !subtitleSelection) return null;
    const WORDS_PER_GROUP = 5;
    const startIdx = subtitleSelection.index;
    const groupWords = activeShort.subtitleWords.slice(startIdx, startIdx + WORDS_PER_GROUP);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "border-t p-3",
        style: {
            borderColor: "var(--border)",
            background: "var(--bg-secondary)"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-xs font-semibold uppercase tracking-wider mb-2",
                style: {
                    color: "var(--text-muted)"
                },
                children: "Subtitle Editor"
            }, void 0, false, {
                fileName: "[project]/web/components/panels/SubtitleEditor.tsx",
                lineNumber: 32,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col gap-1.5",
                children: groupWords.map((word, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs font-mono w-16 text-right flex-shrink-0",
                                style: {
                                    color: "var(--text-muted)"
                                },
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatTime"])(word.start)
                            }, void 0, false, {
                                fileName: "[project]/web/components/panels/SubtitleEditor.tsx",
                                lineNumber: 45,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                value: word.word,
                                onChange: (e)=>updateSubtitleWord(startIdx + i, e.target.value),
                                className: "flex-1 text-sm px-2 py-1 rounded",
                                style: {
                                    background: "var(--bg-tertiary)",
                                    border: "1px solid var(--border)",
                                    color: "var(--text-primary)"
                                }
                            }, void 0, false, {
                                fileName: "[project]/web/components/panels/SubtitleEditor.tsx",
                                lineNumber: 51,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs font-mono w-16 flex-shrink-0",
                                style: {
                                    color: "var(--text-muted)"
                                },
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$timeline$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatTime"])(word.end)
                            }, void 0, false, {
                                fileName: "[project]/web/components/panels/SubtitleEditor.tsx",
                                lineNumber: 64,
                                columnNumber: 13
                            }, this)
                        ]
                    }, startIdx + i, true, {
                        fileName: "[project]/web/components/panels/SubtitleEditor.tsx",
                        lineNumber: 41,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/web/components/panels/SubtitleEditor.tsx",
                lineNumber: 39,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/web/components/panels/SubtitleEditor.tsx",
        lineNumber: 25,
        columnNumber: 5
    }, this);
}
}),
"[project]/web/app/editor/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>EditorPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/store.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$panels$2f$RunPicker$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/components/panels/RunPicker.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$panels$2f$ShortsList$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/components/panels/ShortsList.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$pipeline$2f$PipelineControls$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/components/pipeline/PipelineControls.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$editor$2f$VideoPlayer$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/components/editor/VideoPlayer.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$editor$2f$Toolbar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/components/editor/Toolbar.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$editor$2f$Timeline$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/components/editor/Timeline.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$panels$2f$AssetBrowser$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/components/panels/AssetBrowser.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$panels$2f$PropertiesPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/components/panels/PropertiesPanel.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$panels$2f$SubtitleEditor$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/components/panels/SubtitleEditor.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
;
;
;
;
;
;
/** Reads query params and auto-loads a run if ?run=...&short=... are set */ function QueryParamLoader() {
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const currentRunId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.currentRunId);
    const loadRun = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.loadRun);
    const selectShort = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.selectShort);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const runParam = searchParams.get("run");
        const shortParam = searchParams.get("short");
        if (runParam && runParam !== currentRunId) {
            loadRun(runParam).then(()=>{
                if (shortParam) {
                    selectShort(parseInt(shortParam, 10));
                }
            });
        }
    }, [
        searchParams,
        currentRunId,
        loadRun,
        selectShort
    ]);
    return null;
}
function EditorPage() {
    const isDirty = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])((s)=>s.isDirty);
    // Warn on unsaved changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const handler = (e)=>{
            if (isDirty) {
                e.preventDefault();
            }
        };
        window.addEventListener("beforeunload", handler);
        return ()=>window.removeEventListener("beforeunload", handler);
    }, [
        isDirty
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "h-screen flex flex-col overflow-hidden",
        style: {
            background: "var(--bg-primary)"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Suspense"], {
                fallback: null,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(QueryParamLoader, {}, void 0, false, {
                    fileName: "[project]/web/app/editor/page.tsx",
                    lineNumber: 58,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/web/app/editor/page.tsx",
                lineNumber: 57,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "flex items-center px-4 py-1.5 border-b flex-shrink-0",
                style: {
                    borderColor: "var(--border)",
                    background: "var(--bg-secondary)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-sm font-semibold",
                                style: {
                                    color: "var(--text-primary)"
                                },
                                children: "Video Pipeline"
                            }, void 0, false, {
                                fileName: "[project]/web/app/editor/page.tsx",
                                lineNumber: 70,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs px-1.5 py-0.5 rounded",
                                style: {
                                    background: "var(--accent-muted)",
                                    color: "var(--accent)"
                                },
                                children: "Editor"
                            }, void 0, false, {
                                fileName: "[project]/web/app/editor/page.tsx",
                                lineNumber: 76,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/app/editor/page.tsx",
                        lineNumber: 69,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 mx-4 max-w-md",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$panels$2f$RunPicker$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                            fileName: "[project]/web/app/editor/page.tsx",
                            lineNumber: 87,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/web/app/editor/page.tsx",
                        lineNumber: 86,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: isDirty && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-xs",
                            style: {
                                color: "var(--warning)"
                            },
                            children: "Unsaved changes"
                        }, void 0, false, {
                            fileName: "[project]/web/app/editor/page.tsx",
                            lineNumber: 91,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/web/app/editor/page.tsx",
                        lineNumber: 89,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/web/app/editor/page.tsx",
                lineNumber: 62,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 flex overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                        className: "flex-shrink-0 flex flex-col border-r overflow-y-auto",
                        style: {
                            width: 240,
                            borderColor: "var(--border)",
                            background: "var(--bg-secondary)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$panels$2f$ShortsList$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                fileName: "[project]/web/app/editor/page.tsx",
                                lineNumber: 112,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "border-t mt-auto",
                                style: {
                                    borderColor: "var(--border)"
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$pipeline$2f$PipelineControls$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                    fileName: "[project]/web/app/editor/page.tsx",
                                    lineNumber: 117,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/web/app/editor/page.tsx",
                                lineNumber: 113,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/app/editor/page.tsx",
                        lineNumber: 104,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                        className: "flex-1 flex flex-col min-w-0 overflow-hidden",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-1 min-h-0",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$editor$2f$VideoPlayer$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                    fileName: "[project]/web/app/editor/page.tsx",
                                    lineNumber: 125,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/web/app/editor/page.tsx",
                                lineNumber: 124,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$editor$2f$Toolbar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                fileName: "[project]/web/app/editor/page.tsx",
                                lineNumber: 129,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-shrink-0 border-t",
                                style: {
                                    height: 240,
                                    borderColor: "var(--border)"
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$editor$2f$Timeline$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                    fileName: "[project]/web/app/editor/page.tsx",
                                    lineNumber: 139,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/web/app/editor/page.tsx",
                                lineNumber: 132,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$panels$2f$SubtitleEditor$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                fileName: "[project]/web/app/editor/page.tsx",
                                lineNumber: 143,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/app/editor/page.tsx",
                        lineNumber: 122,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                        className: "flex-shrink-0 flex flex-col border-l overflow-y-auto",
                        style: {
                            width: 240,
                            borderColor: "var(--border)",
                            background: "var(--bg-secondary)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-1",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$panels$2f$AssetBrowser$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                    fileName: "[project]/web/app/editor/page.tsx",
                                    lineNumber: 156,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/web/app/editor/page.tsx",
                                lineNumber: 155,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "border-t",
                                style: {
                                    borderColor: "var(--border)"
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$panels$2f$PropertiesPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                    fileName: "[project]/web/app/editor/page.tsx",
                                    lineNumber: 162,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/web/app/editor/page.tsx",
                                lineNumber: 158,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/app/editor/page.tsx",
                        lineNumber: 147,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/web/app/editor/page.tsx",
                lineNumber: 102,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/web/app/editor/page.tsx",
        lineNumber: 53,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=web_ee0f66fa._.js.map