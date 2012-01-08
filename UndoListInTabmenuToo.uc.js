// ==UserScript==
// @name           UndoListInTabmenuToo
// @description    UndoListInTabmenuToo.uc.js
// @include        main
// ==/UserScript==

var UndoListInTabmenuToo = {

  get _ss () {
   delete this._ss;
   return this._ss = Cc["@mozilla.org/browser/sessionstore;1"].
                     getService(Ci.nsISessionStore);
 },

  toggleRecentlyClosedTabs: function HM_toggleRecentlyClosedTabs() {
    // enable/disable the Recently Closed Tabs sub menu
    var undoMenu = this._rootElt.getElementsByClassName("recentlyClosedTabsMenu")[0];

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
    var undoMenu = this._rootElt.getElementsByClassName("recentlyClosedTabsMenu")[0];
    var undoPopup = undoMenu.firstChild;

    // remove existing menu items
    while (undoPopup.hasChildNodes())
      undoPopup.removeChild(undoPopup.firstChild);

    // no restorable tabs, so make sure menu is disabled, and return
    if (this._ss.getClosedTabCount(window) == 0) {
      undoMenu.setAttribute("disabled", true);
      return;
    }

    // enable menu
    undoMenu.removeAttribute("disabled");

    // populate menu
    var undoItems = eval("(" + this._ss.getClosedTabData(window) + ")");
    for (var i = 0; i < undoItems.length; i++) {
      var m = document.createElement("menuitem");
      m.setAttribute("label", undoItems[i].title);
      if (undoItems[i].image) {
        let iconURL = undoItems[i].image;
        // don't initiate a connection just to fetch a favicon (see bug 467828)
        if (/^https?:/.test(iconURL))
          iconURL = "moz-anno:favicon:" + iconURL;
        m.setAttribute("image", iconURL);
      }
      m.setAttribute("class", "menuitem-iconic bookmark-item menuitem-with-favicon");
      m.setAttribute("value", i);
      m.setAttribute("oncommand", "undoCloseTab(" + i + ");");

      // Set the targetURI attribute so it will be shown in tooltip and trigger
      // onLinkHovered. SessionStore uses one-based indexes, so we need to
      // normalize them.
      let tabData = undoItems[i].state;
      let activeIndex = (tabData.index || tabData.entries.length) - 1;
      if (activeIndex >= 0 && tabData.entries[activeIndex])
        m.setAttribute("targetURI", tabData.entries[activeIndex].url);

      m.addEventListener("click", this._undoCloseMiddleClick, false);
      if (i == 0)
        m.setAttribute("key", "key_undoCloseTab");
      undoPopup.appendChild(m);
    }

    // "Restore All Tabs"
    var strings = gNavigatorBundle;
    undoPopup.appendChild(document.createElement("menuseparator"));
    m = undoPopup.appendChild(document.createElement("menuitem"));
    m.id = "menu_restoreAllTabs";
    m.setAttribute("label", strings.getString("menuRestoreAllTabs.label"));
    m.addEventListener("command", function() {
      for (var i = 0; i < undoItems.length; i++)
        undoCloseTab();
    }, false);
  },

  /**
   * Populate when the history menu is opened
   */
  _onPopupShowing: function HM__onPopupShowing(aEvent) {
    PlacesMenu.prototype._onPopupShowing.apply(this, arguments);

    // Don't handle events for submenus.
    if (aEvent.target != aEvent.currentTarget)
      return;

    this.toggleRecentlyClosedTabs();
  },

};