/**
 * String representations of all the allowed element types.
 */
export type ConfigElementType = "string" | "number" | "boolean" | "array" | "object";
export type JSONType = string | number | boolean | object;

type PrimitiveJSONType = string | number | boolean;

/**
 * Interface that describes the form of the custom validators that can be added to
 * a ConfigElement.
 */
export interface ElementValidator<T> {
	validate: (configElement: ConfigElement, value: T) => boolean;
}

/**
 * Configuration Element
 * 
 * This abstract base class acts as the common ancestor for all specific configuration elements,
 * and holds all properties that are common to all elements.
 */
export abstract class ConfigElement {

	private name: string;
	private _isRequired: boolean = true;
	private _canBeNull: boolean = false;

	private validators: ElementValidator<JSONType>[] = [];

	/**
	 * Flag that indicates this specific element is required in the configuration. The
	 * default value for this flag is **true**.
	 * 
	 * @returns **true** if required, else **false**.
	 */
	public isRequired(): boolean {
		return this._isRequired;
	}

	/**
	 * Update the flag that indicates the elements is required in the configuration.
	 * 
	 * @param isRequired New **isRequired** flag value.
	 */
	public setIsRequired(isRequired: boolean): void {
		this._isRequired = isRequired;
	}

	/**
	 * Flag that indicates the value of this specific element is allowed to be **null**. The
	 * default value for this flag is **false**.
	 * 
	 * @returns **true** if the value can be **null**, else **false**.
	 */
	public canBeNull(): boolean {
		return this._canBeNull;
	}

	/**
	 * Update the flag that indicates an element is allowed to have a **null** value.
	 * 
	 * @param canBeNull New **canBeNull** flag value.
	 */
	public setCanBeNull(canBeNull: boolean): void {
		this._canBeNull = canBeNull;
	}

	/**
	 * Set the name or key of the element. As an example, take the following small JSON:
	 * 
	 * ```json
	 * {
	 *   "x": 1
	 * }
	 * ```
	 * 
	 * The name of the numeric element with value 1 is **x**.
	 * 
	 * @param name Name of the element.
	 */
	public setName(name: string) {
		this.name = name;
	}

	/**
	 * Get the name or key of the element.
	 * 
	 * @returns Name of the element
	 */
	public getName(): string {
		return this.name;
	}

	/**
	 * Add ElementValidator instances that do custom validations on an element.
	 * 
	 * @param validators ElementValidator instances to add to this ConfigElement.
	 */
	public addValidators(...validators: ElementValidator<JSONType>[]) {
		this.validators.push(...validators);
	}

	/**
	 * Return an array of all the custom validators that are assigned to this ConfigElement.
	 * 
	 * @returns The array of custom validators.
	 */
	public getValidators(): ElementValidator<JSONType>[] {
		return [...this.validators];
	}

	/**
	 * Determine if the passed element has the correct type for the current config element
	 * type. For details on what is a correct type go to the implementations:
	 * 
	 * - {@link StringElement.isCorrectType()}
	 * - {@link NumberElement.isCorrectType()}
	 * - {@link BooleanElement.isCorrectType()}
	 * - {@link ObjectElement.isCorrectType()}
	 * - {@link ArrayElement.isCorrectType()}
	 * 
	 * @param element The element to validate.
	 */
	public abstract isCorrectType(element: unknown): boolean;
}

/**
 * Object Configuration Element.
 * 
 * The object configuration element is the class that represents an object element. Examples are
 * the root object itself:
 * 
 * ```json
 * {
 *   "x": 1
 * }
 * ```
 * 
 * or any property that represents an object:
 * 
 * ```json
 * {
 *   "obj": {
 *     "x": 1
 *   }
 * }
 * ```
 */
export class ObjectElement extends ConfigElement {
	private children: Map<string, ConfigElement> = new Map();

