// MIT License

// Copyright (c) 2024 Austrian Centre for Digital Humanities & Cultural Heritage

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
// https://github.com/acdh-oeaw/acdh-noske-search
// version of code 0.1.2

var K = Object.defineProperty;
var Z = (r, e, t) =>
  e in r
    ? K(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t })
    : (r[e] = t);
var p = (r, e, t) => (Z(r, typeof e != "symbol" ? e + "" : e, t), t);
var S = class {
    constructor() {
      p(this, "_fns");
      this._fns = [];
    }
    eject(e) {
      let t = this._fns.indexOf(e);
      t !== -1 &&
        (this._fns = [...this._fns.slice(0, t), ...this._fns.slice(t + 1)]);
    }
    use(e) {
      this._fns = [...this._fns, e];
    }
  },
  d = {
    BASE: "",
    CREDENTIALS: "include",
    ENCODE_PATH: void 0,
    HEADERS: void 0,
    PASSWORD: void 0,
    TOKEN: void 0,
    USERNAME: void 0,
    VERSION: "2.0.0",
    WITH_CREDENTIALS: !1,
    interceptors: { request: new S(), response: new S() },
  };
var T = class extends Error {
  constructor(t, s, o) {
    super(o);
    p(this, "url");
    p(this, "status");
    p(this, "statusText");
    p(this, "body");
    p(this, "request");
    (this.name = "ApiError"),
      (this.url = s.url),
      (this.status = s.status),
      (this.statusText = s.statusText),
      (this.body = s.body),
      (this.request = t);
  }
};
var A = class extends Error {
    constructor(e) {
      super(e), (this.name = "CancelError");
    }
    get isCancelled() {
      return !0;
    }
  },
  q = class {
    constructor(e) {
      p(this, "_isResolved");
      p(this, "_isRejected");
      p(this, "_isCancelled");
      p(this, "cancelHandlers");
      p(this, "promise");
      p(this, "_resolve");
      p(this, "_reject");
      (this._isResolved = !1),
        (this._isRejected = !1),
        (this._isCancelled = !1),
        (this.cancelHandlers = []),
        (this.promise = new Promise((t, s) => {
          (this._resolve = t), (this._reject = s);
          let o = (a) => {
              this._isResolved ||
                this._isRejected ||
                this._isCancelled ||
                ((this._isResolved = !0), this._resolve && this._resolve(a));
            },
            n = (a) => {
              this._isResolved ||
                this._isRejected ||
                this._isCancelled ||
                ((this._isRejected = !0), this._reject && this._reject(a));
            },
            i = (a) => {
              this._isResolved ||
                this._isRejected ||
                this._isCancelled ||
                this.cancelHandlers.push(a);
            };
          return (
            Object.defineProperty(i, "isResolved", {
              get: () => this._isResolved,
            }),
            Object.defineProperty(i, "isRejected", {
              get: () => this._isRejected,
            }),
            Object.defineProperty(i, "isCancelled", {
              get: () => this._isCancelled,
            }),
            e(o, n, i)
          );
        }));
    }
    get [Symbol.toStringTag]() {
      return "Cancellable Promise";
    }
    then(e, t) {
      return this.promise.then(e, t);
    }
    catch(e) {
      return this.promise.catch(e);
    }
    finally(e) {
      return this.promise.finally(e);
    }
    cancel() {
      if (!(this._isResolved || this._isRejected || this._isCancelled)) {
        if (((this._isCancelled = !0), this.cancelHandlers.length))
          try {
            for (let e of this.cancelHandlers) e();
          } catch (e) {
            console.warn("Cancellation threw an error", e);
            return;
          }
        (this.cancelHandlers.length = 0),
          this._reject && this._reject(new A("Request aborted"));
      }
    }
    get isCancelled() {
      return this._isCancelled;
    }
  };
