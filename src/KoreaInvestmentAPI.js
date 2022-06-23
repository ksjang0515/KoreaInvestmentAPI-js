import Websocket from "ws";
import "request";
import "url";
import axios from "axios";

let api = function KoreaInvestment(
  APIKEY,
  SECRETKEY,
  accNumFront,
  accNumBack,
  options = {}
) {
  let KoreaInvest = this;
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

  KoreaInvest.options = Object.assign(default_options, options);
  const isTest = KoreaInvest.options.test;
  KoreaInvest.options.domain = isTest ? testnet : base;

  const res = (async () => await issueToken())();
  setToken(res.body.access_token, res.body.expire_in);

  let token = async () => {
    if (isTokenExpired()) {
      const res = await issueToken();
      setToken(res.body.access_token, res.body.expire_in);
    }
    return KoreaInvest.options.token;
  };

  const appkey = KoreaInvest.options.APIKEY;
  const appsecret = KoreaInvest.options.SECRETKEY;
  const domain = KoreaInvest.options.domain;

  const isTokenExpired = () =>
    KoreaInvest.options.tokenExpiration < new Date().getTime();

  const setToken = (_token, _expire_in) => {
    KoreaInvest.options.token = _token;
    KoreaInvest.options.tokenExpiration =
      new Date().getTime() + (_expire_in - 3600) * 1000;
  };

  const request = (opt) => {
    return axios(opt).then((res) => ({ header: res.headers, body: res.body }));
  };

  //OAuth
  //Hashkey
  const hashkey = (data) => {
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
  };

  //접근토큰발급(P)
  const issueToken = async () => {
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
  };

  //접근토큰폐기(P)
  const discardToken = async (token = KoreaInvest.options.token) => {
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
  };

  //Domestic Stock Order
  //주식주문(현금)
  const orderCash = async (ticker, type, orderType, qty, price) => {
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
  };

  const MarketBuy = (ticker, qty) => {
    return orderCash(ticker, "BUY", "01", qty, "0");
  };

  const MarketSell = (ticker, qty) => {
    return orderCash(ticker, "SELL", "01", qty, "0");
  };

  //주식주문(신용)
  const OrderCredit = undefined;

  //주식주문(정정취소)
  const RevokeOrder = async (
    KRXNum,
    orderNum,
    orderType,
    revokeType,
    qty,
    price,
    all
  ) => {
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
  };

  //주식정정취소가능주문조회
  const RevokableOrder = () => {
    const method = "GET";
    const endpoint = "/uapi/domestic-stock/v1/trading/inquire-psbl-rvsecncl";
  };

  const OrderHistory = async (startDate, endDate, type) => {
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
  };
};

export default api;
