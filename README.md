# Simple Configuration Parser

Simple JSON configuration parser without any external dependencies. The
following sections will describe how to use the configuration parser in code.

## Creating a Parser

The configuration parser is created by instantiating a **ConfigParser** object.
The input is a root **ConfigElement** that should either be an **ObjectElement**
or an **ArrayElement**. An additional options object can be passed at creation
of the parser with the following properties:

- **throwOnFirstError**: Throw an error as soon as the parser finds an invalid
  piece of configuration. The default is **false**.
- **pruneUnknownElements**: Prune all elements from the parsed JSON string that
  are not configured. The default value is **false**.

Example snippet:

```ts
const parser: ConfigParser = new ConfigParser(rootElement, {
    throwOnFirstError: false,
    pruneUnknownElements: true
});
```

## Creating the Expected JSON Schema

As this parser does not rely on any external dependencies like JSON schema's,
it is up to the user to define the expected form, or schema, of the JSON by
making use of the various **ConfigElement** classes that are available. A
**ConfigElementBuilder** can be used for easy chaining of methods that specify
the characteristic of the element. As an example, take a numeric element with an
identifier or key **x**, a minimum value of 0 and a maximum value of 100 and
can be null. The following snippet using the **NumberElement** directly:

```ts
const numberElement: NumberElement = new NumberElement();
numberElement.setName("x");
numberElement.setCanBeNull(true);
numberElement.setMinValue(0);
numberElement.setMaxValue(100);
```

Using the builder, the creation of this instance looks like:

```ts
const NumberElement: NumberElement = new ConfigElementBuilder().ofTypeNumber()
    .withName("x").withMinValue(0).withMaxValue(100).build() as NumberElement;
```

## The Configuration Element Types

There are in total five configuration element types: **StringElement**,
**NumberElement**, **BooleanElement**, **ObjectElement** and **ArrayElement**.
In case of using the **ConfigElementBuilder**, use the **ofTypeXyz()** method to
indicate which type of element is specified, where **Xyz** is replaced with
**String**, **Number**, **Boolean**, **Object** or **Array**. Certain builder
methods can only be called after the **ofTypeXyz()** method is called.

## Dealing with Errors

There are two ways to deal with errors using the configuration parser. The call
to the **ConfigParser.parse()** method will always result in an error in case of
a failure during parsing. However, a the type of error depends on the
**throwOnFirstError** parser configuration setting. In case this is set to
**true**, the actual error that is encountered during parsing is thrown. In case
the setting is set to **false** all errors are accumulated, and after parsing
the entire configuration a **ConfigParseFailureError**. All errors that are
encountered are stored in an array that can be accessed through the
**ConfigParser.getErrors()** method.

One exception to the above is errors generated by the **JSON.parse()** method
on the JSON string that is passed to the **ConfigParser.parse()** method. Any
errors that this method call generates are not protected by a catch block and
have to be handled by the caller.

## Example

Take the following JSON:

```json
{
    "books": [
        {
            "name": "Some awesome book",
            "author": "Mr. Awesome",
            "year": 2023,
            "isHardCover": true
        },
        {
            "name": "The awesome sequel",
            "author": "Mr. Awesome",
            "year": 2024
        }
    ]
}
```

This full JSON will successfully parse with the following parser:

```ts
const root: ConfigElement = new ConfigElementBuilder().ofTypeObject().withChildElements(
    new ConfigElementBuilder().ofTypeArray().withName("books").withObjectArrayElements(
        new ConfigElementBuilder().ofTypeObject().withChildElements(
            new ConfigElementBuilder().ofTypeString().withName("name").build(),
            new ConfigElementBuilder().ofTypeString().withName("author").build(),
            new ConfigElementBuilder().ofTypeNumber().withName("year")
                .withMinValue(1900).build(),
            new ConfigElementBuilder().ofTypeBoolean().withName("isHardCover")
                .isOptional().withDefaultValue(false).build()
        ).build(),
    ).build()
).build();

const parser: ConfigParser = new ConfigParser(root);
```
