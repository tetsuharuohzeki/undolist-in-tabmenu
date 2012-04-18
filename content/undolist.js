let UndoListInTabmenuToo = {

  get undoMenu () {
    return document.getElementById("context-undoTabList");
  },

  get undoPopup () {
    return document.getElementById("context-undoTabList-popup");
  },

  get undoCloseAll () {
    return document.getElementById("context-undoTabList-close-all");
  },

  get undoListBox () {
    return document.getElementById("context-undoTabList-listbox");
  },

  get _ss () {
    delete this._ss;
    return this._ss = Cc["@mozilla.org/browser/sessionstore;1"].
                      getService(Ci.nsISessionStore);
  },

  toggleRecentlyClosedTabs: function HM_toggleRecentlyClosedTabs() {
    // enable/disable the Recently Closed Tabs sub menu
    let undoMenu = this.undoMenu;

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
  populateUndoSubmenu: function PHM_populateUndoSubmenu() {
    let undoPopup = this.undoListBox;

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
    switch (target.id) {
      case "context-undoTabList-popup":
        this.populateUndoSubmenu();
        break;
      case "tabContextMenu":
        this.toggleRecentlyClosedTabs();
        break;
    }
  },

  _onLoad: function (aEvent) {
    window.removeEventListener("load", this, false);

    this.undoPopup.addEventListener("popupshowing", this, false);
    gBrowser.tabContainer.contextMenu.addEventListener("popupshowing", this, false);
    this.undoCloseAll.addEventListener("command", this, false);
 
    // hide default item
    document.getElementById("context_undoCloseTab").setAttribute("hidden", "true");

    window.addEventListener("unload", this, false);
  },

  _onUnLoad: function (aEvent) {
    window.removeEventListener("unload", this, false);

    this.undoCloseAll.removeEventListener("command", this, false);
    gBrowser.tabContainer.contextMenu.removeEventListener("popupshowing", this, false);
    this.undoPopup.removeEventListener("popupshowing", this, false);
  },

  handleEvent: function (aEvent) {
    switch (aEvent.type) {
      case "popupshowing":
        this._onPopupShowing(aEvent);
        break;
      case "command":
        this._clearUndoTabList(aEvent);
        break;
      case "load":
        this._onLoad(aEvent);
        break;
      case "unload":
        this._onUnLoad(aEvent);
        break;
    }
  },

};
window.addEventListener("load", UndoListInTabmenuToo, false);