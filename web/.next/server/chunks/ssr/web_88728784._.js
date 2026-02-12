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
"[project]/web/lib/upload-store.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useUploadStore",
    ()=>useUploadStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/zustand/esm/react.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/api.ts [app-ssr] (ecmascript)");
"use client";
;
;
const useUploadStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])()((set, get)=>({
        file: null,
        script: "",
        phase: "idle",
        logs: [],
        errorMessage: null,
        runId: null,
        shorts: [],
        setFile: (file)=>set({
                file
            }),
        setScript: (script)=>set({
                script
            }),
        reset: ()=>set({
                file: null,
                script: "",
                phase: "idle",
                logs: [],
                errorMessage: null,
                runId: null,
                shorts: []
            }),
        process: async ()=>{
            const { file, script } = get();
            if (!file || !script.trim()) return;
            try {
                // Step 1: Upload
                set({
                    phase: "uploading",
                    logs: [
                        "Uploading video..."
                    ],
                    errorMessage: null
                });
                const { runId } = await __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uploadVideo"](file, script);
                set((s)=>({
                        runId,
                        logs: [
                            ...s.logs,
                            `Upload complete. Run: ${runId}`
                        ]
                    }));
                // Step 2: Transcribe
                set((s)=>({
                        phase: "transcribing",
                        logs: [
                            ...s.logs,
                            "Starting transcription (whisper.cpp)..."
                        ]
                    }));
                await runStage("transcribe", runId, set);
                // Step 3: Align
                set((s)=>({
                        phase: "aligning",
                        logs: [
                            ...s.logs,
                            "Aligning script to transcript..."
                        ]
                    }));
                await runStage("align", runId, set);
                // Step 4: Load results
                const shorts = await __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getEdits"](runId);
                set((s)=>({
                        phase: "done",
                        shorts,
                        logs: [
                            ...s.logs,
                            `Done! ${shorts.length} short(s) generated.`
                        ]
                    }));
            } catch (err) {
                set((s)=>({
                        phase: "error",
                        errorMessage: err.message || "Processing failed",
                        logs: [
                            ...s.logs,
                            `Error: ${err.message}`
                        ]
                    }));
            }
        }
    }));
