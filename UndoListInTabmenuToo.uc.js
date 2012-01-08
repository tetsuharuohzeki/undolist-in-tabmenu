// ==UserScript==
// @name           UndoListInTabmenuToo
// @description    UndoListInTabmenuToo.uc.js
// @include        main
// ==/UserScript==

let UndoListInTabmenuToo = {

  get tabContextUndoList () {
    return document.getElementById("tabContextUndoList");
  },

  get _ss () {
    delete this._ss;
    return this._ss = Cc["@mozilla.org/browser/sessionstore;1"].
                      getService(Ci.nsISessionStore);
  },

  toggleRecentlyClosedTabs: function HM_toggleRecentlyClosedTabs() {
    // enable/disable the Recently Closed Tabs sub menu
    let undoMenu = this.tabContextUndoList;

    // no restorable tabs, so disable menu
    if (this._ss.getClosedTabCount(window) == 0)
      undoMenu.setAttribute("disabled", true);
    else
      undoMenu.removeAttribute("disabled");
  },

  /**
    * Re-open a closed tab and put it to the end of the tab strip.
    * Used for a middle click.
    * @param aEvent
    *        The event when the user clicks the menu item
    */
  _undoCloseMiddleClick: function PHM__undoCloseMiddleClick(aEvent) {
    if (aEvent.button != 1)
      return;

    undoCloseTab(aEvent.originalTarget.value);
    gBrowser.moveTabToEnd();
  },

  /**
   * Populate when the history menu is opened
   */
  populateUndoSubmenu: function PHM_populateUndoSubmenu(aUndoPopup) {
    let undoPopup = aUndoPopup;

    // remove existing menu items
    while (undoPopup.hasChildNodes()) {
      undoPopup.removeChild(undoPopup.firstChild);
    }

    // populate menu
    let undoItems = JSON.parse(this._ss.getClosedTabData(window));
    for (let i = 0, l = undoItems.length; i < l; i++) {
      let m = document.createElement("menuitem");
      let undoItem = undoItems[i];
      m.setAttribute("label", undoItem.title);
      if (undoItem.image) {
        let iconURL = undoItem.image;
        // don't initiate a connection just to fetch a favicon (see bug 467828)
        if (/^https?:/.test(iconURL)) {
          iconURL = "moz-anno:favicon:" + iconURL;
        }
        m.setAttribute("image", iconURL);
      }
      m.setAttribute("class", "menuitem-iconic bookmark-item menuitem-with-favicon");
      m.setAttribute("value", i);
      m.setAttribute("oncommand", "undoCloseTab(" + i + ");");

      // Set the targetURI attribute so it will be shown in tooltip and trigger
      // onLinkHovered. SessionStore uses one-based indexes, so we need to
      // normalize them.
      let tabData = undoItem.state;
      let activeIndex = (tabData.index || tabData.entries.length) - 1;
      if (activeIndex >= 0 && tabData.entries[activeIndex]) {
        m.setAttribute("targetURI", tabData.entries[activeIndex].url);
      }

      m.addEventListener("click", this._undoCloseMiddleClick, false);
      if (i == 0) {
        m.setAttribute("key", "key_undoCloseTab");
      }
      undoPopup.appendChild(m);
    }
/*
    // "Restore All Tabs"
    let strings = gNavigatorBundle;
    undoPopup.appendChild(document.createElement("menuseparator"));
    let m = undoPopup.appendChild(document.createElement("menuitem"));
    m.id = "menu_restoreAllTabs";
    m.setAttribute("label", strings.getString("menuRestoreAllTabs.label"));
    m.addEventListener("command", function() {
      for (let i = 0; i < undoItems.length; i++)
        undoCloseTab();
    }, false);
*/
    // "Clear undo close tab list"
    undoPopup.appendChild(document.createElement("menuseparator"));

    let m = undoPopup.appendChild(document.createElement("menuitem"));
    m.setAttribute("label", "Clear undo close tab list");
    m.setAttribute("class", "menuitem-iconic bookmark-item");
    m.setAttribute("accesskey", "C");
    m.addEventListener("command", this._clearUndoTabList, false);
  },

  _clearUndoTabList: function () {
    const kMAX_TABS_UNDO = "browser.sessionstore.max_tabs_undo";
    let max_undo = Services.prefs.getIntPref(kMAX_TABS_UNDO, 10);

    Services.prefs.setIntPref(kMAX_TABS_UNDO, 0);
    Services.prefs.setIntPref(kMAX_TABS_UNDO, max_undo);
  },

  /**
   * Populate when the history menu is opened
   */
  _onPopupShowing: function HM__onPopupShowing(aEvent) {
    let target = aEvent.target;
    if (target.id == "tabContextUndoList-popup") {
      this.populateUndoSubmenu(target);
    }
    else if (target.id == gBrowser.tabContainer.contextMenu.id) {
      this.toggleRecentlyClosedTabs();;
    }
  },

  init: function(){
    let tabContext = gBrowser.tabContainer.contextMenu;
    let originalMenuItem = document.getElementById("context_undoCloseTab");

    // label
    let locale = Services.prefs.getCharPref("general.useragent.locale");
    let LABELTEXT = locale.indexOf("ja") === -1 ? 
                   "Recently Closed Tabs" : "\u6700\u8fd1\u9589\u3058\u305f\u30bf\u30d6";

    // menu
    let menu = document.createElement("menu");
    menu.setAttribute("id", "tabContextUndoList");
    menu.setAttribute("label", LABELTEXT);
    menu.setAttribute("accesskey", "L");

    // menupopup
    let menupopup = document.createElement("menupopup");
    menupopup.setAttribute("id", "tabContextUndoList-popup");

    menu.appendChild(menupopup);
    tabContext.insertBefore(menu, originalMenuItem);

    //insert separator
    tabContext.insertBefore(document.createElement("menuseparator"), menu.nextSibling);

    //add event listener
    tabContext.addEventListener("popupshowing", this, false);
    menupopup.addEventListener("popupshowing", this, false);

    window.addEventListener("unload", this, false);

    originalMenuItem.hidden = true;
  },

  _onUnLoad: function (aEvent) {
    window.removeEventListener("unload", this, false);

    tabContext.removeEventListener("popupshowing", this, false);
    menupopup.removeEventListener("popupshowing", this, false);
  },

  handleEvent: function (aEvent) {
    switch (aEvent.type) {
      case "popupshowing":
        this._onPopupShowing(aEvent);
        break;
      case "unload":
        this._onUnLoad(aEvent);
        break;
    }
  },

};
UndoListInTabmenuToo.init();