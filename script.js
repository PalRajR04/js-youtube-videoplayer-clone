const videoContainer = document.querySelector('.video-container');
const video = document.querySelector('video');
const playPauseBtn = document.querySelector('.play-pause-btn');
const playbackAnimation = document.querySelector('.playback-animation');
const volumeBtn = document.querySelector('.volume-btn');
const volume = document.querySelector('.volume-slider');
const elapsedTime = document.querySelector('.current-time');
const duration = document.querySelector('.total-time');
const timelineContainer = document.querySelector('.timeline-container');
const thumbnailImg = document.querySelector('.thumbnail-img');
const previewTimeTooltip = document.querySelector('.preview-time-tooltip');
const captionsBtn = document.querySelector('.captions-btn')
const playbackSpeedBtn = document.querySelector('.playback-speed-btn');
const miniplayerBtn = document.querySelector('.miniplayer-btn');
const theaterBtn = document.querySelector('.theater-btn');
const fullscreenBtn = document.querySelector('.fullscreen-btn');


// handle video play and pause

function togglePlay () {
    video.paused ? video.play() : video.pause();
}

playPauseBtn.addEventListener('click', togglePlay);
video.addEventListener('click', togglePlay);

function updateState () {
    videoContainer.classList.toggle('paused');

    if (video.paused) {
        playPauseBtn.setAttribute('data-title', 'Play (k)');
    } else {
        playPauseBtn.setAttribute('data-title', 'Pause (k)');
    }
}

video.addEventListener('play', updateState);
video.addEventListener('pause', updateState);

//handle playback animation

function handlePlaybackAnimation () {
    playbackAnimation.animate([{
        opacity: 1,
        transform: "scale(1)",
    },{
        opacity: 0,
        transform: "scale(1.3)",
    }], {
        duration: 500
    });
}

video.addEventListener('click', handlePlaybackAnimation);

//update volume and handle volume icons with respect to volume level

function updateVolume () {
    if (video.muted) video.muted = !video.muted;

    video.volume = volume.value;
}

volume.addEventListener('input', updateVolume);

function toggleMute () {
    video.muted = !video.muted;

    if(video.muted) {
        volumeBtn.setAttribute('data-volume', volume.value);
        volume.value = 0;
    } else {
        volume.value = volumeBtn.dataset.volume;
    }
}

volumeBtn.addEventListener('click', toggleMute);

function updateVolumeIcon () {
    if (video.muted || video.volume === 0) {
        videoContainer.setAttribute('data-volume-level', 'mute');
    } else if (video.volume > 0 && video.volume <= 0.5) {
        videoContainer.setAttribute('data-volume-level', 'low');
    } else {
        videoContainer.setAttribute('data-volume-level', 'high');
    }
}

video.addEventListener('volumechange', updateVolumeIcon);

//udpates duartion of video and elasped time

function formatTime (timeInSeconds) {
    const result = new Date(timeInSeconds * 1000).toISOString().substring(11,19);
    return {
        minutes: result.substring(3,5),
        seconds: result.substring(6,8),
    }
}

function updateDuration () {
    const time = formatTime(Math.round(video.duration));
    duration.textContent = `${time.minutes}:${time.seconds}`;
    duration.setAttribute('data-duration', `${time.minutes}m:${time.seconds}s`);
}

video.addEventListener('loadeddata', updateDuration);

function updateElapsedTime () {
    const time = formatTime(Math.round(video.currentTime));
    elapsedTime.textContent = `${time.minutes}:${time.seconds}`;
    elapsedTime.setAttribute('data-elapsedtime', `${time.minutes}m:${time.seconds}s`);
    const percent = video.currentTime / video.duration;
    timelineContainer.style.setProperty('--progress-position', percent);
}

video.addEventListener('timeupdate', updateElapsedTime);

//toggle caption if texttrack added

const captions  = video.textTracks[0]
captions.mode = 'hidden';

function toggleCaptions () {
    const isHidden = captions.mode === 'hidden';
    captions.mode = isHidden ? 'showing' : 'hidden';
    videoContainer.classList.toggle('captions', isHidden);
}

