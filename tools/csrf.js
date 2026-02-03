import crypto from "crypto";
function generateCsrfToken() {
    return crypto.randomBytes(32).toString("hex");
}
export default generateCsrfToken;