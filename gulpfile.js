
function startExpressWithHotReload() {
	const browserSync = require( 'browser-sync' ),
		gulp = require( 'gulp' );

	const app = expressSetup({ 
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
	const app = expressSetup();

	// listens to server at PORT
	app.listen( 8080, function () {
		console.log( `[Express] Server listening on port 8080` );
	});
}

function startExpressWithBasicAuth() {
	const app = expressSetup({
		useBasicAuth: true,
		debug: false
	});

	// listens to server at PORT
	app.listen( 8080, function () {
		console.log( `[Express] Server with basic auth listening on port 8080` );
	});
}

function expressSetup (config = { useBasicAuth: false, debug: false }) {
	const
		express        = require( 'express' ),
		expressBasicAuth = require( 'express-basic-auth' ),
		sassMiddleware = require( 'node-sass-middleware' ),
		path           = require( 'path' ),
		app            = express();

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

	app.get( '/', function ( req, res ) {
		res.render( `index.pug` );
	});

	app.get( /.+\.pug/, function ( req, res ) {
		res.render( `${req.url}` );
	});

	app.get( /.+\.html/, function ( req, res ) {
		let tmp = req.url.replace( /html$/, 'pug' );
		res.render( `${tmp}` );
	});

	app.use( sassMiddleware({
		src: path.resolve( __dirname, 'src' ),
		dest: path.resolve( __dirname, 'src' ),
		debug: config.debug,
		outputStyle: 'expanded',
		indentType: 'tab',
		indentWidth: 1,
		linefeed: 'cr'
	}));

	// static files
	app.use( express.static( 'src' ) );

	return app;
}

exports['dev'] = startExpressWithHotReload;
exports['start-with-basic-auth'] = startExpressWithBasicAuth;
exports['start'] = startExpress;