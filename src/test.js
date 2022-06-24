import axios from "axios";
import "url";
import Dotenv from "dotenv";
import Client from "./KoreaInvestmentAPI.js";

Dotenv.config();

const APIKEY = process.env.KEY;
const APISECRET = process.env.SECRET;
const accNumFront = process.env.accNumFront;
const accNumBack = process.env.accNumBack;

const api = new Client(APIKEY, APISECRET, accNumFront, accNumBack);
const res = api.getToken();

console.log(res);
