function startExpressWithHotReload() {
	const browserSync = require( 'browser-sync' ),
		gulp = require( 'gulp' );

	const app = expressSetup();

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
	app.listen( 3000, function () {
		console.log( `[Express] Server listening on port 3000` );
	});
}

function expressSetup () {
	const
		express        = require( 'express' ),
		sassMiddleware = require( 'node-sass-middleware' ),
		path           = require( 'path' ),
		app            = express();

	// sets template engine
	app.set( 'view engine', 'pug' );

	// sets directory name
	app.set( 'views', './src/' );

	app.get( '/', function ( req, res ) {
		console.log( '[request] root: index.pug' );
		res.render( `index.pug` );
	});

	app.get( /.+\.pug/, function ( req, res ) {
		console.log( `[request] pug: ${req.url}` );
		res.render( `${req.url}` );
	});

	app.get( /.+\.html/, function ( req, res ) {
		let tmp = req.url.replace( /html$/, 'pug' );
		console.log( '[request] html:', tmp );
		res.render( `${tmp}` );
	});

	app.use( sassMiddleware({
		src: path.resolve( __dirname, 'src' ),
		dest: path.resolve( __dirname, 'src' ),
		debug: true,
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
exports['start'] = startExpress;