var C = (r) => typeof r == "string",
  L = (r) => C(r) && r !== "",
  U = (r) => r instanceof Blob,
  G = (r) => r instanceof FormData,
  ee = (r) => r >= 200 && r < 300,
  te = (r) => {
    try {
      return btoa(r);
    } catch {
      return Buffer.from(r).toString("base64");
    }
  },
  re = (r) => {
    let e = [],
      t = (o, n) => {
        e.push(`${encodeURIComponent(o)}=${encodeURIComponent(String(n))}`);
      },
      s = (o, n) => {
        n != null &&
          (n instanceof Date
            ? t(o, n.toISOString())
            : Array.isArray(n)
            ? n.forEach((i) => s(o, i))
            : typeof n == "object"
            ? Object.entries(n).forEach(([i, a]) => s(`${o}[${i}]`, a))
            : t(o, n));
      };
    return (
      Object.entries(r).forEach(([o, n]) => s(o, n)),
      e.length ? `?${e.join("&")}` : ""
    );
  },
  se = (r, e) => {
    let t = r.ENCODE_PATH || encodeURI,
      s = e.url
        .replace("{api-version}", r.VERSION)
        .replace(/{(.*?)}/g, (n, i) =>
          e.path?.hasOwnProperty(i) ? t(String(e.path[i])) : n
        ),
      o = r.BASE + s;
    return e.query ? o + re(e.query) : o;
  },
  ie = (r) => {
    if (r.formData) {
      let e = new FormData(),
        t = (s, o) => {
          C(o) || U(o) ? e.append(s, o) : e.append(s, JSON.stringify(o));
        };
      return (
        Object.entries(r.formData)
          .filter(([, s]) => s != null)
          .forEach(([s, o]) => {
            Array.isArray(o) ? o.forEach((n) => t(s, n)) : t(s, o);
          }),
        e
      );
    }
  },
  k = async (r, e) => (typeof e == "function" ? e(r) : e),
  oe = async (r, e) => {
    let [t, s, o, n] = await Promise.all([
        k(e, r.TOKEN),
        k(e, r.USERNAME),
        k(e, r.PASSWORD),
        k(e, r.HEADERS),
      ]),
      i = Object.entries({ Accept: "application/json", ...n, ...e.headers })
        .filter(([, a]) => a != null)
        .reduce((a, [u, c]) => ({ ...a, [u]: String(c) }), {});
    if ((L(t) && (i.Authorization = `Bearer ${t}`), L(s) && L(o))) {
      let a = te(`${s}:${o}`);
      i.Authorization = `Basic ${a}`;
    }
    return (
      e.body !== void 0 &&
        (e.mediaType
          ? (i["Content-Type"] = e.mediaType)
          : U(e.body)
          ? (i["Content-Type"] = e.body.type || "application/octet-stream")
          : C(e.body)
          ? (i["Content-Type"] = "text/plain")
          : G(e.body) || (i["Content-Type"] = "application/json")),
      new Headers(i)
    );
  },
  ne = (r) => {
    if (r.body !== void 0)
      return r.mediaType?.includes("application/json") ||
        r.mediaType?.includes("+json")
        ? JSON.stringify(r.body)
        : C(r.body) || U(r.body) || G(r.body)
        ? r.body
        : JSON.stringify(r.body);
  },
  ae = async (r, e, t, s, o, n, i) => {
    let a = new XMLHttpRequest();
    return (
      a.open(e.method, t, !0),
      (a.withCredentials = r.WITH_CREDENTIALS),
      n.forEach((u, c) => {
        a.setRequestHeader(c, u);
      }),
      new Promise(async (u, c) => {
        (a.onload = () => u(a)),
          (a.onabort = () => c(new Error("Request aborted"))),
          (a.onerror = () => c(new Error("Network error")));
        for (let f of r.interceptors.request._fns) a = await f(a);
        a.send(s ?? o), i(() => a.abort());
      })
    );
  },
  pe = (r, e) => {
    if (e) {
      let t = r.getResponseHeader(e);
      if (C(t)) return t;
    }
  },
  ce = (r) => {
    if (r.status !== 204)
      try {
        let e = r.getResponseHeader("Content-Type");
        if (e)
          return e.includes("application/json") || e.includes("+json")
            ? JSON.parse(r.responseText)
            : r.responseText;
      } catch (e) {
        console.error(e);
      }
  },
  le = (r, e) => {
    let s = {
      400: "Bad Request",
      401: "Unauthorized",
      402: "Payment Required",
      403: "Forbidden",
      404: "Not Found",
      405: "Method Not Allowed",
      406: "Not Acceptable",
      407: "Proxy Authentication Required",
      408: "Request Timeout",
      409: "Conflict",
      410: "Gone",
      411: "Length Required",
      412: "Precondition Failed",
      413: "Payload Too Large",
      414: "URI Too Long",
      415: "Unsupported Media Type",
      416: "Range Not Satisfiable",
      417: "Expectation Failed",
      418: "Im a teapot",
      421: "Misdirected Request",
      422: "Unprocessable Content",
      423: "Locked",
      424: "Failed Dependency",
      425: "Too Early",
      426: "Upgrade Required",
      428: "Precondition Required",
      429: "Too Many Requests",
      431: "Request Header Fields Too Large",
      451: "Unavailable For Legal Reasons",
      500: "Internal Server Error",
      501: "Not Implemented",
      502: "Bad Gateway",
      503: "Service Unavailable",
      504: "Gateway Timeout",
      505: "HTTP Version Not Supported",
      506: "Variant Also Negotiates",
      507: "Insufficient Storage",
      508: "Loop Detected",
      510: "Not Extended",
      511: "Network Authentication Required",
      ...r.errors,
    }[e.status];
    if (s) throw new T(r, e, s);
    if (!e.ok) {
      let o = e.status ?? "unknown",
        n = e.statusText ?? "unknown",
        i = (() => {
          try {
            return JSON.stringify(e.body, null, 2);
          } catch {
            return;
          }
        })();
      throw new T(
        r,
        e,
        `Generic Error: status: ${o}; status text: ${n}; body: ${i}`
      );
    }
  },
  g = (r, e) =>
    new q(async (t, s, o) => {
      try {
        let n = se(r, e),
          i = ie(e),
          a = ne(e),
          u = await oe(r, e);
        if (!o.isCancelled) {
          let c = await ae(r, e, n, a, i, u, o);
          for (let y of r.interceptors.response._fns) c = await y(c);
          let f = ce(c),
            x = pe(c, e.responseHeader),
            l = {
              url: n,
              ok: ee(c.status),
              status: c.status,
              statusText: c.statusText,
              body: x ?? f,
            };
          le(e, l), t(l.body);
        }
      } catch (n) {
        s(n);
      }
    });
