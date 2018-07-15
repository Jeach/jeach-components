/*
 * Jeach Components Framework 
 *
 * Copyright (C) 2018 by Christian Jean.
 * All rights reserved.
 *
 * CONFIDENTIAL AND PROPRIETARY INFORMATION!
 *
 * Disclosure or use in part or in whole without prior written consent
 * constitutes an infringement of copyright laws which may be punishable
 * by law.
 *
 * THIS SOFTWARE IS PROVIDED "AS IS" AND ANY EXPRESSED OR IMPLIED WARRANTIES
 * INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL
 * THE LICENSOR OR ITS CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 * NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

 
const BASE = "components";
const EXT = ".comp";

const fs = require('fs');
const COMPS = [];

console.log("Welcome to 'jeach-components'");

function Component() {
  this.name = null;
  this.path = null;
  this.error = null;
  
  this.last = null;  // last label/exec
  
  this.rendered = null;  // fully rendered view (do we need this copy as well)?
  this.base64 = null;    // fully rendered view in base64
  
  this.cmts = [];    // comments
  this.meta = [];    // header info
  this.defs = [];    // definitions (variables)
  this.imps = [];    // imports
  this.labs = [];    // @label  (static)
}
 
Component.prototype.setError = function(error) {
  console.log("Error reading '%s' (%s)", this.path, error.code);
  this.error = error;
}

Component.prototype.hasError = function() {
  return this.error !== null;
}
  
Component.prototype.getName = function() {
  return this.name || "Unknown Name";
}

Component.prototype.setName = function(name) {
  this.name = name;
}

Component.prototype.getPath = function() {
  return this.path || "Unknown Path";
}

Component.prototype.setPath = function(path) {
  this.path = path;
}

Component.prototype.setPathAndName = function(path) {
  this.path = path.trim();
  this.name = this.path.substr(this.path.lastIndexOf('/') + 1);
}

Component.prototype.addComment = function(line, comm) {
  var data = { line: line, type: 'C', data: comm };
  this.cmts.push(data);
  return data;
}

Component.prototype.addMeta = function(line, meta) {
  var data = { line: line, type: 'M', data: meta };
  this.meta.push(data);
  return data;
}
 
Component.prototype.addDefinition = function(line, def) {
  var data = { line: line, type: 'D', data: def };
  this.defs.push(data);
  return data;
}

Component.prototype.addImport = function(line, imp) {
  var data = { line: line, type: 'I', data: imp, parsed: parseImport(imp) };
  this.imps.push(data);
  return data;
}   

Component.prototype.addLabel = function(line, label) {
  var data = { line: line, type: 'L', data: label, parsed: parseLabel(label), statements: [] };
  this.labs.push(data);
  this.last = data;
  return data;
}

Component.prototype.addExecutable = function(line, exec) {
  var data = { line: line, type: 'E', data: exec, parsed: parseExec(exec), statements: [] };
  this.labs.push(data);
  this.last = data;
  return data;
}

Component.prototype.addStatement = function(line, statement) {
  var data = { line: line, type: 'S', data: statement };
  this.last.statements.push(data);
  return data;
}

Component.prototype.getImports = function() {
  return this.imps; 
}

Component.prototype.getLabels = function() {
  return this.labs;
}
 
/**
 * Get the statements for a given label. If the label is 'null', then all
 * labels will be returned.
 */
Component.prototype.getStatements = function(label) {
  const error = "<!-- Error: Could not resolve statement for '" + (label ? label : 'ALL') + "' label -->";
  var statements = [];
  var labels = this.getLabels();
  var label = arguments.length === 0 ? null : label;

  if (label) console.log("Seeking statements for label '%s'", label);
  else console.log("Seeking statements for ALL labels");
  
  for (var i=0; i<labels.length; i++) {
    if (label === null) { //JSON.stringify(this.labs[i].statements[x].data)
      console.log(" > Adding label '%s', %d statements", labels[i].parsed.name, labels[i].statements.length);
      for (var x=0; x<labels[i].statements.length; x++) {
        statements.push(labels[i].statements[x].data);
      }
    } else
    if (labels[i].parsed.name === label) {
      console.log(" > Adding label '%s', %d statements", labels[i].parsed.name, labels[i].statements.length);
      for (var x=0; x<labels[i].statements.length; x++) {
        statements.push(labels[i].statements[x].data);
      }
      break;
    }
  }
  
  return statements.length > 0 ? statements.join('\n') : error;
} 
  
