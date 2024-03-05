# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.0] - 2024-03-04

### Added

- Custom validators for configuration elements that run after all the standard
  validations for that element are done.
- Automatically ignore and prune any key on an ObjectElement that starts with
  the **$** sign, as these normally contain meta-data like comments or schema
  links.

## [0.3.0] - 2024-02-28

### Added

- For StringElements add an optional list of valid values the string element
  can have.

## [0.2.0] - 2024-02-26

### Added

- Documentation on all public methods and classes.
- Documentation on how to use the package in the README.

## [0.1.0] - 2024-02-20

### Added

- Initial version of configuration parser.

[Unreleased]: https://github.com/mischareitsma/config-parser-ts/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/mischareitsma/config-parser-ts/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/mischareitsma/config-parser-ts/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/mischareitsma/config-parser-ts/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/mischareitsma/config-parser-ts/releases/tag/v0.1.0
