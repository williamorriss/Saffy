"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onRequest = onRequest;
var fast_xml_parser_1 = require("fast-xml-parser");
var typescript_cookie_1 = require("typescript-cookie");
var jose_1 = require("jose");
function onRequest(context) {
    return __awaiter(this, void 0, void 0, function () {
        var request, env, url, ticket, service, casValidate, username, payload, secretKey, token;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("CAS callback");
                    request = context.request, env = context.env;
                    url = new URL(request.url);
                    ticket = url.searchParams.get("ticket");
                    if (!ticket) {
                        throw new Error("Could not find ticket");
                    }
                    service = url.origin + "/api/auth/cas";
                    casValidate = new URL("https://".concat(env.AUTH, "/serviceValidate"));
                    casValidate.searchParams.append("service", service);
                    casValidate.searchParams.append("ticket", ticket);
                    return [4 /*yield*/, fetch(casValidate, {
                            method: "GET",
                        }).then(parseXMLResponse)];
                case 1:
                    username = _a.sent();
                    if (!username) return [3 /*break*/, 3];
                    console.log(username);
                    console.log(env.TESTKEY);
                    payload = { username: username };
                    secretKey = new TextEncoder().encode(env.TESTKEY);
                    return [4 /*yield*/, new jose_1.SignJWT(payload)
                            .setProtectedHeader({ alg: 'HS256' })
                            .setIssuedAt()
                            .setExpirationTime('2h')
                            .sign(secretKey)];
                case 2:
                    token = _a.sent();
                    (0, typescript_cookie_1.setCookie)('auth_token', token);
                    console.log("set token", token);
                    _a.label = 3;
                case 3: return [2 /*return*/, Response.redirect(url.origin, 301)];
            }
        });
    });
}
function parseXMLResponse(response) {
    return __awaiter(this, void 0, void 0, function () {
        var parser, xmlResponse, _a, _b, error_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    parser = new fast_xml_parser_1.XMLParser();
                    _b = (_a = parser).parse;
                    return [4 /*yield*/, response.text()];
                case 1:
                    xmlResponse = _b.apply(_a, [_c.sent()]);
                    if ("cas:authenticationSuccess" in xmlResponse["cas:serviceResponse"]) {
                        return [2 /*return*/, xmlResponse["cas:serviceResponse"]["cas:authenticationSuccess"]["cas:user"]];
                    }
                    return [2 /*return*/, null];
                case 2:
                    error_1 = _c.sent();
                    console.log(error_1);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
