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
	private children: Map<string, ConfigElement>;

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
		return typeof element === "object";
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

	private elements: Map<string, ConfigElement> = new Map();
	private allowNull: boolean = false;

	private orderedElements: ConfigElement[] = [];

	public allowNumberElements(ce: NumberElement) {
		this.checkOrderedElementsEmpty();
		this.elements.set("number", ce);
	}

	public allowBooleanElements(ce: BooleanElement) {
		this.elements.set("boolean", ce);
	}

	public allowStringElements(ce: StringElement) {
		this.elements.set("string", ce);
	}

	public allowObjectElements(ce: ObjectElement) {
		this.elements.set("object", ce);
		
	}

	public allowArrayElements(ce: ArrayElement) {
		this.elements.set("array", ce);
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

	public setOrderedElements(orderedElements: ConfigElement[]) {
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

	public isValidElementType(elemType: string): boolean {
		return this.elements.has(elemType);
	}

	public getElementConfig(elemType: string): ConfigElement {
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

export class ConfigElementBuilder {

	private type: number = 0;
	private name: string;

	// TODO: (Mischa Reitsma) Implement array types. In case of objects, also define structure
	// private arrayType: number = 0;

	private minLength: number;
	private maxLength: number;
	private minValue: number;
	private maxValue: number;
	private _canBeNull: boolean = false;
	private _isRequired: boolean = true;
	// TODO: (Mischa Reitsma) Could extends this to also accept JSON strings (objects) and arrays?
	private defaultValue: PrimitiveJSONType;
	private childElements: ConfigElement[];

	public build(): ConfigElement {
		switch (this.type) {
			case 1:
				return this.createObjectElement();
				break;
			case 2:
				return this.createArrayElement();
				break;
			case 3:
				return this.createBooleanElement();
				break;
			case 4:
				return this.createNumberElement();
				break;
			case 5:
				return this.createStringElement();
				break;
			default:
				throw new Error("Undetermined or invalid element type");
		}
	}

	public ofTypeObject(): ConfigElementBuilder {
		this.type = 1;
		return this;
	}

	public ofTypeArray(): ConfigElementBuilder {
		this.type = 2;
		return this;
	}

	public ofTypeBoolean(): ConfigElementBuilder {
		this.type = 3;
		return this;
	}

	public ofTypeNumber(): ConfigElementBuilder {
		this.type = 4;
		return this;
	}

	public ofTypeString(): ConfigElementBuilder {
		this.type = 5;
		return this;
	}

	public withMaxLength(max: number): ConfigElementBuilder {
		// TODO: (Mischa Reitsma) Same goes for all others below, but should we check here if the type is string? If not throw an error? Or just ignore calls that don't make sense or are unused?
		this.maxLength = max;
		return this;
	}

	public withMinLength(min: number): ConfigElementBuilder {
		this.minLength = min;
		return this;
	}

	public withMaxValue(max: number): ConfigElementBuilder {
		this.maxValue = max;
		return this;
	}

	public withMinValue(min: number): ConfigElementBuilder {
		this.minValue = min;
		return this;
	}

	public canBeNull(): ConfigElementBuilder {
		this._canBeNull = true;
		return this;
	}

	public isOptional(): ConfigElementBuilder {
		this._isRequired = false;
		return this;
	}

	public withDefaultValue(value: PrimitiveJSONType) {
		this.defaultValue = value;
		return this;
	}

	public withChildElements(...children: ConfigElement[]): ConfigElementBuilder {
		this.childElements = children;
		return this;
	}

	public withName(name: string) {
		this.name = name;
		return this;
	}

	private createObjectElement(): ObjectElement {
		const ce = new ObjectElement();
		this.applyCommonFields(ce);

		if (this.childElements)
			ce.addChildren(...this.childElements);

		return ce;
	}

	private createArrayElement(): ArrayElement {
		const ce = new ArrayElement();
		this.applyCommonFields(ce);
		return ce;
	}

	private createBooleanElement(): BooleanElement {
		const ce = new BooleanElement();
		this.applyCommonFields(ce);
		this.applyPrimitiveFields(ce);
		return ce;
	}

	private createNumberElement(): NumberElement {
		const ce = new NumberElement();
		this.applyCommonFields(ce);
		this.applyPrimitiveFields(ce);

		if (this.minValue)
			ce.setMinValue(this.minValue);
		if (this.maxValue)
			ce.setMaxValue(this.maxValue);

		return ce;
	}

	private createStringElement(): StringElement {
		const ce = new StringElement();
		this.applyCommonFields(ce);
		this.applyPrimitiveFields(ce);

		if (this.minLength)
			ce.setMinLength(this.minLength);
		if (this.maxLength)
			ce.setMaxLength(this.maxLength);

		return ce;
	}

	private applyCommonFields(ce: ConfigElement) {
		// Name can be optional for root object or array.
		if (this.name) ce.setName(this.name);
		ce.setIsRequired(this._isRequired);
		ce.setCanBeNull(this._canBeNull);
	}

	private applyPrimitiveFields(ce: PrimitiveElement) {
		if (this.defaultValue)
			ce.setDefaultValue(this.defaultValue);
	}
}

export class InvalidConfigurationElementError extends Error {}
