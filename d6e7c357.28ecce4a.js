(window.webpackJsonp=window.webpackJsonp||[]).push([[25],{78:function(e,t,n){"use strict";n.r(t),n.d(t,"frontMatter",(function(){return l})),n.d(t,"metadata",(function(){return c})),n.d(t,"rightToc",(function(){return i})),n.d(t,"default",(function(){return o}));var a=n(2),b=n(6),r=(n(0),n(89)),l={},c={unversionedId:"API_functions",id:"API_functions",isDocsHomePage:!1,title:"API_functions",description:"Functions",source:"@site/docs\\API_functions.md",permalink:"/intermix/docs/API_functions",editUrl:"https://github.com/RolandJansen/intermix/tree/homepage/docs/API_functions.md",sidebar:"someSidebar",next:{title:"API_messages",permalink:"/intermix/docs/"}},i=[{value:"Functions",id:"functions",children:[{value:"addPlugin",id:"addplugin",children:[]},{value:"addPluginClass",id:"addpluginclass",children:[]},{value:"addSeqPart",id:"addseqpart",children:[]},{value:"connectPlugins",id:"connectplugins",children:[]},{value:"dispatch",id:"dispatch",children:[]},{value:"getActionCreators",id:"getactioncreators",children:[]},{value:"getAudioContext",id:"getaudiocontext",children:[]},{value:"getPluginClassNames",id:"getpluginclassnames",children:[]},{value:"getState",id:"getstate",children:[]},{value:"getUnboundActionCreators",id:"getunboundactioncreators",children:[]},{value:"removePlugin",id:"removeplugin",children:[]},{value:"removePluginClass",id:"removepluginclass",children:[]},{value:"removeSeqPart",id:"removeseqpart",children:[]},{value:"resumeAudioContext",id:"resumeaudiocontext",children:[]}]},{value:"Object literals",id:"object-literals",children:[{value:"pluginClasses",id:"pluginclasses",children:[]}]}],p={rightToc:i};function o(e){var t=e.components,n=Object(b.a)(e,["components"]);return Object(r.b)("wrapper",Object(a.a)({},p,n,{components:t,mdxType:"MDXLayout"}),Object(r.b)("h2",{id:"functions"},"Functions"),Object(r.b)("h3",{id:"addplugin"},"addPlugin"),Object(r.b)("p",null,"\u25b8 ",Object(r.b)("strong",{parentName:"p"},"addPlugin"),"(",Object(r.b)("inlineCode",{parentName:"p"},"pluginClassName"),": string): string"),Object(r.b)("p",null,"Tries to find a class (prototype) with the name of a given string (reflection),\nthen tries to cast it to a valid plugin class.\nIf both worked, a plugin instance will be created, registered etc.\nand the item-id will be returned"),Object(r.b)("h4",{id:"parameters"},"Parameters:"),Object(r.b)("table",null,Object(r.b)("thead",{parentName:"table"},Object(r.b)("tr",{parentName:"thead"},Object(r.b)("th",Object(a.a)({parentName:"tr"},{align:null}),"Name"),Object(r.b)("th",Object(a.a)({parentName:"tr"},{align:null}),"Type"),Object(r.b)("th",Object(a.a)({parentName:"tr"},{align:null}),"Description"))),Object(r.b)("tbody",{parentName:"table"},Object(r.b)("tr",{parentName:"tbody"},Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),Object(r.b)("inlineCode",{parentName:"td"},"pluginClassName")),Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),"string"),Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),"The name of the class from which a plugin instance should be created")))),Object(r.b)("p",null,Object(r.b)("strong",{parentName:"p"},"Returns:")," string"),Object(r.b)("hr",null),Object(r.b)("h3",{id:"addpluginclass"},"addPluginClass"),Object(r.b)("p",null,"\u25b8 ",Object(r.b)("strong",{parentName:"p"},"addPluginClass"),"(",Object(r.b)("inlineCode",{parentName:"p"},"PluginClass"),": IPluginConstructor): void"),Object(r.b)("h4",{id:"parameters-1"},"Parameters:"),Object(r.b)("table",null,Object(r.b)("thead",{parentName:"table"},Object(r.b)("tr",{parentName:"thead"},Object(r.b)("th",Object(a.a)({parentName:"tr"},{align:null}),"Name"),Object(r.b)("th",Object(a.a)({parentName:"tr"},{align:null}),"Type"))),Object(r.b)("tbody",{parentName:"table"},Object(r.b)("tr",{parentName:"tbody"},Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),Object(r.b)("inlineCode",{parentName:"td"},"PluginClass")),Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),"IPluginConstructor")))),Object(r.b)("p",null,Object(r.b)("strong",{parentName:"p"},"Returns:")," void"),Object(r.b)("hr",null),Object(r.b)("h3",{id:"addseqpart"},"addSeqPart"),Object(r.b)("p",null,"\u25b8 ",Object(r.b)("strong",{parentName:"p"},"addSeqPart"),"(",Object(r.b)("inlineCode",{parentName:"p"},"lengthInStepsPerBar?"),": undefined ","|"," number): string"),Object(r.b)("h4",{id:"parameters-2"},"Parameters:"),Object(r.b)("table",null,Object(r.b)("thead",{parentName:"table"},Object(r.b)("tr",{parentName:"thead"},Object(r.b)("th",Object(a.a)({parentName:"tr"},{align:null}),"Name"),Object(r.b)("th",Object(a.a)({parentName:"tr"},{align:null}),"Type"))),Object(r.b)("tbody",{parentName:"table"},Object(r.b)("tr",{parentName:"tbody"},Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),Object(r.b)("inlineCode",{parentName:"td"},"lengthInStepsPerBar?")),Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),"undefined ","|"," number")))),Object(r.b)("p",null,Object(r.b)("strong",{parentName:"p"},"Returns:")," string"),Object(r.b)("hr",null),Object(r.b)("h3",{id:"connectplugins"},"connectPlugins"),Object(r.b)("p",null,"\u25b8 ",Object(r.b)("strong",{parentName:"p"},"connectPlugins"),"(",Object(r.b)("inlineCode",{parentName:"p"},"connection"),": ","[AudioEndpoint, AudioEndpoint]","): void"),Object(r.b)("p",null,"Connects two audio endpoints and dispatches the new state.\nIf the id of the input plugin is not valid, it connects to the soundcard input.\nIf the id of the output plugin is not valid, it cancels the operation."),Object(r.b)("h4",{id:"parameters-3"},"Parameters:"),Object(r.b)("table",null,Object(r.b)("thead",{parentName:"table"},Object(r.b)("tr",{parentName:"thead"},Object(r.b)("th",Object(a.a)({parentName:"tr"},{align:null}),"Name"),Object(r.b)("th",Object(a.a)({parentName:"tr"},{align:null}),"Type"),Object(r.b)("th",Object(a.a)({parentName:"tr"},{align:null}),"Description"))),Object(r.b)("tbody",{parentName:"table"},Object(r.b)("tr",{parentName:"tbody"},Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),Object(r.b)("inlineCode",{parentName:"td"},"connection")),Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),"[AudioEndpoint, AudioEndpoint]"),Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),"Audio endpoints to be connected")))),Object(r.b)("p",null,Object(r.b)("strong",{parentName:"p"},"Returns:")," void"),Object(r.b)("hr",null),Object(r.b)("h3",{id:"dispatch"},"dispatch"),Object(r.b)("p",null,"\u25b8 ",Object(r.b)("strong",{parentName:"p"},"dispatch"),"(",Object(r.b)("inlineCode",{parentName:"p"},"action"),": Action): void"),Object(r.b)("h4",{id:"parameters-4"},"Parameters:"),Object(r.b)("table",null,Object(r.b)("thead",{parentName:"table"},Object(r.b)("tr",{parentName:"thead"},Object(r.b)("th",Object(a.a)({parentName:"tr"},{align:null}),"Name"),Object(r.b)("th",Object(a.a)({parentName:"tr"},{align:null}),"Type"))),Object(r.b)("tbody",{parentName:"table"},Object(r.b)("tr",{parentName:"tbody"},Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),Object(r.b)("inlineCode",{parentName:"td"},"action")),Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),"Action")))),Object(r.b)("p",null,Object(r.b)("strong",{parentName:"p"},"Returns:")," void"),Object(r.b)("hr",null),Object(r.b)("h3",{id:"getactioncreators"},"getActionCreators"),Object(r.b)("p",null,"\u25b8 ",Object(r.b)("strong",{parentName:"p"},"getActionCreators"),"(",Object(r.b)("inlineCode",{parentName:"p"},"itemId"),": string): ActionCreatorsMapObject"),Object(r.b)("h4",{id:"parameters-5"},"Parameters:"),Object(r.b)("table",null,Object(r.b)("thead",{parentName:"table"},Object(r.b)("tr",{parentName:"thead"},Object(r.b)("th",Object(a.a)({parentName:"tr"},{align:null}),"Name"),Object(r.b)("th",Object(a.a)({parentName:"tr"},{align:null}),"Type"))),Object(r.b)("tbody",{parentName:"table"},Object(r.b)("tr",{parentName:"tbody"},Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),Object(r.b)("inlineCode",{parentName:"td"},"itemId")),Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),"string")))),Object(r.b)("p",null,Object(r.b)("strong",{parentName:"p"},"Returns:")," ActionCreatorsMapObject"),Object(r.b)("hr",null),Object(r.b)("h3",{id:"getaudiocontext"},"getAudioContext"),Object(r.b)("p",null,"\u25b8 ",Object(r.b)("strong",{parentName:"p"},"getAudioContext"),"(): AudioContext"),Object(r.b)("p",null,Object(r.b)("strong",{parentName:"p"},"Returns:")," AudioContext"),Object(r.b)("hr",null),Object(r.b)("h3",{id:"getpluginclassnames"},"getPluginClassNames"),Object(r.b)("p",null,"\u25b8 ",Object(r.b)("strong",{parentName:"p"},"getPluginClassNames"),"(): string[]"),Object(r.b)("p",null,Object(r.b)("strong",{parentName:"p"},"Returns:")," string[]"),Object(r.b)("hr",null),Object(r.b)("h3",{id:"getstate"},"getState"),Object(r.b)("p",null,"\u25b8 ",Object(r.b)("strong",{parentName:"p"},"getState"),"(): IState"),Object(r.b)("p",null,Object(r.b)("strong",{parentName:"p"},"Returns:")," IState"),Object(r.b)("hr",null),Object(r.b)("h3",{id:"getunboundactioncreators"},"getUnboundActionCreators"),Object(r.b)("p",null,"\u25b8 ",Object(r.b)("strong",{parentName:"p"},"getUnboundActionCreators"),"(",Object(r.b)("inlineCode",{parentName:"p"},"itemId"),": string): ActionCreatorsMapObject"),Object(r.b)("h4",{id:"parameters-6"},"Parameters:"),Object(r.b)("table",null,Object(r.b)("thead",{parentName:"table"},Object(r.b)("tr",{parentName:"thead"},Object(r.b)("th",Object(a.a)({parentName:"tr"},{align:null}),"Name"),Object(r.b)("th",Object(a.a)({parentName:"tr"},{align:null}),"Type"))),Object(r.b)("tbody",{parentName:"table"},Object(r.b)("tr",{parentName:"tbody"},Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),Object(r.b)("inlineCode",{parentName:"td"},"itemId")),Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),"string")))),Object(r.b)("p",null,Object(r.b)("strong",{parentName:"p"},"Returns:")," ActionCreatorsMapObject"),Object(r.b)("hr",null),Object(r.b)("h3",{id:"removeplugin"},"removePlugin"),Object(r.b)("p",null,"\u25b8 ",Object(r.b)("strong",{parentName:"p"},"removePlugin"),"(",Object(r.b)("inlineCode",{parentName:"p"},"itemId"),": string): void"),Object(r.b)("h4",{id:"parameters-7"},"Parameters:"),Object(r.b)("table",null,Object(r.b)("thead",{parentName:"table"},Object(r.b)("tr",{parentName:"thead"},Object(r.b)("th",Object(a.a)({parentName:"tr"},{align:null}),"Name"),Object(r.b)("th",Object(a.a)({parentName:"tr"},{align:null}),"Type"))),Object(r.b)("tbody",{parentName:"table"},Object(r.b)("tr",{parentName:"tbody"},Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),Object(r.b)("inlineCode",{parentName:"td"},"itemId")),Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),"string")))),Object(r.b)("p",null,Object(r.b)("strong",{parentName:"p"},"Returns:")," void"),Object(r.b)("hr",null),Object(r.b)("h3",{id:"removepluginclass"},"removePluginClass"),Object(r.b)("p",null,"\u25b8 ",Object(r.b)("strong",{parentName:"p"},"removePluginClass"),"(",Object(r.b)("inlineCode",{parentName:"p"},"className"),": string): boolean"),Object(r.b)("h4",{id:"parameters-8"},"Parameters:"),Object(r.b)("table",null,Object(r.b)("thead",{parentName:"table"},Object(r.b)("tr",{parentName:"thead"},Object(r.b)("th",Object(a.a)({parentName:"tr"},{align:null}),"Name"),Object(r.b)("th",Object(a.a)({parentName:"tr"},{align:null}),"Type"))),Object(r.b)("tbody",{parentName:"table"},Object(r.b)("tr",{parentName:"tbody"},Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),Object(r.b)("inlineCode",{parentName:"td"},"className")),Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),"string")))),Object(r.b)("p",null,Object(r.b)("strong",{parentName:"p"},"Returns:")," boolean"),Object(r.b)("hr",null),Object(r.b)("h3",{id:"removeseqpart"},"removeSeqPart"),Object(r.b)("p",null,"\u25b8 ",Object(r.b)("strong",{parentName:"p"},"removeSeqPart"),"(",Object(r.b)("inlineCode",{parentName:"p"},"itemId"),": string): void"),Object(r.b)("h4",{id:"parameters-9"},"Parameters:"),Object(r.b)("table",null,Object(r.b)("thead",{parentName:"table"},Object(r.b)("tr",{parentName:"thead"},Object(r.b)("th",Object(a.a)({parentName:"tr"},{align:null}),"Name"),Object(r.b)("th",Object(a.a)({parentName:"tr"},{align:null}),"Type"))),Object(r.b)("tbody",{parentName:"table"},Object(r.b)("tr",{parentName:"tbody"},Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),Object(r.b)("inlineCode",{parentName:"td"},"itemId")),Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),"string")))),Object(r.b)("p",null,Object(r.b)("strong",{parentName:"p"},"Returns:")," void"),Object(r.b)("hr",null),Object(r.b)("h3",{id:"resumeaudiocontext"},"resumeAudioContext"),Object(r.b)("p",null,"\u25b8 ",Object(r.b)("strong",{parentName:"p"},"resumeAudioContext"),"(): void"),Object(r.b)("p",null,Object(r.b)("strong",{parentName:"p"},"Returns:")," void"),Object(r.b)("h2",{id:"object-literals"},"Object literals"),Object(r.b)("h3",{id:"pluginclasses"},"pluginClasses"),Object(r.b)("p",null,"\u25aa ",Object(r.b)("inlineCode",{parentName:"p"},"Const")," ",Object(r.b)("strong",{parentName:"p"},"pluginClasses"),": object"),Object(r.b)("h4",{id:"properties"},"Properties:"),Object(r.b)("table",null,Object(r.b)("thead",{parentName:"table"},Object(r.b)("tr",{parentName:"thead"},Object(r.b)("th",Object(a.a)({parentName:"tr"},{align:null}),"Name"),Object(r.b)("th",Object(a.a)({parentName:"tr"},{align:null}),"Type"),Object(r.b)("th",Object(a.a)({parentName:"tr"},{align:null}),"Value"))),Object(r.b)("tbody",{parentName:"table"},Object(r.b)("tr",{parentName:"tbody"},Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),Object(r.b)("inlineCode",{parentName:"td"},"Delay")),Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),"IPluginConstructor"),Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),"IPluginConstructor")),Object(r.b)("tr",{parentName:"tbody"},Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),Object(r.b)("inlineCode",{parentName:"td"},"Sampler")),Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),"IPluginConstructor"),Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),"IPluginConstructor")),Object(r.b)("tr",{parentName:"tbody"},Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),Object(r.b)("inlineCode",{parentName:"td"},"Sequencer")),Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),"IPluginConstructor"),Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),"IPluginConstructor")),Object(r.b)("tr",{parentName:"tbody"},Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),Object(r.b)("inlineCode",{parentName:"td"},"Synth")),Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),"IPluginConstructor"),Object(r.b)("td",Object(a.a)({parentName:"tr"},{align:null}),"IPluginConstructor")))))}o.isMDXComponent=!0},89:function(e,t,n){"use strict";n.d(t,"a",(function(){return O})),n.d(t,"b",(function(){return u}));var a=n(0),b=n.n(a);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function l(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function c(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?l(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):l(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function i(e,t){if(null==e)return{};var n,a,b=function(e,t){if(null==e)return{};var n,a,b={},r=Object.keys(e);for(a=0;a<r.length;a++)n=r[a],t.indexOf(n)>=0||(b[n]=e[n]);return b}(e,t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(a=0;a<r.length;a++)n=r[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(b[n]=e[n])}return b}var p=b.a.createContext({}),o=function(e){var t=b.a.useContext(p),n=t;return e&&(n="function"==typeof e?e(t):c(c({},t),e)),n},O=function(e){var t=o(e.components);return b.a.createElement(p.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return b.a.createElement(b.a.Fragment,{},t)}},j=b.a.forwardRef((function(e,t){var n=e.components,a=e.mdxType,r=e.originalType,l=e.parentName,p=i(e,["components","mdxType","originalType","parentName"]),O=o(n),j=a,u=O["".concat(l,".").concat(j)]||O[j]||d[j]||r;return n?b.a.createElement(u,c(c({ref:t},p),{},{components:n})):b.a.createElement(u,c({ref:t},p))}));function u(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var r=n.length,l=new Array(r);l[0]=j;var c={};for(var i in t)hasOwnProperty.call(t,i)&&(c[i]=t[i]);c.originalType=e,c.mdxType="string"==typeof e?e:a,l[1]=c;for(var p=2;p<r;p++)l[p]=n[p];return b.a.createElement.apply(null,l)}return b.a.createElement.apply(null,n)}j.displayName="MDXCreateElement"}}]);