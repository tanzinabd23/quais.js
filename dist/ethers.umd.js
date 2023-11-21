const __$G = (typeof globalThis !== 'undefined' ? globalThis: typeof window !== 'undefined' ? window: typeof global !== 'undefined' ? global: typeof self !== 'undefined' ? self: {});
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.ethers = {}));
})(this, (function (exports) { 'use strict';

    /* Do NOT modify this file; see /src.ts/_admin/update-version.ts */
    /**
     *  The current version of Ethers.
     */
    const version = "6.9.2";

    /**
     *  Property helper functions.
     *
     *  @_subsection api/utils:Properties  [about-properties]
     */
    function checkType(value, type, name) {
        const types = type.split("|").map(t => t.trim());
        for (let i = 0; i < types.length; i++) {
            switch (type) {
                case "any":
                    return;
                case "bigint":
                case "boolean":
                case "number":
                case "string":
                    if (typeof (value) === type) {
                        return;
                    }
            }
        }
        const error = new Error(`invalid value for type ${type}`);
        error.code = "INVALID_ARGUMENT";
        error.argument = `value.${name}`;
        error.value = value;
        throw error;
    }
    /**
     *  Resolves to a new object that is a copy of %%value%%, but with all
     *  values resolved.
     */
    async function resolveProperties(value) {
        const keys = Object.keys(value);
        const results = await Promise.all(keys.map((k) => Promise.resolve(value[k])));
        return results.reduce((accum, v, index) => {
            accum[keys[index]] = v;
            return accum;
        }, {});
    }
    /**
     *  Assigns the %%values%% to %%target%% as read-only values.
     *
     *  It %%types%% is specified, the values are checked.
     */
    function defineProperties(target, values, types) {
        for (let key in values) {
            let value = values[key];
            const type = (types ? types[key] : null);
            if (type) {
                checkType(value, type, key);
            }
            Object.defineProperty(target, key, { enumerable: true, value, writable: false });
        }
    }

    /**
     *  All errors in ethers include properties to ensure they are both
     *  human-readable (i.e. ``.message``) and machine-readable (i.e. ``.code``).
     *
     *  The [[isError]] function can be used to check the error ``code`` and
     *  provide a type guard for the properties present on that error interface.
     *
     *  @_section: api/utils/errors:Errors  [about-errors]
     */
    function stringify$1(value) {
        if (value == null) {
            return "null";
        }
        if (Array.isArray(value)) {
            return "[ " + (value.map(stringify$1)).join(", ") + " ]";
        }
        if (value instanceof Uint8Array) {
            const HEX = "0123456789abcdef";
            let result = "0x";
            for (let i = 0; i < value.length; i++) {
                result += HEX[value[i] >> 4];
                result += HEX[value[i] & 0xf];
            }
            return result;
        }
        if (typeof (value) === "object" && typeof (value.toJSON) === "function") {
            return stringify$1(value.toJSON());
        }
        switch (typeof (value)) {
            case "boolean":
            case "symbol":
                return value.toString();
            case "bigint":
                return BigInt(value).toString();
            case "number":
                return (value).toString();
            case "string":
                return JSON.stringify(value);
            case "object": {
                const keys = Object.keys(value);
                keys.sort();
                return "{ " + keys.map((k) => `${stringify$1(k)}: ${stringify$1(value[k])}`).join(", ") + " }";
            }
        }
        return `[ COULD NOT SERIALIZE ]`;
    }
    /**
     *  Returns true if the %%error%% matches an error thrown by ethers
     *  that matches the error %%code%%.
     *
     *  In TypeScript environments, this can be used to check that %%error%%
     *  matches an EthersError type, which means the expected properties will
     *  be set.
     *
     *  @See [ErrorCodes](api:ErrorCode)
     *  @example
     *    try {
     *      // code....
     *    } catch (e) {
     *      if (isError(e, "CALL_EXCEPTION")) {
     *          // The Type Guard has validated this object
     *          console.log(e.data);
     *      }
     *    }
     */
    function isError(error, code) {
        return (error && error.code === code);
    }
    /**
     *  Returns true if %%error%% is a [[CallExceptionError].
     */
    function isCallException(error) {
        return isError(error, "CALL_EXCEPTION");
    }
    /**
     *  Returns a new Error configured to the format ethers emits errors, with
     *  the %%message%%, [[api:ErrorCode]] %%code%% and additional properties
     *  for the corresponding EthersError.
     *
     *  Each error in ethers includes the version of ethers, a
     *  machine-readable [[ErrorCode]], and depending on %%code%%, additional
     *  required properties. The error message will also include the %%message%%,
     *  ethers version, %%code%% and all additional properties, serialized.
     */
    function makeError(message, code, info) {
        let shortMessage = message;
        {
            const details = [];
            if (info) {
                if ("message" in info || "code" in info || "name" in info) {
                    throw new Error(`value will overwrite populated values: ${stringify$1(info)}`);
                }
                for (const key in info) {
                    if (key === "shortMessage") {
                        continue;
                    }
                    const value = (info[key]);
                    //                try {
                    details.push(key + "=" + stringify$1(value));
                    //                } catch (error: any) {
                    //                console.log("MMM", error.message);
                    //                    details.push(key + "=[could not serialize object]");
                    //                }
                }
            }
            details.push(`code=${code}`);
            details.push(`version=${version}`);
            if (details.length) {
                message += " (" + details.join(", ") + ")";
            }
        }
        let error;
        switch (code) {
            case "INVALID_ARGUMENT":
                error = new TypeError(message);
                break;
            case "NUMERIC_FAULT":
            case "BUFFER_OVERRUN":
                error = new RangeError(message);
                break;
            default:
                error = new Error(message);
        }
        defineProperties(error, { code });
        if (info) {
            Object.assign(error, info);
        }
        if (error.shortMessage == null) {
            defineProperties(error, { shortMessage });
        }
        return error;
    }
    /**
     *  Throws an EthersError with %%message%%, %%code%% and additional error
     *  %%info%% when %%check%% is falsish..
     *
     *  @see [[api:makeError]]
     */
    function assert(check, message, code, info) {
        if (!check) {
            throw makeError(message, code, info);
        }
    }
    /**
     *  A simple helper to simply ensuring provided arguments match expected
     *  constraints, throwing if not.
     *
     *  In TypeScript environments, the %%check%% has been asserted true, so
     *  any further code does not need additional compile-time checks.
     */
    function assertArgument(check, message, name, value) {
        assert(check, message, "INVALID_ARGUMENT", { argument: name, value: value });
    }
    function assertArgumentCount(count, expectedCount, message) {
        if (message == null) {
            message = "";
        }
        if (message) {
            message = ": " + message;
        }
        assert(count >= expectedCount, "missing arguemnt" + message, "MISSING_ARGUMENT", {
            count: count,
            expectedCount: expectedCount
        });
        assert(count <= expectedCount, "too many arguemnts" + message, "UNEXPECTED_ARGUMENT", {
            count: count,
            expectedCount: expectedCount
        });
    }
    const _normalizeForms = ["NFD", "NFC", "NFKD", "NFKC"].reduce((accum, form) => {
        try {
            // General test for normalize
            /* c8 ignore start */
            if ("test".normalize(form) !== "test") {
                throw new Error("bad");
            }
            ;
            /* c8 ignore stop */
            if (form === "NFD") {
                const check = String.fromCharCode(0xe9).normalize("NFD");
                const expected = String.fromCharCode(0x65, 0x0301);
                /* c8 ignore start */
                if (check !== expected) {
                    throw new Error("broken");
                }
                /* c8 ignore stop */
            }
            accum.push(form);
        }
        catch (error) { }
        return accum;
    }, []);
    /**
     *  Throws if the normalization %%form%% is not supported.
     */
    function assertNormalize(form) {
        assert(_normalizeForms.indexOf(form) >= 0, "platform missing String.prototype.normalize", "UNSUPPORTED_OPERATION", {
            operation: "String.prototype.normalize", info: { form }
        });
    }
    /**
     *  Many classes use file-scoped values to guard the constructor,
     *  making it effectively private. This facilitates that pattern
     *  by ensuring the %%givenGaurd%% matches the file-scoped %%guard%%,
     *  throwing if not, indicating the %%className%% if provided.
     */
    function assertPrivate(givenGuard, guard, className) {
        if (className == null) {
            className = "";
        }
        if (givenGuard !== guard) {
            let method = className, operation = "new";
            if (className) {
                method += ".";
                operation += " " + className;
            }
            assert(false, `private constructor; use ${method}from* methods`, "UNSUPPORTED_OPERATION", {
                operation
            });
        }
    }

    /**
     *  Some data helpers.
     *
     *
     *  @_subsection api/utils:Data Helpers  [about-data]
     */
    function _getBytes(value, name, copy) {
        if (value instanceof Uint8Array) {
            if (copy) {
                return new Uint8Array(value);
            }
            return value;
        }
        if (typeof (value) === "string" && value.match(/^0x([0-9a-f][0-9a-f])*$/i)) {
            const result = new Uint8Array((value.length - 2) / 2);
            let offset = 2;
            for (let i = 0; i < result.length; i++) {
                result[i] = parseInt(value.substring(offset, offset + 2), 16);
                offset += 2;
            }
            return result;
        }
        assertArgument(false, "invalid BytesLike value", name || "value", value);
    }
    /**
     *  Get a typed Uint8Array for %%value%%. If already a Uint8Array
     *  the original %%value%% is returned; if a copy is required use
     *  [[getBytesCopy]].
     *
     *  @see: getBytesCopy
     */
    function getBytes(value, name) {
        return _getBytes(value, name, false);
    }
    /**
     *  Get a typed Uint8Array for %%value%%, creating a copy if necessary
     *  to prevent any modifications of the returned value from being
     *  reflected elsewhere.
     *
     *  @see: getBytes
     */
    function getBytesCopy(value, name) {
        return _getBytes(value, name, true);
    }
    /**
     *  Returns true if %%value%% is a valid [[HexString]].
     *
     *  If %%length%% is ``true`` or a //number//, it also checks that
     *  %%value%% is a valid [[DataHexString]] of %%length%% (if a //number//)
     *  bytes of data (e.g. ``0x1234`` is 2 bytes).
     */
    function isHexString(value, length) {
        if (typeof (value) !== "string" || !value.match(/^0x[0-9A-Fa-f]*$/)) {
            return false;
        }
        if (typeof (length) === "number" && value.length !== 2 + 2 * length) {
            return false;
        }
        if (length === true && (value.length % 2) !== 0) {
            return false;
        }
        return true;
    }
    /**
     *  Returns true if %%value%% is a valid representation of arbitrary
     *  data (i.e. a valid [[DataHexString]] or a Uint8Array).
     */
    function isBytesLike(value) {
        return (isHexString(value, true) || (value instanceof Uint8Array));
    }
    const HexCharacters = "0123456789abcdef";
    /**
     *  Returns a [[DataHexString]] representation of %%data%%.
     */
    function hexlify(data) {
        const bytes = getBytes(data);
        let result = "0x";
        for (let i = 0; i < bytes.length; i++) {
            const v = bytes[i];
            result += HexCharacters[(v & 0xf0) >> 4] + HexCharacters[v & 0x0f];
        }
        return result;
    }
    /**
     *  Returns a [[DataHexString]] by concatenating all values
     *  within %%data%%.
     */
    function concat(datas) {
        return "0x" + datas.map((d) => hexlify(d).substring(2)).join("");
    }
    /**
     *  Returns the length of %%data%%, in bytes.
     */
    function dataLength(data) {
        if (isHexString(data, true)) {
            return (data.length - 2) / 2;
        }
        return getBytes(data).length;
    }
    /**
     *  Returns a [[DataHexString]] by slicing %%data%% from the %%start%%
     *  offset to the %%end%% offset.
     *
     *  By default %%start%% is 0 and %%end%% is the length of %%data%%.
     */
    function dataSlice(data, start, end) {
        const bytes = getBytes(data);
        if (end != null && end > bytes.length) {
            assert(false, "cannot slice beyond data bounds", "BUFFER_OVERRUN", {
                buffer: bytes, length: bytes.length, offset: end
            });
        }
        return hexlify(bytes.slice((start == null) ? 0 : start, (end == null) ? bytes.length : end));
    }
    /**
     *  Return the [[DataHexString]] result by stripping all **leading**
     ** zero bytes from %%data%%.
     */
    function stripZerosLeft(data) {
        let bytes = hexlify(data).substring(2);
        while (bytes.startsWith("00")) {
            bytes = bytes.substring(2);
        }
        return "0x" + bytes;
    }
    function zeroPad(data, length, left) {
        const bytes = getBytes(data);
        assert(length >= bytes.length, "padding exceeds data length", "BUFFER_OVERRUN", {
            buffer: new Uint8Array(bytes),
            length: length,
            offset: length + 1
        });
        const result = new Uint8Array(length);
        result.fill(0);
        if (left) {
            result.set(bytes, length - bytes.length);
        }
        else {
            result.set(bytes, 0);
        }
        return hexlify(result);
    }
    /**
     *  Return the [[DataHexString]] of %%data%% padded on the **left**
     *  to %%length%% bytes.
     *
     *  If %%data%% already exceeds %%length%%, a [[BufferOverrunError]] is
     *  thrown.
     *
     *  This pads data the same as **values** are in Solidity
     *  (e.g. ``uint128``).
     */
    function zeroPadValue(data, length) {
        return zeroPad(data, length, true);
    }
    /**
     *  Return the [[DataHexString]] of %%data%% padded on the **right**
     *  to %%length%% bytes.
     *
     *  If %%data%% already exceeds %%length%%, a [[BufferOverrunError]] is
     *  thrown.
     *
     *  This pads data the same as **bytes** are in Solidity
     *  (e.g. ``bytes16``).
     */
    function zeroPadBytes(data, length) {
        return zeroPad(data, length, false);
    }

    /**
     *  Some mathematic operations.
     *
     *  @_subsection: api/utils:Math Helpers  [about-maths]
     */
    const BN_0$a = BigInt(0);
    const BN_1$5 = BigInt(1);
    //const BN_Max256 = (BN_1 << BigInt(256)) - BN_1;
    // IEEE 754 support 53-bits of mantissa
    const maxValue = 0x1fffffffffffff;
    /**
     *  Convert %%value%% from a twos-compliment representation of %%width%%
     *  bits to its value.
     *
     *  If the highest bit is ``1``, the result will be negative.
     */
    function fromTwos(_value, _width) {
        const value = getUint(_value, "value");
        const width = BigInt(getNumber(_width, "width"));
        assert((value >> width) === BN_0$a, "overflow", "NUMERIC_FAULT", {
            operation: "fromTwos", fault: "overflow", value: _value
        });
        // Top bit set; treat as a negative value
        if (value >> (width - BN_1$5)) {
            const mask = (BN_1$5 << width) - BN_1$5;
            return -(((~value) & mask) + BN_1$5);
        }
        return value;
    }
    /**
     *  Convert %%value%% to a twos-compliment representation of
     *  %%width%% bits.
     *
     *  The result will always be positive.
     */
    function toTwos(_value, _width) {
        let value = getBigInt(_value, "value");
        const width = BigInt(getNumber(_width, "width"));
        const limit = (BN_1$5 << (width - BN_1$5));
        if (value < BN_0$a) {
            value = -value;
            assert(value <= limit, "too low", "NUMERIC_FAULT", {
                operation: "toTwos", fault: "overflow", value: _value
            });
            const mask = (BN_1$5 << width) - BN_1$5;
            return ((~value) & mask) + BN_1$5;
        }
        else {
            assert(value < limit, "too high", "NUMERIC_FAULT", {
                operation: "toTwos", fault: "overflow", value: _value
            });
        }
        return value;
    }
    /**
     *  Mask %%value%% with a bitmask of %%bits%% ones.
     */
    function mask(_value, _bits) {
        const value = getUint(_value, "value");
        const bits = BigInt(getNumber(_bits, "bits"));
        return value & ((BN_1$5 << bits) - BN_1$5);
    }
    /**
     *  Gets a BigInt from %%value%%. If it is an invalid value for
     *  a BigInt, then an ArgumentError will be thrown for %%name%%.
     */
    function getBigInt(value, name) {
        switch (typeof (value)) {
            case "bigint": return value;
            case "number":
                assertArgument(Number.isInteger(value), "underflow", name || "value", value);
                assertArgument(value >= -maxValue && value <= maxValue, "overflow", name || "value", value);
                return BigInt(value);
            case "string":
                try {
                    if (value === "") {
                        throw new Error("empty string");
                    }
                    if (value[0] === "-" && value[1] !== "-") {
                        return -BigInt(value.substring(1));
                    }
                    return BigInt(value);
                }
                catch (e) {
                    assertArgument(false, `invalid BigNumberish string: ${e.message}`, name || "value", value);
                }
        }
        assertArgument(false, "invalid BigNumberish value", name || "value", value);
    }
    /**
     *  Returns %%value%% as a bigint, validating it is valid as a bigint
     *  value and that it is positive.
     */
    function getUint(value, name) {
        const result = getBigInt(value, name);
        assert(result >= BN_0$a, "unsigned value cannot be negative", "NUMERIC_FAULT", {
            fault: "overflow", operation: "getUint", value
        });
        return result;
    }
    const Nibbles$1 = "0123456789abcdef";
    /*
     * Converts %%value%% to a BigInt. If %%value%% is a Uint8Array, it
     * is treated as Big Endian data.
     */
    function toBigInt(value) {
        if (value instanceof Uint8Array) {
            let result = "0x0";
            for (const v of value) {
                result += Nibbles$1[v >> 4];
                result += Nibbles$1[v & 0x0f];
            }
            return BigInt(result);
        }
        return getBigInt(value);
    }
    /**
     *  Gets a //number// from %%value%%. If it is an invalid value for
     *  a //number//, then an ArgumentError will be thrown for %%name%%.
     */
    function getNumber(value, name) {
        switch (typeof (value)) {
            case "bigint":
                assertArgument(value >= -maxValue && value <= maxValue, "overflow", name || "value", value);
                return Number(value);
            case "number":
                assertArgument(Number.isInteger(value), "underflow", name || "value", value);
                assertArgument(value >= -maxValue && value <= maxValue, "overflow", name || "value", value);
                return value;
            case "string":
                try {
                    if (value === "") {
                        throw new Error("empty string");
                    }
                    return getNumber(BigInt(value), name);
                }
                catch (e) {
                    assertArgument(false, `invalid numeric string: ${e.message}`, name || "value", value);
                }
        }
        assertArgument(false, "invalid numeric value", name || "value", value);
    }
    /**
     *  Converts %%value%% to a number. If %%value%% is a Uint8Array, it
     *  is treated as Big Endian data. Throws if the value is not safe.
     */
    function toNumber(value) {
        return getNumber(toBigInt(value));
    }
    /**
     *  Converts %%value%% to a Big Endian hexstring, optionally padded to
     *  %%width%% bytes.
     */
    function toBeHex(_value, _width) {
        const value = getUint(_value, "value");
        let result = value.toString(16);
        if (_width == null) {
            // Ensure the value is of even length
            if (result.length % 2) {
                result = "0" + result;
            }
        }
        else {
            const width = getNumber(_width, "width");
            assert(width * 2 >= result.length, `value exceeds width (${width} bytes)`, "NUMERIC_FAULT", {
                operation: "toBeHex",
                fault: "overflow",
                value: _value
            });
            // Pad the value to the required width
            while (result.length < (width * 2)) {
                result = "0" + result;
            }
        }
        return "0x" + result;
    }
    /**
     *  Converts %%value%% to a Big Endian Uint8Array.
     */
    function toBeArray(_value) {
        const value = getUint(_value, "value");
        if (value === BN_0$a) {
            return new Uint8Array([]);
        }
        let hex = value.toString(16);
        if (hex.length % 2) {
            hex = "0" + hex;
        }
        const result = new Uint8Array(hex.length / 2);
        for (let i = 0; i < result.length; i++) {
            const offset = i * 2;
            result[i] = parseInt(hex.substring(offset, offset + 2), 16);
        }
        return result;
    }
    /**
     *  Returns a [[HexString]] for %%value%% safe to use as a //Quantity//.
     *
     *  A //Quantity// does not have and leading 0 values unless the value is
     *  the literal value `0x0`. This is most commonly used for JSSON-RPC
     *  numeric values.
     */
    function toQuantity(value) {
        let result = hexlify(isBytesLike(value) ? value : toBeArray(value)).substring(2);
        while (result.startsWith("0")) {
            result = result.substring(1);
        }
        if (result === "") {
            result = "0";
        }
        return "0x" + result;
    }

    /**
     *  The [Base58 Encoding](link-base58) scheme allows a **numeric** value
     *  to be encoded as a compact string using a radix of 58 using only
     *  alpha-numeric characters. Confusingly similar characters are omitted
     *  (i.e. ``"l0O"``).
     *
     *  Note that Base58 encodes a **numeric** value, not arbitrary bytes,
     *  since any zero-bytes on the left would get removed. To mitigate this
     *  issue most schemes that use Base58 choose specific high-order values
     *  to ensure non-zero prefixes.
     *
     *  @_subsection: api/utils:Base58 Encoding [about-base58]
     */
    const Alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let Lookup = null;
    function getAlpha(letter) {
        if (Lookup == null) {
            Lookup = {};
            for (let i = 0; i < Alphabet.length; i++) {
                Lookup[Alphabet[i]] = BigInt(i);
            }
        }
        const result = Lookup[letter];
        assertArgument(result != null, `invalid base58 value`, "letter", letter);
        return result;
    }
    const BN_0$9 = BigInt(0);
    const BN_58 = BigInt(58);
    /**
     *  Encode %%value%% as a Base58-encoded string.
     */
    function encodeBase58(_value) {
        const bytes = getBytes(_value);
        let value = toBigInt(bytes);
        let result = "";
        while (value) {
            result = Alphabet[Number(value % BN_58)] + result;
            value /= BN_58;
        }
        // Account for leading padding zeros
        for (let i = 0; i < bytes.length; i++) {
            if (bytes[i]) {
                break;
            }
            result = Alphabet[0] + result;
        }
        return result;
    }
    /**
     *  Decode the Base58-encoded %%value%%.
     */
    function decodeBase58(value) {
        let result = BN_0$9;
        for (let i = 0; i < value.length; i++) {
            result *= BN_58;
            result += getAlpha(value[i]);
        }
        return result;
    }

    // utils/base64-browser
    function decodeBase64(textData) {
        textData = atob(textData);
        const data = new Uint8Array(textData.length);
        for (let i = 0; i < textData.length; i++) {
            data[i] = textData.charCodeAt(i);
        }
        return getBytes(data);
    }
    function encodeBase64(_data) {
        const data = getBytes(_data);
        let textData = "";
        for (let i = 0; i < data.length; i++) {
            textData += String.fromCharCode(data[i]);
        }
        return btoa(textData);
    }

    /**
     *  Events allow for applications to use the observer pattern, which
     *  allows subscribing and publishing events, outside the normal
     *  execution paths.
     *
     *  @_section api/utils/events:Events  [about-events]
     */
    /**
     *  When an [[EventEmitterable]] triggers a [[Listener]], the
     *  callback always ahas one additional argument passed, which is
     *  an **EventPayload**.
     */
    class EventPayload {
        /**
         *  The event filter.
         */
        filter;
        /**
         *  The **EventEmitterable**.
         */
        emitter;
        #listener;
        /**
         *  Create a new **EventPayload** for %%emitter%% with
         *  the %%listener%% and for %%filter%%.
         */
        constructor(emitter, listener, filter) {
            this.#listener = listener;
            defineProperties(this, { emitter, filter });
        }
        /**
         *  Unregister the triggered listener for future events.
         */
        async removeListener() {
            if (this.#listener == null) {
                return;
            }
            await this.emitter.off(this.filter, this.#listener);
        }
    }

    /**
     *  Using strings in Ethereum (or any security-basd system) requires
     *  additional care. These utilities attempt to mitigate some of the
     *  safety issues as well as provide the ability to recover and analyse
     *  strings.
     *
     *  @_subsection api/utils:Strings and UTF-8  [about-strings]
     */
    function errorFunc(reason, offset, bytes, output, badCodepoint) {
        assertArgument(false, `invalid codepoint at offset ${offset}; ${reason}`, "bytes", bytes);
    }
    function ignoreFunc(reason, offset, bytes, output, badCodepoint) {
        // If there is an invalid prefix (including stray continuation), skip any additional continuation bytes
        if (reason === "BAD_PREFIX" || reason === "UNEXPECTED_CONTINUE") {
            let i = 0;
            for (let o = offset + 1; o < bytes.length; o++) {
                if (bytes[o] >> 6 !== 0x02) {
                    break;
                }
                i++;
            }
            return i;
        }
        // This byte runs us past the end of the string, so just jump to the end
        // (but the first byte was read already read and therefore skipped)
        if (reason === "OVERRUN") {
            return bytes.length - offset - 1;
        }
        // Nothing to skip
        return 0;
    }
    function replaceFunc(reason, offset, bytes, output, badCodepoint) {
        // Overlong representations are otherwise "valid" code points; just non-deistingtished
        if (reason === "OVERLONG") {
            assertArgument(typeof (badCodepoint) === "number", "invalid bad code point for replacement", "badCodepoint", badCodepoint);
            output.push(badCodepoint);
            return 0;
        }
        // Put the replacement character into the output
        output.push(0xfffd);
        // Otherwise, process as if ignoring errors
        return ignoreFunc(reason, offset, bytes);
    }
    /**
     *  A handful of popular, built-in UTF-8 error handling strategies.
     *
     *  **``"error"``** - throws on ANY illegal UTF-8 sequence or
     *  non-canonical (overlong) codepoints (this is the default)
     *
     *  **``"ignore"``** - silently drops any illegal UTF-8 sequence
     *  and accepts non-canonical (overlong) codepoints
     *
     *  **``"replace"``** - replace any illegal UTF-8 sequence with the
     *  UTF-8 replacement character (i.e. ``"\\ufffd"``) and accepts
     *  non-canonical (overlong) codepoints
     *
     *  @returns: Record<"error" | "ignore" | "replace", Utf8ErrorFunc>
     */
    const Utf8ErrorFuncs = Object.freeze({
        error: errorFunc,
        ignore: ignoreFunc,
        replace: replaceFunc
    });
    // http://stackoverflow.com/questions/13356493/decode-utf-8-with-javascript#13691499
    function getUtf8CodePoints(_bytes, onError) {
        if (onError == null) {
            onError = Utf8ErrorFuncs.error;
        }
        const bytes = getBytes(_bytes, "bytes");
        const result = [];
        let i = 0;
        // Invalid bytes are ignored
        while (i < bytes.length) {
            const c = bytes[i++];
            // 0xxx xxxx
            if (c >> 7 === 0) {
                result.push(c);
                continue;
            }
            // Multibyte; how many bytes left for this character?
            let extraLength = null;
            let overlongMask = null;
            // 110x xxxx 10xx xxxx
            if ((c & 0xe0) === 0xc0) {
                extraLength = 1;
                overlongMask = 0x7f;
                // 1110 xxxx 10xx xxxx 10xx xxxx
            }
            else if ((c & 0xf0) === 0xe0) {
                extraLength = 2;
                overlongMask = 0x7ff;
                // 1111 0xxx 10xx xxxx 10xx xxxx 10xx xxxx
            }
            else if ((c & 0xf8) === 0xf0) {
                extraLength = 3;
                overlongMask = 0xffff;
            }
            else {
                if ((c & 0xc0) === 0x80) {
                    i += onError("UNEXPECTED_CONTINUE", i - 1, bytes, result);
                }
                else {
                    i += onError("BAD_PREFIX", i - 1, bytes, result);
                }
                continue;
            }
            // Do we have enough bytes in our data?
            if (i - 1 + extraLength >= bytes.length) {
                i += onError("OVERRUN", i - 1, bytes, result);
                continue;
            }
            // Remove the length prefix from the char
            let res = c & ((1 << (8 - extraLength - 1)) - 1);
            for (let j = 0; j < extraLength; j++) {
                let nextChar = bytes[i];
                // Invalid continuation byte
                if ((nextChar & 0xc0) != 0x80) {
                    i += onError("MISSING_CONTINUE", i, bytes, result);
                    res = null;
                    break;
                }
                res = (res << 6) | (nextChar & 0x3f);
                i++;
            }
            // See above loop for invalid continuation byte
            if (res === null) {
                continue;
            }
            // Maximum code point
            if (res > 0x10ffff) {
                i += onError("OUT_OF_RANGE", i - 1 - extraLength, bytes, result, res);
                continue;
            }
            // Reserved for UTF-16 surrogate halves
            if (res >= 0xd800 && res <= 0xdfff) {
                i += onError("UTF16_SURROGATE", i - 1 - extraLength, bytes, result, res);
                continue;
            }
            // Check for overlong sequences (more bytes than needed)
            if (res <= overlongMask) {
                i += onError("OVERLONG", i - 1 - extraLength, bytes, result, res);
                continue;
            }
            result.push(res);
        }
        return result;
    }
    // http://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
    /**
     *  Returns the UTF-8 byte representation of %%str%%.
     *
     *  If %%form%% is specified, the string is normalized.
     */
    function toUtf8Bytes(str, form) {
        if (form != null) {
            assertNormalize(form);
            str = str.normalize(form);
        }
        let result = [];
        for (let i = 0; i < str.length; i++) {
            const c = str.charCodeAt(i);
            if (c < 0x80) {
                result.push(c);
            }
            else if (c < 0x800) {
                result.push((c >> 6) | 0xc0);
                result.push((c & 0x3f) | 0x80);
            }
            else if ((c & 0xfc00) == 0xd800) {
                i++;
                const c2 = str.charCodeAt(i);
                assertArgument(i < str.length && ((c2 & 0xfc00) === 0xdc00), "invalid surrogate pair", "str", str);
                // Surrogate Pair
                const pair = 0x10000 + ((c & 0x03ff) << 10) + (c2 & 0x03ff);
                result.push((pair >> 18) | 0xf0);
                result.push(((pair >> 12) & 0x3f) | 0x80);
                result.push(((pair >> 6) & 0x3f) | 0x80);
                result.push((pair & 0x3f) | 0x80);
            }
            else {
                result.push((c >> 12) | 0xe0);
                result.push(((c >> 6) & 0x3f) | 0x80);
                result.push((c & 0x3f) | 0x80);
            }
        }
        return new Uint8Array(result);
    }
    //export 
    function _toUtf8String(codePoints) {
        return codePoints.map((codePoint) => {
            if (codePoint <= 0xffff) {
                return String.fromCharCode(codePoint);
            }
            codePoint -= 0x10000;
            return String.fromCharCode((((codePoint >> 10) & 0x3ff) + 0xd800), ((codePoint & 0x3ff) + 0xdc00));
        }).join("");
    }
    /**
     *  Returns the string represented by the UTF-8 data %%bytes%%.
     *
     *  When %%onError%% function is specified, it is called on UTF-8
     *  errors allowing recovery using the [[Utf8ErrorFunc]] API.
     *  (default: [error](Utf8ErrorFuncs))
     */
    function toUtf8String(bytes, onError) {
        return _toUtf8String(getUtf8CodePoints(bytes, onError));
    }
    /**
     *  Returns the UTF-8 code-points for %%str%%.
     *
     *  If %%form%% is specified, the string is normalized.
     */
    function toUtf8CodePoints(str, form) {
        return getUtf8CodePoints(toUtf8Bytes(str, form));
    }

    // @TODO: timeout is completely ignored; start a Promise.any with a reject?
    function createGetUrl(options) {
        async function getUrl(req, _signal) {
            const protocol = req.url.split(":")[0].toLowerCase();
            assert(protocol === "http" || protocol === "https", `unsupported protocol ${protocol}`, "UNSUPPORTED_OPERATION", {
                info: { protocol },
                operation: "request"
            });
            assert(protocol === "https" || !req.credentials || req.allowInsecureAuthentication, "insecure authorized connections unsupported", "UNSUPPORTED_OPERATION", {
                operation: "request"
            });
            let signal = undefined;
            if (_signal) {
                const controller = new AbortController();
                signal = controller.signal;
                _signal.addListener(() => { controller.abort(); });
            }
            const init = {
                method: req.method,
                headers: new Headers(Array.from(req)),
                body: req.body || undefined,
                signal
            };
            const resp = await fetch(req.url, init);
            const headers = {};
            resp.headers.forEach((value, key) => {
                headers[key.toLowerCase()] = value;
            });
            const respBody = await resp.arrayBuffer();
            const body = (respBody == null) ? null : new Uint8Array(respBody);
            return {
                statusCode: resp.status,
                statusMessage: resp.statusText,
                headers, body
            };
        }
        return getUrl;
    }

    /**
     *  Fetching content from the web is environment-specific, so Ethers
     *  provides an abstraction that each environment can implement to provide
     *  this service.
     *
     *  On [Node.js](link-node), the ``http`` and ``https`` libs are used to
     *  create a request object, register event listeners and process data
     *  and populate the [[FetchResponse]].
     *
     *  In a browser, the [DOM fetch](link-js-fetch) is used, and the resulting
     *  ``Promise`` is waited on to retrieve the payload.
     *
     *  The [[FetchRequest]] is responsible for handling many common situations,
     *  such as redirects, server throttling, authentication, etc.
     *
     *  It also handles common gateways, such as IPFS and data URIs.
     *
     *  @_section api/utils/fetching:Fetching Web Content  [about-fetch]
     */
    const MAX_ATTEMPTS = 12;
    const SLOT_INTERVAL = 250;
    // The global FetchGetUrlFunc implementation.
    let defaultGetUrlFunc = createGetUrl();
    const reData = new RegExp("^data:([^;:]*)?(;base64)?,(.*)$", "i");
    const reIpfs = new RegExp("^ipfs:/\/(ipfs/)?(.*)$", "i");
    // If locked, new Gateways cannot be added
    let locked$5 = false;
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs
    async function dataGatewayFunc(url, signal) {
        try {
            const match = url.match(reData);
            if (!match) {
                throw new Error("invalid data");
            }
            return new FetchResponse(200, "OK", {
                "content-type": (match[1] || "text/plain"),
            }, (match[2] ? decodeBase64(match[3]) : unpercent(match[3])));
        }
        catch (error) {
            return new FetchResponse(599, "BAD REQUEST (invalid data: URI)", {}, null, new FetchRequest(url));
        }
    }
    /**
     *  Returns a [[FetchGatewayFunc]] for fetching content from a standard
     *  IPFS gateway hosted at %%baseUrl%%.
     */
    function getIpfsGatewayFunc(baseUrl) {
        async function gatewayIpfs(url, signal) {
            try {
                const match = url.match(reIpfs);
                if (!match) {
                    throw new Error("invalid link");
                }
                return new FetchRequest(`${baseUrl}${match[2]}`);
            }
            catch (error) {
                return new FetchResponse(599, "BAD REQUEST (invalid IPFS URI)", {}, null, new FetchRequest(url));
            }
        }
        return gatewayIpfs;
    }
    const Gateways = {
        "data": dataGatewayFunc,
        "ipfs": getIpfsGatewayFunc("https:/\/gateway.ipfs.io/ipfs/")
    };
    const fetchSignals = new WeakMap();
    /**
     *  @_ignore
     */
    class FetchCancelSignal {
        #listeners;
        #cancelled;
        constructor(request) {
            this.#listeners = [];
            this.#cancelled = false;
            fetchSignals.set(request, () => {
                if (this.#cancelled) {
                    return;
                }
                this.#cancelled = true;
                for (const listener of this.#listeners) {
                    setTimeout(() => { listener(); }, 0);
                }
                this.#listeners = [];
            });
        }
        addListener(listener) {
            assert(!this.#cancelled, "singal already cancelled", "UNSUPPORTED_OPERATION", {
                operation: "fetchCancelSignal.addCancelListener"
            });
            this.#listeners.push(listener);
        }
        get cancelled() { return this.#cancelled; }
        checkSignal() {
            assert(!this.cancelled, "cancelled", "CANCELLED", {});
        }
    }
    // Check the signal, throwing if it is cancelled
    function checkSignal(signal) {
        if (signal == null) {
            throw new Error("missing signal; should not happen");
        }
        signal.checkSignal();
        return signal;
    }
    /**
     *  Represents a request for a resource using a URI.
     *
     *  By default, the supported schemes are ``HTTP``, ``HTTPS``, ``data:``,
     *  and ``IPFS:``.
     *
     *  Additional schemes can be added globally using [[registerGateway]].
     *
     *  @example:
     *    req = new FetchRequest("https://www.ricmoo.com")
     *    resp = await req.send()
     *    resp.body.length
     *    //_result:
     */
    class FetchRequest {
        #allowInsecure;
        #gzip;
        #headers;
        #method;
        #timeout;
        #url;
        #body;
        #bodyType;
        #creds;
        // Hooks
        #preflight;
        #process;
        #retry;
        #signal;
        #throttle;
        #getUrlFunc;
        /**
         *  The fetch URL to request.
         */
        get url() { return this.#url; }
        set url(url) {
            this.#url = String(url);
        }
        /**
         *  The fetch body, if any, to send as the request body. //(default: null)//
         *
         *  When setting a body, the intrinsic ``Content-Type`` is automatically
         *  set and will be used if **not overridden** by setting a custom
         *  header.
         *
         *  If %%body%% is null, the body is cleared (along with the
         *  intrinsic ``Content-Type``).
         *
         *  If %%body%% is a string, the intrinsic ``Content-Type`` is set to
         *  ``text/plain``.
         *
         *  If %%body%% is a Uint8Array, the intrinsic ``Content-Type`` is set to
         *  ``application/octet-stream``.
         *
         *  If %%body%% is any other object, the intrinsic ``Content-Type`` is
         *  set to ``application/json``.
         */
        get body() {
            if (this.#body == null) {
                return null;
            }
            return new Uint8Array(this.#body);
        }
        set body(body) {
            if (body == null) {
                this.#body = undefined;
                this.#bodyType = undefined;
            }
            else if (typeof (body) === "string") {
                this.#body = toUtf8Bytes(body);
                this.#bodyType = "text/plain";
            }
            else if (body instanceof Uint8Array) {
                this.#body = body;
                this.#bodyType = "application/octet-stream";
            }
            else if (typeof (body) === "object") {
                this.#body = toUtf8Bytes(JSON.stringify(body));
                this.#bodyType = "application/json";
            }
            else {
                throw new Error("invalid body");
            }
        }
        /**
         *  Returns true if the request has a body.
         */
        hasBody() {
            return (this.#body != null);
        }
        /**
         *  The HTTP method to use when requesting the URI. If no method
         *  has been explicitly set, then ``GET`` is used if the body is
         *  null and ``POST`` otherwise.
         */
        get method() {
            if (this.#method) {
                return this.#method;
            }
            if (this.hasBody()) {
                return "POST";
            }
            return "GET";
        }
        set method(method) {
            if (method == null) {
                method = "";
            }
            this.#method = String(method).toUpperCase();
        }
        /**
         *  The headers that will be used when requesting the URI. All
         *  keys are lower-case.
         *
         *  This object is a copy, so any changes will **NOT** be reflected
         *  in the ``FetchRequest``.
         *
         *  To set a header entry, use the ``setHeader`` method.
         */
        get headers() {
            const headers = Object.assign({}, this.#headers);
            if (this.#creds) {
                headers["authorization"] = `Basic ${encodeBase64(toUtf8Bytes(this.#creds))}`;
            }
            if (this.allowGzip) {
                headers["accept-encoding"] = "gzip";
            }
            if (headers["content-type"] == null && this.#bodyType) {
                headers["content-type"] = this.#bodyType;
            }
            if (this.body) {
                headers["content-length"] = String(this.body.length);
            }
            return headers;
        }
        /**
         *  Get the header for %%key%%, ignoring case.
         */
        getHeader(key) {
            return this.headers[key.toLowerCase()];
        }
        /**
         *  Set the header for %%key%% to %%value%%. All values are coerced
         *  to a string.
         */
        setHeader(key, value) {
            this.#headers[String(key).toLowerCase()] = String(value);
        }
        /**
         *  Clear all headers, resetting all intrinsic headers.
         */
        clearHeaders() {
            this.#headers = {};
        }
        [Symbol.iterator]() {
            const headers = this.headers;
            const keys = Object.keys(headers);
            let index = 0;
            return {
                next: () => {
                    if (index < keys.length) {
                        const key = keys[index++];
                        return {
                            value: [key, headers[key]], done: false
                        };
                    }
                    return { value: undefined, done: true };
                }
            };
        }
        /**
         *  The value that will be sent for the ``Authorization`` header.
         *
         *  To set the credentials, use the ``setCredentials`` method.
         */
        get credentials() {
            return this.#creds || null;
        }
        /**
         *  Sets an ``Authorization`` for %%username%% with %%password%%.
         */
        setCredentials(username, password) {
            assertArgument(!username.match(/:/), "invalid basic authentication username", "username", "[REDACTED]");
            this.#creds = `${username}:${password}`;
        }
        /**
         *  Enable and request gzip-encoded responses. The response will
         *  automatically be decompressed. //(default: true)//
         */
        get allowGzip() {
            return this.#gzip;
        }
        set allowGzip(value) {
            this.#gzip = !!value;
        }
        /**
         *  Allow ``Authentication`` credentials to be sent over insecure
         *  channels. //(default: false)//
         */
        get allowInsecureAuthentication() {
            return !!this.#allowInsecure;
        }
        set allowInsecureAuthentication(value) {
            this.#allowInsecure = !!value;
        }
        /**
         *  The timeout (in milliseconds) to wait for a complete response.
         *  //(default: 5 minutes)//
         */
        get timeout() { return this.#timeout; }
        set timeout(timeout) {
            assertArgument(timeout >= 0, "timeout must be non-zero", "timeout", timeout);
            this.#timeout = timeout;
        }
        /**
         *  This function is called prior to each request, for example
         *  during a redirection or retry in case of server throttling.
         *
         *  This offers an opportunity to populate headers or update
         *  content before sending a request.
         */
        get preflightFunc() {
            return this.#preflight || null;
        }
        set preflightFunc(preflight) {
            this.#preflight = preflight;
        }
        /**
         *  This function is called after each response, offering an
         *  opportunity to provide client-level throttling or updating
         *  response data.
         *
         *  Any error thrown in this causes the ``send()`` to throw.
         *
         *  To schedule a retry attempt (assuming the maximum retry limit
         *  has not been reached), use [[response.throwThrottleError]].
         */
        get processFunc() {
            return this.#process || null;
        }
        set processFunc(process) {
            this.#process = process;
        }
        /**
         *  This function is called on each retry attempt.
         */
        get retryFunc() {
            return this.#retry || null;
        }
        set retryFunc(retry) {
            this.#retry = retry;
        }
        /**
         *  This function is called to fetch content from HTTP and
         *  HTTPS URLs and is platform specific (e.g. nodejs vs
         *  browsers).
         *
         *  This is by default the currently registered global getUrl
         *  function, which can be changed using [[registerGetUrl]].
         *  If this has been set, setting is to ``null`` will cause
         *  this FetchRequest (and any future clones) to revert back to
         *  using the currently registered global getUrl function.
         *
         *  Setting this is generally not necessary, but may be useful
         *  for developers that wish to intercept requests or to
         *  configurege a proxy or other agent.
         */
        get getUrlFunc() {
            return this.#getUrlFunc || defaultGetUrlFunc;
        }
        set getUrlFunc(value) {
            this.#getUrlFunc = value;
        }
        /**
         *  Create a new FetchRequest instance with default values.
         *
         *  Once created, each property may be set before issuing a
         *  ``.send()`` to make the request.
         */
        constructor(url) {
            this.#url = String(url);
            this.#allowInsecure = false;
            this.#gzip = true;
            this.#headers = {};
            this.#method = "";
            this.#timeout = 300000;
            this.#throttle = {
                slotInterval: SLOT_INTERVAL,
                maxAttempts: MAX_ATTEMPTS
            };
            this.#getUrlFunc = null;
        }
        toString() {
            return `<FetchRequest method=${JSON.stringify(this.method)} url=${JSON.stringify(this.url)} headers=${JSON.stringify(this.headers)} body=${this.#body ? hexlify(this.#body) : "null"}>`;
        }
        /**
         *  Update the throttle parameters used to determine maximum
         *  attempts and exponential-backoff properties.
         */
        setThrottleParams(params) {
            if (params.slotInterval != null) {
                this.#throttle.slotInterval = params.slotInterval;
            }
            if (params.maxAttempts != null) {
                this.#throttle.maxAttempts = params.maxAttempts;
            }
        }
        async #send(attempt, expires, delay, _request, _response) {
            if (attempt >= this.#throttle.maxAttempts) {
                return _response.makeServerError("exceeded maximum retry limit");
            }
            assert(getTime$2() <= expires, "timeout", "TIMEOUT", {
                operation: "request.send", reason: "timeout", request: _request
            });
            if (delay > 0) {
                await wait(delay);
            }
            let req = this.clone();
            const scheme = (req.url.split(":")[0] || "").toLowerCase();
            // Process any Gateways
            if (scheme in Gateways) {
                const result = await Gateways[scheme](req.url, checkSignal(_request.#signal));
                if (result instanceof FetchResponse) {
                    let response = result;
                    if (this.processFunc) {
                        checkSignal(_request.#signal);
                        try {
                            response = await this.processFunc(req, response);
                        }
                        catch (error) {
                            // Something went wrong during processing; throw a 5xx server error
                            if (error.throttle == null || typeof (error.stall) !== "number") {
                                response.makeServerError("error in post-processing function", error).assertOk();
                            }
                            // Ignore throttling
                        }
                    }
                    return response;
                }
                req = result;
            }
            // We have a preflight function; update the request
            if (this.preflightFunc) {
                req = await this.preflightFunc(req);
            }
            const resp = await this.getUrlFunc(req, checkSignal(_request.#signal));
            let response = new FetchResponse(resp.statusCode, resp.statusMessage, resp.headers, resp.body, _request);
            if (response.statusCode === 301 || response.statusCode === 302) {
                // Redirect
                try {
                    const location = response.headers.location || "";
                    return req.redirect(location).#send(attempt + 1, expires, 0, _request, response);
                }
                catch (error) { }
                // Things won't get any better on another attempt; abort
                return response;
            }
            else if (response.statusCode === 429) {
                // Throttle
                if (this.retryFunc == null || (await this.retryFunc(req, response, attempt))) {
                    const retryAfter = response.headers["retry-after"];
                    let delay = this.#throttle.slotInterval * Math.trunc(Math.random() * Math.pow(2, attempt));
                    if (typeof (retryAfter) === "string" && retryAfter.match(/^[1-9][0-9]*$/)) {
                        delay = parseInt(retryAfter);
                    }
                    return req.clone().#send(attempt + 1, expires, delay, _request, response);
                }
            }
            if (this.processFunc) {
                checkSignal(_request.#signal);
                try {
                    response = await this.processFunc(req, response);
                }
                catch (error) {
                    // Something went wrong during processing; throw a 5xx server error
                    if (error.throttle == null || typeof (error.stall) !== "number") {
                        response.makeServerError("error in post-processing function", error).assertOk();
                    }
                    // Throttle
                    let delay = this.#throttle.slotInterval * Math.trunc(Math.random() * Math.pow(2, attempt));
                    if (error.stall >= 0) {
                        delay = error.stall;
                    }
                    return req.clone().#send(attempt + 1, expires, delay, _request, response);
                }
            }
            return response;
        }
        /**
         *  Resolves to the response by sending the request.
         */
        send() {
            assert(this.#signal == null, "request already sent", "UNSUPPORTED_OPERATION", { operation: "fetchRequest.send" });
            this.#signal = new FetchCancelSignal(this);
            return this.#send(0, getTime$2() + this.timeout, 0, this, new FetchResponse(0, "", {}, null, this));
        }
        /**
         *  Cancels the inflight response, causing a ``CANCELLED``
         *  error to be rejected from the [[send]].
         */
        cancel() {
            assert(this.#signal != null, "request has not been sent", "UNSUPPORTED_OPERATION", { operation: "fetchRequest.cancel" });
            const signal = fetchSignals.get(this);
            if (!signal) {
                throw new Error("missing signal; should not happen");
            }
            signal();
        }
        /**
         *  Returns a new [[FetchRequest]] that represents the redirection
         *  to %%location%%.
         */
        redirect(location) {
            // Redirection; for now we only support absolute locations
            const current = this.url.split(":")[0].toLowerCase();
            const target = location.split(":")[0].toLowerCase();
            // Don't allow redirecting:
            // - non-GET requests
            // - downgrading the security (e.g. https => http)
            // - to non-HTTP (or non-HTTPS) protocols [this could be relaxed?]
            assert(this.method === "GET" && (current !== "https" || target !== "http") && location.match(/^https?:/), `unsupported redirect`, "UNSUPPORTED_OPERATION", {
                operation: `redirect(${this.method} ${JSON.stringify(this.url)} => ${JSON.stringify(location)})`
            });
            // Create a copy of this request, with a new URL
            const req = new FetchRequest(location);
            req.method = "GET";
            req.allowGzip = this.allowGzip;
            req.timeout = this.timeout;
            req.#headers = Object.assign({}, this.#headers);
            if (this.#body) {
                req.#body = new Uint8Array(this.#body);
            }
            req.#bodyType = this.#bodyType;
            // Do not forward credentials unless on the same domain; only absolute
            //req.allowInsecure = false;
            // paths are currently supported; may want a way to specify to forward?
            //setStore(req.#props, "creds", getStore(this.#pros, "creds"));
            return req;
        }
        /**
         *  Create a new copy of this request.
         */
        clone() {
            const clone = new FetchRequest(this.url);
            // Preserve "default method" (i.e. null)
            clone.#method = this.#method;
            // Preserve "default body" with type, copying the Uint8Array is present
            if (this.#body) {
                clone.#body = this.#body;
            }
            clone.#bodyType = this.#bodyType;
            // Preserve "default headers"
            clone.#headers = Object.assign({}, this.#headers);
            // Credentials is readonly, so we copy internally
            clone.#creds = this.#creds;
            if (this.allowGzip) {
                clone.allowGzip = true;
            }
            clone.timeout = this.timeout;
            if (this.allowInsecureAuthentication) {
                clone.allowInsecureAuthentication = true;
            }
            clone.#preflight = this.#preflight;
            clone.#process = this.#process;
            clone.#retry = this.#retry;
            clone.#getUrlFunc = this.#getUrlFunc;
            return clone;
        }
        /**
         *  Locks all static configuration for gateways and FetchGetUrlFunc
         *  registration.
         */
        static lockConfig() {
            locked$5 = true;
        }
        /**
         *  Get the current Gateway function for %%scheme%%.
         */
        static getGateway(scheme) {
            return Gateways[scheme.toLowerCase()] || null;
        }
        /**
         *  Use the %%func%% when fetching URIs using %%scheme%%.
         *
         *  This method affects all requests globally.
         *
         *  If [[lockConfig]] has been called, no change is made and this
         *  throws.
         */
        static registerGateway(scheme, func) {
            scheme = scheme.toLowerCase();
            if (scheme === "http" || scheme === "https") {
                throw new Error(`cannot intercept ${scheme}; use registerGetUrl`);
            }
            if (locked$5) {
                throw new Error("gateways locked");
            }
            Gateways[scheme] = func;
        }
        /**
         *  Use %%getUrl%% when fetching URIs over HTTP and HTTPS requests.
         *
         *  This method affects all requests globally.
         *
         *  If [[lockConfig]] has been called, no change is made and this
         *  throws.
         */
        static registerGetUrl(getUrl) {
            if (locked$5) {
                throw new Error("gateways locked");
            }
            defaultGetUrlFunc = getUrl;
        }
        /**
         *  Creates a getUrl function that fetches content from HTTP and
         *  HTTPS URLs.
         *
         *  The available %%options%% are dependent on the platform
         *  implementation of the default getUrl function.
         *
         *  This is not generally something that is needed, but is useful
         *  when trying to customize simple behaviour when fetching HTTP
         *  content.
         */
        static createGetUrlFunc(options) {
            return createGetUrl();
        }
        /**
         *  Creates a function that can "fetch" data URIs.
         *
         *  Note that this is automatically done internally to support
         *  data URIs, so it is not necessary to register it.
         *
         *  This is not generally something that is needed, but may
         *  be useful in a wrapper to perfom custom data URI functionality.
         */
        static createDataGateway() {
            return dataGatewayFunc;
        }
        /**
         *  Creates a function that will fetch IPFS (unvalidated) from
         *  a custom gateway baseUrl.
         *
         *  The default IPFS gateway used internally is
         *  ``"https:/\/gateway.ipfs.io/ipfs/"``.
         */
        static createIpfsGatewayFunc(baseUrl) {
            return getIpfsGatewayFunc(baseUrl);
        }
    }
    /**
     *  The response for a FetchRequest.
     */
    class FetchResponse {
        #statusCode;
        #statusMessage;
        #headers;
        #body;
        #request;
        #error;
        toString() {
            return `<FetchResponse status=${this.statusCode} body=${this.#body ? hexlify(this.#body) : "null"}>`;
        }
        /**
         *  The response status code.
         */
        get statusCode() { return this.#statusCode; }
        /**
         *  The response status message.
         */
        get statusMessage() { return this.#statusMessage; }
        /**
         *  The response headers. All keys are lower-case.
         */
        get headers() { return Object.assign({}, this.#headers); }
        /**
         *  The response body, or ``null`` if there was no body.
         */
        get body() {
            return (this.#body == null) ? null : new Uint8Array(this.#body);
        }
        /**
         *  The response body as a UTF-8 encoded string, or the empty
         *  string (i.e. ``""``) if there was no body.
         *
         *  An error is thrown if the body is invalid UTF-8 data.
         */
        get bodyText() {
            try {
                return (this.#body == null) ? "" : toUtf8String(this.#body);
            }
            catch (error) {
                assert(false, "response body is not valid UTF-8 data", "UNSUPPORTED_OPERATION", {
                    operation: "bodyText", info: { response: this }
                });
            }
        }
        /**
         *  The response body, decoded as JSON.
         *
         *  An error is thrown if the body is invalid JSON-encoded data
         *  or if there was no body.
         */
        get bodyJson() {
            try {
                return JSON.parse(this.bodyText);
            }
            catch (error) {
                assert(false, "response body is not valid JSON", "UNSUPPORTED_OPERATION", {
                    operation: "bodyJson", info: { response: this }
                });
            }
        }
        [Symbol.iterator]() {
            const headers = this.headers;
            const keys = Object.keys(headers);
            let index = 0;
            return {
                next: () => {
                    if (index < keys.length) {
                        const key = keys[index++];
                        return {
                            value: [key, headers[key]], done: false
                        };
                    }
                    return { value: undefined, done: true };
                }
            };
        }
        constructor(statusCode, statusMessage, headers, body, request) {
            this.#statusCode = statusCode;
            this.#statusMessage = statusMessage;
            this.#headers = Object.keys(headers).reduce((accum, k) => {
                accum[k.toLowerCase()] = String(headers[k]);
                return accum;
            }, {});
            this.#body = ((body == null) ? null : new Uint8Array(body));
            this.#request = (request || null);
            this.#error = { message: "" };
        }
        /**
         *  Return a Response with matching headers and body, but with
         *  an error status code (i.e. 599) and %%message%% with an
         *  optional %%error%%.
         */
        makeServerError(message, error) {
            let statusMessage;
            if (!message) {
                message = `${this.statusCode} ${this.statusMessage}`;
                statusMessage = `CLIENT ESCALATED SERVER ERROR (${message})`;
            }
            else {
                statusMessage = `CLIENT ESCALATED SERVER ERROR (${this.statusCode} ${this.statusMessage}; ${message})`;
            }
            const response = new FetchResponse(599, statusMessage, this.headers, this.body, this.#request || undefined);
            response.#error = { message, error };
            return response;
        }
        /**
         *  If called within a [request.processFunc](FetchRequest-processFunc)
         *  call, causes the request to retry as if throttled for %%stall%%
         *  milliseconds.
         */
        throwThrottleError(message, stall) {
            if (stall == null) {
                stall = -1;
            }
            else {
                assertArgument(Number.isInteger(stall) && stall >= 0, "invalid stall timeout", "stall", stall);
            }
            const error = new Error(message || "throttling requests");
            defineProperties(error, { stall, throttle: true });
            throw error;
        }
        /**
         *  Get the header value for %%key%%, ignoring case.
         */
        getHeader(key) {
            return this.headers[key.toLowerCase()];
        }
        /**
         *  Returns true if the response has a body.
         */
        hasBody() {
            return (this.#body != null);
        }
        /**
         *  The request made for this response.
         */
        get request() { return this.#request; }
        /**
         *  Returns true if this response was a success statusCode.
         */
        ok() {
            return (this.#error.message === "" && this.statusCode >= 200 && this.statusCode < 300);
        }
        /**
         *  Throws a ``SERVER_ERROR`` if this response is not ok.
         */
        assertOk() {
            if (this.ok()) {
                return;
            }
            let { message, error } = this.#error;
            if (message === "") {
                message = `server response ${this.statusCode} ${this.statusMessage}`;
            }
            assert(false, message, "SERVER_ERROR", {
                request: (this.request || "unknown request"), response: this, error
            });
        }
    }
    function getTime$2() { return (new Date()).getTime(); }
    function unpercent(value) {
        return toUtf8Bytes(value.replace(/%([0-9a-f][0-9a-f])/gi, (all, code) => {
            return String.fromCharCode(parseInt(code, 16));
        }));
    }
    function wait(delay) {
        return new Promise((resolve) => setTimeout(resolve, delay));
    }

    /**
     *  The **FixedNumber** class permits using values with decimal places,
     *  using fixed-pont math.
     *
     *  Fixed-point math is still based on integers under-the-hood, but uses an
     *  internal offset to store fractional components below, and each operation
     *  corrects for this after each operation.
     *
     *  @_section: api/utils/fixed-point-math:Fixed-Point Maths  [about-fixed-point-math]
     */
    const BN_N1 = BigInt(-1);
    const BN_0$8 = BigInt(0);
    const BN_1$4 = BigInt(1);
    const BN_5 = BigInt(5);
    const _guard$5 = {};
    // Constant to pull zeros from for multipliers
    let Zeros$1 = "0000";
    while (Zeros$1.length < 80) {
        Zeros$1 += Zeros$1;
    }
    // Returns a string "1" followed by decimal "0"s
    function getTens(decimals) {
        let result = Zeros$1;
        while (result.length < decimals) {
            result += result;
        }
        return BigInt("1" + result.substring(0, decimals));
    }
    function checkValue(val, format, safeOp) {
        const width = BigInt(format.width);
        if (format.signed) {
            const limit = (BN_1$4 << (width - BN_1$4));
            assert(safeOp == null || (val >= -limit && val < limit), "overflow", "NUMERIC_FAULT", {
                operation: safeOp, fault: "overflow", value: val
            });
            if (val > BN_0$8) {
                val = fromTwos(mask(val, width), width);
            }
            else {
                val = -fromTwos(mask(-val, width), width);
            }
        }
        else {
            const limit = (BN_1$4 << width);
            assert(safeOp == null || (val >= 0 && val < limit), "overflow", "NUMERIC_FAULT", {
                operation: safeOp, fault: "overflow", value: val
            });
            val = (((val % limit) + limit) % limit) & (limit - BN_1$4);
        }
        return val;
    }
    function getFormat(value) {
        if (typeof (value) === "number") {
            value = `fixed128x${value}`;
        }
        let signed = true;
        let width = 128;
        let decimals = 18;
        if (typeof (value) === "string") {
            // Parse the format string
            if (value === "fixed") ;
            else if (value === "ufixed") {
                signed = false;
            }
            else {
                const match = value.match(/^(u?)fixed([0-9]+)x([0-9]+)$/);
                assertArgument(match, "invalid fixed format", "format", value);
                signed = (match[1] !== "u");
                width = parseInt(match[2]);
                decimals = parseInt(match[3]);
            }
        }
        else if (value) {
            // Extract the values from the object
            const v = value;
            const check = (key, type, defaultValue) => {
                if (v[key] == null) {
                    return defaultValue;
                }
                assertArgument(typeof (v[key]) === type, "invalid fixed format (" + key + " not " + type + ")", "format." + key, v[key]);
                return v[key];
            };
            signed = check("signed", "boolean", signed);
            width = check("width", "number", width);
            decimals = check("decimals", "number", decimals);
        }
        assertArgument((width % 8) === 0, "invalid FixedNumber width (not byte aligned)", "format.width", width);
        assertArgument(decimals <= 80, "invalid FixedNumber decimals (too large)", "format.decimals", decimals);
        const name = (signed ? "" : "u") + "fixed" + String(width) + "x" + String(decimals);
        return { signed, width, decimals, name };
    }
    function toString(val, decimals) {
        let negative = "";
        if (val < BN_0$8) {
            negative = "-";
            val *= BN_N1;
        }
        let str = val.toString();
        // No decimal point for whole values
        if (decimals === 0) {
            return (negative + str);
        }
        // Pad out to the whole component (including a whole digit)
        while (str.length <= decimals) {
            str = Zeros$1 + str;
        }
        // Insert the decimal point
        const index = str.length - decimals;
        str = str.substring(0, index) + "." + str.substring(index);
        // Trim the whole component (leaving at least one 0)
        while (str[0] === "0" && str[1] !== ".") {
            str = str.substring(1);
        }
        // Trim the decimal component (leaving at least one 0)
        while (str[str.length - 1] === "0" && str[str.length - 2] !== ".") {
            str = str.substring(0, str.length - 1);
        }
        return (negative + str);
    }
    /**
     *  A FixedNumber represents a value over its [[FixedFormat]]
     *  arithmetic field.
     *
     *  A FixedNumber can be used to perform math, losslessly, on
     *  values which have decmial places.
     *
     *  A FixedNumber has a fixed bit-width to store values in, and stores all
     *  values internally by multiplying the value by 10 raised to the power of
     *  %%decimals%%.
     *
     *  If operations are performed that cause a value to grow too high (close to
     *  positive infinity) or too low (close to negative infinity), the value
     *  is said to //overflow//.
     *
     *  For example, an 8-bit signed value, with 0 decimals may only be within
     *  the range ``-128`` to ``127``; so ``-128 - 1`` will overflow and become
     *  ``127``. Likewise, ``127 + 1`` will overflow and become ``-127``.
     *
     *  Many operation have a normal and //unsafe// variant. The normal variant
     *  will throw a [[NumericFaultError]] on any overflow, while the //unsafe//
     *  variant will silently allow overflow, corrupting its value value.
     *
     *  If operations are performed that cause a value to become too small
     *  (close to zero), the value loses precison and is said to //underflow//.
     *
     *  For example, an value with 1 decimal place may store a number as small
     *  as ``0.1``, but the value of ``0.1 / 2`` is ``0.05``, which cannot fit
     *  into 1 decimal place, so underflow occurs which means precision is lost
     *  and the value becomes ``0``.
     *
     *  Some operations have a normal and //signalling// variant. The normal
     *  variant will silently ignore underflow, while the //signalling// variant
     *  will thow a [[NumericFaultError]] on underflow.
     */
    class FixedNumber {
        /**
         *  The specific fixed-point arithmetic field for this value.
         */
        format;
        #format;
        // The actual value (accounting for decimals)
        #val;
        // A base-10 value to multiple values by to maintain the magnitude
        #tens;
        /**
         *  This is a property so console.log shows a human-meaningful value.
         *
         *  @private
         */
        _value;
        // Use this when changing this file to get some typing info,
        // but then switch to any to mask the internal type
        //constructor(guard: any, value: bigint, format: _FixedFormat) {
        /**
         *  @private
         */
        constructor(guard, value, format) {
            assertPrivate(guard, _guard$5, "FixedNumber");
            this.#val = value;
            this.#format = format;
            const _value = toString(value, format.decimals);
            defineProperties(this, { format: format.name, _value });
            this.#tens = getTens(format.decimals);
        }
        /**
         *  If true, negative values are permitted, otherwise only
         *  positive values and zero are allowed.
         */
        get signed() { return this.#format.signed; }
        /**
         *  The number of bits available to store the value.
         */
        get width() { return this.#format.width; }
        /**
         *  The number of decimal places in the fixed-point arithment field.
         */
        get decimals() { return this.#format.decimals; }
        /**
         *  The value as an integer, based on the smallest unit the
         *  [[decimals]] allow.
         */
        get value() { return this.#val; }
        #checkFormat(other) {
            assertArgument(this.format === other.format, "incompatible format; use fixedNumber.toFormat", "other", other);
        }
        #checkValue(val, safeOp) {
            /*
                    const width = BigInt(this.width);
                    if (this.signed) {
                        const limit = (BN_1 << (width - BN_1));
                        assert(safeOp == null || (val >= -limit  && val < limit), "overflow", "NUMERIC_FAULT", {
                            operation: <string>safeOp, fault: "overflow", value: val
                        });
            
                        if (val > BN_0) {
                            val = fromTwos(mask(val, width), width);
                        } else {
                            val = -fromTwos(mask(-val, width), width);
                        }
            
                    } else {
                        const masked = mask(val, width);
                        assert(safeOp == null || (val >= 0 && val === masked), "overflow", "NUMERIC_FAULT", {
                            operation: <string>safeOp, fault: "overflow", value: val
                        });
                        val = masked;
                    }
            */
            val = checkValue(val, this.#format, safeOp);
            return new FixedNumber(_guard$5, val, this.#format);
        }
        #add(o, safeOp) {
            this.#checkFormat(o);
            return this.#checkValue(this.#val + o.#val, safeOp);
        }
        /**
         *  Returns a new [[FixedNumber]] with the result of %%this%% added
         *  to %%other%%, ignoring overflow.
         */
        addUnsafe(other) { return this.#add(other); }
        /**
         *  Returns a new [[FixedNumber]] with the result of %%this%% added
         *  to %%other%%. A [[NumericFaultError]] is thrown if overflow
         *  occurs.
         */
        add(other) { return this.#add(other, "add"); }
        #sub(o, safeOp) {
            this.#checkFormat(o);
            return this.#checkValue(this.#val - o.#val, safeOp);
        }
        /**
         *  Returns a new [[FixedNumber]] with the result of %%other%% subtracted
         *  from %%this%%, ignoring overflow.
         */
        subUnsafe(other) { return this.#sub(other); }
        /**
         *  Returns a new [[FixedNumber]] with the result of %%other%% subtracted
         *  from %%this%%. A [[NumericFaultError]] is thrown if overflow
         *  occurs.
         */
        sub(other) { return this.#sub(other, "sub"); }
        #mul(o, safeOp) {
            this.#checkFormat(o);
            return this.#checkValue((this.#val * o.#val) / this.#tens, safeOp);
        }
        /**
         *  Returns a new [[FixedNumber]] with the result of %%this%% multiplied
         *  by %%other%%, ignoring overflow and underflow (precision loss).
         */
        mulUnsafe(other) { return this.#mul(other); }
        /**
         *  Returns a new [[FixedNumber]] with the result of %%this%% multiplied
         *  by %%other%%. A [[NumericFaultError]] is thrown if overflow
         *  occurs.
         */
        mul(other) { return this.#mul(other, "mul"); }
        /**
         *  Returns a new [[FixedNumber]] with the result of %%this%% multiplied
         *  by %%other%%. A [[NumericFaultError]] is thrown if overflow
         *  occurs or if underflow (precision loss) occurs.
         */
        mulSignal(other) {
            this.#checkFormat(other);
            const value = this.#val * other.#val;
            assert((value % this.#tens) === BN_0$8, "precision lost during signalling mul", "NUMERIC_FAULT", {
                operation: "mulSignal", fault: "underflow", value: this
            });
            return this.#checkValue(value / this.#tens, "mulSignal");
        }
        #div(o, safeOp) {
            assert(o.#val !== BN_0$8, "division by zero", "NUMERIC_FAULT", {
                operation: "div", fault: "divide-by-zero", value: this
            });
            this.#checkFormat(o);
            return this.#checkValue((this.#val * this.#tens) / o.#val, safeOp);
        }
        /**
         *  Returns a new [[FixedNumber]] with the result of %%this%% divided
         *  by %%other%%, ignoring underflow (precision loss). A
         *  [[NumericFaultError]] is thrown if overflow occurs.
         */
        divUnsafe(other) { return this.#div(other); }
        /**
         *  Returns a new [[FixedNumber]] with the result of %%this%% divided
         *  by %%other%%, ignoring underflow (precision loss). A
         *  [[NumericFaultError]] is thrown if overflow occurs.
         */
        div(other) { return this.#div(other, "div"); }
        /**
         *  Returns a new [[FixedNumber]] with the result of %%this%% divided
         *  by %%other%%. A [[NumericFaultError]] is thrown if underflow
         *  (precision loss) occurs.
         */
        divSignal(other) {
            assert(other.#val !== BN_0$8, "division by zero", "NUMERIC_FAULT", {
                operation: "div", fault: "divide-by-zero", value: this
            });
            this.#checkFormat(other);
            const value = (this.#val * this.#tens);
            assert((value % other.#val) === BN_0$8, "precision lost during signalling div", "NUMERIC_FAULT", {
                operation: "divSignal", fault: "underflow", value: this
            });
            return this.#checkValue(value / other.#val, "divSignal");
        }
        /**
         *  Returns a comparison result between %%this%% and %%other%%.
         *
         *  This is suitable for use in sorting, where ``-1`` implies %%this%%
         *  is smaller, ``1`` implies %%this%% is larger and ``0`` implies
         *  both are equal.
         */
        cmp(other) {
            let a = this.value, b = other.value;
            // Coerce a and b to the same magnitude
            const delta = this.decimals - other.decimals;
            if (delta > 0) {
                b *= getTens(delta);
            }
            else if (delta < 0) {
                a *= getTens(-delta);
            }
            // Comnpare
            if (a < b) {
                return -1;
            }
            if (a > b) {
                return 1;
            }
            return 0;
        }
        /**
         *  Returns true if %%other%% is equal to %%this%%.
         */
        eq(other) { return this.cmp(other) === 0; }
        /**
         *  Returns true if %%other%% is less than to %%this%%.
         */
        lt(other) { return this.cmp(other) < 0; }
        /**
         *  Returns true if %%other%% is less than or equal to %%this%%.
         */
        lte(other) { return this.cmp(other) <= 0; }
        /**
         *  Returns true if %%other%% is greater than to %%this%%.
         */
        gt(other) { return this.cmp(other) > 0; }
        /**
         *  Returns true if %%other%% is greater than or equal to %%this%%.
         */
        gte(other) { return this.cmp(other) >= 0; }
        /**
         *  Returns a new [[FixedNumber]] which is the largest **integer**
         *  that is less than or equal to %%this%%.
         *
         *  The decimal component of the result will always be ``0``.
         */
        floor() {
            let val = this.#val;
            if (this.#val < BN_0$8) {
                val -= this.#tens - BN_1$4;
            }
            val = (this.#val / this.#tens) * this.#tens;
            return this.#checkValue(val, "floor");
        }
        /**
         *  Returns a new [[FixedNumber]] which is the smallest **integer**
         *  that is greater than or equal to %%this%%.
         *
         *  The decimal component of the result will always be ``0``.
         */
        ceiling() {
            let val = this.#val;
            if (this.#val > BN_0$8) {
                val += this.#tens - BN_1$4;
            }
            val = (this.#val / this.#tens) * this.#tens;
            return this.#checkValue(val, "ceiling");
        }
        /**
         *  Returns a new [[FixedNumber]] with the decimal component
         *  rounded up on ties at %%decimals%% places.
         */
        round(decimals) {
            if (decimals == null) {
                decimals = 0;
            }
            // Not enough precision to not already be rounded
            if (decimals >= this.decimals) {
                return this;
            }
            const delta = this.decimals - decimals;
            const bump = BN_5 * getTens(delta - 1);
            let value = this.value + bump;
            const tens = getTens(delta);
            value = (value / tens) * tens;
            checkValue(value, this.#format, "round");
            return new FixedNumber(_guard$5, value, this.#format);
        }
        /**
         *  Returns true if %%this%% is equal to ``0``.
         */
        isZero() { return (this.#val === BN_0$8); }
        /**
         *  Returns true if %%this%% is less than ``0``.
         */
        isNegative() { return (this.#val < BN_0$8); }
        /**
         *  Returns the string representation of %%this%%.
         */
        toString() { return this._value; }
        /**
         *  Returns a float approximation.
         *
         *  Due to IEEE 754 precission (or lack thereof), this function
         *  can only return an approximation and most values will contain
         *  rounding errors.
         */
        toUnsafeFloat() { return parseFloat(this.toString()); }
        /**
         *  Return a new [[FixedNumber]] with the same value but has had
         *  its field set to %%format%%.
         *
         *  This will throw if the value cannot fit into %%format%%.
         */
        toFormat(format) {
            return FixedNumber.fromString(this.toString(), format);
        }
        /**
         *  Creates a new [[FixedNumber]] for %%value%% divided by
         *  %%decimal%% places with %%format%%.
         *
         *  This will throw a [[NumericFaultError]] if %%value%% (once adjusted
         *  for %%decimals%%) cannot fit in %%format%%, either due to overflow
         *  or underflow (precision loss).
         */
        static fromValue(_value, _decimals, _format) {
            const decimals = (_decimals == null) ? 0 : getNumber(_decimals);
            const format = getFormat(_format);
            let value = getBigInt(_value, "value");
            const delta = decimals - format.decimals;
            if (delta > 0) {
                const tens = getTens(delta);
                assert((value % tens) === BN_0$8, "value loses precision for format", "NUMERIC_FAULT", {
                    operation: "fromValue", fault: "underflow", value: _value
                });
                value /= tens;
            }
            else if (delta < 0) {
                value *= getTens(-delta);
            }
            checkValue(value, format, "fromValue");
            return new FixedNumber(_guard$5, value, format);
        }
        /**
         *  Creates a new [[FixedNumber]] for %%value%% with %%format%%.
         *
         *  This will throw a [[NumericFaultError]] if %%value%% cannot fit
         *  in %%format%%, either due to overflow or underflow (precision loss).
         */
        static fromString(_value, _format) {
            const match = _value.match(/^(-?)([0-9]*)\.?([0-9]*)$/);
            assertArgument(match && (match[2].length + match[3].length) > 0, "invalid FixedNumber string value", "value", _value);
            const format = getFormat(_format);
            let whole = (match[2] || "0"), decimal = (match[3] || "");
            // Pad out the decimals
            while (decimal.length < format.decimals) {
                decimal += Zeros$1;
            }
            // Check precision is safe
            assert(decimal.substring(format.decimals).match(/^0*$/), "too many decimals for format", "NUMERIC_FAULT", {
                operation: "fromString", fault: "underflow", value: _value
            });
            // Remove extra padding
            decimal = decimal.substring(0, format.decimals);
            const value = BigInt(match[1] + whole + decimal);
            checkValue(value, format, "fromString");
            return new FixedNumber(_guard$5, value, format);
        }
        /**
         *  Creates a new [[FixedNumber]] with the big-endian representation
         *  %%value%% with %%format%%.
         *
         *  This will throw a [[NumericFaultError]] if %%value%% cannot fit
         *  in %%format%% due to overflow.
         */
        static fromBytes(_value, _format) {
            let value = toBigInt(getBytes(_value, "value"));
            const format = getFormat(_format);
            if (format.signed) {
                value = fromTwos(value, format.width);
            }
            checkValue(value, format, "fromBytes");
            return new FixedNumber(_guard$5, value, format);
        }
    }
    //const f1 = FixedNumber.fromString("12.56", "fixed16x2");
    //const f2 = FixedNumber.fromString("0.3", "fixed16x2");
    //console.log(f1.divSignal(f2));
    //const BUMP = FixedNumber.from("0.5");

    //See: https://github.com/ethereum/wiki/wiki/RLP
    function hexlifyByte(value) {
        let result = value.toString(16);
        while (result.length < 2) {
            result = "0" + result;
        }
        return "0x" + result;
    }
    function unarrayifyInteger(data, offset, length) {
        let result = 0;
        for (let i = 0; i < length; i++) {
            result = (result * 256) + data[offset + i];
        }
        return result;
    }
    function _decodeChildren(data, offset, childOffset, length) {
        const result = [];
        while (childOffset < offset + 1 + length) {
            const decoded = _decode(data, childOffset);
            result.push(decoded.result);
            childOffset += decoded.consumed;
            assert(childOffset <= offset + 1 + length, "child data too short", "BUFFER_OVERRUN", {
                buffer: data, length, offset
            });
        }
        return { consumed: (1 + length), result: result };
    }
    // returns { consumed: number, result: Object }
    function _decode(data, offset) {
        assert(data.length !== 0, "data too short", "BUFFER_OVERRUN", {
            buffer: data, length: 0, offset: 1
        });
        const checkOffset = (offset) => {
            assert(offset <= data.length, "data short segment too short", "BUFFER_OVERRUN", {
                buffer: data, length: data.length, offset
            });
        };
        // Array with extra length prefix
        if (data[offset] >= 0xf8) {
            const lengthLength = data[offset] - 0xf7;
            checkOffset(offset + 1 + lengthLength);
            const length = unarrayifyInteger(data, offset + 1, lengthLength);
            checkOffset(offset + 1 + lengthLength + length);
            return _decodeChildren(data, offset, offset + 1 + lengthLength, lengthLength + length);
        }
        else if (data[offset] >= 0xc0) {
            const length = data[offset] - 0xc0;
            checkOffset(offset + 1 + length);
            return _decodeChildren(data, offset, offset + 1, length);
        }
        else if (data[offset] >= 0xb8) {
            const lengthLength = data[offset] - 0xb7;
            checkOffset(offset + 1 + lengthLength);
            const length = unarrayifyInteger(data, offset + 1, lengthLength);
            checkOffset(offset + 1 + lengthLength + length);
            const result = hexlify(data.slice(offset + 1 + lengthLength, offset + 1 + lengthLength + length));
            return { consumed: (1 + lengthLength + length), result: result };
        }
        else if (data[offset] >= 0x80) {
            const length = data[offset] - 0x80;
            checkOffset(offset + 1 + length);
            const result = hexlify(data.slice(offset + 1, offset + 1 + length));
            return { consumed: (1 + length), result: result };
        }
        return { consumed: 1, result: hexlifyByte(data[offset]) };
    }
    /**
     *  Decodes %%data%% into the structured data it represents.
     */
    function decodeRlp(_data) {
        const data = getBytes(_data, "data");
        const decoded = _decode(data, 0);
        assertArgument(decoded.consumed === data.length, "unexpected junk after rlp payload", "data", _data);
        return decoded.result;
    }

    //See: https://github.com/ethereum/wiki/wiki/RLP
    function arrayifyInteger(value) {
        const result = [];
        while (value) {
            result.unshift(value & 0xff);
            value >>= 8;
        }
        return result;
    }
    function _encode(object) {
        if (Array.isArray(object)) {
            let payload = [];
            object.forEach(function (child) {
                payload = payload.concat(_encode(child));
            });
            if (payload.length <= 55) {
                payload.unshift(0xc0 + payload.length);
                return payload;
            }
            const length = arrayifyInteger(payload.length);
            length.unshift(0xf7 + length.length);
            return length.concat(payload);
        }
        const data = Array.prototype.slice.call(getBytes(object, "object"));
        if (data.length === 1 && data[0] <= 0x7f) {
            return data;
        }
        else if (data.length <= 55) {
            data.unshift(0x80 + data.length);
            return data;
        }
        const length = arrayifyInteger(data.length);
        length.unshift(0xb7 + length.length);
        return length.concat(data);
    }
    const nibbles = "0123456789abcdef";
    /**
     *  Encodes %%object%% as an RLP-encoded [[DataHexString]].
     */
    function encodeRlp(object) {
        let result = "0x";
        for (const v of _encode(object)) {
            result += nibbles[v >> 4];
            result += nibbles[v & 0xf];
        }
        return result;
    }

    /**
     *  Most interactions with Ethereum requires integer values, which use
     *  the smallest magnitude unit.
     *
     *  For example, imagine dealing with dollars and cents. Since dollars
     *  are divisible, non-integer values are possible, such as ``$10.77``.
     *  By using the smallest indivisible unit (i.e. cents), the value can
     *  be kept as the integer ``1077``.
     *
     *  When receiving decimal input from the user (as a decimal string),
     *  the value should be converted to an integer and when showing a user
     *  a value, the integer value should be converted to a decimal string.
     *
     *  This creates a clear distinction, between values to be used by code
     *  (integers) and values used for display logic to users (decimals).
     *
     *  The native unit in Ethereum, //ether// is divisible to 18 decimal places,
     *  where each individual unit is called a //wei//.
     *
     *  @_subsection api/utils:Unit Conversion  [about-units]
     */
    const names = [
        "wei",
        "kwei",
        "mwei",
        "gwei",
        "szabo",
        "finney",
        "ether",
    ];
    /**
     *  Converts %%value%% into a //decimal string//, assuming %%unit%% decimal
     *  places. The %%unit%% may be the number of decimal places or the name of
     *  a unit (e.g. ``"gwei"`` for 9 decimal places).
     *
     */
    function formatUnits(value, unit) {
        let decimals = 18;
        if (typeof (unit) === "string") {
            const index = names.indexOf(unit);
            assertArgument(index >= 0, "invalid unit", "unit", unit);
            decimals = 3 * index;
        }
        else if (unit != null) {
            decimals = getNumber(unit, "unit");
        }
        return FixedNumber.fromValue(value, decimals, { decimals, width: 512 }).toString();
    }
    /**
     *  Converts the //decimal string// %%value%% to a BigInt, assuming
     *  %%unit%% decimal places. The %%unit%% may the number of decimal places
     *  or the name of a unit (e.g. ``"gwei"`` for 9 decimal places).
     */
    function parseUnits$1(value, unit) {
        assertArgument(typeof (value) === "string", "value must be a string", "value", value);
        let decimals = 18;
        if (typeof (unit) === "string") {
            const index = names.indexOf(unit);
            assertArgument(index >= 0, "invalid unit", "unit", unit);
            decimals = 3 * index;
        }
        else if (unit != null) {
            decimals = getNumber(unit, "unit");
        }
        return FixedNumber.fromString(value, { decimals, width: 512 }).value;
    }
    /**
     *  Converts %%value%% into a //decimal string// using 18 decimal places.
     */
    function formatEther(wei) {
        return formatUnits(wei, 18);
    }
    /**
     *  Converts the //decimal string// %%ether%% to a BigInt, using 18
     *  decimal places.
     */
    function parseEther(ether) {
        return parseUnits$1(ether, 18);
    }

    /**
     *  Explain UUID and link to RFC here.
     *
     *  @_subsection: api/utils:UUID  [about-uuid]
     */
    /**
     *  Returns the version 4 [[link-uuid]] for the %%randomBytes%%.
     *
     *  @see: https://www.ietf.org/rfc/rfc4122.txt (Section 4.4)
     */
    function uuidV4(randomBytes) {
        const bytes = getBytes(randomBytes, "randomBytes");
        // Section: 4.1.3:
        // - time_hi_and_version[12:16] = 0b0100
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        // Section 4.4
        // - clock_seq_hi_and_reserved[6] = 0b0
        // - clock_seq_hi_and_reserved[7] = 0b1
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const value = hexlify(bytes);
        return [
            value.substring(2, 10),
            value.substring(10, 14),
            value.substring(14, 18),
            value.substring(18, 22),
            value.substring(22, 34),
        ].join("-");
    }

    /**
     * @_ignore:
     */
    const WordSize = 32;
    const Padding = new Uint8Array(WordSize);
    // Properties used to immediate pass through to the underlying object
    // - `then` is used to detect if an object is a Promise for await
    const passProperties$1 = ["then"];
    const _guard$4 = {};
    function throwError(name, error) {
        const wrapped = new Error(`deferred error during ABI decoding triggered accessing ${name}`);
        wrapped.error = error;
        throw wrapped;
    }
    /**
     *  A [[Result]] is a sub-class of Array, which allows accessing any
     *  of its values either positionally by its index or, if keys are
     *  provided by its name.
     *
     *  @_docloc: api/abi
     */
    class Result extends Array {
        #names;
        /**
         *  @private
         */
        constructor(...args) {
            // To properly sub-class Array so the other built-in
            // functions work, the constructor has to behave fairly
            // well. So, in the event we are created via fromItems()
            // we build the read-only Result object we want, but on
            // any other input, we use the default constructor
            // constructor(guard: any, items: Array<any>, keys?: Array<null | string>);
            const guard = args[0];
            let items = args[1];
            let names = (args[2] || []).slice();
            let wrap = true;
            if (guard !== _guard$4) {
                items = args;
                names = [];
                wrap = false;
            }
            // Can't just pass in ...items since an array of length 1
            // is a special case in the super.
            super(items.length);
            items.forEach((item, index) => { this[index] = item; });
            // Find all unique keys
            const nameCounts = names.reduce((accum, name) => {
                if (typeof (name) === "string") {
                    accum.set(name, (accum.get(name) || 0) + 1);
                }
                return accum;
            }, (new Map()));
            // Remove any key thats not unique
            this.#names = Object.freeze(items.map((item, index) => {
                const name = names[index];
                if (name != null && nameCounts.get(name) === 1) {
                    return name;
                }
                return null;
            }));
            if (!wrap) {
                return;
            }
            // A wrapped Result is immutable
            Object.freeze(this);
            // Proxy indices and names so we can trap deferred errors
            return new Proxy(this, {
                get: (target, prop, receiver) => {
                    if (typeof (prop) === "string") {
                        // Index accessor
                        if (prop.match(/^[0-9]+$/)) {
                            const index = getNumber(prop, "%index");
                            if (index < 0 || index >= this.length) {
                                throw new RangeError("out of result range");
                            }
                            const item = target[index];
                            if (item instanceof Error) {
                                throwError(`index ${index}`, item);
                            }
                            return item;
                        }
                        // Pass important checks (like `then` for Promise) through
                        if (passProperties$1.indexOf(prop) >= 0) {
                            return Reflect.get(target, prop, receiver);
                        }
                        const value = target[prop];
                        if (value instanceof Function) {
                            // Make sure functions work with private variables
                            // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy#no_private_property_forwarding
                            return function (...args) {
                                return value.apply((this === receiver) ? target : this, args);
                            };
                        }
                        else if (!(prop in target)) {
                            // Possible name accessor
                            return target.getValue.apply((this === receiver) ? target : this, [prop]);
                        }
                    }
                    return Reflect.get(target, prop, receiver);
                }
            });
        }
        /**
         *  Returns the Result as a normal Array.
         *
         *  This will throw if there are any outstanding deferred
         *  errors.
         */
        toArray() {
            const result = [];
            this.forEach((item, index) => {
                if (item instanceof Error) {
                    throwError(`index ${index}`, item);
                }
                result.push(item);
            });
            return result;
        }
        /**
         *  Returns the Result as an Object with each name-value pair.
         *
         *  This will throw if any value is unnamed, or if there are
         *  any outstanding deferred errors.
         */
        toObject() {
            return this.#names.reduce((accum, name, index) => {
                assert(name != null, "value at index ${ index } unnamed", "UNSUPPORTED_OPERATION", {
                    operation: "toObject()"
                });
                // Add values for names that don't conflict
                if (!(name in accum)) {
                    accum[name] = this.getValue(name);
                }
                return accum;
            }, {});
        }
        /**
         *  @_ignore
         */
        slice(start, end) {
            if (start == null) {
                start = 0;
            }
            if (start < 0) {
                start += this.length;
                if (start < 0) {
                    start = 0;
                }
            }
            if (end == null) {
                end = this.length;
            }
            if (end < 0) {
                end += this.length;
                if (end < 0) {
                    end = 0;
                }
            }
            if (end > this.length) {
                end = this.length;
            }
            const result = [], names = [];
            for (let i = start; i < end; i++) {
                result.push(this[i]);
                names.push(this.#names[i]);
            }
            return new Result(_guard$4, result, names);
        }
        /**
         *  @_ignore
         */
        filter(callback, thisArg) {
            const result = [], names = [];
            for (let i = 0; i < this.length; i++) {
                const item = this[i];
                if (item instanceof Error) {
                    throwError(`index ${i}`, item);
                }
                if (callback.call(thisArg, item, i, this)) {
                    result.push(item);
                    names.push(this.#names[i]);
                }
            }
            return new Result(_guard$4, result, names);
        }
        /**
         *  @_ignore
         */
        map(callback, thisArg) {
            const result = [];
            for (let i = 0; i < this.length; i++) {
                const item = this[i];
                if (item instanceof Error) {
                    throwError(`index ${i}`, item);
                }
                result.push(callback.call(thisArg, item, i, this));
            }
            return result;
        }
        /**
         *  Returns the value for %%name%%.
         *
         *  Since it is possible to have a key whose name conflicts with
         *  a method on a [[Result]] or its superclass Array, or any
         *  JavaScript keyword, this ensures all named values are still
         *  accessible by name.
         */
        getValue(name) {
            const index = this.#names.indexOf(name);
            if (index === -1) {
                return undefined;
            }
            const value = this[index];
            if (value instanceof Error) {
                throwError(`property ${JSON.stringify(name)}`, value.error);
            }
            return value;
        }
        /**
         *  Creates a new [[Result]] for %%items%% with each entry
         *  also accessible by its corresponding name in %%keys%%.
         */
        static fromItems(items, keys) {
            return new Result(_guard$4, items, keys);
        }
    }
    /**
     *  Returns all errors found in a [[Result]].
     *
     *  Since certain errors encountered when creating a [[Result]] do
     *  not impact the ability to continue parsing data, they are
     *  deferred until they are actually accessed. Hence a faulty string
     *  in an Event that is never used does not impact the program flow.
     *
     *  However, sometimes it may be useful to access, identify or
     *  validate correctness of a [[Result]].
     *
     *  @_docloc api/abi
     */
    function checkResultErrors(result) {
        // Find the first error (if any)
        const errors = [];
        const checkErrors = function (path, object) {
            if (!Array.isArray(object)) {
                return;
            }
            for (let key in object) {
                const childPath = path.slice();
                childPath.push(key);
                try {
                    checkErrors(childPath, object[key]);
                }
                catch (error) {
                    errors.push({ path: childPath, error: error });
                }
            }
        };
        checkErrors([], result);
        return errors;
    }
    function getValue$1(value) {
        let bytes = toBeArray(value);
        assert(bytes.length <= WordSize, "value out-of-bounds", "BUFFER_OVERRUN", { buffer: bytes, length: WordSize, offset: bytes.length });
        if (bytes.length !== WordSize) {
            bytes = getBytesCopy(concat([Padding.slice(bytes.length % WordSize), bytes]));
        }
        return bytes;
    }
    /**
     *  @_ignore
     */
    class Coder {
        // The coder name:
        //   - address, uint256, tuple, array, etc.
        name;
        // The fully expanded type, including composite types:
        //   - address, uint256, tuple(address,bytes), uint256[3][4][],  etc.
        type;
        // The localName bound in the signature, in this example it is "baz":
        //   - tuple(address foo, uint bar) baz
        localName;
        // Whether this type is dynamic:
        //  - Dynamic: bytes, string, address[], tuple(boolean[]), etc.
        //  - Not Dynamic: address, uint256, boolean[3], tuple(address, uint8)
        dynamic;
        constructor(name, type, localName, dynamic) {
            defineProperties(this, { name, type, localName, dynamic }, {
                name: "string", type: "string", localName: "string", dynamic: "boolean"
            });
        }
        _throwError(message, value) {
            assertArgument(false, message, this.localName, value);
        }
    }
    /**
     *  @_ignore
     */
    class Writer {
        // An array of WordSize lengthed objects to concatenation
        #data;
        #dataLength;
        constructor() {
            this.#data = [];
            this.#dataLength = 0;
        }
        get data() {
            return concat(this.#data);
        }
        get length() { return this.#dataLength; }
        #writeData(data) {
            this.#data.push(data);
            this.#dataLength += data.length;
            return data.length;
        }
        appendWriter(writer) {
            return this.#writeData(getBytesCopy(writer.data));
        }
        // Arrayish item; pad on the right to *nearest* WordSize
        writeBytes(value) {
            let bytes = getBytesCopy(value);
            const paddingOffset = bytes.length % WordSize;
            if (paddingOffset) {
                bytes = getBytesCopy(concat([bytes, Padding.slice(paddingOffset)]));
            }
            return this.#writeData(bytes);
        }
        // Numeric item; pad on the left *to* WordSize
        writeValue(value) {
            return this.#writeData(getValue$1(value));
        }
        // Inserts a numeric place-holder, returning a callback that can
        // be used to asjust the value later
        writeUpdatableValue() {
            const offset = this.#data.length;
            this.#data.push(Padding);
            this.#dataLength += WordSize;
            return (value) => {
                this.#data[offset] = getValue$1(value);
            };
        }
    }
    /**
     *  @_ignore
     */
    class Reader {
        // Allows incomplete unpadded data to be read; otherwise an error
        // is raised if attempting to overrun the buffer. This is required
        // to deal with an old Solidity bug, in which event data for
        // external (not public thoguh) was tightly packed.
        allowLoose;
        #data;
        #offset;
        constructor(data, allowLoose) {
            defineProperties(this, { allowLoose: !!allowLoose });
            this.#data = getBytesCopy(data);
            this.#offset = 0;
        }
        get data() { return hexlify(this.#data); }
        get dataLength() { return this.#data.length; }
        get consumed() { return this.#offset; }
        get bytes() { return new Uint8Array(this.#data); }
        #peekBytes(offset, length, loose) {
            let alignedLength = Math.ceil(length / WordSize) * WordSize;
            if (this.#offset + alignedLength > this.#data.length) {
                if (this.allowLoose && loose && this.#offset + length <= this.#data.length) {
                    alignedLength = length;
                }
                else {
                    assert(false, "data out-of-bounds", "BUFFER_OVERRUN", {
                        buffer: getBytesCopy(this.#data),
                        length: this.#data.length,
                        offset: this.#offset + alignedLength
                    });
                }
            }
            return this.#data.slice(this.#offset, this.#offset + alignedLength);
        }
        // Create a sub-reader with the same underlying data, but offset
        subReader(offset) {
            return new Reader(this.#data.slice(this.#offset + offset), this.allowLoose);
        }
        // Read bytes
        readBytes(length, loose) {
            let bytes = this.#peekBytes(0, length, !!loose);
            this.#offset += bytes.length;
            // @TODO: Make sure the length..end bytes are all 0?
            return bytes.slice(0, length);
        }
        // Read a numeric values
        readValue() {
            return toBigInt(this.readBytes(WordSize));
        }
        readIndex() {
            return toNumber(this.readBytes(WordSize));
        }
    }

    function number(n) {
        if (!Number.isSafeInteger(n) || n < 0)
            throw new Error(`Wrong positive integer: ${n}`);
    }
    function bytes(b, ...lengths) {
        if (!(b instanceof Uint8Array))
            throw new Error('Expected Uint8Array');
        if (lengths.length > 0 && !lengths.includes(b.length))
            throw new Error(`Expected Uint8Array of length ${lengths}, not of length=${b.length}`);
    }
    function hash(hash) {
        if (typeof hash !== 'function' || typeof hash.create !== 'function')
            throw new Error('Hash should be wrapped by utils.wrapConstructor');
        number(hash.outputLen);
        number(hash.blockLen);
    }
    function exists(instance, checkFinished = true) {
        if (instance.destroyed)
            throw new Error('Hash instance has been destroyed');
        if (checkFinished && instance.finished)
            throw new Error('Hash#digest() has already been called');
    }
    function output(out, instance) {
        bytes(out);
        const min = instance.outputLen;
        if (out.length < min) {
            throw new Error(`digestInto() expects output buffer of length at least ${min}`);
        }
    }

    const crypto$1 = typeof globalThis === 'object' && 'crypto' in globalThis ? globalThis.crypto : undefined;

    /*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
    // We use WebCrypto aka globalThis.crypto, which exists in browsers and node.js 16+.
    // node.js versions earlier than v19 don't declare it in global scope.
    // For node.js, package.json#exports field mapping rewrites import
    // from `crypto` to `cryptoNode`, which imports native module.
    // Makes the utils un-importable in browsers without a bundler.
    // Once node.js 18 is deprecated, we can just drop the import.
    const u8a$1 = (a) => a instanceof Uint8Array;
    const u32 = (arr) => new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
    // Cast array to view
    const createView = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
    // The rotate right (circular right shift) operation for uint32
    const rotr = (word, shift) => (word << (32 - shift)) | (word >>> shift);
    // big-endian hardware is rare. Just in case someone still decides to run hashes:
    // early-throw an error because we don't support BE yet.
    const isLE = new Uint8Array(new Uint32Array([0x11223344]).buffer)[0] === 0x44;
    if (!isLE)
        throw new Error('Non little-endian hardware is not supported');
    // There is no setImmediate in browser and setTimeout is slow.
    // call of async fn will return Promise, which will be fullfiled only on
    // next scheduler queue processing step and this is exactly what we need.
    const nextTick = async () => { };
    // Returns control to thread each 'tick' ms to avoid blocking
    async function asyncLoop(iters, tick, cb) {
        let ts = Date.now();
        for (let i = 0; i < iters; i++) {
            cb(i);
            // Date.now() is not monotonic, so in case if clock goes backwards we return return control too
            const diff = Date.now() - ts;
            if (diff >= 0 && diff < tick)
                continue;
            await nextTick();
            ts += diff;
        }
    }
    /**
     * @example utf8ToBytes('abc') // new Uint8Array([97, 98, 99])
     */
    function utf8ToBytes$1(str) {
        if (typeof str !== 'string')
            throw new Error(`utf8ToBytes expected string, got ${typeof str}`);
        return new Uint8Array(new TextEncoder().encode(str)); // https://bugzil.la/1681809
    }
    /**
     * Normalizes (non-hex) string or Uint8Array to Uint8Array.
     * Warning: when Uint8Array is passed, it would NOT get copied.
     * Keep in mind for future mutable operations.
     */
    function toBytes(data) {
        if (typeof data === 'string')
            data = utf8ToBytes$1(data);
        if (!u8a$1(data))
            throw new Error(`expected Uint8Array, got ${typeof data}`);
        return data;
    }
    /**
     * Copies several Uint8Arrays into one.
     */
    function concatBytes$1(...arrays) {
        const r = new Uint8Array(arrays.reduce((sum, a) => sum + a.length, 0));
        let pad = 0; // walk through each item, ensure they have proper type
        arrays.forEach((a) => {
            if (!u8a$1(a))
                throw new Error('Uint8Array expected');
            r.set(a, pad);
            pad += a.length;
        });
        return r;
    }
    // For runtime check if class implements interface
    class Hash {
        // Safe version that clones internal state
        clone() {
            return this._cloneInto();
        }
    }
    const toStr = {}.toString;
    function checkOpts(defaults, opts) {
        if (opts !== undefined && toStr.call(opts) !== '[object Object]')
            throw new Error('Options should be object or undefined');
        const merged = Object.assign(defaults, opts);
        return merged;
    }
    function wrapConstructor(hashCons) {
        const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
        const tmp = hashCons();
        hashC.outputLen = tmp.outputLen;
        hashC.blockLen = tmp.blockLen;
        hashC.create = () => hashCons();
        return hashC;
    }
    /**
     * Secure PRNG. Uses `crypto.getRandomValues`, which defers to OS.
     */
    function randomBytes$2(bytesLength = 32) {
        if (crypto$1 && typeof crypto$1.getRandomValues === 'function') {
            return crypto$1.getRandomValues(new Uint8Array(bytesLength));
        }
        throw new Error('crypto.getRandomValues must be defined');
    }

    // HMAC (RFC 2104)
    class HMAC extends Hash {
        constructor(hash$1, _key) {
            super();
            this.finished = false;
            this.destroyed = false;
            hash(hash$1);
            const key = toBytes(_key);
            this.iHash = hash$1.create();
            if (typeof this.iHash.update !== 'function')
                throw new Error('Expected instance of class which extends utils.Hash');
            this.blockLen = this.iHash.blockLen;
            this.outputLen = this.iHash.outputLen;
            const blockLen = this.blockLen;
            const pad = new Uint8Array(blockLen);
            // blockLen can be bigger than outputLen
            pad.set(key.length > blockLen ? hash$1.create().update(key).digest() : key);
            for (let i = 0; i < pad.length; i++)
                pad[i] ^= 0x36;
            this.iHash.update(pad);
            // By doing update (processing of first block) of outer hash here we can re-use it between multiple calls via clone
            this.oHash = hash$1.create();
            // Undo internal XOR && apply outer XOR
            for (let i = 0; i < pad.length; i++)
                pad[i] ^= 0x36 ^ 0x5c;
            this.oHash.update(pad);
            pad.fill(0);
        }
        update(buf) {
            exists(this);
            this.iHash.update(buf);
            return this;
        }
        digestInto(out) {
            exists(this);
            bytes(out, this.outputLen);
            this.finished = true;
            this.iHash.digestInto(out);
            this.oHash.update(out);
            this.oHash.digestInto(out);
            this.destroy();
        }
        digest() {
            const out = new Uint8Array(this.oHash.outputLen);
            this.digestInto(out);
            return out;
        }
        _cloneInto(to) {
            // Create new instance without calling constructor since key already in state and we don't know it.
            to || (to = Object.create(Object.getPrototypeOf(this), {}));
            const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
            to = to;
            to.finished = finished;
            to.destroyed = destroyed;
            to.blockLen = blockLen;
            to.outputLen = outputLen;
            to.oHash = oHash._cloneInto(to.oHash);
            to.iHash = iHash._cloneInto(to.iHash);
            return to;
        }
        destroy() {
            this.destroyed = true;
            this.oHash.destroy();
            this.iHash.destroy();
        }
    }
    /**
     * HMAC: RFC2104 message authentication code.
     * @param hash - function that would be used e.g. sha256
     * @param key - message key
     * @param message - message data
     */
    const hmac = (hash, key, message) => new HMAC(hash, key).update(message).digest();
    hmac.create = (hash, key) => new HMAC(hash, key);

    // Common prologue and epilogue for sync/async functions
    function pbkdf2Init(hash$1, _password, _salt, _opts) {
        hash(hash$1);
        const opts = checkOpts({ dkLen: 32, asyncTick: 10 }, _opts);
        const { c, dkLen, asyncTick } = opts;
        number(c);
        number(dkLen);
        number(asyncTick);
        if (c < 1)
            throw new Error('PBKDF2: iterations (c) should be >= 1');
        const password = toBytes(_password);
        const salt = toBytes(_salt);
        // DK = PBKDF2(PRF, Password, Salt, c, dkLen);
        const DK = new Uint8Array(dkLen);
        // U1 = PRF(Password, Salt + INT_32_BE(i))
        const PRF = hmac.create(hash$1, password);
        const PRFSalt = PRF._cloneInto().update(salt);
        return { c, dkLen, asyncTick, DK, PRF, PRFSalt };
    }
    function pbkdf2Output(PRF, PRFSalt, DK, prfW, u) {
        PRF.destroy();
        PRFSalt.destroy();
        if (prfW)
            prfW.destroy();
        u.fill(0);
        return DK;
    }
    /**
     * PBKDF2-HMAC: RFC 2898 key derivation function
     * @param hash - hash function that would be used e.g. sha256
     * @param password - password from which a derived key is generated
     * @param salt - cryptographic salt
     * @param opts - {c, dkLen} where c is work factor and dkLen is output message size
     */
    function pbkdf2$1(hash, password, salt, opts) {
        const { c, dkLen, DK, PRF, PRFSalt } = pbkdf2Init(hash, password, salt, opts);
        let prfW; // Working copy
        const arr = new Uint8Array(4);
        const view = createView(arr);
        const u = new Uint8Array(PRF.outputLen);
        // DK = T1 + T2 + ⋯ + Tdklen/hlen
        for (let ti = 1, pos = 0; pos < dkLen; ti++, pos += PRF.outputLen) {
            // Ti = F(Password, Salt, c, i)
            const Ti = DK.subarray(pos, pos + PRF.outputLen);
            view.setInt32(0, ti, false);
            // F(Password, Salt, c, i) = U1 ^ U2 ^ ⋯ ^ Uc
            // U1 = PRF(Password, Salt + INT_32_BE(i))
            (prfW = PRFSalt._cloneInto(prfW)).update(arr).digestInto(u);
            Ti.set(u.subarray(0, Ti.length));
            for (let ui = 1; ui < c; ui++) {
                // Uc = PRF(Password, Uc−1)
                PRF._cloneInto(prfW).update(u).digestInto(u);
                for (let i = 0; i < Ti.length; i++)
                    Ti[i] ^= u[i];
            }
        }
        return pbkdf2Output(PRF, PRFSalt, DK, prfW, u);
    }

    // Polyfill for Safari 14
    function setBigUint64(view, byteOffset, value, isLE) {
        if (typeof view.setBigUint64 === 'function')
            return view.setBigUint64(byteOffset, value, isLE);
        const _32n = BigInt(32);
        const _u32_max = BigInt(0xffffffff);
        const wh = Number((value >> _32n) & _u32_max);
        const wl = Number(value & _u32_max);
        const h = isLE ? 4 : 0;
        const l = isLE ? 0 : 4;
        view.setUint32(byteOffset + h, wh, isLE);
        view.setUint32(byteOffset + l, wl, isLE);
    }
    // Base SHA2 class (RFC 6234)
    class SHA2 extends Hash {
        constructor(blockLen, outputLen, padOffset, isLE) {
            super();
            this.blockLen = blockLen;
            this.outputLen = outputLen;
            this.padOffset = padOffset;
            this.isLE = isLE;
            this.finished = false;
            this.length = 0;
            this.pos = 0;
            this.destroyed = false;
            this.buffer = new Uint8Array(blockLen);
            this.view = createView(this.buffer);
        }
        update(data) {
            exists(this);
            const { view, buffer, blockLen } = this;
            data = toBytes(data);
            const len = data.length;
            for (let pos = 0; pos < len;) {
                const take = Math.min(blockLen - this.pos, len - pos);
                // Fast path: we have at least one block in input, cast it to view and process
                if (take === blockLen) {
                    const dataView = createView(data);
                    for (; blockLen <= len - pos; pos += blockLen)
                        this.process(dataView, pos);
                    continue;
                }
                buffer.set(data.subarray(pos, pos + take), this.pos);
                this.pos += take;
                pos += take;
                if (this.pos === blockLen) {
                    this.process(view, 0);
                    this.pos = 0;
                }
            }
            this.length += data.length;
            this.roundClean();
            return this;
        }
        digestInto(out) {
            exists(this);
            output(out, this);
            this.finished = true;
            // Padding
            // We can avoid allocation of buffer for padding completely if it
            // was previously not allocated here. But it won't change performance.
            const { buffer, view, blockLen, isLE } = this;
            let { pos } = this;
            // append the bit '1' to the message
            buffer[pos++] = 0b10000000;
            this.buffer.subarray(pos).fill(0);
            // we have less than padOffset left in buffer, so we cannot put length in current block, need process it and pad again
            if (this.padOffset > blockLen - pos) {
                this.process(view, 0);
                pos = 0;
            }
            // Pad until full block byte with zeros
            for (let i = pos; i < blockLen; i++)
                buffer[i] = 0;
            // Note: sha512 requires length to be 128bit integer, but length in JS will overflow before that
            // You need to write around 2 exabytes (u64_max / 8 / (1024**6)) for this to happen.
            // So we just write lowest 64 bits of that value.
            setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE);
            this.process(view, 0);
            const oview = createView(out);
            const len = this.outputLen;
            // NOTE: we do division by 4 later, which should be fused in single op with modulo by JIT
            if (len % 4)
                throw new Error('_sha2: outputLen should be aligned to 32bit');
            const outLen = len / 4;
            const state = this.get();
            if (outLen > state.length)
                throw new Error('_sha2: outputLen bigger than state');
            for (let i = 0; i < outLen; i++)
                oview.setUint32(4 * i, state[i], isLE);
        }
        digest() {
            const { buffer, outputLen } = this;
            this.digestInto(buffer);
            const res = buffer.slice(0, outputLen);
            this.destroy();
            return res;
        }
        _cloneInto(to) {
            to || (to = new this.constructor());
            to.set(...this.get());
            const { blockLen, buffer, length, finished, destroyed, pos } = this;
            to.length = length;
            to.pos = pos;
            to.finished = finished;
            to.destroyed = destroyed;
            if (length % blockLen)
                to.buffer.set(buffer);
            return to;
        }
    }

    // SHA2-256 need to try 2^128 hashes to execute birthday attack.
    // BTC network is doing 2^67 hashes/sec as per early 2023.
    // Choice: a ? b : c
    const Chi = (a, b, c) => (a & b) ^ (~a & c);
    // Majority function, true if any two inpust is true
    const Maj = (a, b, c) => (a & b) ^ (a & c) ^ (b & c);
    // Round constants:
    // first 32 bits of the fractional parts of the cube roots of the first 64 primes 2..311)
    // prettier-ignore
    const SHA256_K = /* @__PURE__ */ new Uint32Array([
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ]);
    // Initial state (first 32 bits of the fractional parts of the square roots of the first 8 primes 2..19):
    // prettier-ignore
    const IV = /* @__PURE__ */ new Uint32Array([
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ]);
    // Temporary buffer, not used to store anything between runs
    // Named this way because it matches specification.
    const SHA256_W = /* @__PURE__ */ new Uint32Array(64);
    class SHA256 extends SHA2 {
        constructor() {
            super(64, 32, 8, false);
            // We cannot use array here since array allows indexing by variable
            // which means optimizer/compiler cannot use registers.
            this.A = IV[0] | 0;
            this.B = IV[1] | 0;
            this.C = IV[2] | 0;
            this.D = IV[3] | 0;
            this.E = IV[4] | 0;
            this.F = IV[5] | 0;
            this.G = IV[6] | 0;
            this.H = IV[7] | 0;
        }
        get() {
            const { A, B, C, D, E, F, G, H } = this;
            return [A, B, C, D, E, F, G, H];
        }
        // prettier-ignore
        set(A, B, C, D, E, F, G, H) {
            this.A = A | 0;
            this.B = B | 0;
            this.C = C | 0;
            this.D = D | 0;
            this.E = E | 0;
            this.F = F | 0;
            this.G = G | 0;
            this.H = H | 0;
        }
        process(view, offset) {
            // Extend the first 16 words into the remaining 48 words w[16..63] of the message schedule array
            for (let i = 0; i < 16; i++, offset += 4)
                SHA256_W[i] = view.getUint32(offset, false);
            for (let i = 16; i < 64; i++) {
                const W15 = SHA256_W[i - 15];
                const W2 = SHA256_W[i - 2];
                const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ (W15 >>> 3);
                const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ (W2 >>> 10);
                SHA256_W[i] = (s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16]) | 0;
            }
            // Compression function main loop, 64 rounds
            let { A, B, C, D, E, F, G, H } = this;
            for (let i = 0; i < 64; i++) {
                const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
                const T1 = (H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i]) | 0;
                const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
                const T2 = (sigma0 + Maj(A, B, C)) | 0;
                H = G;
                G = F;
                F = E;
                E = (D + T1) | 0;
                D = C;
                C = B;
                B = A;
                A = (T1 + T2) | 0;
            }
            // Add the compressed chunk to the current hash value
            A = (A + this.A) | 0;
            B = (B + this.B) | 0;
            C = (C + this.C) | 0;
            D = (D + this.D) | 0;
            E = (E + this.E) | 0;
            F = (F + this.F) | 0;
            G = (G + this.G) | 0;
            H = (H + this.H) | 0;
            this.set(A, B, C, D, E, F, G, H);
        }
        roundClean() {
            SHA256_W.fill(0);
        }
        destroy() {
            this.set(0, 0, 0, 0, 0, 0, 0, 0);
            this.buffer.fill(0);
        }
    }
    /**
     * SHA2-256 hash function
     * @param message - data that would be hashed
     */
    const sha256$1 = /* @__PURE__ */ wrapConstructor(() => new SHA256());

    const U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
    const _32n = /* @__PURE__ */ BigInt(32);
    // We are not using BigUint64Array, because they are extremely slow as per 2022
    function fromBig(n, le = false) {
        if (le)
            return { h: Number(n & U32_MASK64), l: Number((n >> _32n) & U32_MASK64) };
        return { h: Number((n >> _32n) & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
    }
    function split$1(lst, le = false) {
        let Ah = new Uint32Array(lst.length);
        let Al = new Uint32Array(lst.length);
        for (let i = 0; i < lst.length; i++) {
            const { h, l } = fromBig(lst[i], le);
            [Ah[i], Al[i]] = [h, l];
        }
        return [Ah, Al];
    }
    const toBig = (h, l) => (BigInt(h >>> 0) << _32n) | BigInt(l >>> 0);
    // for Shift in [0, 32)
    const shrSH = (h, _l, s) => h >>> s;
    const shrSL = (h, l, s) => (h << (32 - s)) | (l >>> s);
    // Right rotate for Shift in [1, 32)
    const rotrSH = (h, l, s) => (h >>> s) | (l << (32 - s));
    const rotrSL = (h, l, s) => (h << (32 - s)) | (l >>> s);
    // Right rotate for Shift in (32, 64), NOTE: 32 is special case.
    const rotrBH = (h, l, s) => (h << (64 - s)) | (l >>> (s - 32));
    const rotrBL = (h, l, s) => (h >>> (s - 32)) | (l << (64 - s));
    // Right rotate for shift===32 (just swaps l&h)
    const rotr32H = (_h, l) => l;
    const rotr32L = (h, _l) => h;
    // Left rotate for Shift in [1, 32)
    const rotlSH = (h, l, s) => (h << s) | (l >>> (32 - s));
    const rotlSL = (h, l, s) => (l << s) | (h >>> (32 - s));
    // Left rotate for Shift in (32, 64), NOTE: 32 is special case.
    const rotlBH = (h, l, s) => (l << (s - 32)) | (h >>> (64 - s));
    const rotlBL = (h, l, s) => (h << (s - 32)) | (l >>> (64 - s));
    // JS uses 32-bit signed integers for bitwise operations which means we cannot
    // simple take carry out of low bit sum by shift, we need to use division.
    function add(Ah, Al, Bh, Bl) {
        const l = (Al >>> 0) + (Bl >>> 0);
        return { h: (Ah + Bh + ((l / 2 ** 32) | 0)) | 0, l: l | 0 };
    }
    // Addition with more than 2 elements
    const add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
    const add3H = (low, Ah, Bh, Ch) => (Ah + Bh + Ch + ((low / 2 ** 32) | 0)) | 0;
    const add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
    const add4H = (low, Ah, Bh, Ch, Dh) => (Ah + Bh + Ch + Dh + ((low / 2 ** 32) | 0)) | 0;
    const add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
    const add5H = (low, Ah, Bh, Ch, Dh, Eh) => (Ah + Bh + Ch + Dh + Eh + ((low / 2 ** 32) | 0)) | 0;
    // prettier-ignore
    const u64 = {
        fromBig, split: split$1, toBig,
        shrSH, shrSL,
        rotrSH, rotrSL, rotrBH, rotrBL,
        rotr32H, rotr32L,
        rotlSH, rotlSL, rotlBH, rotlBL,
        add, add3L, add3H, add4L, add4H, add5H, add5L,
    };
    var u64$1 = u64;

    // Round contants (first 32 bits of the fractional parts of the cube roots of the first 80 primes 2..409):
    // prettier-ignore
    const [SHA512_Kh, SHA512_Kl] = /* @__PURE__ */ (() => u64$1.split([
        '0x428a2f98d728ae22', '0x7137449123ef65cd', '0xb5c0fbcfec4d3b2f', '0xe9b5dba58189dbbc',
        '0x3956c25bf348b538', '0x59f111f1b605d019', '0x923f82a4af194f9b', '0xab1c5ed5da6d8118',
        '0xd807aa98a3030242', '0x12835b0145706fbe', '0x243185be4ee4b28c', '0x550c7dc3d5ffb4e2',
        '0x72be5d74f27b896f', '0x80deb1fe3b1696b1', '0x9bdc06a725c71235', '0xc19bf174cf692694',
        '0xe49b69c19ef14ad2', '0xefbe4786384f25e3', '0x0fc19dc68b8cd5b5', '0x240ca1cc77ac9c65',
        '0x2de92c6f592b0275', '0x4a7484aa6ea6e483', '0x5cb0a9dcbd41fbd4', '0x76f988da831153b5',
        '0x983e5152ee66dfab', '0xa831c66d2db43210', '0xb00327c898fb213f', '0xbf597fc7beef0ee4',
        '0xc6e00bf33da88fc2', '0xd5a79147930aa725', '0x06ca6351e003826f', '0x142929670a0e6e70',
        '0x27b70a8546d22ffc', '0x2e1b21385c26c926', '0x4d2c6dfc5ac42aed', '0x53380d139d95b3df',
        '0x650a73548baf63de', '0x766a0abb3c77b2a8', '0x81c2c92e47edaee6', '0x92722c851482353b',
        '0xa2bfe8a14cf10364', '0xa81a664bbc423001', '0xc24b8b70d0f89791', '0xc76c51a30654be30',
        '0xd192e819d6ef5218', '0xd69906245565a910', '0xf40e35855771202a', '0x106aa07032bbd1b8',
        '0x19a4c116b8d2d0c8', '0x1e376c085141ab53', '0x2748774cdf8eeb99', '0x34b0bcb5e19b48a8',
        '0x391c0cb3c5c95a63', '0x4ed8aa4ae3418acb', '0x5b9cca4f7763e373', '0x682e6ff3d6b2b8a3',
        '0x748f82ee5defb2fc', '0x78a5636f43172f60', '0x84c87814a1f0ab72', '0x8cc702081a6439ec',
        '0x90befffa23631e28', '0xa4506cebde82bde9', '0xbef9a3f7b2c67915', '0xc67178f2e372532b',
        '0xca273eceea26619c', '0xd186b8c721c0c207', '0xeada7dd6cde0eb1e', '0xf57d4f7fee6ed178',
        '0x06f067aa72176fba', '0x0a637dc5a2c898a6', '0x113f9804bef90dae', '0x1b710b35131c471b',
        '0x28db77f523047d84', '0x32caab7b40c72493', '0x3c9ebe0a15c9bebc', '0x431d67c49c100d4c',
        '0x4cc5d4becb3e42b6', '0x597f299cfc657e2a', '0x5fcb6fab3ad6faec', '0x6c44198c4a475817'
    ].map(n => BigInt(n))))();
    // Temporary buffer, not used to store anything between runs
    const SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
    const SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);
    class SHA512 extends SHA2 {
        constructor() {
            super(128, 64, 16, false);
            // We cannot use array here since array allows indexing by variable which means optimizer/compiler cannot use registers.
            // Also looks cleaner and easier to verify with spec.
            // Initial state (first 32 bits of the fractional parts of the square roots of the first 8 primes 2..19):
            // h -- high 32 bits, l -- low 32 bits
            this.Ah = 0x6a09e667 | 0;
            this.Al = 0xf3bcc908 | 0;
            this.Bh = 0xbb67ae85 | 0;
            this.Bl = 0x84caa73b | 0;
            this.Ch = 0x3c6ef372 | 0;
            this.Cl = 0xfe94f82b | 0;
            this.Dh = 0xa54ff53a | 0;
            this.Dl = 0x5f1d36f1 | 0;
            this.Eh = 0x510e527f | 0;
            this.El = 0xade682d1 | 0;
            this.Fh = 0x9b05688c | 0;
            this.Fl = 0x2b3e6c1f | 0;
            this.Gh = 0x1f83d9ab | 0;
            this.Gl = 0xfb41bd6b | 0;
            this.Hh = 0x5be0cd19 | 0;
            this.Hl = 0x137e2179 | 0;
        }
        // prettier-ignore
        get() {
            const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
            return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
        }
        // prettier-ignore
        set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
            this.Ah = Ah | 0;
            this.Al = Al | 0;
            this.Bh = Bh | 0;
            this.Bl = Bl | 0;
            this.Ch = Ch | 0;
            this.Cl = Cl | 0;
            this.Dh = Dh | 0;
            this.Dl = Dl | 0;
            this.Eh = Eh | 0;
            this.El = El | 0;
            this.Fh = Fh | 0;
            this.Fl = Fl | 0;
            this.Gh = Gh | 0;
            this.Gl = Gl | 0;
            this.Hh = Hh | 0;
            this.Hl = Hl | 0;
        }
        process(view, offset) {
            // Extend the first 16 words into the remaining 64 words w[16..79] of the message schedule array
            for (let i = 0; i < 16; i++, offset += 4) {
                SHA512_W_H[i] = view.getUint32(offset);
                SHA512_W_L[i] = view.getUint32((offset += 4));
            }
            for (let i = 16; i < 80; i++) {
                // s0 := (w[i-15] rightrotate 1) xor (w[i-15] rightrotate 8) xor (w[i-15] rightshift 7)
                const W15h = SHA512_W_H[i - 15] | 0;
                const W15l = SHA512_W_L[i - 15] | 0;
                const s0h = u64$1.rotrSH(W15h, W15l, 1) ^ u64$1.rotrSH(W15h, W15l, 8) ^ u64$1.shrSH(W15h, W15l, 7);
                const s0l = u64$1.rotrSL(W15h, W15l, 1) ^ u64$1.rotrSL(W15h, W15l, 8) ^ u64$1.shrSL(W15h, W15l, 7);
                // s1 := (w[i-2] rightrotate 19) xor (w[i-2] rightrotate 61) xor (w[i-2] rightshift 6)
                const W2h = SHA512_W_H[i - 2] | 0;
                const W2l = SHA512_W_L[i - 2] | 0;
                const s1h = u64$1.rotrSH(W2h, W2l, 19) ^ u64$1.rotrBH(W2h, W2l, 61) ^ u64$1.shrSH(W2h, W2l, 6);
                const s1l = u64$1.rotrSL(W2h, W2l, 19) ^ u64$1.rotrBL(W2h, W2l, 61) ^ u64$1.shrSL(W2h, W2l, 6);
                // SHA256_W[i] = s0 + s1 + SHA256_W[i - 7] + SHA256_W[i - 16];
                const SUMl = u64$1.add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
                const SUMh = u64$1.add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
                SHA512_W_H[i] = SUMh | 0;
                SHA512_W_L[i] = SUMl | 0;
            }
            let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
            // Compression function main loop, 80 rounds
            for (let i = 0; i < 80; i++) {
                // S1 := (e rightrotate 14) xor (e rightrotate 18) xor (e rightrotate 41)
                const sigma1h = u64$1.rotrSH(Eh, El, 14) ^ u64$1.rotrSH(Eh, El, 18) ^ u64$1.rotrBH(Eh, El, 41);
                const sigma1l = u64$1.rotrSL(Eh, El, 14) ^ u64$1.rotrSL(Eh, El, 18) ^ u64$1.rotrBL(Eh, El, 41);
                //const T1 = (H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i]) | 0;
                const CHIh = (Eh & Fh) ^ (~Eh & Gh);
                const CHIl = (El & Fl) ^ (~El & Gl);
                // T1 = H + sigma1 + Chi(E, F, G) + SHA512_K[i] + SHA512_W[i]
                // prettier-ignore
                const T1ll = u64$1.add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
                const T1h = u64$1.add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
                const T1l = T1ll | 0;
                // S0 := (a rightrotate 28) xor (a rightrotate 34) xor (a rightrotate 39)
                const sigma0h = u64$1.rotrSH(Ah, Al, 28) ^ u64$1.rotrBH(Ah, Al, 34) ^ u64$1.rotrBH(Ah, Al, 39);
                const sigma0l = u64$1.rotrSL(Ah, Al, 28) ^ u64$1.rotrBL(Ah, Al, 34) ^ u64$1.rotrBL(Ah, Al, 39);
                const MAJh = (Ah & Bh) ^ (Ah & Ch) ^ (Bh & Ch);
                const MAJl = (Al & Bl) ^ (Al & Cl) ^ (Bl & Cl);
                Hh = Gh | 0;
                Hl = Gl | 0;
                Gh = Fh | 0;
                Gl = Fl | 0;
                Fh = Eh | 0;
                Fl = El | 0;
                ({ h: Eh, l: El } = u64$1.add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
                Dh = Ch | 0;
                Dl = Cl | 0;
                Ch = Bh | 0;
                Cl = Bl | 0;
                Bh = Ah | 0;
                Bl = Al | 0;
                const All = u64$1.add3L(T1l, sigma0l, MAJl);
                Ah = u64$1.add3H(All, T1h, sigma0h, MAJh);
                Al = All | 0;
            }
            // Add the compressed chunk to the current hash value
            ({ h: Ah, l: Al } = u64$1.add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
            ({ h: Bh, l: Bl } = u64$1.add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
            ({ h: Ch, l: Cl } = u64$1.add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
            ({ h: Dh, l: Dl } = u64$1.add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
            ({ h: Eh, l: El } = u64$1.add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
            ({ h: Fh, l: Fl } = u64$1.add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
            ({ h: Gh, l: Gl } = u64$1.add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
            ({ h: Hh, l: Hl } = u64$1.add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
            this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
        }
        roundClean() {
            SHA512_W_H.fill(0);
            SHA512_W_L.fill(0);
        }
        destroy() {
            this.buffer.fill(0);
            this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        }
    }
    const sha512$1 = /* @__PURE__ */ wrapConstructor(() => new SHA512());

    /* Browser Crypto Shims */
    function getGlobal$1() {
        if (typeof self !== 'undefined') {
            return self;
        }
        if (typeof window !== 'undefined') {
            return window;
        }
        if (typeof global !== 'undefined') {
            return global;
        }
        throw new Error('unable to locate global object');
    }
    const anyGlobal = getGlobal$1();
    const crypto = anyGlobal.crypto || anyGlobal.msCrypto;
    function createHash(algo) {
        switch (algo) {
            case "sha256": return sha256$1.create();
            case "sha512": return sha512$1.create();
        }
        assertArgument(false, "invalid hashing algorithm name", "algorithm", algo);
    }
    function createHmac(_algo, key) {
        const algo = ({ sha256: sha256$1, sha512: sha512$1 }[_algo]);
        assertArgument(algo != null, "invalid hmac algorithm", "algorithm", _algo);
        return hmac.create(algo, key);
    }
    function pbkdf2Sync(password, salt, iterations, keylen, _algo) {
        const algo = ({ sha256: sha256$1, sha512: sha512$1 }[_algo]);
        assertArgument(algo != null, "invalid pbkdf2 algorithm", "algorithm", _algo);
        return pbkdf2$1(algo, password, salt, { c: iterations, dkLen: keylen });
    }
    function randomBytes$1(length) {
        assert(crypto != null, "platform does not support secure random numbers", "UNSUPPORTED_OPERATION", {
            operation: "randomBytes"
        });
        assertArgument(Number.isInteger(length) && length > 0 && length <= 1024, "invalid length", "length", length);
        const result = new Uint8Array(length);
        crypto.getRandomValues(result);
        return result;
    }

    /**
     *  An **HMAC** enables verification that a given key was used
     *  to authenticate a payload.
     *
     *  See: [[link-wiki-hmac]]
     *
     *  @_subsection: api/crypto:HMAC  [about-hmac]
     */
    let locked$4 = false;
    const _computeHmac = function (algorithm, key, data) {
        return createHmac(algorithm, key).update(data).digest();
    };
    let __computeHmac = _computeHmac;
    /**
     *  Return the HMAC for %%data%% using the %%key%% key with the underlying
     *  %%algo%% used for compression.
     *
     *  @example:
     *    key = id("some-secret")
     *
     *    // Compute the HMAC
     *    computeHmac("sha256", key, "0x1337")
     *    //_result:
     *
     *    // To compute the HMAC of UTF-8 data, the data must be
     *    // converted to UTF-8 bytes
     *    computeHmac("sha256", key, toUtf8Bytes("Hello World"))
     *    //_result:
     *
     */
    function computeHmac(algorithm, _key, _data) {
        const key = getBytes(_key, "key");
        const data = getBytes(_data, "data");
        return hexlify(__computeHmac(algorithm, key, data));
    }
    computeHmac._ = _computeHmac;
    computeHmac.lock = function () { locked$4 = true; };
    computeHmac.register = function (func) {
        if (locked$4) {
            throw new Error("computeHmac is locked");
        }
        __computeHmac = func;
    };
    Object.freeze(computeHmac);

    // SHA3 (keccak) is based on a new design: basically, the internal state is bigger than output size.
    // It's called a sponge function.
    // Various per round constants calculations
    const [SHA3_PI, SHA3_ROTL, _SHA3_IOTA] = [[], [], []];
    const _0n$4 = /* @__PURE__ */ BigInt(0);
    const _1n$5 = /* @__PURE__ */ BigInt(1);
    const _2n$3 = /* @__PURE__ */ BigInt(2);
    const _7n = /* @__PURE__ */ BigInt(7);
    const _256n = /* @__PURE__ */ BigInt(256);
    const _0x71n = /* @__PURE__ */ BigInt(0x71);
    for (let round = 0, R = _1n$5, x = 1, y = 0; round < 24; round++) {
        // Pi
        [x, y] = [y, (2 * x + 3 * y) % 5];
        SHA3_PI.push(2 * (5 * y + x));
        // Rotational
        SHA3_ROTL.push((((round + 1) * (round + 2)) / 2) % 64);
        // Iota
        let t = _0n$4;
        for (let j = 0; j < 7; j++) {
            R = ((R << _1n$5) ^ ((R >> _7n) * _0x71n)) % _256n;
            if (R & _2n$3)
                t ^= _1n$5 << ((_1n$5 << /* @__PURE__ */ BigInt(j)) - _1n$5);
        }
        _SHA3_IOTA.push(t);
    }
    const [SHA3_IOTA_H, SHA3_IOTA_L] = /* @__PURE__ */ split$1(_SHA3_IOTA, true);
    // Left rotation (without 0, 32, 64)
    const rotlH = (h, l, s) => (s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s));
    const rotlL = (h, l, s) => (s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s));
    // Same as keccakf1600, but allows to skip some rounds
    function keccakP(s, rounds = 24) {
        const B = new Uint32Array(5 * 2);
        // NOTE: all indices are x2 since we store state as u32 instead of u64 (bigints to slow in js)
        for (let round = 24 - rounds; round < 24; round++) {
            // Theta θ
            for (let x = 0; x < 10; x++)
                B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
            for (let x = 0; x < 10; x += 2) {
                const idx1 = (x + 8) % 10;
                const idx0 = (x + 2) % 10;
                const B0 = B[idx0];
                const B1 = B[idx0 + 1];
                const Th = rotlH(B0, B1, 1) ^ B[idx1];
                const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
                for (let y = 0; y < 50; y += 10) {
                    s[x + y] ^= Th;
                    s[x + y + 1] ^= Tl;
                }
            }
            // Rho (ρ) and Pi (π)
            let curH = s[2];
            let curL = s[3];
            for (let t = 0; t < 24; t++) {
                const shift = SHA3_ROTL[t];
                const Th = rotlH(curH, curL, shift);
                const Tl = rotlL(curH, curL, shift);
                const PI = SHA3_PI[t];
                curH = s[PI];
                curL = s[PI + 1];
                s[PI] = Th;
                s[PI + 1] = Tl;
            }
            // Chi (χ)
            for (let y = 0; y < 50; y += 10) {
                for (let x = 0; x < 10; x++)
                    B[x] = s[y + x];
                for (let x = 0; x < 10; x++)
                    s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
            }
            // Iota (ι)
            s[0] ^= SHA3_IOTA_H[round];
            s[1] ^= SHA3_IOTA_L[round];
        }
        B.fill(0);
    }
    class Keccak extends Hash {
        // NOTE: we accept arguments in bytes instead of bits here.
        constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
            super();
            this.blockLen = blockLen;
            this.suffix = suffix;
            this.outputLen = outputLen;
            this.enableXOF = enableXOF;
            this.rounds = rounds;
            this.pos = 0;
            this.posOut = 0;
            this.finished = false;
            this.destroyed = false;
            // Can be passed from user as dkLen
            number(outputLen);
            // 1600 = 5x5 matrix of 64bit.  1600 bits === 200 bytes
            if (0 >= this.blockLen || this.blockLen >= 200)
                throw new Error('Sha3 supports only keccak-f1600 function');
            this.state = new Uint8Array(200);
            this.state32 = u32(this.state);
        }
        keccak() {
            keccakP(this.state32, this.rounds);
            this.posOut = 0;
            this.pos = 0;
        }
        update(data) {
            exists(this);
            const { blockLen, state } = this;
            data = toBytes(data);
            const len = data.length;
            for (let pos = 0; pos < len;) {
                const take = Math.min(blockLen - this.pos, len - pos);
                for (let i = 0; i < take; i++)
                    state[this.pos++] ^= data[pos++];
                if (this.pos === blockLen)
                    this.keccak();
            }
            return this;
        }
        finish() {
            if (this.finished)
                return;
            this.finished = true;
            const { state, suffix, pos, blockLen } = this;
            // Do the padding
            state[pos] ^= suffix;
            if ((suffix & 0x80) !== 0 && pos === blockLen - 1)
                this.keccak();
            state[blockLen - 1] ^= 0x80;
            this.keccak();
        }
        writeInto(out) {
            exists(this, false);
            bytes(out);
            this.finish();
            const bufferOut = this.state;
            const { blockLen } = this;
            for (let pos = 0, len = out.length; pos < len;) {
                if (this.posOut >= blockLen)
                    this.keccak();
                const take = Math.min(blockLen - this.posOut, len - pos);
                out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
                this.posOut += take;
                pos += take;
            }
            return out;
        }
        xofInto(out) {
            // Sha3/Keccak usage with XOF is probably mistake, only SHAKE instances can do XOF
            if (!this.enableXOF)
                throw new Error('XOF is not possible for this instance');
            return this.writeInto(out);
        }
        xof(bytes) {
            number(bytes);
            return this.xofInto(new Uint8Array(bytes));
        }
        digestInto(out) {
            output(out, this);
            if (this.finished)
                throw new Error('digest() was already called');
            this.writeInto(out);
            this.destroy();
            return out;
        }
        digest() {
            return this.digestInto(new Uint8Array(this.outputLen));
        }
        destroy() {
            this.destroyed = true;
            this.state.fill(0);
        }
        _cloneInto(to) {
            const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
            to || (to = new Keccak(blockLen, suffix, outputLen, enableXOF, rounds));
            to.state32.set(this.state32);
            to.pos = this.pos;
            to.posOut = this.posOut;
            to.finished = this.finished;
            to.rounds = rounds;
            // Suffix can change in cSHAKE
            to.suffix = suffix;
            to.outputLen = outputLen;
            to.enableXOF = enableXOF;
            to.destroyed = this.destroyed;
            return to;
        }
    }
    const gen = (suffix, blockLen, outputLen) => wrapConstructor(() => new Keccak(blockLen, suffix, outputLen));
    /**
     * keccak-256 hash function. Different from SHA3-256.
     * @param message - that would be hashed
     */
    const keccak_256 = /* @__PURE__ */ gen(0x01, 136, 256 / 8);

    /**
     *  Cryptographic hashing functions
     *
     *  @_subsection: api/crypto:Hash Functions [about-crypto-hashing]
     */
    let locked$3 = false;
    const _keccak256 = function (data) {
        return keccak_256(data);
    };
    let __keccak256 = _keccak256;
    /**
     *  Compute the cryptographic KECCAK256 hash of %%data%%.
     *
     *  The %%data%% **must** be a data representation, to compute the
     *  hash of UTF-8 data use the [[id]] function.
     *
     *  @returns DataHexstring
     *  @example:
     *    keccak256("0x")
     *    //_result:
     *
     *    keccak256("0x1337")
     *    //_result:
     *
     *    keccak256(new Uint8Array([ 0x13, 0x37 ]))
     *    //_result:
     *
     *    // Strings are assumed to be DataHexString, otherwise it will
     *    // throw. To hash UTF-8 data, see the note above.
     *    keccak256("Hello World")
     *    //_error:
     */
    function keccak256(_data) {
        const data = getBytes(_data, "data");
        return hexlify(__keccak256(data));
    }
    keccak256._ = _keccak256;
    keccak256.lock = function () { locked$3 = true; };
    keccak256.register = function (func) {
        if (locked$3) {
            throw new TypeError("keccak256 is locked");
        }
        __keccak256 = func;
    };
    Object.freeze(keccak256);

    // https://homes.esat.kuleuven.be/~bosselae/ripemd160.html
    // https://homes.esat.kuleuven.be/~bosselae/ripemd160/pdf/AB-9601/AB-9601.pdf
    const Rho = /* @__PURE__ */ new Uint8Array([7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8]);
    const Id = /* @__PURE__ */ Uint8Array.from({ length: 16 }, (_, i) => i);
    const Pi = /* @__PURE__ */ Id.map((i) => (9 * i + 5) % 16);
    let idxL = [Id];
    let idxR = [Pi];
    for (let i = 0; i < 4; i++)
        for (let j of [idxL, idxR])
            j.push(j[i].map((k) => Rho[k]));
    const shifts = /* @__PURE__ */ [
        [11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8],
        [12, 13, 11, 15, 6, 9, 9, 7, 12, 15, 11, 13, 7, 8, 7, 7],
        [13, 15, 14, 11, 7, 7, 6, 8, 13, 14, 13, 12, 5, 5, 6, 9],
        [14, 11, 12, 14, 8, 6, 5, 5, 15, 12, 15, 14, 9, 9, 8, 6],
        [15, 12, 13, 13, 9, 5, 8, 6, 14, 11, 12, 11, 8, 6, 5, 5],
    ].map((i) => new Uint8Array(i));
    const shiftsL = /* @__PURE__ */ idxL.map((idx, i) => idx.map((j) => shifts[i][j]));
    const shiftsR = /* @__PURE__ */ idxR.map((idx, i) => idx.map((j) => shifts[i][j]));
    const Kl = /* @__PURE__ */ new Uint32Array([
        0x00000000, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xa953fd4e,
    ]);
    const Kr = /* @__PURE__ */ new Uint32Array([
        0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0x7a6d76e9, 0x00000000,
    ]);
    // The rotate left (circular left shift) operation for uint32
    const rotl$1 = (word, shift) => (word << shift) | (word >>> (32 - shift));
    // It's called f() in spec.
    function f(group, x, y, z) {
        if (group === 0)
            return x ^ y ^ z;
        else if (group === 1)
            return (x & y) | (~x & z);
        else if (group === 2)
            return (x | ~y) ^ z;
        else if (group === 3)
            return (x & z) | (y & ~z);
        else
            return x ^ (y | ~z);
    }
    // Temporary buffer, not used to store anything between runs
    const BUF = /* @__PURE__ */ new Uint32Array(16);
    class RIPEMD160 extends SHA2 {
        constructor() {
            super(64, 20, 8, true);
            this.h0 = 0x67452301 | 0;
            this.h1 = 0xefcdab89 | 0;
            this.h2 = 0x98badcfe | 0;
            this.h3 = 0x10325476 | 0;
            this.h4 = 0xc3d2e1f0 | 0;
        }
        get() {
            const { h0, h1, h2, h3, h4 } = this;
            return [h0, h1, h2, h3, h4];
        }
        set(h0, h1, h2, h3, h4) {
            this.h0 = h0 | 0;
            this.h1 = h1 | 0;
            this.h2 = h2 | 0;
            this.h3 = h3 | 0;
            this.h4 = h4 | 0;
        }
        process(view, offset) {
            for (let i = 0; i < 16; i++, offset += 4)
                BUF[i] = view.getUint32(offset, true);
            // prettier-ignore
            let al = this.h0 | 0, ar = al, bl = this.h1 | 0, br = bl, cl = this.h2 | 0, cr = cl, dl = this.h3 | 0, dr = dl, el = this.h4 | 0, er = el;
            // Instead of iterating 0 to 80, we split it into 5 groups
            // And use the groups in constants, functions, etc. Much simpler
            for (let group = 0; group < 5; group++) {
                const rGroup = 4 - group;
                const hbl = Kl[group], hbr = Kr[group]; // prettier-ignore
                const rl = idxL[group], rr = idxR[group]; // prettier-ignore
                const sl = shiftsL[group], sr = shiftsR[group]; // prettier-ignore
                for (let i = 0; i < 16; i++) {
                    const tl = (rotl$1(al + f(group, bl, cl, dl) + BUF[rl[i]] + hbl, sl[i]) + el) | 0;
                    al = el, el = dl, dl = rotl$1(cl, 10) | 0, cl = bl, bl = tl; // prettier-ignore
                }
                // 2 loops are 10% faster
                for (let i = 0; i < 16; i++) {
                    const tr = (rotl$1(ar + f(rGroup, br, cr, dr) + BUF[rr[i]] + hbr, sr[i]) + er) | 0;
                    ar = er, er = dr, dr = rotl$1(cr, 10) | 0, cr = br, br = tr; // prettier-ignore
                }
            }
            // Add the compressed chunk to the current hash value
            this.set((this.h1 + cl + dr) | 0, (this.h2 + dl + er) | 0, (this.h3 + el + ar) | 0, (this.h4 + al + br) | 0, (this.h0 + bl + cr) | 0);
        }
        roundClean() {
            BUF.fill(0);
        }
        destroy() {
            this.destroyed = true;
            this.buffer.fill(0);
            this.set(0, 0, 0, 0, 0);
        }
    }
    /**
     * RIPEMD-160 - a hash function from 1990s.
     * @param message - msg that would be hashed
     */
    const ripemd160$1 = /* @__PURE__ */ wrapConstructor(() => new RIPEMD160());

    let locked$2 = false;
    const _ripemd160 = function (data) {
        return ripemd160$1(data);
    };
    let __ripemd160 = _ripemd160;
    /**
     *  Compute the cryptographic RIPEMD-160 hash of %%data%%.
     *
     *  @_docloc: api/crypto:Hash Functions
     *  @returns DataHexstring
     *
     *  @example:
     *    ripemd160("0x")
     *    //_result:
     *
     *    ripemd160("0x1337")
     *    //_result:
     *
     *    ripemd160(new Uint8Array([ 0x13, 0x37 ]))
     *    //_result:
     *
     */
    function ripemd160(_data) {
        const data = getBytes(_data, "data");
        return hexlify(__ripemd160(data));
    }
    ripemd160._ = _ripemd160;
    ripemd160.lock = function () { locked$2 = true; };
    ripemd160.register = function (func) {
        if (locked$2) {
            throw new TypeError("ripemd160 is locked");
        }
        __ripemd160 = func;
    };
    Object.freeze(ripemd160);

    /**
     *  A **Password-Based Key-Derivation Function** is designed to create
     *  a sequence of bytes suitible as a **key** from a human-rememberable
     *  password.
     *
     *  @_subsection: api/crypto:Passwords  [about-pbkdf]
     */
    let locked$1 = false;
    const _pbkdf2 = function (password, salt, iterations, keylen, algo) {
        return pbkdf2Sync(password, salt, iterations, keylen, algo);
    };
    let __pbkdf2 = _pbkdf2;
    /**
     *  Return the [[link-pbkdf2]] for %%keylen%% bytes for %%password%% using
     *  the %%salt%% and using %%iterations%% of %%algo%%.
     *
     *  This PBKDF is outdated and should not be used in new projects, but is
     *  required to decrypt older files.
     *
     *  @example:
     *    // The password must be converted to bytes, and it is generally
     *    // best practices to ensure the string has been normalized. Many
     *    // formats explicitly indicate the normalization form to use.
     *    password = "hello"
     *    passwordBytes = toUtf8Bytes(password, "NFKC")
     *
     *    salt = id("some-salt")
     *
     *    // Compute the PBKDF2
     *    pbkdf2(passwordBytes, salt, 1024, 16, "sha256")
     *    //_result:
     */
    function pbkdf2(_password, _salt, iterations, keylen, algo) {
        const password = getBytes(_password, "password");
        const salt = getBytes(_salt, "salt");
        return hexlify(__pbkdf2(password, salt, iterations, keylen, algo));
    }
    pbkdf2._ = _pbkdf2;
    pbkdf2.lock = function () { locked$1 = true; };
    pbkdf2.register = function (func) {
        if (locked$1) {
            throw new Error("pbkdf2 is locked");
        }
        __pbkdf2 = func;
    };
    Object.freeze(pbkdf2);

    /**
     *  A **Cryptographically Secure Random Value** is one that has been
     *  generated with additional care take to prevent side-channels
     *  from allowing others to detect it and prevent others from through
     *  coincidence generate the same values.
     *
     *  @_subsection: api/crypto:Random Values  [about-crypto-random]
     */
    let locked = false;
    const _randomBytes = function (length) {
        return new Uint8Array(randomBytes$1(length));
    };
    let __randomBytes = _randomBytes;
    /**
     *  Return %%length%% bytes of cryptographically secure random data.
     *
     *  @example:
     *    randomBytes(8)
     *    //_result:
     */
    function randomBytes(length) {
        return __randomBytes(length);
    }
    randomBytes._ = _randomBytes;
    randomBytes.lock = function () { locked = true; };
    randomBytes.register = function (func) {
        if (locked) {
            throw new Error("randomBytes is locked");
        }
        __randomBytes = func;
    };
    Object.freeze(randomBytes);

    // RFC 7914 Scrypt KDF
    // Left rotate for uint32
    const rotl = (a, b) => (a << b) | (a >>> (32 - b));
    // The main Scrypt loop: uses Salsa extensively.
    // Six versions of the function were tried, this is the fastest one.
    // prettier-ignore
    function XorAndSalsa(prev, pi, input, ii, out, oi) {
        // Based on https://cr.yp.to/salsa20.html
        // Xor blocks
        let y00 = prev[pi++] ^ input[ii++], y01 = prev[pi++] ^ input[ii++];
        let y02 = prev[pi++] ^ input[ii++], y03 = prev[pi++] ^ input[ii++];
        let y04 = prev[pi++] ^ input[ii++], y05 = prev[pi++] ^ input[ii++];
        let y06 = prev[pi++] ^ input[ii++], y07 = prev[pi++] ^ input[ii++];
        let y08 = prev[pi++] ^ input[ii++], y09 = prev[pi++] ^ input[ii++];
        let y10 = prev[pi++] ^ input[ii++], y11 = prev[pi++] ^ input[ii++];
        let y12 = prev[pi++] ^ input[ii++], y13 = prev[pi++] ^ input[ii++];
        let y14 = prev[pi++] ^ input[ii++], y15 = prev[pi++] ^ input[ii++];
        // Save state to temporary variables (salsa)
        let x00 = y00, x01 = y01, x02 = y02, x03 = y03, x04 = y04, x05 = y05, x06 = y06, x07 = y07, x08 = y08, x09 = y09, x10 = y10, x11 = y11, x12 = y12, x13 = y13, x14 = y14, x15 = y15;
        // Main loop (salsa)
        for (let i = 0; i < 8; i += 2) {
            x04 ^= rotl(x00 + x12 | 0, 7);
            x08 ^= rotl(x04 + x00 | 0, 9);
            x12 ^= rotl(x08 + x04 | 0, 13);
            x00 ^= rotl(x12 + x08 | 0, 18);
            x09 ^= rotl(x05 + x01 | 0, 7);
            x13 ^= rotl(x09 + x05 | 0, 9);
            x01 ^= rotl(x13 + x09 | 0, 13);
            x05 ^= rotl(x01 + x13 | 0, 18);
            x14 ^= rotl(x10 + x06 | 0, 7);
            x02 ^= rotl(x14 + x10 | 0, 9);
            x06 ^= rotl(x02 + x14 | 0, 13);
            x10 ^= rotl(x06 + x02 | 0, 18);
            x03 ^= rotl(x15 + x11 | 0, 7);
            x07 ^= rotl(x03 + x15 | 0, 9);
            x11 ^= rotl(x07 + x03 | 0, 13);
            x15 ^= rotl(x11 + x07 | 0, 18);
            x01 ^= rotl(x00 + x03 | 0, 7);
            x02 ^= rotl(x01 + x00 | 0, 9);
            x03 ^= rotl(x02 + x01 | 0, 13);
            x00 ^= rotl(x03 + x02 | 0, 18);
            x06 ^= rotl(x05 + x04 | 0, 7);
            x07 ^= rotl(x06 + x05 | 0, 9);
            x04 ^= rotl(x07 + x06 | 0, 13);
            x05 ^= rotl(x04 + x07 | 0, 18);
            x11 ^= rotl(x10 + x09 | 0, 7);
            x08 ^= rotl(x11 + x10 | 0, 9);
            x09 ^= rotl(x08 + x11 | 0, 13);
            x10 ^= rotl(x09 + x08 | 0, 18);
            x12 ^= rotl(x15 + x14 | 0, 7);
            x13 ^= rotl(x12 + x15 | 0, 9);
            x14 ^= rotl(x13 + x12 | 0, 13);
            x15 ^= rotl(x14 + x13 | 0, 18);
        }
        // Write output (salsa)
        out[oi++] = (y00 + x00) | 0;
        out[oi++] = (y01 + x01) | 0;
        out[oi++] = (y02 + x02) | 0;
        out[oi++] = (y03 + x03) | 0;
        out[oi++] = (y04 + x04) | 0;
        out[oi++] = (y05 + x05) | 0;
        out[oi++] = (y06 + x06) | 0;
        out[oi++] = (y07 + x07) | 0;
        out[oi++] = (y08 + x08) | 0;
        out[oi++] = (y09 + x09) | 0;
        out[oi++] = (y10 + x10) | 0;
        out[oi++] = (y11 + x11) | 0;
        out[oi++] = (y12 + x12) | 0;
        out[oi++] = (y13 + x13) | 0;
        out[oi++] = (y14 + x14) | 0;
        out[oi++] = (y15 + x15) | 0;
    }
    function BlockMix(input, ii, out, oi, r) {
        // The block B is r 128-byte chunks (which is equivalent of 2r 64-byte chunks)
        let head = oi + 0;
        let tail = oi + 16 * r;
        for (let i = 0; i < 16; i++)
            out[tail + i] = input[ii + (2 * r - 1) * 16 + i]; // X ← B[2r−1]
        for (let i = 0; i < r; i++, head += 16, ii += 16) {
            // We write odd & even Yi at same time. Even: 0bXXXXX0 Odd:  0bXXXXX1
            XorAndSalsa(out, tail, input, ii, out, head); // head[i] = Salsa(blockIn[2*i] ^ tail[i-1])
            if (i > 0)
                tail += 16; // First iteration overwrites tmp value in tail
            XorAndSalsa(out, head, input, (ii += 16), out, tail); // tail[i] = Salsa(blockIn[2*i+1] ^ head[i])
        }
    }
    // Common prologue and epilogue for sync/async functions
    function scryptInit(password, salt, _opts) {
        // Maxmem - 1GB+1KB by default
        const opts = checkOpts({
            dkLen: 32,
            asyncTick: 10,
            maxmem: 1024 ** 3 + 1024,
        }, _opts);
        const { N, r, p, dkLen, asyncTick, maxmem, onProgress } = opts;
        number(N);
        number(r);
        number(p);
        number(dkLen);
        number(asyncTick);
        number(maxmem);
        if (onProgress !== undefined && typeof onProgress !== 'function')
            throw new Error('progressCb should be function');
        const blockSize = 128 * r;
        const blockSize32 = blockSize / 4;
        if (N <= 1 || (N & (N - 1)) !== 0 || N >= 2 ** (blockSize / 8) || N > 2 ** 32) {
            // NOTE: we limit N to be less than 2**32 because of 32 bit variant of Integrify function
            // There is no JS engines that allows alocate more than 4GB per single Uint8Array for now, but can change in future.
            throw new Error('Scrypt: N must be larger than 1, a power of 2, less than 2^(128 * r / 8) and less than 2^32');
        }
        if (p < 0 || p > ((2 ** 32 - 1) * 32) / blockSize) {
            throw new Error('Scrypt: p must be a positive integer less than or equal to ((2^32 - 1) * 32) / (128 * r)');
        }
        if (dkLen < 0 || dkLen > (2 ** 32 - 1) * 32) {
            throw new Error('Scrypt: dkLen should be positive integer less than or equal to (2^32 - 1) * 32');
        }
        const memUsed = blockSize * (N + p);
        if (memUsed > maxmem) {
            throw new Error(`Scrypt: parameters too large, ${memUsed} (128 * r * (N + p)) > ${maxmem} (maxmem)`);
        }
        // [B0...Bp−1] ← PBKDF2HMAC-SHA256(Passphrase, Salt, 1, blockSize*ParallelizationFactor)
        // Since it has only one iteration there is no reason to use async variant
        const B = pbkdf2$1(sha256$1, password, salt, { c: 1, dkLen: blockSize * p });
        const B32 = u32(B);
        // Re-used between parallel iterations. Array(iterations) of B
        const V = u32(new Uint8Array(blockSize * N));
        const tmp = u32(new Uint8Array(blockSize));
        let blockMixCb = () => { };
        if (onProgress) {
            const totalBlockMix = 2 * N * p;
            // Invoke callback if progress changes from 10.01 to 10.02
            // Allows to draw smooth progress bar on up to 8K screen
            const callbackPer = Math.max(Math.floor(totalBlockMix / 10000), 1);
            let blockMixCnt = 0;
            blockMixCb = () => {
                blockMixCnt++;
                if (onProgress && (!(blockMixCnt % callbackPer) || blockMixCnt === totalBlockMix))
                    onProgress(blockMixCnt / totalBlockMix);
            };
        }
        return { N, r, p, dkLen, blockSize32, V, B32, B, tmp, blockMixCb, asyncTick };
    }
    function scryptOutput(password, dkLen, B, V, tmp) {
        const res = pbkdf2$1(sha256$1, password, B, { c: 1, dkLen });
        B.fill(0);
        V.fill(0);
        tmp.fill(0);
        return res;
    }
    /**
     * Scrypt KDF from RFC 7914.
     * @param password - pass
     * @param salt - salt
     * @param opts - parameters
     * - `N` is cpu/mem work factor (power of 2 e.g. 2**18)
     * - `r` is block size (8 is common), fine-tunes sequential memory read size and performance
     * - `p` is parallelization factor (1 is common)
     * - `dkLen` is output key length in bytes e.g. 32.
     * - `asyncTick` - (default: 10) max time in ms for which async function can block execution
     * - `maxmem` - (default: `1024 ** 3 + 1024` aka 1GB+1KB). A limit that the app could use for scrypt
     * - `onProgress` - callback function that would be executed for progress report
     * @returns Derived key
     */
    function scrypt$1(password, salt, opts) {
        const { N, r, p, dkLen, blockSize32, V, B32, B, tmp, blockMixCb } = scryptInit(password, salt, opts);
        for (let pi = 0; pi < p; pi++) {
            const Pi = blockSize32 * pi;
            for (let i = 0; i < blockSize32; i++)
                V[i] = B32[Pi + i]; // V[0] = B[i]
            for (let i = 0, pos = 0; i < N - 1; i++) {
                BlockMix(V, pos, V, (pos += blockSize32), r); // V[i] = BlockMix(V[i-1]);
                blockMixCb();
            }
            BlockMix(V, (N - 1) * blockSize32, B32, Pi, r); // Process last element
            blockMixCb();
            for (let i = 0; i < N; i++) {
                // First u32 of the last 64-byte block (u32 is LE)
                const j = B32[Pi + blockSize32 - 16] % N; // j = Integrify(X) % iterations
                for (let k = 0; k < blockSize32; k++)
                    tmp[k] = B32[Pi + k] ^ V[j * blockSize32 + k]; // tmp = B ^ V[j]
                BlockMix(tmp, 0, B32, Pi, r); // B = BlockMix(B ^ V[j])
                blockMixCb();
            }
        }
        return scryptOutput(password, dkLen, B, V, tmp);
    }
    /**
     * Scrypt KDF from RFC 7914.
     */
    async function scryptAsync(password, salt, opts) {
        const { N, r, p, dkLen, blockSize32, V, B32, B, tmp, blockMixCb, asyncTick } = scryptInit(password, salt, opts);
        for (let pi = 0; pi < p; pi++) {
            const Pi = blockSize32 * pi;
            for (let i = 0; i < blockSize32; i++)
                V[i] = B32[Pi + i]; // V[0] = B[i]
            let pos = 0;
            await asyncLoop(N - 1, asyncTick, () => {
                BlockMix(V, pos, V, (pos += blockSize32), r); // V[i] = BlockMix(V[i-1]);
                blockMixCb();
            });
            BlockMix(V, (N - 1) * blockSize32, B32, Pi, r); // Process last element
            blockMixCb();
            await asyncLoop(N, asyncTick, () => {
                // First u32 of the last 64-byte block (u32 is LE)
                const j = B32[Pi + blockSize32 - 16] % N; // j = Integrify(X) % iterations
                for (let k = 0; k < blockSize32; k++)
                    tmp[k] = B32[Pi + k] ^ V[j * blockSize32 + k]; // tmp = B ^ V[j]
                BlockMix(tmp, 0, B32, Pi, r); // B = BlockMix(B ^ V[j])
                blockMixCb();
            });
        }
        return scryptOutput(password, dkLen, B, V, tmp);
    }

    let lockedSync = false, lockedAsync = false;
    const _scryptAsync = async function (passwd, salt, N, r, p, dkLen, onProgress) {
        return await scryptAsync(passwd, salt, { N, r, p, dkLen, onProgress });
    };
    const _scryptSync = function (passwd, salt, N, r, p, dkLen) {
        return scrypt$1(passwd, salt, { N, r, p, dkLen });
    };
    let __scryptAsync = _scryptAsync;
    let __scryptSync = _scryptSync;
    /**
     *  The [[link-wiki-scrypt]] uses a memory and cpu hard method of
     *  derivation to increase the resource cost to brute-force a password
     *  for a given key.
     *
     *  This means this algorithm is intentionally slow, and can be tuned to
     *  become slower. As computation and memory speed improve over time,
     *  increasing the difficulty maintains the cost of an attacker.
     *
     *  For example, if a target time of 5 seconds is used, a legitimate user
     *  which knows their password requires only 5 seconds to unlock their
     *  account. A 6 character password has 68 billion possibilities, which
     *  would require an attacker to invest over 10,000 years of CPU time. This
     *  is of course a crude example (as password generally aren't random),
     *  but demonstrates to value of imposing large costs to decryption.
     *
     *  For this reason, if building a UI which involved decrypting or
     *  encrypting datsa using scrypt, it is recommended to use a
     *  [[ProgressCallback]] (as event short periods can seem lik an eternity
     *  if the UI freezes). Including the phrase //"decrypting"// in the UI
     *  can also help, assuring the user their waiting is for a good reason.
     *
     *  @_docloc: api/crypto:Passwords
     *
     *  @example:
     *    // The password must be converted to bytes, and it is generally
     *    // best practices to ensure the string has been normalized. Many
     *    // formats explicitly indicate the normalization form to use.
     *    password = "hello"
     *    passwordBytes = toUtf8Bytes(password, "NFKC")
     *
     *    salt = id("some-salt")
     *
     *    // Compute the scrypt
     *    scrypt(passwordBytes, salt, 1024, 8, 1, 16)
     *    //_result:
     */
    async function scrypt(_passwd, _salt, N, r, p, dkLen, progress) {
        const passwd = getBytes(_passwd, "passwd");
        const salt = getBytes(_salt, "salt");
        return hexlify(await __scryptAsync(passwd, salt, N, r, p, dkLen, progress));
    }
    scrypt._ = _scryptAsync;
    scrypt.lock = function () { lockedAsync = true; };
    scrypt.register = function (func) {
        if (lockedAsync) {
            throw new Error("scrypt is locked");
        }
        __scryptAsync = func;
    };
    Object.freeze(scrypt);
    /**
     *  Provides a synchronous variant of [[scrypt]].
     *
     *  This will completely lock up and freeze the UI in a browser and will
     *  prevent any event loop from progressing. For this reason, it is
     *  preferred to use the [async variant](scrypt).
     *
     *  @_docloc: api/crypto:Passwords
     *
     *  @example:
     *    // The password must be converted to bytes, and it is generally
     *    // best practices to ensure the string has been normalized. Many
     *    // formats explicitly indicate the normalization form to use.
     *    password = "hello"
     *    passwordBytes = toUtf8Bytes(password, "NFKC")
     *
     *    salt = id("some-salt")
     *
     *    // Compute the scrypt
     *    scryptSync(passwordBytes, salt, 1024, 8, 1, 16)
     *    //_result:
     */
    function scryptSync(_passwd, _salt, N, r, p, dkLen) {
        const passwd = getBytes(_passwd, "passwd");
        const salt = getBytes(_salt, "salt");
        return hexlify(__scryptSync(passwd, salt, N, r, p, dkLen));
    }
    scryptSync._ = _scryptSync;
    scryptSync.lock = function () { lockedSync = true; };
    scryptSync.register = function (func) {
        if (lockedSync) {
            throw new Error("scryptSync is locked");
        }
        __scryptSync = func;
    };
    Object.freeze(scryptSync);

    const _sha256 = function (data) {
        return createHash("sha256").update(data).digest();
    };
    const _sha512 = function (data) {
        return createHash("sha512").update(data).digest();
    };
    let __sha256 = _sha256;
    let __sha512 = _sha512;
    let locked256 = false, locked512 = false;
    /**
     *  Compute the cryptographic SHA2-256 hash of %%data%%.
     *
     *  @_docloc: api/crypto:Hash Functions
     *  @returns DataHexstring
     *
     *  @example:
     *    sha256("0x")
     *    //_result:
     *
     *    sha256("0x1337")
     *    //_result:
     *
     *    sha256(new Uint8Array([ 0x13, 0x37 ]))
     *    //_result:
     *
     */
    function sha256(_data) {
        const data = getBytes(_data, "data");
        return hexlify(__sha256(data));
    }
    sha256._ = _sha256;
    sha256.lock = function () { locked256 = true; };
    sha256.register = function (func) {
        if (locked256) {
            throw new Error("sha256 is locked");
        }
        __sha256 = func;
    };
    Object.freeze(sha256);
    /**
     *  Compute the cryptographic SHA2-512 hash of %%data%%.
     *
     *  @_docloc: api/crypto:Hash Functions
     *  @returns DataHexstring
     *
     *  @example:
     *    sha512("0x")
     *    //_result:
     *
     *    sha512("0x1337")
     *    //_result:
     *
     *    sha512(new Uint8Array([ 0x13, 0x37 ]))
     *    //_result:
     */
    function sha512(_data) {
        const data = getBytes(_data, "data");
        return hexlify(__sha512(data));
    }
    sha512._ = _sha512;
    sha512.lock = function () { locked512 = true; };
    sha512.register = function (func) {
        if (locked512) {
            throw new Error("sha512 is locked");
        }
        __sha512 = func;
    };
    Object.freeze(sha256);

    /*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
    // 100 lines of code in the file are duplicated from noble-hashes (utils).
    // This is OK: `abstract` directory does not use noble-hashes.
    // User may opt-in into using different hashing library. This way, noble-hashes
    // won't be included into their bundle.
    const _0n$3 = BigInt(0);
    const _1n$4 = BigInt(1);
    const _2n$2 = BigInt(2);
    const u8a = (a) => a instanceof Uint8Array;
    const hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));
    /**
     * @example bytesToHex(Uint8Array.from([0xca, 0xfe, 0x01, 0x23])) // 'cafe0123'
     */
    function bytesToHex(bytes) {
        if (!u8a(bytes))
            throw new Error('Uint8Array expected');
        // pre-caching improves the speed 6x
        let hex = '';
        for (let i = 0; i < bytes.length; i++) {
            hex += hexes[bytes[i]];
        }
        return hex;
    }
    function numberToHexUnpadded(num) {
        const hex = num.toString(16);
        return hex.length & 1 ? `0${hex}` : hex;
    }
    function hexToNumber(hex) {
        if (typeof hex !== 'string')
            throw new Error('hex string expected, got ' + typeof hex);
        // Big Endian
        return BigInt(hex === '' ? '0' : `0x${hex}`);
    }
    /**
     * @example hexToBytes('cafe0123') // Uint8Array.from([0xca, 0xfe, 0x01, 0x23])
     */
    function hexToBytes(hex) {
        if (typeof hex !== 'string')
            throw new Error('hex string expected, got ' + typeof hex);
        const len = hex.length;
        if (len % 2)
            throw new Error('padded hex string expected, got unpadded hex of length ' + len);
        const array = new Uint8Array(len / 2);
        for (let i = 0; i < array.length; i++) {
            const j = i * 2;
            const hexByte = hex.slice(j, j + 2);
            const byte = Number.parseInt(hexByte, 16);
            if (Number.isNaN(byte) || byte < 0)
                throw new Error('Invalid byte sequence');
            array[i] = byte;
        }
        return array;
    }
    // BE: Big Endian, LE: Little Endian
    function bytesToNumberBE(bytes) {
        return hexToNumber(bytesToHex(bytes));
    }
    function bytesToNumberLE(bytes) {
        if (!u8a(bytes))
            throw new Error('Uint8Array expected');
        return hexToNumber(bytesToHex(Uint8Array.from(bytes).reverse()));
    }
    function numberToBytesBE(n, len) {
        return hexToBytes(n.toString(16).padStart(len * 2, '0'));
    }
    function numberToBytesLE(n, len) {
        return numberToBytesBE(n, len).reverse();
    }
    // Unpadded, rarely used
    function numberToVarBytesBE(n) {
        return hexToBytes(numberToHexUnpadded(n));
    }
    /**
     * Takes hex string or Uint8Array, converts to Uint8Array.
     * Validates output length.
     * Will throw error for other types.
     * @param title descriptive title for an error e.g. 'private key'
     * @param hex hex string or Uint8Array
     * @param expectedLength optional, will compare to result array's length
     * @returns
     */
    function ensureBytes(title, hex, expectedLength) {
        let res;
        if (typeof hex === 'string') {
            try {
                res = hexToBytes(hex);
            }
            catch (e) {
                throw new Error(`${title} must be valid hex string, got "${hex}". Cause: ${e}`);
            }
        }
        else if (u8a(hex)) {
            // Uint8Array.from() instead of hash.slice() because node.js Buffer
            // is instance of Uint8Array, and its slice() creates **mutable** copy
            res = Uint8Array.from(hex);
        }
        else {
            throw new Error(`${title} must be hex string or Uint8Array`);
        }
        const len = res.length;
        if (typeof expectedLength === 'number' && len !== expectedLength)
            throw new Error(`${title} expected ${expectedLength} bytes, got ${len}`);
        return res;
    }
    /**
     * Copies several Uint8Arrays into one.
     */
    function concatBytes(...arrays) {
        const r = new Uint8Array(arrays.reduce((sum, a) => sum + a.length, 0));
        let pad = 0; // walk through each item, ensure they have proper type
        arrays.forEach((a) => {
            if (!u8a(a))
                throw new Error('Uint8Array expected');
            r.set(a, pad);
            pad += a.length;
        });
        return r;
    }
    function equalBytes(b1, b2) {
        // We don't care about timing attacks here
        if (b1.length !== b2.length)
            return false;
        for (let i = 0; i < b1.length; i++)
            if (b1[i] !== b2[i])
                return false;
        return true;
    }
    /**
     * @example utf8ToBytes('abc') // new Uint8Array([97, 98, 99])
     */
    function utf8ToBytes(str) {
        if (typeof str !== 'string')
            throw new Error(`utf8ToBytes expected string, got ${typeof str}`);
        return new Uint8Array(new TextEncoder().encode(str)); // https://bugzil.la/1681809
    }
    // Bit operations
    /**
     * Calculates amount of bits in a bigint.
     * Same as `n.toString(2).length`
     */
    function bitLen(n) {
        let len;
        for (len = 0; n > _0n$3; n >>= _1n$4, len += 1)
            ;
        return len;
    }
    /**
     * Gets single bit at position.
     * NOTE: first bit position is 0 (same as arrays)
     * Same as `!!+Array.from(n.toString(2)).reverse()[pos]`
     */
    function bitGet(n, pos) {
        return (n >> BigInt(pos)) & _1n$4;
    }
    /**
     * Sets single bit at position.
     */
    const bitSet = (n, pos, value) => {
        return n | ((value ? _1n$4 : _0n$3) << BigInt(pos));
    };
    /**
     * Calculate mask for N bits. Not using ** operator with bigints because of old engines.
     * Same as BigInt(`0b${Array(i).fill('1').join('')}`)
     */
    const bitMask = (n) => (_2n$2 << BigInt(n - 1)) - _1n$4;
    // DRBG
    const u8n = (data) => new Uint8Array(data); // creates Uint8Array
    const u8fr = (arr) => Uint8Array.from(arr); // another shortcut
    /**
     * Minimal HMAC-DRBG from NIST 800-90 for RFC6979 sigs.
     * @returns function that will call DRBG until 2nd arg returns something meaningful
     * @example
     *   const drbg = createHmacDRBG<Key>(32, 32, hmac);
     *   drbg(seed, bytesToKey); // bytesToKey must return Key or undefined
     */
    function createHmacDrbg(hashLen, qByteLen, hmacFn) {
        if (typeof hashLen !== 'number' || hashLen < 2)
            throw new Error('hashLen must be a number');
        if (typeof qByteLen !== 'number' || qByteLen < 2)
            throw new Error('qByteLen must be a number');
        if (typeof hmacFn !== 'function')
            throw new Error('hmacFn must be a function');
        // Step B, Step C: set hashLen to 8*ceil(hlen/8)
        let v = u8n(hashLen); // Minimal non-full-spec HMAC-DRBG from NIST 800-90 for RFC6979 sigs.
        let k = u8n(hashLen); // Steps B and C of RFC6979 3.2: set hashLen, in our case always same
        let i = 0; // Iterations counter, will throw when over 1000
        const reset = () => {
            v.fill(1);
            k.fill(0);
            i = 0;
        };
        const h = (...b) => hmacFn(k, v, ...b); // hmac(k)(v, ...values)
        const reseed = (seed = u8n()) => {
            // HMAC-DRBG reseed() function. Steps D-G
            k = h(u8fr([0x00]), seed); // k = hmac(k || v || 0x00 || seed)
            v = h(); // v = hmac(k || v)
            if (seed.length === 0)
                return;
            k = h(u8fr([0x01]), seed); // k = hmac(k || v || 0x01 || seed)
            v = h(); // v = hmac(k || v)
        };
        const gen = () => {
            // HMAC-DRBG generate() function
            if (i++ >= 1000)
                throw new Error('drbg: tried 1000 values');
            let len = 0;
            const out = [];
            while (len < qByteLen) {
                v = h();
                const sl = v.slice();
                out.push(sl);
                len += v.length;
            }
            return concatBytes(...out);
        };
        const genUntil = (seed, pred) => {
            reset();
            reseed(seed); // Steps D-G
            let res = undefined; // Step H: grind until k is in [1..n-1]
            while (!(res = pred(gen())))
                reseed();
            reset();
            return res;
        };
        return genUntil;
    }
    // Validating curves and fields
    const validatorFns = {
        bigint: (val) => typeof val === 'bigint',
        function: (val) => typeof val === 'function',
        boolean: (val) => typeof val === 'boolean',
        string: (val) => typeof val === 'string',
        stringOrUint8Array: (val) => typeof val === 'string' || val instanceof Uint8Array,
        isSafeInteger: (val) => Number.isSafeInteger(val),
        array: (val) => Array.isArray(val),
        field: (val, object) => object.Fp.isValid(val),
        hash: (val) => typeof val === 'function' && Number.isSafeInteger(val.outputLen),
    };
    // type Record<K extends string | number | symbol, T> = { [P in K]: T; }
    function validateObject(object, validators, optValidators = {}) {
        const checkField = (fieldName, type, isOptional) => {
            const checkVal = validatorFns[type];
            if (typeof checkVal !== 'function')
                throw new Error(`Invalid validator "${type}", expected function`);
            const val = object[fieldName];
            if (isOptional && val === undefined)
                return;
            if (!checkVal(val, object)) {
                throw new Error(`Invalid param ${String(fieldName)}=${val} (${typeof val}), expected ${type}`);
            }
        };
        for (const [fieldName, type] of Object.entries(validators))
            checkField(fieldName, type, false);
        for (const [fieldName, type] of Object.entries(optValidators))
            checkField(fieldName, type, true);
        return object;
    }
    // validate type tests
    // const o: { a: number; b: number; c: number } = { a: 1, b: 5, c: 6 };
    // const z0 = validateObject(o, { a: 'isSafeInteger' }, { c: 'bigint' }); // Ok!
    // // Should fail type-check
    // const z1 = validateObject(o, { a: 'tmp' }, { c: 'zz' });
    // const z2 = validateObject(o, { a: 'isSafeInteger' }, { c: 'zz' });
    // const z3 = validateObject(o, { test: 'boolean', z: 'bug' });
    // const z4 = validateObject(o, { a: 'boolean', z: 'bug' });

    var ut = /*#__PURE__*/Object.freeze({
        __proto__: null,
        bitGet: bitGet,
        bitLen: bitLen,
        bitMask: bitMask,
        bitSet: bitSet,
        bytesToHex: bytesToHex,
        bytesToNumberBE: bytesToNumberBE,
        bytesToNumberLE: bytesToNumberLE,
        concatBytes: concatBytes,
        createHmacDrbg: createHmacDrbg,
        ensureBytes: ensureBytes,
        equalBytes: equalBytes,
        hexToBytes: hexToBytes,
        hexToNumber: hexToNumber,
        numberToBytesBE: numberToBytesBE,
        numberToBytesLE: numberToBytesLE,
        numberToHexUnpadded: numberToHexUnpadded,
        numberToVarBytesBE: numberToVarBytesBE,
        utf8ToBytes: utf8ToBytes,
        validateObject: validateObject
    });

    /*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
    // Utilities for modular arithmetics and finite fields
    // prettier-ignore
    const _0n$2 = BigInt(0), _1n$3 = BigInt(1), _2n$1 = BigInt(2), _3n$1 = BigInt(3);
    // prettier-ignore
    const _4n = BigInt(4), _5n = BigInt(5), _8n = BigInt(8);
    // prettier-ignore
    BigInt(9); BigInt(16);
    // Calculates a modulo b
    function mod(a, b) {
        const result = a % b;
        return result >= _0n$2 ? result : b + result;
    }
    /**
     * Efficiently raise num to power and do modular division.
     * Unsafe in some contexts: uses ladder, so can expose bigint bits.
     * @example
     * pow(2n, 6n, 11n) // 64n % 11n == 9n
     */
    // TODO: use field version && remove
    function pow(num, power, modulo) {
        if (modulo <= _0n$2 || power < _0n$2)
            throw new Error('Expected power/modulo > 0');
        if (modulo === _1n$3)
            return _0n$2;
        let res = _1n$3;
        while (power > _0n$2) {
            if (power & _1n$3)
                res = (res * num) % modulo;
            num = (num * num) % modulo;
            power >>= _1n$3;
        }
        return res;
    }
    // Does x ^ (2 ^ power) mod p. pow2(30, 4) == 30 ^ (2 ^ 4)
    function pow2(x, power, modulo) {
        let res = x;
        while (power-- > _0n$2) {
            res *= res;
            res %= modulo;
        }
        return res;
    }
    // Inverses number over modulo
    function invert(number, modulo) {
        if (number === _0n$2 || modulo <= _0n$2) {
            throw new Error(`invert: expected positive integers, got n=${number} mod=${modulo}`);
        }
        // Euclidean GCD https://brilliant.org/wiki/extended-euclidean-algorithm/
        // Fermat's little theorem "CT-like" version inv(n) = n^(m-2) mod m is 30x slower.
        let a = mod(number, modulo);
        let b = modulo;
        // prettier-ignore
        let x = _0n$2, u = _1n$3;
        while (a !== _0n$2) {
            // JIT applies optimization if those two lines follow each other
            const q = b / a;
            const r = b % a;
            const m = x - u * q;
            // prettier-ignore
            b = a, a = r, x = u, u = m;
        }
        const gcd = b;
        if (gcd !== _1n$3)
            throw new Error('invert: does not exist');
        return mod(x, modulo);
    }
    /**
     * Tonelli-Shanks square root search algorithm.
     * 1. https://eprint.iacr.org/2012/685.pdf (page 12)
     * 2. Square Roots from 1; 24, 51, 10 to Dan Shanks
     * Will start an infinite loop if field order P is not prime.
     * @param P field order
     * @returns function that takes field Fp (created from P) and number n
     */
    function tonelliShanks(P) {
        // Legendre constant: used to calculate Legendre symbol (a | p),
        // which denotes the value of a^((p-1)/2) (mod p).
        // (a | p) ≡ 1    if a is a square (mod p)
        // (a | p) ≡ -1   if a is not a square (mod p)
        // (a | p) ≡ 0    if a ≡ 0 (mod p)
        const legendreC = (P - _1n$3) / _2n$1;
        let Q, S, Z;
        // Step 1: By factoring out powers of 2 from p - 1,
        // find q and s such that p - 1 = q*(2^s) with q odd
        for (Q = P - _1n$3, S = 0; Q % _2n$1 === _0n$2; Q /= _2n$1, S++)
            ;
        // Step 2: Select a non-square z such that (z | p) ≡ -1 and set c ≡ zq
        for (Z = _2n$1; Z < P && pow(Z, legendreC, P) !== P - _1n$3; Z++)
            ;
        // Fast-path
        if (S === 1) {
            const p1div4 = (P + _1n$3) / _4n;
            return function tonelliFast(Fp, n) {
                const root = Fp.pow(n, p1div4);
                if (!Fp.eql(Fp.sqr(root), n))
                    throw new Error('Cannot find square root');
                return root;
            };
        }
        // Slow-path
        const Q1div2 = (Q + _1n$3) / _2n$1;
        return function tonelliSlow(Fp, n) {
            // Step 0: Check that n is indeed a square: (n | p) should not be ≡ -1
            if (Fp.pow(n, legendreC) === Fp.neg(Fp.ONE))
                throw new Error('Cannot find square root');
            let r = S;
            // TODO: will fail at Fp2/etc
            let g = Fp.pow(Fp.mul(Fp.ONE, Z), Q); // will update both x and b
            let x = Fp.pow(n, Q1div2); // first guess at the square root
            let b = Fp.pow(n, Q); // first guess at the fudge factor
            while (!Fp.eql(b, Fp.ONE)) {
                if (Fp.eql(b, Fp.ZERO))
                    return Fp.ZERO; // https://en.wikipedia.org/wiki/Tonelli%E2%80%93Shanks_algorithm (4. If t = 0, return r = 0)
                // Find m such b^(2^m)==1
                let m = 1;
                for (let t2 = Fp.sqr(b); m < r; m++) {
                    if (Fp.eql(t2, Fp.ONE))
                        break;
                    t2 = Fp.sqr(t2); // t2 *= t2
                }
                // NOTE: r-m-1 can be bigger than 32, need to convert to bigint before shift, otherwise there will be overflow
                const ge = Fp.pow(g, _1n$3 << BigInt(r - m - 1)); // ge = 2^(r-m-1)
                g = Fp.sqr(ge); // g = ge * ge
                x = Fp.mul(x, ge); // x *= ge
                b = Fp.mul(b, g); // b *= g
                r = m;
            }
            return x;
        };
    }
    function FpSqrt(P) {
        // NOTE: different algorithms can give different roots, it is up to user to decide which one they want.
        // For example there is FpSqrtOdd/FpSqrtEven to choice root based on oddness (used for hash-to-curve).
        // P ≡ 3 (mod 4)
        // √n = n^((P+1)/4)
        if (P % _4n === _3n$1) {
            // Not all roots possible!
            // const ORDER =
            //   0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaabn;
            // const NUM = 72057594037927816n;
            const p1div4 = (P + _1n$3) / _4n;
            return function sqrt3mod4(Fp, n) {
                const root = Fp.pow(n, p1div4);
                // Throw if root**2 != n
                if (!Fp.eql(Fp.sqr(root), n))
                    throw new Error('Cannot find square root');
                return root;
            };
        }
        // Atkin algorithm for q ≡ 5 (mod 8), https://eprint.iacr.org/2012/685.pdf (page 10)
        if (P % _8n === _5n) {
            const c1 = (P - _5n) / _8n;
            return function sqrt5mod8(Fp, n) {
                const n2 = Fp.mul(n, _2n$1);
                const v = Fp.pow(n2, c1);
                const nv = Fp.mul(n, v);
                const i = Fp.mul(Fp.mul(nv, _2n$1), v);
                const root = Fp.mul(nv, Fp.sub(i, Fp.ONE));
                if (!Fp.eql(Fp.sqr(root), n))
                    throw new Error('Cannot find square root');
                return root;
            };
        }
        // Other cases: Tonelli-Shanks algorithm
        return tonelliShanks(P);
    }
    // prettier-ignore
    const FIELD_FIELDS = [
        'create', 'isValid', 'is0', 'neg', 'inv', 'sqrt', 'sqr',
        'eql', 'add', 'sub', 'mul', 'pow', 'div',
        'addN', 'subN', 'mulN', 'sqrN'
    ];
    function validateField(field) {
        const initial = {
            ORDER: 'bigint',
            MASK: 'bigint',
            BYTES: 'isSafeInteger',
            BITS: 'isSafeInteger',
        };
        const opts = FIELD_FIELDS.reduce((map, val) => {
            map[val] = 'function';
            return map;
        }, initial);
        return validateObject(field, opts);
    }
    // Generic field functions
    /**
     * Same as `pow` but for Fp: non-constant-time.
     * Unsafe in some contexts: uses ladder, so can expose bigint bits.
     */
    function FpPow(f, num, power) {
        // Should have same speed as pow for bigints
        // TODO: benchmark!
        if (power < _0n$2)
            throw new Error('Expected power > 0');
        if (power === _0n$2)
            return f.ONE;
        if (power === _1n$3)
            return num;
        let p = f.ONE;
        let d = num;
        while (power > _0n$2) {
            if (power & _1n$3)
                p = f.mul(p, d);
            d = f.sqr(d);
            power >>= _1n$3;
        }
        return p;
    }
    /**
     * Efficiently invert an array of Field elements.
     * `inv(0)` will return `undefined` here: make sure to throw an error.
     */
    function FpInvertBatch(f, nums) {
        const tmp = new Array(nums.length);
        // Walk from first to last, multiply them by each other MOD p
        const lastMultiplied = nums.reduce((acc, num, i) => {
            if (f.is0(num))
                return acc;
            tmp[i] = acc;
            return f.mul(acc, num);
        }, f.ONE);
        // Invert last element
        const inverted = f.inv(lastMultiplied);
        // Walk from last to first, multiply them by inverted each other MOD p
        nums.reduceRight((acc, num, i) => {
            if (f.is0(num))
                return acc;
            tmp[i] = f.mul(acc, tmp[i]);
            return f.mul(acc, num);
        }, inverted);
        return tmp;
    }
    // CURVE.n lengths
    function nLength(n, nBitLength) {
        // Bit size, byte size of CURVE.n
        const _nBitLength = nBitLength !== undefined ? nBitLength : n.toString(2).length;
        const nByteLength = Math.ceil(_nBitLength / 8);
        return { nBitLength: _nBitLength, nByteLength };
    }
    /**
     * Initializes a finite field over prime. **Non-primes are not supported.**
     * Do not init in loop: slow. Very fragile: always run a benchmark on a change.
     * Major performance optimizations:
     * * a) denormalized operations like mulN instead of mul
     * * b) same object shape: never add or remove keys
     * * c) Object.freeze
     * @param ORDER prime positive bigint
     * @param bitLen how many bits the field consumes
     * @param isLE (def: false) if encoding / decoding should be in little-endian
     * @param redef optional faster redefinitions of sqrt and other methods
     */
    function Field(ORDER, bitLen, isLE = false, redef = {}) {
        if (ORDER <= _0n$2)
            throw new Error(`Expected Field ORDER > 0, got ${ORDER}`);
        const { nBitLength: BITS, nByteLength: BYTES } = nLength(ORDER, bitLen);
        if (BYTES > 2048)
            throw new Error('Field lengths over 2048 bytes are not supported');
        const sqrtP = FpSqrt(ORDER);
        const f = Object.freeze({
            ORDER,
            BITS,
            BYTES,
            MASK: bitMask(BITS),
            ZERO: _0n$2,
            ONE: _1n$3,
            create: (num) => mod(num, ORDER),
            isValid: (num) => {
                if (typeof num !== 'bigint')
                    throw new Error(`Invalid field element: expected bigint, got ${typeof num}`);
                return _0n$2 <= num && num < ORDER; // 0 is valid element, but it's not invertible
            },
            is0: (num) => num === _0n$2,
            isOdd: (num) => (num & _1n$3) === _1n$3,
            neg: (num) => mod(-num, ORDER),
            eql: (lhs, rhs) => lhs === rhs,
            sqr: (num) => mod(num * num, ORDER),
            add: (lhs, rhs) => mod(lhs + rhs, ORDER),
            sub: (lhs, rhs) => mod(lhs - rhs, ORDER),
            mul: (lhs, rhs) => mod(lhs * rhs, ORDER),
            pow: (num, power) => FpPow(f, num, power),
            div: (lhs, rhs) => mod(lhs * invert(rhs, ORDER), ORDER),
            // Same as above, but doesn't normalize
            sqrN: (num) => num * num,
            addN: (lhs, rhs) => lhs + rhs,
            subN: (lhs, rhs) => lhs - rhs,
            mulN: (lhs, rhs) => lhs * rhs,
            inv: (num) => invert(num, ORDER),
            sqrt: redef.sqrt || ((n) => sqrtP(f, n)),
            invertBatch: (lst) => FpInvertBatch(f, lst),
            // TODO: do we really need constant cmov?
            // We don't have const-time bigints anyway, so probably will be not very useful
            cmov: (a, b, c) => (c ? b : a),
            toBytes: (num) => (isLE ? numberToBytesLE(num, BYTES) : numberToBytesBE(num, BYTES)),
            fromBytes: (bytes) => {
                if (bytes.length !== BYTES)
                    throw new Error(`Fp.fromBytes: expected ${BYTES}, got ${bytes.length}`);
                return isLE ? bytesToNumberLE(bytes) : bytesToNumberBE(bytes);
            },
        });
        return Object.freeze(f);
    }
    /**
     * Returns total number of bytes consumed by the field element.
     * For example, 32 bytes for usual 256-bit weierstrass curve.
     * @param fieldOrder number of field elements, usually CURVE.n
     * @returns byte length of field
     */
    function getFieldBytesLength(fieldOrder) {
        if (typeof fieldOrder !== 'bigint')
            throw new Error('field order must be bigint');
        const bitLength = fieldOrder.toString(2).length;
        return Math.ceil(bitLength / 8);
    }
    /**
     * Returns minimal amount of bytes that can be safely reduced
     * by field order.
     * Should be 2^-128 for 128-bit curve such as P256.
     * @param fieldOrder number of field elements, usually CURVE.n
     * @returns byte length of target hash
     */
    function getMinHashLength(fieldOrder) {
        const length = getFieldBytesLength(fieldOrder);
        return length + Math.ceil(length / 2);
    }
    /**
     * "Constant-time" private key generation utility.
     * Can take (n + n/2) or more bytes of uniform input e.g. from CSPRNG or KDF
     * and convert them into private scalar, with the modulo bias being negligible.
     * Needs at least 48 bytes of input for 32-byte private key.
     * https://research.kudelskisecurity.com/2020/07/28/the-definitive-guide-to-modulo-bias-and-how-to-avoid-it/
     * FIPS 186-5, A.2 https://csrc.nist.gov/publications/detail/fips/186/5/final
     * RFC 9380, https://www.rfc-editor.org/rfc/rfc9380#section-5
     * @param hash hash output from SHA3 or a similar function
     * @param groupOrder size of subgroup - (e.g. secp256k1.CURVE.n)
     * @param isLE interpret hash bytes as LE num
     * @returns valid private scalar
     */
    function mapHashToField(key, fieldOrder, isLE = false) {
        const len = key.length;
        const fieldLen = getFieldBytesLength(fieldOrder);
        const minLen = getMinHashLength(fieldOrder);
        // No small numbers: need to understand bias story. No huge numbers: easier to detect JS timings.
        if (len < 16 || len < minLen || len > 1024)
            throw new Error(`expected ${minLen}-1024 bytes of input, got ${len}`);
        const num = isLE ? bytesToNumberBE(key) : bytesToNumberLE(key);
        // `mod(x, 11)` can sometimes produce 0. `mod(x, 10) + 1` is the same, but no 0
        const reduced = mod(num, fieldOrder - _1n$3) + _1n$3;
        return isLE ? numberToBytesLE(reduced, fieldLen) : numberToBytesBE(reduced, fieldLen);
    }

    /*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
    // Abelian group utilities
    const _0n$1 = BigInt(0);
    const _1n$2 = BigInt(1);
    // Elliptic curve multiplication of Point by scalar. Fragile.
    // Scalars should always be less than curve order: this should be checked inside of a curve itself.
    // Creates precomputation tables for fast multiplication:
    // - private scalar is split by fixed size windows of W bits
    // - every window point is collected from window's table & added to accumulator
    // - since windows are different, same point inside tables won't be accessed more than once per calc
    // - each multiplication is 'Math.ceil(CURVE_ORDER / 𝑊) + 1' point additions (fixed for any scalar)
    // - +1 window is neccessary for wNAF
    // - wNAF reduces table size: 2x less memory + 2x faster generation, but 10% slower multiplication
    // TODO: Research returning 2d JS array of windows, instead of a single window. This would allow
    // windows to be in different memory locations
    function wNAF(c, bits) {
        const constTimeNegate = (condition, item) => {
            const neg = item.negate();
            return condition ? neg : item;
        };
        const opts = (W) => {
            const windows = Math.ceil(bits / W) + 1; // +1, because
            const windowSize = 2 ** (W - 1); // -1 because we skip zero
            return { windows, windowSize };
        };
        return {
            constTimeNegate,
            // non-const time multiplication ladder
            unsafeLadder(elm, n) {
                let p = c.ZERO;
                let d = elm;
                while (n > _0n$1) {
                    if (n & _1n$2)
                        p = p.add(d);
                    d = d.double();
                    n >>= _1n$2;
                }
                return p;
            },
            /**
             * Creates a wNAF precomputation window. Used for caching.
             * Default window size is set by `utils.precompute()` and is equal to 8.
             * Number of precomputed points depends on the curve size:
             * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
             * - 𝑊 is the window size
             * - 𝑛 is the bitlength of the curve order.
             * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
             * @returns precomputed point tables flattened to a single array
             */
            precomputeWindow(elm, W) {
                const { windows, windowSize } = opts(W);
                const points = [];
                let p = elm;
                let base = p;
                for (let window = 0; window < windows; window++) {
                    base = p;
                    points.push(base);
                    // =1, because we skip zero
                    for (let i = 1; i < windowSize; i++) {
                        base = base.add(p);
                        points.push(base);
                    }
                    p = base.double();
                }
                return points;
            },
            /**
             * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
             * @param W window size
             * @param precomputes precomputed tables
             * @param n scalar (we don't check here, but should be less than curve order)
             * @returns real and fake (for const-time) points
             */
            wNAF(W, precomputes, n) {
                // TODO: maybe check that scalar is less than group order? wNAF behavious is undefined otherwise
                // But need to carefully remove other checks before wNAF. ORDER == bits here
                const { windows, windowSize } = opts(W);
                let p = c.ZERO;
                let f = c.BASE;
                const mask = BigInt(2 ** W - 1); // Create mask with W ones: 0b1111 for W=4 etc.
                const maxNumber = 2 ** W;
                const shiftBy = BigInt(W);
                for (let window = 0; window < windows; window++) {
                    const offset = window * windowSize;
                    // Extract W bits.
                    let wbits = Number(n & mask);
                    // Shift number by W bits.
                    n >>= shiftBy;
                    // If the bits are bigger than max size, we'll split those.
                    // +224 => 256 - 32
                    if (wbits > windowSize) {
                        wbits -= maxNumber;
                        n += _1n$2;
                    }
                    // This code was first written with assumption that 'f' and 'p' will never be infinity point:
                    // since each addition is multiplied by 2 ** W, it cannot cancel each other. However,
                    // there is negate now: it is possible that negated element from low value
                    // would be the same as high element, which will create carry into next window.
                    // It's not obvious how this can fail, but still worth investigating later.
                    // Check if we're onto Zero point.
                    // Add random point inside current window to f.
                    const offset1 = offset;
                    const offset2 = offset + Math.abs(wbits) - 1; // -1 because we skip zero
                    const cond1 = window % 2 !== 0;
                    const cond2 = wbits < 0;
                    if (wbits === 0) {
                        // The most important part for const-time getPublicKey
                        f = f.add(constTimeNegate(cond1, precomputes[offset1]));
                    }
                    else {
                        p = p.add(constTimeNegate(cond2, precomputes[offset2]));
                    }
                }
                // JIT-compiler should not eliminate f here, since it will later be used in normalizeZ()
                // Even if the variable is still unused, there are some checks which will
                // throw an exception, so compiler needs to prove they won't happen, which is hard.
                // At this point there is a way to F be infinity-point even if p is not,
                // which makes it less const-time: around 1 bigint multiply.
                return { p, f };
            },
            wNAFCached(P, precomputesMap, n, transform) {
                // @ts-ignore
                const W = P._WINDOW_SIZE || 1;
                // Calculate precomputes on a first run, reuse them after
                let comp = precomputesMap.get(P);
                if (!comp) {
                    comp = this.precomputeWindow(P, W);
                    if (W !== 1) {
                        precomputesMap.set(P, transform(comp));
                    }
                }
                return this.wNAF(W, comp, n);
            },
        };
    }
    function validateBasic(curve) {
        validateField(curve.Fp);
        validateObject(curve, {
            n: 'bigint',
            h: 'bigint',
            Gx: 'field',
            Gy: 'field',
        }, {
            nBitLength: 'isSafeInteger',
            nByteLength: 'isSafeInteger',
        });
        // Set defaults
        return Object.freeze({
            ...nLength(curve.n, curve.nBitLength),
            ...curve,
            ...{ p: curve.Fp.ORDER },
        });
    }

    /*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
    // Short Weierstrass curve. The formula is: y² = x³ + ax + b
    function validatePointOpts(curve) {
        const opts = validateBasic(curve);
        validateObject(opts, {
            a: 'field',
            b: 'field',
        }, {
            allowedPrivateKeyLengths: 'array',
            wrapPrivateKey: 'boolean',
            isTorsionFree: 'function',
            clearCofactor: 'function',
            allowInfinityPoint: 'boolean',
            fromBytes: 'function',
            toBytes: 'function',
        });
        const { endo, Fp, a } = opts;
        if (endo) {
            if (!Fp.eql(a, Fp.ZERO)) {
                throw new Error('Endomorphism can only be defined for Koblitz curves that have a=0');
            }
            if (typeof endo !== 'object' ||
                typeof endo.beta !== 'bigint' ||
                typeof endo.splitScalar !== 'function') {
                throw new Error('Expected endomorphism with beta: bigint and splitScalar: function');
            }
        }
        return Object.freeze({ ...opts });
    }
    // ASN.1 DER encoding utilities
    const { bytesToNumberBE: b2n, hexToBytes: h2b } = ut;
    const DER = {
        // asn.1 DER encoding utils
        Err: class DERErr extends Error {
            constructor(m = '') {
                super(m);
            }
        },
        _parseInt(data) {
            const { Err: E } = DER;
            if (data.length < 2 || data[0] !== 0x02)
                throw new E('Invalid signature integer tag');
            const len = data[1];
            const res = data.subarray(2, len + 2);
            if (!len || res.length !== len)
                throw new E('Invalid signature integer: wrong length');
            // https://crypto.stackexchange.com/a/57734 Leftmost bit of first byte is 'negative' flag,
            // since we always use positive integers here. It must always be empty:
            // - add zero byte if exists
            // - if next byte doesn't have a flag, leading zero is not allowed (minimal encoding)
            if (res[0] & 0b10000000)
                throw new E('Invalid signature integer: negative');
            if (res[0] === 0x00 && !(res[1] & 0b10000000))
                throw new E('Invalid signature integer: unnecessary leading zero');
            return { d: b2n(res), l: data.subarray(len + 2) }; // d is data, l is left
        },
        toSig(hex) {
            // parse DER signature
            const { Err: E } = DER;
            const data = typeof hex === 'string' ? h2b(hex) : hex;
            if (!(data instanceof Uint8Array))
                throw new Error('ui8a expected');
            let l = data.length;
            if (l < 2 || data[0] != 0x30)
                throw new E('Invalid signature tag');
            if (data[1] !== l - 2)
                throw new E('Invalid signature: incorrect length');
            const { d: r, l: sBytes } = DER._parseInt(data.subarray(2));
            const { d: s, l: rBytesLeft } = DER._parseInt(sBytes);
            if (rBytesLeft.length)
                throw new E('Invalid signature: left bytes after parsing');
            return { r, s };
        },
        hexFromSig(sig) {
            // Add leading zero if first byte has negative bit enabled. More details in '_parseInt'
            const slice = (s) => (Number.parseInt(s[0], 16) & 0b1000 ? '00' + s : s);
            const h = (num) => {
                const hex = num.toString(16);
                return hex.length & 1 ? `0${hex}` : hex;
            };
            const s = slice(h(sig.s));
            const r = slice(h(sig.r));
            const shl = s.length / 2;
            const rhl = r.length / 2;
            const sl = h(shl);
            const rl = h(rhl);
            return `30${h(rhl + shl + 4)}02${rl}${r}02${sl}${s}`;
        },
    };
    // Be friendly to bad ECMAScript parsers by not using bigint literals
    // prettier-ignore
    const _0n = BigInt(0), _1n$1 = BigInt(1); BigInt(2); const _3n = BigInt(3); BigInt(4);
    function weierstrassPoints(opts) {
        const CURVE = validatePointOpts(opts);
        const { Fp } = CURVE; // All curves has same field / group length as for now, but they can differ
        const toBytes = CURVE.toBytes ||
            ((_c, point, _isCompressed) => {
                const a = point.toAffine();
                return concatBytes(Uint8Array.from([0x04]), Fp.toBytes(a.x), Fp.toBytes(a.y));
            });
        const fromBytes = CURVE.fromBytes ||
            ((bytes) => {
                // const head = bytes[0];
                const tail = bytes.subarray(1);
                // if (head !== 0x04) throw new Error('Only non-compressed encoding is supported');
                const x = Fp.fromBytes(tail.subarray(0, Fp.BYTES));
                const y = Fp.fromBytes(tail.subarray(Fp.BYTES, 2 * Fp.BYTES));
                return { x, y };
            });
        /**
         * y² = x³ + ax + b: Short weierstrass curve formula
         * @returns y²
         */
        function weierstrassEquation(x) {
            const { a, b } = CURVE;
            const x2 = Fp.sqr(x); // x * x
            const x3 = Fp.mul(x2, x); // x2 * x
            return Fp.add(Fp.add(x3, Fp.mul(x, a)), b); // x3 + a * x + b
        }
        // Validate whether the passed curve params are valid.
        // We check if curve equation works for generator point.
        // `assertValidity()` won't work: `isTorsionFree()` is not available at this point in bls12-381.
        // ProjectivePoint class has not been initialized yet.
        if (!Fp.eql(Fp.sqr(CURVE.Gy), weierstrassEquation(CURVE.Gx)))
            throw new Error('bad generator point: equation left != right');
        // Valid group elements reside in range 1..n-1
        function isWithinCurveOrder(num) {
            return typeof num === 'bigint' && _0n < num && num < CURVE.n;
        }
        function assertGE(num) {
            if (!isWithinCurveOrder(num))
                throw new Error('Expected valid bigint: 0 < bigint < curve.n');
        }
        // Validates if priv key is valid and converts it to bigint.
        // Supports options allowedPrivateKeyLengths and wrapPrivateKey.
        function normPrivateKeyToScalar(key) {
            const { allowedPrivateKeyLengths: lengths, nByteLength, wrapPrivateKey, n } = CURVE;
            if (lengths && typeof key !== 'bigint') {
                if (key instanceof Uint8Array)
                    key = bytesToHex(key);
                // Normalize to hex string, pad. E.g. P521 would norm 130-132 char hex to 132-char bytes
                if (typeof key !== 'string' || !lengths.includes(key.length))
                    throw new Error('Invalid key');
                key = key.padStart(nByteLength * 2, '0');
            }
            let num;
            try {
                num =
                    typeof key === 'bigint'
                        ? key
                        : bytesToNumberBE(ensureBytes('private key', key, nByteLength));
            }
            catch (error) {
                throw new Error(`private key must be ${nByteLength} bytes, hex or bigint, not ${typeof key}`);
            }
            if (wrapPrivateKey)
                num = mod(num, n); // disabled by default, enabled for BLS
            assertGE(num); // num in range [1..N-1]
            return num;
        }
        const pointPrecomputes = new Map();
        function assertPrjPoint(other) {
            if (!(other instanceof Point))
                throw new Error('ProjectivePoint expected');
        }
        /**
         * Projective Point works in 3d / projective (homogeneous) coordinates: (x, y, z) ∋ (x=x/z, y=y/z)
         * Default Point works in 2d / affine coordinates: (x, y)
         * We're doing calculations in projective, because its operations don't require costly inversion.
         */
        class Point {
            constructor(px, py, pz) {
                this.px = px;
                this.py = py;
                this.pz = pz;
                if (px == null || !Fp.isValid(px))
                    throw new Error('x required');
                if (py == null || !Fp.isValid(py))
                    throw new Error('y required');
                if (pz == null || !Fp.isValid(pz))
                    throw new Error('z required');
            }
            // Does not validate if the point is on-curve.
            // Use fromHex instead, or call assertValidity() later.
            static fromAffine(p) {
                const { x, y } = p || {};
                if (!p || !Fp.isValid(x) || !Fp.isValid(y))
                    throw new Error('invalid affine point');
                if (p instanceof Point)
                    throw new Error('projective point not allowed');
                const is0 = (i) => Fp.eql(i, Fp.ZERO);
                // fromAffine(x:0, y:0) would produce (x:0, y:0, z:1), but we need (x:0, y:1, z:0)
                if (is0(x) && is0(y))
                    return Point.ZERO;
                return new Point(x, y, Fp.ONE);
            }
            get x() {
                return this.toAffine().x;
            }
            get y() {
                return this.toAffine().y;
            }
            /**
             * Takes a bunch of Projective Points but executes only one
             * inversion on all of them. Inversion is very slow operation,
             * so this improves performance massively.
             * Optimization: converts a list of projective points to a list of identical points with Z=1.
             */
            static normalizeZ(points) {
                const toInv = Fp.invertBatch(points.map((p) => p.pz));
                return points.map((p, i) => p.toAffine(toInv[i])).map(Point.fromAffine);
            }
            /**
             * Converts hash string or Uint8Array to Point.
             * @param hex short/long ECDSA hex
             */
            static fromHex(hex) {
                const P = Point.fromAffine(fromBytes(ensureBytes('pointHex', hex)));
                P.assertValidity();
                return P;
            }
            // Multiplies generator point by privateKey.
            static fromPrivateKey(privateKey) {
                return Point.BASE.multiply(normPrivateKeyToScalar(privateKey));
            }
            // "Private method", don't use it directly
            _setWindowSize(windowSize) {
                this._WINDOW_SIZE = windowSize;
                pointPrecomputes.delete(this);
            }
            // A point on curve is valid if it conforms to equation.
            assertValidity() {
                if (this.is0()) {
                    // (0, 1, 0) aka ZERO is invalid in most contexts.
                    // In BLS, ZERO can be serialized, so we allow it.
                    // (0, 0, 0) is wrong representation of ZERO and is always invalid.
                    if (CURVE.allowInfinityPoint && !Fp.is0(this.py))
                        return;
                    throw new Error('bad point: ZERO');
                }
                // Some 3rd-party test vectors require different wording between here & `fromCompressedHex`
                const { x, y } = this.toAffine();
                // Check if x, y are valid field elements
                if (!Fp.isValid(x) || !Fp.isValid(y))
                    throw new Error('bad point: x or y not FE');
                const left = Fp.sqr(y); // y²
                const right = weierstrassEquation(x); // x³ + ax + b
                if (!Fp.eql(left, right))
                    throw new Error('bad point: equation left != right');
                if (!this.isTorsionFree())
                    throw new Error('bad point: not in prime-order subgroup');
            }
            hasEvenY() {
                const { y } = this.toAffine();
                if (Fp.isOdd)
                    return !Fp.isOdd(y);
                throw new Error("Field doesn't support isOdd");
            }
            /**
             * Compare one point to another.
             */
            equals(other) {
                assertPrjPoint(other);
                const { px: X1, py: Y1, pz: Z1 } = this;
                const { px: X2, py: Y2, pz: Z2 } = other;
                const U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
                const U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
                return U1 && U2;
            }
            /**
             * Flips point to one corresponding to (x, -y) in Affine coordinates.
             */
            negate() {
                return new Point(this.px, Fp.neg(this.py), this.pz);
            }
            // Renes-Costello-Batina exception-free doubling formula.
            // There is 30% faster Jacobian formula, but it is not complete.
            // https://eprint.iacr.org/2015/1060, algorithm 3
            // Cost: 8M + 3S + 3*a + 2*b3 + 15add.
            double() {
                const { a, b } = CURVE;
                const b3 = Fp.mul(b, _3n);
                const { px: X1, py: Y1, pz: Z1 } = this;
                let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO; // prettier-ignore
                let t0 = Fp.mul(X1, X1); // step 1
                let t1 = Fp.mul(Y1, Y1);
                let t2 = Fp.mul(Z1, Z1);
                let t3 = Fp.mul(X1, Y1);
                t3 = Fp.add(t3, t3); // step 5
                Z3 = Fp.mul(X1, Z1);
                Z3 = Fp.add(Z3, Z3);
                X3 = Fp.mul(a, Z3);
                Y3 = Fp.mul(b3, t2);
                Y3 = Fp.add(X3, Y3); // step 10
                X3 = Fp.sub(t1, Y3);
                Y3 = Fp.add(t1, Y3);
                Y3 = Fp.mul(X3, Y3);
                X3 = Fp.mul(t3, X3);
                Z3 = Fp.mul(b3, Z3); // step 15
                t2 = Fp.mul(a, t2);
                t3 = Fp.sub(t0, t2);
                t3 = Fp.mul(a, t3);
                t3 = Fp.add(t3, Z3);
                Z3 = Fp.add(t0, t0); // step 20
                t0 = Fp.add(Z3, t0);
                t0 = Fp.add(t0, t2);
                t0 = Fp.mul(t0, t3);
                Y3 = Fp.add(Y3, t0);
                t2 = Fp.mul(Y1, Z1); // step 25
                t2 = Fp.add(t2, t2);
                t0 = Fp.mul(t2, t3);
                X3 = Fp.sub(X3, t0);
                Z3 = Fp.mul(t2, t1);
                Z3 = Fp.add(Z3, Z3); // step 30
                Z3 = Fp.add(Z3, Z3);
                return new Point(X3, Y3, Z3);
            }
            // Renes-Costello-Batina exception-free addition formula.
            // There is 30% faster Jacobian formula, but it is not complete.
            // https://eprint.iacr.org/2015/1060, algorithm 1
            // Cost: 12M + 0S + 3*a + 3*b3 + 23add.
            add(other) {
                assertPrjPoint(other);
                const { px: X1, py: Y1, pz: Z1 } = this;
                const { px: X2, py: Y2, pz: Z2 } = other;
                let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO; // prettier-ignore
                const a = CURVE.a;
                const b3 = Fp.mul(CURVE.b, _3n);
                let t0 = Fp.mul(X1, X2); // step 1
                let t1 = Fp.mul(Y1, Y2);
                let t2 = Fp.mul(Z1, Z2);
                let t3 = Fp.add(X1, Y1);
                let t4 = Fp.add(X2, Y2); // step 5
                t3 = Fp.mul(t3, t4);
                t4 = Fp.add(t0, t1);
                t3 = Fp.sub(t3, t4);
                t4 = Fp.add(X1, Z1);
                let t5 = Fp.add(X2, Z2); // step 10
                t4 = Fp.mul(t4, t5);
                t5 = Fp.add(t0, t2);
                t4 = Fp.sub(t4, t5);
                t5 = Fp.add(Y1, Z1);
                X3 = Fp.add(Y2, Z2); // step 15
                t5 = Fp.mul(t5, X3);
                X3 = Fp.add(t1, t2);
                t5 = Fp.sub(t5, X3);
                Z3 = Fp.mul(a, t4);
                X3 = Fp.mul(b3, t2); // step 20
                Z3 = Fp.add(X3, Z3);
                X3 = Fp.sub(t1, Z3);
                Z3 = Fp.add(t1, Z3);
                Y3 = Fp.mul(X3, Z3);
                t1 = Fp.add(t0, t0); // step 25
                t1 = Fp.add(t1, t0);
                t2 = Fp.mul(a, t2);
                t4 = Fp.mul(b3, t4);
                t1 = Fp.add(t1, t2);
                t2 = Fp.sub(t0, t2); // step 30
                t2 = Fp.mul(a, t2);
                t4 = Fp.add(t4, t2);
                t0 = Fp.mul(t1, t4);
                Y3 = Fp.add(Y3, t0);
                t0 = Fp.mul(t5, t4); // step 35
                X3 = Fp.mul(t3, X3);
                X3 = Fp.sub(X3, t0);
                t0 = Fp.mul(t3, t1);
                Z3 = Fp.mul(t5, Z3);
                Z3 = Fp.add(Z3, t0); // step 40
                return new Point(X3, Y3, Z3);
            }
            subtract(other) {
                return this.add(other.negate());
            }
            is0() {
                return this.equals(Point.ZERO);
            }
            wNAF(n) {
                return wnaf.wNAFCached(this, pointPrecomputes, n, (comp) => {
                    const toInv = Fp.invertBatch(comp.map((p) => p.pz));
                    return comp.map((p, i) => p.toAffine(toInv[i])).map(Point.fromAffine);
                });
            }
            /**
             * Non-constant-time multiplication. Uses double-and-add algorithm.
             * It's faster, but should only be used when you don't care about
             * an exposed private key e.g. sig verification, which works over *public* keys.
             */
            multiplyUnsafe(n) {
                const I = Point.ZERO;
                if (n === _0n)
                    return I;
                assertGE(n); // Will throw on 0
                if (n === _1n$1)
                    return this;
                const { endo } = CURVE;
                if (!endo)
                    return wnaf.unsafeLadder(this, n);
                // Apply endomorphism
                let { k1neg, k1, k2neg, k2 } = endo.splitScalar(n);
                let k1p = I;
                let k2p = I;
                let d = this;
                while (k1 > _0n || k2 > _0n) {
                    if (k1 & _1n$1)
                        k1p = k1p.add(d);
                    if (k2 & _1n$1)
                        k2p = k2p.add(d);
                    d = d.double();
                    k1 >>= _1n$1;
                    k2 >>= _1n$1;
                }
                if (k1neg)
                    k1p = k1p.negate();
                if (k2neg)
                    k2p = k2p.negate();
                k2p = new Point(Fp.mul(k2p.px, endo.beta), k2p.py, k2p.pz);
                return k1p.add(k2p);
            }
            /**
             * Constant time multiplication.
             * Uses wNAF method. Windowed method may be 10% faster,
             * but takes 2x longer to generate and consumes 2x memory.
             * Uses precomputes when available.
             * Uses endomorphism for Koblitz curves.
             * @param scalar by which the point would be multiplied
             * @returns New point
             */
            multiply(scalar) {
                assertGE(scalar);
                let n = scalar;
                let point, fake; // Fake point is used to const-time mult
                const { endo } = CURVE;
                if (endo) {
                    const { k1neg, k1, k2neg, k2 } = endo.splitScalar(n);
                    let { p: k1p, f: f1p } = this.wNAF(k1);
                    let { p: k2p, f: f2p } = this.wNAF(k2);
                    k1p = wnaf.constTimeNegate(k1neg, k1p);
                    k2p = wnaf.constTimeNegate(k2neg, k2p);
                    k2p = new Point(Fp.mul(k2p.px, endo.beta), k2p.py, k2p.pz);
                    point = k1p.add(k2p);
                    fake = f1p.add(f2p);
                }
                else {
                    const { p, f } = this.wNAF(n);
                    point = p;
                    fake = f;
                }
                // Normalize `z` for both points, but return only real one
                return Point.normalizeZ([point, fake])[0];
            }
            /**
             * Efficiently calculate `aP + bQ`. Unsafe, can expose private key, if used incorrectly.
             * Not using Strauss-Shamir trick: precomputation tables are faster.
             * The trick could be useful if both P and Q are not G (not in our case).
             * @returns non-zero affine point
             */
            multiplyAndAddUnsafe(Q, a, b) {
                const G = Point.BASE; // No Strauss-Shamir trick: we have 10% faster G precomputes
                const mul = (P, a // Select faster multiply() method
                ) => (a === _0n || a === _1n$1 || !P.equals(G) ? P.multiplyUnsafe(a) : P.multiply(a));
                const sum = mul(this, a).add(mul(Q, b));
                return sum.is0() ? undefined : sum;
            }
            // Converts Projective point to affine (x, y) coordinates.
            // Can accept precomputed Z^-1 - for example, from invertBatch.
            // (x, y, z) ∋ (x=x/z, y=y/z)
            toAffine(iz) {
                const { px: x, py: y, pz: z } = this;
                const is0 = this.is0();
                // If invZ was 0, we return zero point. However we still want to execute
                // all operations, so we replace invZ with a random number, 1.
                if (iz == null)
                    iz = is0 ? Fp.ONE : Fp.inv(z);
                const ax = Fp.mul(x, iz);
                const ay = Fp.mul(y, iz);
                const zz = Fp.mul(z, iz);
                if (is0)
                    return { x: Fp.ZERO, y: Fp.ZERO };
                if (!Fp.eql(zz, Fp.ONE))
                    throw new Error('invZ was invalid');
                return { x: ax, y: ay };
            }
            isTorsionFree() {
                const { h: cofactor, isTorsionFree } = CURVE;
                if (cofactor === _1n$1)
                    return true; // No subgroups, always torsion-free
                if (isTorsionFree)
                    return isTorsionFree(Point, this);
                throw new Error('isTorsionFree() has not been declared for the elliptic curve');
            }
            clearCofactor() {
                const { h: cofactor, clearCofactor } = CURVE;
                if (cofactor === _1n$1)
                    return this; // Fast-path
                if (clearCofactor)
                    return clearCofactor(Point, this);
                return this.multiplyUnsafe(CURVE.h);
            }
            toRawBytes(isCompressed = true) {
                this.assertValidity();
                return toBytes(Point, this, isCompressed);
            }
            toHex(isCompressed = true) {
                return bytesToHex(this.toRawBytes(isCompressed));
            }
        }
        Point.BASE = new Point(CURVE.Gx, CURVE.Gy, Fp.ONE);
        Point.ZERO = new Point(Fp.ZERO, Fp.ONE, Fp.ZERO);
        const _bits = CURVE.nBitLength;
        const wnaf = wNAF(Point, CURVE.endo ? Math.ceil(_bits / 2) : _bits);
        // Validate if generator point is on curve
        return {
            CURVE,
            ProjectivePoint: Point,
            normPrivateKeyToScalar,
            weierstrassEquation,
            isWithinCurveOrder,
        };
    }
    function validateOpts(curve) {
        const opts = validateBasic(curve);
        validateObject(opts, {
            hash: 'hash',
            hmac: 'function',
            randomBytes: 'function',
        }, {
            bits2int: 'function',
            bits2int_modN: 'function',
            lowS: 'boolean',
        });
        return Object.freeze({ lowS: true, ...opts });
    }
    function weierstrass(curveDef) {
        const CURVE = validateOpts(curveDef);
        const { Fp, n: CURVE_ORDER } = CURVE;
        const compressedLen = Fp.BYTES + 1; // e.g. 33 for 32
        const uncompressedLen = 2 * Fp.BYTES + 1; // e.g. 65 for 32
        function isValidFieldElement(num) {
            return _0n < num && num < Fp.ORDER; // 0 is banned since it's not invertible FE
        }
        function modN(a) {
            return mod(a, CURVE_ORDER);
        }
        function invN(a) {
            return invert(a, CURVE_ORDER);
        }
        const { ProjectivePoint: Point, normPrivateKeyToScalar, weierstrassEquation, isWithinCurveOrder, } = weierstrassPoints({
            ...CURVE,
            toBytes(_c, point, isCompressed) {
                const a = point.toAffine();
                const x = Fp.toBytes(a.x);
                const cat = concatBytes;
                if (isCompressed) {
                    return cat(Uint8Array.from([point.hasEvenY() ? 0x02 : 0x03]), x);
                }
                else {
                    return cat(Uint8Array.from([0x04]), x, Fp.toBytes(a.y));
                }
            },
            fromBytes(bytes) {
                const len = bytes.length;
                const head = bytes[0];
                const tail = bytes.subarray(1);
                // this.assertValidity() is done inside of fromHex
                if (len === compressedLen && (head === 0x02 || head === 0x03)) {
                    const x = bytesToNumberBE(tail);
                    if (!isValidFieldElement(x))
                        throw new Error('Point is not on curve');
                    const y2 = weierstrassEquation(x); // y² = x³ + ax + b
                    let y = Fp.sqrt(y2); // y = y² ^ (p+1)/4
                    const isYOdd = (y & _1n$1) === _1n$1;
                    // ECDSA
                    const isHeadOdd = (head & 1) === 1;
                    if (isHeadOdd !== isYOdd)
                        y = Fp.neg(y);
                    return { x, y };
                }
                else if (len === uncompressedLen && head === 0x04) {
                    const x = Fp.fromBytes(tail.subarray(0, Fp.BYTES));
                    const y = Fp.fromBytes(tail.subarray(Fp.BYTES, 2 * Fp.BYTES));
                    return { x, y };
                }
                else {
                    throw new Error(`Point of length ${len} was invalid. Expected ${compressedLen} compressed bytes or ${uncompressedLen} uncompressed bytes`);
                }
            },
        });
        const numToNByteStr = (num) => bytesToHex(numberToBytesBE(num, CURVE.nByteLength));
        function isBiggerThanHalfOrder(number) {
            const HALF = CURVE_ORDER >> _1n$1;
            return number > HALF;
        }
        function normalizeS(s) {
            return isBiggerThanHalfOrder(s) ? modN(-s) : s;
        }
        // slice bytes num
        const slcNum = (b, from, to) => bytesToNumberBE(b.slice(from, to));
        /**
         * ECDSA signature with its (r, s) properties. Supports DER & compact representations.
         */
        class Signature {
            constructor(r, s, recovery) {
                this.r = r;
                this.s = s;
                this.recovery = recovery;
                this.assertValidity();
            }
            // pair (bytes of r, bytes of s)
            static fromCompact(hex) {
                const l = CURVE.nByteLength;
                hex = ensureBytes('compactSignature', hex, l * 2);
                return new Signature(slcNum(hex, 0, l), slcNum(hex, l, 2 * l));
            }
            // DER encoded ECDSA signature
            // https://bitcoin.stackexchange.com/questions/57644/what-are-the-parts-of-a-bitcoin-transaction-input-script
            static fromDER(hex) {
                const { r, s } = DER.toSig(ensureBytes('DER', hex));
                return new Signature(r, s);
            }
            assertValidity() {
                // can use assertGE here
                if (!isWithinCurveOrder(this.r))
                    throw new Error('r must be 0 < r < CURVE.n');
                if (!isWithinCurveOrder(this.s))
                    throw new Error('s must be 0 < s < CURVE.n');
            }
            addRecoveryBit(recovery) {
                return new Signature(this.r, this.s, recovery);
            }
            recoverPublicKey(msgHash) {
                const { r, s, recovery: rec } = this;
                const h = bits2int_modN(ensureBytes('msgHash', msgHash)); // Truncate hash
                if (rec == null || ![0, 1, 2, 3].includes(rec))
                    throw new Error('recovery id invalid');
                const radj = rec === 2 || rec === 3 ? r + CURVE.n : r;
                if (radj >= Fp.ORDER)
                    throw new Error('recovery id 2 or 3 invalid');
                const prefix = (rec & 1) === 0 ? '02' : '03';
                const R = Point.fromHex(prefix + numToNByteStr(radj));
                const ir = invN(radj); // r^-1
                const u1 = modN(-h * ir); // -hr^-1
                const u2 = modN(s * ir); // sr^-1
                const Q = Point.BASE.multiplyAndAddUnsafe(R, u1, u2); // (sr^-1)R-(hr^-1)G = -(hr^-1)G + (sr^-1)
                if (!Q)
                    throw new Error('point at infinify'); // unsafe is fine: no priv data leaked
                Q.assertValidity();
                return Q;
            }
            // Signatures should be low-s, to prevent malleability.
            hasHighS() {
                return isBiggerThanHalfOrder(this.s);
            }
            normalizeS() {
                return this.hasHighS() ? new Signature(this.r, modN(-this.s), this.recovery) : this;
            }
            // DER-encoded
            toDERRawBytes() {
                return hexToBytes(this.toDERHex());
            }
            toDERHex() {
                return DER.hexFromSig({ r: this.r, s: this.s });
            }
            // padded bytes of r, then padded bytes of s
            toCompactRawBytes() {
                return hexToBytes(this.toCompactHex());
            }
            toCompactHex() {
                return numToNByteStr(this.r) + numToNByteStr(this.s);
            }
        }
        const utils = {
            isValidPrivateKey(privateKey) {
                try {
                    normPrivateKeyToScalar(privateKey);
                    return true;
                }
                catch (error) {
                    return false;
                }
            },
            normPrivateKeyToScalar: normPrivateKeyToScalar,
            /**
             * Produces cryptographically secure private key from random of size
             * (groupLen + ceil(groupLen / 2)) with modulo bias being negligible.
             */
            randomPrivateKey: () => {
                const length = getMinHashLength(CURVE.n);
                return mapHashToField(CURVE.randomBytes(length), CURVE.n);
            },
            /**
             * Creates precompute table for an arbitrary EC point. Makes point "cached".
             * Allows to massively speed-up `point.multiply(scalar)`.
             * @returns cached point
             * @example
             * const fast = utils.precompute(8, ProjectivePoint.fromHex(someonesPubKey));
             * fast.multiply(privKey); // much faster ECDH now
             */
            precompute(windowSize = 8, point = Point.BASE) {
                point._setWindowSize(windowSize);
                point.multiply(BigInt(3)); // 3 is arbitrary, just need any number here
                return point;
            },
        };
        /**
         * Computes public key for a private key. Checks for validity of the private key.
         * @param privateKey private key
         * @param isCompressed whether to return compact (default), or full key
         * @returns Public key, full when isCompressed=false; short when isCompressed=true
         */
        function getPublicKey(privateKey, isCompressed = true) {
            return Point.fromPrivateKey(privateKey).toRawBytes(isCompressed);
        }
        /**
         * Quick and dirty check for item being public key. Does not validate hex, or being on-curve.
         */
        function isProbPub(item) {
            const arr = item instanceof Uint8Array;
            const str = typeof item === 'string';
            const len = (arr || str) && item.length;
            if (arr)
                return len === compressedLen || len === uncompressedLen;
            if (str)
                return len === 2 * compressedLen || len === 2 * uncompressedLen;
            if (item instanceof Point)
                return true;
            return false;
        }
        /**
         * ECDH (Elliptic Curve Diffie Hellman).
         * Computes shared public key from private key and public key.
         * Checks: 1) private key validity 2) shared key is on-curve.
         * Does NOT hash the result.
         * @param privateA private key
         * @param publicB different public key
         * @param isCompressed whether to return compact (default), or full key
         * @returns shared public key
         */
        function getSharedSecret(privateA, publicB, isCompressed = true) {
            if (isProbPub(privateA))
                throw new Error('first arg must be private key');
            if (!isProbPub(publicB))
                throw new Error('second arg must be public key');
            const b = Point.fromHex(publicB); // check for being on-curve
            return b.multiply(normPrivateKeyToScalar(privateA)).toRawBytes(isCompressed);
        }
        // RFC6979: ensure ECDSA msg is X bytes and < N. RFC suggests optional truncating via bits2octets.
        // FIPS 186-4 4.6 suggests the leftmost min(nBitLen, outLen) bits, which matches bits2int.
        // bits2int can produce res>N, we can do mod(res, N) since the bitLen is the same.
        // int2octets can't be used; pads small msgs with 0: unacceptatble for trunc as per RFC vectors
        const bits2int = CURVE.bits2int ||
            function (bytes) {
                // For curves with nBitLength % 8 !== 0: bits2octets(bits2octets(m)) !== bits2octets(m)
                // for some cases, since bytes.length * 8 is not actual bitLength.
                const num = bytesToNumberBE(bytes); // check for == u8 done here
                const delta = bytes.length * 8 - CURVE.nBitLength; // truncate to nBitLength leftmost bits
                return delta > 0 ? num >> BigInt(delta) : num;
            };
        const bits2int_modN = CURVE.bits2int_modN ||
            function (bytes) {
                return modN(bits2int(bytes)); // can't use bytesToNumberBE here
            };
        // NOTE: pads output with zero as per spec
        const ORDER_MASK = bitMask(CURVE.nBitLength);
        /**
         * Converts to bytes. Checks if num in `[0..ORDER_MASK-1]` e.g.: `[0..2^256-1]`.
         */
        function int2octets(num) {
            if (typeof num !== 'bigint')
                throw new Error('bigint expected');
            if (!(_0n <= num && num < ORDER_MASK))
                throw new Error(`bigint expected < 2^${CURVE.nBitLength}`);
            // works with order, can have different size than numToField!
            return numberToBytesBE(num, CURVE.nByteLength);
        }
        // Steps A, D of RFC6979 3.2
        // Creates RFC6979 seed; converts msg/privKey to numbers.
        // Used only in sign, not in verify.
        // NOTE: we cannot assume here that msgHash has same amount of bytes as curve order, this will be wrong at least for P521.
        // Also it can be bigger for P224 + SHA256
        function prepSig(msgHash, privateKey, opts = defaultSigOpts) {
            if (['recovered', 'canonical'].some((k) => k in opts))
                throw new Error('sign() legacy options not supported');
            const { hash, randomBytes } = CURVE;
            let { lowS, prehash, extraEntropy: ent } = opts; // generates low-s sigs by default
            if (lowS == null)
                lowS = true; // RFC6979 3.2: we skip step A, because we already provide hash
            msgHash = ensureBytes('msgHash', msgHash);
            if (prehash)
                msgHash = ensureBytes('prehashed msgHash', hash(msgHash));
            // We can't later call bits2octets, since nested bits2int is broken for curves
            // with nBitLength % 8 !== 0. Because of that, we unwrap it here as int2octets call.
            // const bits2octets = (bits) => int2octets(bits2int_modN(bits))
            const h1int = bits2int_modN(msgHash);
            const d = normPrivateKeyToScalar(privateKey); // validate private key, convert to bigint
            const seedArgs = [int2octets(d), int2octets(h1int)];
            // extraEntropy. RFC6979 3.6: additional k' (optional).
            if (ent != null) {
                // K = HMAC_K(V || 0x00 || int2octets(x) || bits2octets(h1) || k')
                const e = ent === true ? randomBytes(Fp.BYTES) : ent; // generate random bytes OR pass as-is
                seedArgs.push(ensureBytes('extraEntropy', e)); // check for being bytes
            }
            const seed = concatBytes(...seedArgs); // Step D of RFC6979 3.2
            const m = h1int; // NOTE: no need to call bits2int second time here, it is inside truncateHash!
            // Converts signature params into point w r/s, checks result for validity.
            function k2sig(kBytes) {
                // RFC 6979 Section 3.2, step 3: k = bits2int(T)
                const k = bits2int(kBytes); // Cannot use fields methods, since it is group element
                if (!isWithinCurveOrder(k))
                    return; // Important: all mod() calls here must be done over N
                const ik = invN(k); // k^-1 mod n
                const q = Point.BASE.multiply(k).toAffine(); // q = Gk
                const r = modN(q.x); // r = q.x mod n
                if (r === _0n)
                    return;
                // Can use scalar blinding b^-1(bm + bdr) where b ∈ [1,q−1] according to
                // https://tches.iacr.org/index.php/TCHES/article/view/7337/6509. We've decided against it:
                // a) dependency on CSPRNG b) 15% slowdown c) doesn't really help since bigints are not CT
                const s = modN(ik * modN(m + r * d)); // Not using blinding here
                if (s === _0n)
                    return;
                let recovery = (q.x === r ? 0 : 2) | Number(q.y & _1n$1); // recovery bit (2 or 3, when q.x > n)
                let normS = s;
                if (lowS && isBiggerThanHalfOrder(s)) {
                    normS = normalizeS(s); // if lowS was passed, ensure s is always
                    recovery ^= 1; // // in the bottom half of N
                }
                return new Signature(r, normS, recovery); // use normS, not s
            }
            return { seed, k2sig };
        }
        const defaultSigOpts = { lowS: CURVE.lowS, prehash: false };
        const defaultVerOpts = { lowS: CURVE.lowS, prehash: false };
        /**
         * Signs message hash with a private key.
         * ```
         * sign(m, d, k) where
         *   (x, y) = G × k
         *   r = x mod n
         *   s = (m + dr)/k mod n
         * ```
         * @param msgHash NOT message. msg needs to be hashed to `msgHash`, or use `prehash`.
         * @param privKey private key
         * @param opts lowS for non-malleable sigs. extraEntropy for mixing randomness into k. prehash will hash first arg.
         * @returns signature with recovery param
         */
        function sign(msgHash, privKey, opts = defaultSigOpts) {
            const { seed, k2sig } = prepSig(msgHash, privKey, opts); // Steps A, D of RFC6979 3.2.
            const C = CURVE;
            const drbg = createHmacDrbg(C.hash.outputLen, C.nByteLength, C.hmac);
            return drbg(seed, k2sig); // Steps B, C, D, E, F, G
        }
        // Enable precomputes. Slows down first publicKey computation by 20ms.
        Point.BASE._setWindowSize(8);
        // utils.precompute(8, ProjectivePoint.BASE)
        /**
         * Verifies a signature against message hash and public key.
         * Rejects lowS signatures by default: to override,
         * specify option `{lowS: false}`. Implements section 4.1.4 from https://www.secg.org/sec1-v2.pdf:
         *
         * ```
         * verify(r, s, h, P) where
         *   U1 = hs^-1 mod n
         *   U2 = rs^-1 mod n
         *   R = U1⋅G - U2⋅P
         *   mod(R.x, n) == r
         * ```
         */
        function verify(signature, msgHash, publicKey, opts = defaultVerOpts) {
            const sg = signature;
            msgHash = ensureBytes('msgHash', msgHash);
            publicKey = ensureBytes('publicKey', publicKey);
            if ('strict' in opts)
                throw new Error('options.strict was renamed to lowS');
            const { lowS, prehash } = opts;
            let _sig = undefined;
            let P;
            try {
                if (typeof sg === 'string' || sg instanceof Uint8Array) {
                    // Signature can be represented in 2 ways: compact (2*nByteLength) & DER (variable-length).
                    // Since DER can also be 2*nByteLength bytes, we check for it first.
                    try {
                        _sig = Signature.fromDER(sg);
                    }
                    catch (derError) {
                        if (!(derError instanceof DER.Err))
                            throw derError;
                        _sig = Signature.fromCompact(sg);
                    }
                }
                else if (typeof sg === 'object' && typeof sg.r === 'bigint' && typeof sg.s === 'bigint') {
                    const { r, s } = sg;
                    _sig = new Signature(r, s);
                }
                else {
                    throw new Error('PARSE');
                }
                P = Point.fromHex(publicKey);
            }
            catch (error) {
                if (error.message === 'PARSE')
                    throw new Error(`signature must be Signature instance, Uint8Array or hex string`);
                return false;
            }
            if (lowS && _sig.hasHighS())
                return false;
            if (prehash)
                msgHash = CURVE.hash(msgHash);
            const { r, s } = _sig;
            const h = bits2int_modN(msgHash); // Cannot use fields methods, since it is group element
            const is = invN(s); // s^-1
            const u1 = modN(h * is); // u1 = hs^-1 mod n
            const u2 = modN(r * is); // u2 = rs^-1 mod n
            const R = Point.BASE.multiplyAndAddUnsafe(P, u1, u2)?.toAffine(); // R = u1⋅G + u2⋅P
            if (!R)
                return false;
            const v = modN(R.x);
            return v === r;
        }
        return {
            CURVE,
            getPublicKey,
            getSharedSecret,
            sign,
            verify,
            ProjectivePoint: Point,
            Signature,
            utils,
        };
    }

    /*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
    // connects noble-curves to noble-hashes
    function getHash(hash) {
        return {
            hash,
            hmac: (key, ...msgs) => hmac(hash, key, concatBytes$1(...msgs)),
            randomBytes: randomBytes$2,
        };
    }
    function createCurve(curveDef, defHash) {
        const create = (hash) => weierstrass({ ...curveDef, ...getHash(hash) });
        return Object.freeze({ ...create(defHash), create });
    }

    /*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
    const secp256k1P = BigInt('0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f');
    const secp256k1N = BigInt('0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141');
    const _1n = BigInt(1);
    const _2n = BigInt(2);
    const divNearest = (a, b) => (a + b / _2n) / b;
    /**
     * √n = n^((p+1)/4) for fields p = 3 mod 4. We unwrap the loop and multiply bit-by-bit.
     * (P+1n/4n).toString(2) would produce bits [223x 1, 0, 22x 1, 4x 0, 11, 00]
     */
    function sqrtMod(y) {
        const P = secp256k1P;
        // prettier-ignore
        const _3n = BigInt(3), _6n = BigInt(6), _11n = BigInt(11), _22n = BigInt(22);
        // prettier-ignore
        const _23n = BigInt(23), _44n = BigInt(44), _88n = BigInt(88);
        const b2 = (y * y * y) % P; // x^3, 11
        const b3 = (b2 * b2 * y) % P; // x^7
        const b6 = (pow2(b3, _3n, P) * b3) % P;
        const b9 = (pow2(b6, _3n, P) * b3) % P;
        const b11 = (pow2(b9, _2n, P) * b2) % P;
        const b22 = (pow2(b11, _11n, P) * b11) % P;
        const b44 = (pow2(b22, _22n, P) * b22) % P;
        const b88 = (pow2(b44, _44n, P) * b44) % P;
        const b176 = (pow2(b88, _88n, P) * b88) % P;
        const b220 = (pow2(b176, _44n, P) * b44) % P;
        const b223 = (pow2(b220, _3n, P) * b3) % P;
        const t1 = (pow2(b223, _23n, P) * b22) % P;
        const t2 = (pow2(t1, _6n, P) * b2) % P;
        const root = pow2(t2, _2n, P);
        if (!Fp.eql(Fp.sqr(root), y))
            throw new Error('Cannot find square root');
        return root;
    }
    const Fp = Field(secp256k1P, undefined, undefined, { sqrt: sqrtMod });
    const secp256k1 = createCurve({
        a: BigInt(0),
        b: BigInt(7),
        Fp,
        n: secp256k1N,
        // Base point (x, y) aka generator point
        Gx: BigInt('55066263022277343669578718895168534326250603453777594175500187360389116729240'),
        Gy: BigInt('32670510020758816978083085130507043184471273380659243275938904335757337482424'),
        h: BigInt(1),
        lowS: true,
        /**
         * secp256k1 belongs to Koblitz curves: it has efficiently computable endomorphism.
         * Endomorphism uses 2x less RAM, speeds up precomputation by 2x and ECDH / key recovery by 20%.
         * For precomputed wNAF it trades off 1/2 init time & 1/3 ram for 20% perf hit.
         * Explanation: https://gist.github.com/paulmillr/eb670806793e84df628a7c434a873066
         */
        endo: {
            beta: BigInt('0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee'),
            splitScalar: (k) => {
                const n = secp256k1N;
                const a1 = BigInt('0x3086d221a7d46bcde86c90e49284eb15');
                const b1 = -_1n * BigInt('0xe4437ed6010e88286f547fa90abfe4c3');
                const a2 = BigInt('0x114ca50f7a8e2f3f657c1108d9d44cfd8');
                const b2 = a1;
                const POW_2_128 = BigInt('0x100000000000000000000000000000000'); // (2n**128n).toString(16)
                const c1 = divNearest(b2 * k, n);
                const c2 = divNearest(-b1 * k, n);
                let k1 = mod(k - c1 * a1 - c2 * a2, n);
                let k2 = mod(-c1 * b1 - c2 * b2, n);
                const k1neg = k1 > POW_2_128;
                const k2neg = k2 > POW_2_128;
                if (k1neg)
                    k1 = n - k1;
                if (k2neg)
                    k2 = n - k2;
                if (k1 > POW_2_128 || k2 > POW_2_128) {
                    throw new Error('splitScalar: Endomorphism failed, k=' + k);
                }
                return { k1neg, k1, k2neg, k2 };
            },
        },
    }, sha256$1);
    // Schnorr signatures are superior to ECDSA from above. Below is Schnorr-specific BIP0340 code.
    // https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki
    BigInt(0);
    secp256k1.ProjectivePoint;

    /**
     *  A constant for the zero address.
     *
     *  (**i.e.** ``"0x0000000000000000000000000000000000000000"``)
     */
    const ZeroAddress = "0x0000000000000000000000000000000000000000";

    /**
     *  A constant for the zero hash.
     *
     *  (**i.e.** ``"0x0000000000000000000000000000000000000000000000000000000000000000"``)
     */
    const ZeroHash = "0x0000000000000000000000000000000000000000000000000000000000000000";

    /**
     *  A constant for the order N for the secp256k1 curve.
     *
     *  (**i.e.** ``0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n``)
     */
    const N$1 = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
    /**
     *  A constant for the number of wei in a single ether.
     *
     *  (**i.e.** ``1000000000000000000n``)
     */
    const WeiPerEther = BigInt("1000000000000000000");
    /**
     *  A constant for the maximum value for a ``uint256``.
     *
     *  (**i.e.** ``0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn``)
     */
    const MaxUint256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
    /**
     *  A constant for the minimum value for an ``int256``.
     *
     *  (**i.e.** ``-8000000000000000000000000000000000000000000000000000000000000000n``)
     */
    const MinInt256 = BigInt("0x8000000000000000000000000000000000000000000000000000000000000000") * BigInt(-1);
    /**
     *  A constant for the maximum value for an ``int256``.
     *
     *  (**i.e.** ``0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn``)
     */
    const MaxInt256 = BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

    // NFKC (composed)             // (decomposed)
    /**
     *  A constant for the ether symbol (normalized using NFKC).
     *
     *  (**i.e.** ``"\\u039e"``)
     */
    const EtherSymbol = "\u039e"; // "\uD835\uDF63";
    /**
     *  A constant for the [[link-eip-191]] personal message prefix.
     *
     *  (**i.e.** ``"\\x19Ethereum Signed Message:\\n"``)
     */
    const MessagePrefix = "\x19Ethereum Signed Message:\n";

    // Constants
    const BN_0$7 = BigInt(0);
    const BN_1$3 = BigInt(1);
    const BN_2$3 = BigInt(2);
    const BN_27$1 = BigInt(27);
    const BN_28$1 = BigInt(28);
    const BN_35$1 = BigInt(35);
    const _guard$3 = {};
    function toUint256(value) {
        return zeroPadValue(toBeArray(value), 32);
    }
    /**
     *  A Signature  @TODO
     *
     *
     *  @_docloc: api/crypto:Signing
     */
    class Signature {
        #r;
        #s;
        #v;
        #networkV;
        /**
         *  The ``r`` value for a signautre.
         *
         *  This represents the ``x`` coordinate of a "reference" or
         *  challenge point, from which the ``y`` can be computed.
         */
        get r() { return this.#r; }
        set r(value) {
            assertArgument(dataLength(value) === 32, "invalid r", "value", value);
            this.#r = hexlify(value);
        }
        /**
         *  The ``s`` value for a signature.
         */
        get s() { return this.#s; }
        set s(_value) {
            assertArgument(dataLength(_value) === 32, "invalid s", "value", _value);
            const value = hexlify(_value);
            assertArgument(parseInt(value.substring(0, 3)) < 8, "non-canonical s", "value", value);
            this.#s = value;
        }
        /**
         *  The ``v`` value for a signature.
         *
         *  Since a given ``x`` value for ``r`` has two possible values for
         *  its correspondin ``y``, the ``v`` indicates which of the two ``y``
         *  values to use.
         *
         *  It is normalized to the values ``27`` or ``28`` for legacy
         *  purposes.
         */
        get v() { return this.#v; }
        set v(value) {
            const v = getNumber(value, "value");
            assertArgument(v === 27 || v === 28, "invalid v", "v", value);
            this.#v = v;
        }
        /**
         *  The EIP-155 ``v`` for legacy transactions. For non-legacy
         *  transactions, this value is ``null``.
         */
        get networkV() { return this.#networkV; }
        /**
         *  The chain ID for EIP-155 legacy transactions. For non-legacy
         *  transactions, this value is ``null``.
         */
        get legacyChainId() {
            const v = this.networkV;
            if (v == null) {
                return null;
            }
            return Signature.getChainId(v);
        }
        /**
         *  The ``yParity`` for the signature.
         *
         *  See ``v`` for more details on how this value is used.
         */
        get yParity() {
            return (this.v === 27) ? 0 : 1;
        }
        /**
         *  The [[link-eip-2098]] compact representation of the ``yParity``
         *  and ``s`` compacted into a single ``bytes32``.
         */
        get yParityAndS() {
            // The EIP-2098 compact representation
            const yParityAndS = getBytes(this.s);
            if (this.yParity) {
                yParityAndS[0] |= 0x80;
            }
            return hexlify(yParityAndS);
        }
        /**
         *  The [[link-eip-2098]] compact representation.
         */
        get compactSerialized() {
            return concat([this.r, this.yParityAndS]);
        }
        /**
         *  The serialized representation.
         */
        get serialized() {
            return concat([this.r, this.s, (this.yParity ? "0x1c" : "0x1b")]);
        }
        /**
         *  @private
         */
        constructor(guard, r, s, v) {
            assertPrivate(guard, _guard$3, "Signature");
            this.#r = r;
            this.#s = s;
            this.#v = v;
            this.#networkV = null;
        }
        [Symbol.for('nodejs.util.inspect.custom')]() {
            return `Signature { r: "${this.r}", s: "${this.s}", yParity: ${this.yParity}, networkV: ${this.networkV} }`;
        }
        /**
         *  Returns a new identical [[Signature]].
         */
        clone() {
            const clone = new Signature(_guard$3, this.r, this.s, this.v);
            if (this.networkV) {
                clone.#networkV = this.networkV;
            }
            return clone;
        }
        /**
         *  Returns a representation that is compatible with ``JSON.stringify``.
         */
        toJSON() {
            const networkV = this.networkV;
            return {
                _type: "signature",
                networkV: ((networkV != null) ? networkV.toString() : null),
                r: this.r, s: this.s, v: this.v,
            };
        }
        /**
         *  Compute the chain ID from the ``v`` in a legacy EIP-155 transactions.
         *
         *  @example:
         *    Signature.getChainId(45)
         *    //_result:
         *
         *    Signature.getChainId(46)
         *    //_result:
         */
        static getChainId(v) {
            const bv = getBigInt(v, "v");
            // The v is not an EIP-155 v, so it is the unspecified chain ID
            if ((bv == BN_27$1) || (bv == BN_28$1)) {
                return BN_0$7;
            }
            // Bad value for an EIP-155 v
            assertArgument(bv >= BN_35$1, "invalid EIP-155 v", "v", v);
            return (bv - BN_35$1) / BN_2$3;
        }
        /**
         *  Compute the ``v`` for a chain ID for a legacy EIP-155 transactions.
         *
         *  Legacy transactions which use [[link-eip-155]] hijack the ``v``
         *  property to include the chain ID.
         *
         *  @example:
         *    Signature.getChainIdV(5, 27)
         *    //_result:
         *
         *    Signature.getChainIdV(5, 28)
         *    //_result:
         *
         */
        static getChainIdV(chainId, v) {
            return (getBigInt(chainId) * BN_2$3) + BigInt(35 + v - 27);
        }
        /**
         *  Compute the normalized legacy transaction ``v`` from a ``yParirty``,
         *  a legacy transaction ``v`` or a legacy [[link-eip-155]] transaction.
         *
         *  @example:
         *    // The values 0 and 1 imply v is actually yParity
         *    Signature.getNormalizedV(0)
         *    //_result:
         *
         *    // Legacy non-EIP-1559 transaction (i.e. 27 or 28)
         *    Signature.getNormalizedV(27)
         *    //_result:
         *
         *    // Legacy EIP-155 transaction (i.e. >= 35)
         *    Signature.getNormalizedV(46)
         *    //_result:
         *
         *    // Invalid values throw
         *    Signature.getNormalizedV(5)
         *    //_error:
         */
        static getNormalizedV(v) {
            const bv = getBigInt(v);
            if (bv === BN_0$7 || bv === BN_27$1) {
                return 27;
            }
            if (bv === BN_1$3 || bv === BN_28$1) {
                return 28;
            }
            assertArgument(bv >= BN_35$1, "invalid v", "v", v);
            // Otherwise, EIP-155 v means odd is 27 and even is 28
            return (bv & BN_1$3) ? 27 : 28;
        }
        /**
         *  Creates a new [[Signature]].
         *
         *  If no %%sig%% is provided, a new [[Signature]] is created
         *  with default values.
         *
         *  If %%sig%% is a string, it is parsed.
         */
        static from(sig) {
            function assertError(check, message) {
                assertArgument(check, message, "signature", sig);
            }
            if (sig == null) {
                return new Signature(_guard$3, ZeroHash, ZeroHash, 27);
            }
            if (typeof (sig) === "string") {
                const bytes = getBytes(sig, "signature");
                if (bytes.length === 64) {
                    const r = hexlify(bytes.slice(0, 32));
                    const s = bytes.slice(32, 64);
                    const v = (s[0] & 0x80) ? 28 : 27;
                    s[0] &= 0x7f;
                    return new Signature(_guard$3, r, hexlify(s), v);
                }
                if (bytes.length === 65) {
                    const r = hexlify(bytes.slice(0, 32));
                    const s = bytes.slice(32, 64);
                    assertError((s[0] & 0x80) === 0, "non-canonical s");
                    const v = Signature.getNormalizedV(bytes[64]);
                    return new Signature(_guard$3, r, hexlify(s), v);
                }
                assertError(false, "invalid raw signature length");
            }
            if (sig instanceof Signature) {
                return sig.clone();
            }
            // Get r
            const _r = sig.r;
            assertError(_r != null, "missing r");
            const r = toUint256(_r);
            // Get s; by any means necessary (we check consistency below)
            const s = (function (s, yParityAndS) {
                if (s != null) {
                    return toUint256(s);
                }
                if (yParityAndS != null) {
                    assertError(isHexString(yParityAndS, 32), "invalid yParityAndS");
                    const bytes = getBytes(yParityAndS);
                    bytes[0] &= 0x7f;
                    return hexlify(bytes);
                }
                assertError(false, "missing s");
            })(sig.s, sig.yParityAndS);
            assertError((getBytes(s)[0] & 0x80) == 0, "non-canonical s");
            // Get v; by any means necessary (we check consistency below)
            const { networkV, v } = (function (_v, yParityAndS, yParity) {
                if (_v != null) {
                    const v = getBigInt(_v);
                    return {
                        networkV: ((v >= BN_35$1) ? v : undefined),
                        v: Signature.getNormalizedV(v)
                    };
                }
                if (yParityAndS != null) {
                    assertError(isHexString(yParityAndS, 32), "invalid yParityAndS");
                    return { v: ((getBytes(yParityAndS)[0] & 0x80) ? 28 : 27) };
                }
                if (yParity != null) {
                    switch (getNumber(yParity, "sig.yParity")) {
                        case 0: return { v: 27 };
                        case 1: return { v: 28 };
                    }
                    assertError(false, "invalid yParity");
                }
                assertError(false, "missing v");
            })(sig.v, sig.yParityAndS, sig.yParity);
            const result = new Signature(_guard$3, r, s, v);
            if (networkV) {
                result.#networkV = networkV;
            }
            // If multiple of v, yParity, yParityAndS we given, check they match
            assertError(sig.yParity == null || getNumber(sig.yParity, "sig.yParity") === result.yParity, "yParity mismatch");
            assertError(sig.yParityAndS == null || sig.yParityAndS === result.yParityAndS, "yParityAndS mismatch");
            return result;
        }
    }

    /**
     *  Add details about signing here.
     *
     *  @_subsection: api/crypto:Signing  [about-signing]
     */
    /**
     *  A **SigningKey** provides high-level access to the elliptic curve
     *  cryptography (ECC) operations and key management.
     */
    class SigningKey {
        #privateKey;
        /**
         *  Creates a new **SigningKey** for %%privateKey%%.
         */
        constructor(privateKey) {
            assertArgument(dataLength(privateKey) === 32, "invalid private key", "privateKey", "[REDACTED]");
            this.#privateKey = hexlify(privateKey);
        }
        /**
         *  The private key.
         */
        get privateKey() { return this.#privateKey; }
        /**
         *  The uncompressed public key.
         *
         * This will always begin with the prefix ``0x04`` and be 132
         * characters long (the ``0x`` prefix and 130 hexadecimal nibbles).
         */
        get publicKey() { return SigningKey.computePublicKey(this.#privateKey); }
        /**
         *  The compressed public key.
         *
         *  This will always begin with either the prefix ``0x02`` or ``0x03``
         *  and be 68 characters long (the ``0x`` prefix and 33 hexadecimal
         *  nibbles)
         */
        get compressedPublicKey() { return SigningKey.computePublicKey(this.#privateKey, true); }
        /**
         *  Return the signature of the signed %%digest%%.
         */
        sign(digest) {
            assertArgument(dataLength(digest) === 32, "invalid digest length", "digest", digest);
            const sig = secp256k1.sign(getBytesCopy(digest), getBytesCopy(this.#privateKey), {
                lowS: true
            });
            return Signature.from({
                r: toBeHex(sig.r, 32),
                s: toBeHex(sig.s, 32),
                v: (sig.recovery ? 0x1c : 0x1b)
            });
        }
        /**
         *  Returns the [[link-wiki-ecdh]] shared secret between this
         *  private key and the %%other%% key.
         *
         *  The %%other%% key may be any type of key, a raw public key,
         *  a compressed/uncompressed pubic key or aprivate key.
         *
         *  Best practice is usually to use a cryptographic hash on the
         *  returned value before using it as a symetric secret.
         *
         *  @example:
         *    sign1 = new SigningKey(id("some-secret-1"))
         *    sign2 = new SigningKey(id("some-secret-2"))
         *
         *    // Notice that privA.computeSharedSecret(pubB)...
         *    sign1.computeSharedSecret(sign2.publicKey)
         *    //_result:
         *
         *    // ...is equal to privB.computeSharedSecret(pubA).
         *    sign2.computeSharedSecret(sign1.publicKey)
         *    //_result:
         */
        computeSharedSecret(other) {
            const pubKey = SigningKey.computePublicKey(other);
            return hexlify(secp256k1.getSharedSecret(getBytesCopy(this.#privateKey), getBytes(pubKey), false));
        }
        /**
         *  Compute the public key for %%key%%, optionally %%compressed%%.
         *
         *  The %%key%% may be any type of key, a raw public key, a
         *  compressed/uncompressed public key or private key.
         *
         *  @example:
         *    sign = new SigningKey(id("some-secret"));
         *
         *    // Compute the uncompressed public key for a private key
         *    SigningKey.computePublicKey(sign.privateKey)
         *    //_result:
         *
         *    // Compute the compressed public key for a private key
         *    SigningKey.computePublicKey(sign.privateKey, true)
         *    //_result:
         *
         *    // Compute the uncompressed public key
         *    SigningKey.computePublicKey(sign.publicKey, false);
         *    //_result:
         *
         *    // Compute the Compressed a public key
         *    SigningKey.computePublicKey(sign.publicKey, true);
         *    //_result:
         */
        static computePublicKey(key, compressed) {
            let bytes = getBytes(key, "key");
            // private key
            if (bytes.length === 32) {
                const pubKey = secp256k1.getPublicKey(bytes, !!compressed);
                return hexlify(pubKey);
            }
            // raw public key; use uncompressed key with 0x04 prefix
            if (bytes.length === 64) {
                const pub = new Uint8Array(65);
                pub[0] = 0x04;
                pub.set(bytes, 1);
                bytes = pub;
            }
            const point = secp256k1.ProjectivePoint.fromHex(bytes);
            return hexlify(point.toRawBytes(compressed));
        }
        /**
         *  Returns the public key for the private key which produced the
         *  %%signature%% for the given %%digest%%.
         *
         *  @example:
         *    key = new SigningKey(id("some-secret"))
         *    digest = id("hello world")
         *    sig = key.sign(digest)
         *
         *    // Notice the signer public key...
         *    key.publicKey
         *    //_result:
         *
         *    // ...is equal to the recovered public key
         *    SigningKey.recoverPublicKey(digest, sig)
         *    //_result:
         *
         */
        static recoverPublicKey(digest, signature) {
            assertArgument(dataLength(digest) === 32, "invalid digest length", "digest", digest);
            const sig = Signature.from(signature);
            let secpSig = secp256k1.Signature.fromCompact(getBytesCopy(concat([sig.r, sig.s])));
            secpSig = secpSig.addRecoveryBit(sig.yParity);
            const pubKey = secpSig.recoverPublicKey(getBytesCopy(digest));
            assertArgument(pubKey != null, "invalid signautre for digest", "signature", signature);
            return "0x" + pubKey.toHex(false);
        }
        /**
         *  Returns the point resulting from adding the ellipic curve points
         *  %%p0%% and %%p1%%.
         *
         *  This is not a common function most developers should require, but
         *  can be useful for certain privacy-specific techniques.
         *
         *  For example, it is used by [[HDNodeWallet]] to compute child
         *  addresses from parent public keys and chain codes.
         */
        static addPoints(p0, p1, compressed) {
            const pub0 = secp256k1.ProjectivePoint.fromHex(SigningKey.computePublicKey(p0).substring(2));
            const pub1 = secp256k1.ProjectivePoint.fromHex(SigningKey.computePublicKey(p1).substring(2));
            return "0x" + pub0.add(pub1).toHex(!!compressed);
        }
    }

    /**
     *  A fundamental building block of Ethereum is the underlying
     *  cryptographic primitives.
     *
     *  @_section: api/crypto:Cryptographic Functions   [about-crypto]
     */
    /**
     *  Once called, prevents any future change to the underlying cryptographic
     *  primitives using the ``.register`` feature for hooks.
     */
    function lock() {
        computeHmac.lock();
        keccak256.lock();
        pbkdf2.lock();
        randomBytes.lock();
        ripemd160.lock();
        scrypt.lock();
        scryptSync.lock();
        sha256.lock();
        sha512.lock();
        randomBytes.lock();
    }

    const BN_0$6 = BigInt(0);
    const BN_36 = BigInt(36);
    function getChecksumAddress(address) {
        //    if (!isHexString(address, 20)) {
        //        logger.throwArgumentError("invalid address", "address", address);
        //    }
        address = address.toLowerCase();
        const chars = address.substring(2).split("");
        const expanded = new Uint8Array(40);
        for (let i = 0; i < 40; i++) {
            expanded[i] = chars[i].charCodeAt(0);
        }
        const hashed = getBytes(keccak256(expanded));
        for (let i = 0; i < 40; i += 2) {
            if ((hashed[i >> 1] >> 4) >= 8) {
                chars[i] = chars[i].toUpperCase();
            }
            if ((hashed[i >> 1] & 0x0f) >= 8) {
                chars[i + 1] = chars[i + 1].toUpperCase();
            }
        }
        return "0x" + chars.join("");
    }
    // See: https://en.wikipedia.org/wiki/International_Bank_Account_Number
    // Create lookup table
    const ibanLookup = {};
    for (let i = 0; i < 10; i++) {
        ibanLookup[String(i)] = String(i);
    }
    for (let i = 0; i < 26; i++) {
        ibanLookup[String.fromCharCode(65 + i)] = String(10 + i);
    }
    // How many decimal digits can we process? (for 64-bit float, this is 15)
    // i.e. Math.floor(Math.log10(Number.MAX_SAFE_INTEGER));
    const safeDigits = 15;
    function ibanChecksum(address) {
        address = address.toUpperCase();
        address = address.substring(4) + address.substring(0, 2) + "00";
        let expanded = address.split("").map((c) => { return ibanLookup[c]; }).join("");
        // Javascript can handle integers safely up to 15 (decimal) digits
        while (expanded.length >= safeDigits) {
            let block = expanded.substring(0, safeDigits);
            expanded = parseInt(block, 10) % 97 + expanded.substring(block.length);
        }
        let checksum = String(98 - (parseInt(expanded, 10) % 97));
        while (checksum.length < 2) {
            checksum = "0" + checksum;
        }
        return checksum;
    }
    const Base36 = (function () {
        const result = {};
        for (let i = 0; i < 36; i++) {
            const key = "0123456789abcdefghijklmnopqrstuvwxyz"[i];
            result[key] = BigInt(i);
        }
        return result;
    })();
    function fromBase36(value) {
        value = value.toLowerCase();
        let result = BN_0$6;
        for (let i = 0; i < value.length; i++) {
            result = result * BN_36 + Base36[value[i]];
        }
        return result;
    }
    /**
     *  Returns a normalized and checksumed address for %%address%%.
     *  This accepts non-checksum addresses, checksum addresses and
     *  [[getIcapAddress]] formats.
     *
     *  The checksum in Ethereum uses the capitalization (upper-case
     *  vs lower-case) of the characters within an address to encode
     *  its checksum, which offers, on average, a checksum of 15-bits.
     *
     *  If %%address%% contains both upper-case and lower-case, it is
     *  assumed to already be a checksum address and its checksum is
     *  validated, and if the address fails its expected checksum an
     *  error is thrown.
     *
     *  If you wish the checksum of %%address%% to be ignore, it should
     *  be converted to lower-case (i.e. ``.toLowercase()``) before
     *  being passed in. This should be a very rare situation though,
     *  that you wish to bypass the safegaurds in place to protect
     *  against an address that has been incorrectly copied from another
     *  source.
     *
     *  @example:
     *    // Adds the checksum (via upper-casing specific letters)
     *    getAddress("0x8ba1f109551bd432803012645ac136ddd64dba72")
     *    //_result:
     *
     *    // Converts ICAP address and adds checksum
     *    getAddress("XE65GB6LDNXYOFTX0NSV3FUWKOWIXAMJK36");
     *    //_result:
     *
     *    // Throws an error if an address contains mixed case,
     *    // but the checksum fails
     *    getAddress("0x8Ba1f109551bD432803012645Ac136ddd64DBA72")
     *    //_error:
     */
    function getAddress(address) {
        assertArgument(typeof (address) === "string", "invalid address", "address", address);
        if (address.match(/^(0x)?[0-9a-fA-F]{40}$/)) {
            // Missing the 0x prefix
            if (!address.startsWith("0x")) {
                address = "0x" + address;
            }
            const result = getChecksumAddress(address);
            // It is a checksummed address with a bad checksum
            assertArgument(!address.match(/([A-F].*[a-f])|([a-f].*[A-F])/) || result === address, "bad address checksum", "address", address);
            return result;
        }
        // Maybe ICAP? (we only support direct mode)
        if (address.match(/^XE[0-9]{2}[0-9A-Za-z]{30,31}$/)) {
            // It is an ICAP address with a bad checksum
            assertArgument(address.substring(2, 4) === ibanChecksum(address), "bad icap checksum", "address", address);
            let result = fromBase36(address.substring(4)).toString(16);
            while (result.length < 40) {
                result = "0" + result;
            }
            return getChecksumAddress("0x" + result);
        }
        assertArgument(false, "invalid address", "address", address);
    }
    /**
     *  The [ICAP Address format](link-icap) format is an early checksum
     *  format which attempts to be compatible with the banking
     *  industry [IBAN format](link-wiki-iban) for bank accounts.
     *
     *  It is no longer common or a recommended format.
     *
     *  @example:
     *    getIcapAddress("0x8ba1f109551bd432803012645ac136ddd64dba72");
     *    //_result:
     *
     *    getIcapAddress("XE65GB6LDNXYOFTX0NSV3FUWKOWIXAMJK36");
     *    //_result:
     *
     *    // Throws an error if the ICAP checksum is wrong
     *    getIcapAddress("XE65GB6LDNXYOFTX0NSV3FUWKOWIXAMJK37");
     *    //_error:
     */
    function getIcapAddress(address) {
        //let base36 = _base16To36(getAddress(address).substring(2)).toUpperCase();
        let base36 = BigInt(getAddress(address)).toString(36).toUpperCase();
        while (base36.length < 30) {
            base36 = "0" + base36;
        }
        return "XE" + ibanChecksum("XE00" + base36) + base36;
    }

    // http://ethereum.stackexchange.com/questions/760/how-is-the-address-of-an-ethereum-contract-computed
    /**
     *  Returns the address that would result from a ``CREATE`` for %%tx%%.
     *
     *  This can be used to compute the address a contract will be
     *  deployed to by an EOA when sending a deployment transaction (i.e.
     *  when the ``to`` address is ``null``).
     *
     *  This can also be used to compute the address a contract will be
     *  deployed to by a contract, by using the contract's address as the
     *  ``to`` and the contract's nonce.
     *
     *  @example
     *    from = "0x8ba1f109551bD432803012645Ac136ddd64DBA72";
     *    nonce = 5;
     *
     *    getCreateAddress({ from, nonce });
     *    //_result:
     */
    function getCreateAddress(tx) {
        const from = getAddress(tx.from);
        const nonce = getBigInt(tx.nonce, "tx.nonce");
        let nonceHex = nonce.toString(16);
        if (nonceHex === "0") {
            nonceHex = "0x";
        }
        else if (nonceHex.length % 2) {
            nonceHex = "0x0" + nonceHex;
        }
        else {
            nonceHex = "0x" + nonceHex;
        }
        return getAddress(dataSlice(keccak256(encodeRlp([from, nonceHex])), 12));
    }
    /**
     *  Returns the address that would result from a ``CREATE2`` operation
     *  with the given %%from%%, %%salt%% and %%initCodeHash%%.
     *
     *  To compute the %%initCodeHash%% from a contract's init code, use
     *  the [[keccak256]] function.
     *
     *  For a quick overview and example of ``CREATE2``, see [[link-ricmoo-wisps]].
     *
     *  @example
     *    // The address of the contract
     *    from = "0x8ba1f109551bD432803012645Ac136ddd64DBA72"
     *
     *    // The salt
     *    salt = id("HelloWorld")
     *
     *    // The hash of the initCode
     *    initCode = "0x6394198df16000526103ff60206004601c335afa6040516060f3";
     *    initCodeHash = keccak256(initCode)
     *
     *    getCreate2Address(from, salt, initCodeHash)
     *    //_result:
     */
    function getCreate2Address(_from, _salt, _initCodeHash) {
        const from = getAddress(_from);
        const salt = getBytes(_salt, "salt");
        const initCodeHash = getBytes(_initCodeHash, "initCodeHash");
        assertArgument(salt.length === 32, "salt must be 32 bytes", "salt", _salt);
        assertArgument(initCodeHash.length === 32, "initCodeHash must be 32 bytes", "initCodeHash", _initCodeHash);
        return getAddress(dataSlice(keccak256(concat(["0xff", from, salt, initCodeHash])), 12));
    }

    /**
     *  Returns true if %%value%% is an object which implements the
     *  [[Addressable]] interface.
     *
     *  @example:
     *    // Wallets and AbstractSigner sub-classes
     *    isAddressable(Wallet.createRandom())
     *    //_result:
     *
     *    // Contracts
     *    contract = new Contract("dai.tokens.ethers.eth", [ ], provider)
     *    isAddressable(contract)
     *    //_result:
     */
    function isAddressable(value) {
        return (value && typeof (value.getAddress) === "function");
    }
    /**
     *  Returns true if %%value%% is a valid address.
     *
     *  @example:
     *    // Valid address
     *    isAddress("0x8ba1f109551bD432803012645Ac136ddd64DBA72")
     *    //_result:
     *
     *    // Valid ICAP address
     *    isAddress("XE65GB6LDNXYOFTX0NSV3FUWKOWIXAMJK36")
     *    //_result:
     *
     *    // Invalid checksum
     *    isAddress("0x8Ba1f109551bD432803012645Ac136ddd64DBa72")
     *    //_result:
     *
     *    // Invalid ICAP checksum
     *    isAddress("0x8Ba1f109551bD432803012645Ac136ddd64DBA72")
     *    //_result:
     *
     *    // Not an address (an ENS name requires a provided and an
     *    // asynchronous API to access)
     *    isAddress("ricmoo.eth")
     *    //_result:
     */
    function isAddress(value) {
        try {
            getAddress(value);
            return true;
        }
        catch (error) { }
        return false;
    }
    async function checkAddress(target, promise) {
        const result = await promise;
        if (result == null || result === "0x0000000000000000000000000000000000000000") {
            assert(typeof (target) !== "string", "unconfigured name", "UNCONFIGURED_NAME", { value: target });
            assertArgument(false, "invalid AddressLike value; did not resolve to a value address", "target", target);
        }
        return getAddress(result);
    }
    /**
     *  Resolves to an address for the %%target%%, which may be any
     *  supported address type, an [[Addressable]] or a Promise which
     *  resolves to an address.
     *
     *  If an ENS name is provided, but that name has not been correctly
     *  configured a [[UnconfiguredNameError]] is thrown.
     *
     *  @example:
     *    addr = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
     *
     *    // Addresses are return synchronously
     *    resolveAddress(addr, provider)
     *    //_result:
     *
     *    // Address promises are resolved asynchronously
     *    resolveAddress(Promise.resolve(addr))
     *    //_result:
     *
     *    // ENS names are resolved asynchronously
     *    resolveAddress("dai.tokens.ethers.eth", provider)
     *    //_result:
     *
     *    // Addressable objects are resolved asynchronously
     *    contract = new Contract(addr, [ ])
     *    resolveAddress(contract, provider)
     *    //_result:
     *
     *    // Unconfigured ENS names reject
     *    resolveAddress("nothing-here.ricmoo.eth", provider)
     *    //_error:
     *
     *    // ENS names require a NameResolver object passed in
     *    // (notice the provider was omitted)
     *    resolveAddress("nothing-here.ricmoo.eth")
     *    //_error:
     */
    function resolveAddress(target, resolver) {
        if (typeof (target) === "string") {
            if (target.match(/^0x[0-9a-f]{40}$/i)) {
                return getAddress(target);
            }
            assert(resolver != null, "ENS resolution requires a provider", "UNSUPPORTED_OPERATION", { operation: "resolveName" });
            return checkAddress(target, resolver.resolveName(target));
        }
        else if (isAddressable(target)) {
            return checkAddress(target, target.getAddress());
        }
        else if (target && typeof (target.then) === "function") {
            return checkAddress(target, target);
        }
        assertArgument(false, "unsupported addressable value", "target", target);
    }

    /**
     *  A Typed object allows a value to have its type explicitly
     *  specified.
     *
     *  For example, in Solidity, the value ``45`` could represent a
     *  ``uint8`` or a ``uint256``. The value ``0x1234`` could represent
     *  a ``bytes2`` or ``bytes``.
     *
     *  Since JavaScript has no meaningful way to explicitly inform any
     *  APIs which what the type is, this allows transparent interoperation
     *  with Soldity.
     *
     *  @_subsection: api/abi:Typed Values
     */
    const _gaurd = {};
    function n(value, width) {
        let signed = false;
        if (width < 0) {
            signed = true;
            width *= -1;
        }
        // @TODO: Check range is valid for value
        return new Typed(_gaurd, `${signed ? "" : "u"}int${width}`, value, { signed, width });
    }
    function b(value, size) {
        // @TODO: Check range is valid for value
        return new Typed(_gaurd, `bytes${(size) ? size : ""}`, value, { size });
    }
    const _typedSymbol = Symbol.for("_ethers_typed");
    /**
     *  The **Typed** class to wrap values providing explicit type information.
     */
    class Typed {
        /**
         *  The type, as a Solidity-compatible type.
         */
        type;
        /**
         *  The actual value.
         */
        value;
        #options;
        /**
         *  @_ignore:
         */
        _typedSymbol;
        /**
         *  @_ignore:
         */
        constructor(gaurd, type, value, options) {
            if (options == null) {
                options = null;
            }
            assertPrivate(_gaurd, gaurd, "Typed");
            defineProperties(this, { _typedSymbol, type, value });
            this.#options = options;
            // Check the value is valid
            this.format();
        }
        /**
         *  Format the type as a Human-Readable type.
         */
        format() {
            if (this.type === "array") {
                throw new Error("");
            }
            else if (this.type === "dynamicArray") {
                throw new Error("");
            }
            else if (this.type === "tuple") {
                return `tuple(${this.value.map((v) => v.format()).join(",")})`;
            }
            return this.type;
        }
        /**
         *  The default value returned by this type.
         */
        defaultValue() {
            return 0;
        }
        /**
         *  The minimum value for numeric types.
         */
        minValue() {
            return 0;
        }
        /**
         *  The maximum value for numeric types.
         */
        maxValue() {
            return 0;
        }
        /**
         *  Returns ``true`` and provides a type guard is this is a [[TypedBigInt]].
         */
        isBigInt() {
            return !!(this.type.match(/^u?int[0-9]+$/));
        }
        /**
         *  Returns ``true`` and provides a type guard is this is a [[TypedData]].
         */
        isData() {
            return this.type.startsWith("bytes");
        }
        /**
         *  Returns ``true`` and provides a type guard is this is a [[TypedString]].
         */
        isString() {
            return (this.type === "string");
        }
        /**
         *  Returns the tuple name, if this is a tuple. Throws otherwise.
         */
        get tupleName() {
            if (this.type !== "tuple") {
                throw TypeError("not a tuple");
            }
            return this.#options;
        }
        // Returns the length of this type as an array
        // - `null` indicates the length is unforced, it could be dynamic
        // - `-1` indicates the length is dynamic
        // - any other value indicates it is a static array and is its length
        /**
         *  Returns the length of the array type or ``-1`` if it is dynamic.
         *
         *  Throws if the type is not an array.
         */
        get arrayLength() {
            if (this.type !== "array") {
                throw TypeError("not an array");
            }
            if (this.#options === true) {
                return -1;
            }
            if (this.#options === false) {
                return (this.value).length;
            }
            return null;
        }
        /**
         *  Returns a new **Typed** of %%type%% with the %%value%%.
         */
        static from(type, value) {
            return new Typed(_gaurd, type, value);
        }
        /**
         *  Return a new ``uint8`` type for %%v%%.
         */
        static uint8(v) { return n(v, 8); }
        /**
         *  Return a new ``uint16`` type for %%v%%.
         */
        static uint16(v) { return n(v, 16); }
        /**
         *  Return a new ``uint24`` type for %%v%%.
         */
        static uint24(v) { return n(v, 24); }
        /**
         *  Return a new ``uint32`` type for %%v%%.
         */
        static uint32(v) { return n(v, 32); }
        /**
         *  Return a new ``uint40`` type for %%v%%.
         */
        static uint40(v) { return n(v, 40); }
        /**
         *  Return a new ``uint48`` type for %%v%%.
         */
        static uint48(v) { return n(v, 48); }
        /**
         *  Return a new ``uint56`` type for %%v%%.
         */
        static uint56(v) { return n(v, 56); }
        /**
         *  Return a new ``uint64`` type for %%v%%.
         */
        static uint64(v) { return n(v, 64); }
        /**
         *  Return a new ``uint72`` type for %%v%%.
         */
        static uint72(v) { return n(v, 72); }
        /**
         *  Return a new ``uint80`` type for %%v%%.
         */
        static uint80(v) { return n(v, 80); }
        /**
         *  Return a new ``uint88`` type for %%v%%.
         */
        static uint88(v) { return n(v, 88); }
        /**
         *  Return a new ``uint96`` type for %%v%%.
         */
        static uint96(v) { return n(v, 96); }
        /**
         *  Return a new ``uint104`` type for %%v%%.
         */
        static uint104(v) { return n(v, 104); }
        /**
         *  Return a new ``uint112`` type for %%v%%.
         */
        static uint112(v) { return n(v, 112); }
        /**
         *  Return a new ``uint120`` type for %%v%%.
         */
        static uint120(v) { return n(v, 120); }
        /**
         *  Return a new ``uint128`` type for %%v%%.
         */
        static uint128(v) { return n(v, 128); }
        /**
         *  Return a new ``uint136`` type for %%v%%.
         */
        static uint136(v) { return n(v, 136); }
        /**
         *  Return a new ``uint144`` type for %%v%%.
         */
        static uint144(v) { return n(v, 144); }
        /**
         *  Return a new ``uint152`` type for %%v%%.
         */
        static uint152(v) { return n(v, 152); }
        /**
         *  Return a new ``uint160`` type for %%v%%.
         */
        static uint160(v) { return n(v, 160); }
        /**
         *  Return a new ``uint168`` type for %%v%%.
         */
        static uint168(v) { return n(v, 168); }
        /**
         *  Return a new ``uint176`` type for %%v%%.
         */
        static uint176(v) { return n(v, 176); }
        /**
         *  Return a new ``uint184`` type for %%v%%.
         */
        static uint184(v) { return n(v, 184); }
        /**
         *  Return a new ``uint192`` type for %%v%%.
         */
        static uint192(v) { return n(v, 192); }
        /**
         *  Return a new ``uint200`` type for %%v%%.
         */
        static uint200(v) { return n(v, 200); }
        /**
         *  Return a new ``uint208`` type for %%v%%.
         */
        static uint208(v) { return n(v, 208); }
        /**
         *  Return a new ``uint216`` type for %%v%%.
         */
        static uint216(v) { return n(v, 216); }
        /**
         *  Return a new ``uint224`` type for %%v%%.
         */
        static uint224(v) { return n(v, 224); }
        /**
         *  Return a new ``uint232`` type for %%v%%.
         */
        static uint232(v) { return n(v, 232); }
        /**
         *  Return a new ``uint240`` type for %%v%%.
         */
        static uint240(v) { return n(v, 240); }
        /**
         *  Return a new ``uint248`` type for %%v%%.
         */
        static uint248(v) { return n(v, 248); }
        /**
         *  Return a new ``uint256`` type for %%v%%.
         */
        static uint256(v) { return n(v, 256); }
        /**
         *  Return a new ``uint256`` type for %%v%%.
         */
        static uint(v) { return n(v, 256); }
        /**
         *  Return a new ``int8`` type for %%v%%.
         */
        static int8(v) { return n(v, -8); }
        /**
         *  Return a new ``int16`` type for %%v%%.
         */
        static int16(v) { return n(v, -16); }
        /**
         *  Return a new ``int24`` type for %%v%%.
         */
        static int24(v) { return n(v, -24); }
        /**
         *  Return a new ``int32`` type for %%v%%.
         */
        static int32(v) { return n(v, -32); }
        /**
         *  Return a new ``int40`` type for %%v%%.
         */
        static int40(v) { return n(v, -40); }
        /**
         *  Return a new ``int48`` type for %%v%%.
         */
        static int48(v) { return n(v, -48); }
        /**
         *  Return a new ``int56`` type for %%v%%.
         */
        static int56(v) { return n(v, -56); }
        /**
         *  Return a new ``int64`` type for %%v%%.
         */
        static int64(v) { return n(v, -64); }
        /**
         *  Return a new ``int72`` type for %%v%%.
         */
        static int72(v) { return n(v, -72); }
        /**
         *  Return a new ``int80`` type for %%v%%.
         */
        static int80(v) { return n(v, -80); }
        /**
         *  Return a new ``int88`` type for %%v%%.
         */
        static int88(v) { return n(v, -88); }
        /**
         *  Return a new ``int96`` type for %%v%%.
         */
        static int96(v) { return n(v, -96); }
        /**
         *  Return a new ``int104`` type for %%v%%.
         */
        static int104(v) { return n(v, -104); }
        /**
         *  Return a new ``int112`` type for %%v%%.
         */
        static int112(v) { return n(v, -112); }
        /**
         *  Return a new ``int120`` type for %%v%%.
         */
        static int120(v) { return n(v, -120); }
        /**
         *  Return a new ``int128`` type for %%v%%.
         */
        static int128(v) { return n(v, -128); }
        /**
         *  Return a new ``int136`` type for %%v%%.
         */
        static int136(v) { return n(v, -136); }
        /**
         *  Return a new ``int144`` type for %%v%%.
         */
        static int144(v) { return n(v, -144); }
        /**
         *  Return a new ``int52`` type for %%v%%.
         */
        static int152(v) { return n(v, -152); }
        /**
         *  Return a new ``int160`` type for %%v%%.
         */
        static int160(v) { return n(v, -160); }
        /**
         *  Return a new ``int168`` type for %%v%%.
         */
        static int168(v) { return n(v, -168); }
        /**
         *  Return a new ``int176`` type for %%v%%.
         */
        static int176(v) { return n(v, -176); }
        /**
         *  Return a new ``int184`` type for %%v%%.
         */
        static int184(v) { return n(v, -184); }
        /**
         *  Return a new ``int92`` type for %%v%%.
         */
        static int192(v) { return n(v, -192); }
        /**
         *  Return a new ``int200`` type for %%v%%.
         */
        static int200(v) { return n(v, -200); }
        /**
         *  Return a new ``int208`` type for %%v%%.
         */
        static int208(v) { return n(v, -208); }
        /**
         *  Return a new ``int216`` type for %%v%%.
         */
        static int216(v) { return n(v, -216); }
        /**
         *  Return a new ``int224`` type for %%v%%.
         */
        static int224(v) { return n(v, -224); }
        /**
         *  Return a new ``int232`` type for %%v%%.
         */
        static int232(v) { return n(v, -232); }
        /**
         *  Return a new ``int240`` type for %%v%%.
         */
        static int240(v) { return n(v, -240); }
        /**
         *  Return a new ``int248`` type for %%v%%.
         */
        static int248(v) { return n(v, -248); }
        /**
         *  Return a new ``int256`` type for %%v%%.
         */
        static int256(v) { return n(v, -256); }
        /**
         *  Return a new ``int256`` type for %%v%%.
         */
        static int(v) { return n(v, -256); }
        /**
         *  Return a new ``bytes1`` type for %%v%%.
         */
        static bytes1(v) { return b(v, 1); }
        /**
         *  Return a new ``bytes2`` type for %%v%%.
         */
        static bytes2(v) { return b(v, 2); }
        /**
         *  Return a new ``bytes3`` type for %%v%%.
         */
        static bytes3(v) { return b(v, 3); }
        /**
         *  Return a new ``bytes4`` type for %%v%%.
         */
        static bytes4(v) { return b(v, 4); }
        /**
         *  Return a new ``bytes5`` type for %%v%%.
         */
        static bytes5(v) { return b(v, 5); }
        /**
         *  Return a new ``bytes6`` type for %%v%%.
         */
        static bytes6(v) { return b(v, 6); }
        /**
         *  Return a new ``bytes7`` type for %%v%%.
         */
        static bytes7(v) { return b(v, 7); }
        /**
         *  Return a new ``bytes8`` type for %%v%%.
         */
        static bytes8(v) { return b(v, 8); }
        /**
         *  Return a new ``bytes9`` type for %%v%%.
         */
        static bytes9(v) { return b(v, 9); }
        /**
         *  Return a new ``bytes10`` type for %%v%%.
         */
        static bytes10(v) { return b(v, 10); }
        /**
         *  Return a new ``bytes11`` type for %%v%%.
         */
        static bytes11(v) { return b(v, 11); }
        /**
         *  Return a new ``bytes12`` type for %%v%%.
         */
        static bytes12(v) { return b(v, 12); }
        /**
         *  Return a new ``bytes13`` type for %%v%%.
         */
        static bytes13(v) { return b(v, 13); }
        /**
         *  Return a new ``bytes14`` type for %%v%%.
         */
        static bytes14(v) { return b(v, 14); }
        /**
         *  Return a new ``bytes15`` type for %%v%%.
         */
        static bytes15(v) { return b(v, 15); }
        /**
         *  Return a new ``bytes16`` type for %%v%%.
         */
        static bytes16(v) { return b(v, 16); }
        /**
         *  Return a new ``bytes17`` type for %%v%%.
         */
        static bytes17(v) { return b(v, 17); }
        /**
         *  Return a new ``bytes18`` type for %%v%%.
         */
        static bytes18(v) { return b(v, 18); }
        /**
         *  Return a new ``bytes19`` type for %%v%%.
         */
        static bytes19(v) { return b(v, 19); }
        /**
         *  Return a new ``bytes20`` type for %%v%%.
         */
        static bytes20(v) { return b(v, 20); }
        /**
         *  Return a new ``bytes21`` type for %%v%%.
         */
        static bytes21(v) { return b(v, 21); }
        /**
         *  Return a new ``bytes22`` type for %%v%%.
         */
        static bytes22(v) { return b(v, 22); }
        /**
         *  Return a new ``bytes23`` type for %%v%%.
         */
        static bytes23(v) { return b(v, 23); }
        /**
         *  Return a new ``bytes24`` type for %%v%%.
         */
        static bytes24(v) { return b(v, 24); }
        /**
         *  Return a new ``bytes25`` type for %%v%%.
         */
        static bytes25(v) { return b(v, 25); }
        /**
         *  Return a new ``bytes26`` type for %%v%%.
         */
        static bytes26(v) { return b(v, 26); }
        /**
         *  Return a new ``bytes27`` type for %%v%%.
         */
        static bytes27(v) { return b(v, 27); }
        /**
         *  Return a new ``bytes28`` type for %%v%%.
         */
        static bytes28(v) { return b(v, 28); }
        /**
         *  Return a new ``bytes29`` type for %%v%%.
         */
        static bytes29(v) { return b(v, 29); }
        /**
         *  Return a new ``bytes30`` type for %%v%%.
         */
        static bytes30(v) { return b(v, 30); }
        /**
         *  Return a new ``bytes31`` type for %%v%%.
         */
        static bytes31(v) { return b(v, 31); }
        /**
         *  Return a new ``bytes32`` type for %%v%%.
         */
        static bytes32(v) { return b(v, 32); }
        /**
         *  Return a new ``address`` type for %%v%%.
         */
        static address(v) { return new Typed(_gaurd, "address", v); }
        /**
         *  Return a new ``bool`` type for %%v%%.
         */
        static bool(v) { return new Typed(_gaurd, "bool", !!v); }
        /**
         *  Return a new ``bytes`` type for %%v%%.
         */
        static bytes(v) { return new Typed(_gaurd, "bytes", v); }
        /**
         *  Return a new ``string`` type for %%v%%.
         */
        static string(v) { return new Typed(_gaurd, "string", v); }
        /**
         *  Return a new ``array`` type for %%v%%, allowing %%dynamic%% length.
         */
        static array(v, dynamic) {
            throw new Error("not implemented yet");
        }
        /**
         *  Return a new ``tuple`` type for %%v%%, with the optional %%name%%.
         */
        static tuple(v, name) {
            throw new Error("not implemented yet");
        }
        /**
         *  Return a new ``uint8`` type for %%v%%.
         */
        static overrides(v) {
            return new Typed(_gaurd, "overrides", Object.assign({}, v));
        }
        /**
         *  Returns true only if %%value%% is a [[Typed]] instance.
         */
        static isTyped(value) {
            return (value
                && typeof (value) === "object"
                && "_typedSymbol" in value
                && value._typedSymbol === _typedSymbol);
        }
        /**
         *  If the value is a [[Typed]] instance, validates the underlying value
         *  and returns it, otherwise returns value directly.
         *
         *  This is useful for functions that with to accept either a [[Typed]]
         *  object or values.
         */
        static dereference(value, type) {
            if (Typed.isTyped(value)) {
                if (value.type !== type) {
                    throw new Error(`invalid type: expecetd ${type}, got ${value.type}`);
                }
                return value.value;
            }
            return value;
        }
    }

    /**
     *  @_ignore
     */
    class AddressCoder extends Coder {
        constructor(localName) {
            super("address", "address", localName, false);
        }
        defaultValue() {
            return "0x0000000000000000000000000000000000000000";
        }
        encode(writer, _value) {
            let value = Typed.dereference(_value, "string");
            try {
                value = getAddress(value);
            }
            catch (error) {
                return this._throwError(error.message, _value);
            }
            return writer.writeValue(value);
        }
        decode(reader) {
            return getAddress(toBeHex(reader.readValue(), 20));
        }
    }

    /**
     *  Clones the functionality of an existing Coder, but without a localName
     *
     *  @_ignore
     */
    class AnonymousCoder extends Coder {
        coder;
        constructor(coder) {
            super(coder.name, coder.type, "_", coder.dynamic);
            this.coder = coder;
        }
        defaultValue() {
            return this.coder.defaultValue();
        }
        encode(writer, value) {
            return this.coder.encode(writer, value);
        }
        decode(reader) {
            return this.coder.decode(reader);
        }
    }

    /**
     *  @_ignore
     */
    function pack(writer, coders, values) {
        let arrayValues = [];
        if (Array.isArray(values)) {
            arrayValues = values;
        }
        else if (values && typeof (values) === "object") {
            let unique = {};
            arrayValues = coders.map((coder) => {
                const name = coder.localName;
                assert(name, "cannot encode object for signature with missing names", "INVALID_ARGUMENT", { argument: "values", info: { coder }, value: values });
                assert(!unique[name], "cannot encode object for signature with duplicate names", "INVALID_ARGUMENT", { argument: "values", info: { coder }, value: values });
                unique[name] = true;
                return values[name];
            });
        }
        else {
            assertArgument(false, "invalid tuple value", "tuple", values);
        }
        assertArgument(coders.length === arrayValues.length, "types/value length mismatch", "tuple", values);
        let staticWriter = new Writer();
        let dynamicWriter = new Writer();
        let updateFuncs = [];
        coders.forEach((coder, index) => {
            let value = arrayValues[index];
            if (coder.dynamic) {
                // Get current dynamic offset (for the future pointer)
                let dynamicOffset = dynamicWriter.length;
                // Encode the dynamic value into the dynamicWriter
                coder.encode(dynamicWriter, value);
                // Prepare to populate the correct offset once we are done
                let updateFunc = staticWriter.writeUpdatableValue();
                updateFuncs.push((baseOffset) => {
                    updateFunc(baseOffset + dynamicOffset);
                });
            }
            else {
                coder.encode(staticWriter, value);
            }
        });
        // Backfill all the dynamic offsets, now that we know the static length
        updateFuncs.forEach((func) => { func(staticWriter.length); });
        let length = writer.appendWriter(staticWriter);
        length += writer.appendWriter(dynamicWriter);
        return length;
    }
    /**
     *  @_ignore
     */
    function unpack(reader, coders) {
        let values = [];
        let keys = [];
        // A reader anchored to this base
        let baseReader = reader.subReader(0);
        coders.forEach((coder) => {
            let value = null;
            if (coder.dynamic) {
                let offset = reader.readIndex();
                let offsetReader = baseReader.subReader(offset);
                try {
                    value = coder.decode(offsetReader);
                }
                catch (error) {
                    // Cannot recover from this
                    if (isError(error, "BUFFER_OVERRUN")) {
                        throw error;
                    }
                    value = error;
                    value.baseType = coder.name;
                    value.name = coder.localName;
                    value.type = coder.type;
                }
            }
            else {
                try {
                    value = coder.decode(reader);
                }
                catch (error) {
                    // Cannot recover from this
                    if (isError(error, "BUFFER_OVERRUN")) {
                        throw error;
                    }
                    value = error;
                    value.baseType = coder.name;
                    value.name = coder.localName;
                    value.type = coder.type;
                }
            }
            if (value == undefined) {
                throw new Error("investigate");
            }
            values.push(value);
            keys.push(coder.localName || null);
        });
        return Result.fromItems(values, keys);
    }
    /**
     *  @_ignore
     */
    class ArrayCoder extends Coder {
        coder;
        length;
        constructor(coder, length, localName) {
            const type = (coder.type + "[" + (length >= 0 ? length : "") + "]");
            const dynamic = (length === -1 || coder.dynamic);
            super("array", type, localName, dynamic);
            defineProperties(this, { coder, length });
        }
        defaultValue() {
            // Verifies the child coder is valid (even if the array is dynamic or 0-length)
            const defaultChild = this.coder.defaultValue();
            const result = [];
            for (let i = 0; i < this.length; i++) {
                result.push(defaultChild);
            }
            return result;
        }
        encode(writer, _value) {
            const value = Typed.dereference(_value, "array");
            if (!Array.isArray(value)) {
                this._throwError("expected array value", value);
            }
            let count = this.length;
            if (count === -1) {
                count = value.length;
                writer.writeValue(value.length);
            }
            assertArgumentCount(value.length, count, "coder array" + (this.localName ? (" " + this.localName) : ""));
            let coders = [];
            for (let i = 0; i < value.length; i++) {
                coders.push(this.coder);
            }
            return pack(writer, coders, value);
        }
        decode(reader) {
            let count = this.length;
            if (count === -1) {
                count = reader.readIndex();
                // Check that there is *roughly* enough data to ensure
                // stray random data is not being read as a length. Each
                // slot requires at least 32 bytes for their value (or 32
                // bytes as a link to the data). This could use a much
                // tighter bound, but we are erroring on the side of safety.
                assert(count * WordSize <= reader.dataLength, "insufficient data length", "BUFFER_OVERRUN", { buffer: reader.bytes, offset: count * WordSize, length: reader.dataLength });
            }
            let coders = [];
            for (let i = 0; i < count; i++) {
                coders.push(new AnonymousCoder(this.coder));
            }
            return unpack(reader, coders);
        }
    }

    /**
     *  @_ignore
     */
    class BooleanCoder extends Coder {
        constructor(localName) {
            super("bool", "bool", localName, false);
        }
        defaultValue() {
            return false;
        }
        encode(writer, _value) {
            const value = Typed.dereference(_value, "bool");
            return writer.writeValue(value ? 1 : 0);
        }
        decode(reader) {
            return !!reader.readValue();
        }
    }

    /**
     *  @_ignore
     */
    class DynamicBytesCoder extends Coder {
        constructor(type, localName) {
            super(type, type, localName, true);
        }
        defaultValue() {
            return "0x";
        }
        encode(writer, value) {
            value = getBytesCopy(value);
            let length = writer.writeValue(value.length);
            length += writer.writeBytes(value);
            return length;
        }
        decode(reader) {
            return reader.readBytes(reader.readIndex(), true);
        }
    }
    /**
     *  @_ignore
     */
    class BytesCoder extends DynamicBytesCoder {
        constructor(localName) {
            super("bytes", localName);
        }
        decode(reader) {
            return hexlify(super.decode(reader));
        }
    }

    /**
     *  @_ignore
     */
    class FixedBytesCoder extends Coder {
        size;
        constructor(size, localName) {
            let name = "bytes" + String(size);
            super(name, name, localName, false);
            defineProperties(this, { size }, { size: "number" });
        }
        defaultValue() {
            return ("0x0000000000000000000000000000000000000000000000000000000000000000").substring(0, 2 + this.size * 2);
        }
        encode(writer, _value) {
            let data = getBytesCopy(Typed.dereference(_value, this.type));
            if (data.length !== this.size) {
                this._throwError("incorrect data length", _value);
            }
            return writer.writeBytes(data);
        }
        decode(reader) {
            return hexlify(reader.readBytes(this.size));
        }
    }

    const Empty = new Uint8Array([]);
    /**
     *  @_ignore
     */
    class NullCoder extends Coder {
        constructor(localName) {
            super("null", "", localName, false);
        }
        defaultValue() {
            return null;
        }
        encode(writer, value) {
            if (value != null) {
                this._throwError("not null", value);
            }
            return writer.writeBytes(Empty);
        }
        decode(reader) {
            reader.readBytes(0);
            return null;
        }
    }

    const BN_0$5 = BigInt(0);
    const BN_1$2 = BigInt(1);
    const BN_MAX_UINT256$1 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
    /**
     *  @_ignore
     */
    class NumberCoder extends Coder {
        size;
        signed;
        constructor(size, signed, localName) {
            const name = ((signed ? "int" : "uint") + (size * 8));
            super(name, name, localName, false);
            defineProperties(this, { size, signed }, { size: "number", signed: "boolean" });
        }
        defaultValue() {
            return 0;
        }
        encode(writer, _value) {
            let value = getBigInt(Typed.dereference(_value, this.type));
            // Check bounds are safe for encoding
            let maxUintValue = mask(BN_MAX_UINT256$1, WordSize * 8);
            if (this.signed) {
                let bounds = mask(maxUintValue, (this.size * 8) - 1);
                if (value > bounds || value < -(bounds + BN_1$2)) {
                    this._throwError("value out-of-bounds", _value);
                }
                value = toTwos(value, 8 * WordSize);
            }
            else if (value < BN_0$5 || value > mask(maxUintValue, this.size * 8)) {
                this._throwError("value out-of-bounds", _value);
            }
            return writer.writeValue(value);
        }
        decode(reader) {
            let value = mask(reader.readValue(), this.size * 8);
            if (this.signed) {
                value = fromTwos(value, this.size * 8);
            }
            return value;
        }
    }

    /**
     *  @_ignore
     */
    class StringCoder extends DynamicBytesCoder {
        constructor(localName) {
            super("string", localName);
        }
        defaultValue() {
            return "";
        }
        encode(writer, _value) {
            return super.encode(writer, toUtf8Bytes(Typed.dereference(_value, "string")));
        }
        decode(reader) {
            return toUtf8String(super.decode(reader));
        }
    }

    /**
     *  @_ignore
     */
    class TupleCoder extends Coder {
        coders;
        constructor(coders, localName) {
            let dynamic = false;
            const types = [];
            coders.forEach((coder) => {
                if (coder.dynamic) {
                    dynamic = true;
                }
                types.push(coder.type);
            });
            const type = ("tuple(" + types.join(",") + ")");
            super("tuple", type, localName, dynamic);
            defineProperties(this, { coders: Object.freeze(coders.slice()) });
        }
        defaultValue() {
            const values = [];
            this.coders.forEach((coder) => {
                values.push(coder.defaultValue());
            });
            // We only output named properties for uniquely named coders
            const uniqueNames = this.coders.reduce((accum, coder) => {
                const name = coder.localName;
                if (name) {
                    if (!accum[name]) {
                        accum[name] = 0;
                    }
                    accum[name]++;
                }
                return accum;
            }, {});
            // Add named values
            this.coders.forEach((coder, index) => {
                let name = coder.localName;
                if (!name || uniqueNames[name] !== 1) {
                    return;
                }
                if (name === "length") {
                    name = "_length";
                }
                if (values[name] != null) {
                    return;
                }
                values[name] = values[index];
            });
            return Object.freeze(values);
        }
        encode(writer, _value) {
            const value = Typed.dereference(_value, "tuple");
            return pack(writer, this.coders, value);
        }
        decode(reader) {
            return unpack(reader, this.coders);
        }
    }

    /**
     *  A simple hashing function which operates on UTF-8 strings to
     *  compute an 32-byte identifier.
     *
     *  This simply computes the [UTF-8 bytes](toUtf8Bytes) and computes
     *  the [[keccak256]].
     *
     *  @example:
     *    id("hello world")
     *    //_result:
     */
    function id(value) {
        return keccak256(toUtf8Bytes(value));
    }

    // created 2023-09-12T22:05:14.211Z
    // compressed base64-encoded blob for include-ens data
    // source: https://github.com/adraffy/ens-normalize.js/blob/main/src/make.js
    // see: https://github.com/adraffy/ens-normalize.js#security
    // SHA-256: 0565ed049b9cf1614bb9e11ba7d8ac6a6fb96c893253d890f7e2b2884b9ded32
    var COMPRESSED$1 = 'AEEUdwmgDS8BxQKKAP4BOgDjATAAngDUAIMAoABoAOAAagCOAEQAhABMAHIAOwA9ACsANgAmAGIAHgAuACgAJwAXAC0AGgAjAB8ALwAUACkAEgAeAAkAGwARABkAFgA5ACgALQArADcAFQApABAAHgAiABAAGgAeABMAGAUhBe8BFxREN8sF2wC5AK5HAW8ArQkDzQCuhzc3NzcBP68NEfMABQdHBuw5BV8FYAA9MzkI9r4ZBg7QyQAWA9CeOwLNCjcCjqkChuA/lm+RAsXTAoP6ASfnEQDytQFJAjWVCkeXAOsA6godAB/cwdAUE0WlBCN/AQUCQRjFD/MRBjHxDQSJbw0jBzUAswBxme+tnIcAYwabAysG8QAjAEMMmxcDqgPKQyDXCMMxA7kUQwD3NXOrAKmFIAAfBC0D3x4BJQDBGdUFAhEgVD8JnwmQJiNWYUzrg0oAGwAUAB0AFnNcACkAFgBP9h3gPfsDOWDKneY2ChglX1UDYD30ABsAFAAdABZzIGRAnwDD8wAjAEEMzRbDqgMB2sAFYwXqAtCnAsS4AwpUJKRtFHsadUz9AMMVbwLpABM1NJEX0ZkCgYMBEyMAxRVvAukAEzUBUFAtmUwSAy4DBTER33EftQHfSwB5MxJ/AjkWKQLzL8E/cwBB6QH9LQDPDtO9ASNriQC5DQANAwCK21EFI91zHwCoL9kBqQcHBwcHKzUDowBvAQohPvU3fAQgHwCyAc8CKQMA5zMSezr7ULgFmDp/LzVQBgEGAi8FYQVgt8AFcTtlQhpCWEmfe5tmZ6IAExsDzQ8t+X8rBKtTAltbAn0jsy8Bl6utPWMDTR8Ei2kRANkDBrNHNysDBzECQWUAcwFpJ3kAiyUhAJ0BUb8AL3EfAbfNAz81KUsFWwF3YQZtAm0A+VEfAzEJDQBRSQCzAQBlAHsAM70GD/v3IZWHBwARKQAxALsjTwHZAeMPEzmXgIHwABIAGQA8AEUAQDt3gdvIEGcQZAkGTRFMdEIVEwK0D64L7REdDNkq09PgADSxB/MDWwfzA1sDWwfzB/MDWwfzA1sDWwNbA1scEvAi28gQZw9QBHUFlgWTBN4IiyZREYkHMAjaVBV0JhxPA00BBCMtSSQ7mzMTJUpMFE0LCAQ2SmyvfUADTzGzVP2QqgPTMlc5dAkGHnkSqAAyD3skNb1OhnpPcagKU0+2tYdJak5vAsY6sEAACikJm2/Dd1YGRRAfJ6kQ+ww3AbkBPw3xS9wE9QY/BM0fgRkdD9GVoAipLeEM8SbnLqWAXiP5KocF8Uv4POELUVFsD10LaQnnOmeBUgMlAREijwrhDT0IcRD3Cs1vDekRSQc9A9lJngCpBwULFR05FbkmFGKwCw05ewb/GvoLkyazEy17AAXXGiUGUQEtGwMA0y7rhbRaNVwgT2MGBwspI8sUrFAkDSlAu3hMGh8HGSWtApVDdEqLUToelyH6PEENai4XUYAH+TwJGVMLhTyiRq9FEhHWPpE9TCJNTDAEOYMsMyePCdMPiQy9fHYBXQklCbUMdRM1ERs3yQg9Bx0xlygnGQglRplgngT7owP3E9UDDwVDCUUHFwO5HDETMhUtBRGBKNsC9zbZLrcCk1aEARsFzw8pH+MQVEfkDu0InwJpA4cl7wAxFSUAGyKfCEdnAGOP3FMJLs8Iy2pwI3gDaxTrZRF3B5UOWwerHDcVwxzlcMxeD4YMKKezCV8BeQmdAWME5wgNNV+MpCBFZ1eLXBifIGVBQ14AAjUMaRWjRMGHfAKPD28SHwE5AXcHPQ0FAnsR8RFvEJkI74YINbkz/DopBFMhhyAVCisDU2zSCysm/Qz8bQGnEmYDEDRBd/Jnr2C6KBgBBx0yyUFkIfULlk/RDKAaxRhGVDIZ6AfDA/ca9yfuQVsGAwOnBxc6UTPyBMELbQiPCUMATQ6nGwfbGG4KdYzUATWPAbudA1uVhwJzkwY7Bw8Aaw+LBX3pACECqwinAAkA0wNbAD0CsQehAB0AiUUBQQMrMwEl6QKTA5cINc8BmTMB9y0EH8cMGQD7O25OAsO1AoBuZqYF4VwCkgJNOQFRKQQJUktVA7N15QDfAE8GF+NLARmvTs8e50cB43MvAMsA/wAJOQcJRQHRAfdxALsBYws1Caa3uQFR7S0AhwAZbwHbAo0A4QA5AIP1AVcAUQVd/QXXAlNNARU1HC9bZQG/AyMBNwERAH0Gz5GpzQsjBHEH1wIQHxXlAu8yB7kFAyLjE9FCyQK94lkAMhoKPAqrCqpgX2Q3CjV2PVQAEh+sPss/UgVVO1c7XDtXO1w7VztcO1c7XDtXO1wDm8Pmw+YKcF9JYe8Mqg3YRMw6TRPfYFVgNhPMLbsUxRXSJVoZQRrAJwkl6FUNDwgt12Y0CDA0eRfAAEMpbINFY4oeNApPHOtTlVT8LR8AtUumM7MNsBsZREQFS3XxYi4WEgomAmSFAmJGX1GzAV83JAKh+wJonAJmDQKfiDgfDwJmPwJmKgRyBIMDfxcDfpY5Cjl7GzmGOicnAmwhAjI6OA4CbcsCbbLzjgM3a0kvAWsA4gDlAE4JB5wMkQECD8YAEbkCdzMCdqZDAnlPRwJ4viFg30WyRvcCfEMCeswCfQ0CfPRIBEiBZygALxlJXEpfGRtK0ALRBQLQ0EsrA4hTA4fqRMmRNgLypV0HAwOyS9JMMSkH001QTbMCi0MCitzFHwshR2sJuwKOOwKOYESbhQKO3QKOYHxRuFM5AQ5S2FSJApP/ApMQAO0AIFUiVbNV1AosHymZijLleGpFPz0Cl6MC77ZYJawAXSkClpMCloCgAK1ZsFoNhVEAPwKWuQKWUlxIXNUCmc8CmWhczl0LHQKcnznGOqECnBoCn58CnryOACETNS4TAp31Ap6WALlBYThh8wKe1wKgcgGtAp6jIwKeUqljzGQrKS8CJ7MCJoICoP8CoFDbAqYzAqXSAqgDAIECp/ZogGi1AAdNaiBq1QKs5wKssgKtawKtBgJXIQJV4AKx5dsDH1JsmwKywRECsuwbbORtZ21MYwMl0QK2YD9DbpQDKUkCuGICuUsZArkue3A6cOUCvR0DLbYDMhUCvoxyBgMzdQK+HnMmc1MCw88CwwhzhnRPOUl05AM8qwEDPJ4DPcMCxYACxksCxhSNAshtVQLISALJUwLJMgJkoQLd1nh9ZXiyeSlL1AMYp2cGAmH4GfeVKHsPXpZevxUCz28Cz3AzT1fW9xejAMqxAs93AS3uA04Wfk8JAtwrAtuOAtJTA1JgA1NjAQUDVZCAjUMEzxrxZEl5A4LSg5EC2ssC2eKEFIRNp0ADhqkAMwNkEoZ1Xf0AWQLfaQLevHd7AuIz7RgB8zQrAfSfAfLWiwLr9wLpdH0DAur9AuroAP1LAb0C7o0C66CWrpcHAu5DA4XkmH1w5HGlAvMHAG0DjhqZlwL3FwORcgOSiwL3nAL53QL4apogmq+/O5siA52HAv7+AR8APZ8gAZ+3AwWRA6ZuA6bdANXJAwZuoYyiCQ0DDE0BEwEjB3EGZb1rCQC/BG/DFY8etxEAG3k9ACcDNxJRA42DAWcrJQCM8wAlAOanC6OVCLsGI6fJBgCvBRnDBvElRUYFFoAFcD9GSDNCKUK8X3kZX8QAls0FOgCQVCGbwTsuYDoZutcONxjOGJHJ/gVfBWAFXwVgBWsFYAVfBWAFXwVgBV8FYAVfBWBOHQjfjW8KCgoKbF7xMwTRA7kGN8PDAMMEr8MA70gxFroFTj5xPnhCR0K+X30/X/AAWBkzswCNBsxzzASm70aCRS4rDDMeLz49fnXfcsH5GcoscQFz13Y4HwVnBXLJycnACNdRYwgICAqEXoWTxgA7P4kACxbZBu21Kw0AjMsTAwkVAOVtJUUsJ1JCuULESUArXy9gPi9AKwnJRQYKTD9LPoA+iT54PnkCkULEUUpDX9NWV3JVEjQAc1w3A3IBE3YnX+g7QiMJb6MKaiszRCUuQrNCxDPMCcwEX9EWJzYREBEEBwIHKn6l33JCNVIfybPJtAltydPUCmhBZw/tEKsZAJOVJU1CLRuxbUHOQAo7P0s+eEJHHA8SJVRPdGM0NVrpvBoKhfUlM0JHHGUQUhEWO1xLSj8MO0ucNAqJIzVCRxv9EFsqKyA4OQgNj2nwZgp5ZNFgE2A1K3YHS2AhQQojJmC7DgpzGG1WYFUZCQYHZO9gHWCdYIVgu2BTYJlwFh8GvRbcXbG8YgtDHrMBwzPVyQonHQgkCyYBgQJ0Ajc4nVqIAwGSCsBPIgDsK3SWEtIVBa5N8gGjAo+kVwVIZwD/AEUSCDweX4ITrRQsJ8K3TwBXFDwEAB0TvzVcAtoTS20RIwDgVgZ9BBImYgA5AL4Coi8LFnezOkCnIQFjAY4KBAPh9RcGsgZSBsEAJctdsWIRu2kTkQstRw7DAcMBKgpPBGIGMDAwKCYnKTQaLg4AKRSVAFwCdl+YUZ0JdicFD3lPAdt1F9ZZKCGxuE3yBxkFVGcA/wBFEgiCBwAOLHQSjxOtQDg1z7deFRMAZ8QTAGtKb1ApIiPHADkAvgKiLy1DFtYCmBiDAlDDWNB0eo7fpaMO/aEVRRv0ATEQZBIODyMEAc8JQhCbDRgzFD4TAEMAu9YBCgCsAOkAm5I3ABwAYxvONnR+MhXJAxgKQyxL2+kkJhMbhQKDBMkSsvF0AD9BNQ6uQC7WqSQHwxEAEEIu1hkhAH2z4iQPwyJPHNWpdyYBRSpnJALzoBAEVPPsH20MxA0CCEQKRgAFyAtFAlMNwwjEDUQJRArELtapMg7DDZgJIw+TGukEIwvDFkMAqAtDEMMMBhioe+QAO3MMRAACrgnEBSPY9Q0FDnbSBoMAB8MSYxkSxAEJAPIJAAB8FWMOFtMc/HcXwxhDAC7DAvOowwAewwJdKDKHAAHDAALrFUQVwwAbwyvzpWMWv8wA/ABpAy++bcYDUKPD0KhDCwKmJ1MAAmMA5+UZwxAagwipBRL/eADfw6fDGOMCGsOjk3l6BwOpo4sAEsMOGxMAA5sAbcMOAAvDp0MJGkMDwgipnNIPAwfIqUMGAOGDAAPzABXDAAcDAAnDAGmTABrDAA7DChjDjnEWAwABYwAOcwAuUyYABsMAF8MIKQANUgC6wy4AA8MADqMq8wCyYgAcIwAB8wqpAAXOCx0V4wAHowBCwwEKAGnDAAuDAB3DAAjDCakABdIAbqcZ3QCZCCkABdIAAAFDAAfjAB2jCCkABqIACYMAGzMAbSMA5sOIAAhjAAhDABTDBAkpAAbSAOOTAAlDC6kOzPtnAAdDAG6kQFAATwAKwwwAA0MACbUDPwAHIwAZgwACE6cDAAojAApDAAoDp/MGwwAJIwADEwAQQwgAFEMAEXMAD5MADfMADcMAGRMOFiMAFUMAbqMWuwHDAMIAE0MLAGkzEgDhUwACQwAEWgAXgwUjAAbYABjDBSYBgzBaAEFNALcQBxUMegAwMngBrA0IZgJ0KxQHBREPd1N0ZzKRJwaIHAZqNT4DqQq8BwngAB4DAwt2AX56T1ocKQNXAh1GATQGC3tOxYNagkgAMQA5CQADAQEAWxLjAIOYNAEzAH7tFRk6TglSAF8NAAlYAQ+S1ACAQwQorQBiAN4dAJ1wPyeTANVzuQDX3AIeEMp9eyMgXiUAEdkBkJizKltbVVAaRMqRAAEAhyQ/SDEz6BmfVwB6ATEsOClKIRcDOF0E/832AFNt5AByAnkCRxGCOs94NjXdAwINGBonDBwPALW2AwICAgAAAAAAAAYDBQMDARrUAwAtAAAAAgEGBgYGBgYFBQUFBQUEBQYHCAkEBQUFBQQAAAICAAAAIgCNAJAAlT0A6gC7ANwApEQAwgCyAK0AqADuAKYA2gCjAOcBCAEDAMcAgQBiANIA1AEDAN4A8gCQAKkBMQDqAN8A3AsBCQ8yO9ra2tq8xuLT1tRJOB0BUgFcNU0BWgFpAWgBWwFMUUlLbhMBUxsNEAs6PhMOACcUKy0vMj5AQENDQ0RFFEYGJFdXV1dZWVhZL1pbXVxcI2NnZ2ZoZypsbnZ1eHh4eHh4enp6enp6enp6enp8fH18e2IARPIASQCaAHgAMgBm+ACOAFcAVwA3AnbvAIsABfj4AGQAk/IAnwBPAGIAZP//sACFAIUAaQBWALEAJAC2AIMCQAJDAPwA5wD+AP4A6AD/AOkA6QDoAOYALwJ7AVEBQAE+AVQBPgE+AT4BOQE4ATgBOAEcAVgXADEQCAEAUx8SHgsdHhYAjgCWAKYAUQBqIAIxAHYAbwCXAxUDJzIDIUlGTzEAkQJPAMcCVwKkAMAClgKWApYClgKWApYCiwKWApYClgKWApYClgKVApUCmAKgApcClgKWApQClAKUApQCkgKVAnUB1AKXAp8ClgKWApUeAIETBQD+DQOfAmECOh8BVBg9AuIZEjMbAU4/G1WZAXusRAFpYQEFA0FPAQYAmTEeIJdyADFoAHEANgCRA5zMk/C2jGINwjMWygIZCaXdfDILBCs5dAE7YnQBugDlhoiHhoiGiYqKhouOjIaNkI6Ij4qQipGGkoaThpSSlYaWhpeKmIaZhpqGm4aci52QnoqfhuIC4XTpAt90AIp0LHSoAIsAdHQEQwRABEIERQRDBEkERgRBBEcESQRIBEQERgRJAJ5udACrA490ALxuAQ10ANFZdHQA13QCFHQA/mJ0AP4BIQD+APwA/AD9APwDhGZ03ASMK23HAP4A/AD8AP0A/CR0dACRYnQA/gCRASEA/gCRAvQA/gCRA4RmdNwEjCttxyR0AP9idAEhAP4A/gD8APwA/QD8AP8A/AD8AP0A/AOEZnTcBIwrbcckdHQAkWJ0ASEA/gCRAP4AkQL0AP4AkQOEZnTcBIwrbcckdAJLAT50AlIBQXQCU8l0dAJfdHQDpgL0A6YDpgOnA6cDpwOnA4RmdNwEjCttxyR0dACRYnQBIQOmAJEDpgCRAvQDpgCRA4RmdNwEjCttxyR0BDh0AJEEOQCRDpU5dSgCADR03gV2CwArdAEFAM5iCnR0AF1iAAYcOgp0dACRCnQAXAEIwWZ0CnRmdHQAkWZ0CnRmdEXgAFF03gp0dEY0tlT2u3SOAQTwscwhjZZKrhYcBSfFp9XNbKiVDOD2b+cpe4/Z17mQnbtzzhaeQtE2GGj0IDNTjRUSyTxxw/RPHW/+vS7d1NfRt9z9QPZg4X7QFfhCnkvgNPIItOsC2eV6hPannZNHlZ9xrwZXIMOlu3jSoQSq78WEjwLjw1ELSlF1aBvfzwk5ZX7AUvQzjPQKbDuQ+sm4wNOp4A6AdVuRS0t1y/DZpg4R6m7FNjM9HgvW7Bi88zaMjOo6lM8wtBBdj8LP4ylv3zCXPhebMKJc066o9sF71oFW/8JXu86HJbwDID5lzw5GWLR/LhT0Qqnp2JQxNZNfcbLIzPy+YypqRm/lBmGmex+82+PisxUumSeJkALIT6rJezxMH+CTJmQtt5uwTVbL3ptmjDUQzlSIvWi8Tl7ng1NpuRn1Ng4n14Qc+3Iil7OwkvNWogLSPkn3pihIFytyIGmMhOe3n1tWsuMy9BdKyqF4Z3v2SgggTL9KVvMXPnCbRe+oOuFFP3HejBG/w9gvmfNYvg6JuWia2lcSSN1uIjBktzoIazOHPJZ7kKHPz8mRWVdW3lA8WGF9dQF6Bm673boov3BUWDU2JNcahR23GtfHKLOz/viZ+rYnZFaIznXO67CYEJ1fXuTRpZhYZkKe54xeoagkNGLs+NTZHE0rX45/XvQ2RGADX6vcAvdxIUBV27wxGm2zjZo4X3ILgAlrOFheuZ6wtsvaIj4yLY7qqawlliaIcrz2G+c3vscAnCkCuMzMmZvMfu9lLwTvfX+3cVSyPdN9ZwgDZhfjRgNJcLiJ67b9xx8JHswprbiE3v9UphotAPIgnXVIN5KmMc0piXhc6cChPnN+MRhG9adtdttQTTwSIpl8I4/j//d3sz1326qTBTpPRM/Hgh3kzqEXs8ZAk4ErQhNO8hzrQ0DLkWMA/N+91tn2MdOJnWC2FCZehkQrwzwbKOjhvZsbM95QoeL9skYyMf4srVPVJSgg7pOLUtr/n9eT99oe9nLtFRpjA9okV2Kj8h9k5HaC0oivRD8VyXkJ81tcd4fHNXPCfloIQasxsuO18/46dR2jgul/UIet2G0kRvnyONMKhHs6J26FEoqSqd+rfYjeEGwHWVDpX1fh1jBBcKGMqRepju9Y00mDVHC+Xdij/j44rKfvfjGinNs1jO/0F3jB83XCDINN/HB84axlP+3E/klktRo+vl3U/aiyMJbIodE1XSsDn6UAzIoMtUObY2+k/4gY/l+AkZJ5Sj2vQrkyLm3FoxjhDX+31UXBFf9XrAH31fFqoBmDEZvhvvpnZ87N+oZEu7U9O/nnk+QWj3x8uyoRbEnf+O5UMr9i0nHP38IF5AvzrBW8YWBUR0mIAzIvndQq9N3v/Jto3aPjPXUPl8ASdPPyAp7jENf8bk7VMM9ol9XGmlBmeDMuGqt+WzuL6CXAxXjIhCPM5vACchgMJ/8XBGLO/D1isVvGhwwHHr1DLaI5mn2Jr/b1pUD90uciDaS8cXNDzCWvNmT/PhQe5e8nTnnnkt8Ds/SIjibcum/fqDhKopxAY8AkSrPn+IGDEKOO+U3XOP6djFs2H5N9+orhOahiQk5KnEUWa+CzkVzhp8bMHRbg81qhjjXuIKbHjSLSIBKWqockGtKinY+z4/RdBUF6pcc3JmnlxVcNgrI4SEzKUZSwcD2QCyxzKve+gAmg6ZuSRkpPFa6mfThu7LJNu3H5K42uCpNvPAsoedolKV/LHe/eJ+BbaG5MG0NaSGVPRUmNFMFFSSpXEcXwbVh7UETOZZtoVNRGOIbbkig3McEtR68cG0RZAoJevWYo7Dg/lZ1CQzblWeUvVHmr8fY4Nqd9JJiH/zEX24mJviH60fAyFr0A3c4bC1j3yZU60VgJxXn8JgJXLUIsiBnmKmMYz+7yBQFBvqb2eYnuW59joZBf56/wXvWIR4R8wTmV80i1mZy+S4+BUES+hzjk0uXpC///z/IlqHZ1monzlXp8aCfhGKMti73FI1KbL1q6IKO4fuBuZ59gagjn5xU79muMpHXg6S+e+gDM/U9BKLHbl9l6o8czQKl4RUkJJiqftQG2i3BMg/TQlUYFkJDYBOOvAugYuzYSDnZbDDd/aSd9x0Oe6F+bJcHfl9+gp6L5/TgA+BdFFovbfCrQ40s5vMPw8866pNX8zyFGeFWdxIpPVp9Rg1UPOVFbFZrvaFq/YAzHQgqMWpahMYfqHpmwXfHL1/kpYmGuHFwT55mQu0dylfNuq2Oq0hTMCPwqfxnuBIPLXfci4Y1ANy+1CUipQxld/izVh16WyG2Q0CQQ9NqtAnx1HCHwDj7sYxOSB0wopZSnOzxQOcExmxrVTF2BkOthVpGfuhaGECfCJpJKpjnihY+xOT2QJxN61+9K6QSqtv2Shr82I3jgJrqBg0wELFZPjvHpvzTtaJnLK6Vb97Yn933koO/saN7fsjwNKzp4l2lJVx2orjCGzC/4ZL4zCver6aQYtC5sdoychuFE6ufOiog+VWi5UDkbmvmtah/3aArEBIi39s5ILUnlFLgilcGuz9CQshEY7fw2ouoILAYPVT/gyAIq3TFAIwVsl+ktkRz/qGfnCDGrm5gsl/l9QdvCWGsjPz3dU7XuqKfdUrr/6XIgjp4rey6AJBmCmUJMjITHVdFb5m1p+dLMCL8t55zD42cmftmLEJC0Da04YiRCVUBLLa8D071/N5UBNBXDh0LFsmhV/5B5ExOB4j3WVG/S3lfK5o+V6ELHvy6RR9n4ac+VsK4VE4yphPvV+kG9FegTBH4ZRXL2HytUHCduJazB/KykjfetYxOXTLws267aGOd+I+JhKP//+VnXmS90OD/jvLcVu0asyqcuYN1mSb6XTlCkqv1vigZPIYwNF/zpWcT1GR/6aEIRjkh0yhg4LXJfaGobYJTY4JI58KiAKgmmgAKWdl5nYCeLqavRJGQNuYuZtZFGx+IkI4w4NS2xwbetNMunOjBu/hmKCI/w7tfiiyUd//4rbTeWt4izBY8YvGIN6vyKYmP/8X8wHKCeN+WRcKM70+tXKNGyevU9H2Dg5BsljnTf8YbsJ1TmMs74Ce2XlHisleguhyeg44rQOHZuw/6HTkhnnurK2d62q6yS7210SsAIaR+jXMQA+svkrLpsUY+F30Uw89uOdGAR6vo4FIME0EfVVeHTu6eKicfhSqOeXJhbftcd08sWEnNUL1C9fnprTgd83IMut8onVUF0hvqzZfHduPjbjwEXIcoYmy+P6tcJZHmeOv6VrvEdkHDJecjHuHeWANe79VG662qTjA/HCvumVv3qL+LrOcpqGps2ZGwQdFJ7PU4iuyRlBrwfO+xnPyr47s2cXVbWzAyznDiBGjCM3ksxjjqM62GE9C8f5U38kB3VjtabKp/nRdvMESPGDG90bWRLAt1Qk5DyLuazRR1YzdC1c+hZXvAWV8xA72S4A8B67vjVhbba3MMop293FeEXpe7zItMWrJG/LOH9ByOXmYnNJfjmfuX9KbrpgLOba4nZ+fl8Gbdv/ihv+6wFGKHCYrVwmhFC0J3V2bn2tIB1wCc1CST3d3X2OyxhguXcs4sm679UngzofuSeBewMFJboIQHbUh/m2JhW2hG9DIvG2t7yZIzKBTz9wBtnNC+2pCRYhSIuQ1j8xsz5VvqnyUIthvuoyyu7fNIrg/KQUVmGQaqkqZk/Vx5b33/gsEs8yX7SC1J+NV4icz6bvIE7C5G6McBaI8rVg56q5QBJWxn/87Q1sPK4+sQa8fLU5gXo4paaq4cOcQ4wR0VBHPGjKh+UlPCbA1nLXyEUX45qZ8J7/Ln4FPJE2TdzD0Z8MLSNQiykMMmSyOCiFfy84Rq60emYB2vD09KjYwsoIpeDcBDTElBbXxND72yhd9pC/1CMid/5HUMvAL27OtcIJDzNKpRPNqPOpyt2aPGz9QWIs9hQ9LiX5s8m9hjTUu/f7MyIatjjd+tSfQ3ufZxPpmJhTaBtZtKLUcfOCUqADuO+QoH8B9v6U+P0HV1GLQmtoNFTb3s74ivZgjES0qfK+8RdGgBbcCMSy8eBvh98+et1KIFqSe1KQPyXULBMTsIYnysIwiZBJYdI20vseV+wuJkcqGemehKjaAb9L57xZm3g2zX0bZ2xk/fU+bCo7TlnbW7JuF1YdURo/2Gw7VclDG1W7LOtas2LX4upifZ/23rzpsnY/ALfRgrcWP5hYmV9VxVOQA1fZvp9F2UNU+7d7xRyVm5wiLp3/0dlV7vdw1PMiZrbDAYzIVqEjRY2YU03sJhPnlwIPcZUG5ltL6S8XCxU1eYS5cjr34veBmXAvy7yN4ZjArIG0dfD/5UpBNlX1ZPoxJOwyqRi3wQWtOzd4oNKh0LkoTm8cwqgIfKhqqGOhwo71I+zXnMemTv2B2AUzABWyFztGgGULjDDzWYwJUVBTjKCn5K2QGMK1CQT7SzziOjo+BhAmqBjzuc3xYym2eedGeOIRJVyTwDw37iCMe4g5Vbnsb5ZBdxOAnMT7HU4DHpxWGuQ7GeiY30Cpbvzss55+5Km1YsbD5ea3NI9QNYIXol5apgSu9dZ8f8xS5dtHpido5BclDuLWY4lhik0tbJa07yJhH0BOyEut/GRbYTS6RfiTYWGMCkNpfSHi7HvdiTglEVHKZXaVhezH4kkXiIvKopYAlPusftpE4a5IZwvw1x/eLvoDIh/zpo9FiQInsTb2SAkKHV42XYBjpJDg4374XiVb3ws4qM0s9eSQ5HzsMU4OZJKuopFjBM+dAZEl8RUMx5uU2N486Kr141tVsGQfGjORYMCJAMsxELeNT4RmWjRcpdTGBwcx6XN9drWqPmJzcrGrH4+DRc7+n1w3kPZwu0BkNr6hQrqgo7JTB9A5kdJ/H7P4cWBMwsmuixAzJB3yrQpnGIq90lxAXLzDCdn1LPibsRt7rHNjgQBklRgPZ8vTbjXdgXrTWQsK5MdrXXQVPp0Rinq3frzZKJ0qD6Qhc40VzAraUXlob1gvkhK3vpmHgI6FRlQZNx6eRqkp0zy4AQlX813fAPtL3jMRaitGFFjo0zmErloC+h+YYdVQ6k4F/epxAoF0BmqEoKNTt6j4vQZNQ2BoqF9Vj53TOIoNmDiu9Xp15RkIgQIGcoLpfoIbenzpGUAtqFJp5W+LLnx38jHeECTJ/navKY1NWfN0sY1T8/pB8kIH3DU3DX+u6W3YwpypBMYOhbSxGjq84RZ84fWJow8pyHqn4S/9J15EcCMsXqrfwyd9mhiu3+rEo9pPpoJkdZqHjra4NvzFwuThNKy6hao/SlLw3ZADUcUp3w3SRVfW2rhl80zOgTYnKE0Hs2qp1J6H3xqPqIkvUDRMFDYyRbsFI3M9MEyovPk8rlw7/0a81cDVLmBsR2ze2pBuKb23fbeZC0uXoIvDppfTwIDxk1Oq2dGesGc+oJXWJLGkOha3CX+DUnzgAp9HGH9RsPZN63Hn4RMA5eSVhPHO+9RcRb/IOgtW31V1Q5IPGtoxPjC+MEJbVlIMYADd9aHYWUIQKopuPOHmoqSkubnAKnzgKHqgIOfW5RdAgotN6BN+O2ZYHkuemLnvQ8U9THVrS1RtLmKbcC7PeeDsYznvqzeg6VCNwmr0Yyx1wnLjyT84BZz3EJyCptD3yeueAyDWIs0L2qs/VQ3HUyqfrja0V1LdDzqAikeWuV4sc7RLIB69jEIBjCkyZedoUHqCrOvShVzyd73OdrJW0hPOuQv2qOoHDc9xVb6Yu6uq3Xqp2ZaH46A7lzevbxQEmfrzvAYSJuZ4WDk1Hz3QX1LVdiUK0EvlAGAYlG3Md30r7dcPN63yqBCIj25prpvZP0nI4+EgWoFG95V596CurXpKRBGRjQlHCvy5Ib/iW8nZJWwrET3mgd6mEhfP4KCuaLjopWs7h+MdXFdIv8dHQJgg1xi1eYqB0uDYjxwVmri0Sv5XKut/onqapC+FQiC2C1lvYJ9MVco6yDYsS3AANUfMtvtbYI2hfwZatiSsnoUeMZd34GVjkMMKA+XnjJpXgRW2SHTZplVowPmJsvXy6w3cfO1AK2dvtZEKTkC/TY9LFiKHCG0DnrMQdGm2lzlBHM9iEYynH2UcVMhUEjsc0oDBTgo2ZSQ1gzkAHeWeBXYFjYLuuf8yzTCy7/RFR81WDjXMbq2BOH5dURnxo6oivmxL3cKzKInlZkD31nvpHB9Kk7GfcfE1t+1V64b9LtgeJGlpRFxQCAqWJ5DoY77ski8gsOEOr2uywZaoO/NGa0X0y1pNQHBi3b2SUGNpcZxDT7rLbBf1FSnQ8guxGW3W+36BW0gBje4DOz6Ba6SVk0xiKgt+q2JOFyr4SYfnu+Ic1QZYIuwHBrgzr6UvOcSCzPTOo7D6IC4ISeS7zkl4h+2VoeHpnG/uWR3+ysNgPcOIXQbv0n4mr3BwQcdKJxgPSeyuP/z1Jjg4e9nUvoXegqQVIE30EHx5GHv+FAVUNTowYDJgyFhf5IvlYmEqRif6+WN1MkEJmDcQITx9FX23a4mxy1AQRsOHO/+eImX9l8EMJI3oPWzVXxSOeHU1dUWYr2uAA7AMb+vAEZSbU3qob9ibCyXeypEMpZ6863o6QPqlqGHZkuWABSTVNd4cOh9hv3qEpSx2Zy/DJMP6cItEmiBJ5PFqQnDEIt3NrA3COlOSgz43D7gpNFNJ5MBh4oFzhDPiglC2ypsNU4ISywY2erkyb1NC3Qh/IfWj0eDgZI4/ln8WPfBsT3meTjq1Uqt1E7Zl/qftqkx6aM9KueMCekSnMrcHj1CqTWWzEzPsZGcDe3Ue4Ws+XFYVxNbOFF8ezkvQGR6ZOtOLU2lQEnMBStx47vE6Pb7AYMBRj2OOfZXfisjJnpTfSNjo6sZ6qSvNxZNmDeS7Gk3yYyCk1HtKN2UnhMIjOXUzAqDv90lx9O/q/AT1ZMnit5XQe9wmQxnE/WSH0CqZ9/2Hy+Sfmpeg8RwsHI5Z8kC8H293m/LHVVM/BA7HaTJYg5Enk7M/xWpq0192ACfBai2LA/qrCjCr6Dh1BIMzMXINBmX96MJ5Hn2nxln/RXPFhwHxUmSV0EV2V0jm86/dxxuYSU1W7sVkEbN9EzkG0QFwPhyHKyb3t+Fj5WoUUTErcazE/N6EW6Lvp0d//SDPj7EV9UdJN+Amnf3Wwk3A0SlJ9Z00yvXZ7n3z70G47Hfsow8Wq1JXcfwnA+Yxa5mFsgV464KKP4T31wqIgzFPd3eCe3j5ory5fBF2hgCFyVFrLzI9eetNXvM7oQqyFgDo4CTp/hDV9NMX9JDHQ/nyHTLvZLNLF6ftn2OxjGm8+PqOwhxnPHWipkE/8wbtyri80Sr7pMNkQGMfo4ZYK9OcCC4ESVFFbLMIvlxSoRqWie0wxqnLfcLSXMSpMMQEJYDVObYsXIQNv4TGNwjq1kvT1UOkicTrG3IaBZ3XdScS3u8sgeZPVpOLkbiF940FjbCeNRINNvDbd01EPBrTCPpm12m43ze1bBB59Ia6Ovhnur/Nvx3IxwSWol+3H2qfCJR8df6aQf4v6WiONxkK+IqT4pKQrZK/LplgDI/PJZbOep8dtbV7oCr6CgfpWa8NczOkPx81iSHbsNhVSJBOtrLIMrL31LK9TqHqAbAHe0RLmmV806kRLDLNEhUEJfm9u0sxpkL93Zgd6rw+tqBfTMi59xqXHLXSHwSbSBl0EK0+loECOPtrl+/nsaFe197di4yUgoe4jKoAJDXc6DGDjrQOoFDWZJ9HXwt8xDrQP+7aRwWKWI1GF8s8O4KzxWBBcwnl3vnl1Oez3oh6Ea1vjR7/z7DDTrFtqU2W/KAEzAuXDNZ7MY73MF216dzdSbWmUp4lcm7keJfWaMHgut9x5C9mj66Z0lJ+yhsjVvyiWrfk1lzPOTdhG15Y7gQlXtacvI7qv/XNSscDwqkgwHT/gUsD5yB7LdRRvJxQGYINn9hTpodKFVSTPrtGvyQw+HlRFXIkodErAGu9Iy1YpfSPc3jkFh5CX3lPxv7aqjE/JAfTIpEjGb/H7MO0e2vsViSW1qa/Lmi4/n4DEI3g7lYrcanspDfEpKkdV1OjSLOy0BCUqVoECaB55vs06rXl4jqmLsPsFM/7vYJ0vrBhDCm/00A/H81l1uekJ/6Lml3Hb9+NKiLqATJmDpyzfYZFHumEjC662L0Bwkxi7E9U4cQA0XMVDuMYAIeLMPgQaMVOd8fmt5SflFIfuBoszeAw7ow5gXPE2Y/yBc/7jExARUf/BxIHQBF5Sn3i61w4z5xJdCyO1F1X3+3ax+JSvMeZ7S6QSKp1Fp/sjYz6Z+VgCZzibGeEoujryfMulH7Rai5kAft9ebcW50DyJr2uo2z97mTWIu45YsSnNSMrrNUuG1XsYBtD9TDYzQffKB87vWbkM4EbPAFgoBV4GQS+vtFDUqOFAoi1nTtmIOvg38N4hT2Sn8r8clmBCXspBlMBYTnrqFJGBT3wZOzAyJDre9dHH7+x7qaaKDOB4UQALD5ecS0DE4obubQEiuJZ0EpBVpLuYcce8Aa4PYd/V4DLDAJBYKQPCWTcrEaZ5HYbJi11Gd6hjGom1ii18VHYnG28NKpkz2UKVPxlhYSp8uZr367iOmoy7zsxehW9wzcy2zG0a80PBMCRQMb32hnaHeOR8fnNDzZhaNYhkOdDsBUZ3loDMa1YP0uS0cjUP3b/6DBlqmZOeNABDsLl5BI5QJups8uxAuWJdkUB/pO6Zax6tsg7fN5mjjDgMGngO+DPcKqiHIDbFIGudxtPTIyDi9SFMKBDcfdGQRv41q1AqmxgkVfJMnP8w/Bc7N9/TR6C7mGObFqFkIEom8sKi2xYqJLTCHK7cxzaZvqODo22c3wisBCP4HeAgcRbNPAsBkNRhSmD48dHupdBRw4mIvtS5oeF6zeT1KMCyhMnmhpkFAGWnGscoNkwvQ8ZM5lE/vgTHFYL99OuNxdFBxTEDd5v2qLR8y9WkXsWgG6kZNndFG+pO/UAkOCipqIhL3hq7cRSdrCq7YhUsTocEcnaFa6nVkhnSeRYUA1YO0z5itF9Sly3VlxYDw239TJJH6f3EUfYO5lb7bcFcz8Bp7Oo8QmnsUHOz/fagVUBtKEw1iT88j+aKkv8cscKNkMxjYr8344D1kFoZ7/td1W6LCNYN594301tUGRmFjAzeRg5vyoM1F6+bJZ/Q54jN/k8SFd3DxPTYaAUsivsBfgTn7Mx8H2SpPt4GOdYRnEJOH6jHM2p6SgB0gzIRq6fHxGMmSmqaPCmlfwxiuloaVIitLGN8wie2CDWhkzLoCJcODh7KIOAqbHEvXdUxaS4TTTs07Clzj/6GmVs9kiZDerMxEnhUB6QQPlcfqkG9882RqHoLiHGBoHfQuXIsAG8GTAtao2KVwRnvvam8jo1e312GQAKWEa4sUVEAMG4G6ckcONDwRcg1e2D3+ohXgY4UAWF8wHKQMrSnzCgfFpsxh+aHXMGtPQroQasRY4U6UdG0rz1Vjbka0MekOGRZQEvqQFlxseFor8zWFgHek3v29+WqN6gaK5gZOTOMZzpQIC1201LkMCXild3vWXSc5UX9xcFYfbRPzGFa1FDcPfPB/jUEq/FeGt419CI3YmBlVoHsa4KdcwQP5ZSwHHhFJ7/Ph/Rap/4vmG91eDwPP0lDfCDRCLszTqfzM71xpmiKi2HwS4WlqvGNwtvwF5Dqpn6KTq8ax00UMPkxDcZrEEEsIvHiUXXEphdb4GB4FymlPwBz4Gperqq5pW7TQ6/yNRhW8VT5NhuP0udlxo4gILq5ZxAZk8ZGh3g4CqxJlPKY7AQxupfUcVpWT5VItp1+30UqoyP4wWsRo3olRRgkWZZ2ZN6VC3OZFeXB8NbnUrSdikNptD1QiGuKkr8EmSR/AK9Rw+FF3s5uwuPbvHGiPeFOViltMK7AUaOsq9+x9cndk3iJEE5LKZRlWJbKOZweROzmPNVPkjE3K/TyA57Rs68TkZ3MR8akKpm7cFjnjPd/DdkWjgYoKHSr5Wu5ssoBYU4acRs5g2DHxUmdq8VXOXRbunD8QN0LhgkssgahcdoYsNvuXGUK/KXD/7oFb+VGdhqIn02veuM5bLudJOc2Ky0GMaG4W/xWBxIJcL7yliJOXOpx0AkBqUgzlDczmLT4iILXDxxtRR1oZa2JWFgiAb43obrJnG/TZC2KSK2wqOzRZTXavZZFMb1f3bXvVaNaK828w9TO610gk8JNf3gMfETzXXsbcvRGCG9JWQZ6+cDPqc4466Yo2RcKH+PILeKOqtnlbInR3MmBeGG3FH10yzkybuqEC2HSQwpA0An7d9+73BkDUTm30bZmoP/RGbgFN+GrCOfADgqr0WbI1a1okpFms8iHYw9hm0zUvlEMivBRxModrbJJ+9/p3jUdQQ9BCtQdxnOGrT5dzRUmw0593/mbRSdBg0nRvRZM5/E16m7ZHmDEtWhwvfdZCZ8J8M12W0yRMszXamWfQTwIZ4ayYktrnscQuWr8idp3PjT2eF/jmtdhIfcpMnb+IfZY2FebW6UY/AK3jP4u3Tu4zE4qlnQgLFbM19EBIsNf7KhjdbqQ/D6yiDb+NlEi2SKD+ivXVUK8ib0oBo366gXkR8ZxGjpJIDcEgZPa9TcYe0TIbiPl/rPUQDu3XBJ9X/GNq3FAUsKsll57DzaGMrjcT+gctp+9MLYXCq+sqP81eVQ0r9lt+gcQfZbACRbEjvlMskztZG8gbC8Qn9tt26Q7y7nDrbZq/LEz7kR6Jc6pg3N9rVX8Y5MJrGlML9p9lU4jbTkKqCveeZUJjHB03m2KRKR2TytoFkTXOLg7keU1s1lrPMQJpoOKLuAAC+y1HlJucU6ysB5hsXhvSPPLq5J7JtnqHKZ4vYjC4Vy8153QY+6780xDuGARsGbOs1WqzH0QS765rnSKEbbKlkO8oI/VDwUd0is13tKpqILu1mDJFNy/iJAWcvDgjxvusIT+PGz3ST/J9r9Mtfd0jpaGeiLYIqXc7DiHSS8TcjFVksi66PEkxW1z6ujbLLUGNNYnzOWpH8BZGK4bCK7iR+MbIv8ncDAz1u4StN3vTTzewr9IQjk9wxFxn+6N1ddKs0vffJiS08N3a4G1SVrlZ97Q/M+8G9fe5AP6d9/Qq4WRnORVhofPIKEdCr3llspUfE0oKIIYoByBRPh+bX1HLS3JWGJRhIvE1aW4NTd8ePi4Z+kXb+Z8snYfSNcqijhAgVsx4RCM54cXUiYkjeBmmC4ajOHrChoELscJJC7+9jjMjw5BagZKlgRMiSNYz7h7vvZIoQqbtQmspc0cUk1G/73iXtSpROl5wtLgQi0mW2Ex8i3WULhcggx6E1LMVHUsdc9GHI1PH3U2Ko0PyGdn9KdVOLm7FPBui0i9a0HpA60MsewVE4z8CAt5d401Gv6zXlIT5Ybit1VIA0FCs7wtvYreru1fUyW3oLAZ/+aTnZrOcYRNVA8spoRtlRoWflsRClFcgzkqiHOrf0/SVw+EpVaFlJ0g4Kxq1MMOmiQdpMNpte8lMMQqm6cIFXlnGbfJllysKDi+0JJMotkqgIxOSQgU9dn/lWkeVf8nUm3iwX2Nl3WDw9i6AUK3vBAbZZrcJpDQ/N64AVwjT07Jef30GSSmtNu2WlW7YoyW2FlWfZFQUwk867EdLYKk9VG6JgEnBiBxkY7LMo4YLQJJlAo9l/oTvJkSARDF/XtyAzM8O2t3eT/iXa6wDN3WewNmQHdPfsxChU/KtLG2Mn8i4ZqKdSlIaBZadxJmRzVS/o4yA65RTSViq60oa395Lqw0pzY4SipwE0SXXsKV+GZraGSkr/RW08wPRvqvSUkYBMA9lPx4m24az+IHmCbXA+0faxTRE9wuGeO06DIXa6QlKJ3puIyiuAVfPr736vzo2pBirS+Vxel3TMm3JKhz9o2ZoRvaFVpIkykb0Hcm4oHFBMcNSNj7/4GJt43ogonY2Vg4nsDQIWxAcorpXACzgBqQPjYsE/VUpXpwNManEru4NwMCFPkXvMoqvoeLN3qyu/N1eWEHttMD65v19l/0kH2mR35iv/FI+yjoHJ9gPMz67af3Mq/BoWXqu3rphiWMXVkmnPSEkpGpUI2h1MThideGFEOK6YZHPwYzMBvpNC7+ZHxPb7epfefGyIB4JzO9DTNEYnDLVVHdQyvOEVefrk6Uv5kTQYVYWWdqrdcIl7yljwwIWdfQ/y+2QB3eR/qxYObuYyB4gTbo2in4PzarU1sO9nETkmj9/AoxDA+JM3GMqQtJR4jtduHtnoCLxd1gQUscHRB/MoRYIEsP2pDZ9KvHgtlk1iTbWWbHhohwFEYX7y51fUV2nuUmnoUcqnWIQAAgl9LTVX+Bc0QGNEhChxHR4YjfE51PUdGfsSFE6ck7BL3/hTf9jLq4G1IafINxOLKeAtO7quulYvH5YOBc+zX7CrMgWnW47/jfRsWnJjYYoE7xMfWV2HN2iyIqLI';
    const FENCED = new Map([[8217,"apostrophe"],[8260,"fraction slash"],[12539,"middle dot"]]);
    const NSM_MAX = 4;

    function decode_arithmetic(bytes) {
    	let pos = 0;
    	function u16() { return (bytes[pos++] << 8) | bytes[pos++]; }
    	
    	// decode the frequency table
    	let symbol_count = u16();
    	let total = 1;
    	let acc = [0, 1]; // first symbol has frequency 1
    	for (let i = 1; i < symbol_count; i++) {
    		acc.push(total += u16());
    	}

    	// skip the sized-payload that the last 3 symbols index into
    	let skip = u16();
    	let pos_payload = pos;
    	pos += skip;

    	let read_width = 0;
    	let read_buffer = 0; 
    	function read_bit() {
    		if (read_width == 0) {
    			// this will read beyond end of buffer
    			// but (undefined|0) => zero pad
    			read_buffer = (read_buffer << 8) | bytes[pos++];
    			read_width = 8;
    		}
    		return (read_buffer >> --read_width) & 1;
    	}

    	const N = 31;
    	const FULL = 2**N;
    	const HALF = FULL >>> 1;
    	const QRTR = HALF >> 1;
    	const MASK = FULL - 1;

    	// fill register
    	let register = 0;
    	for (let i = 0; i < N; i++) register = (register << 1) | read_bit();

    	let symbols = [];
    	let low = 0;
    	let range = FULL; // treat like a float
    	while (true) {
    		let value = Math.floor((((register - low + 1) * total) - 1) / range);
    		let start = 0;
    		let end = symbol_count;
    		while (end - start > 1) { // binary search
    			let mid = (start + end) >>> 1;
    			if (value < acc[mid]) {
    				end = mid;
    			} else {
    				start = mid;
    			}
    		}
    		if (start == 0) break; // first symbol is end mark
    		symbols.push(start);
    		let a = low + Math.floor(range * acc[start]   / total);
    		let b = low + Math.floor(range * acc[start+1] / total) - 1;
    		while (((a ^ b) & HALF) == 0) {
    			register = (register << 1) & MASK | read_bit();
    			a = (a << 1) & MASK;
    			b = (b << 1) & MASK | 1;
    		}
    		while (a & ~b & QRTR) {
    			register = (register & HALF) | ((register << 1) & (MASK >>> 1)) | read_bit();
    			a = (a << 1) ^ HALF;
    			b = ((b ^ HALF) << 1) | HALF | 1;
    		}
    		low = a;
    		range = 1 + b - a;
    	}
    	let offset = symbol_count - 4;
    	return symbols.map(x => { // index into payload
    		switch (x - offset) {
    			case 3: return offset + 0x10100 + ((bytes[pos_payload++] << 16) | (bytes[pos_payload++] << 8) | bytes[pos_payload++]);
    			case 2: return offset + 0x100 + ((bytes[pos_payload++] << 8) | bytes[pos_payload++]);
    			case 1: return offset + bytes[pos_payload++];
    			default: return x - 1;
    		}
    	});
    }	

    // returns an iterator which returns the next symbol
    function read_payload(v) {
    	let pos = 0;
    	return () => v[pos++];
    }
    function read_compressed_payload(s) {
    	return read_payload(decode_arithmetic(unsafe_atob(s)));
    }

    // unsafe in the sense:
    // expected well-formed Base64 w/o padding 
    // 20220922: added for https://github.com/adraffy/ens-normalize.js/issues/4
    function unsafe_atob(s) {
    	let lookup = [];
    	[...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'].forEach((c, i) => lookup[c.charCodeAt(0)] = i);
    	let n = s.length;
    	let ret = new Uint8Array((6 * n) >> 3);
    	for (let i = 0, pos = 0, width = 0, carry = 0; i < n; i++) {
    		carry = (carry << 6) | lookup[s.charCodeAt(i)];
    		width += 6;
    		if (width >= 8) {
    			ret[pos++] = (carry >> (width -= 8));
    		}
    	}
    	return ret;
    }

    // eg. [0,1,2,3...] => [0,-1,1,-2,...]
    function signed(i) { 
    	return (i & 1) ? (~i >> 1) : (i >> 1);
    }

    function read_deltas(n, next) {
    	let v = Array(n);
    	for (let i = 0, x = 0; i < n; i++) v[i] = x += signed(next());
    	return v;
    }

    // [123][5] => [0 3] [1 1] [0 0]
    function read_sorted(next, prev = 0) {
    	let ret = [];
    	while (true) {
    		let x = next();
    		let n = next();
    		if (!n) break;
    		prev += x;
    		for (let i = 0; i < n; i++) {
    			ret.push(prev + i);
    		}
    		prev += n + 1;
    	}
    	return ret;
    }

    function read_sorted_arrays(next) {
    	return read_array_while(() => { 
    		let v = read_sorted(next);
    		if (v.length) return v;
    	});
    }

    // returns map of x => ys
    function read_mapped(next) {
    	let ret = [];
    	while (true) {
    		let w = next();
    		if (w == 0) break;
    		ret.push(read_linear_table(w, next));
    	}
    	while (true) {
    		let w = next() - 1;
    		if (w < 0) break;
    		ret.push(read_replacement_table(w, next));
    	}
    	return ret.flat();
    }

    // read until next is falsy
    // return array of read values
    function read_array_while(next) {
    	let v = [];
    	while (true) {
    		let x = next(v.length);
    		if (!x) break;
    		v.push(x);
    	}
    	return v;
    }

    // read w columns of length n
    // return as n rows of length w
    function read_transposed(n, w, next) {
    	let m = Array(n).fill().map(() => []);
    	for (let i = 0; i < w; i++) {
    		read_deltas(n, next).forEach((x, j) => m[j].push(x));
    	}
    	return m;
    }
     
    // returns [[x, ys], [x+dx, ys+dy], [x+2*dx, ys+2*dy], ...]
    // where dx/dy = steps, n = run size, w = length of y
    function read_linear_table(w, next) {
    	let dx = 1 + next();
    	let dy = next();
    	let vN = read_array_while(next);
    	let m = read_transposed(vN.length, 1+w, next);
    	return m.flatMap((v, i) => {
    		let [x, ...ys] = v;
    		return Array(vN[i]).fill().map((_, j) => {
    			let j_dy = j * dy;
    			return [x + j * dx, ys.map(y => y + j_dy)];
    		});
    	});
    }

    // return [[x, ys...], ...]
    // where w = length of y
    function read_replacement_table(w, next) { 
    	let n = 1 + next();
    	let m = read_transposed(n, 1+w, next);
    	return m.map(v => [v[0], v.slice(1)]);
    }


    function read_trie(next) {
    	let ret = [];
    	let sorted = read_sorted(next); 
    	expand(decode([]), []);
    	return ret; // not sorted
    	function decode(Q) { // characters that lead into this node
    		let S = next(); // state: valid, save, check
    		let B = read_array_while(() => { // buckets leading to new nodes
    			let cps = read_sorted(next).map(i => sorted[i]);
    			if (cps.length) return decode(cps);
    		});
    		return {S, B, Q};
    	}
    	function expand({S, B}, cps, saved) {
    		if (S & 4 && saved === cps[cps.length-1]) return;
    		if (S & 2) saved = cps[cps.length-1];
    		if (S & 1) ret.push(cps); 
    		for (let br of B) {
    			for (let cp of br.Q) {
    				expand(br, [...cps, cp], saved);
    			}
    		}
    	}
    }

    function hex_cp(cp) {
    	return cp.toString(16).toUpperCase().padStart(2, '0');
    }

    function quote_cp(cp) {
    	return `{${hex_cp(cp)}}`; // raffy convention: like "\u{X}" w/o the "\u"
    }

    /*
    export function explode_cp(s) {
    	return [...s].map(c => c.codePointAt(0));
    }
    */
    function explode_cp(s) { // this is about 2x faster
    	let cps = [];
    	for (let pos = 0, len = s.length; pos < len; ) {
    		let cp = s.codePointAt(pos);
    		pos += cp < 0x10000 ? 1 : 2;
    		cps.push(cp);
    	}
    	return cps;
    }

    function str_from_cps(cps) {
    	const chunk = 4096;
    	let len = cps.length;
    	if (len < chunk) return String.fromCodePoint(...cps);
    	let buf = [];
    	for (let i = 0; i < len; ) {
    		buf.push(String.fromCodePoint(...cps.slice(i, i += chunk)));
    	}
    	return buf.join('');
    }

    function compare_arrays(a, b) {
    	let n = a.length;
    	let c = n - b.length;
    	for (let i = 0; c == 0 && i < n; i++) c = a[i] - b[i];
    	return c;
    }

    // created 2023-09-12T22:05:14.211Z
    // compressed base64-encoded blob for include-nf data
    // source: https://github.com/adraffy/ens-normalize.js/blob/main/src/make.js
    // see: https://github.com/adraffy/ens-normalize.js#security
    // SHA-256: a974b6f8541fc29d919bc85118af0a44015851fab5343f8679cb31be2bdb209e
    var COMPRESSED = 'AEUDTAHBCFQATQDRADAAcgAgADQAFAAsABQAHwAOACQADQARAAoAFwAHABIACAAPAAUACwAFAAwABAAQAAMABwAEAAoABQAIAAIACgABAAQAFAALAAIACwABAAIAAQAHAAMAAwAEAAsADAAMAAwACgANAA0AAwAKAAkABAAdAAYAZwDSAdsDJgC0CkMB8xhZAqfoC190UGcThgBurwf7PT09Pb09AjgJum8OjDllxHYUKXAPxzq6tABAxgK8ysUvWAgMPT09PT09PSs6LT2HcgWXWwFLoSMEEEl5RFVMKvO0XQ8ExDdJMnIgsj26PTQyy8FfEQ8AY8IPAGcEbwRwBHEEcgRzBHQEdQR2BHcEeAR6BHsEfAR+BIAEgfndBQoBYgULAWIFDAFiBNcE2ATZBRAFEQUvBdALFAsVDPcNBw13DYcOMA4xDjMB4BllHI0B2grbAMDpHLkQ7QHVAPRNQQFnGRUEg0yEB2uaJF8AJpIBpob5AERSMAKNoAXqaQLUBMCzEiACnwRZEkkVsS7tANAsBG0RuAQLEPABv9HICTUBXigPZwRBApMDOwAamhtaABqEAY8KvKx3LQ4ArAB8UhwEBAVSagD8AEFZADkBIadVj2UMUgx5Il4ANQC9AxIB1BlbEPMAs30CGxlXAhwZKQIECBc6EbsCoxngzv7UzRQA8M0BawL6ZwkN7wABAD33OQRcsgLJCjMCjqUChtw/km+NAsXPAoP2BT84PwURAK0RAvptb6cApQS/OMMey5HJS84UdxpxTPkCogVFITaTOwERAK5pAvkNBOVyA7q3BKlOJSALAgUIBRcEdASpBXqzABXFSWZOawLCOqw//AolCZdvv3dSBkEQGyelEPcMMwG1ATsN7UvYBPEGOwTJH30ZGQ/NlZwIpS3dDO0m4y6hgFoj9SqDBe1L9DzdC01RaA9ZC2UJ4zpjgU4DIQENIosK3Q05CG0Q8wrJaw3lEUUHOQPVSZoApQcBCxEdNRW1JhBirAsJOXcG+xr2C48mrxMpevwF0xohBk0BKRr/AM8u54WwWjFcHE9fBgMLJSPHFKhQIA0lQLd4SBobBxUlqQKRQ3BKh1E2HpMh9jw9DWYuE1F8B/U8BRlPC4E8nkarRQ4R0j6NPUgiSUwsBDV/LC8niwnPD4UMuXxyAVkJIQmxDHETMREXN8UIOQcZLZckJxUIIUaVYJoE958D8xPRAwsFPwlBBxMDtRwtEy4VKQUNgSTXAvM21S6zAo9WgAEXBcsPJR/fEFBH4A7pCJsCZQODJesALRUhABcimwhDYwBfj9hTBS7LCMdqbCN0A2cU52ERcweRDlcHpxwzFb8c4XDIXguGCCijrwlbAXUJmQFfBOMICTVbjKAgQWdTi1gYmyBhQT9d/AIxDGUVn0S9h3gCiw9rEhsBNQFzBzkNAQJ3Ee0RaxCVCOuGBDW1M/g6JQRPIYMgEQonA09szgsnJvkM+GkBoxJiAww0PXfuZ6tgtiQX/QcZMsVBYCHxC5JPzQycGsEYQlQuGeQHvwPzGvMn6kFXBf8DowMTOk0z7gS9C2kIiwk/AEkOoxcH1xhqCnGM0AExiwG3mQNXkYMCb48GNwcLAGcLhwV55QAdAqcIowAFAM8DVwA5Aq0HnQAZAIVBAT0DJy8BIeUCjwOTCDHLAZUvAfMpBBvDDBUA9zduSgLDsQKAamaiBd1YAo4CSTUBTSUEBU5HUQOvceEA2wBLBhPfRwEVq0rLGuNDAd9vKwDHAPsABTUHBUEBzQHzbQC3AV8LMQmis7UBTekpAIMAFWsB1wKJAN0ANQB/8QFTAE0FWfkF0wJPSQERMRgrV2EBuwMfATMBDQB5BsuNpckHHwRtB9MCEBsV4QLvLge1AQMi3xPNQsUCvd5VoWACZIECYkJbTa9bNyACofcCaJgCZgkCn4Q4GwsCZjsCZiYEbgR/A38TA36SOQY5dxc5gjojIwJsHQIyNjgKAm3HAm2u74ozZ0UrAWcA3gDhAEoFB5gMjQD+C8IADbUCdy8CdqI/AnlLQwJ4uh1c20WuRtcCfD8CesgCfQkCfPAFWQUgSABIfWMkAoFtAoAAAoAFAn+uSVhKWxUXSswC0QEC0MxLJwOITwOH5kTFkTIC8qFdAwMDrkvOTC0lA89NTE2vAos/AorYwRsHHUNnBbcCjjcCjlxAl4ECjtkCjlx4UbRTNQpS1FSFApP7ApMMAOkAHFUeVa9V0AYsGymVhjLheGZFOzkCl58C77JYIagAWSUClo8ClnycAKlZrFoJgU0AOwKWtQKWTlxEXNECmcsCmWRcyl0HGQKcmznCOp0CnBYCn5sCnriKAB0PMSoPAp3xAp6SALU9YTRh7wKe0wKgbgGpAp6fHwKeTqVjyGQnJSsCJ68CJn4CoPsCoEwCot0CocQCpi8Cpc4Cp/8AfQKn8mh8aLEAA0lqHGrRAqzjAqyuAq1nAq0CAlcdAlXcArHh1wMfTmyXArK9DQKy6Bds4G1jbUhfAyXNArZcOz9ukAMpRQK4XgK5RxUCuSp3cDZw4QK9GQK72nCWAzIRAr6IcgIDM3ECvhpzInNPAsPLAsMEc4J0SzVFdOADPKcDPJoDPb8CxXwCxkcCxhCJAshpUQLIRALJTwLJLgJknQLd0nh5YXiueSVL0AMYo2cCAmH0GfOVJHsLXpJeuxECz2sCz2wvS1PS8xOfAMatAs9zASnqA04SfksFAtwnAtuKAtJPA1JcA1NfAQEDVYyAiT8AyxbtYEWCHILTgs6DjQLaxwLZ3oQQhEmnPAOGpQAvA2QOhnFZ+QBVAt9lAt64c3cC4i/tFAHzMCcB9JsB8tKHAuvzAulweQLq+QLq5AD5RwG5Au6JAuuclqqXAwLuPwOF4Jh5cOBxoQLzAwBpA44WmZMC9xMDkW4DkocC95gC+dkC+GaaHJqruzebHgOdgwL++gEbADmfHJ+zAwWNA6ZqA6bZANHFAwZqoYiiBQkDDEkCwAA/AwDhQRdTARHzA2sHl2cFAJMtK7evvdsBiZkUfxEEOQH7KQUhDp0JnwCS/SlXxQL3AZ0AtwW5AG8LbUEuFCaNLgFDAYD8AbUmAHUDDgRtACwCFgyhAAAKAj0CagPdA34EkQEgRQUhfAoABQBEABMANhICdwEABdUDa+8KxQIA9wqfJ7+xt+UBkSFBQgHpFH8RNMCJAAQAGwBaAkUChIsABjpTOpSNbQC4Oo860ACNOME63AClAOgAywE6gTo7Ofw5+Tt2iTpbO56JOm85GAFWATMBbAUvNV01njWtNWY1dTW2NcU1gjWRNdI14TWeNa017jX9NbI1wTYCNhE1xjXVNhY2JzXeNe02LjY9Ni41LSE2OjY9Njw2yTcIBJA8VzY4Nt03IDcPNsogN4k3MAoEsDxnNiQ3GTdsOo03IULUQwdC4EMLHA8PCZsobShRVQYA6X8A6bABFCnXAukBowC9BbcAbwNzBL8MDAMMAQgDAAkKCwsLCQoGBAVVBI/DvwDz9b29kaUCb0QtsRTNLt4eGBcSHAMZFhYZEhYEARAEBUEcQRxBHEEcQRxBHEEaQRxBHEFCSTxBPElISUhBNkM2QTYbNklISVmBVIgBFLWZAu0BhQCjBcEAbykBvwGJAaQcEZ0ePCklMAAhMvAIMAL54gC7Bm8EescjzQMpARQpKgDUABavAj626xQAJP0A3etzuf4NNRA7efy2Z9NQrCnC0OSyANz5BBIbJ5IFDR6miIavYS6tprjjmuKebxm5C74Q225X1pkaYYPb6f1DK4k3xMEBb9S2WMjEibTNWhsRJIA+vwNVEiXTE5iXs/wezV66oFLfp9NZGYW+Gk19J2+bCT6Ye2w6LDYdgzKMUabk595eLBCXANz9HUpWbATq9vqXVx9XDg+Pc9Xp4+bsS005SVM/BJBM4687WUuf+Uj9dEi8aDNaPxtpbDxcG1THTImUMZq4UCaaNYpsVqraNyKLJXDYsFZ/5jl7bLRtO88t7P3xZaAxhb5OdPMXqsSkp1WCieG8jXm1U99+blvLlXzPCS+M93VnJCiK+09LfaSaBAVBomyDgJua8dfUzR7ga34IvR2Nvj+A9heJ6lsl1KG4NkI1032Cnff1m1wof2B9oHJK4bi6JkEdSqeNeiuo6QoZZincoc73/TH9SXF8sCE7XyuYyW8WSgbGFCjPV0ihLKhdPs08Tx82fYAkLLc4I2wdl4apY7GU5lHRFzRWJep7Ww3wbeA3qmd59/86P4xuNaqDpygXt6M85glSBHOCGgJDnt+pN9bK7HApMguX6+06RZNjzVmcZJ+wcUrJ9//bpRNxNuKpNl9uFds+S9tdx7LaM5ZkIrPj6nIU9mnbFtVbs9s/uLgl8MVczAwet+iOEzzBlYW7RCMgE6gyNLeq6+1tIx4dpgZnd0DksJS5f+JNDpwwcPNXaaVspq1fbQajOrJgK0ofKtJ1Ne90L6VO4MOl5S886p7u6xo7OLjG8TGL+HU1JXGJgppg4nNbNJ5nlzSpuPYy21JUEcUA94PoFiZfjZue+QnyQ80ekOuZVkxx4g+cvhJfHgNl4hy1/a6+RKcKlar/J29y//EztlbVPHVUeQ1zX86eQVAjR/M3dA9w4W8LfaXp4EgM85wOWasli837PzVMOnsLzR+k3o75/lRPAJSE1xAKQzEi5v10ke+VBvRt1cwQRMd+U5mLCTGVd6XiZtgBG5cDi0w22GKcVNvHiu5LQbZEDVtz0onn7k5+heuKXVsZtSzilkLRAUmjMXEMB3J9YC50XBxPiz53SC+EhnPl9WsKCv92SM/OFFIMJZYfl0WW8tIO3UxYcwdMAj7FSmgrsZ2aAZO03BOhP1bNNZItyXYQFTpC3SG1VuPDqH9GkiCDmE+JwxyIVSO5siDErAOpEXFgjy6PQtOVDj+s6e1r8heWVvmZnTciuf4EiNZzCAd7SOMhXERIOlsHIMG399i9aLTy3m2hRLZjJVDNLS53iGIK11dPqQt0zBDyg6qc7YqkDm2M5Ve6dCWCaCbTXX2rToaIgz6+zh4lYUi/+6nqcFMAkQJKHYLK0wYk5N9szV6xihDbDDFr45lN1K4aCXBq/FitPSud9gLt5ZVn+ZqGX7cwm2z5EGMgfFpIFyhGGuDPmso6TItTMwny+7uPnLCf4W6goFQFV0oQSsc9VfMmVLcLr6ZetDZbaSFTLqnSO/bIPjA3/zAUoqgGFAEQS4IhuMzEp2I3jJzbzkk/IEmyax+rhZTwd6f+CGtwPixu8IvzACquPWPREu9ZvGkUzpRwvRRuaNN6cr0W1wWits9ICdYJ7ltbgMiSL3sTPeufgNcVqMVWFkCPDH4jG2jA0XcVgQj62Cb29v9f/z/+2KbYvIv/zzjpQAPkliaVDzNrW57TZ/ZOyZD0nlfMmAIBIAGAI0D3k/mdN4xr9v85ZbZbbqfH2jGd5hUqNZWwl5SPfoGmfElmazUIeNL1j/mkF7VNAzTq4jNt8JoQ11NQOcmhprXoxSxfRGJ9LDEOAQ+dmxAQH90iti9e2u/MoeuaGcDTHoC+xsmEeWmxEKefQuIzHbpw5Tc5cEocboAD09oipWQhtTO1wivf/O+DRe2rpl/E9wlrzBorjJsOeG1B/XPW4EaJEFdNlECEZga5ZoGRHXgYouGRuVkm8tDESiEyFNo+3s5M5puSdTyUL2llnINVHEt91XUNW4ewdMgJ4boJfEyt/iY5WXqbA+A2Fkt5Z0lutiWhe9nZIyIUjyXDC3UsaG1t+eNx6z4W/OYoTB7A6x+dNSTOi9AInctbESqm5gvOLww7OWXPrmHwVZasrl4eD113pm+JtT7JVOvnCXqdzzdTRHgJ0PiGTFYW5Gvt9R9LD6Lzfs0v/TZZHSmyVNq7viIHE6DBK7Qp07Iz55EM8SYtQvZf/obBniTWi5C2/ovHfw4VndkE5XYdjOhCMRjDeOEfXeN/CwfGduiUIfsoFeUxXeQXba7c7972XNv8w+dTjjUM0QeNAReW+J014dKAD/McQYXT7c0GQPIkn3Ll6R7gGjuiQoZD0TEeEqQpKoZ15g/0OPQI17QiSv9AUROa/V/TQN3dvLArec3RrsYlvBm1b8LWzltdugsC50lNKYLEp2a+ZZYqPejULRlOJh5zj/LVMyTDvwKhMxxwuDkxJ1QpoNI0OTWLom4Z71SNzI9TV1iXJrIu9Wcnd+MCaAw8o1jSXd94YU/1gnkrC9BUEOtQvEIQ7g0i6h+KL2JKk8Ydl7HruvgWMSAmNe+LshGhV4qnWHhO9/RIPQzY1tHRj2VqOyNsDpK0cww+56AdDC4gsWwY0XxoucIWIqs/GcwnWqlaT0KPr8mbK5U94/301i1WLt4YINTVvCFBrFZbIbY8eycOdeJ2teD5IfPLCRg7jjcFTwlMFNl9zdh/o3E/hHPwj7BWg0MU09pPrBLbrCgm54A6H+I6v27+jL5gkjWg/iYdks9jbfVP5y/n0dlgWEMlKasl7JvFZd56LfybW1eeaVO0gxTfXZwD8G4SI116yx7UKVRgui6Ya1YpixqXeNLc8IxtAwCU5IhwQgn+NqHnRaDv61CxKhOq4pOX7M6pkA+Pmpd4j1vn6ACUALoLLc4vpXci8VidLxzm7qFBe7s+quuJs6ETYmnpgS3LwSZxPIltgBDXz8M1k/W2ySNv2f9/NPhxLGK2D21dkHeSGmenRT3Yqcdl0m/h3OYr8V+lXNYGf8aCCpd4bWjE4QIPj7vUKN4Nrfs7ML6Y2OyS830JCnofg/k7lpFpt4SqZc5HGg1HCOrHvOdC8bP6FGDbE/VV0mX4IakzbdS/op+Kt3G24/8QbBV7y86sGSQ/vZzU8FXs7u6jIvwchsEP2BpIhW3G8uWNwa3HmjfH/ZjhhCWvluAcF+nMf14ClKg5hGgtPLJ98ueNAkc5Hs2WZlk2QHvfreCK1CCGO6nMZVSb99VM/ajr8WHTte9JSmkXq/i/U943HEbdzW6Re/S88dKgg8pGOLlAeNiqrcLkUR3/aClFpMXcOUP3rmETcWSfMXZE3TUOi8i+fqRnTYLflVx/Vb/6GJ7eIRZUA6k3RYR3iFSK9c4iDdNwJuZL2FKz/IK5VimcNWEqdXjSoxSgmF0UPlDoUlNrPcM7ftmA8Y9gKiqKEHuWN+AZRIwtVSxye2Kf8rM3lhJ5XcBXU9n4v0Oy1RU2M+4qM8AQPVwse8ErNSob5oFPWxuqZnVzo1qB/IBxkM3EVUKFUUlO3e51259GgNcJbCmlvrdjtoTW7rChm1wyCKzpCTwozUUEOIcWLneRLgMXh+SjGSFkAllzbGS5HK7LlfCMRNRDSvbQPjcXaenNYxCvu2Qyznz6StuxVj66SgI0T8B6/sfHAJYZaZ78thjOSIFumNWLQbeZixDCCC+v0YBtkxiBB3jefHqZ/dFHU+crbj6OvS1x/JDD7vlm7zOVPwpUC01nhxZuY/63E7g';

    // https://unicode.org/reports/tr15/
    // for reference implementation
    // see: /derive/nf.js


    // algorithmic hangul
    // https://www.unicode.org/versions/Unicode15.0.0/ch03.pdf (page 144)
    const S0 = 0xAC00;
    const L0 = 0x1100;
    const V0 = 0x1161;
    const T0 = 0x11A7;
    const L_COUNT = 19;
    const V_COUNT = 21;
    const T_COUNT = 28;
    const N_COUNT = V_COUNT * T_COUNT;
    const S_COUNT = L_COUNT * N_COUNT;
    const S1 = S0 + S_COUNT;
    const L1 = L0 + L_COUNT;
    const V1 = V0 + V_COUNT;
    const T1$1 = T0 + T_COUNT;

    function unpack_cc(packed) {
    	return (packed >> 24) & 0xFF;
    }
    function unpack_cp(packed) {
    	return packed & 0xFFFFFF;
    }

    let SHIFTED_RANK, EXCLUSIONS, DECOMP, RECOMP;

    function init$1() {
    	//console.time('nf');
    	let r = read_compressed_payload(COMPRESSED);
    	SHIFTED_RANK = new Map(read_sorted_arrays(r).flatMap((v, i) => v.map(x => [x, (i+1) << 24]))); // pre-shifted
    	EXCLUSIONS = new Set(read_sorted(r));
    	DECOMP = new Map();
    	RECOMP = new Map();
    	for (let [cp, cps] of read_mapped(r)) {
    		if (!EXCLUSIONS.has(cp) && cps.length == 2) {
    			let [a, b] = cps;
    			let bucket = RECOMP.get(a);
    			if (!bucket) {
    				bucket = new Map();
    				RECOMP.set(a, bucket);
    			}
    			bucket.set(b, cp);
    		}
    		DECOMP.set(cp, cps.reverse()); // stored reversed
    	}
    	//console.timeEnd('nf');
    	// 20230905: 11ms
    }

    function is_hangul(cp) {
    	return cp >= S0 && cp < S1;
    }

    function compose_pair(a, b) {
    	if (a >= L0 && a < L1 && b >= V0 && b < V1) {
    		return S0 + (a - L0) * N_COUNT + (b - V0) * T_COUNT;
    	} else if (is_hangul(a) && b > T0 && b < T1$1 && (a - S0) % T_COUNT == 0) {
    		return a + (b - T0);
    	} else {
    		let recomp = RECOMP.get(a);
    		if (recomp) {
    			recomp = recomp.get(b);
    			if (recomp) {
    				return recomp;
    			}
    		}
    		return -1;
    	}
    }

    function decomposed(cps) {
    	if (!SHIFTED_RANK) init$1();
    	let ret = [];
    	let buf = [];
    	let check_order = false;
    	function add(cp) {
    		let cc = SHIFTED_RANK.get(cp);
    		if (cc) {
    			check_order = true;
    			cp |= cc;
    		}
    		ret.push(cp);
    	}
    	for (let cp of cps) {
    		while (true) {
    			if (cp < 0x80) {
    				ret.push(cp);
    			} else if (is_hangul(cp)) {
    				let s_index = cp - S0;
    				let l_index = s_index / N_COUNT | 0;
    				let v_index = (s_index % N_COUNT) / T_COUNT | 0;
    				let t_index = s_index % T_COUNT;
    				add(L0 + l_index);
    				add(V0 + v_index);
    				if (t_index > 0) add(T0 + t_index);
    			} else {
    				let mapped = DECOMP.get(cp);
    				if (mapped) {
    					buf.push(...mapped);
    				} else {
    					add(cp);
    				}
    			}
    			if (!buf.length) break;
    			cp = buf.pop();
    		}
    	}
    	if (check_order && ret.length > 1) {
    		let prev_cc = unpack_cc(ret[0]);
    		for (let i = 1; i < ret.length; i++) {
    			let cc = unpack_cc(ret[i]);
    			if (cc == 0 || prev_cc <= cc) {
    				prev_cc = cc;
    				continue;
    			}
    			let j = i-1;
    			while (true) {
    				let tmp = ret[j+1];
    				ret[j+1] = ret[j];
    				ret[j] = tmp;
    				if (!j) break;
    				prev_cc = unpack_cc(ret[--j]);
    				if (prev_cc <= cc) break;
    			}
    			prev_cc = unpack_cc(ret[i]);
    		}
    	}
    	return ret;
    }

    function composed_from_decomposed(v) {
    	let ret = [];
    	let stack = [];
    	let prev_cp = -1;
    	let prev_cc = 0;
    	for (let packed of v) {
    		let cc = unpack_cc(packed);
    		let cp = unpack_cp(packed);
    		if (prev_cp == -1) {
    			if (cc == 0) {
    				prev_cp = cp;
    			} else {
    				ret.push(cp);
    			}
    		} else if (prev_cc > 0 && prev_cc >= cc) {
    			if (cc == 0) {
    				ret.push(prev_cp, ...stack);
    				stack.length = 0;
    				prev_cp = cp;
    			} else {
    				stack.push(cp);
    			}
    			prev_cc = cc;
    		} else {
    			let composed = compose_pair(prev_cp, cp);
    			if (composed >= 0) {
    				prev_cp = composed;
    			} else if (prev_cc == 0 && cc == 0) {
    				ret.push(prev_cp);
    				prev_cp = cp;
    			} else {
    				stack.push(cp);
    				prev_cc = cc;
    			}
    		}
    	}
    	if (prev_cp >= 0) {
    		ret.push(prev_cp, ...stack);	
    	}
    	return ret;
    }

    // note: cps can be iterable
    function nfd(cps) {
    	return decomposed(cps).map(unpack_cp);
    }
    function nfc(cps) {
    	return composed_from_decomposed(decomposed(cps));
    }

    const HYPHEN = 0x2D;
    const STOP_CH = '.';
    const FE0F = 0xFE0F;
    const UNIQUE_PH = 1;

    // 20230913: replace [...v] with Array_from(v) to avoid large spreads
    const Array_from = x => Array.from(x); // Array.from.bind(Array);

    function group_has_cp(g, cp) {
    	// 20230913: keep primary and secondary distinct instead of creating valid union
    	return g.P.has(cp) || g.Q.has(cp);
    }

    class Emoji extends Array {
    	get is_emoji() { return true; } // free tagging system
    }

    let MAPPED, IGNORED, CM, NSM, ESCAPE, GROUPS, WHOLE_VALID, WHOLE_MAP, VALID, EMOJI_LIST, EMOJI_ROOT;

    function init() {
    	if (MAPPED) return;
    	
    	let r = read_compressed_payload(COMPRESSED$1);
    	const read_sorted_array = () => read_sorted(r);
    	const read_sorted_set = () => new Set(read_sorted_array());

    	MAPPED = new Map(read_mapped(r)); 
    	IGNORED = read_sorted_set(); // ignored characters are not valid, so just read raw codepoints

    	/*
    	// direct include from payload is smaller than the decompression code
    	const FENCED = new Map(read_array_while(() => {
    		let cp = r();
    		if (cp) return [cp, read_str(r())];
    	}));
    	*/
    	// 20230217: we still need all CM for proper error formatting
    	// but norm only needs NSM subset that are potentially-valid
    	CM = read_sorted_array();
    	NSM = new Set(read_sorted_array().map(i => CM[i]));
    	CM = new Set(CM);
    	
    	ESCAPE = read_sorted_set(); // characters that should not be printed
    	read_sorted_set(); // only needed to illustrate ens_tokenize() transformations

    	let chunks = read_sorted_arrays(r);
    	let unrestricted = r();
    	const read_chunked = () => new Set(read_sorted_array().flatMap(i => chunks[i]).concat(read_sorted_array()));
    	GROUPS = read_array_while(i => {
    		// minifier property mangling seems unsafe
    		// so these are manually renamed to single chars
    		let N = read_array_while(r).map(x => x+0x60);
    		if (N.length) {
    			let R = i >= unrestricted; // first arent restricted
    			N[0] -= 32; // capitalize
    			N = str_from_cps(N);
    			if (R) N=`Restricted[${N}]`;
    			let P = read_chunked(); // primary
    			let Q = read_chunked(); // secondary
    			let M = !r(); // not-whitelisted, check for NSM
    			// *** this code currently isn't needed ***
    			/*
    			let V = [...P, ...Q].sort((a, b) => a-b); // derive: sorted valid
    			let M = r()-1; // number of combining mark
    			if (M < 0) { // whitelisted
    				M = new Map(read_array_while(() => {
    					let i = r();
    					if (i) return [V[i-1], read_array_while(() => {
    						let v = read_array_while(r);
    						if (v.length) return v.map(x => x-1);
    					})];
    				}));
    			}*/
    			return {N, P, Q, M, R};
    		}
    	});

    	// decode compressed wholes
    	WHOLE_VALID = read_sorted_set();
    	WHOLE_MAP = new Map();
    	let wholes = read_sorted_array().concat(Array_from(WHOLE_VALID)).sort((a, b) => a-b); // must be sorted
    	wholes.forEach((cp, i) => {
    		let d = r(); 
    		let w = wholes[i] = d ? wholes[i-d] : {V: [], M: new Map()};
    		w.V.push(cp); // add to member set
    		if (!WHOLE_VALID.has(cp)) {
    			WHOLE_MAP.set(cp, w);  // register with whole map
    		}
    	});

    	// compute confusable-extent complements
    	for (let {V, M} of new Set(WHOLE_MAP.values())) {
    		// connect all groups that have each whole character
    		let recs = [];
    		for (let cp of V) {
    			let gs = GROUPS.filter(g => group_has_cp(g, cp));
    			let rec = recs.find(({G}) => gs.some(g => G.has(g)));
    			if (!rec) {
    				rec = {G: new Set(), V: []};
    				recs.push(rec);
    			}
    			rec.V.push(cp);
    			gs.forEach(g => rec.G.add(g));
    		}
    		// per character cache groups which are not a member of the extent
    		let union = recs.flatMap(x => Array_from(x.G));
    		for (let {G, V} of recs) {
    			let complement = new Set(union.filter(g => !G.has(g)));
    			for (let cp of V) {
    				M.set(cp, complement);
    			}
    		}
    	}

    	// compute valid set
    	let union = new Set(); // exists in 1+ groups
    	let multi = new Set(); // exists in 2+ groups
    	const add_to_union = cp => union.has(cp) ? multi.add(cp) : union.add(cp);
    	for (let g of GROUPS) {
    		for (let cp of g.P) add_to_union(cp);
    		for (let cp of g.Q) add_to_union(cp);
    	}
    	// dual purpose WHOLE_MAP: return placeholder if unique non-confusable
    	for (let cp of union) {
    		if (!WHOLE_MAP.has(cp) && !multi.has(cp)) {
    			WHOLE_MAP.set(cp, UNIQUE_PH);
    		}
    	}
    	VALID = new Set(Array_from(union).concat(Array_from(nfd(union)))); // possibly valid

    	// decode emoji
    	// 20230719: emoji are now fully-expanded to avoid quirk logic 
    	EMOJI_LIST = read_trie(r).map(v => Emoji.from(v)).sort(compare_arrays);
    	EMOJI_ROOT = new Map(); // this has approx 7K nodes (2+ per emoji)
    	for (let cps of EMOJI_LIST) {
    		// 20230719: change to *slightly* stricter algorithm which disallows 
    		// insertion of misplaced FE0F in emoji sequences (matching ENSIP-15)
    		// example: beautified [A B] (eg. flag emoji) 
    		//  before: allow: [A FE0F B], error: [A FE0F FE0F B] 
    		//   after: error: both
    		// note: this code now matches ENSNormalize.{cs,java} logic
    		let prev = [EMOJI_ROOT];
    		for (let cp of cps) {
    			let next = prev.map(node => {
    				let child = node.get(cp);
    				if (!child) {
    					// should this be object? 
    					// (most have 1-2 items, few have many)
    					// 20230719: no, v8 default map is 4?
    					child = new Map();
    					node.set(cp, child);
    				}
    				return child;
    			});
    			if (cp === FE0F) {
    				prev.push(...next); // less than 20 elements
    			} else {
    				prev = next;
    			}
    		}
    		for (let x of prev) {
    			x.V = cps;
    		}
    	}
    }

    // if escaped: {HEX}
    //       else: "x" {HEX}
    function quoted_cp(cp) {
    	return (should_escape(cp) ? '' : `${bidi_qq(safe_str_from_cps([cp]))} `) + quote_cp(cp);
    }

    // 20230211: some messages can be mixed-directional and result in spillover
    // use 200E after a quoted string to force the remainder of a string from 
    // acquring the direction of the quote
    // https://www.w3.org/International/questions/qa-bidi-unicode-controls#exceptions
    function bidi_qq(s) {
    	return `"${s}"\u200E`; // strong LTR
    }

    function check_label_extension(cps) {
    	if (cps.length >= 4 && cps[2] == HYPHEN && cps[3] == HYPHEN) {
    		throw new Error(`invalid label extension: "${str_from_cps(cps.slice(0, 4))}"`);
    	}
    }
    function check_leading_underscore(cps) {
    	const UNDERSCORE = 0x5F;
    	for (let i = cps.lastIndexOf(UNDERSCORE); i > 0; ) {
    		if (cps[--i] !== UNDERSCORE) {
    			throw new Error('underscore allowed only at start');
    		}
    	}
    }
    // check that a fenced cp is not leading, trailing, or touching another fenced cp
    function check_fenced(cps) {
    	let cp = cps[0];
    	let prev = FENCED.get(cp);
    	if (prev) throw error_placement(`leading ${prev}`);
    	let n = cps.length;
    	let last = -1; // prevents trailing from throwing
    	for (let i = 1; i < n; i++) {
    		cp = cps[i];
    		let match = FENCED.get(cp);
    		if (match) {
    			// since cps[0] isn't fenced, cps[1] cannot throw
    			if (last == i) throw error_placement(`${prev} + ${match}`);
    			last = i + 1;
    			prev = match;
    		}
    	}
    	if (last == n) throw error_placement(`trailing ${prev}`);
    }

    // create a safe to print string 
    // invisibles are escaped
    // leading cm uses placeholder
    // quoter(cp) => string, eg. 3000 => "{3000}"
    // note: in html, you'd call this function then replace [<>&] with entities
    function safe_str_from_cps(cps, quoter = quote_cp) {
    	//if (Number.isInteger(cps)) cps = [cps];
    	//if (!Array.isArray(cps)) throw new TypeError(`expected codepoints`);
    	let buf = [];
    	if (is_combining_mark(cps[0])) buf.push('◌');
    	let prev = 0;
    	let n = cps.length;
    	for (let i = 0; i < n; i++) {
    		let cp = cps[i];
    		if (should_escape(cp)) {
    			buf.push(str_from_cps(cps.slice(prev, i)));
    			buf.push(quoter(cp));
    			prev = i + 1;
    		}
    	}
    	buf.push(str_from_cps(cps.slice(prev, n)));
    	return buf.join('');
    }

    // note: set(s) cannot be exposed because they can be modified
    // note: Object.freeze() doesn't work
    function is_combining_mark(cp) {
    	init();
    	return CM.has(cp);
    }
    function should_escape(cp) {
    	init();
    	return ESCAPE.has(cp);
    }

    function ens_normalize(name) {
    	return flatten(split(name, nfc, filter_fe0f));
    }

    function split(name, nf, ef) {
    	if (!name) return []; // 20230719: empty name allowance
    	init();
    	let offset = 0;
    	// https://unicode.org/reports/tr46/#Validity_Criteria
    	// 4.) "The label must not contain a U+002E ( . ) FULL STOP."
    	return name.split(STOP_CH).map(label => {
    		let input = explode_cp(label);
    		let info = {
    			input,
    			offset, // codepoint, not substring!
    		};
    		offset += input.length + 1; // + stop
    		try {
    			// 1.) "The label must be in Unicode Normalization Form NFC"
    			let tokens = info.tokens = tokens_from_str(input, nf, ef);
    			let token_count = tokens.length;
    			let type;
    			if (!token_count) { // the label was effectively empty (could of had ignored characters)
    				//norm = [];
    				//type = 'None'; // use this instead of next match, "ASCII"
    				// 20230120: change to strict
    				// https://discuss.ens.domains/t/ens-name-normalization-2nd/14564/59
    				throw new Error(`empty label`);
    			} 
    			let norm = info.output = tokens.flat();
    			check_leading_underscore(norm);
    			let emoji = info.emoji = token_count > 1 || tokens[0].is_emoji; // same as: tokens.some(x => x.is_emoji);
    			if (!emoji && norm.every(cp => cp < 0x80)) { // special case for ascii
    				// 20230123: matches matches WHATWG, see note 3.3
    				check_label_extension(norm); // only needed for ascii
    				// cant have fenced
    				// cant have cm
    				// cant have wholes
    				// see derive: "Fastpath ASCII"
    				type = 'ASCII';
    			} else {
    				let chars = tokens.flatMap(x => x.is_emoji ? [] : x); // all of the nfc tokens concat together
    				if (!chars.length) { // theres no text, just emoji
    					type = 'Emoji';
    				} else {
    					// 5.) "The label must not begin with a combining mark, that is: General_Category=Mark."
    					if (CM.has(norm[0])) throw error_placement('leading combining mark');
    					for (let i = 1; i < token_count; i++) { // we've already checked the first token
    						let cps = tokens[i];
    						if (!cps.is_emoji && CM.has(cps[0])) { // every text token has emoji neighbors, eg. EtEEEtEt...
    							// bidi_qq() not needed since emoji is LTR and cps is a CM
    							throw error_placement(`emoji + combining mark: "${str_from_cps(tokens[i-1])} + ${safe_str_from_cps([cps[0]])}"`); 
    						}
    					}
    					check_fenced(norm);
    					let unique = Array_from(new Set(chars));
    					let [g] = determine_group(unique); // take the first match
    					// see derive: "Matching Groups have Same CM Style"
    					// alternative: could form a hybrid type: Latin/Japanese/...	
    					check_group(g, chars); // need text in order
    					check_whole(g, unique); // only need unique text (order would be required for multiple-char confusables)
    					type = g.N;
    					// 20230121: consider exposing restricted flag
    					// it's simpler to just check for 'Restricted'
    					// or even better: type.endsWith(']')
    					//if (g.R) info.restricted = true;
    				}
    			}
    			info.type = type;
    		} catch (err) {
    			info.error = err; // use full error object
    		}
    		return info;
    	});
    }

    function check_whole(group, unique) {
    	let maker;
    	let shared = [];
    	for (let cp of unique) {
    		let whole = WHOLE_MAP.get(cp);
    		if (whole === UNIQUE_PH) return; // unique, non-confusable
    		if (whole) {
    			let set = whole.M.get(cp); // groups which have a character that look-like this character
    			maker = maker ? maker.filter(g => set.has(g)) : Array_from(set);
    			if (!maker.length) return; // confusable intersection is empty
    		} else {
    			shared.push(cp); 
    		}
    	}
    	if (maker) {
    		// we have 1+ confusable
    		// check if any of the remaining groups
    		// contain the shared characters too
    		for (let g of maker) {
    			if (shared.every(cp => group_has_cp(g, cp))) {
    				throw new Error(`whole-script confusable: ${group.N}/${g.N}`);
    			}
    		}
    	}
    }

    // assumption: unique.size > 0
    // returns list of matching groups
    function determine_group(unique) {
    	let groups = GROUPS;
    	for (let cp of unique) {
    		// note: we need to dodge CM that are whitelisted
    		// but that code isn't currently necessary
    		let gs = groups.filter(g => group_has_cp(g, cp));
    		if (!gs.length) {
    			if (!GROUPS.some(g => group_has_cp(g, cp))) { 
    				// the character was composed of valid parts
    				// but it's NFC form is invalid
    				// 20230716: change to more exact statement, see: ENSNormalize.{cs,java}
    				// note: this doesn't have to be a composition
    				// 20230720: change to full check
    				throw error_disallowed(cp); // this should be rare
    			} else {
    				// there is no group that contains all these characters
    				// throw using the highest priority group that matched
    				// https://www.unicode.org/reports/tr39/#mixed_script_confusables
    				throw error_group_member(groups[0], cp);
    			}
    		}
    		groups = gs;
    		if (gs.length == 1) break; // there is only one group left
    	}
    	// there are at least 1 group(s) with all of these characters
    	return groups;
    }

    // throw on first error
    function flatten(split) {
    	return split.map(({input, error, output}) => {
    		if (error) {
    			// don't print label again if just a single label
    			let msg = error.message;
    			// bidi_qq() only necessary if msg is digits
    			throw new Error(split.length == 1 ? msg : `Invalid label ${bidi_qq(safe_str_from_cps(input))}: ${msg}`); 
    		}
    		return str_from_cps(output);
    	}).join(STOP_CH);
    }

    function error_disallowed(cp) {
    	// TODO: add cp to error?
    	return new Error(`disallowed character: ${quoted_cp(cp)}`); 
    }
    function error_group_member(g, cp) {
    	let quoted = quoted_cp(cp);
    	let gg = GROUPS.find(g => g.P.has(cp)); // only check primary
    	if (gg) {
    		quoted = `${gg.N} ${quoted}`;
    	}
    	return new Error(`illegal mixture: ${g.N} + ${quoted}`);
    }
    function error_placement(where) {
    	return new Error(`illegal placement: ${where}`);
    }

    // assumption: cps.length > 0
    // assumption: cps[0] isn't a CM
    // assumption: the previous character isn't an emoji
    function check_group(g, cps) {
    	for (let cp of cps) {
    		if (!group_has_cp(g, cp)) {
    			// for whitelisted scripts, this will throw illegal mixture on invalid cm, eg. "e{300}{300}"
    			// at the moment, it's unnecessary to introduce an extra error type
    			// until there exists a whitelisted multi-character
    			//   eg. if (M < 0 && is_combining_mark(cp)) { ... }
    			// there are 3 cases:
    			//   1. illegal cm for wrong group => mixture error
    			//   2. illegal cm for same group => cm error
    			//       requires set of whitelist cm per group: 
    			//        eg. new Set([...g.P, ...g.Q].flatMap(nfc).filter(cp => CM.has(cp)))
    			//   3. wrong group => mixture error
    			throw error_group_member(g, cp);
    		}
    	}
    	//if (M >= 0) { // we have a known fixed cm count
    	if (g.M) { // we need to check for NSM
    		let decomposed = nfd(cps);
    		for (let i = 1, e = decomposed.length; i < e; i++) { // see: assumption
    			// 20230210: bugfix: using cps instead of decomposed h/t Carbon225
    			/*
    			if (CM.has(decomposed[i])) {
    				let j = i + 1;
    				while (j < e && CM.has(decomposed[j])) j++;
    				if (j - i > M) {
    					throw new Error(`too many combining marks: ${g.N} ${bidi_qq(str_from_cps(decomposed.slice(i-1, j)))} (${j-i}/${M})`);
    				}
    				i = j;
    			}
    			*/
    			// 20230217: switch to NSM counting
    			// https://www.unicode.org/reports/tr39/#Optional_Detection
    			if (NSM.has(decomposed[i])) {
    				let j = i + 1;
    				for (let cp; j < e && NSM.has(cp = decomposed[j]); j++) {
    					// a. Forbid sequences of the same nonspacing mark.
    					for (let k = i; k < j; k++) { // O(n^2) but n < 100
    						if (decomposed[k] == cp) {
    							throw new Error(`duplicate non-spacing marks: ${quoted_cp(cp)}`);
    						}
    					}
    				}
    				// parse to end so we have full nsm count
    				// b. Forbid sequences of more than 4 nonspacing marks (gc=Mn or gc=Me).
    				if (j - i > NSM_MAX) {
    					// note: this slice starts with a base char or spacing-mark cm
    					throw new Error(`excessive non-spacing marks: ${bidi_qq(safe_str_from_cps(decomposed.slice(i-1, j)))} (${j-i}/${NSM_MAX})`);
    				}
    				i = j;
    			}
    		}
    	}
    	// *** this code currently isn't needed ***
    	/*
    	let cm_whitelist = M instanceof Map;
    	for (let i = 0, e = cps.length; i < e; ) {
    		let cp = cps[i++];
    		let seqs = cm_whitelist && M.get(cp);
    		if (seqs) { 
    			// list of codepoints that can follow
    			// if this exists, this will always be 1+
    			let j = i;
    			while (j < e && CM.has(cps[j])) j++;
    			let cms = cps.slice(i, j);
    			let match = seqs.find(seq => !compare_arrays(seq, cms));
    			if (!match) throw new Error(`disallowed combining mark sequence: "${safe_str_from_cps([cp, ...cms])}"`);
    			i = j;
    		} else if (!V.has(cp)) {
    			// https://www.unicode.org/reports/tr39/#mixed_script_confusables
    			let quoted = quoted_cp(cp);
    			for (let cp of cps) {
    				let u = UNIQUE.get(cp);
    				if (u && u !== g) {
    					// if both scripts are restricted this error is confusing
    					// because we don't differentiate RestrictedA from RestrictedB 
    					if (!u.R) quoted = `${quoted} is ${u.N}`;
    					break;
    				}
    			}
    			throw new Error(`disallowed ${g.N} character: ${quoted}`);
    			//throw new Error(`disallowed character: ${quoted} (expected ${g.N})`);
    			//throw new Error(`${g.N} does not allow: ${quoted}`);
    		}
    	}
    	if (!cm_whitelist) {
    		let decomposed = nfd(cps);
    		for (let i = 1, e = decomposed.length; i < e; i++) { // we know it can't be cm leading
    			if (CM.has(decomposed[i])) {
    				let j = i + 1;
    				while (j < e && CM.has(decomposed[j])) j++;
    				if (j - i > M) {
    					throw new Error(`too many combining marks: "${str_from_cps(decomposed.slice(i-1, j))}" (${j-i}/${M})`);
    				}
    				i = j;
    			}
    		}
    	}
    	*/
    }

    // given a list of codepoints
    // returns a list of lists, where emoji are a fully-qualified (as Array subclass)
    // eg. explode_cp("abc💩d") => [[61, 62, 63], Emoji[1F4A9, FE0F], [64]]
    // 20230818: rename for 'process' name collision h/t Javarome
    // https://github.com/adraffy/ens-normalize.js/issues/23
    function tokens_from_str(input, nf, ef) {
    	let ret = [];
    	let chars = [];
    	input = input.slice().reverse(); // flip so we can pop
    	while (input.length) {
    		let emoji = consume_emoji_reversed(input);
    		if (emoji) {
    			if (chars.length) {
    				ret.push(nf(chars));
    				chars = [];
    			}
    			ret.push(ef(emoji));
    		} else {
    			let cp = input.pop();
    			if (VALID.has(cp)) {
    				chars.push(cp);
    			} else {
    				let cps = MAPPED.get(cp);
    				if (cps) {
    					chars.push(...cps); // less than 10 elements
    				} else if (!IGNORED.has(cp)) {
    					// 20230912: unicode 15.1 changed the order of processing such that
    					// disallowed parts are only rejected after NFC
    					// https://unicode.org/reports/tr46/#Validity_Criteria
    					// this doesn't impact normalization as of today
    					// technically, this error can be removed as the group logic will apply similar logic
    					// however the error type might be less clear
    					throw error_disallowed(cp);
    				}
    			}
    		}
    	}
    	if (chars.length) {
    		ret.push(nf(chars));
    	}
    	return ret;
    }

    function filter_fe0f(cps) {
    	return cps.filter(cp => cp != FE0F);
    }

    // given array of codepoints
    // returns the longest valid emoji sequence (or undefined if no match)
    // *MUTATES* the supplied array
    // disallows interleaved ignored characters
    // fills (optional) eaten array with matched codepoints
    function consume_emoji_reversed(cps, eaten) {
    	let node = EMOJI_ROOT;
    	let emoji;
    	let pos = cps.length;
    	while (pos) {
    		node = node.get(cps[--pos]);
    		if (!node) break;
    		let {V} = node;
    		if (V) { // this is a valid emoji (so far)
    			emoji = V;
    			if (eaten) eaten.push(...cps.slice(pos).reverse()); // (optional) copy input, used for ens_tokenize()
    			cps.length = pos; // truncate
    		}
    	}
    	return emoji;
    }

    const Zeros = new Uint8Array(32);
    Zeros.fill(0);
    function checkComponent(comp) {
        assertArgument(comp.length !== 0, "invalid ENS name; empty component", "comp", comp);
        return comp;
    }
    function ensNameSplit(name) {
        const bytes = toUtf8Bytes(ensNormalize(name));
        const comps = [];
        if (name.length === 0) {
            return comps;
        }
        let last = 0;
        for (let i = 0; i < bytes.length; i++) {
            const d = bytes[i];
            // A separator (i.e. "."); copy this component
            if (d === 0x2e) {
                comps.push(checkComponent(bytes.slice(last, i)));
                last = i + 1;
            }
        }
        // There was a stray separator at the end of the name
        assertArgument(last < bytes.length, "invalid ENS name; empty component", "name", name);
        comps.push(checkComponent(bytes.slice(last)));
        return comps;
    }
    /**
     *  Returns the ENS %%name%% normalized.
     */
    function ensNormalize(name) {
        try {
            if (name.length === 0) {
                throw new Error("empty label");
            }
            return ens_normalize(name);
        }
        catch (error) {
            assertArgument(false, `invalid ENS name (${error.message})`, "name", name);
        }
    }
    /**
     *  Returns ``true`` if %%name%% is a valid ENS name.
     */
    function isValidName(name) {
        try {
            return (ensNameSplit(name).length !== 0);
        }
        catch (error) { }
        return false;
    }
    /**
     *  Returns the [[link-namehash]] for %%name%%.
     */
    function namehash(name) {
        assertArgument(typeof (name) === "string", "invalid ENS name; not a string", "name", name);
        assertArgument(name.length, `invalid ENS name (empty label)`, "name", name);
        let result = Zeros;
        const comps = ensNameSplit(name);
        while (comps.length) {
            result = keccak256(concat([result, keccak256((comps.pop()))]));
        }
        return hexlify(result);
    }
    /**
     *  Returns the DNS encoded %%name%%.
     *
     *  This is used for various parts of ENS name resolution, such
     *  as the wildcard resolution.
     */
    function dnsEncode(name) {
        return hexlify(concat(ensNameSplit(name).map((comp) => {
            // DNS does not allow components over 63 bytes in length
            if (comp.length > 63) {
                throw new Error("invalid DNS encoded entry; length exceeds 63 bytes");
            }
            const bytes = new Uint8Array(comp.length + 1);
            bytes.set(comp, 1);
            bytes[0] = bytes.length - 1;
            return bytes;
        }))) + "00";
    }

    function accessSetify(addr, storageKeys) {
        return {
            address: getAddress(addr),
            storageKeys: storageKeys.map((storageKey, index) => {
                assertArgument(isHexString(storageKey, 32), "invalid slot", `storageKeys[${index}]`, storageKey);
                return storageKey.toLowerCase();
            })
        };
    }
    /**
     *  Returns a [[AccessList]] from any ethers-supported access-list structure.
     */
    function accessListify(value) {
        if (Array.isArray(value)) {
            return value.map((set, index) => {
                if (Array.isArray(set)) {
                    assertArgument(set.length === 2, "invalid slot set", `value[${index}]`, set);
                    return accessSetify(set[0], set[1]);
                }
                assertArgument(set != null && typeof (set) === "object", "invalid address-slot set", "value", value);
                return accessSetify(set.address, set.storageKeys);
            });
        }
        assertArgument(value != null && typeof (value) === "object", "invalid access list", "value", value);
        const result = Object.keys(value).map((addr) => {
            const storageKeys = value[addr].reduce((accum, storageKey) => {
                accum[storageKey] = true;
                return accum;
            }, {});
            return accessSetify(addr, Object.keys(storageKeys).sort());
        });
        result.sort((a, b) => (a.address.localeCompare(b.address)));
        return result;
    }

    /**
     *  Returns the address for the %%key%%.
     *
     *  The key may be any standard form of public key or a private key.
     */
    function computeAddress(key) {
        let pubkey;
        if (typeof (key) === "string") {
            pubkey = SigningKey.computePublicKey(key, false);
        }
        else {
            pubkey = key.publicKey;
        }
        return getAddress(keccak256("0x" + pubkey.substring(4)).substring(26));
    }
    /**
     *  Returns the recovered address for the private key that was
     *  used to sign %%digest%% that resulted in %%signature%%.
     */
    function recoverAddress(digest, signature) {
        return computeAddress(SigningKey.recoverPublicKey(digest, signature));
    }

    const BN_0$4 = BigInt(0);
    const BN_2$2 = BigInt(2);
    const BN_27 = BigInt(27);
    const BN_28 = BigInt(28);
    const BN_35 = BigInt(35);
    const BN_MAX_UINT = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
    function handleAddress(value) {
        if (value === "0x") {
            return null;
        }
        return getAddress(value);
    }
    function handleAccessList(value, param) {
        try {
            return accessListify(value);
        }
        catch (error) {
            assertArgument(false, error.message, param, value);
        }
    }
    function handleNumber(_value, param) {
        if (_value === "0x") {
            return 0;
        }
        return getNumber(_value, param);
    }
    function handleUint(_value, param) {
        if (_value === "0x") {
            return BN_0$4;
        }
        const value = getBigInt(_value, param);
        assertArgument(value <= BN_MAX_UINT, "value exceeds uint size", param, value);
        return value;
    }
    function formatNumber(_value, name) {
        const value = getBigInt(_value, "value");
        const result = toBeArray(value);
        assertArgument(result.length <= 32, `value too large`, `tx.${name}`, value);
        return result;
    }
    function formatAccessList(value) {
        return accessListify(value).map((set) => [set.address, set.storageKeys]);
    }
    function _parseLegacy(data) {
        const fields = decodeRlp(data);
        assertArgument(Array.isArray(fields) && (fields.length === 9 || fields.length === 6), "invalid field count for legacy transaction", "data", data);
        const tx = {
            type: 0,
            nonce: handleNumber(fields[0], "nonce"),
            gasPrice: handleUint(fields[1], "gasPrice"),
            gasLimit: handleUint(fields[2], "gasLimit"),
            to: handleAddress(fields[3]),
            value: handleUint(fields[4], "value"),
            data: hexlify(fields[5]),
            chainId: BN_0$4
        };
        // Legacy unsigned transaction
        if (fields.length === 6) {
            return tx;
        }
        const v = handleUint(fields[6], "v");
        const r = handleUint(fields[7], "r");
        const s = handleUint(fields[8], "s");
        if (r === BN_0$4 && s === BN_0$4) {
            // EIP-155 unsigned transaction
            tx.chainId = v;
        }
        else {
            // Compute the EIP-155 chain ID (or 0 for legacy)
            let chainId = (v - BN_35) / BN_2$2;
            if (chainId < BN_0$4) {
                chainId = BN_0$4;
            }
            tx.chainId = chainId;
            // Signed Legacy Transaction
            assertArgument(chainId !== BN_0$4 || (v === BN_27 || v === BN_28), "non-canonical legacy v", "v", fields[6]);
            tx.signature = Signature.from({
                r: zeroPadValue(fields[7], 32),
                s: zeroPadValue(fields[8], 32),
                v
            });
            tx.hash = keccak256(data);
        }
        return tx;
    }
    function _serializeLegacy(tx, sig) {
        const fields = [
            formatNumber(tx.nonce || 0, "nonce"),
            formatNumber(tx.gasPrice || 0, "gasPrice"),
            formatNumber(tx.gasLimit || 0, "gasLimit"),
            ((tx.to != null) ? getAddress(tx.to) : "0x"),
            formatNumber(tx.value || 0, "value"),
            (tx.data || "0x"),
        ];
        let chainId = BN_0$4;
        if (tx.chainId != BN_0$4) {
            // A chainId was provided; if non-zero we'll use EIP-155
            chainId = getBigInt(tx.chainId, "tx.chainId");
            // We have a chainId in the tx and an EIP-155 v in the signature,
            // make sure they agree with each other
            assertArgument(!sig || sig.networkV == null || sig.legacyChainId === chainId, "tx.chainId/sig.v mismatch", "sig", sig);
        }
        else if (tx.signature) {
            // No explicit chainId, but EIP-155 have a derived implicit chainId
            const legacy = tx.signature.legacyChainId;
            if (legacy != null) {
                chainId = legacy;
            }
        }
        // Requesting an unsigned transaction
        if (!sig) {
            // We have an EIP-155 transaction (chainId was specified and non-zero)
            if (chainId !== BN_0$4) {
                fields.push(toBeArray(chainId));
                fields.push("0x");
                fields.push("0x");
            }
            return encodeRlp(fields);
        }
        // @TODO: We should probably check that tx.signature, chainId, and sig
        //        match but that logic could break existing code, so schedule
        //        this for the next major bump.
        // Compute the EIP-155 v
        let v = BigInt(27 + sig.yParity);
        if (chainId !== BN_0$4) {
            v = Signature.getChainIdV(chainId, sig.v);
        }
        else if (BigInt(sig.v) !== v) {
            assertArgument(false, "tx.chainId/sig.v mismatch", "sig", sig);
        }
        // Add the signature
        fields.push(toBeArray(v));
        fields.push(toBeArray(sig.r));
        fields.push(toBeArray(sig.s));
        return encodeRlp(fields);
    }
    function _parseEipSignature(tx, fields) {
        let yParity;
        try {
            yParity = handleNumber(fields[0], "yParity");
            if (yParity !== 0 && yParity !== 1) {
                throw new Error("bad yParity");
            }
        }
        catch (error) {
            assertArgument(false, "invalid yParity", "yParity", fields[0]);
        }
        const r = zeroPadValue(fields[1], 32);
        const s = zeroPadValue(fields[2], 32);
        const signature = Signature.from({ r, s, yParity });
        tx.signature = signature;
    }
    function _parseEip1559(data) {
        const fields = decodeRlp(getBytes(data).slice(1));
        assertArgument(Array.isArray(fields) && (fields.length === 9 || fields.length === 12), "invalid field count for transaction type: 2", "data", hexlify(data));
        const maxPriorityFeePerGas = handleUint(fields[2], "maxPriorityFeePerGas");
        const maxFeePerGas = handleUint(fields[3], "maxFeePerGas");
        const tx = {
            type: 2,
            chainId: handleUint(fields[0], "chainId"),
            nonce: handleNumber(fields[1], "nonce"),
            maxPriorityFeePerGas: maxPriorityFeePerGas,
            maxFeePerGas: maxFeePerGas,
            gasPrice: null,
            gasLimit: handleUint(fields[4], "gasLimit"),
            to: handleAddress(fields[5]),
            value: handleUint(fields[6], "value"),
            data: hexlify(fields[7]),
            accessList: handleAccessList(fields[8], "accessList"),
        };
        // Unsigned EIP-1559 Transaction
        if (fields.length === 9) {
            return tx;
        }
        tx.hash = keccak256(data);
        _parseEipSignature(tx, fields.slice(9));
        return tx;
    }
    function _serializeEip1559(tx, sig) {
        const fields = [
            formatNumber(tx.chainId || 0, "chainId"),
            formatNumber(tx.nonce || 0, "nonce"),
            formatNumber(tx.maxPriorityFeePerGas || 0, "maxPriorityFeePerGas"),
            formatNumber(tx.maxFeePerGas || 0, "maxFeePerGas"),
            formatNumber(tx.gasLimit || 0, "gasLimit"),
            ((tx.to != null) ? getAddress(tx.to) : "0x"),
            formatNumber(tx.value || 0, "value"),
            (tx.data || "0x"),
            (formatAccessList(tx.accessList || []))
        ];
        if (sig) {
            fields.push(formatNumber(sig.yParity, "yParity"));
            fields.push(toBeArray(sig.r));
            fields.push(toBeArray(sig.s));
        }
        return concat(["0x02", encodeRlp(fields)]);
    }
    function _parseEip2930(data) {
        const fields = decodeRlp(getBytes(data).slice(1));
        assertArgument(Array.isArray(fields) && (fields.length === 8 || fields.length === 11), "invalid field count for transaction type: 1", "data", hexlify(data));
        const tx = {
            type: 1,
            chainId: handleUint(fields[0], "chainId"),
            nonce: handleNumber(fields[1], "nonce"),
            gasPrice: handleUint(fields[2], "gasPrice"),
            gasLimit: handleUint(fields[3], "gasLimit"),
            to: handleAddress(fields[4]),
            value: handleUint(fields[5], "value"),
            data: hexlify(fields[6]),
            accessList: handleAccessList(fields[7], "accessList")
        };
        // Unsigned EIP-2930 Transaction
        if (fields.length === 8) {
            return tx;
        }
        tx.hash = keccak256(data);
        _parseEipSignature(tx, fields.slice(8));
        return tx;
    }
    function _serializeEip2930(tx, sig) {
        const fields = [
            formatNumber(tx.chainId || 0, "chainId"),
            formatNumber(tx.nonce || 0, "nonce"),
            formatNumber(tx.gasPrice || 0, "gasPrice"),
            formatNumber(tx.gasLimit || 0, "gasLimit"),
            ((tx.to != null) ? getAddress(tx.to) : "0x"),
            formatNumber(tx.value || 0, "value"),
            (tx.data || "0x"),
            (formatAccessList(tx.accessList || []))
        ];
        if (sig) {
            fields.push(formatNumber(sig.yParity, "recoveryParam"));
            fields.push(toBeArray(sig.r));
            fields.push(toBeArray(sig.s));
        }
        return concat(["0x01", encodeRlp(fields)]);
    }
    /**
     *  A **Transaction** describes an operation to be executed on
     *  Ethereum by an Externally Owned Account (EOA). It includes
     *  who (the [[to]] address), what (the [[data]]) and how much (the
     *  [[value]] in ether) the operation should entail.
     *
     *  @example:
     *    tx = new Transaction()
     *    //_result:
     *
     *    tx.data = "0x1234";
     *    //_result:
     */
    class Transaction {
        #type;
        #to;
        #data;
        #nonce;
        #gasLimit;
        #gasPrice;
        #maxPriorityFeePerGas;
        #maxFeePerGas;
        #value;
        #chainId;
        #sig;
        #accessList;
        /**
         *  The transaction type.
         *
         *  If null, the type will be automatically inferred based on
         *  explicit properties.
         */
        get type() { return this.#type; }
        set type(value) {
            switch (value) {
                case null:
                    this.#type = null;
                    break;
                case 0:
                case "legacy":
                    this.#type = 0;
                    break;
                case 1:
                case "berlin":
                case "eip-2930":
                    this.#type = 1;
                    break;
                case 2:
                case "london":
                case "eip-1559":
                    this.#type = 2;
                    break;
                default:
                    assertArgument(false, "unsupported transaction type", "type", value);
            }
        }
        /**
         *  The name of the transaction type.
         */
        get typeName() {
            switch (this.type) {
                case 0: return "legacy";
                case 1: return "eip-2930";
                case 2: return "eip-1559";
            }
            return null;
        }
        /**
         *  The ``to`` address for the transaction or ``null`` if the
         *  transaction is an ``init`` transaction.
         */
        get to() { return this.#to; }
        set to(value) {
            this.#to = (value == null) ? null : getAddress(value);
        }
        /**
         *  The transaction nonce.
         */
        get nonce() { return this.#nonce; }
        set nonce(value) { this.#nonce = getNumber(value, "value"); }
        /**
         *  The gas limit.
         */
        get gasLimit() { return this.#gasLimit; }
        set gasLimit(value) { this.#gasLimit = getBigInt(value); }
        /**
         *  The gas price.
         *
         *  On legacy networks this defines the fee that will be paid. On
         *  EIP-1559 networks, this should be ``null``.
         */
        get gasPrice() {
            const value = this.#gasPrice;
            if (value == null && (this.type === 0 || this.type === 1)) {
                return BN_0$4;
            }
            return value;
        }
        set gasPrice(value) {
            this.#gasPrice = (value == null) ? null : getBigInt(value, "gasPrice");
        }
        /**
         *  The maximum priority fee per unit of gas to pay. On legacy
         *  networks this should be ``null``.
         */
        get maxPriorityFeePerGas() {
            const value = this.#maxPriorityFeePerGas;
            if (value == null) {
                if (this.type === 2) {
                    return BN_0$4;
                }
                return null;
            }
            return value;
        }
        set maxPriorityFeePerGas(value) {
            this.#maxPriorityFeePerGas = (value == null) ? null : getBigInt(value, "maxPriorityFeePerGas");
        }
        /**
         *  The maximum total fee per unit of gas to pay. On legacy
         *  networks this should be ``null``.
         */
        get maxFeePerGas() {
            const value = this.#maxFeePerGas;
            if (value == null) {
                if (this.type === 2) {
                    return BN_0$4;
                }
                return null;
            }
            return value;
        }
        set maxFeePerGas(value) {
            this.#maxFeePerGas = (value == null) ? null : getBigInt(value, "maxFeePerGas");
        }
        /**
         *  The transaction data. For ``init`` transactions this is the
         *  deployment code.
         */
        get data() { return this.#data; }
        set data(value) { this.#data = hexlify(value); }
        /**
         *  The amount of ether (in wei) to send in this transactions.
         */
        get value() { return this.#value; }
        set value(value) {
            this.#value = getBigInt(value, "value");
        }
        /**
         *  The chain ID this transaction is valid on.
         */
        get chainId() { return this.#chainId; }
        set chainId(value) { this.#chainId = getBigInt(value); }
        /**
         *  If signed, the signature for this transaction.
         */
        get signature() { return this.#sig || null; }
        set signature(value) {
            this.#sig = (value == null) ? null : Signature.from(value);
        }
        /**
         *  The access list.
         *
         *  An access list permits discounted (but pre-paid) access to
         *  bytecode and state variable access within contract execution.
         */
        get accessList() {
            const value = this.#accessList || null;
            if (value == null) {
                if (this.type === 1 || this.type === 2) {
                    return [];
                }
                return null;
            }
            return value;
        }
        set accessList(value) {
            this.#accessList = (value == null) ? null : accessListify(value);
        }
        /**
         *  Creates a new Transaction with default values.
         */
        constructor() {
            this.#type = null;
            this.#to = null;
            this.#nonce = 0;
            this.#gasLimit = BigInt(0);
            this.#gasPrice = null;
            this.#maxPriorityFeePerGas = null;
            this.#maxFeePerGas = null;
            this.#data = "0x";
            this.#value = BigInt(0);
            this.#chainId = BigInt(0);
            this.#sig = null;
            this.#accessList = null;
        }
        /**
         *  The transaction hash, if signed. Otherwise, ``null``.
         */
        get hash() {
            if (this.signature == null) {
                return null;
            }
            return keccak256(this.serialized);
        }
        /**
         *  The pre-image hash of this transaction.
         *
         *  This is the digest that a [[Signer]] must sign to authorize
         *  this transaction.
         */
        get unsignedHash() {
            return keccak256(this.unsignedSerialized);
        }
        /**
         *  The sending address, if signed. Otherwise, ``null``.
         */
        get from() {
            if (this.signature == null) {
                return null;
            }
            return recoverAddress(this.unsignedHash, this.signature);
        }
        /**
         *  The public key of the sender, if signed. Otherwise, ``null``.
         */
        get fromPublicKey() {
            if (this.signature == null) {
                return null;
            }
            return SigningKey.recoverPublicKey(this.unsignedHash, this.signature);
        }
        /**
         *  Returns true if signed.
         *
         *  This provides a Type Guard that properties requiring a signed
         *  transaction are non-null.
         */
        isSigned() {
            //isSigned(): this is SignedTransaction {
            return this.signature != null;
        }
        /**
         *  The serialized transaction.
         *
         *  This throws if the transaction is unsigned. For the pre-image,
         *  use [[unsignedSerialized]].
         */
        get serialized() {
            assert(this.signature != null, "cannot serialize unsigned transaction; maybe you meant .unsignedSerialized", "UNSUPPORTED_OPERATION", { operation: ".serialized" });
            switch (this.inferType()) {
                case 0:
                    return _serializeLegacy(this, this.signature);
                case 1:
                    return _serializeEip2930(this, this.signature);
                case 2:
                    return _serializeEip1559(this, this.signature);
            }
            assert(false, "unsupported transaction type", "UNSUPPORTED_OPERATION", { operation: ".serialized" });
        }
        /**
         *  The transaction pre-image.
         *
         *  The hash of this is the digest which needs to be signed to
         *  authorize this transaction.
         */
        get unsignedSerialized() {
            switch (this.inferType()) {
                case 0:
                    return _serializeLegacy(this);
                case 1:
                    return _serializeEip2930(this);
                case 2:
                    return _serializeEip1559(this);
            }
            assert(false, "unsupported transaction type", "UNSUPPORTED_OPERATION", { operation: ".unsignedSerialized" });
        }
        /**
         *  Return the most "likely" type; currently the highest
         *  supported transaction type.
         */
        inferType() {
            return (this.inferTypes().pop());
        }
        /**
         *  Validates the explicit properties and returns a list of compatible
         *  transaction types.
         */
        inferTypes() {
            // Checks that there are no conflicting properties set
            const hasGasPrice = this.gasPrice != null;
            const hasFee = (this.maxFeePerGas != null || this.maxPriorityFeePerGas != null);
            const hasAccessList = (this.accessList != null);
            //if (hasGasPrice && hasFee) {
            //    throw new Error("transaction cannot have gasPrice and maxFeePerGas");
            //}
            if (this.maxFeePerGas != null && this.maxPriorityFeePerGas != null) {
                assert(this.maxFeePerGas >= this.maxPriorityFeePerGas, "priorityFee cannot be more than maxFee", "BAD_DATA", { value: this });
            }
            //if (this.type === 2 && hasGasPrice) {
            //    throw new Error("eip-1559 transaction cannot have gasPrice");
            //}
            assert(!hasFee || (this.type !== 0 && this.type !== 1), "transaction type cannot have maxFeePerGas or maxPriorityFeePerGas", "BAD_DATA", { value: this });
            assert(this.type !== 0 || !hasAccessList, "legacy transaction cannot have accessList", "BAD_DATA", { value: this });
            const types = [];
            // Explicit type
            if (this.type != null) {
                types.push(this.type);
            }
            else {
                if (hasFee) {
                    types.push(2);
                }
                else if (hasGasPrice) {
                    types.push(1);
                    if (!hasAccessList) {
                        types.push(0);
                    }
                }
                else if (hasAccessList) {
                    types.push(1);
                    types.push(2);
                }
                else {
                    types.push(0);
                    types.push(1);
                    types.push(2);
                }
            }
            types.sort();
            return types;
        }
        /**
         *  Returns true if this transaction is a legacy transaction (i.e.
         *  ``type === 0``).
         *
         *  This provides a Type Guard that the related properties are
         *  non-null.
         */
        isLegacy() {
            return (this.type === 0);
        }
        /**
         *  Returns true if this transaction is berlin hardform transaction (i.e.
         *  ``type === 1``).
         *
         *  This provides a Type Guard that the related properties are
         *  non-null.
         */
        isBerlin() {
            return (this.type === 1);
        }
        /**
         *  Returns true if this transaction is london hardform transaction (i.e.
         *  ``type === 2``).
         *
         *  This provides a Type Guard that the related properties are
         *  non-null.
         */
        isLondon() {
            return (this.type === 2);
        }
        /**
         *  Create a copy of this transaciton.
         */
        clone() {
            return Transaction.from(this);
        }
        /**
         *  Return a JSON-friendly object.
         */
        toJSON() {
            const s = (v) => {
                if (v == null) {
                    return null;
                }
                return v.toString();
            };
            return {
                type: this.type,
                to: this.to,
                //            from: this.from,
                data: this.data,
                nonce: this.nonce,
                gasLimit: s(this.gasLimit),
                gasPrice: s(this.gasPrice),
                maxPriorityFeePerGas: s(this.maxPriorityFeePerGas),
                maxFeePerGas: s(this.maxFeePerGas),
                value: s(this.value),
                chainId: s(this.chainId),
                sig: this.signature ? this.signature.toJSON() : null,
                accessList: this.accessList
            };
        }
        /**
         *  Create a **Transaction** from a serialized transaction or a
         *  Transaction-like object.
         */
        static from(tx) {
            if (tx == null) {
                return new Transaction();
            }
            if (typeof (tx) === "string") {
                const payload = getBytes(tx);
                if (payload[0] >= 0x7f) { // @TODO: > vs >= ??
                    return Transaction.from(_parseLegacy(payload));
                }
                switch (payload[0]) {
                    case 1: return Transaction.from(_parseEip2930(payload));
                    case 2: return Transaction.from(_parseEip1559(payload));
                }
                assert(false, "unsupported transaction type", "UNSUPPORTED_OPERATION", { operation: "from" });
            }
            const result = new Transaction();
            if (tx.type != null) {
                result.type = tx.type;
            }
            if (tx.to != null) {
                result.to = tx.to;
            }
            if (tx.nonce != null) {
                result.nonce = tx.nonce;
            }
            if (tx.gasLimit != null) {
                result.gasLimit = tx.gasLimit;
            }
            if (tx.gasPrice != null) {
                result.gasPrice = tx.gasPrice;
            }
            if (tx.maxPriorityFeePerGas != null) {
                result.maxPriorityFeePerGas = tx.maxPriorityFeePerGas;
            }
            if (tx.maxFeePerGas != null) {
                result.maxFeePerGas = tx.maxFeePerGas;
            }
            if (tx.data != null) {
                result.data = tx.data;
            }
            if (tx.value != null) {
                result.value = tx.value;
            }
            if (tx.chainId != null) {
                result.chainId = tx.chainId;
            }
            if (tx.signature != null) {
                result.signature = Signature.from(tx.signature);
            }
            if (tx.accessList != null) {
                result.accessList = tx.accessList;
            }
            if (tx.hash != null) {
                assertArgument(result.isSigned(), "unsigned transaction cannot define hash", "tx", tx);
                assertArgument(result.hash === tx.hash, "hash mismatch", "tx", tx);
            }
            if (tx.from != null) {
                assertArgument(result.isSigned(), "unsigned transaction cannot define from", "tx", tx);
                assertArgument(result.from.toLowerCase() === (tx.from || "").toLowerCase(), "from mismatch", "tx", tx);
            }
            return result;
        }
    }

    /**
     *  Computes the [[link-eip-191]] personal-sign message digest to sign.
     *
     *  This prefixes the message with [[MessagePrefix]] and the decimal length
     *  of %%message%% and computes the [[keccak256]] digest.
     *
     *  If %%message%% is a string, it is converted to its UTF-8 bytes
     *  first. To compute the digest of a [[DataHexString]], it must be converted
     *  to [bytes](getBytes).
     *
     *  @example:
     *    hashMessage("Hello World")
     *    //_result:
     *
     *    // Hashes the SIX (6) string characters, i.e.
     *    // [ "0", "x", "4", "2", "4", "3" ]
     *    hashMessage("0x4243")
     *    //_result:
     *
     *    // Hashes the TWO (2) bytes [ 0x42, 0x43 ]...
     *    hashMessage(getBytes("0x4243"))
     *    //_result:
     *
     *    // ...which is equal to using data
     *    hashMessage(new Uint8Array([ 0x42, 0x43 ]))
     *    //_result:
     *
     */
    function hashMessage(message) {
        if (typeof (message) === "string") {
            message = toUtf8Bytes(message);
        }
        return keccak256(concat([
            toUtf8Bytes(MessagePrefix),
            toUtf8Bytes(String(message.length)),
            message
        ]));
    }
    /**
     *  Return the address of the private key that produced
     *  the signature %%sig%% during signing for %%message%%.
     */
    function verifyMessage(message, sig) {
        const digest = hashMessage(message);
        return recoverAddress(digest, sig);
    }

    const regexBytes = new RegExp("^bytes([0-9]+)$");
    const regexNumber = new RegExp("^(u?int)([0-9]*)$");
    const regexArray = new RegExp("^(.*)\\[([0-9]*)\\]$");
    function _pack(type, value, isArray) {
        switch (type) {
            case "address":
                if (isArray) {
                    return getBytes(zeroPadValue(value, 32));
                }
                return getBytes(getAddress(value));
            case "string":
                return toUtf8Bytes(value);
            case "bytes":
                return getBytes(value);
            case "bool":
                value = (!!value ? "0x01" : "0x00");
                if (isArray) {
                    return getBytes(zeroPadValue(value, 32));
                }
                return getBytes(value);
        }
        let match = type.match(regexNumber);
        if (match) {
            let signed = (match[1] === "int");
            let size = parseInt(match[2] || "256");
            assertArgument((!match[2] || match[2] === String(size)) && (size % 8 === 0) && size !== 0 && size <= 256, "invalid number type", "type", type);
            if (isArray) {
                size = 256;
            }
            if (signed) {
                value = toTwos(value, size);
            }
            return getBytes(zeroPadValue(toBeArray(value), size / 8));
        }
        match = type.match(regexBytes);
        if (match) {
            const size = parseInt(match[1]);
            assertArgument(String(size) === match[1] && size !== 0 && size <= 32, "invalid bytes type", "type", type);
            assertArgument(dataLength(value) === size, `invalid value for ${type}`, "value", value);
            if (isArray) {
                return getBytes(zeroPadBytes(value, 32));
            }
            return value;
        }
        match = type.match(regexArray);
        if (match && Array.isArray(value)) {
            const baseType = match[1];
            const count = parseInt(match[2] || String(value.length));
            assertArgument(count === value.length, `invalid array length for ${type}`, "value", value);
            const result = [];
            value.forEach(function (value) {
                result.push(_pack(baseType, value, true));
            });
            return getBytes(concat(result));
        }
        assertArgument(false, "invalid type", "type", type);
    }
    // @TODO: Array Enum
    /**
     *   Computes the [[link-solc-packed]] representation of %%values%%
     *   respectively to their %%types%%.
     *
     *   @example:
     *       addr = "0x8ba1f109551bd432803012645ac136ddd64dba72"
     *       solidityPacked([ "address", "uint" ], [ addr, 45 ]);
     *       //_result:
     */
    function solidityPacked(types, values) {
        assertArgument(types.length === values.length, "wrong number of values; expected ${ types.length }", "values", values);
        const tight = [];
        types.forEach(function (type, index) {
            tight.push(_pack(type, values[index]));
        });
        return hexlify(concat(tight));
    }
    /**
     *   Computes the [[link-solc-packed]] [[keccak256]] hash of %%values%%
     *   respectively to their %%types%%.
     *
     *   @example:
     *       addr = "0x8ba1f109551bd432803012645ac136ddd64dba72"
     *       solidityPackedKeccak256([ "address", "uint" ], [ addr, 45 ]);
     *       //_result:
     */
    function solidityPackedKeccak256(types, values) {
        return keccak256(solidityPacked(types, values));
    }
    /**
     *   Computes the [[link-solc-packed]] [[sha256]] hash of %%values%%
     *   respectively to their %%types%%.
     *
     *   @example:
     *       addr = "0x8ba1f109551bd432803012645ac136ddd64dba72"
     *       solidityPackedSha256([ "address", "uint" ], [ addr, 45 ]);
     *       //_result:
     */
    function solidityPackedSha256(types, values) {
        return sha256(solidityPacked(types, values));
    }

    //import { TypedDataDomain, TypedDataField } from "@ethersproject/providerabstract-signer";
    const padding = new Uint8Array(32);
    padding.fill(0);
    const BN__1 = BigInt(-1);
    const BN_0$3 = BigInt(0);
    const BN_1$1 = BigInt(1);
    const BN_MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
    function hexPadRight(value) {
        const bytes = getBytes(value);
        const padOffset = bytes.length % 32;
        if (padOffset) {
            return concat([bytes, padding.slice(padOffset)]);
        }
        return hexlify(bytes);
    }
    const hexTrue = toBeHex(BN_1$1, 32);
    const hexFalse = toBeHex(BN_0$3, 32);
    const domainFieldTypes = {
        name: "string",
        version: "string",
        chainId: "uint256",
        verifyingContract: "address",
        salt: "bytes32"
    };
    const domainFieldNames = [
        "name", "version", "chainId", "verifyingContract", "salt"
    ];
    function checkString(key) {
        return function (value) {
            assertArgument(typeof (value) === "string", `invalid domain value for ${JSON.stringify(key)}`, `domain.${key}`, value);
            return value;
        };
    }
    const domainChecks = {
        name: checkString("name"),
        version: checkString("version"),
        chainId: function (_value) {
            const value = getBigInt(_value, "domain.chainId");
            assertArgument(value >= 0, "invalid chain ID", "domain.chainId", _value);
            if (Number.isSafeInteger(value)) {
                return Number(value);
            }
            return toQuantity(value);
        },
        verifyingContract: function (value) {
            try {
                return getAddress(value).toLowerCase();
            }
            catch (error) { }
            assertArgument(false, `invalid domain value "verifyingContract"`, "domain.verifyingContract", value);
        },
        salt: function (value) {
            const bytes = getBytes(value, "domain.salt");
            assertArgument(bytes.length === 32, `invalid domain value "salt"`, "domain.salt", value);
            return hexlify(bytes);
        }
    };
    function getBaseEncoder(type) {
        // intXX and uintXX
        {
            const match = type.match(/^(u?)int(\d*)$/);
            if (match) {
                const signed = (match[1] === "");
                const width = parseInt(match[2] || "256");
                assertArgument(width % 8 === 0 && width !== 0 && width <= 256 && (match[2] == null || match[2] === String(width)), "invalid numeric width", "type", type);
                const boundsUpper = mask(BN_MAX_UINT256, signed ? (width - 1) : width);
                const boundsLower = signed ? ((boundsUpper + BN_1$1) * BN__1) : BN_0$3;
                return function (_value) {
                    const value = getBigInt(_value, "value");
                    assertArgument(value >= boundsLower && value <= boundsUpper, `value out-of-bounds for ${type}`, "value", value);
                    return toBeHex(signed ? toTwos(value, 256) : value, 32);
                };
            }
        }
        // bytesXX
        {
            const match = type.match(/^bytes(\d+)$/);
            if (match) {
                const width = parseInt(match[1]);
                assertArgument(width !== 0 && width <= 32 && match[1] === String(width), "invalid bytes width", "type", type);
                return function (value) {
                    const bytes = getBytes(value);
                    assertArgument(bytes.length === width, `invalid length for ${type}`, "value", value);
                    return hexPadRight(value);
                };
            }
        }
        switch (type) {
            case "address": return function (value) {
                return zeroPadValue(getAddress(value), 32);
            };
            case "bool": return function (value) {
                return ((!value) ? hexFalse : hexTrue);
            };
            case "bytes": return function (value) {
                return keccak256(value);
            };
            case "string": return function (value) {
                return id(value);
            };
        }
        return null;
    }
    function encodeType(name, fields) {
        return `${name}(${fields.map(({ name, type }) => (type + " " + name)).join(",")})`;
    }
    /**
     *  A **TypedDataEncode** prepares and encodes [[link-eip-712]] payloads
     *  for signed typed data.
     *
     *  This is useful for those that wish to compute various components of a
     *  typed data hash, primary types, or sub-components, but generally the
     *  higher level [[Signer-signTypedData]] is more useful.
     */
    class TypedDataEncoder {
        /**
         *  The primary type for the structured [[types]].
         *
         *  This is derived automatically from the [[types]], since no
         *  recursion is possible, once the DAG for the types is consturcted
         *  internally, the primary type must be the only remaining type with
         *  no parent nodes.
         */
        primaryType;
        #types;
        /**
         *  The types.
         */
        get types() {
            return JSON.parse(this.#types);
        }
        #fullTypes;
        #encoderCache;
        /**
         *  Create a new **TypedDataEncoder** for %%types%%.
         *
         *  This performs all necessary checking that types are valid and
         *  do not violate the [[link-eip-712]] structural constraints as
         *  well as computes the [[primaryType]].
         */
        constructor(types) {
            this.#types = JSON.stringify(types);
            this.#fullTypes = new Map();
            this.#encoderCache = new Map();
            // Link struct types to their direct child structs
            const links = new Map();
            // Link structs to structs which contain them as a child
            const parents = new Map();
            // Link all subtypes within a given struct
            const subtypes = new Map();
            Object.keys(types).forEach((type) => {
                links.set(type, new Set());
                parents.set(type, []);
                subtypes.set(type, new Set());
            });
            for (const name in types) {
                const uniqueNames = new Set();
                for (const field of types[name]) {
                    // Check each field has a unique name
                    assertArgument(!uniqueNames.has(field.name), `duplicate variable name ${JSON.stringify(field.name)} in ${JSON.stringify(name)}`, "types", types);
                    uniqueNames.add(field.name);
                    // Get the base type (drop any array specifiers)
                    const baseType = (field.type.match(/^([^\x5b]*)(\x5b|$)/))[1] || null;
                    assertArgument(baseType !== name, `circular type reference to ${JSON.stringify(baseType)}`, "types", types);
                    // Is this a base encoding type?
                    const encoder = getBaseEncoder(baseType);
                    if (encoder) {
                        continue;
                    }
                    assertArgument(parents.has(baseType), `unknown type ${JSON.stringify(baseType)}`, "types", types);
                    // Add linkage
                    parents.get(baseType).push(name);
                    links.get(name).add(baseType);
                }
            }
            // Deduce the primary type
            const primaryTypes = Array.from(parents.keys()).filter((n) => (parents.get(n).length === 0));
            assertArgument(primaryTypes.length !== 0, "missing primary type", "types", types);
            assertArgument(primaryTypes.length === 1, `ambiguous primary types or unused types: ${primaryTypes.map((t) => (JSON.stringify(t))).join(", ")}`, "types", types);
            defineProperties(this, { primaryType: primaryTypes[0] });
            // Check for circular type references
            function checkCircular(type, found) {
                assertArgument(!found.has(type), `circular type reference to ${JSON.stringify(type)}`, "types", types);
                found.add(type);
                for (const child of links.get(type)) {
                    if (!parents.has(child)) {
                        continue;
                    }
                    // Recursively check children
                    checkCircular(child, found);
                    // Mark all ancestors as having this decendant
                    for (const subtype of found) {
                        subtypes.get(subtype).add(child);
                    }
                }
                found.delete(type);
            }
            checkCircular(this.primaryType, new Set());
            // Compute each fully describe type
            for (const [name, set] of subtypes) {
                const st = Array.from(set);
                st.sort();
                this.#fullTypes.set(name, encodeType(name, types[name]) + st.map((t) => encodeType(t, types[t])).join(""));
            }
        }
        /**
         *  Returnthe encoder for the specific %%type%%.
         */
        getEncoder(type) {
            let encoder = this.#encoderCache.get(type);
            if (!encoder) {
                encoder = this.#getEncoder(type);
                this.#encoderCache.set(type, encoder);
            }
            return encoder;
        }
        #getEncoder(type) {
            // Basic encoder type (address, bool, uint256, etc)
            {
                const encoder = getBaseEncoder(type);
                if (encoder) {
                    return encoder;
                }
            }
            // Array
            const match = type.match(/^(.*)(\x5b(\d*)\x5d)$/);
            if (match) {
                const subtype = match[1];
                const subEncoder = this.getEncoder(subtype);
                return (value) => {
                    assertArgument(!match[3] || parseInt(match[3]) === value.length, `array length mismatch; expected length ${parseInt(match[3])}`, "value", value);
                    let result = value.map(subEncoder);
                    if (this.#fullTypes.has(subtype)) {
                        result = result.map(keccak256);
                    }
                    return keccak256(concat(result));
                };
            }
            // Struct
            const fields = this.types[type];
            if (fields) {
                const encodedType = id(this.#fullTypes.get(type));
                return (value) => {
                    const values = fields.map(({ name, type }) => {
                        const result = this.getEncoder(type)(value[name]);
                        if (this.#fullTypes.has(type)) {
                            return keccak256(result);
                        }
                        return result;
                    });
                    values.unshift(encodedType);
                    return concat(values);
                };
            }
            assertArgument(false, `unknown type: ${type}`, "type", type);
        }
        /**
         *  Return the full type for %%name%%.
         */
        encodeType(name) {
            const result = this.#fullTypes.get(name);
            assertArgument(result, `unknown type: ${JSON.stringify(name)}`, "name", name);
            return result;
        }
        /**
         *  Return the encoded %%value%% for the %%type%%.
         */
        encodeData(type, value) {
            return this.getEncoder(type)(value);
        }
        /**
         *  Returns the hash of %%value%% for the type of %%name%%.
         */
        hashStruct(name, value) {
            return keccak256(this.encodeData(name, value));
        }
        /**
         *  Return the fulled encoded %%value%% for the [[types]].
         */
        encode(value) {
            return this.encodeData(this.primaryType, value);
        }
        /**
         *  Return the hash of the fully encoded %%value%% for the [[types]].
         */
        hash(value) {
            return this.hashStruct(this.primaryType, value);
        }
        /**
         *  @_ignore:
         */
        _visit(type, value, callback) {
            // Basic encoder type (address, bool, uint256, etc)
            {
                const encoder = getBaseEncoder(type);
                if (encoder) {
                    return callback(type, value);
                }
            }
            // Array
            const match = type.match(/^(.*)(\x5b(\d*)\x5d)$/);
            if (match) {
                assertArgument(!match[3] || parseInt(match[3]) === value.length, `array length mismatch; expected length ${parseInt(match[3])}`, "value", value);
                return value.map((v) => this._visit(match[1], v, callback));
            }
            // Struct
            const fields = this.types[type];
            if (fields) {
                return fields.reduce((accum, { name, type }) => {
                    accum[name] = this._visit(type, value[name], callback);
                    return accum;
                }, {});
            }
            assertArgument(false, `unknown type: ${type}`, "type", type);
        }
        /**
         *  Call %%calback%% for each value in %%value%%, passing the type and
         *  component within %%value%%.
         *
         *  This is useful for replacing addresses or other transformation that
         *  may be desired on each component, based on its type.
         */
        visit(value, callback) {
            return this._visit(this.primaryType, value, callback);
        }
        /**
         *  Create a new **TypedDataEncoder** for %%types%%.
         */
        static from(types) {
            return new TypedDataEncoder(types);
        }
        /**
         *  Return the primary type for %%types%%.
         */
        static getPrimaryType(types) {
            return TypedDataEncoder.from(types).primaryType;
        }
        /**
         *  Return the hashed struct for %%value%% using %%types%% and %%name%%.
         */
        static hashStruct(name, types, value) {
            return TypedDataEncoder.from(types).hashStruct(name, value);
        }
        /**
         *  Return the domain hash for %%domain%%.
         */
        static hashDomain(domain) {
            const domainFields = [];
            for (const name in domain) {
                if (domain[name] == null) {
                    continue;
                }
                const type = domainFieldTypes[name];
                assertArgument(type, `invalid typed-data domain key: ${JSON.stringify(name)}`, "domain", domain);
                domainFields.push({ name, type });
            }
            domainFields.sort((a, b) => {
                return domainFieldNames.indexOf(a.name) - domainFieldNames.indexOf(b.name);
            });
            return TypedDataEncoder.hashStruct("EIP712Domain", { EIP712Domain: domainFields }, domain);
        }
        /**
         *  Return the fully encoded [[link-eip-712]] %%value%% for %%types%% with %%domain%%.
         */
        static encode(domain, types, value) {
            return concat([
                "0x1901",
                TypedDataEncoder.hashDomain(domain),
                TypedDataEncoder.from(types).hash(value)
            ]);
        }
        /**
         *  Return the hash of the fully encoded [[link-eip-712]] %%value%% for %%types%% with %%domain%%.
         */
        static hash(domain, types, value) {
            return keccak256(TypedDataEncoder.encode(domain, types, value));
        }
        // Replaces all address types with ENS names with their looked up address
        /**
         * Resolves to the value from resolving all addresses in %%value%% for
         * %%types%% and the %%domain%%.
         */
        static async resolveNames(domain, types, value, resolveName) {
            // Make a copy to isolate it from the object passed in
            domain = Object.assign({}, domain);
            // Allow passing null to ignore value
            for (const key in domain) {
                if (domain[key] == null) {
                    delete domain[key];
                }
            }
            // Look up all ENS names
            const ensCache = {};
            // Do we need to look up the domain's verifyingContract?
            if (domain.verifyingContract && !isHexString(domain.verifyingContract, 20)) {
                ensCache[domain.verifyingContract] = "0x";
            }
            // We are going to use the encoder to visit all the base values
            const encoder = TypedDataEncoder.from(types);
            // Get a list of all the addresses
            encoder.visit(value, (type, value) => {
                if (type === "address" && !isHexString(value, 20)) {
                    ensCache[value] = "0x";
                }
                return value;
            });
            // Lookup each name
            for (const name in ensCache) {
                ensCache[name] = await resolveName(name);
            }
            // Replace the domain verifyingContract if needed
            if (domain.verifyingContract && ensCache[domain.verifyingContract]) {
                domain.verifyingContract = ensCache[domain.verifyingContract];
            }
            // Replace all ENS names with their address
            value = encoder.visit(value, (type, value) => {
                if (type === "address" && ensCache[value]) {
                    return ensCache[value];
                }
                return value;
            });
            return { domain, value };
        }
        /**
         *  Returns the JSON-encoded payload expected by nodes which implement
         *  the JSON-RPC [[link-eip-712]] method.
         */
        static getPayload(domain, types, value) {
            // Validate the domain fields
            TypedDataEncoder.hashDomain(domain);
            // Derive the EIP712Domain Struct reference type
            const domainValues = {};
            const domainTypes = [];
            domainFieldNames.forEach((name) => {
                const value = domain[name];
                if (value == null) {
                    return;
                }
                domainValues[name] = domainChecks[name](value);
                domainTypes.push({ name, type: domainFieldTypes[name] });
            });
            const encoder = TypedDataEncoder.from(types);
            const typesWithDomain = Object.assign({}, types);
            assertArgument(typesWithDomain.EIP712Domain == null, "types must not contain EIP712Domain type", "types.EIP712Domain", types);
            typesWithDomain.EIP712Domain = domainTypes;
            // Validate the data structures and types
            encoder.encode(value);
            return {
                types: typesWithDomain,
                domain: domainValues,
                primaryType: encoder.primaryType,
                message: encoder.visit(value, (type, value) => {
                    // bytes
                    if (type.match(/^bytes(\d*)/)) {
                        return hexlify(getBytes(value));
                    }
                    // uint or int
                    if (type.match(/^u?int/)) {
                        return getBigInt(value).toString();
                    }
                    switch (type) {
                        case "address":
                            return value.toLowerCase();
                        case "bool":
                            return !!value;
                        case "string":
                            assertArgument(typeof (value) === "string", "invalid string", "value", value);
                            return value;
                    }
                    assertArgument(false, "unsupported type", "type", type);
                })
            };
        }
    }
    /**
     *  Compute the address used to sign the typed data for the %%signature%%.
     */
    function verifyTypedData(domain, types, value, signature) {
        return recoverAddress(TypedDataEncoder.hash(domain, types, value), signature);
    }

    /**
     *  A fragment is a single item from an ABI, which may represent any of:
     *
     *  - [Functions](FunctionFragment)
     *  - [Events](EventFragment)
     *  - [Constructors](ConstructorFragment)
     *  - Custom [Errors](ErrorFragment)
     *  - [Fallback or Receive](FallbackFragment) functions
     *
     *  @_subsection api/abi/abi-coder:Fragments  [about-fragments]
     */
    // [ "a", "b" ] => { "a": 1, "b": 1 }
    function setify(items) {
        const result = new Set();
        items.forEach((k) => result.add(k));
        return Object.freeze(result);
    }
    const _kwVisibDeploy = "external public payable";
    const KwVisibDeploy = setify(_kwVisibDeploy.split(" "));
    // Visibility Keywords
    const _kwVisib = "constant external internal payable private public pure view";
    const KwVisib = setify(_kwVisib.split(" "));
    const _kwTypes = "constructor error event fallback function receive struct";
    const KwTypes = setify(_kwTypes.split(" "));
    const _kwModifiers = "calldata memory storage payable indexed";
    const KwModifiers = setify(_kwModifiers.split(" "));
    const _kwOther = "tuple returns";
    // All Keywords
    const _keywords = [_kwTypes, _kwModifiers, _kwOther, _kwVisib].join(" ");
    const Keywords = setify(_keywords.split(" "));
    // Single character tokens
    const SimpleTokens = {
        "(": "OPEN_PAREN", ")": "CLOSE_PAREN",
        "[": "OPEN_BRACKET", "]": "CLOSE_BRACKET",
        ",": "COMMA", "@": "AT"
    };
    // Parser regexes to consume the next token
    const regexWhitespacePrefix = new RegExp("^(\\s*)");
    const regexNumberPrefix = new RegExp("^([0-9]+)");
    const regexIdPrefix = new RegExp("^([a-zA-Z$_][a-zA-Z0-9$_]*)");
    // Parser regexs to check validity
    const regexId = new RegExp("^([a-zA-Z$_][a-zA-Z0-9$_]*)$");
    const regexType = new RegExp("^(address|bool|bytes([0-9]*)|string|u?int([0-9]*))$");
    class TokenString {
        #offset;
        #tokens;
        get offset() { return this.#offset; }
        get length() { return this.#tokens.length - this.#offset; }
        constructor(tokens) {
            this.#offset = 0;
            this.#tokens = tokens.slice();
        }
        clone() { return new TokenString(this.#tokens); }
        reset() { this.#offset = 0; }
        #subTokenString(from = 0, to = 0) {
            return new TokenString(this.#tokens.slice(from, to).map((t) => {
                return Object.freeze(Object.assign({}, t, {
                    match: (t.match - from),
                    linkBack: (t.linkBack - from),
                    linkNext: (t.linkNext - from),
                }));
            }));
        }
        // Pops and returns the value of the next token, if it is a keyword in allowed; throws if out of tokens
        popKeyword(allowed) {
            const top = this.peek();
            if (top.type !== "KEYWORD" || !allowed.has(top.text)) {
                throw new Error(`expected keyword ${top.text}`);
            }
            return this.pop().text;
        }
        // Pops and returns the value of the next token if it is `type`; throws if out of tokens
        popType(type) {
            if (this.peek().type !== type) {
                throw new Error(`expected ${type}; got ${JSON.stringify(this.peek())}`);
            }
            return this.pop().text;
        }
        // Pops and returns a "(" TOKENS ")"
        popParen() {
            const top = this.peek();
            if (top.type !== "OPEN_PAREN") {
                throw new Error("bad start");
            }
            const result = this.#subTokenString(this.#offset + 1, top.match + 1);
            this.#offset = top.match + 1;
            return result;
        }
        // Pops and returns the items within "(" ITEM1 "," ITEM2 "," ... ")"
        popParams() {
            const top = this.peek();
            if (top.type !== "OPEN_PAREN") {
                throw new Error("bad start");
            }
            const result = [];
            while (this.#offset < top.match - 1) {
                const link = this.peek().linkNext;
                result.push(this.#subTokenString(this.#offset + 1, link));
                this.#offset = link;
            }
            this.#offset = top.match + 1;
            return result;
        }
        // Returns the top Token, throwing if out of tokens
        peek() {
            if (this.#offset >= this.#tokens.length) {
                throw new Error("out-of-bounds");
            }
            return this.#tokens[this.#offset];
        }
        // Returns the next value, if it is a keyword in `allowed`
        peekKeyword(allowed) {
            const top = this.peekType("KEYWORD");
            return (top != null && allowed.has(top)) ? top : null;
        }
        // Returns the value of the next token if it is `type`
        peekType(type) {
            if (this.length === 0) {
                return null;
            }
            const top = this.peek();
            return (top.type === type) ? top.text : null;
        }
        // Returns the next token; throws if out of tokens
        pop() {
            const result = this.peek();
            this.#offset++;
            return result;
        }
        toString() {
            const tokens = [];
            for (let i = this.#offset; i < this.#tokens.length; i++) {
                const token = this.#tokens[i];
                tokens.push(`${token.type}:${token.text}`);
            }
            return `<TokenString ${tokens.join(" ")}>`;
        }
    }
    function lex(text) {
        const tokens = [];
        const throwError = (message) => {
            const token = (offset < text.length) ? JSON.stringify(text[offset]) : "$EOI";
            throw new Error(`invalid token ${token} at ${offset}: ${message}`);
        };
        let brackets = [];
        let commas = [];
        let offset = 0;
        while (offset < text.length) {
            // Strip off any leading whitespace
            let cur = text.substring(offset);
            let match = cur.match(regexWhitespacePrefix);
            if (match) {
                offset += match[1].length;
                cur = text.substring(offset);
            }
            const token = { depth: brackets.length, linkBack: -1, linkNext: -1, match: -1, type: "", text: "", offset, value: -1 };
            tokens.push(token);
            let type = (SimpleTokens[cur[0]] || "");
            if (type) {
                token.type = type;
                token.text = cur[0];
                offset++;
                if (type === "OPEN_PAREN") {
                    brackets.push(tokens.length - 1);
                    commas.push(tokens.length - 1);
                }
                else if (type == "CLOSE_PAREN") {
                    if (brackets.length === 0) {
                        throwError("no matching open bracket");
                    }
                    token.match = brackets.pop();
                    (tokens[token.match]).match = tokens.length - 1;
                    token.depth--;
                    token.linkBack = commas.pop();
                    (tokens[token.linkBack]).linkNext = tokens.length - 1;
                }
                else if (type === "COMMA") {
                    token.linkBack = commas.pop();
                    (tokens[token.linkBack]).linkNext = tokens.length - 1;
                    commas.push(tokens.length - 1);
                }
                else if (type === "OPEN_BRACKET") {
                    token.type = "BRACKET";
                }
                else if (type === "CLOSE_BRACKET") {
                    // Remove the CLOSE_BRACKET
                    let suffix = tokens.pop().text;
                    if (tokens.length > 0 && tokens[tokens.length - 1].type === "NUMBER") {
                        const value = tokens.pop().text;
                        suffix = value + suffix;
                        (tokens[tokens.length - 1]).value = getNumber(value);
                    }
                    if (tokens.length === 0 || tokens[tokens.length - 1].type !== "BRACKET") {
                        throw new Error("missing opening bracket");
                    }
                    (tokens[tokens.length - 1]).text += suffix;
                }
                continue;
            }
            match = cur.match(regexIdPrefix);
            if (match) {
                token.text = match[1];
                offset += token.text.length;
                if (Keywords.has(token.text)) {
                    token.type = "KEYWORD";
                    continue;
                }
                if (token.text.match(regexType)) {
                    token.type = "TYPE";
                    continue;
                }
                token.type = "ID";
                continue;
            }
            match = cur.match(regexNumberPrefix);
            if (match) {
                token.text = match[1];
                token.type = "NUMBER";
                offset += token.text.length;
                continue;
            }
            throw new Error(`unexpected token ${JSON.stringify(cur[0])} at position ${offset}`);
        }
        return new TokenString(tokens.map((t) => Object.freeze(t)));
    }
    // Check only one of `allowed` is in `set`
    function allowSingle(set, allowed) {
        let included = [];
        for (const key in allowed.keys()) {
            if (set.has(key)) {
                included.push(key);
            }
        }
        if (included.length > 1) {
            throw new Error(`conflicting types: ${included.join(", ")}`);
        }
    }
    // Functions to process a Solidity Signature TokenString from left-to-right for...
    // ...the name with an optional type, returning the name
    function consumeName(type, tokens) {
        if (tokens.peekKeyword(KwTypes)) {
            const keyword = tokens.pop().text;
            if (keyword !== type) {
                throw new Error(`expected ${type}, got ${keyword}`);
            }
        }
        return tokens.popType("ID");
    }
    // ...all keywords matching allowed, returning the keywords
    function consumeKeywords(tokens, allowed) {
        const keywords = new Set();
        while (true) {
            const keyword = tokens.peekType("KEYWORD");
            if (keyword == null || (allowed && !allowed.has(keyword))) {
                break;
            }
            tokens.pop();
            if (keywords.has(keyword)) {
                throw new Error(`duplicate keywords: ${JSON.stringify(keyword)}`);
            }
            keywords.add(keyword);
        }
        return Object.freeze(keywords);
    }
    // ...all visibility keywords, returning the coalesced mutability
    function consumeMutability(tokens) {
        let modifiers = consumeKeywords(tokens, KwVisib);
        // Detect conflicting modifiers
        allowSingle(modifiers, setify("constant payable nonpayable".split(" ")));
        allowSingle(modifiers, setify("pure view payable nonpayable".split(" ")));
        // Process mutability states
        if (modifiers.has("view")) {
            return "view";
        }
        if (modifiers.has("pure")) {
            return "pure";
        }
        if (modifiers.has("payable")) {
            return "payable";
        }
        if (modifiers.has("nonpayable")) {
            return "nonpayable";
        }
        // Process legacy `constant` last
        if (modifiers.has("constant")) {
            return "view";
        }
        return "nonpayable";
    }
    // ...a parameter list, returning the ParamType list
    function consumeParams(tokens, allowIndexed) {
        return tokens.popParams().map((t) => ParamType.from(t, allowIndexed));
    }
    // ...a gas limit, returning a BigNumber or null if none
    function consumeGas(tokens) {
        if (tokens.peekType("AT")) {
            tokens.pop();
            if (tokens.peekType("NUMBER")) {
                return getBigInt(tokens.pop().text);
            }
            throw new Error("invalid gas");
        }
        return null;
    }
    function consumeEoi(tokens) {
        if (tokens.length) {
            throw new Error(`unexpected tokens: ${tokens.toString()}`);
        }
    }
    const regexArrayType = new RegExp(/^(.*)\[([0-9]*)\]$/);
    function verifyBasicType(type) {
        const match = type.match(regexType);
        assertArgument(match, "invalid type", "type", type);
        if (type === "uint") {
            return "uint256";
        }
        if (type === "int") {
            return "int256";
        }
        if (match[2]) {
            // bytesXX
            const length = parseInt(match[2]);
            assertArgument(length !== 0 && length <= 32, "invalid bytes length", "type", type);
        }
        else if (match[3]) {
            // intXX or uintXX
            const size = parseInt(match[3]);
            assertArgument(size !== 0 && size <= 256 && (size % 8) === 0, "invalid numeric width", "type", type);
        }
        return type;
    }
    // Make the Fragment constructors effectively private
    const _guard$2 = {};
    const internal$1 = Symbol.for("_ethers_internal");
    const ParamTypeInternal = "_ParamTypeInternal";
    const ErrorFragmentInternal = "_ErrorInternal";
    const EventFragmentInternal = "_EventInternal";
    const ConstructorFragmentInternal = "_ConstructorInternal";
    const FallbackFragmentInternal = "_FallbackInternal";
    const FunctionFragmentInternal = "_FunctionInternal";
    const StructFragmentInternal = "_StructInternal";
    /**
     *  Each input and output of a [[Fragment]] is an Array of **ParamType**.
     */
    class ParamType {
        /**
         *  The local name of the parameter (or ``""`` if unbound)
         */
        name;
        /**
         *  The fully qualified type (e.g. ``"address"``, ``"tuple(address)"``,
         *  ``"uint256[3][]"``)
         */
        type;
        /**
         *  The base type (e.g. ``"address"``, ``"tuple"``, ``"array"``)
         */
        baseType;
        /**
         *  True if the parameters is indexed.
         *
         *  For non-indexable types this is ``null``.
         */
        indexed;
        /**
         *  The components for the tuple.
         *
         *  For non-tuple types this is ``null``.
         */
        components;
        /**
         *  The array length, or ``-1`` for dynamic-lengthed arrays.
         *
         *  For non-array types this is ``null``.
         */
        arrayLength;
        /**
         *  The type of each child in the array.
         *
         *  For non-array types this is ``null``.
         */
        arrayChildren;
        /**
         *  @private
         */
        constructor(guard, name, type, baseType, indexed, components, arrayLength, arrayChildren) {
            assertPrivate(guard, _guard$2, "ParamType");
            Object.defineProperty(this, internal$1, { value: ParamTypeInternal });
            if (components) {
                components = Object.freeze(components.slice());
            }
            if (baseType === "array") {
                if (arrayLength == null || arrayChildren == null) {
                    throw new Error("");
                }
            }
            else if (arrayLength != null || arrayChildren != null) {
                throw new Error("");
            }
            if (baseType === "tuple") {
                if (components == null) {
                    throw new Error("");
                }
            }
            else if (components != null) {
                throw new Error("");
            }
            defineProperties(this, {
                name, type, baseType, indexed, components, arrayLength, arrayChildren
            });
        }
        /**
         *  Return a string representation of this type.
         *
         *  For example,
         *
         *  ``sighash" => "(uint256,address)"``
         *
         *  ``"minimal" => "tuple(uint256,address) indexed"``
         *
         *  ``"full" => "tuple(uint256 foo, address bar) indexed baz"``
         */
        format(format) {
            if (format == null) {
                format = "sighash";
            }
            if (format === "json") {
                const name = this.name || "";
                if (this.isArray()) {
                    const result = JSON.parse(this.arrayChildren.format("json"));
                    result.name = name;
                    result.type += `[${(this.arrayLength < 0 ? "" : String(this.arrayLength))}]`;
                    return JSON.stringify(result);
                }
                const result = {
                    type: ((this.baseType === "tuple") ? "tuple" : this.type),
                    name
                };
                if (typeof (this.indexed) === "boolean") {
                    result.indexed = this.indexed;
                }
                if (this.isTuple()) {
                    result.components = this.components.map((c) => JSON.parse(c.format(format)));
                }
                return JSON.stringify(result);
            }
            let result = "";
            // Array
            if (this.isArray()) {
                result += this.arrayChildren.format(format);
                result += `[${(this.arrayLength < 0 ? "" : String(this.arrayLength))}]`;
            }
            else {
                if (this.isTuple()) {
                    result += "(" + this.components.map((comp) => comp.format(format)).join((format === "full") ? ", " : ",") + ")";
                }
                else {
                    result += this.type;
                }
            }
            if (format !== "sighash") {
                if (this.indexed === true) {
                    result += " indexed";
                }
                if (format === "full" && this.name) {
                    result += " " + this.name;
                }
            }
            return result;
        }
        /**
         *  Returns true if %%this%% is an Array type.
         *
         *  This provides a type gaurd ensuring that [[arrayChildren]]
         *  and [[arrayLength]] are non-null.
         */
        isArray() {
            return (this.baseType === "array");
        }
        /**
         *  Returns true if %%this%% is a Tuple type.
         *
         *  This provides a type gaurd ensuring that [[components]]
         *  is non-null.
         */
        isTuple() {
            return (this.baseType === "tuple");
        }
        /**
         *  Returns true if %%this%% is an Indexable type.
         *
         *  This provides a type gaurd ensuring that [[indexed]]
         *  is non-null.
         */
        isIndexable() {
            return (this.indexed != null);
        }
        /**
         *  Walks the **ParamType** with %%value%%, calling %%process%%
         *  on each type, destructing the %%value%% recursively.
         */
        walk(value, process) {
            if (this.isArray()) {
                if (!Array.isArray(value)) {
                    throw new Error("invalid array value");
                }
                if (this.arrayLength !== -1 && value.length !== this.arrayLength) {
                    throw new Error("array is wrong length");
                }
                const _this = this;
                return value.map((v) => (_this.arrayChildren.walk(v, process)));
            }
            if (this.isTuple()) {
                if (!Array.isArray(value)) {
                    throw new Error("invalid tuple value");
                }
                if (value.length !== this.components.length) {
                    throw new Error("array is wrong length");
                }
                const _this = this;
                return value.map((v, i) => (_this.components[i].walk(v, process)));
            }
            return process(this.type, value);
        }
        #walkAsync(promises, value, process, setValue) {
            if (this.isArray()) {
                if (!Array.isArray(value)) {
                    throw new Error("invalid array value");
                }
                if (this.arrayLength !== -1 && value.length !== this.arrayLength) {
                    throw new Error("array is wrong length");
                }
                const childType = this.arrayChildren;
                const result = value.slice();
                result.forEach((value, index) => {
                    childType.#walkAsync(promises, value, process, (value) => {
                        result[index] = value;
                    });
                });
                setValue(result);
                return;
            }
            if (this.isTuple()) {
                const components = this.components;
                // Convert the object into an array
                let result;
                if (Array.isArray(value)) {
                    result = value.slice();
                }
                else {
                    if (value == null || typeof (value) !== "object") {
                        throw new Error("invalid tuple value");
                    }
                    result = components.map((param) => {
                        if (!param.name) {
                            throw new Error("cannot use object value with unnamed components");
                        }
                        if (!(param.name in value)) {
                            throw new Error(`missing value for component ${param.name}`);
                        }
                        return value[param.name];
                    });
                }
                if (result.length !== this.components.length) {
                    throw new Error("array is wrong length");
                }
                result.forEach((value, index) => {
                    components[index].#walkAsync(promises, value, process, (value) => {
                        result[index] = value;
                    });
                });
                setValue(result);
                return;
            }
            const result = process(this.type, value);
            if (result.then) {
                promises.push((async function () { setValue(await result); })());
            }
            else {
                setValue(result);
            }
        }
        /**
         *  Walks the **ParamType** with %%value%%, asynchronously calling
         *  %%process%% on each type, destructing the %%value%% recursively.
         *
         *  This can be used to resolve ENS naes by walking and resolving each
         *  ``"address"`` type.
         */
        async walkAsync(value, process) {
            const promises = [];
            const result = [value];
            this.#walkAsync(promises, value, process, (value) => {
                result[0] = value;
            });
            if (promises.length) {
                await Promise.all(promises);
            }
            return result[0];
        }
        /**
         *  Creates a new **ParamType** for %%obj%%.
         *
         *  If %%allowIndexed%% then the ``indexed`` keyword is permitted,
         *  otherwise the ``indexed`` keyword will throw an error.
         */
        static from(obj, allowIndexed) {
            if (ParamType.isParamType(obj)) {
                return obj;
            }
            if (typeof (obj) === "string") {
                try {
                    return ParamType.from(lex(obj), allowIndexed);
                }
                catch (error) {
                    assertArgument(false, "invalid param type", "obj", obj);
                }
            }
            else if (obj instanceof TokenString) {
                let type = "", baseType = "";
                let comps = null;
                if (consumeKeywords(obj, setify(["tuple"])).has("tuple") || obj.peekType("OPEN_PAREN")) {
                    // Tuple
                    baseType = "tuple";
                    comps = obj.popParams().map((t) => ParamType.from(t));
                    type = `tuple(${comps.map((c) => c.format()).join(",")})`;
                }
                else {
                    // Normal
                    type = verifyBasicType(obj.popType("TYPE"));
                    baseType = type;
                }
                // Check for Array
                let arrayChildren = null;
                let arrayLength = null;
                while (obj.length && obj.peekType("BRACKET")) {
                    const bracket = obj.pop(); //arrays[i];
                    arrayChildren = new ParamType(_guard$2, "", type, baseType, null, comps, arrayLength, arrayChildren);
                    arrayLength = bracket.value;
                    type += bracket.text;
                    baseType = "array";
                    comps = null;
                }
                let indexed = null;
                const keywords = consumeKeywords(obj, KwModifiers);
                if (keywords.has("indexed")) {
                    if (!allowIndexed) {
                        throw new Error("");
                    }
                    indexed = true;
                }
                const name = (obj.peekType("ID") ? obj.pop().text : "");
                if (obj.length) {
                    throw new Error("leftover tokens");
                }
                return new ParamType(_guard$2, name, type, baseType, indexed, comps, arrayLength, arrayChildren);
            }
            const name = obj.name;
            assertArgument(!name || (typeof (name) === "string" && name.match(regexId)), "invalid name", "obj.name", name);
            let indexed = obj.indexed;
            if (indexed != null) {
                assertArgument(allowIndexed, "parameter cannot be indexed", "obj.indexed", obj.indexed);
                indexed = !!indexed;
            }
            let type = obj.type;
            let arrayMatch = type.match(regexArrayType);
            if (arrayMatch) {
                const arrayLength = parseInt(arrayMatch[2] || "-1");
                const arrayChildren = ParamType.from({
                    type: arrayMatch[1],
                    components: obj.components
                });
                return new ParamType(_guard$2, name || "", type, "array", indexed, null, arrayLength, arrayChildren);
            }
            if (type === "tuple" || type.startsWith("tuple(" /* fix: ) */) || type.startsWith("(" /* fix: ) */)) {
                const comps = (obj.components != null) ? obj.components.map((c) => ParamType.from(c)) : null;
                const tuple = new ParamType(_guard$2, name || "", type, "tuple", indexed, comps, null, null);
                // @TODO: use lexer to validate and normalize type
                return tuple;
            }
            type = verifyBasicType(obj.type);
            return new ParamType(_guard$2, name || "", type, type, indexed, null, null, null);
        }
        /**
         *  Returns true if %%value%% is a **ParamType**.
         */
        static isParamType(value) {
            return (value && value[internal$1] === ParamTypeInternal);
        }
    }
    /**
     *  An abstract class to represent An individual fragment from a parse ABI.
     */
    class Fragment {
        /**
         *  The type of the fragment.
         */
        type;
        /**
         *  The inputs for the fragment.
         */
        inputs;
        /**
         *  @private
         */
        constructor(guard, type, inputs) {
            assertPrivate(guard, _guard$2, "Fragment");
            inputs = Object.freeze(inputs.slice());
            defineProperties(this, { type, inputs });
        }
        /**
         *  Creates a new **Fragment** for %%obj%%, wich can be any supported
         *  ABI frgament type.
         */
        static from(obj) {
            if (typeof (obj) === "string") {
                // Try parsing JSON...
                try {
                    Fragment.from(JSON.parse(obj));
                }
                catch (e) { }
                // ...otherwise, use the human-readable lexer
                return Fragment.from(lex(obj));
            }
            if (obj instanceof TokenString) {
                // Human-readable ABI (already lexed)
                const type = obj.peekKeyword(KwTypes);
                switch (type) {
                    case "constructor": return ConstructorFragment.from(obj);
                    case "error": return ErrorFragment.from(obj);
                    case "event": return EventFragment.from(obj);
                    case "fallback":
                    case "receive":
                        return FallbackFragment.from(obj);
                    case "function": return FunctionFragment.from(obj);
                    case "struct": return StructFragment.from(obj);
                }
            }
            else if (typeof (obj) === "object") {
                // JSON ABI
                switch (obj.type) {
                    case "constructor": return ConstructorFragment.from(obj);
                    case "error": return ErrorFragment.from(obj);
                    case "event": return EventFragment.from(obj);
                    case "fallback":
                    case "receive":
                        return FallbackFragment.from(obj);
                    case "function": return FunctionFragment.from(obj);
                    case "struct": return StructFragment.from(obj);
                }
                assert(false, `unsupported type: ${obj.type}`, "UNSUPPORTED_OPERATION", {
                    operation: "Fragment.from"
                });
            }
            assertArgument(false, "unsupported frgament object", "obj", obj);
        }
        /**
         *  Returns true if %%value%% is a [[ConstructorFragment]].
         */
        static isConstructor(value) {
            return ConstructorFragment.isFragment(value);
        }
        /**
         *  Returns true if %%value%% is an [[ErrorFragment]].
         */
        static isError(value) {
            return ErrorFragment.isFragment(value);
        }
        /**
         *  Returns true if %%value%% is an [[EventFragment]].
         */
        static isEvent(value) {
            return EventFragment.isFragment(value);
        }
        /**
         *  Returns true if %%value%% is a [[FunctionFragment]].
         */
        static isFunction(value) {
            return FunctionFragment.isFragment(value);
        }
        /**
         *  Returns true if %%value%% is a [[StructFragment]].
         */
        static isStruct(value) {
            return StructFragment.isFragment(value);
        }
    }
    /**
     *  An abstract class to represent An individual fragment
     *  which has a name from a parse ABI.
     */
    class NamedFragment extends Fragment {
        /**
         *  The name of the fragment.
         */
        name;
        /**
         *  @private
         */
        constructor(guard, type, name, inputs) {
            super(guard, type, inputs);
            assertArgument(typeof (name) === "string" && name.match(regexId), "invalid identifier", "name", name);
            inputs = Object.freeze(inputs.slice());
            defineProperties(this, { name });
        }
    }
    function joinParams(format, params) {
        return "(" + params.map((p) => p.format(format)).join((format === "full") ? ", " : ",") + ")";
    }
    /**
     *  A Fragment which represents a //Custom Error//.
     */
    class ErrorFragment extends NamedFragment {
        /**
         *  @private
         */
        constructor(guard, name, inputs) {
            super(guard, "error", name, inputs);
            Object.defineProperty(this, internal$1, { value: ErrorFragmentInternal });
        }
        /**
         *  The Custom Error selector.
         */
        get selector() {
            return id(this.format("sighash")).substring(0, 10);
        }
        /**
         *  Returns a string representation of this fragment as %%format%%.
         */
        format(format) {
            if (format == null) {
                format = "sighash";
            }
            if (format === "json") {
                return JSON.stringify({
                    type: "error",
                    name: this.name,
                    inputs: this.inputs.map((input) => JSON.parse(input.format(format))),
                });
            }
            const result = [];
            if (format !== "sighash") {
                result.push("error");
            }
            result.push(this.name + joinParams(format, this.inputs));
            return result.join(" ");
        }
        /**
         *  Returns a new **ErrorFragment** for %%obj%%.
         */
        static from(obj) {
            if (ErrorFragment.isFragment(obj)) {
                return obj;
            }
            if (typeof (obj) === "string") {
                return ErrorFragment.from(lex(obj));
            }
            else if (obj instanceof TokenString) {
                const name = consumeName("error", obj);
                const inputs = consumeParams(obj);
                consumeEoi(obj);
                return new ErrorFragment(_guard$2, name, inputs);
            }
            return new ErrorFragment(_guard$2, obj.name, obj.inputs ? obj.inputs.map(ParamType.from) : []);
        }
        /**
         *  Returns ``true`` and provides a type guard if %%value%% is an
         *  **ErrorFragment**.
         */
        static isFragment(value) {
            return (value && value[internal$1] === ErrorFragmentInternal);
        }
    }
    /**
     *  A Fragment which represents an Event.
     */
    class EventFragment extends NamedFragment {
        /**
         *  Whether this event is anonymous.
         */
        anonymous;
        /**
         *  @private
         */
        constructor(guard, name, inputs, anonymous) {
            super(guard, "event", name, inputs);
            Object.defineProperty(this, internal$1, { value: EventFragmentInternal });
            defineProperties(this, { anonymous });
        }
        /**
         *  The Event topic hash.
         */
        get topicHash() {
            return id(this.format("sighash"));
        }
        /**
         *  Returns a string representation of this event as %%format%%.
         */
        format(format) {
            if (format == null) {
                format = "sighash";
            }
            if (format === "json") {
                return JSON.stringify({
                    type: "event",
                    anonymous: this.anonymous,
                    name: this.name,
                    inputs: this.inputs.map((i) => JSON.parse(i.format(format)))
                });
            }
            const result = [];
            if (format !== "sighash") {
                result.push("event");
            }
            result.push(this.name + joinParams(format, this.inputs));
            if (format !== "sighash" && this.anonymous) {
                result.push("anonymous");
            }
            return result.join(" ");
        }
        /**
         *  Return the topic hash for an event with %%name%% and %%params%%.
         */
        static getTopicHash(name, params) {
            params = (params || []).map((p) => ParamType.from(p));
            const fragment = new EventFragment(_guard$2, name, params, false);
            return fragment.topicHash;
        }
        /**
         *  Returns a new **EventFragment** for %%obj%%.
         */
        static from(obj) {
            if (EventFragment.isFragment(obj)) {
                return obj;
            }
            if (typeof (obj) === "string") {
                try {
                    return EventFragment.from(lex(obj));
                }
                catch (error) {
                    assertArgument(false, "invalid event fragment", "obj", obj);
                }
            }
            else if (obj instanceof TokenString) {
                const name = consumeName("event", obj);
                const inputs = consumeParams(obj, true);
                const anonymous = !!consumeKeywords(obj, setify(["anonymous"])).has("anonymous");
                consumeEoi(obj);
                return new EventFragment(_guard$2, name, inputs, anonymous);
            }
            return new EventFragment(_guard$2, obj.name, obj.inputs ? obj.inputs.map((p) => ParamType.from(p, true)) : [], !!obj.anonymous);
        }
        /**
         *  Returns ``true`` and provides a type guard if %%value%% is an
         *  **EventFragment**.
         */
        static isFragment(value) {
            return (value && value[internal$1] === EventFragmentInternal);
        }
    }
    /**
     *  A Fragment which represents a constructor.
     */
    class ConstructorFragment extends Fragment {
        /**
         *  Whether the constructor can receive an endowment.
         */
        payable;
        /**
         *  The recommended gas limit for deployment or ``null``.
         */
        gas;
        /**
         *  @private
         */
        constructor(guard, type, inputs, payable, gas) {
            super(guard, type, inputs);
            Object.defineProperty(this, internal$1, { value: ConstructorFragmentInternal });
            defineProperties(this, { payable, gas });
        }
        /**
         *  Returns a string representation of this constructor as %%format%%.
         */
        format(format) {
            assert(format != null && format !== "sighash", "cannot format a constructor for sighash", "UNSUPPORTED_OPERATION", { operation: "format(sighash)" });
            if (format === "json") {
                return JSON.stringify({
                    type: "constructor",
                    stateMutability: (this.payable ? "payable" : "undefined"),
                    payable: this.payable,
                    gas: ((this.gas != null) ? this.gas : undefined),
                    inputs: this.inputs.map((i) => JSON.parse(i.format(format)))
                });
            }
            const result = [`constructor${joinParams(format, this.inputs)}`];
            if (this.payable) {
                result.push("payable");
            }
            if (this.gas != null) {
                result.push(`@${this.gas.toString()}`);
            }
            return result.join(" ");
        }
        /**
         *  Returns a new **ConstructorFragment** for %%obj%%.
         */
        static from(obj) {
            if (ConstructorFragment.isFragment(obj)) {
                return obj;
            }
            if (typeof (obj) === "string") {
                try {
                    return ConstructorFragment.from(lex(obj));
                }
                catch (error) {
                    assertArgument(false, "invalid constuctor fragment", "obj", obj);
                }
            }
            else if (obj instanceof TokenString) {
                consumeKeywords(obj, setify(["constructor"]));
                const inputs = consumeParams(obj);
                const payable = !!consumeKeywords(obj, KwVisibDeploy).has("payable");
                const gas = consumeGas(obj);
                consumeEoi(obj);
                return new ConstructorFragment(_guard$2, "constructor", inputs, payable, gas);
            }
            return new ConstructorFragment(_guard$2, "constructor", obj.inputs ? obj.inputs.map(ParamType.from) : [], !!obj.payable, (obj.gas != null) ? obj.gas : null);
        }
        /**
         *  Returns ``true`` and provides a type guard if %%value%% is a
         *  **ConstructorFragment**.
         */
        static isFragment(value) {
            return (value && value[internal$1] === ConstructorFragmentInternal);
        }
    }
    /**
     *  A Fragment which represents a method.
     */
    class FallbackFragment extends Fragment {
        /**
         *  If the function can be sent value during invocation.
         */
        payable;
        constructor(guard, inputs, payable) {
            super(guard, "fallback", inputs);
            Object.defineProperty(this, internal$1, { value: FallbackFragmentInternal });
            defineProperties(this, { payable });
        }
        /**
         *  Returns a string representation of this fallback as %%format%%.
         */
        format(format) {
            const type = ((this.inputs.length === 0) ? "receive" : "fallback");
            if (format === "json") {
                const stateMutability = (this.payable ? "payable" : "nonpayable");
                return JSON.stringify({ type, stateMutability });
            }
            return `${type}()${this.payable ? " payable" : ""}`;
        }
        /**
         *  Returns a new **FallbackFragment** for %%obj%%.
         */
        static from(obj) {
            if (FallbackFragment.isFragment(obj)) {
                return obj;
            }
            if (typeof (obj) === "string") {
                try {
                    return FallbackFragment.from(lex(obj));
                }
                catch (error) {
                    assertArgument(false, "invalid fallback fragment", "obj", obj);
                }
            }
            else if (obj instanceof TokenString) {
                const errorObj = obj.toString();
                const topIsValid = obj.peekKeyword(setify(["fallback", "receive"]));
                assertArgument(topIsValid, "type must be fallback or receive", "obj", errorObj);
                const type = obj.popKeyword(setify(["fallback", "receive"]));
                // receive()
                if (type === "receive") {
                    const inputs = consumeParams(obj);
                    assertArgument(inputs.length === 0, `receive cannot have arguments`, "obj.inputs", inputs);
                    consumeKeywords(obj, setify(["payable"]));
                    consumeEoi(obj);
                    return new FallbackFragment(_guard$2, [], true);
                }
                // fallback() [payable]
                // fallback(bytes) [payable] returns (bytes)
                let inputs = consumeParams(obj);
                if (inputs.length) {
                    assertArgument(inputs.length === 1 && inputs[0].type === "bytes", "invalid fallback inputs", "obj.inputs", inputs.map((i) => i.format("minimal")).join(", "));
                }
                else {
                    inputs = [ParamType.from("bytes")];
                }
                const mutability = consumeMutability(obj);
                assertArgument(mutability === "nonpayable" || mutability === "payable", "fallback cannot be constants", "obj.stateMutability", mutability);
                if (consumeKeywords(obj, setify(["returns"])).has("returns")) {
                    const outputs = consumeParams(obj);
                    assertArgument(outputs.length === 1 && outputs[0].type === "bytes", "invalid fallback outputs", "obj.outputs", outputs.map((i) => i.format("minimal")).join(", "));
                }
                consumeEoi(obj);
                return new FallbackFragment(_guard$2, inputs, mutability === "payable");
            }
            if (obj.type === "receive") {
                return new FallbackFragment(_guard$2, [], true);
            }
            if (obj.type === "fallback") {
                const inputs = [ParamType.from("bytes")];
                const payable = (obj.stateMutability === "payable");
                return new FallbackFragment(_guard$2, inputs, payable);
            }
            assertArgument(false, "invalid fallback description", "obj", obj);
        }
        /**
         *  Returns ``true`` and provides a type guard if %%value%% is a
         *  **FallbackFragment**.
         */
        static isFragment(value) {
            return (value && value[internal$1] === FallbackFragmentInternal);
        }
    }
    /**
     *  A Fragment which represents a method.
     */
    class FunctionFragment extends NamedFragment {
        /**
         *  If the function is constant (e.g. ``pure`` or ``view`` functions).
         */
        constant;
        /**
         *  The returned types for the result of calling this function.
         */
        outputs;
        /**
         *  The state mutability (e.g. ``payable``, ``nonpayable``, ``view``
         *  or ``pure``)
         */
        stateMutability;
        /**
         *  If the function can be sent value during invocation.
         */
        payable;
        /**
         *  The recommended gas limit to send when calling this function.
         */
        gas;
        /**
         *  @private
         */
        constructor(guard, name, stateMutability, inputs, outputs, gas) {
            super(guard, "function", name, inputs);
            Object.defineProperty(this, internal$1, { value: FunctionFragmentInternal });
            outputs = Object.freeze(outputs.slice());
            const constant = (stateMutability === "view" || stateMutability === "pure");
            const payable = (stateMutability === "payable");
            defineProperties(this, { constant, gas, outputs, payable, stateMutability });
        }
        /**
         *  The Function selector.
         */
        get selector() {
            return id(this.format("sighash")).substring(0, 10);
        }
        /**
         *  Returns a string representation of this function as %%format%%.
         */
        format(format) {
            if (format == null) {
                format = "sighash";
            }
            if (format === "json") {
                return JSON.stringify({
                    type: "function",
                    name: this.name,
                    constant: this.constant,
                    stateMutability: ((this.stateMutability !== "nonpayable") ? this.stateMutability : undefined),
                    payable: this.payable,
                    gas: ((this.gas != null) ? this.gas : undefined),
                    inputs: this.inputs.map((i) => JSON.parse(i.format(format))),
                    outputs: this.outputs.map((o) => JSON.parse(o.format(format))),
                });
            }
            const result = [];
            if (format !== "sighash") {
                result.push("function");
            }
            result.push(this.name + joinParams(format, this.inputs));
            if (format !== "sighash") {
                if (this.stateMutability !== "nonpayable") {
                    result.push(this.stateMutability);
                }
                if (this.outputs && this.outputs.length) {
                    result.push("returns");
                    result.push(joinParams(format, this.outputs));
                }
                if (this.gas != null) {
                    result.push(`@${this.gas.toString()}`);
                }
            }
            return result.join(" ");
        }
        /**
         *  Return the selector for a function with %%name%% and %%params%%.
         */
        static getSelector(name, params) {
            params = (params || []).map((p) => ParamType.from(p));
            const fragment = new FunctionFragment(_guard$2, name, "view", params, [], null);
            return fragment.selector;
        }
        /**
         *  Returns a new **FunctionFragment** for %%obj%%.
         */
        static from(obj) {
            if (FunctionFragment.isFragment(obj)) {
                return obj;
            }
            if (typeof (obj) === "string") {
                try {
                    return FunctionFragment.from(lex(obj));
                }
                catch (error) {
                    assertArgument(false, "invalid function fragment", "obj", obj);
                }
            }
            else if (obj instanceof TokenString) {
                const name = consumeName("function", obj);
                const inputs = consumeParams(obj);
                const mutability = consumeMutability(obj);
                let outputs = [];
                if (consumeKeywords(obj, setify(["returns"])).has("returns")) {
                    outputs = consumeParams(obj);
                }
                const gas = consumeGas(obj);
                consumeEoi(obj);
                return new FunctionFragment(_guard$2, name, mutability, inputs, outputs, gas);
            }
            let stateMutability = obj.stateMutability;
            // Use legacy Solidity ABI logic if stateMutability is missing
            if (stateMutability == null) {
                stateMutability = "payable";
                if (typeof (obj.constant) === "boolean") {
                    stateMutability = "view";
                    if (!obj.constant) {
                        stateMutability = "payable";
                        if (typeof (obj.payable) === "boolean" && !obj.payable) {
                            stateMutability = "nonpayable";
                        }
                    }
                }
                else if (typeof (obj.payable) === "boolean" && !obj.payable) {
                    stateMutability = "nonpayable";
                }
            }
            // @TODO: verifyState for stateMutability (e.g. throw if
            //        payable: false but stateMutability is "nonpayable")
            return new FunctionFragment(_guard$2, obj.name, stateMutability, obj.inputs ? obj.inputs.map(ParamType.from) : [], obj.outputs ? obj.outputs.map(ParamType.from) : [], (obj.gas != null) ? obj.gas : null);
        }
        /**
         *  Returns ``true`` and provides a type guard if %%value%% is a
         *  **FunctionFragment**.
         */
        static isFragment(value) {
            return (value && value[internal$1] === FunctionFragmentInternal);
        }
    }
    /**
     *  A Fragment which represents a structure.
     */
    class StructFragment extends NamedFragment {
        /**
         *  @private
         */
        constructor(guard, name, inputs) {
            super(guard, "struct", name, inputs);
            Object.defineProperty(this, internal$1, { value: StructFragmentInternal });
        }
        /**
         *  Returns a string representation of this struct as %%format%%.
         */
        format() {
            throw new Error("@TODO");
        }
        /**
         *  Returns a new **StructFragment** for %%obj%%.
         */
        static from(obj) {
            if (typeof (obj) === "string") {
                try {
                    return StructFragment.from(lex(obj));
                }
                catch (error) {
                    assertArgument(false, "invalid struct fragment", "obj", obj);
                }
            }
            else if (obj instanceof TokenString) {
                const name = consumeName("struct", obj);
                const inputs = consumeParams(obj);
                consumeEoi(obj);
                return new StructFragment(_guard$2, name, inputs);
            }
            return new StructFragment(_guard$2, obj.name, obj.inputs ? obj.inputs.map(ParamType.from) : []);
        }
        // @TODO: fix this return type
        /**
         *  Returns ``true`` and provides a type guard if %%value%% is a
         *  **StructFragment**.
         */
        static isFragment(value) {
            return (value && value[internal$1] === StructFragmentInternal);
        }
    }

    /**
     *  When sending values to or receiving values from a [[Contract]], the
     *  data is generally encoded using the [ABI standard](link-solc-abi).
     *
     *  The AbiCoder provides a utility to encode values to ABI data and
     *  decode values from ABI data.
     *
     *  Most of the time, developers should favour the [[Contract]] class,
     *  which further abstracts a lot of the finer details of ABI data.
     *
     *  @_section api/abi/abi-coder:ABI Encoding
     */
    // See: https://github.com/ethereum/wiki/wiki/Ethereum-Contract-ABI
    // https://docs.soliditylang.org/en/v0.8.17/control-structures.html
    const PanicReasons$1 = new Map();
    PanicReasons$1.set(0x00, "GENERIC_PANIC");
    PanicReasons$1.set(0x01, "ASSERT_FALSE");
    PanicReasons$1.set(0x11, "OVERFLOW");
    PanicReasons$1.set(0x12, "DIVIDE_BY_ZERO");
    PanicReasons$1.set(0x21, "ENUM_RANGE_ERROR");
    PanicReasons$1.set(0x22, "BAD_STORAGE_DATA");
    PanicReasons$1.set(0x31, "STACK_UNDERFLOW");
    PanicReasons$1.set(0x32, "ARRAY_RANGE_ERROR");
    PanicReasons$1.set(0x41, "OUT_OF_MEMORY");
    PanicReasons$1.set(0x51, "UNINITIALIZED_FUNCTION_CALL");
    const paramTypeBytes = new RegExp(/^bytes([0-9]*)$/);
    const paramTypeNumber = new RegExp(/^(u?int)([0-9]*)$/);
    let defaultCoder = null;
    function getBuiltinCallException(action, tx, data, abiCoder) {
        let message = "missing revert data";
        let reason = null;
        const invocation = null;
        let revert = null;
        if (data) {
            message = "execution reverted";
            const bytes = getBytes(data);
            data = hexlify(data);
            if (bytes.length === 0) {
                message += " (no data present; likely require(false) occurred";
                reason = "require(false)";
            }
            else if (bytes.length % 32 !== 4) {
                message += " (could not decode reason; invalid data length)";
            }
            else if (hexlify(bytes.slice(0, 4)) === "0x08c379a0") {
                // Error(string)
                try {
                    reason = abiCoder.decode(["string"], bytes.slice(4))[0];
                    revert = {
                        signature: "Error(string)",
                        name: "Error",
                        args: [reason]
                    };
                    message += `: ${JSON.stringify(reason)}`;
                }
                catch (error) {
                    message += " (could not decode reason; invalid string data)";
                }
            }
            else if (hexlify(bytes.slice(0, 4)) === "0x4e487b71") {
                // Panic(uint256)
                try {
                    const code = Number(abiCoder.decode(["uint256"], bytes.slice(4))[0]);
                    revert = {
                        signature: "Panic(uint256)",
                        name: "Panic",
                        args: [code]
                    };
                    reason = `Panic due to ${PanicReasons$1.get(code) || "UNKNOWN"}(${code})`;
                    message += `: ${reason}`;
                }
                catch (error) {
                    message += " (could not decode panic code)";
                }
            }
            else {
                message += " (unknown custom error)";
            }
        }
        const transaction = {
            to: (tx.to ? getAddress(tx.to) : null),
            data: (tx.data || "0x")
        };
        if (tx.from) {
            transaction.from = getAddress(tx.from);
        }
        return makeError(message, "CALL_EXCEPTION", {
            action, data, reason, transaction, invocation, revert
        });
    }
    /**
     *  The **AbiCoder** is a low-level class responsible for encoding JavaScript
     *  values into binary data and decoding binary data into JavaScript values.
     */
    class AbiCoder {
        #getCoder(param) {
            if (param.isArray()) {
                return new ArrayCoder(this.#getCoder(param.arrayChildren), param.arrayLength, param.name);
            }
            if (param.isTuple()) {
                return new TupleCoder(param.components.map((c) => this.#getCoder(c)), param.name);
            }
            switch (param.baseType) {
                case "address":
                    return new AddressCoder(param.name);
                case "bool":
                    return new BooleanCoder(param.name);
                case "string":
                    return new StringCoder(param.name);
                case "bytes":
                    return new BytesCoder(param.name);
                case "":
                    return new NullCoder(param.name);
            }
            // u?int[0-9]*
            let match = param.type.match(paramTypeNumber);
            if (match) {
                let size = parseInt(match[2] || "256");
                assertArgument(size !== 0 && size <= 256 && (size % 8) === 0, "invalid " + match[1] + " bit length", "param", param);
                return new NumberCoder(size / 8, (match[1] === "int"), param.name);
            }
            // bytes[0-9]+
            match = param.type.match(paramTypeBytes);
            if (match) {
                let size = parseInt(match[1]);
                assertArgument(size !== 0 && size <= 32, "invalid bytes length", "param", param);
                return new FixedBytesCoder(size, param.name);
            }
            assertArgument(false, "invalid type", "type", param.type);
        }
        /**
         *  Get the default values for the given %%types%%.
         *
         *  For example, a ``uint`` is by default ``0`` and ``bool``
         *  is by default ``false``.
         */
        getDefaultValue(types) {
            const coders = types.map((type) => this.#getCoder(ParamType.from(type)));
            const coder = new TupleCoder(coders, "_");
            return coder.defaultValue();
        }
        /**
         *  Encode the %%values%% as the %%types%% into ABI data.
         *
         *  @returns DataHexstring
         */
        encode(types, values) {
            assertArgumentCount(values.length, types.length, "types/values length mismatch");
            const coders = types.map((type) => this.#getCoder(ParamType.from(type)));
            const coder = (new TupleCoder(coders, "_"));
            const writer = new Writer();
            coder.encode(writer, values);
            return writer.data;
        }
        /**
         *  Decode the ABI %%data%% as the %%types%% into values.
         *
         *  If %%loose%% decoding is enabled, then strict padding is
         *  not enforced. Some older versions of Solidity incorrectly
         *  padded event data emitted from ``external`` functions.
         */
        decode(types, data, loose) {
            const coders = types.map((type) => this.#getCoder(ParamType.from(type)));
            const coder = new TupleCoder(coders, "_");
            return coder.decode(new Reader(data, loose));
        }
        /**
         *  Returns the shared singleton instance of a default [[AbiCoder]].
         *
         *  On the first call, the instance is created internally.
         */
        static defaultAbiCoder() {
            if (defaultCoder == null) {
                defaultCoder = new AbiCoder();
            }
            return defaultCoder;
        }
        /**
         *  Returns an ethers-compatible [[CallExceptionError]] Error for the given
         *  result %%data%% for the [[CallExceptionAction]] %%action%% against
         *  the Transaction %%tx%%.
         */
        static getBuiltinCallException(action, tx, data) {
            return getBuiltinCallException(action, tx, data, AbiCoder.defaultAbiCoder());
        }
    }

    /**
     *  About bytes32 strings...
     *
     *  @_docloc: api/utils:Bytes32 Strings
     */
    /**
     *  Encodes %%text%% as a Bytes32 string.
     */
    function encodeBytes32String(text) {
        // Get the bytes
        const bytes = toUtf8Bytes(text);
        // Check we have room for null-termination
        if (bytes.length > 31) {
            throw new Error("bytes32 string must be less than 32 bytes");
        }
        // Zero-pad (implicitly null-terminates)
        return zeroPadBytes(bytes, 32);
    }
    /**
     *  Encodes the Bytes32-encoded %%bytes%% into a string.
     */
    function decodeBytes32String(_bytes) {
        const data = getBytes(_bytes, "bytes");
        // Must be 32 bytes with a null-termination
        if (data.length !== 32) {
            throw new Error("invalid bytes32 - not 32 bytes long");
        }
        if (data[31] !== 0) {
            throw new Error("invalid bytes32 string - no null terminator");
        }
        // Find the null termination
        let length = 31;
        while (data[length - 1] === 0) {
            length--;
        }
        // Determine the string value
        return toUtf8String(data.slice(0, length));
    }

    /**
     *  The Interface class is a low-level class that accepts an
     *  ABI and provides all the necessary functionality to encode
     *  and decode paramaters to and results from methods, events
     *  and errors.
     *
     *  It also provides several convenience methods to automatically
     *  search and find matching transactions and events to parse them.
     *
     *  @_subsection api/abi:Interfaces  [interfaces]
     */
    /**
     *  When using the [[Interface-parseLog]] to automatically match a Log to its event
     *  for parsing, a **LogDescription** is returned.
     */
    class LogDescription {
        /**
         *  The matching fragment for the ``topic0``.
         */
        fragment;
        /**
         *  The name of the Event.
         */
        name;
        /**
         *  The full Event signature.
         */
        signature;
        /**
         *  The topic hash for the Event.
         */
        topic;
        /**
         *  The arguments passed into the Event with ``emit``.
         */
        args;
        /**
         *  @_ignore:
         */
        constructor(fragment, topic, args) {
            const name = fragment.name, signature = fragment.format();
            defineProperties(this, {
                fragment, name, signature, topic, args
            });
        }
    }
    /**
     *  When using the [[Interface-parseTransaction]] to automatically match
     *  a transaction data to its function for parsing,
     *  a **TransactionDescription** is returned.
     */
    class TransactionDescription {
        /**
         *  The matching fragment from the transaction ``data``.
         */
        fragment;
        /**
         *  The name of the Function from the transaction ``data``.
         */
        name;
        /**
         *  The arguments passed to the Function from the transaction ``data``.
         */
        args;
        /**
         *  The full Function signature from the transaction ``data``.
         */
        signature;
        /**
         *  The selector for the Function from the transaction ``data``.
         */
        selector;
        /**
         *  The ``value`` (in wei) from the transaction.
         */
        value;
        /**
         *  @_ignore:
         */
        constructor(fragment, selector, args, value) {
            const name = fragment.name, signature = fragment.format();
            defineProperties(this, {
                fragment, name, args, signature, selector, value
            });
        }
    }
    /**
     *  When using the [[Interface-parseError]] to automatically match an
     *  error for a call result for parsing, an **ErrorDescription** is returned.
     */
    class ErrorDescription {
        /**
         *  The matching fragment.
         */
        fragment;
        /**
         *  The name of the Error.
         */
        name;
        /**
         *  The arguments passed to the Error with ``revert``.
         */
        args;
        /**
         *  The full Error signature.
         */
        signature;
        /**
         *  The selector for the Error.
         */
        selector;
        /**
         *  @_ignore:
         */
        constructor(fragment, selector, args) {
            const name = fragment.name, signature = fragment.format();
            defineProperties(this, {
                fragment, name, args, signature, selector
            });
        }
    }
    /**
     *  An **Indexed** is used as a value when a value that does not
     *  fit within a topic (i.e. not a fixed-length, 32-byte type). It
     *  is the ``keccak256`` of the value, and used for types such as
     *  arrays, tuples, bytes and strings.
     */
    class Indexed {
        /**
         *  The ``keccak256`` of the value logged.
         */
        hash;
        /**
         *  @_ignore:
         */
        _isIndexed;
        /**
         *  Returns ``true`` if %%value%% is an **Indexed**.
         *
         *  This provides a Type Guard for property access.
         */
        static isIndexed(value) {
            return !!(value && value._isIndexed);
        }
        /**
         *  @_ignore:
         */
        constructor(hash) {
            defineProperties(this, { hash, _isIndexed: true });
        }
    }
    // https://docs.soliditylang.org/en/v0.8.13/control-structures.html?highlight=panic#panic-via-assert-and-error-via-require
    const PanicReasons = {
        "0": "generic panic",
        "1": "assert(false)",
        "17": "arithmetic overflow",
        "18": "division or modulo by zero",
        "33": "enum overflow",
        "34": "invalid encoded storage byte array accessed",
        "49": "out-of-bounds array access; popping on an empty array",
        "50": "out-of-bounds access of an array or bytesN",
        "65": "out of memory",
        "81": "uninitialized function",
    };
    const BuiltinErrors = {
        "0x08c379a0": {
            signature: "Error(string)",
            name: "Error",
            inputs: ["string"],
            reason: (message) => {
                return `reverted with reason string ${JSON.stringify(message)}`;
            }
        },
        "0x4e487b71": {
            signature: "Panic(uint256)",
            name: "Panic",
            inputs: ["uint256"],
            reason: (code) => {
                let reason = "unknown panic code";
                if (code >= 0 && code <= 0xff && PanicReasons[code.toString()]) {
                    reason = PanicReasons[code.toString()];
                }
                return `reverted with panic code 0x${code.toString(16)} (${reason})`;
            }
        }
    };
    /**
     *  An Interface abstracts many of the low-level details for
     *  encoding and decoding the data on the blockchain.
     *
     *  An ABI provides information on how to encode data to send to
     *  a Contract, how to decode the results and events and how to
     *  interpret revert errors.
     *
     *  The ABI can be specified by [any supported format](InterfaceAbi).
     */
    class Interface {
        /**
         *  All the Contract ABI members (i.e. methods, events, errors, etc).
         */
        fragments;
        /**
         *  The Contract constructor.
         */
        deploy;
        /**
         *  The Fallback method, if any.
         */
        fallback;
        /**
         *  If receiving ether is supported.
         */
        receive;
        #errors;
        #events;
        #functions;
        //    #structs: Map<string, StructFragment>;
        #abiCoder;
        /**
         *  Create a new Interface for the %%fragments%%.
         */
        constructor(fragments) {
            let abi = [];
            if (typeof (fragments) === "string") {
                abi = JSON.parse(fragments);
            }
            else {
                abi = fragments;
            }
            this.#functions = new Map();
            this.#errors = new Map();
            this.#events = new Map();
            //        this.#structs = new Map();
            const frags = [];
            for (const a of abi) {
                try {
                    frags.push(Fragment.from(a));
                }
                catch (error) {
                    console.log("EE", error);
                }
            }
            defineProperties(this, {
                fragments: Object.freeze(frags)
            });
            let fallback = null;
            let receive = false;
            this.#abiCoder = this.getAbiCoder();
            // Add all fragments by their signature
            this.fragments.forEach((fragment, index) => {
                let bucket;
                switch (fragment.type) {
                    case "constructor":
                        if (this.deploy) {
                            console.log("duplicate definition - constructor");
                            return;
                        }
                        //checkNames(fragment, "input", fragment.inputs);
                        defineProperties(this, { deploy: fragment });
                        return;
                    case "fallback":
                        if (fragment.inputs.length === 0) {
                            receive = true;
                        }
                        else {
                            assertArgument(!fallback || fragment.payable !== fallback.payable, "conflicting fallback fragments", `fragments[${index}]`, fragment);
                            fallback = fragment;
                            receive = fallback.payable;
                        }
                        return;
                    case "function":
                        //checkNames(fragment, "input", fragment.inputs);
                        //checkNames(fragment, "output", (<FunctionFragment>fragment).outputs);
                        bucket = this.#functions;
                        break;
                    case "event":
                        //checkNames(fragment, "input", fragment.inputs);
                        bucket = this.#events;
                        break;
                    case "error":
                        bucket = this.#errors;
                        break;
                    default:
                        return;
                }
                // Two identical entries; ignore it
                const signature = fragment.format();
                if (bucket.has(signature)) {
                    return;
                }
                bucket.set(signature, fragment);
            });
            // If we do not have a constructor add a default
            if (!this.deploy) {
                defineProperties(this, {
                    deploy: ConstructorFragment.from("constructor()")
                });
            }
            defineProperties(this, { fallback, receive });
        }
        /**
         *  Returns the entire Human-Readable ABI, as an array of
         *  signatures, optionally as %%minimal%% strings, which
         *  removes parameter names and unneceesary spaces.
         */
        format(minimal) {
            const format = (minimal ? "minimal" : "full");
            const abi = this.fragments.map((f) => f.format(format));
            return abi;
        }
        /**
         *  Return the JSON-encoded ABI. This is the format Solidiy
         *  returns.
         */
        formatJson() {
            const abi = this.fragments.map((f) => f.format("json"));
            // We need to re-bundle the JSON fragments a bit
            return JSON.stringify(abi.map((j) => JSON.parse(j)));
        }
        /**
         *  The ABI coder that will be used to encode and decode binary
         *  data.
         */
        getAbiCoder() {
            return AbiCoder.defaultAbiCoder();
        }
        // Find a function definition by any means necessary (unless it is ambiguous)
        #getFunction(key, values, forceUnique) {
            // Selector
            if (isHexString(key)) {
                const selector = key.toLowerCase();
                for (const fragment of this.#functions.values()) {
                    if (selector === fragment.selector) {
                        return fragment;
                    }
                }
                return null;
            }
            // It is a bare name, look up the function (will return null if ambiguous)
            if (key.indexOf("(") === -1) {
                const matching = [];
                for (const [name, fragment] of this.#functions) {
                    if (name.split("(" /* fix:) */)[0] === key) {
                        matching.push(fragment);
                    }
                }
                if (values) {
                    const lastValue = (values.length > 0) ? values[values.length - 1] : null;
                    let valueLength = values.length;
                    let allowOptions = true;
                    if (Typed.isTyped(lastValue) && lastValue.type === "overrides") {
                        allowOptions = false;
                        valueLength--;
                    }
                    // Remove all matches that don't have a compatible length. The args
                    // may contain an overrides, so the match may have n or n - 1 parameters
                    for (let i = matching.length - 1; i >= 0; i--) {
                        const inputs = matching[i].inputs.length;
                        if (inputs !== valueLength && (!allowOptions || inputs !== valueLength - 1)) {
                            matching.splice(i, 1);
                        }
                    }
                    // Remove all matches that don't match the Typed signature
                    for (let i = matching.length - 1; i >= 0; i--) {
                        const inputs = matching[i].inputs;
                        for (let j = 0; j < values.length; j++) {
                            // Not a typed value
                            if (!Typed.isTyped(values[j])) {
                                continue;
                            }
                            // We are past the inputs
                            if (j >= inputs.length) {
                                if (values[j].type === "overrides") {
                                    continue;
                                }
                                matching.splice(i, 1);
                                break;
                            }
                            // Make sure the value type matches the input type
                            if (values[j].type !== inputs[j].baseType) {
                                matching.splice(i, 1);
                                break;
                            }
                        }
                    }
                }
                // We found a single matching signature with an overrides, but the
                // last value is something that cannot possibly be an options
                if (matching.length === 1 && values && values.length !== matching[0].inputs.length) {
                    const lastArg = values[values.length - 1];
                    if (lastArg == null || Array.isArray(lastArg) || typeof (lastArg) !== "object") {
                        matching.splice(0, 1);
                    }
                }
                if (matching.length === 0) {
                    return null;
                }
                if (matching.length > 1 && forceUnique) {
                    const matchStr = matching.map((m) => JSON.stringify(m.format())).join(", ");
                    assertArgument(false, `ambiguous function description (i.e. matches ${matchStr})`, "key", key);
                }
                return matching[0];
            }
            // Normalize the signature and lookup the function
            const result = this.#functions.get(FunctionFragment.from(key).format());
            if (result) {
                return result;
            }
            return null;
        }
        /**
         *  Get the function name for %%key%%, which may be a function selector,
         *  function name or function signature that belongs to the ABI.
         */
        getFunctionName(key) {
            const fragment = this.#getFunction(key, null, false);
            assertArgument(fragment, "no matching function", "key", key);
            return fragment.name;
        }
        /**
         *  Returns true if %%key%% (a function selector, function name or
         *  function signature) is present in the ABI.
         *
         *  In the case of a function name, the name may be ambiguous, so
         *  accessing the [[FunctionFragment]] may require refinement.
         */
        hasFunction(key) {
            return !!this.#getFunction(key, null, false);
        }
        /**
         *  Get the [[FunctionFragment]] for %%key%%, which may be a function
         *  selector, function name or function signature that belongs to the ABI.
         *
         *  If %%values%% is provided, it will use the Typed API to handle
         *  ambiguous cases where multiple functions match by name.
         *
         *  If the %%key%% and %%values%% do not refine to a single function in
         *  the ABI, this will throw.
         */
        getFunction(key, values) {
            return this.#getFunction(key, values || null, true);
        }
        /**
         *  Iterate over all functions, calling %%callback%%, sorted by their name.
         */
        forEachFunction(callback) {
            const names = Array.from(this.#functions.keys());
            names.sort((a, b) => a.localeCompare(b));
            for (let i = 0; i < names.length; i++) {
                const name = names[i];
                callback((this.#functions.get(name)), i);
            }
        }
        // Find an event definition by any means necessary (unless it is ambiguous)
        #getEvent(key, values, forceUnique) {
            // EventTopic
            if (isHexString(key)) {
                const eventTopic = key.toLowerCase();
                for (const fragment of this.#events.values()) {
                    if (eventTopic === fragment.topicHash) {
                        return fragment;
                    }
                }
                return null;
            }
            // It is a bare name, look up the function (will return null if ambiguous)
            if (key.indexOf("(") === -1) {
                const matching = [];
                for (const [name, fragment] of this.#events) {
                    if (name.split("(" /* fix:) */)[0] === key) {
                        matching.push(fragment);
                    }
                }
                if (values) {
                    // Remove all matches that don't have a compatible length.
                    for (let i = matching.length - 1; i >= 0; i--) {
                        if (matching[i].inputs.length < values.length) {
                            matching.splice(i, 1);
                        }
                    }
                    // Remove all matches that don't match the Typed signature
                    for (let i = matching.length - 1; i >= 0; i--) {
                        const inputs = matching[i].inputs;
                        for (let j = 0; j < values.length; j++) {
                            // Not a typed value
                            if (!Typed.isTyped(values[j])) {
                                continue;
                            }
                            // Make sure the value type matches the input type
                            if (values[j].type !== inputs[j].baseType) {
                                matching.splice(i, 1);
                                break;
                            }
                        }
                    }
                }
                if (matching.length === 0) {
                    return null;
                }
                if (matching.length > 1 && forceUnique) {
                    const matchStr = matching.map((m) => JSON.stringify(m.format())).join(", ");
                    assertArgument(false, `ambiguous event description (i.e. matches ${matchStr})`, "key", key);
                }
                return matching[0];
            }
            // Normalize the signature and lookup the function
            const result = this.#events.get(EventFragment.from(key).format());
            if (result) {
                return result;
            }
            return null;
        }
        /**
         *  Get the event name for %%key%%, which may be a topic hash,
         *  event name or event signature that belongs to the ABI.
         */
        getEventName(key) {
            const fragment = this.#getEvent(key, null, false);
            assertArgument(fragment, "no matching event", "key", key);
            return fragment.name;
        }
        /**
         *  Returns true if %%key%% (an event topic hash, event name or
         *  event signature) is present in the ABI.
         *
         *  In the case of an event name, the name may be ambiguous, so
         *  accessing the [[EventFragment]] may require refinement.
         */
        hasEvent(key) {
            return !!this.#getEvent(key, null, false);
        }
        /**
         *  Get the [[EventFragment]] for %%key%%, which may be a topic hash,
         *  event name or event signature that belongs to the ABI.
         *
         *  If %%values%% is provided, it will use the Typed API to handle
         *  ambiguous cases where multiple events match by name.
         *
         *  If the %%key%% and %%values%% do not refine to a single event in
         *  the ABI, this will throw.
         */
        getEvent(key, values) {
            return this.#getEvent(key, values || null, true);
        }
        /**
         *  Iterate over all events, calling %%callback%%, sorted by their name.
         */
        forEachEvent(callback) {
            const names = Array.from(this.#events.keys());
            names.sort((a, b) => a.localeCompare(b));
            for (let i = 0; i < names.length; i++) {
                const name = names[i];
                callback((this.#events.get(name)), i);
            }
        }
        /**
         *  Get the [[ErrorFragment]] for %%key%%, which may be an error
         *  selector, error name or error signature that belongs to the ABI.
         *
         *  If %%values%% is provided, it will use the Typed API to handle
         *  ambiguous cases where multiple errors match by name.
         *
         *  If the %%key%% and %%values%% do not refine to a single error in
         *  the ABI, this will throw.
         */
        getError(key, values) {
            if (isHexString(key)) {
                const selector = key.toLowerCase();
                if (BuiltinErrors[selector]) {
                    return ErrorFragment.from(BuiltinErrors[selector].signature);
                }
                for (const fragment of this.#errors.values()) {
                    if (selector === fragment.selector) {
                        return fragment;
                    }
                }
                return null;
            }
            // It is a bare name, look up the function (will return null if ambiguous)
            if (key.indexOf("(") === -1) {
                const matching = [];
                for (const [name, fragment] of this.#errors) {
                    if (name.split("(" /* fix:) */)[0] === key) {
                        matching.push(fragment);
                    }
                }
                if (matching.length === 0) {
                    if (key === "Error") {
                        return ErrorFragment.from("error Error(string)");
                    }
                    if (key === "Panic") {
                        return ErrorFragment.from("error Panic(uint256)");
                    }
                    return null;
                }
                else if (matching.length > 1) {
                    const matchStr = matching.map((m) => JSON.stringify(m.format())).join(", ");
                    assertArgument(false, `ambiguous error description (i.e. ${matchStr})`, "name", key);
                }
                return matching[0];
            }
            // Normalize the signature and lookup the function
            key = ErrorFragment.from(key).format();
            if (key === "Error(string)") {
                return ErrorFragment.from("error Error(string)");
            }
            if (key === "Panic(uint256)") {
                return ErrorFragment.from("error Panic(uint256)");
            }
            const result = this.#errors.get(key);
            if (result) {
                return result;
            }
            return null;
        }
        /**
         *  Iterate over all errors, calling %%callback%%, sorted by their name.
         */
        forEachError(callback) {
            const names = Array.from(this.#errors.keys());
            names.sort((a, b) => a.localeCompare(b));
            for (let i = 0; i < names.length; i++) {
                const name = names[i];
                callback((this.#errors.get(name)), i);
            }
        }
        // Get the 4-byte selector used by Solidity to identify a function
        /*
    getSelector(fragment: ErrorFragment | FunctionFragment): string {
        if (typeof(fragment) === "string") {
            const matches: Array<Fragment> = [ ];

            try { matches.push(this.getFunction(fragment)); } catch (error) { }
            try { matches.push(this.getError(<string>fragment)); } catch (_) { }

            if (matches.length === 0) {
                logger.throwArgumentError("unknown fragment", "key", fragment);
            } else if (matches.length > 1) {
                logger.throwArgumentError("ambiguous fragment matches function and error", "key", fragment);
            }

            fragment = matches[0];
        }

        return dataSlice(id(fragment.format()), 0, 4);
    }
        */
        // Get the 32-byte topic hash used by Solidity to identify an event
        /*
        getEventTopic(fragment: EventFragment): string {
            //if (typeof(fragment) === "string") { fragment = this.getEvent(eventFragment); }
            return id(fragment.format());
        }
        */
        _decodeParams(params, data) {
            return this.#abiCoder.decode(params, data);
        }
        _encodeParams(params, values) {
            return this.#abiCoder.encode(params, values);
        }
        /**
         *  Encodes a ``tx.data`` object for deploying the Contract with
         *  the %%values%% as the constructor arguments.
         */
        encodeDeploy(values) {
            return this._encodeParams(this.deploy.inputs, values || []);
        }
        /**
         *  Decodes the result %%data%% (e.g. from an ``eth_call``) for the
         *  specified error (see [[getError]] for valid values for
         *  %%key%%).
         *
         *  Most developers should prefer the [[parseCallResult]] method instead,
         *  which will automatically detect a ``CALL_EXCEPTION`` and throw the
         *  corresponding error.
         */
        decodeErrorResult(fragment, data) {
            if (typeof (fragment) === "string") {
                const f = this.getError(fragment);
                assertArgument(f, "unknown error", "fragment", fragment);
                fragment = f;
            }
            assertArgument(dataSlice(data, 0, 4) === fragment.selector, `data signature does not match error ${fragment.name}.`, "data", data);
            return this._decodeParams(fragment.inputs, dataSlice(data, 4));
        }
        /**
         *  Encodes the transaction revert data for a call result that
         *  reverted from the the Contract with the sepcified %%error%%
         *  (see [[getError]] for valid values for %%fragment%%) with the %%values%%.
         *
         *  This is generally not used by most developers, unless trying to mock
         *  a result from a Contract.
         */
        encodeErrorResult(fragment, values) {
            if (typeof (fragment) === "string") {
                const f = this.getError(fragment);
                assertArgument(f, "unknown error", "fragment", fragment);
                fragment = f;
            }
            return concat([
                fragment.selector,
                this._encodeParams(fragment.inputs, values || [])
            ]);
        }
        /**
         *  Decodes the %%data%% from a transaction ``tx.data`` for
         *  the function specified (see [[getFunction]] for valid values
         *  for %%fragment%%).
         *
         *  Most developers should prefer the [[parseTransaction]] method
         *  instead, which will automatically detect the fragment.
         */
        decodeFunctionData(fragment, data) {
            if (typeof (fragment) === "string") {
                const f = this.getFunction(fragment);
                assertArgument(f, "unknown function", "fragment", fragment);
                fragment = f;
            }
            assertArgument(dataSlice(data, 0, 4) === fragment.selector, `data signature does not match function ${fragment.name}.`, "data", data);
            return this._decodeParams(fragment.inputs, dataSlice(data, 4));
        }
        /**
         *  Encodes the ``tx.data`` for a transaction that calls the function
         *  specified (see [[getFunction]] for valid values for %%fragment%%) with
         *  the %%values%%.
         */
        encodeFunctionData(fragment, values) {
            if (typeof (fragment) === "string") {
                const f = this.getFunction(fragment);
                assertArgument(f, "unknown function", "fragment", fragment);
                fragment = f;
            }
            return concat([
                fragment.selector,
                this._encodeParams(fragment.inputs, values || [])
            ]);
        }
        /**
         *  Decodes the result %%data%% (e.g. from an ``eth_call``) for the
         *  specified function (see [[getFunction]] for valid values for
         *  %%key%%).
         *
         *  Most developers should prefer the [[parseCallResult]] method instead,
         *  which will automatically detect a ``CALL_EXCEPTION`` and throw the
         *  corresponding error.
         */
        decodeFunctionResult(fragment, data) {
            if (typeof (fragment) === "string") {
                const f = this.getFunction(fragment);
                assertArgument(f, "unknown function", "fragment", fragment);
                fragment = f;
            }
            let message = "invalid length for result data";
            const bytes = getBytesCopy(data);
            if ((bytes.length % 32) === 0) {
                try {
                    return this.#abiCoder.decode(fragment.outputs, bytes);
                }
                catch (error) {
                    message = "could not decode result data";
                }
            }
            // Call returned data with no error, but the data is junk
            assert(false, message, "BAD_DATA", {
                value: hexlify(bytes),
                info: { method: fragment.name, signature: fragment.format() }
            });
        }
        makeError(_data, tx) {
            const data = getBytes(_data, "data");
            const error = AbiCoder.getBuiltinCallException("call", tx, data);
            // Not a built-in error; try finding a custom error
            const customPrefix = "execution reverted (unknown custom error)";
            if (error.message.startsWith(customPrefix)) {
                const selector = hexlify(data.slice(0, 4));
                const ef = this.getError(selector);
                if (ef) {
                    try {
                        const args = this.#abiCoder.decode(ef.inputs, data.slice(4));
                        error.revert = {
                            name: ef.name, signature: ef.format(), args
                        };
                        error.reason = error.revert.signature;
                        error.message = `execution reverted: ${error.reason}`;
                    }
                    catch (e) {
                        error.message = `execution reverted (coult not decode custom error)`;
                    }
                }
            }
            // Add the invocation, if available
            const parsed = this.parseTransaction(tx);
            if (parsed) {
                error.invocation = {
                    method: parsed.name,
                    signature: parsed.signature,
                    args: parsed.args
                };
            }
            return error;
        }
        /**
         *  Encodes the result data (e.g. from an ``eth_call``) for the
         *  specified function (see [[getFunction]] for valid values
         *  for %%fragment%%) with %%values%%.
         *
         *  This is generally not used by most developers, unless trying to mock
         *  a result from a Contract.
         */
        encodeFunctionResult(fragment, values) {
            if (typeof (fragment) === "string") {
                const f = this.getFunction(fragment);
                assertArgument(f, "unknown function", "fragment", fragment);
                fragment = f;
            }
            return hexlify(this.#abiCoder.encode(fragment.outputs, values || []));
        }
        /*
            spelunk(inputs: Array<ParamType>, values: ReadonlyArray<any>, processfunc: (type: string, value: any) => Promise<any>): Promise<Array<any>> {
                const promises: Array<Promise<>> = [ ];
                const process = function(type: ParamType, value: any): any {
                    if (type.baseType === "array") {
                        return descend(type.child
                    }
                    if (type. === "address") {
                    }
                };
        
                const descend = function (inputs: Array<ParamType>, values: ReadonlyArray<any>) {
                    if (inputs.length !== values.length) { throw new Error("length mismatch"); }
                    
                };
        
                const result: Array<any> = [ ];
                values.forEach((value, index) => {
                    if (value == null) {
                        topics.push(null);
                    } else if (param.baseType === "array" || param.baseType === "tuple") {
                        logger.throwArgumentError("filtering with tuples or arrays not supported", ("contract." + param.name), value);
                    } else if (Array.isArray(value)) {
                        topics.push(value.map((value) => encodeTopic(param, value)));
                    } else {
                        topics.push(encodeTopic(param, value));
                    }
                });
            }
        */
        // Create the filter for the event with search criteria (e.g. for eth_filterLog)
        encodeFilterTopics(fragment, values) {
            if (typeof (fragment) === "string") {
                const f = this.getEvent(fragment);
                assertArgument(f, "unknown event", "eventFragment", fragment);
                fragment = f;
            }
            assert(values.length <= fragment.inputs.length, `too many arguments for ${fragment.format()}`, "UNEXPECTED_ARGUMENT", { count: values.length, expectedCount: fragment.inputs.length });
            const topics = [];
            if (!fragment.anonymous) {
                topics.push(fragment.topicHash);
            }
            // @TODO: Use the coders for this; to properly support tuples, etc.
            const encodeTopic = (param, value) => {
                if (param.type === "string") {
                    return id(value);
                }
                else if (param.type === "bytes") {
                    return keccak256(hexlify(value));
                }
                if (param.type === "bool" && typeof (value) === "boolean") {
                    value = (value ? "0x01" : "0x00");
                }
                else if (param.type.match(/^u?int/)) {
                    value = toBeHex(value); // @TODO: Should this toTwos??
                }
                else if (param.type.match(/^bytes/)) {
                    value = zeroPadBytes(value, 32);
                }
                else if (param.type === "address") {
                    // Check addresses are valid
                    this.#abiCoder.encode(["address"], [value]);
                }
                return zeroPadValue(hexlify(value), 32);
            };
            values.forEach((value, index) => {
                const param = fragment.inputs[index];
                if (!param.indexed) {
                    assertArgument(value == null, "cannot filter non-indexed parameters; must be null", ("contract." + param.name), value);
                    return;
                }
                if (value == null) {
                    topics.push(null);
                }
                else if (param.baseType === "array" || param.baseType === "tuple") {
                    assertArgument(false, "filtering with tuples or arrays not supported", ("contract." + param.name), value);
                }
                else if (Array.isArray(value)) {
                    topics.push(value.map((value) => encodeTopic(param, value)));
                }
                else {
                    topics.push(encodeTopic(param, value));
                }
            });
            // Trim off trailing nulls
            while (topics.length && topics[topics.length - 1] === null) {
                topics.pop();
            }
            return topics;
        }
        encodeEventLog(fragment, values) {
            if (typeof (fragment) === "string") {
                const f = this.getEvent(fragment);
                assertArgument(f, "unknown event", "eventFragment", fragment);
                fragment = f;
            }
            const topics = [];
            const dataTypes = [];
            const dataValues = [];
            if (!fragment.anonymous) {
                topics.push(fragment.topicHash);
            }
            assertArgument(values.length === fragment.inputs.length, "event arguments/values mismatch", "values", values);
            fragment.inputs.forEach((param, index) => {
                const value = values[index];
                if (param.indexed) {
                    if (param.type === "string") {
                        topics.push(id(value));
                    }
                    else if (param.type === "bytes") {
                        topics.push(keccak256(value));
                    }
                    else if (param.baseType === "tuple" || param.baseType === "array") {
                        // @TODO
                        throw new Error("not implemented");
                    }
                    else {
                        topics.push(this.#abiCoder.encode([param.type], [value]));
                    }
                }
                else {
                    dataTypes.push(param);
                    dataValues.push(value);
                }
            });
            return {
                data: this.#abiCoder.encode(dataTypes, dataValues),
                topics: topics
            };
        }
        // Decode a filter for the event and the search criteria
        decodeEventLog(fragment, data, topics) {
            if (typeof (fragment) === "string") {
                const f = this.getEvent(fragment);
                assertArgument(f, "unknown event", "eventFragment", fragment);
                fragment = f;
            }
            if (topics != null && !fragment.anonymous) {
                const eventTopic = fragment.topicHash;
                assertArgument(isHexString(topics[0], 32) && topics[0].toLowerCase() === eventTopic, "fragment/topic mismatch", "topics[0]", topics[0]);
                topics = topics.slice(1);
            }
            const indexed = [];
            const nonIndexed = [];
            const dynamic = [];
            fragment.inputs.forEach((param, index) => {
                if (param.indexed) {
                    if (param.type === "string" || param.type === "bytes" || param.baseType === "tuple" || param.baseType === "array") {
                        indexed.push(ParamType.from({ type: "bytes32", name: param.name }));
                        dynamic.push(true);
                    }
                    else {
                        indexed.push(param);
                        dynamic.push(false);
                    }
                }
                else {
                    nonIndexed.push(param);
                    dynamic.push(false);
                }
            });
            const resultIndexed = (topics != null) ? this.#abiCoder.decode(indexed, concat(topics)) : null;
            const resultNonIndexed = this.#abiCoder.decode(nonIndexed, data, true);
            //const result: (Array<any> & { [ key: string ]: any }) = [ ];
            const values = [];
            const keys = [];
            let nonIndexedIndex = 0, indexedIndex = 0;
            fragment.inputs.forEach((param, index) => {
                let value = null;
                if (param.indexed) {
                    if (resultIndexed == null) {
                        value = new Indexed(null);
                    }
                    else if (dynamic[index]) {
                        value = new Indexed(resultIndexed[indexedIndex++]);
                    }
                    else {
                        try {
                            value = resultIndexed[indexedIndex++];
                        }
                        catch (error) {
                            value = error;
                        }
                    }
                }
                else {
                    try {
                        value = resultNonIndexed[nonIndexedIndex++];
                    }
                    catch (error) {
                        value = error;
                    }
                }
                values.push(value);
                keys.push(param.name || null);
            });
            return Result.fromItems(values, keys);
        }
        /**
         *  Parses a transaction, finding the matching function and extracts
         *  the parameter values along with other useful function details.
         *
         *  If the matching function cannot be found, return null.
         */
        parseTransaction(tx) {
            const data = getBytes(tx.data, "tx.data");
            const value = getBigInt((tx.value != null) ? tx.value : 0, "tx.value");
            const fragment = this.getFunction(hexlify(data.slice(0, 4)));
            if (!fragment) {
                return null;
            }
            const args = this.#abiCoder.decode(fragment.inputs, data.slice(4));
            return new TransactionDescription(fragment, fragment.selector, args, value);
        }
        parseCallResult(data) {
            throw new Error("@TODO");
        }
        /**
         *  Parses a receipt log, finding the matching event and extracts
         *  the parameter values along with other useful event details.
         *
         *  If the matching event cannot be found, returns null.
         */
        parseLog(log) {
            const fragment = this.getEvent(log.topics[0]);
            if (!fragment || fragment.anonymous) {
                return null;
            }
            // @TODO: If anonymous, and the only method, and the input count matches, should we parse?
            //        Probably not, because just because it is the only event in the ABI does
            //        not mean we have the full ABI; maybe just a fragment?
            return new LogDescription(fragment, fragment.topicHash, this.decodeEventLog(fragment, log.data, log.topics));
        }
        /**
         *  Parses a revert data, finding the matching error and extracts
         *  the parameter values along with other useful error details.
         *
         *  If the matching error cannot be found, returns null.
         */
        parseError(data) {
            const hexData = hexlify(data);
            const fragment = this.getError(dataSlice(hexData, 0, 4));
            if (!fragment) {
                return null;
            }
            const args = this.#abiCoder.decode(fragment.inputs, dataSlice(hexData, 4));
            return new ErrorDescription(fragment, fragment.selector, args);
        }
        /**
         *  Creates a new [[Interface]] from the ABI %%value%%.
         *
         *  The %%value%% may be provided as an existing [[Interface]] object,
         *  a JSON-encoded ABI or any Human-Readable ABI format.
         */
        static from(value) {
            // Already an Interface, which is immutable
            if (value instanceof Interface) {
                return value;
            }
            // JSON
            if (typeof (value) === "string") {
                return new Interface(JSON.parse(value));
            }
            // Maybe an interface from an older version, or from a symlinked copy
            if (typeof (value.format) === "function") {
                return new Interface(value.format("json"));
            }
            // Array of fragments
            return new Interface(value);
        }
    }

    //import { resolveAddress } from "@ethersproject/address";
    const BN_0$2 = BigInt(0);
    // -----------------------
    function getValue(value) {
        if (value == null) {
            return null;
        }
        return value;
    }
    function toJson(value) {
        if (value == null) {
            return null;
        }
        return value.toString();
    }
    // @TODO? <T extends FeeData = { }> implements Required<T>
    /**
     *  A **FeeData** wraps all the fee-related values associated with
     *  the network.
     */
    class FeeData {
        /**
         *  The gas price for legacy networks.
         */
        gasPrice;
        /**
         *  The maximum fee to pay per gas.
         *
         *  The base fee per gas is defined by the network and based on
         *  congestion, increasing the cost during times of heavy load
         *  and lowering when less busy.
         *
         *  The actual fee per gas will be the base fee for the block
         *  and the priority fee, up to the max fee per gas.
         *
         *  This will be ``null`` on legacy networks (i.e. [pre-EIP-1559](link-eip-1559))
         */
        maxFeePerGas;
        /**
         *  The additional amout to pay per gas to encourage a validator
         *  to include the transaction.
         *
         *  The purpose of this is to compensate the validator for the
         *  adjusted risk for including a given transaction.
         *
         *  This will be ``null`` on legacy networks (i.e. [pre-EIP-1559](link-eip-1559))
         */
        maxPriorityFeePerGas;
        /**
         *  Creates a new FeeData for %%gasPrice%%, %%maxFeePerGas%% and
         *  %%maxPriorityFeePerGas%%.
         */
        constructor(gasPrice, maxFeePerGas, maxPriorityFeePerGas) {
            defineProperties(this, {
                gasPrice: getValue(gasPrice),
                maxFeePerGas: getValue(maxFeePerGas),
                maxPriorityFeePerGas: getValue(maxPriorityFeePerGas)
            });
        }
        /**
         *  Returns a JSON-friendly value.
         */
        toJSON() {
            const { gasPrice, maxFeePerGas, maxPriorityFeePerGas } = this;
            return {
                _type: "FeeData",
                gasPrice: toJson(gasPrice),
                maxFeePerGas: toJson(maxFeePerGas),
                maxPriorityFeePerGas: toJson(maxPriorityFeePerGas),
            };
        }
    }
    /**
     *  Returns a copy of %%req%% with all properties coerced to their strict
     *  types.
     */
    function copyRequest(req) {
        const result = {};
        // These could be addresses, ENS names or Addressables
        if (req.to) {
            result.to = req.to;
        }
        if (req.from) {
            result.from = req.from;
        }
        if (req.data) {
            result.data = hexlify(req.data);
        }
        const bigIntKeys = "chainId,gasLimit,gasPrice,maxFeePerGas,maxPriorityFeePerGas,value".split(/,/);
        for (const key of bigIntKeys) {
            if (!(key in req) || req[key] == null) {
                continue;
            }
            result[key] = getBigInt(req[key], `request.${key}`);
        }
        const numberKeys = "type,nonce".split(/,/);
        for (const key of numberKeys) {
            if (!(key in req) || req[key] == null) {
                continue;
            }
            result[key] = getNumber(req[key], `request.${key}`);
        }
        if (req.accessList) {
            result.accessList = accessListify(req.accessList);
        }
        if ("blockTag" in req) {
            result.blockTag = req.blockTag;
        }
        if ("enableCcipRead" in req) {
            result.enableCcipRead = !!req.enableCcipRead;
        }
        if ("customData" in req) {
            result.customData = req.customData;
        }
        return result;
    }
    /**
     *  A **Block** represents the data associated with a full block on
     *  Ethereum.
     */
    class Block {
        /**
         *  The provider connected to the block used to fetch additional details
         *  if necessary.
         */
        provider;
        /**
         *  The block number, sometimes called the block height. This is a
         *  sequential number that is one higher than the parent block.
         */
        number;
        /**
         *  The block hash.
         *
         *  This hash includes all properties, so can be safely used to identify
         *  an exact set of block properties.
         */
        hash;
        /**
         *  The timestamp for this block, which is the number of seconds since
         *  epoch that this block was included.
         */
        timestamp;
        /**
         *  The block hash of the parent block.
         */
        parentHash;
        /**
         *  The nonce.
         *
         *  On legacy networks, this is the random number inserted which
         *  permitted the difficulty target to be reached.
         */
        nonce;
        /**
         *  The difficulty target.
         *
         *  On legacy networks, this is the proof-of-work target required
         *  for a block to meet the protocol rules to be included.
         *
         *  On modern networks, this is a random number arrived at using
         *  randao.  @TODO: Find links?
         */
        difficulty;
        /**
         *  The total gas limit for this block.
         */
        gasLimit;
        /**
         *  The total gas used in this block.
         */
        gasUsed;
        /**
         *  The miner coinbase address, wihch receives any subsidies for
         *  including this block.
         */
        miner;
        /**
         *  Any extra data the validator wished to include.
         */
        extraData;
        /**
         *  The base fee per gas that all transactions in this block were
         *  charged.
         *
         *  This adjusts after each block, depending on how congested the network
         *  is.
         */
        baseFeePerGas;
        #transactions;
        /**
         *  Create a new **Block** object.
         *
         *  This should generally not be necessary as the unless implementing a
         *  low-level library.
         */
        constructor(block, provider) {
            this.#transactions = block.transactions.map((tx) => {
                if (typeof (tx) !== "string") {
                    return new TransactionResponse(tx, provider);
                }
                return tx;
            });
            defineProperties(this, {
                provider,
                hash: getValue(block.hash),
                number: block.number,
                timestamp: block.timestamp,
                parentHash: block.parentHash,
                nonce: block.nonce,
                difficulty: block.difficulty,
                gasLimit: block.gasLimit,
                gasUsed: block.gasUsed,
                miner: block.miner,
                extraData: block.extraData,
                baseFeePerGas: getValue(block.baseFeePerGas)
            });
        }
        /**
         *  Returns the list of transaction hashes, in the order
         *  they were executed within the block.
         */
        get transactions() {
            return this.#transactions.map((tx) => {
                if (typeof (tx) === "string") {
                    return tx;
                }
                return tx.hash;
            });
        }
        /**
         *  Returns the complete transactions, in the order they
         *  were executed within the block.
         *
         *  This is only available for blocks which prefetched
         *  transactions, by passing ``true`` to %%prefetchTxs%%
         *  into [[Provider-getBlock]].
         */
        get prefetchedTransactions() {
            const txs = this.#transactions.slice();
            // Doesn't matter...
            if (txs.length === 0) {
                return [];
            }
            // Make sure we prefetched the transactions
            assert(typeof (txs[0]) === "object", "transactions were not prefetched with block request", "UNSUPPORTED_OPERATION", {
                operation: "transactionResponses()"
            });
            return txs;
        }
        /**
         *  Returns a JSON-friendly value.
         */
        toJSON() {
            const { baseFeePerGas, difficulty, extraData, gasLimit, gasUsed, hash, miner, nonce, number, parentHash, timestamp, transactions } = this;
            return {
                _type: "Block",
                baseFeePerGas: toJson(baseFeePerGas),
                difficulty: toJson(difficulty),
                extraData,
                gasLimit: toJson(gasLimit),
                gasUsed: toJson(gasUsed),
                hash, miner, nonce, number, parentHash, timestamp,
                transactions,
            };
        }
        [Symbol.iterator]() {
            let index = 0;
            const txs = this.transactions;
            return {
                next: () => {
                    if (index < this.length) {
                        return {
                            value: txs[index++], done: false
                        };
                    }
                    return { value: undefined, done: true };
                }
            };
        }
        /**
         *  The number of transactions in this block.
         */
        get length() { return this.#transactions.length; }
        /**
         *  The [[link-js-date]] this block was included at.
         */
        get date() {
            if (this.timestamp == null) {
                return null;
            }
            return new Date(this.timestamp * 1000);
        }
        /**
         *  Get the transaction at %%indexe%% within this block.
         */
        async getTransaction(indexOrHash) {
            // Find the internal value by its index or hash
            let tx = undefined;
            if (typeof (indexOrHash) === "number") {
                tx = this.#transactions[indexOrHash];
            }
            else {
                const hash = indexOrHash.toLowerCase();
                for (const v of this.#transactions) {
                    if (typeof (v) === "string") {
                        if (v !== hash) {
                            continue;
                        }
                        tx = v;
                        break;
                    }
                    else {
                        if (v.hash === hash) {
                            continue;
                        }
                        tx = v;
                        break;
                    }
                }
            }
            if (tx == null) {
                throw new Error("no such tx");
            }
            if (typeof (tx) === "string") {
                return (await this.provider.getTransaction(tx));
            }
            else {
                return tx;
            }
        }
        /**
         *  If a **Block** was fetched with a request to include the transactions
         *  this will allow synchronous access to those transactions.
         *
         *  If the transactions were not prefetched, this will throw.
         */
        getPrefetchedTransaction(indexOrHash) {
            const txs = this.prefetchedTransactions;
            if (typeof (indexOrHash) === "number") {
                return txs[indexOrHash];
            }
            indexOrHash = indexOrHash.toLowerCase();
            for (const tx of txs) {
                if (tx.hash === indexOrHash) {
                    return tx;
                }
            }
            assertArgument(false, "no matching transaction", "indexOrHash", indexOrHash);
        }
        /**
         *  Returns true if this block been mined. This provides a type guard
         *  for all properties on a [[MinedBlock]].
         */
        isMined() { return !!this.hash; }
        /**
         *  Returns true if this block is an [[link-eip-2930]] block.
         */
        isLondon() {
            return !!this.baseFeePerGas;
        }
        /**
         *  @_ignore:
         */
        orphanedEvent() {
            if (!this.isMined()) {
                throw new Error("");
            }
            return createOrphanedBlockFilter(this);
        }
    }
    //////////////////////
    // Log
    /**
     *  A **Log** in Ethereum represents an event that has been included in a
     *  transaction using the ``LOG*`` opcodes, which are most commonly used by
     *  Solidity's emit for announcing events.
     */
    class Log {
        /**
         *  The provider connected to the log used to fetch additional details
         *  if necessary.
         */
        provider;
        /**
         *  The transaction hash of the transaction this log occurred in. Use the
         *  [[Log-getTransaction]] to get the [[TransactionResponse]].
         */
        transactionHash;
        /**
         *  The block hash of the block this log occurred in. Use the
         *  [[Log-getBlock]] to get the [[Block]].
         */
        blockHash;
        /**
         *  The block number of the block this log occurred in. It is preferred
         *  to use the [[Block-hash]] when fetching the related [[Block]],
         *  since in the case of an orphaned block, the block at that height may
         *  have changed.
         */
        blockNumber;
        /**
         *  If the **Log** represents a block that was removed due to an orphaned
         *  block, this will be true.
         *
         *  This can only happen within an orphan event listener.
         */
        removed;
        /**
         *  The address of the contract that emitted this log.
         */
        address;
        /**
         *  The data included in this log when it was emitted.
         */
        data;
        /**
         *  The indexed topics included in this log when it was emitted.
         *
         *  All topics are included in the bloom filters, so they can be
         *  efficiently filtered using the [[Provider-getLogs]] method.
         */
        topics;
        /**
         *  The index within the block this log occurred at. This is generally
         *  not useful to developers, but can be used with the various roots
         *  to proof inclusion within a block.
         */
        index;
        /**
         *  The index within the transaction of this log.
         */
        transactionIndex;
        /**
         *  @_ignore:
         */
        constructor(log, provider) {
            this.provider = provider;
            const topics = Object.freeze(log.topics.slice());
            defineProperties(this, {
                transactionHash: log.transactionHash,
                blockHash: log.blockHash,
                blockNumber: log.blockNumber,
                removed: log.removed,
                address: log.address,
                data: log.data,
                topics,
                index: log.index,
                transactionIndex: log.transactionIndex,
            });
        }
        /**
         *  Returns a JSON-compatible object.
         */
        toJSON() {
            const { address, blockHash, blockNumber, data, index, removed, topics, transactionHash, transactionIndex } = this;
            return {
                _type: "log",
                address, blockHash, blockNumber, data, index,
                removed, topics, transactionHash, transactionIndex
            };
        }
        /**
         *  Returns the block that this log occurred in.
         */
        async getBlock() {
            const block = await this.provider.getBlock(this.blockHash);
            assert(!!block, "failed to find transaction", "UNKNOWN_ERROR", {});
            return block;
        }
        /**
         *  Returns the transaction that this log occurred in.
         */
        async getTransaction() {
            const tx = await this.provider.getTransaction(this.transactionHash);
            assert(!!tx, "failed to find transaction", "UNKNOWN_ERROR", {});
            return tx;
        }
        /**
         *  Returns the transaction receipt fot the transaction that this
         *  log occurred in.
         */
        async getTransactionReceipt() {
            const receipt = await this.provider.getTransactionReceipt(this.transactionHash);
            assert(!!receipt, "failed to find transaction receipt", "UNKNOWN_ERROR", {});
            return receipt;
        }
        /**
         *  @_ignore:
         */
        removedEvent() {
            return createRemovedLogFilter(this);
        }
    }
    //////////////////////
    // Transaction Receipt
    /*
    export interface LegacyTransactionReceipt {
        byzantium: false;
        status: null;
        root: string;
    }

    export interface ByzantiumTransactionReceipt {
        byzantium: true;
        status: number;
        root: null;
    }
    */
    /**
     *  A **TransactionReceipt** includes additional information about a
     *  transaction that is only available after it has been mined.
     */
    class TransactionReceipt {
        /**
         *  The provider connected to the log used to fetch additional details
         *  if necessary.
         */
        provider;
        /**
         *  The address the transaction was sent to.
         */
        to;
        /**
         *  The sender of the transaction.
         */
        from;
        /**
         *  The address of the contract if the transaction was directly
         *  responsible for deploying one.
         *
         *  This is non-null **only** if the ``to`` is empty and the ``data``
         *  was successfully executed as initcode.
         */
        contractAddress;
        /**
         *  The transaction hash.
         */
        hash;
        /**
         *  The index of this transaction within the block transactions.
         */
        index;
        /**
         *  The block hash of the [[Block]] this transaction was included in.
         */
        blockHash;
        /**
         *  The block number of the [[Block]] this transaction was included in.
         */
        blockNumber;
        /**
         *  The bloom filter bytes that represent all logs that occurred within
         *  this transaction. This is generally not useful for most developers,
         *  but can be used to validate the included logs.
         */
        logsBloom;
        /**
         *  The actual amount of gas used by this transaction.
         *
         *  When creating a transaction, the amount of gas that will be used can
         *  only be approximated, but the sender must pay the gas fee for the
         *  entire gas limit. After the transaction, the difference is refunded.
         */
        gasUsed;
        /**
         *  The amount of gas used by all transactions within the block for this
         *  and all transactions with a lower ``index``.
         *
         *  This is generally not useful for developers but can be used to
         *  validate certain aspects of execution.
         */
        cumulativeGasUsed;
        /**
         *  The actual gas price used during execution.
         *
         *  Due to the complexity of [[link-eip-1559]] this value can only
         *  be caluclated after the transaction has been mined, snce the base
         *  fee is protocol-enforced.
         */
        gasPrice;
        /**
         *  The [[link-eip-2718]] transaction type.
         */
        type;
        //readonly byzantium!: boolean;
        /**
         *  The status of this transaction, indicating success (i.e. ``1``) or
         *  a revert (i.e. ``0``).
         *
         *  This is available in post-byzantium blocks, but some backends may
         *  backfill this value.
         */
        status;
        /**
         *  The root hash of this transaction.
         *
         *  This is no present and was only included in pre-byzantium blocks, but
         *  could be used to validate certain parts of the receipt.
         */
        root;
        #logs;
        /**
         *  @_ignore:
         */
        constructor(tx, provider) {
            this.#logs = Object.freeze(tx.logs.map((log) => {
                return new Log(log, provider);
            }));
            let gasPrice = BN_0$2;
            if (tx.effectiveGasPrice != null) {
                gasPrice = tx.effectiveGasPrice;
            }
            else if (tx.gasPrice != null) {
                gasPrice = tx.gasPrice;
            }
            defineProperties(this, {
                provider,
                to: tx.to,
                from: tx.from,
                contractAddress: tx.contractAddress,
                hash: tx.hash,
                index: tx.index,
                blockHash: tx.blockHash,
                blockNumber: tx.blockNumber,
                logsBloom: tx.logsBloom,
                gasUsed: tx.gasUsed,
                cumulativeGasUsed: tx.cumulativeGasUsed,
                gasPrice,
                type: tx.type,
                //byzantium: tx.byzantium,
                status: tx.status,
                root: tx.root
            });
        }
        /**
         *  The logs for this transaction.
         */
        get logs() { return this.#logs; }
        /**
         *  Returns a JSON-compatible representation.
         */
        toJSON() {
            const { to, from, contractAddress, hash, index, blockHash, blockNumber, logsBloom, logs, //byzantium, 
            status, root } = this;
            return {
                _type: "TransactionReceipt",
                blockHash, blockNumber,
                //byzantium, 
                contractAddress,
                cumulativeGasUsed: toJson(this.cumulativeGasUsed),
                from,
                gasPrice: toJson(this.gasPrice),
                gasUsed: toJson(this.gasUsed),
                hash, index, logs, logsBloom, root, status, to
            };
        }
        /**
         *  @_ignore:
         */
        get length() { return this.logs.length; }
        [Symbol.iterator]() {
            let index = 0;
            return {
                next: () => {
                    if (index < this.length) {
                        return { value: this.logs[index++], done: false };
                    }
                    return { value: undefined, done: true };
                }
            };
        }
        /**
         *  The total fee for this transaction, in wei.
         */
        get fee() {
            return this.gasUsed * this.gasPrice;
        }
        /**
         *  Resolves to the block this transaction occurred in.
         */
        async getBlock() {
            const block = await this.provider.getBlock(this.blockHash);
            if (block == null) {
                throw new Error("TODO");
            }
            return block;
        }
        /**
         *  Resolves to the transaction this transaction occurred in.
         */
        async getTransaction() {
            const tx = await this.provider.getTransaction(this.hash);
            if (tx == null) {
                throw new Error("TODO");
            }
            return tx;
        }
        /**
         *  Resolves to the return value of the execution of this transaction.
         *
         *  Support for this feature is limited, as it requires an archive node
         *  with the ``debug_`` or ``trace_`` API enabled.
         */
        async getResult() {
            return (await this.provider.getTransactionResult(this.hash));
        }
        /**
         *  Resolves to the number of confirmations this transaction has.
         */
        async confirmations() {
            return (await this.provider.getBlockNumber()) - this.blockNumber + 1;
        }
        /**
         *  @_ignore:
         */
        removedEvent() {
            return createRemovedTransactionFilter(this);
        }
        /**
         *  @_ignore:
         */
        reorderedEvent(other) {
            assert(!other || other.isMined(), "unmined 'other' transction cannot be orphaned", "UNSUPPORTED_OPERATION", { operation: "reorderedEvent(other)" });
            return createReorderedTransactionFilter(this, other);
        }
    }
    /**
     *  A **TransactionResponse** includes all properties about a transaction
     *  that was sent to the network, which may or may not be included in a
     *  block.
     *
     *  The [[TransactionResponse-isMined]] can be used to check if the
     *  transaction has been mined as well as type guard that the otherwise
     *  possibly ``null`` properties are defined.
     */
    class TransactionResponse {
        /**
         *  The provider this is connected to, which will influence how its
         *  methods will resolve its async inspection methods.
         */
        provider;
        /**
         *  The block number of the block that this transaction was included in.
         *
         *  This is ``null`` for pending transactions.
         */
        blockNumber;
        /**
         *  The blockHash of the block that this transaction was included in.
         *
         *  This is ``null`` for pending transactions.
         */
        blockHash;
        /**
         *  The index within the block that this transaction resides at.
         */
        index;
        /**
         *  The transaction hash.
         */
        hash;
        /**
         *  The [[link-eip-2718]] transaction envelope type. This is
         *  ``0`` for legacy transactions types.
         */
        type;
        /**
         *  The receiver of this transaction.
         *
         *  If ``null``, then the transaction is an initcode transaction.
         *  This means the result of executing the [[data]] will be deployed
         *  as a new contract on chain (assuming it does not revert) and the
         *  address may be computed using [[getCreateAddress]].
         */
        to;
        /**
         *  The sender of this transaction. It is implicitly computed
         *  from the transaction pre-image hash (as the digest) and the
         *  [[signature]] using ecrecover.
         */
        from;
        /**
         *  The nonce, which is used to prevent replay attacks and offer
         *  a method to ensure transactions from a given sender are explicitly
         *  ordered.
         *
         *  When sending a transaction, this must be equal to the number of
         *  transactions ever sent by [[from]].
         */
        nonce;
        /**
         *  The maximum units of gas this transaction can consume. If execution
         *  exceeds this, the entries transaction is reverted and the sender
         *  is charged for the full amount, despite not state changes being made.
         */
        gasLimit;
        /**
         *  The gas price can have various values, depending on the network.
         *
         *  In modern networks, for transactions that are included this is
         *  the //effective gas price// (the fee per gas that was actually
         *  charged), while for transactions that have not been included yet
         *  is the [[maxFeePerGas]].
         *
         *  For legacy transactions, or transactions on legacy networks, this
         *  is the fee that will be charged per unit of gas the transaction
         *  consumes.
         */
        gasPrice;
        /**
         *  The maximum priority fee (per unit of gas) to allow a
         *  validator to charge the sender. This is inclusive of the
         *  [[maxFeeFeePerGas]].
         */
        maxPriorityFeePerGas;
        /**
         *  The maximum fee (per unit of gas) to allow this transaction
         *  to charge the sender.
         */
        maxFeePerGas;
        /**
         *  The data.
         */
        data;
        /**
         *  The value, in wei. Use [[formatEther]] to format this value
         *  as ether.
         */
        value;
        /**
         *  The chain ID.
         */
        chainId;
        /**
         *  The signature.
         */
        signature;
        /**
         *  The [[link-eip-2930]] access list for transaction types that
         *  support it, otherwise ``null``.
         */
        accessList;
        #startBlock;
        /**
         *  @_ignore:
         */
        constructor(tx, provider) {
            this.provider = provider;
            this.blockNumber = (tx.blockNumber != null) ? tx.blockNumber : null;
            this.blockHash = (tx.blockHash != null) ? tx.blockHash : null;
            this.hash = tx.hash;
            this.index = tx.index;
            this.type = tx.type;
            this.from = tx.from;
            this.to = tx.to || null;
            this.gasLimit = tx.gasLimit;
            this.nonce = tx.nonce;
            this.data = tx.data;
            this.value = tx.value;
            this.gasPrice = tx.gasPrice;
            this.maxPriorityFeePerGas = (tx.maxPriorityFeePerGas != null) ? tx.maxPriorityFeePerGas : null;
            this.maxFeePerGas = (tx.maxFeePerGas != null) ? tx.maxFeePerGas : null;
            this.chainId = tx.chainId;
            this.signature = tx.signature;
            this.accessList = (tx.accessList != null) ? tx.accessList : null;
            this.#startBlock = -1;
        }
        /**
         *  Returns a JSON-compatible representation of this transaction.
         */
        toJSON() {
            const { blockNumber, blockHash, index, hash, type, to, from, nonce, data, signature, accessList } = this;
            return {
                _type: "TransactionReceipt",
                accessList, blockNumber, blockHash,
                chainId: toJson(this.chainId),
                data, from,
                gasLimit: toJson(this.gasLimit),
                gasPrice: toJson(this.gasPrice),
                hash,
                maxFeePerGas: toJson(this.maxFeePerGas),
                maxPriorityFeePerGas: toJson(this.maxPriorityFeePerGas),
                nonce, signature, to, index, type,
                value: toJson(this.value),
            };
        }
        /**
         *  Resolves to the Block that this transaction was included in.
         *
         *  This will return null if the transaction has not been included yet.
         */
        async getBlock() {
            let blockNumber = this.blockNumber;
            if (blockNumber == null) {
                const tx = await this.getTransaction();
                if (tx) {
                    blockNumber = tx.blockNumber;
                }
            }
            if (blockNumber == null) {
                return null;
            }
            const block = this.provider.getBlock(blockNumber);
            if (block == null) {
                throw new Error("TODO");
            }
            return block;
        }
        /**
         *  Resolves to this transaction being re-requested from the
         *  provider. This can be used if you have an unmined transaction
         *  and wish to get an up-to-date populated instance.
         */
        async getTransaction() {
            return this.provider.getTransaction(this.hash);
        }
        /**
         *  Resolve to the number of confirmations this transaction has.
         */
        async confirmations() {
            if (this.blockNumber == null) {
                const { tx, blockNumber } = await resolveProperties({
                    tx: this.getTransaction(),
                    blockNumber: this.provider.getBlockNumber()
                });
                // Not mined yet...
                if (tx == null || tx.blockNumber == null) {
                    return 0;
                }
                return blockNumber - tx.blockNumber + 1;
            }
            const blockNumber = await this.provider.getBlockNumber();
            return blockNumber - this.blockNumber + 1;
        }
        /**
         *  Resolves once this transaction has been mined and has
         *  %%confirms%% blocks including it (default: ``1``) with an
         *  optional %%timeout%%.
         *
         *  This can resolve to ``null`` only if %%confirms%% is ``0``
         *  and the transaction has not been mined, otherwise this will
         *  wait until enough confirmations have completed.
         */
        async wait(_confirms, _timeout) {
            const confirms = (_confirms == null) ? 1 : _confirms;
            const timeout = (_timeout == null) ? 0 : _timeout;
            let startBlock = this.#startBlock;
            let nextScan = -1;
            let stopScanning = (startBlock === -1) ? true : false;
            const checkReplacement = async () => {
                // Get the current transaction count for this sender
                if (stopScanning) {
                    return null;
                }
                const { blockNumber, nonce } = await resolveProperties({
                    blockNumber: this.provider.getBlockNumber(),
                    nonce: this.provider.getTransactionCount(this.from)
                });
                // No transaction or our nonce has not been mined yet; but we
                // can start scanning later when we do start
                if (nonce < this.nonce) {
                    startBlock = blockNumber;
                    return;
                }
                // We were mined; no replacement
                if (stopScanning) {
                    return null;
                }
                const mined = await this.getTransaction();
                if (mined && mined.blockNumber != null) {
                    return;
                }
                // We were replaced; start scanning for that transaction
                // Starting to scan; look back a few extra blocks for safety
                if (nextScan === -1) {
                    nextScan = startBlock - 3;
                    if (nextScan < this.#startBlock) {
                        nextScan = this.#startBlock;
                    }
                }
                while (nextScan <= blockNumber) {
                    // Get the next block to scan
                    if (stopScanning) {
                        return null;
                    }
                    const block = await this.provider.getBlock(nextScan, true);
                    // This should not happen; but we'll try again shortly
                    if (block == null) {
                        return;
                    }
                    // We were mined; no replacement
                    for (const hash of block) {
                        if (hash === this.hash) {
                            return;
                        }
                    }
                    // Search for the transaction that replaced us
                    for (let i = 0; i < block.length; i++) {
                        const tx = await block.getTransaction(i);
                        if (tx.from === this.from && tx.nonce === this.nonce) {
                            // Get the receipt
                            if (stopScanning) {
                                return null;
                            }
                            const receipt = await this.provider.getTransactionReceipt(tx.hash);
                            // This should not happen; but we'll try again shortly
                            if (receipt == null) {
                                return;
                            }
                            // We will retry this on the next block (this case could be optimized)
                            if ((blockNumber - receipt.blockNumber + 1) < confirms) {
                                return;
                            }
                            // The reason we were replaced
                            let reason = "replaced";
                            if (tx.data === this.data && tx.to === this.to && tx.value === this.value) {
                                reason = "repriced";
                            }
                            else if (tx.data === "0x" && tx.from === tx.to && tx.value === BN_0$2) {
                                reason = "cancelled";
                            }
                            assert(false, "transaction was replaced", "TRANSACTION_REPLACED", {
                                cancelled: (reason === "replaced" || reason === "cancelled"),
                                reason,
                                replacement: tx.replaceableTransaction(startBlock),
                                hash: tx.hash,
                                receipt
                            });
                        }
                    }
                    nextScan++;
                }
                return;
            };
            const checkReceipt = (receipt) => {
                if (receipt == null || receipt.status !== 0) {
                    return receipt;
                }
                assert(false, "transaction execution reverted", "CALL_EXCEPTION", {
                    action: "sendTransaction",
                    data: null, reason: null, invocation: null, revert: null,
                    transaction: {
                        to: receipt.to,
                        from: receipt.from,
                        data: "" // @TODO: in v7, split out sendTransaction properties
                    }, receipt
                });
            };
            const receipt = await this.provider.getTransactionReceipt(this.hash);
            if (confirms === 0) {
                return checkReceipt(receipt);
            }
            if (receipt) {
                if ((await receipt.confirmations()) >= confirms) {
                    return checkReceipt(receipt);
                }
            }
            else {
                // Check for a replacement; throws if a replacement was found
                await checkReplacement();
                // Allow null only when the confirms is 0
                if (confirms === 0) {
                    return null;
                }
            }
            const waiter = new Promise((resolve, reject) => {
                // List of things to cancel when we have a result (one way or the other)
                const cancellers = [];
                const cancel = () => { cancellers.forEach((c) => c()); };
                // On cancel, stop scanning for replacements
                cancellers.push(() => { stopScanning = true; });
                // Set up any timeout requested
                if (timeout > 0) {
                    const timer = setTimeout(() => {
                        cancel();
                        reject(makeError("wait for transaction timeout", "TIMEOUT"));
                    }, timeout);
                    cancellers.push(() => { clearTimeout(timer); });
                }
                const txListener = async (receipt) => {
                    // Done; return it!
                    if ((await receipt.confirmations()) >= confirms) {
                        cancel();
                        try {
                            resolve(checkReceipt(receipt));
                        }
                        catch (error) {
                            reject(error);
                        }
                    }
                };
                cancellers.push(() => { this.provider.off(this.hash, txListener); });
                this.provider.on(this.hash, txListener);
                // We support replacement detection; start checking
                if (startBlock >= 0) {
                    const replaceListener = async () => {
                        try {
                            // Check for a replacement; this throws only if one is found
                            await checkReplacement();
                        }
                        catch (error) {
                            // We were replaced (with enough confirms); re-throw the error
                            if (isError(error, "TRANSACTION_REPLACED")) {
                                cancel();
                                reject(error);
                                return;
                            }
                        }
                        // Rescheudle a check on the next block
                        if (!stopScanning) {
                            this.provider.once("block", replaceListener);
                        }
                    };
                    cancellers.push(() => { this.provider.off("block", replaceListener); });
                    this.provider.once("block", replaceListener);
                }
            });
            return await waiter;
        }
        /**
         *  Returns ``true`` if this transaction has been included.
         *
         *  This is effective only as of the time the TransactionResponse
         *  was instantiated. To get up-to-date information, use
         *  [[getTransaction]].
         *
         *  This provides a Type Guard that this transaction will have
         *  non-null property values for properties that are null for
         *  unmined transactions.
         */
        isMined() {
            return (this.blockHash != null);
        }
        /**
         *  Returns true if the transaction is a legacy (i.e. ``type == 0``)
         *  transaction.
         *
         *  This provides a Type Guard that this transaction will have
         *  the ``null``-ness for hardfork-specific properties set correctly.
         */
        isLegacy() {
            return (this.type === 0);
        }
        /**
         *  Returns true if the transaction is a Berlin (i.e. ``type == 1``)
         *  transaction. See [[link-eip-2070]].
         *
         *  This provides a Type Guard that this transaction will have
         *  the ``null``-ness for hardfork-specific properties set correctly.
         */
        isBerlin() {
            return (this.type === 1);
        }
        /**
         *  Returns true if the transaction is a London (i.e. ``type == 2``)
         *  transaction. See [[link-eip-1559]].
         *
         *  This provides a Type Guard that this transaction will have
         *  the ``null``-ness for hardfork-specific properties set correctly.
         */
        isLondon() {
            return (this.type === 2);
        }
        /**
         *  Returns a filter which can be used to listen for orphan events
         *  that evict this transaction.
         */
        removedEvent() {
            assert(this.isMined(), "unmined transaction canot be orphaned", "UNSUPPORTED_OPERATION", { operation: "removeEvent()" });
            return createRemovedTransactionFilter(this);
        }
        /**
         *  Returns a filter which can be used to listen for orphan events
         *  that re-order this event against %%other%%.
         */
        reorderedEvent(other) {
            assert(this.isMined(), "unmined transaction canot be orphaned", "UNSUPPORTED_OPERATION", { operation: "removeEvent()" });
            assert(!other || other.isMined(), "unmined 'other' transaction canot be orphaned", "UNSUPPORTED_OPERATION", { operation: "removeEvent()" });
            return createReorderedTransactionFilter(this, other);
        }
        /**
         *  Returns a new TransactionResponse instance which has the ability to
         *  detect (and throw an error) if the transaction is replaced, which
         *  will begin scanning at %%startBlock%%.
         *
         *  This should generally not be used by developers and is intended
         *  primarily for internal use. Setting an incorrect %%startBlock%% can
         *  have devastating performance consequences if used incorrectly.
         */
        replaceableTransaction(startBlock) {
            assertArgument(Number.isInteger(startBlock) && startBlock >= 0, "invalid startBlock", "startBlock", startBlock);
            const tx = new TransactionResponse(this, this.provider);
            tx.#startBlock = startBlock;
            return tx;
        }
    }
    function createOrphanedBlockFilter(block) {
        return { orphan: "drop-block", hash: block.hash, number: block.number };
    }
    function createReorderedTransactionFilter(tx, other) {
        return { orphan: "reorder-transaction", tx, other };
    }
    function createRemovedTransactionFilter(tx) {
        return { orphan: "drop-transaction", tx };
    }
    function createRemovedLogFilter(log) {
        return { orphan: "drop-log", log: {
                transactionHash: log.transactionHash,
                blockHash: log.blockHash,
                blockNumber: log.blockNumber,
                address: log.address,
                data: log.data,
                topics: Object.freeze(log.topics.slice()),
                index: log.index
            } };
    }

    // import from provider.ts instead of index.ts to prevent circular dep
    // from EtherscanProvider
    /**
     *  An **EventLog** contains additional properties parsed from the [[Log]].
     */
    class EventLog extends Log {
        /**
         *  The Contract Interface.
         */
        interface;
        /**
         *  The matching event.
         */
        fragment;
        /**
         *  The parsed arguments passed to the event by ``emit``.
         */
        args;
        /**
         * @_ignore:
         */
        constructor(log, iface, fragment) {
            super(log, log.provider);
            const args = iface.decodeEventLog(fragment, log.data, log.topics);
            defineProperties(this, { args, fragment, interface: iface });
        }
        /**
         *  The name of the event.
         */
        get eventName() { return this.fragment.name; }
        /**
         *  The signature of the event.
         */
        get eventSignature() { return this.fragment.format(); }
    }
    /**
     *  An **EventLog** contains additional properties parsed from the [[Log]].
     */
    class UndecodedEventLog extends Log {
        /**
         *  The error encounted when trying to decode the log.
         */
        error;
        /**
         * @_ignore:
         */
        constructor(log, error) {
            super(log, log.provider);
            defineProperties(this, { error });
        }
    }
    /**
     *  A **ContractTransactionReceipt** includes the parsed logs from a
     *  [[TransactionReceipt]].
     */
    class ContractTransactionReceipt extends TransactionReceipt {
        #iface;
        /**
         *  @_ignore:
         */
        constructor(iface, provider, tx) {
            super(tx, provider);
            this.#iface = iface;
        }
        /**
         *  The parsed logs for any [[Log]] which has a matching event in the
         *  Contract ABI.
         */
        get logs() {
            return super.logs.map((log) => {
                const fragment = log.topics.length ? this.#iface.getEvent(log.topics[0]) : null;
                if (fragment) {
                    try {
                        return new EventLog(log, this.#iface, fragment);
                    }
                    catch (error) {
                        return new UndecodedEventLog(log, error);
                    }
                }
                return log;
            });
        }
    }
    /**
     *  A **ContractTransactionResponse** will return a
     *  [[ContractTransactionReceipt]] when waited on.
     */
    class ContractTransactionResponse extends TransactionResponse {
        #iface;
        /**
         *  @_ignore:
         */
        constructor(iface, provider, tx) {
            super(tx, provider);
            this.#iface = iface;
        }
        /**
         *  Resolves once this transaction has been mined and has
         *  %%confirms%% blocks including it (default: ``1``) with an
         *  optional %%timeout%%.
         *
         *  This can resolve to ``null`` only if %%confirms%% is ``0``
         *  and the transaction has not been mined, otherwise this will
         *  wait until enough confirmations have completed.
         */
        async wait(confirms) {
            const receipt = await super.wait(confirms);
            if (receipt == null) {
                return null;
            }
            return new ContractTransactionReceipt(this.#iface, this.provider, receipt);
        }
    }
    /**
     *  A **ContractUnknownEventPayload** is included as the last parameter to
     *  Contract Events when the event does not match any events in the ABI.
     */
    class ContractUnknownEventPayload extends EventPayload {
        /**
         *  The log with no matching events.
         */
        log;
        /**
         *  @_event:
         */
        constructor(contract, listener, filter, log) {
            super(contract, listener, filter);
            defineProperties(this, { log });
        }
        /**
         *  Resolves to the block the event occured in.
         */
        async getBlock() {
            return await this.log.getBlock();
        }
        /**
         *  Resolves to the transaction the event occured in.
         */
        async getTransaction() {
            return await this.log.getTransaction();
        }
        /**
         *  Resolves to the transaction receipt the event occured in.
         */
        async getTransactionReceipt() {
            return await this.log.getTransactionReceipt();
        }
    }
    /**
     *  A **ContractEventPayload** is included as the last parameter to
     *  Contract Events when the event is known.
     */
    class ContractEventPayload extends ContractUnknownEventPayload {
        /**
         *  @_ignore:
         */
        constructor(contract, listener, filter, fragment, _log) {
            super(contract, listener, filter, new EventLog(_log, contract.interface, fragment));
            const args = contract.interface.decodeEventLog(fragment, this.log.data, this.log.topics);
            defineProperties(this, { args, fragment });
        }
        /**
         *  The event name.
         */
        get eventName() {
            return this.fragment.name;
        }
        /**
         *  The event signature.
         */
        get eventSignature() {
            return this.fragment.format();
        }
    }

    const BN_0$1 = BigInt(0);
    function canCall(value) {
        return (value && typeof (value.call) === "function");
    }
    function canEstimate(value) {
        return (value && typeof (value.estimateGas) === "function");
    }
    function canResolve(value) {
        return (value && typeof (value.resolveName) === "function");
    }
    function canSend(value) {
        return (value && typeof (value.sendTransaction) === "function");
    }
    function getResolver(value) {
        if (value != null) {
            if (canResolve(value)) {
                return value;
            }
            if (value.provider) {
                return value.provider;
            }
        }
        return undefined;
    }
    class PreparedTopicFilter {
        #filter;
        fragment;
        constructor(contract, fragment, args) {
            defineProperties(this, { fragment });
            if (fragment.inputs.length < args.length) {
                throw new Error("too many arguments");
            }
            // Recursively descend into args and resolve any addresses
            const runner = getRunner(contract.runner, "resolveName");
            const resolver = canResolve(runner) ? runner : null;
            this.#filter = (async function () {
                const resolvedArgs = await Promise.all(fragment.inputs.map((param, index) => {
                    const arg = args[index];
                    if (arg == null) {
                        return null;
                    }
                    return param.walkAsync(args[index], (type, value) => {
                        if (type === "address") {
                            if (Array.isArray(value)) {
                                return Promise.all(value.map((v) => resolveAddress(v, resolver)));
                            }
                            return resolveAddress(value, resolver);
                        }
                        return value;
                    });
                }));
                return contract.interface.encodeFilterTopics(fragment, resolvedArgs);
            })();
        }
        getTopicFilter() {
            return this.#filter;
        }
    }
    // A = Arguments passed in as a tuple
    // R = The result type of the call (i.e. if only one return type,
    //     the qualified type, otherwise Result)
    // D = The type the default call will return (i.e. R for view/pure,
    //     TransactionResponse otherwise)
    //export interface ContractMethod<A extends Array<any> = Array<any>, R = any, D extends R | ContractTransactionResponse = ContractTransactionResponse> {
    function getRunner(value, feature) {
        if (value == null) {
            return null;
        }
        if (typeof (value[feature]) === "function") {
            return value;
        }
        if (value.provider && typeof (value.provider[feature]) === "function") {
            return value.provider;
        }
        return null;
    }
    function getProvider(value) {
        if (value == null) {
            return null;
        }
        return value.provider || null;
    }
    /**
     *  @_ignore:
     */
    async function copyOverrides(arg, allowed) {
        // Make sure the overrides passed in are a valid overrides object
        const _overrides = Typed.dereference(arg, "overrides");
        assertArgument(typeof (_overrides) === "object", "invalid overrides parameter", "overrides", arg);
        // Create a shallow copy (we'll deep-ify anything needed during normalizing)
        const overrides = copyRequest(_overrides);
        assertArgument(overrides.to == null || (allowed || []).indexOf("to") >= 0, "cannot override to", "overrides.to", overrides.to);
        assertArgument(overrides.data == null || (allowed || []).indexOf("data") >= 0, "cannot override data", "overrides.data", overrides.data);
        // Resolve any from
        if (overrides.from) {
            overrides.from = overrides.from;
        }
        return overrides;
    }
    /**
     *  @_ignore:
     */
    async function resolveArgs(_runner, inputs, args) {
        // Recursively descend into args and resolve any addresses
        const runner = getRunner(_runner, "resolveName");
        const resolver = canResolve(runner) ? runner : null;
        return await Promise.all(inputs.map((param, index) => {
            return param.walkAsync(args[index], (type, value) => {
                value = Typed.dereference(value, type);
                if (type === "address") {
                    return resolveAddress(value, resolver);
                }
                return value;
            });
        }));
    }
    function buildWrappedFallback(contract) {
        const populateTransaction = async function (overrides) {
            // If an overrides was passed in, copy it and normalize the values
            const tx = (await copyOverrides(overrides, ["data"]));
            tx.to = await contract.getAddress();
            if (tx.from) {
                tx.from = await resolveAddress(tx.from, getResolver(contract.runner));
            }
            const iface = contract.interface;
            const noValue = (getBigInt((tx.value || BN_0$1), "overrides.value") === BN_0$1);
            const noData = ((tx.data || "0x") === "0x");
            if (iface.fallback && !iface.fallback.payable && iface.receive && !noData && !noValue) {
                assertArgument(false, "cannot send data to receive or send value to non-payable fallback", "overrides", overrides);
            }
            assertArgument(iface.fallback || noData, "cannot send data to receive-only contract", "overrides.data", tx.data);
            // Only allow payable contracts to set non-zero value
            const payable = iface.receive || (iface.fallback && iface.fallback.payable);
            assertArgument(payable || noValue, "cannot send value to non-payable fallback", "overrides.value", tx.value);
            // Only allow fallback contracts to set non-empty data
            assertArgument(iface.fallback || noData, "cannot send data to receive-only contract", "overrides.data", tx.data);
            return tx;
        };
        const staticCall = async function (overrides) {
            const runner = getRunner(contract.runner, "call");
            assert(canCall(runner), "contract runner does not support calling", "UNSUPPORTED_OPERATION", { operation: "call" });
            const tx = await populateTransaction(overrides);
            try {
                return await runner.call(tx);
            }
            catch (error) {
                if (isCallException(error) && error.data) {
                    throw contract.interface.makeError(error.data, tx);
                }
                throw error;
            }
        };
        const send = async function (overrides) {
            const runner = contract.runner;
            assert(canSend(runner), "contract runner does not support sending transactions", "UNSUPPORTED_OPERATION", { operation: "sendTransaction" });
            const tx = await runner.sendTransaction(await populateTransaction(overrides));
            const provider = getProvider(contract.runner);
            // @TODO: the provider can be null; make a custom dummy provider that will throw a
            // meaningful error
            return new ContractTransactionResponse(contract.interface, provider, tx);
        };
        const estimateGas = async function (overrides) {
            const runner = getRunner(contract.runner, "estimateGas");
            assert(canEstimate(runner), "contract runner does not support gas estimation", "UNSUPPORTED_OPERATION", { operation: "estimateGas" });
            return await runner.estimateGas(await populateTransaction(overrides));
        };
        const method = async (overrides) => {
            return await send(overrides);
        };
        defineProperties(method, {
            _contract: contract,
            estimateGas,
            populateTransaction,
            send, staticCall
        });
        return method;
    }
    function buildWrappedMethod(contract, key) {
        const getFragment = function (...args) {
            const fragment = contract.interface.getFunction(key, args);
            assert(fragment, "no matching fragment", "UNSUPPORTED_OPERATION", {
                operation: "fragment",
                info: { key, args }
            });
            return fragment;
        };
        const populateTransaction = async function (...args) {
            const fragment = getFragment(...args);
            // If an overrides was passed in, copy it and normalize the values
            let overrides = {};
            if (fragment.inputs.length + 1 === args.length) {
                overrides = await copyOverrides(args.pop());
                if (overrides.from) {
                    overrides.from = await resolveAddress(overrides.from, getResolver(contract.runner));
                }
            }
            if (fragment.inputs.length !== args.length) {
                throw new Error("internal error: fragment inputs doesn't match arguments; should not happen");
            }
            const resolvedArgs = await resolveArgs(contract.runner, fragment.inputs, args);
            return Object.assign({}, overrides, await resolveProperties({
                to: contract.getAddress(),
                data: contract.interface.encodeFunctionData(fragment, resolvedArgs)
            }));
        };
        const staticCall = async function (...args) {
            const result = await staticCallResult(...args);
            if (result.length === 1) {
                return result[0];
            }
            return result;
        };
        const send = async function (...args) {
            const runner = contract.runner;
            assert(canSend(runner), "contract runner does not support sending transactions", "UNSUPPORTED_OPERATION", { operation: "sendTransaction" });
            const tx = await runner.sendTransaction(await populateTransaction(...args));
            const provider = getProvider(contract.runner);
            // @TODO: the provider can be null; make a custom dummy provider that will throw a
            // meaningful error
            return new ContractTransactionResponse(contract.interface, provider, tx);
        };
        const estimateGas = async function (...args) {
            const runner = getRunner(contract.runner, "estimateGas");
            assert(canEstimate(runner), "contract runner does not support gas estimation", "UNSUPPORTED_OPERATION", { operation: "estimateGas" });
            return await runner.estimateGas(await populateTransaction(...args));
        };
        const staticCallResult = async function (...args) {
            const runner = getRunner(contract.runner, "call");
            assert(canCall(runner), "contract runner does not support calling", "UNSUPPORTED_OPERATION", { operation: "call" });
            const tx = await populateTransaction(...args);
            let result = "0x";
            try {
                result = await runner.call(tx);
            }
            catch (error) {
                if (isCallException(error) && error.data) {
                    throw contract.interface.makeError(error.data, tx);
                }
                throw error;
            }
            const fragment = getFragment(...args);
            return contract.interface.decodeFunctionResult(fragment, result);
        };
        const method = async (...args) => {
            const fragment = getFragment(...args);
            if (fragment.constant) {
                return await staticCall(...args);
            }
            return await send(...args);
        };
        defineProperties(method, {
            name: contract.interface.getFunctionName(key),
            _contract: contract, _key: key,
            getFragment,
            estimateGas,
            populateTransaction,
            send, staticCall, staticCallResult,
        });
        // Only works on non-ambiguous keys (refined fragment is always non-ambiguous)
        Object.defineProperty(method, "fragment", {
            configurable: false,
            enumerable: true,
            get: () => {
                const fragment = contract.interface.getFunction(key);
                assert(fragment, "no matching fragment", "UNSUPPORTED_OPERATION", {
                    operation: "fragment",
                    info: { key }
                });
                return fragment;
            }
        });
        return method;
    }
    function buildWrappedEvent(contract, key) {
        const getFragment = function (...args) {
            const fragment = contract.interface.getEvent(key, args);
            assert(fragment, "no matching fragment", "UNSUPPORTED_OPERATION", {
                operation: "fragment",
                info: { key, args }
            });
            return fragment;
        };
        const method = function (...args) {
            return new PreparedTopicFilter(contract, getFragment(...args), args);
        };
        defineProperties(method, {
            name: contract.interface.getEventName(key),
            _contract: contract, _key: key,
            getFragment
        });
        // Only works on non-ambiguous keys (refined fragment is always non-ambiguous)
        Object.defineProperty(method, "fragment", {
            configurable: false,
            enumerable: true,
            get: () => {
                const fragment = contract.interface.getEvent(key);
                assert(fragment, "no matching fragment", "UNSUPPORTED_OPERATION", {
                    operation: "fragment",
                    info: { key }
                });
                return fragment;
            }
        });
        return method;
    }
    // The combination of TypeScrype, Private Fields and Proxies makes
    // the world go boom; so we hide variables with some trickery keeping
    // a symbol attached to each BaseContract which its sub-class (even
    // via a Proxy) can reach and use to look up its internal values.
    const internal = Symbol.for("_ethersInternal_contract");
    const internalValues = new WeakMap();
    function setInternal(contract, values) {
        internalValues.set(contract[internal], values);
    }
    function getInternal(contract) {
        return internalValues.get(contract[internal]);
    }
    function isDeferred(value) {
        return (value && typeof (value) === "object" && ("getTopicFilter" in value) &&
            (typeof (value.getTopicFilter) === "function") && value.fragment);
    }
    async function getSubInfo(contract, event) {
        let topics;
        let fragment = null;
        // Convert named events to topicHash and get the fragment for
        // events which need deconstructing.
        if (Array.isArray(event)) {
            const topicHashify = function (name) {
                if (isHexString(name, 32)) {
                    return name;
                }
                const fragment = contract.interface.getEvent(name);
                assertArgument(fragment, "unknown fragment", "name", name);
                return fragment.topicHash;
            };
            // Array of Topics and Names; e.g. `[ "0x1234...89ab", "Transfer(address)" ]`
            topics = event.map((e) => {
                if (e == null) {
                    return null;
                }
                if (Array.isArray(e)) {
                    return e.map(topicHashify);
                }
                return topicHashify(e);
            });
        }
        else if (event === "*") {
            topics = [null];
        }
        else if (typeof (event) === "string") {
            if (isHexString(event, 32)) {
                // Topic Hash
                topics = [event];
            }
            else {
                // Name or Signature; e.g. `"Transfer", `"Transfer(address)"`
                fragment = contract.interface.getEvent(event);
                assertArgument(fragment, "unknown fragment", "event", event);
                topics = [fragment.topicHash];
            }
        }
        else if (isDeferred(event)) {
            // Deferred Topic Filter; e.g. `contract.filter.Transfer(from)`
            topics = await event.getTopicFilter();
        }
        else if ("fragment" in event) {
            // ContractEvent; e.g. `contract.filter.Transfer`
            fragment = event.fragment;
            topics = [fragment.topicHash];
        }
        else {
            assertArgument(false, "unknown event name", "event", event);
        }
        // Normalize topics and sort TopicSets
        topics = topics.map((t) => {
            if (t == null) {
                return null;
            }
            if (Array.isArray(t)) {
                const items = Array.from(new Set(t.map((t) => t.toLowerCase())).values());
                if (items.length === 1) {
                    return items[0];
                }
                items.sort();
                return items;
            }
            return t.toLowerCase();
        });
        const tag = topics.map((t) => {
            if (t == null) {
                return "null";
            }
            if (Array.isArray(t)) {
                return t.join("|");
            }
            return t;
        }).join("&");
        return { fragment, tag, topics };
    }
    async function hasSub(contract, event) {
        const { subs } = getInternal(contract);
        return subs.get((await getSubInfo(contract, event)).tag) || null;
    }
    async function getSub(contract, operation, event) {
        // Make sure our runner can actually subscribe to events
        const provider = getProvider(contract.runner);
        assert(provider, "contract runner does not support subscribing", "UNSUPPORTED_OPERATION", { operation });
        const { fragment, tag, topics } = await getSubInfo(contract, event);
        const { addr, subs } = getInternal(contract);
        let sub = subs.get(tag);
        if (!sub) {
            const address = (addr ? addr : contract);
            const filter = { address, topics };
            const listener = (log) => {
                let foundFragment = fragment;
                if (foundFragment == null) {
                    try {
                        foundFragment = contract.interface.getEvent(log.topics[0]);
                    }
                    catch (error) { }
                }
                // If fragment is null, we do not deconstruct the args to emit
                if (foundFragment) {
                    const _foundFragment = foundFragment;
                    const args = fragment ? contract.interface.decodeEventLog(fragment, log.data, log.topics) : [];
                    emit(contract, event, args, (listener) => {
                        return new ContractEventPayload(contract, listener, event, _foundFragment, log);
                    });
                }
                else {
                    emit(contract, event, [], (listener) => {
                        return new ContractUnknownEventPayload(contract, listener, event, log);
                    });
                }
            };
            let starting = [];
            const start = () => {
                if (starting.length) {
                    return;
                }
                starting.push(provider.on(filter, listener));
            };
            const stop = async () => {
                if (starting.length == 0) {
                    return;
                }
                let started = starting;
                starting = [];
                await Promise.all(started);
                provider.off(filter, listener);
            };
            sub = { tag, listeners: [], start, stop };
            subs.set(tag, sub);
        }
        return sub;
    }
    // We use this to ensure one emit resolves before firing the next to
    // ensure correct ordering (note this cannot throw and just adds the
    // notice to the event queu using setTimeout).
    let lastEmit = Promise.resolve();
    async function _emit(contract, event, args, payloadFunc) {
        await lastEmit;
        const sub = await hasSub(contract, event);
        if (!sub) {
            return false;
        }
        const count = sub.listeners.length;
        sub.listeners = sub.listeners.filter(({ listener, once }) => {
            const passArgs = Array.from(args);
            if (payloadFunc) {
                passArgs.push(payloadFunc(once ? null : listener));
            }
            try {
                listener.call(contract, ...passArgs);
            }
            catch (error) { }
            return !once;
        });
        if (sub.listeners.length === 0) {
            sub.stop();
            getInternal(contract).subs.delete(sub.tag);
        }
        return (count > 0);
    }
    async function emit(contract, event, args, payloadFunc) {
        try {
            await lastEmit;
        }
        catch (error) { }
        const resultPromise = _emit(contract, event, args, payloadFunc);
        lastEmit = resultPromise;
        return await resultPromise;
    }
    const passProperties = ["then"];
    class BaseContract {
        /**
         *  The target to connect to.
         *
         *  This can be an address, ENS name or any [[Addressable]], such as
         *  another contract. To get the resovled address, use the ``getAddress``
         *  method.
         */
        target;
        /**
         *  The contract Interface.
         */
        interface;
        /**
         *  The connected runner. This is generally a [[Provider]] or a
         *  [[Signer]], which dictates what operations are supported.
         *
         *  For example, a **Contract** connected to a [[Provider]] may
         *  only execute read-only operations.
         */
        runner;
        /**
         *  All the Events available on this contract.
         */
        filters;
        /**
         *  @_ignore:
         */
        [internal];
        /**
         *  The fallback or receive function if any.
         */
        fallback;
        /**
         *  Creates a new contract connected to %%target%% with the %%abi%% and
         *  optionally connected to a %%runner%% to perform operations on behalf
         *  of.
         */
        constructor(target, abi, runner, _deployTx) {
            assertArgument(typeof (target) === "string" || isAddressable(target), "invalid value for Contract target", "target", target);
            if (runner == null) {
                runner = null;
            }
            const iface = Interface.from(abi);
            defineProperties(this, { target, runner, interface: iface });
            Object.defineProperty(this, internal, { value: {} });
            let addrPromise;
            let addr = null;
            let deployTx = null;
            if (_deployTx) {
                const provider = getProvider(runner);
                // @TODO: the provider can be null; make a custom dummy provider that will throw a
                // meaningful error
                deployTx = new ContractTransactionResponse(this.interface, provider, _deployTx);
            }
            let subs = new Map();
            // Resolve the target as the address
            if (typeof (target) === "string") {
                if (isHexString(target)) {
                    addr = target;
                    addrPromise = Promise.resolve(target);
                }
                else {
                    const resolver = getRunner(runner, "resolveName");
                    if (!canResolve(resolver)) {
                        throw makeError("contract runner does not support name resolution", "UNSUPPORTED_OPERATION", {
                            operation: "resolveName"
                        });
                    }
                    addrPromise = resolver.resolveName(target).then((addr) => {
                        if (addr == null) {
                            throw makeError("an ENS name used for a contract target must be correctly configured", "UNCONFIGURED_NAME", {
                                value: target
                            });
                        }
                        getInternal(this).addr = addr;
                        return addr;
                    });
                }
            }
            else {
                addrPromise = target.getAddress().then((addr) => {
                    if (addr == null) {
                        throw new Error("TODO");
                    }
                    getInternal(this).addr = addr;
                    return addr;
                });
            }
            // Set our private values
            setInternal(this, { addrPromise, addr, deployTx, subs });
            // Add the event filters
            const filters = new Proxy({}, {
                get: (target, prop, receiver) => {
                    // Pass important checks (like `then` for Promise) through
                    if (typeof (prop) === "symbol" || passProperties.indexOf(prop) >= 0) {
                        return Reflect.get(target, prop, receiver);
                    }
                    try {
                        return this.getEvent(prop);
                    }
                    catch (error) {
                        if (!isError(error, "INVALID_ARGUMENT") || error.argument !== "key") {
                            throw error;
                        }
                    }
                    return undefined;
                },
                has: (target, prop) => {
                    // Pass important checks (like `then` for Promise) through
                    if (passProperties.indexOf(prop) >= 0) {
                        return Reflect.has(target, prop);
                    }
                    return Reflect.has(target, prop) || this.interface.hasEvent(String(prop));
                }
            });
            defineProperties(this, { filters });
            defineProperties(this, {
                fallback: ((iface.receive || iface.fallback) ? (buildWrappedFallback(this)) : null)
            });
            // Return a Proxy that will respond to functions
            return new Proxy(this, {
                get: (target, prop, receiver) => {
                    if (typeof (prop) === "symbol" || prop in target || passProperties.indexOf(prop) >= 0) {
                        return Reflect.get(target, prop, receiver);
                    }
                    // Undefined properties should return undefined
                    try {
                        return target.getFunction(prop);
                    }
                    catch (error) {
                        if (!isError(error, "INVALID_ARGUMENT") || error.argument !== "key") {
                            throw error;
                        }
                    }
                    return undefined;
                },
                has: (target, prop) => {
                    if (typeof (prop) === "symbol" || prop in target || passProperties.indexOf(prop) >= 0) {
                        return Reflect.has(target, prop);
                    }
                    return target.interface.hasFunction(prop);
                }
            });
        }
        /**
         *  Return a new Contract instance with the same target and ABI, but
         *  a different %%runner%%.
         */
        connect(runner) {
            return new BaseContract(this.target, this.interface, runner);
        }
        /**
         *  Return a new Contract instance with the same ABI and runner, but
         *  a different %%target%%.
         */
        attach(target) {
            return new BaseContract(target, this.interface, this.runner);
        }
        /**
         *  Return the resolved address of this Contract.
         */
        async getAddress() { return await getInternal(this).addrPromise; }
        /**
         *  Return the deployed bytecode or null if no bytecode is found.
         */
        async getDeployedCode() {
            const provider = getProvider(this.runner);
            assert(provider, "runner does not support .provider", "UNSUPPORTED_OPERATION", { operation: "getDeployedCode" });
            const code = await provider.getCode(await this.getAddress());
            if (code === "0x") {
                return null;
            }
            return code;
        }
        /**
         *  Resolve to this Contract once the bytecode has been deployed, or
         *  resolve immediately if already deployed.
         */
        async waitForDeployment() {
            // We have the deployement transaction; just use that (throws if deployement fails)
            const deployTx = this.deploymentTransaction();
            if (deployTx) {
                await deployTx.wait();
                return this;
            }
            // Check for code
            const code = await this.getDeployedCode();
            if (code != null) {
                return this;
            }
            // Make sure we can subscribe to a provider event
            const provider = getProvider(this.runner);
            assert(provider != null, "contract runner does not support .provider", "UNSUPPORTED_OPERATION", { operation: "waitForDeployment" });
            return new Promise((resolve, reject) => {
                const checkCode = async () => {
                    try {
                        const code = await this.getDeployedCode();
                        if (code != null) {
                            return resolve(this);
                        }
                        provider.once("block", checkCode);
                    }
                    catch (error) {
                        reject(error);
                    }
                };
                checkCode();
            });
        }
        /**
         *  Return the transaction used to deploy this contract.
         *
         *  This is only available if this instance was returned from a
         *  [[ContractFactory]].
         */
        deploymentTransaction() {
            return getInternal(this).deployTx;
        }
        /**
         *  Return the function for a given name. This is useful when a contract
         *  method name conflicts with a JavaScript name such as ``prototype`` or
         *  when using a Contract programatically.
         */
        getFunction(key) {
            if (typeof (key) !== "string") {
                key = key.format();
            }
            const func = buildWrappedMethod(this, key);
            return func;
        }
        /**
         *  Return the event for a given name. This is useful when a contract
         *  event name conflicts with a JavaScript name such as ``prototype`` or
         *  when using a Contract programatically.
         */
        getEvent(key) {
            if (typeof (key) !== "string") {
                key = key.format();
            }
            return buildWrappedEvent(this, key);
        }
        /**
         *  @_ignore:
         */
        async queryTransaction(hash) {
            throw new Error("@TODO");
        }
        /*
        // @TODO: this is a non-backwards compatible change, but will be added
        //        in v7 and in a potential SmartContract class in an upcoming
        //        v6 release
        async getTransactionReceipt(hash: string): Promise<null | ContractTransactionReceipt> {
            const provider = getProvider(this.runner);
            assert(provider, "contract runner does not have a provider",
                "UNSUPPORTED_OPERATION", { operation: "queryTransaction" });

            const receipt = await provider.getTransactionReceipt(hash);
            if (receipt == null) { return null; }

            return new ContractTransactionReceipt(this.interface, provider, receipt);
        }
        */
        /**
         *  Provide historic access to event data for %%event%% in the range
         *  %%fromBlock%% (default: ``0``) to %%toBlock%% (default: ``"latest"``)
         *  inclusive.
         */
        async queryFilter(event, fromBlock, toBlock) {
            if (fromBlock == null) {
                fromBlock = 0;
            }
            if (toBlock == null) {
                toBlock = "latest";
            }
            const { addr, addrPromise } = getInternal(this);
            const address = (addr ? addr : (await addrPromise));
            const { fragment, topics } = await getSubInfo(this, event);
            const filter = { address, topics, fromBlock, toBlock };
            const provider = getProvider(this.runner);
            assert(provider, "contract runner does not have a provider", "UNSUPPORTED_OPERATION", { operation: "queryFilter" });
            return (await provider.getLogs(filter)).map((log) => {
                let foundFragment = fragment;
                if (foundFragment == null) {
                    try {
                        foundFragment = this.interface.getEvent(log.topics[0]);
                    }
                    catch (error) { }
                }
                if (foundFragment) {
                    try {
                        return new EventLog(log, this.interface, foundFragment);
                    }
                    catch (error) {
                        return new UndecodedEventLog(log, error);
                    }
                }
                return new Log(log, provider);
            });
        }
        /**
         *  Add an event %%listener%% for the %%event%%.
         */
        async on(event, listener) {
            const sub = await getSub(this, "on", event);
            sub.listeners.push({ listener, once: false });
            sub.start();
            return this;
        }
        /**
         *  Add an event %%listener%% for the %%event%%, but remove the listener
         *  after it is fired once.
         */
        async once(event, listener) {
            const sub = await getSub(this, "once", event);
            sub.listeners.push({ listener, once: true });
            sub.start();
            return this;
        }
        /**
         *  Emit an %%event%% calling all listeners with %%args%%.
         *
         *  Resolves to ``true`` if any listeners were called.
         */
        async emit(event, ...args) {
            return await emit(this, event, args, null);
        }
        /**
         *  Resolves to the number of listeners of %%event%% or the total number
         *  of listeners if unspecified.
         */
        async listenerCount(event) {
            if (event) {
                const sub = await hasSub(this, event);
                if (!sub) {
                    return 0;
                }
                return sub.listeners.length;
            }
            const { subs } = getInternal(this);
            let total = 0;
            for (const { listeners } of subs.values()) {
                total += listeners.length;
            }
            return total;
        }
        /**
         *  Resolves to the listeners subscribed to %%event%% or all listeners
         *  if unspecified.
         */
        async listeners(event) {
            if (event) {
                const sub = await hasSub(this, event);
                if (!sub) {
                    return [];
                }
                return sub.listeners.map(({ listener }) => listener);
            }
            const { subs } = getInternal(this);
            let result = [];
            for (const { listeners } of subs.values()) {
                result = result.concat(listeners.map(({ listener }) => listener));
            }
            return result;
        }
        /**
         *  Remove the %%listener%% from the listeners for %%event%% or remove
         *  all listeners if unspecified.
         */
        async off(event, listener) {
            const sub = await hasSub(this, event);
            if (!sub) {
                return this;
            }
            if (listener) {
                const index = sub.listeners.map(({ listener }) => listener).indexOf(listener);
                if (index >= 0) {
                    sub.listeners.splice(index, 1);
                }
            }
            if (listener == null || sub.listeners.length === 0) {
                sub.stop();
                getInternal(this).subs.delete(sub.tag);
            }
            return this;
        }
        /**
         *  Remove all the listeners for %%event%% or remove all listeners if
         *  unspecified.
         */
        async removeAllListeners(event) {
            if (event) {
                const sub = await hasSub(this, event);
                if (!sub) {
                    return this;
                }
                sub.stop();
                getInternal(this).subs.delete(sub.tag);
            }
            else {
                const { subs } = getInternal(this);
                for (const { tag, stop } of subs.values()) {
                    stop();
                    subs.delete(tag);
                }
            }
            return this;
        }
        /**
         *  Alias for [on].
         */
        async addListener(event, listener) {
            return await this.on(event, listener);
        }
        /**
         *  Alias for [off].
         */
        async removeListener(event, listener) {
            return await this.off(event, listener);
        }
        /**
         *  Create a new Class for the %%abi%%.
         */
        static buildClass(abi) {
            class CustomContract extends BaseContract {
                constructor(address, runner = null) {
                    super(address, abi, runner);
                }
            }
            return CustomContract;
        }
        ;
        /**
         *  Create a new BaseContract with a specified Interface.
         */
        static from(target, abi, runner) {
            if (runner == null) {
                runner = null;
            }
            const contract = new this(target, abi, runner);
            return contract;
        }
    }
    function _ContractBase() {
        return BaseContract;
    }
    /**
     *  A [[BaseContract]] with no type guards on its methods or events.
     */
    class Contract extends _ContractBase() {
    }

    // A = Arguments to the constructor
    // I = Interface of deployed contracts
    /**
     *  A **ContractFactory** is used to deploy a Contract to the blockchain.
     */
    class ContractFactory {
        /**
         *  The Contract Interface.
         */
        interface;
        /**
         *  The Contract deployment bytecode. Often called the initcode.
         */
        bytecode;
        /**
         *  The ContractRunner to deploy the Contract as.
         */
        runner;
        /**
         *  Create a new **ContractFactory** with %%abi%% and %%bytecode%%,
         *  optionally connected to %%runner%%.
         *
         *  The %%bytecode%% may be the ``bytecode`` property within the
         *  standard Solidity JSON output.
         */
        constructor(abi, bytecode, runner) {
            const iface = Interface.from(abi);
            // Dereference Solidity bytecode objects and allow a missing `0x`-prefix
            if (bytecode instanceof Uint8Array) {
                bytecode = hexlify(getBytes(bytecode));
            }
            else {
                if (typeof (bytecode) === "object") {
                    bytecode = bytecode.object;
                }
                if (!bytecode.startsWith("0x")) {
                    bytecode = "0x" + bytecode;
                }
                bytecode = hexlify(getBytes(bytecode));
            }
            defineProperties(this, {
                bytecode, interface: iface, runner: (runner || null)
            });
        }
        attach(target) {
            return new BaseContract(target, this.interface, this.runner);
        }
        /**
         *  Resolves to the transaction to deploy the contract, passing %%args%%
         *  into the constructor.
         */
        async getDeployTransaction(...args) {
            let overrides = {};
            const fragment = this.interface.deploy;
            if (fragment.inputs.length + 1 === args.length) {
                overrides = await copyOverrides(args.pop());
            }
            if (fragment.inputs.length !== args.length) {
                throw new Error("incorrect number of arguments to constructor");
            }
            const resolvedArgs = await resolveArgs(this.runner, fragment.inputs, args);
            const data = concat([this.bytecode, this.interface.encodeDeploy(resolvedArgs)]);
            return Object.assign({}, overrides, { data });
        }
        /**
         *  Resolves to the Contract deployed by passing %%args%% into the
         *  constructor.
         *
         *  This will resovle to the Contract before it has been deployed to the
         *  network, so the [[BaseContract-waitForDeployment]] should be used before
         *  sending any transactions to it.
         */
        async deploy(...args) {
            const tx = await this.getDeployTransaction(...args);
            assert(this.runner && typeof (this.runner.sendTransaction) === "function", "factory runner does not support sending transactions", "UNSUPPORTED_OPERATION", {
                operation: "sendTransaction"
            });
            const sentTx = await this.runner.sendTransaction(tx);
            const address = getCreateAddress(sentTx);
            return new BaseContract(address, this.interface, this.runner, sentTx);
        }
        /**
         *  Return a new **ContractFactory** with the same ABI and bytecode,
         *  but connected to %%runner%%.
         */
        connect(runner) {
            return new ContractFactory(this.interface, this.bytecode, runner);
        }
        /**
         *  Create a new **ContractFactory** from the standard Solidity JSON output.
         */
        static fromSolidity(output, runner) {
            assertArgument(output != null, "bad compiler output", "output", output);
            if (typeof (output) === "string") {
                output = JSON.parse(output);
            }
            const abi = output.abi;
            let bytecode = "";
            if (output.bytecode) {
                bytecode = output.bytecode;
            }
            else if (output.evm && output.evm.bytecode) {
                bytecode = output.evm.bytecode;
            }
            return new this(abi, bytecode, runner);
        }
    }

    /**
     *  ENS is a service which allows easy-to-remember names to map to
     *  network addresses.
     *
     *  @_section: api/providers/ens-resolver:ENS Resolver  [about-ens-rsolver]
     */
    // @TODO: This should use the fetch-data:ipfs gateway
    // Trim off the ipfs:// prefix and return the default gateway URL
    function getIpfsLink(link) {
        if (link.match(/^ipfs:\/\/ipfs\//i)) {
            link = link.substring(12);
        }
        else if (link.match(/^ipfs:\/\//i)) {
            link = link.substring(7);
        }
        else {
            assertArgument(false, "unsupported IPFS format", "link", link);
        }
        return `https:/\/gateway.ipfs.io/ipfs/${link}`;
    }
    /**
     *  A provider plugin super-class for processing multicoin address types.
     */
    class MulticoinProviderPlugin {
        /**
         *  The name.
         */
        name;
        /**
         *  Creates a new **MulticoinProviderPluing** for %%name%%.
         */
        constructor(name) {
            defineProperties(this, { name });
        }
        connect(proivder) {
            return this;
        }
        /**
         *  Returns ``true`` if %%coinType%% is supported by this plugin.
         */
        supportsCoinType(coinType) {
            return false;
        }
        /**
         *  Resovles to the encoded %%address%% for %%coinType%%.
         */
        async encodeAddress(coinType, address) {
            throw new Error("unsupported coin");
        }
        /**
         *  Resovles to the decoded %%data%% for %%coinType%%.
         */
        async decodeAddress(coinType, data) {
            throw new Error("unsupported coin");
        }
    }
    const matcherIpfs = new RegExp("^(ipfs):/\/(.*)$", "i");
    const matchers = [
        new RegExp("^(https):/\/(.*)$", "i"),
        new RegExp("^(data):(.*)$", "i"),
        matcherIpfs,
        new RegExp("^eip155:[0-9]+/(erc[0-9]+):(.*)$", "i"),
    ];
    /**
     *  A connected object to a resolved ENS name resolver, which can be
     *  used to query additional details.
     */
    class EnsResolver {
        /**
         *  The connected provider.
         */
        provider;
        /**
         *  The address of the resolver.
         */
        address;
        /**
         *  The name this resolver was resolved against.
         */
        name;
        // For EIP-2544 names, the ancestor that provided the resolver
        #supports2544;
        #resolver;
        constructor(provider, address, name) {
            defineProperties(this, { provider, address, name });
            this.#supports2544 = null;
            this.#resolver = new Contract(address, [
                "function supportsInterface(bytes4) view returns (bool)",
                "function resolve(bytes, bytes) view returns (bytes)",
                "function addr(bytes32) view returns (address)",
                "function addr(bytes32, uint) view returns (bytes)",
                "function text(bytes32, string) view returns (string)",
                "function contenthash(bytes32) view returns (bytes)",
            ], provider);
        }
        /**
         *  Resolves to true if the resolver supports wildcard resolution.
         */
        async supportsWildcard() {
            if (this.#supports2544 == null) {
                this.#supports2544 = (async () => {
                    try {
                        return await this.#resolver.supportsInterface("0x9061b923");
                    }
                    catch (error) {
                        // Wildcard resolvers must understand supportsInterface
                        // and return true.
                        if (isError(error, "CALL_EXCEPTION")) {
                            return false;
                        }
                        // Let future attempts try again...
                        this.#supports2544 = null;
                        throw error;
                    }
                })();
            }
            return await this.#supports2544;
        }
        async #fetch(funcName, params) {
            params = (params || []).slice();
            const iface = this.#resolver.interface;
            // The first parameters is always the nodehash
            params.unshift(namehash(this.name));
            let fragment = null;
            if (await this.supportsWildcard()) {
                fragment = iface.getFunction(funcName);
                assert(fragment, "missing fragment", "UNKNOWN_ERROR", {
                    info: { funcName }
                });
                params = [
                    dnsEncode(this.name),
                    iface.encodeFunctionData(fragment, params)
                ];
                funcName = "resolve(bytes,bytes)";
            }
            params.push({
                enableCcipRead: true
            });
            try {
                const result = await this.#resolver[funcName](...params);
                if (fragment) {
                    return iface.decodeFunctionResult(fragment, result)[0];
                }
                return result;
            }
            catch (error) {
                if (!isError(error, "CALL_EXCEPTION")) {
                    throw error;
                }
            }
            return null;
        }
        /**
         *  Resolves to the address for %%coinType%% or null if the
         *  provided %%coinType%% has not been configured.
         */
        async getAddress(coinType) {
            if (coinType == null) {
                coinType = 60;
            }
            if (coinType === 60) {
                try {
                    const result = await this.#fetch("addr(bytes32)");
                    // No address
                    if (result == null || result === ZeroAddress) {
                        return null;
                    }
                    return result;
                }
                catch (error) {
                    if (isError(error, "CALL_EXCEPTION")) {
                        return null;
                    }
                    throw error;
                }
            }
            // Try decoding its EVM canonical chain as an EVM chain address first
            if (coinType >= 0 && coinType < 0x80000000) {
                let ethCoinType = coinType + 0x80000000;
                const data = await this.#fetch("addr(bytes32,uint)", [ethCoinType]);
                if (isHexString(data, 20)) {
                    return getAddress(data);
                }
            }
            let coinPlugin = null;
            for (const plugin of this.provider.plugins) {
                if (!(plugin instanceof MulticoinProviderPlugin)) {
                    continue;
                }
                if (plugin.supportsCoinType(coinType)) {
                    coinPlugin = plugin;
                    break;
                }
            }
            if (coinPlugin == null) {
                return null;
            }
            // keccak256("addr(bytes32,uint256")
            const data = await this.#fetch("addr(bytes32,uint)", [coinType]);
            // No address
            if (data == null || data === "0x") {
                return null;
            }
            // Compute the address
            const address = await coinPlugin.decodeAddress(coinType, data);
            if (address != null) {
                return address;
            }
            assert(false, `invalid coin data`, "UNSUPPORTED_OPERATION", {
                operation: `getAddress(${coinType})`,
                info: { coinType, data }
            });
        }
        /**
         *  Resolves to the EIP-634 text record for %%key%%, or ``null``
         *  if unconfigured.
         */
        async getText(key) {
            const data = await this.#fetch("text(bytes32,string)", [key]);
            if (data == null || data === "0x") {
                return null;
            }
            return data;
        }
        /**
         *  Rsolves to the content-hash or ``null`` if unconfigured.
         */
        async getContentHash() {
            // keccak256("contenthash()")
            const data = await this.#fetch("contenthash(bytes32)");
            // No contenthash
            if (data == null || data === "0x") {
                return null;
            }
            // IPFS (CID: 1, Type: 70=DAG-PB, 72=libp2p-key)
            const ipfs = data.match(/^0x(e3010170|e5010172)(([0-9a-f][0-9a-f])([0-9a-f][0-9a-f])([0-9a-f]*))$/);
            if (ipfs) {
                const scheme = (ipfs[1] === "e3010170") ? "ipfs" : "ipns";
                const length = parseInt(ipfs[4], 16);
                if (ipfs[5].length === length * 2) {
                    return `${scheme}:/\/${encodeBase58("0x" + ipfs[2])}`;
                }
            }
            // Swarm (CID: 1, Type: swarm-manifest; hash/length hard-coded to keccak256/32)
            const swarm = data.match(/^0xe40101fa011b20([0-9a-f]*)$/);
            if (swarm && swarm[1].length === 64) {
                return `bzz:/\/${swarm[1]}`;
            }
            assert(false, `invalid or unsupported content hash data`, "UNSUPPORTED_OPERATION", {
                operation: "getContentHash()",
                info: { data }
            });
        }
        /**
         *  Resolves to the avatar url or ``null`` if the avatar is either
         *  unconfigured or incorrectly configured (e.g. references an NFT
         *  not owned by the address).
         *
         *  If diagnosing issues with configurations, the [[_getAvatar]]
         *  method may be useful.
         */
        async getAvatar() {
            const avatar = await this._getAvatar();
            return avatar.url;
        }
        /**
         *  When resolving an avatar, there are many steps involved, such
         *  fetching metadata and possibly validating ownership of an
         *  NFT.
         *
         *  This method can be used to examine each step and the value it
         *  was working from.
         */
        async _getAvatar() {
            const linkage = [{ type: "name", value: this.name }];
            try {
                // test data for ricmoo.eth
                //const avatar = "eip155:1/erc721:0x265385c7f4132228A0d54EB1A9e7460b91c0cC68/29233";
                const avatar = await this.getText("avatar");
                if (avatar == null) {
                    linkage.push({ type: "!avatar", value: "" });
                    return { url: null, linkage };
                }
                linkage.push({ type: "avatar", value: avatar });
                for (let i = 0; i < matchers.length; i++) {
                    const match = avatar.match(matchers[i]);
                    if (match == null) {
                        continue;
                    }
                    const scheme = match[1].toLowerCase();
                    switch (scheme) {
                        case "https":
                        case "data":
                            linkage.push({ type: "url", value: avatar });
                            return { linkage, url: avatar };
                        case "ipfs": {
                            const url = getIpfsLink(avatar);
                            linkage.push({ type: "ipfs", value: avatar });
                            linkage.push({ type: "url", value: url });
                            return { linkage, url };
                        }
                        case "erc721":
                        case "erc1155": {
                            // Depending on the ERC type, use tokenURI(uint256) or url(uint256)
                            const selector = (scheme === "erc721") ? "tokenURI(uint256)" : "uri(uint256)";
                            linkage.push({ type: scheme, value: avatar });
                            // The owner of this name
                            const owner = await this.getAddress();
                            if (owner == null) {
                                linkage.push({ type: "!owner", value: "" });
                                return { url: null, linkage };
                            }
                            const comps = (match[2] || "").split("/");
                            if (comps.length !== 2) {
                                linkage.push({ type: `!${scheme}caip`, value: (match[2] || "") });
                                return { url: null, linkage };
                            }
                            const tokenId = comps[1];
                            const contract = new Contract(comps[0], [
                                // ERC-721
                                "function tokenURI(uint) view returns (string)",
                                "function ownerOf(uint) view returns (address)",
                                // ERC-1155
                                "function uri(uint) view returns (string)",
                                "function balanceOf(address, uint256) view returns (uint)"
                            ], this.provider);
                            // Check that this account owns the token
                            if (scheme === "erc721") {
                                const tokenOwner = await contract.ownerOf(tokenId);
                                if (owner !== tokenOwner) {
                                    linkage.push({ type: "!owner", value: tokenOwner });
                                    return { url: null, linkage };
                                }
                                linkage.push({ type: "owner", value: tokenOwner });
                            }
                            else if (scheme === "erc1155") {
                                const balance = await contract.balanceOf(owner, tokenId);
                                if (!balance) {
                                    linkage.push({ type: "!balance", value: "0" });
                                    return { url: null, linkage };
                                }
                                linkage.push({ type: "balance", value: balance.toString() });
                            }
                            // Call the token contract for the metadata URL
                            let metadataUrl = await contract[selector](tokenId);
                            if (metadataUrl == null || metadataUrl === "0x") {
                                linkage.push({ type: "!metadata-url", value: "" });
                                return { url: null, linkage };
                            }
                            linkage.push({ type: "metadata-url-base", value: metadataUrl });
                            // ERC-1155 allows a generic {id} in the URL
                            if (scheme === "erc1155") {
                                metadataUrl = metadataUrl.replace("{id}", toBeHex(tokenId, 32).substring(2));
                                linkage.push({ type: "metadata-url-expanded", value: metadataUrl });
                            }
                            // Transform IPFS metadata links
                            if (metadataUrl.match(/^ipfs:/i)) {
                                metadataUrl = getIpfsLink(metadataUrl);
                            }
                            linkage.push({ type: "metadata-url", value: metadataUrl });
                            // Get the token metadata
                            let metadata = {};
                            const response = await (new FetchRequest(metadataUrl)).send();
                            response.assertOk();
                            try {
                                metadata = response.bodyJson;
                            }
                            catch (error) {
                                try {
                                    linkage.push({ type: "!metadata", value: response.bodyText });
                                }
                                catch (error) {
                                    const bytes = response.body;
                                    if (bytes) {
                                        linkage.push({ type: "!metadata", value: hexlify(bytes) });
                                    }
                                    return { url: null, linkage };
                                }
                                return { url: null, linkage };
                            }
                            if (!metadata) {
                                linkage.push({ type: "!metadata", value: "" });
                                return { url: null, linkage };
                            }
                            linkage.push({ type: "metadata", value: JSON.stringify(metadata) });
                            // Pull the image URL out
                            let imageUrl = metadata.image;
                            if (typeof (imageUrl) !== "string") {
                                linkage.push({ type: "!imageUrl", value: "" });
                                return { url: null, linkage };
                            }
                            if (imageUrl.match(/^(https:\/\/|data:)/i)) {
                                // Allow
                            }
                            else {
                                // Transform IPFS link to gateway
                                const ipfs = imageUrl.match(matcherIpfs);
                                if (ipfs == null) {
                                    linkage.push({ type: "!imageUrl-ipfs", value: imageUrl });
                                    return { url: null, linkage };
                                }
                                linkage.push({ type: "imageUrl-ipfs", value: imageUrl });
                                imageUrl = getIpfsLink(imageUrl);
                            }
                            linkage.push({ type: "url", value: imageUrl });
                            return { linkage, url: imageUrl };
                        }
                    }
                }
            }
            catch (error) { }
            return { linkage, url: null };
        }
        static async getEnsAddress(provider) {
            const network = await provider.getNetwork();
            const ensPlugin = network.getPlugin("org.ethers.plugins.network.Ens");
            // No ENS...
            assert(ensPlugin, "network does not support ENS", "UNSUPPORTED_OPERATION", {
                operation: "getEnsAddress", info: { network }
            });
            return ensPlugin.address;
        }
        static async #getResolver(provider, name) {
            const ensAddr = await EnsResolver.getEnsAddress(provider);
            try {
                const contract = new Contract(ensAddr, [
                    "function resolver(bytes32) view returns (address)"
                ], provider);
                const addr = await contract.resolver(namehash(name), {
                    enableCcipRead: true
                });
                if (addr === ZeroAddress) {
                    return null;
                }
                return addr;
            }
            catch (error) {
                // ENS registry cannot throw errors on resolver(bytes32),
                // so probably a link error
                throw error;
            }
            return null;
        }
        /**
         *  Resolve to the ENS resolver for %%name%% using %%provider%% or
         *  ``null`` if unconfigured.
         */
        static async fromName(provider, name) {
            let currentName = name;
            while (true) {
                if (currentName === "" || currentName === ".") {
                    return null;
                }
                // Optimization since the eth node cannot change and does
                // not have a wildcard resolver
                if (name !== "eth" && currentName === "eth") {
                    return null;
                }
                // Check the current node for a resolver
                const addr = await EnsResolver.#getResolver(provider, currentName);
                // Found a resolver!
                if (addr != null) {
                    const resolver = new EnsResolver(provider, addr, name);
                    // Legacy resolver found, using EIP-2544 so it isn't safe to use
                    if (currentName !== name && !(await resolver.supportsWildcard())) {
                        return null;
                    }
                    return resolver;
                }
                // Get the parent node
                currentName = currentName.split(".").slice(1).join(".");
            }
        }
    }

    /**
     *  @_ignore
     */
    const BN_0 = BigInt(0);
    function allowNull(format, nullValue) {
        return (function (value) {
            if (value == null) {
                return nullValue;
            }
            return format(value);
        });
    }
    function arrayOf(format) {
        return ((array) => {
            if (!Array.isArray(array)) {
                throw new Error("not an array");
            }
            return array.map((i) => format(i));
        });
    }
    // Requires an object which matches a fleet of other formatters
    // Any FormatFunc may return `undefined` to have the value omitted
    // from the result object. Calls preserve `this`.
    function object(format, altNames) {
        return ((value) => {
            const result = {};
            for (const key in format) {
                let srcKey = key;
                if (altNames && key in altNames && !(srcKey in value)) {
                    for (const altKey of altNames[key]) {
                        if (altKey in value) {
                            srcKey = altKey;
                            break;
                        }
                    }
                }
                try {
                    const nv = format[key](value[srcKey]);
                    if (nv !== undefined) {
                        result[key] = nv;
                    }
                }
                catch (error) {
                    const message = (error instanceof Error) ? error.message : "not-an-error";
                    assert(false, `invalid value for value.${key} (${message})`, "BAD_DATA", { value });
                }
            }
            return result;
        });
    }
    function formatBoolean(value) {
        switch (value) {
            case true:
            case "true":
                return true;
            case false:
            case "false":
                return false;
        }
        assertArgument(false, `invalid boolean; ${JSON.stringify(value)}`, "value", value);
    }
    function formatData(value) {
        assertArgument(isHexString(value, true), "invalid data", "value", value);
        return value;
    }
    function formatHash(value) {
        assertArgument(isHexString(value, 32), "invalid hash", "value", value);
        return value;
    }
    const _formatLog = object({
        address: getAddress,
        blockHash: formatHash,
        blockNumber: getNumber,
        data: formatData,
        index: getNumber,
        removed: allowNull(formatBoolean, false),
        topics: arrayOf(formatHash),
        transactionHash: formatHash,
        transactionIndex: getNumber,
    }, {
        index: ["logIndex"]
    });
    function formatLog(value) {
        return _formatLog(value);
    }
    const _formatBlock = object({
        hash: allowNull(formatHash),
        parentHash: formatHash,
        number: getNumber,
        timestamp: getNumber,
        nonce: allowNull(formatData),
        difficulty: getBigInt,
        gasLimit: getBigInt,
        gasUsed: getBigInt,
        miner: allowNull(getAddress),
        extraData: formatData,
        baseFeePerGas: allowNull(getBigInt)
    });
    function formatBlock(value) {
        const result = _formatBlock(value);
        result.transactions = value.transactions.map((tx) => {
            if (typeof (tx) === "string") {
                return tx;
            }
            return formatTransactionResponse(tx);
        });
        return result;
    }
    const _formatReceiptLog = object({
        transactionIndex: getNumber,
        blockNumber: getNumber,
        transactionHash: formatHash,
        address: getAddress,
        topics: arrayOf(formatHash),
        data: formatData,
        index: getNumber,
        blockHash: formatHash,
    }, {
        index: ["logIndex"]
    });
    function formatReceiptLog(value) {
        return _formatReceiptLog(value);
    }
    const _formatTransactionReceipt = object({
        to: allowNull(getAddress, null),
        from: allowNull(getAddress, null),
        contractAddress: allowNull(getAddress, null),
        // should be allowNull(hash), but broken-EIP-658 support is handled in receipt
        index: getNumber,
        root: allowNull(hexlify),
        gasUsed: getBigInt,
        logsBloom: allowNull(formatData),
        blockHash: formatHash,
        hash: formatHash,
        logs: arrayOf(formatReceiptLog),
        blockNumber: getNumber,
        //confirmations: allowNull(getNumber, null),
        cumulativeGasUsed: getBigInt,
        effectiveGasPrice: allowNull(getBigInt),
        status: allowNull(getNumber),
        type: allowNull(getNumber, 0)
    }, {
        effectiveGasPrice: ["gasPrice"],
        hash: ["transactionHash"],
        index: ["transactionIndex"],
    });
    function formatTransactionReceipt(value) {
        return _formatTransactionReceipt(value);
    }
    function formatTransactionResponse(value) {
        // Some clients (TestRPC) do strange things like return 0x0 for the
        // 0 address; correct this to be a real address
        if (value.to && getBigInt(value.to) === BN_0) {
            value.to = "0x0000000000000000000000000000000000000000";
        }
        const result = object({
            hash: formatHash,
            type: (value) => {
                if (value === "0x" || value == null) {
                    return 0;
                }
                return getNumber(value);
            },
            accessList: allowNull(accessListify, null),
            blockHash: allowNull(formatHash, null),
            blockNumber: allowNull(getNumber, null),
            transactionIndex: allowNull(getNumber, null),
            //confirmations: allowNull(getNumber, null),
            from: getAddress,
            // either (gasPrice) or (maxPriorityFeePerGas + maxFeePerGas) must be set
            gasPrice: allowNull(getBigInt),
            maxPriorityFeePerGas: allowNull(getBigInt),
            maxFeePerGas: allowNull(getBigInt),
            gasLimit: getBigInt,
            to: allowNull(getAddress, null),
            value: getBigInt,
            nonce: getNumber,
            data: formatData,
            creates: allowNull(getAddress, null),
            chainId: allowNull(getBigInt, null)
        }, {
            data: ["input"],
            gasLimit: ["gas"]
        })(value);
        // If to and creates are empty, populate the creates from the value
        if (result.to == null && result.creates == null) {
            result.creates = getCreateAddress(result);
        }
        // @TODO: Check fee data
        // Add an access list to supported transaction types
        if ((value.type === 1 || value.type === 2) && value.accessList == null) {
            result.accessList = [];
        }
        // Compute the signature
        if (value.signature) {
            result.signature = Signature.from(value.signature);
        }
        else {
            result.signature = Signature.from(value);
        }
        // Some backends omit ChainId on legacy transactions, but we can compute it
        if (result.chainId == null) {
            const chainId = result.signature.legacyChainId;
            if (chainId != null) {
                result.chainId = chainId;
            }
        }
        // @TODO: check chainID
        /*
        if (value.chainId != null) {
            let chainId = value.chainId;

            if (isHexString(chainId)) {
                chainId = BigNumber.from(chainId).toNumber();
            }

            result.chainId = chainId;

        } else {
            let chainId = value.networkId;

            // geth-etc returns chainId
            if (chainId == null && result.v == null) {
                chainId = value.chainId;
            }

            if (isHexString(chainId)) {
                chainId = BigNumber.from(chainId).toNumber();
            }

            if (typeof(chainId) !== "number" && result.v != null) {
                chainId = (result.v - 35) / 2;
                if (chainId < 0) { chainId = 0; }
                chainId = parseInt(chainId);
            }

            if (typeof(chainId) !== "number") { chainId = 0; }

            result.chainId = chainId;
        }
        */
        // 0x0000... should actually be null
        if (result.blockHash && getBigInt(result.blockHash) === BN_0) {
            result.blockHash = null;
        }
        return result;
    }

    const EnsAddress = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
    /**
     *  A **NetworkPlugin** provides additional functionality on a [[Network]].
     */
    class NetworkPlugin {
        /**
         *  The name of the plugin.
         *
         *  It is recommended to use reverse-domain-notation, which permits
         *  unique names with a known authority as well as hierarchal entries.
         */
        name;
        /**
         *  Creates a new **NetworkPlugin**.
         */
        constructor(name) {
            defineProperties(this, { name });
        }
        /**
         *  Creates a copy of this plugin.
         */
        clone() {
            return new NetworkPlugin(this.name);
        }
    }
    /**
     *  A **GasCostPlugin** allows a network to provide alternative values when
     *  computing the intrinsic gas required for a transaction.
     */
    class GasCostPlugin extends NetworkPlugin {
        /**
         *  The block number to treat these values as valid from.
         *
         *  This allows a hardfork to have updated values included as well as
         *  mulutiple hardforks to be supported.
         */
        effectiveBlock;
        /**
         *  The transactions base fee.
         */
        txBase;
        /**
         *  The fee for creating a new account.
         */
        txCreate;
        /**
         *  The fee per zero-byte in the data.
         */
        txDataZero;
        /**
         *  The fee per non-zero-byte in the data.
         */
        txDataNonzero;
        /**
         *  The fee per storage key in the [[link-eip-2930]] access list.
         */
        txAccessListStorageKey;
        /**
         *  The fee per address in the [[link-eip-2930]] access list.
         */
        txAccessListAddress;
        /**
         *  Creates a new GasCostPlugin from %%effectiveBlock%% until the
         *  latest block or another GasCostPlugin supercedes that block number,
         *  with the associated %%costs%%.
         */
        constructor(effectiveBlock, costs) {
            if (effectiveBlock == null) {
                effectiveBlock = 0;
            }
            super(`org.ethers.network.plugins.GasCost#${(effectiveBlock || 0)}`);
            const props = { effectiveBlock };
            function set(name, nullish) {
                let value = (costs || {})[name];
                if (value == null) {
                    value = nullish;
                }
                assertArgument(typeof (value) === "number", `invalud value for ${name}`, "costs", costs);
                props[name] = value;
            }
            set("txBase", 21000);
            set("txCreate", 32000);
            set("txDataZero", 4);
            set("txDataNonzero", 16);
            set("txAccessListStorageKey", 1900);
            set("txAccessListAddress", 2400);
            defineProperties(this, props);
        }
        clone() {
            return new GasCostPlugin(this.effectiveBlock, this);
        }
    }
    /**
     *  An **EnsPlugin** allows a [[Network]] to specify the ENS Registry
     *  Contract address and the target network to use when using that
     *  contract.
     *
     *  Various testnets have their own instance of the contract to use, but
     *  in general, the mainnet instance supports multi-chain addresses and
     *  should be used.
     */
    class EnsPlugin extends NetworkPlugin {
        /**
         *  The ENS Registrty Contract address.
         */
        address;
        /**
         *  The chain ID that the ENS contract lives on.
         */
        targetNetwork;
        /**
         *  Creates a new **EnsPlugin** connected to %%address%% on the
         *  %%targetNetwork%%. The default ENS address and mainnet is used
         *  if unspecified.
         */
        constructor(address, targetNetwork) {
            super("org.ethers.plugins.network.Ens");
            defineProperties(this, {
                address: (address || EnsAddress),
                targetNetwork: ((targetNetwork == null) ? 1 : targetNetwork)
            });
        }
        clone() {
            return new EnsPlugin(this.address, this.targetNetwork);
        }
    }
    /**
     *  A **FeeDataNetworkPlugin** allows a network to provide and alternate
     *  means to specify its fee data.
     *
     *  For example, a network which does not support [[link-eip-1559]] may
     *  choose to use a Gas Station site to approximate the gas price.
     */
    class FeeDataNetworkPlugin extends NetworkPlugin {
        #feeDataFunc;
        /**
         *  The fee data function provided to the constructor.
         */
        get feeDataFunc() {
            return this.#feeDataFunc;
        }
        /**
         *  Creates a new **FeeDataNetworkPlugin**.
         */
        constructor(feeDataFunc) {
            super("org.ethers.plugins.network.FeeData");
            this.#feeDataFunc = feeDataFunc;
        }
        /**
         *  Resolves to the fee data.
         */
        async getFeeData(provider) {
            return await this.#feeDataFunc(provider);
        }
        clone() {
            return new FeeDataNetworkPlugin(this.#feeDataFunc);
        }
    }
    class FetchUrlFeeDataNetworkPlugin extends NetworkPlugin {
        #url;
        #processFunc;
        /**
         *  The URL to initialize the FetchRequest with in %%processFunc%%.
         */
        get url() { return this.#url; }
        /**
         *  The callback to use when computing the FeeData.
         */
        get processFunc() { return this.#processFunc; }
        /**
         *  Creates a new **FetchUrlFeeDataNetworkPlugin** which will
         *  be used when computing the fee data for the network.
         */
        constructor(url, processFunc) {
            super("org.ethers.plugins.network.FetchUrlFeeDataPlugin");
            this.#url = url;
            this.#processFunc = processFunc;
        }
        // We are immutable, so we can serve as our own clone
        clone() { return this; }
    }
    /*
    export class CustomBlockNetworkPlugin extends NetworkPlugin {
        readonly #blockFunc: (provider: Provider, block: BlockParams<string>) => Block<string>;
        readonly #blockWithTxsFunc: (provider: Provider, block: BlockParams<TransactionResponseParams>) => Block<TransactionResponse>;

        constructor(blockFunc: (provider: Provider, block: BlockParams<string>) => Block<string>, blockWithTxsFunc: (provider: Provider, block: BlockParams<TransactionResponseParams>) => Block<TransactionResponse>) {
            super("org.ethers.network-plugins.custom-block");
            this.#blockFunc = blockFunc;
            this.#blockWithTxsFunc = blockWithTxsFunc;
        }

        async getBlock(provider: Provider, block: BlockParams<string>): Promise<Block<string>> {
            return await this.#blockFunc(provider, block);
        }

        async getBlockions(provider: Provider, block: BlockParams<TransactionResponseParams>): Promise<Block<TransactionResponse>> {
            return await this.#blockWithTxsFunc(provider, block);
        }

        clone(): CustomBlockNetworkPlugin {
            return new CustomBlockNetworkPlugin(this.#blockFunc, this.#blockWithTxsFunc);
        }
    }
    */

    /**
     *  A **Network** encapsulates the various properties required to
     *  interact with a specific chain.
     *
     *  @_subsection: api/providers:Networks  [networks]
     */
    /* * * *
    // Networks which operation against an L2 can use this plugin to
    // specify how to access L1, for the purpose of resolving ENS,
    // for example.
    export class LayerOneConnectionPlugin extends NetworkPlugin {
        readonly provider!: Provider;
    // @TODO: Rename to ChainAccess and allow for connecting to any chain
        constructor(provider: Provider) {
            super("org.ethers.plugins.layer-one-connection");
            defineProperties<LayerOneConnectionPlugin>(this, { provider });
        }

        clone(): LayerOneConnectionPlugin {
            return new LayerOneConnectionPlugin(this.provider);
        }
    }
    */
    const Networks = new Map();
    /**
     *  A **Network** provides access to a chain's properties and allows
     *  for plug-ins to extend functionality.
     */
    class Network {
        #name;
        #chainId;
        #plugins;
        /**
         *  Creates a new **Network** for %%name%% and %%chainId%%.
         */
        constructor(name, chainId) {
            this.#name = name;
            this.#chainId = getBigInt(chainId);
            this.#plugins = new Map();
        }
        /**
         *  Returns a JSON-compatible representation of a Network.
         */
        toJSON() {
            return { name: this.name, chainId: String(this.chainId) };
        }
        /**
         *  The network common name.
         *
         *  This is the canonical name, as networks migh have multiple
         *  names.
         */
        get name() { return this.#name; }
        set name(value) { this.#name = value; }
        /**
         *  The network chain ID.
         */
        get chainId() { return this.#chainId; }
        set chainId(value) { this.#chainId = getBigInt(value, "chainId"); }
        /**
         *  Returns true if %%other%% matches this network. Any chain ID
         *  must match, and if no chain ID is present, the name must match.
         *
         *  This method does not currently check for additional properties,
         *  such as ENS address or plug-in compatibility.
         */
        matches(other) {
            if (other == null) {
                return false;
            }
            if (typeof (other) === "string") {
                try {
                    return (this.chainId === getBigInt(other));
                }
                catch (error) { }
                return (this.name === other);
            }
            if (typeof (other) === "number" || typeof (other) === "bigint") {
                try {
                    return (this.chainId === getBigInt(other));
                }
                catch (error) { }
                return false;
            }
            if (typeof (other) === "object") {
                if (other.chainId != null) {
                    try {
                        return (this.chainId === getBigInt(other.chainId));
                    }
                    catch (error) { }
                    return false;
                }
                if (other.name != null) {
                    return (this.name === other.name);
                }
                return false;
            }
            return false;
        }
        /**
         *  Returns the list of plugins currently attached to this Network.
         */
        get plugins() {
            return Array.from(this.#plugins.values());
        }
        /**
         *  Attach a new %%plugin%% to this Network. The network name
         *  must be unique, excluding any fragment.
         */
        attachPlugin(plugin) {
            if (this.#plugins.get(plugin.name)) {
                throw new Error(`cannot replace existing plugin: ${plugin.name} `);
            }
            this.#plugins.set(plugin.name, plugin.clone());
            return this;
        }
        /**
         *  Return the plugin, if any, matching %%name%% exactly. Plugins
         *  with fragments will not be returned unless %%name%% includes
         *  a fragment.
         */
        getPlugin(name) {
            return (this.#plugins.get(name)) || null;
        }
        /**
         *  Gets a list of all plugins that match %%name%%, with otr without
         *  a fragment.
         */
        getPlugins(basename) {
            return (this.plugins.filter((p) => (p.name.split("#")[0] === basename)));
        }
        /**
         *  Create a copy of this Network.
         */
        clone() {
            const clone = new Network(this.name, this.chainId);
            this.plugins.forEach((plugin) => {
                clone.attachPlugin(plugin.clone());
            });
            return clone;
        }
        /**
         *  Compute the intrinsic gas required for a transaction.
         *
         *  A GasCostPlugin can be attached to override the default
         *  values.
         */
        computeIntrinsicGas(tx) {
            const costs = this.getPlugin("org.ethers.plugins.network.GasCost") || (new GasCostPlugin());
            let gas = costs.txBase;
            if (tx.to == null) {
                gas += costs.txCreate;
            }
            if (tx.data) {
                for (let i = 2; i < tx.data.length; i += 2) {
                    if (tx.data.substring(i, i + 2) === "00") {
                        gas += costs.txDataZero;
                    }
                    else {
                        gas += costs.txDataNonzero;
                    }
                }
            }
            if (tx.accessList) {
                const accessList = accessListify(tx.accessList);
                for (const addr in accessList) {
                    gas += costs.txAccessListAddress + costs.txAccessListStorageKey * accessList[addr].storageKeys.length;
                }
            }
            return gas;
        }
        /**
         *  Returns a new Network for the %%network%% name or chainId.
         */
        static from(network) {
            injectCommonNetworks();
            // Default network
            if (network == null) {
                return Network.from("mainnet");
            }
            // Canonical name or chain ID
            if (typeof (network) === "number") {
                network = BigInt(network);
            }
            if (typeof (network) === "string" || typeof (network) === "bigint") {
                const networkFunc = Networks.get(network);
                if (networkFunc) {
                    return networkFunc();
                }
                if (typeof (network) === "bigint") {
                    return new Network("unknown", network);
                }
                assertArgument(false, "unknown network", "network", network);
            }
            // Clonable with network-like abilities
            if (typeof (network.clone) === "function") {
                const clone = network.clone();
                //if (typeof(network.name) !== "string" || typeof(network.chainId) !== "number") {
                //}
                return clone;
            }
            // Networkish
            if (typeof (network) === "object") {
                assertArgument(typeof (network.name) === "string" && typeof (network.chainId) === "number", "invalid network object name or chainId", "network", network);
                const custom = new Network((network.name), (network.chainId));
                if (network.ensAddress || network.ensNetwork != null) {
                    custom.attachPlugin(new EnsPlugin(network.ensAddress, network.ensNetwork));
                }
                //if ((<any>network).layerOneConnection) {
                //    custom.attachPlugin(new LayerOneConnectionPlugin((<any>network).layerOneConnection));
                //}
                return custom;
            }
            assertArgument(false, "invalid network", "network", network);
        }
        /**
         *  Register %%nameOrChainId%% with a function which returns
         *  an instance of a Network representing that chain.
         */
        static register(nameOrChainId, networkFunc) {
            if (typeof (nameOrChainId) === "number") {
                nameOrChainId = BigInt(nameOrChainId);
            }
            const existing = Networks.get(nameOrChainId);
            if (existing) {
                assertArgument(false, `conflicting network for ${JSON.stringify(existing.name)}`, "nameOrChainId", nameOrChainId);
            }
            Networks.set(nameOrChainId, networkFunc);
        }
    }
    // We don't want to bring in formatUnits because it is backed by
    // FixedNumber and we want to keep Networks tiny. The values
    // included by the Gas Stations are also IEEE 754 with lots of
    // rounding issues and exceed the strict checks formatUnits has.
    function parseUnits(_value, decimals) {
        const value = String(_value);
        if (!value.match(/^[0-9.]+$/)) {
            throw new Error(`invalid gwei value: ${_value}`);
        }
        // Break into [ whole, fraction ]
        const comps = value.split(".");
        if (comps.length === 1) {
            comps.push("");
        }
        // More than 1 decimal point or too many fractional positions
        if (comps.length !== 2) {
            throw new Error(`invalid gwei value: ${_value}`);
        }
        // Pad the fraction to 9 decimalplaces
        while (comps[1].length < decimals) {
            comps[1] += "0";
        }
        // Too many decimals and some non-zero ending, take the ceiling
        if (comps[1].length > 9) {
            let frac = BigInt(comps[1].substring(0, 9));
            if (!comps[1].substring(9).match(/^0+$/)) {
                frac++;
            }
            comps[1] = frac.toString();
        }
        return BigInt(comps[0] + comps[1]);
    }
    // Used by Polygon to use a gas station for fee data
    function getGasStationPlugin(url) {
        return new FetchUrlFeeDataNetworkPlugin(url, async (fetchFeeData, provider, request) => {
            // Prevent Cloudflare from blocking our request in node.js
            request.setHeader("User-Agent", "ethers");
            let response;
            try {
                const [_response, _feeData] = await Promise.all([
                    request.send(), fetchFeeData()
                ]);
                response = _response;
                const payload = response.bodyJson.standard;
                const feeData = {
                    gasPrice: _feeData.gasPrice,
                    maxFeePerGas: parseUnits(payload.maxFee, 9),
                    maxPriorityFeePerGas: parseUnits(payload.maxPriorityFee, 9),
                };
                return feeData;
            }
            catch (error) {
                assert(false, `error encountered with polygon gas station (${JSON.stringify(request.url)})`, "SERVER_ERROR", { request, response, error });
            }
        });
    }
    // See: https://chainlist.org
    let injected = false;
    function injectCommonNetworks() {
        if (injected) {
            return;
        }
        injected = true;
        /// Register popular Ethereum networks
        function registerEth(name, chainId, options) {
            const func = function () {
                const network = new Network(name, chainId);
                // We use 0 to disable ENS
                if (options.ensNetwork != null) {
                    network.attachPlugin(new EnsPlugin(null, options.ensNetwork));
                }
                network.attachPlugin(new GasCostPlugin());
                (options.plugins || []).forEach((plugin) => {
                    network.attachPlugin(plugin);
                });
                return network;
            };
            // Register the network by name and chain ID
            Network.register(name, func);
            Network.register(chainId, func);
            if (options.altNames) {
                options.altNames.forEach((name) => {
                    Network.register(name, func);
                });
            }
        }
        registerEth("mainnet", 1, { ensNetwork: 1, altNames: ["homestead"] });
        registerEth("ropsten", 3, { ensNetwork: 3 });
        registerEth("rinkeby", 4, { ensNetwork: 4 });
        registerEth("goerli", 5, { ensNetwork: 5 });
        registerEth("kovan", 42, { ensNetwork: 42 });
        registerEth("sepolia", 11155111, { ensNetwork: 11155111 });
        registerEth("classic", 61, {});
        registerEth("classicKotti", 6, {});
        registerEth("arbitrum", 42161, {
            ensNetwork: 1,
        });
        registerEth("arbitrum-goerli", 421613, {});
        registerEth("base", 8453, { ensNetwork: 1 });
        registerEth("base-goerli", 84531, {});
        registerEth("base-sepolia", 84532, {});
        registerEth("bnb", 56, { ensNetwork: 1 });
        registerEth("bnbt", 97, {});
        registerEth("linea", 59144, { ensNetwork: 1 });
        registerEth("linea-goerli", 59140, {});
        registerEth("matic", 137, {
            ensNetwork: 1,
            plugins: [
                getGasStationPlugin("https:/\/gasstation.polygon.technology/v2")
            ]
        });
        registerEth("matic-mumbai", 80001, {
            altNames: ["maticMumbai", "maticmum"],
            plugins: [
                getGasStationPlugin("https:/\/gasstation-testnet.polygon.technology/v2")
            ]
        });
        registerEth("optimism", 10, {
            ensNetwork: 1,
            plugins: []
        });
        registerEth("optimism-goerli", 420, {});
        registerEth("xdai", 100, { ensNetwork: 1 });
    }

    /**
     *  The available providers should suffice for most developers purposes,
     *  but the [[AbstractProvider]] class has many features which enable
     *  sub-classing it for specific purposes.
     *
     *  @_section: api/providers/abstract-provider: Subclassing Provider  [abstract-provider]
     */
    // @TODO
    // Event coalescence
    //   When we register an event with an async value (e.g. address is a Signer
    //   or ENS name), we need to add it immeidately for the Event API, but also
    //   need time to resolve the address. Upon resolving the address, we need to
    //   migrate the listener to the static event. We also need to maintain a map
    //   of Signer/ENS name to address so we can sync respond to listenerCount.
    // Constants
    const BN_2$1 = BigInt(2);
    const MAX_CCIP_REDIRECTS = 10;
    function isPromise(value) {
        return (value && typeof (value.then) === "function");
    }
    function getTag(prefix, value) {
        return prefix + ":" + JSON.stringify(value, (k, v) => {
            if (v == null) {
                return "null";
            }
            if (typeof (v) === "bigint") {
                return `bigint:${v.toString()}`;
            }
            if (typeof (v) === "string") {
                return v.toLowerCase();
            }
            // Sort object keys
            if (typeof (v) === "object" && !Array.isArray(v)) {
                const keys = Object.keys(v);
                keys.sort();
                return keys.reduce((accum, key) => {
                    accum[key] = v[key];
                    return accum;
                }, {});
            }
            return v;
        });
    }
    /**
     *  An **UnmanagedSubscriber** is useful for events which do not require
     *  any additional management, such as ``"debug"`` which only requires
     *  emit in synchronous event loop triggered calls.
     */
    class UnmanagedSubscriber {
        /**
         *  The name fof the event.
         */
        name;
        /**
         *  Create a new UnmanagedSubscriber with %%name%%.
         */
        constructor(name) { defineProperties(this, { name }); }
        start() { }
        stop() { }
        pause(dropWhilePaused) { }
        resume() { }
    }
    function copy$2(value) {
        return JSON.parse(JSON.stringify(value));
    }
    function concisify(items) {
        items = Array.from((new Set(items)).values());
        items.sort();
        return items;
    }
    async function getSubscription(_event, provider) {
        if (_event == null) {
            throw new Error("invalid event");
        }
        // Normalize topic array info an EventFilter
        if (Array.isArray(_event)) {
            _event = { topics: _event };
        }
        if (typeof (_event) === "string") {
            switch (_event) {
                case "block":
                case "debug":
                case "error":
                case "finalized":
                case "network":
                case "pending":
                case "safe": {
                    return { type: _event, tag: _event };
                }
            }
        }
        if (isHexString(_event, 32)) {
            const hash = _event.toLowerCase();
            return { type: "transaction", tag: getTag("tx", { hash }), hash };
        }
        if (_event.orphan) {
            const event = _event;
            // @TODO: Should lowercase and whatnot things here instead of copy...
            return { type: "orphan", tag: getTag("orphan", event), filter: copy$2(event) };
        }
        if ((_event.address || _event.topics)) {
            const event = _event;
            const filter = {
                topics: ((event.topics || []).map((t) => {
                    if (t == null) {
                        return null;
                    }
                    if (Array.isArray(t)) {
                        return concisify(t.map((t) => t.toLowerCase()));
                    }
                    return t.toLowerCase();
                }))
            };
            if (event.address) {
                const addresses = [];
                const promises = [];
                const addAddress = (addr) => {
                    if (isHexString(addr)) {
                        addresses.push(addr);
                    }
                    else {
                        promises.push((async () => {
                            addresses.push(await resolveAddress(addr, provider));
                        })());
                    }
                };
                if (Array.isArray(event.address)) {
                    event.address.forEach(addAddress);
                }
                else {
                    addAddress(event.address);
                }
                if (promises.length) {
                    await Promise.all(promises);
                }
                filter.address = concisify(addresses.map((a) => a.toLowerCase()));
            }
            return { filter, tag: getTag("event", filter), type: "event" };
        }
        assertArgument(false, "unknown ProviderEvent", "event", _event);
    }
    function getTime$1() { return (new Date()).getTime(); }
    const defaultOptions$1 = {
        cacheTimeout: 250,
        pollingInterval: 4000
    };
    /**
     *  An **AbstractProvider** provides a base class for other sub-classes to
     *  implement the [[Provider]] API by normalizing input arguments and
     *  formatting output results as well as tracking events for consistent
     *  behaviour on an eventually-consistent network.
     */
    class AbstractProvider {
        #subs;
        #plugins;
        // null=unpaused, true=paused+dropWhilePaused, false=paused
        #pausedState;
        #destroyed;
        #networkPromise;
        #anyNetwork;
        #performCache;
        // The most recent block number if running an event or -1 if no "block" event
        #lastBlockNumber;
        #nextTimer;
        #timers;
        #disableCcipRead;
        #options;
        /**
         *  Create a new **AbstractProvider** connected to %%network%%, or
         *  use the various network detection capabilities to discover the
         *  [[Network]] if necessary.
         */
        constructor(_network, options) {
            this.#options = Object.assign({}, defaultOptions$1, options || {});
            if (_network === "any") {
                this.#anyNetwork = true;
                this.#networkPromise = null;
            }
            else if (_network) {
                const network = Network.from(_network);
                this.#anyNetwork = false;
                this.#networkPromise = Promise.resolve(network);
                setTimeout(() => { this.emit("network", network, null); }, 0);
            }
            else {
                this.#anyNetwork = false;
                this.#networkPromise = null;
            }
            this.#lastBlockNumber = -1;
            this.#performCache = new Map();
            this.#subs = new Map();
            this.#plugins = new Map();
            this.#pausedState = null;
            this.#destroyed = false;
            this.#nextTimer = 1;
            this.#timers = new Map();
            this.#disableCcipRead = false;
        }
        get pollingInterval() { return this.#options.pollingInterval; }
        /**
         *  Returns ``this``, to allow an **AbstractProvider** to implement
         *  the [[ContractRunner]] interface.
         */
        get provider() { return this; }
        /**
         *  Returns all the registered plug-ins.
         */
        get plugins() {
            return Array.from(this.#plugins.values());
        }
        /**
         *  Attach a new plug-in.
         */
        attachPlugin(plugin) {
            if (this.#plugins.get(plugin.name)) {
                throw new Error(`cannot replace existing plugin: ${plugin.name} `);
            }
            this.#plugins.set(plugin.name, plugin.connect(this));
            return this;
        }
        /**
         *  Get a plugin by name.
         */
        getPlugin(name) {
            return (this.#plugins.get(name)) || null;
        }
        /**
         *  Prevent any CCIP-read operation, regardless of whether requested
         *  in a [[call]] using ``enableCcipRead``.
         */
        get disableCcipRead() { return this.#disableCcipRead; }
        set disableCcipRead(value) { this.#disableCcipRead = !!value; }
        // Shares multiple identical requests made during the same 250ms
        async #perform(req) {
            const timeout = this.#options.cacheTimeout;
            // Caching disabled
            if (timeout < 0) {
                return await this._perform(req);
            }
            // Create a tag
            const tag = getTag(req.method, req);
            let perform = this.#performCache.get(tag);
            if (!perform) {
                perform = this._perform(req);
                this.#performCache.set(tag, perform);
                setTimeout(() => {
                    if (this.#performCache.get(tag) === perform) {
                        this.#performCache.delete(tag);
                    }
                }, timeout);
            }
            return await perform;
        }
        /**
         *  Resolves to the data for executing the CCIP-read operations.
         */
        async ccipReadFetch(tx, calldata, urls) {
            if (this.disableCcipRead || urls.length === 0 || tx.to == null) {
                return null;
            }
            const sender = tx.to.toLowerCase();
            const data = calldata.toLowerCase();
            const errorMessages = [];
            for (let i = 0; i < urls.length; i++) {
                const url = urls[i];
                // URL expansion
                const href = url.replace("{sender}", sender).replace("{data}", data);
                // If no {data} is present, use POST; otherwise GET
                //const json: string | null = (url.indexOf("{data}") >= 0) ? null: JSON.stringify({ data, sender });
                //const result = await fetchJson({ url: href, errorPassThrough: true }, json, (value, response) => {
                //    value.status = response.statusCode;
                //    return value;
                //});
                const request = new FetchRequest(href);
                if (url.indexOf("{data}") === -1) {
                    request.body = { data, sender };
                }
                this.emit("debug", { action: "sendCcipReadFetchRequest", request, index: i, urls });
                let errorMessage = "unknown error";
                const resp = await request.send();
                try {
                    const result = resp.bodyJson;
                    if (result.data) {
                        this.emit("debug", { action: "receiveCcipReadFetchResult", request, result });
                        return result.data;
                    }
                    if (result.message) {
                        errorMessage = result.message;
                    }
                    this.emit("debug", { action: "receiveCcipReadFetchError", request, result });
                }
                catch (error) { }
                // 4xx indicates the result is not present; stop
                assert(resp.statusCode < 400 || resp.statusCode >= 500, `response not found during CCIP fetch: ${errorMessage}`, "OFFCHAIN_FAULT", { reason: "404_MISSING_RESOURCE", transaction: tx, info: { url, errorMessage } });
                // 5xx indicates server issue; try the next url
                errorMessages.push(errorMessage);
            }
            assert(false, `error encountered during CCIP fetch: ${errorMessages.map((m) => JSON.stringify(m)).join(", ")}`, "OFFCHAIN_FAULT", {
                reason: "500_SERVER_ERROR",
                transaction: tx, info: { urls, errorMessages }
            });
        }
        /**
         *  Provides the opportunity for a sub-class to wrap a block before
         *  returning it, to add additional properties or an alternate
         *  sub-class of [[Block]].
         */
        _wrapBlock(value, network) {
            return new Block(formatBlock(value), this);
        }
        /**
         *  Provides the opportunity for a sub-class to wrap a log before
         *  returning it, to add additional properties or an alternate
         *  sub-class of [[Log]].
         */
        _wrapLog(value, network) {
            return new Log(formatLog(value), this);
        }
        /**
         *  Provides the opportunity for a sub-class to wrap a transaction
         *  receipt before returning it, to add additional properties or an
         *  alternate sub-class of [[TransactionReceipt]].
         */
        _wrapTransactionReceipt(value, network) {
            return new TransactionReceipt(formatTransactionReceipt(value), this);
        }
        /**
         *  Provides the opportunity for a sub-class to wrap a transaction
         *  response before returning it, to add additional properties or an
         *  alternate sub-class of [[TransactionResponse]].
         */
        _wrapTransactionResponse(tx, network) {
            return new TransactionResponse(formatTransactionResponse(tx), this);
        }
        /**
         *  Resolves to the Network, forcing a network detection using whatever
         *  technique the sub-class requires.
         *
         *  Sub-classes **must** override this.
         */
        _detectNetwork() {
            assert(false, "sub-classes must implement this", "UNSUPPORTED_OPERATION", {
                operation: "_detectNetwork"
            });
        }
        /**
         *  Sub-classes should use this to perform all built-in operations. All
         *  methods sanitizes and normalizes the values passed into this.
         *
         *  Sub-classes **must** override this.
         */
        async _perform(req) {
            assert(false, `unsupported method: ${req.method}`, "UNSUPPORTED_OPERATION", {
                operation: req.method,
                info: req
            });
        }
        // State
        async getBlockNumber() {
            const blockNumber = getNumber(await this.#perform({ method: "getBlockNumber" }), "%response");
            if (this.#lastBlockNumber >= 0) {
                this.#lastBlockNumber = blockNumber;
            }
            return blockNumber;
        }
        /**
         *  Returns or resolves to the address for %%address%%, resolving ENS
         *  names and [[Addressable]] objects and returning if already an
         *  address.
         */
        _getAddress(address) {
            return resolveAddress(address, this);
        }
        /**
         *  Returns or resolves to a valid block tag for %%blockTag%%, resolving
         *  negative values and returning if already a valid block tag.
         */
        _getBlockTag(blockTag) {
            if (blockTag == null) {
                return "latest";
            }
            switch (blockTag) {
                case "earliest":
                    return "0x0";
                case "finalized":
                case "latest":
                case "pending":
                case "safe":
                    return blockTag;
            }
            if (isHexString(blockTag)) {
                if (isHexString(blockTag, 32)) {
                    return blockTag;
                }
                return toQuantity(blockTag);
            }
            if (typeof (blockTag) === "bigint") {
                blockTag = getNumber(blockTag, "blockTag");
            }
            if (typeof (blockTag) === "number") {
                if (blockTag >= 0) {
                    return toQuantity(blockTag);
                }
                if (this.#lastBlockNumber >= 0) {
                    return toQuantity(this.#lastBlockNumber + blockTag);
                }
                return this.getBlockNumber().then((b) => toQuantity(b + blockTag));
            }
            assertArgument(false, "invalid blockTag", "blockTag", blockTag);
        }
        /**
         *  Returns or resolves to a filter for %%filter%%, resolving any ENS
         *  names or [[Addressable]] object and returning if already a valid
         *  filter.
         */
        _getFilter(filter) {
            // Create a canonical representation of the topics
            const topics = (filter.topics || []).map((t) => {
                if (t == null) {
                    return null;
                }
                if (Array.isArray(t)) {
                    return concisify(t.map((t) => t.toLowerCase()));
                }
                return t.toLowerCase();
            });
            const blockHash = ("blockHash" in filter) ? filter.blockHash : undefined;
            const resolve = (_address, fromBlock, toBlock) => {
                let address = undefined;
                switch (_address.length) {
                    case 0: break;
                    case 1:
                        address = _address[0];
                        break;
                    default:
                        _address.sort();
                        address = _address;
                }
                if (blockHash) {
                    if (fromBlock != null || toBlock != null) {
                        throw new Error("invalid filter");
                    }
                }
                const filter = {};
                if (address) {
                    filter.address = address;
                }
                if (topics.length) {
                    filter.topics = topics;
                }
                if (fromBlock) {
                    filter.fromBlock = fromBlock;
                }
                if (toBlock) {
                    filter.toBlock = toBlock;
                }
                if (blockHash) {
                    filter.blockHash = blockHash;
                }
                return filter;
            };
            // Addresses could be async (ENS names or Addressables)
            let address = [];
            if (filter.address) {
                if (Array.isArray(filter.address)) {
                    for (const addr of filter.address) {
                        address.push(this._getAddress(addr));
                    }
                }
                else {
                    address.push(this._getAddress(filter.address));
                }
            }
            let fromBlock = undefined;
            if ("fromBlock" in filter) {
                fromBlock = this._getBlockTag(filter.fromBlock);
            }
            let toBlock = undefined;
            if ("toBlock" in filter) {
                toBlock = this._getBlockTag(filter.toBlock);
            }
            if (address.filter((a) => (typeof (a) !== "string")).length ||
                (fromBlock != null && typeof (fromBlock) !== "string") ||
                (toBlock != null && typeof (toBlock) !== "string")) {
                return Promise.all([Promise.all(address), fromBlock, toBlock]).then((result) => {
                    return resolve(result[0], result[1], result[2]);
                });
            }
            return resolve(address, fromBlock, toBlock);
        }
        /**
         *  Returns or resovles to a transaction for %%request%%, resolving
         *  any ENS names or [[Addressable]] and returning if already a valid
         *  transaction.
         */
        _getTransactionRequest(_request) {
            const request = copyRequest(_request);
            const promises = [];
            ["to", "from"].forEach((key) => {
                if (request[key] == null) {
                    return;
                }
                const addr = resolveAddress(request[key], this);
                if (isPromise(addr)) {
                    promises.push((async function () { request[key] = await addr; })());
                }
                else {
                    request[key] = addr;
                }
            });
            if (request.blockTag != null) {
                const blockTag = this._getBlockTag(request.blockTag);
                if (isPromise(blockTag)) {
                    promises.push((async function () { request.blockTag = await blockTag; })());
                }
                else {
                    request.blockTag = blockTag;
                }
            }
            if (promises.length) {
                return (async function () {
                    await Promise.all(promises);
                    return request;
                })();
            }
            return request;
        }
        async getNetwork() {
            // No explicit network was set and this is our first time
            if (this.#networkPromise == null) {
                // Detect the current network (shared with all calls)
                const detectNetwork = (async () => {
                    try {
                        const network = await this._detectNetwork();
                        this.emit("network", network, null);
                        return network;
                    }
                    catch (error) {
                        if (this.#networkPromise === detectNetwork) {
                            this.#networkPromise = null;
                        }
                        throw error;
                    }
                })();
                this.#networkPromise = detectNetwork;
                return (await detectNetwork).clone();
            }
            const networkPromise = this.#networkPromise;
            const [expected, actual] = await Promise.all([
                networkPromise,
                this._detectNetwork() // The actual connected network
            ]);
            if (expected.chainId !== actual.chainId) {
                if (this.#anyNetwork) {
                    // The "any" network can change, so notify listeners
                    this.emit("network", actual, expected);
                    // Update the network if something else hasn't already changed it
                    if (this.#networkPromise === networkPromise) {
                        this.#networkPromise = Promise.resolve(actual);
                    }
                }
                else {
                    // Otherwise, we do not allow changes to the underlying network
                    assert(false, `network changed: ${expected.chainId} => ${actual.chainId} `, "NETWORK_ERROR", {
                        event: "changed"
                    });
                }
            }
            return expected.clone();
        }
        async getFeeData() {
            const network = await this.getNetwork();
            const getFeeDataFunc = async () => {
                const { _block, gasPrice, priorityFee } = await resolveProperties({
                    _block: this.#getBlock("latest", false),
                    gasPrice: ((async () => {
                        try {
                            const value = await this.#perform({ method: "getGasPrice" });
                            return getBigInt(value, "%response");
                        }
                        catch (error) { }
                        return null;
                    })()),
                    priorityFee: ((async () => {
                        try {
                            const value = await this.#perform({ method: "getPriorityFee" });
                            return getBigInt(value, "%response");
                        }
                        catch (error) { }
                        return null;
                    })())
                });
                let maxFeePerGas = null;
                let maxPriorityFeePerGas = null;
                // These are the recommended EIP-1559 heuristics for fee data
                const block = this._wrapBlock(_block, network);
                if (block && block.baseFeePerGas) {
                    maxPriorityFeePerGas = (priorityFee != null) ? priorityFee : BigInt("1000000000");
                    maxFeePerGas = (block.baseFeePerGas * BN_2$1) + maxPriorityFeePerGas;
                }
                return new FeeData(gasPrice, maxFeePerGas, maxPriorityFeePerGas);
            };
            // Check for a FeeDataNetWorkPlugin
            const plugin = network.getPlugin("org.ethers.plugins.network.FetchUrlFeeDataPlugin");
            if (plugin) {
                const req = new FetchRequest(plugin.url);
                const feeData = await plugin.processFunc(getFeeDataFunc, this, req);
                return new FeeData(feeData.gasPrice, feeData.maxFeePerGas, feeData.maxPriorityFeePerGas);
            }
            return await getFeeDataFunc();
        }
        async estimateGas(_tx) {
            let tx = this._getTransactionRequest(_tx);
            if (isPromise(tx)) {
                tx = await tx;
            }
            return getBigInt(await this.#perform({
                method: "estimateGas", transaction: tx
            }), "%response");
        }
        async #call(tx, blockTag, attempt) {
            assert(attempt < MAX_CCIP_REDIRECTS, "CCIP read exceeded maximum redirections", "OFFCHAIN_FAULT", {
                reason: "TOO_MANY_REDIRECTS",
                transaction: Object.assign({}, tx, { blockTag, enableCcipRead: true })
            });
            // This came in as a PerformActionTransaction, so to/from are safe; we can cast
            const transaction = copyRequest(tx);
            try {
                return hexlify(await this._perform({ method: "call", transaction, blockTag }));
            }
            catch (error) {
                // CCIP Read OffchainLookup
                if (!this.disableCcipRead && isCallException(error) && error.data && attempt >= 0 && blockTag === "latest" && transaction.to != null && dataSlice(error.data, 0, 4) === "0x556f1830") {
                    const data = error.data;
                    const txSender = await resolveAddress(transaction.to, this);
                    // Parse the CCIP Read Arguments
                    let ccipArgs;
                    try {
                        ccipArgs = parseOffchainLookup(dataSlice(error.data, 4));
                    }
                    catch (error) {
                        assert(false, error.message, "OFFCHAIN_FAULT", {
                            reason: "BAD_DATA", transaction, info: { data }
                        });
                    }
                    // Check the sender of the OffchainLookup matches the transaction
                    assert(ccipArgs.sender.toLowerCase() === txSender.toLowerCase(), "CCIP Read sender mismatch", "CALL_EXCEPTION", {
                        action: "call",
                        data,
                        reason: "OffchainLookup",
                        transaction: transaction,
                        invocation: null,
                        revert: {
                            signature: "OffchainLookup(address,string[],bytes,bytes4,bytes)",
                            name: "OffchainLookup",
                            args: ccipArgs.errorArgs
                        }
                    });
                    const ccipResult = await this.ccipReadFetch(transaction, ccipArgs.calldata, ccipArgs.urls);
                    assert(ccipResult != null, "CCIP Read failed to fetch data", "OFFCHAIN_FAULT", {
                        reason: "FETCH_FAILED", transaction, info: { data: error.data, errorArgs: ccipArgs.errorArgs }
                    });
                    const tx = {
                        to: txSender,
                        data: concat([ccipArgs.selector, encodeBytes([ccipResult, ccipArgs.extraData])])
                    };
                    this.emit("debug", { action: "sendCcipReadCall", transaction: tx });
                    try {
                        const result = await this.#call(tx, blockTag, attempt + 1);
                        this.emit("debug", { action: "receiveCcipReadCallResult", transaction: Object.assign({}, tx), result });
                        return result;
                    }
                    catch (error) {
                        this.emit("debug", { action: "receiveCcipReadCallError", transaction: Object.assign({}, tx), error });
                        throw error;
                    }
                }
                throw error;
            }
        }
        async #checkNetwork(promise) {
            const { value } = await resolveProperties({
                network: this.getNetwork(),
                value: promise
            });
            return value;
        }
        async call(_tx) {
            const { tx, blockTag } = await resolveProperties({
                tx: this._getTransactionRequest(_tx),
                blockTag: this._getBlockTag(_tx.blockTag)
            });
            return await this.#checkNetwork(this.#call(tx, blockTag, _tx.enableCcipRead ? 0 : -1));
        }
        // Account
        async #getAccountValue(request, _address, _blockTag) {
            let address = this._getAddress(_address);
            let blockTag = this._getBlockTag(_blockTag);
            if (typeof (address) !== "string" || typeof (blockTag) !== "string") {
                [address, blockTag] = await Promise.all([address, blockTag]);
            }
            return await this.#checkNetwork(this.#perform(Object.assign(request, { address, blockTag })));
        }
        async getBalance(address, blockTag) {
            return getBigInt(await this.#getAccountValue({ method: "getBalance" }, address, blockTag), "%response");
        }
        async getTransactionCount(address, blockTag) {
            return getNumber(await this.#getAccountValue({ method: "getTransactionCount" }, address, blockTag), "%response");
        }
        async getCode(address, blockTag) {
            return hexlify(await this.#getAccountValue({ method: "getCode" }, address, blockTag));
        }
        async getStorage(address, _position, blockTag) {
            const position = getBigInt(_position, "position");
            return hexlify(await this.#getAccountValue({ method: "getStorage", position }, address, blockTag));
        }
        // Write
        async broadcastTransaction(signedTx) {
            const { blockNumber, hash, network } = await resolveProperties({
                blockNumber: this.getBlockNumber(),
                hash: this._perform({
                    method: "broadcastTransaction",
                    signedTransaction: signedTx
                }),
                network: this.getNetwork()
            });
            const tx = Transaction.from(signedTx);
            if (tx.hash !== hash) {
                throw new Error("@TODO: the returned hash did not match");
            }
            return this._wrapTransactionResponse(tx, network).replaceableTransaction(blockNumber);
        }
        async #getBlock(block, includeTransactions) {
            // @TODO: Add CustomBlockPlugin check
            if (isHexString(block, 32)) {
                return await this.#perform({
                    method: "getBlock", blockHash: block, includeTransactions
                });
            }
            let blockTag = this._getBlockTag(block);
            if (typeof (blockTag) !== "string") {
                blockTag = await blockTag;
            }
            return await this.#perform({
                method: "getBlock", blockTag, includeTransactions
            });
        }
        // Queries
        async getBlock(block, prefetchTxs) {
            const { network, params } = await resolveProperties({
                network: this.getNetwork(),
                params: this.#getBlock(block, !!prefetchTxs)
            });
            if (params == null) {
                return null;
            }
            return this._wrapBlock(params, network);
        }
        async getTransaction(hash) {
            const { network, params } = await resolveProperties({
                network: this.getNetwork(),
                params: this.#perform({ method: "getTransaction", hash })
            });
            if (params == null) {
                return null;
            }
            return this._wrapTransactionResponse(params, network);
        }
        async getTransactionReceipt(hash) {
            const { network, params } = await resolveProperties({
                network: this.getNetwork(),
                params: this.#perform({ method: "getTransactionReceipt", hash })
            });
            if (params == null) {
                return null;
            }
            // Some backends did not backfill the effectiveGasPrice into old transactions
            // in the receipt, so we look it up manually and inject it.
            if (params.gasPrice == null && params.effectiveGasPrice == null) {
                const tx = await this.#perform({ method: "getTransaction", hash });
                if (tx == null) {
                    throw new Error("report this; could not find tx or effectiveGasPrice");
                }
                params.effectiveGasPrice = tx.gasPrice;
            }
            return this._wrapTransactionReceipt(params, network);
        }
        async getTransactionResult(hash) {
            const { result } = await resolveProperties({
                network: this.getNetwork(),
                result: this.#perform({ method: "getTransactionResult", hash })
            });
            if (result == null) {
                return null;
            }
            return hexlify(result);
        }
        // Bloom-filter Queries
        async getLogs(_filter) {
            let filter = this._getFilter(_filter);
            if (isPromise(filter)) {
                filter = await filter;
            }
            const { network, params } = await resolveProperties({
                network: this.getNetwork(),
                params: this.#perform({ method: "getLogs", filter })
            });
            return params.map((p) => this._wrapLog(p, network));
        }
        // ENS
        _getProvider(chainId) {
            assert(false, "provider cannot connect to target network", "UNSUPPORTED_OPERATION", {
                operation: "_getProvider()"
            });
        }
        async getResolver(name) {
            return await EnsResolver.fromName(this, name);
        }
        async getAvatar(name) {
            const resolver = await this.getResolver(name);
            if (resolver) {
                return await resolver.getAvatar();
            }
            return null;
        }
        async resolveName(name) {
            const resolver = await this.getResolver(name);
            if (resolver) {
                return await resolver.getAddress();
            }
            return null;
        }
        async lookupAddress(address) {
            address = getAddress(address);
            const node = namehash(address.substring(2).toLowerCase() + ".addr.reverse");
            try {
                const ensAddr = await EnsResolver.getEnsAddress(this);
                const ensContract = new Contract(ensAddr, [
                    "function resolver(bytes32) view returns (address)"
                ], this);
                const resolver = await ensContract.resolver(node);
                if (resolver == null || resolver === ZeroAddress) {
                    return null;
                }
                const resolverContract = new Contract(resolver, [
                    "function name(bytes32) view returns (string)"
                ], this);
                const name = await resolverContract.name(node);
                // Failed forward resolution
                const check = await this.resolveName(name);
                if (check !== address) {
                    return null;
                }
                return name;
            }
            catch (error) {
                // No data was returned from the resolver
                if (isError(error, "BAD_DATA") && error.value === "0x") {
                    return null;
                }
                // Something reerted
                if (isError(error, "CALL_EXCEPTION")) {
                    return null;
                }
                throw error;
            }
            return null;
        }
        async waitForTransaction(hash, _confirms, timeout) {
            const confirms = (_confirms != null) ? _confirms : 1;
            if (confirms === 0) {
                return this.getTransactionReceipt(hash);
            }
            return new Promise(async (resolve, reject) => {
                let timer = null;
                const listener = (async (blockNumber) => {
                    try {
                        const receipt = await this.getTransactionReceipt(hash);
                        if (receipt != null) {
                            if (blockNumber - receipt.blockNumber + 1 >= confirms) {
                                resolve(receipt);
                                //this.off("block", listener);
                                if (timer) {
                                    clearTimeout(timer);
                                    timer = null;
                                }
                                return;
                            }
                        }
                    }
                    catch (error) {
                        console.log("EEE", error);
                    }
                    this.once("block", listener);
                });
                if (timeout != null) {
                    timer = setTimeout(() => {
                        if (timer == null) {
                            return;
                        }
                        timer = null;
                        this.off("block", listener);
                        reject(makeError("timeout", "TIMEOUT", { reason: "timeout" }));
                    }, timeout);
                }
                listener(await this.getBlockNumber());
            });
        }
        async waitForBlock(blockTag) {
            assert(false, "not implemented yet", "NOT_IMPLEMENTED", {
                operation: "waitForBlock"
            });
        }
        /**
         *  Clear a timer created using the [[_setTimeout]] method.
         */
        _clearTimeout(timerId) {
            const timer = this.#timers.get(timerId);
            if (!timer) {
                return;
            }
            if (timer.timer) {
                clearTimeout(timer.timer);
            }
            this.#timers.delete(timerId);
        }
        /**
         *  Create a timer that will execute %%func%% after at least %%timeout%%
         *  (in ms). If %%timeout%% is unspecified, then %%func%% will execute
         *  in the next event loop.
         *
         *  [Pausing](AbstractProvider-paused) the provider will pause any
         *  associated timers.
         */
        _setTimeout(_func, timeout) {
            if (timeout == null) {
                timeout = 0;
            }
            const timerId = this.#nextTimer++;
            const func = () => {
                this.#timers.delete(timerId);
                _func();
            };
            if (this.paused) {
                this.#timers.set(timerId, { timer: null, func, time: timeout });
            }
            else {
                const timer = setTimeout(func, timeout);
                this.#timers.set(timerId, { timer, func, time: getTime$1() });
            }
            return timerId;
        }
        /**
         *  Perform %%func%% on each subscriber.
         */
        _forEachSubscriber(func) {
            for (const sub of this.#subs.values()) {
                func(sub.subscriber);
            }
        }
        /**
         *  Sub-classes may override this to customize subscription
         *  implementations.
         */
        _getSubscriber(sub) {
            switch (sub.type) {
                case "debug":
                case "error":
                case "network":
                    return new UnmanagedSubscriber(sub.type);
            }
            throw new Error("HTTP polling not supported. This method should be implemented by subclasses.");
        }
        /**
         *  If a [[Subscriber]] fails and needs to replace itself, this
         *  method may be used.
         *
         *  For example, this is used for providers when using the
         *  ``eth_getFilterChanges`` method, which can return null if state
         *  filters are not supported by the backend, allowing the Subscriber
         *  to swap in a [[PollingEventSubscriber]].
         */
        _recoverSubscriber(oldSub, newSub) {
            for (const sub of this.#subs.values()) {
                if (sub.subscriber === oldSub) {
                    if (sub.started) {
                        sub.subscriber.stop();
                    }
                    sub.subscriber = newSub;
                    if (sub.started) {
                        newSub.start();
                    }
                    if (this.#pausedState != null) {
                        newSub.pause(this.#pausedState);
                    }
                    break;
                }
            }
        }
        async #hasSub(event, emitArgs) {
            let sub = await getSubscription(event, this);
            // This is a log that is removing an existing log; we actually want
            // to emit an orphan event for the removed log
            if (sub.type === "event" && emitArgs && emitArgs.length > 0 && emitArgs[0].removed === true) {
                sub = await getSubscription({ orphan: "drop-log", log: emitArgs[0] }, this);
            }
            return this.#subs.get(sub.tag) || null;
        }
        async #getSub(event) {
            const subscription = await getSubscription(event, this);
            // Prevent tampering with our tag in any subclass' _getSubscriber
            const tag = subscription.tag;
            let sub = this.#subs.get(tag);
            if (!sub) {
                const subscriber = this._getSubscriber(subscription);
                const addressableMap = new WeakMap();
                const nameMap = new Map();
                sub = { subscriber, tag, addressableMap, nameMap, started: false, listeners: [] };
                this.#subs.set(tag, sub);
            }
            return sub;
        }
        async on(event, listener) {
            const sub = await this.#getSub(event);
            sub.listeners.push({ listener, once: false });
            if (!sub.started) {
                sub.subscriber.start();
                sub.started = true;
                if (this.#pausedState != null) {
                    sub.subscriber.pause(this.#pausedState);
                }
            }
            return this;
        }
        async once(event, listener) {
            const sub = await this.#getSub(event);
            sub.listeners.push({ listener, once: true });
            if (!sub.started) {
                sub.subscriber.start();
                sub.started = true;
                if (this.#pausedState != null) {
                    sub.subscriber.pause(this.#pausedState);
                }
            }
            return this;
        }
        async emit(event, ...args) {
            const sub = await this.#hasSub(event, args);
            // If there is not subscription or if a recent emit removed
            // the last of them (which also deleted the sub) do nothing
            if (!sub || sub.listeners.length === 0) {
                return false;
            }
            const count = sub.listeners.length;
            sub.listeners = sub.listeners.filter(({ listener, once }) => {
                const payload = new EventPayload(this, (once ? null : listener), event);
                try {
                    listener.call(this, ...args, payload);
                }
                catch (error) { }
                return !once;
            });
            if (sub.listeners.length === 0) {
                if (sub.started) {
                    sub.subscriber.stop();
                }
                this.#subs.delete(sub.tag);
            }
            return (count > 0);
        }
        async listenerCount(event) {
            if (event) {
                const sub = await this.#hasSub(event);
                if (!sub) {
                    return 0;
                }
                return sub.listeners.length;
            }
            let total = 0;
            for (const { listeners } of this.#subs.values()) {
                total += listeners.length;
            }
            return total;
        }
        async listeners(event) {
            if (event) {
                const sub = await this.#hasSub(event);
                if (!sub) {
                    return [];
                }
                return sub.listeners.map(({ listener }) => listener);
            }
            let result = [];
            for (const { listeners } of this.#subs.values()) {
                result = result.concat(listeners.map(({ listener }) => listener));
            }
            return result;
        }
        async off(event, listener) {
            const sub = await this.#hasSub(event);
            if (!sub) {
                return this;
            }
            if (listener) {
                const index = sub.listeners.map(({ listener }) => listener).indexOf(listener);
                if (index >= 0) {
                    sub.listeners.splice(index, 1);
                }
            }
            if (!listener || sub.listeners.length === 0) {
                if (sub.started) {
                    sub.subscriber.stop();
                }
                this.#subs.delete(sub.tag);
            }
            return this;
        }
        async removeAllListeners(event) {
            if (event) {
                const { tag, started, subscriber } = await this.#getSub(event);
                if (started) {
                    subscriber.stop();
                }
                this.#subs.delete(tag);
            }
            else {
                for (const [tag, { started, subscriber }] of this.#subs) {
                    if (started) {
                        subscriber.stop();
                    }
                    this.#subs.delete(tag);
                }
            }
            return this;
        }
        // Alias for "on"
        async addListener(event, listener) {
            return await this.on(event, listener);
        }
        // Alias for "off"
        async removeListener(event, listener) {
            return this.off(event, listener);
        }
        /**
         *  If this provider has been destroyed using the [[destroy]] method.
         *
         *  Once destroyed, all resources are reclaimed, internal event loops
         *  and timers are cleaned up and no further requests may be sent to
         *  the provider.
         */
        get destroyed() {
            return this.#destroyed;
        }
        /**
         *  Sub-classes may use this to shutdown any sockets or release their
         *  resources and reject any pending requests.
         *
         *  Sub-classes **must** call ``super.destroy()``.
         */
        destroy() {
            // Stop all listeners
            this.removeAllListeners();
            // Shut down all tiemrs
            for (const timerId of this.#timers.keys()) {
                this._clearTimeout(timerId);
            }
            this.#destroyed = true;
        }
        /**
         *  Whether the provider is currently paused.
         *
         *  A paused provider will not emit any events, and generally should
         *  not make any requests to the network, but that is up to sub-classes
         *  to manage.
         *
         *  Setting ``paused = true`` is identical to calling ``.pause(false)``,
         *  which will buffer any events that occur while paused until the
         *  provider is unpaused.
         */
        get paused() { return (this.#pausedState != null); }
        set paused(pause) {
            if (!!pause === this.paused) {
                return;
            }
            if (this.paused) {
                this.resume();
            }
            else {
                this.pause(false);
            }
        }
        /**
         *  Pause the provider. If %%dropWhilePaused%%, any events that occur
         *  while paused are dropped, otherwise all events will be emitted once
         *  the provider is unpaused.
         */
        pause(dropWhilePaused) {
            this.#lastBlockNumber = -1;
            if (this.#pausedState != null) {
                if (this.#pausedState == !!dropWhilePaused) {
                    return;
                }
                assert(false, "cannot change pause type; resume first", "UNSUPPORTED_OPERATION", {
                    operation: "pause"
                });
            }
            this._forEachSubscriber((s) => s.pause(dropWhilePaused));
            this.#pausedState = !!dropWhilePaused;
            for (const timer of this.#timers.values()) {
                // Clear the timer
                if (timer.timer) {
                    clearTimeout(timer.timer);
                }
                // Remaining time needed for when we become unpaused
                timer.time = getTime$1() - timer.time;
            }
        }
        /**
         *  Resume the provider.
         */
        resume() {
            if (this.#pausedState == null) {
                return;
            }
            this._forEachSubscriber((s) => s.resume());
            this.#pausedState = null;
            for (const timer of this.#timers.values()) {
                // Remaining time when we were paused
                let timeout = timer.time;
                if (timeout < 0) {
                    timeout = 0;
                }
                // Start time (in cause paused, so we con compute remaininf time)
                timer.time = getTime$1();
                // Start the timer
                setTimeout(timer.func, timeout);
            }
        }
    }
    function _parseString(result, start) {
        try {
            const bytes = _parseBytes(result, start);
            if (bytes) {
                return toUtf8String(bytes);
            }
        }
        catch (error) { }
        return null;
    }
    function _parseBytes(result, start) {
        if (result === "0x") {
            return null;
        }
        try {
            const offset = getNumber(dataSlice(result, start, start + 32));
            const length = getNumber(dataSlice(result, offset, offset + 32));
            return dataSlice(result, offset + 32, offset + 32 + length);
        }
        catch (error) { }
        return null;
    }
    function numPad(value) {
        const result = toBeArray(value);
        if (result.length > 32) {
            throw new Error("internal; should not happen");
        }
        const padded = new Uint8Array(32);
        padded.set(result, 32 - result.length);
        return padded;
    }
    function bytesPad(value) {
        if ((value.length % 32) === 0) {
            return value;
        }
        const result = new Uint8Array(Math.ceil(value.length / 32) * 32);
        result.set(value);
        return result;
    }
    const empty = new Uint8Array([]);
    // ABI Encodes a series of (bytes, bytes, ...)
    function encodeBytes(datas) {
        const result = [];
        let byteCount = 0;
        // Add place-holders for pointers as we add items
        for (let i = 0; i < datas.length; i++) {
            result.push(empty);
            byteCount += 32;
        }
        for (let i = 0; i < datas.length; i++) {
            const data = getBytes(datas[i]);
            // Update the bytes offset
            result[i] = numPad(byteCount);
            // The length and padded value of data
            result.push(numPad(data.length));
            result.push(bytesPad(data));
            byteCount += 32 + Math.ceil(data.length / 32) * 32;
        }
        return concat(result);
    }
    const zeros = "0x0000000000000000000000000000000000000000000000000000000000000000";
    function parseOffchainLookup(data) {
        const result = {
            sender: "", urls: [], calldata: "", selector: "", extraData: "", errorArgs: []
        };
        assert(dataLength(data) >= 5 * 32, "insufficient OffchainLookup data", "OFFCHAIN_FAULT", {
            reason: "insufficient OffchainLookup data"
        });
        const sender = dataSlice(data, 0, 32);
        assert(dataSlice(sender, 0, 12) === dataSlice(zeros, 0, 12), "corrupt OffchainLookup sender", "OFFCHAIN_FAULT", {
            reason: "corrupt OffchainLookup sender"
        });
        result.sender = dataSlice(sender, 12);
        // Read the URLs from the response
        try {
            const urls = [];
            const urlsOffset = getNumber(dataSlice(data, 32, 64));
            const urlsLength = getNumber(dataSlice(data, urlsOffset, urlsOffset + 32));
            const urlsData = dataSlice(data, urlsOffset + 32);
            for (let u = 0; u < urlsLength; u++) {
                const url = _parseString(urlsData, u * 32);
                if (url == null) {
                    throw new Error("abort");
                }
                urls.push(url);
            }
            result.urls = urls;
        }
        catch (error) {
            assert(false, "corrupt OffchainLookup urls", "OFFCHAIN_FAULT", {
                reason: "corrupt OffchainLookup urls"
            });
        }
        // Get the CCIP calldata to forward
        try {
            const calldata = _parseBytes(data, 64);
            if (calldata == null) {
                throw new Error("abort");
            }
            result.calldata = calldata;
        }
        catch (error) {
            assert(false, "corrupt OffchainLookup calldata", "OFFCHAIN_FAULT", {
                reason: "corrupt OffchainLookup calldata"
            });
        }
        // Get the callbackSelector (bytes4)
        assert(dataSlice(data, 100, 128) === dataSlice(zeros, 0, 28), "corrupt OffchainLookup callbaackSelector", "OFFCHAIN_FAULT", {
            reason: "corrupt OffchainLookup callbaackSelector"
        });
        result.selector = dataSlice(data, 96, 100);
        // Get the extra data to send back to the contract as context
        try {
            const extraData = _parseBytes(data, 128);
            if (extraData == null) {
                throw new Error("abort");
            }
            result.extraData = extraData;
        }
        catch (error) {
            assert(false, "corrupt OffchainLookup extraData", "OFFCHAIN_FAULT", {
                reason: "corrupt OffchainLookup extraData"
            });
        }
        result.errorArgs = "sender,urls,calldata,selector,extraData".split(/,/).map((k) => result[k]);
        return result;
    }

    /**
     *  Generally the [[Wallet]] and [[JsonRpcSigner]] and their sub-classes
     *  are sufficent for most developers, but this is provided to
     *  fascilitate more complex Signers.
     *
     *  @_section: api/providers/abstract-signer: Subclassing Signer [abstract-signer]
     */
    function checkProvider(signer, operation) {
        if (signer.provider) {
            return signer.provider;
        }
        assert(false, "missing provider", "UNSUPPORTED_OPERATION", { operation });
    }
    async function populate(signer, tx) {
        let pop = copyRequest(tx);
        if (pop.to != null) {
            pop.to = resolveAddress(pop.to, signer);
        }
        if (pop.from != null) {
            const from = pop.from;
            pop.from = Promise.all([
                signer.getAddress(),
                resolveAddress(from, signer)
            ]).then(([address, from]) => {
                assertArgument(address.toLowerCase() === from.toLowerCase(), "transaction from mismatch", "tx.from", from);
                return address;
            });
        }
        else {
            pop.from = signer.getAddress();
        }
        return await resolveProperties(pop);
    }
    /**
     *  An **AbstractSigner** includes most of teh functionality required
     *  to get a [[Signer]] working as expected, but requires a few
     *  Signer-specific methods be overridden.
     *
     */
    class AbstractSigner {
        /**
         *  The provider this signer is connected to.
         */
        provider;
        /**
         *  Creates a new Signer connected to %%provider%%.
         */
        constructor(provider) {
            defineProperties(this, { provider: (provider || null) });
        }
        async getNonce(blockTag) {
            return checkProvider(this, "getTransactionCount").getTransactionCount(await this.getAddress(), blockTag);
        }
        async populateCall(tx) {
            const pop = await populate(this, tx);
            return pop;
        }
        async populateTransaction(tx) {
            const provider = checkProvider(this, "populateTransaction");
            const pop = await populate(this, tx);
            if (pop.nonce == null) {
                pop.nonce = await this.getNonce("pending");
            }
            if (pop.gasLimit == null) {
                pop.gasLimit = await this.estimateGas(pop);
            }
            // Populate the chain ID
            const network = await (this.provider).getNetwork();
            if (pop.chainId != null) {
                const chainId = getBigInt(pop.chainId);
                assertArgument(chainId === network.chainId, "transaction chainId mismatch", "tx.chainId", tx.chainId);
            }
            else {
                pop.chainId = network.chainId;
            }
            // Do not allow mixing pre-eip-1559 and eip-1559 properties
            const hasEip1559 = (pop.maxFeePerGas != null || pop.maxPriorityFeePerGas != null);
            if (pop.gasPrice != null && (pop.type === 2 || hasEip1559)) {
                assertArgument(false, "eip-1559 transaction do not support gasPrice", "tx", tx);
            }
            else if ((pop.type === 0 || pop.type === 1) && hasEip1559) {
                assertArgument(false, "pre-eip-1559 transaction do not support maxFeePerGas/maxPriorityFeePerGas", "tx", tx);
            }
            if ((pop.type === 2 || pop.type == null) && (pop.maxFeePerGas != null && pop.maxPriorityFeePerGas != null)) {
                // Fully-formed EIP-1559 transaction (skip getFeeData)
                pop.type = 2;
            }
            else if (pop.type === 0 || pop.type === 1) {
                // Explicit Legacy or EIP-2930 transaction
                // We need to get fee data to determine things
                const feeData = await provider.getFeeData();
                assert(feeData.gasPrice != null, "network does not support gasPrice", "UNSUPPORTED_OPERATION", {
                    operation: "getGasPrice"
                });
                // Populate missing gasPrice
                if (pop.gasPrice == null) {
                    pop.gasPrice = feeData.gasPrice;
                }
            }
            else {
                // We need to get fee data to determine things
                const feeData = await provider.getFeeData();
                if (pop.type == null) {
                    // We need to auto-detect the intended type of this transaction...
                    if (feeData.maxFeePerGas != null && feeData.maxPriorityFeePerGas != null) {
                        // The network supports EIP-1559!
                        // Upgrade transaction from null to eip-1559
                        pop.type = 2;
                        if (pop.gasPrice != null) {
                            // Using legacy gasPrice property on an eip-1559 network,
                            // so use gasPrice as both fee properties
                            const gasPrice = pop.gasPrice;
                            delete pop.gasPrice;
                            pop.maxFeePerGas = gasPrice;
                            pop.maxPriorityFeePerGas = gasPrice;
                        }
                        else {
                            // Populate missing fee data
                            if (pop.maxFeePerGas == null) {
                                pop.maxFeePerGas = feeData.maxFeePerGas;
                            }
                            if (pop.maxPriorityFeePerGas == null) {
                                pop.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
                            }
                        }
                    }
                    else if (feeData.gasPrice != null) {
                        // Network doesn't support EIP-1559...
                        // ...but they are trying to use EIP-1559 properties
                        assert(!hasEip1559, "network does not support EIP-1559", "UNSUPPORTED_OPERATION", {
                            operation: "populateTransaction"
                        });
                        // Populate missing fee data
                        if (pop.gasPrice == null) {
                            pop.gasPrice = feeData.gasPrice;
                        }
                        // Explicitly set untyped transaction to legacy
                        // @TODO: Maybe this shold allow type 1?
                        pop.type = 0;
                    }
                    else {
                        // getFeeData has failed us.
                        assert(false, "failed to get consistent fee data", "UNSUPPORTED_OPERATION", {
                            operation: "signer.getFeeData"
                        });
                    }
                }
                else if (pop.type === 2) {
                    // Explicitly using EIP-1559
                    // Populate missing fee data
                    if (pop.maxFeePerGas == null) {
                        pop.maxFeePerGas = feeData.maxFeePerGas;
                    }
                    if (pop.maxPriorityFeePerGas == null) {
                        pop.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
                    }
                }
            }
            //@TOOD: Don't await all over the place; save them up for
            // the end for better batching
            return await resolveProperties(pop);
        }
        async estimateGas(tx) {
            return checkProvider(this, "estimateGas").estimateGas(await this.populateCall(tx));
        }
        async call(tx) {
            return checkProvider(this, "call").call(await this.populateCall(tx));
        }
        async resolveName(name) {
            const provider = checkProvider(this, "resolveName");
            return await provider.resolveName(name);
        }
        async sendTransaction(tx) {
            const provider = checkProvider(this, "sendTransaction");
            const pop = await this.populateTransaction(tx);
            delete pop.from;
            const txObj = Transaction.from(pop);
            return await provider.broadcastTransaction(await this.signTransaction(txObj));
        }
    }
    /**
     *  A **VoidSigner** is a class deisgned to allow an address to be used
     *  in any API which accepts a Signer, but for which there are no
     *  credentials available to perform any actual signing.
     *
     *  This for example allow impersonating an account for the purpose of
     *  static calls or estimating gas, but does not allow sending transactions.
     */
    class VoidSigner extends AbstractSigner {
        /**
         *  The signer address.
         */
        address;
        /**
         *  Creates a new **VoidSigner** with %%address%% attached to
         *  %%provider%%.
         */
        constructor(address, provider) {
            super(provider);
            defineProperties(this, { address });
        }
        async getAddress() { return this.address; }
        connect(provider) {
            return new VoidSigner(this.address, provider);
        }
        #throwUnsupported(suffix, operation) {
            assert(false, `VoidSigner cannot sign ${suffix}`, "UNSUPPORTED_OPERATION", { operation });
        }
        async signTransaction(tx) {
            this.#throwUnsupported("transactions", "signTransaction");
        }
        async signMessage(message) {
            this.#throwUnsupported("messages", "signMessage");
        }
        async signTypedData(domain, types, value) {
            this.#throwUnsupported("typed-data", "signTypedData");
        }
    }

    /**
     *  There are many awesome community services that provide Ethereum
     *  nodes both for developers just starting out and for large-scale
     *  communities.
     *
     *  @_section: api/providers/thirdparty: Community Providers  [thirdparty]
     */
    // Show the throttle message only once per service
    const shown = new Set();
    /**
     *  Displays a warning in tht console when the community resource is
     *  being used too heavily by the app, recommending the developer
     *  acquire their own credentials instead of using the community
     *  credentials.
     *
     *  The notification will only occur once per service.
     */
    function showThrottleMessage(service) {
        if (shown.has(service)) {
            return;
        }
        shown.add(service);
        console.log("========= NOTICE =========");
        console.log(`Request-Rate Exceeded for ${service} (this message will not be repeated)`);
        console.log("");
        console.log("The default API keys for each service are provided as a highly-throttled,");
        console.log("community resource for low-traffic projects and early prototyping.");
        console.log("");
        console.log("While your application will continue to function, we highly recommended");
        console.log("signing up for your own API keys to improve performance, increase your");
        console.log("request rate/limit and enable other perks, such as metrics and advanced APIs.");
        console.log("");
        console.log("For more details: https:/\/docs.ethers.org/api-keys/");
        console.log("==========================");
    }

    /**
     *  A **FallbackProvider** providers resiliance, security and performatnce
     *  in a way that is customizable and configurable.
     *
     *  @_section: api/providers/fallback-provider:Fallback Provider [about-fallback-provider]
     */
    const BN_1 = BigInt("1");
    const BN_2 = BigInt("2");
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = array[i];
            array[i] = array[j];
            array[j] = tmp;
        }
    }
    function stall$3(duration) {
        return new Promise((resolve) => { setTimeout(resolve, duration); });
    }
    function getTime() { return (new Date()).getTime(); }
    function stringify(value) {
        return JSON.stringify(value, (key, value) => {
            if (typeof (value) === "bigint") {
                return { type: "bigint", value: value.toString() };
            }
            return value;
        });
    }
    const defaultConfig = { stallTimeout: 400, priority: 1, weight: 1 };
    const defaultState = {
        blockNumber: -2, requests: 0, lateResponses: 0, errorResponses: 0,
        outOfSync: -1, unsupportedEvents: 0, rollingDuration: 0, score: 0,
        _network: null, _updateNumber: null, _totalTime: 0,
        _lastFatalError: null, _lastFatalErrorTimestamp: 0
    };
    async function waitForSync(config, blockNumber) {
        while (config.blockNumber < 0 || config.blockNumber < blockNumber) {
            if (!config._updateNumber) {
                config._updateNumber = (async () => {
                    try {
                        const blockNumber = await config.provider.getBlockNumber();
                        if (blockNumber > config.blockNumber) {
                            config.blockNumber = blockNumber;
                        }
                    }
                    catch (error) {
                        config.blockNumber = -2;
                        config._lastFatalError = error;
                        config._lastFatalErrorTimestamp = getTime();
                    }
                    config._updateNumber = null;
                })();
            }
            await config._updateNumber;
            config.outOfSync++;
            if (config._lastFatalError) {
                break;
            }
        }
    }
    function _normalize(value) {
        if (value == null) {
            return "null";
        }
        if (Array.isArray(value)) {
            return "[" + (value.map(_normalize)).join(",") + "]";
        }
        if (typeof (value) === "object" && typeof (value.toJSON) === "function") {
            return _normalize(value.toJSON());
        }
        switch (typeof (value)) {
            case "boolean":
            case "symbol":
                return value.toString();
            case "bigint":
            case "number":
                return BigInt(value).toString();
            case "string":
                return JSON.stringify(value);
            case "object": {
                const keys = Object.keys(value);
                keys.sort();
                return "{" + keys.map((k) => `${JSON.stringify(k)}:${_normalize(value[k])}`).join(",") + "}";
            }
        }
        console.log("Could not serialize", value);
        throw new Error("Hmm...");
    }
    function normalizeResult(value) {
        if ("error" in value) {
            const error = value.error;
            return { tag: _normalize(error), value: error };
        }
        const result = value.result;
        return { tag: _normalize(result), value: result };
    }
    // This strategy picks the highest weight result, as long as the weight is
    // equal to or greater than quorum
    function checkQuorum(quorum, results) {
        const tally = new Map();
        for (const { value, tag, weight } of results) {
            const t = tally.get(tag) || { value, weight: 0 };
            t.weight += weight;
            tally.set(tag, t);
        }
        let best = null;
        for (const r of tally.values()) {
            if (r.weight >= quorum && (!best || r.weight > best.weight)) {
                best = r;
            }
        }
        if (best) {
            return best.value;
        }
        return undefined;
    }
    function getMedian(quorum, results) {
        let resultWeight = 0;
        const errorMap = new Map();
        let bestError = null;
        const values = [];
        for (const { value, tag, weight } of results) {
            if (value instanceof Error) {
                const e = errorMap.get(tag) || { value, weight: 0 };
                e.weight += weight;
                errorMap.set(tag, e);
                if (bestError == null || e.weight > bestError.weight) {
                    bestError = e;
                }
            }
            else {
                values.push(BigInt(value));
                resultWeight += weight;
            }
        }
        if (resultWeight < quorum) {
            // We have quorum for an error
            if (bestError && bestError.weight >= quorum) {
                return bestError.value;
            }
            // We do not have quorum for a result
            return undefined;
        }
        // Get the sorted values
        values.sort((a, b) => ((a < b) ? -1 : (b > a) ? 1 : 0));
        const mid = Math.floor(values.length / 2);
        // Odd-length; take the middle value
        if (values.length % 2) {
            return values[mid];
        }
        // Even length; take the ceiling of the mean of the center two values
        return (values[mid - 1] + values[mid] + BN_1) / BN_2;
    }
    function getAnyResult(quorum, results) {
        // If any value or error meets quorum, that is our preferred result
        const result = checkQuorum(quorum, results);
        if (result !== undefined) {
            return result;
        }
        // Otherwise, do we have any result?
        for (const r of results) {
            if (r.value) {
                return r.value;
            }
        }
        // Nope!
        return undefined;
    }
    function getFuzzyMode(quorum, results) {
        if (quorum === 1) {
            return getNumber(getMedian(quorum, results), "%internal");
        }
        const tally = new Map();
        const add = (result, weight) => {
            const t = tally.get(result) || { result, weight: 0 };
            t.weight += weight;
            tally.set(result, t);
        };
        for (const { weight, value } of results) {
            const r = getNumber(value);
            add(r - 1, weight);
            add(r, weight);
            add(r + 1, weight);
        }
        let bestWeight = 0;
        let bestResult = undefined;
        for (const { weight, result } of tally.values()) {
            // Use this result, if this result meets quorum and has either:
            // - a better weight
            // - or equal weight, but the result is larger
            if (weight >= quorum && (weight > bestWeight || (bestResult != null && weight === bestWeight && result > bestResult))) {
                bestWeight = weight;
                bestResult = result;
            }
        }
        return bestResult;
    }
    /**
     *  A **FallbackProvider** manages several [[Providers]] providing
     *  resiliance by switching between slow or misbehaving nodes, security
     *  by requiring multiple backends to aggree and performance by allowing
     *  faster backends to respond earlier.
     *
     */
    class FallbackProvider extends AbstractProvider {
        /**
         *  The number of backends that must agree on a value before it is
         *  accpeted.
         */
        quorum;
        /**
         *  @_ignore:
         */
        eventQuorum;
        /**
         *  @_ignore:
         */
        eventWorkers;
        #configs;
        #height;
        #initialSyncPromise;
        /**
         *  Creates a new **FallbackProvider** with %%providers%% connected to
         *  %%network%%.
         *
         *  If a [[Provider]] is included in %%providers%%, defaults are used
         *  for the configuration.
         */
        constructor(providers, network, options) {
            super(network, options);
            this.#configs = providers.map((p) => {
                if (p instanceof AbstractProvider) {
                    return Object.assign({ provider: p }, defaultConfig, defaultState);
                }
                else {
                    return Object.assign({}, defaultConfig, p, defaultState);
                }
            });
            this.#height = -2;
            this.#initialSyncPromise = null;
            if (options && options.quorum != null) {
                this.quorum = options.quorum;
            }
            else {
                this.quorum = Math.ceil(this.#configs.reduce((accum, config) => {
                    accum += config.weight;
                    return accum;
                }, 0) / 2);
            }
            this.eventQuorum = 1;
            this.eventWorkers = 1;
            assertArgument(this.quorum <= this.#configs.reduce((a, c) => (a + c.weight), 0), "quorum exceed provider wieght", "quorum", this.quorum);
        }
        get providerConfigs() {
            return this.#configs.map((c) => {
                const result = Object.assign({}, c);
                for (const key in result) {
                    if (key[0] === "_") {
                        delete result[key];
                    }
                }
                return result;
            });
        }
        async _detectNetwork() {
            return Network.from(getBigInt(await this._perform({ method: "chainId" })));
        }
        // @TODO: Add support to select providers to be the event subscriber
        //_getSubscriber(sub: Subscription): Subscriber {
        //    throw new Error("@TODO");
        //}
        /**
         *  Transforms a %%req%% into the correct method call on %%provider%%.
         */
        async _translatePerform(provider, req) {
            switch (req.method) {
                case "broadcastTransaction":
                    return await provider.broadcastTransaction(req.signedTransaction);
                case "call":
                    return await provider.call(Object.assign({}, req.transaction, { blockTag: req.blockTag }));
                case "chainId":
                    return (await provider.getNetwork()).chainId;
                case "estimateGas":
                    return await provider.estimateGas(req.transaction);
                case "getBalance":
                    return await provider.getBalance(req.address, req.blockTag);
                case "getBlock": {
                    const block = ("blockHash" in req) ? req.blockHash : req.blockTag;
                    return await provider.getBlock(block, req.includeTransactions);
                }
                case "getBlockNumber":
                    return await provider.getBlockNumber();
                case "getCode":
                    return await provider.getCode(req.address, req.blockTag);
                case "getGasPrice":
                    return (await provider.getFeeData()).gasPrice;
                case "getLogs":
                    return await provider.getLogs(req.filter);
                case "getStorage":
                    return await provider.getStorage(req.address, req.position, req.blockTag);
                case "getTransaction":
                    return await provider.getTransaction(req.hash);
                case "getTransactionCount":
                    return await provider.getTransactionCount(req.address, req.blockTag);
                case "getTransactionReceipt":
                    return await provider.getTransactionReceipt(req.hash);
                case "getTransactionResult":
                    return await provider.getTransactionResult(req.hash);
            }
        }
        // Grab the next (random) config that is not already part of
        // the running set
        #getNextConfig(running) {
            // @TODO: Maybe do a check here to favour (heavily) providers that
            //        do not require waitForSync and disfavour providers that
            //        seem down-ish or are behaving slowly
            const configs = Array.from(running).map((r) => r.config);
            // Shuffle the states, sorted by priority
            const allConfigs = this.#configs.slice();
            shuffle(allConfigs);
            allConfigs.sort((a, b) => (a.priority - b.priority));
            for (const config of allConfigs) {
                if (config._lastFatalError) {
                    continue;
                }
                if (configs.indexOf(config) === -1) {
                    return config;
                }
            }
            return null;
        }
        // Adds a new runner (if available) to running.
        #addRunner(running, req) {
            const config = this.#getNextConfig(running);
            // No runners available
            if (config == null) {
                return null;
            }
            // Create a new runner
            const runner = {
                config, result: null, didBump: false,
                perform: null, staller: null
            };
            const now = getTime();
            // Start performing this operation
            runner.perform = (async () => {
                try {
                    config.requests++;
                    const result = await this._translatePerform(config.provider, req);
                    runner.result = { result };
                }
                catch (error) {
                    config.errorResponses++;
                    runner.result = { error };
                }
                const dt = (getTime() - now);
                config._totalTime += dt;
                config.rollingDuration = 0.95 * config.rollingDuration + 0.05 * dt;
                runner.perform = null;
            })();
            // Start a staller; when this times out, it's time to force
            // kicking off another runner because we are taking too long
            runner.staller = (async () => {
                await stall$3(config.stallTimeout);
                runner.staller = null;
            })();
            running.add(runner);
            return runner;
        }
        // Initializes the blockNumber and network for each runner and
        // blocks until initialized
        async #initialSync() {
            let initialSync = this.#initialSyncPromise;
            if (!initialSync) {
                const promises = [];
                this.#configs.forEach((config) => {
                    promises.push((async () => {
                        await waitForSync(config, 0);
                        if (!config._lastFatalError) {
                            config._network = await config.provider.getNetwork();
                        }
                    })());
                });
                this.#initialSyncPromise = initialSync = (async () => {
                    // Wait for all providers to have a block number and network
                    await Promise.all(promises);
                    // Check all the networks match
                    let chainId = null;
                    for (const config of this.#configs) {
                        if (config._lastFatalError) {
                            continue;
                        }
                        const network = (config._network);
                        if (chainId == null) {
                            chainId = network.chainId;
                        }
                        else if (network.chainId !== chainId) {
                            assert(false, "cannot mix providers on different networks", "UNSUPPORTED_OPERATION", {
                                operation: "new FallbackProvider"
                            });
                        }
                    }
                })();
            }
            await initialSync;
        }
        async #checkQuorum(running, req) {
            // Get all the result objects
            const results = [];
            for (const runner of running) {
                if (runner.result != null) {
                    const { tag, value } = normalizeResult(runner.result);
                    results.push({ tag, value, weight: runner.config.weight });
                }
            }
            // Are there enough results to event meet quorum?
            if (results.reduce((a, r) => (a + r.weight), 0) < this.quorum) {
                return undefined;
            }
            switch (req.method) {
                case "getBlockNumber": {
                    // We need to get the bootstrap block height
                    if (this.#height === -2) {
                        this.#height = Math.ceil(getNumber(getMedian(this.quorum, this.#configs.filter((c) => (!c._lastFatalError)).map((c) => ({
                            value: c.blockNumber,
                            tag: getNumber(c.blockNumber).toString(),
                            weight: c.weight
                        })))));
                    }
                    // Find the mode across all the providers, allowing for
                    // a little drift between block heights
                    const mode = getFuzzyMode(this.quorum, results);
                    if (mode === undefined) {
                        return undefined;
                    }
                    if (mode > this.#height) {
                        this.#height = mode;
                    }
                    return this.#height;
                }
                case "getGasPrice":
                case "estimateGas":
                    return getMedian(this.quorum, results);
                case "getBlock":
                    // Pending blocks are in the mempool and already
                    // quite untrustworthy; just grab anything
                    if ("blockTag" in req && req.blockTag === "pending") {
                        return getAnyResult(this.quorum, results);
                    }
                    return checkQuorum(this.quorum, results);
                case "call":
                case "chainId":
                case "getBalance":
                case "getTransactionCount":
                case "getCode":
                case "getStorage":
                case "getTransaction":
                case "getTransactionReceipt":
                case "getLogs":
                    return checkQuorum(this.quorum, results);
                case "broadcastTransaction":
                    return getAnyResult(this.quorum, results);
            }
            assert(false, "unsupported method", "UNSUPPORTED_OPERATION", {
                operation: `_perform(${stringify(req.method)})`
            });
        }
        async #waitForQuorum(running, req) {
            if (running.size === 0) {
                throw new Error("no runners?!");
            }
            // Any promises that are interesting to watch for; an expired stall
            // or a successful perform
            const interesting = [];
            let newRunners = 0;
            for (const runner of running) {
                // No responses, yet; keep an eye on it
                if (runner.perform) {
                    interesting.push(runner.perform);
                }
                // Still stalling...
                if (runner.staller) {
                    interesting.push(runner.staller);
                    continue;
                }
                // This runner has already triggered another runner
                if (runner.didBump) {
                    continue;
                }
                // Got a response (result or error) or stalled; kick off another runner
                runner.didBump = true;
                newRunners++;
            }
            // Check if we have reached quorum on a result (or error)
            const value = await this.#checkQuorum(running, req);
            if (value !== undefined) {
                if (value instanceof Error) {
                    throw value;
                }
                return value;
            }
            // Add any new runners, because a staller timed out or a result
            // or error response came in.
            for (let i = 0; i < newRunners; i++) {
                this.#addRunner(running, req);
            }
            // All providers have returned, and we have no result
            assert(interesting.length > 0, "quorum not met", "SERVER_ERROR", {
                request: "%sub-requests",
                info: { request: req, results: Array.from(running).map((r) => stringify(r.result)) }
            });
            // Wait for someone to either complete its perform or stall out
            await Promise.race(interesting);
            // This is recursive, but at worst case the depth is 2x the
            // number of providers (each has a perform and a staller)
            return await this.#waitForQuorum(running, req);
        }
        async _perform(req) {
            // Broadcasting a transaction is rare (ish) and already incurs
            // a cost on the user, so spamming is safe-ish. Just send it to
            // every backend.
            if (req.method === "broadcastTransaction") {
                const results = await Promise.all(this.#configs.map(async ({ provider, weight }) => {
                    try {
                        const result = await provider._perform(req);
                        return Object.assign(normalizeResult({ result }), { weight });
                    }
                    catch (error) {
                        return Object.assign(normalizeResult({ error }), { weight });
                    }
                }));
                const result = getAnyResult(this.quorum, results);
                assert(result !== undefined, "problem multi-broadcasting", "SERVER_ERROR", {
                    request: "%sub-requests",
                    info: { request: req, results: results.map(stringify) }
                });
                if (result instanceof Error) {
                    throw result;
                }
                return result;
            }
            await this.#initialSync();
            // Bootstrap enough runners to meet quorum
            const running = new Set();
            for (let i = 0; i < this.quorum; i++) {
                this.#addRunner(running, req);
            }
            const result = await this.#waitForQuorum(running, req);
            // Track requests sent to a provider that are still
            // outstanding after quorum has been otherwise found
            for (const runner of running) {
                if (runner.perform && runner.result == null) {
                    runner.config.lateResponses++;
                }
            }
            return result;
        }
        async destroy() {
            for (const { provider } of this.#configs) {
                provider.destroy();
            }
            super.destroy();
        }
    }

    function copy$1(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    /**
     *  A **PollingEventSubscriber** will poll for a given filter for its logs.
     *
     *  @_docloc: api/providers/abstract-provider
     */
    class PollingEventSubscriber {
        #provider;
        #filter;
        #poller;
        #running;
        // The most recent block we have scanned for events. The value -2
        // indicates we still need to fetch an initial block number
        #blockNumber;
        /**
         *  Create a new **PollingTransactionSubscriber** attached to
         *  %%provider%%, listening for %%filter%%.
         */
        constructor(provider, filter) {
            this.#provider = provider;
            this.#filter = copy$1(filter);
            this.#poller = this.#poll.bind(this);
            this.#running = false;
            this.#blockNumber = -2;
        }
        async #poll(blockNumber) {
            // The initial block hasn't been determined yet
            if (this.#blockNumber === -2) {
                return;
            }
            const filter = copy$1(this.#filter);
            filter.fromBlock = this.#blockNumber + 1;
            filter.toBlock = blockNumber;
            const logs = await this.#provider.getLogs(filter);
            // No logs could just mean the node has not indexed them yet,
            // so we keep a sliding window of 60 blocks to keep scanning
            if (logs.length === 0) {
                if (this.#blockNumber < blockNumber - 60) {
                    this.#blockNumber = blockNumber - 60;
                }
                return;
            }
            for (const log of logs) {
                this.#provider.emit(this.#filter, log);
                // Only advance the block number when logs were found to
                // account for networks (like BNB and Polygon) which may
                // sacrifice event consistency for block event speed
                this.#blockNumber = log.blockNumber;
            }
        }
        start() {
            if (this.#running) {
                return;
            }
            this.#running = true;
            if (this.#blockNumber === -2) {
                this.#provider.getBlockNumber().then((blockNumber) => {
                    this.#blockNumber = blockNumber;
                });
            }
            this.#provider.on("block", this.#poller);
        }
        stop() {
            if (!this.#running) {
                return;
            }
            this.#running = false;
            this.#provider.off("block", this.#poller);
        }
        pause(dropWhilePaused) {
            this.stop();
            if (dropWhilePaused) {
                this.#blockNumber = -2;
            }
        }
        resume() {
            this.start();
        }
    }

    function copy(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    /**
     *  Some backends support subscribing to events using a Filter ID.
     *
     *  When subscribing with this technique, the node issues a unique
     *  //Filter ID//. At this point the node dedicates resources to
     *  the filter, so that periodic calls to follow up on the //Filter ID//
     *  will receive any events since the last call.
     *
     *  @_docloc: api/providers/abstract-provider
     */
    class FilterIdSubscriber {
        #provider;
        #filterIdPromise;
        #poller;
        #running;
        #network;
        #hault;
        /**
         *  Creates a new **FilterIdSubscriber** which will used [[_subscribe]]
         *  and [[_emitResults]] to setup the subscription and provide the event
         *  to the %%provider%%.
         */
        constructor(provider) {
            this.#provider = provider;
            this.#filterIdPromise = null;
            this.#poller = this.#poll.bind(this);
            this.#running = false;
            this.#network = null;
            this.#hault = false;
        }
        /**
         *  Sub-classes **must** override this to begin the subscription.
         */
        _subscribe(provider) {
            throw new Error("subclasses must override this");
        }
        /**
         *  Sub-classes **must** override this handle the events.
         */
        _emitResults(provider, result) {
            throw new Error("subclasses must override this");
        }
        /**
         *  Sub-classes **must** override this handle recovery on errors.
         */
        _recover(provider) {
            throw new Error("subclasses must override this");
        }
        async #poll(blockNumber) {
            try {
                // Subscribe if necessary
                if (this.#filterIdPromise == null) {
                    this.#filterIdPromise = this._subscribe(this.#provider);
                }
                // Get the Filter ID
                let filterId = null;
                try {
                    filterId = await this.#filterIdPromise;
                }
                catch (error) {
                    if (!isError(error, "UNSUPPORTED_OPERATION") || error.operation !== "eth_newFilter") {
                        throw error;
                    }
                }
                // The backend does not support Filter ID; downgrade to
                // polling
                if (filterId == null) {
                    this.#filterIdPromise = null;
                    this.#provider._recoverSubscriber(this, this._recover(this.#provider));
                    return;
                }
                const network = await this.#provider.getNetwork();
                if (!this.#network) {
                    this.#network = network;
                }
                if (this.#network.chainId !== network.chainId) {
                    throw new Error("chaid changed");
                }
                if (this.#hault) {
                    return;
                }
                const result = await this.#provider.send("eth_getFilterChanges", [filterId]);
                await this._emitResults(this.#provider, result);
            }
            catch (error) {
                console.log("@TODO", error);
            }
            this.#provider.once("block", this.#poller);
        }
        #teardown() {
            const filterIdPromise = this.#filterIdPromise;
            if (filterIdPromise) {
                this.#filterIdPromise = null;
                filterIdPromise.then((filterId) => {
                    this.#provider.send("eth_uninstallFilter", [filterId]);
                });
            }
        }
        start() {
            if (this.#running) {
                return;
            }
            this.#running = true;
            this.#poll(-2);
        }
        stop() {
            if (!this.#running) {
                return;
            }
            this.#running = false;
            this.#hault = true;
            this.#teardown();
            this.#provider.off("block", this.#poller);
        }
        pause(dropWhilePaused) {
            if (dropWhilePaused) {
                this.#teardown();
            }
            this.#provider.off("block", this.#poller);
        }
        resume() { this.start(); }
    }
    /**
     *  A **FilterIdSubscriber** for receiving contract events.
     *
     *  @_docloc: api/providers/abstract-provider
     */
    class FilterIdEventSubscriber extends FilterIdSubscriber {
        #event;
        /**
         *  Creates a new **FilterIdEventSubscriber** attached to %%provider%%
         *  listening for %%filter%%.
         */
        constructor(provider, filter) {
            super(provider);
            this.#event = copy(filter);
        }
        _recover(provider) {
            return new PollingEventSubscriber(provider, this.#event);
        }
        async _subscribe(provider) {
            const filterId = await provider.send("eth_newFilter", [this.#event]);
            return filterId;
        }
        async _emitResults(provider, results) {
            for (const result of results) {
                provider.emit(this.#event, provider._wrapLog(result, provider._network));
            }
        }
    }
    /**
     *  A **FilterIdSubscriber** for receiving pending transactions events.
     *
     *  @_docloc: api/providers/abstract-provider
     */
    class FilterIdPendingSubscriber extends FilterIdSubscriber {
        async _subscribe(provider) {
            return await provider.send("eth_newPendingTransactionFilter", []);
        }
        async _emitResults(provider, results) {
            for (const result of results) {
                provider.emit("pending", result);
            }
        }
    }

    /**
     *  One of the most common ways to interact with the blockchain is
     *  by a node running a JSON-RPC interface which can be connected to,
     *  based on the transport, using:
     *
     *  - HTTP or HTTPS - [[JsonRpcProvider]]
     *  - WebSocket - [[WebSocketProvider]]
     *  - IPC - [[IpcSocketProvider]]
     *
     * @_section: api/providers/jsonrpc:JSON-RPC Provider  [about-jsonrpcProvider]
     */
    // @TODO:
    // - Add the batching API
    // https://playground.open-rpc.org/?schemaUrl=https://raw.githubusercontent.com/ethereum/eth1.0-apis/assembled-spec/openrpc.json&uiSchema%5BappBar%5D%5Bui:splitView%5D=true&uiSchema%5BappBar%5D%5Bui:input%5D=false&uiSchema%5BappBar%5D%5Bui:examplesDropdown%5D=false
    const Primitive = "bigint,boolean,function,number,string,symbol".split(/,/g);
    //const Methods = "getAddress,then".split(/,/g);
    function deepCopy(value) {
        if (value == null || Primitive.indexOf(typeof (value)) >= 0) {
            return value;
        }
        // Keep any Addressable
        if (typeof (value.getAddress) === "function") {
            return value;
        }
        if (Array.isArray(value)) {
            return (value.map(deepCopy));
        }
        if (typeof (value) === "object") {
            return Object.keys(value).reduce((accum, key) => {
                accum[key] = value[key];
                return accum;
            }, {});
        }
        throw new Error(`should not happen: ${value} (${typeof (value)})`);
    }
    function stall$2(duration) {
        return new Promise((resolve) => { setTimeout(resolve, duration); });
    }
    function getLowerCase(value) {
        if (value) {
            return value.toLowerCase();
        }
        return value;
    }
    const defaultOptions = {
        staticNetwork: null,
        batchStallTime: 10,
        batchMaxSize: (1 << 20),
        batchMaxCount: 100,
        cacheTimeout: 250
    };
    // @TODO: Unchecked Signers
    class JsonRpcSigner extends AbstractSigner {
        address;
        constructor(provider, address) {
            super(provider);
            address = getAddress(address);
            defineProperties(this, { address });
        }
        connect(provider) {
            assert(false, "cannot reconnect JsonRpcSigner", "UNSUPPORTED_OPERATION", {
                operation: "signer.connect"
            });
        }
        async getAddress() {
            return this.address;
        }
        // JSON-RPC will automatially fill in nonce, etc. so we just check from
        async populateTransaction(tx) {
            return await this.populateCall(tx);
        }
        // Returns just the hash of the transaction after sent, which is what
        // the bare JSON-RPC API does;
        async sendUncheckedTransaction(_tx) {
            const tx = deepCopy(_tx);
            const promises = [];
            // Make sure the from matches the sender
            if (tx.from) {
                const _from = tx.from;
                promises.push((async () => {
                    const from = await resolveAddress(_from, this.provider);
                    assertArgument(from != null && from.toLowerCase() === this.address.toLowerCase(), "from address mismatch", "transaction", _tx);
                    tx.from = from;
                })());
            }
            else {
                tx.from = this.address;
            }
            // The JSON-RPC for eth_sendTransaction uses 90000 gas; if the user
            // wishes to use this, it is easy to specify explicitly, otherwise
            // we look it up for them.
            if (tx.gasLimit == null) {
                promises.push((async () => {
                    tx.gasLimit = await this.provider.estimateGas({ ...tx, from: this.address });
                })());
            }
            // The address may be an ENS name or Addressable
            if (tx.to != null) {
                const _to = tx.to;
                promises.push((async () => {
                    tx.to = await resolveAddress(_to, this.provider);
                })());
            }
            // Wait until all of our properties are filled in
            if (promises.length) {
                await Promise.all(promises);
            }
            const hexTx = this.provider.getRpcTransaction(tx);
            return this.provider.send("eth_sendTransaction", [hexTx]);
        }
        async sendTransaction(tx) {
            // This cannot be mined any earlier than any recent block
            const blockNumber = await this.provider.getBlockNumber();
            // Send the transaction
            const hash = await this.sendUncheckedTransaction(tx);
            // Unfortunately, JSON-RPC only provides and opaque transaction hash
            // for a response, and we need the actual transaction, so we poll
            // for it; it should show up very quickly
            return await (new Promise((resolve, reject) => {
                const timeouts = [1000, 100];
                const checkTx = async () => {
                    // Try getting the transaction
                    const tx = await this.provider.getTransaction(hash);
                    if (tx != null) {
                        resolve(tx.replaceableTransaction(blockNumber));
                        return;
                    }
                    // Wait another 4 seconds
                    this.provider._setTimeout(() => { checkTx(); }, timeouts.pop() || 4000);
                };
                checkTx();
            }));
        }
        async signTransaction(_tx) {
            const tx = deepCopy(_tx);
            // Make sure the from matches the sender
            if (tx.from) {
                const from = await resolveAddress(tx.from, this.provider);
                assertArgument(from != null && from.toLowerCase() === this.address.toLowerCase(), "from address mismatch", "transaction", _tx);
                tx.from = from;
            }
            else {
                tx.from = this.address;
            }
            const hexTx = this.provider.getRpcTransaction(tx);
            return await this.provider.send("eth_signTransaction", [hexTx]);
        }
        async signMessage(_message) {
            const message = ((typeof (_message) === "string") ? toUtf8Bytes(_message) : _message);
            return await this.provider.send("personal_sign", [
                hexlify(message), this.address.toLowerCase()
            ]);
        }
        async signTypedData(domain, types, _value) {
            const value = deepCopy(_value);
            // Populate any ENS names (in-place)
            const populated = await TypedDataEncoder.resolveNames(domain, types, value, async (value) => {
                const address = await resolveAddress(value);
                assertArgument(address != null, "TypedData does not support null address", "value", value);
                return address;
            });
            return await this.provider.send("eth_signTypedData_v4", [
                this.address.toLowerCase(),
                JSON.stringify(TypedDataEncoder.getPayload(populated.domain, types, populated.value))
            ]);
        }
        async unlock(password) {
            return this.provider.send("personal_unlockAccount", [
                this.address.toLowerCase(), password, null
            ]);
        }
        // https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign
        async _legacySignMessage(_message) {
            const message = ((typeof (_message) === "string") ? toUtf8Bytes(_message) : _message);
            return await this.provider.send("eth_sign", [
                this.address.toLowerCase(), hexlify(message)
            ]);
        }
    }
    /**
     *  The JsonRpcApiProvider is an abstract class and **MUST** be
     *  sub-classed.
     *
     *  It provides the base for all JSON-RPC-based Provider interaction.
     *
     *  Sub-classing Notes:
     *  - a sub-class MUST override _send
     *  - a sub-class MUST call the `_start()` method once connected
     */
    class JsonRpcApiProvider extends AbstractProvider {
        #options;
        // The next ID to use for the JSON-RPC ID field
        #nextId;
        // Payloads are queued and triggered in batches using the drainTimer
        #payloads;
        #drainTimer;
        #notReady;
        #network;
        #scheduleDrain() {
            if (this.#drainTimer) {
                return;
            }
            // If we aren't using batching, no hard in sending it immeidately
            const stallTime = (this._getOption("batchMaxCount") === 1) ? 0 : this._getOption("batchStallTime");
            this.#drainTimer = setTimeout(() => {
                this.#drainTimer = null;
                const payloads = this.#payloads;
                this.#payloads = [];
                while (payloads.length) {
                    // Create payload batches that satisfy our batch constraints
                    const batch = [(payloads.shift())];
                    while (payloads.length) {
                        if (batch.length === this.#options.batchMaxCount) {
                            break;
                        }
                        batch.push((payloads.shift()));
                        const bytes = JSON.stringify(batch.map((p) => p.payload));
                        if (bytes.length > this.#options.batchMaxSize) {
                            payloads.unshift((batch.pop()));
                            break;
                        }
                    }
                    // Process the result to each payload
                    (async () => {
                        const payload = ((batch.length === 1) ? batch[0].payload : batch.map((p) => p.payload));
                        this.emit("debug", { action: "sendRpcPayload", payload });
                        try {
                            const result = await this._send(payload);
                            this.emit("debug", { action: "receiveRpcResult", result });
                            // Process results in batch order
                            for (const { resolve, reject, payload } of batch) {
                                if (this.destroyed) {
                                    reject(makeError("provider destroyed; cancelled request", "UNSUPPORTED_OPERATION", { operation: payload.method }));
                                    continue;
                                }
                                // Find the matching result
                                const resp = result.filter((r) => (r.id === payload.id))[0];
                                // No result; the node failed us in unexpected ways
                                if (resp == null) {
                                    const error = makeError("missing response for request", "BAD_DATA", {
                                        value: result, info: { payload }
                                    });
                                    this.emit("error", error);
                                    reject(error);
                                    continue;
                                }
                                // The response is an error
                                if ("error" in resp) {
                                    reject(this.getRpcError(payload, resp));
                                    continue;
                                }
                                // All good; send the result
                                resolve(resp.result);
                            }
                        }
                        catch (error) {
                            this.emit("debug", { action: "receiveRpcError", error });
                            for (const { reject } of batch) {
                                // @TODO: augment the error with the payload
                                reject(error);
                            }
                        }
                    })();
                }
            }, stallTime);
        }
        constructor(network, options) {
            super(network, options);
            this.#nextId = 1;
            this.#options = Object.assign({}, defaultOptions, options || {});
            this.#payloads = [];
            this.#drainTimer = null;
            this.#network = null;
            {
                let resolve = null;
                const promise = new Promise((_resolve) => {
                    resolve = _resolve;
                });
                this.#notReady = { promise, resolve };
            }
            // Make sure any static network is compatbile with the provided netwrok
            const staticNetwork = this._getOption("staticNetwork");
            if (staticNetwork) {
                assertArgument(network == null || staticNetwork.matches(network), "staticNetwork MUST match network object", "options", options);
                this.#network = staticNetwork;
            }
        }
        /**
         *  Returns the value associated with the option %%key%%.
         *
         *  Sub-classes can use this to inquire about configuration options.
         */
        _getOption(key) {
            return this.#options[key];
        }
        /**
         *  Gets the [[Network]] this provider has committed to. On each call, the network
         *  is detected, and if it has changed, the call will reject.
         */
        get _network() {
            assert(this.#network, "network is not available yet", "NETWORK_ERROR");
            return this.#network;
        }
        /**
         *  Resolves to the non-normalized value by performing %%req%%.
         *
         *  Sub-classes may override this to modify behavior of actions,
         *  and should generally call ``super._perform`` as a fallback.
         */
        async _perform(req) {
            // Legacy networks do not like the type field being passed along (which
            // is fair), so we delete type if it is 0 and a non-EIP-1559 network
            if (req.method === "call" || req.method === "estimateGas") {
                let tx = req.transaction;
                if (tx && tx.type != null && getBigInt(tx.type)) {
                    // If there are no EIP-1559 properties, it might be non-EIP-a559
                    if (tx.maxFeePerGas == null && tx.maxPriorityFeePerGas == null) {
                        const feeData = await this.getFeeData();
                        if (feeData.maxFeePerGas == null && feeData.maxPriorityFeePerGas == null) {
                            // Network doesn't know about EIP-1559 (and hence type)
                            req = Object.assign({}, req, {
                                transaction: Object.assign({}, tx, { type: undefined })
                            });
                        }
                    }
                }
            }
            const request = this.getRpcRequest(req);
            if (request != null) {
                return await this.send(request.method, request.args);
            }
            return super._perform(req);
        }
        /**
         *  Sub-classes may override this; it detects the *actual* network that
         *  we are **currently** connected to.
         *
         *  Keep in mind that [[send]] may only be used once [[ready]], otherwise the
         *  _send primitive must be used instead.
         */
        async _detectNetwork() {
            const network = this._getOption("staticNetwork");
            if (network) {
                return network;
            }
            // If we are ready, use ``send``, which enabled requests to be batched
            if (this.ready) {
                return Network.from(getBigInt(await this.send("eth_chainId", [])));
            }
            // We are not ready yet; use the primitive _send
            const payload = {
                id: this.#nextId++, method: "eth_chainId", params: [], jsonrpc: "2.0"
            };
            this.emit("debug", { action: "sendRpcPayload", payload });
            let result;
            try {
                result = (await this._send(payload))[0];
            }
            catch (error) {
                this.emit("debug", { action: "receiveRpcError", error });
                throw error;
            }
            this.emit("debug", { action: "receiveRpcResult", result });
            if ("result" in result) {
                return Network.from(getBigInt(result.result));
            }
            throw this.getRpcError(payload, result);
        }
        /**
         *  Sub-classes **MUST** call this. Until [[_start]] has been called, no calls
         *  will be passed to [[_send]] from [[send]]. If it is overridden, then
         *  ``super._start()`` **MUST** be called.
         *
         *  Calling it multiple times is safe and has no effect.
         */
        _start() {
            if (this.#notReady == null || this.#notReady.resolve == null) {
                return;
            }
            this.#notReady.resolve();
            this.#notReady = null;
            (async () => {
                // Bootstrap the network
                while (this.#network == null && !this.destroyed) {
                    try {
                        this.#network = await this._detectNetwork();
                    }
                    catch (error) {
                        if (this.destroyed) {
                            break;
                        }
                        console.log("JsonRpcProvider failed to detect network and cannot start up; retry in 1s (perhaps the URL is wrong or the node is not started)");
                        this.emit("error", makeError("failed to bootstrap network detection", "NETWORK_ERROR", { event: "initial-network-discovery", info: { error } }));
                        await stall$2(1000);
                    }
                }
                // Start dispatching requests
                this.#scheduleDrain();
            })();
        }
        /**
         *  Resolves once the [[_start]] has been called. This can be used in
         *  sub-classes to defer sending data until the connection has been
         *  established.
         */
        async _waitUntilReady() {
            if (this.#notReady == null) {
                return;
            }
            return await this.#notReady.promise;
        }
        /**
         *  Return a Subscriber that will manage the %%sub%%.
         *
         *  Sub-classes may override this to modify the behavior of
         *  subscription management.
         */
        _getSubscriber(sub) {
            // Pending Filters aren't availble via polling
            if (sub.type === "pending") {
                return new FilterIdPendingSubscriber(this);
            }
            if (sub.type === "event") {
                return new FilterIdEventSubscriber(this, sub.filter);
            }
            // Orphaned Logs are handled automatically, by the filter, since
            // logs with removed are emitted by it
            if (sub.type === "orphan" && sub.filter.orphan === "drop-log") {
                return new UnmanagedSubscriber("orphan");
            }
            return super._getSubscriber(sub);
        }
        /**
         *  Returns true only if the [[_start]] has been called.
         */
        get ready() { return this.#notReady == null; }
        /**
         *  Returns %%tx%% as a normalized JSON-RPC transaction request,
         *  which has all values hexlified and any numeric values converted
         *  to Quantity values.
         */
        getRpcTransaction(tx) {
            const result = {};
            // JSON-RPC now requires numeric values to be "quantity" values
            ["chainId", "gasLimit", "gasPrice", "type", "maxFeePerGas", "maxPriorityFeePerGas", "nonce", "value"].forEach((key) => {
                if (tx[key] == null) {
                    return;
                }
                let dstKey = key;
                if (key === "gasLimit") {
                    dstKey = "gas";
                }
                result[dstKey] = toQuantity(getBigInt(tx[key], `tx.${key}`));
            });
            // Make sure addresses and data are lowercase
            ["from", "to", "data"].forEach((key) => {
                if (tx[key] == null) {
                    return;
                }
                result[key] = hexlify(tx[key]);
            });
            // Normalize the access list object
            if (tx.accessList) {
                result["accessList"] = accessListify(tx.accessList);
            }
            return result;
        }
        /**
         *  Returns the request method and arguments required to perform
         *  %%req%%.
         */
        getRpcRequest(req) {
            switch (req.method) {
                case "chainId":
                    return { method: "eth_chainId", args: [] };
                case "getBlockNumber":
                    return { method: "eth_blockNumber", args: [] };
                case "getGasPrice":
                    return { method: "eth_gasPrice", args: [] };
                case "getBalance":
                    return {
                        method: "eth_getBalance",
                        args: [getLowerCase(req.address), req.blockTag]
                    };
                case "getTransactionCount":
                    return {
                        method: "eth_getTransactionCount",
                        args: [getLowerCase(req.address), req.blockTag]
                    };
                case "getCode":
                    return {
                        method: "eth_getCode",
                        args: [getLowerCase(req.address), req.blockTag]
                    };
                case "getStorage":
                    return {
                        method: "eth_getStorageAt",
                        args: [
                            getLowerCase(req.address),
                            ("0x" + req.position.toString(16)),
                            req.blockTag
                        ]
                    };
                case "broadcastTransaction":
                    return {
                        method: "eth_sendRawTransaction",
                        args: [req.signedTransaction]
                    };
                case "getBlock":
                    if ("blockTag" in req) {
                        return {
                            method: "eth_getBlockByNumber",
                            args: [req.blockTag, !!req.includeTransactions]
                        };
                    }
                    else if ("blockHash" in req) {
                        return {
                            method: "eth_getBlockByHash",
                            args: [req.blockHash, !!req.includeTransactions]
                        };
                    }
                    break;
                case "getTransaction":
                    return {
                        method: "eth_getTransactionByHash",
                        args: [req.hash]
                    };
                case "getTransactionReceipt":
                    return {
                        method: "eth_getTransactionReceipt",
                        args: [req.hash]
                    };
                case "call":
                    return {
                        method: "eth_call",
                        args: [this.getRpcTransaction(req.transaction), req.blockTag]
                    };
                case "estimateGas": {
                    return {
                        method: "eth_estimateGas",
                        args: [this.getRpcTransaction(req.transaction)]
                    };
                }
                case "getLogs":
                    if (req.filter && req.filter.address != null) {
                        if (Array.isArray(req.filter.address)) {
                            req.filter.address = req.filter.address.map(getLowerCase);
                        }
                        else {
                            req.filter.address = getLowerCase(req.filter.address);
                        }
                    }
                    return { method: "eth_getLogs", args: [req.filter] };
            }
            return null;
        }
        /**
         *  Returns an ethers-style Error for the given JSON-RPC error
         *  %%payload%%, coalescing the various strings and error shapes
         *  that different nodes return, coercing them into a machine-readable
         *  standardized error.
         */
        getRpcError(payload, _error) {
            const { method } = payload;
            const { error } = _error;
            if (method === "eth_estimateGas" && error.message) {
                const msg = error.message;
                if (!msg.match(/revert/i) && msg.match(/insufficient funds/i)) {
                    return makeError("insufficient funds", "INSUFFICIENT_FUNDS", {
                        transaction: (payload.params[0]),
                        info: { payload, error }
                    });
                }
            }
            if (method === "eth_call" || method === "eth_estimateGas") {
                const result = spelunkData(error);
                const e = AbiCoder.getBuiltinCallException((method === "eth_call") ? "call" : "estimateGas", (payload.params[0]), (result ? result.data : null));
                e.info = { error, payload };
                return e;
            }
            // Only estimateGas and call can return arbitrary contract-defined text, so now we
            // we can process text safely.
            const message = JSON.stringify(spelunkMessage(error));
            if (typeof (error.message) === "string" && error.message.match(/user denied|ethers-user-denied/i)) {
                const actionMap = {
                    eth_sign: "signMessage",
                    personal_sign: "signMessage",
                    eth_signTypedData_v4: "signTypedData",
                    eth_signTransaction: "signTransaction",
                    eth_sendTransaction: "sendTransaction",
                    eth_requestAccounts: "requestAccess",
                    wallet_requestAccounts: "requestAccess",
                };
                return makeError(`user rejected action`, "ACTION_REJECTED", {
                    action: (actionMap[method] || "unknown"),
                    reason: "rejected",
                    info: { payload, error }
                });
            }
            if (method === "eth_sendRawTransaction" || method === "eth_sendTransaction") {
                const transaction = (payload.params[0]);
                if (message.match(/insufficient funds|base fee exceeds gas limit/i)) {
                    return makeError("insufficient funds for intrinsic transaction cost", "INSUFFICIENT_FUNDS", {
                        transaction, info: { error }
                    });
                }
                if (message.match(/nonce/i) && message.match(/too low/i)) {
                    return makeError("nonce has already been used", "NONCE_EXPIRED", { transaction, info: { error } });
                }
                // "replacement transaction underpriced"
                if (message.match(/replacement transaction/i) && message.match(/underpriced/i)) {
                    return makeError("replacement fee too low", "REPLACEMENT_UNDERPRICED", { transaction, info: { error } });
                }
                if (message.match(/only replay-protected/i)) {
                    return makeError("legacy pre-eip-155 transactions not supported", "UNSUPPORTED_OPERATION", {
                        operation: method, info: { transaction, info: { error } }
                    });
                }
            }
            let unsupported = !!message.match(/the method .* does not exist/i);
            if (!unsupported) {
                if (error && error.details && error.details.startsWith("Unauthorized method:")) {
                    unsupported = true;
                }
            }
            if (unsupported) {
                return makeError("unsupported operation", "UNSUPPORTED_OPERATION", {
                    operation: payload.method, info: { error, payload }
                });
            }
            return makeError("could not coalesce error", "UNKNOWN_ERROR", { error, payload });
        }
        /**
         *  Requests the %%method%% with %%params%% via the JSON-RPC protocol
         *  over the underlying channel. This can be used to call methods
         *  on the backend that do not have a high-level API within the Provider
         *  API.
         *
         *  This method queues requests according to the batch constraints
         *  in the options, assigns the request a unique ID.
         *
         *  **Do NOT override** this method in sub-classes; instead
         *  override [[_send]] or force the options values in the
         *  call to the constructor to modify this method's behavior.
         */
        send(method, params) {
            // @TODO: cache chainId?? purge on switch_networks
            // We have been destroyed; no operations are supported anymore
            if (this.destroyed) {
                return Promise.reject(makeError("provider destroyed; cancelled request", "UNSUPPORTED_OPERATION", { operation: method }));
            }
            const id = this.#nextId++;
            const promise = new Promise((resolve, reject) => {
                this.#payloads.push({
                    resolve, reject,
                    payload: { method, params, id, jsonrpc: "2.0" }
                });
            });
            // If there is not a pending drainTimer, set one
            this.#scheduleDrain();
            return promise;
        }
        /**
         *  Resolves to the [[Signer]] account for  %%address%% managed by
         *  the client.
         *
         *  If the %%address%% is a number, it is used as an index in the
         *  the accounts from [[listAccounts]].
         *
         *  This can only be used on clients which manage accounts (such as
         *  Geth with imported account or MetaMask).
         *
         *  Throws if the account doesn't exist.
         */
        async getSigner(address) {
            if (address == null) {
                address = 0;
            }
            const accountsPromise = this.send("eth_accounts", []);
            // Account index
            if (typeof (address) === "number") {
                const accounts = (await accountsPromise);
                if (address >= accounts.length) {
                    throw new Error("no such account");
                }
                return new JsonRpcSigner(this, accounts[address]);
            }
            const { accounts } = await resolveProperties({
                network: this.getNetwork(),
                accounts: accountsPromise
            });
            // Account address
            address = getAddress(address);
            for (const account of accounts) {
                if (getAddress(account) === address) {
                    return new JsonRpcSigner(this, address);
                }
            }
            throw new Error("invalid account");
        }
        async listAccounts() {
            const accounts = await this.send("eth_accounts", []);
            return accounts.map((a) => new JsonRpcSigner(this, a));
        }
        destroy() {
            // Stop processing requests
            if (this.#drainTimer) {
                clearTimeout(this.#drainTimer);
                this.#drainTimer = null;
            }
            // Cancel all pending requests
            for (const { payload, reject } of this.#payloads) {
                reject(makeError("provider destroyed; cancelled request", "UNSUPPORTED_OPERATION", { operation: payload.method }));
            }
            this.#payloads = [];
            // Parent clean-up
            super.destroy();
        }
    }
    /**
     *  The JsonRpcProvider is one of the most common Providers,
     *  which performs all operations over HTTP (or HTTPS) requests.
     *
     *  Events are processed by polling the backend for the current block
     *  number; when it advances, all block-base events are then checked
     *  for updates.
     */
    class JsonRpcProvider extends JsonRpcApiProvider {
        #connect;
        constructor(url, network, options) {
            if (url == null) {
                url = "http:/\/localhost:8545";
            }
            super(network, options);
            if (typeof (url) === "string") {
                this.#connect = new FetchRequest(url);
            }
            else {
                this.#connect = url.clone();
            }
        }
        _getSubscriber(sub) {
            const subscriber = super._getSubscriber(sub);
            return subscriber;
        }
        _getConnection() {
            return this.#connect.clone();
        }
        async send(method, params) {
            // All requests are over HTTP, so we can just start handling requests
            // We do this here rather than the constructor so that we don't send any
            // requests to the network (i.e. eth_chainId) until we absolutely have to.
            await this._start();
            return await super.send(method, params);
        }
        async _send(payload) {
            // Configure a POST connection for the requested method
            const request = this._getConnection();
            request.body = JSON.stringify(payload);
            request.setHeader("content-type", "application/json");
            const response = await request.send();
            response.assertOk();
            let resp = response.bodyJson;
            if (!Array.isArray(resp)) {
                resp = [resp];
            }
            return resp;
        }
    }
    function spelunkData(value) {
        if (value == null) {
            return null;
        }
        // These *are* the droids we're looking for.
        if (typeof (value.message) === "string" && value.message.match(/revert/i) && isHexString(value.data)) {
            return { message: value.message, data: value.data };
        }
        // Spelunk further...
        if (typeof (value) === "object") {
            for (const key in value) {
                const result = spelunkData(value[key]);
                if (result) {
                    return result;
                }
            }
            return null;
        }
        // Might be a JSON string we can further descend...
        if (typeof (value) === "string") {
            try {
                return spelunkData(JSON.parse(value));
            }
            catch (error) { }
        }
        return null;
    }
    function _spelunkMessage(value, result) {
        if (value == null) {
            return;
        }
        // These *are* the droids we're looking for.
        if (typeof (value.message) === "string") {
            result.push(value.message);
        }
        // Spelunk further...
        if (typeof (value) === "object") {
            for (const key in value) {
                _spelunkMessage(value[key], result);
            }
        }
        // Might be a JSON string we can further descend...
        if (typeof (value) === "string") {
            try {
                return _spelunkMessage(JSON.parse(value), result);
            }
            catch (error) { }
        }
    }
    function spelunkMessage(value) {
        const result = [];
        _spelunkMessage(value, result);
        return result;
    }

    function getGlobal() {
        if (typeof self !== 'undefined') {
            return self;
        }
        if (typeof window !== 'undefined') {
            return window;
        }
        if (typeof global !== 'undefined') {
            return global;
        }
        throw new Error('unable to locate global object');
    }
    const _WebSocket = getGlobal().WebSocket;

    /**
     *  Generic long-lived socket provider.
     *
     *  Sub-classing notes
     *  - a sub-class MUST call the `_start()` method once connected
     *  - a sub-class MUST override the `_write(string)` method
     *  - a sub-class MUST call `_processMessage(string)` for each message
     *
     *  @_subsection: api/providers/abstract-provider:Socket Providers  [about-socketProvider]
     */
    /**
     *  A **SocketSubscriber** uses a socket transport to handle events and
     *  should use [[_emit]] to manage the events.
     */
    class SocketSubscriber {
        #provider;
        #filter;
        /**
         *  The filter.
         */
        get filter() { return JSON.parse(this.#filter); }
        #filterId;
        #paused;
        #emitPromise;
        /**
         *  Creates a new **SocketSubscriber** attached to %%provider%% listening
         *  to %%filter%%.
         */
        constructor(provider, filter) {
            this.#provider = provider;
            this.#filter = JSON.stringify(filter);
            this.#filterId = null;
            this.#paused = null;
            this.#emitPromise = null;
        }
        start() {
            this.#filterId = this.#provider.send("eth_subscribe", this.filter).then((filterId) => {
                this.#provider._register(filterId, this);
                return filterId;
            });
        }
        stop() {
            (this.#filterId).then((filterId) => {
                this.#provider.send("eth_unsubscribe", [filterId]);
            });
            this.#filterId = null;
        }
        // @TODO: pause should trap the current blockNumber, unsub, and on resume use getLogs
        //        and resume
        pause(dropWhilePaused) {
            assert(dropWhilePaused, "preserve logs while paused not supported by SocketSubscriber yet", "UNSUPPORTED_OPERATION", { operation: "pause(false)" });
            this.#paused = !!dropWhilePaused;
        }
        resume() {
            this.#paused = null;
        }
        /**
         *  @_ignore:
         */
        _handleMessage(message) {
            if (this.#filterId == null) {
                return;
            }
            if (this.#paused === null) {
                let emitPromise = this.#emitPromise;
                if (emitPromise == null) {
                    emitPromise = this._emit(this.#provider, message);
                }
                else {
                    emitPromise = emitPromise.then(async () => {
                        await this._emit(this.#provider, message);
                    });
                }
                this.#emitPromise = emitPromise.then(() => {
                    if (this.#emitPromise === emitPromise) {
                        this.#emitPromise = null;
                    }
                });
            }
        }
        /**
         *  Sub-classes **must** override this to emit the events on the
         *  provider.
         */
        async _emit(provider, message) {
            throw new Error("sub-classes must implemente this; _emit");
        }
    }
    /**
     *  A **SocketBlockSubscriber** listens for ``newHeads`` events and emits
     *  ``"block"`` events.
     */
    class SocketBlockSubscriber extends SocketSubscriber {
        /**
         *  @_ignore:
         */
        constructor(provider) {
            super(provider, ["newHeads"]);
        }
        async _emit(provider, message) {
            provider.emit("block", parseInt(message.number));
        }
    }
    /**
     *  A **SocketPendingSubscriber** listens for pending transacitons and emits
     *  ``"pending"`` events.
     */
    class SocketPendingSubscriber extends SocketSubscriber {
        /**
         *  @_ignore:
         */
        constructor(provider) {
            super(provider, ["newPendingTransactions"]);
        }
        async _emit(provider, message) {
            provider.emit("pending", message);
        }
    }
    /**
     *  A **SocketEventSubscriber** listens for event logs.
     */
    class SocketEventSubscriber extends SocketSubscriber {
        #logFilter;
        /**
         *  The filter.
         */
        get logFilter() { return JSON.parse(this.#logFilter); }
        /**
         *  @_ignore:
         */
        constructor(provider, filter) {
            super(provider, ["logs", filter]);
            this.#logFilter = JSON.stringify(filter);
        }
        async _emit(provider, message) {
            provider.emit(this.logFilter, provider._wrapLog(message, provider._network));
        }
    }
    /**
     *  A **SocketProvider** is backed by a long-lived connection over a
     *  socket, which can subscribe and receive real-time messages over
     *  its communication channel.
     */
    class SocketProvider extends JsonRpcApiProvider {
        #callbacks;
        // Maps each filterId to its subscriber
        #subs;
        // If any events come in before a subscriber has finished
        // registering, queue them
        #pending;
        /**
         *  Creates a new **SocketProvider** connected to %%network%%.
         *
         *  If unspecified, the network will be discovered.
         */
        constructor(network) {
            super(network, { batchMaxCount: 1 });
            this.#callbacks = new Map();
            this.#subs = new Map();
            this.#pending = new Map();
        }
        // This value is only valid after _start has been called
        /*
        get _network(): Network {
            if (this.#network == null) {
                throw new Error("this shouldn't happen");
            }
            return this.#network.clone();
        }
        */
        _getSubscriber(sub) {
            switch (sub.type) {
                case "close":
                    return new UnmanagedSubscriber("close");
                case "block":
                    return new SocketBlockSubscriber(this);
                case "pending":
                    return new SocketPendingSubscriber(this);
                case "event":
                    return new SocketEventSubscriber(this, sub.filter);
                case "orphan":
                    // Handled auto-matically within AbstractProvider
                    // when the log.removed = true
                    if (sub.filter.orphan === "drop-log") {
                        return new UnmanagedSubscriber("drop-log");
                    }
            }
            return super._getSubscriber(sub);
        }
        /**
         *  Register a new subscriber. This is used internalled by Subscribers
         *  and generally is unecessary unless extending capabilities.
         */
        _register(filterId, subscriber) {
            this.#subs.set(filterId, subscriber);
            const pending = this.#pending.get(filterId);
            if (pending) {
                for (const message of pending) {
                    subscriber._handleMessage(message);
                }
                this.#pending.delete(filterId);
            }
        }
        async _send(payload) {
            // WebSocket provider doesn't accept batches
            assertArgument(!Array.isArray(payload), "WebSocket does not support batch send", "payload", payload);
            // @TODO: stringify payloads here and store to prevent mutations
            // Prepare a promise to respond to
            const promise = new Promise((resolve, reject) => {
                this.#callbacks.set(payload.id, { payload, resolve, reject });
            });
            // Wait until the socket is connected before writing to it
            await this._waitUntilReady();
            // Write the request to the socket
            await this._write(JSON.stringify(payload));
            return [await promise];
        }
        // Sub-classes must call this once they are connected
        /*
        async _start(): Promise<void> {
            if (this.#ready) { return; }

            for (const { payload } of this.#callbacks.values()) {
                await this._write(JSON.stringify(payload));
            }

            this.#ready = (async function() {
                await super._start();
            })();
        }
        */
        /**
         *  Sub-classes **must** call this with messages received over their
         *  transport to be processed and dispatched.
         */
        async _processMessage(message) {
            const result = (JSON.parse(message));
            if (result && typeof (result) === "object" && "id" in result) {
                const callback = this.#callbacks.get(result.id);
                if (callback == null) {
                    this.emit("error", makeError("received result for unknown id", "UNKNOWN_ERROR", {
                        reasonCode: "UNKNOWN_ID",
                        result
                    }));
                    return;
                }
                this.#callbacks.delete(result.id);
                callback.resolve(result);
            }
            else if (result && result.method === "eth_subscription") {
                const filterId = result.params.subscription;
                const subscriber = this.#subs.get(filterId);
                if (subscriber) {
                    subscriber._handleMessage(result.params.result);
                }
                else {
                    let pending = this.#pending.get(filterId);
                    if (pending == null) {
                        pending = [];
                        this.#pending.set(filterId, pending);
                    }
                    pending.push(result.params.result);
                }
            }
            else {
                this.emit("error", makeError("received unexpected message", "UNKNOWN_ERROR", {
                    reasonCode: "UNEXPECTED_MESSAGE",
                    result
                }));
                return;
            }
        }
        /**
         *  Sub-classes **must** override this to send %%message%% over their
         *  transport.
         */
        async _write(message) {
            throw new Error("sub-classes must override this");
        }
    }

    /**
     *  A JSON-RPC provider which is backed by a WebSocket.
     *
     *  WebSockets are often preferred because they retain a live connection
     *  to a server, which permits more instant access to events.
     *
     *  However, this incurs higher server infrasturture costs, so additional
     *  resources may be required to host your own WebSocket nodes and many
     *  third-party services charge additional fees for WebSocket endpoints.
     */
    class WebSocketProvider extends SocketProvider {
        #connect;
        #websocket;
        get websocket() {
            if (this.#websocket == null) {
                throw new Error("websocket closed");
            }
            return this.#websocket;
        }
        constructor(url, network) {
            super(network);
            if (typeof (url) === "string") {
                this.#connect = () => { return new _WebSocket(url); };
                this.#websocket = this.#connect();
            }
            else if (typeof (url) === "function") {
                this.#connect = url;
                this.#websocket = url();
            }
            else {
                this.#connect = null;
                this.#websocket = url;
            }
            this.websocket.onopen = async () => {
                try {
                    await this._start();
                    this.resume();
                }
                catch (error) {
                    console.log("failed to start WebsocketProvider", error);
                    // @TODO: now what? Attempt reconnect?
                }
            };
            this.websocket.onmessage = (message) => {
                this._processMessage(message.data);
            };
            /*
                    this.websocket.onclose = (event) => {
                        // @TODO: What event.code should we reconnect on?
                        const reconnect = false;
                        if (reconnect) {
                            this.pause(true);
                            if (this.#connect) {
                                this.#websocket = this.#connect();
                                this.#websocket.onopen = ...
                                // @TODO: this requires the super class to rebroadcast; move it there
                            }
                            this._reconnect();
                        }
                    };
            */
        }
        async _write(message) {
            this.websocket.send(message);
        }
        async destroy() {
            if (this.#websocket != null) {
                this.#websocket.close();
                this.#websocket = null;
            }
            super.destroy();
        }
    }

    function isWebSocketLike(value) {
        return (value && typeof (value.send) === "function" &&
            typeof (value.close) === "function");
    }
    const Testnets = "goerli kovan sepolia classicKotti optimism-goerli arbitrum-goerli matic-mumbai bnbt".split(" ");
    /**
     *  Returns a default provider for %%network%%.
     *
     *  If %%network%% is a [[WebSocketLike]] or string that begins with
     *  ``"ws:"`` or ``"wss:"``, a [[WebSocketProvider]] is returned backed
     *  by that WebSocket or URL.
     *
     *  If %%network%% is a string that begins with ``"HTTP:"`` or ``"HTTPS:"``,
     *  a [[JsonRpcProvider]] is returned connected to that URL.
     *
     *  Otherwise, a default provider is created backed by well-known public
     *  Web3 backends (such as [[link-infura]]) using community-provided API
     *  keys.
     *
     *  The %%options%% allows specifying custom API keys per backend (setting
     *  an API key to ``"-"`` will omit that provider) and ``options.exclusive``
     *  can be set to either a backend name or and array of backend names, which
     *  will whitelist **only** those backends.
     *
     *  Current backend strings supported are:
     *  - ``"alchemy"``
     *  - ``"ankr"``
     *  - ``"cloudflare"``
     *  - ``"etherscan"``
     *  - ``"infura"``
     *  - ``"publicPolygon"``
     *  - ``"quicknode"``
     *
     *  @example:
     *    // Connect to a local Geth node
     *    provider = getDefaultProvider("http://localhost:8545/");
     *
     *    // Connect to Ethereum mainnet with any current and future
     *    // third-party services available
     *    provider = getDefaultProvider("mainnet");
     *
     *    // Connect to Polygon, but only allow Etherscan and
     *    // INFURA and use "MY_API_KEY" in calls to Etherscan.
     *    provider = getDefaultProvider("matic", {
     *      etherscan: "MY_API_KEY",
     *      exclusive: [ "etherscan", "infura" ]
     *    });
     */
    function getDefaultProvider(network, options) {
        if (options == null) {
            options = {};
        }
        const allowService = (name) => {
            if (options[name] === "-") {
                return false;
            }
            if (typeof (options.exclusive) === "string") {
                return (name === options.exclusive);
            }
            if (Array.isArray(options.exclusive)) {
                return (options.exclusive.indexOf(name) !== -1);
            }
            return true;
        };
        if (typeof (network) === "string" && network.match(/^https?:/)) {
            return new JsonRpcProvider(network);
        }
        if (typeof (network) === "string" && network.match(/^wss?:/) || isWebSocketLike(network)) {
            return new WebSocketProvider(network);
        }
        // Get the network and name, if possible
        let staticNetwork = null;
        try {
            staticNetwork = Network.from(network);
        }
        catch (error) { }
        const providers = [];
        if (allowService("publicPolygon") && staticNetwork) {
            if (staticNetwork.name === "matic") {
                providers.push(new JsonRpcProvider("https:/\/polygon-rpc.com/", staticNetwork, { staticNetwork }));
            }
        }
        /*
            if (options.pocket !== "-") {
                try {
                    let appId = options.pocket;
                    let secretKey: undefined | string = undefined;
                    let loadBalancer: undefined | boolean = undefined;
                    if (typeof(appId) === "object") {
                        loadBalancer = !!appId.loadBalancer;
                        secretKey = appId.secretKey;
                        appId = appId.appId;
                    }
                    providers.push(new PocketProvider(network, appId, secretKey, loadBalancer));
                } catch (error) { console.log(error); }
            }
        */
        assert(providers.length, "unsupported default network", "UNSUPPORTED_OPERATION", {
            operation: "getDefaultProvider"
        });
        // No need for a FallbackProvider
        if (providers.length === 1) {
            return providers[0];
        }
        // We use the floor because public third-party providers can be unreliable,
        // so a low number of providers with a large quorum will fail too often
        let quorum = Math.floor(providers.length / 2);
        if (quorum > 2) {
            quorum = 2;
        }
        // Testnets don't need as strong a security gaurantee and speed is
        // more useful during testing
        if (staticNetwork && Testnets.indexOf(staticNetwork.name) !== -1) {
            quorum = 1;
        }
        // Provided override qorum takes priority
        if (options && options.quorum) {
            quorum = options.quorum;
        }
        return new FallbackProvider(providers, undefined, { quorum });
    }

    /**
     *  A **NonceManager** wraps another [[Signer]] and automatically manages
     *  the nonce, ensuring serialized and sequential nonces are used during
     *  transaction.
     */
    class NonceManager extends AbstractSigner {
        /**
         *  The Signer being managed.
         */
        signer;
        #noncePromise;
        #delta;
        /**
         *  Creates a new **NonceManager** to manage %%signer%%.
         */
        constructor(signer) {
            super(signer.provider);
            defineProperties(this, { signer });
            this.#noncePromise = null;
            this.#delta = 0;
        }
        async getAddress() {
            return this.signer.getAddress();
        }
        connect(provider) {
            return new NonceManager(this.signer.connect(provider));
        }
        async getNonce(blockTag) {
            if (blockTag === "pending") {
                if (this.#noncePromise == null) {
                    this.#noncePromise = super.getNonce("pending");
                }
                const delta = this.#delta;
                return (await this.#noncePromise) + delta;
            }
            return super.getNonce(blockTag);
        }
        /**
         *  Manually increment the nonce. This may be useful when managng
         *  offline transactions.
         */
        increment() {
            this.#delta++;
        }
        /**
         *  Resets the nonce, causing the **NonceManager** to reload the current
         *  nonce from the blockchain on the next transaction.
         */
        reset() {
            this.#delta = 0;
            this.#noncePromise = null;
        }
        async sendTransaction(tx) {
            const noncePromise = this.getNonce("pending");
            this.increment();
            tx = await this.signer.populateTransaction(tx);
            tx.nonce = await noncePromise;
            // @TODO: Maybe handle interesting/recoverable errors?
            // Like don't increment if the tx was certainly not sent
            return await this.signer.sendTransaction(tx);
        }
        signTransaction(tx) {
            return this.signer.signTransaction(tx);
        }
        signMessage(message) {
            return this.signer.signMessage(message);
        }
        signTypedData(domain, types, value) {
            return this.signer.signTypedData(domain, types, value);
        }
    }

    /**
     *  A **BrowserProvider** is intended to wrap an injected provider which
     *  adheres to the [[link-eip-1193]] standard, which most (if not all)
     *  currently do.
     */
    class BrowserProvider extends JsonRpcApiProvider {
        #request;
        /**
         *  Connnect to the %%ethereum%% provider, optionally forcing the
         *  %%network%%.
         */
        constructor(ethereum, network) {
            super(network, { batchMaxCount: 1 });
            this.#request = async (method, params) => {
                const payload = { method, params };
                this.emit("debug", { action: "sendEip1193Request", payload });
                try {
                    const result = await ethereum.request(payload);
                    this.emit("debug", { action: "receiveEip1193Result", result });
                    return result;
                }
                catch (e) {
                    const error = new Error(e.message);
                    error.code = e.code;
                    error.data = e.data;
                    error.payload = payload;
                    this.emit("debug", { action: "receiveEip1193Error", error });
                    throw error;
                }
            };
        }
        async send(method, params) {
            await this._start();
            return await super.send(method, params);
        }
        async _send(payload) {
            assertArgument(!Array.isArray(payload), "EIP-1193 does not support batch request", "payload", payload);
            try {
                const result = await this.#request(payload.method, payload.params || []);
                return [{ id: payload.id, result }];
            }
            catch (e) {
                return [{
                        id: payload.id,
                        error: { code: e.code, data: e.data, message: e.message }
                    }];
            }
        }
        getRpcError(payload, error) {
            error = JSON.parse(JSON.stringify(error));
            // EIP-1193 gives us some machine-readable error codes, so rewrite
            // them into 
            switch (error.error.code || -1) {
                case 4001:
                    error.error.message = `ethers-user-denied: ${error.error.message}`;
                    break;
                case 4200:
                    error.error.message = `ethers-unsupported: ${error.error.message}`;
                    break;
            }
            return super.getRpcError(payload, error);
        }
        /**
         *  Resolves to ``true`` if the provider manages the %%address%%.
         */
        async hasSigner(address) {
            if (address == null) {
                address = 0;
            }
            const accounts = await this.send("eth_accounts", []);
            if (typeof (address) === "number") {
                return (accounts.length > address);
            }
            address = address.toLowerCase();
            return accounts.filter((a) => (a.toLowerCase() === address)).length !== 0;
        }
        async getSigner(address) {
            if (address == null) {
                address = 0;
            }
            if (!(await this.hasSigner(address))) {
                try {
                    //const resp = 
                    await this.#request("eth_requestAccounts", []);
                    //console.log("RESP", resp);
                }
                catch (error) {
                    const payload = error.payload;
                    throw this.getRpcError(payload, { id: payload.id, error });
                }
            }
            return await super.getSigner(address);
        }
    }

    const IpcSocketProvider = undefined;

    /**
     *  The **BaseWallet** is a stream-lined implementation of a
     *  [[Signer]] that operates with a private key.
     *
     *  It is preferred to use the [[Wallet]] class, as it offers
     *  additional functionality and simplifies loading a variety
     *  of JSON formats, Mnemonic Phrases, etc.
     *
     *  This class may be of use for those attempting to implement
     *  a minimal Signer.
     */
    class BaseWallet extends AbstractSigner {
        /**
         *  The wallet address.
         */
        address;
        #signingKey;
        /**
         *  Creates a new BaseWallet for %%privateKey%%, optionally
         *  connected to %%provider%%.
         *
         *  If %%provider%% is not specified, only offline methods can
         *  be used.
         */
        constructor(privateKey, provider) {
            super(provider);
            assertArgument(privateKey && typeof (privateKey.sign) === "function", "invalid private key", "privateKey", "[ REDACTED ]");
            this.#signingKey = privateKey;
            const address = computeAddress(this.signingKey.publicKey);
            defineProperties(this, { address });
        }
        // Store private values behind getters to reduce visibility
        // in console.log
        /**
         *  The [[SigningKey]] used for signing payloads.
         */
        get signingKey() { return this.#signingKey; }
        /**
         *  The private key for this wallet.
         */
        get privateKey() { return this.signingKey.privateKey; }
        async getAddress() { return this.address; }
        connect(provider) {
            return new BaseWallet(this.#signingKey, provider);
        }
        async signTransaction(tx) {
            // Replace any Addressable or ENS name with an address
            const { to, from } = await resolveProperties({
                to: (tx.to ? resolveAddress(tx.to, this.provider) : undefined),
                from: (tx.from ? resolveAddress(tx.from, this.provider) : undefined)
            });
            if (to != null) {
                tx.to = to;
            }
            if (from != null) {
                tx.from = from;
            }
            if (tx.from != null) {
                assertArgument(getAddress((tx.from)) === this.address, "transaction from address mismatch", "tx.from", tx.from);
                delete tx.from;
            }
            // Build the transaction
            const btx = Transaction.from(tx);
            btx.signature = this.signingKey.sign(btx.unsignedHash);
            return btx.serialized;
        }
        async signMessage(message) {
            return this.signMessageSync(message);
        }
        // @TODO: Add a secialized signTx and signTyped sync that enforces
        // all parameters are known?
        /**
         *  Returns the signature for %%message%% signed with this wallet.
         */
        signMessageSync(message) {
            return this.signingKey.sign(hashMessage(message)).serialized;
        }
        async signTypedData(domain, types, value) {
            // Populate any ENS names
            const populated = await TypedDataEncoder.resolveNames(domain, types, value, async (name) => {
                // @TODO: this should use resolveName; addresses don't
                //        need a provider
                assert(this.provider != null, "cannot resolve ENS names without a provider", "UNSUPPORTED_OPERATION", {
                    operation: "resolveName",
                    info: { name }
                });
                const address = await this.provider.resolveName(name);
                assert(address != null, "unconfigured ENS name", "UNCONFIGURED_NAME", {
                    value: name
                });
                return address;
            });
            return this.signingKey.sign(TypedDataEncoder.hash(populated.domain, types, populated.value)).serialized;
        }
    }

    const subsChrs = " !#$%&'()*+,-./<=>?@[]^_`{|}~";
    const Word = /^[a-z]*$/i;
    function unfold(words, sep) {
        let initial = 97;
        return words.reduce((accum, word) => {
            if (word === sep) {
                initial++;
            }
            else if (word.match(Word)) {
                accum.push(String.fromCharCode(initial) + word);
            }
            else {
                initial = 97;
                accum.push(word);
            }
            return accum;
        }, []);
    }
    /**
     *  @_ignore
     */
    function decode(data, subs) {
        // Replace all the substitutions with their expanded form
        for (let i = subsChrs.length - 1; i >= 0; i--) {
            data = data.split(subsChrs[i]).join(subs.substring(2 * i, 2 * i + 2));
        }
        // Get all tle clumps; each suffix, first-increment and second-increment
        const clumps = [];
        const leftover = data.replace(/(:|([0-9])|([A-Z][a-z]*))/g, (all, item, semi, word) => {
            if (semi) {
                for (let i = parseInt(semi); i >= 0; i--) {
                    clumps.push(";");
                }
            }
            else {
                clumps.push(item.toLowerCase());
            }
            return "";
        });
        /* c8 ignore start */
        if (leftover) {
            throw new Error(`leftovers: ${JSON.stringify(leftover)}`);
        }
        /* c8 ignore stop */
        return unfold(unfold(clumps, ";"), ":");
    }
    /**
     *  @_ignore
     */
    function decodeOwl(data) {
        assertArgument(data[0] === "0", "unsupported auwl data", "data", data);
        return decode(data.substring(1 + 2 * subsChrs.length), data.substring(1, 1 + 2 * subsChrs.length));
    }

    /**
     *  A Wordlist represents a collection of language-specific
     *  words used to encode and devoce [[link-bip-39]] encoded data
     *  by mapping words to 11-bit values and vice versa.
     */
    class Wordlist {
        locale;
        /**
         *  Creates a new Wordlist instance.
         *
         *  Sub-classes MUST call this if they provide their own constructor,
         *  passing in the locale string of the language.
         *
         *  Generally there is no need to create instances of a Wordlist,
         *  since each language-specific Wordlist creates an instance and
         *  there is no state kept internally, so they are safe to share.
         */
        constructor(locale) {
            defineProperties(this, { locale });
        }
        /**
         *  Sub-classes may override this to provide a language-specific
         *  method for spliting %%phrase%% into individual words.
         *
         *  By default, %%phrase%% is split using any sequences of
         *  white-space as defined by regular expressions (i.e. ``/\s+/``).
         */
        split(phrase) {
            return phrase.toLowerCase().split(/\s+/g);
        }
        /**
         *  Sub-classes may override this to provider a language-specific
         *  method for joining %%words%% into a phrase.
         *
         *  By default, %%words%% are joined by a single space.
         */
        join(words) {
            return words.join(" ");
        }
    }

    // Use the encode-latin.js script to create the necessary
    // data files to be consumed by this class
    /**
     *  An OWL format Wordlist is an encoding method that exploits
     *  the general locality of alphabetically sorted words to
     *  achieve a simple but effective means of compression.
     *
     *  This class is generally not useful to most developers as
     *  it is used mainly internally to keep Wordlists for languages
     *  based on ASCII-7 small.
     *
     *  If necessary, there are tools within the ``generation/`` folder
     *  to create the necessary data.
     */
    class WordlistOwl extends Wordlist {
        #data;
        #checksum;
        /**
         *  Creates a new Wordlist for %%locale%% using the OWL %%data%%
         *  and validated against the %%checksum%%.
         */
        constructor(locale, data, checksum) {
            super(locale);
            this.#data = data;
            this.#checksum = checksum;
            this.#words = null;
        }
        /**
         *  The OWL-encoded data.
         */
        get _data() { return this.#data; }
        /**
         *  Decode all the words for the wordlist.
         */
        _decodeWords() {
            return decodeOwl(this.#data);
        }
        #words;
        #loadWords() {
            if (this.#words == null) {
                const words = this._decodeWords();
                // Verify the computed list matches the official list
                const checksum = id(words.join("\n") + "\n");
                /* c8 ignore start */
                if (checksum !== this.#checksum) {
                    throw new Error(`BIP39 Wordlist for ${this.locale} FAILED`);
                }
                /* c8 ignore stop */
                this.#words = words;
            }
            return this.#words;
        }
        getWord(index) {
            const words = this.#loadWords();
            assertArgument(index >= 0 && index < words.length, `invalid word index: ${index}`, "index", index);
            return words[index];
        }
        getWordIndex(word) {
            return this.#loadWords().indexOf(word);
        }
    }

    const words = "0erleonalorenseinceregesticitStanvetearctssi#ch2Athck&tneLl0And#Il.yLeOutO=S|S%b/ra@SurdU'0Ce[Cid|CountCu'Hie=IdOu,-Qui*Ro[TT]T%T*[Tu$0AptDD-tD*[Ju,M.UltV<)Vi)0Rob-0FairF%dRaid0A(EEntRee0Ead0MRRp%tS!_rmBumCoholErtI&LLeyLowMo,O}PhaReadySoT Ways0A>urAz(gOngOuntU'd0Aly,Ch%Ci|G G!GryIm$K!Noun)Nu$O` Sw T&naTiqueXietyY1ArtOlogyPe?P!Pro=Ril1ChCt-EaEnaGueMMedM%MyOundR<+Re,Ri=RowTTefa@Ti,Tw%k0KPe@SaultSetSi,SumeThma0H!>OmTa{T&dT.udeTra@0Ct]D.Gu,NtTh%ToTumn0Era+OcadoOid0AkeA*AyEsomeFulKw?d0Is:ByChel%C#D+GL<)Lc#y~MbooN<aNn RRelyRga(R*lSeS-SketTt!3A^AnAutyCau'ComeEfF%eG(Ha=H(dLie=LowLtN^Nef./TrayTt Twe&Y#d3Cyc!DKeNdOlogyRdR`Tt _{AdeAmeAnketA,EakE[IndOodO[omOu'UeUrUsh_rdAtDyIlMbNeNusOkO,Rd R(gRrowSsTtomUn)XY_{etA(AndA[A=EadEezeI{Id+IefIghtIngIskOccoliOk&OnzeOomO` OwnUsh2Bb!DdyD+tFf$oIldLbLkL!tNd!Nk Rd&Rg R,SS(e[SyTt Y Zz:Bba+B(B!CtusGeKe~LmM aMpNN$N)lNdyNn#NoeNvasNy#Pab!P.$Pta(RRb#RdRgoRpetRryRtSeShS(o/!Su$TT$ogT^Teg%yTt!UghtU'Ut]Ve3Il(gL yM|NsusNturyRe$Rta(_irAlkAmp]An+AosApt Ar+A'AtEapE{Ee'EfErryE,I{&IefIldIm}yOi)Oo'R#-U{!UnkUrn0G?Nnam#Rc!Tiz&TyVil_imApArifyAwAyE<ErkEv I{I|IffImbIn-IpO{OgO'O`OudOwnUbUmpU, Ut^_^A,C#utDeFfeeIlInL!@L%LumnMb(eMeMf%tM-Mm#Mp<yNc tNdu@NfirmNg*[N}@Nsid NtrolNv()OkOlPp PyR$ReRnR*@/Tt#U^UntryUp!Ur'Us(V Yo>_{Ad!AftAmA}AshAt AwlAzyEamEd.EekEwI{etImeIspIt-OpO[Ou^OwdUci$UelUi'Umb!Un^UshYY,$2BeLtu*PPbo?dRiousRr|Rta(R=Sh]/omTe3C!:DMa+MpN)Ng R(gShUght WnY3AlBa>BrisCadeCemb CideCl(eC%a>C*a'ErF&'F(eFyG*eLayLiv M<dMi'Ni$Nti,NyP?tP&dPos.P`PutyRi=ScribeS tSignSkSpair/royTailTe@VelopVi)Vo>3AgramAlAm#dAryCeE'lEtFf G.$Gn.yLemmaNn NosaurRe@RtSag*eScov Sea'ShSmi[S%d Splay/<)V tVideV%)Zzy5Ct%Cum|G~Lph(Ma(Na>NkeyN%OrSeUb!Ve_ftAg#AmaA,-AwEamE[IftIllInkIpI=OpUmY2CkMbNeR(g/T^Ty1Arf1Nam-:G G!RlyRnR`Sily/Sy1HoOlogyOnomy0GeItUca>1F%t0G1GhtTh 2BowD E@r-Eg<tEm|Eph<tEvat%I>Se0B?kBodyBra)Er+Ot]PloyPow Pty0Ab!A@DD![D%'EmyErgyF%)Ga+G(eH<)JoyLi,OughR-hRollSu*T Ti*TryVelope1Isode0U$Uip0AA'OdeOs]R%Upt0CapeSayS&)Ta>0Ern$H-s1Id&)IlOkeOl=1A@Amp!Ce[Ch<+C.eCludeCu'Ecu>Erci'Hau,Hib.I!I,ItOt-P<dPe@Pi*Pla(Po'P*[T&dTra0EEbrow:Br-CeCultyDeIntI`~L'MeMilyMousNNcyNtasyRmSh]TT$Th TigueUltV%.e3Atu*Bru?yD $EEdElMa!N)/iv$T^V W3B Ct]EldGu*LeLmLt N$NdNeNg NishReRmR,Sc$ShTT}[X_gAmeAshAtAv%EeIghtIpOatO{O%Ow UidUshY_mCusGIlLd~owOdOtR)Re,R+tRkRtu}RumRw?dSsil/ UndX_gi!AmeEqu|EshI&dIn+OgOntO,OwnOz&U.2ElNNnyRna)RyTu*:D+tInLaxy~ yMePRa+Rba+Rd&Rl-Rm|SSpTeTh U+Ze3N $NiusN*Nt!Nu(e/u*2O,0AntFtGg!Ng RaffeRlVe_dAn)A*A[IdeImp'ObeOomOryO=OwUe_tDde[LdOdO'RillaSpelSsipV nWn_bA)A(AntApeA[Av.yEatE&IdIefItOc yOupOwUnt_rdE[IdeIltIt?N3M:B.IrLfMm M, NdPpyRb%RdRshR=,TVeWkZ?d3AdAl`ArtAvyD+hogIght~oLmetLpNRo3Dd&Gh~NtPRe/%y5BbyCkeyLdLeLiday~owMeNeyOdPeRnRr%R'Sp.$/TelUrV 5BGeM<Mb!M%Nd*dNgryNtRd!RryRtSb<d3Brid:1EOn0EaEntifyLe2N%e4LLeg$L}[0A+Ita>M&'Mu}Pa@Po'Pro=Pul'0ChCludeComeC*a'DexD-a>Do%Du,ryF<tFl-tF%mHa!H .Iti$Je@JuryMa>N Noc|PutQuiryS<eSe@SideSpi*/$lTa@T e,ToVe,V.eVol=3On0L<dOla>Sue0Em1Ory:CketGu?RZz3AlousAns~yWel9BInKeUr}yY5D+I)MpNg!Ni%Nk/:Ng?oo3EnEpT^upY3CkDD}yNdNgdomSsTT^&TeTt&Wi4EeIfeO{Ow:BBelB%Dd DyKeMpNgua+PtopR+T T(UghUndryVaWWnWsu.Y Zy3Ad AfArnA=Ctu*FtGG$G&dIsu*M#NdNg`NsOp?dSs#Tt Vel3ArB tyBr?yC&'FeFtGhtKeMbM.NkOnQuid/Tt!VeZ?d5AdAnB, C$CkG-NelyNgOpTt yUdUn+VeY$5CkyGga+Mb N?N^Xury3R-s:Ch(eDG-G}tIdIlInJ%KeMm$NNa+Nda>NgoNs]Nu$P!Rb!R^Rg(R(eRketRria+SkSs/ T^T i$ThTrixTt XimumZe3AdowAnAsu*AtCh<-D$DiaLodyLtMb M%yNt]NuRcyR+R.RryShSsa+T$Thod3Dd!DnightLk~]M-NdNimumN%Nu>Rac!Rr%S ySs/akeXXedXtu*5Bi!DelDifyMM|N.%NkeyN, N`OnR$ReRn(gSqu.oTh T]T%Unta(U'VeVie5ChFf(LeLtiplySc!SeumShroomS-/Tu$3Self/ yTh:I=MePk(Rrow/yT]Tu*3ArCkEdGati=G!@I` PhewR=/TTw%kUtr$V WsXt3CeGht5B!I'M(eeOd!Rm$R`SeTab!TeTh(gTi)VelW5C!?Mb R'T:K0EyJe@Li+Scu*S =Ta(Vious0CurE<Tob 0Or1FF Fi)T&2L1Ay0DI=Ymp-0It0CeEI#L(eLy1EnEraIn]Po'T]1An+B.Ch?dD D(?yG<I|Ig($Ph<0Tr-h0H 0Tdo%T TputTside0AlEnEr0NN 0Yg&0/ 0O}:CtDd!GeIrLa)LmNdaNelN-N` P RadeR|RkRrotRtySsT^ThTi|TrolTt nU'VeYm|3A)AnutArAs<tL-<NN$tyNcilOp!Pp Rfe@Rm.Rs#T2O}OtoRa'Ys-$0AnoCn-Ctu*E)GGe#~LotNkO} Pe/olT^Zza_)A}tA,-A>AyEa'Ed+U{UgUn+2EmEtIntL?LeLi)NdNyOlPul?Rt]S.]Ssib!/TatoTt yV tyWd W _@i)Ai'Ed-tEf Epa*Es|EttyEv|I)IdeIm?yIntI%.yIs#Iva>IzeOb!mO)[Odu)Of.OgramOje@Omo>OofOp tyOsp O>@OudOvide2Bl-Dd(g~LpL'Mpk(N^PilPpyR^a'R.yRpo'R'ShTZz!3Ramid:99Al.yAntumArt E,]I{ItIzO>:Bb.Cco#CeCkD?DioIlInI'~yMpN^NdomN+PidReTeTh V&WZ%3AdyAlAs#BelBuildC$lCei=CipeC%dCyc!Du)F!@F%mFu'G]G*tGul?Je@LaxLea'LiefLyMa(Memb M(dMo=Nd NewNtOp&PairPeatPla)P%tQui*ScueSemb!Si,Sour)Sp#'SultTi*T*atTurnUn]Ve$ViewW?d2Y`m0BBb#CeChDeD+F!GhtGidNgOtPp!SkTu$V$V 5AdA,BotBu,CketM<)OfOkieOmSeTa>UghUndU>Y$5Bb DeGLeNNwayR$:DDd!D}[FeIlLadLm#L#LtLu>MeMp!NdTisfyToshiU)Usa+VeY1A!AnA*Att E}HemeHoolI&)I[%sOrp]OutRapRe&RiptRub1AAr^As#AtC#dC*tCt]Cur.yEdEkGm|Le@~M(?Ni%N'Nt&)RiesRvi)Ss]Tt!TupV&_dowAftAllowA*EdEllEriffIeldIftI}IpIv O{OeOotOpOrtOuld O=RimpRugUff!Y0Bl(gCkDeE+GhtGnL|Lk~yLv Mil?Mp!N)NgR&/ Tua>XZe1A>Et^IIllInIrtUll0AbAmEepEnd I)IdeIghtImOg<OtOwUsh0AllArtI!OkeOo`0A{AkeApIffOw0ApCc Ci$CkDaFtL?Ldi LidLut]L=Me#eNgOnRryRtUlUndUpUr)U`0A)A*Ati$AwnEakEci$EedEllEndH eI)Id IkeInIr.L.OilOns%O#OrtOtRayReadR(gY0Ua*UeezeUir*l_b!AdiumAffA+AirsAmpAndArtA>AyEakEelEmEpE*oI{IllIngO{Oma^O}OolOryO=Ra>gyReetRikeR#gRugg!Ud|UffUmb!Y!0Bje@Bm.BwayC)[ChDd&Ff G?G+,ItMm NNnyN'tP PplyP*meReRfa)R+Rpri'RroundR=ySpe@/a(1AllowAmpApArmE?EetIftImIngIt^Ord1MbolMptomRup/em:B!Ck!GIlL|LkNkPeR+tSk/eTtooXi3A^Am~NN<tNnisNtRm/Xt_nkAtEmeEnE%yE*EyIngIsOughtReeRi=RowUmbUnd 0CketDeG LtMb MeNyPRedSsueT!5A,BaccoDayDdl EGe` I!tK&MatoM%rowNeNgueNightOlO`PP-Pp!R^RnadoRtoi'SsT$Uri,W?dW WnY_{AdeAff-Ag-A(Ansf ApAshA=lAyEatEeEndI$IbeI{Igg ImIpOphyOub!U{UeUlyUmpetU,U`Y2BeIt]Mb!NaN}lRkeyRnRt!1El=EntyI)InI,O1PeP-$:5Ly5B*lla0Ab!Awa*C!Cov D DoFairFoldHappyIf%mIqueItIv 'KnownLo{TilUsu$Veil1Da>GradeHoldOnP Set1B<Ge0A+EEdEfulE![U$0Il.y:C<tCuumGueLidL!yL=NNishP%Rious/Ult3H-!L=tNd%Ntu*NueRbRifyRs]RyS'lT <3Ab!Br<tCiousCt%yDeoEw~a+Nta+Ol(Rtu$RusSaS.Su$T$Vid5C$I)IdLc<oLumeTeYa+:GeG#ItLk~LnutNtRfa*RmRri%ShSp/eT VeY3Al`Ap#ArA'lA` BDd(gEk&dIrdLcome/T_!AtEatEelEnE*IpIsp 0DeD`FeLd~NNdowNeNgNkNn Nt ReSdomSeShT}[5LfM<Nd OdOlRdRkRldRryR`_pE{E,!I,I>Ong::Rd3Ar~ow9UUngU`:3BraRo9NeO";
    const checksum = "0x3c8acc1e7b08d8e76f9fda015ef48dc8c710a73cb7e0f77b2c18a9b5a7adde60";
    let wordlist = null;
    /**
     *  The [[link-bip39-en]] for [mnemonic phrases](link-bip-39).
     *
     *  @_docloc: api/wordlists
     */
    class LangEn extends WordlistOwl {
        /**
         *  Creates a new instance of the English language Wordlist.
         *
         *  This should be unnecessary most of the time as the exported
         *  [[langEn]] should suffice.
         *
         *  @_ignore:
         */
        constructor() { super("en", words, checksum); }
        /**
         *  Returns a singleton instance of a ``LangEn``, creating it
         *  if this is the first time being called.
         */
        static wordlist() {
            if (wordlist == null) {
                wordlist = new LangEn();
            }
            return wordlist;
        }
    }

    // Returns a byte with the MSB bits set
    function getUpperMask(bits) {
        return ((1 << bits) - 1) << (8 - bits) & 0xff;
    }
    // Returns a byte with the LSB bits set
    function getLowerMask(bits) {
        return ((1 << bits) - 1) & 0xff;
    }
    function mnemonicToEntropy(mnemonic, wordlist) {
        assertNormalize("NFKD");
        if (wordlist == null) {
            wordlist = LangEn.wordlist();
        }
        const words = wordlist.split(mnemonic);
        assertArgument((words.length % 3) === 0 && words.length >= 12 && words.length <= 24, "invalid mnemonic length", "mnemonic", "[ REDACTED ]");
        const entropy = new Uint8Array(Math.ceil(11 * words.length / 8));
        let offset = 0;
        for (let i = 0; i < words.length; i++) {
            let index = wordlist.getWordIndex(words[i].normalize("NFKD"));
            assertArgument(index >= 0, `invalid mnemonic word at index ${i}`, "mnemonic", "[ REDACTED ]");
            for (let bit = 0; bit < 11; bit++) {
                if (index & (1 << (10 - bit))) {
                    entropy[offset >> 3] |= (1 << (7 - (offset % 8)));
                }
                offset++;
            }
        }
        const entropyBits = 32 * words.length / 3;
        const checksumBits = words.length / 3;
        const checksumMask = getUpperMask(checksumBits);
        const checksum = getBytes(sha256(entropy.slice(0, entropyBits / 8)))[0] & checksumMask;
        assertArgument(checksum === (entropy[entropy.length - 1] & checksumMask), "invalid mnemonic checksum", "mnemonic", "[ REDACTED ]");
        return hexlify(entropy.slice(0, entropyBits / 8));
    }
    function entropyToMnemonic(entropy, wordlist) {
        assertArgument((entropy.length % 4) === 0 && entropy.length >= 16 && entropy.length <= 32, "invalid entropy size", "entropy", "[ REDACTED ]");
        if (wordlist == null) {
            wordlist = LangEn.wordlist();
        }
        const indices = [0];
        let remainingBits = 11;
        for (let i = 0; i < entropy.length; i++) {
            // Consume the whole byte (with still more to go)
            if (remainingBits > 8) {
                indices[indices.length - 1] <<= 8;
                indices[indices.length - 1] |= entropy[i];
                remainingBits -= 8;
                // This byte will complete an 11-bit index
            }
            else {
                indices[indices.length - 1] <<= remainingBits;
                indices[indices.length - 1] |= entropy[i] >> (8 - remainingBits);
                // Start the next word
                indices.push(entropy[i] & getLowerMask(8 - remainingBits));
                remainingBits += 3;
            }
        }
        // Compute the checksum bits
        const checksumBits = entropy.length / 4;
        const checksum = parseInt(sha256(entropy).substring(2, 4), 16) & getUpperMask(checksumBits);
        // Shift the checksum into the word indices
        indices[indices.length - 1] <<= checksumBits;
        indices[indices.length - 1] |= (checksum >> (8 - checksumBits));
        return wordlist.join(indices.map((index) => wordlist.getWord(index)));
    }
    const _guard$1 = {};
    /**
     *  A **Mnemonic** wraps all properties required to compute [[link-bip-39]]
     *  seeds and convert between phrases and entropy.
     */
    class Mnemonic {
        /**
         *  The mnemonic phrase of 12, 15, 18, 21 or 24 words.
         *
         *  Use the [[wordlist]] ``split`` method to get the individual words.
         */
        phrase;
        /**
         *  The password used for this mnemonic. If no password is used this
         *  is the empty string (i.e. ``""``) as per the specification.
         */
        password;
        /**
         *  The wordlist for this mnemonic.
         */
        wordlist;
        /**
         *  The underlying entropy which the mnemonic encodes.
         */
        entropy;
        /**
         *  @private
         */
        constructor(guard, entropy, phrase, password, wordlist) {
            if (password == null) {
                password = "";
            }
            if (wordlist == null) {
                wordlist = LangEn.wordlist();
            }
            assertPrivate(guard, _guard$1, "Mnemonic");
            defineProperties(this, { phrase, password, wordlist, entropy });
        }
        /**
         *  Returns the seed for the mnemonic.
         */
        computeSeed() {
            const salt = toUtf8Bytes("mnemonic" + this.password, "NFKD");
            return pbkdf2(toUtf8Bytes(this.phrase, "NFKD"), salt, 2048, 64, "sha512");
        }
        /**
         *  Creates a new Mnemonic for the %%phrase%%.
         *
         *  The default %%password%% is the empty string and the default
         *  wordlist is the [English wordlists](LangEn).
         */
        static fromPhrase(phrase, password, wordlist) {
            // Normalize the case and space; throws if invalid
            const entropy = mnemonicToEntropy(phrase, wordlist);
            phrase = entropyToMnemonic(getBytes(entropy), wordlist);
            return new Mnemonic(_guard$1, entropy, phrase, password, wordlist);
        }
        /**
         *  Create a new **Mnemonic** from the %%entropy%%.
         *
         *  The default %%password%% is the empty string and the default
         *  wordlist is the [English wordlists](LangEn).
         */
        static fromEntropy(_entropy, password, wordlist) {
            const entropy = getBytes(_entropy, "entropy");
            const phrase = entropyToMnemonic(entropy, wordlist);
            return new Mnemonic(_guard$1, hexlify(entropy), phrase, password, wordlist);
        }
        /**
         *  Returns the phrase for %%mnemonic%%.
         */
        static entropyToPhrase(_entropy, wordlist) {
            const entropy = getBytes(_entropy, "entropy");
            return entropyToMnemonic(entropy, wordlist);
        }
        /**
         *  Returns the entropy for %%phrase%%.
         */
        static phraseToEntropy(phrase, wordlist) {
            return mnemonicToEntropy(phrase, wordlist);
        }
        /**
         *  Returns true if %%phrase%% is a valid [[link-bip-39]] phrase.
         *
         *  This checks all the provided words belong to the %%wordlist%%,
         *  that the length is valid and the checksum is correct.
         */
        static isValidMnemonic(phrase, wordlist) {
            try {
                mnemonicToEntropy(phrase, wordlist);
                return true;
            }
            catch (error) { }
            return false;
        }
    }

    /*! MIT License. Copyright 2015-2022 Richard Moore <me@ricmoo.com>. See LICENSE.txt. */
    var __classPrivateFieldGet$2 = (__$G && __$G.__classPrivateFieldGet) || function (receiver, state, kind, f) {
        if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
        return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    };
    var __classPrivateFieldSet$2 = (__$G && __$G.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
        if (kind === "m") throw new TypeError("Private method is not writable");
        if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
        return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
    };
    var _AES_key, _AES_Kd, _AES_Ke;
    // Number of rounds by keysize
    const numberOfRounds = { 16: 10, 24: 12, 32: 14 };
    // Round constant words
    const rcon = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36, 0x6c, 0xd8, 0xab, 0x4d, 0x9a, 0x2f, 0x5e, 0xbc, 0x63, 0xc6, 0x97, 0x35, 0x6a, 0xd4, 0xb3, 0x7d, 0xfa, 0xef, 0xc5, 0x91];
    // S-box and Inverse S-box (S is for Substitution)
    const S = [0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76, 0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0, 0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15, 0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75, 0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84, 0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf, 0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8, 0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2, 0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73, 0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb, 0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79, 0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08, 0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a, 0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e, 0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf, 0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16];
    const Si = [0x52, 0x09, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38, 0xbf, 0x40, 0xa3, 0x9e, 0x81, 0xf3, 0xd7, 0xfb, 0x7c, 0xe3, 0x39, 0x82, 0x9b, 0x2f, 0xff, 0x87, 0x34, 0x8e, 0x43, 0x44, 0xc4, 0xde, 0xe9, 0xcb, 0x54, 0x7b, 0x94, 0x32, 0xa6, 0xc2, 0x23, 0x3d, 0xee, 0x4c, 0x95, 0x0b, 0x42, 0xfa, 0xc3, 0x4e, 0x08, 0x2e, 0xa1, 0x66, 0x28, 0xd9, 0x24, 0xb2, 0x76, 0x5b, 0xa2, 0x49, 0x6d, 0x8b, 0xd1, 0x25, 0x72, 0xf8, 0xf6, 0x64, 0x86, 0x68, 0x98, 0x16, 0xd4, 0xa4, 0x5c, 0xcc, 0x5d, 0x65, 0xb6, 0x92, 0x6c, 0x70, 0x48, 0x50, 0xfd, 0xed, 0xb9, 0xda, 0x5e, 0x15, 0x46, 0x57, 0xa7, 0x8d, 0x9d, 0x84, 0x90, 0xd8, 0xab, 0x00, 0x8c, 0xbc, 0xd3, 0x0a, 0xf7, 0xe4, 0x58, 0x05, 0xb8, 0xb3, 0x45, 0x06, 0xd0, 0x2c, 0x1e, 0x8f, 0xca, 0x3f, 0x0f, 0x02, 0xc1, 0xaf, 0xbd, 0x03, 0x01, 0x13, 0x8a, 0x6b, 0x3a, 0x91, 0x11, 0x41, 0x4f, 0x67, 0xdc, 0xea, 0x97, 0xf2, 0xcf, 0xce, 0xf0, 0xb4, 0xe6, 0x73, 0x96, 0xac, 0x74, 0x22, 0xe7, 0xad, 0x35, 0x85, 0xe2, 0xf9, 0x37, 0xe8, 0x1c, 0x75, 0xdf, 0x6e, 0x47, 0xf1, 0x1a, 0x71, 0x1d, 0x29, 0xc5, 0x89, 0x6f, 0xb7, 0x62, 0x0e, 0xaa, 0x18, 0xbe, 0x1b, 0xfc, 0x56, 0x3e, 0x4b, 0xc6, 0xd2, 0x79, 0x20, 0x9a, 0xdb, 0xc0, 0xfe, 0x78, 0xcd, 0x5a, 0xf4, 0x1f, 0xdd, 0xa8, 0x33, 0x88, 0x07, 0xc7, 0x31, 0xb1, 0x12, 0x10, 0x59, 0x27, 0x80, 0xec, 0x5f, 0x60, 0x51, 0x7f, 0xa9, 0x19, 0xb5, 0x4a, 0x0d, 0x2d, 0xe5, 0x7a, 0x9f, 0x93, 0xc9, 0x9c, 0xef, 0xa0, 0xe0, 0x3b, 0x4d, 0xae, 0x2a, 0xf5, 0xb0, 0xc8, 0xeb, 0xbb, 0x3c, 0x83, 0x53, 0x99, 0x61, 0x17, 0x2b, 0x04, 0x7e, 0xba, 0x77, 0xd6, 0x26, 0xe1, 0x69, 0x14, 0x63, 0x55, 0x21, 0x0c, 0x7d];
    // Transformations for encryption
    const T1 = [0xc66363a5, 0xf87c7c84, 0xee777799, 0xf67b7b8d, 0xfff2f20d, 0xd66b6bbd, 0xde6f6fb1, 0x91c5c554, 0x60303050, 0x02010103, 0xce6767a9, 0x562b2b7d, 0xe7fefe19, 0xb5d7d762, 0x4dababe6, 0xec76769a, 0x8fcaca45, 0x1f82829d, 0x89c9c940, 0xfa7d7d87, 0xeffafa15, 0xb25959eb, 0x8e4747c9, 0xfbf0f00b, 0x41adadec, 0xb3d4d467, 0x5fa2a2fd, 0x45afafea, 0x239c9cbf, 0x53a4a4f7, 0xe4727296, 0x9bc0c05b, 0x75b7b7c2, 0xe1fdfd1c, 0x3d9393ae, 0x4c26266a, 0x6c36365a, 0x7e3f3f41, 0xf5f7f702, 0x83cccc4f, 0x6834345c, 0x51a5a5f4, 0xd1e5e534, 0xf9f1f108, 0xe2717193, 0xabd8d873, 0x62313153, 0x2a15153f, 0x0804040c, 0x95c7c752, 0x46232365, 0x9dc3c35e, 0x30181828, 0x379696a1, 0x0a05050f, 0x2f9a9ab5, 0x0e070709, 0x24121236, 0x1b80809b, 0xdfe2e23d, 0xcdebeb26, 0x4e272769, 0x7fb2b2cd, 0xea75759f, 0x1209091b, 0x1d83839e, 0x582c2c74, 0x341a1a2e, 0x361b1b2d, 0xdc6e6eb2, 0xb45a5aee, 0x5ba0a0fb, 0xa45252f6, 0x763b3b4d, 0xb7d6d661, 0x7db3b3ce, 0x5229297b, 0xdde3e33e, 0x5e2f2f71, 0x13848497, 0xa65353f5, 0xb9d1d168, 0x00000000, 0xc1eded2c, 0x40202060, 0xe3fcfc1f, 0x79b1b1c8, 0xb65b5bed, 0xd46a6abe, 0x8dcbcb46, 0x67bebed9, 0x7239394b, 0x944a4ade, 0x984c4cd4, 0xb05858e8, 0x85cfcf4a, 0xbbd0d06b, 0xc5efef2a, 0x4faaaae5, 0xedfbfb16, 0x864343c5, 0x9a4d4dd7, 0x66333355, 0x11858594, 0x8a4545cf, 0xe9f9f910, 0x04020206, 0xfe7f7f81, 0xa05050f0, 0x783c3c44, 0x259f9fba, 0x4ba8a8e3, 0xa25151f3, 0x5da3a3fe, 0x804040c0, 0x058f8f8a, 0x3f9292ad, 0x219d9dbc, 0x70383848, 0xf1f5f504, 0x63bcbcdf, 0x77b6b6c1, 0xafdada75, 0x42212163, 0x20101030, 0xe5ffff1a, 0xfdf3f30e, 0xbfd2d26d, 0x81cdcd4c, 0x180c0c14, 0x26131335, 0xc3ecec2f, 0xbe5f5fe1, 0x359797a2, 0x884444cc, 0x2e171739, 0x93c4c457, 0x55a7a7f2, 0xfc7e7e82, 0x7a3d3d47, 0xc86464ac, 0xba5d5de7, 0x3219192b, 0xe6737395, 0xc06060a0, 0x19818198, 0x9e4f4fd1, 0xa3dcdc7f, 0x44222266, 0x542a2a7e, 0x3b9090ab, 0x0b888883, 0x8c4646ca, 0xc7eeee29, 0x6bb8b8d3, 0x2814143c, 0xa7dede79, 0xbc5e5ee2, 0x160b0b1d, 0xaddbdb76, 0xdbe0e03b, 0x64323256, 0x743a3a4e, 0x140a0a1e, 0x924949db, 0x0c06060a, 0x4824246c, 0xb85c5ce4, 0x9fc2c25d, 0xbdd3d36e, 0x43acacef, 0xc46262a6, 0x399191a8, 0x319595a4, 0xd3e4e437, 0xf279798b, 0xd5e7e732, 0x8bc8c843, 0x6e373759, 0xda6d6db7, 0x018d8d8c, 0xb1d5d564, 0x9c4e4ed2, 0x49a9a9e0, 0xd86c6cb4, 0xac5656fa, 0xf3f4f407, 0xcfeaea25, 0xca6565af, 0xf47a7a8e, 0x47aeaee9, 0x10080818, 0x6fbabad5, 0xf0787888, 0x4a25256f, 0x5c2e2e72, 0x381c1c24, 0x57a6a6f1, 0x73b4b4c7, 0x97c6c651, 0xcbe8e823, 0xa1dddd7c, 0xe874749c, 0x3e1f1f21, 0x964b4bdd, 0x61bdbddc, 0x0d8b8b86, 0x0f8a8a85, 0xe0707090, 0x7c3e3e42, 0x71b5b5c4, 0xcc6666aa, 0x904848d8, 0x06030305, 0xf7f6f601, 0x1c0e0e12, 0xc26161a3, 0x6a35355f, 0xae5757f9, 0x69b9b9d0, 0x17868691, 0x99c1c158, 0x3a1d1d27, 0x279e9eb9, 0xd9e1e138, 0xebf8f813, 0x2b9898b3, 0x22111133, 0xd26969bb, 0xa9d9d970, 0x078e8e89, 0x339494a7, 0x2d9b9bb6, 0x3c1e1e22, 0x15878792, 0xc9e9e920, 0x87cece49, 0xaa5555ff, 0x50282878, 0xa5dfdf7a, 0x038c8c8f, 0x59a1a1f8, 0x09898980, 0x1a0d0d17, 0x65bfbfda, 0xd7e6e631, 0x844242c6, 0xd06868b8, 0x824141c3, 0x299999b0, 0x5a2d2d77, 0x1e0f0f11, 0x7bb0b0cb, 0xa85454fc, 0x6dbbbbd6, 0x2c16163a];
    const T2 = [0xa5c66363, 0x84f87c7c, 0x99ee7777, 0x8df67b7b, 0x0dfff2f2, 0xbdd66b6b, 0xb1de6f6f, 0x5491c5c5, 0x50603030, 0x03020101, 0xa9ce6767, 0x7d562b2b, 0x19e7fefe, 0x62b5d7d7, 0xe64dabab, 0x9aec7676, 0x458fcaca, 0x9d1f8282, 0x4089c9c9, 0x87fa7d7d, 0x15effafa, 0xebb25959, 0xc98e4747, 0x0bfbf0f0, 0xec41adad, 0x67b3d4d4, 0xfd5fa2a2, 0xea45afaf, 0xbf239c9c, 0xf753a4a4, 0x96e47272, 0x5b9bc0c0, 0xc275b7b7, 0x1ce1fdfd, 0xae3d9393, 0x6a4c2626, 0x5a6c3636, 0x417e3f3f, 0x02f5f7f7, 0x4f83cccc, 0x5c683434, 0xf451a5a5, 0x34d1e5e5, 0x08f9f1f1, 0x93e27171, 0x73abd8d8, 0x53623131, 0x3f2a1515, 0x0c080404, 0x5295c7c7, 0x65462323, 0x5e9dc3c3, 0x28301818, 0xa1379696, 0x0f0a0505, 0xb52f9a9a, 0x090e0707, 0x36241212, 0x9b1b8080, 0x3ddfe2e2, 0x26cdebeb, 0x694e2727, 0xcd7fb2b2, 0x9fea7575, 0x1b120909, 0x9e1d8383, 0x74582c2c, 0x2e341a1a, 0x2d361b1b, 0xb2dc6e6e, 0xeeb45a5a, 0xfb5ba0a0, 0xf6a45252, 0x4d763b3b, 0x61b7d6d6, 0xce7db3b3, 0x7b522929, 0x3edde3e3, 0x715e2f2f, 0x97138484, 0xf5a65353, 0x68b9d1d1, 0x00000000, 0x2cc1eded, 0x60402020, 0x1fe3fcfc, 0xc879b1b1, 0xedb65b5b, 0xbed46a6a, 0x468dcbcb, 0xd967bebe, 0x4b723939, 0xde944a4a, 0xd4984c4c, 0xe8b05858, 0x4a85cfcf, 0x6bbbd0d0, 0x2ac5efef, 0xe54faaaa, 0x16edfbfb, 0xc5864343, 0xd79a4d4d, 0x55663333, 0x94118585, 0xcf8a4545, 0x10e9f9f9, 0x06040202, 0x81fe7f7f, 0xf0a05050, 0x44783c3c, 0xba259f9f, 0xe34ba8a8, 0xf3a25151, 0xfe5da3a3, 0xc0804040, 0x8a058f8f, 0xad3f9292, 0xbc219d9d, 0x48703838, 0x04f1f5f5, 0xdf63bcbc, 0xc177b6b6, 0x75afdada, 0x63422121, 0x30201010, 0x1ae5ffff, 0x0efdf3f3, 0x6dbfd2d2, 0x4c81cdcd, 0x14180c0c, 0x35261313, 0x2fc3ecec, 0xe1be5f5f, 0xa2359797, 0xcc884444, 0x392e1717, 0x5793c4c4, 0xf255a7a7, 0x82fc7e7e, 0x477a3d3d, 0xacc86464, 0xe7ba5d5d, 0x2b321919, 0x95e67373, 0xa0c06060, 0x98198181, 0xd19e4f4f, 0x7fa3dcdc, 0x66442222, 0x7e542a2a, 0xab3b9090, 0x830b8888, 0xca8c4646, 0x29c7eeee, 0xd36bb8b8, 0x3c281414, 0x79a7dede, 0xe2bc5e5e, 0x1d160b0b, 0x76addbdb, 0x3bdbe0e0, 0x56643232, 0x4e743a3a, 0x1e140a0a, 0xdb924949, 0x0a0c0606, 0x6c482424, 0xe4b85c5c, 0x5d9fc2c2, 0x6ebdd3d3, 0xef43acac, 0xa6c46262, 0xa8399191, 0xa4319595, 0x37d3e4e4, 0x8bf27979, 0x32d5e7e7, 0x438bc8c8, 0x596e3737, 0xb7da6d6d, 0x8c018d8d, 0x64b1d5d5, 0xd29c4e4e, 0xe049a9a9, 0xb4d86c6c, 0xfaac5656, 0x07f3f4f4, 0x25cfeaea, 0xafca6565, 0x8ef47a7a, 0xe947aeae, 0x18100808, 0xd56fbaba, 0x88f07878, 0x6f4a2525, 0x725c2e2e, 0x24381c1c, 0xf157a6a6, 0xc773b4b4, 0x5197c6c6, 0x23cbe8e8, 0x7ca1dddd, 0x9ce87474, 0x213e1f1f, 0xdd964b4b, 0xdc61bdbd, 0x860d8b8b, 0x850f8a8a, 0x90e07070, 0x427c3e3e, 0xc471b5b5, 0xaacc6666, 0xd8904848, 0x05060303, 0x01f7f6f6, 0x121c0e0e, 0xa3c26161, 0x5f6a3535, 0xf9ae5757, 0xd069b9b9, 0x91178686, 0x5899c1c1, 0x273a1d1d, 0xb9279e9e, 0x38d9e1e1, 0x13ebf8f8, 0xb32b9898, 0x33221111, 0xbbd26969, 0x70a9d9d9, 0x89078e8e, 0xa7339494, 0xb62d9b9b, 0x223c1e1e, 0x92158787, 0x20c9e9e9, 0x4987cece, 0xffaa5555, 0x78502828, 0x7aa5dfdf, 0x8f038c8c, 0xf859a1a1, 0x80098989, 0x171a0d0d, 0xda65bfbf, 0x31d7e6e6, 0xc6844242, 0xb8d06868, 0xc3824141, 0xb0299999, 0x775a2d2d, 0x111e0f0f, 0xcb7bb0b0, 0xfca85454, 0xd66dbbbb, 0x3a2c1616];
    const T3 = [0x63a5c663, 0x7c84f87c, 0x7799ee77, 0x7b8df67b, 0xf20dfff2, 0x6bbdd66b, 0x6fb1de6f, 0xc55491c5, 0x30506030, 0x01030201, 0x67a9ce67, 0x2b7d562b, 0xfe19e7fe, 0xd762b5d7, 0xabe64dab, 0x769aec76, 0xca458fca, 0x829d1f82, 0xc94089c9, 0x7d87fa7d, 0xfa15effa, 0x59ebb259, 0x47c98e47, 0xf00bfbf0, 0xadec41ad, 0xd467b3d4, 0xa2fd5fa2, 0xafea45af, 0x9cbf239c, 0xa4f753a4, 0x7296e472, 0xc05b9bc0, 0xb7c275b7, 0xfd1ce1fd, 0x93ae3d93, 0x266a4c26, 0x365a6c36, 0x3f417e3f, 0xf702f5f7, 0xcc4f83cc, 0x345c6834, 0xa5f451a5, 0xe534d1e5, 0xf108f9f1, 0x7193e271, 0xd873abd8, 0x31536231, 0x153f2a15, 0x040c0804, 0xc75295c7, 0x23654623, 0xc35e9dc3, 0x18283018, 0x96a13796, 0x050f0a05, 0x9ab52f9a, 0x07090e07, 0x12362412, 0x809b1b80, 0xe23ddfe2, 0xeb26cdeb, 0x27694e27, 0xb2cd7fb2, 0x759fea75, 0x091b1209, 0x839e1d83, 0x2c74582c, 0x1a2e341a, 0x1b2d361b, 0x6eb2dc6e, 0x5aeeb45a, 0xa0fb5ba0, 0x52f6a452, 0x3b4d763b, 0xd661b7d6, 0xb3ce7db3, 0x297b5229, 0xe33edde3, 0x2f715e2f, 0x84971384, 0x53f5a653, 0xd168b9d1, 0x00000000, 0xed2cc1ed, 0x20604020, 0xfc1fe3fc, 0xb1c879b1, 0x5bedb65b, 0x6abed46a, 0xcb468dcb, 0xbed967be, 0x394b7239, 0x4ade944a, 0x4cd4984c, 0x58e8b058, 0xcf4a85cf, 0xd06bbbd0, 0xef2ac5ef, 0xaae54faa, 0xfb16edfb, 0x43c58643, 0x4dd79a4d, 0x33556633, 0x85941185, 0x45cf8a45, 0xf910e9f9, 0x02060402, 0x7f81fe7f, 0x50f0a050, 0x3c44783c, 0x9fba259f, 0xa8e34ba8, 0x51f3a251, 0xa3fe5da3, 0x40c08040, 0x8f8a058f, 0x92ad3f92, 0x9dbc219d, 0x38487038, 0xf504f1f5, 0xbcdf63bc, 0xb6c177b6, 0xda75afda, 0x21634221, 0x10302010, 0xff1ae5ff, 0xf30efdf3, 0xd26dbfd2, 0xcd4c81cd, 0x0c14180c, 0x13352613, 0xec2fc3ec, 0x5fe1be5f, 0x97a23597, 0x44cc8844, 0x17392e17, 0xc45793c4, 0xa7f255a7, 0x7e82fc7e, 0x3d477a3d, 0x64acc864, 0x5de7ba5d, 0x192b3219, 0x7395e673, 0x60a0c060, 0x81981981, 0x4fd19e4f, 0xdc7fa3dc, 0x22664422, 0x2a7e542a, 0x90ab3b90, 0x88830b88, 0x46ca8c46, 0xee29c7ee, 0xb8d36bb8, 0x143c2814, 0xde79a7de, 0x5ee2bc5e, 0x0b1d160b, 0xdb76addb, 0xe03bdbe0, 0x32566432, 0x3a4e743a, 0x0a1e140a, 0x49db9249, 0x060a0c06, 0x246c4824, 0x5ce4b85c, 0xc25d9fc2, 0xd36ebdd3, 0xacef43ac, 0x62a6c462, 0x91a83991, 0x95a43195, 0xe437d3e4, 0x798bf279, 0xe732d5e7, 0xc8438bc8, 0x37596e37, 0x6db7da6d, 0x8d8c018d, 0xd564b1d5, 0x4ed29c4e, 0xa9e049a9, 0x6cb4d86c, 0x56faac56, 0xf407f3f4, 0xea25cfea, 0x65afca65, 0x7a8ef47a, 0xaee947ae, 0x08181008, 0xbad56fba, 0x7888f078, 0x256f4a25, 0x2e725c2e, 0x1c24381c, 0xa6f157a6, 0xb4c773b4, 0xc65197c6, 0xe823cbe8, 0xdd7ca1dd, 0x749ce874, 0x1f213e1f, 0x4bdd964b, 0xbddc61bd, 0x8b860d8b, 0x8a850f8a, 0x7090e070, 0x3e427c3e, 0xb5c471b5, 0x66aacc66, 0x48d89048, 0x03050603, 0xf601f7f6, 0x0e121c0e, 0x61a3c261, 0x355f6a35, 0x57f9ae57, 0xb9d069b9, 0x86911786, 0xc15899c1, 0x1d273a1d, 0x9eb9279e, 0xe138d9e1, 0xf813ebf8, 0x98b32b98, 0x11332211, 0x69bbd269, 0xd970a9d9, 0x8e89078e, 0x94a73394, 0x9bb62d9b, 0x1e223c1e, 0x87921587, 0xe920c9e9, 0xce4987ce, 0x55ffaa55, 0x28785028, 0xdf7aa5df, 0x8c8f038c, 0xa1f859a1, 0x89800989, 0x0d171a0d, 0xbfda65bf, 0xe631d7e6, 0x42c68442, 0x68b8d068, 0x41c38241, 0x99b02999, 0x2d775a2d, 0x0f111e0f, 0xb0cb7bb0, 0x54fca854, 0xbbd66dbb, 0x163a2c16];
    const T4 = [0x6363a5c6, 0x7c7c84f8, 0x777799ee, 0x7b7b8df6, 0xf2f20dff, 0x6b6bbdd6, 0x6f6fb1de, 0xc5c55491, 0x30305060, 0x01010302, 0x6767a9ce, 0x2b2b7d56, 0xfefe19e7, 0xd7d762b5, 0xababe64d, 0x76769aec, 0xcaca458f, 0x82829d1f, 0xc9c94089, 0x7d7d87fa, 0xfafa15ef, 0x5959ebb2, 0x4747c98e, 0xf0f00bfb, 0xadadec41, 0xd4d467b3, 0xa2a2fd5f, 0xafafea45, 0x9c9cbf23, 0xa4a4f753, 0x727296e4, 0xc0c05b9b, 0xb7b7c275, 0xfdfd1ce1, 0x9393ae3d, 0x26266a4c, 0x36365a6c, 0x3f3f417e, 0xf7f702f5, 0xcccc4f83, 0x34345c68, 0xa5a5f451, 0xe5e534d1, 0xf1f108f9, 0x717193e2, 0xd8d873ab, 0x31315362, 0x15153f2a, 0x04040c08, 0xc7c75295, 0x23236546, 0xc3c35e9d, 0x18182830, 0x9696a137, 0x05050f0a, 0x9a9ab52f, 0x0707090e, 0x12123624, 0x80809b1b, 0xe2e23ddf, 0xebeb26cd, 0x2727694e, 0xb2b2cd7f, 0x75759fea, 0x09091b12, 0x83839e1d, 0x2c2c7458, 0x1a1a2e34, 0x1b1b2d36, 0x6e6eb2dc, 0x5a5aeeb4, 0xa0a0fb5b, 0x5252f6a4, 0x3b3b4d76, 0xd6d661b7, 0xb3b3ce7d, 0x29297b52, 0xe3e33edd, 0x2f2f715e, 0x84849713, 0x5353f5a6, 0xd1d168b9, 0x00000000, 0xeded2cc1, 0x20206040, 0xfcfc1fe3, 0xb1b1c879, 0x5b5bedb6, 0x6a6abed4, 0xcbcb468d, 0xbebed967, 0x39394b72, 0x4a4ade94, 0x4c4cd498, 0x5858e8b0, 0xcfcf4a85, 0xd0d06bbb, 0xefef2ac5, 0xaaaae54f, 0xfbfb16ed, 0x4343c586, 0x4d4dd79a, 0x33335566, 0x85859411, 0x4545cf8a, 0xf9f910e9, 0x02020604, 0x7f7f81fe, 0x5050f0a0, 0x3c3c4478, 0x9f9fba25, 0xa8a8e34b, 0x5151f3a2, 0xa3a3fe5d, 0x4040c080, 0x8f8f8a05, 0x9292ad3f, 0x9d9dbc21, 0x38384870, 0xf5f504f1, 0xbcbcdf63, 0xb6b6c177, 0xdada75af, 0x21216342, 0x10103020, 0xffff1ae5, 0xf3f30efd, 0xd2d26dbf, 0xcdcd4c81, 0x0c0c1418, 0x13133526, 0xecec2fc3, 0x5f5fe1be, 0x9797a235, 0x4444cc88, 0x1717392e, 0xc4c45793, 0xa7a7f255, 0x7e7e82fc, 0x3d3d477a, 0x6464acc8, 0x5d5de7ba, 0x19192b32, 0x737395e6, 0x6060a0c0, 0x81819819, 0x4f4fd19e, 0xdcdc7fa3, 0x22226644, 0x2a2a7e54, 0x9090ab3b, 0x8888830b, 0x4646ca8c, 0xeeee29c7, 0xb8b8d36b, 0x14143c28, 0xdede79a7, 0x5e5ee2bc, 0x0b0b1d16, 0xdbdb76ad, 0xe0e03bdb, 0x32325664, 0x3a3a4e74, 0x0a0a1e14, 0x4949db92, 0x06060a0c, 0x24246c48, 0x5c5ce4b8, 0xc2c25d9f, 0xd3d36ebd, 0xacacef43, 0x6262a6c4, 0x9191a839, 0x9595a431, 0xe4e437d3, 0x79798bf2, 0xe7e732d5, 0xc8c8438b, 0x3737596e, 0x6d6db7da, 0x8d8d8c01, 0xd5d564b1, 0x4e4ed29c, 0xa9a9e049, 0x6c6cb4d8, 0x5656faac, 0xf4f407f3, 0xeaea25cf, 0x6565afca, 0x7a7a8ef4, 0xaeaee947, 0x08081810, 0xbabad56f, 0x787888f0, 0x25256f4a, 0x2e2e725c, 0x1c1c2438, 0xa6a6f157, 0xb4b4c773, 0xc6c65197, 0xe8e823cb, 0xdddd7ca1, 0x74749ce8, 0x1f1f213e, 0x4b4bdd96, 0xbdbddc61, 0x8b8b860d, 0x8a8a850f, 0x707090e0, 0x3e3e427c, 0xb5b5c471, 0x6666aacc, 0x4848d890, 0x03030506, 0xf6f601f7, 0x0e0e121c, 0x6161a3c2, 0x35355f6a, 0x5757f9ae, 0xb9b9d069, 0x86869117, 0xc1c15899, 0x1d1d273a, 0x9e9eb927, 0xe1e138d9, 0xf8f813eb, 0x9898b32b, 0x11113322, 0x6969bbd2, 0xd9d970a9, 0x8e8e8907, 0x9494a733, 0x9b9bb62d, 0x1e1e223c, 0x87879215, 0xe9e920c9, 0xcece4987, 0x5555ffaa, 0x28287850, 0xdfdf7aa5, 0x8c8c8f03, 0xa1a1f859, 0x89898009, 0x0d0d171a, 0xbfbfda65, 0xe6e631d7, 0x4242c684, 0x6868b8d0, 0x4141c382, 0x9999b029, 0x2d2d775a, 0x0f0f111e, 0xb0b0cb7b, 0x5454fca8, 0xbbbbd66d, 0x16163a2c];
    // Transformations for decryption
    const T5 = [0x51f4a750, 0x7e416553, 0x1a17a4c3, 0x3a275e96, 0x3bab6bcb, 0x1f9d45f1, 0xacfa58ab, 0x4be30393, 0x2030fa55, 0xad766df6, 0x88cc7691, 0xf5024c25, 0x4fe5d7fc, 0xc52acbd7, 0x26354480, 0xb562a38f, 0xdeb15a49, 0x25ba1b67, 0x45ea0e98, 0x5dfec0e1, 0xc32f7502, 0x814cf012, 0x8d4697a3, 0x6bd3f9c6, 0x038f5fe7, 0x15929c95, 0xbf6d7aeb, 0x955259da, 0xd4be832d, 0x587421d3, 0x49e06929, 0x8ec9c844, 0x75c2896a, 0xf48e7978, 0x99583e6b, 0x27b971dd, 0xbee14fb6, 0xf088ad17, 0xc920ac66, 0x7dce3ab4, 0x63df4a18, 0xe51a3182, 0x97513360, 0x62537f45, 0xb16477e0, 0xbb6bae84, 0xfe81a01c, 0xf9082b94, 0x70486858, 0x8f45fd19, 0x94de6c87, 0x527bf8b7, 0xab73d323, 0x724b02e2, 0xe31f8f57, 0x6655ab2a, 0xb2eb2807, 0x2fb5c203, 0x86c57b9a, 0xd33708a5, 0x302887f2, 0x23bfa5b2, 0x02036aba, 0xed16825c, 0x8acf1c2b, 0xa779b492, 0xf307f2f0, 0x4e69e2a1, 0x65daf4cd, 0x0605bed5, 0xd134621f, 0xc4a6fe8a, 0x342e539d, 0xa2f355a0, 0x058ae132, 0xa4f6eb75, 0x0b83ec39, 0x4060efaa, 0x5e719f06, 0xbd6e1051, 0x3e218af9, 0x96dd063d, 0xdd3e05ae, 0x4de6bd46, 0x91548db5, 0x71c45d05, 0x0406d46f, 0x605015ff, 0x1998fb24, 0xd6bde997, 0x894043cc, 0x67d99e77, 0xb0e842bd, 0x07898b88, 0xe7195b38, 0x79c8eedb, 0xa17c0a47, 0x7c420fe9, 0xf8841ec9, 0x00000000, 0x09808683, 0x322bed48, 0x1e1170ac, 0x6c5a724e, 0xfd0efffb, 0x0f853856, 0x3daed51e, 0x362d3927, 0x0a0fd964, 0x685ca621, 0x9b5b54d1, 0x24362e3a, 0x0c0a67b1, 0x9357e70f, 0xb4ee96d2, 0x1b9b919e, 0x80c0c54f, 0x61dc20a2, 0x5a774b69, 0x1c121a16, 0xe293ba0a, 0xc0a02ae5, 0x3c22e043, 0x121b171d, 0x0e090d0b, 0xf28bc7ad, 0x2db6a8b9, 0x141ea9c8, 0x57f11985, 0xaf75074c, 0xee99ddbb, 0xa37f60fd, 0xf701269f, 0x5c72f5bc, 0x44663bc5, 0x5bfb7e34, 0x8b432976, 0xcb23c6dc, 0xb6edfc68, 0xb8e4f163, 0xd731dcca, 0x42638510, 0x13972240, 0x84c61120, 0x854a247d, 0xd2bb3df8, 0xaef93211, 0xc729a16d, 0x1d9e2f4b, 0xdcb230f3, 0x0d8652ec, 0x77c1e3d0, 0x2bb3166c, 0xa970b999, 0x119448fa, 0x47e96422, 0xa8fc8cc4, 0xa0f03f1a, 0x567d2cd8, 0x223390ef, 0x87494ec7, 0xd938d1c1, 0x8ccaa2fe, 0x98d40b36, 0xa6f581cf, 0xa57ade28, 0xdab78e26, 0x3fadbfa4, 0x2c3a9de4, 0x5078920d, 0x6a5fcc9b, 0x547e4662, 0xf68d13c2, 0x90d8b8e8, 0x2e39f75e, 0x82c3aff5, 0x9f5d80be, 0x69d0937c, 0x6fd52da9, 0xcf2512b3, 0xc8ac993b, 0x10187da7, 0xe89c636e, 0xdb3bbb7b, 0xcd267809, 0x6e5918f4, 0xec9ab701, 0x834f9aa8, 0xe6956e65, 0xaaffe67e, 0x21bccf08, 0xef15e8e6, 0xbae79bd9, 0x4a6f36ce, 0xea9f09d4, 0x29b07cd6, 0x31a4b2af, 0x2a3f2331, 0xc6a59430, 0x35a266c0, 0x744ebc37, 0xfc82caa6, 0xe090d0b0, 0x33a7d815, 0xf104984a, 0x41ecdaf7, 0x7fcd500e, 0x1791f62f, 0x764dd68d, 0x43efb04d, 0xccaa4d54, 0xe49604df, 0x9ed1b5e3, 0x4c6a881b, 0xc12c1fb8, 0x4665517f, 0x9d5eea04, 0x018c355d, 0xfa877473, 0xfb0b412e, 0xb3671d5a, 0x92dbd252, 0xe9105633, 0x6dd64713, 0x9ad7618c, 0x37a10c7a, 0x59f8148e, 0xeb133c89, 0xcea927ee, 0xb761c935, 0xe11ce5ed, 0x7a47b13c, 0x9cd2df59, 0x55f2733f, 0x1814ce79, 0x73c737bf, 0x53f7cdea, 0x5ffdaa5b, 0xdf3d6f14, 0x7844db86, 0xcaaff381, 0xb968c43e, 0x3824342c, 0xc2a3405f, 0x161dc372, 0xbce2250c, 0x283c498b, 0xff0d9541, 0x39a80171, 0x080cb3de, 0xd8b4e49c, 0x6456c190, 0x7bcb8461, 0xd532b670, 0x486c5c74, 0xd0b85742];
    const T6 = [0x5051f4a7, 0x537e4165, 0xc31a17a4, 0x963a275e, 0xcb3bab6b, 0xf11f9d45, 0xabacfa58, 0x934be303, 0x552030fa, 0xf6ad766d, 0x9188cc76, 0x25f5024c, 0xfc4fe5d7, 0xd7c52acb, 0x80263544, 0x8fb562a3, 0x49deb15a, 0x6725ba1b, 0x9845ea0e, 0xe15dfec0, 0x02c32f75, 0x12814cf0, 0xa38d4697, 0xc66bd3f9, 0xe7038f5f, 0x9515929c, 0xebbf6d7a, 0xda955259, 0x2dd4be83, 0xd3587421, 0x2949e069, 0x448ec9c8, 0x6a75c289, 0x78f48e79, 0x6b99583e, 0xdd27b971, 0xb6bee14f, 0x17f088ad, 0x66c920ac, 0xb47dce3a, 0x1863df4a, 0x82e51a31, 0x60975133, 0x4562537f, 0xe0b16477, 0x84bb6bae, 0x1cfe81a0, 0x94f9082b, 0x58704868, 0x198f45fd, 0x8794de6c, 0xb7527bf8, 0x23ab73d3, 0xe2724b02, 0x57e31f8f, 0x2a6655ab, 0x07b2eb28, 0x032fb5c2, 0x9a86c57b, 0xa5d33708, 0xf2302887, 0xb223bfa5, 0xba02036a, 0x5ced1682, 0x2b8acf1c, 0x92a779b4, 0xf0f307f2, 0xa14e69e2, 0xcd65daf4, 0xd50605be, 0x1fd13462, 0x8ac4a6fe, 0x9d342e53, 0xa0a2f355, 0x32058ae1, 0x75a4f6eb, 0x390b83ec, 0xaa4060ef, 0x065e719f, 0x51bd6e10, 0xf93e218a, 0x3d96dd06, 0xaedd3e05, 0x464de6bd, 0xb591548d, 0x0571c45d, 0x6f0406d4, 0xff605015, 0x241998fb, 0x97d6bde9, 0xcc894043, 0x7767d99e, 0xbdb0e842, 0x8807898b, 0x38e7195b, 0xdb79c8ee, 0x47a17c0a, 0xe97c420f, 0xc9f8841e, 0x00000000, 0x83098086, 0x48322bed, 0xac1e1170, 0x4e6c5a72, 0xfbfd0eff, 0x560f8538, 0x1e3daed5, 0x27362d39, 0x640a0fd9, 0x21685ca6, 0xd19b5b54, 0x3a24362e, 0xb10c0a67, 0x0f9357e7, 0xd2b4ee96, 0x9e1b9b91, 0x4f80c0c5, 0xa261dc20, 0x695a774b, 0x161c121a, 0x0ae293ba, 0xe5c0a02a, 0x433c22e0, 0x1d121b17, 0x0b0e090d, 0xadf28bc7, 0xb92db6a8, 0xc8141ea9, 0x8557f119, 0x4caf7507, 0xbbee99dd, 0xfda37f60, 0x9ff70126, 0xbc5c72f5, 0xc544663b, 0x345bfb7e, 0x768b4329, 0xdccb23c6, 0x68b6edfc, 0x63b8e4f1, 0xcad731dc, 0x10426385, 0x40139722, 0x2084c611, 0x7d854a24, 0xf8d2bb3d, 0x11aef932, 0x6dc729a1, 0x4b1d9e2f, 0xf3dcb230, 0xec0d8652, 0xd077c1e3, 0x6c2bb316, 0x99a970b9, 0xfa119448, 0x2247e964, 0xc4a8fc8c, 0x1aa0f03f, 0xd8567d2c, 0xef223390, 0xc787494e, 0xc1d938d1, 0xfe8ccaa2, 0x3698d40b, 0xcfa6f581, 0x28a57ade, 0x26dab78e, 0xa43fadbf, 0xe42c3a9d, 0x0d507892, 0x9b6a5fcc, 0x62547e46, 0xc2f68d13, 0xe890d8b8, 0x5e2e39f7, 0xf582c3af, 0xbe9f5d80, 0x7c69d093, 0xa96fd52d, 0xb3cf2512, 0x3bc8ac99, 0xa710187d, 0x6ee89c63, 0x7bdb3bbb, 0x09cd2678, 0xf46e5918, 0x01ec9ab7, 0xa8834f9a, 0x65e6956e, 0x7eaaffe6, 0x0821bccf, 0xe6ef15e8, 0xd9bae79b, 0xce4a6f36, 0xd4ea9f09, 0xd629b07c, 0xaf31a4b2, 0x312a3f23, 0x30c6a594, 0xc035a266, 0x37744ebc, 0xa6fc82ca, 0xb0e090d0, 0x1533a7d8, 0x4af10498, 0xf741ecda, 0x0e7fcd50, 0x2f1791f6, 0x8d764dd6, 0x4d43efb0, 0x54ccaa4d, 0xdfe49604, 0xe39ed1b5, 0x1b4c6a88, 0xb8c12c1f, 0x7f466551, 0x049d5eea, 0x5d018c35, 0x73fa8774, 0x2efb0b41, 0x5ab3671d, 0x5292dbd2, 0x33e91056, 0x136dd647, 0x8c9ad761, 0x7a37a10c, 0x8e59f814, 0x89eb133c, 0xeecea927, 0x35b761c9, 0xede11ce5, 0x3c7a47b1, 0x599cd2df, 0x3f55f273, 0x791814ce, 0xbf73c737, 0xea53f7cd, 0x5b5ffdaa, 0x14df3d6f, 0x867844db, 0x81caaff3, 0x3eb968c4, 0x2c382434, 0x5fc2a340, 0x72161dc3, 0x0cbce225, 0x8b283c49, 0x41ff0d95, 0x7139a801, 0xde080cb3, 0x9cd8b4e4, 0x906456c1, 0x617bcb84, 0x70d532b6, 0x74486c5c, 0x42d0b857];
    const T7 = [0xa75051f4, 0x65537e41, 0xa4c31a17, 0x5e963a27, 0x6bcb3bab, 0x45f11f9d, 0x58abacfa, 0x03934be3, 0xfa552030, 0x6df6ad76, 0x769188cc, 0x4c25f502, 0xd7fc4fe5, 0xcbd7c52a, 0x44802635, 0xa38fb562, 0x5a49deb1, 0x1b6725ba, 0x0e9845ea, 0xc0e15dfe, 0x7502c32f, 0xf012814c, 0x97a38d46, 0xf9c66bd3, 0x5fe7038f, 0x9c951592, 0x7aebbf6d, 0x59da9552, 0x832dd4be, 0x21d35874, 0x692949e0, 0xc8448ec9, 0x896a75c2, 0x7978f48e, 0x3e6b9958, 0x71dd27b9, 0x4fb6bee1, 0xad17f088, 0xac66c920, 0x3ab47dce, 0x4a1863df, 0x3182e51a, 0x33609751, 0x7f456253, 0x77e0b164, 0xae84bb6b, 0xa01cfe81, 0x2b94f908, 0x68587048, 0xfd198f45, 0x6c8794de, 0xf8b7527b, 0xd323ab73, 0x02e2724b, 0x8f57e31f, 0xab2a6655, 0x2807b2eb, 0xc2032fb5, 0x7b9a86c5, 0x08a5d337, 0x87f23028, 0xa5b223bf, 0x6aba0203, 0x825ced16, 0x1c2b8acf, 0xb492a779, 0xf2f0f307, 0xe2a14e69, 0xf4cd65da, 0xbed50605, 0x621fd134, 0xfe8ac4a6, 0x539d342e, 0x55a0a2f3, 0xe132058a, 0xeb75a4f6, 0xec390b83, 0xefaa4060, 0x9f065e71, 0x1051bd6e, 0x8af93e21, 0x063d96dd, 0x05aedd3e, 0xbd464de6, 0x8db59154, 0x5d0571c4, 0xd46f0406, 0x15ff6050, 0xfb241998, 0xe997d6bd, 0x43cc8940, 0x9e7767d9, 0x42bdb0e8, 0x8b880789, 0x5b38e719, 0xeedb79c8, 0x0a47a17c, 0x0fe97c42, 0x1ec9f884, 0x00000000, 0x86830980, 0xed48322b, 0x70ac1e11, 0x724e6c5a, 0xfffbfd0e, 0x38560f85, 0xd51e3dae, 0x3927362d, 0xd9640a0f, 0xa621685c, 0x54d19b5b, 0x2e3a2436, 0x67b10c0a, 0xe70f9357, 0x96d2b4ee, 0x919e1b9b, 0xc54f80c0, 0x20a261dc, 0x4b695a77, 0x1a161c12, 0xba0ae293, 0x2ae5c0a0, 0xe0433c22, 0x171d121b, 0x0d0b0e09, 0xc7adf28b, 0xa8b92db6, 0xa9c8141e, 0x198557f1, 0x074caf75, 0xddbbee99, 0x60fda37f, 0x269ff701, 0xf5bc5c72, 0x3bc54466, 0x7e345bfb, 0x29768b43, 0xc6dccb23, 0xfc68b6ed, 0xf163b8e4, 0xdccad731, 0x85104263, 0x22401397, 0x112084c6, 0x247d854a, 0x3df8d2bb, 0x3211aef9, 0xa16dc729, 0x2f4b1d9e, 0x30f3dcb2, 0x52ec0d86, 0xe3d077c1, 0x166c2bb3, 0xb999a970, 0x48fa1194, 0x642247e9, 0x8cc4a8fc, 0x3f1aa0f0, 0x2cd8567d, 0x90ef2233, 0x4ec78749, 0xd1c1d938, 0xa2fe8cca, 0x0b3698d4, 0x81cfa6f5, 0xde28a57a, 0x8e26dab7, 0xbfa43fad, 0x9de42c3a, 0x920d5078, 0xcc9b6a5f, 0x4662547e, 0x13c2f68d, 0xb8e890d8, 0xf75e2e39, 0xaff582c3, 0x80be9f5d, 0x937c69d0, 0x2da96fd5, 0x12b3cf25, 0x993bc8ac, 0x7da71018, 0x636ee89c, 0xbb7bdb3b, 0x7809cd26, 0x18f46e59, 0xb701ec9a, 0x9aa8834f, 0x6e65e695, 0xe67eaaff, 0xcf0821bc, 0xe8e6ef15, 0x9bd9bae7, 0x36ce4a6f, 0x09d4ea9f, 0x7cd629b0, 0xb2af31a4, 0x23312a3f, 0x9430c6a5, 0x66c035a2, 0xbc37744e, 0xcaa6fc82, 0xd0b0e090, 0xd81533a7, 0x984af104, 0xdaf741ec, 0x500e7fcd, 0xf62f1791, 0xd68d764d, 0xb04d43ef, 0x4d54ccaa, 0x04dfe496, 0xb5e39ed1, 0x881b4c6a, 0x1fb8c12c, 0x517f4665, 0xea049d5e, 0x355d018c, 0x7473fa87, 0x412efb0b, 0x1d5ab367, 0xd25292db, 0x5633e910, 0x47136dd6, 0x618c9ad7, 0x0c7a37a1, 0x148e59f8, 0x3c89eb13, 0x27eecea9, 0xc935b761, 0xe5ede11c, 0xb13c7a47, 0xdf599cd2, 0x733f55f2, 0xce791814, 0x37bf73c7, 0xcdea53f7, 0xaa5b5ffd, 0x6f14df3d, 0xdb867844, 0xf381caaf, 0xc43eb968, 0x342c3824, 0x405fc2a3, 0xc372161d, 0x250cbce2, 0x498b283c, 0x9541ff0d, 0x017139a8, 0xb3de080c, 0xe49cd8b4, 0xc1906456, 0x84617bcb, 0xb670d532, 0x5c74486c, 0x5742d0b8];
    const T8 = [0xf4a75051, 0x4165537e, 0x17a4c31a, 0x275e963a, 0xab6bcb3b, 0x9d45f11f, 0xfa58abac, 0xe303934b, 0x30fa5520, 0x766df6ad, 0xcc769188, 0x024c25f5, 0xe5d7fc4f, 0x2acbd7c5, 0x35448026, 0x62a38fb5, 0xb15a49de, 0xba1b6725, 0xea0e9845, 0xfec0e15d, 0x2f7502c3, 0x4cf01281, 0x4697a38d, 0xd3f9c66b, 0x8f5fe703, 0x929c9515, 0x6d7aebbf, 0x5259da95, 0xbe832dd4, 0x7421d358, 0xe0692949, 0xc9c8448e, 0xc2896a75, 0x8e7978f4, 0x583e6b99, 0xb971dd27, 0xe14fb6be, 0x88ad17f0, 0x20ac66c9, 0xce3ab47d, 0xdf4a1863, 0x1a3182e5, 0x51336097, 0x537f4562, 0x6477e0b1, 0x6bae84bb, 0x81a01cfe, 0x082b94f9, 0x48685870, 0x45fd198f, 0xde6c8794, 0x7bf8b752, 0x73d323ab, 0x4b02e272, 0x1f8f57e3, 0x55ab2a66, 0xeb2807b2, 0xb5c2032f, 0xc57b9a86, 0x3708a5d3, 0x2887f230, 0xbfa5b223, 0x036aba02, 0x16825ced, 0xcf1c2b8a, 0x79b492a7, 0x07f2f0f3, 0x69e2a14e, 0xdaf4cd65, 0x05bed506, 0x34621fd1, 0xa6fe8ac4, 0x2e539d34, 0xf355a0a2, 0x8ae13205, 0xf6eb75a4, 0x83ec390b, 0x60efaa40, 0x719f065e, 0x6e1051bd, 0x218af93e, 0xdd063d96, 0x3e05aedd, 0xe6bd464d, 0x548db591, 0xc45d0571, 0x06d46f04, 0x5015ff60, 0x98fb2419, 0xbde997d6, 0x4043cc89, 0xd99e7767, 0xe842bdb0, 0x898b8807, 0x195b38e7, 0xc8eedb79, 0x7c0a47a1, 0x420fe97c, 0x841ec9f8, 0x00000000, 0x80868309, 0x2bed4832, 0x1170ac1e, 0x5a724e6c, 0x0efffbfd, 0x8538560f, 0xaed51e3d, 0x2d392736, 0x0fd9640a, 0x5ca62168, 0x5b54d19b, 0x362e3a24, 0x0a67b10c, 0x57e70f93, 0xee96d2b4, 0x9b919e1b, 0xc0c54f80, 0xdc20a261, 0x774b695a, 0x121a161c, 0x93ba0ae2, 0xa02ae5c0, 0x22e0433c, 0x1b171d12, 0x090d0b0e, 0x8bc7adf2, 0xb6a8b92d, 0x1ea9c814, 0xf1198557, 0x75074caf, 0x99ddbbee, 0x7f60fda3, 0x01269ff7, 0x72f5bc5c, 0x663bc544, 0xfb7e345b, 0x4329768b, 0x23c6dccb, 0xedfc68b6, 0xe4f163b8, 0x31dccad7, 0x63851042, 0x97224013, 0xc6112084, 0x4a247d85, 0xbb3df8d2, 0xf93211ae, 0x29a16dc7, 0x9e2f4b1d, 0xb230f3dc, 0x8652ec0d, 0xc1e3d077, 0xb3166c2b, 0x70b999a9, 0x9448fa11, 0xe9642247, 0xfc8cc4a8, 0xf03f1aa0, 0x7d2cd856, 0x3390ef22, 0x494ec787, 0x38d1c1d9, 0xcaa2fe8c, 0xd40b3698, 0xf581cfa6, 0x7ade28a5, 0xb78e26da, 0xadbfa43f, 0x3a9de42c, 0x78920d50, 0x5fcc9b6a, 0x7e466254, 0x8d13c2f6, 0xd8b8e890, 0x39f75e2e, 0xc3aff582, 0x5d80be9f, 0xd0937c69, 0xd52da96f, 0x2512b3cf, 0xac993bc8, 0x187da710, 0x9c636ee8, 0x3bbb7bdb, 0x267809cd, 0x5918f46e, 0x9ab701ec, 0x4f9aa883, 0x956e65e6, 0xffe67eaa, 0xbccf0821, 0x15e8e6ef, 0xe79bd9ba, 0x6f36ce4a, 0x9f09d4ea, 0xb07cd629, 0xa4b2af31, 0x3f23312a, 0xa59430c6, 0xa266c035, 0x4ebc3774, 0x82caa6fc, 0x90d0b0e0, 0xa7d81533, 0x04984af1, 0xecdaf741, 0xcd500e7f, 0x91f62f17, 0x4dd68d76, 0xefb04d43, 0xaa4d54cc, 0x9604dfe4, 0xd1b5e39e, 0x6a881b4c, 0x2c1fb8c1, 0x65517f46, 0x5eea049d, 0x8c355d01, 0x877473fa, 0x0b412efb, 0x671d5ab3, 0xdbd25292, 0x105633e9, 0xd647136d, 0xd7618c9a, 0xa10c7a37, 0xf8148e59, 0x133c89eb, 0xa927eece, 0x61c935b7, 0x1ce5ede1, 0x47b13c7a, 0xd2df599c, 0xf2733f55, 0x14ce7918, 0xc737bf73, 0xf7cdea53, 0xfdaa5b5f, 0x3d6f14df, 0x44db8678, 0xaff381ca, 0x68c43eb9, 0x24342c38, 0xa3405fc2, 0x1dc37216, 0xe2250cbc, 0x3c498b28, 0x0d9541ff, 0xa8017139, 0x0cb3de08, 0xb4e49cd8, 0x56c19064, 0xcb84617b, 0x32b670d5, 0x6c5c7448, 0xb85742d0];
    // Transformations for decryption key expansion
    const U1 = [0x00000000, 0x0e090d0b, 0x1c121a16, 0x121b171d, 0x3824342c, 0x362d3927, 0x24362e3a, 0x2a3f2331, 0x70486858, 0x7e416553, 0x6c5a724e, 0x62537f45, 0x486c5c74, 0x4665517f, 0x547e4662, 0x5a774b69, 0xe090d0b0, 0xee99ddbb, 0xfc82caa6, 0xf28bc7ad, 0xd8b4e49c, 0xd6bde997, 0xc4a6fe8a, 0xcaaff381, 0x90d8b8e8, 0x9ed1b5e3, 0x8ccaa2fe, 0x82c3aff5, 0xa8fc8cc4, 0xa6f581cf, 0xb4ee96d2, 0xbae79bd9, 0xdb3bbb7b, 0xd532b670, 0xc729a16d, 0xc920ac66, 0xe31f8f57, 0xed16825c, 0xff0d9541, 0xf104984a, 0xab73d323, 0xa57ade28, 0xb761c935, 0xb968c43e, 0x9357e70f, 0x9d5eea04, 0x8f45fd19, 0x814cf012, 0x3bab6bcb, 0x35a266c0, 0x27b971dd, 0x29b07cd6, 0x038f5fe7, 0x0d8652ec, 0x1f9d45f1, 0x119448fa, 0x4be30393, 0x45ea0e98, 0x57f11985, 0x59f8148e, 0x73c737bf, 0x7dce3ab4, 0x6fd52da9, 0x61dc20a2, 0xad766df6, 0xa37f60fd, 0xb16477e0, 0xbf6d7aeb, 0x955259da, 0x9b5b54d1, 0x894043cc, 0x87494ec7, 0xdd3e05ae, 0xd33708a5, 0xc12c1fb8, 0xcf2512b3, 0xe51a3182, 0xeb133c89, 0xf9082b94, 0xf701269f, 0x4de6bd46, 0x43efb04d, 0x51f4a750, 0x5ffdaa5b, 0x75c2896a, 0x7bcb8461, 0x69d0937c, 0x67d99e77, 0x3daed51e, 0x33a7d815, 0x21bccf08, 0x2fb5c203, 0x058ae132, 0x0b83ec39, 0x1998fb24, 0x1791f62f, 0x764dd68d, 0x7844db86, 0x6a5fcc9b, 0x6456c190, 0x4e69e2a1, 0x4060efaa, 0x527bf8b7, 0x5c72f5bc, 0x0605bed5, 0x080cb3de, 0x1a17a4c3, 0x141ea9c8, 0x3e218af9, 0x302887f2, 0x223390ef, 0x2c3a9de4, 0x96dd063d, 0x98d40b36, 0x8acf1c2b, 0x84c61120, 0xaef93211, 0xa0f03f1a, 0xb2eb2807, 0xbce2250c, 0xe6956e65, 0xe89c636e, 0xfa877473, 0xf48e7978, 0xdeb15a49, 0xd0b85742, 0xc2a3405f, 0xccaa4d54, 0x41ecdaf7, 0x4fe5d7fc, 0x5dfec0e1, 0x53f7cdea, 0x79c8eedb, 0x77c1e3d0, 0x65daf4cd, 0x6bd3f9c6, 0x31a4b2af, 0x3fadbfa4, 0x2db6a8b9, 0x23bfa5b2, 0x09808683, 0x07898b88, 0x15929c95, 0x1b9b919e, 0xa17c0a47, 0xaf75074c, 0xbd6e1051, 0xb3671d5a, 0x99583e6b, 0x97513360, 0x854a247d, 0x8b432976, 0xd134621f, 0xdf3d6f14, 0xcd267809, 0xc32f7502, 0xe9105633, 0xe7195b38, 0xf5024c25, 0xfb0b412e, 0x9ad7618c, 0x94de6c87, 0x86c57b9a, 0x88cc7691, 0xa2f355a0, 0xacfa58ab, 0xbee14fb6, 0xb0e842bd, 0xea9f09d4, 0xe49604df, 0xf68d13c2, 0xf8841ec9, 0xd2bb3df8, 0xdcb230f3, 0xcea927ee, 0xc0a02ae5, 0x7a47b13c, 0x744ebc37, 0x6655ab2a, 0x685ca621, 0x42638510, 0x4c6a881b, 0x5e719f06, 0x5078920d, 0x0a0fd964, 0x0406d46f, 0x161dc372, 0x1814ce79, 0x322bed48, 0x3c22e043, 0x2e39f75e, 0x2030fa55, 0xec9ab701, 0xe293ba0a, 0xf088ad17, 0xfe81a01c, 0xd4be832d, 0xdab78e26, 0xc8ac993b, 0xc6a59430, 0x9cd2df59, 0x92dbd252, 0x80c0c54f, 0x8ec9c844, 0xa4f6eb75, 0xaaffe67e, 0xb8e4f163, 0xb6edfc68, 0x0c0a67b1, 0x02036aba, 0x10187da7, 0x1e1170ac, 0x342e539d, 0x3a275e96, 0x283c498b, 0x26354480, 0x7c420fe9, 0x724b02e2, 0x605015ff, 0x6e5918f4, 0x44663bc5, 0x4a6f36ce, 0x587421d3, 0x567d2cd8, 0x37a10c7a, 0x39a80171, 0x2bb3166c, 0x25ba1b67, 0x0f853856, 0x018c355d, 0x13972240, 0x1d9e2f4b, 0x47e96422, 0x49e06929, 0x5bfb7e34, 0x55f2733f, 0x7fcd500e, 0x71c45d05, 0x63df4a18, 0x6dd64713, 0xd731dcca, 0xd938d1c1, 0xcb23c6dc, 0xc52acbd7, 0xef15e8e6, 0xe11ce5ed, 0xf307f2f0, 0xfd0efffb, 0xa779b492, 0xa970b999, 0xbb6bae84, 0xb562a38f, 0x9f5d80be, 0x91548db5, 0x834f9aa8, 0x8d4697a3];
    const U2 = [0x00000000, 0x0b0e090d, 0x161c121a, 0x1d121b17, 0x2c382434, 0x27362d39, 0x3a24362e, 0x312a3f23, 0x58704868, 0x537e4165, 0x4e6c5a72, 0x4562537f, 0x74486c5c, 0x7f466551, 0x62547e46, 0x695a774b, 0xb0e090d0, 0xbbee99dd, 0xa6fc82ca, 0xadf28bc7, 0x9cd8b4e4, 0x97d6bde9, 0x8ac4a6fe, 0x81caaff3, 0xe890d8b8, 0xe39ed1b5, 0xfe8ccaa2, 0xf582c3af, 0xc4a8fc8c, 0xcfa6f581, 0xd2b4ee96, 0xd9bae79b, 0x7bdb3bbb, 0x70d532b6, 0x6dc729a1, 0x66c920ac, 0x57e31f8f, 0x5ced1682, 0x41ff0d95, 0x4af10498, 0x23ab73d3, 0x28a57ade, 0x35b761c9, 0x3eb968c4, 0x0f9357e7, 0x049d5eea, 0x198f45fd, 0x12814cf0, 0xcb3bab6b, 0xc035a266, 0xdd27b971, 0xd629b07c, 0xe7038f5f, 0xec0d8652, 0xf11f9d45, 0xfa119448, 0x934be303, 0x9845ea0e, 0x8557f119, 0x8e59f814, 0xbf73c737, 0xb47dce3a, 0xa96fd52d, 0xa261dc20, 0xf6ad766d, 0xfda37f60, 0xe0b16477, 0xebbf6d7a, 0xda955259, 0xd19b5b54, 0xcc894043, 0xc787494e, 0xaedd3e05, 0xa5d33708, 0xb8c12c1f, 0xb3cf2512, 0x82e51a31, 0x89eb133c, 0x94f9082b, 0x9ff70126, 0x464de6bd, 0x4d43efb0, 0x5051f4a7, 0x5b5ffdaa, 0x6a75c289, 0x617bcb84, 0x7c69d093, 0x7767d99e, 0x1e3daed5, 0x1533a7d8, 0x0821bccf, 0x032fb5c2, 0x32058ae1, 0x390b83ec, 0x241998fb, 0x2f1791f6, 0x8d764dd6, 0x867844db, 0x9b6a5fcc, 0x906456c1, 0xa14e69e2, 0xaa4060ef, 0xb7527bf8, 0xbc5c72f5, 0xd50605be, 0xde080cb3, 0xc31a17a4, 0xc8141ea9, 0xf93e218a, 0xf2302887, 0xef223390, 0xe42c3a9d, 0x3d96dd06, 0x3698d40b, 0x2b8acf1c, 0x2084c611, 0x11aef932, 0x1aa0f03f, 0x07b2eb28, 0x0cbce225, 0x65e6956e, 0x6ee89c63, 0x73fa8774, 0x78f48e79, 0x49deb15a, 0x42d0b857, 0x5fc2a340, 0x54ccaa4d, 0xf741ecda, 0xfc4fe5d7, 0xe15dfec0, 0xea53f7cd, 0xdb79c8ee, 0xd077c1e3, 0xcd65daf4, 0xc66bd3f9, 0xaf31a4b2, 0xa43fadbf, 0xb92db6a8, 0xb223bfa5, 0x83098086, 0x8807898b, 0x9515929c, 0x9e1b9b91, 0x47a17c0a, 0x4caf7507, 0x51bd6e10, 0x5ab3671d, 0x6b99583e, 0x60975133, 0x7d854a24, 0x768b4329, 0x1fd13462, 0x14df3d6f, 0x09cd2678, 0x02c32f75, 0x33e91056, 0x38e7195b, 0x25f5024c, 0x2efb0b41, 0x8c9ad761, 0x8794de6c, 0x9a86c57b, 0x9188cc76, 0xa0a2f355, 0xabacfa58, 0xb6bee14f, 0xbdb0e842, 0xd4ea9f09, 0xdfe49604, 0xc2f68d13, 0xc9f8841e, 0xf8d2bb3d, 0xf3dcb230, 0xeecea927, 0xe5c0a02a, 0x3c7a47b1, 0x37744ebc, 0x2a6655ab, 0x21685ca6, 0x10426385, 0x1b4c6a88, 0x065e719f, 0x0d507892, 0x640a0fd9, 0x6f0406d4, 0x72161dc3, 0x791814ce, 0x48322bed, 0x433c22e0, 0x5e2e39f7, 0x552030fa, 0x01ec9ab7, 0x0ae293ba, 0x17f088ad, 0x1cfe81a0, 0x2dd4be83, 0x26dab78e, 0x3bc8ac99, 0x30c6a594, 0x599cd2df, 0x5292dbd2, 0x4f80c0c5, 0x448ec9c8, 0x75a4f6eb, 0x7eaaffe6, 0x63b8e4f1, 0x68b6edfc, 0xb10c0a67, 0xba02036a, 0xa710187d, 0xac1e1170, 0x9d342e53, 0x963a275e, 0x8b283c49, 0x80263544, 0xe97c420f, 0xe2724b02, 0xff605015, 0xf46e5918, 0xc544663b, 0xce4a6f36, 0xd3587421, 0xd8567d2c, 0x7a37a10c, 0x7139a801, 0x6c2bb316, 0x6725ba1b, 0x560f8538, 0x5d018c35, 0x40139722, 0x4b1d9e2f, 0x2247e964, 0x2949e069, 0x345bfb7e, 0x3f55f273, 0x0e7fcd50, 0x0571c45d, 0x1863df4a, 0x136dd647, 0xcad731dc, 0xc1d938d1, 0xdccb23c6, 0xd7c52acb, 0xe6ef15e8, 0xede11ce5, 0xf0f307f2, 0xfbfd0eff, 0x92a779b4, 0x99a970b9, 0x84bb6bae, 0x8fb562a3, 0xbe9f5d80, 0xb591548d, 0xa8834f9a, 0xa38d4697];
    const U3 = [0x00000000, 0x0d0b0e09, 0x1a161c12, 0x171d121b, 0x342c3824, 0x3927362d, 0x2e3a2436, 0x23312a3f, 0x68587048, 0x65537e41, 0x724e6c5a, 0x7f456253, 0x5c74486c, 0x517f4665, 0x4662547e, 0x4b695a77, 0xd0b0e090, 0xddbbee99, 0xcaa6fc82, 0xc7adf28b, 0xe49cd8b4, 0xe997d6bd, 0xfe8ac4a6, 0xf381caaf, 0xb8e890d8, 0xb5e39ed1, 0xa2fe8cca, 0xaff582c3, 0x8cc4a8fc, 0x81cfa6f5, 0x96d2b4ee, 0x9bd9bae7, 0xbb7bdb3b, 0xb670d532, 0xa16dc729, 0xac66c920, 0x8f57e31f, 0x825ced16, 0x9541ff0d, 0x984af104, 0xd323ab73, 0xde28a57a, 0xc935b761, 0xc43eb968, 0xe70f9357, 0xea049d5e, 0xfd198f45, 0xf012814c, 0x6bcb3bab, 0x66c035a2, 0x71dd27b9, 0x7cd629b0, 0x5fe7038f, 0x52ec0d86, 0x45f11f9d, 0x48fa1194, 0x03934be3, 0x0e9845ea, 0x198557f1, 0x148e59f8, 0x37bf73c7, 0x3ab47dce, 0x2da96fd5, 0x20a261dc, 0x6df6ad76, 0x60fda37f, 0x77e0b164, 0x7aebbf6d, 0x59da9552, 0x54d19b5b, 0x43cc8940, 0x4ec78749, 0x05aedd3e, 0x08a5d337, 0x1fb8c12c, 0x12b3cf25, 0x3182e51a, 0x3c89eb13, 0x2b94f908, 0x269ff701, 0xbd464de6, 0xb04d43ef, 0xa75051f4, 0xaa5b5ffd, 0x896a75c2, 0x84617bcb, 0x937c69d0, 0x9e7767d9, 0xd51e3dae, 0xd81533a7, 0xcf0821bc, 0xc2032fb5, 0xe132058a, 0xec390b83, 0xfb241998, 0xf62f1791, 0xd68d764d, 0xdb867844, 0xcc9b6a5f, 0xc1906456, 0xe2a14e69, 0xefaa4060, 0xf8b7527b, 0xf5bc5c72, 0xbed50605, 0xb3de080c, 0xa4c31a17, 0xa9c8141e, 0x8af93e21, 0x87f23028, 0x90ef2233, 0x9de42c3a, 0x063d96dd, 0x0b3698d4, 0x1c2b8acf, 0x112084c6, 0x3211aef9, 0x3f1aa0f0, 0x2807b2eb, 0x250cbce2, 0x6e65e695, 0x636ee89c, 0x7473fa87, 0x7978f48e, 0x5a49deb1, 0x5742d0b8, 0x405fc2a3, 0x4d54ccaa, 0xdaf741ec, 0xd7fc4fe5, 0xc0e15dfe, 0xcdea53f7, 0xeedb79c8, 0xe3d077c1, 0xf4cd65da, 0xf9c66bd3, 0xb2af31a4, 0xbfa43fad, 0xa8b92db6, 0xa5b223bf, 0x86830980, 0x8b880789, 0x9c951592, 0x919e1b9b, 0x0a47a17c, 0x074caf75, 0x1051bd6e, 0x1d5ab367, 0x3e6b9958, 0x33609751, 0x247d854a, 0x29768b43, 0x621fd134, 0x6f14df3d, 0x7809cd26, 0x7502c32f, 0x5633e910, 0x5b38e719, 0x4c25f502, 0x412efb0b, 0x618c9ad7, 0x6c8794de, 0x7b9a86c5, 0x769188cc, 0x55a0a2f3, 0x58abacfa, 0x4fb6bee1, 0x42bdb0e8, 0x09d4ea9f, 0x04dfe496, 0x13c2f68d, 0x1ec9f884, 0x3df8d2bb, 0x30f3dcb2, 0x27eecea9, 0x2ae5c0a0, 0xb13c7a47, 0xbc37744e, 0xab2a6655, 0xa621685c, 0x85104263, 0x881b4c6a, 0x9f065e71, 0x920d5078, 0xd9640a0f, 0xd46f0406, 0xc372161d, 0xce791814, 0xed48322b, 0xe0433c22, 0xf75e2e39, 0xfa552030, 0xb701ec9a, 0xba0ae293, 0xad17f088, 0xa01cfe81, 0x832dd4be, 0x8e26dab7, 0x993bc8ac, 0x9430c6a5, 0xdf599cd2, 0xd25292db, 0xc54f80c0, 0xc8448ec9, 0xeb75a4f6, 0xe67eaaff, 0xf163b8e4, 0xfc68b6ed, 0x67b10c0a, 0x6aba0203, 0x7da71018, 0x70ac1e11, 0x539d342e, 0x5e963a27, 0x498b283c, 0x44802635, 0x0fe97c42, 0x02e2724b, 0x15ff6050, 0x18f46e59, 0x3bc54466, 0x36ce4a6f, 0x21d35874, 0x2cd8567d, 0x0c7a37a1, 0x017139a8, 0x166c2bb3, 0x1b6725ba, 0x38560f85, 0x355d018c, 0x22401397, 0x2f4b1d9e, 0x642247e9, 0x692949e0, 0x7e345bfb, 0x733f55f2, 0x500e7fcd, 0x5d0571c4, 0x4a1863df, 0x47136dd6, 0xdccad731, 0xd1c1d938, 0xc6dccb23, 0xcbd7c52a, 0xe8e6ef15, 0xe5ede11c, 0xf2f0f307, 0xfffbfd0e, 0xb492a779, 0xb999a970, 0xae84bb6b, 0xa38fb562, 0x80be9f5d, 0x8db59154, 0x9aa8834f, 0x97a38d46];
    const U4 = [0x00000000, 0x090d0b0e, 0x121a161c, 0x1b171d12, 0x24342c38, 0x2d392736, 0x362e3a24, 0x3f23312a, 0x48685870, 0x4165537e, 0x5a724e6c, 0x537f4562, 0x6c5c7448, 0x65517f46, 0x7e466254, 0x774b695a, 0x90d0b0e0, 0x99ddbbee, 0x82caa6fc, 0x8bc7adf2, 0xb4e49cd8, 0xbde997d6, 0xa6fe8ac4, 0xaff381ca, 0xd8b8e890, 0xd1b5e39e, 0xcaa2fe8c, 0xc3aff582, 0xfc8cc4a8, 0xf581cfa6, 0xee96d2b4, 0xe79bd9ba, 0x3bbb7bdb, 0x32b670d5, 0x29a16dc7, 0x20ac66c9, 0x1f8f57e3, 0x16825ced, 0x0d9541ff, 0x04984af1, 0x73d323ab, 0x7ade28a5, 0x61c935b7, 0x68c43eb9, 0x57e70f93, 0x5eea049d, 0x45fd198f, 0x4cf01281, 0xab6bcb3b, 0xa266c035, 0xb971dd27, 0xb07cd629, 0x8f5fe703, 0x8652ec0d, 0x9d45f11f, 0x9448fa11, 0xe303934b, 0xea0e9845, 0xf1198557, 0xf8148e59, 0xc737bf73, 0xce3ab47d, 0xd52da96f, 0xdc20a261, 0x766df6ad, 0x7f60fda3, 0x6477e0b1, 0x6d7aebbf, 0x5259da95, 0x5b54d19b, 0x4043cc89, 0x494ec787, 0x3e05aedd, 0x3708a5d3, 0x2c1fb8c1, 0x2512b3cf, 0x1a3182e5, 0x133c89eb, 0x082b94f9, 0x01269ff7, 0xe6bd464d, 0xefb04d43, 0xf4a75051, 0xfdaa5b5f, 0xc2896a75, 0xcb84617b, 0xd0937c69, 0xd99e7767, 0xaed51e3d, 0xa7d81533, 0xbccf0821, 0xb5c2032f, 0x8ae13205, 0x83ec390b, 0x98fb2419, 0x91f62f17, 0x4dd68d76, 0x44db8678, 0x5fcc9b6a, 0x56c19064, 0x69e2a14e, 0x60efaa40, 0x7bf8b752, 0x72f5bc5c, 0x05bed506, 0x0cb3de08, 0x17a4c31a, 0x1ea9c814, 0x218af93e, 0x2887f230, 0x3390ef22, 0x3a9de42c, 0xdd063d96, 0xd40b3698, 0xcf1c2b8a, 0xc6112084, 0xf93211ae, 0xf03f1aa0, 0xeb2807b2, 0xe2250cbc, 0x956e65e6, 0x9c636ee8, 0x877473fa, 0x8e7978f4, 0xb15a49de, 0xb85742d0, 0xa3405fc2, 0xaa4d54cc, 0xecdaf741, 0xe5d7fc4f, 0xfec0e15d, 0xf7cdea53, 0xc8eedb79, 0xc1e3d077, 0xdaf4cd65, 0xd3f9c66b, 0xa4b2af31, 0xadbfa43f, 0xb6a8b92d, 0xbfa5b223, 0x80868309, 0x898b8807, 0x929c9515, 0x9b919e1b, 0x7c0a47a1, 0x75074caf, 0x6e1051bd, 0x671d5ab3, 0x583e6b99, 0x51336097, 0x4a247d85, 0x4329768b, 0x34621fd1, 0x3d6f14df, 0x267809cd, 0x2f7502c3, 0x105633e9, 0x195b38e7, 0x024c25f5, 0x0b412efb, 0xd7618c9a, 0xde6c8794, 0xc57b9a86, 0xcc769188, 0xf355a0a2, 0xfa58abac, 0xe14fb6be, 0xe842bdb0, 0x9f09d4ea, 0x9604dfe4, 0x8d13c2f6, 0x841ec9f8, 0xbb3df8d2, 0xb230f3dc, 0xa927eece, 0xa02ae5c0, 0x47b13c7a, 0x4ebc3774, 0x55ab2a66, 0x5ca62168, 0x63851042, 0x6a881b4c, 0x719f065e, 0x78920d50, 0x0fd9640a, 0x06d46f04, 0x1dc37216, 0x14ce7918, 0x2bed4832, 0x22e0433c, 0x39f75e2e, 0x30fa5520, 0x9ab701ec, 0x93ba0ae2, 0x88ad17f0, 0x81a01cfe, 0xbe832dd4, 0xb78e26da, 0xac993bc8, 0xa59430c6, 0xd2df599c, 0xdbd25292, 0xc0c54f80, 0xc9c8448e, 0xf6eb75a4, 0xffe67eaa, 0xe4f163b8, 0xedfc68b6, 0x0a67b10c, 0x036aba02, 0x187da710, 0x1170ac1e, 0x2e539d34, 0x275e963a, 0x3c498b28, 0x35448026, 0x420fe97c, 0x4b02e272, 0x5015ff60, 0x5918f46e, 0x663bc544, 0x6f36ce4a, 0x7421d358, 0x7d2cd856, 0xa10c7a37, 0xa8017139, 0xb3166c2b, 0xba1b6725, 0x8538560f, 0x8c355d01, 0x97224013, 0x9e2f4b1d, 0xe9642247, 0xe0692949, 0xfb7e345b, 0xf2733f55, 0xcd500e7f, 0xc45d0571, 0xdf4a1863, 0xd647136d, 0x31dccad7, 0x38d1c1d9, 0x23c6dccb, 0x2acbd7c5, 0x15e8e6ef, 0x1ce5ede1, 0x07f2f0f3, 0x0efffbfd, 0x79b492a7, 0x70b999a9, 0x6bae84bb, 0x62a38fb5, 0x5d80be9f, 0x548db591, 0x4f9aa883, 0x4697a38d];
    function convertToInt32(bytes) {
        const result = [];
        for (let i = 0; i < bytes.length; i += 4) {
            result.push((bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]);
        }
        return result;
    }
    class AES {
        get key() { return __classPrivateFieldGet$2(this, _AES_key, "f").slice(); }
        constructor(key) {
            _AES_key.set(this, void 0);
            _AES_Kd.set(this, void 0);
            _AES_Ke.set(this, void 0);
            if (!(this instanceof AES)) {
                throw Error('AES must be instanitated with `new`');
            }
            __classPrivateFieldSet$2(this, _AES_key, new Uint8Array(key), "f");
            const rounds = numberOfRounds[this.key.length];
            if (rounds == null) {
                throw new TypeError('invalid key size (must be 16, 24 or 32 bytes)');
            }
            // encryption round keys
            __classPrivateFieldSet$2(this, _AES_Ke, [], "f");
            // decryption round keys
            __classPrivateFieldSet$2(this, _AES_Kd, [], "f");
            for (let i = 0; i <= rounds; i++) {
                __classPrivateFieldGet$2(this, _AES_Ke, "f").push([0, 0, 0, 0]);
                __classPrivateFieldGet$2(this, _AES_Kd, "f").push([0, 0, 0, 0]);
            }
            const roundKeyCount = (rounds + 1) * 4;
            const KC = this.key.length / 4;
            // convert the key into ints
            const tk = convertToInt32(this.key);
            // copy values into round key arrays
            let index;
            for (let i = 0; i < KC; i++) {
                index = i >> 2;
                __classPrivateFieldGet$2(this, _AES_Ke, "f")[index][i % 4] = tk[i];
                __classPrivateFieldGet$2(this, _AES_Kd, "f")[rounds - index][i % 4] = tk[i];
            }
            // key expansion (fips-197 section 5.2)
            let rconpointer = 0;
            let t = KC, tt;
            while (t < roundKeyCount) {
                tt = tk[KC - 1];
                tk[0] ^= ((S[(tt >> 16) & 0xFF] << 24) ^
                    (S[(tt >> 8) & 0xFF] << 16) ^
                    (S[tt & 0xFF] << 8) ^
                    S[(tt >> 24) & 0xFF] ^
                    (rcon[rconpointer] << 24));
                rconpointer += 1;
                // key expansion (for non-256 bit)
                if (KC != 8) {
                    for (let i = 1; i < KC; i++) {
                        tk[i] ^= tk[i - 1];
                    }
                    // key expansion for 256-bit keys is "slightly different" (fips-197)
                }
                else {
                    for (let i = 1; i < (KC / 2); i++) {
                        tk[i] ^= tk[i - 1];
                    }
                    tt = tk[(KC / 2) - 1];
                    tk[KC / 2] ^= (S[tt & 0xFF] ^
                        (S[(tt >> 8) & 0xFF] << 8) ^
                        (S[(tt >> 16) & 0xFF] << 16) ^
                        (S[(tt >> 24) & 0xFF] << 24));
                    for (let i = (KC / 2) + 1; i < KC; i++) {
                        tk[i] ^= tk[i - 1];
                    }
                }
                // copy values into round key arrays
                let i = 0, r, c;
                while (i < KC && t < roundKeyCount) {
                    r = t >> 2;
                    c = t % 4;
                    __classPrivateFieldGet$2(this, _AES_Ke, "f")[r][c] = tk[i];
                    __classPrivateFieldGet$2(this, _AES_Kd, "f")[rounds - r][c] = tk[i++];
                    t++;
                }
            }
            // inverse-cipher-ify the decryption round key (fips-197 section 5.3)
            for (let r = 1; r < rounds; r++) {
                for (let c = 0; c < 4; c++) {
                    tt = __classPrivateFieldGet$2(this, _AES_Kd, "f")[r][c];
                    __classPrivateFieldGet$2(this, _AES_Kd, "f")[r][c] = (U1[(tt >> 24) & 0xFF] ^
                        U2[(tt >> 16) & 0xFF] ^
                        U3[(tt >> 8) & 0xFF] ^
                        U4[tt & 0xFF]);
                }
            }
        }
        encrypt(plaintext) {
            if (plaintext.length != 16) {
                throw new TypeError('invalid plaintext size (must be 16 bytes)');
            }
            const rounds = __classPrivateFieldGet$2(this, _AES_Ke, "f").length - 1;
            const a = [0, 0, 0, 0];
            // convert plaintext to (ints ^ key)
            let t = convertToInt32(plaintext);
            for (let i = 0; i < 4; i++) {
                t[i] ^= __classPrivateFieldGet$2(this, _AES_Ke, "f")[0][i];
            }
            // apply round transforms
            for (let r = 1; r < rounds; r++) {
                for (let i = 0; i < 4; i++) {
                    a[i] = (T1[(t[i] >> 24) & 0xff] ^
                        T2[(t[(i + 1) % 4] >> 16) & 0xff] ^
                        T3[(t[(i + 2) % 4] >> 8) & 0xff] ^
                        T4[t[(i + 3) % 4] & 0xff] ^
                        __classPrivateFieldGet$2(this, _AES_Ke, "f")[r][i]);
                }
                t = a.slice();
            }
            // the last round is special
            const result = new Uint8Array(16);
            let tt = 0;
            for (let i = 0; i < 4; i++) {
                tt = __classPrivateFieldGet$2(this, _AES_Ke, "f")[rounds][i];
                result[4 * i] = (S[(t[i] >> 24) & 0xff] ^ (tt >> 24)) & 0xff;
                result[4 * i + 1] = (S[(t[(i + 1) % 4] >> 16) & 0xff] ^ (tt >> 16)) & 0xff;
                result[4 * i + 2] = (S[(t[(i + 2) % 4] >> 8) & 0xff] ^ (tt >> 8)) & 0xff;
                result[4 * i + 3] = (S[t[(i + 3) % 4] & 0xff] ^ tt) & 0xff;
            }
            return result;
        }
        decrypt(ciphertext) {
            if (ciphertext.length != 16) {
                throw new TypeError('invalid ciphertext size (must be 16 bytes)');
            }
            const rounds = __classPrivateFieldGet$2(this, _AES_Kd, "f").length - 1;
            const a = [0, 0, 0, 0];
            // convert plaintext to (ints ^ key)
            let t = convertToInt32(ciphertext);
            for (let i = 0; i < 4; i++) {
                t[i] ^= __classPrivateFieldGet$2(this, _AES_Kd, "f")[0][i];
            }
            // apply round transforms
            for (let r = 1; r < rounds; r++) {
                for (let i = 0; i < 4; i++) {
                    a[i] = (T5[(t[i] >> 24) & 0xff] ^
                        T6[(t[(i + 3) % 4] >> 16) & 0xff] ^
                        T7[(t[(i + 2) % 4] >> 8) & 0xff] ^
                        T8[t[(i + 1) % 4] & 0xff] ^
                        __classPrivateFieldGet$2(this, _AES_Kd, "f")[r][i]);
                }
                t = a.slice();
            }
            // the last round is special
            const result = new Uint8Array(16);
            let tt = 0;
            for (let i = 0; i < 4; i++) {
                tt = __classPrivateFieldGet$2(this, _AES_Kd, "f")[rounds][i];
                result[4 * i] = (Si[(t[i] >> 24) & 0xff] ^ (tt >> 24)) & 0xff;
                result[4 * i + 1] = (Si[(t[(i + 3) % 4] >> 16) & 0xff] ^ (tt >> 16)) & 0xff;
                result[4 * i + 2] = (Si[(t[(i + 2) % 4] >> 8) & 0xff] ^ (tt >> 8)) & 0xff;
                result[4 * i + 3] = (Si[t[(i + 1) % 4] & 0xff] ^ tt) & 0xff;
            }
            return result;
        }
    }
    _AES_key = new WeakMap(), _AES_Kd = new WeakMap(), _AES_Ke = new WeakMap();

    class ModeOfOperation {
        constructor(name, key, cls) {
            if (cls && !(this instanceof cls)) {
                throw new Error(`${name} must be instantiated with "new"`);
            }
            Object.defineProperties(this, {
                aes: { enumerable: true, value: new AES(key) },
                name: { enumerable: true, value: name }
            });
        }
    }

    // Cipher Block Chaining
    var __classPrivateFieldSet$1 = (__$G && __$G.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
        if (kind === "m") throw new TypeError("Private method is not writable");
        if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
        return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
    };
    var __classPrivateFieldGet$1 = (__$G && __$G.__classPrivateFieldGet) || function (receiver, state, kind, f) {
        if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
        return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    };
    var _CBC_iv, _CBC_lastBlock;
    class CBC extends ModeOfOperation {
        constructor(key, iv) {
            super("ECC", key, CBC);
            _CBC_iv.set(this, void 0);
            _CBC_lastBlock.set(this, void 0);
            if (iv) {
                if (iv.length % 16) {
                    throw new TypeError("invalid iv size (must be 16 bytes)");
                }
                __classPrivateFieldSet$1(this, _CBC_iv, new Uint8Array(iv), "f");
            }
            else {
                __classPrivateFieldSet$1(this, _CBC_iv, new Uint8Array(16), "f");
            }
            __classPrivateFieldSet$1(this, _CBC_lastBlock, this.iv, "f");
        }
        get iv() { return new Uint8Array(__classPrivateFieldGet$1(this, _CBC_iv, "f")); }
        encrypt(plaintext) {
            if (plaintext.length % 16) {
                throw new TypeError("invalid plaintext size (must be multiple of 16 bytes)");
            }
            const ciphertext = new Uint8Array(plaintext.length);
            for (let i = 0; i < plaintext.length; i += 16) {
                for (let j = 0; j < 16; j++) {
                    __classPrivateFieldGet$1(this, _CBC_lastBlock, "f")[j] ^= plaintext[i + j];
                }
                __classPrivateFieldSet$1(this, _CBC_lastBlock, this.aes.encrypt(__classPrivateFieldGet$1(this, _CBC_lastBlock, "f")), "f");
                ciphertext.set(__classPrivateFieldGet$1(this, _CBC_lastBlock, "f"), i);
            }
            return ciphertext;
        }
        decrypt(ciphertext) {
            if (ciphertext.length % 16) {
                throw new TypeError("invalid ciphertext size (must be multiple of 16 bytes)");
            }
            const plaintext = new Uint8Array(ciphertext.length);
            for (let i = 0; i < ciphertext.length; i += 16) {
                const block = this.aes.decrypt(ciphertext.subarray(i, i + 16));
                for (let j = 0; j < 16; j++) {
                    plaintext[i + j] = block[j] ^ __classPrivateFieldGet$1(this, _CBC_lastBlock, "f")[j];
                    __classPrivateFieldGet$1(this, _CBC_lastBlock, "f")[j] = ciphertext[i + j];
                }
            }
            return plaintext;
        }
    }
    _CBC_iv = new WeakMap(), _CBC_lastBlock = new WeakMap();

    // Counter Mode
    var __classPrivateFieldSet = (__$G && __$G.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
        if (kind === "m") throw new TypeError("Private method is not writable");
        if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
        return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
    };
    var __classPrivateFieldGet = (__$G && __$G.__classPrivateFieldGet) || function (receiver, state, kind, f) {
        if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
        return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    };
    var _CTR_remaining, _CTR_remainingIndex, _CTR_counter;
    class CTR extends ModeOfOperation {
        constructor(key, initialValue) {
            super("CTR", key, CTR);
            // Remaining bytes for the one-time pad
            _CTR_remaining.set(this, void 0);
            _CTR_remainingIndex.set(this, void 0);
            // The current counter
            _CTR_counter.set(this, void 0);
            __classPrivateFieldSet(this, _CTR_counter, new Uint8Array(16), "f");
            __classPrivateFieldGet(this, _CTR_counter, "f").fill(0);
            __classPrivateFieldSet(this, _CTR_remaining, __classPrivateFieldGet(this, _CTR_counter, "f"), "f"); // This will be discarded immediately
            __classPrivateFieldSet(this, _CTR_remainingIndex, 16, "f");
            if (initialValue == null) {
                initialValue = 1;
            }
            if (typeof (initialValue) === "number") {
                this.setCounterValue(initialValue);
            }
            else {
                this.setCounterBytes(initialValue);
            }
        }
        get counter() { return new Uint8Array(__classPrivateFieldGet(this, _CTR_counter, "f")); }
        setCounterValue(value) {
            if (!Number.isInteger(value) || value < 0 || value > Number.MAX_SAFE_INTEGER) {
                throw new TypeError("invalid counter initial integer value");
            }
            for (let index = 15; index >= 0; --index) {
                __classPrivateFieldGet(this, _CTR_counter, "f")[index] = value % 256;
                value = Math.floor(value / 256);
            }
        }
        setCounterBytes(value) {
            if (value.length !== 16) {
                throw new TypeError("invalid counter initial Uint8Array value length");
            }
            __classPrivateFieldGet(this, _CTR_counter, "f").set(value);
        }
        increment() {
            for (let i = 15; i >= 0; i--) {
                if (__classPrivateFieldGet(this, _CTR_counter, "f")[i] === 255) {
                    __classPrivateFieldGet(this, _CTR_counter, "f")[i] = 0;
                }
                else {
                    __classPrivateFieldGet(this, _CTR_counter, "f")[i]++;
                    break;
                }
            }
        }
        encrypt(plaintext) {
            var _a, _b;
            const crypttext = new Uint8Array(plaintext);
            for (let i = 0; i < crypttext.length; i++) {
                if (__classPrivateFieldGet(this, _CTR_remainingIndex, "f") === 16) {
                    __classPrivateFieldSet(this, _CTR_remaining, this.aes.encrypt(__classPrivateFieldGet(this, _CTR_counter, "f")), "f");
                    __classPrivateFieldSet(this, _CTR_remainingIndex, 0, "f");
                    this.increment();
                }
                crypttext[i] ^= __classPrivateFieldGet(this, _CTR_remaining, "f")[__classPrivateFieldSet(this, _CTR_remainingIndex, (_b = __classPrivateFieldGet(this, _CTR_remainingIndex, "f"), _a = _b++, _b), "f"), _a];
            }
            return crypttext;
        }
        decrypt(ciphertext) {
            return this.encrypt(ciphertext);
        }
    }
    _CTR_remaining = new WeakMap(), _CTR_remainingIndex = new WeakMap(), _CTR_counter = new WeakMap();

    function pkcs7Strip(data) {
        if (data.length < 16) {
            throw new TypeError('PKCS#7 invalid length');
        }
        const padder = data[data.length - 1];
        if (padder > 16) {
            throw new TypeError('PKCS#7 padding byte out of range');
        }
        const length = data.length - padder;
        for (let i = 0; i < padder; i++) {
            if (data[length + i] !== padder) {
                throw new TypeError('PKCS#7 invalid padding byte');
            }
        }
        return new Uint8Array(data.subarray(0, length));
    }

    /**
     *  @_ignore
     */
    function looseArrayify(hexString) {
        if (typeof (hexString) === "string" && !hexString.startsWith("0x")) {
            hexString = "0x" + hexString;
        }
        return getBytesCopy(hexString);
    }
    function zpad$1(value, length) {
        value = String(value);
        while (value.length < length) {
            value = '0' + value;
        }
        return value;
    }
    function getPassword(password) {
        if (typeof (password) === 'string') {
            return toUtf8Bytes(password, "NFKC");
        }
        return getBytesCopy(password);
    }
    function spelunk(object, _path) {
        const match = _path.match(/^([a-z0-9$_.-]*)(:([a-z]+))?(!)?$/i);
        assertArgument(match != null, "invalid path", "path", _path);
        const path = match[1];
        const type = match[3];
        const reqd = (match[4] === "!");
        let cur = object;
        for (const comp of path.toLowerCase().split('.')) {
            // Search for a child object with a case-insensitive matching key
            if (Array.isArray(cur)) {
                if (!comp.match(/^[0-9]+$/)) {
                    break;
                }
                cur = cur[parseInt(comp)];
            }
            else if (typeof (cur) === "object") {
                let found = null;
                for (const key in cur) {
                    if (key.toLowerCase() === comp) {
                        found = cur[key];
                        break;
                    }
                }
                cur = found;
            }
            else {
                cur = null;
            }
            if (cur == null) {
                break;
            }
        }
        assertArgument(!reqd || cur != null, "missing required value", "path", path);
        if (type && cur != null) {
            if (type === "int") {
                if (typeof (cur) === "string" && cur.match(/^-?[0-9]+$/)) {
                    return parseInt(cur);
                }
                else if (Number.isSafeInteger(cur)) {
                    return cur;
                }
            }
            if (type === "number") {
                if (typeof (cur) === "string" && cur.match(/^-?[0-9.]*$/)) {
                    return parseFloat(cur);
                }
            }
            if (type === "data") {
                if (typeof (cur) === "string") {
                    return looseArrayify(cur);
                }
            }
            if (type === "array" && Array.isArray(cur)) {
                return cur;
            }
            if (type === typeof (cur)) {
                return cur;
            }
            assertArgument(false, `wrong type found for ${type} `, "path", path);
        }
        return cur;
    }
    /*
    export function follow(object: any, path: string): null | string {
        let currentChild = object;

        for (const comp of path.toLowerCase().split('/')) {

            // Search for a child object with a case-insensitive matching key
            let matchingChild = null;
            for (const key in currentChild) {
                 if (key.toLowerCase() === comp) {
                     matchingChild = currentChild[key];
                     break;
                 }
            }

            if (matchingChild === null) { return null; }

            currentChild = matchingChild;
        }

        return currentChild;
    }

    // "path/to/something:type!"
    export function followRequired(data: any, path: string): string {
        const value = follow(data, path);
        if (value != null) { return value; }
        return logger.throwArgumentError("invalid value", `data:${ path }`,
        JSON.stringify(data));
    }
    */
    // See: https://www.ietf.org/rfc/rfc4122.txt (Section 4.4)
    /*
    export function uuidV4(randomBytes: BytesLike): string {
        const bytes = getBytes(randomBytes, "randomBytes");

        // Section: 4.1.3:
        // - time_hi_and_version[12:16] = 0b0100
        bytes[6] = (bytes[6] & 0x0f) | 0x40;

        // Section 4.4
        // - clock_seq_hi_and_reserved[6] = 0b0
        // - clock_seq_hi_and_reserved[7] = 0b1
        bytes[8] = (bytes[8] & 0x3f) | 0x80;

        const value = hexlify(bytes);

        return [
           value.substring(2, 10),
           value.substring(10, 14),
           value.substring(14, 18),
           value.substring(18, 22),
           value.substring(22, 34),
        ].join("-");
    }
    */

    /**
     *  The JSON Wallet formats allow a simple way to store the private
     *  keys needed in Ethereum along with related information and allows
     *  for extensible forms of encryption.
     *
     *  These utilities facilitate decrypting and encrypting the most common
     *  JSON Wallet formats.
     *
     *  @_subsection: api/wallet:JSON Wallets  [json-wallets]
     */
    const defaultPath$1 = "m/44'/60'/0'/0/0";
    /**
     *  Returns true if %%json%% is a valid JSON Keystore Wallet.
     */
    function isKeystoreJson(json) {
        try {
            const data = JSON.parse(json);
            const version = ((data.version != null) ? parseInt(data.version) : 0);
            if (version === 3) {
                return true;
            }
        }
        catch (error) { }
        return false;
    }
    function decrypt(data, key, ciphertext) {
        const cipher = spelunk(data, "crypto.cipher:string");
        if (cipher === "aes-128-ctr") {
            const iv = spelunk(data, "crypto.cipherparams.iv:data!");
            const aesCtr = new CTR(key, iv);
            return hexlify(aesCtr.decrypt(ciphertext));
        }
        assert(false, "unsupported cipher", "UNSUPPORTED_OPERATION", {
            operation: "decrypt"
        });
    }
    function getAccount(data, _key) {
        const key = getBytes(_key);
        const ciphertext = spelunk(data, "crypto.ciphertext:data!");
        const computedMAC = hexlify(keccak256(concat([key.slice(16, 32), ciphertext]))).substring(2);
        assertArgument(computedMAC === spelunk(data, "crypto.mac:string!").toLowerCase(), "incorrect password", "password", "[ REDACTED ]");
        const privateKey = decrypt(data, key.slice(0, 16), ciphertext);
        const address = computeAddress(privateKey);
        if (data.address) {
            let check = data.address.toLowerCase();
            if (!check.startsWith("0x")) {
                check = "0x" + check;
            }
            assertArgument(getAddress(check) === address, "keystore address/privateKey mismatch", "address", data.address);
        }
        const account = { address, privateKey };
        // Version 0.1 x-ethers metadata must contain an encrypted mnemonic phrase
        const version = spelunk(data, "x-ethers.version:string");
        if (version === "0.1") {
            const mnemonicKey = key.slice(32, 64);
            const mnemonicCiphertext = spelunk(data, "x-ethers.mnemonicCiphertext:data!");
            const mnemonicIv = spelunk(data, "x-ethers.mnemonicCounter:data!");
            const mnemonicAesCtr = new CTR(mnemonicKey, mnemonicIv);
            account.mnemonic = {
                path: (spelunk(data, "x-ethers.path:string") || defaultPath$1),
                locale: (spelunk(data, "x-ethers.locale:string") || "en"),
                entropy: hexlify(getBytes(mnemonicAesCtr.decrypt(mnemonicCiphertext)))
            };
        }
        return account;
    }
    function getDecryptKdfParams(data) {
        const kdf = spelunk(data, "crypto.kdf:string");
        if (kdf && typeof (kdf) === "string") {
            if (kdf.toLowerCase() === "scrypt") {
                const salt = spelunk(data, "crypto.kdfparams.salt:data!");
                const N = spelunk(data, "crypto.kdfparams.n:int!");
                const r = spelunk(data, "crypto.kdfparams.r:int!");
                const p = spelunk(data, "crypto.kdfparams.p:int!");
                // Make sure N is a power of 2
                assertArgument(N > 0 && (N & (N - 1)) === 0, "invalid kdf.N", "kdf.N", N);
                assertArgument(r > 0 && p > 0, "invalid kdf", "kdf", kdf);
                const dkLen = spelunk(data, "crypto.kdfparams.dklen:int!");
                assertArgument(dkLen === 32, "invalid kdf.dklen", "kdf.dflen", dkLen);
                return { name: "scrypt", salt, N, r, p, dkLen: 64 };
            }
            else if (kdf.toLowerCase() === "pbkdf2") {
                const salt = spelunk(data, "crypto.kdfparams.salt:data!");
                const prf = spelunk(data, "crypto.kdfparams.prf:string!");
                const algorithm = prf.split("-").pop();
                assertArgument(algorithm === "sha256" || algorithm === "sha512", "invalid kdf.pdf", "kdf.pdf", prf);
                const count = spelunk(data, "crypto.kdfparams.c:int!");
                const dkLen = spelunk(data, "crypto.kdfparams.dklen:int!");
                assertArgument(dkLen === 32, "invalid kdf.dklen", "kdf.dklen", dkLen);
                return { name: "pbkdf2", salt, count, dkLen, algorithm };
            }
        }
        assertArgument(false, "unsupported key-derivation function", "kdf", kdf);
    }
    /**
     *  Returns the account details for the JSON Keystore Wallet %%json%%
     *  using %%password%%.
     *
     *  It is preferred to use the [async version](decryptKeystoreJson)
     *  instead, which allows a [[ProgressCallback]] to keep the user informed
     *  as to the decryption status.
     *
     *  This method will block the event loop (freezing all UI) until decryption
     *  is complete, which can take quite some time, depending on the wallet
     *  paramters and platform.
     */
    function decryptKeystoreJsonSync(json, _password) {
        const data = JSON.parse(json);
        const password = getPassword(_password);
        const params = getDecryptKdfParams(data);
        if (params.name === "pbkdf2") {
            const { salt, count, dkLen, algorithm } = params;
            const key = pbkdf2(password, salt, count, dkLen, algorithm);
            return getAccount(data, key);
        }
        assert(params.name === "scrypt", "cannot be reached", "UNKNOWN_ERROR", { params });
        const { salt, N, r, p, dkLen } = params;
        const key = scryptSync(password, salt, N, r, p, dkLen);
        return getAccount(data, key);
    }
    function stall$1(duration) {
        return new Promise((resolve) => { setTimeout(() => { resolve(); }, duration); });
    }
    /**
     *  Resolves to the decrypted JSON Keystore Wallet %%json%% using the
     *  %%password%%.
     *
     *  If provided, %%progress%% will be called periodically during the
     *  decrpytion to provide feedback, and if the function returns
     *  ``false`` will halt decryption.
     *
     *  The %%progressCallback%% will **always** receive ``0`` before
     *  decryption begins and ``1`` when complete.
     */
    async function decryptKeystoreJson(json, _password, progress) {
        const data = JSON.parse(json);
        const password = getPassword(_password);
        const params = getDecryptKdfParams(data);
        if (params.name === "pbkdf2") {
            if (progress) {
                progress(0);
                await stall$1(0);
            }
            const { salt, count, dkLen, algorithm } = params;
            const key = pbkdf2(password, salt, count, dkLen, algorithm);
            if (progress) {
                progress(1);
                await stall$1(0);
            }
            return getAccount(data, key);
        }
        assert(params.name === "scrypt", "cannot be reached", "UNKNOWN_ERROR", { params });
        const { salt, N, r, p, dkLen } = params;
        const key = await scrypt(password, salt, N, r, p, dkLen, progress);
        return getAccount(data, key);
    }
    function getEncryptKdfParams(options) {
        // Check/generate the salt
        const salt = (options.salt != null) ? getBytes(options.salt, "options.salt") : randomBytes(32);
        // Override the scrypt password-based key derivation function parameters
        let N = (1 << 17), r = 8, p = 1;
        if (options.scrypt) {
            if (options.scrypt.N) {
                N = options.scrypt.N;
            }
            if (options.scrypt.r) {
                r = options.scrypt.r;
            }
            if (options.scrypt.p) {
                p = options.scrypt.p;
            }
        }
        assertArgument(typeof (N) === "number" && N > 0 && Number.isSafeInteger(N) && (BigInt(N) & BigInt(N - 1)) === BigInt(0), "invalid scrypt N parameter", "options.N", N);
        assertArgument(typeof (r) === "number" && r > 0 && Number.isSafeInteger(r), "invalid scrypt r parameter", "options.r", r);
        assertArgument(typeof (p) === "number" && p > 0 && Number.isSafeInteger(p), "invalid scrypt p parameter", "options.p", p);
        return { name: "scrypt", dkLen: 32, salt, N, r, p };
    }
    function _encryptKeystore(key, kdf, account, options) {
        const privateKey = getBytes(account.privateKey, "privateKey");
        // Override initialization vector
        const iv = (options.iv != null) ? getBytes(options.iv, "options.iv") : randomBytes(16);
        assertArgument(iv.length === 16, "invalid options.iv length", "options.iv", options.iv);
        // Override the uuid
        const uuidRandom = (options.uuid != null) ? getBytes(options.uuid, "options.uuid") : randomBytes(16);
        assertArgument(uuidRandom.length === 16, "invalid options.uuid length", "options.uuid", options.iv);
        // This will be used to encrypt the wallet (as per Web3 secret storage)
        // - 32 bytes   As normal for the Web3 secret storage (derivedKey, macPrefix)
        // - 32 bytes   AES key to encrypt mnemonic with (required here to be Ethers Wallet)
        const derivedKey = key.slice(0, 16);
        const macPrefix = key.slice(16, 32);
        // Encrypt the private key
        const aesCtr = new CTR(derivedKey, iv);
        const ciphertext = getBytes(aesCtr.encrypt(privateKey));
        // Compute the message authentication code, used to check the password
        const mac = keccak256(concat([macPrefix, ciphertext]));
        // See: https://github.com/ethereum/wiki/wiki/Web3-Secret-Storage-Definition
        const data = {
            address: account.address.substring(2).toLowerCase(),
            id: uuidV4(uuidRandom),
            version: 3,
            Crypto: {
                cipher: "aes-128-ctr",
                cipherparams: {
                    iv: hexlify(iv).substring(2),
                },
                ciphertext: hexlify(ciphertext).substring(2),
                kdf: "scrypt",
                kdfparams: {
                    salt: hexlify(kdf.salt).substring(2),
                    n: kdf.N,
                    dklen: 32,
                    p: kdf.p,
                    r: kdf.r
                },
                mac: mac.substring(2)
            }
        };
        // If we have a mnemonic, encrypt it into the JSON wallet
        if (account.mnemonic) {
            const client = (options.client != null) ? options.client : `ethers/${version}`;
            const path = account.mnemonic.path || defaultPath$1;
            const locale = account.mnemonic.locale || "en";
            const mnemonicKey = key.slice(32, 64);
            const entropy = getBytes(account.mnemonic.entropy, "account.mnemonic.entropy");
            const mnemonicIv = randomBytes(16);
            const mnemonicAesCtr = new CTR(mnemonicKey, mnemonicIv);
            const mnemonicCiphertext = getBytes(mnemonicAesCtr.encrypt(entropy));
            const now = new Date();
            const timestamp = (now.getUTCFullYear() + "-" +
                zpad$1(now.getUTCMonth() + 1, 2) + "-" +
                zpad$1(now.getUTCDate(), 2) + "T" +
                zpad$1(now.getUTCHours(), 2) + "-" +
                zpad$1(now.getUTCMinutes(), 2) + "-" +
                zpad$1(now.getUTCSeconds(), 2) + ".0Z");
            const gethFilename = ("UTC--" + timestamp + "--" + data.address);
            data["x-ethers"] = {
                client, gethFilename, path, locale,
                mnemonicCounter: hexlify(mnemonicIv).substring(2),
                mnemonicCiphertext: hexlify(mnemonicCiphertext).substring(2),
                version: "0.1"
            };
        }
        return JSON.stringify(data);
    }
    /**
     *  Return the JSON Keystore Wallet for %%account%% encrypted with
     *  %%password%%.
     *
     *  The %%options%% can be used to tune the password-based key
     *  derivation function parameters, explicitly set the random values
     *  used. Any provided [[ProgressCallback]] is ignord.
     */
    function encryptKeystoreJsonSync(account, password, options) {
        if (options == null) {
            options = {};
        }
        const passwordBytes = getPassword(password);
        const kdf = getEncryptKdfParams(options);
        const key = scryptSync(passwordBytes, kdf.salt, kdf.N, kdf.r, kdf.p, 64);
        return _encryptKeystore(getBytes(key), kdf, account, options);
    }
    /**
     *  Resolved to the JSON Keystore Wallet for %%account%% encrypted
     *  with %%password%%.
     *
     *  The %%options%% can be used to tune the password-based key
     *  derivation function parameters, explicitly set the random values
     *  used and provide a [[ProgressCallback]] to receive periodic updates
     *  on the completion status..
     */
    async function encryptKeystoreJson(account, password, options) {
        if (options == null) {
            options = {};
        }
        const passwordBytes = getPassword(password);
        const kdf = getEncryptKdfParams(options);
        const key = await scrypt(passwordBytes, kdf.salt, kdf.N, kdf.r, kdf.p, 64, options.progressCallback);
        return _encryptKeystore(getBytes(key), kdf, account, options);
    }

    /**
     *  Explain HD Wallets..
     *
     *  @_subsection: api/wallet:HD Wallets  [hd-wallets]
     */
    /**
     *  The default derivation path for Ethereum HD Nodes. (i.e. ``"m/44'/60'/0'/0/0"``)
     */
    const defaultPath = "m/44'/60'/0'/0/0";
    // "Bitcoin seed"
    const MasterSecret = new Uint8Array([66, 105, 116, 99, 111, 105, 110, 32, 115, 101, 101, 100]);
    const HardenedBit = 0x80000000;
    const N = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
    const Nibbles = "0123456789abcdef";
    function zpad(value, length) {
        let result = "";
        while (value) {
            result = Nibbles[value % 16] + result;
            value = Math.trunc(value / 16);
        }
        while (result.length < length * 2) {
            result = "0" + result;
        }
        return "0x" + result;
    }
    function encodeBase58Check(_value) {
        const value = getBytes(_value);
        const check = dataSlice(sha256(sha256(value)), 0, 4);
        const bytes = concat([value, check]);
        return encodeBase58(bytes);
    }
    const _guard = {};
    function ser_I(index, chainCode, publicKey, privateKey) {
        const data = new Uint8Array(37);
        if (index & HardenedBit) {
            assert(privateKey != null, "cannot derive child of neutered node", "UNSUPPORTED_OPERATION", {
                operation: "deriveChild"
            });
            // Data = 0x00 || ser_256(k_par)
            data.set(getBytes(privateKey), 1);
        }
        else {
            // Data = ser_p(point(k_par))
            data.set(getBytes(publicKey));
        }
        // Data += ser_32(i)
        for (let i = 24; i >= 0; i -= 8) {
            data[33 + (i >> 3)] = ((index >> (24 - i)) & 0xff);
        }
        const I = getBytes(computeHmac("sha512", chainCode, data));
        return { IL: I.slice(0, 32), IR: I.slice(32) };
    }
    function derivePath(node, path) {
        const components = path.split("/");
        assertArgument(components.length > 0 && (components[0] === "m" || node.depth > 0), "invalid path", "path", path);
        if (components[0] === "m") {
            components.shift();
        }
        let result = node;
        for (let i = 0; i < components.length; i++) {
            const component = components[i];
            if (component.match(/^[0-9]+'$/)) {
                const index = parseInt(component.substring(0, component.length - 1));
                assertArgument(index < HardenedBit, "invalid path index", `path[${i}]`, component);
                result = result.deriveChild(HardenedBit + index);
            }
            else if (component.match(/^[0-9]+$/)) {
                const index = parseInt(component);
                assertArgument(index < HardenedBit, "invalid path index", `path[${i}]`, component);
                result = result.deriveChild(index);
            }
            else {
                assertArgument(false, "invalid path component", `path[${i}]`, component);
            }
        }
        return result;
    }
    /**
     *  An **HDNodeWallet** is a [[Signer]] backed by the private key derived
     *  from an HD Node using the [[link-bip-32]] stantard.
     *
     *  An HD Node forms a hierarchal structure with each HD Node having a
     *  private key and the ability to derive child HD Nodes, defined by
     *  a path indicating the index of each child.
     */
    class HDNodeWallet extends BaseWallet {
        /**
         *  The compressed public key.
         */
        publicKey;
        /**
         *  The fingerprint.
         *
         *  A fingerprint allows quick qay to detect parent and child nodes,
         *  but developers should be prepared to deal with collisions as it
         *  is only 4 bytes.
         */
        fingerprint;
        /**
         *  The parent fingerprint.
         */
        parentFingerprint;
        /**
         *  The mnemonic used to create this HD Node, if available.
         *
         *  Sources such as extended keys do not encode the mnemonic, in
         *  which case this will be ``null``.
         */
        mnemonic;
        /**
         *  The chaincode, which is effectively a public key used
         *  to derive children.
         */
        chainCode;
        /**
         *  The derivation path of this wallet.
         *
         *  Since extended keys do not provider full path details, this
         *  may be ``null``, if instantiated from a source that does not
         *  enocde it.
         */
        path;
        /**
         *  The child index of this wallet. Values over ``2 *\* 31`` indicate
         *  the node is hardened.
         */
        index;
        /**
         *  The depth of this wallet, which is the number of components
         *  in its path.
         */
        depth;
        /**
         *  @private
         */
        constructor(guard, signingKey, parentFingerprint, chainCode, path, index, depth, mnemonic, provider) {
            super(signingKey, provider);
            assertPrivate(guard, _guard, "HDNodeWallet");
            defineProperties(this, { publicKey: signingKey.compressedPublicKey });
            const fingerprint = dataSlice(ripemd160(sha256(this.publicKey)), 0, 4);
            defineProperties(this, {
                parentFingerprint, fingerprint,
                chainCode, path, index, depth
            });
            defineProperties(this, { mnemonic });
        }
        connect(provider) {
            return new HDNodeWallet(_guard, this.signingKey, this.parentFingerprint, this.chainCode, this.path, this.index, this.depth, this.mnemonic, provider);
        }
        #account() {
            const account = { address: this.address, privateKey: this.privateKey };
            const m = this.mnemonic;
            if (this.path && m && m.wordlist.locale === "en" && m.password === "") {
                account.mnemonic = {
                    path: this.path,
                    locale: "en",
                    entropy: m.entropy
                };
            }
            return account;
        }
        /**
         *  Resolves to a [JSON Keystore Wallet](json-wallets) encrypted with
         *  %%password%%.
         *
         *  If %%progressCallback%% is specified, it will receive periodic
         *  updates as the encryption process progreses.
         */
        async encrypt(password, progressCallback) {
            return await encryptKeystoreJson(this.#account(), password, { progressCallback });
        }
        /**
         *  Returns a [JSON Keystore Wallet](json-wallets) encryped with
         *  %%password%%.
         *
         *  It is preferred to use the [async version](encrypt) instead,
         *  which allows a [[ProgressCallback]] to keep the user informed.
         *
         *  This method will block the event loop (freezing all UI) until
         *  it is complete, which may be a non-trivial duration.
         */
        encryptSync(password) {
            return encryptKeystoreJsonSync(this.#account(), password);
        }
        /**
         *  The extended key.
         *
         *  This key will begin with the prefix ``xpriv`` and can be used to
         *  reconstruct this HD Node to derive its children.
         */
        get extendedKey() {
            // We only support the mainnet values for now, but if anyone needs
            // testnet values, let me know. I believe current sentiment is that
            // we should always use mainnet, and use BIP-44 to derive the network
            //   - Mainnet: public=0x0488B21E, private=0x0488ADE4
            //   - Testnet: public=0x043587CF, private=0x04358394
            assert(this.depth < 256, "Depth too deep", "UNSUPPORTED_OPERATION", { operation: "extendedKey" });
            return encodeBase58Check(concat([
                "0x0488ADE4", zpad(this.depth, 1), this.parentFingerprint,
                zpad(this.index, 4), this.chainCode,
                concat(["0x00", this.privateKey])
            ]));
        }
        /**
         *  Returns true if this wallet has a path, providing a Type Guard
         *  that the path is non-null.
         */
        hasPath() { return (this.path != null); }
        /**
         *  Returns a neutered HD Node, which removes the private details
         *  of an HD Node.
         *
         *  A neutered node has no private key, but can be used to derive
         *  child addresses and other public data about the HD Node.
         */
        neuter() {
            return new HDNodeVoidWallet(_guard, this.address, this.publicKey, this.parentFingerprint, this.chainCode, this.path, this.index, this.depth, this.provider);
        }
        /**
         *  Return the child for %%index%%.
         */
        deriveChild(_index) {
            const index = getNumber(_index, "index");
            assertArgument(index <= 0xffffffff, "invalid index", "index", index);
            // Base path
            let path = this.path;
            if (path) {
                path += "/" + (index & ~HardenedBit);
                if (index & HardenedBit) {
                    path += "'";
                }
            }
            const { IR, IL } = ser_I(index, this.chainCode, this.publicKey, this.privateKey);
            const ki = new SigningKey(toBeHex((toBigInt(IL) + BigInt(this.privateKey)) % N, 32));
            return new HDNodeWallet(_guard, ki, this.fingerprint, hexlify(IR), path, index, this.depth + 1, this.mnemonic, this.provider);
        }
        /**
         *  Return the HDNode for %%path%% from this node.
         */
        derivePath(path) {
            return derivePath(this, path);
        }
        static #fromSeed(_seed, mnemonic) {
            assertArgument(isBytesLike(_seed), "invalid seed", "seed", "[REDACTED]");
            const seed = getBytes(_seed, "seed");
            assertArgument(seed.length >= 16 && seed.length <= 64, "invalid seed", "seed", "[REDACTED]");
            const I = getBytes(computeHmac("sha512", MasterSecret, seed));
            const signingKey = new SigningKey(hexlify(I.slice(0, 32)));
            return new HDNodeWallet(_guard, signingKey, "0x00000000", hexlify(I.slice(32)), "m", 0, 0, mnemonic, null);
        }
        /**
         *  Creates a new HD Node from %%extendedKey%%.
         *
         *  If the %%extendedKey%% will either have a prefix or ``xpub`` or
         *  ``xpriv``, returning a neutered HD Node ([[HDNodeVoidWallet]])
         *  or full HD Node ([[HDNodeWallet) respectively.
         */
        static fromExtendedKey(extendedKey) {
            const bytes = toBeArray(decodeBase58(extendedKey)); // @TODO: redact
            assertArgument(bytes.length === 82 || encodeBase58Check(bytes.slice(0, 78)) === extendedKey, "invalid extended key", "extendedKey", "[ REDACTED ]");
            const depth = bytes[4];
            const parentFingerprint = hexlify(bytes.slice(5, 9));
            const index = parseInt(hexlify(bytes.slice(9, 13)).substring(2), 16);
            const chainCode = hexlify(bytes.slice(13, 45));
            const key = bytes.slice(45, 78);
            switch (hexlify(bytes.slice(0, 4))) {
                // Public Key
                case "0x0488b21e":
                case "0x043587cf": {
                    const publicKey = hexlify(key);
                    return new HDNodeVoidWallet(_guard, computeAddress(publicKey), publicKey, parentFingerprint, chainCode, null, index, depth, null);
                }
                // Private Key
                case "0x0488ade4":
                case "0x04358394 ":
                    if (key[0] !== 0) {
                        break;
                    }
                    return new HDNodeWallet(_guard, new SigningKey(key.slice(1)), parentFingerprint, chainCode, null, index, depth, null, null);
            }
            assertArgument(false, "invalid extended key prefix", "extendedKey", "[ REDACTED ]");
        }
        /**
         *  Creates a new random HDNode.
         */
        static createRandom(password, path, wordlist) {
            if (password == null) {
                password = "";
            }
            if (path == null) {
                path = defaultPath;
            }
            if (wordlist == null) {
                wordlist = LangEn.wordlist();
            }
            const mnemonic = Mnemonic.fromEntropy(randomBytes(16), password, wordlist);
            return HDNodeWallet.#fromSeed(mnemonic.computeSeed(), mnemonic).derivePath(path);
        }
        /**
         *  Create an HD Node from %%mnemonic%%.
         */
        static fromMnemonic(mnemonic, path) {
            if (!path) {
                path = defaultPath;
            }
            return HDNodeWallet.#fromSeed(mnemonic.computeSeed(), mnemonic).derivePath(path);
        }
        /**
         *  Creates an HD Node from a mnemonic %%phrase%%.
         */
        static fromPhrase(phrase, password, path, wordlist) {
            if (password == null) {
                password = "";
            }
            if (path == null) {
                path = defaultPath;
            }
            if (wordlist == null) {
                wordlist = LangEn.wordlist();
            }
            const mnemonic = Mnemonic.fromPhrase(phrase, password, wordlist);
            return HDNodeWallet.#fromSeed(mnemonic.computeSeed(), mnemonic).derivePath(path);
        }
        /**
         *  Creates an HD Node from a %%seed%%.
         */
        static fromSeed(seed) {
            return HDNodeWallet.#fromSeed(seed, null);
        }
    }
    /**
     *  A **HDNodeVoidWallet** cannot sign, but provides access to
     *  the children nodes of a [[link-bip-32]] HD wallet addresses.
     *
     *  The can be created by using an extended ``xpub`` key to
     *  [[HDNodeWallet_fromExtendedKey]] or by
     *  [nuetering](HDNodeWallet-neuter) a [[HDNodeWallet]].
     */
    class HDNodeVoidWallet extends VoidSigner {
        /**
         *  The compressed public key.
         */
        publicKey;
        /**
         *  The fingerprint.
         *
         *  A fingerprint allows quick qay to detect parent and child nodes,
         *  but developers should be prepared to deal with collisions as it
         *  is only 4 bytes.
         */
        fingerprint;
        /**
         *  The parent node fingerprint.
         */
        parentFingerprint;
        /**
         *  The chaincode, which is effectively a public key used
         *  to derive children.
         */
        chainCode;
        /**
         *  The derivation path of this wallet.
         *
         *  Since extended keys do not provider full path details, this
         *  may be ``null``, if instantiated from a source that does not
         *  enocde it.
         */
        path;
        /**
         *  The child index of this wallet. Values over ``2 *\* 31`` indicate
         *  the node is hardened.
         */
        index;
        /**
         *  The depth of this wallet, which is the number of components
         *  in its path.
         */
        depth;
        /**
         *  @private
         */
        constructor(guard, address, publicKey, parentFingerprint, chainCode, path, index, depth, provider) {
            super(address, provider);
            assertPrivate(guard, _guard, "HDNodeVoidWallet");
            defineProperties(this, { publicKey });
            const fingerprint = dataSlice(ripemd160(sha256(publicKey)), 0, 4);
            defineProperties(this, {
                publicKey, fingerprint, parentFingerprint, chainCode, path, index, depth
            });
        }
        connect(provider) {
            return new HDNodeVoidWallet(_guard, this.address, this.publicKey, this.parentFingerprint, this.chainCode, this.path, this.index, this.depth, provider);
        }
        /**
         *  The extended key.
         *
         *  This key will begin with the prefix ``xpub`` and can be used to
         *  reconstruct this neutered key to derive its children addresses.
         */
        get extendedKey() {
            // We only support the mainnet values for now, but if anyone needs
            // testnet values, let me know. I believe current sentiment is that
            // we should always use mainnet, and use BIP-44 to derive the network
            //   - Mainnet: public=0x0488B21E, private=0x0488ADE4
            //   - Testnet: public=0x043587CF, private=0x04358394
            assert(this.depth < 256, "Depth too deep", "UNSUPPORTED_OPERATION", { operation: "extendedKey" });
            return encodeBase58Check(concat([
                "0x0488B21E",
                zpad(this.depth, 1),
                this.parentFingerprint,
                zpad(this.index, 4),
                this.chainCode,
                this.publicKey,
            ]));
        }
        /**
         *  Returns true if this wallet has a path, providing a Type Guard
         *  that the path is non-null.
         */
        hasPath() { return (this.path != null); }
        /**
         *  Return the child for %%index%%.
         */
        deriveChild(_index) {
            const index = getNumber(_index, "index");
            assertArgument(index <= 0xffffffff, "invalid index", "index", index);
            // Base path
            let path = this.path;
            if (path) {
                path += "/" + (index & ~HardenedBit);
                if (index & HardenedBit) {
                    path += "'";
                }
            }
            const { IR, IL } = ser_I(index, this.chainCode, this.publicKey, null);
            const Ki = SigningKey.addPoints(IL, this.publicKey, true);
            const address = computeAddress(Ki);
            return new HDNodeVoidWallet(_guard, address, Ki, this.fingerprint, hexlify(IR), path, index, this.depth + 1, this.provider);
        }
        /**
         *  Return the signer for %%path%% from this node.
         */
        derivePath(path) {
            return derivePath(this, path);
        }
    }
    /*
    export class HDNodeWalletManager {
        #root: HDNodeWallet;

        constructor(phrase: string, password?: null | string, path?: null | string, locale?: null | Wordlist) {
            if (password == null) { password = ""; }
            if (path == null) { path = "m/44'/60'/0'/0"; }
            if (locale == null) { locale = LangEn.wordlist(); }
            this.#root = HDNodeWallet.fromPhrase(phrase, password, path, locale);
        }

        getSigner(index?: number): HDNodeWallet {
            return this.#root.deriveChild((index == null) ? 0: index);
        }
    }
    */
    /**
     *  Returns the [[link-bip-32]] path for the account at %%index%%.
     *
     *  This is the pattern used by wallets like Ledger.
     *
     *  There is also an [alternate pattern](getIndexedAccountPath) used by
     *  some software.
     */
    function getAccountPath(_index) {
        const index = getNumber(_index, "index");
        assertArgument(index >= 0 && index < HardenedBit, "invalid account index", "index", index);
        return `m/44'/60'/${index}'/0/0`;
    }
    /**
     *  Returns the path using an alternative pattern for deriving accounts,
     *  at %%index%%.
     *
     *  This derivation path uses the //index// component rather than the
     *  //account// component to derive sequential accounts.
     *
     *  This is the pattern used by wallets like MetaMask.
     */
    function getIndexedAccountPath(_index) {
        const index = getNumber(_index, "index");
        assertArgument(index >= 0 && index < HardenedBit, "invalid account index", "index", index);
        return `m/44'/60'/0'/0/${index}`;
    }

    /**
     *  @_subsection: api/wallet:JSON Wallets  [json-wallets]
     */
    /**
     *  Returns true if %%json%% is a valid JSON Crowdsale wallet.
     */
    function isCrowdsaleJson(json) {
        try {
            const data = JSON.parse(json);
            if (data.encseed) {
                return true;
            }
        }
        catch (error) { }
        return false;
    }
    // See: https://github.com/ethereum/pyethsaletool
    /**
     *  Before Ethereum launched, it was necessary to create a wallet
     *  format for backers to use, which would be used to receive ether
     *  as a reward for contributing to the project.
     *
     *  The [[link-crowdsale]] format is now obsolete, but it is still
     *  useful to support and the additional code is fairly trivial as
     *  all the primitives required are used through core portions of
     *  the library.
     */
    function decryptCrowdsaleJson(json, _password) {
        const data = JSON.parse(json);
        const password = getPassword(_password);
        // Ethereum Address
        const address = getAddress(spelunk(data, "ethaddr:string!"));
        // Encrypted Seed
        const encseed = looseArrayify(spelunk(data, "encseed:string!"));
        assertArgument(encseed && (encseed.length % 16) === 0, "invalid encseed", "json", json);
        const key = getBytes(pbkdf2(password, password, 2000, 32, "sha256")).slice(0, 16);
        const iv = encseed.slice(0, 16);
        const encryptedSeed = encseed.slice(16);
        // Decrypt the seed
        const aesCbc = new CBC(key, iv);
        const seed = pkcs7Strip(getBytes(aesCbc.decrypt(encryptedSeed)));
        // This wallet format is weird... Convert the binary encoded hex to a string.
        let seedHex = "";
        for (let i = 0; i < seed.length; i++) {
            seedHex += String.fromCharCode(seed[i]);
        }
        return { address, privateKey: id(seedHex) };
    }

    function stall(duration) {
        return new Promise((resolve) => { setTimeout(() => { resolve(); }, duration); });
    }
    /**
     *  A **Wallet** manages a single private key which is used to sign
     *  transactions, messages and other common payloads.
     *
     *  This class is generally the main entry point for developers
     *  that wish to use a private key directly, as it can create
     *  instances from a large variety of common sources, including
     *  raw private key, [[link-bip-39]] mnemonics and encrypte JSON
     *  wallets.
     */
    class Wallet extends BaseWallet {
        /**
         *  Create a new wallet for the private %%key%%, optionally connected
         *  to %%provider%%.
         */
        constructor(key, provider) {
            if (typeof (key) === "string" && !key.startsWith("0x")) {
                key = "0x" + key;
            }
            let signingKey = (typeof (key) === "string") ? new SigningKey(key) : key;
            super(signingKey, provider);
        }
        connect(provider) {
            return new Wallet(this.signingKey, provider);
        }
        /**
         *  Resolves to a [JSON Keystore Wallet](json-wallets) encrypted with
         *  %%password%%.
         *
         *  If %%progressCallback%% is specified, it will receive periodic
         *  updates as the encryption process progreses.
         */
        async encrypt(password, progressCallback) {
            const account = { address: this.address, privateKey: this.privateKey };
            return await encryptKeystoreJson(account, password, { progressCallback });
        }
        /**
         *  Returns a [JSON Keystore Wallet](json-wallets) encryped with
         *  %%password%%.
         *
         *  It is preferred to use the [async version](encrypt) instead,
         *  which allows a [[ProgressCallback]] to keep the user informed.
         *
         *  This method will block the event loop (freezing all UI) until
         *  it is complete, which may be a non-trivial duration.
         */
        encryptSync(password) {
            const account = { address: this.address, privateKey: this.privateKey };
            return encryptKeystoreJsonSync(account, password);
        }
        static #fromAccount(account) {
            assertArgument(account, "invalid JSON wallet", "json", "[ REDACTED ]");
            if ("mnemonic" in account && account.mnemonic && account.mnemonic.locale === "en") {
                const mnemonic = Mnemonic.fromEntropy(account.mnemonic.entropy);
                const wallet = HDNodeWallet.fromMnemonic(mnemonic, account.mnemonic.path);
                if (wallet.address === account.address && wallet.privateKey === account.privateKey) {
                    return wallet;
                }
                console.log("WARNING: JSON mismatch address/privateKey != mnemonic; fallback onto private key");
            }
            const wallet = new Wallet(account.privateKey);
            assertArgument(wallet.address === account.address, "address/privateKey mismatch", "json", "[ REDACTED ]");
            return wallet;
        }
        /**
         *  Creates (asynchronously) a **Wallet** by decrypting the %%json%%
         *  with %%password%%.
         *
         *  If %%progress%% is provided, it is called periodically during
         *  decryption so that any UI can be updated.
         */
        static async fromEncryptedJson(json, password, progress) {
            let account = null;
            if (isKeystoreJson(json)) {
                account = await decryptKeystoreJson(json, password, progress);
            }
            else if (isCrowdsaleJson(json)) {
                if (progress) {
                    progress(0);
                    await stall(0);
                }
                account = decryptCrowdsaleJson(json, password);
                if (progress) {
                    progress(1);
                    await stall(0);
                }
            }
            return Wallet.#fromAccount(account);
        }
        /**
         *  Creates a **Wallet** by decrypting the %%json%% with %%password%%.
         *
         *  The [[fromEncryptedJson]] method is preferred, as this method
         *  will lock up and freeze the UI during decryption, which may take
         *  some time.
         */
        static fromEncryptedJsonSync(json, password) {
            let account = null;
            if (isKeystoreJson(json)) {
                account = decryptKeystoreJsonSync(json, password);
            }
            else if (isCrowdsaleJson(json)) {
                account = decryptCrowdsaleJson(json, password);
            }
            else {
                assertArgument(false, "invalid JSON wallet", "json", "[ REDACTED ]");
            }
            return Wallet.#fromAccount(account);
        }
        /**
         *  Creates a new random [[HDNodeWallet]] using the available
         *  [cryptographic random source](randomBytes).
         *
         *  If there is no crytographic random source, this will throw.
         */
        static createRandom(provider) {
            const wallet = HDNodeWallet.createRandom();
            if (provider) {
                return wallet.connect(provider);
            }
            return wallet;
        }
        /**
         *  Creates a [[HDNodeWallet]] for %%phrase%%.
         */
        static fromPhrase(phrase, provider) {
            const wallet = HDNodeWallet.fromPhrase(phrase);
            if (provider) {
                return wallet.connect(provider);
            }
            return wallet;
        }
    }

    const Base64 = ")!@#$%^&*(ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
    /**
     *  @_ignore
     */
    function decodeBits(width, data) {
        const maxValue = (1 << width) - 1;
        const result = [];
        let accum = 0, bits = 0, flood = 0;
        for (let i = 0; i < data.length; i++) {
            // Accumulate 6 bits of data
            accum = ((accum << 6) | Base64.indexOf(data[i]));
            bits += 6;
            // While we have enough for a word...
            while (bits >= width) {
                // ...read the word
                const value = (accum >> (bits - width));
                accum &= (1 << (bits - width)) - 1;
                bits -= width;
                // A value of 0 indicates we exceeded maxValue, it
                // floods over into the next value
                if (value === 0) {
                    flood += maxValue;
                }
                else {
                    result.push(value + flood);
                    flood = 0;
                }
            }
        }
        return result;
    }

    /**
     *  @_ignore
     */
    function decodeOwlA(data, accents) {
        let words = decodeOwl(data).join(",");
        // Inject the accents
        accents.split(/,/g).forEach((accent) => {
            const match = accent.match(/^([a-z]*)([0-9]+)([0-9])(.*)$/);
            assertArgument(match !== null, "internal error parsing accents", "accents", accents);
            let posOffset = 0;
            const positions = decodeBits(parseInt(match[3]), match[4]);
            const charCode = parseInt(match[2]);
            const regex = new RegExp(`([${match[1]}])`, "g");
            words = words.replace(regex, (all, letter) => {
                const rem = --positions[posOffset];
                if (rem === 0) {
                    letter = String.fromCharCode(letter.charCodeAt(0), charCode);
                    posOffset++;
                }
                return letter;
            });
        });
        return words.split(",");
    }

    /**
     *  An OWL-A format Wordlist extends the OWL format to add an
     *  overlay onto an OWL format Wordlist to support diacritic
     *  marks.
     *
     *  This class is generally not useful to most developers as
     *  it is used mainly internally to keep Wordlists for languages
     *  based on latin-1 small.
     *
     *  If necessary, there are tools within the ``generation/`` folder
     *  to create the necessary data.
     */
    class WordlistOwlA extends WordlistOwl {
        #accent;
        /**
         *  Creates a new Wordlist for %%locale%% using the OWLA %%data%%
         *  and %%accent%% data and validated against the %%checksum%%.
         */
        constructor(locale, data, accent, checksum) {
            super(locale, data, checksum);
            this.#accent = accent;
        }
        /**
         *  The OWLA-encoded accent data.
         */
        get _accent() { return this.#accent; }
        /**
         *  Decode all the words for the wordlist.
         */
        _decodeWords() {
            return decodeOwlA(this._data, this._accent);
        }
    }

    const wordlists = {
        en: LangEn.wordlist(),
    };

    /////////////////////////////
    //

    var ethers = /*#__PURE__*/Object.freeze({
        __proto__: null,
        AbiCoder: AbiCoder,
        AbstractProvider: AbstractProvider,
        AbstractSigner: AbstractSigner,
        BaseContract: BaseContract,
        BaseWallet: BaseWallet,
        Block: Block,
        BrowserProvider: BrowserProvider,
        ConstructorFragment: ConstructorFragment,
        Contract: Contract,
        ContractEventPayload: ContractEventPayload,
        ContractFactory: ContractFactory,
        ContractTransactionReceipt: ContractTransactionReceipt,
        ContractTransactionResponse: ContractTransactionResponse,
        ContractUnknownEventPayload: ContractUnknownEventPayload,
        EnsPlugin: EnsPlugin,
        EnsResolver: EnsResolver,
        ErrorDescription: ErrorDescription,
        ErrorFragment: ErrorFragment,
        EtherSymbol: EtherSymbol,
        EventFragment: EventFragment,
        EventLog: EventLog,
        EventPayload: EventPayload,
        FallbackFragment: FallbackFragment,
        FallbackProvider: FallbackProvider,
        FeeData: FeeData,
        FeeDataNetworkPlugin: FeeDataNetworkPlugin,
        FetchCancelSignal: FetchCancelSignal,
        FetchRequest: FetchRequest,
        FetchResponse: FetchResponse,
        FetchUrlFeeDataNetworkPlugin: FetchUrlFeeDataNetworkPlugin,
        FixedNumber: FixedNumber,
        Fragment: Fragment,
        FunctionFragment: FunctionFragment,
        GasCostPlugin: GasCostPlugin,
        HDNodeVoidWallet: HDNodeVoidWallet,
        HDNodeWallet: HDNodeWallet,
        Indexed: Indexed,
        Interface: Interface,
        IpcSocketProvider: IpcSocketProvider,
        JsonRpcApiProvider: JsonRpcApiProvider,
        JsonRpcProvider: JsonRpcProvider,
        JsonRpcSigner: JsonRpcSigner,
        LangEn: LangEn,
        Log: Log,
        LogDescription: LogDescription,
        MaxInt256: MaxInt256,
        MaxUint256: MaxUint256,
        MessagePrefix: MessagePrefix,
        MinInt256: MinInt256,
        Mnemonic: Mnemonic,
        MulticoinProviderPlugin: MulticoinProviderPlugin,
        N: N$1,
        NamedFragment: NamedFragment,
        Network: Network,
        NetworkPlugin: NetworkPlugin,
        NonceManager: NonceManager,
        ParamType: ParamType,
        Result: Result,
        Signature: Signature,
        SigningKey: SigningKey,
        SocketBlockSubscriber: SocketBlockSubscriber,
        SocketEventSubscriber: SocketEventSubscriber,
        SocketPendingSubscriber: SocketPendingSubscriber,
        SocketProvider: SocketProvider,
        SocketSubscriber: SocketSubscriber,
        StructFragment: StructFragment,
        Transaction: Transaction,
        TransactionDescription: TransactionDescription,
        TransactionReceipt: TransactionReceipt,
        TransactionResponse: TransactionResponse,
        Typed: Typed,
        TypedDataEncoder: TypedDataEncoder,
        UndecodedEventLog: UndecodedEventLog,
        UnmanagedSubscriber: UnmanagedSubscriber,
        Utf8ErrorFuncs: Utf8ErrorFuncs,
        VoidSigner: VoidSigner,
        Wallet: Wallet,
        WebSocketProvider: WebSocketProvider,
        WeiPerEther: WeiPerEther,
        Wordlist: Wordlist,
        WordlistOwl: WordlistOwl,
        WordlistOwlA: WordlistOwlA,
        ZeroAddress: ZeroAddress,
        ZeroHash: ZeroHash,
        accessListify: accessListify,
        assert: assert,
        assertArgument: assertArgument,
        assertArgumentCount: assertArgumentCount,
        assertNormalize: assertNormalize,
        assertPrivate: assertPrivate,
        checkResultErrors: checkResultErrors,
        computeAddress: computeAddress,
        computeHmac: computeHmac,
        concat: concat,
        copyRequest: copyRequest,
        dataLength: dataLength,
        dataSlice: dataSlice,
        decodeBase58: decodeBase58,
        decodeBase64: decodeBase64,
        decodeBytes32String: decodeBytes32String,
        decodeRlp: decodeRlp,
        decryptCrowdsaleJson: decryptCrowdsaleJson,
        decryptKeystoreJson: decryptKeystoreJson,
        decryptKeystoreJsonSync: decryptKeystoreJsonSync,
        defaultPath: defaultPath,
        defineProperties: defineProperties,
        dnsEncode: dnsEncode,
        encodeBase58: encodeBase58,
        encodeBase64: encodeBase64,
        encodeBytes32String: encodeBytes32String,
        encodeRlp: encodeRlp,
        encryptKeystoreJson: encryptKeystoreJson,
        encryptKeystoreJsonSync: encryptKeystoreJsonSync,
        ensNormalize: ensNormalize,
        formatEther: formatEther,
        formatUnits: formatUnits,
        fromTwos: fromTwos,
        getAccountPath: getAccountPath,
        getAddress: getAddress,
        getBigInt: getBigInt,
        getBytes: getBytes,
        getBytesCopy: getBytesCopy,
        getCreate2Address: getCreate2Address,
        getCreateAddress: getCreateAddress,
        getDefaultProvider: getDefaultProvider,
        getIcapAddress: getIcapAddress,
        getIndexedAccountPath: getIndexedAccountPath,
        getNumber: getNumber,
        getUint: getUint,
        hashMessage: hashMessage,
        hexlify: hexlify,
        id: id,
        isAddress: isAddress,
        isAddressable: isAddressable,
        isBytesLike: isBytesLike,
        isCallException: isCallException,
        isCrowdsaleJson: isCrowdsaleJson,
        isError: isError,
        isHexString: isHexString,
        isKeystoreJson: isKeystoreJson,
        isValidName: isValidName,
        keccak256: keccak256,
        lock: lock,
        makeError: makeError,
        mask: mask,
        namehash: namehash,
        parseEther: parseEther,
        parseUnits: parseUnits$1,
        pbkdf2: pbkdf2,
        randomBytes: randomBytes,
        recoverAddress: recoverAddress,
        resolveAddress: resolveAddress,
        resolveProperties: resolveProperties,
        ripemd160: ripemd160,
        scrypt: scrypt,
        scryptSync: scryptSync,
        sha256: sha256,
        sha512: sha512,
        showThrottleMessage: showThrottleMessage,
        solidityPacked: solidityPacked,
        solidityPackedKeccak256: solidityPackedKeccak256,
        solidityPackedSha256: solidityPackedSha256,
        stripZerosLeft: stripZerosLeft,
        toBeArray: toBeArray,
        toBeHex: toBeHex,
        toBigInt: toBigInt,
        toNumber: toNumber,
        toQuantity: toQuantity,
        toTwos: toTwos,
        toUtf8Bytes: toUtf8Bytes,
        toUtf8CodePoints: toUtf8CodePoints,
        toUtf8String: toUtf8String,
        uuidV4: uuidV4,
        verifyMessage: verifyMessage,
        verifyTypedData: verifyTypedData,
        version: version,
        wordlists: wordlists,
        zeroPadBytes: zeroPadBytes,
        zeroPadValue: zeroPadValue
    });

    exports.AbiCoder = AbiCoder;
    exports.AbstractProvider = AbstractProvider;
    exports.AbstractSigner = AbstractSigner;
    exports.BaseContract = BaseContract;
    exports.BaseWallet = BaseWallet;
    exports.Block = Block;
    exports.BrowserProvider = BrowserProvider;
    exports.ConstructorFragment = ConstructorFragment;
    exports.Contract = Contract;
    exports.ContractEventPayload = ContractEventPayload;
    exports.ContractFactory = ContractFactory;
    exports.ContractTransactionReceipt = ContractTransactionReceipt;
    exports.ContractTransactionResponse = ContractTransactionResponse;
    exports.ContractUnknownEventPayload = ContractUnknownEventPayload;
    exports.EnsPlugin = EnsPlugin;
    exports.EnsResolver = EnsResolver;
    exports.ErrorDescription = ErrorDescription;
    exports.ErrorFragment = ErrorFragment;
    exports.EtherSymbol = EtherSymbol;
    exports.EventFragment = EventFragment;
    exports.EventLog = EventLog;
    exports.EventPayload = EventPayload;
    exports.FallbackFragment = FallbackFragment;
    exports.FallbackProvider = FallbackProvider;
    exports.FeeData = FeeData;
    exports.FeeDataNetworkPlugin = FeeDataNetworkPlugin;
    exports.FetchCancelSignal = FetchCancelSignal;
    exports.FetchRequest = FetchRequest;
    exports.FetchResponse = FetchResponse;
    exports.FetchUrlFeeDataNetworkPlugin = FetchUrlFeeDataNetworkPlugin;
    exports.FixedNumber = FixedNumber;
    exports.Fragment = Fragment;
    exports.FunctionFragment = FunctionFragment;
    exports.GasCostPlugin = GasCostPlugin;
    exports.HDNodeVoidWallet = HDNodeVoidWallet;
    exports.HDNodeWallet = HDNodeWallet;
    exports.Indexed = Indexed;
    exports.Interface = Interface;
    exports.IpcSocketProvider = IpcSocketProvider;
    exports.JsonRpcApiProvider = JsonRpcApiProvider;
    exports.JsonRpcProvider = JsonRpcProvider;
    exports.JsonRpcSigner = JsonRpcSigner;
    exports.LangEn = LangEn;
    exports.Log = Log;
    exports.LogDescription = LogDescription;
    exports.MaxInt256 = MaxInt256;
    exports.MaxUint256 = MaxUint256;
    exports.MessagePrefix = MessagePrefix;
    exports.MinInt256 = MinInt256;
    exports.Mnemonic = Mnemonic;
    exports.MulticoinProviderPlugin = MulticoinProviderPlugin;
    exports.N = N$1;
    exports.NamedFragment = NamedFragment;
    exports.Network = Network;
    exports.NetworkPlugin = NetworkPlugin;
    exports.NonceManager = NonceManager;
    exports.ParamType = ParamType;
    exports.Result = Result;
    exports.Signature = Signature;
    exports.SigningKey = SigningKey;
    exports.SocketBlockSubscriber = SocketBlockSubscriber;
    exports.SocketEventSubscriber = SocketEventSubscriber;
    exports.SocketPendingSubscriber = SocketPendingSubscriber;
    exports.SocketProvider = SocketProvider;
    exports.SocketSubscriber = SocketSubscriber;
    exports.StructFragment = StructFragment;
    exports.Transaction = Transaction;
    exports.TransactionDescription = TransactionDescription;
    exports.TransactionReceipt = TransactionReceipt;
    exports.TransactionResponse = TransactionResponse;
    exports.Typed = Typed;
    exports.TypedDataEncoder = TypedDataEncoder;
    exports.UndecodedEventLog = UndecodedEventLog;
    exports.UnmanagedSubscriber = UnmanagedSubscriber;
    exports.Utf8ErrorFuncs = Utf8ErrorFuncs;
    exports.VoidSigner = VoidSigner;
    exports.Wallet = Wallet;
    exports.WebSocketProvider = WebSocketProvider;
    exports.WeiPerEther = WeiPerEther;
    exports.Wordlist = Wordlist;
    exports.WordlistOwl = WordlistOwl;
    exports.WordlistOwlA = WordlistOwlA;
    exports.ZeroAddress = ZeroAddress;
    exports.ZeroHash = ZeroHash;
    exports.accessListify = accessListify;
    exports.assert = assert;
    exports.assertArgument = assertArgument;
    exports.assertArgumentCount = assertArgumentCount;
    exports.assertNormalize = assertNormalize;
    exports.assertPrivate = assertPrivate;
    exports.checkResultErrors = checkResultErrors;
    exports.computeAddress = computeAddress;
    exports.computeHmac = computeHmac;
    exports.concat = concat;
    exports.copyRequest = copyRequest;
    exports.dataLength = dataLength;
    exports.dataSlice = dataSlice;
    exports.decodeBase58 = decodeBase58;
    exports.decodeBase64 = decodeBase64;
    exports.decodeBytes32String = decodeBytes32String;
    exports.decodeRlp = decodeRlp;
    exports.decryptCrowdsaleJson = decryptCrowdsaleJson;
    exports.decryptKeystoreJson = decryptKeystoreJson;
    exports.decryptKeystoreJsonSync = decryptKeystoreJsonSync;
    exports.defaultPath = defaultPath;
    exports.defineProperties = defineProperties;
    exports.dnsEncode = dnsEncode;
    exports.encodeBase58 = encodeBase58;
    exports.encodeBase64 = encodeBase64;
    exports.encodeBytes32String = encodeBytes32String;
    exports.encodeRlp = encodeRlp;
    exports.encryptKeystoreJson = encryptKeystoreJson;
    exports.encryptKeystoreJsonSync = encryptKeystoreJsonSync;
    exports.ensNormalize = ensNormalize;
    exports.ethers = ethers;
    exports.formatEther = formatEther;
    exports.formatUnits = formatUnits;
    exports.fromTwos = fromTwos;
    exports.getAccountPath = getAccountPath;
    exports.getAddress = getAddress;
    exports.getBigInt = getBigInt;
    exports.getBytes = getBytes;
    exports.getBytesCopy = getBytesCopy;
    exports.getCreate2Address = getCreate2Address;
    exports.getCreateAddress = getCreateAddress;
    exports.getDefaultProvider = getDefaultProvider;
    exports.getIcapAddress = getIcapAddress;
    exports.getIndexedAccountPath = getIndexedAccountPath;
    exports.getNumber = getNumber;
    exports.getUint = getUint;
    exports.hashMessage = hashMessage;
    exports.hexlify = hexlify;
    exports.id = id;
    exports.isAddress = isAddress;
    exports.isAddressable = isAddressable;
    exports.isBytesLike = isBytesLike;
    exports.isCallException = isCallException;
    exports.isCrowdsaleJson = isCrowdsaleJson;
    exports.isError = isError;
    exports.isHexString = isHexString;
    exports.isKeystoreJson = isKeystoreJson;
    exports.isValidName = isValidName;
    exports.keccak256 = keccak256;
    exports.lock = lock;
    exports.makeError = makeError;
    exports.mask = mask;
    exports.namehash = namehash;
    exports.parseEther = parseEther;
    exports.parseUnits = parseUnits$1;
    exports.pbkdf2 = pbkdf2;
    exports.randomBytes = randomBytes;
    exports.recoverAddress = recoverAddress;
    exports.resolveAddress = resolveAddress;
    exports.resolveProperties = resolveProperties;
    exports.ripemd160 = ripemd160;
    exports.scrypt = scrypt;
    exports.scryptSync = scryptSync;
    exports.sha256 = sha256;
    exports.sha512 = sha512;
    exports.showThrottleMessage = showThrottleMessage;
    exports.solidityPacked = solidityPacked;
    exports.solidityPackedKeccak256 = solidityPackedKeccak256;
    exports.solidityPackedSha256 = solidityPackedSha256;
    exports.stripZerosLeft = stripZerosLeft;
    exports.toBeArray = toBeArray;
    exports.toBeHex = toBeHex;
    exports.toBigInt = toBigInt;
    exports.toNumber = toNumber;
    exports.toQuantity = toQuantity;
    exports.toTwos = toTwos;
    exports.toUtf8Bytes = toUtf8Bytes;
    exports.toUtf8CodePoints = toUtf8CodePoints;
    exports.toUtf8String = toUtf8String;
    exports.uuidV4 = uuidV4;
    exports.verifyMessage = verifyMessage;
    exports.verifyTypedData = verifyTypedData;
    exports.version = version;
    exports.wordlists = wordlists;
    exports.zeroPadBytes = zeroPadBytes;
    exports.zeroPadValue = zeroPadValue;

}));
//# sourceMappingURL=ethers.umd.js.map
