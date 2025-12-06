//% weight=100 color=#0fbc11 icon="\uf005"
namespace VJsonManager {

    /**
     * Very small JSON-like object for MakeCode.
     * Stores everything as strings internally.
     */
    export class JsonObject {
        private _keys: string[];
        private _values: string[];

        constructor() {
            this._keys = [];
            this._values = [];
        }

        /**
         * Parse a simple JSON object string into a JsonObject.
         * Supports: {"k":123,"b":true,"s":"text"}
         */
        //% blockId=json_parse block="parse json %json"
        static parse(json: string): JsonObject {
            let obj = new JsonObject();

            if (!json) return obj;

            json = json.trim();
            if (json.length < 2) return obj;
            if (json.charAt(0) != "{" || json.charAt(json.length - 1) != "}") {
                // not an object, return empty
                return obj;
            }

            let i = 1; // skip '{'
            while (i < json.length - 1) {
                // skip whitespace and commas
                while (i < json.length &&
                    (json.charAt(i) == " " ||
                        json.charAt(i) == "\n" ||
                        json.charAt(i) == "\r" ||
                        json.charAt(i) == "\t" ||
                        json.charAt(i) == ",")) {
                    i++;
                }

                if (i >= json.length - 1) break;

                // --- Parse key ---
                if (json.charAt(i) != "\"") {
                    // invalid key, stop
                    break;
                }
                i++; // skip opening quote
                let keyStart = i;
                while (i < json.length && json.charAt(i) != "\"") {
                    // (no full escape handling, keep it simple)
                    i++;
                }
                let key = json.substr(keyStart, i - keyStart);
                i++; // skip closing quote

                // skip whitespace
                while (i < json.length &&
                    (json.charAt(i) == " " ||
                        json.charAt(i) == "\n" ||
                        json.charAt(i) == "\r" ||
                        json.charAt(i) == "\t")) {
                    i++;
                }

                // expect colon
                if (i >= json.length || json.charAt(i) != ":") {
                    break;
                }
                i++; // skip ':'

                // skip whitespace
                while (i < json.length &&
                    (json.charAt(i) == " " ||
                        json.charAt(i) == "\n" ||
                        json.charAt(i) == "\r" ||
                        json.charAt(i) == "\t")) {
                    i++;
                }

                if (i >= json.length - 1) break;

                // --- Parse value ---
                let value: string;

                if (json.charAt(i) == "\"") {
                    // string value
                    i++;
                    let valStart = i;
                    while (i < json.length && json.charAt(i) != "\"") {
                        // again, simple; no full escaping
                        i++;
                    }
                    value = json.substr(valStart, i - valStart);
                    i++; // skip closing quote
                } else {
                    // number / true / false / null (no commas or '}' inside)
                    let valStart = i;
                    while (i < json.length &&
                        json.charAt(i) != "," &&
                        json.charAt(i) != "}") {
                        i++;
                    }
                    value = json.substr(valStart, i - valStart).trim();
                }
                JsonObject.set(key, value, obj);
                // loop continues, next iteration will eat the comma / '}' / whitespace
            }

            return obj;
        }

        /**
         * Serialize this object to a JSON string.
         */
        //% blockId=json_to_string block="to json string %obj"
        toString(): string {
            let result = "{";
            for (let i = 0; i < this._keys.length; i++) {
                if (i > 0) result = result + ",";
                result = result + "\"" + this._keys[i] + "\":";

                let v = this._values[i] === undefined ? this._values[i] : "";

                // Decide if we should emit as bare value or quoted string
                let isNum = true;
                if (v.length == 0) isNum = false;
                for (let j = 0; j < v.length; j++) {
                    let c = v.charAt(j);
                    if (!((c >= "0" && c <= "9") || c == "-" || c == ".")) {
                        isNum = false;
                        break;
                    }
                }

                if (isNum || v == "true" || v == "false" || v == "null") {
                    // bare literal
                    result = result + v;
                } else {
                    // string: escape quotes and backslashes minimally
                    let escaped = "";
                    for (let j = 0; j < v.length; j++) {
                        let c = v.charAt(j);
                        if (c == "\\" || c == "\"") {
                            escaped = escaped + "\\";
                        }
                        escaped = escaped + c;
                    }
                    result = result + "\"" + escaped + "\"";
                }
            }
            result = result + "}";
            return result;
        }