var R = class {
  static getCorpInfo(e) {
    return g(d, {
      method: "GET",
      url: "/search/corp_info",
      query: {
        corpname: e.corpname,
        usesubcorp: e.usesubcorp,
        subcorpora: e.subcorpora,
        gramrels: e.gramrels,
        corpcheck: e.corpcheck,
        registry: e.registry,
        struct_attr_stats: e.structAttrStats,
        format: e.format,
      },
    });
  }
  static getWordList(e) {
    return g(d, {
      method: "GET",
      url: "/search/wordlist",
      query: {
        corpname: e.corpname,
        wlattr: e.wlattr,
        usesubcorp: e.usesubcorp,
        wlnums: e.wlnums,
        wlmaxfreq: e.wlmaxfreq,
        wlminfreq: e.wlminfreq,
        wlpat: e.wlpat,
        wlsort: e.wlsort,
        wlblacklist: e.wlblacklist,
        include_nonwords: e.includeNonwords,
        relfreq: e.relfreq,
        reldocf: e.reldocf,
        wlfile: e.wlfile,
        wlicase: e.wlicase,
        wlmaxitems: e.wlmaxitems,
        wlpage: e.wlpage,
        format: e.format,
        random: e.random,
        wltype: e.wltype,
        ngrams_n: e.ngramsN,
        ngrams_max_n: e.ngramsMaxN,
        nest_ngrams: e.nestNgrams,
        simple_n: e.simpleN,
        usengrams: e.usengrams,
      },
    });
  }
  static getStructWordList(e) {
    return g(d, {
      method: "GET",
      url: "/search/struct_wordlist",
      query: {
        corpname: e.corpname,
        wlattr: e.wlattr,
        wlstruct_attr1: e.wlstructAttr1,
        wlstruct_attr2: e.wlstructAttr2,
        wlstruct_attr3: e.wlstructAttr3,
        wlnums: e.wlnums,
        wlmaxfreq: e.wlmaxfreq,
        wlminfreq: e.wlminfreq,
        wlmaxitems: e.wlmaxitems,
        wlpat: e.wlpat,
        wlsort: e.wlsort,
        wlblacklist: e.wlblacklist,
        include_nonwords: e.includeNonwords,
        relfreq: e.relfreq,
        reldocf: e.reldocf,
        wlicase: e.wlicase,
        wlpage: e.wlpage,
        format: e.format,
        random: e.random,
        wltype: e.wltype,
      },
    });
  }
  static getConcordance(e) {
    return g(d, {
      method: "GET",
      url: "/search/concordance",
      query: {
        corpname: e.corpname,
        q: e.q,
        "concordance_query[queryselector]": e.concordanceQueryQueryselector,
        "concordance_query[iquery]": e.concordanceQueryIquery,
        "concordance_query[cql]": e.concordanceQueryCql,
        "concordance_query[lemma]": e.concordanceQueryLemma,
        "concordance_query[char]": e.concordanceQueryChar,
        "concordance_query[word]": e.concordanceQueryWord,
        "concordance_query[phrase]": e.concordanceQueryPhrase,
        usesubcorp: e.usesubcorp,
        lpos: e.lpos,
        default_attr: e.defaultAttr,
        attrs: e.attrs,
        refs: e.refs,
        attr_allpos: e.attrAllpos,
        viewmode: e.viewmode,
        cup_hl: e.cupHl,
        structs: e.structs,
        fromp: e.fromp,
        pagesize: e.pagesize,
        kwicleftctx: e.kwicleftctx,
        kwicrightctx: e.kwicrightctx,
        errcorr_switch: e.errcorrSwitch,
        cup_err_code: e.cupErrCode,
        cup_err: e.cupErr,
        cup_corr: e.cupCorr,
        json: e.json,
        asyn: e.asyn,
        format: e.format,
      },
    });
  }
  static getFullRef(e) {
    return g(d, {
      method: "GET",
      url: "/search/fullref",
      query: { corpname: e.corpname, pos: e.pos },
    });
  }
  static getWideCtx(e) {
    return g(d, {
      method: "GET",
      url: "/search/widectx",
      query: {
        corpname: e.corpname,
        pos: e.pos,
        hitlen: e.hitlen,
        structs: e.structs,
        detail_left_ctx: e.detailLeftCtx,
        detail_right_ctx: e.detailRightCtx,
      },
    });
  }
  static getFreqMl(e) {
    return g(d, {
      method: "GET",
      url: "/search/freqml",
      query: {
        corpname: e.corpname,
        ml1attr: e.ml1Attr,
        ml1ctx: e.ml1Ctx,
        ml2attr: e.ml2Attr,
        ml2ctx: e.ml2Ctx,
        ml3attr: e.ml3Attr,
        ml3ctx: e.ml3Ctx,
        ml4attr: e.ml4Attr,
        ml4ctx: e.ml4Ctx,
        ml5attr: e.ml5Attr,
        ml5ctx: e.ml5Ctx,
        ml6attr: e.ml6Attr,
        ml6ctx: e.ml6Ctx,
        q: e.q,
        usesubcorp: e.usesubcorp,
        fmaxitems: e.fmaxitems,
        fpage: e.fpage,
        group: e.group,
        showpoc: e.showpoc,
        showreltt: e.showreltt,
        showrel: e.showrel,
        freqlevel: e.freqlevel,
        json: e.json,
        freq_sort: e.freqSort,
        format: e.format,
      },
    });
  }
  static getFregDistrib(e) {
    return g(d, {
      method: "GET",
      url: "/search/freq_distrib",
      query: {
        corpname: e.corpname,
        res: e.res,
        lpos: e.lpos,
        default_attr: e.defaultAttr,
        attrs: e.attrs,
        structs: e.structs,
        refs: e.refs,
        attr_allpos: e.attrAllpos,
        viewmode: e.viewmode,
        fc_lemword_window_type: e.fcLemwordWindowType,
        fc_lemword_wsize: e.fcLemwordWsize,
        fc_lemword_type: e.fcLemwordType,
        fc_pos_window_type: e.fcPosWindowType,
        fc_pos_wsize: e.fcPosWsize,
        fc_pos_type: e.fcPosType,
        json: e.json,
        normalize: e.normalize,
        format: e.format,
      },
    });
  }
  static getFreqDist(e) {
    return g(d, {
      method: "GET",
      url: "/search/freqdist",
      query: {
        corpname: e.corpname,
        wlattr: e.wlattr,
        diaattr: e.diaattr,
        sse: e.sse,
        threshold: e.threshold,
        ctx: e.ctx,
        wordlist: e.wordlist,
        json: e.json,
      },
    });
  }
  static getCollx(e) {
    return g(d, {
      method: "GET",
      url: "/search/collx",
      query: {
        corpname: e.corpname,
        q: e.q,
        usesubcorp: e.usesubcorp,
        cattr: e.cattr,
        csortfn: e.csortfn,
        cbgrfns: e.cbgrfns,
        cfromw: e.cfromw,
        ctow: e.ctow,
        cminfreq: e.cminfreq,
        cminbgr: e.cminbgr,
        cmaxitems: e.cmaxitems,
        json: e.json,
      },
    });
  }
  static getSubCorp(e) {
    return g(d, {
      method: "GET",
      url: "/search/subcorp",
      query: {
        corpname: e.corpname,
        subcname: e.subcname,
        create: e.create,
        delete: e._delete,
        q: e.q,
        struct: e.struct,
        json: e.json,
        format: e.format,
      },
    });
  }
  static subcorpusRename(e) {
    return g(d, {
      method: "GET",
      url: "/search/subcorpus_rename",
      query: {
        corpname: e.corpname,
        subcorp_id: e.subcorpId,
        new_subcorp_name: e.newSubcorpName,
      },
    });
  }
  static subcorpusInfo(e) {
    return g(d, {
      method: "GET",
      url: "/search/subcorp_info",
      query: { corpname: e.corpname, subcname: e.subcname },
    });
  }
  static getExtractKeywords(e) {
    return g(d, {
      method: "GET",
      url: "/search/extract_keywords",
      query: {
        corpname: e.corpname,
        ref_corpname: e.refCorpname,
        usesubcorp: e.usesubcorp,
        simple_n: e.simpleN,
        wlfile: e.wlfile,
        wlblacklist: e.wlblacklist,
        attr: e.attr,
        alnum: e.alnum,
        onealpha: e.onealpha,
        minfreq: e.minfreq,
        maxfreq: e.maxfreq,
        max_keywords: e.maxKeywords,
        include_nonwords: e.includeNonwords,
        icase: e.icase,
        wlpat: e.wlpat,
        addfreqs: e.addfreqs,
        reldocf: e.reldocf,
        usengrams: e.usengrams,
        ngrams_n: e.ngramsN,
        ngrams_max_n: e.ngramsMaxN,
        format: e.format,
      },
    });
  }
  static getTextTypesWithNorms(e) {
    return g(d, {
      method: "GET",
      url: "/search/textypes_with_norms",
      query: { corpname: e.corpname },
    });
  }
  static getAttrVals(e) {
    return g(d, {
      method: "GET",
      url: "/search/attr_vals",
      query: {
        corpname: e.corpname,
        avattr: e.avattr,
        avpat: e.avpat,
        avfrom: e.avfrom,
        avmaxitems: e.avmaxitems,
        icase: e.icase,
        format: e.format,
      },
    });
  }
};
d.interceptors.response.use(
  (r) => (
    r.status === 200 && console.log(`request to ${r.status} was successful`), r
  )
);
function ue(r) {
  let e = r.split(" "),
    t = "q";
  for (let s = 0; s < e.length; s++) t += '"' + e[s] + '" ';
  return t;
}
async function F(r) {
  return await R.getWordList({
    corpname: r.corpname,
    wlattr: r.wlattr,
    wlpat: r.wlpat,
    wlmaxitems: r.wlmaxitems,
    wltype: r.wltype,
    includeNonwords: r.includeNonwords,
    wlicase: r.wlicase,
    wlminfreq: r.wlminfreq,
  });
}
async function I(r, e) {
  let t = document.querySelector(`#${e.selectQueryId}`),
    s = e.urlparam ? "url" : t.value;
  var o = s === "simple" ? ue(r) : s === "url" ? r : `q${r}`;
  let n = await R.getConcordance({
    corpname: e.corpname,
    q: o,
    viewmode: e.viewmode,
    attrs: e.attrs,
    format: e.format,
    structs: e.structs,
    kwicrightctx: e.kwicrightctx,
    kwicleftctx: e.kwicleftctx,
    refs: e.refs,
    pagesize: e.pagesize,
    fromp: e.fromp,
  });
  s === "url" && (t.value = "cql");
  let i = new URLSearchParams(window.location.search);
  return (
    i.set("corpname", e.corpname),
    i.set("q", o),
    i.set("viewmode", e.viewmode),
    i.set("attrs", e.attrs),
    i.set("format", e.format),
    i.set("structs", e.structs),
    i.set("kwicrightctx", e.kwicrightctx),
    i.set("kwicleftctx", e.kwicleftctx),
    i.set("refs", e.refs),
    i.set("pagesize", e.pagesize.toString()),
    i.set("fromp", e.fromp.toString()),
    i.set("selectQueryValue", "url"),
    window.history.pushState({}, "", `${window.location.pathname}?${i}`),
    n.Lines && n.Lines.length === 0
      ? "No results found"
      : (n.error &&
          (n.error = `${n.error} see documentation at <a target="_blank" class="text-blue-500" href="https://www.sketchengine.eu/documentation/corpus-querying/">https://www.sketchengine.eu/documentation/corpus-querying/</a>`),
        n)
  );
}
function $(r) {
  let e = [];
  return (
    r.Lines?.map((t) => {
      let s = t.Left?.map((c) => c.str).join(" "),
        o = t.Right?.map((c) => c.str).join(" "),
        n = t.Kwic?.map((c) => c.str).join(" "),
        i = t.Kwic?.map((c) => c.attr).join(" "),
        a = t.Refs?.map((c) => c),
        u = { left: s, right: o, kwic: n, kwic_attr: i, refs: a };
      e.push(u);
    }),
    e
  );
}
function z(r, e) {
  let t = [];
  return (
    r.Items?.map((s) => {
      let o = s.frq,
        n = s.relfreq,
        i = s.str,
        a = { frq: o, relfreq: n, str: i, attr: e };
      t.push(a);
    }),
    t
  );
}
function H(r, e, t) {
  document.getElementById(t.id)?.remove();
  let s = document.querySelector(`#${e}`),
    o = document.createElement("div");
  (o.id = t.id), o.classList.add(...t.css.div.split(" "));
  let n = document.createElement("ul");
  n.classList.add(...t.css.ul.split(" ")),
    r.map((i) => {
      let a = document.createElement("li");
      a.classList.add(...t.css.li.split(" ")),
        (a.innerHTML = i.str + " | " + i.frq + " | " + i.attr),
        a.addEventListener("click", () => {
          document.getElementById(e + "-select").value = "cql";
          let u = document.getElementById(e + "-input");
          u.value = "[" + i.attr + '="' + i.str + '"]';
        }),
        n.appendChild(a);
    }),
    o.appendChild(n),
    s?.prepend(o);
}
function M(r) {
  return r.fullsize;
}
function O(r, e = !1) {
  if (e) {
    for (let s of r) if (s.startsWith("doc.id")) return [s.split("=")[1]];
  } else {
    var t = [];
    for (let s of r)
      s === "" ||
        s === void 0 ||
        s === null ||
        s.startsWith("doc") ||
        t.push(s);
    return t;
  }
  return null;
}
var h = {
  div: "overflow-x-auto",
  table: "table",
  thead: "text-center",
  trHead: "",
  th: "text-sm text-gray-500",
  tbody: "",
  trBody: "p-2",
  td: "text-sm text-gray-500",
  kwic: "text-lg text-red-500",
  left: "text-sm text-gray-500 p-2 text-right",
  right: "text-sm text-gray-500 p-2 text-left",
};