Component.prototype.isFullyResolved = function() {
  var b = true;
  var imps = this.getImports();
  for (var x=0; imps && x<=imps.length; x++) {
    if (imps[x] && imps[x].parsed) {
      var path = imps[x].parsed.path;
      if (!isComponentInCache(path)) {
        //console.log(" >> Import '%s' --> NOT RESOLVED", path);
        b = false;
        break;
      }
    }
  }
  return b;
} 
  
/**
 * Will loop through all statements and concatenate them to a 'this.rendered' variable.
 * Next, will seek all the '${...}' tokens and substitute them one by with values.
 */
Component.prototype.render = function(force) {
  var html = "";
  var f = force || false;
  
  console.log("#### Render component - force: %s, rendered: %s", f, (this.rendered ? "Yes (" + this.rendered.length + " chars)" : "No!"));
  
  if (this.rendered && f === false) return this.rendered;

  if (f) console.log("Forced render of component");
  
  if (!this.isFullyResolved()) {
    console.log("ERROR: Could not render, not fully resolved!");
    return html;
  } 

  console.log("Rendering '%s'", this.path);
  console.log(" >> %d labels", this.labs.length);
  
  for (var i=0; i<this.labs.length; i++) {
    console.log("   >> [%s]: %d statements", this.labs[i].parsed.name, this.labs[i].statements.length);
    for (var x=0; x<this.labs[i].statements.length; x++) {
      //console.log("     >> %s", JSON.stringify(this.labs[i].statements[x].data));
      //html += (JSON.stringify(this.labs[i].statements[x].data) + "\n");
      html += (this.labs[i].statements[x].data + "\n");
    }
  }
  
  this.rendered = this.resolveStatements(html);
  
  return this.rendered;
} 
    
Component.prototype.resolveStatements = function(html) {
  var done = false;
  
  console.log("#### Resolving tokens to statements - component length: %d chars", html.length);

  // ----------------------------------------------------------------------------------------------------------------------
  // Find each token from the rendered 'html' portion. Excluding optional spaces, there are essentiall six
  // types of tokens:   x, x(), x(1), x.y, x.y(), x.y(1)
  // ----------------------------------------------------------------------------------------------------------------------
  // Regex description ==> ${  space   component-name    .optional-label         space  (optional-instruction)      space    }
  var list = html.match(/(\$\{)([ \t]*)([a-zA-Z0-9-_/]+)(\.([a-zA-Z0-9-_]+)){0,1}([ \t]*)(\([a-zA-Z0-9-_ \t]*\)){0,1}([ \t]*)(\})/g);
  console.log("Substitution tokens: %o", list);
      
  var ref = null;
  var comp = null;

  // Test deconstruction...
  // for (var i=0; i<list.length; i++) {
  //   var ref = cleanReference(list[i]);
  //   console.log("Deconstructing reference '%s'", ref);
  //   console.log(" > Name  : '%s'", getReferenceName(ref));
  //   console.log(" > Label : '%s'", getReferenceLabel(ref));
  //   console.log(" > Inst  : '%s'", getReferenceInstruction(ref));
  // }
 
  for (var i=0; list && i<list.length; i++) {
    var ref = cleanReference(list[i]);
    var name = getReferenceName(ref);
    
    comp = this.getComponentByReference(name);

    if (comp) {
      console.log("Substituting component!");
      var lab = getReferenceLabel(ref);
      var data = comp.getStatements(lab);
      html = html.replace(list[i], data);
    } else {
      html = html.replace(list[i], "<!-- Error: Component not found for token '" + list[i] + "' -->");
    }
  } 

  return html;
} 
  
/**
 * Will get a component using the following lookup order:
 *
 * If it is a fully qualified path (starts with '/'), then it will be explicitly loaded.
 * Otherwise, it will search the component's internal imports list for:
 *
 *  (a) an alias (as defined in components import list)
 *  (b) a component name (last part of path)
 */
Component.prototype.getComponentByReference = function(ref) {
  var comp = null;

  console.log("Find component by reference ('%s')", ref);

  if (ref.startsWith('/')) return getComponent(ref);  
  
  var comp = this.getComponentByAlias(ref);
  
  if (!comp) {
    console.log(" > Not found by alias!");
    comp = this.getComponentByName(ref + EXT);  
  }

  if (!comp) {
    console.log(" > Not found by name!");
  }
 
  if (comp) console.log(" > Found component: %s", comp.toString());

  return comp;
}  
 
/** 
 * Get a component by its 'alias'.
 */
Component.prototype.getComponentByAlias = function(alias) {
  var comp = null;
  var ref = alias.trim();
   
  console.log("Getting component by alias ('%s')", ref);
  
  var imps = this.getImports();
  
  for (var x=0; imps && x<=imps.length; x++) {
    if (imps[x] && imps[x].parsed) {
      if (ref === imps[x].parsed.alias) {
        comp = getComponentFromCache(imps[x].parsed.path);
        break;
      }
    }
  }
  
  return comp;
}   
 
