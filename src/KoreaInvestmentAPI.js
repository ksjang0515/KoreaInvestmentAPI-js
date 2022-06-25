import WebSocket from "ws";

class KoreaInvestmentAPI {
  constructor(APIKEY, SECRETKEY, accNumFront, accNumBack, options = {}) {
    const base = "https://openapi.koreainvestment.com:9443";
    const testnet = "https://openapivts.koreainvestment.com:29443";
    const wsBase = "ws://ops.koreainvestment.com:21000";
    const wsTestnet = "ws://ops.koreainvestment.com:31000";

    const default_options = {
      recvWindow: 1000,
      reconnect: true,
      keepAlive: true,
      test: false,
      log: function (...args) {
        console.log(Array.prototype.slice.call(args));
      },
      APIKEY: APIKEY,
      SECRETKEY: SECRETKEY,
      accNumFront: accNumFront,
      accNumBack: accNumBack,
    };

    this.options = Object.assign(default_options, options);
    this.isTest = this.options.test;
    this.options.domain = this.isTest ? testnet : base;
    this.options.wsDomain = this.isTest ? wsTestnet : wsBase;

    this.appkey = this.options.APIKEY;
    this.appsecret = this.options.SECRETKEY;
    this.domain = this.options.domain;
  }

  isTokenExpired() {
    return this.options.tokenExpiration < new Date().getTime();
  }

  setToken(_token, _expire_in) {
    this.options.token = _token;
    this.options.tokenExpiration =
      new Date().getTime() + (_expire_in - 3600) * 1000;
  }

  async getToken() {
    if (this.isTokenExpired() || this.options.token === undefined) {
      const res = await this.issueToken();
      this.setToken(res.body.access_token, res.body.expire_in);
    }
    return this.options.token;
  }

  request(
    opt,
    addKey = true,
    addHash = false,
    addAccNum = true,
    addContentType = true,
    addAuth = true
  ) {
    if (addKey)
      opt.headers = Object.assign(opt.data, {
        appkey: this.options.APIKEY,
        appsecret: this.options.SECRETKEY,
      });

    if (addAccNum)
      opt.data = Object.assign(opt.data, {
        CANO: this.options.accNumFront,
        ACNT_PRDT_CD: this.options.accNumBack,
      });

    if (addHash) {
      const hash = this.getHashkey();
      opt.headers = Object.assign(opt.headers, { hashkey: hash });
    }

    if (addContentType)
      opt.headers = Object.assign(opt.headers, {
        "content-type": "application/json",
      });

    if (addAuth) {
      const token = this.getToken();
      opt.headers = Object.assign(opt.headers, { authorization: token });
    }

    opt.url = this.domain + opt.url;

    return axios(opt).then((res) => ({
      header: res.headers,
      body: res.data,
    }));
  }

  connect(url, tr_id, tr_key) {
    const obj = {
      socket: WebSocket(this.options.wsDomain + url),

      open: () => {
        this.socket.send({
          header: {
            appkey: this.options.APIKEY,
            appsecret: this.options.SECRETKEY,
            custtype: "P",
            tr_type: "1",
            "content-type": "utf-8",
          },
          body: { input: { tr_id, tr_key } },
        });
      },

      close: () => {
        this.socket.send({
          header: {
            appkey: this.options.APIKEY,
            appsecret: this.options.SECRETKEY,
            custtype: "P",
            tr_type: "2",
            "content-type": "utf-8",
          },
          body: { input: { tr_id, tr_key } },
        });
        socket.close();
      },
    };

    return obj;
  }

  //OAuth
  //Hashkey
  hashkey(data) {
    const opt = {
      url: "/uapi/hashkey",
      headers: { "content-type": "application/json" },
      data,
      method: "POST",
    };

    return this.request(opt, (addAccNum = false), (addAuth = false));
  }

  async getHashkey(data) {
    const res = await this.hashkey(data);
    return res.body.HASH;
  }

  //접근토큰발급(P)
  issueToken() {
    if (this.options.token) this.discardToken();

    const opt = {
      url: "/oauth2/tokenP",
      data: {
        grant_type: "client_credentials",
        appkey: this.appkey,
        appsecret: this.appsecret,
      },
      method: "POST",
    };

    return this.request(
      opt,
      (addKey = false),
      (addAccNum = false),
      (addContentType = false),
      (addAuth = false)
    );
  }

