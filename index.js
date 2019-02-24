'use strict';
const electron = require('electron');
const {download} = require('electron-dl');
const isDev = require('electron-is-dev');

const webContents = win => win.webContents || win.getWebContents();


function create(win, opts) {
	webContents(win).on('context-menu', (e, props) => {
		if (typeof opts.shouldShowMenu === 'function' && opts.shouldShowMenu(e, props) === false) {
			return;
		}

		const editFlags = props.editFlags;
		const hasText = props.selectionText.trim().length > 0;
		const can = type => editFlags[`can${type}`] && hasText;

		let menuTpl = [
			{
				type: 'separator'
			},
			{
				id: 'cut',
				label: 'Cut',
				// Needed because of macOS limitation:
				// https://github.com/electron/electron/issues/5860
				role: can('Cut') ? 'cut' : '',
				enabled: can('Cut'),
				visible: props.isEditable
			},
			{
				id: 'copy',
				label: 'Copy',
				role: can('Copy') ? 'copy' : '',
				enabled: can('Copy'),
				visible: props.isEditable || hasText 
			},
			{
				id: 'paste',
				label: 'Paste',
				role: editFlags.canPaste ? 'paste' : '',
				enabled: editFlags.canPaste,
				visible: props.isEditable
			},
			{
				type: 'separator'
			},
			{
				id: 'google',
				label: hasText ? 'Google検索' : 'Google',
				enabled: can('Copy'),
				visible: props.isEditable || hasText,
				click: () => {
					if (!hasText)
						electron.shell.openExternal('https://www.google.com/')
				  	else
						electron.shell.openExternal('https://www.google.com/search?q=' + props.selectionText.trim());
				}
			},
			{
				id: 'wikijp',
				label: hasText ? 'Wikipediaで検索' : 'Wikipedia',
				visible: props.isEditable || hasText,
				click: () => {
					electron.shell.openExternal(`https://jp.wikipedia.org/wiki/Special:Search?search=${props.selectionText.trim()}`);
				}
			},
			{
				id: 'twitter',
				label: hasText ? 'Twitter検索' : 'Twitter',
				visible: props.isEditable || hasText,
				click: () => {
					if (!hasText)
						electron.shell.openExternal('https://twitter.com/')
				  	else
						electron.shell.openExternal(`https://twitter.com/search?q=${props.selectionText.trim()}&src=typd`);
				}
			},
			{
				id: 'phrasesearch',
				label: 'Phrase検索',
				submenu: [
					{
						id: 'skellws',
						label: hasText ? 'SKELLコロケーション検索' : 'SKELL(コロケーション)',
						enabled: can('Copy'),
						visible: props.isEditable || hasText,
						click: () => {
						  if (!hasText)
							  electron.shell.openExternal('https://skell.sketchengine.co.uk/run.cgi/skell')
						  else
							electron.shell.openExternal( 'https://skell.sketchengine.co.uk/run.cgi/wordsketch?lpos=&query=' + props.selectionText.trim());
						}
					},
					{
						id: 'dopeoplesayit',
						label: 'Do People Say It',
						enabled: can('Copy'),
						visible: props.isEditable || hasText,
						click: () => {
							electron.shell.openExternal(`https://dopeoplesay.com/q/${props.selectionText.trim()}`);
						}
					},
					{
						id: 'ngram',
						label: 'ngram',
						enabled: can('Copy'),
						visible: props.isEditable || hasText,
						click: () => {
							electron.shell.openExternal( `https://books.google.com/ngrams/graph?content=${props.selectionText.trim()}&year_start=1900&corpus=15&smoothing=3`);
						}
					},
				]
			},
			{ type: 'separator' },
			{
				id: 'wordsearch',
				label: 'Word検索',
				submenu: [
					{
						id: 'keep',
						label: hasText ? 'Keep検索' : 'Keep',
						visible: props.isEditable || hasText,
						click: () => {
						  if (!hasText)
							electron.shell.openExternal('https://keep.google.com/')
						  else
							electron.shell.openExternal( 'https://keep.google.com/#search/text=' + props.selectionText.trim());
						}
					},
					{
						id: 'vocabulary',
						label: 'Vocabulary.com',
						visible: props.isEditable && hasText,
						click: () => {
							electron.shell.openExternal( `https://www.vocabulary.com/dictionary/${props.selectionText.trim()}`);
						}
					},
					{
						id: 'ruigo',
						label: '連想類語辞典',
						visible: props.isEditable && hasText,
						click: () => {
							electron.shell.openExternal(`https://renso-ruigo.com/word/${props.selectionText.trim()}`);
						}
					},
				]
			},
			{ type: 'separator' },
			{
				id: 'bookmarks',
				label: 'Bookmarks',
				submenu: [
					{
						id: 'simplenote',
						label: 'Simplenote',
						click: () => electron.shell.openExternal ( 'https://app.simplenote.com/' )
					},
					{
						id: 'iosnote',
						label: 'iOS note',
						click: () => electron.shell.openExternal ( 'https://www.icloud.com/#notes2/' )
					},
					{
						id: 'scrapbox',
						label: 'Scrapbox',
						click: () => electron.shell.openExternal ( 'https://scrapbox.io/' )
					},
					{ type: 'separator' },
					{
						id: 'imdb',
						label: 'IMDB',
						click: () => electron.shell.openExternal ( 'https://www.imdb.com/' )
					},
					{ type: 'separator' },
					{
						id: 'pocket',
						label: 'Pocket',
						click: () => electron.shell.openExternal ( 'https://getpocket.com/a/queue/' )
					},

				]
			}
		];

		if (props.mediaType === 'image') {
			menuTpl = [{
				type: 'separator'
			}, {
				id: 'save',
				label: 'Save Image',
				click() {
					download(win, props.srcURL);
				}
			}, {
				type: 'separator'
			}];
		}

		if (props.linkURL && props.mediaType === 'none') {
			menuTpl = [{
				type: 'separator'
			}, {
				id: 'copyLink',
				label: 'Copy Link',
				click() {
					if (process.platform === 'darwin') {
						electron.clipboard.writeBookmark(props.linkText, props.linkURL);
					} else {
						electron.clipboard.writeText(props.linkURL);
					}
				}
			}, {
				type: 'separator'
			}];
		}

		if (opts.prepend) {
			const result = opts.prepend(props, win);

			if (Array.isArray(result)) {
				menuTpl.unshift(...result);
			}
		}

		if (opts.append) {
			const result = opts.append(props, win);

			if (Array.isArray(result)) {
				menuTpl.push(...result);
			}
		}

		if (opts.showInspectElement || (opts.showInspectElement !== false && isDev)) {
			menuTpl.push({
				type: 'separator'
			}, {
				id: 'inspect',
				label: 'Inspect Element',
				click() {
					win.inspectElement(props.x, props.y);

					if (webContents(win).isDevToolsOpened()) {
						webContents(win).devToolsWebContents.focus();
					}
				}
			}, {
				type: 'separator'
			});
		}

		// Apply custom labels for default menu items
		if (opts.labels) {
			for (const menuItem of menuTpl) {
				if (opts.labels[menuItem.id]) {
					menuItem.label = opts.labels[menuItem.id];
				}
			}
		}

		// Filter out leading/trailing separators
		// TODO: https://github.com/electron/electron/issues/5869
		menuTpl = delUnusedElements(menuTpl);

		if (menuTpl.length > 0) {
			const menu = (electron.remote ? electron.remote.Menu : electron.Menu).buildFromTemplate(menuTpl);

			/*
			 * When electron.remote is not available this runs in the browser process.
			 * We can safely use win in this case as it refers to the window the
			 * context-menu should open in.
			 * When this is being called from a webView, we can't use win as this
			 * would refere to the webView which is not allowed to render a popup menu.
			 */
			menu.popup(electron.remote ? electron.remote.getCurrentWindow() : win);
		}
	});
}

function delUnusedElements(menuTpl) {
	let notDeletedPrevEl;
	return menuTpl.filter(el => el.visible !== false).filter((el, i, arr) => {
		const toDelete = el.type === 'separator' && (!notDeletedPrevEl || i === arr.length - 1 || arr[i + 1].type === 'separator');
		notDeletedPrevEl = toDelete ? notDeletedPrevEl : el;
		return !toDelete;
	});
}

module.exports = (opts = {}) => {
	if (opts.window) {
		const win = opts.window;
		const wc = webContents(win);

		// When window is a webview that has not yet finished loading webContents is not available
		if (wc === undefined) {
			win.addEventListener('dom-ready', () => {
				create(win, opts);
			}, {once: true});
			return;
		}

		return create(win, opts);
	}

	(electron.BrowserWindow || electron.remote.BrowserWindow).getAllWindows().forEach(win => {
		create(win, opts);
	});

	(electron.app || electron.remote.app).on('browser-window-created', (e, win) => {
		create(win, opts);
	});
};
