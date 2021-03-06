// from https://dxr.mozilla.org/mozilla/source/js/narcissus/jsexec.js
/* ***** BEGIN LICENSE BLOCK *****
 * vim: set ts=4 sw=4 et tw=80:
 *
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is the Narcissus JavaScript engine.
 *
 * The Initial Developer of the Original Code is
 * Brendan Eich <brendan@mozilla.org>.
 * Portions created by the Initial Developer are Copyright (C) 2004
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

/*
 * Narcissus - JS implemented in JS.
 *
 * Execution of parse trees.
 *
 * Standard classes except for eval, Function, Array, and String are borrowed
 * from the host JS environment.  Function is metacircular.  Array and String
 * are reflected via wrapping the corresponding native constructor and adding
 * an extra level of prototype-based delegation.
 */

const GLOBAL_CODE = 0, EVAL_CODE = 1, FUNCTION_CODE = 2;

function ExecutionContext(type) {
	this.type = type;
}


var interp = {
	running: false,
	runId: 0
}

var global = {
	// Value properties.
	NaN: NaN, Infinity: Infinity, undefined: undefined,
	console: console,

	// Function properties.
	eval: function eval(s) {
		if (typeof s != "string") {
			return s;
		}
		var x = ExecutionContext.current;
		var x2 = new ExecutionContext(EVAL_CODE);
		x2.thisObject = x.thisObject;
		x2.caller = x.caller;
		x2.callee = x.callee;
		x2.scope = x.scope;
		ExecutionContext.current = x2;
		try {
			execute(parse(s), x2);
		} catch (e) {
			if (e == THROW) {
				x.result = x2.result;
				throw e;
			} else {
				throw e;
			}				
		} finally {
			ExecutionContext.current = x;
		}
		return x2.result;
	},
	parseInt: parseInt, parseFloat: parseFloat,
	isNaN: isNaN, isFinite: isFinite,
	decodeURI: decodeURI, encodeURI: encodeURI,
	decodeURIComponent: decodeURIComponent,
	encodeURIComponent: encodeURIComponent,

	// Class constructors.  Where ECMA-262 requires C.length == 1, we declare
	// a dummy formal parameter.
	Object: Object,
	Function: function Function(dummy) {
		var p = "", b = "", n = arguments.length;
		if (n) {
			var m = n - 1;
			if (m) {
				p += arguments[0];
				for (var k = 1; k < m; k++) {
					p += "," + arguments[k];
				}
			}
			b += arguments[m];
		}

		// XXX We want to pass a good file and line to the tokenizer.
		// Note the anonymous name to maintain parity with Spidermonkey.
		var t = new Tokenizer("anonymous(" + p + ") {" + b + "}");

		// NB: Use the STATEMENT_FORM constant since we don't want to push this
		// function onto the null compilation context.
		var f = FunctionDefinition(t, null, false, STATEMENT_FORM);
		var s = {object: global, parent: null};
		return new FunctionObject(f, s);
	},
	Array: function Array(dummy) {
		// Array when called as a function acts as a constructor.
		return GLOBAL.Array.apply(this, arguments);
	},
	String: function String(s) {
		// Called as function or constructor: convert argument to string type.
		s = arguments.length ? "" + s : "";
		if (this instanceof String) {
			// Called as constructor: save the argument as the string value
			// of this String object and return this object.
			this.value = s;
			return this;
		}
		return s;
	},
	Boolean: Boolean, Number: Number, Date: Date, RegExp: RegExp,
	Error: Error, EvalError: EvalError, RangeError: RangeError,
	ReferenceError: ReferenceError, SyntaxError: SyntaxError,
	TypeError: TypeError, URIError: URIError,

	// Other properties.
	Math: Math,

	// Extensions to ECMA.
	// snarf: snarf,
	evaluate: evaluate,
	load: function load(s) {
		if (typeof s != "string"){
			return s;
		}
		//evaluate(snarf(s), s, 1)
		evaluate(s, "dynamicCode", 1)
	},
	print: print, version: null
};

