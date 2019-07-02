import pptrActions from '../code-generator/pptr-actions' 
import CodeGenerator from '../code-generator/CodeGenerator'

class RecordingController {
  constructor () {
    this._recording = []
     this._boundedMessageHandler = null
    this._boundedNavigationHandler = null
    this._boundedRecordApi= null
    this._boundedWaitHandler = null
    this._badgeState = ''
    this._isPaused = false
    this.url_data =[];


    // Some events are sent double on page navigations to simplify the event recorder.
    // We keep some simple state to disregard events if needed.
    this._hasGoto = false
    this._hasViewPort = false
    
  }

  
  boot () {
    chrome.extension.onConnect.addListener(port => {
      console.debug('listeners connected')
      port.onMessage.addListener(msg => {
        if (msg.action && msg.action === 'start') this.start()
        if (msg.action && msg.action === 'stop')
        {
           this.FileName = msg.NameFiletext;
           this.DescName= msg.DescNametext;
          console.log(msg.NameFiletext, " file textname");
          console.log(msg.DescNametext, " file textname");
          this.stop(this.FileName,this.DescName);
        } 
        if (msg.action && msg.action === 'cleanUp') this.cleanUp()
        
        // if (msg.action && msg.action === 'cleanUpatReset') this.cleanUp()
        if (msg.action && msg.action === 'pause') this.pause()
        if (msg.action && msg.action === 'unpause') this.unPause()
      })
    })
  }

  start () {

    
    console.debug('start recording')
    this.cleanUp(() => {
      this._badgeState = 'rec'

      this._hasGoto = false
      this._hasViewPort = false

      this.injectScript()
      

      this._boundedMessageHandler = this.handleMessage.bind(this)

      this._boundedNavigationHandler = this.handleNavigation.bind(this)
      this._boundedRecordApi = this.handleRecordApi.bind(this);
      // this._boundedWaitHandler = this.handleWait.bind(this)

      chrome.runtime.onMessage.addListener(this._boundedMessageHandler)
      // chrome.webNavigation.onCompleted.addListener(this._boundedNavigationHandler)
      chrome.webNavigation.onBeforeNavigate.addListener(this._boundedNavigationHandler)
      chrome.webRequest.onCompleted.addListener(this._boundedRecordApi, 
        {
            urls: ["https://*.goibibo.com/*"],
            types: ["xmlhttprequest"]
            
        },
        ["responseHeaders"]);
      // this.recordApi();

      chrome.browserAction.setIcon({ path: './images/icon-green.png' })
      chrome.browserAction.setBadgeText({ text: this._badgeState })
      chrome.browserAction.setBadgeBackgroundColor({ color: '#FF0000' })
    })
  }

  stop () {
     console.log(this.FileName, "fileeeeeeeeeetextName");
    let filename = this.FileName;
    let descname = this.DescName;
    console.debug('stop recording')

    this._badgeState = this._recording.length > 0 ? '1' : ''

    chrome.runtime.onMessage.removeListener(this._boundedMessageHandler)
    // chrome.webNavigation.onCompleted.removeListener(this._boundedNavigationHandler)
    chrome.webNavigation.onBeforeNavigate.removeListener(this._boundedNavigationHandler)
    chrome.webRequest.onCompleted.removeListener(this._boundedRecordApi, 
      {
          urls: ["https://*.goibibo.com/*"],
          types: ["xmlhttprequest"]
          
      },
      ["responseHeaders"]);

    chrome.browserAction.setIcon({ path: './images/icon-black.png' })
    chrome.browserAction.setBadgeText({text: this._badgeState})
    chrome.browserAction.setBadgeBackgroundColor({color: '#45C8F1'})
    const codeGen = new CodeGenerator()
    this.code = codeGen.generate(this._recording)
    console.log(this._recording, 'recordiingggg');
    // send xhr requests with script and events array
    var xj = new XMLHttpRequest();
    xj.open("POST", "http://localhost:3000/log", true);
    xj.setRequestHeader("Content-Type", "application/json");
    xj.send(JSON.stringify({ 
      event: this._recording,
      script: this.code,
      filename:filename,
      descname:descname
    }));
    xj.onreadystatechange = function () { 
      if (xj.readyState == 4) { 
      
        console.log(xj.responseText); } }
   
    

    chrome.storage.local.set({ recording: this._recording }, () => {
      console.debug('recording stored')
    })

    // refreshing the extension after every iteration // bug need to solve.

  }

