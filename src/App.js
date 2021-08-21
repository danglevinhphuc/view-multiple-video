import './App.css';
import React, { useRef, useState, useEffect, useCallback } from 'react'
import { captureVideo, createCanvas, getPivotVideo, loadImageToCanva, pendingFunc } from './helper/index';
import { ID_CANVAS, PERCENT, DEFAULT_VIDEO } from './consts/index';
import { Slider, TextField, Button } from '@material-ui/core'

const App = () => {
  const canvasRef = useRef(null)
  const [listVideo, setListVideo] = useState([])
  const [playerCurrent, setPlayerCurrent] = useState(null)
  const [configVideo, setConfigVideo] = useState({})
  const [valueCurrentTime, setValueCurrentTime] = useState(1)
  const [valueInputAddVideo, setValueInputAddVideo] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadedAllVideo = async (videos) => {
    setLoading(true)
    const listVideoLoaded = await loadImageToCanva(videos)
    const duration = listVideoLoaded.map(item => item.duration).reduce((a, b) => a + b)
    const config = {
      duration
    }
    setLoading(false)
    setConfigVideo(config)
    setListVideo(listVideoLoaded)
  }

  const updateTimeline = useCallback((currentTime, pivot) => {
    let totalTime = 0
    for (let i = 0; i < pivot; i++) {
      totalTime += listVideo[i].duration
    }
    const { duration } = configVideo
    const valueChangedCurrentTime = (Number(currentTime + totalTime) / Number(duration)) * PERCENT

    setValueCurrentTime(valueChangedCurrentTime)
  }, [listVideo, configVideo])

  const playAction = useCallback((player) => {
    if (!listVideo || !listVideo.length) {
      return
    }

    let video = player
    if (!video) {
      video = listVideo[DEFAULT_VIDEO].video
      video.pivot = DEFAULT_VIDEO
    }

    setPlayerCurrent(video)
    video.play()

    const canvas = createCanvas(video, canvasRef.current)
    captureVideo(video, canvas)
  }, [listVideo])

  const pauseAction = useCallback((next = false, player = null, pivotVideoCurrent = 0) => {
    if (!player) return

    pauseVideo(player)
    if (next) {
      const newPivot = pivotVideoCurrent < listVideo.length ? pivotVideoCurrent + 1 : DEFAULT_VIDEO
      if (!listVideo[newPivot]) {
        return
      }

      const { video } = listVideo[newPivot]
      video.currentTime = 0
      video.pivot = newPivot
      playAction(video)
    }
  }, [listVideo, playAction])

  const handleUpdateTime = useCallback(() => {
    if (!playerCurrent) {
      return
    }
    const { pivot } = playerCurrent
    const videoIndex = listVideo[pivot]

    updateTimeline(playerCurrent.currentTime, pivot)

    if (playerCurrent.currentTime >= videoIndex.duration) {
      pauseAction(true, playerCurrent, pivot);
    }
  }, [playerCurrent, listVideo, updateTimeline, pauseAction])

  const pauseVideo = (video) => {
    if (!video) {
      return
    }
    video.pause()
  }

  const onChangeTimeLine = (value = 1) => {
    setValueCurrentTime(value)
    pauseVideo(playerCurrent)
    const { duration } = configVideo
    const valueChangedCurrentTime = (Number(value) * Number(duration)) / PERCENT

    const { pivot, maxTime } = getPivotVideo(valueChangedCurrentTime, listVideo)

    const videoIndex = listVideo[pivot]
    if (!videoIndex) {
      return
    }

    pendingFunc(
      'onChangeTimeLine',
      () => {
        const { video, duration: durationVideo } = videoIndex
        const currentTime = durationVideo - (maxTime - valueChangedCurrentTime)
        video.currentTime = currentTime
        video.pivot = pivot
        playAction(video)
      },
      500,
    )
  }

  const handleAddVideo = () => {
    if (valueInputAddVideo) {
      const arr = valueInputAddVideo.split(',') || []
      if (arr && arr.length) {
        loadedAllVideo(arr)
      }
    }
  }

  useEffect(() => {
    if (playerCurrent && configVideo) {
      playerCurrent.addEventListener('timeupdate', handleUpdateTime)
    }
    return () => {
      if (playerCurrent && configVideo) {
        playerCurrent.removeEventListener('timeupdate', handleUpdateTime)
      }
    }
  }, [playerCurrent, configVideo, handleUpdateTime])

  return (
    <div>
      <div className="form">
        <TextField label="Add link mp4" value={valueInputAddVideo || ''} onChange={e => { setValueInputAddVideo(e.target.value) }} placeholder="link1,link2,link3" />
        <Button color="primary" onClick={() => { handleAddVideo() }}>Done</Button>
      </div>
      <div className="App">
        <div className="wrapper">
          <canvas id={ID_CANVAS} ref={canvasRef}></canvas>
        </div>
        <Button color="primary" disabled={loading} onClick={() => { playAction(playerCurrent) }}>Play</Button>
        <Button color="secondary" disabled={loading} onClick={() => { pauseVideo(playerCurrent) }}>Pause</Button>

        <Slider
          value={valueCurrentTime}
          onChange={(_, value) => {
            onChangeTimeLine(value)
          }}
          defaultValue={1}
        />
      </div>
    </div>
  );
}

export default App;
