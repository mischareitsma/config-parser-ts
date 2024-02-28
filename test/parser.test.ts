/**
 * Unit test case for parsing configuration.
 */
import {
		ConfigElementBuilder,
		ConfigElement,
		ElementType,
		NumberElement,
		StringElement,
		ObjectElement
} from "../src/elements";
import {
	ConfigParseFailureError,
	ConfigParser,
	InvalidArrayContentsError,
	InvalidArrayElementTypeError,
	InvalidTypeError,
	InvalidValueError,
	MissingRequiredFieldError,
	NullArrayElementError,
	NullValueError,
} from "../src/parser";


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getErrorsOfType(parser: ConfigParser, errorType: any) {
	return parser.getErrors().filter(e => e instanceof errorType);
}

function getParserWithRootAndChildren(...children: ConfigElement[]) {
	return new ConfigParser(new ConfigElementBuilder().ofTypeObject().withChildElements(
		...children
	).build());
}

describe("Config with a single number", () => {
	let parser: ConfigParser;
	type Result = {x: number};

	test("Should give back an object with a number if parsed", () => {
		parser = getParserWithRootAndChildren(
			new ConfigElementBuilder().ofTypeNumber().withName("x").build()
		);

		const result = parser.parse("{\"x\": 5}") as Result;
		expect(result.x).toBe(5);
	});

	describe("With an upper bound", () => {
		beforeEach(() => {
			parser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeNumber()
					.withName("x")
					.withMaxValue(10)
					.build()
			);
		});

		test("Should parse if below that number", () => {
			const result: Result = parser.parse("{\"x\": 5}") as Result;
			expect(result.x).toBe(5);
		});

		test("Should parse if equal to that number", () => {
			const result: Result = parser.parse("{\"x\": 10}") as Result;
			expect(result.x).toBe(10);
		});

		test("Should throw error if above that number", () => {
			expect(() => parser.parse("{\"x\": 10.1}"))
				.toThrow(ConfigParseFailureError);

			expect(getErrorsOfType(parser, InvalidValueError).length).toBe(1);
		});
	});
	describe("With a lower bound", () => {
		beforeEach(() => {
			parser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeNumber()
					.withName("x")
					.withMinValue(10)
					.build()
			);
		});

		test("Should parse if above that number", () => {
			const result: Result = parser.parse("{\"x\": 15}") as Result;
			expect(result.x).toBe(15);
		});

		test("Should parse if equal to that number", () => {
			const result: Result = parser.parse("{\"x\": 10}") as Result;
			expect(result.x).toBe(10);
		});

		test("Should throw error if below that number", () => {
			expect(() => parser.parse("{\"x\": 9.9}")).toThrow(ConfigParseFailureError);
			expect(getErrorsOfType(parser, InvalidValueError).length).toBe(1);
		});
	});

	describe("With a lower and upper bound", () => {
		beforeEach(() => {
			parser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeNumber()
					.withName("x")
					.withMinValue(10)
					.withMaxValue(20)
					.build()
			);
		});
		test("Should throw error in case below lower bound", () => {
			expect(() => parser.parse("{\"x\": 9.9}")).toThrow(ConfigParseFailureError);
			expect(getErrorsOfType(parser, InvalidValueError).length).toBe(1);
		});

		test("Should parse if on the lower bound", () => {
			const result: Result =  parser.parse("{\"x\": 10}") as Result;
			expect(result.x).toBe(10);
		});

		test("Should parse if between bounds", () => {
			const result: Result =  parser.parse("{\"x\": 15}") as Result;
			expect(result.x).toBe(15);
		});

		test("Should parse if on the upper bound", () => {
			const result: Result =  parser.parse("{\"x\": 20}") as Result;
			expect(result.x).toBe(20);
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
			parser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeNumber()
					.withName("x")
					.build()
			);
			expect(() => parser.parse(json)).toThrow(ConfigParseFailureError);
			expect(getErrorsOfType(parser, NullValueError).length).toBe(1);
		});

		test ("Should parse if NULL allowed", () => {
			parser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeNumber()
					.withName("x")
					.canBeNull()
					.build()
			);
			const result: Result = parser.parse(json) as Result;
			expect(result.x).toBeNull();
		});
	});

	describe("With a missing number", () => {

		test("Should throw error if not optional", () => {
			parser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeNumber()
					.withName("x")
					.build()
			);
			expect(() => parser.parse("{}")).toThrow(ConfigParseFailureError);
			expect(getErrorsOfType(parser, MissingRequiredFieldError).length).toBe(1);
		});

		test ("Should parse if optional", () => {
			parser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeNumber()
					.withName("x")
					.isOptional()
					.build()
			);

			const result: Result = parser.parse("{}") as Result;
			expect(result.x).toBeUndefined();
		});

	});
});