	/**
	 * Set the map of child elements of this object element.
	 * 
	 * **NOTE**: This will overwrite any child that was already added by the
	 * {@link addChildren()} or {@link addChild()} methods.
	 * 
	 * @param children A full map of children, with as key of the map is the name of the child.
	 */
	public setChildren(children: Map<string, ConfigElement>): void {
		// TODO: (Mischa Reitsma) Verify keys are indeed names of the config elements.
		this.children = children;
	}

	/**
	 * Add all child elements that are passed as children to this object element.
	 * 
	 * @param children Configuration elements to add as child elements to this object.
	 */
	public addChildren(...children: ConfigElement[]) {
		children.forEach(c => this.addChild(c));
	}

	/**
	 * Add one single child element to add as child to this object element.
	 * 
	 * @param child Single child configuration element to add.
	 */
	public addChild(child: ConfigElement) {
		// TODO: (Mischa Reitsma) Should we check if exists and throw error? Else document.
		this.children.set(child.getName(), child);
	}

	/**
	 * Get a child element from an object element.
	 * 
	 * @param childName Name of the child
	 * @returns Element that corresponds to the name passed, or **undefined** if child does not
	 *          exist.
	 */
	public getChild(childName: string): ConfigElement {
		return this.children.get(childName);
	}

	/**
	 * Get an array of all child names of the current object element.
	 * 
	 * @returns Array of all child names.
	 */
	public getChildFieldNames(): string[] {
		return Array.from(this.children.keys());
	}

	/**
	 * Get an array of all child names of the current object element for all children that are
	 * required.
	 * 
	 * @returns Array of all child names that are considered required.
	 */
	public getRequiredChildren(): string[] {
		return this.getChildFieldNames().filter(c => this.children.get(c).isRequired());
	}

	/**
	 * Add ElementValidator instances that do custom validations on an element.
	 * 
	 * @param validators ElementValidator instances to add to this ObjectElement.
	 */
	public override addValidators(...validators: ElementValidator<object>[]) {
		super.addValidators(...validators);
	}

	/**
	 * Return an array of all the custom validators that are assigned to this ObjectElement.
	 * 
	 * @returns The array of custom validators.
	 */
	public override getValidators(): ElementValidator<object>[] {
		return super.getValidators();
	}

	/**
	 * Validate that the passed element is indeed a valid object element. An element is
	 * considered an object if the type of the element is **object** and the element is not an
	 * array.
	 * 
	 * @param element Element to validate.
	 * @returns **true** if the passed element has the correct type, else **false**.
	 */
	public override isCorrectType(element: unknown): boolean {
		return (typeof element === "object") && !Array.isArray(element);
	}
}