Component.prototype.getComponentByName = function(name) {
  var comp = null;
  var ref = name.trim();
   
  console.log("Getting component by name ('%s')", ref);
  
  var imps = this.getImports();
  
  for (var x=0; imps && x<=imps.length; x++) {
    if (imps[x] && imps[x].parsed) {
      if (ref === imps[x].parsed.name) {
        comp = getComponentFromCache(imps[x].parsed.path);
        break;
      }
    }
  }
  
  return comp;  
}


/**
 * Convert our rendered view to a JSON structure, using a base64 string.
 */
Component.prototype.toJSON = function(force) {
  var html = null;
  var base64 = null;
  var f = force || false;
  
  if (this.base64 && f === false) return this.base64;

  html = this.render(f);
  
  if (html) {
    base64 = Buffer.from(html).toString('base64');
    console.log("Converted HTML to BASE64 (%d chars -> %d chars)", html.length, base64.length);
  }
  
  if (base64) {
    this.base64 = base64;
  }
  
  return { path: this.getPath(), format: 'base64', data: base64 };
}
 
Component.prototype.toString = function() {
  return "Component: name: '" + this.getName()
    + "', path: '" + this.getPath() 
    + "', resolved: " + this.isFullyResolved()
    ;
}


//========================================================================================================
// Private API's...
//========================================================================================================

/**
 * Will accept a token an clean it by removing the:
 *
 *  (a) leading '${'
 *  (b) trailing '}'
 *  (c) and any space in between
 *
 * Such that '${ x.y() }' will return 'x.y()'
 */
function cleanReference(ref) {
  if (!ref) return ref;
  ref = ref.trim();
  ref = ref.replace(/\$\{[ \t]*/, '');   // leading '${ ' (with optional spaces)
  ref = ref.replace(/[ \t]*\}/, '');     // trailing ' }' (with optional spaces)
  return ref;
}

/**
 * Will return only the 'name' portion of the following parts:
 *
 *   name.label(instructions)
 *
 * Will expect that it has been cleaned from the leading '${' and trailing '}' characters.
 */
function getReferenceName(ref) {
  var name = ref;
  if (!ref) return name;
  
  var parts = name.split('.');
  
  if (parts && parts.length > 0) {
    name = parts[0];
    name = name.replace(/\(.*\)[ \t]*$/g, '');   // remove '(...)'
    name = name.trim();
  }

  return name;
}    

/**
 * Will return only the 'name' portion of the following parts:
 *
 *   name.label(instructions)
 *
 * Will expect that it has been cleaned from the leading '${' and trailing '}' characters.
 */
function getReferenceLabel(ref) {
  var label = ref;
  if (!ref) return label;
  
  var parts = label.split('.');
  
  if (parts && parts.length > 1) {
    label = parts[1];
    label = label.replace(/\(.*\)[ \t]*$/g, '');  // remove '(...)'
    label = label.trim();
  } else label = null;
  
  return label;
}   

/**
 * Will return only the 'instruction' portion of the following parts:
 *
 *   name.label(instructions)
 *
 * Will expect that it has been cleaned from the leading '${' and trailing '}' characters.
 */
function getReferenceInstruction(ref) {
  var inst = ref;
  if (!ref) return inst;

  var list = inst.match(/\((.*)\)/);
  
  if (list) {
    inst = list[1];
    inst = inst.trim();
  } else inst = null;
  
  return inst;
}        

function parseImport(data) {
  var parsed = {};  
  var str = data.trim();
  if (!data) return parsed;
  var parts = str.split(' ');  // should have 4 (ie: 'import x as y')
  
  if (parts && parts.length >= 2 && parts[0] === "import") {
    parsed.path = parts[1];
    parsed.name = parsed.path.substr(parsed.path.lastIndexOf('/') + 1);
    parsed.alias = null;    
    if (parts.length === 4) {
      parsed.alias = parts.length === 4 ? parts[3] : null;
    }   
    //console.log("PARSED: %o", parsed);
  }  
  return parsed; 
}

function parseLabel(data) {
  var parsed = {};
  var str = data;
  if (!data) return parsed;
  str = str.replace(/^[ \t]*\u0040\u0040/g, '');  // leading
  str = str.replace(/[ \t]*$/g, '');              // trailing
  parsed.name = str.trim();
  //console.log("LABEL: '%o'", parsed);
  return parsed;
}

