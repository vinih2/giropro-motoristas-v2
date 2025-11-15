(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/components/MapWidget.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>MapWidget
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$leaflet$2f$lib$2f$MapContainer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-leaflet/lib/MapContainer.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$leaflet$2f$lib$2f$TileLayer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-leaflet/lib/TileLayer.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$leaflet$2f$lib$2f$Circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-leaflet/lib/Circle.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$leaflet$2f$lib$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-leaflet/lib/hooks.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
function ChangeView(param) {
    let { center } = param;
    _s();
    const map = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$leaflet$2f$lib$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMap"])();
    map.setView(center, 12);
    return null;
}
_s(ChangeView, "cX187cvZ2hODbkaiLn05gMk1sCM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$leaflet$2f$lib$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMap"]
    ];
});
_c = ChangeView;
// Coordenadas das principais cidades (para centrar o mapa)
const COORDENADAS = {
    'São Paulo': [
        -23.5505,
        -46.6333
    ],
    'Rio de Janeiro': [
        -22.9068,
        -43.1729
    ],
    'Belo Horizonte': [
        -19.9167,
        -43.9345
    ],
    'Brasília': [
        -15.7801,
        -47.9292
    ],
    'Salvador': [
        -12.9777,
        -38.5016
    ],
    'Fortaleza': [
        -3.7172,
        -38.5433
    ],
    'Curitiba': [
        -25.4284,
        -49.2733
    ],
    'Manaus': [
        -3.1190,
        -60.0217
    ],
    'Recife': [
        -8.0543,
        -34.8813
    ],
    'Porto Alegre': [
        -30.0346,
        -51.2177
    ],
    'Goiânia': [
        -16.6869,
        -49.2648
    ],
    'Belém': [
        -1.4558,
        -48.4902
    ],
    'Guarulhos': [
        -23.4542,
        -46.5337
    ],
    'Campinas': [
        -22.9099,
        -47.0626
    ],
    'São Luís': [
        -2.5307,
        -44.3068
    ],
    'São Gonçalo': [
        -22.8275,
        -43.0632
    ],
    'Maceió': [
        -9.6662,
        -35.7351
    ],
    'Duque de Caxias': [
        -22.7923,
        -43.3082
    ],
    'Natal': [
        -5.7945,
        -35.2110
    ],
    'Campo Grande': [
        -20.4697,
        -54.6201
    ],
    'Teresina': [
        -5.0919,
        -42.8034
    ],
    'João Pessoa': [
        -7.1195,
        -34.8450
    ],
    'Florianópolis': [
        -27.5954,
        -48.5480
    ],
    'Cuiabá': [
        -15.6014,
        -56.0979
    ],
    'Aracaju': [
        -10.9472,
        -37.0731
    ],
    'Vitória': [
        -20.3194,
        -40.3377
    ]
};
function MapWidget(param) {
    let { cidade } = param;
    _s1();
    const [isMounted, setIsMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const center = COORDENADAS[cidade] || COORDENADAS['São Paulo'];
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MapWidget.useEffect": ()=>{
            setIsMounted(true);
        }
    }["MapWidget.useEffect"], []);
    if (!isMounted) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "h-72 w-full bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse flex items-center justify-center text-gray-400",
            children: "Carregando Mapa..."
        }, void 0, false, {
            fileName: "[project]/src/components/MapWidget.tsx",
            lineNumber: 57,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "h-72 w-full rounded-2xl overflow-hidden shadow-lg border-2 border-gray-100 dark:border-gray-800 relative z-0",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$leaflet$2f$lib$2f$MapContainer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MapContainer"], {
                center: center,
                zoom: 12,
                style: {
                    height: '100%',
                    width: '100%'
                },
                zoomControl: false,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$leaflet$2f$lib$2f$TileLayer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TileLayer"], {
                        attribution: "© OpenStreetMap",
                        url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    }, void 0, false, {
                        fileName: "[project]/src/components/MapWidget.tsx",
                        lineNumber: 71,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ChangeView, {
                        center: center
                    }, void 0, false, {
                        fileName: "[project]/src/components/MapWidget.tsx",
                        lineNumber: 75,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$leaflet$2f$lib$2f$Circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Circle"], {
                        center: [
                            center[0] + 0.01,
                            center[1] - 0.01
                        ],
                        radius: 1500,
                        pathOptions: {
                            color: 'transparent',
                            fillColor: '#ef4444',
                            fillOpacity: 0.4
                        }
                    }, void 0, false, {
                        fileName: "[project]/src/components/MapWidget.tsx",
                        lineNumber: 78,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$leaflet$2f$lib$2f$Circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Circle"], {
                        center: [
                            center[0] - 0.02,
                            center[1] + 0.02
                        ],
                        radius: 1000,
                        pathOptions: {
                            color: 'transparent',
                            fillColor: '#f97316',
                            fillOpacity: 0.4
                        }
                    }, void 0, false, {
                        fileName: "[project]/src/components/MapWidget.tsx",
                        lineNumber: 79,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$leaflet$2f$lib$2f$Circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Circle"], {
                        center: [
                            center[0] + 0.02,
                            center[1] + 0.02
                        ],
                        radius: 1200,
                        pathOptions: {
                            color: 'transparent',
                            fillColor: '#eab308',
                            fillOpacity: 0.4
                        }
                    }, void 0, false, {
                        fileName: "[project]/src/components/MapWidget.tsx",
                        lineNumber: 80,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/MapWidget.tsx",
                lineNumber: 65,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute bottom-2 right-2 bg-white/90 dark:bg-black/80 px-3 py-1 rounded-lg text-xs font-bold shadow-md z-[400] text-gray-800 dark:text-white",
                children: "🔥 Áreas de Demanda"
            }, void 0, false, {
                fileName: "[project]/src/components/MapWidget.tsx",
                lineNumber: 83,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/MapWidget.tsx",
        lineNumber: 64,
        columnNumber: 5
    }, this);
}
_s1(MapWidget, "h7njlszr1nxUzrk46zHyBTBrvgI=");
_c1 = MapWidget;
var _c, _c1;
__turbopack_context__.k.register(_c, "ChangeView");
__turbopack_context__.k.register(_c1, "MapWidget");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/MapWidget.tsx [app-client] (ecmascript, next/dynamic entry)": ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/components/MapWidget.tsx [app-client] (ecmascript)"));
}),
}]);

//# sourceMappingURL=src_components_MapWidget_tsx_eea8bab4._.js.map