/**
 * Array configuration element.
 * 
 * The array configuration elements supports two types of setting up configuration. The first
 * is by calling for each type that is allowed the *allowXyzElement()** method with a
 * ConfigElement instance of that particular type which will be used for additional validations.
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

	/**
	 * Allow NumberElement as array elements.
	 * 
	 * @param ce NumberElement to use for further validation. If not passed, uses an empty
	 *           NumberElement.
	 */
	public allowNumberElements(ce?: NumberElement) {
		this.checkOrderedElementsEmpty();
		this.elements.set("number", ce || new NumberElement());
	}

	/**
	 * Allow BooleanElement as array elements.
	 * 
	 * @param ce BooleanElement to use for further validation. If not passed, uses an empty
	 *           BooleanElement.
	 */
	public allowBooleanElements(ce?: BooleanElement) {
		this.checkOrderedElementsEmpty();
		this.elements.set("boolean", ce || new BooleanElement());
	}

	/**
	 * Allow StringElement as array elements.
	 * 
	 * @param ce StringElement to use for further validation. If not passed, uses an empty
	 *           StringElement.
	 */
	public allowStringElements(ce?: StringElement) {
		this.checkOrderedElementsEmpty();
		this.elements.set("string", ce || new StringElement());
	}

	/**
	 * Allow ObjectElement as array elements.
	 * 
	 * @param ce ObjectElement to use for further validation. If not passed, uses an empty
	 *           ObjectElement.
	 */
	public allowObjectElements(ce?: ObjectElement) {
		this.checkOrderedElementsEmpty();
		this.elements.set("object", ce || new ObjectElement());
	}

	/**
	 * Allow ArrayElement as array elements.
	 * 
	 * @param ce ArrayElement to use for further validation. If not passed, uses an empty
	 *           ArrayElement.
	 */
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

	/**
	 * Set the flag that indicates that **null** elements as array contents are allowed to
	 * **true**.
	 */
	public setAllowNullElements() {
		this.allowNull = true;
	}

	/**
	 * Flag that indicates that **null** elements are allowed in the array. The default value
	 * for this flag is **false**. The {@link setAllowNullElements()} method can be used to set
	 * this flag to **true**.
	 * 
	 * @returns **true** if **null** elements are allowed, else **false**
	 */
	public allowNullElements(): boolean {
		return this.allowNull;
	}

	/**
	 * Set the ordered list of elements. If this method is called, the
	 * **allowXyzElement()** cannot be used anymore, and will throw errors. This method will
	 * throw an error in case one of the **allowXyzElement()** methods has already been called.
	 * 
	 * @param orderedElements List of ConfigElement instances.
	 */
	public setOrderedElements(...orderedElements: ConfigElement[]) {
		if (this.elements.size > 0) {
			throw new InvalidConfigurationElementError(
				"ArrayElement already expects allowed element validation"
			);
		}
		this.orderedElements = orderedElements;
	}

	/**
	 * Get the array of ordered ConfigElements.
	 * 
	 * @returns Ordered elements ConfigElement array
	 */
	public getOrderedElements(): ConfigElement[] {
		return this.orderedElements;
	}

	/**
	 * Validate that the passed element is indeed a valid array element. An element is
	 * considered an array if the type of the element is **object** and the element is an array.
	 * 
	 * @param element Element to validate.
	 * @returns **true** if the passed element has the correct type, else **false**.
	 */
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

	/**
	 * Add ElementValidator instances that do custom validations on an element.
	 * 
	 * @param validators ElementValidator instances to add to this ArrayElement.
	 */
	public override addValidators(...validators: ElementValidator<object>[]) {
		super.addValidators(...validators);
	}
	
	/**
	 * Return an array of all the custom validators that are assigned to this ArrayElement.
	 * 
	 * @returns The array of custom validators.
	 */
	public override getValidators(): ElementValidator<object>[] {
		return super.getValidators();
	}

	/**
	 * Check if the passed element type is allowed in the current ArrayElement.
	 * 
	 * @param elemType The config element type to check
	 * @returns **true** if the array supports the passed element type, else **false**
	 */
	public isValidElementType(elemType: ConfigElementType): boolean {
		return this.elements.has(elemType);
	}

	/**
	 * Get the ConfigElement that corresponds to the passed element type. Use the
	 * {@link isValidElementType()} method to check if the type is supported. This method will
	 * not check and return **undefined** for unsupported types.
	 * 
	 * @param elemType The config element type to get
	 * @returns The ConfigElement that corresponds to the type, or **undefined** if called with
	 *          an element type that is not supported.
	 */
	public getElementConfig(elemType: ConfigElementType): ConfigElement {
		return this.elements.get(elemType);
	}
}

/**
 * Primitive Configuration Element.
 * 
 * The primitive configuration element contains common functionality for the string, number and
 * boolean configuration elements.
 */
export abstract class PrimitiveElement extends ConfigElement {
	// TODO: (Mischa Reitsma) Could move these to the descendants, or override and narrow the type
	private defaultValue: PrimitiveJSONType;

	/**
	 * Set the default value of the configuration element in case the element is absent in the
	 * parsed configuration, and the element is optional.
	 * 
	 * @param defaultValue Default value to use.
	 */
	public setDefaultValue(defaultValue: PrimitiveJSONType): void {
		this.defaultValue = defaultValue;
	}

