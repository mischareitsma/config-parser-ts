import {
	ArrayElement,
	BooleanElement,
	BuilderArrayElementTypeError,
	BuilderElementTypeDeterminedError,
	BuilderElementTypeNotPrimitiveError,
	BuilderElementTypeUndeterminedError,
	BuilderMissingOrInvalidOfTypeError,
	ConfigElement,
	ConfigElementBuilder,
	InvalidConfigurationElementError,
	NumberElement,
	ObjectElement,
	PrimitiveElement,
	StringElement,
} from "../src/elements";

interface CorrectTypeTestInput {
	type: string;
	input: unknown;
}

const correctTypeTestInputs: CorrectTypeTestInput[] = [
	{type: "string", input: "hi"},
	{type: "number", input: 42},
	{type: "boolean", input: true},
	{type: "array", input: [1, 2]},
	{type: "object", input: {x: 1}}
];

describe("Given an object element", () => {

	const currentType: string = "object";

	const child1 = new StringElement();
	child1.setName("child1");

	const child2 = new StringElement();
	child2.setIsRequired(false);
	child2.setName("child2");

	let objectElement: ObjectElement;

	beforeEach(() => {
		objectElement = new ObjectElement();
	});

	test.each<CorrectTypeTestInput>(correctTypeTestInputs)(
		`Calling isCorrectType with input type $type on a ${currentType} element`,
		({type, input}) => {
			expect(objectElement.isCorrectType(input)).toBe(type === currentType);
		});

	test("Adding one child adds the child to the object element", () => {
		objectElement.addChild(child1);
		expect(objectElement.getChild(child1.getName())).toBeDefined();
	});

	test("Adding two children adds the children to the object element", () => {
		objectElement.addChildren(child1, child2);
		expect(objectElement.getChild(child1.getName())).toBeDefined();
		expect(objectElement.getChild(child2.getName())).toBeDefined();
	});

	test("Setting children sets all children, overwriting any old children", () => {
		objectElement.addChild(child1);

		const map: Map<string, ConfigElement> = new Map();
		map.set(child2.getName(), child2);

		objectElement.setChildren(map);
		expect(objectElement.getChild(child1.getName())).toBeUndefined();
		expect(objectElement.getChild(child2.getName())).toBeDefined();
	});

	test("getting field names of children", () => {
		objectElement.addChildren(child1, child2);
		const childNames: string[] = objectElement.getChildFieldNames();
		expect(childNames.length).toBe(2);
		expect(childNames.includes(child1.getName())).toBe(true);
		expect(childNames.includes(child2.getName())).toBe(true);
	});

	test("getting required children", () => {
		objectElement.addChildren(child1, child2);
		const requiredChildren: string[] = objectElement.getRequiredChildren();
		expect(requiredChildren.length).toBe(1);
		expect(requiredChildren.includes(child1.getName())).toBe(true);
		expect(requiredChildren.includes(child2.getName())).toBe(false);
	});
});