  //접근토큰폐기(P)
  discardToken(token = this.options.token) {
    if (token === undefined) throw "token was undefined";

    const opt = {
      url: "/oauth2/revokeP",
      data: { token, appkey: this.appkey, appsecret: this.appsecret },
      method: "POST",
    };

    return this.request(
      opt,
      (addKey = false),
      (addAccNum = false),
      (addContentType = false),
      (addAuth = false)
    );
  }

  //Domestic Stock Order
  //주식주문(현금)
  orderCash(ticker, type, orderType, qty, price) {
    const opt = {
      url: "/uapi/domestic-stock/v1/trading/order-cash",
      headers: {},
      data: {
        PDNO: ticker,
        ORD_DVSN: orderType,
        ORD_QTY: qty,
        ORD_UNPR: price,
      },
      method: "POST",
    };

    if (type === "BUY")
      opt.headers.tr_id = this.isTest ? "VTTC0802U" : "TTTC0802U";
    else if (type === "SELL")
      opt.headers.tr_id = this.isTest ? "VTTC0801U" : "TTTC0801U";
    else throw "type should be either BUY or SELL";

    return this.request(opt, (addHash = true));
  }

  balance(viewBy, CTX_AREA_FK100 = null, CTX_AREA_NK100 = null) {
    const opt = {
      url: "/uapi/domestic-stock/v1/trading/inquire-balance",
      headers: {
        tr_id: this.isTest ? "VTTC8434R" : "TTTC8434R",
      },
      data: {
        AFHR_FLPR_YN: "N",
        INQR_DVSN: viewBy,
        UNPR_DVSN: "01",
        FUND_STTL_ICLD_YN: "N",
        FNCG_AMT_AUTO_RDPT_YN: "N",
        PRCS_DVSN: "00",
      },
      method: "GET",
    };

    if (CTX_AREA_FK100 && CTX_AREA_NK100) {
      opt.headers.tr_cont = "N";
      opt.data.CTX_AREA_FK100 = CTX_AREA_FK100;
      opt.data.CTX_AREA_NK100 = CTX_AREA_NK100;
    }

    return this.request(opt);
  }

  possibleOrder(ticker, price, orderType) {
    const opt = {
      url: "/uapi/domestic-stock/v1/trading/inquire-psbl-order",
      headers: {
        tr_id: this.isTest,
      },
      data: {
        PDNO: ticker,
        ORD_UNPR: price,
        ORD_DVSN: orderType,
        CMA_EVLU_AMT_ICLD_YN: "N",
        OVRS_ICLD_YN: "N",
      },
      method: "GET",
    };

    return this.request(opt);
  }

  getKline(ticker, interval, resume = false) {
    const opt = {
      url: "/uapi/domestic-stock/v1/quotations/inquire-daily-price",
      headers: {
        tr_id: "FHKST01010400",
      },
      data: {
        FID_COND_MRKT_DIV_CODE: "J",
        FID_INPUT_ISCD: ticker,
        FID_PERIOD_DIV_CODE: interval,
        FID_ORG_ADJ_PRC: "1",
      },
      method: "GET",
    };
    if (resume) opt.headers.tr_cont = "N";

    return this.request(opt, (addAccNum = false));
  }

  tradeStream(ticker) {
    const socket = this.connect("/tryitout/H0STCNT0", "H0STCNT0", ticker);
    socket.socket.on("message", () => {});
  }

  /*
  openEventFunction = (event) => event,
  closeEventFunction = (event) => event,
  errorEventFunction = (event) => event,
  messageEventFunction = (event) => event

  
  this.socket.addEventListener("close", (event) => {
    closeEventFunction(event);
  });
  this.socket.addEventListener("open", (event) => {
    openEventFunction(event);
  });
  this.socket.addEventListener("error", (event) => {
    errorEventFunction(event);
  });
  this.socket.addEventListener("message", (event) => {
    messageEventFunction(event);
  });
  */
}

class Client extends KoreaInvestmentAPI {
  MarketBuy(ticker, qty) {
    return orderCash(ticker, "BUY", "01", qty, "0");
  }

  MarketSell(ticker, qty) {
    return orderCash(ticker, "SELL", "01", qty, "0");
  }
}

export default Client;