describe("Config with a single string", () => {
	let parser: ConfigParser;
	type Result = {x: string};

	test("Should give back an object with a number if parsed", () => {
		parser = getParserWithRootAndChildren(
			new ConfigElementBuilder().ofTypeString().withName("x").build()
		);

		const result = parser.parse("{\"x\": \"abc\"}") as Result;
		expect(result.x).toBe("abc");
	});

	describe("With an maximum length bound", () => {
		beforeEach(() => {
			parser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeString()
					.withName("x")
					.withMaxLength(3)
					.build()
			);
		});

		test("Should parse if below that number", () => {
			const result: Result = parser.parse("{\"x\": \"a\"}") as Result;
			expect(result.x).toBe("a");
		});

		test("Should parse if equal to that number", () => {
			const result: Result = parser.parse("{\"x\": \"abc\"}") as Result;
			expect(result.x).toBe("abc");
		});

		test("Should throw error if above that number", () => {
			expect(
				() => parser.parse("{\"x\": \"abcd\"}")
			).toThrow(ConfigParseFailureError);

			expect(getErrorsOfType(parser, InvalidValueError).length).toBe(1);
		});
	});
	describe("With a minimum length", () => {
		beforeEach(() => {
			parser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeString()
					.withName("x")
					.withMinLength(3)
					.build()
			);
		});

		test("Should parse if above that number", () => {
			const result: Result = parser.parse("{\"x\": \"abcd\"}") as Result;
			expect(result.x).toBe("abcd");
		});

		test("Should parse if equal to that number", () => {
			const result: Result = parser.parse("{\"x\": \"abc\"}") as Result;
			expect(result.x).toBe("abc");
		});

		test("Should throw error if below that number", () => {
			expect(
				() => parser.parse("{\"x\": \"ab\"}")
			).toThrow(ConfigParseFailureError);
			expect(getErrorsOfType(parser, InvalidValueError).length).toBe(1);
		});
	});

	describe("With a minimum and maximum length", () => {
		beforeEach(() => {
			parser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeString()
					.withName("x")
					.withMinLength(3)
					.withMaxLength(5)
					.build()
			);
		});
		test("Should throw error in case below lower bound", () => {
			expect(
				() => parser.parse("{\"x\": \"ab\"}")
			).toThrow(ConfigParseFailureError);
			expect(getErrorsOfType(parser, InvalidValueError).length).toBe(1);
		});

		test("Should parse if on the lower bound", () => {
			const result: Result = parser.parse("{\"x\": \"abc\"}") as Result;
			expect(result.x).toBe("abc");
		});

		test("Should parse if between bounds", () => {
			const result: Result = parser.parse("{\"x\": \"abcd\"}") as Result;
			expect(result.x).toBe("abcd");
		});

		test("Should parse if on the upper bound", () => {
			const result: Result = parser.parse("{\"x\": \"abcde\"}") as Result;
			expect(result.x).toBe("abcde");
		});

		test("Should throw error if above upper bound", () => {
			expect(
				() => parser.parse("{\"x\": \"abcdef\"}")
			).toThrow(ConfigParseFailureError);
			expect(getErrorsOfType(parser, InvalidValueError).length).toBe(1);
		});
	});

	describe("With an array of valid values", () => {
		beforeEach(() => {
			parser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeString()
					.withName("x")
					.withValidStringValues("hi", "bye")
					.build()
			);
		});

		test("Should throw an error in case value is not valid", () => {
			expect(() => parser.parse("{\"x\": \"Hello\"}")).toThrow(
				ConfigParseFailureError
			);
			expect(getErrorsOfType(parser, InvalidValueError)).toHaveLength(1);
		});

		test.each(["hi", "bye"])("Should parse with value %s", (value) => {
			const result: Result = parser.parse(`{"x": "${value}"}`) as Result;
			expect(result.x).toBe(value);
		});
	});

	describe("With string value being NULL", () => {

		const json: string = "{\"x\": null}";

		test("Should throw error if NULL not allowed", () => {
			parser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeString()
					.withName("x")
					.build()
			);
			expect(() => parser.parse(json)).toThrow(ConfigParseFailureError);
			expect(getErrorsOfType(parser, NullValueError).length).toBe(1);
		});

		test ("Should parse if NULL allowed", () => {
			parser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeString()
					.withName("x")
					.canBeNull()
					.build()
			);
			const result: Result = parser.parse(json) as Result;
			expect(result.x).toBeNull();
		});
	});

	describe("With a missing string", () => {

		test("Should throw error if not optional", () => {
			parser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeString()
					.withName("x")
					.build()
			);
			expect(() => parser.parse("{}")).toThrow(ConfigParseFailureError);
			expect(getErrorsOfType(parser, MissingRequiredFieldError).length).toBe(1);
		});

		test ("Should parse if optional", () => {
			parser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeString()
					.withName("x")
					.isOptional()
					.build()
			);

			const result: Result = parser.parse("{}") as Result;
			expect(result.x).toBeUndefined();
		});

	});
});

