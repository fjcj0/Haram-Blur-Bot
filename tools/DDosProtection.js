import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import slowDown from "express-slow-down";
export const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (request) => {
        const ipPart = ipKeyGenerator(request);
        const uaPart = request.headers["user-agent"] || "unknown";
        return `${ipPart}|${uaPart}`;
    },
    message: {
        success: false,
        message: "Too many requests",
    },
});
export const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 50,
    delayMs: () => 500,
});
const allowedBrowsers = [
    /Chrome/i,
    /Firefox/i,
    /Edg/i,
    /OPR/i,
    /Safari/i,
];
const blockedUserAgents = [
    /curl/i,
    /wget/i,
    /postman/i,
    /insomnia/i,
    /httpclient/i,
    /bot/i,
    /spider/i,
    /crawl/i,
    /ReactNative/i,
    /FBAN/i,
    /FBAV/i,
    /Instagram/i,
    /TikTok/i,
    /Snapchat/i,
    /wv/i,
    /WebView/i,
];
export const browserOnly = (request, response, next) => {
    const userAgent = request.headers["user-agent"] || "";
    if (blockedUserAgents.some(regex => regex.test(userAgent))) {
        return response.status(403).json({
            success: false,
            message: "Apps, bots, and WebViews are not allowed",
        });
    }
    if (!allowedBrowsers.some(regex => regex.test(userAgent))) {
        return response.status(403).json({
            success: false,
            message: "Only real browsers are allowed",
        });
    }
    const requiredHeaders = [
        "accept",
        "accept-language",
        "sec-fetch-site",
    ];
    for (const header of requiredHeaders) {
        if (!request.headers[header]) {
            return response.status(403).json({
                success: false,
                message: "Invalid browser request",
            });
        }
    }
    next();
};