const THUMB_IIIF_BASE = "https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/";
const THUMB_IIIF_SUFFIX = "/full/260,/0/default.jpg";
const ARCHIVE_CODE_MAP = {
  "Wienbibliothek im Rathaus": "wb",
  "Wiener Stadt- und Landesbibliothek": "wb",
  "Österreichische Nationalbibliothek": "oenb",
  "Oesterreichische Nationalbibliothek": "oenb",
  "Österreichische National-Bibliothek": "oenb",
  "Wien Museum": "wmW",
  "Wiener Museum": "wmW",
  "Wien Museum Wien": "wmW",
};

const NORMALISED_ARCHIVE_CODE_MAP = Object.entries(ARCHIVE_CODE_MAP).reduce(
  (acc, [name, code]) => {
    acc[normaliseArchiveName(name)] = code;
    return acc;
  },
  {}
);

const TYPESENSE_ENTRIES_PATH_CANDIDATES = [
  "../json/typesense_entries.json",
  "./json/typesense_entries.json",
  "json/typesense_entries.json",
  "/json/typesense_entries.json",
  "../data_repo/json/typesense_entries.json",
];

function resolveTypesenseCandidateUrls() {
  if (typeof window === "undefined" || !window.location) {
    return [...TYPESENSE_ENTRIES_PATH_CANDIDATES];
  }
  const resolved = [];
  const seen = new Set();
  TYPESENSE_ENTRIES_PATH_CANDIDATES.forEach((candidate) => {
    try {
      const url = new URL(candidate, window.location.href).href;
      if (!seen.has(url)) {
        seen.add(url);
        resolved.push(url);
      }
    } catch (error) {
      console.warn("Skipping invalid Typesense URL candidate", {
        candidate,
        error,
      });
    }
  });
  return resolved.length > 0
    ? resolved
    : [...TYPESENSE_ENTRIES_PATH_CANDIDATES];
}

const typesenseMetadataState = {
  data: null,
  promise: null,
  error: null,
  resolvedUrl: null,
};

let deferredThumbnailUpdateScheduled = false;

function normaliseArchiveName(value) {
  if (typeof value !== "string") return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function mapArchiveNameToCode(name) {
  if (typeof name !== "string" || name.trim().length === 0) return null;
  const trimmed = name.trim();
  if (ARCHIVE_CODE_MAP[trimmed]) return ARCHIVE_CODE_MAP[trimmed];
  const normalised = normaliseArchiveName(trimmed);
  return NORMALISED_ARCHIVE_CODE_MAP[normalised] || null;
}

function ensureTypesenseEntriesLoaded() {
  if (typesenseMetadataState.data) {
    return Promise.resolve(typesenseMetadataState.data);
  }
  if (typesenseMetadataState.promise) {
    return typesenseMetadataState.promise;
  }
  if (typeof fetch !== "function") {
    typesenseMetadataState.data = {};
    return Promise.resolve(typesenseMetadataState.data);
  }
  const candidateUrls = resolveTypesenseCandidateUrls();
  typesenseMetadataState.promise = (async () => {
    let lastError = null;
    for (const url of candidateUrls) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          lastError = new Error(`Unexpected response status ${response.status}`);
          console.warn("Typesense entries fetch returned unexpected status", {
            url,
            status: response.status,
            statusText: response.statusText,
          });
          continue;
        }
        const json = await response.json();
        typesenseMetadataState.resolvedUrl = url;
        typesenseMetadataState.data = json || {};
        return typesenseMetadataState.data;
      } catch (error) {
        lastError = error;
        console.warn("Failed to load Typesense entries", {
          url,
          error,
        });
      }
    }
    if (lastError) {
      throw lastError;
    }
    return {};
  })()
    .catch((error) => {
      console.warn("Unable to resolve Typesense entries from any known path", {
        candidates: candidateUrls,
        error,
      });
      typesenseMetadataState.error = error;
      typesenseMetadataState.data = {};
      return typesenseMetadataState.data;
    });
  return typesenseMetadataState.promise;
}