	/**
	 * Get the default value of the configuration element.
	 * 
	 * @returns Default value
	 */
	public getDefaultValue(): PrimitiveJSONType {
		return this.defaultValue;
	}
}

/**
 * Boolean Configuration Element.
 */
export class BooleanElement extends PrimitiveElement {
	/**
	 * Add ElementValidator instances that do custom validations on an element.
	 * 
	 * @param validators ElementValidator instances to add to this BooleanElement.
	 */
	public override addValidators(...validators: ElementValidator<boolean>[]) {
		super.addValidators(...validators);
	}
	
	/**
	 * Return an array of all the custom validators that are assigned to this BooleanElement.
	 * 
	 * @returns The array of custom validators.
	 */
	public override getValidators(): ElementValidator<boolean>[] {
		return super.getValidators();
	}

	/**
	 * Validate that the passed element is indeed a valid boolean element. An element is
	 * considered an boolean if the type of the element is **boolean**.
	 * 
	 * @param element Element to validate.
	 * @returns **true** if the passed element has the correct type, else **false**.
	 */
	public override isCorrectType(element: unknown): boolean {
		return typeof element === "boolean";
	}
}

/**
 * Number Configuration Element.
 * 
 * The number config element represents an element that holds an integer or floating point value.
 */
export class NumberElement extends PrimitiveElement {
	private minValue: number;
	private maxValue: number;

	/**
	 * Set the minimum value that the number element should have.
	 * 
	 * @param minValue Minimum value.
	 */
	public setMinValue(minValue: number): void {
		this.minValue = minValue;
	}

	/**
	 * Get the minimum value that the number element should have.
	 * 
	 * @returns Minimum value.
	 */
	public getMinValue(): number {
		return this.minValue;
	}

	/**
	 * Set the maximum value that the number element can have.
	 * 
	 * @param maxValue Maximum value.
	 */
	public setMaxValue(maxValue: number): void {
		this.maxValue = maxValue;
	}

	/**
	 * Get the maximum value the number element can have.
	 * 
	 * @returns Maximum value.
	 */
	public getMaxValue(): number {
		return this.maxValue;
	}

	/**
	 * Add ElementValidator instances that do custom validations on an element.
	 * 
	 * @param validators ElementValidator instances to add to this NumberElement.
	 */
	public override addValidators(...validators: ElementValidator<number>[]) {
		super.addValidators(...validators);
	}
	
	/**
	 * Return an array of all the custom validators that are assigned to this NumberElement.
	 * 
	 * @returns The array of custom validators.
	 */
	public override getValidators(): ElementValidator<number>[] {
		return super.getValidators();
	}

	/**
	 * Validate that the passed element is indeed a valid number element. An element is
	 * considered an number if the type of the element is **number**.
	 * 
	 * @param element Element to validate.
	 * @returns **true** if the passed element has the correct type, else **false**.
	 */
	public override isCorrectType(element: unknown): boolean {
		return typeof element === "number";
	}
}

export class StringElement extends PrimitiveElement {
	private minLength: number;
	private maxLength: number;

	private validValues: string[] = [];

	/**
	 * Set the minimum length the string element should have.
	 * 
	 * @param minLength Minimum length.
	 */
	public setMinLength(minLength: number): void {
		this.minLength = minLength;
	}

	/**
	 * Get the minimum length the string element should have.
	 * 
	 * @returns Minimum length.
	 */
	public getMinLength(): number {
		return this.minLength;
	}

	/**
	 * Set the maximum length the string element can have.
	 * 
	 * @param maxLength Maximum length.
	 */
	public setMaxLength(maxLength: number): void {
		this.maxLength = maxLength;
	}

	/**
	 * Get the maximum value that the string element can have.
	 * 
	 * @returns Maximum value.
	 */
	public getMaxLength(): number {
		return this.maxLength;
	}

