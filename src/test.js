import Dotenv from "dotenv";
import Client from "./KoreaInvestmentAPI.js";
import axios from "axios";

Dotenv.config();

const APIKEY = process.env.KEY;
const APISECRET = process.env.SECRET;
const accNumFront = process.env.accNumFront;
const accNumBack = process.env.accNumBack;

axios.interceptors.request.use((request) => {
  console.log("Starting Request", JSON.stringify(request, null, 2));
  return request;
});

const api = new Client(APIKEY, APISECRET, accNumFront, accNumBack, {
  token:
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ0b2tlbiIsImF1ZCI6ImUwNGVhZDYwLTUwOGQtNDhkYS04NDIyLTI5NjYwODY1ZjMzNCIsImlzcyI6InVub2d3IiwiZXhwIjoxNjU2Mzg0NDkyLCJpYXQiOjE2NTYyOTgwOTIsImp0aSI6IlBTUDhGb1ptQUl1aGlqbTJTelNHN2hnOTVXU3NBY2dvZHptRiJ9.0EGFNns1NM3Ru60Kl0rx8ojw2i7DgtVpqNkmrzvtjMJSby6PEE3tTvuCoQsg9u0cvXqTnf9aAfDH0kfQlS66sw",
  tokenExpiration: 1656380905325,
});

//const res = await api.MarketBuy("143540", "1");

const res = await api.balance("01");

console.log(res);
