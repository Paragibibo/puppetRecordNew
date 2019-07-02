<template>
  <div id="puppeteer-recorder" class="recorder">
    <div class="header">
      <a href="#" @click="goHome">
        DranZer <span class="text-muted"><small>0.0.1</small></span>
      </a>
      <div class="left">
        <div class="recording-badge" v-show="isRecording">
          <span class="red-dot"></span>
          {{recordingBadgeText}}
        </div>
        <a href="#" @click="toggleShowHelp" class="header-button">
          <img src="/images/help.svg" alt="help" width="18px">
        </a>
        <a href="#" @click="openOptions" class="header-button">
          <img src="/images/settings.svg" alt="settings" width="18px">
        </a>
      </div>
    </div>
    <div class="main">
      <div class="tabs" v-show="!showHelp">
        <RecordingTab :code="code" :is-recording="isRecording" :live-events="liveEvents" :reset="reset" v-show="!showResultsTab"/>
        <div class="recording-footer" v-show="!showResultsTab">
          <button class="btn btn-sm" @click="toggleRecord" :class="isRecording ? 'btn-danger' : 'btn-primary'">
            {{recordButtonText}}
          </button>
          <div id = "NameofFile" class="col-lg-12" style="background:#eff9c7;">
          <input type="text" id="NameFile" v-show="toggle"  v-model="NameFiletext" class="form-control pull-right" style="width:88%;height:25px;margin-top:0px;" placeholder="Enter TestName"  />
          </div>
          <div id ="DescofFile"  style="background:#eff9c7;">
          <input type="text" id="Desc Name" v-show="toggle"  v-model="DescNametext" class="form-control pull-right" style="width:100%;height:25px;margin-top:0px;" placeholder="Enter Test Desc"  />
          </div>
          <button class="btn btn-sm btn-primary"  @click="resetrecord"  v-show="isRecording">
            Reset
          </button>
          <button class="btn btn-sm btn-primary btn-outline-primary" @click="togglePause" v-show="isRecording">
            {{pauseButtonText}}
          </button>
          <a href="#" @click="showResultsTab = true" v-show="code">view code</a>
        </div>
        <ResultsTab :code="code" :copy-link-text="copyLinkText" :restart="restart" :set-copying="setCopying" v-show="showResultsTab"/>
        <div class="results-footer" v-show="showResultsTab">
          <button class="btn btn-sm btn-primary" @click="restart" v-show="code">Restart</button>
          <a href="#" v-clipboard:copy='code' @click="setCopying" v-show="code">{{copyLinkText}}</a>
        </div>
      </div>
      <HelpTab v-show="showHelp"></HelpTab>
    </div>
  </div>
</template>

<script>

  import { version } from '../../../package.json'
  import CodeGenerator from '../../code-generator/CodeGenerator'
  import RecordingTab from './RecordingTab.vue'
  import ResultsTab from './ResultsTab.vue'
  import HelpTab from './HelpTab.vue'

