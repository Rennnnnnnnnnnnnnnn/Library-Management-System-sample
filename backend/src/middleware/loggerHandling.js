const loggerHandling = (req, res, next) => {
    console.log(
        `${req.method} ${req.protocol}://${req.get('host')}${req.originalUrl}`
    );
    next();
};

export default loggerHandling;