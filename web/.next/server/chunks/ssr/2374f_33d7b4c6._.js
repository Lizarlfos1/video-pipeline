module.exports = [
"[project]/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/web/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxDevRuntime; //# sourceMappingURL=react-jsx-dev-runtime.js.map
}),
"[project]/web/node_modules/zustand/esm/vanilla.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createStore",
    ()=>createStore
]);
const createStoreImpl = (createState)=>{
    let state;
    const listeners = /* @__PURE__ */ new Set();
    const setState = (partial, replace)=>{
        const nextState = typeof partial === "function" ? partial(state) : partial;
        if (!Object.is(nextState, state)) {
            const previousState = state;
            state = (replace != null ? replace : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
            listeners.forEach((listener)=>listener(state, previousState));
        }
    };
    const getState = ()=>state;
    const getInitialState = ()=>initialState;
    const subscribe = (listener)=>{
        listeners.add(listener);
        return ()=>listeners.delete(listener);
    };
    const api = {
        setState,
        getState,
        getInitialState,
        subscribe
    };
    const initialState = state = createState(setState, getState, api);
    return api;
};
const createStore = (createState)=>createState ? createStoreImpl(createState) : createStoreImpl;
;
}),
"[project]/web/node_modules/zustand/esm/react.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "create",
    ()=>create,
    "useStore",
    ()=>useStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$zustand$2f$esm$2f$vanilla$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/zustand/esm/vanilla.mjs [app-ssr] (ecmascript)");
;
;
const identity = (arg)=>arg;
function useStore(api, selector = identity) {
    const slice = __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].useSyncExternalStore(api.subscribe, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].useCallback(()=>selector(api.getState()), [
        api,
        selector
    ]), __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].useCallback(()=>selector(api.getInitialState()), [
        api,
        selector
    ]));
    __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].useDebugValue(slice);
    return slice;
}
const createImpl = (createState)=>{
    const api = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$zustand$2f$esm$2f$vanilla$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createStore"])(createState);
    const useBoundStore = (selector)=>useStore(api, selector);
    Object.assign(useBoundStore, api);
    return useBoundStore;
};
const create = (createState)=>createState ? createImpl(createState) : createImpl;
;
}),
"[project]/web/node_modules/zundo/dist/index.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/index.ts
__turbopack_context__.s([
    "temporal",
    ()=>temporal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$zustand$2f$esm$2f$vanilla$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/zustand/esm/vanilla.mjs [app-ssr] (ecmascript)");
;
// src/temporal.ts
var temporalStateCreator = (userSet, userGet, options)=>{
    const stateCreator = (set, get)=>{
        return {
            pastStates: options?.pastStates || [],
            futureStates: options?.futureStates || [],
            undo: (steps = 1)=>{
                if (get().pastStates.length) {
                    const currentState = options?.partialize?.(userGet()) || userGet();
                    const statesToApply = get().pastStates.splice(-steps, steps);
                    const nextState = statesToApply.shift();
                    userSet(nextState);
                    set({
                        pastStates: get().pastStates,
                        futureStates: get().futureStates.concat(options?.diff?.(currentState, nextState) || currentState, statesToApply.reverse())
                    });
                }
            },
            redo: (steps = 1)=>{
                if (get().futureStates.length) {
                    const currentState = options?.partialize?.(userGet()) || userGet();
                    const statesToApply = get().futureStates.splice(-steps, steps);
                    const nextState = statesToApply.shift();
                    userSet(nextState);
                    set({
                        pastStates: get().pastStates.concat(options?.diff?.(currentState, nextState) || currentState, statesToApply.reverse()),
                        futureStates: get().futureStates
                    });
                }
            },
            clear: ()=>set({
                    pastStates: [],
                    futureStates: []
                }),
            isTracking: true,
            pause: ()=>set({
                    isTracking: false
                }),
            resume: ()=>set({
                    isTracking: true
                }),
            setOnSave: (_onSave)=>set({
                    _onSave
                }),
            // Internal properties
            _onSave: options?.onSave,
            _handleSet: (pastState, replace, currentState, deltaState)=>{
                if (options?.limit && get().pastStates.length >= options?.limit) {
                    get().pastStates.shift();
                }
                get()._onSave?.(pastState, currentState);
                set({
                    pastStates: get().pastStates.concat(deltaState || pastState),
                    futureStates: []
                });
            }
        };
    };
    return stateCreator;
};
// src/index.ts
var temporal = (config, options)=>{
    const configWithTemporal = (set, get, store)=>{
        store.temporal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$zustand$2f$esm$2f$vanilla$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createStore"])(options?.wrapTemporal?.(temporalStateCreator(set, get, options)) || temporalStateCreator(set, get, options));
        const curriedHandleSet = options?.handleSet?.(store.temporal.getState()._handleSet) || store.temporal.getState()._handleSet;
        const temporalHandleSet = (pastState)=>{
            if (!store.temporal.getState().isTracking) return;
            const currentState = options?.partialize?.(get()) || get();
            const deltaState = options?.diff?.(pastState, currentState);
            if (// Don't call handleSet if state hasn't changed, as determined by diff fn or equality fn
            !(deltaState === null || // If the user has provided an equality function, use it
            options?.equality?.(pastState, currentState))) {
                curriedHandleSet(pastState, void 0, currentState, deltaState);
            }
        };
        const setState = store.setState;
        store.setState = (...args)=>{
            const pastState = options?.partialize?.(get()) || get();
            setState(...args);
            temporalHandleSet(pastState);
        };
        return config(// Modify the set function to call the userlandSet function
        (...args)=>{
            const pastState = options?.partialize?.(get()) || get();
            set(...args);
            temporalHandleSet(pastState);
        }, get, store);
    };
    return configWithTemporal;
};
;
 //# sourceMappingURL=index.js.map
}),
];

//# sourceMappingURL=2374f_33d7b4c6._.js.map