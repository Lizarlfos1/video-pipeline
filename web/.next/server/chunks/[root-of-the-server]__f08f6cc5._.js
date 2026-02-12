module.exports = [
"[project]/web/.next-internal/server/app/api/pipeline/[stage]/stream/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/web/lib/jobs.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addListener",
    ()=>addListener,
    "createJob",
    ()=>createJob,
    "getJob",
    ()=>getJob
]);
const jobs = new Map();
function getJob(jobId) {
    return jobs.get(jobId);
}
function createJob(jobId, process) {
    const job = {
        process,
        logs: [],
        status: "running",
        listeners: new Set()
    };
    jobs.set(jobId, job);
    process.stdout?.on("data", (data)=>{
        const line = data.toString();
        job.logs.push(line);
        for (const fn of job.listeners){
            fn(JSON.stringify({
                type: "log",
                data: line
            }));
        }
    });
    process.stderr?.on("data", (data)=>{
        const line = data.toString();
        job.logs.push(line);
        for (const fn of job.listeners){
            fn(JSON.stringify({
                type: "log",
                data: line
            }));
        }
    });
    process.on("close", (code)=>{
        job.status = code === 0 ? "done" : "error";
        for (const fn of job.listeners){
            fn(JSON.stringify({
                type: job.status
            }));
        }
    });
    return job;
}
function addListener(jobId, fn) {
    const job = jobs.get(jobId);
    if (!job) return ()=>{};
    job.listeners.add(fn);
    return ()=>job.listeners.delete(fn);
}
}),
"[project]/web/app/api/pipeline/[stage]/stream/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$jobs$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/jobs.ts [app-route] (ecmascript)");
;
async function GET(request) {
    const jobId = request.nextUrl.searchParams.get("jobId");
    if (!jobId) {
        return new Response("Missing jobId", {
            status: 400
        });
    }
    const job = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$jobs$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getJob"])(jobId);
    if (!job) {
        return new Response("Job not found", {
            status: 404
        });
    }
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        start (controller) {
            // Send existing logs
            for (const log of job.logs){
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: "log",
                    data: log
                })}\n\n`));
            }
            // If already finished, send final status
            if (job.status !== "running") {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: job.status
                })}\n\n`));
                controller.close();
                return;
            }
            // Listen for new events
            const cleanup = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$jobs$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["addListener"])(jobId, (data)=>{
                try {
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                    const parsed = JSON.parse(data);
                    if (parsed.type === "done" || parsed.type === "error") {
                        controller.close();
                        cleanup();
                    }
                } catch  {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: "log",
                        data
                    })}\n\n`));
                }
            });
        }
    });
    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive"
        }
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__f08f6cc5._.js.map