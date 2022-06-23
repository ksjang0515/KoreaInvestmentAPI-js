import axios from "axios";
import "url";
import Dotenv from "dotenv";

Dotenv.config();

const APIKEY = process.env.KEY;
const APISECRET = process.env.SECRET;
const accNumFront = process.env.accNumFront;
const accNumBack = process.env.accNumBack;
/*
const req = await axios({
  method: "POST",
  url: "https://openapi.koreainvestment.com:9443/oauth2/tokenP",
  data: {
    grant_type: "client_credentials",
    appkey: process.env.KEY,
    appsecret: process.env.SECRET,
  },
});
*/
/*
const req = await axios({
  url: "https://openapi.koreainvestment.com:9443/oauth2/revokeP",
  method: "POST",
  data: {
    appsecret: process.env.SECRET,
    token:
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ0b2tlbiIsImF1ZCI6IjAyMjFhZjE5LTYwYzUtNGM3OS1hMTZlLWM0MDA5YmQxMTY4ZSIsImlzcyI6InVub2d3IiwiZXhwIjoxNjU1ODY2NTczLCJpYXQiOjE2NTU3ODAxNzMsImp0aSI6IlBTUDhGb1ptQUl1aGlqbTJTelNHN2hnOTVXU3NBY2dvZHptRiJ9.hDfaSOWlySq9lHO4hPYpAgcIVx1sG8et9EzSQa7gSGJ9NpMCUXajkEhTlLse02XrTysz88o7qBFxAH1A47YS1Q",
  },
});

console.log(req);
*/

import KoreaInvestment from "../src/KoreaInvestmentAPI.js";

const api = new KoreaInvestment(APIKEY, APISECRET, accNumFront, accNumBack);

console.log(api.options);

const token = await api.token();

const res = await api.discardToken(token);
console.log(res);
