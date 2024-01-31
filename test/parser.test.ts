/**
 * Unit test case for parsing configuration.
 */
import { ConfigElementBuilder } from "../src/elements";
import {
	ConfigParseFailureError,
	ConfigParser,
	InvalidValueError,
	NullValueError,
} from "../src/parser";


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getErrorsOfType(parser: ConfigParser, errorType: any) {
	return parser.getErrors().filter(e => e instanceof errorType);
}

describe("Config with a single number", () => {
	let parser: ConfigParser;
	describe("With an upper bound", () => {
		beforeEach(() => {
			parser = new ConfigParser(
				new ConfigElementBuilder().ofTypeObject().withChildElements(
				new ConfigElementBuilder()
					.ofTypeNumber()
					.withName("x")
					.withMaxValue(10)
					.build()
				).build()
			);
		});

		test("Should parse if below that number", () => {
			expect(() => parser.parse("{\"x\": 5}")).not.toThrow();
		});

		test("Should parse if equal to that number", () => {
			expect(() => parser.parse("{\"x\": 10}")).not.toThrow();
		});

		test("Should throw error if above that number", () => {
			expect(() => parser.parse("{\"x\": 10.1}"))
				.toThrow(ConfigParseFailureError);

			expect(getErrorsOfType(parser, InvalidValueError).length).toBe(1);
		});
	});
	describe("With a lower bound", () => {
		beforeEach(() => {
			parser = new ConfigParser(
				new ConfigElementBuilder().ofTypeObject().withChildElements(
				new ConfigElementBuilder()
					.ofTypeNumber()
					.withName("x")
					.withMinValue(10)
					.build()
				).build()
			);
		});

		test("Should parse if above that number", () => {
			expect(() => parser.parse("{\"x\": 15}")).not.toThrow();
		});

		test("Should parse if equal to that number", () => {
			expect(() => parser.parse("{\"x\": 10}")).not.toThrow();
		});

		test("Should throw error if below that number", () => {
			expect(() => parser.parse("{\"x\": 9.9}")).toThrow(ConfigParseFailureError);
			expect(getErrorsOfType(parser, InvalidValueError).length).toBe(1);
		});
	});

	describe("With a lower and upper bound", () => {
		beforeEach(() => {
			parser = new ConfigParser(
				new ConfigElementBuilder().ofTypeObject().withChildElements(
				new ConfigElementBuilder()
					.ofTypeNumber()
					.withName("x")
					.withMinValue(10)
					.withMaxValue(20)
					.build()
				).build()
			);
		});
		test("Should throw error in case below lower bound", () => {
			expect(() => parser.parse("{\"x\": 9.9}")).toThrow(ConfigParseFailureError);
			expect(getErrorsOfType(parser, InvalidValueError).length).toBe(1);
		});

		test("Should parse if on the lower bound", () => {
			expect(() => parser.parse("{\"x\": 10}")).not.toThrow();
		});

		test("Should parse if between bounds", () => {
			expect(() => parser.parse("{\"x\": 15}")).not.toThrow();
		});

		test("Should parse if on the upper bound", () => {
			expect(() => parser.parse("{\"x\": 20}")).not.toThrow();
		});

		test("Should throw error if above upper bound", () => {
			expect(() => parser.parse("{\"x\": 20.1}"))
				.toThrow(ConfigParseFailureError);
			expect(getErrorsOfType(parser, InvalidValueError).length).toBe(1);
		});
	});

	describe("With number value being NULL", () => {

		const json: string = "{\"x\": null}";

		test("Should throw error if NULL not allowed", () => {
			const parser = new ConfigParser(new ConfigElementBuilder()
				.ofTypeObject()
				.withChildElements(new ConfigElementBuilder()
					.ofTypeNumber()
					.withName("x")
					.build()
				).build()
			);
			expect(() => parser.parse(json)).toThrow(ConfigParseFailureError);
			expect(getErrorsOfType(parser, NullValueError).length).toBe(1);
		});

		test ("Should parser if NULL allowed", () => {
			const parser = new ConfigParser(new ConfigElementBuilder()
				.ofTypeObject()
				.withChildElements(new ConfigElementBuilder()
					.ofTypeNumber()
					.withName("x")
					.canBeNull()
					.build()
				).build()
			);
			type Result = {x: number};
			let result: Result;
			expect(() => result = parser.parse(json) as Result).not.toThrow();
			expect(result.x).toBeNull();
		});
	});
});
