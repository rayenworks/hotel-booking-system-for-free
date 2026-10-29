// Unknown /api route -> JSON 404 (instead of an HTML page)
exports.notFoundApi = (req, res) => {
    res.status(404).json({ message: "Not found" });
};

// Last-resort error handler.
// Never sends error details or stack traces to the client.
exports.errorHandler = (err, req, res, next) => {
    if (res.headersSent) return next(err);

    const status = err.status || err.statusCode;

    // Client mistakes (bad JSON, body too large...) -> 4xx with a short message
    if (status >= 400 && status < 500) {
        const message = status === 413 ? "Request body is too large" : "Invalid request";
        return res.status(status).json({ message });
    }

    console.error(err);
    res.status(500).json({ message: "Server error" });
};