// Helper to avoid Object.prototype.hasOwnProperty polluting scope objects.
function hasDirectProperty(o, p) {
	return Object.prototype.hasOwnProperty.call(o, p);
}

// Reflect a host class into the target global environment by delegation.
function reflectClass(name, proto) {
	var gctor = global[name];
	// gctor.__defineProperty__('prototype', proto, true, true, true);
	// proto.__defineProperty__('constructor', gctor, false, false, true);
	
	__assign(gctor, 'prototype', proto, true, true, false);
	__assign(proto, 'constructor', gctor, false, true, false);
	return proto;
}

// Reflect Array -- note that all Array methods are generic.
reflectClass('Array', new Array);

// Reflect String, overriding non-generic methods.
var gSp = reflectClass('String', new String);
gSp.toSource = function () { return this.value.toSource(); };
gSp.toString = function () { return this.value; };
gSp.valueOf  = function () { return this.value; };
global.String.fromCharCode = String.fromCharCode;

var XCp = ExecutionContext.prototype;
ExecutionContext.current = XCp.caller = XCp.callee = null;
XCp.scope = {object: global, parent: null};
XCp.thisObject = global;
XCp.result = undefined;
XCp.target = null;
XCp.ecmaStrictMode = false;

function Reference(base, propertyName, node) {
	this.base = base;
	this.propertyName = propertyName;
	this.node = node;
}

Reference.prototype.toString = function () { return this.node.getSource(); }

function getValue(v) {
	if (v instanceof Reference) {
		if (!v.base) {
			throw new ReferenceError(v.propertyName + " is not defined", v.node.filename, v.node.lineno);
		}
		return v.base[v.propertyName];
	}
	return v;
}

async function maybeWaitFor(v) {
	if (!interp.running) { throw "INTERRUPTED."; }
	if (typeof(v) === "object" && v.constructor.name === "Promise") {
		try {
			let result = await v;
			if (!interp.running) { throw "INTERRUPTED."; }
			return result;
		} catch (err) {
			throw err;
		}
	} else {
		return v;
	}
}
function waitPromise(ms) {
	return new Promise((resolve, reject) => { setTimeout( ()=>{resolve(); }, ms); });
}

async function forceWaitFor(v) {
	await waitPromise(1);
	return await maybeWaitFor(v);
}

function putValue(v, w, vn) {
	if (v instanceof Reference){
		return (v.base || global)[v.propertyName] = w;
	}
	throw new ReferenceError("Invalid assignment left-hand side", vn.filename, vn.lineno);
}

function isPrimitive(v) {
	var t = typeof v;
	return (t == "object") ? v === null : t != "function";
}

function isObject(v) {
	var t = typeof v;
	return (t == "object") ? v !== null : t == "function";
}

// If r instanceof Reference, v == getValue(r); else v === r.  If passed, rn
// is the node whose execute result was r.
function toObject(v, r, rn) {
	switch (typeof v) {
	  case "boolean":
		return new global.Boolean(v);
	  case "number":
		return new global.Number(v);
	  case "string":
		return new global.String(v);
	  case "function":
		return v;
	  case "object":
		if (v !== null) { return v; }
	}
	var message = r + " (type " + (typeof v) + ") has no properties";
	throw rn ? new TypeError(message, rn.filename, rn.lineno) : new TypeError(message);
}