  pause () {
    console.debug('pause')
    this._badgeState = '❚❚'
    chrome.browserAction.setBadgeText({ text: this._badgeState })
    this._isPaused = true
  }

  unPause () {
    console.debug('unpause')
    this._badgeState = 'rec'
    chrome.browserAction.setBadgeText({ text: this._badgeState })
    this._isPaused = false
  }

  cleanUp (cb) {
    console.debug('cleanup')
    this._recording = []
    chrome.browserAction.setBadgeText({ text: '' })
    chrome.storage.local.remove('recording', () => {
      console.debug('stored recording cleared')
      if (cb) cb()
    })
  }

  
  recordCurrentUrl (href) {
    if (!this._hasGoto) {
      console.debug('recording goto* for:', href)
      this.handleMessage({selector: undefined, value: undefined, action: pptrActions.GOTO, href})
      this._hasGoto = true
    }
  }

  recordCurrentViewportSize (value) {
    if (!this._hasViewPort) {
      
      this._hasViewPort = true
    }
  }

  recordNavigation () {
    console.log('called')
    this.handleMessage({ selector: undefined, value: undefined, action: pptrActions.NAVIGATION })
  }

//   recordApi(){
//     chrome.webRequest.onCompleted.addListener(
//       function (details)  {
//          console.log(details.url,'urlscccccccccccccccccccccccccc');

      
//         this.handleMessage({ selector: details.url.split('?')[0], value: undefined, action: pptrActions.RECORD_API })
//           }, 
//       {
//           urls: ["https://*.goibibo.com/*"],
//           types: ["xmlhttprequest"]
          
//       },
//       ["responseHeaders"])
    
    
// }

  handleMessage (msg, sender) {
    if (msg.control) return this.handleControlMessage(msg, sender)

    // to account for clicks etc. we need to record the frameId and url to later target the frame in playback
    msg.frameId = sender ? sender.frameId : null
    msg.frameUrl = sender ? sender.url : null

    if (!this._isPaused) {
      this._recording.push(msg)
      chrome.storage.local.set({ recording: this._recording }, () => {
        console.debug('stored recording updated')
      })
    }
  }

  handleControlMessage (msg, sender) {
    if (msg.control === 'event-recorder-started') chrome.browserAction.setBadgeText({ text: this._badgeState })
    if (msg.control === 'get-viewport-size') this.recordCurrentViewportSize(msg.coordinates)
    if (msg.control === 'get-current-url') this.recordCurrentUrl(msg.href)
    // if(msg.control === 'record-api') this.recordApi();
  }

  handleNavigation ({ frameId }) {

    console.log('called22222' )

    console.debug('frameId is:', frameId)
    console.log('navigation');
    this.injectScript()
    if(frameId ===0)
    {
      console.log('called11111111' )
      this.recordNavigation()
    }
  }

  handleRecordApi ( details) {
    console.log(details.url, "api reocrdedededdd");
    
    this.handleMessage({ selector: details.url.split('?')[0], value: undefined, action: pptrActions.RECORD_API })
       
    
 }

  handleWait () {
    chrome.browserAction.setBadgeText({ text: 'wait' })
  }

  injectScript () {
    chrome.tabs.executeScript({ file: 'content-script.js', allFrames: true })
  }
}

console.debug('booting recording controller')
window.recordingController = new RecordingController()
window.recordingController.boot()
