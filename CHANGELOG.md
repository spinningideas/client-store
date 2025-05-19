# Change Log

## 0.3.0

- Initial release

## 0.3.3

- Added support for Node.js environments via ClientStorage type and expansion of types that allow for the use of other storage engines besides localStorage and sessionStorage in Node.js environments using global.clientStoreMemoryStorage.

## 0.3.4

- Added queryAll and support for returning all data from table more directly.

## 0.3.8

- Revert internal commitToStorage calls to prevent unnecessary storage commits.

## 0.3.9

- Added support notes for npm package to support Node.js environments via ClientStorage type.
- Remove support for sessionStorage as its not a storage engine that persists data in the desired fashion for use cases this package is intended for.
- Fix to include comments in typescript type definition files. 

## 0.3.12

- Added remaining updates to JSDOC comments.
- Added support for custom storage prefix via storePrefix parameter.