function getTypesenseEntry(docId) {
  if (!docId) return null;
  if (typesenseMetadataState.data && typesenseMetadataState.data[docId]) {
    return typesenseMetadataState.data[docId];
  }
  return null;
}

function getThumbnailFromTypesenseEntry(entry) {
  if (!entry || typeof entry !== "object") return null;
  if (typeof entry.thumbnail === "string" && entry.thumbnail.trim().length > 0) {
    return entry.thumbnail.trim();
  }
  const candidates = entry.thumbnails || entry.doc_thumbnails || entry.docThumbnails;
  if (Array.isArray(candidates)) {
    const direct = candidates.find((value) => typeof value === "string" && value.trim().length > 0);
    if (direct) return direct.trim();
  } else if (candidates && typeof candidates === "object") {
    for (const value of Object.values(candidates)) {
      if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
      }
    }
  }
  return null;
}

function scheduleResolveThumbnails() {
  if (deferredThumbnailUpdateScheduled) return;
  if (typeof document === "undefined") return;
  deferredThumbnailUpdateScheduled = true;
  Promise.resolve().then(() => {
    deferredThumbnailUpdateScheduled = false;
    resolveDeferredThumbnailCells();
  });
}

let thumbnailObserver = null;
function setupThumbnailObserver() {
  if (thumbnailObserver || typeof document === "undefined") return;
  thumbnailObserver = new MutationObserver((mutations) => {
    let shouldUpdate = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldUpdate = true;
        break;
      }
    }
    if (shouldUpdate) {
      scheduleResolveThumbnails();
    }
  });
  thumbnailObserver.observe(document.body, { childList: true, subtree: true });
}
setupThumbnailObserver();

function resolveDeferredThumbnailCells() {
  if (typeof document === "undefined") return;
  
  const selectors = [
    'a[data-noske-thumbnail-cell="1"]',
    'div[tabulator-field="datei"] a'
  ];
  
  const anchors = Array.from(document.querySelectorAll(selectors.join(",")));
  
  if (anchors.length === 0) return;
  
  ensureTypesenseEntriesLoaded()
    .then(() => {
      anchors.forEach((anchor) => {
        if (!anchor.isConnected) return;
        
        let docId = anchor.getAttribute("data-noske-doc-id") || 
                    anchor.parentElement?.getAttribute("data-noske-doc-id");
        
        if (docId) {
            docId = decodeURIComponent(docId);
        } else {
            const href = anchor.getAttribute("href");
            if (href) {
                const match = href.match(/(fb_[^.]+)\.html/);
                if (match) docId = match[1];
            }
        }
        
        if (!docId) return;

        const entry = getTypesenseEntry(docId);
        if (!entry) return;
        
        const archiveNameList = Array.isArray(entry.archives)
          ? entry.archives
          : typeof entry.archives === "string"
          ? [entry.archives]
          : [];
        let archiveCode = null;
        for (const name of archiveNameList) {
          const code = mapArchiveNameToCode(name);
          if (code) {
            archiveCode = code;
            break;
          }
        }
        
        const thumbnailFilename = getThumbnailFromTypesenseEntry(entry);
        const titleAttr =
          anchor.getAttribute("data-noske-doc-title") ||
          anchor.parentElement?.getAttribute("data-noske-doc-title");
        const storedTitle = titleAttr ? decodeURIComponent(titleAttr) : null;
        const docTitle = entry.title || storedTitle || docId;
        const hrefTarget = anchor.getAttribute("href") || "#";
        const thumbUrl = buildThumbnailUrlFromDocId(docId, archiveCode, thumbnailFilename);
        
        if (!thumbUrl) return;
        
        let img = anchor.querySelector("img");
        if (!img) {
          img = document.createElement("img");
          anchor.innerHTML = "";
          anchor.appendChild(img);
        }
        
        // Only update if different to avoid flickering/reloading
        if (img.src !== thumbUrl) {
            img.src = thumbUrl;
        }
        
        img.loading = "lazy";
        img.style.maxWidth = "6rem";
        img.style.height = "auto";
        img.style.display = "block";
        img.style.margin = "0 auto";
        
        const altText = docTitle ? `Deckblatt von ${docTitle}` : "Deckblatt des Flugblattes";
        img.alt = altText;
        
        if (!anchor.contains(img)) {
          anchor.innerHTML = "";
          anchor.appendChild(img);
        }
        
        if (docTitle) {
          anchor.setAttribute("aria-label", docTitle);
          anchor.setAttribute("title", docTitle);
          anchor.setAttribute("data-noske-doc-title", encodeURIComponent(docTitle));
        }
        
        anchor.setAttribute("data-noske-needs-resolution", "0");
        
        const wrapper = anchor.closest('[data-noske-thumbnail-wrapper="1"]');
        if (wrapper) {
          wrapper.setAttribute("data-noske-needs-resolution", "0");
          wrapper.setAttribute("data-noske-doc-id", encodeURIComponent(docId));
          if (docTitle) {
            wrapper.setAttribute("data-noske-doc-title", encodeURIComponent(docTitle));
          }
        }
        
        if (!anchor.getAttribute("href")) {
          anchor.setAttribute("href", hrefTarget || "#");
        }
      });
    })
    .catch((error) => {
      console.warn("Unable to resolve deferred thumbnails", error);
    });
}

const htmlEntityDecoder = (() => {
  let textarea;
  return (value) => {
    if (value === void 0 || value === null) {
      return "";
    }
    if (!textarea) {
      textarea = document.createElement("textarea");
    }
    textarea.innerHTML = value;
    return textarea.value;
  };
})();

