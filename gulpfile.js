function startExpressWithHotReload() {
	const browserSync = require( 'browser-sync' ),
		gulp = require( 'gulp' );

	const app = expressStart({ 
		useBasicAuth: false,
		debug: true 
	});

	// listens to server at PORT
	app.listen( 3000, function () {
		console.log( `[Express] Server with hot reload listening on port 3000` );

		browserSync({
			open: false,
			notify: true,
			port: 8000,
			proxy: 'localhost:3000',
			ui: false,
			reloadDelay: 0,
			ghostMode: {
				clicks: false,
				forms: false,
				scroll: false
			}
		});
	});

	gulp.watch( [ 'src/**/*.pug', 'src/**/*.js', 'src/**/*.md' ] ).on( 'change', function() {
		browserSync.reload();
	});

	gulp.watch( [ 'src/**/*.scss' ] ).on( 'change', function() {
		browserSync.reload( '*.css' );
	});
}

function startExpress() {
	const app = expressStart();

	// listens to server at PORT
	app.listen( 8080, function () {
		console.log( `[Express] Server listening on port 8080` );
	});
}

function startExpressWithBasicAuth() {
	const app = expressStart({
		useBasicAuth: true,
		debug: false
	});

	// listens to server at PORT
	app.listen( 8080, function () {
		console.log( `[Express] Server with basic auth listening on port 8080` );
	});
}

function configAppForI18n(app) {
	const i18n = require( 'i18n' ),
		path = require( 'path' );
		
	// Configure i18n
	i18n.configure({
		locales: supportedLocales,
		directory: path.join(__dirname, 'locales'),
		defaultLocale: 'fr',
		queryParameter: 'lang',
		cookie: 'lang',
		registerGlobals: false,
		preserveLocaleOnApiCalls: true
	});

	// Initialize i18n middleware
	app.use(i18n.init);

	app.use((req, res, next) => {
		// Make i18n available to all templates
		res.locals.__ = res.__ = function() {
			return i18n.__.apply(req, arguments);
		};
		
		res.locals.__n = res.__n = function() {
			return i18n.__n.apply(req, arguments);
		};

		res.locals.getLocale = req.getLocale = function() {
			return i18n.getLocale.apply(req, arguments);
		};

		console.log(req.getLocale());

		res.locals.isEnglish = req.getLocale() === 'en';
		res.locals.isFrench = req.getLocale() === 'fr';

		next();
	});
}

function expressStart (config = { useBasicAuth: false, debug: false }) {
	const { startApp } = require( './src/server/app' );

	return startApp(config);
}

exports['dev'] = startExpressWithHotReload;
exports['start-with-basic-auth'] = startExpressWithBasicAuth;
exports['start'] = startExpress;