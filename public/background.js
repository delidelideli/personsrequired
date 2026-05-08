if (chrome.sidePanel) {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch(console.error)
} else {
  chrome.action.onClicked.addListener(() => {
    chrome.windows.create({
      url:     chrome.runtime.getURL('sidepanel.html'),
      type:    'popup',
      width:   420,
      height:  900,
      focused: true,
    })
  })
}
