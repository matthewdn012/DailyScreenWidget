/** @type {import('jest').Config} */
export default {
	preset: "ts-jest",
	testEnvironment: "node",
	testMatch: ["**/*.test.ts"],
	transform: {
		"^.+\\.ts$": ["ts-jest", {
			tsconfig: "./tsconfig.jest.json",
		}],
	},
}
