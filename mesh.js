/*jslint maxerr: 50, indent: 4, nomen: true, plusplus: true */
/*global print, _, moment, db, ObjectId, hostname */
/*!
 * mesh - the MongoDB Extended Shell
 * 
 *	          Version: 1.4.2 
 *		         Date: February 07, 2013
 *	          Project: http://skratchdot.com/projects/mesh/
 *        Source Code: https://github.com/skratchdot/mesh/
 *	           Issues: https://github.com/skratchdot/mesh/issues/
 * Included Libraries: https://github.com/skratchdot/mesh/#whats-included
 *       Dependencies: MongoDB v1.8+
 * 
 * Copyright 2012 <skratchdot.com>
 *   Dual licensed under the MIT or GPL Version 2 licenses.
 *   https://raw.github.com/skratchdot/mesh/master/LICENSE-MIT.txt
 *   https://raw.github.com/skratchdot/mesh/master/LICENSE-GPL.txt
 * 
 */
var mesh = (function (global) {
	'use strict';

	var api,
		lastTime = null,
		config = {
			defaultPrompt : 0,	// 0-4 or a string
			aliases : {}		// can pass in a map of aliases. see: mesh.setAliases();
		};

	/*
	 * This is the "mesh" function. If someone types: mesh(), then we will just
	 * print the current version info.
	 */
	api = function () {
		return api.version();
	};

	/*
	 * Override mesh.toString() so it calls mesh.help();
	 */
	api.toString = function () {
		api.help();
		return "";
	};

	/*
	 * We can override the default settings by calling this function.
	 * 
	 * The idea is to keep a "mesh.config.js" file that calls this function.
	 * 
	 * When updating mesh.js, we will never override mesh.config.js
	 */
	api.config = function (settings) {
		// Handle defaultPrompt
		if (settings.hasOwnProperty('defaultPrompt')) {
			config.defaultPrompt = settings.defaultPrompt;
			api.prompt(config.defaultPrompt);
		}
		if (settings.hasOwnProperty('aliases') && typeof settings.aliases === 'object') {
			api.setAliases(settings.aliases);
		}
	};

	/*
	 * Print the current version
	 */
	api.version = function () {
		return print('mesh (the MongoDB Extended Shell) version: 1.4.2');
	};

	/*
	 * Print help information.
	 * 
	 * TODO: make sure that "help mesh" works as well by overriding default mongo help()
	 */
	api.help = function () {
		api.version();
		print('help coming soon!');
	};

	/*
	 * Accept a map of aliases.  The keys are the aliases, and the values
	 * are the paths to the variable.
	 * 
	 * For instance, if we want to create an aliase for mesh.keys() to be k(), then
	 * we can call:
	 * 
	 *	 mesh.setAliases({'k':'mesh.keys'});
	 * 
	 * We can create an alias for printjson() by doing something like:
	 * 
	 *	 mesh.setAliases({'pj':'printjson'});
	 * 
	 */
	api.setAliases = function (aliases) {
		var alias, keys, i, skip, obj;

		// do nothing if we weren't passed key/value pairs
		if (typeof aliases !== 'object') {
			return;
		}

		// loop through our aliases
		for (alias in aliases) {
			if (aliases.hasOwnProperty(alias)) {
				// we process dot delimited strings
				keys = aliases[alias];
				if (typeof keys === 'string' && keys.length > 0) {
					// we will drill down into the dot delimited string.
					// if the given variable path doesn't exist, let's
					// try to process the next alias
					skip = false;
					obj = global;
					keys = keys.split('.');
					for (i = 0; i < keys.length; i++) {
						if (obj && obj[keys[i]]) {
							obj = obj[keys[i]];
						} else {
							i = keys.length;
							skip = true;
						}
					}
					if (!skip) {
						global[alias] = obj;
					}
				}
			}
		}
	};

	/*
	 * Sets the default prompt.
	 * 
	 * See: http://www.kchodorow.com/blog/2011/06/27/ps1/
	 * 
	 * newPrompt can be a function, or a number:
	 * 
	 *   0: '>' reset to default prompt
	 *   1: 'dbname>'
	 *   2: 'dbname>' for PRIMARY, '(dbname)>' for SECONDARY
	 *   3: 'host:dbname>'
	 *   4: '[YYYY-MM-DD hh:mm:ss] host:dbname>'
	 */
	api.prompt = function (newPrompt) {
		var base = '> ';
		if (typeof newPrompt === 'function') {
			global.prompt = newPrompt;
		} else if (newPrompt === 1) {
			global.prompt = function () {
				return db.getName() + base;
			};
		} else if (newPrompt === 2) {
			global.prompt = function () {
				var isMaster = db.isMaster().ismaster;
				return (isMaster ? '' : '(') +
					db.getName() +
					(isMaster ? '' : ')') +
					base;
			};
		} else if (newPrompt === 3) {
			global.prompt = function () {
				var isMaster = db.isMaster().ismaster;
				return (isMaster ? '' : '(') +
					hostname() + ":" +
					db.getName() +
					(isMaster ? '' : ')') +
					base;
			};
		} else if (newPrompt === 4) {
			global.prompt = function () {
				var isMaster = db.isMaster().ismaster;
				return '[' + moment().format('YYYY-MM-DD hh:mm:ss') + '] ' +
					(isMaster ? '' : '(') +
					db.serverStatus().host + ":" +
					db.getName() +
					(isMaster ? '' : ')') +
					base;
			};
		} else if (typeof newPrompt === 'string') {
			global.prompt = function () {
				return newPrompt;
			};
		} else {
			delete global.prompt;
		}
	};

	/*
	 * A simple wrapper for ObjectId();
	 */
	api.oid = function (oidString) {
		if (typeof oidString === 'string') {
			return new ObjectId(oidString);
		}
		return new ObjectId();
	};

	/*
	 * Generate an ObjectId() based on a time stamp.
	 *
	 * usage:
	 *
	 *		 // pass in nothing to get an ObjectId based on the current timestamp
	 *		 mesh.tid();
	 *		 // you can pass in any valid Date object
	 *		 mesh.tid(new Date());
	 *		 // you can pass in any valid moment object
	 *		 mesh.tid(moment());
	 *		 mesh.tid('2 minutes ago');
	 *		 mesh.tid('June 1, 2012'); // returns ObjectId("4fc83e400000000000000000")
	 *		 // you can pass in an optional increment value
	 *		 mesh.tid('June 1, 2012', 3); // returns ObjectId("4fc83e400000000000000003")
	 *
	 * see:
	 *
	 *		 http://www.kchodorow.com/blog/2011/12/20/querying-for-timestamps-using-objectids/
	 *		 http://www.mongodb.org/display/DOCS/Object+IDs
	 *
	 * ObjectIds are 12-byte BSON objects:
	 *
	 * TimeStamp [bytes 0-3]:
	 *		 This is a unix style timestamp. It is a signed int representing
	 *		 the number of seconds before or after January 1st 1970 (UTC).
	 *
	 * Machine [bytes 4-6]
	 *		 This is the first three bytes of the (md5) hash of the machine host
	 *		 name, or of the mac/network address, or the virtual machine id.
	 *
	 * Pid [bytes 7-8]
	 *		 This is 2 bytes of the process id (or thread id) of the process
	 *		 generating the ObjectId.
	 *
	 * Increment [bytes 9-11]
	 *		 This is an ever incrementing value starting with a random number.
	 */
	api.tid = function (newMoment, inc) {
		var theDate, seconds, hexSecs, hexInc;

		// build timestamp portion of ObjectId
		newMoment = moment(newMoment);
		if (newMoment && newMoment.isValid && newMoment.isValid()) {
			theDate = newMoment.toDate();
		} else {
			theDate = new Date();
		}
		seconds = parseInt(theDate.getTime() / 1000, 10);
		hexSecs = seconds.toString(16);

		// build increment portion of ObjectId
		if (typeof inc !== 'number') {
			inc = 0;
		}
		hexInc = _.lpad(parseInt(inc, 10).toString(16), 3, '0').substring(0, 3);
		return new ObjectId(hexSecs + '0000000000000' + hexInc);
	};

	/*
	 * Returns a sorted array of all the keys in an object
	 */
	api.keys = function (obj) {
		return _.keys(obj || global).sort();
	};

	/*
	 * If passed a function, it will display the function execution time.
	 * 
	 * If passed anything else, it will just print the current time.
	 * 
	 * This function keeps track of the last time it was called, and will output
	 * how long it's been since the last time it was called.
	 */
	api.time = function (obj) {
		var start = moment(),
			formatString = 'YYYY-MM-DD hh:mm:ss a';

		// Current Time
		print('Current Time: ' + start.format(formatString));

		// Last time called
		if (lastTime !== null) {
			print('Last time called ' + lastTime.fromNow() + ' [' + start.format(formatString) + ']');
		}

		// Execute function if one is passed
		if (typeof obj === 'function') {
			print('Executing function...');
			obj.apply();
			print(' Started ' + start.fromNow());
			print('Finished: ' + moment().format(formatString));
		}

		// Save last time
		lastTime = start;
	};

	return api;
}(this));
/*global print */
/*jslint maxerr: 50, indent: 4, plusplus: true */
/**
 * console.js - a quick wrapper so console calls don't error out in the mongodb shell
 * 
 * All console calls are currently just wrappers for the built in print() function that
 * comes with the mongo shell.  Eventually, it would be good to add "real" behavior to
 * the console calls.  For instance, console.error() should wrap ThrowError(), and console.timer()
 * should work as well.
 * 
 */
(function (global) {
	'use strict';

	var i = 0,
		functionNames = [
			'assert', 'clear', 'count', 'debug', 'dir',
			'dirxml', 'error', 'exception', 'group', 'groupCollapsed',
			'groupEnd', 'info', 'log', 'profile', 'profileEnd', 'table',
			'time', 'timeEnd', 'timeStamp', 'trace', 'warn'
		],
		wrapperFunction = function () {
			print.apply(global, arguments);
		};

	// Make sure console exists
	global.console = global.console || {};

	// Make sure all functions exist
	for (i = 0; i < functionNames.length; i++) {
		global.console[functionNames[i]] = global.console[functionNames[i]] || wrapperFunction;
	}

}(this));
/*
    json2.js
    2012-10-08

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (typeof JSON !== 'object') {
    JSON = {};
}

(function () {
    'use strict';

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());
/*
    cycle.js
    2012-08-19

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

/*jslint evil: true, regexp: true */

/*members $ref, apply, call, decycle, hasOwnProperty, length, prototype, push,
    retrocycle, stringify, test, toString
*/

if (typeof JSON.decycle !== 'function') {
    JSON.decycle = function decycle(object) {
        'use strict';

// Make a deep copy of an object or array, assuring that there is at most
// one instance of each object or array in the resulting structure. The
// duplicate references (which might be forming cycles) are replaced with
// an object of the form
//      {$ref: PATH}
// where the PATH is a JSONPath string that locates the first occurance.
// So,
//      var a = [];
//      a[0] = a;
//      return JSON.stringify(JSON.decycle(a));
// produces the string '[{"$ref":"$"}]'.

// JSONPath is used to locate the unique object. $ indicates the top level of
// the object or array. [NUMBER] or [STRING] indicates a child member or
// property.

        var objects = [],   // Keep a reference to each unique object or array
            paths = [];     // Keep the path to each unique object or array

        return (function derez(value, path) {

// The derez recurses through the object, producing the deep copy.

            var i,          // The loop counter
                name,       // Property name
                nu;         // The new object or array

            switch (typeof value) {
            case 'object':

// typeof null === 'object', so get out if this value is not really an object.
// Also get out if it is a weird builtin object.

                if (value === null ||
                        value instanceof Boolean ||
                        value instanceof Date    ||
                        value instanceof Number  ||
                        value instanceof RegExp  ||
                        value instanceof String) {
                    return value;
                }

// If the value is an object or array, look to see if we have already
// encountered it. If so, return a $ref/path object. This is a hard way,
// linear search that will get slower as the number of unique objects grows.

                for (i = 0; i < objects.length; i += 1) {
                    if (objects[i] === value) {
                        return {$ref: paths[i]};
                    }
                }

// Otherwise, accumulate the unique value and its path.

                objects.push(value);
                paths.push(path);

// If it is an array, replicate the array.

                if (Object.prototype.toString.apply(value) === '[object Array]') {
                    nu = [];
                    for (i = 0; i < value.length; i += 1) {
                        nu[i] = derez(value[i], path + '[' + i + ']');
                    }
                } else {

// If it is an object, replicate the object.

                    nu = {};
                    for (name in value) {
                        if (Object.prototype.hasOwnProperty.call(value, name)) {
                            nu[name] = derez(value[name],
                                path + '[' + JSON.stringify(name) + ']');
                        }
                    }
                }
                return nu;
            case 'number':
            case 'string':
            case 'boolean':
                return value;
            }
        }(object, '$'));
    };
}


