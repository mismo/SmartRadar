load("tools/lib/jslint.js");

var src = readFile("dist/smart_radar_debug.js");

JSLINT(src, { evil: true, forin: true, maxerr: 100 });

// All of the following are known issues that we think are 'ok'
// (in contradiction with JSLint)
var ok = {
	"Expected an identifier and instead saw 'undefined' (a reserved word).": true,
	"Use '===' to compare with 'null'.": true,
	"Use '!==' to compare with 'null'.": true,
	"Expected an assignment or function call and instead saw an expression.": true,
	"Expected a 'break' statement before 'case'.": true,
	"'e' is already defined.": true,
	"Unsafe character.": true
};

var e = JSLINT.errors, found = 0, w;

for ( var i = 0; i < e.length; i++ ) {
	w = e[i];

	if ( !ok[ w.reason ] ) {
		found++;
		print( "\n" + w.evidence + "\n" );
		print( "    Problem at line " + w.line + " character " + w.character + ": " + w.reason );
	}
}

if ( found > 0 ) {
	print( "\n" + found + " Error(s) found." );

} else {
	print( "JSLint check passed." );
}
