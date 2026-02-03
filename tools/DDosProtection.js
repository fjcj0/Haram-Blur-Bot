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