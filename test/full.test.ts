/**
 * Full test with one JSON where the root is an array, the other where the root is an object.
 */

import { ConfigParser } from "../src/parser";
import { ArrayElement, ConfigElement, ConfigElementBuilder } from "../src/elements";

import * as fs from "node:fs";

interface FullConfigInterface {
	name: string;
	objectArray: {name: string, value: number}[];
	deep: {deeper: {evenDeeper: { deepest: boolean}}};
	canBeNull: string;
	true: boolean;
	false: boolean;
	int: number;
	float: number;
	string: string,
	array: (string | number)[];
}

const root: ConfigElement = new ConfigElementBuilder()
	.ofTypeObject()
	.withChildElements(
		new ConfigElementBuilder().ofTypeString().withName("name").build(),
		new ConfigElementBuilder().ofTypeArray().withName("objectArray").build(),
		new ConfigElementBuilder().ofTypeObject().withName("deep").withChildElements(
			new ConfigElementBuilder().ofTypeObject().withName("deeper")
				.withChildElements(
					new ConfigElementBuilder().ofTypeObject()
						.withName("evenDeeper").withChildElements(
							new ConfigElementBuilder()
								.ofTypeBoolean().withName("deepest")
								.build()
					).build()
			).build()
		).build(),
		new ConfigElementBuilder().ofTypeString().withName("canBeNull").canBeNull().build(),
		new ConfigElementBuilder().ofTypeBoolean().withName("true").build(),
		new ConfigElementBuilder().ofTypeBoolean().withName("false").build(),
		new ConfigElementBuilder().ofTypeNumber().withName("int").build(),
		new ConfigElementBuilder().ofTypeNumber().withName("float").build(),
		new ConfigElementBuilder().ofTypeString().withName("string").build(),
		new ConfigElementBuilder().ofTypeArray().withName("array").build()
	).build();

const parser = new ConfigParser(root);

interface FullConfigTestInput {
	fullConfig: FullConfigInterface;
	description: string;
}

const fullConfigTestInputs: FullConfigTestInput[] = [];

fullConfigTestInputs.push({
	fullConfig: parser.parse(
		fs.readFileSync(__dirname + "/full.json", "utf-8")
	) as FullConfigInterface,
	description: "Full config in root of the configuration"
});

const rootArray: ArrayElement = new ConfigElementBuilder()
	.ofTypeArray()
	.withObjectArrayElements(root)
	.build() as ArrayElement;

const arrayParser: ConfigParser = new ConfigParser(rootArray);
const arrayConfig: FullConfigInterface[] = arrayParser.parse(
	fs.readFileSync(__dirname + "/fullArray.json", "utf-8")
) as FullConfigInterface[];

test("Expect two elements in the parser array config", () => {
	expect(arrayConfig).toHaveLength(2);

});

fullConfigTestInputs.push(
	{fullConfig: arrayConfig[0], description: "Root array config first element"}
);
fullConfigTestInputs.push(
	{fullConfig: arrayConfig[1], description: "Root array config second element"}
);

describe.each<FullConfigTestInput>(fullConfigTestInputs)(
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	"$description", ({fullConfig, description}) => {
		test("Name to be the correct value", () => {
			expect(fullConfig.name).toBe("someName");
		});
		
		describe("Has an objectArray element", () => {
			describe.each<number>([0, 1])("With entry number %i", (i) => {
				test("Having the correct name", () => {
					expect(fullConfig.objectArray[i].name)
						.toBe(`arrayEntry${i+1}`);
				});
		
				test("Having the correct value", () => {
					expect(fullConfig.objectArray[i].value).toBe(i+1);
				});
			});
		});
		
		test("Has a deep.deeper.evenDeeper.deepest boolean", () => {
			expect(fullConfig.deep.deeper.evenDeeper.deepest).toBe(true);
		});
		
		test("Expect a null element", () => {
			expect(fullConfig.canBeNull).toBeNull();
		});
		
		test("Expect a boolean that is true", () => {
			expect(fullConfig.true).toBe(true);
		});
		
		test("Expect a boolean that is false", () => {
			expect(fullConfig.false).toBe(false);
		});
		
		test("Expect an integer", () => {
			expect(fullConfig.int).toBe(1);
		});
		
		test("Expect a float", () => {
			expect(fullConfig.float).toBe(3.141592653589793);
		});
		
		test("Expect a string", () => {
			expect(fullConfig.string).toBe("some nice string");
		});
		
		test("Expect an array", () => {
			expect(fullConfig.array).toHaveLength(3);
			expect(fullConfig.array[0]).toBe(1);
			expect(fullConfig.array[1]).toBe("two");
			expect(fullConfig.array[2]).toBe(3.0);
		});
});
