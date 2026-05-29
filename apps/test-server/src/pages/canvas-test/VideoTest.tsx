import React, { useEffect, useRef } from 'react'

const VideoTest = () => {
  return (
    <div>
      <video controls width="250" autoPlay>
        <source src="/videos/flower.webm" type="video/webm" />
        Download the
        <a href="/videos/flower.webm">WEBM</a>
        video.
      </video>
    </div>
  )
}

export default VideoTest
