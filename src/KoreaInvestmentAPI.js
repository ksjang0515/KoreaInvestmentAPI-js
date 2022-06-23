import Websocket from "ws";
import "request";
import "url";
import axios from "axios";

class KoreaInvestmentAPI {
  constructor(APIKEY, SECRETKEY, accNumFront, accNumBack, options = {}) {
    const base = "https://openapi.koreainvestment.com:9443";
    const testnet = "https://openapivts.koreainvestment.com:29443";

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
    const isTest = this.options.test;
    this.options.domain = isTest ? testnet : base;

    const res = (async () => await issueToken())();
    setToken(res.body.access_token, res.body.expire_in);

    const appkey = this.options.APIKEY;
    const appsecret = this.options.SECRETKEY;
    const domain = this.options.domain;
  }

  isTokenExpired() {
    return this.options.tokenExpiration < new Date().getTime();
  }

  setToken(_token, _expire_in) {
    KoreaInvest.options.token = _token;
    KoreaInvest.options.tokenExpiration =
      new Date().getTime() + (_expire_in - 3600) * 1000;
  }

  request(opt) {
    return axios(opt).then((res) => ({ header: res.headers, body: res.body }));
  }

  //OAuth
  //Hashkey
  hashkey(data) {
    const opt = {
      url: domain + "/uapi/hashkey",
      headers: {
        "content-type": "application/json",
        appkey,
        appsecret,
      },
      data,
      method: "POST",
    };

    return request(opt);
  }

  //접근토큰발급(P)
  async issueToken() {
    if (KoreaInvest.options.token) {
      await discardToken(KoreaInvest.options.token);
    }

    const opt = {
      url: domain + "/oauth2/tokenP",
      data: {
        grant_type: "client_credentials",
        appkey,
        appsecret,
      },
      method: "POST",
    };

    return request(opt);
  }

  //접근토큰폐기(P)
  async discardToken(token = this.options.token) {
    if (token === undefined) {
      throw "token was undefined";
    }
    const opt = {
      url: domain + "/oauth2/revokeP",
      data: {
        appkey,
        appsecret,
        token,
      },
      method: "POST",
    };

    return request(opt);
  }

  //Domestic Stock Order
  //주식주문(현금)
  async orderCash(ticker, type, orderType, qty, price) {
    const data = {
      CANO: accNumFront,
      ACNT_PRDT_CD: accNumBack,
      PDNO: ticker,
      ORD_DVSN: orderType,
      ORD_QTY: qty,
      ORD_UNPR: price,
    };
    const hash = await hashkey(data);

    const opt = {
      url: domain + "/uapi/domestic-stock/v1/trading/order-cash",
      headers: {
        "content-type": "application/json",
        authorization: await token(),
        appkey,
        appsecret,
        hashkey: hash,
      },
      data,
      method: "POST",
    };

    if (type === "BUY") opt.headers.tr_id = isTest ? "VTTC0802U" : "TTTC0802U";
    else if (type === "SELL")
      opt.headers.tr_id = isTest ? "VTTC0801U" : "TTTC0801U";
    else throw "type should be either BUY or SELL";

    return request(opt);
  }

  MarketBuy(ticker, qty) {
    return orderCash(ticker, "BUY", "01", qty, "0");
  }

  MarketSell(ticker, qty) {
    return orderCash(ticker, "SELL", "01", qty, "0");
  }

  //주식주문(정정취소)
  async RevokeOrder(KRXNum, orderNum, orderType, revokeType, qty, price, all) {
    const data = {
      CANO: accNumFront,
      ACNT_PRDT_CD: accNumBack,
      KRX_FWDG_ORD_ORGNO: KRXNum,
      ORGN_ODNO: orderNum,
      ORD_DVSN: orderType,
      RVSE_CNCL_DVSN_CD: revokeType,
      ORD_QTY: qty,
      ORD_UNPR: price,
      QTY_ALL_ORD_YN: all,
    };

    const hash = hashkey(data);
    const opt = {
      url: domain + "/uapi/domestic-stock/v1/trading/order-rvsecncl",
      headers: {
        "content-type": "	application/json",
        authorization: await token(),
        appkey,
        appsecret,
        tr_id: isTest ? "VTTC0803U" : "TTTC0803U",
        hashkey: hash,
      },
      data,
      method: "POST",
    };

    return request(opt);
  }

  //주식정정취소가능주문조회
  RevokableOrder() {}

  async OrderHistory(startDate, endDate, type) {
    const data = {
      CANO: accNumFront,
      ACNT_PRDT_CD: accNumBack,
      INQR_STRT_DT: startDate,
      INQR_END_DT: endDate,
      SLL_BUY_DVSN_CD: type,
    };
    const opt = {
      url: domain + "/uapi/domestic-stock/v1/trading/inquire-daily-ccld",
      data: {
        "content-type": "application/json",
        authorization: await token(),
        appkey,
        appsecret,
        tr_id,
      },
      method: "GET",
    };
  }
}

export default KoreaInvestmentAPI;
