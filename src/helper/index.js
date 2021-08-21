import { DEFAULT_HEIGHT_SCREEN } from "../consts"

const pendingFuncIns = {}

export const pendingFunc = (name, func, time = 1000) => {
    if (pendingFuncIns[name]) {
        clearTimeout(pendingFuncIns[name])
    }
    pendingFuncIns[name] = setTimeout(() => {
        func()
    }, time)
}

export const createCanvas = (video, canvas) => {
    const ratioScale = 400 / video.videoWidth
    const width = video.videoWidth * ratioScale
    canvas.width = width
    canvas.height = DEFAULT_HEIGHT_SCREEN
    return canvas
}

export const captureVideo = (video, canvas) => {
    function loop() {
        if (video.paused || video.ended) {
            return
        }
        canvas
            .getContext('2d')
            .drawImage(video, 0, 0, canvas.width, canvas.height)

        setTimeout(loop, 1000 / 30); // drawing at 30fps
    }
    loop()
}

export const loadImageToCanva = async (httpUrl = []) => {
    return await Promise.all(httpUrl.map((item, key) => {
        return new Promise((resolve, reject) => {
            try {
                let url = item

                const video = document.createElement('video')
                video.onloadedmetadata = async () => {
                    const result = {
                        video,
                        currentTime: 0,
                        duration: video.duration,
                        key
                    }
                    return resolve(result)
                }
                // video.setAttribute('crossorigin', 'anonymous')
                video.controls = true
                video.autoplay = false
                video.muted = false
                video.src = url
                video.load()
            } catch (error) {
                reject(error)
            }
        })
    }))

}

export const getPivotVideo = (time = 0, listVideo) => {
    let pivot = 0
    let durations = 0
    for (let i = 0; i < listVideo.length; i++) {
        durations += listVideo[i].duration
        if (durations >= time) {
            pivot = i
            break
        }
    }

    return { pivot, maxTime: durations }
}