if (typeof JSON.retrocycle !== 'function') {
    JSON.retrocycle = function retrocycle($) {
        'use strict';

// Restore an object that was reduced by decycle. Members whose values are
// objects of the form
//      {$ref: PATH}
// are replaced with references to the value found by the PATH. This will
// restore cycles. The object will be mutated.

// The eval function is used to locate the values described by a PATH. The
// root object is kept in a $ variable. A regular expression is used to
// assure that the PATH is extremely well formed. The regexp contains nested
// * quantifiers. That has been known to have extremely bad performance
// problems on some browsers for very long strings. A PATH is expected to be
// reasonably short. A PATH is allowed to belong to a very restricted subset of
// Goessner's JSONPath.

// So,
//      var s = '[{"$ref":"$"}]';
//      return JSON.retrocycle(JSON.parse(s));
// produces an array containing a single element which is the array itself.

        var px =
            /^\$(?:\[(?:\d+|\"(?:[^\\\"\u0000-\u001f]|\\([\\\"\/bfnrt]|u[0-9a-zA-Z]{4}))*\")\])*$/;

        (function rez(value) {

// The rez function walks recursively through the object looking for $ref
// properties. When it finds one that has a value that is a path, then it
// replaces the $ref object with a reference to the value that is found by
// the path.

            var i, item, name, path;

            if (value && typeof value === 'object') {
                if (Object.prototype.toString.apply(value) === '[object Array]') {
                    for (i = 0; i < value.length; i += 1) {
                        item = value[i];
                        if (item && typeof item === 'object') {
                            path = item.$ref;
                            if (typeof path === 'string' && px.test(path)) {
                                value[i] = eval(path);
                            } else {
                                rez(item);
                            }
                        }
                    }
                } else {
                    for (name in value) {
                        if (typeof value[name] === 'object') {
                            item = value[name];
                            if (item) {
                                path = item.$ref;
                                if (typeof path === 'string' && px.test(path)) {
                                    value[name] = eval(path);
                                } else {
                                    rez(item);
                                }
                            }
                        }
                    }
                }
            }
        }($));
        return $;
    };
}
(function(){var n=this,t=n._,r={},e=Array.prototype,u=Object.prototype,i=Function.prototype,a=e.push,o=e.slice,c=e.concat,l=u.toString,f=u.hasOwnProperty,s=e.forEach,p=e.map,h=e.reduce,v=e.reduceRight,d=e.filter,g=e.every,m=e.some,y=e.indexOf,b=e.lastIndexOf,x=Array.isArray,_=Object.keys,j=i.bind,w=function(n){return n instanceof w?n:this instanceof w?(this._wrapped=n,void 0):new w(n)};"undefined"!=typeof exports?("undefined"!=typeof module&&module.exports&&(exports=module.exports=w),exports._=w):n._=w,w.VERSION="1.4.4";var A=w.each=w.forEach=function(n,t,e){if(null!=n)if(s&&n.forEach===s)n.forEach(t,e);else if(n.length===+n.length){for(var u=0,i=n.length;i>u;u++)if(t.call(e,n[u],u,n)===r)return}else for(var a in n)if(w.has(n,a)&&t.call(e,n[a],a,n)===r)return};w.map=w.collect=function(n,t,r){var e=[];return null==n?e:p&&n.map===p?n.map(t,r):(A(n,function(n,u,i){e[e.length]=t.call(r,n,u,i)}),e)};var O="Reduce of empty array with no initial value";w.reduce=w.foldl=w.inject=function(n,t,r,e){var u=arguments.length>2;if(null==n&&(n=[]),h&&n.reduce===h)return e&&(t=w.bind(t,e)),u?n.reduce(t,r):n.reduce(t);if(A(n,function(n,i,a){u?r=t.call(e,r,n,i,a):(r=n,u=!0)}),!u)throw new TypeError(O);return r},w.reduceRight=w.foldr=function(n,t,r,e){var u=arguments.length>2;if(null==n&&(n=[]),v&&n.reduceRight===v)return e&&(t=w.bind(t,e)),u?n.reduceRight(t,r):n.reduceRight(t);var i=n.length;if(i!==+i){var a=w.keys(n);i=a.length}if(A(n,function(o,c,l){c=a?a[--i]:--i,u?r=t.call(e,r,n[c],c,l):(r=n[c],u=!0)}),!u)throw new TypeError(O);return r},w.find=w.detect=function(n,t,r){var e;return E(n,function(n,u,i){return t.call(r,n,u,i)?(e=n,!0):void 0}),e},w.filter=w.select=function(n,t,r){var e=[];return null==n?e:d&&n.filter===d?n.filter(t,r):(A(n,function(n,u,i){t.call(r,n,u,i)&&(e[e.length]=n)}),e)},w.reject=function(n,t,r){return w.filter(n,function(n,e,u){return!t.call(r,n,e,u)},r)},w.every=w.all=function(n,t,e){t||(t=w.identity);var u=!0;return null==n?u:g&&n.every===g?n.every(t,e):(A(n,function(n,i,a){return(u=u&&t.call(e,n,i,a))?void 0:r}),!!u)};var E=w.some=w.any=function(n,t,e){t||(t=w.identity);var u=!1;return null==n?u:m&&n.some===m?n.some(t,e):(A(n,function(n,i,a){return u||(u=t.call(e,n,i,a))?r:void 0}),!!u)};w.contains=w.include=function(n,t){return null==n?!1:y&&n.indexOf===y?n.indexOf(t)!=-1:E(n,function(n){return n===t})},w.invoke=function(n,t){var r=o.call(arguments,2),e=w.isFunction(t);return w.map(n,function(n){return(e?t:n[t]).apply(n,r)})},w.pluck=function(n,t){return w.map(n,function(n){return n[t]})},w.where=function(n,t,r){return w.isEmpty(t)?r?null:[]:w[r?"find":"filter"](n,function(n){for(var r in t)if(t[r]!==n[r])return!1;return!0})},w.findWhere=function(n,t){return w.where(n,t,!0)},w.max=function(n,t,r){if(!t&&w.isArray(n)&&n[0]===+n[0]&&65535>n.length)return Math.max.apply(Math,n);if(!t&&w.isEmpty(n))return-1/0;var e={computed:-1/0,value:-1/0};return A(n,function(n,u,i){var a=t?t.call(r,n,u,i):n;a>=e.computed&&(e={value:n,computed:a})}),e.value},w.min=function(n,t,r){if(!t&&w.isArray(n)&&n[0]===+n[0]&&65535>n.length)return Math.min.apply(Math,n);if(!t&&w.isEmpty(n))return 1/0;var e={computed:1/0,value:1/0};return A(n,function(n,u,i){var a=t?t.call(r,n,u,i):n;e.computed>a&&(e={value:n,computed:a})}),e.value},w.shuffle=function(n){var t,r=0,e=[];return A(n,function(n){t=w.random(r++),e[r-1]=e[t],e[t]=n}),e};var k=function(n){return w.isFunction(n)?n:function(t){return t[n]}};w.sortBy=function(n,t,r){var e=k(t);return w.pluck(w.map(n,function(n,t,u){return{value:n,index:t,criteria:e.call(r,n,t,u)}}).sort(function(n,t){var r=n.criteria,e=t.criteria;if(r!==e){if(r>e||r===void 0)return 1;if(e>r||e===void 0)return-1}return n.index<t.index?-1:1}),"value")};var F=function(n,t,r,e){var u={},i=k(t||w.identity);return A(n,function(t,a){var o=i.call(r,t,a,n);e(u,o,t)}),u};w.groupBy=function(n,t,r){return F(n,t,r,function(n,t,r){(w.has(n,t)?n[t]:n[t]=[]).push(r)})},w.countBy=function(n,t,r){return F(n,t,r,function(n,t){w.has(n,t)||(n[t]=0),n[t]++})},w.sortedIndex=function(n,t,r,e){r=null==r?w.identity:k(r);for(var u=r.call(e,t),i=0,a=n.length;a>i;){var o=i+a>>>1;u>r.call(e,n[o])?i=o+1:a=o}return i},w.toArray=function(n){return n?w.isArray(n)?o.call(n):n.length===+n.length?w.map(n,w.identity):w.values(n):[]},w.size=function(n){return null==n?0:n.length===+n.length?n.length:w.keys(n).length},w.first=w.head=w.take=function(n,t,r){return null==n?void 0:null==t||r?n[0]:o.call(n,0,t)},w.initial=function(n,t,r){return o.call(n,0,n.length-(null==t||r?1:t))},w.last=function(n,t,r){return null==n?void 0:null==t||r?n[n.length-1]:o.call(n,Math.max(n.length-t,0))},w.rest=w.tail=w.drop=function(n,t,r){return o.call(n,null==t||r?1:t)},w.compact=function(n){return w.filter(n,w.identity)};var R=function(n,t,r){return A(n,function(n){w.isArray(n)?t?a.apply(r,n):R(n,t,r):r.push(n)}),r};w.flatten=function(n,t){return R(n,t,[])},w.without=function(n){return w.difference(n,o.call(arguments,1))},w.uniq=w.unique=function(n,t,r,e){w.isFunction(t)&&(e=r,r=t,t=!1);var u=r?w.map(n,r,e):n,i=[],a=[];return A(u,function(r,e){(t?e&&a[a.length-1]===r:w.contains(a,r))||(a.push(r),i.push(n[e]))}),i},w.union=function(){return w.uniq(c.apply(e,arguments))},w.intersection=function(n){var t=o.call(arguments,1);return w.filter(w.uniq(n),function(n){return w.every(t,function(t){return w.indexOf(t,n)>=0})})},w.difference=function(n){var t=c.apply(e,o.call(arguments,1));return w.filter(n,function(n){return!w.contains(t,n)})},w.zip=function(){for(var n=o.call(arguments),t=w.max(w.pluck(n,"length")),r=Array(t),e=0;t>e;e++)r[e]=w.pluck(n,""+e);return r},w.object=function(n,t){if(null==n)return{};for(var r={},e=0,u=n.length;u>e;e++)t?r[n[e]]=t[e]:r[n[e][0]]=n[e][1];return r},w.indexOf=function(n,t,r){if(null==n)return-1;var e=0,u=n.length;if(r){if("number"!=typeof r)return e=w.sortedIndex(n,t),n[e]===t?e:-1;e=0>r?Math.max(0,u+r):r}if(y&&n.indexOf===y)return n.indexOf(t,r);for(;u>e;e++)if(n[e]===t)return e;return-1},w.lastIndexOf=function(n,t,r){if(null==n)return-1;var e=null!=r;if(b&&n.lastIndexOf===b)return e?n.lastIndexOf(t,r):n.lastIndexOf(t);for(var u=e?r:n.length;u--;)if(n[u]===t)return u;return-1},w.range=function(n,t,r){1>=arguments.length&&(t=n||0,n=0),r=arguments[2]||1;for(var e=Math.max(Math.ceil((t-n)/r),0),u=0,i=Array(e);e>u;)i[u++]=n,n+=r;return i},w.bind=function(n,t){if(n.bind===j&&j)return j.apply(n,o.call(arguments,1));var r=o.call(arguments,2);return function(){return n.apply(t,r.concat(o.call(arguments)))}},w.partial=function(n){var t=o.call(arguments,1);return function(){return n.apply(this,t.concat(o.call(arguments)))}},w.bindAll=function(n){var t=o.call(arguments,1);return 0===t.length&&(t=w.functions(n)),A(t,function(t){n[t]=w.bind(n[t],n)}),n},w.memoize=function(n,t){var r={};return t||(t=w.identity),function(){var e=t.apply(this,arguments);return w.has(r,e)?r[e]:r[e]=n.apply(this,arguments)}},w.delay=function(n,t){var r=o.call(arguments,2);return setTimeout(function(){return n.apply(null,r)},t)},w.defer=function(n){return w.delay.apply(w,[n,1].concat(o.call(arguments,1)))},w.throttle=function(n,t){var r,e,u,i,a=0,o=function(){a=new Date,u=null,i=n.apply(r,e)};return function(){var c=new Date,l=t-(c-a);return r=this,e=arguments,0>=l?(clearTimeout(u),u=null,a=c,i=n.apply(r,e)):u||(u=setTimeout(o,l)),i}},w.debounce=function(n,t,r){var e,u;return function(){var i=this,a=arguments,o=function(){e=null,r||(u=n.apply(i,a))},c=r&&!e;return clearTimeout(e),e=setTimeout(o,t),c&&(u=n.apply(i,a)),u}},w.once=function(n){var t,r=!1;return function(){return r?t:(r=!0,t=n.apply(this,arguments),n=null,t)}},w.wrap=function(n,t){return function(){var r=[n];return a.apply(r,arguments),t.apply(this,r)}},w.compose=function(){var n=arguments;return function(){for(var t=arguments,r=n.length-1;r>=0;r--)t=[n[r].apply(this,t)];return t[0]}},w.after=function(n,t){return 0>=n?t():function(){return 1>--n?t.apply(this,arguments):void 0}},w.keys=_||function(n){if(n!==Object(n))throw new TypeError("Invalid object");var t=[];for(var r in n)w.has(n,r)&&(t[t.length]=r);return t},w.values=function(n){var t=[];for(var r in n)w.has(n,r)&&t.push(n[r]);return t},w.pairs=function(n){var t=[];for(var r in n)w.has(n,r)&&t.push([r,n[r]]);return t},w.invert=function(n){var t={};for(var r in n)w.has(n,r)&&(t[n[r]]=r);return t},w.functions=w.methods=function(n){var t=[];for(var r in n)w.isFunction(n[r])&&t.push(r);return t.sort()},w.extend=function(n){return A(o.call(arguments,1),function(t){if(t)for(var r in t)n[r]=t[r]}),n},w.pick=function(n){var t={},r=c.apply(e,o.call(arguments,1));return A(r,function(r){r in n&&(t[r]=n[r])}),t},w.omit=function(n){var t={},r=c.apply(e,o.call(arguments,1));for(var u in n)w.contains(r,u)||(t[u]=n[u]);return t},w.defaults=function(n){return A(o.call(arguments,1),function(t){if(t)for(var r in t)null==n[r]&&(n[r]=t[r])}),n},w.clone=function(n){return w.isObject(n)?w.isArray(n)?n.slice():w.extend({},n):n},w.tap=function(n,t){return t(n),n};var I=function(n,t,r,e){if(n===t)return 0!==n||1/n==1/t;if(null==n||null==t)return n===t;n instanceof w&&(n=n._wrapped),t instanceof w&&(t=t._wrapped);var u=l.call(n);if(u!=l.call(t))return!1;switch(u){case"[object String]":return n==t+"";case"[object Number]":return n!=+n?t!=+t:0==n?1/n==1/t:n==+t;case"[object Date]":case"[object Boolean]":return+n==+t;case"[object RegExp]":return n.source==t.source&&n.global==t.global&&n.multiline==t.multiline&&n.ignoreCase==t.ignoreCase}if("object"!=typeof n||"object"!=typeof t)return!1;for(var i=r.length;i--;)if(r[i]==n)return e[i]==t;r.push(n),e.push(t);var a=0,o=!0;if("[object Array]"==u){if(a=n.length,o=a==t.length)for(;a--&&(o=I(n[a],t[a],r,e)););}else{var c=n.constructor,f=t.constructor;if(c!==f&&!(w.isFunction(c)&&c instanceof c&&w.isFunction(f)&&f instanceof f))return!1;for(var s in n)if(w.has(n,s)&&(a++,!(o=w.has(t,s)&&I(n[s],t[s],r,e))))break;if(o){for(s in t)if(w.has(t,s)&&!a--)break;o=!a}}return r.pop(),e.pop(),o};w.isEqual=function(n,t){return I(n,t,[],[])},w.isEmpty=function(n){if(null==n)return!0;if(w.isArray(n)||w.isString(n))return 0===n.length;for(var t in n)if(w.has(n,t))return!1;return!0},w.isElement=function(n){return!(!n||1!==n.nodeType)},w.isArray=x||function(n){return"[object Array]"==l.call(n)},w.isObject=function(n){return n===Object(n)},A(["Arguments","Function","String","Number","Date","RegExp"],function(n){w["is"+n]=function(t){return l.call(t)=="[object "+n+"]"}}),w.isArguments(arguments)||(w.isArguments=function(n){return!(!n||!w.has(n,"callee"))}),"function"!=typeof/./&&(w.isFunction=function(n){return"function"==typeof n}),w.isFinite=function(n){return isFinite(n)&&!isNaN(parseFloat(n))},w.isNaN=function(n){return w.isNumber(n)&&n!=+n},w.isBoolean=function(n){return n===!0||n===!1||"[object Boolean]"==l.call(n)},w.isNull=function(n){return null===n},w.isUndefined=function(n){return n===void 0},w.has=function(n,t){return f.call(n,t)},w.noConflict=function(){return n._=t,this},w.identity=function(n){return n},w.times=function(n,t,r){for(var e=Array(n),u=0;n>u;u++)e[u]=t.call(r,u);return e},w.random=function(n,t){return null==t&&(t=n,n=0),n+Math.floor(Math.random()*(t-n+1))};var M={escape:{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","/":"&#x2F;"}};M.unescape=w.invert(M.escape);var S={escape:RegExp("["+w.keys(M.escape).join("")+"]","g"),unescape:RegExp("("+w.keys(M.unescape).join("|")+")","g")};w.each(["escape","unescape"],function(n){w[n]=function(t){return null==t?"":(""+t).replace(S[n],function(t){return M[n][t]})}}),w.result=function(n,t){if(null==n)return null;var r=n[t];return w.isFunction(r)?r.call(n):r},w.mixin=function(n){A(w.functions(n),function(t){var r=w[t]=n[t];w.prototype[t]=function(){var n=[this._wrapped];return a.apply(n,arguments),D.call(this,r.apply(w,n))}})};var N=0;w.uniqueId=function(n){var t=++N+"";return n?n+t:t},w.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g};var T=/(.)^/,q={"'":"'","\\":"\\","\r":"r","\n":"n","	":"t","\u2028":"u2028","\u2029":"u2029"},B=/\\|'|\r|\n|\t|\u2028|\u2029/g;w.template=function(n,t,r){var e;r=w.defaults({},r,w.templateSettings);var u=RegExp([(r.escape||T).source,(r.interpolate||T).source,(r.evaluate||T).source].join("|")+"|$","g"),i=0,a="__p+='";n.replace(u,function(t,r,e,u,o){return a+=n.slice(i,o).replace(B,function(n){return"\\"+q[n]}),r&&(a+="'+\n((__t=("+r+"))==null?'':_.escape(__t))+\n'"),e&&(a+="'+\n((__t=("+e+"))==null?'':__t)+\n'"),u&&(a+="';\n"+u+"\n__p+='"),i=o+t.length,t}),a+="';\n",r.variable||(a="with(obj||{}){\n"+a+"}\n"),a="var __t,__p='',__j=Array.prototype.join,"+"print=function(){__p+=__j.call(arguments,'');};\n"+a+"return __p;\n";try{e=Function(r.variable||"obj","_",a)}catch(o){throw o.source=a,o}if(t)return e(t,w);var c=function(n){return e.call(this,n,w)};return c.source="function("+(r.variable||"obj")+"){\n"+a+"}",c},w.chain=function(n){return w(n).chain()};var D=function(n){return this._chain?w(n).chain():n};w.mixin(w),A(["pop","push","reverse","shift","sort","splice","unshift"],function(n){var t=e[n];w.prototype[n]=function(){var r=this._wrapped;return t.apply(r,arguments),"shift"!=n&&"splice"!=n||0!==r.length||delete r[0],D.call(this,r)}}),A(["concat","join","slice"],function(n){var t=e[n];w.prototype[n]=function(){return D.call(this,t.apply(this._wrapped,arguments))}}),w.extend(w.prototype,{chain:function(){return this._chain=!0,this},value:function(){return this._wrapped}})}).call(this);!function(e,t){"use strict";var n=t.prototype.trim,r=t.prototype.trimRight,i=t.prototype.trimLeft,s=function(e){return e*1||0},o=function(e,t){if(t<1)return"";var n="";while(t>0)t&1&&(n+=e),t>>=1,e+=e;return n},u=[].slice,a=function(e){return e==null?"\\s":e.source?e.source:"["+p.escapeRegExp(e)+"]"},f={lt:"<",gt:">",quot:'"',amp:"&",apos:"'"},l={};for(var c in f)l[f[c]]=c;l["'"]="#39";var h=function(){function e(e){return Object.prototype.toString.call(e).slice(8,-1).toLowerCase()}var n=o,r=function(){return r.cache.hasOwnProperty(arguments[0])||(r.cache[arguments[0]]=r.parse(arguments[0])),r.format.call(null,r.cache[arguments[0]],arguments)};return r.format=function(r,i){var s=1,o=r.length,u="",a,f=[],l,c,p,d,v,m;for(l=0;l<o;l++){u=e(r[l]);if(u==="string")f.push(r[l]);else if(u==="array"){p=r[l];if(p[2]){a=i[s];for(c=0;c<p[2].length;c++){if(!a.hasOwnProperty(p[2][c]))throw new Error(h('[_.sprintf] property "%s" does not exist',p[2][c]));a=a[p[2][c]]}}else p[1]?a=i[p[1]]:a=i[s++];if(/[^s]/.test(p[8])&&e(a)!="number")throw new Error(h("[_.sprintf] expecting number but found %s",e(a)));switch(p[8]){case"b":a=a.toString(2);break;case"c":a=t.fromCharCode(a);break;case"d":a=parseInt(a,10);break;case"e":a=p[7]?a.toExponential(p[7]):a.toExponential();break;case"f":a=p[7]?parseFloat(a).toFixed(p[7]):parseFloat(a);break;case"o":a=a.toString(8);break;case"s":a=(a=t(a))&&p[7]?a.substring(0,p[7]):a;break;case"u":a=Math.abs(a);break;case"x":a=a.toString(16);break;case"X":a=a.toString(16).toUpperCase()}a=/[def]/.test(p[8])&&p[3]&&a>=0?"+"+a:a,v=p[4]?p[4]=="0"?"0":p[4].charAt(1):" ",m=p[6]-t(a).length,d=p[6]?n(v,m):"",f.push(p[5]?a+d:d+a)}}return f.join("")},r.cache={},r.parse=function(e){var t=e,n=[],r=[],i=0;while(t){if((n=/^[^\x25]+/.exec(t))!==null)r.push(n[0]);else if((n=/^\x25{2}/.exec(t))!==null)r.push("%");else{if((n=/^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(t))===null)throw new Error("[_.sprintf] huh?");if(n[2]){i|=1;var s=[],o=n[2],u=[];if((u=/^([a-z_][a-z_\d]*)/i.exec(o))===null)throw new Error("[_.sprintf] huh?");s.push(u[1]);while((o=o.substring(u[0].length))!=="")if((u=/^\.([a-z_][a-z_\d]*)/i.exec(o))!==null)s.push(u[1]);else{if((u=/^\[(\d+)\]/.exec(o))===null)throw new Error("[_.sprintf] huh?");s.push(u[1])}n[2]=s}else i|=2;if(i===3)throw new Error("[_.sprintf] mixing positional and named placeholders is not (yet) supported");r.push(n)}t=t.substring(n[0].length)}return r},r}(),p={VERSION:"2.3.0",isBlank:function(e){return e==null&&(e=""),/^\s*$/.test(e)},stripTags:function(e){return e==null?"":t(e).replace(/<\/?[^>]+>/g,"")},capitalize:function(e){return e=e==null?"":t(e),e.charAt(0).toUpperCase()+e.slice(1)},chop:function(e,n){return e==null?[]:(e=t(e),n=~~n,n>0?e.match(new RegExp(".{1,"+n+"}","g")):[e])},clean:function(e){return p.strip(e).replace(/\s+/g," ")},count:function(e,n){if(e==null||n==null)return 0;e=t(e),n=t(n);var r=0,i=0,s=n.length;for(;;){i=e.indexOf(n,i);if(i===-1)break;r++,i+=s}return r},chars:function(e){return e==null?[]:t(e).split("")},swapCase:function(e){return e==null?"":t(e).replace(/\S/g,function(e){return e===e.toUpperCase()?e.toLowerCase():e.toUpperCase()})},escapeHTML:function(e){return e==null?"":t(e).replace(/[&<>"']/g,function(e){return"&"+l[e]+";"})},unescapeHTML:function(e){return e==null?"":t(e).replace(/\&([^;]+);/g,function(e,n){var r;return n in f?f[n]:(r=n.match(/^#x([\da-fA-F]+)$/))?t.fromCharCode(parseInt(r[1],16)):(r=n.match(/^#(\d+)$/))?t.fromCharCode(~~r[1]):e})},escapeRegExp:function(e){return e==null?"":t(e).replace(/([.*+?^=!:${}()|[\]\/\\])/g,"\\$1")},splice:function(e,t,n,r){var i=p.chars(e);return i.splice(~~t,~~n,r),i.join("")},insert:function(e,t,n){return p.splice(e,t,0,n)},include:function(e,n){return n===""?!0:e==null?!1:t(e).indexOf(n)!==-1},join:function(){var e=u.call(arguments),t=e.shift();return t==null&&(t=""),e.join(t)},lines:function(e){return e==null?[]:t(e).split("\n")},reverse:function(e){return p.chars(e).reverse().join("")},startsWith:function(e,n){return n===""?!0:e==null||n==null?!1:(e=t(e),n=t(n),e.length>=n.length&&e.slice(0,n.length)===n)},endsWith:function(e,n){return n===""?!0:e==null||n==null?!1:(e=t(e),n=t(n),e.length>=n.length&&e.slice(e.length-n.length)===n)},succ:function(e){return e==null?"":(e=t(e),e.slice(0,-1)+t.fromCharCode(e.charCodeAt(e.length-1)+1))},titleize:function(e){return e==null?"":t(e).replace(/(?:^|\s)\S/g,function(e){return e.toUpperCase()})},camelize:function(e){return p.trim(e).replace(/[-_\s]+(.)?/g,function(e,t){return t.toUpperCase()})},underscored:function(e){return p.trim(e).replace(/([a-z\d])([A-Z]+)/g,"$1_$2").replace(/[-\s]+/g,"_").toLowerCase()},dasherize:function(e){return p.trim(e).replace(/([A-Z])/g,"-$1").replace(/[-_\s]+/g,"-").toLowerCase()},classify:function(e){return p.titleize(t(e).replace(/_/g," ")).replace(/\s/g,"")},humanize:function(e){return p.capitalize(p.underscored(e).replace(/_id$/,"").replace(/_/g," "))},trim:function(e,r){return e==null?"":!r&&n?n.call(e):(r=a(r),t(e).replace(new RegExp("^"+r+"+|"+r+"+$","g"),""))},ltrim:function(e,n){return e==null?"":!n&&i?i.call(e):(n=a(n),t(e).replace(new RegExp("^"+n+"+"),""))},rtrim:function(e,n){return e==null?"":!n&&r?r.call(e):(n=a(n),t(e).replace(new RegExp(n+"+$"),""))},truncate:function(e,n,r){return e==null?"":(e=t(e),r=r||"...",n=~~n,e.length>n?e.slice(0,n)+r:e)},prune:function(e,n,r){if(e==null)return"";e=t(e),n=~~n,r=r!=null?t(r):"...";if(e.length<=n)return e;var i=function(e){return e.toUpperCase()!==e.toLowerCase()?"A":" "},s=e.slice(0,n+1).replace(/.(?=\W*\w*$)/g,i);return s.slice(s.length-2).match(/\w\w/)?s=s.replace(/\s*\S+$/,""):s=p.rtrim(s.slice(0,s.length-1)),(s+r).length>e.length?e:e.slice(0,s.length)+r},words:function(e,t){return p.isBlank(e)?[]:p.trim(e,t).split(t||/\s+/)},pad:function(e,n,r,i){e=e==null?"":t(e),n=~~n;var s=0;r?r.length>1&&(r=r.charAt(0)):r=" ";switch(i){case"right":return s=n-e.length,e+o(r,s);case"both":return s=n-e.length,o(r,Math.ceil(s/2))+e+o(r,Math.floor(s/2));default:return s=n-e.length,o(r,s)+e}},lpad:function(e,t,n){return p.pad(e,t,n)},rpad:function(e,t,n){return p.pad(e,t,n,"right")},lrpad:function(e,t,n){return p.pad(e,t,n,"both")},sprintf:h,vsprintf:function(e,t){return t.unshift(e),h.apply(null,t)},toNumber:function(e,n){if(e==null||e=="")return 0;e=t(e);var r=s(s(e).toFixed(~~n));return r===0&&!e.match(/^0+$/)?Number.NaN:r},numberFormat:function(e,t,n,r){if(isNaN(e)||e==null)return"";e=e.toFixed(~~t),r=typeof r=="string"?r:",";var i=e.split("."),s=i[0],o=i[1]?(n||".")+i[1]:"";return s.replace(/(\d)(?=(?:\d{3})+$)/g,"$1"+r)+o},strRight:function(e,n){if(e==null)return"";e=t(e),n=n!=null?t(n):n;var r=n?e.indexOf(n):-1;return~r?e.slice(r+n.length,e.length):e},strRightBack:function(e,n){if(e==null)return"";e=t(e),n=n!=null?t(n):n;var r=n?e.lastIndexOf(n):-1;return~r?e.slice(r+n.length,e.length):e},strLeft:function(e,n){if(e==null)return"";e=t(e),n=n!=null?t(n):n;var r=n?e.indexOf(n):-1;return~r?e.slice(0,r):e},strLeftBack:function(e,t){if(e==null)return"";e+="",t=t!=null?""+t:t;var n=e.lastIndexOf(t);return~n?e.slice(0,n):e},toSentence:function(e,t,n,r){t=t||", ",n=n||" and ";var i=e.slice(),s=i.pop();return e.length>2&&r&&(n=p.rtrim(t)+n),i.length?i.join(t)+n+s:s},toSentenceSerial:function(){var e=u.call(arguments);return e[3]=!0,p.toSentence.apply(p,e)},slugify:function(e){if(e==null)return"";var n="ąàáäâãåæćęèéëêìíïîłńòóöôõøùúüûñçżź",r="aaaaaaaaceeeeeiiiilnoooooouuuunczz",i=new RegExp(a(n),"g");return e=t(e).toLowerCase().replace(i,function(e){var t=n.indexOf(e);return r.charAt(t)||"-"}),p.dasherize(e.replace(/[^\w\s-]/g,""))},surround:function(e,t){return[t,e,t].join("")},quote:function(e){return p.surround(e,'"')},exports:function(){var e={};for(var t in this){if(!this.hasOwnProperty(t)||t.match(/^(?:include|contains|reverse)$/))continue;e[t]=this[t]}return e},repeat:function(e,n,r){if(e==null)return"";n=~~n;if(r==null)return o(t(e),n);for(var i=[];n>0;i[--n]=e);return i.join(r)},levenshtein:function(e,n){if(e==null&&n==null)return 0;if(e==null)return t(n).length;if(n==null)return t(e).length;e=t(e),n=t(n);var r=[],i,s;for(var o=0;o<=n.length;o++)for(var u=0;u<=e.length;u++)o&&u?e.charAt(u-1)===n.charAt(o-1)?s=i:s=Math.min(r[u],r[u-1],i)+1:s=o+u,i=r[u],r[u]=s;return r.pop()}};p.strip=p.trim,p.lstrip=p.ltrim,p.rstrip=p.rtrim,p.center=p.lrpad,p.rjust=p.lpad,p.ljust=p.rpad,p.contains=p.include,p.q=p.quote,typeof exports!="undefined"&&(typeof module!="undefined"&&module.exports&&(module.exports=p),exports._s=p),typeof define=="function"&&define.amd&&define("underscore.string",[],function(){return p}),e._=e._||{},e._.string=e._.str=p}(this,String);// moment.js
// version : 1.7.2
// author : Tim Wood
// license : MIT
// momentjs.com
(function(a){function E(a,b,c,d){var e=c.lang();return e[a].call?e[a](c,d):e[a][b]}function F(a,b){return function(c){return K(a.call(this,c),b)}}function G(a){return function(b){var c=a.call(this,b);return c+this.lang().ordinal(c)}}function H(a,b,c){this._d=a,this._isUTC=!!b,this._a=a._a||null,this._lang=c||!1}function I(a){var b=this._data={},c=a.years||a.y||0,d=a.months||a.M||0,e=a.weeks||a.w||0,f=a.days||a.d||0,g=a.hours||a.h||0,h=a.minutes||a.m||0,i=a.seconds||a.s||0,j=a.milliseconds||a.ms||0;this._milliseconds=j+i*1e3+h*6e4+g*36e5,this._days=f+e*7,this._months=d+c*12,b.milliseconds=j%1e3,i+=J(j/1e3),b.seconds=i%60,h+=J(i/60),b.minutes=h%60,g+=J(h/60),b.hours=g%24,f+=J(g/24),f+=e*7,b.days=f%30,d+=J(f/30),b.months=d%12,c+=J(d/12),b.years=c,this._lang=!1}function J(a){return a<0?Math.ceil(a):Math.floor(a)}function K(a,b){var c=a+"";while(c.length<b)c="0"+c;return c}function L(a,b,c){var d=b._milliseconds,e=b._days,f=b._months,g;d&&a._d.setTime(+a+d*c),e&&a.date(a.date()+e*c),f&&(g=a.date(),a.date(1).month(a.month()+f*c).date(Math.min(g,a.daysInMonth())))}function M(a){return Object.prototype.toString.call(a)==="[object Array]"}function N(a,b){var c=Math.min(a.length,b.length),d=Math.abs(a.length-b.length),e=0,f;for(f=0;f<c;f++)~~a[f]!==~~b[f]&&e++;return e+d}function O(a,b,c,d){var e,f,g=[];for(e=0;e<7;e++)g[e]=a[e]=a[e]==null?e===2?1:0:a[e];return a[7]=g[7]=b,a[8]!=null&&(g[8]=a[8]),a[3]+=c||0,a[4]+=d||0,f=new Date(0),b?(f.setUTCFullYear(a[0],a[1],a[2]),f.setUTCHours(a[3],a[4],a[5],a[6])):(f.setFullYear(a[0],a[1],a[2]),f.setHours(a[3],a[4],a[5],a[6])),f._a=g,f}function P(a,c){var d,e,g=[];!c&&h&&(c=require("./lang/"+a));for(d=0;d<i.length;d++)c[i[d]]=c[i[d]]||f.en[i[d]];for(d=0;d<12;d++)e=b([2e3,d]),g[d]=new RegExp("^"+(c.months[d]||c.months(e,""))+"|^"+(c.monthsShort[d]||c.monthsShort(e,"")).replace(".",""),"i");return c.monthsParse=c.monthsParse||g,f[a]=c,c}function Q(a){var c=typeof a=="string"&&a||a&&a._lang||null;return c?f[c]||P(c):b}function R(a){return a.match(/\[.*\]/)?a.replace(/^\[|\]$/g,""):a.replace(/\\/g,"")}function S(a){var b=a.match(k),c,d;for(c=0,d=b.length;c<d;c++)D[b[c]]?b[c]=D[b[c]]:b[c]=R(b[c]);return function(e){var f="";for(c=0;c<d;c++)f+=typeof b[c].call=="function"?b[c].call(e,a):b[c];return f}}function T(a,b){function d(b){return a.lang().longDateFormat[b]||b}var c=5;while(c--&&l.test(b))b=b.replace(l,d);return A[b]||(A[b]=S(b)),A[b](a)}function U(a){switch(a){case"DDDD":return p;case"YYYY":return q;case"S":case"SS":case"SSS":case"DDD":return o;case"MMM":case"MMMM":case"dd":case"ddd":case"dddd":case"a":case"A":return r;case"Z":case"ZZ":return s;case"T":return t;case"MM":case"DD":case"YY":case"HH":case"hh":case"mm":case"ss":case"M":case"D":case"d":case"H":case"h":case"m":case"s":return n;default:return new RegExp(a.replace("\\",""))}}function V(a,b,c,d){var e,f;switch(a){case"M":case"MM":c[1]=b==null?0:~~b-1;break;case"MMM":case"MMMM":for(e=0;e<12;e++)if(Q().monthsParse[e].test(b)){c[1]=e,f=!0;break}f||(c[8]=!1);break;case"D":case"DD":case"DDD":case"DDDD":b!=null&&(c[2]=~~b);break;case"YY":c[0]=~~b+(~~b>70?1900:2e3);break;case"YYYY":c[0]=~~Math.abs(b);break;case"a":case"A":d.isPm=(b+"").toLowerCase()==="pm";break;case"H":case"HH":case"h":case"hh":c[3]=~~b;break;case"m":case"mm":c[4]=~~b;break;case"s":case"ss":c[5]=~~b;break;case"S":case"SS":case"SSS":c[6]=~~(("0."+b)*1e3);break;case"Z":case"ZZ":d.isUTC=!0,e=(b+"").match(x),e&&e[1]&&(d.tzh=~~e[1]),e&&e[2]&&(d.tzm=~~e[2]),e&&e[0]==="+"&&(d.tzh=-d.tzh,d.tzm=-d.tzm)}b==null&&(c[8]=!1)}function W(a,b){var c=[0,0,1,0,0,0,0],d={tzh:0,tzm:0},e=b.match(k),f,g;for(f=0;f<e.length;f++)g=(U(e[f]).exec(a)||[])[0],g&&(a=a.slice(a.indexOf(g)+g.length)),D[e[f]]&&V(e[f],g,c,d);return d.isPm&&c[3]<12&&(c[3]+=12),d.isPm===!1&&c[3]===12&&(c[3]=0),O(c,d.isUTC,d.tzh,d.tzm)}function X(a,b){var c,d=a.match(m)||[],e,f=99,g,h,i;for(g=0;g<b.length;g++)h=W(a,b[g]),e=T(new H(h),b[g]).match(m)||[],i=N(d,e),i<f&&(f=i,c=h);return c}function Y(a){var b="YYYY-MM-DDT",c;if(u.exec(a)){for(c=0;c<4;c++)if(w[c][1].exec(a)){b+=w[c][0];break}return s.exec(a)?W(a,b+" Z"):W(a,b)}return new Date(a)}function Z(a,b,c,d,e){var f=e.relativeTime[a];return typeof f=="function"?f(b||1,!!c,a,d):f.replace(/%d/i,b||1)}function $(a,b,c){var e=d(Math.abs(a)/1e3),f=d(e/60),g=d(f/60),h=d(g/24),i=d(h/365),j=e<45&&["s",e]||f===1&&["m"]||f<45&&["mm",f]||g===1&&["h"]||g<22&&["hh",g]||h===1&&["d"]||h<=25&&["dd",h]||h<=45&&["M"]||h<345&&["MM",d(h/30)]||i===1&&["y"]||["yy",i];return j[2]=b,j[3]=a>0,j[4]=c,Z.apply({},j)}function _(a,c){b.fn[a]=function(a){var b=this._isUTC?"UTC":"";return a!=null?(this._d["set"+b+c](a),this):this._d["get"+b+c]()}}function ab(a){b.duration.fn[a]=function(){return this._data[a]}}function bb(a,c){b.duration.fn["as"+a]=function(){return+this/c}}var b,c="1.7.2",d=Math.round,e,f={},g="en",h=typeof module!="undefined"&&module.exports,i="months|monthsShort|weekdays|weekdaysShort|weekdaysMin|longDateFormat|calendar|relativeTime|ordinal|meridiem".split("|"),j=/^\/?Date\((\-?\d+)/i,k=/(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|YYYY|YY|a|A|hh?|HH?|mm?|ss?|SS?S?|zz?|ZZ?|.)/g,l=/(\[[^\[]*\])|(\\)?(LT|LL?L?L?)/g,m=/([0-9a-zA-Z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)/gi,n=/\d\d?/,o=/\d{1,3}/,p=/\d{3}/,q=/\d{1,4}/,r=/[0-9a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+/i,s=/Z|[\+\-]\d\d:?\d\d/i,t=/T/i,u=/^\s*\d{4}-\d\d-\d\d(T(\d\d(:\d\d(:\d\d(\.\d\d?\d?)?)?)?)?([\+\-]\d\d:?\d\d)?)?/,v="YYYY-MM-DDTHH:mm:ssZ",w=[["HH:mm:ss.S",/T\d\d:\d\d:\d\d\.\d{1,3}/],["HH:mm:ss",/T\d\d:\d\d:\d\d/],["HH:mm",/T\d\d:\d\d/],["HH",/T\d\d/]],x=/([\+\-]|\d\d)/gi,y="Month|Date|Hours|Minutes|Seconds|Milliseconds".split("|"),z={Milliseconds:1,Seconds:1e3,Minutes:6e4,Hours:36e5,Days:864e5,Months:2592e6,Years:31536e6},A={},B="DDD w M D d".split(" "),C="M D H h m s w".split(" "),D={M:function(){return this.month()+1},MMM:function(a){return E("monthsShort",this.month(),this,a)},MMMM:function(a){return E("months",this.month(),this,a)},D:function(){return this.date()},DDD:function(){var a=new Date(this.year(),this.month(),this.date()),b=new Date(this.year(),0,1);return~~((a-b)/864e5+1.5)},d:function(){return this.day()},dd:function(a){return E("weekdaysMin",this.day(),this,a)},ddd:function(a){return E("weekdaysShort",this.day(),this,a)},dddd:function(a){return E("weekdays",this.day(),this,a)},w:function(){var a=new Date(this.year(),this.month(),this.date()-this.day()+5),b=new Date(a.getFullYear(),0,4);return~~((a-b)/864e5/7+1.5)},YY:function(){return K(this.year()%100,2)},YYYY:function(){return K(this.year(),4)},a:function(){return this.lang().meridiem(this.hours(),this.minutes(),!0)},A:function(){return this.lang().meridiem(this.hours(),this.minutes(),!1)},H:function(){return this.hours()},h:function(){return this.hours()%12||12},m:function(){return this.minutes()},s:function(){return this.seconds()},S:function(){return~~(this.milliseconds()/100)},SS:function(){return K(~~(this.milliseconds()/10),2)},SSS:function(){return K(this.milliseconds(),3)},Z:function(){var a=-this.zone(),b="+";return a<0&&(a=-a,b="-"),b+K(~~(a/60),2)+":"+K(~~a%60,2)},ZZ:function(){var a=-this.zone(),b="+";return a<0&&(a=-a,b="-"),b+K(~~(10*a/6),4)}};while(B.length)e=B.pop(),D[e+"o"]=G(D[e]);while(C.length)e=C.pop(),D[e+e]=F(D[e],2);D.DDDD=F(D.DDD,3),b=function(c,d){if(c===null||c==="")return null;var e,f;return b.isMoment(c)?new H(new Date(+c._d),c._isUTC,c._lang):(d?M(d)?e=X(c,d):e=W(c,d):(f=j.exec(c),e=c===a?new Date:f?new Date(+f[1]):c instanceof Date?c:M(c)?O(c):typeof c=="string"?Y(c):new Date(c)),new H(e))},b.utc=function(a,c){return M(a)?new H(O(a,!0),!0):(typeof a=="string"&&!s.exec(a)&&(a+=" +0000",c&&(c+=" Z")),b(a,c).utc())},b.unix=function(a){return b(a*1e3)},b.duration=function(a,c){var d=b.isDuration(a),e=typeof a=="number",f=d?a._data:e?{}:a,g;return e&&(c?f[c]=a:f.milliseconds=a),g=new I(f),d&&(g._lang=a._lang),g},b.humanizeDuration=function(a,c,d){return b.duration(a,c===!0?null:c).humanize(c===!0?!0:d)},b.version=c,b.defaultFormat=v,b.lang=function(a,c){var d;if(!a)return g;(c||!f[a])&&P(a,c);if(f[a]){for(d=0;d<i.length;d++)b[i[d]]=f[a][i[d]];b.monthsParse=f[a].monthsParse,g=a}},b.langData=Q,b.isMoment=function(a){return a instanceof H},b.isDuration=function(a){return a instanceof I},b.lang("en",{months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_"),monthsShort:"Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),weekdaysShort:"Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),weekdaysMin:"Su_Mo_Tu_We_Th_Fr_Sa".split("_"),longDateFormat:{LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D YYYY",LLL:"MMMM D YYYY LT",LLLL:"dddd, MMMM D YYYY LT"},meridiem:function(a,b,c){return a>11?c?"pm":"PM":c?"am":"AM"},calendar:{sameDay:"[Today at] LT",nextDay:"[Tomorrow at] LT",nextWeek:"dddd [at] LT",lastDay:"[Yesterday at] LT",lastWeek:"[last] dddd [at] LT",sameElse:"L"},relativeTime:{future:"in %s",past:"%s ago",s:"a few seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"},ordinal:function(a){var b=a%10;return~~(a%100/10)===1?"th":b===1?"st":b===2?"nd":b===3?"rd":"th"}}),b.fn=H.prototype={clone:function(){return b(this)},valueOf:function(){return+this._d},unix:function(){return Math.floor(+this._d/1e3)},toString:function(){return this._d.toString()},toDate:function(){return this._d},toArray:function(){var a=this;return[a.year(),a.month(),a.date(),a.hours(),a.minutes(),a.seconds(),a.milliseconds(),!!this._isUTC]},isValid:function(){return this._a?this._a[8]!=null?!!this._a[8]:!N(this._a,(this._a[7]?b.utc(this._a):b(this._a)).toArray()):!isNaN(this._d.getTime())},utc:function(){return this._isUTC=!0,this},local:function(){return this._isUTC=!1,this},format:function(a){return T(this,a?a:b.defaultFormat)},add:function(a,c){var d=c?b.duration(+c,a):b.duration(a);return L(this,d,1),this},subtract:function(a,c){var d=c?b.duration(+c,a):b.duration(a);return L(this,d,-1),this},diff:function(a,c,e){var f=this._isUTC?b(a).utc():b(a).local(),g=(this.zone()-f.zone())*6e4,h=this._d-f._d-g,i=this.year()-f.year(),j=this.month()-f.month(),k=this.date()-f.date(),l;return c==="months"?l=i*12+j+k/30:c==="years"?l=i+(j+k/30)/12:l=c==="seconds"?h/1e3:c==="minutes"?h/6e4:c==="hours"?h/36e5:c==="days"?h/864e5:c==="weeks"?h/6048e5:h,e?l:d(l)},from:function(a,c){return b.duration(this.diff(a)).lang(this._lang).humanize(!c)},fromNow:function(a){return this.from(b(),a)},calendar:function(){var a=this.diff(b().sod(),"days",!0),c=this.lang().calendar,d=c.sameElse,e=a<-6?d:a<-1?c.lastWeek:a<0?c.lastDay:a<1?c.sameDay:a<2?c.nextDay:a<7?c.nextWeek:d;return this.format(typeof e=="function"?e.apply(this):e)},isLeapYear:function(){var a=this.year();return a%4===0&&a%100!==0||a%400===0},isDST:function(){return this.zone()<b([this.year()]).zone()||this.zone()<b([this.year(),5]).zone()},day:function(a){var b=this._isUTC?this._d.getUTCDay():this._d.getDay();return a==null?b:this.add({d:a-b})},startOf:function(a){switch(a.replace(/s$/,"")){case"year":this.month(0);case"month":this.date(1);case"day":this.hours(0);case"hour":this.minutes(0);case"minute":this.seconds(0);case"second":this.milliseconds(0)}return this},endOf:function(a){return this.startOf(a).add(a.replace(/s?$/,"s"),1).subtract("ms",1)},sod:function(){return this.clone().startOf("day")},eod:function(){return this.clone().endOf("day")},zone:function(){return this._isUTC?0:this._d.getTimezoneOffset()},daysInMonth:function(){return b.utc([this.year(),this.month()+1,0]).date()},lang:function(b){return b===a?Q(this):(this._lang=b,this)}};for(e=0;e<y.length;e++)_(y[e].toLowerCase(),y[e]);_("year","FullYear"),b.duration.fn=I.prototype={weeks:function(){return J(this.days()/7)},valueOf:function(){return this._milliseconds+this._days*864e5+this._months*2592e6},humanize:function(a){var b=+this,c=this.lang().relativeTime,d=$(b,!a,this.lang()),e=b<=0?c.past:c.future;return a&&(typeof e=="function"?d=e(d):d=e.replace(/%s/i,d)),d},lang:b.fn.lang};for(e in z)z.hasOwnProperty(e)&&(bb(e,z[e]),ab(e.toLowerCase()));bb("Weeks",6048e5),h&&(module.exports=b),typeof ender=="undefined"&&(this.moment=b),typeof define=="function"&&define.amd&&define("moment",[],function(){return b})}).call(this);(function(a){(function(a){science={version:"1.9.1"},science.ascending=function(a,b){return a-b},science.EULER=.5772156649015329,science.expm1=function(a){return a<1e-5&&a>-0.00001?a+.5*a*a:Math.exp(a)-1},science.functor=function(a){return typeof a=="function"?a:function(){return a}},science.hypot=function(a,b){a=Math.abs(a),b=Math.abs(b);var c,d;a>b?(c=a,d=b):(c=b,d=a);var e=d/c;return c*Math.sqrt(1+e*e)},science.quadratic=function(){function b(b,c,d){var e=c*c-4*b*d;return e>0?(e=Math.sqrt(e)/(2*b),a?[{r:-c-e,i:0},{r:-c+e,i:0}]:[-c-e,-c+e]):e===0?(e=-c/(2*b),a?[{r:e,i:0}]:[e]):a?(e=Math.sqrt(-e)/(2*b),[{r:-c,i:-e},{r:-c,i:e}]):[]}var a=!1;return b.complex=function(c){return arguments.length?(a=c,b):a},b},science.zeroes=function(a){var b=-1,c=[];if(arguments.length===1)while(++b<a)c[b]=0;else while(++b<a)c[b]=science.zeroes.apply(this,Array.prototype.slice.call(arguments,1));return c}})(this),function(a){function b(a,b,c){var d=c.length;for(var e=0;e<d;e++)a[e]=c[d-1][e];for(var f=d-1;f>0;f--){var g=0,h=0;for(var i=0;i<f;i++)g+=Math.abs(a[i]);if(g===0){b[f]=a[f-1];for(var e=0;e<f;e++)a[e]=c[f-1][e],c[f][e]=0,c[e][f]=0}else{for(var i=0;i<f;i++)a[i]/=g,h+=a[i]*a[i];var j=a[f-1],k=Math.sqrt(h);j>0&&(k=-k),b[f]=g*k,h-=j*k,a[f-1]=j-k;for(var e=0;e<f;e++)b[e]=0;for(var e=0;e<f;e++){j=a[e],c[e][f]=j,k=b[e]+c[e][e]*j;for(var i=e+1;i<=f-1;i++)k+=c[i][e]*a[i],b[i]+=c[i][e]*j;b[e]=k}j=0;for(var e=0;e<f;e++)b[e]/=h,j+=b[e]*a[e];var l=j/(h+h);for(var e=0;e<f;e++)b[e]-=l*a[e];for(var e=0;e<f;e++){j=a[e],k=b[e];for(var i=e;i<=f-1;i++)c[i][e]-=j*b[i]+k*a[i];a[e]=c[f-1][e],c[f][e]=0}}a[f]=h}for(var f=0;f<d-1;f++){c[d-1][f]=c[f][f],c[f][f]=1;var h=a[f+1];if(h!=0){for(var i=0;i<=f;i++)a[i]=c[i][f+1]/h;for(var e=0;e<=f;e++){var k=0;for(var i=0;i<=f;i++)k+=c[i][f+1]*c[i][e];for(var i=0;i<=f;i++)c[i][e]-=k*a[i]}}for(var i=0;i<=f;i++)c[i][f+1]=0}for(var e=0;e<d;e++)a[e]=c[d-1][e],c[d-1][e]=0;c[d-1][d-1]=1,b[0]=0}function c(a,b,c){var d=c.length;for(var e=1;e<d;e++)b[e-1]=b[e];b[d-1]=0;var f=0,g=0,h=1e-12;for(var i=0;i<d;i++){g=Math.max(g,Math.abs(a[i])+Math.abs(b[i]));var j=i;while(j<d){if(Math.abs(b[j])<=h*g)break;j++}if(j>i){var k=0;do{k++;var l=a[i],m=(a[i+1]-l)/(2*b[i]),n=science.hypot(m,1);m<0&&(n=-n),a[i]=b[i]/(m+n),a[i+1]=b[i]*(m+n);var o=a[i+1],p=l-a[i];for(var e=i+2;e<d;e++)a[e]-=p;f+=p,m=a[j];var q=1,r=q,s=q,t=b[i+1],u=0,v=0;for(var e=j-1;e>=i;e--){s=r,r=q,v=u,l=q*b[e],p=q*m,n=science.hypot(m,b[e]),b[e+1]=u*n,u=b[e]/n,q=m/n,m=q*a[e]-u*l,a[e+1]=p+u*(q*l+u*a[e]);for(var w=0;w<d;w++)p=c[w][e+1],c[w][e+1]=u*c[w][e]+q*p,c[w][e]=q*c[w][e]-u*p}m=-u*v*s*t*b[i]/o,b[i]=u*m,a[i]=q*m}while(Math.abs(b[i])>h*g)}a[i]=a[i]+f,b[i]=0}for(var e=0;e<d-1;e++){var w=e,m=a[e];for(var x=e+1;x<d;x++)a[x]<m&&(w=x,m=a[x]);if(w!=e){a[w]=a[e],a[e]=m;for(var x=0;x<d;x++)m=c[x][e],c[x][e]=c[x][w],c[x][w]=m}}}function d(a,b){var c=a.length,d=[],e=0,f=c-1;for(var g=e+1;g<f;g++){var h=0;for(var i=g;i<=f;i++)h+=Math.abs(a[i][g-1]);if(h!==0){var j=0;for(var i=f;i>=g;i--)d[i]=a[i][g-1]/h,j+=d[i]*d[i];var k=Math.sqrt(j);d[g]>0&&(k=-k),j-=d[g]*k,d[g]=d[g]-k;for(var l=g;l<c;l++){var m=0;for(var i=f;i>=g;i--)m+=d[i]*a[i][l];m/=j;for(var i=g;i<=f;i++)a[i][l]-=m*d[i]}for(var i=0;i<=f;i++){var m=0;for(var l=f;l>=g;l--)m+=d[l]*a[i][l];m/=j;for(var l=g;l<=f;l++)a[i][l]-=m*d[l]}d[g]=h*d[g],a[g][g-1]=h*k}}for(var i=0;i<c;i++)for(var l=0;l<c;l++)b[i][l]=i===l?1:0;for(var g=f-1;g>=e+1;g--)if(a[g][g-1]!==0){for(var i=g+1;i<=f;i++)d[i]=a[i][g-1];for(var l=g;l<=f;l++){var k=0;for(var i=g;i<=f;i++)k+=d[i]*b[i][l];k=k/d[g]/a[g][g-1];for(var i=g;i<=f;i++)b[i][l]+=k*d[i]}}}function e(a,b,c,d){var e=c.length,g=e-1,h=0,i=e-1,j=1e-12,k=0,l=0,m=0,n=0,o=0,p=0,q,r,s,t,u=0;for(var v=0;v<e;v++){if(v<h||v>i)a[v]=c[v][v],b[v]=0;for(var w=Math.max(v-1,0);w<e;w++)u+=Math.abs(c[v][w])}var x=0;while(g>=h){var y=g;while(y>h){o=Math.abs(c[y-1][y-1])+Math.abs(c[y][y]),o===0&&(o=u);if(Math.abs(c[y][y-1])<j*o)break;y--}if(y===g)c[g][g]=c[g][g]+k,a[g]=c[g][g],b[g]=0,g--,x=0;else if(y===g-1){r=c[g][g-1]*c[g-1][g],l=(c[g-1][g-1]-c[g][g])/2,m=l*l+r,p=Math.sqrt(Math.abs(m)),c[g][g]=c[g][g]+k,c[g-1][g-1]=c[g-1][g-1]+k,s=c[g][g];if(m>=0){p=l+(l>=0?p:-p),a[g-1]=s+p,a[g]=a[g-1],p!==0&&(a[g]=s-r/p),b[g-1]=0,b[g]=0,s=c[g][g-1],o=Math.abs(s)+Math.abs(p),l=s/o,m=p/o,n=Math.sqrt(l*l+m*m),l/=n,m/=n;for(var w=g-1;w<e;w++)p=c[g-1][w],c[g-1][w]=m*p+l*c[g][w],c[g][w]=m*c[g][w]-l*p;for(var v=0;v<=g;v++)p=c[v][g-1],c[v][g-1]=m*p+l*c[v][g],c[v][g]=m*c[v][g]-l*p;for(var v=h;v<=i;v++)p=d[v][g-1],d[v][g-1]=m*p+l*d[v][g],d[v][g]=m*d[v][g]-l*p}else a[g-1]=s+l,a[g]=s+l,b[g-1]=p,b[g]=-p;g-=2,x=0}else{s=c[g][g],t=0,r=0,y<g&&(t=c[g-1][g-1],r=c[g][g-1]*c[g-1][g]);if(x==10){k+=s;for(var v=h;v<=g;v++)c[v][v]-=s;o=Math.abs(c[g][g-1])+Math.abs(c[g-1][g-2]),s=t=.75*o,r=-0.4375*o*o}if(x==30){o=(t-s)/2,o=o*o+r;if(o>0){o=Math.sqrt(o),t<s&&(o=-o),o=s-r/((t-s)/2+o);for(var v=h;v<=g;v++)c[v][v]-=o;k+=o,s=t=r=.964}}x++;var z=g-2;while(z>=y){p=c[z][z],n=s-p,o=t-p,l=(n*o-r)/c[z+1][z]+c[z][z+1],m=c[z+1][z+1]-p-n-o,n=c[z+2][z+1],o=Math.abs(l)+Math.abs(m)+Math.abs(n),l/=o,m/=o,n/=o;if(z==y)break;if(Math.abs(c[z][z-1])*(Math.abs(m)+Math.abs(n))<j*Math.abs(l)*(Math.abs(c[z-1][z-1])+Math.abs(p)+Math.abs(c[z+1][z+1])))break;z--}for(var v=z+2;v<=g;v++)c[v][v-2]=0,v>z+2&&(c[v][v-3]=0);for(var A=z;A<=g-1;A++){var B=A!=g-1;A!=z&&(l=c[A][A-1],m=c[A+1][A-1],n=B?c[A+2][A-1]:0,s=Math.abs(l)+Math.abs(m)+Math.abs(n),s!=0&&(l/=s,m/=s,n/=s));if(s==0)break;o=Math.sqrt(l*l+m*m+n*n),l<0&&(o=-o);if(o!=0){A!=z?c[A][A-1]=-o*s:y!=z&&(c[A][A-1]=-c[A][A-1]),l+=o,s=l/o,t=m/o,p=n/o,m/=l,n/=l;for(var w=A;w<e;w++)l=c[A][w]+m*c[A+1][w],B&&(l+=n*c[A+2][w],c[A+2][w]=c[A+2][w]-l*p),c[A][w]=c[A][w]-l*s,c[A+1][w]=c[A+1][w]-l*t;for(var v=0;v<=Math.min(g,A+3);v++)l=s*c[v][A]+t*c[v][A+1],B&&(l+=p*c[v][A+2],c[v][A+2]=c[v][A+2]-l*n),c[v][A]=c[v][A]-l,c[v][A+1]=c[v][A+1]-l*m;for(var v=h;v<=i;v++)l=s*d[v][A]+t*d[v][A+1],B&&(l+=p*d[v][A+2],d[v][A+2]=d[v][A+2]-l*n),d[v][A]=d[v][A]-l,d[v][A+1]=d[v][A+1]-l*m}}}}if(u==0)return;for(g=e-1;g>=0;g--){l=a[g],m=b[g];if(m==0){var y=g;c[g][g]=1;for(var v=g-1;v>=0;v--){r=c[v][v]-l,n=0;for(var w=y;w<=g;w++)n+=c[v][w]*c[w][g];if(b[v]<0)p=r,o=n;else{y=v,b[v]===0?c[v][g]=-n/(r!==0?r:j*u):(s=c[v][v+1],t=c[v+1][v],m=(a[v]-l)*(a[v]-l)+b[v]*b[v],q=(s*o-p*n)/m,c[v][g]=q,Math.abs(s)>Math.abs(p)?c[v+1][g]=(-n-r*q)/s:c[v+1][g]=(-o-t*q)/p),q=Math.abs(c[v][g]);if(j*q*q>1)for(var w=v;w<=g;w++)c[w][g]=c[w][g]/q}}}else if(m<0){var y=g-1;if(Math.abs(c[g][g-1])>Math.abs(c[g-1][g]))c[g-1][g-1]=m/c[g][g-1],c[g-1][g]=-(c[g][g]-l)/c[g][g-1];else{var C=f(0,-c[g-1][g],c[g-1][g-1]-l,m);c[g-1][g-1]=C[0],c[g-1][g]=C[1]}c[g][g-1]=0,c[g][g]=1;for(var v=g-2;v>=0;v--){var D=0,E=0,F,G;for(var w=y;w<=g;w++)D+=c[v][w]*c[w][g-1],E+=c[v][w]*c[w][g];r=c[v][v]-l;if(b[v]<0)p=r,n=D,o=E;else{y=v;if(b[v]==0){var C=f(-D,-E,r,m);c[v][g-1]=C[0],c[v][g]=C[1]}else{s=c[v][v+1],t=c[v+1][v],F=(a[v]-l)*(a[v]-l)+b[v]*b[v]-m*m,G=(a[v]-l)*2*m,F==0&G==0&&(F=j*u*(Math.abs(r)+Math.abs(m)+Math.abs(s)+Math.abs(t)+Math.abs(p)));var C=f(s*n-p*D+m*E,s*o-p*E-m*D,F,G);c[v][g-1]=C[0],c[v][g]=C[1];if(Math.abs(s)>Math.abs(p)+Math.abs(m))c[v+1][g-1]=(-D-r*c[v][g-1]+m*c[v][g])/s,c[v+1][g]=(-E-r*c[v][g]-m*c[v][g-1])/s;else{var C=f(-n-t*c[v][g-1],-o-t*c[v][g],p,m);c[v+1][g-1]=C[0],c[v+1][g]=C[1]}}q=Math.max(Math.abs(c[v][g-1]),Math.abs(c[v][g]));if(j*q*q>1)for(var w=v;w<=g;w++)c[w][g-1]=c[w][g-1]/q,c[w][g]=c[w][g]/q}}}}for(var v=0;v<e;v++)if(v<h||v>i)for(var w=v;w<e;w++)d[v][w]=c[v][w];for(var w=e-1;w>=h;w--)for(var v=h;v<=i;v++){p=0;for(var A=h;A<=Math.min(w,i);A++)p+=d[v][A]*c[A][w];d[v][w]=p}}function f(a,b,c,d){if(Math.abs(c)>Math.abs(d)){var e=d/c,f=c+e*d;return[(a+e*b)/f,(b-e*a)/f]}var e=c/d,f=d+e*c;return[(e*a+b)/f,(e*b-a)/f]}science.lin={},science.lin.decompose=function(){function a(a){var f=a.length,g=[],h=[],i=[];for(var j=0;j<f;j++)g[j]=[],h[j]=[],i[j]=[];var k=!0;for(var l=0;l<f;l++)for(var j=0;j<f;j++)if(a[j][l]!==a[l][j]){k=!1;break}if(k){for(var j=0;j<f;j++)g[j]=a[j].slice();b(h,i,g),c(h,i,g)}else{var m=[];for(var j=0;j<f;j++)m[j]=a[j].slice();d(m,g),e(h,i,m,g)}var n=[];for(var j=0;j<f;j++){var o=n[j]=[];for(var l=0;l<f;l++)o[l]=j===l?h[j]:0;n[j][i[j]>0?j+1:j-1]=i[j]}return{D:n,V:g}}return a},science.lin.cross=function(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]},science.lin.dot=function(a,b){var c=0,d=-1,e=Math.min(a.length,b.length);while(++d<e)c+=a[d]*b[d];return c},science.lin.length=function(a){return Math.sqrt(science.lin.dot(a,a))},science.lin.normalize=function(a){var b=science.lin.length(a);return a.map(function(a){return a/b})},science.lin.determinant=function(a){var b=a[0].concat(a[1]).concat(a[2]).concat(a[3]);return b[12]*b[9]*b[6]*b[3]-b[8]*b[13]*b[6]*b[3]-b[12]*b[5]*b[10]*b[3]+b[4]*b[13]*b[10]*b[3]+b[8]*b[5]*b[14]*b[3]-b[4]*b[9]*b[14]*b[3]-b[12]*b[9]*b[2]*b[7]+b[8]*b[13]*b[2]*b[7]+b[12]*b[1]*b[10]*b[7]-b[0]*b[13]*b[10]*b[7]-b[8]*b[1]*b[14]*b[7]+b[0]*b[9]*b[14]*b[7]+b[12]*b[5]*b[2]*b[11]-b[4]*b[13]*b[2]*b[11]-b[12]*b[1]*b[6]*b[11]+b[0]*b[13]*b[6]*b[11]+b[4]*b[1]*b[14]*b[11]-b[0]*b[5]*b[14]*b[11]-b[8]*b[5]*b[2]*b[15]+b[4]*b[9]*b[2]*b[15]+b[8]*b[1]*b[6]*b[15]-b[0]*b[9]*b[6]*b[15]-b[4]*b[1]*b[10]*b[15]+b[0]*b[5]*b[10]*b[15]},science.lin.gaussjordan=function(a,b){b||(b=1e-10);var c=a.length,d=a[0].length,e=-1,f,g;while(++e<c){var h=e;f=e;while(++f<c)Math.abs(a[f][e])>Math.abs(a[h][e])&&(h=f);var i=a[e];a[e]=a[h],a[h]=i;if(Math.abs(a[e][e])<=b)return!1;f=e;while(++f<c){var j=a[f][e]/a[e][e];g=e-1;while(++g<d)a[f][g]-=a[e][g]*j}}e=c;while(--e>=0){var j=a[e][e];f=-1;while(++f<e){g=d;while(--g>=e)a[f][g]-=a[e][g]*a[f][e]/j}a[e][e]/=j,g=c-1;while(++g<d)a[e][g]/=j}return!0},science.lin.inverse=function(a){var b=a.length,c=-1;if(b!==a[0].length)return;a=a.map(function(a,c){var d=new Array(b),e=-1;while(++e<b)d[e]=c===e?1:0;return a.concat(d)}),science.lin.gaussjordan(a);while(++c<b)a[c]=a[c].slice(b);return a},science.lin.multiply=function(a,b){var c=a.length,d=b[0].length,e=b.length,f=-1,g,h;if(e!==a[0].length)throw{error:"columns(a) != rows(b); "+a[0].length+" != "+e};var i=new Array(c);while(++f<c){i[f]=new Array(d),g=-1;while(++g<d){var j=0;h=-1;while(++h<e)j+=a[f][h]*b[h][g];i[f][g]=j}}return i},science.lin.transpose=function(a){var b=a.length,c=a[0].length,d=-1,e,f=new Array(c);while(++d<c){f[d]=new Array(b),e=-1;while(++e<b)f[d][e]=a[e][d]}return f},science.lin.tridag=function(a,b,c,d,e,f){var g,h;for(g=1;g<f;g++)h=a[g]/b[g-1],b[g]-=h*c[g-1],d[g]-=h*d[g-1];e[f-1]=d[f-1]/b[f-1];for(g=f-2;g>=0;g--)e[g]=(d[g]-c[g]*e[g+1])/b[g]}}(this),function(a){function b(a,b){if(!a||!b||a.length!==b.length)return!1;var c=a.length,d=-1;while(++d<c)if(a[d]!==b[d])return!1;return!0}function c(a,c){var d=c.length;if(a>d)return null;var e=[],f=[],g={},h=0,i=0,j,k,l;while(i<a){if(h===d)return null;var m=Math.floor(Math.random()*d);if(m in g)continue;g[m]=1,h++,k=c[m],l=!0;for(j=0;j<i;j++)if(b(k,e[j])){l=!1;break}l&&(e[i]=k,f[i]=m,i++)}return e}function d(a,b,c,d){var e=[],f=a+c,g=b.length,h=-1;while(++h<g)e[h]=(a*b[h]+c*d[h])/f;return e}function e(a){var b=a.length,c=-1;while(++c<b)if(!isFinite(a[c]))return!1;return!0}function f(a){var b=a.length,c=0;while(++c<b)if(a[c-1]>=a[c])return!1;return!0}function g(a){return(a=1-a*a*a)*a*a}function h(a,b,c,d){var e=d[0],f=d[1],g=i(b,f);if(g<a.length&&a[g]-a[c]<a[c]-a[e]){var h=i(b,e);d[0]=h,d[1]=g}}function i(a,b){var c=b+1;while(c<a.length&&a[c]===0)c++;return c}science.stats={},science.stats.bandwidth={nrd0:function(a){var b=Math.sqrt(science.stats.variance(a));return(lo=Math.min(b,science.stats.iqr(a)/1.34))||(lo=b)||(lo=Math.abs(a[1]))||(lo=1),.9*lo*Math.pow(a.length,-0.2)},nrd:function(a){var b=science.stats.iqr(a)/1.34;return 1.06*Math.min(Math.sqrt(science.stats.variance(a)),b)*Math.pow(a.length,-0.2)}},science.stats.distance={euclidean:function(a,b){var c=a.length,d=-1,e=0,f;while(++d<c)f=a[d]-b[d],e+=f*f;return Math.sqrt(e)},manhattan:function(a,b){var c=a.length,d=-1,e=0;while(++d<c)e+=Math.abs(a[d]-b[d]);return e},minkowski:function(a){return function(b,c){var d=b.length,e=-1,f=0;while(++e<d)f+=Math.pow(Math.abs(b[e]-c[e]),a);return Math.pow(f,1/a)}},chebyshev:function(a,b){var c=a.length,d=-1,e=0,f;while(++d<c)f=Math.abs(a[d]-b[d]),f>e&&(e=f);return e},hamming:function(a,b){var c=a.length,d=-1,e=0;while(++d<c)a[d]!==b[d]&&e++;return e},jaccard:function(a,b){var c=a.length,d=-1,e=0;while(++d<c)a[d]===b[d]&&e++;return e/c},braycurtis:function(a,b){var c=a.length,d=-1,e=0,f=0,g,h;while(++d<c)g=a[d],h=b[d],e+=Math.abs(g-h),f+=Math.abs(g+h);return e/f}},science.stats.erf=function(a){var b=.254829592,c=-0.284496736,d=1.421413741,e=-1.453152027,f=1.061405429,g=.3275911,h=a<0?-1:1;a<0&&(h=-1,a=-a);var i=1/(1+g*a);return h*(1-((((f*i+e)*i+d)*i+c)*i+b)*i*Math.exp(-a*a))},science.stats.phi=function(a){return.5*(1+science.stats.erf(a/Math.SQRT2))},science.stats.kernel={uniform:function(a){return a<=1&&a>=-1?.5:0},triangular:function(a){return a<=1&&a>=-1?1-Math.abs(a):0},epanechnikov:function(a){return a<=1&&a>=-1?.75*(1-a*a):0},quartic:function(a){if(a<=1&&a>=-1){var b=1-a*a;return.9375*b*b}return 0},triweight:function(a){if(a<=1&&a>=-1){var b=1-a*a;return 35/32*b*b*b}return 0},gaussian:function(a){return 1/Math.sqrt(2*Math.PI)*Math.exp(-0.5*a*a)},cosine:function(a){return a<=1&&a>=-1?Math.PI/4*Math.cos(Math.PI/2*a):0}},science.stats.kde=function(){function d(d,e){var f=c.call(this,b);return d.map(function(c){var d=-1,e=0,g=b.length;while(++d<g)e+=a((c-b[d])/f);return[c,e/f/g]})}var a=science.stats.kernel.gaussian,b=[],c=science.stats.bandwidth.nrd;return d.kernel=function(b){return arguments.length?(a=b,d):a},d.sample=function(a){return arguments.length?(b=a,d):b},d.bandwidth=function(a){return arguments.length?(c=science.functor(a),d):c},d},science.stats.kmeans=function(){function f(f){var g=f.length,h=[],i=[],j=1,l=0,m=c(e,f),n,o,p,q,r,s,t;while(j&&l<d){p=-1;while(++p<e)i[p]=0;o=-1;while(++o<g){q=f[o],s=Infinity,p=-1;while(++p<e)r=a.call(this,m[p],q),r<s&&(s=r,t=p);i[h[o]=t]++}n=[],o=-1;while(++o<g){q=h[o],r=n[q];if(r==null)n[q]=f[o].slice();else{p=-1;while(++p<r.length)r[p]+=f[o][p]}}p=-1;while(++p<e){q=n[p],r=1/i[p],o=-1;while(++o<q.length)q[o]*=r}j=0,p=-1;while(++p<e)if(!b(n[p],m[p])){j=1;break}m=n,l++}return{assignments:h,centroids:m}}var a=science.stats.distance.euclidean,d=1e3,e=1;return f.k=function(a){return arguments.length?(e=a,f):e},f.distance=function(b){return arguments.length?(a=b,f):a},f},science.stats.hcluster=function(){function c(c){var e=c.length,f=[],g=[],h=[],i=[],j,k,l,m,n,o,p,q;p=-1;while(++p<e){f[p]=0,h[p]=[],q=-1;while(++q<e)h[p][q]=p===q?Infinity:a(c[p],c[q]),h[p][f[p]]>h[p][q]&&(f[p]=q)}p=-1;while(++p<e)i[p]=[],i[p][0]={left:null,right:null,dist:0,centroid:c[p],size:1,depth:0},g[p]=1;for(n=0;n<e-1;n++){j=0;for(p=0;p<e;p++)h[p][f[p]]<h[j][f[j]]&&(j=p);k=f[j],l=i[j][0],m=i[k][0];var r={left:l,right:m,dist:h[j][k],centroid:d(l.size,l.centroid,m.size,m.centroid),size:l.size+m.size,depth:1+Math.max(l.depth,m.depth)};i[j].splice(0,0,r),g[j]+=g[k];for(q=0;q<e;q++)switch(b){case"single":h[j][q]>h[k][q]&&(h[q][j]=h[j][q]=h[k][q]);break;case"complete":h[j][q]<h[k][q]&&(h[q][j]=h[j][q]=h[k][q]);break;case"average":h[q][j]=h[j][q]=(g[j]*h[j][q]+g[k]*h[k][q])/(g[j]+g[q])}h[j][j]=Infinity;for(p=0;p<e;p++)h[p][k]=h[k][p]=Infinity;for(q=0;q<e;q++)f[q]==k&&(f[q]=j),h[j][q]<h[j][f[j]]&&(f[j]=q);o=r}return o}var a=science.stats.distance.euclidean,b="simple";return c.distance=function(b){return arguments.length?(a=b,c):a},c},science.stats.iqr=function(a){var b=science.stats.quantiles(a,[.25,.75]);return b[1]-b[0]},science.stats.loess=function(){function d(d,i,j){var k=d.length,l;if(k!==i.length)throw{error:"Mismatched array lengths"};if(k==0)throw{error:"At least one point required."};if(arguments.length<3){j=[],l=-1;while(++l<k)j[l]=1}e(d),e(i),e(j),f(d);if(k==1)return[i[0]];if(k==2)return[i[0],i[1]];var m=Math.floor(a*k);if(m<2)throw{error:"Bandwidth too small."};var n=[],o=[],p=[];l=-1;while(++l<k)n[l]=0,o[l]=0,p[l]=1;var q=-1;while(++q<=b){var r=[0,m-1],s;l=-1;while(++l<k){s=d[l],l>0&&h(d,j,l,r);var t=r[0],u=r[1],v=d[l]-d[t]>d[u]-d[l]?t:u,w=0,x=0,y=0,z=0,A=0,B=Math.abs(1/(d[v]-s));for(var C=t;C<=u;++C){var D=d[C],E=i[C],F=C<l?s-D:D-s,G=g(F*B)*p[C]*j[C],H=D*G;w+=G,x+=H,y+=D*H,z+=E*G,A+=E*H}var I=x/w,J=z/w,K=A/w,L=y/w,M=Math.sqrt(Math.abs(L-I*I))<c?0:(K-I*J)/(L-I*I),N=J-M*I;n[l]=M*s+N,o[l]=Math.abs(i[l]-n[l])}if(q===b)break;var O=o.slice();O.sort();var P=O[Math.floor(k/2)];if(Math.abs(P)<c)break;var Q,G;l=-1;while(++l<k)Q=o[l]/(6*P),p[l]=Q>=1?0:(G=1-Q*Q)*G}return n}var a=.3,b=2,c=1e-12;return d.bandwidth=function(b){return arguments.length?(a=b,d):b},d.robustnessIterations=function(a){return arguments.length?(b=a,d):a},d.accuracy=function(a){return arguments.length?(c=a,d):a},d},science.stats.mean=function(a){var b=a.length;if(b===0)return NaN;var c=0,d=-1;while(++d<b)c+=(a[d]-c)/(d+1);return c},science.stats.median=function(a){return science.stats.quantiles(a,[.5])[0]},science.stats.mode=function(a){var b={},c=[],d=0,e=a.length,f=-1,g,h;while(++f<e)h=b.hasOwnProperty(g=a[f])?++b[g]:b[g]=1,h===d?c.push(g):h>d&&(d=h,c=[g]);if(c.length===1)return c[0]},science.stats.quantiles=function(a,b){a=a.slice().sort(science.ascending);var c=a.length-1;return b.map(function(b){if(b===0)return a[0];if(b===1)return a[c];var d=1+b*c,e=Math.floor(d),f=d-e,g=a[e-1];return f===0?g:g+f*(a[e]-g)})},science.stats.variance=function(a){var b=a.length;if(b<1)return NaN;if(b===1)return 0;var c=science.stats.mean(a),d=-1,e=0;while(++d<b){var f=a[d]-c;e+=f*f}return e/(b-1)},science.stats.distribution={},science.stats.distribution.gaussian=function(){function e(){var d,e,f,g;do d=2*a()-1,e=2*a()-1,f=d*d+e*e;while(f>=1||f===0);return b+c*d*Math.sqrt(-2*Math.log(f)/f)}var a=Math.random,b=0,c=1,d=1;return e.pdf=function(a){return a=(a-b)/c,science_stats_distribution_gaussianConstant*Math.exp(-0.5*a*a)/c},e.cdf=function(a){return a=(a-b)/c,.5*(1+science.stats.erf(a/Math.SQRT2))},e.mean=function(a){return arguments.length?(b=+a,e):b},e.variance=function(a){return arguments.length?(c=Math.sqrt(d=+a),e):d},e.random=function(b){return arguments.length?(a=b,e):a},e},science_stats_distribution_gaussianConstant=1/Math.sqrt(2*Math.PI)}(this)})(this);/*global DBCollection, DBQuery, print, tojson */
/*jslint indent: 4, plusplus: true, nomen: true */
/**
 * MongoDB - distinct2.js
 * 
 *      Version: 1.5
 *         Date: December 12, 2012
 *      Project: http://skratchdot.com/projects/mongodb-distinct2/
 *  Source Code: https://github.com/skratchdot/mongodb-distinct2/
 *       Issues: https://github.com/skratchdot/mongodb-distinct2/issues/
 * Dependencies: MongoDB v1.8+
 *               JSON2.js (https://github.com/douglascrockford/JSON-js)
 * 
 * Copyright (c) 2012 SKRATCHDOT.COM
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
(function () {
    'use strict';

        // config variables
    var currentDate,
        currentTick = (new Date()).getTime(),
        previousTick = (new Date()).getTime(),
        statusIntervalInMs = 10000,
        // functions
        isArray,
        getFromKeyString,
        getHashKey,
        printStatus,
        setStatusInterval;

    /**
     * Same behavior as Array.isArray()
     * @function
     * @name isArray
     * @private
     * @param obj {*} The object to test
     * @returns {boolean} Will return true of obj is an array, otherwise will return false
     */
    isArray = function (obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    };

    /**
     * @function
     * @name getFromKeyString
     * @private
     * @param obj {object} The object to search
     * @param keyString {string} A dot delimited string path
     * @returns {object|undefined} If we find the path provide by keyString, we will return the value at that path
     */
    getFromKeyString = function (obj, keyString) {
        var arr, i;
        if (typeof keyString === 'string') {
            arr = keyString.split('.');
            for (i = 0; i < arr.length; i++) {
                if (obj && typeof obj === 'object' && obj.hasOwnProperty(arr[i])) {
                    obj = obj[arr[i]];
                } else {
                    return;
                }
            }
            return obj;
        }
    };

    /**
     * @function
     * @name printStatus
     * @private
     * @param currentDocNum {number} - Number of the current document being processed
     * @param numDocs {number}       - Total number of documents being processed
     * @param distinctCount {number} - Total number of distinct items found so far
     */
    printStatus = function (currentDocNum, numDocs, distinctCount) {
        // Output some debugging info if needed
        if (statusIntervalInMs > 0) {
            currentDate = new Date();
            currentTick = currentDate.getTime();
            if (currentTick - previousTick > statusIntervalInMs) {
                print('Processed ' + currentDocNum + ' of ' + numDocs + ' document(s) and found ' + distinctCount + ' distinct items at ' + currentDate);
                previousTick = currentTick;
            }
        }
    };

    /**
     * @function
     * @name setStatusInterval
     * @private
     * @param intervalInMs {number} Will print out a status message after this many
     *                              milliseconds. If a non-positive number is passed in,
     *                              then no status messages will be printed.
     */
    setStatusInterval = function (intervalInMs) {
        if (typeof intervalInMs === 'number') {
            statusIntervalInMs = intervalInMs;
        }
    };

    /**
     * @function
     * @name distinct2
     * @memberOf DBQuery
     * @param keys {string|array} The array of dot delimited keys to get the distinct values for
     * @param count {boolean} Whether or not to append
     * @returns {array} If keys is a string, and count is false, then we behave like .distinct().
     *                  If keys is a positive sized array, we will return an array of arrays.
     *                  If count is true, we will return an array of arrays where the last value is the count.
     */
    DBQuery.prototype.distinct2 = function (keys, count) {
        var i = 0,
            currentDocNum = 0,
            numDocs = this.size(),
            distinctCount = 0,
            returnArray = [],
            tempArray = [],
            arrayOfValues = false,
            dataOrder = [],
            data = {};

        // if passed a string, convert it into an array
        if (typeof keys === 'string') {
            keys = [keys];
        }

        // if keys is not a positive sized array by now, do nothing
        if (!isArray(keys) || keys.length === 0) {
            return returnArray;
        }

        // update tick for printing status line
        previousTick = (new Date()).getTime();

        // populate data object
        this.forEach(function (obj) {
            var i, values = [], key = '', isDefined = false;
            for (i = 0; i < keys.length; i++) {
                values[i] = getFromKeyString(obj, keys[i]);
                if (typeof values[i] !== 'undefined') {
                    isDefined = true;
                }
            }
            if (isDefined) {
                key = getHashKey(values);
                if (data.hasOwnProperty(key)) {
                    data[key].count = data[key].count + 1;
                } else {
                    dataOrder.push(key);
                    data[key] = {
                        values : values,
                        count : 1
                    };
                }
            }
            // print status info
            printStatus(++currentDocNum, numDocs, dataOrder.length);
        });

        // should we return an array of values?
        if (keys.length === 1 && !count) {
            arrayOfValues = true;
        }

        for (i = 0; i < dataOrder.length; i++) {
            if (arrayOfValues) { // we return an array of values
                returnArray.push(data[dataOrder[i]].values[0]);
            } else { // we return an array of arrays
                tempArray = data[dataOrder[i]].values;
                if (count) {
                    tempArray.push(data[dataOrder[i]].count);
                }
                returnArray.push(tempArray);
            }
        }

        return returnArray;
    };

    /**
     * @function
     * @name distinct2
     * @memberOf DBCollection
     * @param keys {string|array} The array of dot delimited keys to get the distinct values for
     * @param count {boolean} Whether or not to append
     * @returns {array} If keys is a string, and count is false, then we behave like .distinct().
     *                  If keys is a positive sized array, we will return an array of arrays.
     *                  If count is true, we will return an array of arrays where the last value is the count.
     */
    DBCollection.prototype.distinct2 = function (keys, count) {
        var fields = {}, i, excludeId = true;
        if (typeof keys === 'string') {
            keys = [keys];
        }
        if (!isArray(keys)) {
            keys = [];
        }
        for (i = 0; i < keys.length; i++) {
            fields[keys[i]] = 1;
            if (keys[i] === '_id') {
                excludeId = false;
            }
        }
        if (!excludeId) {
            fields._id = 0;
        }
        return this.find({}, fields).distinct2(keys, count);
    };

    // Attach setStatusInterval to both versions of distinct2
    DBQuery.prototype.distinct2.setStatusInterval = setStatusInterval;
    DBCollection.prototype.distinct2.setStatusInterval = setStatusInterval;

    // set the correct getHashKey function
    if (typeof JSON !== 'undefined' && typeof JSON.stringify === 'function') {
        getHashKey = JSON.stringify;
    } else if (typeof tojson === 'function') {
        getHashKey = tojson;
    } else {
        getHashKey = function (obj) {
            return obj;
        };
    }
}());/*global DBCollection: false, DBQuery: false */
/*jslint devel: false, nomen: true, maxerr: 50, indent: 4 */
/**
 * MongoDB - distinct-types.js
 * 
 *      Version: 1.0
 *         Date: April 29, 2012
 *      Project: http://skratchdot.github.com/mongodb-distinct-types/
 *  Source Code: https://github.com/skratchdot/mongodb-distinct-types/
 *       Issues: https://github.com/skratchdot/mongodb-distinct-types/issues/
 * Dependencies: MongoDB v1.8+
 * 
 * Description:
 * 
 * Similar to the db.myCollection.distinct() function, distinctTypes() will return
 * "types" rather than "values".  To accomplish this, it adds the following
 * function to the DBCollection prototype:
 * 
 *     DBCollection.prototype.distinctTypes = function (keyString, query, limit, skip) {};
 * 
 * Usage:
 * 
 * db.users.distinctTypes('name'); // we hope this would return ['bson'] not ['bson','string']
 * db.users.distinctTypes('name.first'); // should return ['string']
 * db.users.distinctTypes('address.phone'); // should return ['string']
 * db.users.distinctTypes('address.phone', {'name.first':'Bob'}); // only search documents that have { 'name.first' : 'Bob' }
 * db.users.distinctTypes('address.phone', {}, 10); // only search the first 10 documents
 * db.users.distinctTypes('address.phone', {}, 10, 5); // only search documents 10-15
 * 
 * Caveats:
 * 
 * By design, distinctTypes() returns 'bson' rather than 'object'.
 * It will return 'numberlong' rather than 'number', etc.
 * 
 * Copyright (c) 2012 SKRATCHDOT.COM
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
(function () {
	'use strict';

	var getType = function (obj) {
			return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
		},
		getFromKeyString = function (obj, keyString) {
			var returnValue = {
					value : null,
					found : false
				},
				dotIndex = keyString.indexOf('.'),
				currentKey = '',
				newKeyString = '';
			if (dotIndex < 0) {
				if (obj.hasOwnProperty(keyString)) {
					returnValue = {
						value : obj[keyString],
						found : true
					};
				}
			} else {
				currentKey = keyString.substr(0, dotIndex);
				newKeyString = keyString.substr(dotIndex + 1);
				if (obj.hasOwnProperty(currentKey)) {
					returnValue = getFromKeyString(obj[currentKey], newKeyString);
				}
			}
			return returnValue;
		};

	/**
	 * @function
	 * @name distinctTypes
	 * @memberOf DBCollection
	 * @param {string} keyString The key (using dot notation) to return distinct types for
	 * @param {object} query A mongo query in the same format that db.myCollection.find() accepts.
	 * @param {number} limit Limit the result set by this number.
	 * @param {number} skip The number of records to skip.
	 */
	DBCollection.prototype.distinctTypes = function (keyString, query, limit, skip) {
		var fields = {},
			queryResult = null,
			result = [];
		if (typeof keyString !== 'string') {
			keyString = '';
		}
		fields[keyString] = 1;
		queryResult = new DBQuery(this._mongo, this._db, this, this._fullName,
				this._massageObject(query), fields, limit, skip).forEach(function (doc) {
			var type = '', currentValue = getFromKeyString(doc, keyString);
			if (currentValue.found) {
				type = getType(currentValue.value);
				if (result.indexOf(type) === -1) {
					result.push(type);
				}
			}
		});
		return result;
	};
}());/*global DBCollection, DBQuery, print */
/*jslint devel: false, unparam: true, nomen: true, maxerr: 50, indent: 4, plusplus: true */
/**
 * MongoDB - flatten.js
 * 
 *      Version: 1.3
 *         Date: October 22, 2012
 *      Project: http://skratchdot.com/projects/mongodb-flatten/
 *  Source Code: https://github.com/skratchdot/mongodb-flatten/
 *       Issues: https://github.com/skratchdot/mongodb-flatten/issues/
 * Dependencies: MongoDB v1.8+
 * 
 * Copyright (c) 2012 SKRATCHDOT.COM
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
(function () {
	'use strict';

	var currentDb, emitKeys, insertKey, flatten,
		statusDelayInMs = 10000,
		currentId = null, currentDate = null, currentTick = null, previousTick = null;

	/**
	 * @function
	 * @name insertKey
	 * @memberOf anonymous
	 * @param {DBCollection} collection - the collection we are storing our flattened data in
	 * @param {ObjectId/object} id - the id of the document being flattened
	 * @param {string} key - the flattened key
	 * @param {any} value - the value of the flattened key
	 */
	insertKey = function (collection, id, key, value) {
		// Increment our currentId
		currentId = currentId + 1;

		// Insert document into our collection
		collection.insert({
			'_id' : currentId,
			'i' : id,
			'k' : key,
			'v' : value
		});
	};

	/**
	 * @function
	 * @name emitKeys
	 * @memberOf anonymous
	 * @param {DBCollection} collection - the collection we are storing our flattened data in
	 * @param {ObjectId/object} id - the id of the document being flattened
	 * @param {object} node - the current node being flattened. initially this is the entire document
	 * @param {string} keyString - the current key/path. will be built recursively. initially an empty string.
	 */
	emitKeys = function (collection, id, node, keyString) {
		var key, newKey, type = typeof (node);
		if (type === 'object' || type === 'array') {
			for (key in node) {
				if (node.hasOwnProperty(key)) {
					newKey = (keyString === '' ? key : keyString + '.' + key);
					if (newKey === '_id') {
						insertKey(collection, id, '_id', node[key]);
					} else {
						emitKeys(collection, id, node[key], newKey);
					}
				}
			}
		} else {
			insertKey(collection, id, keyString, node);
		}
	};

	/**
	 * @function
	 * @name flatten
	 * @memberOf anonymous
	 * @param {DBQuery} query - the current DBQuery object/cursor
	 * @param {string} collectionName - the name of the collection in which the results will be stored
	 */
	flatten = function (query, collectionName) {
		var collection, i, numDocs = query.size(), currentDoc, currentDocNum;

		// If an invalid name is passed, create a temporary collection
		if (typeof collectionName !== 'string' || collectionName.length === 0) {
			collectionName = 'temp.flatten_' + new Date().getTime();
		}

		// Print some debug info
		print('Flattening ' + numDocs + ' document(s) into the "' + collectionName + '" collection.');

		// Get our collection
		collection = query._db.getCollection(collectionName);

		// Empty our collection
		collection.drop();

		// Index our collection to speed up lookups
		collection.ensureIndex({i : 1});
		collection.ensureIndex({k : 1});
		collection.ensureIndex({v : 1});

		// Initialize some global counters/variables
		previousTick = new Date().getTime();
		currentId = 0;
		currentDocNum = 0;

		// Loop through all our objects, inserting records into our collection
		while (query.hasNext()) {
			// The current document we are processing
			currentDoc = query.next();
			currentDocNum++;

			// Output some debugging info if needed
			currentDate = new Date();
			currentTick = currentDate.getTime();
			if (currentTick - previousTick > statusDelayInMs) {
				print('Flattened ' + currentDocNum + ' of ' + numDocs + ' document(s) and ' + currentId + ' key(s) at ' + currentDate);
				previousTick = currentTick;
			}

			// There's a chance documents don't have
			// _id values (capped collections, internal collections)
			if (!currentDoc.hasOwnProperty('_id')) {
				currentDoc._id = 'unknown';
			}

			// Insert key/value pairs into our new collection
			emitKeys(collection, currentDoc._id, currentDoc, '');
		}

		return collection;
	};

	/**
	 * @function
	 * @name flatten
	 * @memberOf DBQuery
	 * @param {string} collectionName - the name of the collection in which the results will be stored
	 */
	DBQuery.prototype.flatten = function (collectionName) {
		return flatten(this, collectionName);
	};

	/**
	 * @function
	 * @name flatten
	 * @memberOf DBCollection
	 * @param {string} collectionName - the name of the collection in which the results will be stored
	 */
	DBCollection.prototype.flatten = function (collectionName) {
		return this.find().flatten(collectionName);
	};

}());/*global DBCollection: false, emit: false, print: false */
/*jslint devel: false, nomen: true, unparam: true, plusplus: true, maxerr: 50, indent: 4 */
/**
 * MongoDB - schema.js
 * 
 *      Version: 1.1
 *         Date: May 28, 2012
 *      Project: http://skratchdot.github.com/mongodb-schema/
 *  Source Code: https://github.com/skratchdot/mongodb-schema/
 *       Issues: https://github.com/skratchdot/mongodb-schema/issues/
 * Dependencies: MongoDB v1.8+
 * 
 * Description:
 * 
 * This is a schema analysis tool for MongoDB. It accomplishes this by
 * extended the mongo shell, and providing a new function called schema()
 * with the following signature:
 * 
 *     DBCollection.prototype.schema = function (optionsOrOutString)
 * 
 * Usage:
 * 
 *  The schema() function accepts all the same parameters that the mapReduce() function
 *  does. It adds/modifies the following 4 parameters that can be used as well:
 * 
 *      wildcards - array (default: [])
 *          By using the $, you can combine report results.
 *          For instance: '$' will group all top level keys and
 *          'foo.$.bar' will combine 'foo.baz.bar' and 'foo.bar.bar'
 * 
 *      arraysAreWildcards - boolean (default: true)
 *          When true, 'foo.0.bar' and 'foo.1.bar' will be
 *          combined into 'foo.$.bar'
 *          When false, all array keys will be reported
 * 
 *      fields - object (default: {})
 *          Similar to the usage in find(). You can pick the
 *          fields to include or exclude. Currently, you cannot
 *          pass in nested structures, you need to pass in dot notation keys.
 *      
 *      limit - number (default: 50)
 *          Behaves the same as the limit in mapReduce(), but defaults to 50.
 *          You can pass in 0 or -1 to process all documents.
 * 
 * Return schema results inline
 *     db.users.schema();
 * 
 * Create and store schema results in the 'users_schema' collection
 *     db.users.schema('users_schema'); // Option 1
 *     db.users.schema({out:'users_schema'}); // Option 2
 *     db.users.schema({out:{replace:'users_schema'}}); // Option 3
 * 
 * Only report on the key: 'name.first'
 *     db.users.schema({fields:{'name.first':1}});
 * 
 * Report on everything except 'name.first'
 *     db.users.schema({fields:{'name.first':-1}});
 * 
 * Combine the 'name.first' and 'name.last' keys into 'name.$'
 *     db.users.schema({wildcards:['name.$']});
 * 
 * Don't treat arrays as a wildcard
 *     db.users.schema({arraysAreWildcards:false});
 * 
 * Process 50 documents
 *     db.users.schema();
 * 
 * Process all documents
 *     db.users.schema({limit:-1});
 * 
 * Caveats:
 * 
 * By design, schema() returns 'bson' rather than 'object'.
 * It will return 'numberlong' rather than 'number', etc.
 * 
 * Inspired by:
 * 
 * Variety: https://github.com/JamesCropcho/variety
 * 
 * Copyright (c) 2012 SKRATCHDOT.COM
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
(function () {
	'use strict';

	/**
	 * You can pass in the same options object that mapReduce() accepts. Schema has the following
	 * defaults for options:
	 * 
	 * options.out = { inline : 1 };
	 * options.limit = 50;
	 * 
	 * You can pass in an options.limit value of 0 or -1 to parse _all_ documents.
	 * 
	 * @function
	 * @name flatten
	 * @memberOf DBCollection
	 * @param {object} optionsOrOutString This function accepts the same options as mapReduce
	 */
	DBCollection.prototype.schema = function (optionsOrOutString) {
		var statCount = 0, wildcards = [], arraysAreWildcards = true,
			field, fields = {}, usePositiveFields = false, useNegativeFields = false,
			getType, getNewKeyString, getKeyInfo, map, reduce, finalize, options = { limit : 50 };

		/**
		 * @function
		 * @name getType
		 * @private
		 * @param {object} obj The object to inspect
		 */
		getType = function (obj) {
			return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
		};

		/**
		 * @function
		 * @name getNewKeyString
		 * @private
		 * @param {string} key The current key
		 * @param {string} keyString The object to inspect
		 */
		getNewKeyString = function (key, keyString) {
			var i, j, keyArray, newKeyString, success, wc;
			newKeyString = (keyString === '' ? key : keyString + '.' + key);
			if (wildcards.length > 0) {
				keyArray = newKeyString.split('.');
				for (i = 0; i < wildcards.length; i++) {
					wc = wildcards[i].split('.');
					if (keyArray.length === wc.length) {
						success = true;
						for (j = 0; success && j <= wc.length; j++) {
							if (wc[j] !== '$' && wc[j] !== keyArray[j]) {
								success = false;
							}
						}
						if (success) {
							return wildcards[i];
						}
					}
				}
			}
			return newKeyString;
		};

		/**
		 * @function
		 * @name getKeyInfo
		 * @private
		 * @param {object} node The node from which we generate our keys
		 * @param {string} keyString A string representing the current key 'path'
		 * @param {object} keyInfo The struct that contains all our 'paths' as the key, and a count for it's value
		 */
		getKeyInfo = function (node, keyString, keyInfo) {
			var key, newKeyString, type, useArrayWildcard = false;

			// Store the mongo type. 'bson' instead of 'object', etc
			type = getType(node);

			// We need to handle objects and arrays by calling getKeyInfo() recursively
			if (['array', 'bson', 'object'].indexOf(type) >= 0) {

				// Set the flag to be used in our for loop below
				if (type === 'array' && arraysAreWildcards === true) {
					useArrayWildcard = true;
				}

				// Loop through each key
				for (key in node) {
					if (node.hasOwnProperty(key)) {
						if (useArrayWildcard) {
							newKeyString = keyString + '.$';
						} else {
							newKeyString = getNewKeyString(key, keyString);
						}
						keyInfo = getKeyInfo(node[key], newKeyString, keyInfo);
					}
				}

			}

			// We don't need to emit this key
			// Using a long statement to pass jslint
			// there are 3 parts to this:
			// 1: empty key
			// 2: usePostiveFields is true, and the current key is not valid
			// 3: useNegativeFields is true, and the current key exists in fields (and is -1)
			if (keyString === '' || (usePositiveFields && (!fields.hasOwnProperty(keyString) || fields[keyString] !== 1)) || (useNegativeFields && fields.hasOwnProperty(keyString) && fields[keyString] === -1)) {
				return keyInfo;
			}

			// We need to emit this key
			if (keyInfo.hasOwnProperty(keyString) && keyInfo[keyString].hasOwnProperty(type)) {
				keyInfo[keyString][type].perDoc += 1;
			} else {
				keyInfo[keyString] = {};
				keyInfo[keyString][type] = {
					docs : 1,
					coverage : 0,
					perDoc : 1
				};
			}

			return keyInfo;
		};

		/**
		 * @function
		 * @name map
		 * @private
		 */
		map = function () {
			var key, keyInfo, count, type;

			// Get our keyInfo struct
			keyInfo = getKeyInfo(this, '', {}, [], true);

			// Loop through keys, emitting info
			for (key in keyInfo) {
				if (keyInfo.hasOwnProperty(key)) {
					count = 0;
					for (type in keyInfo[key]) {
						if (keyInfo[key].hasOwnProperty(type)) {
							count += keyInfo[key][type].perDoc;
						}
					}
					keyInfo[key].all = {
						docs : 1,
						perDoc : count
					};
					emit(key, keyInfo[key]);
				}
			}
		};

		/**
		 * @function
		 * @name reduce
		 * @private
		 * @param {string} key The key that was emitted from our map function
		 * @param {array} values An array of values that was emitted from our map function
		 */
		reduce = function (key, values) {
			var result = {};
			values.forEach(function (value) {
				var type;
				for (type in value) {
					if (value.hasOwnProperty(type)) {
						if (!result.hasOwnProperty(type)) {
							result[type] = { docs : 0, coverage : 0, perDoc : 0 };
						}
						result[type].docs += value[type].docs;
						result[type].perDoc += value[type].perDoc;
					}
				}
			});
			return result;
		};

		/**
		 * @function
		 * @name finalize
		 * @private
		 * @param {string} key The key that was emitted/returned from our map/reduce functions
		 * @param {object} value The object that was returned from our reduce function
		 */
		finalize = function (key, value) {
			var type, result = {
				wildcard : (key.search(/^\$|\.\$/gi) >= 0),
				types : [],
				results : [{
					type : 'all',
					docs : value.all.docs,
					coverage : (value.all.docs / statCount) * 100,
					perDoc : value.all.perDoc / value.all.docs
				}]
			};
			for (type in value) {
				if (value.hasOwnProperty(type) && type !== 'all') {
					result.types.push(type);
					result.results.push({
						type : type,
						docs : value[type].docs,
						coverage : (value[type].docs / statCount) * 100,
						perDoc : value[type].perDoc / value[type].docs
					});
				}
			}
			return result;
		};

		// Start to setup our options struct
		if (typeof optionsOrOutString === 'object') {
			options = optionsOrOutString;
		} else if (typeof optionsOrOutString === 'string') {
			options.out = optionsOrOutString;
		}

		// The default value for out is 'inline'
		if (!options.hasOwnProperty('out')) {
			options.out = { inline : 1 };
		}

		// Was a valid wildcards option passed in?
		if (options.hasOwnProperty('wildcards') && getType(options.wildcards) === 'array') {
			wildcards = options.wildcards;
		}

		// Was a valid arraysAreWildcards option passed in?
		if (options.hasOwnProperty('arraysAreWildcards') && typeof options.arraysAreWildcards === 'boolean') {
			arraysAreWildcards = options.arraysAreWildcards;
		}

		// Was a valid fields option passed in?
		if (options.hasOwnProperty('fields') && getType(options.fields) === 'object' && Object.keySet(options.fields).length > 0) {
			fields = options.fields;
			for (field in fields) {
				if (fields.hasOwnProperty(field)) {
					if (fields[field] === 1 || fields[field] === true) {
						fields[field] = 1;
						usePositiveFields = true;
					} else {
						fields[field] = -1;
					}
				}
			}
			if (!usePositiveFields) {
				useNegativeFields = true;
			}
		}

		// Store the total number of documents to be used in the finalize function
		statCount = this.stats().count;
		if (options.hasOwnProperty('limit') && typeof options.limit === 'number' && options.limit > 0 && options.limit < statCount) {
			statCount = options.limit;
		} else if (options.hasOwnProperty('limit')) {
			delete options.limit;
		}

		// Make sure to override certain options
		options.map = map;
		options.reduce = reduce;
		options.finalize = finalize;
		options.mapreduce = this._shortName;
		options.scope = {
			getType : getType,
			getNewKeyString : getNewKeyString,
			getKeyInfo : getKeyInfo,
			statCount : statCount,
			wildcards : wildcards,
			arraysAreWildcards : arraysAreWildcards,
			fields : fields,
			usePositiveFields : usePositiveFields,
			useNegativeFields : useNegativeFields
		};

		// Execute and return
		print('Processing ' + statCount + ' document(s)...');
		return this.mapReduce(map, reduce, options);
	};

}());/*global DBCollection: false, DBQuery: false, tojson: false */
/*jslint devel: false, nomen: true, maxerr: 50, indent: 4 */
/**
 * MongoDB - wild.js
 * 
 *      Version: 1.0
 *         Date: April 29, 2012
 *      Project: http://skratchdot.github.com/mongodb-wild/
 *  Source Code: https://github.com/skratchdot/mongodb-wild/
 *       Issues: https://github.com/skratchdot/mongodb-wild/issues/
 * Dependencies: MongoDB v1.8+
 * 
 * Description:
 * 
 * Adds a wildcard search to the shell.  You can run the new
 * wild() function on a collection, or on a query result.
 * The search is performed by converting each document to json,
 * and then running a regex that json.
 * 
 * Usage:
 * 
 * // Search entire users collection for Bob
 * db.users.wild('Bob');
 * db.users.wild(/Bob/gi);
 * db.users.find().wild('Bob');
 * 
 * // Search for exact values of 'Bob'
 * db.users.wild(': "Bob"');
 * 
 * // Search for exact keys called 'Bob'
 * db.users.wild('"Bob" :');
 * 
 * // Search for documents containing 'Bob', filtering by last name of 'Smith'
 * db.users.wild('Bob', {'name.last' : 'Smith'});
 * db.users.find({'name.last' : 'Smith'}).wild('Bob');
 * 
 * Copyright (c) 2012 SKRATCHDOT.COM
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
(function () {
	'use strict';

	/**
	 * @function
	 * @name wild
	 * @memberOf DBQuery
	 * @param {String|RegExp} regex The regular expression to filter the query by
	 */
	DBQuery.prototype.wild = function (regex) {
		var doc, result = [];

		// Ensure we have a valid regex
		if (typeof regex === 'string') {
			regex = new RegExp(regex, 'gi');
		}
		if (regex instanceof RegExp === false) {
			regex = new RegExp();
		}

		// Build our result set.
		while (this.hasNext()) {
			doc = this.next();
			if (tojson(doc).search(regex) >= 0) {
				result.push(doc);
			}
		}

	    return result;
	};

	/**
	 * @function
	 * @name wild
	 * @memberOf DBCollection
	 * @param {String|RegExp} regex The regular expression to filter the query by
	 * @param {object} query This value will be passed through to the .find() function
	 * @param {object} fields This value will be passed through to the .find() function
	 * @param {number} limit This value will be passed through to the .find() function
	 * @param {number} skip This value will be passed through to the .find() function
	 * @param {number} batchSize This value will be passed through to the .find() function
	 * @param {object} options This value will be passed through to the .find() function
	 */
	DBCollection.prototype.wild = function (regex, query, fields, limit, skip, batchSize, options) {
		return this.find(query, fields, limit, skip, batchSize, options).wild(regex);
	};

}());/*jslint nomen: true, plusplus: true */
/*global _, DBCollection, print */
/**
 * Insert an array of objects into a collection.
 * 
 * This will loop through the array, calling DBCollection.insert() on each object.
 * 
 * Example usage:
 * 
 *   // insert 2 items into myCollection
 *   var myArray = [{_id:1,test:1}, {_id:2,test:"foo"}];
 *   db.myCollection.insertArray(myArray);
 *   
 *   // transfer a few items from collection1 into collection2
 *   db.collection2.insertArray(db.collection1.find().limit(10).toArray());
 * 
 * @function
 * @name insertArray
 * @memberOf DBCollection
 * @param {array} arr - The array of objects to insert.
 * @param {object} options - pass through to DBCollection.prototype.insert()
 * @param {boolean} _allow_dot - pass through to DBCollection.prototype.insert()
 * @throws {Exception} - when arr is not an Array.
 */