function parseExec(data) {
  var parsed = {};
  var str = data;
  if (!data) return parsed;
  str = str.replace(/^[ \t]*\u0040\u0040/g, '');  // leading
  str = str.replace(/[ \t]*$/g, '');              // trailing
  var parts = str.split(':');
  if (parts && parts.length >= 1) {
    parsed.name = parts[0].trim();
    parsed.script = parts[1].trim();
    //console.log("EXEC: '%o'", parsed);
  }  
  return parsed;
}

/**
 * Will load all 'import' dependencies for the given component.
 */
function resolve(comp) {
  var n = 0;
  if (!comp) return n;
  console.log("Resolving '%s' imports", comp.getPath());
  var imps = comp.getImports();  
  for (var x=0; imps && x<=imps.length; x++) {
    if (imps[x] && imps[x].parsed) {
      var path = imps[x].parsed.path;
      console.log(" > Import %d '%s'", x, path);
      getComponent(path);
      n++;
    }
  }
  return n;
}

/**
 * Will read the component path from the FS and pre-parse it. Once it has
 * been successfully loaded, it will cache it for future use.
 */
function readComponent(path) {
  var comp = getComponentFromCache(path);  
  if (comp) { return comp; }

  console.log("Reading component '%s'", path);
  comp = new Component();
  comp.setPathAndName(path);
  
  const empty = RegExp('^\s*$');
  const comment = RegExp('^[ \t]*#.*$');  
  
  const meta = RegExp('^[ \t]*#[ \t]*\u0040[\w]*.*$');
  
  const define = RegExp('^[ \t]*define[ \t]*.*$');
  const imports = RegExp('^[ \t]*import[ \t]*.*$');
  
  const label = RegExp('^[ \t]*\u0040\u0040[a-zA-Z0-9_-]+[ \t]*$');
  const execs = RegExp('^[ \t]*\u0040\u0040[a-zA-Z0-9_-]+[ \t]*:[ \t]*.*$');
   
  var text = null;
  
  try {
    text = fs.readFileSync(BASE + "/" + path + EXT, "utf-8");
  } catch (e) {
    return null;
  }
  
  var lines = text.split('\n');
  var el = null;
 
  console.log(" > Read %d bytes, %d lines", text.length, lines.length);
  console.log(" > Extracting data...");

  for (var i=0; i<lines.length; i++) {
    var line = lines[i].trim();
    var n = i+1;
     
    if (empty.test(line))        el = { line: n, type: "B", data: line };
    else if (meta.test(line))    el = comp.addMeta(n, line);
    else if (comment.test(line)) el = comp.addComment(n, line);
    else if (define.test(line))  el = comp.addDefinition(n, line);
    else if (imports.test(line)) el = comp.addImport(n, line);
    else if (label.test(line))   el = comp.addLabel(n, line);
    else if (execs.test(line))   el = comp.addExecutable(n, line);
    else el = comp.addStatement(n, line);
    
    console.log(" > Line %i: [%s] '%s'", n, el.type, el.data);
  }

  if (comp) {
    COMPS.push(comp);
    console.log(" > Saved to cache, now have %d entries", COMPS.length);
  } 
   
  console.log("--------------------------------------------------------------------------------------------------------");
  console.log(JSON.stringify(comp));
  console.log("--------------------------------------------------------------------------------------------------------");

  return comp;
} 
 
/**
 * Determins if this specified component is loaded (in cache).
 */
function isComponentInCache(path) {
  var comp = getComponentFromCache(path);
  return comp !== null;
}
 
/**
 * Get a component from the global cache. If not found, return null.
 */
function getComponentFromCache(path) {
  var comp = null;
  var p = path.trim();
  var c = null;
  console.log("Seeking component '%s' from cache", path);
  for (var x=0; p && x<COMPS.length; x++) {
    c = COMPS[x];
    if (c.getPath() === path) {
      //console.log(" > Found component in cache!");
      comp = c;
      break;
    } 
  } 
  if (comp === null) console.log(" > Component '%s' not found in cache!", path);
  return comp;
}

//========================================================================================================
// Public Module API's...
//========================================================================================================

function getComponent(path) {
  var cnt = 0;

  console.log("Get component '%s'", path);  
  var comp = readComponent(path);
  
  if (comp) {
    cnt = resolve(comp);
    console.log(" > Resolved %d import dependencies for '%s'", cnt, path);
  }
  
  return comp;
}
 
function count() {
  return COMPS.length;
}

function list() {
  var str = "";
  str += "Component list (" + count() + "):\n";
  for (var x=0; x<COMPS.length; x++) {
    str += " >> " + COMPS[x].toString() + "\n";
  }
  return str;
}
 
module.exports = {
  getComponent: getComponent,
  count: count,
  list: list
};
