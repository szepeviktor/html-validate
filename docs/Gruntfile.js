const path = require("path");
const sass = require("sass");
const serveStatic = require("serve-static");

module.exports = function (grunt) {
	require("load-grunt-tasks")(grunt);

	grunt.registerTask("default", ["build"]);

	grunt.registerTask("dgeni", "Generate documentation", function () {
		const Dgeni = require("dgeni");
		const done = this.async();
		const dgeni = new Dgeni([require("./dgeni")]);
		try {
			dgeni
				.generate()
				.then(done)
				.catch(() => {
					grunt.fatal("Dgeni failed to generate docs");
				});
		} catch (err) {
			/* eslint-disable-next-line no-console */
			console.error(err);
			grunt.fatal("Dgeni failed to generate docs");
		}
	});

	grunt.registerTask("docs", "Build documentation app", [
		"sass",
		"postcss",
		"copy",
		"browserify",
		"dgeni",
	]);

	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),

		sass: {
			options: {
				implementation: sass,
				includePaths: [
					path.dirname(require.resolve("font-awesome/scss/font-awesome.scss")),
					path.dirname(require.resolve("bootstrap-sass/assets/stylesheets/_bootstrap.scss")),
				],
			},
			default: {
				src: "app/docs.scss",
				dest: "../public/assets/docs.css",
			},
		},

		postcss: {
			options: {
				processors: [require("autoprefixer"), require("cssnano")],
			},
			default: {
				src: "<%=sass.default.dest%>",
				dest: "../public/assets/docs.min.css",
			},
		},

		copy: {
			fontawesome: {
				expand: true,
				cwd: path.dirname(require.resolve("font-awesome/fonts/fontawesome-webfont.woff")),
				src: "*",
				dest: "../public/assets/fonts/",
			},
			glyphicons: {
				expand: true,
				cwd: path.dirname(
					require.resolve("bootstrap-sass/assets/fonts/bootstrap/glyphicons-halflings-regular.woff")
				),
				src: "*",
				dest: "../public/assets/fonts/",
			},
			favicon: {
				expand: true,
				cwd: "app",
				src: "favicon.ico",
				dest: "../public/",
			},
		},

		browserify: {
			default: {
				options: {
					transform: [
						[
							"babelify",
							{
								presets: ["@babel/preset-env"],
							},
						],
					],
				},
				src: "app/index.js",
				dest: "../public/assets/docs.js",
			},
		},

		connect: {
			options: {
				port: 3400,
				hostname: "localhost",
				keepalive: true,
				base: "../public",
				middleware: function () {
					return [serveStatic("../public")];
				},
			},
			default: {},
		},
	});
};