DBCollection.prototype.insertArray = function (arr, options, _allow_dot) {
	'use strict';
	var i, obj;
	if (_.isArray(arr)) {
		for (i = 0; i < arr.length; i++) {
			obj = arr[i];
			if (_.isObject(obj) && !_.isFunction(obj)) {
				this.insert(obj, options, _allow_dot);
			} else {
				print('Cannot insert a non-object, so skipping: ' + obj);
			}
		}
	} else {
		throw 'first argument is not an array!';
	}
};
/*jslint indent: 4, nomen: true, plusplus: true */
/*global _:true */

_.mixin({
	deepExtend : function (obj) {
		'use strict';
		_.each(Array.prototype.slice.call(arguments, 1), function (source) {
			var key;
			if (_.isObject(obj) && _.isObject(source) && !_.isArray(obj) && !_.isArray(source)) {
				for (key in source) {
					if (source.hasOwnProperty(key)) {
						if (obj.hasOwnProperty(key)) {
							obj[key] = _.deepExtend(obj[key], source[key]);
						} else {
							obj[key] = source[key];
						}
					}
				}
			} else {
				obj = source;
			}
		});
		return obj;
	}
});
/*jslint indent: 4, nomen: true, plusplus: true */
/*global _:true */

_.mixin({
	deepPluck : (function () {
		'use strict';

		// declare some variables
		var defaultDelimiter = '.', deepPluck;

		// implement the deepPluck function
		deepPluck = function (obj, key, delimiter) {
			if (typeof delimiter !== 'string') {
				delimiter = defaultDelimiter;
			}
			return _.map(obj, function (value) {
		        var arr, i;
		        if (typeof key === 'string') {
		            arr = key.split(delimiter);
		            for (i = 0; i < arr.length; i++) {
		                if (value && typeof value === 'object' && value.hasOwnProperty(arr[i])) {
		                    value = value[arr[i]];
		                } else {
		                    return;
		                }
		            }
		            return value;
		        }
			});
		};

		// allow the default delimiter to be overridden
		// you may want to do this if you actually use dots in your keys
		deepPluck.setDelimiter = function (delimiter) {
			defaultDelimiter = delimiter;
		};

		return deepPluck;
	}())
});/*jslint indent: 4, nomen: true, plusplus: true */
/*global _:true */