describe("Given an array element", () => {

	const currentType: string = "array";
	let arrayElement: ArrayElement;

	beforeEach(() => {
		arrayElement = new ArrayElement();
	});
	
	test.each<CorrectTypeTestInput>(correctTypeTestInputs)(
		`Calling isCorrectType with input type $type on a ${currentType} element`,
		({type, input}) => {
			expect(arrayElement.isCorrectType(input)).toBe(type === currentType);
		});

	interface AllowTypedElementsTestInput {
		type: "number" | "boolean" | "string" | "object" | "array";
		element: ConfigElement;
	}

	const allowedTypedElementsTestInput: AllowTypedElementsTestInput[] = [
		{ type: "number", element: new NumberElement()},
		{ type: "boolean", element: new BooleanElement() },
		{ type: "string", element: new StringElement() },
		{ type: "object", element: new ObjectElement() },
		{ type: "array", element: new ArrayElement() }
	];

	const types: string[] = ["number", "boolean", "string", "object", "array"];

	describe.each<AllowTypedElementsTestInput>(allowedTypedElementsTestInput)(
		"Using getElementConfig and allowAbcElements for type $type", ({type, element}) => 
	{
		
		function allowElement(
			type: "number" | "boolean" | "string" | "object" | "array",
			element?: ConfigElement
		) {
			switch (type) {
				case "number":
					arrayElement.allowNumberElements(element as NumberElement);
					break;
				case "boolean":
					arrayElement.allowBooleanElements(
						element as BooleanElement
					);
					break;
				case "string":
					arrayElement.allowStringElements(element as StringElement);
					break;
				case "object":
					arrayElement.allowObjectElements(element as ObjectElement);
					break;
				case "array":
					arrayElement.allowArrayElements(element as ArrayElement);
					break;
			}
		}

		test("Calling getElementConfig on an empty ArrayElement returns undefined", () => {
			expect(arrayElement.getElementConfig(type)).toBeUndefined();
		});

		test("Calling allowAbcElements() and getElementConfig returns config", () => {
			element.setName(type);
			allowElement(type, element);
			const configElement: ConfigElement = arrayElement.getElementConfig(type);
			expect(configElement).toBeDefined();
			expect(configElement).toBeInstanceOf(ConfigElement);
			expect(configElement.getName()).toBe(type);
		});

		test("Calling allowAbcElements without element returns default config", () => {
			allowElement(type);
			const configElement: ConfigElement = arrayElement.getElementConfig(type);
			expect(configElement).toBeDefined();
			expect(configElement).toBeInstanceOf(ConfigElement);
			expect(configElement.getName()).toBeUndefined();
		});

		test("Calling allowAbcElements with a ordered element list throws error", () => {
			arrayElement.setOrderedElements(new StringElement());
			expect(() => allowElement(type)).toThrow(InvalidConfigurationElementError);
		});

		test.each<string>(types)("Test isValidElementType by adding %s", typeToAdd => {
			// TODO: (Mischa Reitsma) This can be nicer with type magic :-)
			allowElement(
				typeToAdd as "number" | "boolean" | "string" | "object" | "array"
			);
			expect(arrayElement.isValidElementType(type)).toBe(type === typeToAdd);
		});
	});

	test("Empty arrayElement allows any element", () => {
		expect(arrayElement.allowAnyElement()).toBe(true);
	});

	test("Array element with allowStringElement() does not allow any", () => {
		arrayElement.allowStringElements();
		expect(arrayElement.allowAnyElement()).toBe(false);
	});

	test("Array element with ordered elements does not allow any", () => {
		arrayElement.setOrderedElements(new StringElement());
		expect(arrayElement.allowAnyElement()).toBe(false);
	});

	test("set/getAllowNullElements()", () => {
		// Default is false
		expect(arrayElement.allowNullElements()).toBe(false);
		arrayElement.setAllowNullElements();
		// Now flipped to true
		expect(arrayElement.allowNullElements()).toBe(true);
	});

	test("set ordered elements with allowStringElement throws error", () => {
		arrayElement.allowStringElements();
		expect(() => arrayElement.setOrderedElements(new StringElement())).toThrow(
			InvalidConfigurationElementError
		);
	});

	test("set ordered elements, then get ordered elements", () => {
		arrayElement.setOrderedElements(new StringElement(), new BooleanElement());
		const orderedElements: ConfigElement[] = arrayElement.getOrderedElements();
		expect(orderedElements.length).toBe(2);
		expect(orderedElements[0]).toBeInstanceOf(StringElement);
		expect(orderedElements[1]).toBeInstanceOf(BooleanElement);
	});

	test("is correct type for an array", () => {
		expect(arrayElement.isCorrectType([1, 2])).toBe(true);
	});

	test("is incorrect type for primitive types", () => {
		expect(arrayElement.isCorrectType(1)).toBe(false);
		expect(arrayElement.isCorrectType(false)).toBe(false);
		expect(arrayElement.isCorrectType("I am an array")).toBe(false);
	});

	test("is incorrect type for an object", () => {
		expect(arrayElement.isCorrectType({x: 1})).toBe(false);
	});

});

