const errorHandling = (err, req, res, next) => {
    console.error("🔥 Error caught:");

    console.error({
        message: err.message,
        stack: err.stack,
        path: req.originalUrl,
        method: req.method,
        body: req.body,
        time: new Date().toISOString()
    });

    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error"
    });
};

export default errorHandling;