_.mixin({
	keyToObject : (function () {
		'use strict';

		// declare some variables
		var defaultDelimiter = '.', keyToObject;

		keyToObject = function (key, value, delimiter) {
			var obj = {}, arr = [];
			if (typeof delimiter !== 'string') {
				delimiter = defaultDelimiter;
			}
			if (typeof key === 'string') {
				arr = key.split(delimiter);
				key = arr[0];
				if (arr.length > 1) {
					arr.shift();
					obj[key] = keyToObject(arr.join(delimiter), value, delimiter);
				} else {
					obj[key] = value;
				}
			}
			return obj;
		};

		// allow the default delimiter to be overridden
		keyToObject.setDelimiter = function (delimiter) {
			defaultDelimiter = delimiter;
		};

		return keyToObject;
	}())
});/*jslint indent: 4, nomen: true, plusplus: true */
/*global _:true */

_.mixin({
	sum : function (obj, iterator, context) {
		'use strict';
		var result = 0;
		if (!iterator && _.isEmpty(obj)) {
			return 0;
		}
		_.each(obj, function (value, index, list) {
			var computed = iterator ? iterator.call(context, value, index, list) : value;
			result += computed;
		});
		return result;
	}
});/*jslint indent: 4, nomen: true, plusplus: true */
/*global _:true */

