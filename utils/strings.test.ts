import { truncate, stripSource } from "./strings"

// Group related tests with `describe`. The string here shows up in the
// test output, so name it after the thing being tested.
describe("truncate", () => {
	// Each `it` (or `test`, they're aliases) is one unit test. It should
	// check ONE behavior, and its name should read like a sentence:
	// "truncate ... returns the text unchanged when it's already short enough"
	it("returns the text unchanged when it's already short enough", () => {
		// Arrange: set up the inputs.
		const text = "hello"

		// Act: call the thing you're testing.
		const result = truncate(text, 10)

		// Assert: check the result is what you expect.
		expect(result).toBe("hello")
	})

	it("truncates and appends '...' when the text is too long", () => {
		const result = truncate("hello world", 5)
		expect(result).toBe("hello...")
	})

	// Edge cases are where bugs hide. What happens exactly AT the boundary?
	it("returns the text unchanged when it is exactly maxLength", () => {
		const result = truncate("hello", 5)
		expect(result).toBe("hello")
	})

	it("returns just '...' when maxLength is 0", () => {
		const result = truncate("hello", 0)
		expect(result).toBe("...")
	})
})

describe("stripSource", () => {
	it("strips the source suffix from a title with one separator", () => {
		// Arrange
		const title = "Fed raises rates - Reuters"

		// Act
		const result = stripSource(title)

		// Assert
		expect(result).toBe("Fed raises rates")
	})

	it("returns the title unchanged when there is no separator", () => {
		const result = stripSource("Just a headline")
		expect(result).toBe("Just a headline")
	})

	// Traced by hand: split(" - ") on "Part One - Part Two - Source" gives
	// ["Part One", "Part Two", "Source"]. pop() removes only the LAST
	// element, so only "Source" is dropped — the middle " - " stays intact
	// in the joined result.
	it("only strips the last segment when there are multiple separators", () => {
		const result = stripSource("Part One - Part Two - Source")
		expect(result).toBe("Part One - Part Two")
	})
})
