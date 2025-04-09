const i18n = require( 'i18n' );

const localeMiddleware = (req, res, next) => {    
    // Check if we have a language parameter in the URL
    if (req.params.lang) {
        i18n.setLocale(req, req.params.lang);
    }
    
    // Attach i18n methods to response locals for use in templates
    res.locals.__ = res.__ = function() {
        return i18n.__.apply(req, arguments);
    };

    res.locals.__n = res.__n = function() {
        return i18n.__n.apply(req, arguments);
    };

    res.locals.getLocale = req.getLocale = function() {
        return i18n.getLocale.apply(req, arguments);
    };

    return next();
};

module.exports = localeMiddleware;