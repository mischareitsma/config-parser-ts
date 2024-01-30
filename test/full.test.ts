/**
 * Full test with one JSON where the root is an array, the other where the root is an object.
 */

import { ConfigElement, ConfigElementBuilder } from "../src/elements";

// interface FullConfigInterface {
// 	name: string;
// 	objectArray: {name: string, value: number}[];
// 	deep: {deeper: {evenDeeper: { deepest: boolean}}};
// 	canBeNull: string;
// 	true: boolean;
// 	false: boolean;
// 	int: number;
// 	float: number;
// 	string: string,
// 	array: (string | number)[];
// }

// const root: ConfigElement = new ConfigElement("root");
// root.addChild(new ConfigElement("name", "string"));
// root.addChild(new ConfigElement("canBeNull", "string"));
// root.addChild(new ConfigElement("true", "boolean"));
// root.addChild(new ConfigElement("false", "boolean"));
// root.addChild(new ConfigElement("int", "number"));
// root.addChild(new ConfigElement("float", "number"));
// root.addChild(new ConfigElement("string", "string"));

// const array: ConfigElement = new ConfigElement("array", "number", "string");
// array.setIsArray();

// const objectArray: ConfigElement = new ConfigElement("objectArray", "object");
// objectArray.setIsArray();
// objectArray.addChild()

// const parser: ConfigParser = new ConfigParser(root, false);

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

test("something", () => {
	expect(root.getName()).toBeUndefined();
});