        /**
         * Convenience static wrapper for stringify.
         */
        //% blockId=json_stringify block="stringify json object %obj from %json"
        static stringify(obj: JsonObject): string {
            return obj.toString();
        }

        /**
         * Determines if the specified key exists within the collection.
         * @param key
         * @param json
         * @returns
         */
        //% blockId=json_containsKey block="json contains %key from %json"
        static containsKey(key: string, json: JsonObject): boolean {
            return JsonObject.includes(key, json._keys);
        }

        static includes(value: any, array: any[]) {
            for(let i=0;i<array.length;i++) {
                if(array[i]===value)
                    return true;
            }
            return false;
        }
        /**
         * Determines if the specified value exists within the collection.
         * @param value
         * @param json
         * @returns
         */
        //% blockId=json_containsValue block="json contains %value from %json"
        static containsValue(value: any, json: JsonObject): boolean {
            return JsonObject.includes(value, json._values);
        }

        /**
         * Set value (stored as string internally).
         */
        //% blockId=json_set block="json set %key to %value from %json"
        static set(key: string, value: string, json: JsonObject): void {
            let index = json.indexOfKey(key);
            if (index >= 0) {
                json._values[index] = value;
            } else {
                json._keys.push(key);
                json._values.push(value);
            }
        }

        /**
         * Basic string getter.
         */
        //% blockId=json_get block="json get %key from %json"
        static get(key: string, json: JsonObject): any {
            let index = json.indexOfKey(key);
            if (index >= 0)
                return json._values[index] === undefined ? "" : json._values[index];
            return "";
        }

        /**
         * Get a number value (parseInt).
         */
        //% blockId=json_get_number block="json get number %key from %json"
        static getNumber(key: string, json: JsonObject): number {
            let v = JsonObject.get(key, json);
            return parseInt(v);
        }

        /**
         * Get a boolean value ("true"/"false").
         */
        //% blockId=json_get_bool block="json get boolean %key from %json"
        static getBoolean(key: string, json: JsonObject): boolean {
            let v = JsonObject.get(key, json);
            return v == "true";
        }

        /**
         * Determines if the given value is a valid json string.
         * @param jsonString
         * @returns
         */
        //% blockId=json_isValidJsonString block="json is %jsonString a valid JSON string"
        static isValidJsonString(jsonString: string): boolean {
            try {
                JsonObject.parse(jsonString);
                return true;
            } catch {
                return false;
            }
        }

        /**
         * Returns a copy of the keys array.
         */
        //% blockId=json_keys block="json keys of %obj"
        keys(): string[] {
            let copy: string[] = [];
            for (let i = 0; i < this._keys.length; i++) {
                copy.push(this._keys[i] === undefined ? "" : this._keys[i]);
            }
            return copy;
        }

        /**
         * Returns a copy of the values array (as strings).
         */
        //% blockId=json_values block="json values of %obj"
        values(): any[] {
            let copy: any[] = [];
            for (let i = 0; i < this._values.length; i++) {
                copy.push(this._values[i]);
            }
            return copy;
        }

        /**
         * Iterate over all key/value pairs.
         */
        //% blockId=json_foreach block="for each key/value in %obj run %handler"
        forEach(handler: (key: string, value: any) => void): void {
            for (let i = 0; i < this._keys.length; i++) {
                handler(this._keys[i]===undefined ? "" : this._keys[i], this._values[i]);
            }
        }

        private indexOfKey(key: string): number {
            for (let i = 0; i < this._keys.length; i++) {
                if (this._keys[i] == key)
                    return i;
            }
            return -1;
        }
    }

    /**
     * Deserializes a string value into it's JsonObject representation.
     * @param value The string value to deserialize.
     * @returns {JsonObject}
     */
    //% block="deserialize %value"
    export function deserializeJson(value: string): JsonObject {
        return JsonObject.parse(value);
    }
    /**
     * Converts the JsonObject into it's string representation.
     * @param value The JsonObject to serialize.
     * @returns {string}
     */
    //% block="serialize %value"
    export function serializeJson(value: JsonObject): string {
        return JsonObject.stringify(value);
    }
}