function escapeHtmlAttr(value) {
  if (value === void 0 || value === null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function extractDocAttrs(refs) {
  if (!Array.isArray(refs)) return {};
  const entry = refs.find((ref) => ref.startsWith("doc.attrs="));
  if (!entry) return {};
  const raw = entry.slice("doc.attrs=".length);
  if (!raw) return {};
  const decoded = htmlEntityDecoder(raw);
  const replacements = (value) =>
    value
      .replace(/&quot;/g, '"')
      .replace(/&#34;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&");
  const candidates = [];
  const normalised = replacements(decoded);
  candidates.push(normalised);
  candidates.push(normalised.replace(/'/g, '"'));
  if (normalised.includes("%7B")) {
    try {
      candidates.push(replacements(decodeURIComponent(normalised)));
    } catch (e) {
      console.warn("Unable to decode URI component for doc.attrs", {
        value: normalised,
        error: e,
      });
    }
  }
  if (decoded.includes("%7B") && !normalised.includes("%7B")) {
    try {
      candidates.push(replacements(decodeURIComponent(decoded)));
    } catch (e) {
      console.warn("Unable to decode original doc.attrs string", {
        value: decoded,
        error: e,
      });
    }
  }
  for (const candidate of candidates) {
    if (typeof candidate !== "string" || candidate.trim() === "") continue;
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    } catch (error) {
      continue;
    }
  }
  console.warn("Unable to parse doc.attrs", { raw, decoded, candidates });
  return {};
}

function resolveArchiveCodeFromAttrs(attrs) {
  if (!attrs || typeof attrs !== "object") return null;
  const archives = Array.isArray(attrs.archives)
    ? attrs.archives
    : typeof attrs.archives === "string" && attrs.archives.trim().length > 0
    ? attrs.archives.split("|").map((value) => value.trim()).filter((value) => value.length > 0)
    : [];
  for (const archiveName of archives) {
    const code = mapArchiveNameToCode(archiveName);
    if (code) return code;
  }
  if (typeof attrs.archive === "string") {
    const code = mapArchiveNameToCode(attrs.archive);
    if (code) return code;
  }
  return null;
}

function getThumbnailFilenameFromAttrs(attrs) {
  if (!attrs || typeof attrs !== "object") return null;
  const direct = attrs.thumbnail || attrs.doc_thumbnail || attrs.docThumbnail;
  if (typeof direct === "string" && direct.trim().length > 0) {
    return direct.trim();
  }
  const thumbs = attrs.thumbnails || attrs.doc_thumbnails || attrs.docThumbnails;
  if (Array.isArray(thumbs) && thumbs.length > 0) {
    const candidate = thumbs.find((value) => typeof value === "string" && value.trim().length > 0);
    if (candidate) {
      return candidate.trim();
    }
  }
  if (thumbs && typeof thumbs === "object") {
    for (const value of Object.values(thumbs)) {
      if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
      }
    }
  }
  return null;
}

function buildThumbnailUrlFromDocId(docId, archiveCode, thumbnailFilename) {
  const trimmedThumbnail = typeof thumbnailFilename === "string" ? thumbnailFilename.trim() : null;
  if (trimmedThumbnail && trimmedThumbnail.length > 0) {
    const sanitized = trimmedThumbnail.replace(/^\/*/, "").replace(/^fb_/, "");
    return `${THUMB_IIIF_BASE}${sanitized}${THUMB_IIIF_SUFFIX}`;
  }
  if (!docId || typeof docId !== "string") return null;
  const cleaned = docId.replace(/^fb_/, "");
  const code = archiveCode || "wb";
  return `${THUMB_IIIF_BASE}${cleaned}_a_${code}.jp2${THUMB_IIIF_SUFFIX}`;
}

function getDocTitleFromRefs(refs) {
  if (!Array.isArray(refs)) return "";
  const entry = refs.find((ref) => ref.startsWith("doc.title="));
  return entry ? entry.slice("doc.title=".length) : "";
}

function extractYearFromDocId(docId) {
  if (!docId || typeof docId !== "string") return "";
  // Pattern: fb_yyyymmdd_name or yyyymmdd_name
  const match = docId.match(/(?:fb_)?(\d{4})\d{4}_/);
  return match ? match[1] : "";
}

// Fallback: derive page number from the static document HTML (page breaks are
// rendered as <span class="pb primary"> ... </span> markers).
const __noskeDocHtmlCache = new Map();
async function getDocHtmlDocument(docId) {
  if (!docId) return null;
  if (__noskeDocHtmlCache.has(docId)) return __noskeDocHtmlCache.get(docId);
  const promise = (async () => {
    const url = `./${docId}.html`;
    const res = await fetch(url, { credentials: "same-origin" });
    if (!res.ok) return null;
    const html = await res.text();
    try {
      return new DOMParser().parseFromString(html, "text/html");
    } catch {
      return null;
    }
  })();
  __noskeDocHtmlCache.set(docId, promise);
  return promise;
}

function countPbBeforeToken(doc, tokenId) {
  if (!doc || !tokenId) return "";
  const tokenEl = doc.getElementById(tokenId);
  if (!tokenEl) return "";

  // Prefer primary page breaks to avoid double-counting witnesses.
  const pbsPrimary = Array.from(doc.querySelectorAll("span.pb.primary"));
  const pbsFallback = pbsPrimary.length
    ? pbsPrimary
    : Array.from(doc.querySelectorAll("span.pb"));

  let count = 0;
  for (const pb of pbsFallback) {
    // pb before token => pb is FOLLOWING tokenEl in document order?
    // compareDocumentPosition returns a bitmask relative to *pb*.
    const rel = pb.compareDocumentPosition(tokenEl);
    if (rel & Node.DOCUMENT_POSITION_FOLLOWING) {
      count += 1;
    }
  }
  return String(Math.max(1, count));
}

function schedulePageFallbackResolution() {
  // Only resolve a reasonable number of missing page cells to avoid huge batches.
  const cells = Array.from(
    document.querySelectorAll('td[data-noske-seite="1"]')
  ).slice(0, 250);
  if (!cells.length) return;

  (async () => {
    for (const cell of cells) {
      if (cell.dataset.resolved === "1") continue;
      const docId = cell.dataset.docid;
      const tokenId = cell.dataset.tokenid;
      if (!docId || !tokenId) {
        cell.dataset.resolved = "1";
        continue;
      }

      const doc = await getDocHtmlDocument(docId);
      const page = countPbBeforeToken(doc, tokenId);
      if (page) {
        cell.textContent = page;
      }
      cell.dataset.resolved = "1";
    }
  })();
}

function B(r, e, t, s, o = !1, n = !1, i) {
  let a = document.querySelector(`#${t}`);
  a.innerHTML = `
		<div class="${i.css?.div || h.div}">
			<table class="${i.css?.table || h.table}" id="myTable">
				<thead class="${i.css?.thead || h.thead}">
				<tr class="${i.css?.trHead || h.trHead}" id="hits-header-row">
				</tr>
				</thead>
				<tbody class="${i.css?.tbody || h.tbody}" id="hits-table-body">
				</tbody>
			</table>
		</div>
		`;
  let u = document.querySelector("#hits-table-body");
  // Fixed column headers: Titel, Jahr, Seite, Linker Kotext, Stichwort, Rechter Kotext
  var c = `<th class="${i.css?.th || h.th}">Titel</th>
							<th class="${i.css?.th || h.th}">Jahr</th>
							<th class="${i.css?.th || h.th}">Seite</th>
							<th class="${i.css?.th || h.th}">Linker Kotext</th>
							<th class="${i.css?.th || h.th}">Stichwort</th>
							<th class="${i.css?.th || h.th}">Rechter Kotext</th>`;
  let requiresDeferredThumbnails = !1;
  let x = r
      .map((m) => {
        let b = m.left,
          P = m.right,
          Q = m.kwic,
          Y = m.kwic_attr?.split("/"),
          E = m.refs,
          N = O(E, !0),
          J = O(E, !1),
          j = s.endsWith("/") ? s : s + "/";
        const docidEntry = E.find((w) => w.startsWith("doc.id="));
        const docYearEntry = E.find((w) => w.startsWith("doc.year="));
        const pbEntry = E.find((w) => w.startsWith("pb.n="));
        const docTitleValue = getDocTitleFromRefs(E);
        const docAttrs = extractDocAttrs(E);
        const archiveCode = resolveArchiveCodeFromAttrs(docAttrs);
        const docIdValue = docidEntry ? docidEntry.split("=")[1] : "";
        const pageValue = pbEntry ? pbEntry.split("=")[1] : "";
        const baseHref = docIdValue ? `${docIdValue}.html` : "";
        
        // Extract Jahr (year) from doc.id filename
        const jahrValue = docYearEntry ? docYearEntry.split("=")[1] : extractYearFromDocId(docIdValue);
        
        // Build Titel cell with link
        const titelHref = baseHref || "#";
        const titelText = docTitleValue || docIdValue || "";
        const titelCell = `<td class="${i.css?.td || h.td}"><a href="${titelHref}">${escapeHtmlAttr(titelText)}</a></td>`;
        
        // Build Jahr cell
        const jahrCell = `<td class="${i.css?.td || h.td}">${jahrValue}</td>`;
        
        // Build Seite (page) cell from pb.n; fallback resolves from static HTML.
        // Token id is the last segment of kwic_attr (e.g. tu_74_xTok_000016)
        const tokenId = Array.isArray(Y) ? Y[Y.length - 1] : "";
        const seiteCell = pageValue
          ? `<td class="${i.css?.td || h.td}">${pageValue}</td>`
          : `<td class="${i.css?.td || h.td}" data-noske-seite="1" data-docid="${escapeHtmlAttr(
              docIdValue
            )}" data-tokenid="${escapeHtmlAttr(tokenId)}"></td>`;
        
        if (n) var v = n(m);
        else {
          let w = J.filter((_) => !_.startsWith("doc") && _.length > 0)
            .map((_) => `#${_.split("=")[1]}`)
            .join("");
          var D = !1;
          if (e) {
            var X = e.indexOf("id");
            D = Y[X];
          }
          if (
            (D ||
              (console.log(
                "id attribute is not present in the client attributes"
              ),
              (D = "")),
            j.startsWith("http"))
          )
            var v = new URL(j + N);
          else var v = new URL(window.location.origin + j + N);
          if (typeof o == "object")
            for (let _ of Object.entries(o)) v.searchParams.set(_[0], _[1]);
          D ? (v.hash = D) : (v.hash = w);
        }
        return `
			<tr class="${i.css?.trBody || h.trBody}">
				${titelCell}
				${jahrCell}
				${seiteCell}
				<td class="${i.css?.left || h.left}">${b}</td>
				<td class="${i.css?.kwic || h.kwic}">
					<a href="${v}">
						${Q}
					</a>
				</td>
				<td class="${i.css?.right || h.right}">${P}</td>
			</tr>
			`;
      })
      .join("");
  let y = document.querySelector("#hits-header-row");
  (y.innerHTML = c), (u.innerHTML = x);
  // Kick off async resolution for missing page numbers.
  try {
    setTimeout(schedulePageFallbackResolution, 0);
  } catch (e) {
    // ignore
  }
}
var W = class {
  constructor(e) {
    p(this, "viewmode", "kwic");
    p(this, "attrs", "word,id");
    p(this, "format", "json");
    p(this, "structs", "doc");
    p(this, "kwicrightctx", "100#");
    p(this, "kwicleftctx", "100#");
    p(this, "refs", "doc.id");
    p(this, "pagesize", 20000000);
    p(this, "fromp", 1);
    p(this, "container", "noske-search");
    p(
      this,
      "inputPlaceholder",
      "Search for words, phrases or CQL queries (Regex allowed)"
    );
    p(this, "hitsCss", "p-2");
    p(this, "results", "No Hits found. Please try another search query.");
    p(this, "paginationcss", "p-2");
    p(this, "selectcss", "basis-2/12 p-2");
    p(this, "inputcss", "basis-10/12 rounded border p-2");
    p(this, "div1css", "flex flex-row p-2");
    p(this, "button", "Suche");
    p(this, "buttoncss", "p-2");
    p(this, "selectQueryCss", "basis-2/12 p-2");
    p(this, "customUrl", "");
    p(this, "urlparam", !1);
    p(this, "statsDiv", "flex flex-row m-2");
    p(this, "statsLabel", "p-2");
    p(this, "statsLabelValue", "Treffer:");
    p(this, "wordlistattr", ["word", "lemma", "type", "id"]);
    p(this, "autocompleteOptions", {
      id: "noske-autocomplete",
      css: {
        div: "bg-white border border-gray-300 absolute ml-40 mt-10 text-left",
        ul: "p-0",
        li: "p-2 hover:bg-gray-100 text-sm text-gray-500 hover:cursor-pointer",
      },
    });
    p(this, "minQueryLength", 2);
    p(this, "autocomplete", !1);
    e?.container ||
      console.log(
        "No container defined. Default container id set to 'noske-search'."
      ),
      (this.autocomplete = e?.autocomplete || this.autocomplete),
      (this.container = e?.container || this.container),
      (this.wordlistattr = e?.wordlistattr || this.wordlistattr);
  }
  search({
    debug: e = !1,
    client: t,
    hits: s,
    pagination: o,
    searchInput: n,
    config: i,
    stats: a,
    autocompleteOptions: u,
  }) {
    if ((this.searchInput(n), this.clearResults(s.id, o.id, n.id, a.id), !s.id))
      throw new Error("hits.id is not defined");
    if ((this.searchHits(s), !o.id))
      throw new Error("pagination.id is not defined");
    if ((this.searchPagination(o), t.base === void 0 || t.base === ""))
      throw new Error("Base URL is not defined");
    if (((d.BASE = t.base), t.corpname === void 0 || t.corpname === ""))
      throw new Error("Corpus name is not defined");
    let c = document.querySelector(`#${n?.id}-select`),
      f = document.querySelector(`input#${n?.id}-input`),
      x = document.querySelector("button#noske-search-button");
    f.addEventListener("keyup", async (l) => {
      if (l.key !== "Enter")
        if (this.autocomplete && l.target.value.length >= this.minQueryLength) {
          var y = [];
          for (let m of this.wordlistattr) {
            if (m.length === 0) return;
            let b = await F({
              corpname: t.corpname,
              wlattr: m,
              wlmaxitems: 100,
              wlpat: `.*${l.target.value}.*`,
              wltype: "simple",
              includeNonwords: 1,
              wlicase: 1,
              wlminfreq: 0,
            });
            e && b !== null && console.log(b);
            let P = z(b, m);
            y.push(...P);
          }
          setTimeout(() => {
            const autocompleteOpts = u || this.autocompleteOptions || {id: "noske-autocomplete"};
            H(y, n.id, autocompleteOpts);
          }, 400);
        } else return;
      else {
        let m = l.target.value;
        if (m.length >= this.minQueryLength) {
          let b = await I(m, {
            corpname: t.corpname,
            viewmode: t.viewmode || this.viewmode,
            attrs: t.attrs || this.attrs,
            format: t.format || this.format,
            structs: t.structs || this.structs,
            kwicrightctx: t.kwicrightctx || this.kwicrightctx,
            kwicleftctx: t.kwicleftctx || this.kwicleftctx,
            refs: t.refs || this.refs,
            pagesize: t.pagesize || this.pagesize,
            fromp: t.fromp || this.fromp,
            selectQueryId: `${n?.id}-select`,
          });
          e && b !== null && console.log(b),
            await this.transformResponse(b, t, s, o, i, a),
            await this.createPagination(1, t, s, o, n.id, i, a);
        }
      }
    }),
      f.addEventListener("focus", async () => {
        setTimeout(() => {
          const autocompleteOpts = u || this.autocompleteOptions || {id: "noske-autocomplete"};
          document.getElementById(autocompleteOpts.id)?.remove();
        }, 200);
      }),
      x.addEventListener("click", async () => {
        let l = f.value;
        if (l.length >= this.minQueryLength) {
          let y = await I(l, {
            corpname: t.corpname,
            viewmode: t.viewmode || this.viewmode,
            attrs: t.attrs || this.attrs,
            format: t.format || this.format,
            structs: t.structs || this.structs,
            kwicrightctx: t.kwicrightctx || this.kwicrightctx,
            kwicleftctx: t.kwicleftctx || this.kwicleftctx,
            refs: t.refs || this.refs,
            pagesize: t.pagesize || this.pagesize,
            fromp: t.fromp || this.fromp,
            selectQueryId: `${n?.id}-select`,
          });
          e && y !== null && console.log(y),
            await this.transformResponse(y, t, s, o, i, a),
            await this.createPagination(1, t, s, o, n.id, i, a);
        }
        setTimeout(() => {
          const autocompleteOpts = u || this.autocompleteOptions || {id: "noske-autocomplete"};
          document.getElementById(autocompleteOpts.id)?.remove();
        }, 200);
      }),
      (async () => {
        let l = new URL(window.location.href),
          y = l.searchParams.get("q");
        if (y) {
          e ? (c.value = "simple") : (c.value = "cql");
          let m = document.querySelector(`input#${n?.id}-input`);
          m.value = y?.startsWith("q") ? y.slice(1) : y;
          let b = await I(y, {
            corpname: l.searchParams.get("corpname"),
            viewmode: l.searchParams.get("viewmode"),
            attrs: l.searchParams.get("attrs"),
            format: l.searchParams.get("format"),
            structs: l.searchParams.get("structs"),
            kwicrightctx: l.searchParams.get("kwicrightctx"),
            kwicleftctx: l.searchParams.get("kwicleftctx"),
            refs: l.searchParams.get("refs"),
            pagesize: parseInt(l.searchParams.get("pagesize")),
            fromp: parseInt(l.searchParams.get("fromp")),
            selectQueryId: `${n?.id}-select`,
            urlparam: !0,
          });
          e && b !== null && console.log(b),
            await this.transformResponse(b, t, s, o, i, a),
            await this.createPagination(1, t, s, o, n.id, i, a);
        }
      })();
  }
  searchHits({ id: e, css: t }) {
    if (!e) throw new Error("search hits id is not defined");
    let s = document.querySelector(`#${e}`);
    s.innerHTML = `<div id="${e}-init" class="${
      t?.div || this.hitsCss
    }"></div>`;
  }
  searchPagination({ id: e, css: t }) {
    if (!e) throw new Error("search pagination id is not defined");
    let s = document.querySelector(`#${e}`);
    s.innerHTML = `<div id="${e}-init"
                              class="${t?.div || this.paginationcss}"></div>`;
  }
  searchInput({ id: e, placeholder: t, button: s, css: o }) {
    if (!this.container)
      throw new Error("main search div container is not defined");
    if (!e) throw new Error("search input id is not defined");
    let n = document.querySelector(`#${this.container}`);
    n.innerHTML = `<div id="${e}" class="${o?.div || this.div1css}">
        <select id="${`${e}-select`}"
          class="${o?.select || this.selectQueryCss}">
          <option value="simple">Einfache Suche</option>
          <option value="cql">CQL</option>
        </select>
        <input
          type="search"
          id="${`${e}-input`}"
          class="${o?.input || this.inputcss}"
          placeholder="${t || this.inputPlaceholder}"
          autocomplete="off"
        />
        <button id="noske-search-button" class="${
          o?.button || this.buttoncss
        }">${s || this.button}</button>
      </div>
    `;
  }
  transformStats(e, t, s) {
    let o = document.querySelector(`#${e.id}`),
      n = `<div id="${e.id}-init" class="${e.css.div}">
                    <label class="${e.css.label}">${s} ${t}</label>
                  </div>`;
    o.innerHTML = n;
  }
  async transformResponse(e, t, s, o, n, i) {
    let a = document.querySelector(`#${s.id}-init`);
    if (((a.innerHTML = ""), e === "No results found"))
      a.innerHTML = n?.results || this.results;
    else if (e.error) a.innerHTML = e.error;
    else {
      let u = $(e),
        c = M(e),
        f = t.attrs?.split(","),
        x = Math.ceil(c / (t?.pagesize || this.pagesize)),
        l = document.querySelector(`#${o.id}-init`);
      (l.innerHTML = `<select id="${`${o.id}-select`}"
          class="${o.css?.select || this.selectcss}">
          ${Array.from(
            { length: x },
            (y, m) => `<option value="${m + 1}">${m + 1}</option>`
          ).join("")}
        </select>`),
        B(
          u,
          f,
          `${s.id}-init`,
          n?.customUrl || this.customUrl,
          n?.urlparam || this.urlparam,
          n?.customUrlTransform || !1,
          s
        ),
        c &&
          this.transformStats(
            {
              id: i.id,
              css: {
                div: i.css?.div || this.statsDiv,
                label: i.css?.label || this.statsLabel,
              },
            },
            c,
            i.label || this.statsLabelValue
          );
    }
  }
  async createPagination(e = 1, t, s, o, n, i, a) {
    let u = document.querySelector(`#${o.id}-select`);
    u.addEventListener("change", async (c) => {
      t.fromp = parseInt(c.target.value);
      let f = document.querySelector(`input#${n}-input`).value,
        x = await I(f, {
          corpname: t.corpname,
          viewmode: t.viewmode || this.viewmode,
          attrs: t.attrs || this.attrs,
          format: t.format || this.format,
          structs: t.structs || this.structs,
          kwicrightctx: t.kwicrightctx || this.kwicrightctx,
          kwicleftctx: t.kwicleftctx || this.kwicleftctx,
          refs: t.refs || this.refs,
          pagesize: t.pagesize || this.pagesize,
          fromp: t.fromp || this.fromp,
          selectQueryId: `${n}-select`,
        });
      await this.transformResponse(x, t, s, o, i, a),
        await this.createPagination(c.target.value, t, s, o, n, i, a);
    }),
      (u.value = e.toString());
  }
  clearResults(e, t, s, o) {
    document
      .querySelector(`input#${s}-input`)
      .addEventListener("input", async (i) => {
        if (i.target.value.length === 0) {
          let u = document.querySelector(`#${e}-init`);
          u.innerHTML = "";
          let c = document.querySelector(`#${t}-init`);
          (c.innerHTML = ""),
            document.querySelector(`#${o}-init`)?.remove(),
            window.history.pushState({}, "", `${window.location.pathname}`),
            document.getElementById("nokse-autocomplete")?.remove();
        }
      });
  }
};
export { W as NoskeSearch };
//# sourceMappingURL=noske.js.map
