import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { useGetPollDetail, useSocket, useLiveResults, useLiveSlide } from '@/hooks/polls'
import { useMutationUpdatePoll, useQuerySlideResults } from '@/api/polls'
import { apiClient } from '@/config/api-client'
import { Api } from '@/constants/api'
import SlideVisualization from '@/components/polling/visualizations'
import Leaderboard from '@/components/polling/Leaderboard'
import type { SlideType, SlideSettings, ImageLayout, Participant, PollStatus, LeaderboardEntry } from '@/types/polling'
import {
  CaretLeft,
  ArrowRight,
  Users,
  X,
  QrCode,
  SpinnerGap,
  ArrowsOut,
  ArrowsIn,
  Lightbulb,
  EyeSlash,
  Eye,
  Keyboard,
  ArrowsClockwise,
  Trophy,
} from '@phosphor-icons/react'

const PASTEL_COLORS = [
  '#FDE68A', '#A7F3D0', '#BFDBFE', '#C4B5FD', '#FBCFE8',
  '#FCA5A5', '#FED7AA', '#D9F99D', '#A5F3FC', '#E9D5FF',
]

export default function PollPresentPage() {
  const { id: pollId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: poll, isLoading, refetch } = useGetPollDetail(pollId ?? '')
  const updatePoll = useMutationUpdatePoll()
  const { socketRef, connected } = useSocket(pollId)
  const { participantCount, participantList } = useLiveSlide(socketRef, connected)

  const [ready, setReady] = useState(false)
  useEffect(() => { refetch().finally(() => setReady(true)) }, [])

  const [currentSlide, setCurrentSlide] = useState(0)
  const [showJoinOverlay, setShowJoinOverlay] = useState(false)
  const [showSlideGrid, setShowSlideGrid] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showHotkeys, setShowHotkeys] = useState(false)
  const [hideResponses, setHideResponses] = useState(false)
  const [showBlankScreen, setShowBlankScreen] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [restarting, setRestarting] = useState(false)
  const [statusOverride, setStatusOverride] = useState<PollStatus | null>(null)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [leaderboardScores, setLeaderboardScores] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return
    const onScoresUpdate = (data: { scores: LeaderboardEntry[] }) => {
      setLeaderboardScores(data.scores)
      setShowLeaderboard(true)
    }
    socket.on('scores-update', onScoresUpdate)
    return () => { socket.off('scores-update', onScoresUpdate) }
  }, [socketRef, connected])

  useEffect(() => {
    if (poll) setCurrentSlide(poll.currentSlide)
  }, [poll?.currentSlide])

  const slides = poll?.slides ?? []
  const activeSlide = slides[currentSlide]
  const slideSettings = (activeSlide?.settings as SlideSettings) ?? {}

  const { results: liveResults } = useLiveResults(socketRef, activeSlide?.id, connected)
  const { data: fetchedResults } = useQuerySlideResults(pollId ?? '', activeSlide?.id ?? '')
  const displayResults = liveResults ?? fetchedResults ?? null

  const effectiveStatus = statusOverride ?? poll?.status
  const isWaitingRoom = effectiveStatus === 'waiting'
  const isLastSlide = currentSlide >= slides.length - 1
  const isFirstSlide = currentSlide <= 0

  const goToSlide = useCallback((index: number) => {
    if (!pollId) return
    setCurrentSlide(index)
    setStatusOverride('waiting')
    updatePoll.mutate({ pollId, currentSlide: index, status: 'waiting' })
    socketRef.current?.emit('broadcast-poll-state', { pollId, currentSlide: index, status: 'waiting' })
    setShowSlideGrid(false)
  }, [pollId, updatePoll, socketRef])

  useEffect(() => {
    if (countdown === null) return
    if (pollId) socketRef.current?.emit('broadcast-countdown', { pollId, count: countdown })
    if (countdown === 0) {
      const timer = setTimeout(() => {
        setCountdown(null)
        setStatusOverride('active')
        if (pollId) {
          updatePoll.mutate({ pollId, status: 'active' })
          socketRef.current?.emit('broadcast-poll-state', { pollId, status: 'active' })
        }
      }, 800)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, pollId, updatePoll, socketRef])

  const handleStartQuiz = useCallback(() => {
    setCountdown(5)
  }, [])

  const handleShowLeaderboard = useCallback(() => {
    if (!pollId) return
    socketRef.current?.emit('request-scores', { pollId })
    socketRef.current?.emit('broadcast-leaderboard', { pollId })
  }, [pollId, socketRef])

  const handleRestart = useCallback(async () => {
    if (!pollId || restarting) return
    setRestarting(true)
    try {
      await apiClient.delete(Api.pollVotes(pollId))
    } catch { /* ignore */ }
    updatePoll.mutate(
      { pollId, status: 'waiting', currentSlide: 0 },
      { onSettled: () => setRestarting(false) },
    )
    socketRef.current?.emit('broadcast-poll-state', { pollId, status: 'waiting', currentSlide: 0 })
    socketRef.current?.emit('reset-scores', { pollId })
    setCurrentSlide(0)
    setCountdown(null)
    setStatusOverride('waiting')
    setShowLeaderboard(false)
    setLeaderboardScores([])
  }, [pollId, restarting, updatePoll, socketRef])

  const handleEnd = useCallback(() => {
    if (!pollId) return
    socketRef.current?.emit('broadcast-poll-state', { pollId, status: 'ended' })
    updatePoll.mutate({ pollId, status: 'ended', currentSlide: 0 })
    navigate('/polls')
  }, [pollId, updatePoll, navigate, socketRef])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen()
    else document.documentElement.requestFullscreen()
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      switch (e.key) {
        case 'f': case 'F': toggleFullscreen(); break
        case 'ArrowRight':
          if (isWaitingRoom && countdown === null) handleStartQuiz()
          else if (!isWaitingRoom && isLastSlide) handleShowLeaderboard()
          else if (!isWaitingRoom && currentSlide < slides.length - 1) goToSlide(currentSlide + 1)
          break
        case 'ArrowLeft':
          if (!isWaitingRoom && currentSlide > 0) goToSlide(currentSlide - 1)
          break
        case 'Escape':
          if (restarting) break
          if (showLeaderboard) { setShowLeaderboard(false); break }
          if (showHotkeys) { setShowHotkeys(false); break }
          if (showSlideGrid) { setShowSlideGrid(false); break }
          if (showBlankScreen) { setShowBlankScreen(false); break }
          navigate('/polls')
          break
        case 's': case 'S':
          if (isWaitingRoom && countdown === null) handleStartQuiz()
          break
        case 'r': case 'R': handleRestart(); break
        case 'p': case 'P': navigate('/polls'); break
        case 'b': case 'B': setShowBlankScreen((p) => !p); break
        case 'h': case 'H': setHideResponses((p) => !p); break
        case 'l': case 'L': setShowJoinOverlay((p) => !p); break
        case 't': case 'T':
          if (isLastSlide && !isWaitingRoom) handleShowLeaderboard()
          break
        case '?': setShowHotkeys((p) => !p); break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleFullscreen, currentSlide, slides.length, goToSlide, showSlideGrid, showHotkeys, showBlankScreen, showLeaderboard, restarting, handleRestart, handleStartQuiz, handleShowLeaderboard, isWaitingRoom, isLastSlide, countdown, navigate])

  if (!ready || isLoading || !poll) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <SpinnerGap size={32} className="text-primary-500 animate-spin" />
      </div>
    )
  }

  const joinUrl = `${window.location.origin}/live`
  const bgColor = slideSettings.bgColor ?? '#FFFFFF'
  const textColor = slideSettings.textColor ?? '#111827'
  const imageUrl = slideSettings.imageUrl
  const imageLayout: ImageLayout = slideSettings.imageLayout ?? 'above'

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            className="absolute inset-0 z-[70] bg-primary-800 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={countdown}
                initial={{ scale: 2.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="text-[120px] font-black text-white select-none"
              >
                {countdown === 0 ? 'GO!' : countdown}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLeaderboard && leaderboardScores.length > 0 && (
          <Leaderboard scores={leaderboardScores} onClose={() => setShowLeaderboard(false)} />
        )}
      </AnimatePresence>

      {showBlankScreen && (
        <div
          className="absolute inset-0 z-[60] bg-black flex items-center justify-center cursor-pointer"
          onClick={() => setShowBlankScreen(false)}
        >
          <p className="text-white/20 text-sm">Press B or click to resume</p>
        </div>
      )}

      <div className="flex items-center justify-between px-5 py-3 z-10 relative">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-bold truncate max-w-48 opacity-60" style={{ color: textColor }}>
            {poll.title || 'Untitled Poll'}
          </h1>
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full opacity-50"
            style={{ color: textColor, backgroundColor: textColor === '#FFFFFF' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)' }}
          >
            {currentSlide + 1}/{slides.length}
          </span>
          <div className="flex items-center gap-1 opacity-50" style={{ color: textColor }}>
            <Users size={13} weight="bold" />
            <span className="text-[11px] font-semibold tabular-nums">{participantCount}</span>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 top-3">
          <div className="flex items-center gap-1 text-[9px] font-medium text-gray-500 bg-gray-100 rounded-full px-3 py-1">
            <span>Join at <span className="font-semibold text-gray-700">{joinUrl}</span></span>
            <span className="text-gray-300">|</span>
            <span>use code</span>
            <span className="text-gray-900 font-bold tracking-wider text-[10px]">{poll.code}</span>
          </div>
        </div>

        <span className="text-[11px] font-bold italic text-primary-500">UpForm</span>
      </div>

      {isWaitingRoom ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-20 relative">
          <p className="text-base font-medium opacity-50 mb-2" style={{ color: textColor }}>
            Question <span className="text-2xl font-black">{currentSlide + 1}</span> of <span className="text-2xl font-black">{slides.length}</span>
          </p>
          <FloatingAvatars participants={participantList} />
          <p className="text-sm font-bold mt-4" style={{ color: textColor }}>
            {participantList.length} player{participantList.length !== 1 ? 's' : ''} ready!
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-20 relative">
          {imageUrl && imageLayout === 'full' && (
            <div className="absolute inset-0 z-0">
              <img src={imageUrl} alt="" className="w-full h-full object-cover opacity-30" />
            </div>
          )}

          <div className="relative z-[1] w-full max-w-4xl flex-1 flex flex-col items-center justify-center">
            {imageUrl && imageLayout === 'above' && (
              <div className="flex justify-center mb-6">
                <div className="max-h-56 max-w-full overflow-hidden rounded-xl">
                  <img src={imageUrl} alt="" className="w-full h-full object-contain rounded-xl" />
                </div>
              </div>
            )}

            {imageUrl && ['left', 'right', 'left-large', 'right-large'].includes(imageLayout) ? (
              <div className={`flex gap-8 w-full flex-1 items-center ${imageLayout === 'right' || imageLayout === 'right-large' ? 'flex-row-reverse' : ''}`}>
                <div className={`${imageLayout.includes('large') ? 'w-3/5' : 'w-2/5'} shrink-0 flex items-center`}>
                  <div className="w-full max-h-80 overflow-hidden rounded-xl">
                    <img src={imageUrl} alt="" className="w-full h-full object-contain rounded-xl" />
                  </div>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="text-center mb-8 w-full">
                    <h2
                      className="text-3xl sm:text-4xl font-bold"
                      style={{ color: textColor }}
                      dangerouslySetInnerHTML={{ __html: activeSlide?.question || 'No question' }}
                    />
                  </div>
                  {!hideResponses && (
                    <div className="w-full flex-1 flex items-center justify-center">
                      {activeSlide && <SlideVisualization type={activeSlide.type as SlideType} results={displayResults} textColor={textColor} bgColor={bgColor} correctAnswer={slideSettings.correctAnswer} />}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-4 max-w-4xl">
                  <h2
                    className="text-3xl sm:text-4xl font-bold"
                    style={{ color: textColor }}
                    dangerouslySetInnerHTML={{ __html: activeSlide?.question || 'No question' }}
                  />
                </div>
                <p className="text-sm font-medium opacity-40 mb-6" style={{ color: textColor }}>
                  Look at your device
                </p>
                {!hideResponses ? (
                  <div className="w-full max-w-4xl flex-1 flex items-center justify-center">
                    {activeSlide && <SlideVisualization type={activeSlide.type as SlideType} results={displayResults} textColor={textColor} bgColor={bgColor} correctAnswer={slideSettings.correctAnswer} />}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-lg font-medium opacity-30" style={{ color: textColor }}>Responses hidden</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showJoinOverlay && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-14 right-5 z-30 bg-white rounded-xl shadow-2xl p-5 text-center min-w-60"
          >
            <button
              onClick={() => setShowJoinOverlay(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={14} weight="bold" />
            </button>
            <p className="text-xs text-gray-500 font-medium mb-2">Join at</p>
            <a
              href={`${joinUrl}/${poll.code}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-primary-600 hover:text-primary-700 mb-4 block no-underline"
            >
              {joinUrl}/{poll.code}
            </a>
            <div className="flex justify-center mb-3">
              <QRCodeSVG value={`${joinUrl}/${poll.code}`} size={140} level="M" />
            </div>
            <p className="text-2xl font-black text-gray-900 tracking-widest">{poll.code}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSlideGrid && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-8"
            onClick={() => setShowSlideGrid(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-800">All Slides</h3>
                <button onClick={() => setShowSlideGrid(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X size={16} weight="bold" />
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {slides.map((slide, i) => (
                  <button
                    key={slide.id}
                    onClick={() => goToSlide(i)}
                    className={`relative flex flex-col gap-1.5 p-3 rounded-xl border-2 text-left cursor-pointer transition-all hover:shadow-md ${
                      currentSlide === i
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className={`text-[10px] font-bold ${currentSlide === i ? 'text-primary-600' : 'text-gray-400'}`}>
                      {i + 1}
                    </span>
                    <p className="text-xs text-gray-700 font-medium line-clamp-2 leading-snug">
                      {slide.question ? slide.question.replace(/<[^>]*>/g, '').slice(0, 60) : 'Untitled'}
                    </p>
                    <span className="text-[9px] text-gray-400 font-medium capitalize">
                      {(slide.type as string).replace('_', ' ')}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <HotkeysModal open={showHotkeys} onClose={() => setShowHotkeys(false)} />

      <AnimatePresence>
        {restarting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <SpinnerGap size={40} className="text-white animate-spin" />
              <span className="text-white font-semibold text-sm">Restarting...</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 h-24 z-20 flex items-end justify-center pb-5 group">
        <div className="flex items-center justify-between gap-4 bg-white rounded-full shadow-xl border border-gray-200 px-2.5 py-1.5 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <div className="flex items-center gap-1">
            <ToolbarButton onClick={() => goToSlide(currentSlide - 1)} disabled={isFirstSlide || isWaitingRoom} title="Previous slide (←)">
              <CaretLeft size={18} weight="bold" />
            </ToolbarButton>
            <ToolbarButton onClick={() => setShowSlideGrid(!showSlideGrid)} title="Slide overview">
              <Lightbulb size={18} weight="bold" />
            </ToolbarButton>
            <button
              onClick={() => {
                if (isWaitingRoom) handleStartQuiz()
                else if (isLastSlide) handleShowLeaderboard()
                else goToSlide(currentSlide + 1)
              }}
              className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-colors cursor-pointer ml-0.5 disabled:opacity-40 disabled:cursor-not-allowed ${
                isWaitingRoom
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : isLastSlide
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {isLastSlide && !isWaitingRoom ? <Trophy size={14} weight="fill" /> : <ArrowRight size={14} weight="bold" />}
              {isWaitingRoom ? 'Start quiz' : isLastSlide ? 'Leaderboard' : 'Next slide'}
            </button>
          </div>

          <div className="flex items-center gap-1">
            <ToolbarButton onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}>
              {isFullscreen ? <ArrowsIn size={18} weight="bold" /> : <ArrowsOut size={18} weight="bold" />}
            </ToolbarButton>
            <ToolbarButton onClick={() => setShowJoinOverlay(!showJoinOverlay)} active={showJoinOverlay} title="Show join code (L)">
              <QrCode size={18} weight="bold" />
            </ToolbarButton>
            <ToolbarButton onClick={() => setHideResponses(!hideResponses)} active={hideResponses} title="Hide/show responses (H)">
              {hideResponses ? <Eye size={18} weight="bold" /> : <EyeSlash size={18} weight="bold" />}
            </ToolbarButton>
            <ToolbarButton onClick={() => setShowHotkeys(true)} title="Keyboard shortcuts (?)">
              <Keyboard size={18} weight="bold" />
            </ToolbarButton>
          </div>

          <div className="flex items-center gap-1">
            <ToolbarButton onClick={handleRestart} title="Restart quiz (R)">
              <ArrowsClockwise size={18} weight="bold" />
            </ToolbarButton>
            <ToolbarButton onClick={handleEnd} title="End poll" variant="danger">
              <X size={18} weight="bold" />
            </ToolbarButton>
          </div>
        </div>
      </div>
    </div>
  )
}

function FloatingAvatars({ participants }: { participants: Participant[] }) {
  if (participants.length === 0) return null

  return (
    <div className="relative w-full max-w-2xl h-48 my-4">
      {participants.map((p, i) => {
        const hash = p.id.charCodeAt(0) + p.id.charCodeAt(Math.min(p.id.length - 1, 5))
        const x = (hash * 37 + i * 89) % 70 + 15
        const y = (hash * 53 + i * 67) % 50 + 25
        const color = PASTEL_COLORS[i % PASTEL_COLORS.length]

        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1, x: [0, 12, -8, 0], y: [0, -10, 6, 0] }}
            transition={{
              opacity: { duration: 0.4, delay: i * 0.1 },
              scale: { duration: 0.4, delay: i * 0.1 },
              x: { repeat: Infinity, duration: 3 + (i % 3), ease: 'easeInOut' },
              y: { repeat: Infinity, duration: 4 + (i % 2), ease: 'easeInOut' },
            }}
            className="absolute flex flex-col items-center gap-1"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div
              className="w-14 h-14 rounded-full overflow-hidden bg-primary-50 shadow-lg"
              style={{ outline: `2px solid ${color}` }}
            >
              <img
                src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${p.avatarSeed || p.id}`}
                alt={p.name}
                className="w-full h-full"
                loading="lazy"
              />
            </div>
            <span className="text-[11px] font-semibold text-gray-600 bg-white/90 rounded-full px-2 py-0.5 truncate max-w-20 shadow-sm">
              {p.name}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}

function HotkeysModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-8"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-gray-800">Keyboard Shortcuts</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={18} weight="bold" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-4">Presenting</h4>
                <div className="flex flex-col gap-3">
                  <HotkeyRow keyLabel="→" description="Go to next slide" />
                  <HotkeyRow keyLabel="←" description="Go to previous slide" />
                  <HotkeyRow keyLabel="P" description="Exit presentation" />
                  <HotkeyRow keyLabel="Esc" description="Exit / close overlay" />
                  <HotkeyRow keyLabel="F" description="Toggle fullscreen" />
                  <HotkeyRow keyLabel="S" description="Start quiz" />
                  <HotkeyRow keyLabel="R" description="Restart quiz" />
                  <HotkeyRow keyLabel="B" description="Show or hide blank screen" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-4">Participation</h4>
                <div className="flex flex-col gap-3">
                  <HotkeyRow keyLabel="H" description="Hide or show responses" />
                  <HotkeyRow keyLabel="L" description="Show joining code" />
                  <HotkeyRow keyLabel="?" description="Show keyboard shortcuts" />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function HotkeyRow({ keyLabel, description }: { keyLabel: string; description: string }) {
  return (
    <div className="flex items-center gap-3">
      <kbd className="text-xs font-mono font-bold bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 rounded-lg min-w-9 text-center">
        {keyLabel}
      </kbd>
      <span className="text-sm text-gray-600">{description}</span>
    </div>
  )
}

function ToolbarButton({
  children, onClick, disabled, active, title, variant,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  active?: boolean
  title?: string
  variant?: 'danger'
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
        variant === 'danger'
          ? 'text-gray-500 hover:bg-red-50 hover:text-red-500'
          : active
            ? 'bg-gray-200 text-gray-800'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}
