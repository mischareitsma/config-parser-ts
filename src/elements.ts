export type ConfigElementType = "string" | "number" | "boolean" | "array" | "object";

export abstract class ConfigElement {

	private name: string;
	private _isRequired: boolean = true;
	private _canBeNull: boolean = false;

	public isRequired(): boolean {
		return this._isRequired;
	}

	public setIsRequired(isRequired: boolean): void {
		this._isRequired = isRequired;
	}

	public canBeNull(): boolean {
		return this._canBeNull;
	}

	public setCanBeNull(canBeNull: boolean): void {
		this._canBeNull = canBeNull;
	}

	public setName(name: string) {
		this.name = name;
	}

	public getName(): string {
		return this.name;
	}

	public abstract isCorrectType(element: unknown): boolean;
}

export class ObjectElement extends ConfigElement {
	private children: Map<string, ConfigElement> = new Map();

	public setChildren(children: Map<string, ConfigElement>): void {
		this.children = children;
	}

	public addChildren(...children: ConfigElement[]) {
		children.forEach(c => this.addChild(c));
	}

	public addChild(child: ConfigElement) {
		// TODO: (Mischa Reitsma) Should we check if exists and throw error? Else document.
		this.children.set(child.getName(), child);
	}

	public getChild(childName: string): ConfigElement {
		return this.children.get(childName);
	}

	public getChildFieldNames(): string[] {
		return Array.from(this.children.keys());
	}

	public getRequiredChildren(): string[] {
		return this.getChildFieldNames().filter(c => this.children.get(c).isRequired());
	}

	public override isCorrectType(element: unknown): boolean {
		return (typeof element === "object") && !Array.isArray(element);
	}
}

/**
 * Array configuration element.
 * 
 * The array configuration elements supports two types of setting up configuration. The first
 * is by calling for each type that is allowed the *allowXyzElement()** method with a
 * ConfigElement instance of that particular type, which will be used for additional validations.
 * This supports only one 'format' of that type, so calling **allowObjectElement()** twice will
 * only validate against the second ObjectElement instance that is passed.
 * 
 * The second option is by setting the orderedElements array. This will validate the array
 * contents in an ordered way with the orderedElements contents.
 */
export class ArrayElement extends ConfigElement {

	private elements: Map<ConfigElementType, ConfigElement> = new Map();
	private allowNull: boolean = false;

	private orderedElements: ConfigElement[] = [];

	public allowNumberElements(ce?: NumberElement) {
		this.checkOrderedElementsEmpty();
		this.elements.set("number", ce || new NumberElement());
	}

	public allowBooleanElements(ce?: BooleanElement) {
		this.checkOrderedElementsEmpty();
		this.elements.set("boolean", ce || new BooleanElement());
	}

	public allowStringElements(ce?: StringElement) {
		this.checkOrderedElementsEmpty();
		this.elements.set("string", ce || new StringElement());
	}

	public allowObjectElements(ce?: ObjectElement) {
		this.checkOrderedElementsEmpty();
		this.elements.set("object", ce || new ObjectElement());
		
	}

	public allowArrayElements(ce?: ArrayElement) {
		this.checkOrderedElementsEmpty();
		this.elements.set("array", ce || new ArrayElement());
	}

	/**
	 * Allow any element. No validation is done on the contents of the array if there is
	 * nothing in the elements map or in the orderedElements list.
	 */
	public allowAnyElement(): boolean {
		return this.elements.size === 0 && this.orderedElements.length === 0;
	}

	public setAllowNullElements() {
		this.allowNull = true;
	}

	public allowNullElements(): boolean {
		return this.allowNull;
	}

	public setOrderedElements(...orderedElements: ConfigElement[]) {
		if (this.elements.size > 0) {
			throw new InvalidConfigurationElementError(
				"ArrayElement already expects allowed element validation"
			);
		}
		this.orderedElements = orderedElements;
	}

	public getOrderedElements(): ConfigElement[] {
		return this.orderedElements;
	}

	public override isCorrectType(element: unknown): boolean {
		return (typeof element === "object") && Array.isArray(element);
	}

	private checkOrderedElementsEmpty() {
		if (this.orderedElements.length > 0) {
			throw new InvalidConfigurationElementError(
				"ArrayElement already expects ordered element validation"
			);
		}
	}

	public isValidElementType(elemType: ConfigElementType): boolean {
		return this.elements.has(elemType);
	}

	public getElementConfig(elemType: ConfigElementType): ConfigElement {
		return this.elements.get(elemType);
	}
}

export abstract class PrimitiveElement extends ConfigElement {
	// TODO: (Mischa Reitsma) Could move these to the descendants, or override and narrow the type
	private defaultValue: PrimitiveJSONType;

	public setDefaultValue(defaultValue: PrimitiveJSONType): void {
		this.defaultValue = defaultValue;
	}

	public getDefaultValue(): PrimitiveJSONType {
		return this.defaultValue;
	}
}

export class BooleanElement extends PrimitiveElement {
	public override isCorrectType(element: unknown): boolean {
		return typeof element === "boolean";
	}
}