export default {
    name: 'App',
    components: { ResultsTab, RecordingTab, HelpTab },
    data () {
      return {
        code: '',
        showResultsTab: false,
        showHelp: false,
        toggle : true,
        NameFiletext:null,
        DescNametext:null,
        liveEvents: [],
        recording: [],
        isRecording: false,
        isPaused: false,
        isCopying: false,
        bus: null,
        version
      }
    },
    mounted () {
      this.loadState(() => {
        if (this.isRecording) {
          console.log(this.liveEvents, " live events");
          this.toggle = false
          console.log(this.NameFiletext,"testnameinloadState");
          console.log(this.DescNametext,"testnameinloadState");
          console.debug('opened in recording state, fetching recording events')
          this.$chrome.storage.local.get(['recording', 'code'], ({ recording }) => {
            console.debug('loaded recording', recording)
            this.liveEvents = recording
          })
        }

        if (!this.isRecording && this.code) {
          this.showResultsTab = true
        }
      })
      this.bus = this.$chrome.extension.connect({ name: 'recordControls' })
    },
    methods: {
      toggleRecord () {
        console.log(this.NameFiletext,"testname1");
        console.log(this.DescNametext,"testname1");

        if (this.isRecording) {
          
          this.stop()
        } else {
          this.start()
        }
        console.log(this.NameFiletext,"testname2");
         console.log(this.DescNametext,"testname2");
        this.isRecording = !this.isRecording
        
        this.storeState()
        this.toggle = false
      },
      resetrecord()
      {
        
        this.isRecording= false;
        console.log(this.isRecording,"why sssssssssssssssssssssssssssssss");
        if(!this.isRecording)
        {
          console.log('called');
          this.reset();
        }
        this.storeState()
      },
      togglePause () {
        if (this.isPaused) {
          this.bus.postMessage({ action: 'unpause' })
          this.isPaused = false
        } else {
          this.bus.postMessage({ action: 'pause' })
          this.isPaused = true
        }
        this.storeState()
      },
      start () {
        this.cleanUp()
        console.debug('start recorder')
        this.bus.postMessage({ action: 'start' })
      },
      stop () {
        console.log(this.NameFiletext, "testNameatstop");
        console.log(this.DescNametext, "testNameatstop");


        console.debug('stop recorder')
        this.bus.postMessage({ action: 'stop', NameFiletext:this.NameFiletext, DescNametext:this.DescNametext })

        this.$chrome.storage.local.get(['recording', 'options'], ({ recording, options }) => {
          console.debug('loaded recording', recording)
          console.debug('loaded options', options)

          this.recording = recording
          console.log(recording,"dsdsdsdsdsd");
          const codeOptions = options ? options.code : {}

          const codeGen = new CodeGenerator(codeOptions)
          console.log(this.recording, 'recordingggggg');

          this.code = codeGen.generate(this.recording)
          console.log(this.code, 'codeee');
          
          this.showResultsTab = true
          this.storeState()
        })
      },
      restart () {
        this.NameFiletext=null;
        this.DescNametext=null;
        console.log(this.NameFiletext,"NameFileTextat REstart");
        console.log(this.DescNametext,"NameFileTextat REstart");

        console.log('restart')
        this.cleanUp()
        this.bus.postMessage({ action: 'cleanUp' })
      },
        reset () {
        this.NameFiletext=null;
        this.DescNametext=null;
        this.code = null;
        console.log(this.NameFiletext,"NameFileTextat REstart");
        console.log(this.DescNametext,"NameFileTextat REstart");
        this.cleanUp()
        this.storeState()
        console.log('resetiscalledddddddddddddddddddd')
        this.bus.postMessage({ action: 'cleanUpAtReset' })
      },
      cleanUp () {
        this.recording = this.liveEvents = []
        this.code = ''
        // console.log('calledCleanupatreset');
        this.toggle = true
        this.showResultsTab = this.isRecording = this.isPaused = false
        this.storeState()
      },
      openOptions () {
        if (this.$chrome.runtime.openOptionsPage) {
          this.$chrome.runtime.openOptionsPage()
        }
      },
      loadState (cb) {
        this.$chrome.storage.local.get(['controls', 'code'], ({ controls, code }) => {
          console.debug('loaded controls', controls)
          if (controls) {
            this.isRecording = controls.isRecording
            this.isPaused = controls.isPaused
            this.NameFiletext=controls.NameFiletext
            this.DescNametext=controls.DescNametext
          }

          if (code) {
            this.code = code
          }
          cb()
        })
      },
      storeState () {
        console.log(this.code, "code.......")
        console.log(this.isRecording,"recording state");
        console.log(this.NameFiletext,"namefiletext");
        this.$chrome.storage.local.set({
          code: this.code,
          controls: {
            isRecording: this.isRecording,
            isPaused: this.isPaused,
            NameFiletext:this.NameFiletext,
            DescNametext:this.DescNametext
          }
        })
      },
      setCopying () {
        this.isCopying = true
        setTimeout(() => { this.isCopying = false }, 1500)
      },
      goHome () {
        this.showResultsTab = false
        this.showHelp = false
      },
      toggleShowHelp () {
        this.showHelp = !this.showHelp
      }
    },
    computed: {
      recordingBadgeText () {
        return this.isPaused ? 'paused' : 'recording'
      },
      recordButtonText () {
        return this.isRecording ? 'Stop' : 'Record'
      },
      pauseButtonText () {
        return this.isPaused ? 'Resume' : 'Pause'
      },
      copyLinkText () {
        return this.isCopying ? 'copied!' : 'copy to clipboard'
      }
    }
}
</script>

<style lang="scss" scoped>
  @import "~styles/_animations.scss";
  @import "~styles/_variables.scss";
  @import "~styles/_mixins.scss";


  #NameofFile {

    margin-left: 5px;

}


  .recorder {
    font-size: 14px;

    .header {
      @include header();

      a {
        color: $gray-dark;
      }

      .left {
        margin-left: auto;
        display: flex;
        justify-content: flex-start;
        align-items: center;

        .recording-badge {
          color: $brand-danger;
          .red-dot {
            height: 9px;
            width: 9px;
            background-color: $brand-danger;
            border-radius: 50%;
            display: inline-block;
            margin-right: .4rem;
            vertical-align: middle;
            position: relative;
          }
        }

        .header-button {
          margin-left: $spacer;
          img {
            vertical-align: middle;
          }
        }
      }
    }

    .recording-footer {
      @include footer()
    }
    .results-footer {
      @include footer()
    }
  }
</style>
