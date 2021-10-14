//@ts-check

'use strict';

const path = require('path');
const ParallelUglifyPlugin = require('webpack-parallel-uglify-plugin');



/**@type {import('webpack').Configuration}*/
const config = {
	target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
	mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
	// mode: 'production',

	entry: './src/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
	output: {
		// the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
		path: path.resolve(__dirname, 'dist'),
		filename: 'extension.js',
		libraryTarget: 'commonjs2',
	},
	devtool: 'nosources-source-map',
	externals: {
		vscode: 'commonjs vscode', // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
		// modules added here also need to be added in the .vsceignore file
	},
	resolve: {
		extensions: ['.ts', '.js'],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: [{ loader: 'ts-loader' }],
			},
		],
	},

	plugins: [],
};

module.exports = (env, argv) => {
	console.warn("导出执行",argv);
	if (argv.mode === 'development') {
	}

	if (argv.mode === 'production') {
		//压缩代码插件,用来清除console.log
		config.plugins.push(
			new ParallelUglifyPlugin({
				// uglifyJS: { }, // es5用这个
				terser: {
					// es6用这个
					output: {
						comments: false,
					},
					compress: {
						drop_console: true, // 删除所有调式带有console的
						drop_debugger: true,
						pure_funcs: [console.log], // 删除console.log
					},
				},
			})
		);
	}

	return config;
};
// module.exports = config;
