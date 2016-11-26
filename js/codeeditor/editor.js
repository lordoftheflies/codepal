/*
 * CodeEditor
 * Editor Module
 * Author: Alec Ng
 * Dependencies:
 * - ace.js
 * - ui.js
 * - util.js
 * 
 */

CodeEditor.prototype._editor = function(options) {

	var self		= this,
		currHash,
		aceEditor,
		aceLangMap	= { // user label to ace .js file name 
			'C'				: 'c_cpp',
			'C#'			: 'csharp',
			'C++'			: 'c_cpp',
			'C++11'			: 'c_cpp',
			'Go'			: 'golang',
			'Java'			: 'java',
			'Node.js'		: 'javascript',
			'Python'		: 'python',
			'Python 3'		: 'python',
			'Ruby'			: 'ruby',
		},
		sessions = {
			// Stores aceEditor sessions to mimic tab funcitonality
		};
		currentSessions = {
			// 
		};

	// @SUMMARY	: initializes an Ace Editor instance
	// @PARAM	: [eleId] id of the container to hold the editor instance
	// @PARAM	: [lang] default language for syntax highlighting
	// @RETURN	: the editor object itself and its sessions for fluency 
	function initEditor(eleId, lang, theme) {
		aceEditor = ace.edit(eleId);
		
		// RESTORE DEFAULT: empty, unnamed tab
		sessions = {};
		currHash = undefined;
		createNewSession();

		setEditorTheme(theme);
		aceEditor.setShowPrintMargin(false);
		setEditorLang(lang);
		aceEditor.setAutoScrollEditorIntoView(true);
		aceEditor.getSession().setTabSize(4);

		return {
			aceEditor: aceEditor,
			sessions : sessions
		};
	}

	// EDITOR
	// --------------------------------------------------------

	// @AUMMARY	: sets the editor's contents
	// @PARAM	: [str] the content to set the editor to
	// @RETURN	: the editor's contents
	function setEditorText(str) {
		aceEditor.setValue(str, 1); // moves cursor to the end
		return getEditorText();
	}

	// @RETURN	: all text inputted in the current editor instance
	function getEditorText() {
		return aceEditor.getValue();
	}

	// @SUMMARY	: changes the editor's theme
	// @PARAM 	: [theme] theme to switch to
	// @RETURN	: the theme changed to
	function setEditorTheme(theme) {
		aceEditor.setTheme("ace/theme/" + theme);

		var newTheme = aceEditor.getTheme().split('ace/theme/')[1];
		if (newTheme !== theme) {
			throw 'Theme was not successfully switched to ' + theme;
		}
		return newTheme;
	}

	// @SUMMARY	: changes the editor's language for syntax highliting
	// @PARAM	: [newLang] lang to switch to
	// @RETURN	: the new language, in ace format
	function setEditorLang(newLang) {
		aceEditor.getSession().setMode("ace/mode/" + aceLangMap[newLang]);
		self.util.changeExtension(newLang);
		sessions[currHash].lang = newLang;

		var newMode = aceEditor.session.$modeId.split('ace/mode/')[1];
		if (aceLangMap[newLang] !== newMode) {
			throw 'Mode was not successfully switched to ' + newLang;
		}
		return newLang;
	}

	// SESSIONS [Action]
	// --------------------------------------------------------

	// @SUMMARY	: removes the session designated by the hash from the session hash map
	// @PARAM	: [hash] the hash of the session to delete
	// @RETURN	: null if the session doesn't exist, or the hash itself on successful
	// 				deletion
	function deleteSession(hash) {
		var numSessions = Object.keys(sessions).length;
		// LIMITATION - always have at least one tab open
		if (numSessions === 1 || typeof(sessions[hash]) === 'undefined') {
			return null;
		}
		delete sessions[hash];
		if (currentSessions[hash] !== 'undefined') {
			delete currentSessions[hash];
		}
		return hash;
	}

	// @SUMMARY	: creates a new session object and stores it in the session hash map
	//				switches the editor's current session to the newly created one
	// @PARAM	: [savedSnippet]
	// @RETURN	: the new session object	
	function createNewSession(savedSnippet){
		if (savedSnippet && sessions[savedSnippet.hash] !== 'undefined') {
			return; // saved snippet is already loaded in the editor
		}

		var lang, contents, hash, name;
		if (savedSnippet) {
			lang = savedSnippet.lang;
			contents = savedSnippet.contents;
			hash = savedSnippet.hash;
			name = savedSnippet.name;
		} else {
			lang = self.ui.getCurrLang();
			contents = '';
			hash = self.util.genHash();
			name = 'untitled';
		}

		var newSession 	= new ace.EditSession(contents, aceLangMap[lang]),
			sessionObj	= generateSessionObject(newSession, lang, name);

		sessions[hash] = sessionObj;

		// switch sessions
		switchSession(hash);
		self.ui.generateAndAppendNewTab(hash, name);

		return {
			hash		: hash,
			sessionObj	: sessionObj
		};
	}

	// @SUMMARY	: switches the editor's current session
	// @PARAM	: [hash] the hash of the session to switch to
	// @RETURN	: the session object represented by the hash passed in
	function switchSession(hash) {
		if (typeof(sessions[hash]) === 'undefined' || hash === currHash) {
			return;
		}
		saveSession(currHash);
		delete currentSessions[currHash];

		currHash = hash;
		restoreSession(currHash);
		currentSessions[currHash] = true;

		var name = sessions[currHash].name === 'untitled' 
			? ''
			: sessions[currHash].name;
		self.util.setFilename(name);

		return sessions[hash];
	}

	function saveCurrSession() {
		saveSession(currHash);
	}

	// @SUMMARY	: Changes the hash of a saved session
    // @PARAM	: [hash] 
    // @PARAM	: [newHash]
	function updateSession(hash, newHash, newName) {
		if (sessions[hash] === 'undefined') {
			return;
		}
		var sessionObj = sessions[hash];
		delete sessions[hash];
		sessions[newHash] = sessionObj;
		sessions[newHash].name = newName;

		if (currHash == hash) {
			currHash = newHash;
		}
	}

	// SESSIONS [Properties]
	// --------------------------------------------------------

	function getCurrSessionObj() {
		return {
			hash		: currHash,
			sessionObj	: sessions[currHash]
		};
	}

	function isSessionCached(hash) {
		return (sessions[hash] !== 'undefined');
	}

	function isSessionLoaded(hash) {
		return (currentSessions[hash] !== 'undefined');
	}

	// @SUMMARY	: generates a new session object to be stored in sessions { }
	// @RETURN	: the newly created session obj
	function generateSessionObject(session, lang, name) {
		return {
			aceSession	: session,
			lang		: lang,
			name		: name
		};
	}

	// PRIVATE
	// -------------------------------

	// @SUMMARY	: restores the editor to a saved session, replacing text and language
	// @PARAM	: [hash] the hash representing the session to restore to
	function restoreSession(hash) {
		if (typeof(sessions[hash]) === 'undefined') {
			return;
		}
		var sessionObj = sessions[hash];
		aceEditor.setSession(sessionObj.aceSession);
		setEditorLang(sessionObj.lang);
		self.ui.setLang(sessionObj.lang);
		self.execute.initReplClient(sessionObj.lang);
	}

	// @SUMMARY	: updates a session's state within the session hash map
	// @PARAM	: [hash] the hash representing the session to save
	function saveSession(hash) {
		if (typeof(sessions[hash]) === 'undefined') {
			return;
		}
		// overwrite existing saved session with newest version
		sessions[hash].aceSession = aceEditor.getSession();
		sessions[hash].lang = self.ui.getCurrLang();
	}

	return {
		initEditor				: initEditor,
		getEditorText			: getEditorText,
		setEditorText			: setEditorText,
		setEditorTheme			: setEditorTheme,
		setEditorLang			: setEditorLang,

		deleteSession			: deleteSession,
		createNewSession		: createNewSession,
		switchSession			: switchSession,
		updateSession			: updateSession,
		saveCurrSession			: saveCurrSession,

		generateSessionObject 	: generateSessionObject,
		getCurrSessionObj		: getCurrSessionObj,
		isSessionCached			: isSessionCached,
		isSessionLoaded			: isSessionLoaded,

		aceLangMap				: aceLangMap
	};
};