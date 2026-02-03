function csrfProtection(request, response, next) {
    const csrfTokenCookie = request.cookies.csrfToken;
    const csrfTokenHeader = request.headers["x-csrf-token"];
    if (!csrfTokenCookie || !csrfTokenHeader) {
        return response.status(403).json({ message: "CSRF token missing" });
    }
    if (csrfTokenCookie !== csrfTokenHeader) {
        return response.status(403).json({ message: "Invalid CSRF token" });
    }
    next();
}
export default csrfProtection;