describe("Config with a single boolean", () => {
	let parser: ConfigParser;
	type Result = {x: boolean};

	test("Should give back an object with a boolean if parsed", () => {
		parser = getParserWithRootAndChildren(
				new ConfigElementBuilder().ofTypeBoolean().withName("x").build()
		);

		const result = parser.parse("{\"x\": true}") as Result;
		expect(result.x).toBe(true);
	});

	describe("With a boolean being NULL", () => {

		const json: string = "{\"x\": null}";

		test("Should throw error if NULL not allowed", () => {
			parser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeBoolean()
					.withName("x")
					.build()
			);
			expect(() => parser.parse(json)).toThrow(ConfigParseFailureError);
			expect(getErrorsOfType(parser, NullValueError).length).toBe(1);
		});

		test ("Should parse if NULL allowed", () => {
			parser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeBoolean()
					.withName("x")
					.canBeNull()
					.build()
			);
			
			const result: Result = parser.parse(json) as Result;
			expect(result.x).toBeNull();
		});
	});

	describe("With a missing boolean", () => {

		test("Should throw error if not optional", () => {
			parser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeBoolean()
					.withName("x")
					.build()
			);
			expect(() => parser.parse("{}")).toThrow(ConfigParseFailureError);
			expect(getErrorsOfType(parser, MissingRequiredFieldError).length).toBe(1);
		});

		test ("Should parse if optional", () => {
			parser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeBoolean()
					.withName("x")
					.isOptional()
					.build()
			);

			const result: Result = parser.parse("{}") as Result;
			expect(result.x).toBeUndefined();
		});
	});
});

