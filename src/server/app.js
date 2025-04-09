const express = require( 'express' );
const expressBasicAuth = require( 'express-basic-auth' );
const sassMiddleware = require( 'node-sass-middleware' );
const i18n = require( 'i18n' );
const path = require( 'path' );

const localeMiddleware = require( './middleware/locale.middleware' );

const supportedLocales = ['fr', 'en'];

const startApp = (config = { useBasicAuth: false, debug: false }) => {
    const app = express();

    console.log("config", config);

    // Add a dedicated health check endpoint that bypasses authentication
    app.get('/health', (req, res) => {
        res.status(200).send('OK');
    });

    if (config.useBasicAuth) {
        app.use( expressBasicAuth({
            users: {
                lobium: 'jomathlobium'
            },
            challenge: true
        }));
    }

    // sets template engine
    app.set( 'view engine', 'pug' );

    // sets directory name
    app.set( 'views', './src/' );

    // Configure i18n
    i18n.configure({
        locales: supportedLocales,
        directory: path.join(__dirname, '../locales'),
        defaultLocale: 'fr',
        cookie: 'lang',
        register: global,
        preserveLocaleOnApiCalls: true
    });

    // middlewares
    app.use(i18n.init);
    app.use(sassMiddleware({
        src: path.resolve( __dirname, 'src' ),
        dest: path.resolve( __dirname, 'src' ),
        debug: config.debug,
        outputStyle: 'expanded',
        indentType: 'tab',
        indentWidth: 1,
        linefeed: 'cr'
    }));

    // Handle language routes
    app.get('/:lang?', (req, res, next) => {
        // First check if the language parameter is valid
        if (!supportedLocales.includes(req.params.lang)) {
            res.redirect('/fr');
            return;
        }
        
        // Apply locale middleware after we have the route params
        localeMiddleware(req, res, next);
    }, (req, res) => {
        // Render the page after locale is properly set
        res.render('index.pug');
    });

    // static 
    app.use( express.static( 'src' ) );

    // Redirect all other routes to /fr
    app.get('*', (req, res) => {
        res.redirect('/fr');
    });

    return app;
};

module.exports = {
    startApp
};