	/**
	 * Add values to a list of allowed values for this string configuration element.
	 * 
	 * @param values Values that are valid for this StringElement
	 */
	public addValidValues(...values: string[]) {
		this.validValues.push(...values);
	}

	/**
	 * Get an array with all the valid value of this string configuration element.
	 * 
	 * @returns An array of all valid values
	 */
	public getValidValues(): string[] {
		return [...this.validValues];
	}

	/**
	 * Add ElementValidator instances that do custom validations on an element.
	 * 
	 * @param validators ElementValidator instances to add to this StringElement.
	 */
	public override addValidators(...validators: ElementValidator<string>[]) {
		super.addValidators(...validators);
	}
	
	/**
	 * Return an array of all the custom validators that are assigned to this StringElement.
	 * 
	 * @returns The array of custom validators.
	 */
	public override getValidators(): ElementValidator<string>[] {
		return super.getValidators();
	}

	/**
	 * Validate that the passed element is indeed a valid string element. An element is
	 * considered an string if the type of the element is **string**.
	 * 
	 * @param element Element to validate.
	 * @returns **true** if the passed element has the correct type, else **false**.
	 */
	public override isCorrectType(element: unknown): boolean {
		return typeof element === "string";
	}
}

/**
 * Enum or the five types of configuration elements.
 */
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
such that the `ofTypeXyz()` call has to precede specific calls like `withMaxLength()`, and then
as soon as the `ofTypeXyz()` call comes, we populate an internal ConfigElement field, and let
the specific calls just wrap around setters etc.

Might even need to just use the type, and then always just check that the type is non-zero for all
methods calls, forcing the `ofTypeXyz()` call as very very first call! Jep.
*/

