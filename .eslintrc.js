module.exports = {
	env: {
		browser: true,
		es6: true,
		amd: true,
		node: true
	},
	extends: 'eslint:recommended',
	// "extends": "standard",
	parser: 'babel-eslint',
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2018,
		allowImportExportEverywhere: false,
		codeFrame: true
	},
	rules: {
		indent: [ 'error', 2 ],
		'linebreak-style': [ 'error', 'unix' ],
		quotes: [ 'error', 'single' ]
	}
};
