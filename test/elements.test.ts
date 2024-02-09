import {
	ArrayElement,
	BooleanElement,
	ConfigElement,
	InvalidConfigurationElementError,
	NumberElement,
	ObjectElement,
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

describe("Given an boolean element", () => {

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

describe("Given an number element", () => {

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

describe("Given an string element", () => {

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