/** Run a pipeline stage and wait for completion via SSE */ function runStage(stage, runId, set) {
    return new Promise(async (resolve, reject)=>{
        try {
            const { jobId } = await __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["triggerPipeline"](stage, {
                runId
            });
            const eventSource = new EventSource(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pipelineStreamUrl"](stage, jobId));
            eventSource.onmessage = (event)=>{
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "log") {
                        set((s)=>({
                                logs: [
                                    ...s.logs,
                                    data.data
                                ]
                            }));
                    } else if (data.type === "done") {
                        eventSource.close();
                        resolve();
                    } else if (data.type === "error") {
                        eventSource.close();
                        reject(new Error(`${stage} failed`));
                    }
                } catch  {
                    set((s)=>({
                            logs: [
                                ...s.logs,
                                event.data
                            ]
                        }));
                }
            };
            eventSource.onerror = ()=>{
                eventSource.close();
                reject(new Error(`${stage} stream error`));
            };
        } catch (err) {
            reject(err);
        }
    });
}
}),
"[project]/web/components/upload/DropZone.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DropZone
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$upload$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/upload-store.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function DropZone() {
    const file = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$upload$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUploadStore"])((s)=>s.file);
    const setFile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$upload$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUploadStore"])((s)=>s.setFile);
    const phase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$upload$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUploadStore"])((s)=>s.phase);
    const [isDragging, setIsDragging] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const inputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const disabled = phase !== "idle";
    const handleFile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((f)=>{
        if (disabled) return;
        if (f && !f.type.startsWith("video/")) {
            return; // ignore non-video files
        }
        setFile(f);
    }, [
        setFile,
        disabled
    ]);
    const onDrop = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
        e.preventDefault();
        setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    }, [
        handleFile
    ]);
    const onDragOver = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    }, [
        disabled
    ]);
    const onDragLeave = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>setIsDragging(false), []);
    const formatSize = (bytes)=>{
        if (bytes > 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        onDrop: onDrop,
        onDragOver: onDragOver,
        onDragLeave: onDragLeave,
        onClick: ()=>!disabled && inputRef.current?.click(),
        style: {
            border: `2px dashed ${isDragging ? "var(--accent)" : file ? "var(--success)" : "var(--border)"}`,
            background: isDragging ? "var(--accent-muted)" : "var(--bg-tertiary)",
            borderRadius: 12,
            padding: "40px 24px",
            textAlign: "center",
            cursor: disabled ? "default" : "pointer",
            transition: "all 0.2s ease",
            opacity: disabled ? 0.6 : 1
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                ref: inputRef,
                type: "file",
                accept: "video/*",
                onChange: (e)=>handleFile(e.target.files?.[0] ?? null),
                style: {
                    display: "none"
                },
                disabled: disabled
            }, void 0, false, {
                fileName: "[project]/web/components/upload/DropZone.tsx",
                lineNumber: 68,
                columnNumber: 7
            }, this),
            file ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            fontSize: 32,
                            marginBottom: 8,
                            filter: "grayscale(1) brightness(1.5)"
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            width: "32",
                            height: "32",
                            viewBox: "0 0 24 24",
                            fill: "none",
                            stroke: "var(--success)",
                            strokeWidth: "2",
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    d: "M22 11.08V12a10 10 0 1 1-5.93-9.14"
                                }, void 0, false, {
                                    fileName: "[project]/web/components/upload/DropZone.tsx",
                                    lineNumber: 87,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                    points: "22 4 12 14.01 9 11.01"
                                }, void 0, false, {
                                    fileName: "[project]/web/components/upload/DropZone.tsx",
                                    lineNumber: 88,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/web/components/upload/DropZone.tsx",
                            lineNumber: 86,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/web/components/upload/DropZone.tsx",
                        lineNumber: 79,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            color: "var(--text-primary)",
                            fontSize: 14,
                            fontWeight: 500,
                            margin: "0 0 4px"
                        },
                        children: file.name
                    }, void 0, false, {
                        fileName: "[project]/web/components/upload/DropZone.tsx",
                        lineNumber: 91,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            color: "var(--text-muted)",
                            fontSize: 13,
                            margin: 0
                        },
                        children: formatSize(file.size)
                    }, void 0, false, {
                        fileName: "[project]/web/components/upload/DropZone.tsx",
                        lineNumber: 94,
                        columnNumber: 11
                    }, this),
                    !disabled && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: (e)=>{
                            e.stopPropagation();
                            setFile(null);
                        },
                        style: {
                            marginTop: 12,
                            padding: "4px 12px",
                            fontSize: 12,
                            color: "var(--text-secondary)",
                            background: "var(--bg-elevated)",
                            borderRadius: 6
                        },
                        children: "Change file"
                    }, void 0, false, {
                        fileName: "[project]/web/components/upload/DropZone.tsx",
                        lineNumber: 98,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/web/components/upload/DropZone.tsx",
                lineNumber: 78,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginBottom: 12
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            width: "40",
                            height: "40",
                            viewBox: "0 0 24 24",
                            fill: "none",
                            stroke: "var(--text-muted)",
                            strokeWidth: "1.5",
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                                }, void 0, false, {
                                    fileName: "[project]/web/components/upload/DropZone.tsx",
                                    lineNumber: 120,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                    points: "17 8 12 3 7 8"
                                }, void 0, false, {
                                    fileName: "[project]/web/components/upload/DropZone.tsx",
                                    lineNumber: 121,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                    x1: "12",
                                    y1: "3",
                                    x2: "12",
                                    y2: "15"
                                }, void 0, false, {
                                    fileName: "[project]/web/components/upload/DropZone.tsx",
                                    lineNumber: 122,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/web/components/upload/DropZone.tsx",
                            lineNumber: 119,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/web/components/upload/DropZone.tsx",
                        lineNumber: 118,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            color: "var(--text-primary)",
                            fontSize: 14,
                            fontWeight: 500,
                            margin: "0 0 4px"
                        },
                        children: "Drop your a-roll video here"
                    }, void 0, false, {
                        fileName: "[project]/web/components/upload/DropZone.tsx",
                        lineNumber: 125,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            color: "var(--text-muted)",
                            fontSize: 13,
                            margin: 0
                        },
                        children: "or click to browse"
                    }, void 0, false, {
                        fileName: "[project]/web/components/upload/DropZone.tsx",
                        lineNumber: 128,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/web/components/upload/DropZone.tsx",
                lineNumber: 117,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/web/components/upload/DropZone.tsx",
        lineNumber: 52,
        columnNumber: 5
    }, this);
}
}),
"[project]/web/components/upload/ScriptInput.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ScriptInput
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$upload$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/upload-store.ts [app-ssr] (ecmascript)");
"use client";
;
;
function ScriptInput() {
    const script = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$upload$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUploadStore"])((s)=>s.script);
    const setScript = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$upload$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUploadStore"])((s)=>s.setScript);
    const phase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$upload$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUploadStore"])((s)=>s.phase);
    const disabled = phase !== "idle";
    const paragraphs = script.split(/\n\s*\n/).filter((p)=>p.trim().length > 0).length;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 8
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        style: {
                            fontSize: 13,
                            fontWeight: 500,
                            color: "var(--text-primary)"
                        },
                        children: "Your script"
                    }, void 0, false, {
                        fileName: "[project]/web/components/upload/ScriptInput.tsx",
                        lineNumber: 25,
                        columnNumber: 9
                    }, this),
                    script.trim().length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: {
                            fontSize: 12,
                            color: "var(--text-muted)"
                        },
                        children: [
                            paragraphs,
                            " section",
                            paragraphs !== 1 ? "s" : "",
                            " (split by blank lines)"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/components/upload/ScriptInput.tsx",
                        lineNumber: 35,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/web/components/upload/ScriptInput.tsx",
                lineNumber: 17,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                value: script,
                onChange: (e)=>setScript(e.target.value),
                disabled: disabled,
                placeholder: `Paste the script you wrote before recording.\n\nSeparate sections with blank lines — each section becomes a separate short.\n\nExample:\n\nReact hooks allow you to use state and lifecycle features in functional components. The most common hook is useState...\n\nThe useEffect hook lets you perform side effects in your components. It runs after every render by default...`,
                style: {
                    width: "100%",
                    minHeight: 200,
                    maxHeight: 400,
                    resize: "vertical",
                    fontFamily: "inherit",
                    lineHeight: 1.6,
                    opacity: disabled ? 0.6 : 1
                }
            }, void 0, false, {
                fileName: "[project]/web/components/upload/ScriptInput.tsx",
                lineNumber: 40,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/web/components/upload/ScriptInput.tsx",
        lineNumber: 16,
        columnNumber: 5
    }, this);
}
}),
"[project]/web/components/upload/ProcessingStatus.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ProcessingStatus
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$upload$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/upload-store.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
const STEPS = [
    {
        key: "uploading",
        label: "Upload video"
    },
    {
        key: "transcribing",
        label: "Transcribe audio"
    },
    {
        key: "aligning",
        label: "Align script"
    },
    {
        key: "done",
        label: "Complete"
    }
];
function stepStatus(step, currentPhase) {
    const order = STEPS.map((s)=>s.key);
    const currentIdx = order.indexOf(currentPhase);
    const stepIdx = order.indexOf(step);
    if (currentPhase === "error") {
        if (stepIdx < currentIdx) return "done";
        if (stepIdx === currentIdx) return "error";
        return "pending";
    }
    if (stepIdx < currentIdx) return "done";
    if (stepIdx === currentIdx) return "active";
    return "pending";
}
function ProcessingStatus() {
    const phase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$upload$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUploadStore"])((s)=>s.phase);
    const logs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$upload$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUploadStore"])((s)=>s.logs);
    const errorMessage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$upload$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUploadStore"])((s)=>s.errorMessage);
    const logsEndRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        logsEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [
        logs.length
    ]);
    if (phase === "idle") return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    gap: 4,
                    marginBottom: 16
                },
                children: STEPS.map((step)=>{
                    const status = stepStatus(step.key, phase);
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 6
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    height: 3,
                                    width: "100%",
                                    borderRadius: 2,
                                    background: status === "done" ? "var(--success)" : status === "active" ? "var(--accent)" : status === "error" ? "var(--error)" : "var(--border)",
                                    transition: "background 0.3s ease"
                                }
                            }, void 0, false, {
                                fileName: "[project]/web/components/upload/ProcessingStatus.tsx",
                                lineNumber: 67,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    fontSize: 11,
                                    color: status === "active" ? "var(--accent)" : status === "done" ? "var(--success)" : status === "error" ? "var(--error)" : "var(--text-muted)",
                                    fontWeight: status === "active" ? 600 : 400
                                },
                                children: step.label
                            }, void 0, false, {
                                fileName: "[project]/web/components/upload/ProcessingStatus.tsx",
                                lineNumber: 83,
                                columnNumber: 15
                            }, this)
                        ]
                    }, step.key, true, {
                        fileName: "[project]/web/components/upload/ProcessingStatus.tsx",
                        lineNumber: 57,
                        columnNumber: 13
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/web/components/upload/ProcessingStatus.tsx",
                lineNumber: 47,
                columnNumber: 7
            }, this),
            errorMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "var(--error)",
                    fontSize: 13,
                    marginBottom: 12
                },
                children: errorMessage
            }, void 0, false, {
                fileName: "[project]/web/components/upload/ProcessingStatus.tsx",
                lineNumber: 106,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: 12,
                    maxHeight: 200,
                    overflowY: "auto",
                    fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                    fontSize: 11,
                    lineHeight: 1.5,
                    color: "var(--text-secondary)"
                },
                children: [
                    logs.map((line, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-all"
                            },
                            children: line
                        }, i, false, {
                            fileName: "[project]/web/components/upload/ProcessingStatus.tsx",
                            lineNumber: 137,
                            columnNumber: 11
                        }, this)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        ref: logsEndRef
                    }, void 0, false, {
                        fileName: "[project]/web/components/upload/ProcessingStatus.tsx",
                        lineNumber: 141,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/web/components/upload/ProcessingStatus.tsx",
                lineNumber: 122,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/web/components/upload/ProcessingStatus.tsx",
        lineNumber: 45,
        columnNumber: 5
    }, this);
}
}),
"[project]/web/components/upload/ResultsList.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ResultsList
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$upload$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/upload-store.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/navigation.js [app-ssr] (ecmascript)");
"use client";
;
;
;
function ResultsList() {
    const shorts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$upload$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUploadStore"])((s)=>s.shorts);
    const runId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$upload$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUploadStore"])((s)=>s.runId);
    const phase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$upload$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUploadStore"])((s)=>s.phase);
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    if (phase !== "done" || shorts.length === 0) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                style: {
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    margin: "0 0 12px"
                },
                children: [
                    shorts.length,
                    " short",
                    shorts.length !== 1 ? "s" : "",
                    " generated"
                ]
            }, void 0, true, {
                fileName: "[project]/web/components/upload/ResultsList.tsx",
                lineNumber: 16,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: 8
                },
                children: shorts.map((short)=>{
                    const duration = short.segmentsToKeep.reduce((sum, seg)=>sum + (seg.end - seg.start), 0);
                    const mins = Math.floor(duration / 60);
                    const secs = Math.round(duration % 60);
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "12px 16px",
                            background: "var(--bg-tertiary)",
                            border: "1px solid var(--border)",
                            borderRadius: 10
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    background: "var(--accent-muted)",
                                    color: "var(--accent)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 700,
                                    fontSize: 14,
                                    flexShrink: 0
                                },
                                children: short.id
                            }, void 0, false, {
                                fileName: "[project]/web/components/upload/ResultsList.tsx",
                                lineNumber: 50,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    flex: 1,
                                    minWidth: 0
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        style: {
                                            margin: 0,
                                            fontSize: 14,
                                            fontWeight: 500,
                                            color: "var(--text-primary)",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap"
                                        },
                                        children: short.title
                                    }, void 0, false, {
                                        fileName: "[project]/web/components/upload/ResultsList.tsx",
                                        lineNumber: 70,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        style: {
                                            margin: "2px 0 0",
                                            fontSize: 12,
                                            color: "var(--text-muted)"
                                        },
                                        children: [
                                            mins,
                                            ":",
                                            secs.toString().padStart(2, "0"),
                                            " ·",
                                            " ",
                                            short.segmentsToKeep.length,
                                            " segment",
                                            short.segmentsToKeep.length !== 1 ? "s" : "",
                                            " ·",
                                            " ",
                                            short.subtitleWords.length,
                                            " words"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/web/components/upload/ResultsList.tsx",
                                        lineNumber: 83,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/web/components/upload/ResultsList.tsx",
                                lineNumber: 69,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>router.push(`/editor?run=${runId}&short=${short.id}`),
                                style: {
                                    padding: "6px 14px",
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: "var(--accent)",
                                    background: "var(--accent-muted)",
                                    borderRadius: 6,
                                    transition: "background 0.15s",
                                    flexShrink: 0
                                },
                                onMouseEnter: (e)=>e.currentTarget.style.background = "rgba(99, 102, 241, 0.25)",
                                onMouseLeave: (e)=>e.currentTarget.style.background = "var(--accent-muted)",
                                children: "Open in Editor"
                            }, void 0, false, {
                                fileName: "[project]/web/components/upload/ResultsList.tsx",
                                lineNumber: 91,
                                columnNumber: 15
                            }, this)
                        ]
                    }, short.id, true, {
                        fileName: "[project]/web/components/upload/ResultsList.tsx",
                        lineNumber: 37,
                        columnNumber: 13
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/web/components/upload/ResultsList.tsx",
                lineNumber: 27,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/web/components/upload/ResultsList.tsx",
        lineNumber: 15,
        columnNumber: 5
    }, this);
}
}),
"[project]/web/app/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$upload$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/upload-store.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$upload$2f$DropZone$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/components/upload/DropZone.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$upload$2f$ScriptInput$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/components/upload/ScriptInput.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$upload$2f$ProcessingStatus$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/components/upload/ProcessingStatus.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$upload$2f$ResultsList$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/components/upload/ResultsList.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
function Home() {
    const file = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$upload$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUploadStore"])((s)=>s.file);
    const script = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$upload$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUploadStore"])((s)=>s.script);
    const phase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$upload$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUploadStore"])((s)=>s.phase);
    const process = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$upload$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUploadStore"])((s)=>s.process);
    const reset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$upload$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUploadStore"])((s)=>s.reset);
    const canProcess = file !== null && script.trim().length > 0 && phase === "idle";
    const isProcessing = phase === "uploading" || phase === "transcribing" || phase === "aligning";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            minHeight: "100vh",
            background: "var(--bg-primary)",
            overflowY: "auto"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 24px",
                    borderBottom: "1px solid var(--border)",
                    background: "var(--bg-secondary)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            alignItems: "center",
                            gap: 8
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            style: {
                                fontSize: 14,
                                fontWeight: 600,
                                color: "var(--text-primary)"
                            },
                            children: "Video Pipeline"
                        }, void 0, false, {
                            fileName: "[project]/web/app/page.tsx",
                            lineNumber: 40,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/web/app/page.tsx",
                        lineNumber: 39,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/editor",
                        style: {
                            fontSize: 13,
                            color: "var(--text-secondary)",
                            textDecoration: "none",
                            padding: "4px 10px",
                            borderRadius: 6,
                            border: "1px solid var(--border)"
                        },
                        children: "Open Editor"
                    }, void 0, false, {
                        fileName: "[project]/web/app/page.tsx",
                        lineNumber: 50,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/web/app/page.tsx",
                lineNumber: 29,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                style: {
                    maxWidth: 640,
                    margin: "0 auto",
                    padding: "48px 24px 80px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 28
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                style: {
                                    fontSize: 28,
                                    fontWeight: 700,
                                    color: "var(--text-primary)",
                                    margin: "0 0 6px",
                                    letterSpacing: "-0.02em"
                                },
                                children: "Create shorts from your recording"
                            }, void 0, false, {
                                fileName: "[project]/web/app/page.tsx",
                                lineNumber: 78,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                style: {
                                    fontSize: 14,
                                    color: "var(--text-secondary)",
                                    margin: 0,
                                    lineHeight: 1.5
                                },
                                children: "Upload your a-roll video and paste the script you recorded from. The tool will transcribe, find the best takes, remove silences, and split into shorts."
                            }, void 0, false, {
                                fileName: "[project]/web/app/page.tsx",
                                lineNumber: 89,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/app/page.tsx",
                        lineNumber: 77,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$upload$2f$DropZone$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                        fileName: "[project]/web/app/page.tsx",
                        lineNumber: 97,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$upload$2f$ScriptInput$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                        fileName: "[project]/web/app/page.tsx",
                        lineNumber: 98,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            gap: 10
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: process,
                                disabled: !canProcess,
                                style: {
                                    flex: 1,
                                    padding: "12px 20px",
                                    fontSize: 15,
                                    fontWeight: 600,
                                    color: canProcess ? "#fff" : "var(--text-muted)",
                                    background: canProcess ? "var(--accent)" : "var(--bg-elevated)",
                                    borderRadius: 10,
                                    transition: "all 0.15s",
                                    cursor: canProcess ? "pointer" : "default"
                                },
                                children: isProcessing ? "Processing..." : "Process"
                            }, void 0, false, {
                                fileName: "[project]/web/app/page.tsx",
                                lineNumber: 102,
                                columnNumber: 11
                            }, this),
                            (phase === "done" || phase === "error") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: reset,
                                style: {
                                    padding: "12px 20px",
                                    fontSize: 15,
                                    fontWeight: 500,
                                    color: "var(--text-secondary)",
                                    background: "var(--bg-elevated)",
                                    borderRadius: 10
                                },
                                children: "Start over"
                            }, void 0, false, {
                                fileName: "[project]/web/app/page.tsx",
                                lineNumber: 121,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/app/page.tsx",
                        lineNumber: 101,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$upload$2f$ProcessingStatus$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                        fileName: "[project]/web/app/page.tsx",
                        lineNumber: 138,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$upload$2f$ResultsList$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                        fileName: "[project]/web/app/page.tsx",
                        lineNumber: 141,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/web/app/page.tsx",
                lineNumber: 66,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/web/app/page.tsx",
        lineNumber: 21,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=web_88728784._.js.map