captionsBtn.addEventListener('click', toggleCaptions);

//handle playback speed 

function handlePlaybackSpeed () {
    let newPlaybackSpeed = video.playbackRate + 0.25;
    if (newPlaybackSpeed > 2) newPlaybackSpeed = 0.25;
    video.playbackRate = newPlaybackSpeed;

    playbackSpeedBtn.textContent = `${newPlaybackSpeed}x`
}

playbackSpeedBtn.addEventListener('click', handlePlaybackSpeed);

document.addEventListener('DomContentLoaded', () => {
    if (!('pictureInPictureEnabled' in document)) {
        video.setAttribute('controls');
    }
})

//toggle miniplayer mode

async function togglePictureInPicture () {
    try {
        if (document.pictureInPictureElement == null) {
            miniplayerBtn.disabled = true;
            await video.requestPictureInPicture();
        } else {
            await document.exitPictureInPicture();
        }
    } catch (error) {
        console.error(error);
    } finally {
        miniplayerBtn.disabled = false;
    }
}

miniplayerBtn.addEventListener('click', togglePictureInPicture);

theaterBtn.addEventListener('click', () => {
    videoContainer.classList.toggle('theater');
}) 

//toggle Full screen mode

async function toggleFullscreenMode () {
    try {
        if (document.fullscreenElement == null) {
            await videoContainer.requestFullscreen();
        } else {
            await document.exitFullscreen();
        }
    } catch (error) {
        console.error(error);
    }
}

fullscreenBtn.addEventListener('click',toggleFullscreenMode);
video.addEventListener('dblclick',toggleFullscreenMode);

document.addEventListener('fullscreenchange', () => {
    videoContainer.classList.toggle('full-screen',document.fullscreenElement);
});

//handle scrubbing and timeline events

let isScrubbing = false;
let wasPaused;

function handleScrubbing (event) {
    const rect = timelineContainer.getBoundingClientRect();
    const percent = Math.min(Math.max(0, event.x - rect.x), rect.width) / rect.width;
    isScrubbing = (event.buttons & 1) === 1;
    videoContainer.classList.toggle('scrubbing', isScrubbing);
    if (isScrubbing) {
        wasPaused = video.paused;
        video.pause();
    } else {
        video.currentTime = percent * video.duration;
        if (!wasPaused) {
            video.play();
        }
    }
    handleTimelineUpdate(event);
}

function handleTimelineUpdate (event) {
    const rect = timelineContainer.getBoundingClientRect();
    const percent = Math.min(Math.max(0, event.x - rect.x), rect.width) / rect.width;
    const time = formatTime(percent * video.duration);
    timelineContainer.style.setProperty('--preview-position', percent);
    previewTimeTooltip.textContent = `${time.minutes}:${time.seconds}`;
    if (isScrubbing) {
        event.preventDefault()
        thumbnailImg.src = 'poster.jpg'
        timelineContainer.style.setProperty('--progress-position', percent);
    }
}

timelineContainer.addEventListener('mousemove', handleTimelineUpdate);
timelineContainer.addEventListener('mousedown', handleScrubbing);

document.addEventListener('mousemove', event => {
    if (isScrubbing) handleTimelineUpdate(event);
})

document.addEventListener('mouseup', event => {
    if (isScrubbing) handleScrubbing(event);
})

// skip duration

function skipTo (skipToTime) {
    video.currentTime += skipToTime;
}

// keyboard operations

document.addEventListener('keydown', event => {
    const tagName = document.activeElement.tagName.toLowerCase();
    if (tagName === 'input') return;
    switch (event.key.toLowerCase()) {
        case ' ':
            if (tagName === 'button') return;
        case 'k':
            togglePlay();
            break;
        case 'm':
            toggleMute();
            break;
        case 'c':
            toggleCaptions();
            break;
        case 'i':
            togglePictureInPicture();
            break;
        case 't':
            toggleTheaterMode();
            break;
        case 'f':
            toggleFullscreenMode();
            break;
        case 'arrowleft':
        case 'j':
            skipTo(-5);
            break;
        case 'arrowright':
        case 'l':
            skipTo(5);
            break;
    }
})