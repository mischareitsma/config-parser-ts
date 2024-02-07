/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * Configuration parser module.
 * 
 * This module has the majority of the parsing of configuration logic. As this parsing requires a
 * user input string which can be any string, it disables a lot of eslint rules and expects a few
 * ts errors.
 */
import {
	ArrayElement,
	BooleanElement,
	ConfigElement,
	NumberElement,
	ObjectElement,
	StringElement
} from "./elements";

export interface ConfigParserOptions {
	/**
	 * Throw an error when the first error occurs. Default is **false**.
	 * 
	 * If **true**, the parse will throw an error when the first error is encountered. If
	 * ** false**, the parser will attempt to parse the entire configuration, and store
	 * all errors that occur. The {@link ConfigParser.getErrors()} method can be used to
	 * get the list of errors that occurred.
	 */
	throwOnFirstError?: boolean;

	/**
	 * Prune all unknown elements. Default is **false**.
	 * 
	 * If set to **true**, the parser will prune any element that it encounters that does not
	 * have a corresponding **ConfigElement**. The elements will only be pruned in case no
	 * errors were found and a valid parsed configuration object is returned.
	 */
	pruneUnknownElements?: boolean;
}

export class ConfigParser {

	private errors: Error[] = [];
	private throwOnFirstError: boolean = false;
	private pruneUnknownElements: boolean = false;

	private root: ConfigElement;

	constructor(root: ConfigElement, options?: ConfigParserOptions) {
		this.root = root;

		if (!options) return;

		if (options.pruneUnknownElements)
			this.pruneUnknownElements = options.pruneUnknownElements;

		if (options.throwOnFirstError)
			this.throwOnFirstError = options.throwOnFirstError;
	}

	public parse(jsonString: string): unknown {
		const json = JSON.parse(jsonString);
		this.validate(json);
		if (this.errors.length)
			throw new ConfigParseFailureError("Failed to parse configuration");
		return json;
	}

	private validate(json: unknown) {
		// If root is wrong, just abort fast, cannot attempt validating at all.
		if (!this.root.isCorrectType(json)) {
			this.addError(
				new InvalidRootTypeError("Root element has incorrect type")
			);
			return;
		}

		if (typeof json !== "object") {
			this.addError(new InvalidRootTypeError(
				"Parsed JSON string should have object as root type"
			));
			return;
		}

		if (this.root instanceof ObjectElement) {
			this.validateObject(json, this.root);
		}
		else if (this.root instanceof ArrayElement) {
			if (!Array.isArray(json)) {
				this.addError(new InvalidRootTypeError(
					"Expected root element to be an array"
				));
				return;
			}
			this.validateArray(json, this.root);
		}
		else {
			this.addError(
				new InvalidRootTypeError(
					"Root configuration element has incorrect type"
				)
			);
			return;
		}
	}

	private validateObject(inputObject: unknown, ce: ObjectElement) {

		if (inputObject === null) {
			if (!ce.canBeNull()) this.addError(
				new NullValueError(ce.getName())
			);
			return;
		}

		if (!ce.isCorrectType(inputObject)) {
			this.addError(new InvalidTypeError(typeof inputObject, "object"));
			return;
		}

		// The isCorrectType() call verifies that json is an object.
		const json = inputObject as object;

		const requiredFields: string[] = ce.getRequiredChildren();
		const requiredFieldsFound: string[] = [];
		const allFields: string[] = ce.getChildFieldNames();
		
		/**
		 * An array of all fields that exist in the **json** object, populated in a
		 * **for (const field in json)** loop.
		*/
		const jsonFields: string[] = [];

		for (const field in json) {
			jsonFields.push(field);
			if (requiredFields.includes(field)) requiredFieldsFound.push(field);
		}

		/**
		 * An array of all fields that exist in the **jsonFields** array, but not in the
		 * **allFields** array.
		*/
		const extraFields: string[] = jsonFields.filter(f => !allFields.includes(f));

		requiredFields.filter(f => !requiredFieldsFound.includes(f)).forEach(f => {
			this.addError(new MissingRequiredFieldError(f));
		});

		jsonFields.filter(f => allFields.includes(f)).forEach(f => {
			// @ts-expect-error See jsonFields description.
			const jsonElement: unknown = json[f];
			const childCe: ConfigElement = ce.getChild(f);

			this.validateUnknownElement(jsonElement, childCe);
		});

		// All is validated, now prune if no errors are found.
		if (this.pruneUnknownElements && !this.errors.length) {
			extraFields.forEach(f => {
				// @ts-expect-error See extraFields description.
				delete json[f];
			});
		}
	}

	private validateUnknownElement(elem: unknown, ce: ConfigElement) {
		if (ce instanceof ObjectElement)
			this.validateObject(elem, ce);
		else if (ce instanceof ArrayElement)
			this.validateArray(elem, ce);
		else if (ce instanceof BooleanElement)
			this.validateBoolean(elem, ce);
		else if (ce instanceof NumberElement)
			this.validateNumber(elem, ce);
		else if (ce instanceof StringElement)
			this.validateString(elem, ce);
	}