_.mixin({
	avg : function (obj, iterator, context) {
		'use strict';
		var sum = _.sum(obj, iterator, context),
			size = _.size(obj);
		return size ? sum / size : 0;
	}
});/*jslint indent: 4, nomen: true, plusplus: true */
/*global _:true */

_.mixin({
	variance : function (obj, iterator, context) {
		'use strict';
		var result = 0, size = _.size(obj), mean;
		if (size === 0) {
			return 0;
		}
		// set mean
		mean = _.avg(obj, iterator, context);
		_.each(obj, function (value, index, list) {
			var computed = iterator ? iterator.call(context, value, index, list) : value,
				diff = computed - mean;
			result += diff * diff;
		});
		return result / size;
	}
});/*jslint indent: 4, nomen: true, plusplus: true */
/*global _:true */

_.mixin({
	stdev : function (obj, iterator, context) {
		'use strict';
	    return Math.sqrt(_.variance(obj, iterator, context));
	}
});/*jslint indent : 4, nomen : true, plusplus : true */
/*global _ : true, JSON : true */

_.mixin({
	aggregate : function (list, numericKey, keys) {
		'use strict';

		var i = 0,
			item = {},
			returnArray = [],
			dataOrder = [],
			data = {},
			AggregateError;

		// declare our AggregateError class
		AggregateError = function (msg) {
			this.name = 'AggregateError';
			this.message = msg || 'An error occurred while trying to perform aggregation';
		};
		AggregateError.prototype = new Error();
		AggregateError.prototype.constructor = AggregateError;

		// _.deepPluck is required
		if (!_ || !_.deepPluck) {
			throw new AggregateError("_.deepPluck is required for _.aggregate() to work.");
		}

		// JSON.stringify is required
		if (!JSON || !JSON.stringify) {
			throw new AggregateError("JSON.stringify() is required for _.aggregate() to work.");
		}

		// keys can be a single key (string), or an array of keys.
		// we always want to deal with arrays though
		if (typeof keys === 'string') {
			keys = [keys];
		}

		// make sure keys is an array
		if (!_.isArray(keys)) {
			keys = [];
		}

		_.each(list, function (obj) {
			// declare some variables
			var groupedValues = [], aggregationKey = '', numericValue;

			// get all our groupedValues
			for (i = 0; i < keys.length; i++) {
				groupedValues[i] = _.deepPluck([obj], keys[i])[0];
			}

			// create a key for our aggregations
			aggregationKey = JSON.stringify(groupedValues);

			// get our current numeric value
			numericValue = parseInt(_.deepPluck([obj], numericKey)[0], 10) || 0;

			if (data.hasOwnProperty(aggregationKey)) {
				// count
				data[aggregationKey].count = data[aggregationKey].count + 1;
				// sum
				data[aggregationKey].sum = data[aggregationKey].sum + numericValue;
				// max
				if (numericValue > data[aggregationKey].max) {
					data[aggregationKey].max = numericValue;
				}
				// min
				if (numericValue < data[aggregationKey].min) {
					data[aggregationKey].min = numericValue;
				}
				// avg is calculated when building our return array
			} else {
				dataOrder.push(aggregationKey);
				data[aggregationKey] = {
					count : 1,
					sum : numericValue,
					max : numericValue,
					min : numericValue,
					avg : numericValue,
					group : groupedValues
				};
			}

		});

		for (i = 0; i < dataOrder.length; i++) {
			item = data[dataOrder[i]];
			item.avg = item.sum / item.count;
			returnArray.push(item);
		}

		return returnArray;
	}
});
// Mix in non-conflicting functions to the Underscore namespace
_.mixin(_.str.exports());

// Output the current version number when starting the shell.
mesh.version();
