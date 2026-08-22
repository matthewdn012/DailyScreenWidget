/** @type {import('jest').Config} */
export default {
	preset: "ts-jest",
	testEnvironment: "node",
	testMatch: ["**/*.test.ts"],
	transform: {
		"^.+\\.ts$": ["ts-jest", {
			tsconfig: {
				module: "commonjs",
				moduleResolution: "node",
				esModuleInterop: true,
				target: "es2023",
				types: ["jest", "node"],
			},
		}],
	},
}
