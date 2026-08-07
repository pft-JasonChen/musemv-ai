import { useEffect, useRef, useState } from 'react'
import type { RefObject, SyntheticEvent } from 'react'
import type { Song } from '../data/songs'

// Shared playback state for any page that wants an in-place "bottom bar"
// player (SongDetailPage's desktop list, Home's Newly Released Songs, …)
// instead of navigating away to play a song. One <audio> element per page —
// there's no router in this app, so state never needs to survive a real
// navigation; each page that wants a player just calls this hook itself.
export interface SongPlayer {
  activeSong: Song | undefined
  playing: boolean
  currentTime: number
  duration: number
  muted: boolean
  volume: number
  audioRef: RefObject<HTMLAudioElement | null>
  /** True once a song has been picked — drives whether a bar/panel using
   *  this hook should render at all. */
  isOpen: boolean
  /** Starts a song, or toggles play/pause if it's already the active one. */
  play: (songId: string) => void
  togglePlay: () => void
  toggleMute: () => void
  setVolume: (next: number) => void
  /** 0–1 position within the current song. */
  seek: (ratio: number) => void
  goPrev: () => void
  goNext: () => void
  /** Pauses and clears the active song. */
  close: () => void
  /** Spread onto the page's own <audio> element. */
  audioProps: {
    ref: RefObject<HTMLAudioElement | null>
    onPlay: () => void
    onPause: () => void
    onTimeUpdate: (e: SyntheticEvent<HTMLAudioElement>) => void
    onLoadedMetadata: (e: SyntheticEvent<HTMLAudioElement>) => void
    onEnded: () => void
  }
}

export function useSongPlayer(songs: Song[], initialId?: string): SongPlayer {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [activeId, setActiveId] = useState<string | null>(initialId ?? null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)

  const activeSong = songs.find((song) => song.id === activeId)

  // Loads + autoplays whenever the selected song changes — matches every
  // other real <audio>/<video> element in this project (e.g.
  // HeroBannerSection), which all autoplay on change.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !activeSong) return
    audio.src = activeSong.audio
    audio.play()
  }, [activeSong])

  function play(songId: string) {
    if (songId === activeId) {
      togglePlay()
      return
    }
    setActiveId(songId)
  }

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play()
    else audio.pause()
  }

  function toggleMute() {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = !audio.muted
    setMuted(audio.muted)
  }

  function changeVolume(next: number) {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = next
    audio.muted = next === 0
    setVolume(next)
    setMuted(next === 0)
  }

  function seek(ratio: number) {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    audio.currentTime = ratio * audio.duration
  }

  function goPrev() {
    if (!activeId || songs.length === 0) return
    const index = songs.findIndex((song) => song.id === activeId)
    const prevSong = songs[(index - 1 + songs.length) % songs.length]
    setActiveId(prevSong.id)
  }

  function goNext() {
    if (!activeId || songs.length === 0) return
    const index = songs.findIndex((song) => song.id === activeId)
    const nextSong = songs[(index + 1) % songs.length]
    setActiveId(nextSong.id)
  }

  function close() {
    audioRef.current?.pause()
    setActiveId(null)
  }

  return {
    activeSong,
    playing,
    currentTime,
    duration,
    muted,
    volume,
    audioRef,
    isOpen: activeId !== null,
    play,
    togglePlay,
    toggleMute,
    setVolume: changeVolume,
    seek,
    goPrev,
    goNext,
    close,
    audioProps: {
      ref: audioRef,
      onPlay: () => setPlaying(true),
      onPause: () => setPlaying(false),
      onTimeUpdate: (e) => setCurrentTime(e.currentTarget.currentTime),
      onLoadedMetadata: (e) => setDuration(e.currentTarget.duration),
      onEnded: goNext,
    },
  }
}
