document.addEventListener('DOMContentLoaded', function() {

    // ELEMENTS

    const VIDEO_PlEYER = document.querySelector('.video-player')
    const ALL_CONTROLS = document.querySelector('.flex-col')

    const VIDEO = document.getElementById('video')
    const TIME_STAMP_DISPLAY = document.getElementById('time-stamp-display')
    const PROGRESS_BAR = document.getElementById('progress-bar')
    const PROGRESS_LINE = document.getElementById('progress-line')

    const SPEED_CONTROL = document.getElementById('speed-control')
    const SPEED_DISPLAY = document.getElementById('speed-display')

    const CURRENT_TIME = document.getElementById('current')
    const DURATION = document.getElementById('duration')

    const PLAY_BTN = document.getElementById('play-btn')
    const PREV_BTN = document.getElementById('prev')
    const NEXT_BTN = document.getElementById('next')

    const TIME_STAMPS = document.getElementById('time-stamps')
    const TIME_STAMP_BTN = document.getElementById('time-stamp-btn')

    const LOOP_OVERLAY = document.getElementById('loop-overlay')
    const LOOP_BORDERS = document.getElementById('loop-borders')
    const LOOP_CONTROL_LEFT = document.getElementById('loop-control-left')
    const LOOP_CONTROL_RIGHT = document.getElementById('loop-control-right')

    const MODE_SWITCH = document.getElementById('mode-switch')
    const FULLSCREEN = document.getElementById('fullscreen')

    
    // FUNCTIONS

    function formatTime(seconds) {
        const min = Math.floor(seconds / 60)
        const sec = Math.floor(seconds % 60)
        return `${min}:${sec < 10 ? '0' : ''}${sec}`
    }

    function resetLoop() {
        LOOP_OVERLAY.style.visibility = 'hidden'
        LOOP_BORDERS.style.marginLeft = '0px'
        LOOP_BORDERS.style.marginRight = '0px'
        loopOverlayState.opened = false
        loopBorders.start = 0
        loopBorders.end = VIDEO.duration
    }

    function convertSecondsToMargin(sec) {
        const pxPerSec = LOOP_OVERLAY.clientWidth / VIDEO.duration
        return sec * pxPerSec
    }
    
    function convertMarginToSeconds(px, right = false) {
        const secPerPx = VIDEO.duration / LOOP_OVERLAY.clientWidth
        let pxNum = Number(px.slice(0, px.indexOf('px')))
        if (right) pxNum = LOOP_OVERLAY.clientWidth - pxNum
        return pxNum * secPerPx
    }

    let fadeOut

    function fadeTimeout() {  
        if (fadeOut) clearTimeout(fadeOut)
        ALL_CONTROLS.style.opacity = 1 
        fadeOut = setTimeout(function() { ALL_CONTROLS.style.opacity = 0 }, 1000)
    }

    const limit = (value, max) => value >= 0 ? value <= max ? value : max : 0


    // STATE CONTROL

    const url = new URL(window.location.href)
    const params = new URLSearchParams(url.search)

    const source = document.createElement('source')
    source.src = decodeURIComponent(params.get('source'))
    source.type = 'video/mp4'
    VIDEO.appendChild(source)
    
    let timestamps = [ { time: 0, label: 'Начало' } ]
    params.forEach((value, key) => {
        if (key !== 'source') timestamps.push({ time: Number(value), label: key })
    })

    let videoWidth = '800px'
    VIDEO_PlEYER.style.setProperty('--width', videoWidth)

    let loopOverlayState = { opened: false }
    let loopBorders = { start: null, end: null }

    VIDEO.addEventListener('loadeddata', function() {

        loopBorders.start = 0
        loopBorders.end = VIDEO.duration

        ALL_CONTROLS.addEventListener('mousemove', fadeTimeout)
        
        for (let i = 0; i < timestamps.length; i++) {

            const div = document.createElement('div')
            div.style.flex = (timestamps[i+1]?.time ?? VIDEO.duration) - timestamps[i].time
            TIME_STAMPS.appendChild(div)
    
            const btn = document.createElement('button')
            btn.textContent = timestamps[i].label
            btn.addEventListener('click', () => VIDEO.currentTime = timestamps[i].time)
            TIME_STAMP_BTN.appendChild(btn)
        }
    })

    VIDEO.oncanplay = function() {
        PROGRESS_BAR.style.opacity = 0
        VIDEO_PlEYER.style.visibility = 'visible'
    }
    

    // MAIN CONTROLS

    MODE_SWITCH.addEventListener('click', function() {
        loopOverlayState.opened = !loopOverlayState.opened
        if (loopOverlayState.opened) LOOP_OVERLAY.style.visibility = 'visible'
        else LOOP_OVERLAY.style.visibility = 'hidden'
    })

    PLAY_BTN.addEventListener('click', function() {
        if (VIDEO.paused || VIDEO.ended) VIDEO.play()
        else VIDEO.pause()
    })

    PREV_BTN.addEventListener('click', function() {
        for (let i = 0; i < timestamps.length; i++) {
            let prevTimeStamp = timestamps[i-1]?.time ?? 0
            let nextTimeStamp = timestamps[i+1]?.time ?? VIDEO.duration
            let thisTimeStamp = timestamps[i].time
            let lastTimeStamp = timestamps[timestamps.length - 1].time
            if (VIDEO.currentTime >= thisTimeStamp && VIDEO.currentTime < nextTimeStamp) { VIDEO.currentTime = prevTimeStamp; break }
            else if (VIDEO.currentTime == VIDEO.duration) { VIDEO.currentTime = lastTimeStamp; break }
        }
    })

    NEXT_BTN.addEventListener('click', function() {
        for (let i = 0; i < timestamps.length; i++) {
            let nextTimeStamp = timestamps[i+1]?.time ?? VIDEO.duration
            let thisTimeStamp = timestamps[i].time
            if (VIDEO.currentTime >= thisTimeStamp && VIDEO.currentTime < nextTimeStamp) { VIDEO.currentTime = nextTimeStamp; break }
        }
    })

    FULLSCREEN.addEventListener('click', function() {
        if (!document.fullscreenElement) VIDEO_PlEYER.requestFullscreen()
        else document.exitFullscreen()
    })

    document.addEventListener('fullscreenchange', function() {
        if (document.fullscreenElement) VIDEO_PlEYER.style.setProperty('--width', '100%')
        else VIDEO_PlEYER.style.setProperty('--width', videoWidth)    
        resetLoop()
    })

    SPEED_CONTROL.addEventListener('input', function() {
        VIDEO.playbackRate = SPEED_CONTROL.value
        SPEED_DISPLAY.innerText = VIDEO.playbackRate
    })


    // SEEK FUNCTIONALITY

    VIDEO.addEventListener('timeupdate', function() {
        const currentTime = VIDEO.currentTime
        const duration = VIDEO.duration
        const progress = (currentTime / duration) * 100

        PROGRESS_BAR.value = progress
        PROGRESS_LINE.style.width = progress + '%'

        CURRENT_TIME.textContent = formatTime(currentTime)
        DURATION.textContent = formatTime(duration)

        if(loopOverlayState.opened) {
            if (currentTime < loopBorders.start) VIDEO.currentTime = loopBorders.start + 0.01
            else if (currentTime > loopBorders.end) VIDEO.currentTime = loopBorders.start + 0.01
        }

        for (let i = 0; i < timestamps.length; i++) {
            let nextTimestamp = timestamps[i+1]?.time ?? VIDEO.duration
            if (VIDEO.currentTime >= timestamps[i].time && VIDEO.currentTime < nextTimestamp) {
                TIME_STAMP_DISPLAY.innerText = timestamps[i].label; break
            } 
        }
    })

    PROGRESS_BAR.addEventListener('input', function() {
        const duration = VIDEO.duration
        const newTime = (PROGRESS_BAR.value / 100) * duration
        VIDEO.currentTime = newTime
    })

    
    // LOOP CONTROLLER

    let isDragging = { start: false, end: false }
    let startX = { start: null, end: null }
    let offsetX =  { start: null, end: null }

    LOOP_CONTROL_LEFT.addEventListener('mousedown', function(event) {
        isDragging.start = true
        startX.start = event.clientX
        offsetX.start = LOOP_CONTROL_LEFT.offsetLeft
        LOOP_CONTROL_LEFT.style.cursor = 'grabbing'
    })

    LOOP_CONTROL_RIGHT.addEventListener('mousedown', function(event) {
        isDragging.end = true
        startX.end = event.clientX
        offsetX.end = LOOP_CONTROL_RIGHT.offsetLeft
        LOOP_CONTROL_RIGHT.style.cursor = 'grabbing'
    })

    document.addEventListener('mousemove', function(event) {

        if (isDragging.start) {
            const dx = event.clientX - startX.start
            const margin = offsetX.start + dx
            const max = convertSecondsToMargin(loopBorders.end)

            LOOP_BORDERS.style.marginLeft = limit(margin, max) + 'px'
            loopBorders.start = convertMarginToSeconds(LOOP_BORDERS.style.marginLeft)
        }

        if (isDragging.end) {
            const dx = event.clientX - startX.end
            const margin = LOOP_OVERLAY.clientWidth - (offsetX.end + dx)
            const max = LOOP_OVERLAY.clientWidth - convertSecondsToMargin(loopBorders.start)
            
            LOOP_BORDERS.style.marginRight = limit(margin, max) + 'px'
            loopBorders.end = convertMarginToSeconds(LOOP_BORDERS.style.marginRight, true)
        }
    })

    document.addEventListener('mouseup', function() {
        isDragging.start = false
        isDragging.end = false
        LOOP_CONTROL_LEFT.style.cursor = 'grab'
        LOOP_CONTROL_RIGHT.style.cursor = 'grab'
    })

})