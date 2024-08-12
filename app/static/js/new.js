document.addEventListener('DOMContentLoaded', function() {

    const FILE_INPUT = document.querySelector('.use-file input')
    const USE_FILE = document.querySelector('.use-file button')

    const URL_INPUT = document.querySelector('.use-url input')
    const USE_URL = document.querySelector('.use-url button')

    const VIDEO = document.getElementById('video')

    const NEW_TIME_STAMP = document.querySelector('.time-stamp span')
    const NEW_TIME_BTN = document.querySelector('.time-stamp button')
    const NEW_TIME_INPUT = document.querySelector('.time-stamp input')

    const TIME_STAMP_CONTAINER = document.getElementById('time-stamp-container')

    const GENERATE_BTN = document.getElementById('generate-btn')
    const URL_OUTPUT = document.getElementById('url-output')

    function formatTime(seconds) {
        const min = Math.floor(seconds / 60)
        const sec = Math.floor(seconds % 60)
        return `${min}:${sec < 10 ? '0' : ''}${sec}`
    }

    let timestamps = { }

    let uploadType
    URL_INPUT.onchange = function() {
        uploadType = 'url'
        FILE_INPUT.disabled = true
        USE_FILE.disabled = true
    }

    FILE_INPUT.onchange = function() {
        uploadType = 'file'
        URL_INPUT.disabled = true
        USE_URL.disabled = true
    }

    function begin(src) {
        VIDEO.innerHTML = ''
        const source = document.createElement('source')
        source.src = src
        source.type = 'video/mp4'
        VIDEO.appendChild(source)
    }

    USE_FILE.onclick = () => begin(URL.createObjectURL(FILE_INPUT.files[0]))
    USE_URL.onclick = () => begin(URL_INPUT.value)

    VIDEO.addEventListener('timeupdate', function() {
        NEW_TIME_STAMP.textContent = formatTime(VIDEO.currentTime)
    })

    NEW_TIME_BTN.onclick = function() {
        const timeStampLabel = NEW_TIME_INPUT.value
        const timeStamp = Math.floor(VIDEO.currentTime)

        timestamps[timeStampLabel] = timeStamp
        
        const label = document.createElement('b')
        label.textContent = timeStampLabel

        const time = document.createElement('span')
        time.textContent = formatTime(timeStamp)

        const delBtn = document.createElement('button')
        delBtn.textContent = 'Delete'
        delBtn.onclick = () => {
            container.remove()
            delete timestamps[timeStampLabel]
            console.log(timestamps)
        }
        
        const container = document.createElement('div')
        container.appendChild(label)
        container.appendChild(time)
        container.appendChild(delBtn)

        TIME_STAMP_CONTAINER.appendChild(container)
    }

    function useUrl() {
        let originalUrl = URL_INPUT.value
        let videoUrl = `http://localhost:8000/play?source=${encodeURIComponent(originalUrl)}`
        for (let [key, value] of Object.entries(timestamps)) videoUrl += `&${key}=${value}`
        URL_OUTPUT.href = videoUrl
        URL_OUTPUT.innerHTML = videoUrl
    }

    async function useFile() {
        let formData = new FormData()
        formData.append('video', FILE_INPUT.files[0])
        await fetch('http://localhost:8000/upload', { method: 'POST', body: formData })
        let videoUrl = `http://localhost:8000/play?source=/static/media/${FILE_INPUT.files[0].name}`
        for (let [key, value] of Object.entries(timestamps)) videoUrl += `&${key}=${value}`
        URL_OUTPUT.href = videoUrl
        URL_OUTPUT.innerHTML = videoUrl
    }

    GENERATE_BTN.onclick = uploadType === 'url' ? useUrl : useFile
})