describe("Given a boolean element", () => {

	const currentType: string = "boolean";
	let booleanElement: BooleanElement;

	beforeEach(() => {
		booleanElement = new BooleanElement();
	});
	
	test.each<CorrectTypeTestInput>(correctTypeTestInputs)(
		`Calling isCorrectType with input type $type on a ${currentType} element`,
		({type, input}) => {
			expect(booleanElement.isCorrectType(input)).toBe(type === currentType);
		});

	test("set/get default value", () => {
		expect(booleanElement.getDefaultValue()).toBeUndefined();
		booleanElement.setDefaultValue(true);
		expect(booleanElement.getDefaultValue()).toBe(true);
	});
});

describe("Given a number element", () => {

	const currentType: string = "number";
	let numberElement: NumberElement;

	beforeEach(() => {
		numberElement = new NumberElement();
	});

	test.each<CorrectTypeTestInput>(correctTypeTestInputs)(
		`Calling isCorrectType with input type $type on a ${currentType} element`,
		({type, input}) => {
			expect(numberElement.isCorrectType(input)).toBe(type === currentType);
		});

	test("set/get default value", () => {
		expect(numberElement.getDefaultValue()).toBeUndefined();
		numberElement.setDefaultValue(1.23);
		expect(numberElement.getDefaultValue()).toBe(1.23);
	});

	test("set/get min", () => {
		expect(numberElement.getMinValue()).toBeUndefined();
		numberElement.setMinValue(1);
		expect(numberElement.getMinValue()).toBe(1);
	});

	test("set/get max", () => {
		expect(numberElement.getMaxValue()).toBeUndefined();
		numberElement.setMaxValue(2);
		expect(numberElement.getMaxValue()).toBe(2);

	});
});

describe("Given a string element", () => {

	const currentType: string = "string";
	let stringElement: StringElement;

	beforeEach(() => {
		stringElement = new StringElement();
	});

	test.each<CorrectTypeTestInput>(correctTypeTestInputs)(
		`Calling isCorrectType with input type $type on a ${currentType} element`,
		({type, input}) => {
			expect(stringElement.isCorrectType(input)).toBe(type === currentType);
		});

	test("set/get default value", () => {
		expect(stringElement.getDefaultValue()).toBeUndefined();
		stringElement.setDefaultValue("some nice string");
		expect(stringElement.getDefaultValue()).toBe("some nice string");
	});

	test("set/get min", () => {
		expect(stringElement.getMinLength()).toBeUndefined();
		stringElement.setMinLength(1);
		expect(stringElement.getMinLength()).toBe(1);
	});

	test("set/get max", () => {
		expect(stringElement.getMaxLength()).toBeUndefined();
		stringElement.setMaxLength(2);
		expect(stringElement.getMaxLength()).toBe(2);

	});
});