/**
 * Configuration Element Builder
 * 
 * The ConfigurationElementBuilder class is used to create ConfigElements using a builder pattern.
 * The first call should always be **ofTypeXyz()**, as all the other methods need to know which
 * ConfigElement is being build. All methods therefore can throw the
 * **BuilderElementTypeUndeterminedError** error.
 * 
 * Methods that only apply for one specific type of element will throw errors in case the method
 * is called and that type is not currently being build.
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

	/**
	 * Build the specific ConfigElement.
	 * 
	 * @returns The ConfigElement instance
	 */
	public build(): ConfigElement {
		return this.getConfigElement();
	}

	/**
	 * The current builder is building an ObjectElement.
	 * 
	 * @returns The current ConfigElementBuilder instance.
	 * @throws BuilderElementTypeDeterminedError
	 */
	public ofTypeObject(): ConfigElementBuilder {
		if (this.type)
			throw new BuilderElementTypeDeterminedError();

		this.type = ElementType.OBJECT;
		this.objectElement = new ObjectElement();
		return this;
	}

	/**
	 * The current builder is building an ArrayElement.
	 * 
	 * @returns The current ConfigElementBuilder instance.
	 * @throws BuilderElementTypeDeterminedError
	 */
	public ofTypeArray(): ConfigElementBuilder {
		if (this.type)
			throw new BuilderElementTypeDeterminedError();

		this.type = ElementType.ARRAY;
		this.arrayElement = new ArrayElement();
		return this;
	}

	/**
	 * The current builder is building a BooleanElement.
	 * 
	 * @returns The current ConfigElementBuilder instance.
	 * @throws BuilderElementTypeDeterminedError
	 */
	public ofTypeBoolean(): ConfigElementBuilder {
		if (this.type)
			throw new BuilderElementTypeDeterminedError();

		this.type = ElementType.BOOLEAN;
		this.booleanElement = new BooleanElement();
		return this;
	}

	/**
	 * The current builder is building a NumberElement.
	 * 
	 * @returns The current ConfigElementBuilder instance.
	 * @throws BuilderElementTypeDeterminedError
	 */
	public ofTypeNumber(): ConfigElementBuilder {
		if (this.type)
			throw new BuilderElementTypeDeterminedError();

		this.type = ElementType.NUMBER;
		this.numberElement = new NumberElement();
		return this;
	}

	/**
	 * The current builder is building a StringElement.
	 * 
	 * @returns The current ConfigElementBuilder instance.
	 * @throws BuilderElementTypeDeterminedError
	 */
	public ofTypeString(): ConfigElementBuilder {
		if (this.type)
			throw new BuilderElementTypeDeterminedError();

		this.type = ElementType.STRING;
		this.stringElement = new StringElement();
		return this;
	}

	/**
	 * For StringElement items set the minimum length the string should have.
	 * 
	 * @param min Minimum length of the string.
	 * @returns The current ConfigElementBuilder instance.
	 * @throws BuilderMissingOrInvalidOfTypeError: Method called before calling
	 *         **ofTypeString()**.
	 */
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

	/**
	 * For StringElement items set the maximum length the string can have.
	 * 
	 * @param max Maximum length of the string.
	 * @returns The current ConfigElementBuilder instance.
	 * @throws BuilderMissingOrInvalidOfTypeError: Method called before calling
	 *         **ofTypeString()**.
	 */

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

	/**
	 * Add valid values for a StringElement.
	 * 
	 * @param values Valid values for the string.
	 * @returns The current ConfigElementBuilder.
	 */
	public withValidStringValues(...values: string[]): ConfigElementBuilder {
		if (!this.stringElement) {
			throw new BuilderMissingOrInvalidOfTypeError(
				"ofTypeString",
				"withValidStringValues"
			);
		}
		this.stringElement.addValidValues(...values);
		return this;
	}

	/**
	 * For NumberElement items set the minimum value the number should have.
	 * 
	 * @param min Minimum value of the number.
	 * @returns The current ConfigElementBuilder instance.
	 * @throws BuilderMissingOrInvalidOfTypeError: Method called before calling
	 *         **ofTypeNumber()**.
	 */
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

	/**
	 * For NumberElement items set the maximum value the number can have.
	 * 
	 * @param max Maximum value of the number.
	 * @returns The current ConfigElementBuilder instance.
	 * @throws BuilderMissingOrInvalidOfTypeError: Method called before calling
	 *         **ofTypeNumber()**.
	 */
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

	/**
	 * Allow the value of the ConfigElement to be **null**.
	 * 
	 * @returns The current ConfigElementBuilder instance.
	 */
	public canBeNull(): ConfigElementBuilder {
		this.getConfigElement().setCanBeNull(true);
		return this;
	}

	/**
	 * Make the ConfigElement optional.
	 * 
	 * @returns The current ConfigElementBuilder instance.
	 */
	public isOptional(): ConfigElementBuilder {
		this.getConfigElement().setIsRequired(false);
		return this;
	}

	/**
	 * For the primitive types, set a default value.
	 * 
	 * @param value The default value to use.
	 * @returns The current ConfigElementBuilder instance.
	 */
	public withDefaultValue(value: PrimitiveJSONType) {
		this.getPrimitiveConfigElement().setDefaultValue(value);
		return this;
	}

	/**
	 * Add all child elements that are passed to as child elements to an ObjectElement.
	 * 
	 * This method will call the {@link ObjectElement.addChildren()} method to add elements
	 * rather than replace them all.
	 * 
	 * @param children Array of child ConfigElement instances.
	 * @returns The current ConfigElementBuilder instance.
	 * @throws BuilderMissingOrInvalidOfTypeError: Method called before calling
	 *         **ofTypeObject()**.
	 */
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

	/**
	 * Set the name or the key of the ConfigElement.
	 * 
	 * @param name The name or key of the configuration element.
	 * @returns The current ConfigElementBuilder instance.
	 */
	public withName(name: string) {
		this.getConfigElement().setName(name);
		return this;
	}

	/**
	 * Allow number elements to be elements of the array element.
	 * 
	 * This method accepts a ConfigElement, but does a check on the type and throws errors
	 * in case any other type of ConfigElement is supplied.
	 * 
	 * @param ce An optional NumberElement instance to allow in the array.
	 * @returns The current ConfigElementBuilder instance.
	 * @throws BuilderMissingOrInvalidOfTypeError: Method called before calling
	 *         **ofTypeArray()**.
	 * @throws BuilderArrayElementTypeError: Incorrect type of the supplied ConfigElement.
	 */
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

	/**
	 * Allow string elements to be elements of the array element.
	 * 
	 * This method accepts a ConfigElement, but does a check on the type and throws errors
	 * in case any other type of ConfigElement is supplied.
	 * 
	 * @param ce An optional StringElement instance to allow in the array.
	 * @returns The current ConfigElementBuilder instance.
	 * @throws BuilderMissingOrInvalidOfTypeError: Method called before calling
	 *         **ofTypeArray()**.
	 * @throws BuilderArrayElementTypeError: Incorrect type of the supplied ConfigElement.
	 */
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

	/**
	 * Allow boolean elements to be elements of the array element.
	 * 
	 * This method accepts a ConfigElement, but does a check on the type and throws errors
	 * in case any other type of ConfigElement is supplied.
	 * 
	 * @param ce An optional BooleanElement instance to allow in the array.
	 * @returns The current ConfigElementBuilder instance.
	 * @throws BuilderMissingOrInvalidOfTypeError: Method called before calling
	 *         **ofTypeArray()**.
	 * @throws BuilderArrayElementTypeError: Incorrect type of the supplied ConfigElement.
	 */
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

	/**
	 * Allow array elements to be elements of the array element.
	 * 
	 * This method accepts a ConfigElement, but does a check on the type and throws errors
	 * in case any other type of ConfigElement is supplied.
	 * 
	 * @param ce An optional ArrayElement instance to allow in the array.
	 * @returns The current ConfigElementBuilder instance.
	 * @throws BuilderMissingOrInvalidOfTypeError: Method called before calling
	 *         **ofTypeArray()**.
	 * @throws BuilderArrayElementTypeError: Incorrect type of the supplied ConfigElement.
	 */
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

	/**
	 * Allow object elements to be elements of the array element.
	 * 
	 * This method accepts a ConfigElement, but does a check on the type and throws errors
	 * in case any other type of ConfigElement is supplied.
	 * 
	 * @param ce An optional ObjectElement instance to allow in the array.
	 * @returns The current ConfigElementBuilder instance.
	 * @throws BuilderMissingOrInvalidOfTypeError: Method called before calling
	 *         **ofTypeArray()**.
	 * @throws BuilderArrayElementTypeError: Incorrect type of the supplied ConfigElement.
	 */
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

	/**
	 * Set the ordered list of expected array elements.
	 * 
	 * @param elementList The ordered element list of expected array elements.
	 * @returns The current ConfigElementBuilder instance.
	 * @throws BuilderMissingOrInvalidOfTypeError: Method called before calling
	 *         **ofTypeArray()**.
	 */
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

	/**
	 * Allow **null** values in an ArrayElement.
	 * 
	 * @returns The current ConfigElementBuilder instance.
	 * @throws BuilderMissingOrInvalidOfTypeError: Method called before calling
	 *         **ofTypeArray()**.
	 */
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

	/**
	 * Add custom validators to the current element.
	 * 
	 * @param validators Array of custom validators for the current element.
	 * @returns The current ConfigElementBuilder instance.
	 */
	public withValidators(...validators: ElementValidator<JSONType>[]) {
		this.getConfigElement().addValidators(...validators);
		return this;
	}
}

// TODO: (Mischa Reitsma) The errors need another pass. Could have very specific types for everything, or make the types a bit simpler but have a clear message. Now it is a bit of both.

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