async function execute(n, x) {
	var a, f, i, j, r, s, t, u, v;

	switch (n.type) {
	  case FUNCTION:
		if (n.functionForm != DECLARED_FORM) {
			if (!n.name || n.functionForm == STATEMENT_FORM) {
				v = new FunctionObject(n, x.scope);
				if (n.functionForm == STATEMENT_FORM){
					// x.scope.object.__defineProperty__(n.name, v, true);
					__assign(x.scope.object, n.name, v, true,false,false);
				}
			} else {
				t = new Object;
				x.scope = {object: t, parent: x.scope};
				try {
					v = new FunctionObject(n, x.scope);
					// t.__defineProperty__(n.name, v, true, true);
					__assign(t, n.name, v, true,true,false);
				} finally {
					x.scope = x.scope.parent;
				}
			}
		}
		break;

	  case SCRIPT:
		t = x.scope.object;
		a = n.funDecls;
		for (i = 0, j = a.length; i < j; i++) {
			s = a[i].name;
			f = new FunctionObject(a[i], x.scope);
			// t.__defineProperty__(s, f, x.type != EVAL_CODE);
			__assign(t, s, f, x.type!=EVAL_CODE,false,false);
		}
		a = n.varDecls;
		for (i = 0, j = a.length; i < j; i++) {
			u = a[i];
			s = u.name;
			if (u.readOnly && hasDirectProperty(t, s)) {
				throw new TypeError("Redeclaration of const " + s, u.filename, u.lineno);
			}
			if (u.readOnly || !hasDirectProperty(t, s)) {
				//t.__defineProperty__(s, undefined, x.type != EVAL_CODE, u.readOnly);
				__assign(t, s, undefined, x.type != EVAL_CODE, u.readOnly, false);
			}
		}
		// FALL THROUGH

	  case BLOCK:
		for (i = 0, j = n.length; i < j; i++) {
			await maybeWaitFor(execute(n[i], x));
		}
		
		break;

	  case IF:
		if (getValue(await maybeWaitFor(execute(n.condition, x)))) {
			await maybeWaitFor(execute(n.thenPart, x));
		} else if (n.elsePart) {
			await maybeWaitFor(execute(n.elsePart, x));
		}
		break;

	  case SWITCH:
		s = getValue(await maybeWaitFor(execute(n.discriminant, x)));
		a = n.cases;
		var matchDefault = false;
	  switch_loop:
		for (i = 0, j = a.length; ; i++) {
			if (i == j) {
				if (n.defaultIndex >= 0) {
					i = n.defaultIndex - 1; // no case matched, do default
					matchDefault = true;
					continue;
				}
				break;					  // no default, exit switch_loop
			}
			t = a[i];					   // next case (might be default!)
			if (t.type == CASE) {
				u = getValue(await maybeWaitFor(execute(t.caseLabel, x)));
			} else {
				if (!matchDefault) {	 // not defaulting, skip for now
					continue;
				}
				u = s;					  // force match to do default
			}
			if (u === s) {
				for (;;) {				  // this loop exits switch_loop
					if (t.statements.length) {
						try {
							await maybeWaitFor(execute(t.statements, x));
						} catch (e) {
							if (e == BREAK && x.target == n) {
								break switch_loop;
							} else {
								throw e;
							}
						}
					}
					if (++i == j) {
						break switch_loop;
					}
					t = a[i];
				}
				// NOT REACHED
			}
		}
		break;

	  case FOR:
		n.setup && getValue(await maybeWaitFor(execute(n.setup, x)));
		// FALL THROUGH
	  case WHILE:
		while (!n.condition || getValue(await forceWaitFor(execute(n.condition, x)))) {
			try {
				await maybeWaitFor(execute(n.body, x));
			} catch (e) {
				if (e == BREAK && x.target == n) {
					break;
				} else if (e == CONTINUE && x.target == n) {
					continue;
				} else {
					throw e;
				}		
			}
			
			n.update && getValue(await maybeWaitFor(execute(n.update, x)));
		}
		break;

	  case FOR_IN:
		u = n.varDecl;
		if (u) {
			await maybeWaitFor(execute(u, x));
		}
		r = n.iterator;
		s = await maybeWaitFor(execute(n.object, x));
		v = getValue(s);

		// ECMA deviation to track extant browser JS implementation behavior.
		t = (v == null && !x.ecmaStrictMode) ? v : toObject(v, s, n.object);
		a = [];
		for (i in t){
			a.push(i);
		}
		for (i = 0, j = a.length; i < j; i++) {
			putValue(await maybeWaitFor(execute(r, x)), a[i], r);
			try {
				await maybeWaitFor(execute(n.body, x));
			} catch (e) {
				if (e == BREAK && x.target == n) {
					break;
				} else if (e == CONTINUE && x.target == n) {
					continue;
				} else {
					throw e;
				}
			}
		}
		break;

	  case DO:
		do {
			try {
				await maybeWaitFor(execute(n.body, x));
			} catch (e) {
				if (e == BREAK && x.target == n) {
					break;
				} else if (e == CONTINUE && x.target == n) {
					continue;
				} else {
					throw e;
				}
			}
		} while (getValue(await forceWaitFor(execute(n.condition, x))));
		break;

	  case BREAK:
	  case CONTINUE:
		x.target = n.target;
		throw n.type;

	  case TRY:
		try {
			execute(await maybeWaitFor(n.tryBlock, x));
		} catch (e) {
			if (e == THROW && (j = n.catchClauses.length)) {
				e = x.result;
				x.result = undefined;
				for (i = 0; ; i++) {
					if (i == j) {
						x.result = e;
						throw THROW;
					}
					t = n.catchClauses[i];
					x.scope = {object: {}, parent: x.scope};
					__assign(x.scope.object, t.varName, { value: e, writable: true, configurable: true, enumerable: true } )
					// x.scope.object.__defineProperty__(t.varName, e, true);
					try {
						if (t.guard && !getValue(await maybeWaitFor(execute(t.guard, x)))) {
							continue;
						}
							
						await maybeWaitFor(execute(t.block, x));
						break;
					} finally {
						x.scope = x.scope.parent;
					}
				}
			} else {
				throw e;
			}
		} finally {
			if (n.finallyBlock) {
				await maybeWaitFor(execute(n.finallyBlock, x));
			}	
		}
		break;

	  case THROW:
		x.result = getValue(await maybeWaitFor(execute(n.exception, x)));
		throw THROW;

	  case RETURN:
		x.result = getValue(await maybeWaitFor(execute(n.value, x)));
		throw RETURN;

	  case WITH:
		r = await maybeWaitFor(execute(n.object, x));
		t = toObject(getValue(r), r, n.object);
		x.scope = {object: t, parent: x.scope};
		try {
			await maybeWaitFor(execute(n.body, x));
		} finally {
			x.scope = x.scope.parent;
		}
		break;

	  case VAR:
	  case CONST:
		for (i = 0, j = n.length; i < j; i++) {
			u = n[i].initializer;
			if (!u) {
				continue;
			}
			t = n[i].name;
			for (s = x.scope; s; s = s.parent) {
				if (hasDirectProperty(s.object, t)){
					break;
				}
			}
			u = getValue(await maybeWaitFor(execute(u, x)));
			if (n.type == CONST) {
				__assign(s.object, t, u, x.type != EVAL_CODE, true, false);
			} else {
				s.object[t] = u;
			}
		}
		break;

	  case DEBUGGER:
		throw "NYI: " + tokens[n.type];

	  case SEMICOLON:
		if (n.expression) {
			x.result = getValue(await maybeWaitFor(execute(n.expression, x)));
		}	
		break;

	  case LABEL:
		try {
			await maybeWaitFor(execute(n.statement, x));
		} catch (e) {
			if (e == BREAK && x.target == n) {
				// no-op
			} else {
				throw e;
			}
		}
		break;

	  case COMMA:
		for (i = 0, j = n.length; i < j; i++)
			v = getValue(await maybeWaitFor(execute(n[i], x)));
		break;

	  case ASSIGN:
		r = await maybeWaitFor(execute(n[0], x));
		t = n[0].assignOp;
		if (t) {
			u = getValue(r);
		}
		v = getValue(await maybeWaitFor(execute(n[1], x)));
		if (t) {
			switch (t) {
			  case BITWISE_OR:  v = u | v; break;
			  case BITWISE_XOR: v = u ^ v; break;
			  case BITWISE_AND: v = u & v; break;
			  case LSH:		 v = u << v; break;
			  case RSH:		 v = u >> v; break;
			  case URSH:		v = u >>> v; break;
			  case PLUS:		v = u + v; break;
			  case MINUS:	   v = u - v; break;
			  case MUL:		 v = u * v; break;
			  case DIV:		 v = u / v; break;
			  case MOD:		 v = u % v; break;
			}
		}
		putValue(r, v, n[0]);
		break;

	  case HOOK:
		v = getValue(await maybeWaitFor(execute(n[0], x))) 
				? getValue(await maybeWaitFor(execute(n[1], x)))
				: getValue(await maybeWaitFor(execute(n[2], x)));
		break;

	  case OR:
		v = getValue(await maybeWaitFor(execute(n[0], x))) 
				|| getValue(await maybeWaitFor(execute(n[1], x)));
		break;

	  case AND:
		v = getValue(await maybeWaitFor(execute(n[0], x))) 
				&& getValue(await maybeWaitFor(execute(n[1], x)));
		break;

	  case BITWISE_OR:
		v = getValue(await maybeWaitFor(execute(n[0], x))) 
				| getValue(await maybeWaitFor(execute(n[1], x)));
		break;

	  case BITWISE_XOR:
		v = getValue(await maybeWaitFor(execute(n[0], x))) 
				^ getValue(await maybeWaitFor(execute(n[1], x)));
		break;

	  case BITWISE_AND:
		v = getValue(await maybeWaitFor(execute(n[0], x))) 
				& getValue(await maybeWaitFor(execute(n[1], x)));
		break;

	  case EQ:
		v = getValue(await maybeWaitFor(execute(n[0], x))) 
				== getValue(await maybeWaitFor(execute(n[1], x)));
		break;

	  case NE:
		v = getValue(await maybeWaitFor(execute(n[0], x))) 
				!= getValue(await maybeWaitFor(execute(n[1], x)));
		break;

	  case STRICT_EQ:
		v = getValue(await maybeWaitFor(execute(n[0], x))) 
				=== getValue(await maybeWaitFor(execute(n[1], x)));
		break;

	  case STRICT_NE:
		v = getValue(await maybeWaitFor(execute(n[0], x))) 
				!== getValue(await maybeWaitFor(execute(n[1], x)));
		break;

	  case LT:
		v = getValue(await maybeWaitFor(execute(n[0], x)))
				< getValue(await maybeWaitFor(execute(n[1], x)));
		break;

	  case LE:
		v = getValue(await maybeWaitFor(execute(n[0], x))) 
				<= getValue(await maybeWaitFor(execute(n[1], x)));
		break;

	  case GE:
		v = getValue(await maybeWaitFor(execute(n[0], x))) 
				>= getValue(await maybeWaitFor(execute(n[1], x)));
		break;

	  case GT:
		v = getValue(await maybeWaitFor(execute(n[0], x))) 
				> getValue(await maybeWaitFor(execute(n[1], x)));
		break;

	  case IN:
		v = getValue(await maybeWaitFor(execute(n[0], x))) 
				in getValue(await maybeWaitFor(execute(n[1], x)));
		break;

	  case INSTANCEOF:
		t = getValue(await maybeWaitFor(execute(n[0], x)));
		u = getValue(await maybeWaitFor(execute(n[1], x)));
		if (isObject(u) && typeof u.__hasInstance__ == "function")
			v = u.__hasInstance__(t);
		else
			v = t instanceof u;
		break;

	  case LSH:
		v = getValue(await maybeWaitFor(execute(n[0], x))) 
				<< getValue(await maybeWaitFor(execute(n[1], x)));
		break;

	  case RSH:
		v = getValue(await maybeWaitFor(execute(n[0], x))) 
				>> getValue(await maybeWaitFor(execute(n[1], x)));
		break;

	  case URSH:
		v = getValue(await maybeWaitFor(execute(n[0], x))) 
				>>> getValue(await maybeWaitFor(execute(n[1], x)));
		break;

	  case PLUS:
		v = getValue(await maybeWaitFor(execute(n[0], x))) 
				+ getValue(await maybeWaitFor(execute(n[1], x)));
		break;

	  case MINUS:
		v = getValue(await maybeWaitFor(execute(n[0], x))) 
				- getValue(await maybeWaitFor(execute(n[1], x)));
		break;

	  case MUL:
		v = getValue(await maybeWaitFor(execute(n[0], x))) 
				* getValue(await maybeWaitFor(execute(n[1], x)));
		break;

	  case DIV:
		v = getValue(await maybeWaitFor(execute(n[0], x))) 
				/ getValue(await maybeWaitFor(execute(n[1], x)));
		break;

	  case MOD:
		v = getValue(await maybeWaitFor(execute(n[0], x))) 
				% getValue(await maybeWaitFor(execute(n[1], x)));
		break;

	  case DELETE:
		t = await maybeWaitFor(execute(n[0], x));
		v = !(t instanceof Reference) || delete t.base[t.propertyName];
		break;

	  case VOID:
		getValue(await maybeWaitFor(execute(n[0], x)));
		break;

	  case TYPEOF:
		t = await maybeWaitFor(execute(n[0], x));
		if (t instanceof Reference) {
			t = t.base ? t.base[t.propertyName] : undefined;
		}
		v = typeof t;
		break;

	  case NOT:
		v = !getValue(await maybeWaitFor(execute(n[0], x)));
		break;

	  case BITWISE_NOT:
		v = ~getValue(await maybeWaitFor(execute(n[0], x)));
		break;

	  case UNARY_PLUS:
		v = +getValue(await maybeWaitFor(execute(n[0], x)));
		break;

	  case UNARY_MINUS:
		v = -getValue(await maybeWaitFor(execute(n[0], x)));
		break;

	  case INCREMENT:
	  case DECREMENT:
		t = await maybeWaitFor(execute(n[0], x));
		u = Number(getValue(t));
		if (n.postfix) {
			v = u;
		}
		putValue(t, (n.type == INCREMENT) ? ++u : --u, n[0]);
		if (!n.postfix) {
			v = u;
		}
		break;

	  case DOT:
		r = await maybeWaitFor(execute(n[0], x));
		t = getValue(r);
		u = n[1].value;
		v = new Reference(toObject(t, r, n[0]), u, n);
		break;

	  case INDEX:
		r = await maybeWaitFor(execute(n[0], x));
		t = getValue(r);
		u = getValue(await maybeWaitFor(execute(n[1], x)));
		v = new Reference(toObject(t, r, n[0]), String(u), n);
		break;

	  case LIST:
		// Curse ECMA for specifying that arguments is not an Array object!
		v = {};
		for (i = 0, j = n.length; i < j; i++) {
			u = getValue(await maybeWaitFor(execute(n[i], x)));
			// v.__defineProperty__(i, u, false, false, true);
			__assign(v, i, u, false, false, true);
		}
		// v.__defineProperty__('length', i, false, false, true);
		__assign(v, "length", i, false, false, true);
		break;

	  case CALL:
		r = await maybeWaitFor(execute(n[0], x));
		a = await maybeWaitFor(execute(n[1], x));
		f = getValue(r);
		if (isPrimitive(f) || typeof f.__call__ != "function") {
			throw new TypeError(r + " is not callable", n[0].filename, n[0].lineno);
		}
		t = (r instanceof Reference) ? r.base : null;
		if (t instanceof Activation) {
			t = null;
		}
		v = f.__call__(t, a, x);
		break;

	  case NEW:
	  case NEW_WITH_ARGS:
		r = await maybeWaitFor(execute(n[0], x));
		f = getValue(r);
		if (n.type == NEW) {
			a = {};
			// a.__defineProperty__('length', 0, false, false, true);
			__assign(a, "length", 0, false, false, true);
		} else {
			a = await maybeWaitFor(execute(n[1], x));
		}
		if (isPrimitive(f) || typeof f.__construct__ != "function") {
			throw new TypeError(r + " is not a constructor",
								n[0].filename, n[0].lineno);
		}
		v = f.__construct__(a, x);
		break;

	  case ARRAY_INIT:
		v = [];
		for (i = 0, j = n.length; i < j; i++) {
			if (n[i]) {
				v[i] = getValue(await maybeWaitFor(execute(n[i], x)));
			}
		}
		v.length = j;
		break;

	  case OBJECT_INIT:
		v = {};
		for (i = 0, j = n.length; i < j; i++) {
			t = n[i];
			if (t.type == PROPERTY_INIT) {
				v[t[0].value] = getValue(await maybeWaitFor(execute(t[1], x)));
			} else {
				f = new FunctionObject(t, x.scope);
				u = (t.type == GETTER) ? '__defineGetter__'
									   : '__defineSetter__';
				v[u](t.name, thunk(f, x));
			}
		}
		break;

	  case NULL:
		v = null;
		break;

	  case THIS:
		v = x.thisObject;
		break;

	  case TRUE:
		v = true;
		break;

	  case FALSE:
		v = false;
		break;

	  case IDENTIFIER:
		for (s = x.scope; s; s = s.parent) {
			if (n.value in s.object) {
				break;
			}
		}
		v = new Reference(s && s.object, n.value, n);
		break;

	  case NUMBER:
	  case STRING:
	  case REGEXP:
		v = n.value;
		break;

	  case GROUP:
		v = await maybeWaitFor(execute(n[0], x));
		break;

	  default:
		throw "PANIC: unknown operation " + n.type + ": " + uneval(n);
	}

	return v;
}