	private validateArray(inputArray: unknown, ce: ArrayElement) {

		if (inputArray === null) {
			if (!ce.canBeNull()) this.addError(
				new NullValueError(ce.getName())
			);
			return;
		}

		if (!ce.isCorrectType(inputArray)) {
			this.addError(new InvalidTypeError(typeof inputArray, "array"));
			return;
		}

		// The isCorrectType() call verifies that json is an object.
		const array = inputArray as unknown[];

		if (ce.allowAnyElement()) {
			if (
				!ce.allowNullElements() &&
				array.filter(v => v === null).length > 0
			) {
				this.addError(new NullArrayElementError());
			}
			return;
		}

		if (ce.getOrderedElements().length > 0) {
			const oe: ConfigElement[] = ce.getOrderedElements();
			if (oe.length !== array.length) {
				this.addError(new InvalidArrayContentsError(
					"Array and ordered elements list have unequal lengths"
				));
				// TODO: (Mischa Reitsma) Return vs just keep on checking what we have
				return;
			}
			oe.forEach((cce, i) => {
				const arrayElem: unknown = array[i];
				// Null, if allowed, will fit all the bills.
				if (arrayElem === null) {
					if (!ce.allowNullElements())
						this.addError(new NullArrayElementError());
					return;
				}
				this.validateUnknownElement(arrayElem, cce);
			});
		}
		else {
			array.forEach(elem => {

				// Again null, if allowed, fits all the bills.
				if (elem === null) {
					if (!ce.allowNullElements())
						this.addError(new NullArrayElementError());
					return;
				}

				let elemType = (typeof elem).toString();
				if (elemType === "object" && Array.isArray(elem))
					elemType = "array";

				if (!ce.isValidElementType(elemType)) {
					this.addError(new InvalidArrayElementTypeError(elemType));
					return;
				}

				this.validateUnknownElement(elem, ce.getElementConfig(elemType));
			});
		}

	}

	private validateBoolean(inputBool: unknown, ce: BooleanElement) {
		if (inputBool === null) {
			if (!ce.canBeNull()) this.addError(
				new NullValueError(ce.getName())
			);
			return;
		}

		if (!ce.isCorrectType(inputBool)) {
			this.addError(new InvalidTypeError(typeof inputBool, "boolean"));
			return;
		}
	}

	private validateNumber(inputNumber: unknown, ce: NumberElement) {
		if (inputNumber === null) {
			if (!ce.canBeNull()) this.addError(
				new NullValueError(ce.getName())
			);
			return;
		}

		if (!ce.isCorrectType(inputNumber)) {
			this.addError(new InvalidTypeError(typeof inputNumber, "number"));
			return;
		}

		const n = inputNumber as number;
		this.checkRange(n, ce.getMinValue(), ce.getMaxValue());
	}

	private validateString(inputString: unknown, ce: StringElement) {
		if (inputString === null) {
			if (!ce.canBeNull()) this.addError(
				new NullValueError(ce.getName())
			);
			return;
		}

		if (!ce.isCorrectType(inputString)) {
			this.addError(new InvalidTypeError(typeof inputString, "boolean"));
			return;
		}

		const s = inputString as string;
		this.checkRange(s.length, ce.getMinLength(), ce.getMaxLength());
	}

	private checkRange(n: number, min: number | undefined, max: number | undefined) {
		if (max && n > max) {
			this.addError(
				new InvalidValueError(
					`Value ${n} is greater then maximum ${max}`
				)
			);
		}

		if (min && n < min) {
			this.addError(
				new InvalidValueError(
					`Value ${n} is less then minimum ${min}`
				)
			);
		}
	}

	private addError(error: Error) {
		this.errors.push(error);
		if (this.throwOnFirstError) throw error;
	}

	public getErrors(): Error[] {
		return [...this.errors];
	}
}

export class InvalidRootTypeError extends Error {}

export class InvalidTypeError extends Error {
	constructor(actualType: string, expectedType: string) {
		super(`Invalid type ${actualType}, expected type ${expectedType}`);
	}
}

export class InvalidArrayElementTypeError extends Error {
	constructor(actualType: string) {
		super(`Invalid array element type ${actualType}`);
	}
}

export class MissingRequiredFieldError extends Error {
	constructor(field: string) {
		super(`Missing required field ${field}`);
	}
}

export class InvalidValueError extends Error {}

export class NullValueError extends InvalidValueError {
	constructor(fieldName: string) {
		super(`Field ${fieldName} is null, null fields not allowed`);
	}
}

export class InvalidArrayContentsError extends Error {}

export class NullArrayElementError extends InvalidArrayContentsError {
	constructor() {
		super("Null array elements not allowed");
	}
}


export class ConfigParseFailureError extends Error {}