export class NumberElement extends PrimitiveElement {
	private minValue: number;
	private maxValue: number;

	public setMinValue(minValue: number): void {
		this.minValue = minValue;
	}

	public getMinValue(): number {
		return this.minValue;
	}

	public setMaxValue(maxValue: number): void {
		this.maxValue = maxValue;
	}

	public getMaxValue(): number {
		return this.maxValue;
	}

	public override isCorrectType(element: unknown): boolean {
		return typeof element === "number";
	}
}

export class StringElement extends PrimitiveElement {
	private minLength: number;
	private maxLength: number;

	public setMinLength(minLength: number): void {
		this.minLength = minLength;
	}

	public getMinLength(): number {
		return this.minLength;
	}

	public setMaxLength(maxLength: number): void {
		this.maxLength = maxLength;
	}

	public getMaxLength(): number {
		return this.maxLength;
	}

	public override isCorrectType(element: unknown): boolean {
		return typeof element === "string";
	}
}

type PrimitiveJSONType = string | number | boolean;


export enum ElementType {
	NUMBER = 1,
	BOOLEAN = 2,
	STRING = 3,
	ARRAY = 4,
	OBJECT = 5,
}

function isPrimitive(elementType: ElementType) {
	return (
		elementType === ElementType.NUMBER ||
		elementType === ElementType.BOOLEAN ||
		elementType === ElementType.STRING
	);
}

/* Some refactor notes on the builder:
Now a lot of fields on specific ConfigElements are duplicated here. We could change the builder
such that the `ofTypeXXX()` call has to precede specific calls like `withMaxLength()`, and then
as soon as the `ofTypeXXX()` call comes, we populate an internal ConfigElement field, and let
the specific calls just wrap around setters etc.

Might even need to just use the type, and then always just check that the type is non-zero for all
methods calls, forcing the `ofTypeXXX()` call as very very first call! Jep.
*/
export class ConfigElementBuilder {

	private numberElement: NumberElement;
	private booleanElement: BooleanElement;
	private stringElement: StringElement;
	private arrayElement: ArrayElement;
	private objectElement: ObjectElement;

	private type: ElementType;

	private getConfigElement(): ConfigElement {
		if (!this.type) 
			throw new BuilderElementTypeUndeterminedError();

		return this._getConfigElement();
	}

	private getPrimitiveConfigElement(): PrimitiveElement {
		if (!isPrimitive(this.type))
			throw new BuilderElementTypeNotPrimitiveError();

		return this._getConfigElement() as PrimitiveElement;

	}

	private _getConfigElement(): ConfigElement {
		switch (this.type) {
			case ElementType.OBJECT:
				return this.objectElement;
			case ElementType.ARRAY:
				return this.arrayElement;
			case ElementType.BOOLEAN:
				return this.booleanElement;
			case ElementType.NUMBER:
				return this.numberElement;
			case ElementType.STRING:
				return this.stringElement;
		}
	}

	public build(): ConfigElement {
		return this.getConfigElement();
	}

	public ofTypeObject(): ConfigElementBuilder {
		if (this.type)
			throw new BuilderElementTypeDeterminedError();

		this.type = ElementType.OBJECT;
		this.objectElement = new ObjectElement();
		return this;
	}

	public ofTypeArray(): ConfigElementBuilder {
		if (this.type)
			throw new BuilderElementTypeDeterminedError();

		this.type = ElementType.ARRAY;
		this.arrayElement = new ArrayElement();
		return this;
	}

	public ofTypeBoolean(): ConfigElementBuilder {
		if (this.type)
			throw new BuilderElementTypeDeterminedError();

		this.type = ElementType.BOOLEAN;
		this.booleanElement = new BooleanElement();
		return this;
	}

	public ofTypeNumber(): ConfigElementBuilder {
		if (this.type)
			throw new BuilderElementTypeDeterminedError();

		this.type = ElementType.NUMBER;
		this.numberElement = new NumberElement();
		return this;
	}

	public ofTypeString(): ConfigElementBuilder {
		if (this.type)
			throw new BuilderElementTypeDeterminedError();

		this.type = ElementType.STRING;
		this.stringElement = new StringElement();
		return this;
	}

	public withMinLength(min: number): ConfigElementBuilder {
		if (!this.stringElement) {
			throw new BuilderMissingOrInvalidOfTypeError(
				"ofTypeString",
				"withMinLength"
			);
		}

		this.stringElement.setMinLength(min);
		return this;
	}

	public withMaxLength(max: number): ConfigElementBuilder {
		if (!this.stringElement) {
			throw new BuilderMissingOrInvalidOfTypeError(
				"ofTypeString",
				"withMaxLength"
			);
		}

		this.stringElement.setMaxLength(max);
		return this;
	}

	public withMinValue(min: number): ConfigElementBuilder {
		if (!this.numberElement) {
			throw new BuilderMissingOrInvalidOfTypeError(
				"ofTypeNumber",
				"withMinValue"
			);
		}

		this.numberElement.setMinValue(min);
		return this;
	}