function Activation(f, a) {
	for (var i = 0, j = f.params.length; i < j; i++) {
		// this.__defineProperty__(f.params[i], a[i], true);
		__assign(this, f.params[i], a[i], true, false, false);
	}
	// this.__defineProperty__('arguments', a, true);
	__assign(this, 'arguments', a, true, false, false);
}

// Null Activation.prototype's proto slot so that Object.prototype.* does not
// pollute the scope of heavyweight functions.  Also delete its 'constructor'
// property so that it doesn't pollute function scopes.  But first, we must
// copy __defineProperty__ down from Object.prototype.

// Activation.prototype.__defineProperty__ = Object.prototype.__defineProperty__;
Activation.prototype.__proto__ = null;
delete Activation.prototype.constructor;

function FunctionObject(node, scope) {
	this.node = node;
	this.scope = scope;
	// this.__defineProperty__('length', node.params.length, true, true, true);
	__assign(this, 'length', node.params.length, true, true, true);
	var proto = {};
	// this.__defineProperty__('prototype', proto, true);
	__assign(this, 'prototype', proto, true, false, false);
	// proto.__defineProperty__('constructor', this, false, false, true);
	__assign(proto, 'constructor', this, false, false, true); 
}

var FOp = FunctionObject.prototype = {
	// Internal methods.
	__call__: async function (t, a, x) {
		var x2 = new ExecutionContext(FUNCTION_CODE);
		x2.thisObject = t || global;
		x2.caller = x;
		x2.callee = this;
		// a.__defineProperty__('callee', this, false, false, true);
		__assign(a, 'callee', this, false, false, true);
		var f = this.node;
		x2.scope = {object: new Activation(f, a), parent: this.scope};

		ExecutionContext.current = x2;
		
		try {
			await maybeWaitFor(execute(f.body, x2));
		} catch (e) {
			if (e == RETURN) {
				return x2.result;
			} else if (e == THROW) {
				x.result = x2.result;
				throw THROW;
			} else {
				throw e;
			}
		} finally {
			ExecutionContext.current = x;
		}
		return undefined;
	},

	__construct__: async function (a, x) {
		var o = new Object;
		var p = this.prototype;
		if (isObject(p)) {
			o.__proto__ = p;
		}
		// else { o.__proto__ defaulted to Object.prototype }

		var v = await maybeWaitFor(this.__call__(o, a, x));
		if (isObject(v)) {
			return v;
		}
		return o;
	},

	__hasInstance__: function (v) {
		if (isPrimitive(v)){
			return false;
		}
			
		var p = this.prototype;
		if (isPrimitive(p)) {
			throw new TypeError("'prototype' property is not an object", this.node.filename, this.node.lineno);
		}
		
		var o;
		while ((o = v.__proto__)) {
			if (o == p) {
				return true;
			}
			v = o;
		}
		return false;
	},

	// Standard methods.
	toString: function () {
		return this.node.getSource();
	},

	apply: async function (t, a) {
		// Curse ECMA again!
		if (typeof this.__call__ != "function") {
			throw new TypeError("Function.prototype.apply called on" + " uncallable object");
		}

		if (t === undefined || t === null) {
			t = global;
		} else if (typeof t != "object") {
			t = toObject(t, t);
		}
		
		if (a === undefined || a === null) {
			a = {};
			// a.__defineProperty__('length', 0, false, false, true);
			__assign(a, 'length', 0, false, false, true);
			
		} else if (a instanceof Array) {
			var v = {};
			for (var i = 0, j = a.length; i < j; i++) {
				// v.__defineProperty__(i, a[i], false, false, true);
				__assign(v,i,a[i],false,false,true);
			}
			// v.__defineProperty__('length', i, false, false, true);
			__assign(v,'length',i,false,false,true);
			a = v;
		} else if (!(a instanceof Object)) {
			// XXX check for a non-arguments object
			throw new TypeError("Second argument to Function.prototype.apply" +
								" must be an array or arguments object",
								this.node.filename, this.node.lineno);
		}

		return await maybeWaitFor(this.__call__(t, a, ExecutionContext.current));
	},

	call: async function (t) {
		// Curse ECMA a third time!
		var a = Array.prototype.splice.call(arguments, 1);
		return await maybeWaitFor(this.apply(t, a));
	}
};