describe("Config with a single object", () => {

	test("Can have missing fields", () => {
		const parser = getParserWithRootAndChildren(
			new ConfigElementBuilder().ofTypeObject().withName("obj").withChildElements(
				new ConfigElementBuilder()
					.ofTypeString()
					.withName("x")
					.isOptional()
					.build()
			).build()
		);

		type Result = {obj: {x?: string}};

		expect(JSON.stringify((parser.parse("{\"obj\": {}}") as Result).obj)).toBe("{}");
	});

	test("Has errors in case of missing required fields", () => {
		const parser = getParserWithRootAndChildren(
			new ConfigElementBuilder().ofTypeObject().withName("obj").withChildElements(
				new ConfigElementBuilder()
					.ofTypeString()
					.withName("x")
					.build()
			).build()
		);

		expect(() => parser.parse("{\"obj\": {}}")).toThrow(ConfigParseFailureError);
		expect(getErrorsOfType(parser, MissingRequiredFieldError).length).toBe(1);
	});

	test("With pruned extra fields should keep only configured fields", () => {
		const parser = new ConfigParser(
			new ConfigElementBuilder().ofTypeObject().withChildElements(
				new ConfigElementBuilder()
					.ofTypeObject()
					.withName("obj")
					.withChildElements(
						new ConfigElementBuilder()
							.ofTypeString()
							.withName("x")
							.build()
					).build()
			).build(),
			{pruneUnknownElements: true}
		);

		type Result = {obj: {x: string, y?: string}};

		const result: Result = parser.parse(
			"{\"obj\": { \"x\": \"lala\", \"y\": \"extra\"}}"
		) as Result;

		expect(result.obj.x).toBe("lala");
		expect(result.obj.y).toBeUndefined();
	});

	test("With pruned extra fields should keep only configured fields", () => {
		const parser = new ConfigParser(
			new ConfigElementBuilder().ofTypeObject().withChildElements(
				new ConfigElementBuilder()
					.ofTypeObject()
					.withName("obj")
					.withChildElements(
						new ConfigElementBuilder()
							.ofTypeString()
							.withName("x")
							.build()
					).build()
			).build()
		);

		type Result = {obj: {x: string, y?: string}};

		const result: Result = parser.parse(
			"{\"obj\": { \"x\": \"lala\", \"y\": \"extra\"}}"
		) as Result;

		expect(result.obj.x).toBe("lala");
		expect(result.obj.y).toBe("extra");
	});

	describe("With an object being NULL", () => {

		const json: string = "{\"obj\": null}";

		test("Should throw error if NULL not allowed", () => {
			const parser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeObject()
					.withName("obj")
					.build()
			);
			expect(() => parser.parse(json)).toThrow(ConfigParseFailureError);
			expect(getErrorsOfType(parser, NullValueError).length).toBe(1);
		});

		test ("Should parse if NULL allowed", () => {
			const parser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeObject()
					.withName("obj")
					.canBeNull()
					.build()
			);

			type Result = {obj: object};
			
			const result: Result = parser.parse(json) as Result;
			expect(result.obj).toBeNull();
		});
	});

	describe("With a missing object", () => {

		test("Should throw error if not optional", () => {
			const parser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeObject()
					.withName("obj")
					.build()
			);
			expect(() => parser.parse("{}")).toThrow(ConfigParseFailureError);
			expect(getErrorsOfType(parser, MissingRequiredFieldError).length).toBe(1);
		});

		test ("Should parse if optional", () => {
			const parser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeObject()
					.withName("obj")
					.isOptional()
					.build()
			);
			type Result = {obj?: object};
			const result: Result = parser.parse("{}") as Result;
			expect(result.obj).toBeUndefined();
			
		});
	});
});

