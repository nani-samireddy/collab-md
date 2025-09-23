/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./components/**/*.{js,ts,jsx,tsx,mdx}',
		'./app/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		extend: {
			colors: {
				'raisin-black': '#272727',
				'mustard': '#fed766',
				'moonstone': '#009fb7',
				'dim-gray': '#696773',
				'antiflash-white': '#eff1f3',
			},
		},
	},
	plugins: [],
}
