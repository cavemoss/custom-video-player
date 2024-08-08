document.addEventListener('DOMContentLoaded', function() {

    const VIDEO_PlEYER = document.querySelector('.video-player')

    const VIDEO = document.getElementById('video')
    const PROGRESS_BAR = document.getElementById('progress-bar')
    const PROGRESS_LINE = document.getElementById('progress-line')

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

    // STATE CONTROL

    let videoWidth = '800px'

    let timestamps = [
        { time: 0, label: 'Introduction' },
        { time: 12, label: 'Introduction' },
        { time: 24, label: 'Part 1' },
        { time: 36, label: 'Part 2' },
        { time: 60, label: 'Part 2' },
    ]

    let loopOverlayState = { opened: false }
    let loopBorders = { start: 0, end: VIDEO.duration }

    for (let i = 0; i < timestamps.length; i++) {
        const div = document.createElement('div')
        div.style.flex = (timestamps[i+1]?.time ?? VIDEO.duration) - timestamps[i].time
        TIME_STAMPS.appendChild(div)

        const btn = document.createElement('button')
        btn.textContent = timestamps[i].label
        btn.addEventListener('click', () => VIDEO.currentTime = timestamps[i].time)
        TIME_STAMP_BTN.appendChild(btn)
    }

    VIDEO_PlEYER.style.setProperty('--width', videoWidth)
    LOOP_BORDERS.style.marginLeft = convertSecondsToMargin(loopBorders.start) + 'px'
    LOOP_BORDERS.style.marginRight = LOOP_OVERLAY.clientWidth - convertSecondsToMargin(loopBorders.end) + 'px'
    

    // MAIN CONTROLS

    MODE_SWITCH.addEventListener('click', function() {
        loopOverlayState.opened = !loopOverlayState.opened
        if (loopOverlayState.opened) LOOP_OVERLAY.style.display = 'block'
        else LOOP_OVERLAY.style.display = 'none'
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
            if (currentTime < loopBorders.start) {
                VIDEO.currentTime = loopBorders.start
            } else if (currentTime > loopBorders.end) {
                VIDEO.currentTime = loopBorders.start
            }
        }
    })

    PROGRESS_BAR.addEventListener('input', function() {
        const duration = VIDEO.duration
        const newTime = (PROGRESS_BAR.value / 100) * duration
        VIDEO.currentTime = newTime
    })

    // FUNCTIONS

    function formatTime(seconds) {
        const min = Math.floor(seconds / 60)
        const sec = Math.floor(seconds % 60)
        return `${min}:${sec < 10 ? '0' : ''}${sec}`
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

    const min = (value, min) => value > min ? value : min

    // LOOP CONTROLLER

    let isDragging = { start: false, end: false }
    let startX = { start: null, end: null }
    let offsetX =  { start: null, end: null }

    LOOP_CONTROL_LEFT.addEventListener('mousedown', (event) => {
        isDragging.start = true
        startX.start = event.clientX
        offsetX.start = LOOP_CONTROL_LEFT.offsetLeft
        LOOP_CONTROL_LEFT.style.cursor = 'grabbing'
    })

    LOOP_CONTROL_RIGHT.addEventListener('mousedown', (event) => {
        isDragging.end = true
        startX.end = event.clientX
        offsetX.end = LOOP_CONTROL_RIGHT.offsetLeft
        LOOP_CONTROL_RIGHT.style.cursor = 'grabbing'
    })

    document.addEventListener('mousemove', (event) => {

        if (isDragging.start) {
            const dx = event.clientX - startX.start
            LOOP_BORDERS.style.marginLeft = min(offsetX.start + dx, 0) + 'px'
            loopBorders.start = convertMarginToSeconds(LOOP_BORDERS.style.marginLeft)
        }

        if (isDragging.end) {
            const dx = event.clientX - startX.end
            LOOP_BORDERS.style.marginRight = min(LOOP_OVERLAY.clientWidth - (offsetX.end + dx), 0) + 'px'
            loopBorders.end = convertMarginToSeconds(LOOP_BORDERS.style.marginRight, true)
        }
    })

    document.addEventListener('mouseup', () => {
        isDragging.start = false
        isDragging.end = false
        LOOP_CONTROL_LEFT.style.cursor = 'grab'
        LOOP_CONTROL_RIGHT.style.cursor = 'grab'
    })

    document.addEventListener('mouseleave', () => {
        isDragging.start = false
        LOOP_CONTROL_LEFT.style.cursor = 'grab'
        LOOP_CONTROL_RIGHT.style.cursor = 'grab'
    })

})