describe("Config with a single array", () => {

	describe("With an array being NULL", () => {

		const json: string = "{\"arr\": null}";

		test("Should throw error if NULL not allowed", () => {
			const parser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeArray()
					.withName("arr")
					.build()
			);
			expect(() => parser.parse(json)).toThrow(ConfigParseFailureError);
			expect(getErrorsOfType(parser, NullValueError).length).toBe(1);
		});

		test ("Should parse if NULL allowed", () => {
			const parser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeArray()
					.withName("arr")
					.canBeNull()
					.build()
			);
			
			type Result = {arr: unknown[]};
			const result: Result = parser.parse(json) as Result;
			expect(result.arr).toBeNull();
		});
	});

	describe("With a missing array", () => {

		test("Should throw error if not optional", () => {
			const parser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeArray()
					.withName("arr")
					.build()
			);
			expect(() => parser.parse("{}")).toThrow(ConfigParseFailureError);
			expect(getErrorsOfType(parser, MissingRequiredFieldError).length).toBe(1);
		});

		test ("Should parse if optional", () => {
			const parser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeArray()
					.withName("arr")
					.isOptional()
					.build()
			);
			type Result = {arr?: unknown[]};

			const result: Result = parser.parse("{}") as Result;
			expect(result.arr).toBeUndefined();
		});
	});

	describe("With only one allowed type as elements", () => {
	
		type ArrayTypeTestInput = {
			elemType: ElementType,
			type: string,
			valid: unknown[],
			invalid: unknown[],
			mixed: unknown[]
		};

		describe.each<ArrayTypeTestInput>([
			{
				elemType: ElementType.STRING,
				type: "string",
				valid: ["a", "b"],
				invalid: [1, 2],
				mixed: ["a", 2]
			},
			{
				elemType: ElementType.NUMBER,
				type: "number",
				valid: [1, 2],
				invalid: ["a", "b"],
				mixed: [1, "b"]
			},
			{
				elemType: ElementType.BOOLEAN,
				type: "boolean",
				valid: [true, false],
				invalid: [1, 2],
				mixed: [true, 2]
			},
			{
				elemType: ElementType.ARRAY,
				type: "array",
				valid: [[1, 2], [3, 4]],
				invalid: [1, 2],
				mixed: [[1, 2], "b"]
			},
			{
				elemType: ElementType.OBJECT,
				type: "object",
				valid: [{x: 1}, {x: 2}],
				invalid: [1, 2],
				mixed: [{x: 1}, 2]
			},
		])("With $type as type", ({elemType, type, valid, invalid, mixed}) => {
			let parser: ConfigParser;
			type Result = {arr: unknown[]};

			beforeEach(() => {
				const ceb: ConfigElementBuilder = new ConfigElementBuilder()
					.ofTypeArray()
					.withName("arr");

				switch (elemType) {
					case ElementType.STRING:
						ceb.withStringArrayElements();
						break;
					case ElementType.NUMBER:
						ceb.withNumberArrayElements();
						break;
					case ElementType.BOOLEAN:
						ceb.withBooleanArrayElements();
						break;
					case ElementType.OBJECT:
						ceb.withObjectArrayElements();
						break;
					case ElementType.ARRAY:
						ceb.withArrayArrayElements();
						break;
				}

				parser = getParserWithRootAndChildren(ceb.build());
			});

			test(`Allow ${type} in ${type} array`, () => {
				const json: string = JSON.stringify({arr: valid});
				const result: Result = parser.parse(json) as Result;
				expect(result.arr.length).toBe(2);
				// TODO: (Mischa Reitsma) Just assume it is okay? cannot do this for arrays and objects, could also just "stringify" them.
				// expect(result.arr[0]).toBe(valid[0]);
				// expect(result.arr[1]).toBe(valid[1]);
			});

			test("Throw error for only invalid types in array", () => {
				const json: string = JSON.stringify({arr: invalid});
				expect(() => parser.parse(json)).toThrow(ConfigParseFailureError);
				expect(
					getErrorsOfType(parser, InvalidArrayElementTypeError).length
				).toBe(2);
			});

			test("Throw error for mixed types in array, including correct type", () => {
				const json: string = JSON.stringify({arr: mixed});
				expect(() => parser.parse(json)).toThrow(ConfigParseFailureError);
				expect(
					getErrorsOfType(parser, InvalidArrayElementTypeError).length
				).toBe(1);
			});
		});
	});

	describe("With a fixed list of element types", () => {
		let parser: ConfigParser;
		type Result = {arr: [string, number, string]};

		beforeEach(() => {
			parser = getParserWithRootAndChildren(new ConfigElementBuilder()
				.ofTypeArray()
				.withName("arr")
				.withArrayElementList(
					new StringElement(),
					new NumberElement(),
					new StringElement()
				)
				.build()
			);
		});

		test("With valid list gives result back", () => {
			const json = JSON.stringify({arr: ["1", 2, "3"]});
			const result: Result = parser.parse(json) as Result;
			expect(result.arr.length).toBe(3);
			expect(result.arr[0]).toBe("1");
			expect(result.arr[1]).toBe(2);
			expect(result.arr[2]).toBe("3");
		});

		test("With list of invalid types throws error", () => {
			const json = JSON.stringify({arr: [1, 2, 3]});
			expect(() => parser.parse(json)).toThrow(ConfigParseFailureError);
			expect(getErrorsOfType(parser, InvalidTypeError).length)
				.toBe(2);
		});

		test("With list of valid types but missing last element throws error", () => {
			const json = JSON.stringify({arr: [1, "2"]});
			expect(() => parser.parse(json)).toThrow(ConfigParseFailureError);
			expect(getErrorsOfType(parser, InvalidArrayContentsError).length)
				.toBe(1);
		});

		test("With list of valid types but adding one more element throws error", () => {
			const json = JSON.stringify({arr: [1, "2", 3, "4"]});
			expect(() => parser.parse(json)).toThrow(ConfigParseFailureError);
			expect(getErrorsOfType(parser, InvalidArrayContentsError).length)
				.toBe(1);
		});
	});

	describe("With list of allowed types", () => {
		type Result = {arr: (number | string)[] };
		
		let parser: ConfigParser;

		beforeEach(() => {
			parser = getParserWithRootAndChildren(new ConfigElementBuilder()
				.ofTypeArray()
				.withName("arr")
				.withNumberArrayElements()
				.withStringArrayElements()
				.build()
			);
		});

		test("With valid types in array should parse", () => {
			const result: Result = parser.parse(
				JSON.stringify({arr: [1, "2", 3]})
			) as Result;
			expect(result.arr.length).toBe(3);
			expect(result.arr[0]).toBe(1);
			expect(result.arr[1]).toBe("2");
			expect(result.arr[2]).toBe(3);
		});

		test("With only first type in array should parse", () => {
			const result: Result = parser.parse(
				JSON.stringify({arr: [1, 2, 3]})
			) as Result;
			expect(result.arr.length).toBe(3);
			expect(result.arr[0]).toBe(1);
			expect(result.arr[1]).toBe(2);
			expect(result.arr[2]).toBe(3);
		});

		test("With only second type in array should parse", () => {
			const result: Result = parser.parse(
				JSON.stringify({arr: ["1", "2", "3"]})
			) as Result;
			expect(result.arr.length).toBe(3);
			expect(result.arr[0]).toBe("1");
			expect(result.arr[1]).toBe("2");
			expect(result.arr[2]).toBe("3");
		});

		test("With invalid types mixed in throws error", () => {
			expect(() => parser.parse(
				JSON.stringify({arr: [1, "two", true]})
			)).toThrow(ConfigParseFailureError);
			expect(getErrorsOfType(parser, InvalidArrayElementTypeError).length)
				.toBe(1);
		});
	});

	describe("With null elements in array", () => {
		const json: string = "{\"arr\": [null]}";
		type Result = { arr: string[] };
		test("Parses if allow null elements and allow any type", () => {
			const parser: ConfigParser = getParserWithRootAndChildren(
					new ConfigElementBuilder()
						.ofTypeArray()
						.withName("arr")
						.withAllowArrayNullElements()
						.build()
			);

			const result: Result = parser.parse(json) as Result;
			expect(result.arr.length).toBe(1);
			expect(result.arr[0]).toBeNull();
		});

		test("Parses if allow null elements and allow fixed list", () => {
			const parser: ConfigParser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeArray()
					.withName("arr")
					.withArrayElementList(new StringElement())
					.withAllowArrayNullElements()
					.build()
			);	

			const result: Result = parser.parse(json) as Result;
			expect(result.arr.length).toBe(1);
			expect(result.arr[0]).toBeNull();

		});

		test("Parses if allow null elements and allow string elements", () => {
			const parser: ConfigParser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeArray()
					.withName("arr")
					.withStringArrayElements()
					.withAllowArrayNullElements()
					.build()
			);

			const result: Result = parser.parse(json) as Result;
			expect(result.arr.length).toBe(1);
			expect(result.arr[0]).toBeNull();
		});

		test("Throws error if not allow null elements and allow any type", () => {
			const parser: ConfigParser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeArray()
					.withName("arr")
					.build()
			);
			expect(() => parser.parse(json)).toThrow(ConfigParseFailureError);
			expect(getErrorsOfType(parser, NullArrayElementError).length).toBe(1);
		});

		test("Throws error if not allow null elements and allow fixed list", () => {
			const parser: ConfigParser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeArray()
					.withArrayElementList(new StringElement())
					.withName("arr")
					.build()
			);	

			expect(() => parser.parse(json)).toThrow(ConfigParseFailureError);
			expect(getErrorsOfType(parser, NullArrayElementError).length).toBe(1);

		});

		test("Throws error if not allow null elements and allow string elements", () => {
			const parser: ConfigParser = getParserWithRootAndChildren(
				new ConfigElementBuilder()
					.ofTypeArray()
					.withStringArrayElements()
					.withName("arr")
					.build()
			);

			expect(() => parser.parse(json)).toThrow(ConfigParseFailureError);
			expect(getErrorsOfType(parser, NullArrayElementError).length).toBe(1);
		});
	});

	test("With no specified type parses", () => {
		const json = JSON.stringify({arr: [
			1,
			"2",
			true,
			[1, 2, 3],
			{k: "v"}
		]});

		const parser: ConfigParser = getParserWithRootAndChildren(
			new ConfigElementBuilder().ofTypeArray().withName("arr").build()
		);

		const result = parser.parse(json) as {arr: unknown[]};
		expect(result.arr.length).toBe(5);
		expect(result.arr[0]).toBe(1);
		expect(result.arr[1]).toBe("2");
		expect(result.arr[2]).toBe(true);
		// TODO: (Mischa Reitsma) Maybe assert last 2 as well
	});
});

describe("Parsing config with $comment fields", () => {
	const json: string = JSON.stringify({x: 1, "$comment": "some comment"});
	const root: ObjectElement = new ConfigElementBuilder().ofTypeObject().withChildElements(
		new ConfigElementBuilder().ofTypeNumber().withName("x").build()
	).build() as ObjectElement;

	test("With not specifying to prune does prune", () => {
		const parser: ConfigParser = new ConfigParser(root);
		const result: object = parser.parse(json) as object;
		expect("x" in result).toBe(true);
		expect("$comment" in result).toBe(false);
	});

	test("With specifying to prune does prune", () => {
		const parser: ConfigParser = new ConfigParser(root, {pruneDollarElements: true});
		const result: object = parser.parse(json) as object;
		expect("x" in result).toBe(true);
		expect("$comment" in result).toBe(false);
	});

	test("With specifying to not prune does not prune", () => {
		const parser: ConfigParser = new ConfigParser(root, {pruneDollarElements: false});
		const result: object = parser.parse(json) as object;
		expect("x" in result).toBe(true);
		expect("$comment" in result).toBe(true);
	});
});