	public withMaxValue(max: number): ConfigElementBuilder {
		if (!this.numberElement) {
			throw new BuilderMissingOrInvalidOfTypeError(
				"ofTypeNumber",
				"withMaxValue"
			);
		}

		this.numberElement.setMaxValue(max);
		return this;
	}

	public canBeNull(): ConfigElementBuilder {
		this.getConfigElement().setCanBeNull(true);
		return this;
	}

	public isOptional(): ConfigElementBuilder {
		this.getConfigElement().setIsRequired(false);
		return this;
	}

	public withDefaultValue(value: PrimitiveJSONType) {
		this.getPrimitiveConfigElement().setDefaultValue(value);
		return this;
	}

	public withChildElements(...children: ConfigElement[]): ConfigElementBuilder {
		if (!this.objectElement) {
			throw new BuilderMissingOrInvalidOfTypeError(
				"ofTypeObject",
				"withChildElements"
			);
		}

		this.objectElement.addChildren(...children);

		return this;
	}

	public withName(name: string) {
		this.getConfigElement().setName(name);
		return this;
	}

	public withNumberArrayElements(ce?: ConfigElement) {
		if (!this.arrayElement) {
			throw new BuilderMissingOrInvalidOfTypeError(
				"ofTypeArray",
				"withNumberArrayElements"
			);
		}
		if (ce && !(ce instanceof NumberElement))
			throw new BuilderArrayElementTypeError("NumberElement");

		this.arrayElement.allowNumberElements(ce as NumberElement);
		return this;
	}

	public withStringArrayElements(ce?: ConfigElement) {
		if (!this.arrayElement) {
			throw new BuilderMissingOrInvalidOfTypeError(
				"ofTypeArray",
				"withStringElement"
			);
		}
		if (ce && !(ce instanceof StringElement))
			throw new BuilderArrayElementTypeError("StringElement");

		this.arrayElement.allowStringElements(ce as StringElement);
		return this;
	}

	public withBooleanArrayElements(ce?: ConfigElement) {
		if (!this.arrayElement) {
			throw new BuilderMissingOrInvalidOfTypeError(
				"ofTypeArray",
				"withBooleanArrayElements"
			);
		}
		if (ce && !(ce instanceof BooleanElement))
			throw new BuilderArrayElementTypeError("BooleanElement");

		this.arrayElement.allowBooleanElements(ce as BooleanElement);
		return this;
	}

	public withArrayArrayElements(ce?: ConfigElement) {
		if (!this.arrayElement) {
			throw new BuilderMissingOrInvalidOfTypeError(
				"ofTypeArray",
				"withArrayArrayElements"
			);
		}
		if (ce && !(ce instanceof ArrayElement))
			throw new BuilderArrayElementTypeError("ArrayElement");

		this.arrayElement.allowArrayElements(ce as ArrayElement);
		return this;
	}

	public withObjectArrayElements(ce?: ConfigElement) {
		if (!this.arrayElement) {
			throw new BuilderMissingOrInvalidOfTypeError(
				"ofTypeArray",
				"withObjectArrayElements"
			);
		}
		if (ce && !(ce instanceof ObjectElement))
			throw new BuilderArrayElementTypeError("ObjectElement");

		this.arrayElement.allowObjectElements(ce as ObjectElement);
		return this;
	}

	public withArrayElementList(...elementList: ConfigElement[]) {
		if (!this.arrayElement) {
			throw new BuilderMissingOrInvalidOfTypeError(
				"ofTypeArray",
				"withArrayElementList"
			);
		}

		this.arrayElement.setOrderedElements(...elementList);
		return this;
	}

	public withAllowArrayNullElements() {
		if (!this.arrayElement) {
			throw new BuilderMissingOrInvalidOfTypeError(
				"ofTypeArray",
				"withAllowArrayNullElements"
			);
		}

		this.arrayElement.setAllowNullElements();
		return this;
	}
}

export class InvalidConfigurationElementError extends Error {}

export class ConfigElementBuilderError extends Error {}

export class BuilderMissingOrInvalidOfTypeError extends ConfigElementBuilderError {
	constructor(ofTypeMethod: string, actualMethod: string) {
		super(`Call to ${ofTypeMethod}() needs to precede ${actualMethod}()`);
	}
}

export class BuilderElementTypeUndeterminedError extends ConfigElementBuilderError {
	constructor() {
		super("Element type undetermined");
	}
}

export class BuilderElementTypeDeterminedError extends ConfigElementBuilderError {
	constructor() {
		super("Element type already determined");
	}
}

export class BuilderElementTypeNotPrimitiveError extends ConfigElementBuilderError {
	constructor() {
		super("Element type not primitive");
	}
}

// throw BuilderArrayElementTypeError("NumberElement")
export class BuilderArrayElementTypeError extends ConfigElementBuilderError {
	constructor(expectedInstance: string) {
		super(`Invalid ConfigElement instance passed, expected ${expectedInstance}`);
	}
}