describe("given an element builder", () => {
	test("calling build() without any other methods throws an error", () => {
		expect(() => {
			new ConfigElementBuilder().build();
		}).toThrow(BuilderElementTypeUndeterminedError);
	});

	test("Calling .ofTypeObject().build() returns an ObjectElement", () => {
		expect(new ConfigElementBuilder().ofTypeObject().build())
			.toBeInstanceOf(ObjectElement);
	});

	test("Calling .ofTypeArray().build() returns an ArrayElement", () => {
		expect(new ConfigElementBuilder().ofTypeArray().build())
			.toBeInstanceOf(ArrayElement);
	});

	test("Calling .ofTypeNumber().build() returns an NumberElement", () => {
		expect(new ConfigElementBuilder().ofTypeNumber().build())
			.toBeInstanceOf(NumberElement);
	});

	test("Calling .ofTypeBoolean().build() returns an BooleanElement", () => {
		expect(new ConfigElementBuilder().ofTypeBoolean().build())
			.toBeInstanceOf(BooleanElement);
	});

	test("Calling .ofTypeString().build() returns an StringElement", () => {
		expect(new ConfigElementBuilder().ofTypeString().build())
			.toBeInstanceOf(StringElement);
	});

	test("Calling .ofTypeObject() with type already set throws error", () => {
		expect(() => {
			new ConfigElementBuilder().ofTypeString().ofTypeObject();
		}).toThrow(BuilderElementTypeDeterminedError);
	});

	test("Calling .ofTypeArray() with type already set throws error", () => {
		expect(() => {
			new ConfigElementBuilder().ofTypeString().ofTypeArray();
		}).toThrow(BuilderElementTypeDeterminedError);
	});

	test("Calling .ofTypeNumber() with type already set throws error", () => {
		expect(() => {
			new ConfigElementBuilder().ofTypeString().ofTypeNumber();
		}).toThrow(BuilderElementTypeDeterminedError);
	});

	test("Calling .ofTypeBoolean() with type already set throws error", () => {
		expect(() => {
			new ConfigElementBuilder().ofTypeString().ofTypeBoolean();
		}).toThrow(BuilderElementTypeDeterminedError);
	});

	test("Calling .ofTypeString() with type already set throws error", () => {
		expect(() => {
			new ConfigElementBuilder().ofTypeObject().ofTypeString();
		}).toThrow(BuilderElementTypeDeterminedError);
	});

	test("withMinLength sets the minimum length of the build StringElement", () => {
		const se: StringElement = new ConfigElementBuilder()
			.ofTypeString().withMinLength(10).build() as StringElement;
		expect(se.getMinLength()).toBe(10);
	});

	test("Calling .ofTypeObject().withMinLength() throws an error", () => {
		expect(() => {
			new ConfigElementBuilder().ofTypeObject().withMinLength(10);
		}).toThrow(BuilderMissingOrInvalidOfTypeError);
	});

	test("withMaxLength sets the maximum length of the build StringElement", () => {
		const se: StringElement = new ConfigElementBuilder()
			.ofTypeString().withMaxLength(10).build() as StringElement;
		expect(se.getMaxLength()).toBe(10);
	});

	test("Calling .ofTypeObject().withMaxLength() throws an error", () => {
		expect(() => {
			new ConfigElementBuilder().ofTypeObject().withMaxLength(10);
		}).toThrow(BuilderMissingOrInvalidOfTypeError);
	});

	test("withMinValue sets the minimum value of the build NumberElement", () => {
		const se: NumberElement = new ConfigElementBuilder()
			.ofTypeNumber().withMinValue(10).build() as NumberElement;
		expect(se.getMinValue()).toBe(10);
	});

	test("Calling .ofTypeObject().withMinValue() throws an error", () => {
		expect(() => {
			new ConfigElementBuilder().ofTypeObject().withMinValue(10);
		}).toThrow(BuilderMissingOrInvalidOfTypeError);
	});

	test("withMaxValue sets the maximum value of the build NumberElement", () => {
		const se: NumberElement = new ConfigElementBuilder()
			.ofTypeNumber().withMaxValue(10).build() as NumberElement;
		expect(se.getMaxValue()).toBe(10);
	});

	test("Calling .ofTypeObject().withMaxValue() throws an error", () => {
		expect(() => {
			new ConfigElementBuilder().ofTypeObject().withMaxValue(10);
		}).toThrow(BuilderMissingOrInvalidOfTypeError);
	});

	// The following two can be tested on any element type, as it is using a method on
	// the ConfigElement class.
	test("Calling canBeNull() allows the element to be null", () => {
		expect(
			new ConfigElementBuilder().ofTypeString().canBeNull().build().canBeNull()
		).toBe(true);
	});

	test("Calling canBeNull() allows the element to be null", () => {
		expect(
			new ConfigElementBuilder().ofTypeString().isOptional().build().isRequired()
		).toBe(false);
	});

	// Following can be done on any primitive type, calling methods on the PrimitiveElement.
	test("Calling withDefaultValue() will set a default value", () => {
		const pe: PrimitiveElement = new ConfigElementBuilder()
			.ofTypeString()
			.withDefaultValue("Hi!")
			.build() as PrimitiveElement;

		expect(pe.getDefaultValue()).toBe("Hi!");
	});

	test("Calling withDefaultValue on an object type builder throws an error", () => {
		expect(() => {
			new ConfigElementBuilder().ofTypeObject().withDefaultValue("{\"x\": 1}");
		}).toThrow(BuilderElementTypeNotPrimitiveError);
	});

	test("Calling withChildElements() adds child elements", () => {
		const oe: ObjectElement = new ConfigElementBuilder().ofTypeObject()
			.withChildElements(
				new ConfigElementBuilder().ofTypeString().withName("s").build(),
				new ConfigElementBuilder().ofTypeNumber().withName("x").build()
			).build() as ObjectElement;
		
		const childFieldNames: string[] = oe.getChildFieldNames();
		expect(childFieldNames).toContain("x");
		expect(childFieldNames).toContain("s");
	});

	test("Calling ofTypeString().withChildElements() throws an error", () => {
		expect(() => {
			new ConfigElementBuilder().ofTypeString().withChildElements();
		}).toThrow(BuilderMissingOrInvalidOfTypeError);
	});

	test("Calling withName() will set the name on the config element", () => {
		expect(new ConfigElementBuilder().ofTypeString().withName("s").build().getName())
			.toBe("s");
	});

	test("Calling withAllowArrayNullElements should set allowNullElements to true", () => {
		const ae: ArrayElement = new ConfigElementBuilder().ofTypeArray()
			.withAllowArrayNullElements().build() as ArrayElement;
		expect(ae.allowNullElements()).toBe(true);
	});

	test("Calling withAllowArrayNullElements before calling ofTypeArray throws error", () => {
		expect(() => {
			new ConfigElementBuilder().withAllowArrayNullElements();
		}).toThrow(BuilderMissingOrInvalidOfTypeError);
	});

	describe("Calling withNumberArrayElements", () => {
		test("Without passing an elements should add a default number element", () => {
			const ae: ArrayElement = new ConfigElementBuilder().ofTypeArray()
				.withNumberArrayElements().build() as ArrayElement;

			expect(ae.getElementConfig("number")).toBeDefined();
		});

		test("Passing an element should add that number element", () => {
			const ae: ArrayElement = new ConfigElementBuilder().ofTypeArray()
				.withNumberArrayElements(
					new ConfigElementBuilder()
						.ofTypeNumber()
						.withName("num")
						.build()
				).build() as ArrayElement;

			expect(ae.getElementConfig("number")).toBeDefined();
			expect(ae.getElementConfig("number").getName()).toBe("num");
		});

		test("Passing a string element should throw an error", () => {
			expect(() => {
				new ConfigElementBuilder().ofTypeArray()
					.withNumberArrayElements(new StringElement());
			}).toThrow(BuilderArrayElementTypeError);
		});

		test("without calling ofTypeArray throws error", () => {
			expect(() => {
				new ConfigElementBuilder().withNumberArrayElements();
			}).toThrow(BuilderMissingOrInvalidOfTypeError);
		});
	});

	describe("Calling withStringArrayElements", () => {
		test("Without passing an elements should add a default string element", () => {
			const ae: ArrayElement = new ConfigElementBuilder().ofTypeArray()
				.withStringArrayElements().build() as ArrayElement;

			expect(ae.getElementConfig("string")).toBeDefined();
		});

		test("Passing an element should add that string element", () => {
			const ae: ArrayElement = new ConfigElementBuilder().ofTypeArray()
				.withStringArrayElements(
					new ConfigElementBuilder()
						.ofTypeString()
						.withName("str")
						.build()
				).build() as ArrayElement;

			expect(ae.getElementConfig("string")).toBeDefined();
			expect(ae.getElementConfig("string").getName()).toBe("str");
		});

		test("Passing a string element should throw an error", () => {
			expect(() => {
				new ConfigElementBuilder().ofTypeArray()
					.withStringArrayElements(new NumberElement());
			}).toThrow(BuilderArrayElementTypeError);
		});

		test("without calling ofTypeArray throws error", () => {
			expect(() => {
				new ConfigElementBuilder().withStringArrayElements();
			}).toThrow(BuilderMissingOrInvalidOfTypeError);
		});
	});

	describe("Calling withBooleanArrayElements", () => {
		test("Without passing an elements should add a default boolean element", () => {
			const ae: ArrayElement = new ConfigElementBuilder().ofTypeArray()
				.withBooleanArrayElements().build() as ArrayElement;

			expect(ae.getElementConfig("boolean")).toBeDefined();
		});

		test("Passing an element should add that number element", () => {
			const ae: ArrayElement = new ConfigElementBuilder().ofTypeArray()
				.withBooleanArrayElements(
					new ConfigElementBuilder()
						.ofTypeBoolean()
						.withName("bool")
						.build()
				).build() as ArrayElement;

			expect(ae.getElementConfig("boolean")).toBeDefined();
			expect(ae.getElementConfig("boolean").getName()).toBe("bool");
		});

		test("Passing a string element should throw an error", () => {
			expect(() => {
				new ConfigElementBuilder().ofTypeArray()
					.withBooleanArrayElements(new StringElement());
			}).toThrow(BuilderArrayElementTypeError);
		});

		test("without calling ofTypeArray throws error", () => {
			expect(() => {
				new ConfigElementBuilder().withBooleanArrayElements();
			}).toThrow(BuilderMissingOrInvalidOfTypeError);
		});
	});

	describe("Calling withArrayArrayElements", () => {
		test("Without passing an elements should add a default array element", () => {
			const ae: ArrayElement = new ConfigElementBuilder().ofTypeArray()
				.withArrayArrayElements().build() as ArrayElement;

			expect(ae.getElementConfig("array")).toBeDefined();
		});

		test("Passing an element should add that number element", () => {
			const ae: ArrayElement = new ConfigElementBuilder().ofTypeArray()
				.withArrayArrayElements(
					new ConfigElementBuilder()
						.ofTypeArray()
						.withName("arr")
						.build()
				).build() as ArrayElement;

			expect(ae.getElementConfig("array")).toBeDefined();
			expect(ae.getElementConfig("array").getName()).toBe("arr");
		});

		test("Passing a string element should throw an error", () => {
			expect(() => {
				new ConfigElementBuilder().ofTypeArray()
					.withArrayArrayElements(new StringElement());
			}).toThrow(BuilderArrayElementTypeError);
		});

		test("without calling ofTypeArray throws error", () => {
			expect(() => {
				new ConfigElementBuilder().withArrayArrayElements();
			}).toThrow(BuilderMissingOrInvalidOfTypeError);
		});
	});

	describe("Calling withObjectArrayElements", () => {
		test("Without passing an elements should add a default array element", () => {
			const ae: ArrayElement = new ConfigElementBuilder().ofTypeArray()
				.withObjectArrayElements().build() as ArrayElement;

			expect(ae.getElementConfig("object")).toBeDefined();
		});

		test("Passing an element should add that number element", () => {
			const ae: ArrayElement = new ConfigElementBuilder().ofTypeArray()
				.withObjectArrayElements(
					new ConfigElementBuilder()
						.ofTypeObject()
						.withName("obj")
						.build()
				).build() as ArrayElement;

			expect(ae.getElementConfig("object")).toBeDefined();
			expect(ae.getElementConfig("object").getName()).toBe("obj");
		});

		test("Passing a string element should throw an error", () => {
			expect(() => {
				new ConfigElementBuilder().ofTypeArray()
					.withObjectArrayElements(new StringElement());
			}).toThrow(BuilderArrayElementTypeError);
		});

		test("without calling ofTypeArray throws error", () => {
			expect(() => {
				new ConfigElementBuilder().withObjectArrayElements();
			}).toThrow(BuilderMissingOrInvalidOfTypeError);
		});
	});

	test("calling withArrayElementList sets the list", () => {
		const ae: ArrayElement = new ConfigElementBuilder().ofTypeArray()
			.withArrayElementList(new StringElement(), new BooleanElement())
			.build() as ArrayElement;
		expect(ae.getOrderedElements().length).toBe(2);
	});

	test("calling withArrayElementList without ofTypeArray throws error", () => {
		expect(() => {
			new ConfigElementBuilder().withArrayElementList();
		}).toThrow(BuilderMissingOrInvalidOfTypeError);
	});
});