// Connect Function.prototype and Function.prototype.constructor in global.
reflectClass('Function', FOp);

// Help native and host-scripted functions be like FunctionObjects.
var Fp = Function.prototype;
var REp = RegExp.prototype;

if (!('__call__' in Fp)) {
	__assign(Fp, "__call__", function (t, a, x) {
		// Curse ECMA yet again!
		a = Array.prototype.splice.call(a, 0, a.length);
		return this.apply(t, a);
	}, true, true, true);

	__assign(REp, '__call__', function (t, a, x) {
		a = Array.prototype.splice.call(a, 0, a.length);
		return this.exec.apply(this, a);
	}, true, true, true);

	__assign(Fp, '__construct__', function (a, x) {
		a = Array.prototype.splice.call(a, 0, a.length);
		return this.__applyConstructor__(a);
	}, true, true, true);

	// Since we use native functions such as Date along with host ones such
	// as global.eval, we want both to be considered instances of the native
	// Function constructor.
	__assign(Fp,'__hasInstance__', function (v) {
		return v instanceof Function || v instanceof global.Function;
	}, true, true, true);
}

function thunk(f, x) {
	return function () { return f.__call__(this, arguments, x); };
}

async function evaluate(source, filename, lineNumber, injected) {
	if (typeof source != "string") {
		return source;
	}
	var x = ExecutionContext.current;
	var x2 = new ExecutionContext(GLOBAL_CODE);
	
	// Inject the object and prevent it from being directly modified.
	if (!injected) { injected = {}; }
	let injHolder = { object: injected, parent: x2.scope };
	x2.scope = { object: {}, parent: injHolder };
	
	ExecutionContext.current = x2;
	interp.running = true;
	try {
		await maybeWaitFor(execute(parse(source, filename, lineNumber), x2));
	} catch (e) {
		if (e == THROW) {
			if (x) {
				x.result = x2.result;
				throw THROW;
			}
			throw x2.result;
		} else { 
			throw e;
		}
	} finally {
		ExecutionContext.current = x;
	}
	interp.runId++;
	return x2.result;
}