ZIP     = zip
OPTION  = -6
# IGNORE  = -x .DS_Store
PACKAGE = undo-list-in-tabmenu.xpi
FILE    = \
  ./content/undolist.js \
  ./content/undolist.xul \
  ./locale/en-US/undolist.dtd \
  chrome.manifest \
  install.rdf


all:  $(PACKAGE)

$(PACKAGE):  $(FILES)
	$(ZIP) $(OPTION) $(PACKAGE) $(FILE)
