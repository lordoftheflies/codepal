/*
 * CodeEditor
 * Util Module
 * Dependencies:
 * - editor.js
 */

CodeEditor.prototype._util = function(options) {

    var self 		= this,
    	$filename 	= options.$filename,
    	$extension 	= options.$extension,
		messages 	= {
			'COMPILER_ERR'	: 'Compiler has encountered an unknown error!',
		    'RUNTIME_ERR'	: 'Error during runtime!'
		},
		extensionMap = {
			'C'				: '.c',
			'C#'			: '.cs',
			'C++'			: '.cpp',
			'C++11'			: '.cpp',
			'Go'			: '.go',
			'Java'			: '.java',
			'Node.js'		: '.js',
			'Python'		: '.py',
			'Python 3'		: '.py',
			'Ruby'			: '.rb',
		};

	// @SUMMARY	: downloads curr session's contents to the user's local machine
	function download() {
		// lib will automatically replace any non-valid filename chars with '-'
		var filename = $filename.val();
		if (!$filename.val()) {
			alert('Please enter a filename.');
			return;
		}
		var text = self.editor.getEditorText(),
			blob = new Blob([text], {
				type: "text/plain;charset=utf-8"
			}),
			currSession = self.editor.getCurrSessionObj(),
			lang = extensionMap[currSession.sessionObj.lang];

		saveAs(blob, filename + lang);
	}

	// @SUMMARY	: changes extension in save modal according to lang chosen
	// @PARAM	: (lang) to match with extensionMap
	function changeExtension(lang) {
		$extension.html(extensionMap[lang]);
	}

	// @RETURN	: filename input value
	function getFilename() {
		return $filename.val();
	}

	function setFilename(name) {
		$filename.val(name);
	}

	function translateErr(msg, lang) {
	 
	    var lineArray = msg.split("\n");
	    output = '';
	    newLine = '<br/>'
	    numLines = lineArray.length;
	    /*TODO
        *   Language specific compiler/runtime error handling
        	'CPP',
	    	'CSHARP',   Basic errors are now handled
			'HASKELL',
			'JAVA',
			'JAVASCRIPT_NODE',  
			'OBJECTIVEC',
			'PASCAL',
			'PERL',
			'PYTHON',
        */

	    /* Generic translation
        *  prints each line directly from HackerEarth's return error
        */
	    if (lang == 'nodejs') {	        
	        for (i = 0; i < numLines; i++) {
	            var index = lineArray[i].search('evalmachine');
	            //output += index + '<br/>'; //Debug

	            if (index != -1) {
                    //identify error line
	                output += 'at' + lineArray[i].substring(index + 12) + newLine;
	                { continue; }
	            }
	            index = lineArray[i].search('.js');
	            //output += 'intermediate index: ' + index; //Debug
	            if (index != -1) {
	                //don't print this line
	            }
	            else {
	                //output relevant error type information
	                output += lineArray[i] + newLine;

	                //output += 'query value' + $('#query').val(); //debug

	                //Trigger youtube and Stack Overflow search for the top level error
                    //TODO -youtube dropdown activation
	                $('#query').val(lineArray[i]);
	                $('#search-button').trigger('click');
	                $('#query1').val(lineArray[i]);
	                $('#soSearch').trigger('click');
	            }
	        }
	    }
        
		//Debug
		//output += 'Original message' + newLine;    
		/*
		    else {
		        for (i = 0; i < numLines; i++) {
		            output += lineArray[i] + newLine + 'current language is: ' + lang;
		        }
		    }
	    */
	     //Debug
		// output += "The current language is:" + newLine + lang;  //debug

	    //In case of unhandled error, print generic message
	    if (output.length === 0) {
	        msg = messages.RUNTIME_ERR;
	    }
        
	    return output;
	}

	function genHash() {
		return new Date().getTime();
	}

	return {
	    translateErr	: translateErr,
	    genHash			: genHash,
	    download		: download,
	    getFilename		: getFilename,
	    setFilename		: setFilename,
	    changeExtension	: changeExtension
	};

};