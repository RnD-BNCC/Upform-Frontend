import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useQueryPublicPoll, useMutationSubmitVote } from '@/api/polls'
import { useSocket, useLiveSlide } from '@/hooks/polls'
import Leaderboard from '@/components/polling/Leaderboard'
import { getParticipantId, getParticipantName, setParticipantName, getAvatarSeed, randomizeAvatarSeed } from '@/utils/participant'
import type { SlideType, PollSlide } from '@/types/polling'
import {
  SpinnerGap,
  Presentation,
  ArrowsClockwise,
  CheckCircle,
  XCircle,
} from '@phosphor-icons/react'
import { SuccessIcon } from '@/components/ui/icons'

function AudienceShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <p className="text-lg font-bold italic text-gray-900 mb-6">
          UpForm
        </p>

        {children}
      </div>
    </div>
  )
}

function NameConfirmScreen({
  name,
  onConfirm,
  onChange,
}: {
  name: string
  onConfirm: () => void
  onChange: () => void
}) {
  const [seed, setSeed] = useState(getAvatarSeed)

  return (
    <div className="flex flex-col items-center gap-5 p-6 text-center">
      <div className="relative">
        <img
          src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`}
          alt="Your avatar"
          className="w-20 h-20 rounded-full bg-primary-50"
        />
        <button
          onClick={() => setSeed(randomizeAvatarSeed())}
          className="absolute -bottom-1 -right-1 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-primary-500 hover:border-primary-300 transition-colors cursor-pointer shadow-sm"
          title="Randomize avatar"
        >
          <ArrowsClockwise size={16} weight="bold" />
        </button>
      </div>
      <div>
        <p className="text-sm text-gray-400 font-medium mb-1">You're joining as</p>
        <h2 className="text-xl font-black text-gray-900">{name}</h2>
      </div>
      <button
        onClick={onConfirm}
        className="w-full bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 transition-colors cursor-pointer"
      >
        Continue
      </button>
      <button
        onClick={onChange}
        className="text-sm text-gray-400 hover:text-gray-600 font-medium cursor-pointer transition-colors"
      >
        Not you? Change name
      </button>
    </div>
  )
}

function NameEntryScreen({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [name, setName] = useState('')
  const [seed, setSeed] = useState(getAvatarSeed)

  return (
    <div className="flex flex-col items-center gap-5 p-6 text-center">
      <div className="relative">
        <img
          src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`}
          alt="Your avatar"
          className="w-16 h-16 rounded-full bg-primary-50"
        />
        <button
          onClick={() => setSeed(randomizeAvatarSeed())}
          className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-primary-500 hover:border-primary-300 transition-colors cursor-pointer shadow-sm"
          title="Randomize avatar"
        >
          <ArrowsClockwise size={14} weight="bold" />
        </button>
      </div>
      <h2 className="text-lg font-bold text-gray-900">What's your name?</h2>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && name.trim() && onSubmit(name.trim())}
        placeholder="Enter your name"
        className="w-full text-center text-lg font-semibold border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all"
        autoFocus
        maxLength={30}
      />
      <button
        onClick={() => name.trim() && onSubmit(name.trim())}
        disabled={!name.trim()}
        className="w-full bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        Join
      </button>
    </div>
  )
}

function WaitingScreen({ name, title, questionNumber, totalQuestions }: { name: string; title: string; questionNumber?: number; totalQuestions?: number }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 p-8 text-center">
      <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
        <Presentation size={36} className="text-primary-500" weight="bold" />
      </div>
      <div>
        {questionNumber !== undefined && totalQuestions ? (
          <>
            <p className="text-xs font-semibold text-primary-500 mb-1">
              Question {questionNumber} of {totalQuestions}
            </p>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Get ready!
            </h2>
          </>
        ) : (
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            Get ready to play {title || 'the quiz'}!
          </h2>
        )}
        <p className="text-sm text-gray-400">
          Hi <span className="font-semibold text-gray-600">{name}</span>! Waiting for presenter to start...
        </p>
      </div>
      <SpinnerGap size={24} className="text-primary-400 animate-spin mt-2" />
    </div>
  )
}

function ThankYouScreen({ scoreFeedback }: { scoreFeedback?: { points: number; isCorrect: boolean } | null }) {
  if (scoreFeedback) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        {scoreFeedback.isCorrect ? (
          <>
            <CheckCircle size={48} className="text-emerald-500" weight="fill" />
            <h2 className="text-lg font-bold text-gray-900">Correct!</h2>
            <p className="text-2xl font-black text-emerald-500">+{scoreFeedback.points}</p>
          </>
        ) : (
          <>
            <XCircle size={48} className="text-red-400" weight="fill" />
            <h2 className="text-lg font-bold text-gray-900">Incorrect</h2>
            <p className="text-sm text-gray-400">Better luck next time!</p>
          </>
        )}
        <p className="text-xs text-gray-300 mt-2">Waiting for next question...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
      <div className="relative flex size-12">
        <span className="absolute animate-ping bg-emerald-500 rounded-full h-full w-full opacity-50" />
        <div className="relative"><SuccessIcon size={48} /></div>
      </div>
      <h2 className="text-lg font-bold text-gray-900">Vote Recorded!</h2>
      <p className="text-sm text-gray-400">
        Waiting for next question...
      </p>
    </div>
  )
}

function EndedScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
      <h2 className="text-lg font-bold text-gray-900">Poll has ended</h2>
      <p className="text-sm text-gray-400">
        Thank you for participating!
      </p>
    </div>
  )
}

function WordCloudInput({
  onSubmit,
  isPending,
}: {
  onSubmit: (value: unknown) => void
  isPending: boolean
}) {
  const [word, setWord] = useState('')

  return (
    <div className="flex flex-col gap-3">
      <input
        value={word}
        onChange={(e) => setWord(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && word.trim()) {
            onSubmit({ word: word.trim() })
            setWord('')
          }
        }}
        placeholder="Type a word..."
        className="text-lg border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-primary-500 text-center font-semibold"
        autoFocus
      />
      <button
        onClick={() => {
          if (word.trim()) {
            onSubmit({ word: word.trim() })
            setWord('')
          }
        }}
        disabled={!word.trim() || isPending}
        className="bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        {isPending ? <span className="flex items-center justify-center gap-2"><SpinnerGap size={16} className="animate-spin" /> Submitting...</span> : 'Submit'}
      </button>
    </div>
  )
}

function MCInput({
  options,
  onSubmit,
  isPending,
}: {
  options: string[]
  onSubmit: (value: unknown) => void
  isPending: boolean
}) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-3">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => setSelected(opt)}
          className={`text-left px-5 py-4 rounded-xl border-2 font-medium text-sm transition-all cursor-pointer ${
            selected === opt
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
          }`}
        >
          {opt}
        </button>
      ))}
      <button
        onClick={() => selected && onSubmit({ option: selected })}
        disabled={!selected || isPending}
        className="bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 mt-2 cursor-pointer disabled:cursor-not-allowed"
      >
        {isPending ? <span className="flex items-center justify-center gap-2"><SpinnerGap size={16} className="animate-spin" /> Voting...</span> : 'Vote'}
      </button>
    </div>
  )
}

function OpenEndedInput({
  onSubmit,
  isPending,
}: {
  onSubmit: (value: unknown) => void
  isPending: boolean
}) {
  const [text, setText] = useState('')

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your answer..."
        rows={4}
        className="text-sm border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-primary-500 resize-none"
        autoFocus
      />
      <button
        onClick={() => {
          if (text.trim()) onSubmit({ text: text.trim() })
        }}
        disabled={!text.trim() || isPending}
        className="bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        {isPending ? <span className="flex items-center justify-center gap-2"><SpinnerGap size={16} className="animate-spin" /> Submitting...</span> : 'Submit'}
      </button>
    </div>
  )
}

function RankingInput({
  options,
  onSubmit,
  isPending,
}: {
  options: string[]
  onSubmit: (value: unknown) => void
  isPending: boolean
}) {
  const [ranking, setRanking] = useState<string[]>(options)

  const moveUp = (i: number) => {
    if (i === 0) return
    const next = [...ranking]
    ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
    setRanking(next)
  }

  const moveDown = (i: number) => {
    if (i === ranking.length - 1) return
    const next = [...ranking]
    ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
    setRanking(next)
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-gray-400 font-medium mb-1">
        Tap arrows to reorder
      </p>
      {ranking.map((opt, i) => (
        <div
          key={opt}
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3"
        >
          <span className="text-sm font-bold text-gray-400 w-5">{i + 1}</span>
          <span className="text-sm font-medium text-gray-700 flex-1">
            {opt}
          </span>
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => moveUp(i)}
              disabled={i === 0}
              className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30 cursor-pointer"
            >
              ▲
            </button>
            <button
              onClick={() => moveDown(i)}
              disabled={i === ranking.length - 1}
              className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30 cursor-pointer"
            >
              ▼
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={() => onSubmit({ ranking })}
        disabled={isPending}
        className="bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 mt-2 cursor-pointer disabled:cursor-not-allowed"
      >
        {isPending ? <span className="flex items-center justify-center gap-2"><SpinnerGap size={16} className="animate-spin" /> Submitting...</span> : 'Submit Ranking'}
      </button>
    </div>
  )
}

function ScaleInput({
  onSubmit,
  isPending,
}: {
  onSubmit: (value: unknown) => void
  isPending: boolean
}) {
  const [scale, setScale] = useState<number | null>(null)

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => setScale(n)}
            className={`w-12 h-12 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              scale === n
                ? 'bg-primary-500 text-white shadow-lg scale-110'
                : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-primary-300'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <button
        onClick={() => scale !== null && onSubmit({ scale })}
        disabled={scale === null || isPending}
        className="w-full bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 mt-2 cursor-pointer disabled:cursor-not-allowed"
      >
        {isPending ? <span className="flex items-center justify-center gap-2"><SpinnerGap size={16} className="animate-spin" /> Submitting...</span> : 'Submit'}
      </button>
    </div>
  )
}

function AudienceSlideInput({
  slide,
  onSubmit,
  isPending,
}: {
  slide: PollSlide
  onSubmit: (value: unknown) => void
  isPending: boolean
}) {
  switch (slide.type as SlideType) {
    case 'word_cloud':
      return <WordCloudInput onSubmit={onSubmit} isPending={isPending} />
    case 'multiple_choice':
      return (
        <MCInput
          options={slide.options}
          onSubmit={onSubmit}
          isPending={isPending}
        />
      )
    case 'open_ended':
      return <OpenEndedInput onSubmit={onSubmit} isPending={isPending} />
    case 'ranking':
      return (
        <RankingInput
          options={slide.options}
          onSubmit={onSubmit}
          isPending={isPending}
        />
      )
    case 'scales':
      return <ScaleInput onSubmit={onSubmit} isPending={isPending} />
    default:
      return null
  }
}

export default function LiveVotePage() {
  const { code } = useParams<{ code: string }>()
  const { data: poll, isLoading, error } = useQueryPublicPoll(code ?? '')
  const { socketRef, connected } = useSocket(poll?.id)
  const { currentSlide: liveSlide, pollStatus: liveStatus, countdown, showLeaderboard, leaderboardScores, scoreUpdate } =
    useLiveSlide(socketRef, connected)

  const [voted, setVoted] = useState(false)
  const [lastScoreFeedback, setLastScoreFeedback] = useState<{ points: number; isCorrect: boolean } | null>(null)
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number | null>(null)
  const [participantNameState, setParticipantNameState] = useState<string | null>(getParticipantName())
  const [nameConfirmed, setNameConfirmed] = useState(false)
  const showCountdown = countdown !== null

  useEffect(() => {
    setNameConfirmed(false)
    setParticipantNameState(getParticipantName())
  }, [code])

  useEffect(() => {
    if (poll) setCurrentSlideIndex(poll.currentSlide)
  }, [poll?.currentSlide])

  useEffect(() => {
    if (liveSlide !== null) {
      setCurrentSlideIndex(liveSlide)
      setVoted(false)
    }
  }, [liveSlide])

  useEffect(() => {
    if (liveStatus === 'waiting') {
      setVoted(false)
      setLastScoreFeedback(null)
    }
  }, [liveStatus])

  useEffect(() => {
    if (scoreUpdate && scoreUpdate.participantId === getParticipantId()) {
      setLastScoreFeedback({ points: scoreUpdate.points, isCorrect: scoreUpdate.isCorrect })
    }
  }, [scoreUpdate])

  useEffect(() => {
    if (poll && participantNameState && nameConfirmed && socketRef.current) {
      socketRef.current.emit('join-participant', {
        pollId: poll.id,
        participantId: getParticipantId(),
        name: participantNameState,
        avatarSeed: getAvatarSeed(),
      })
    }
  }, [poll?.id, participantNameState, nameConfirmed, connected])

  const handleNameSubmit = useCallback((name: string) => {
    setParticipantName(name)
    setParticipantNameState(name)
    setNameConfirmed(true)
    if (poll && socketRef.current) {
      socketRef.current.emit('join-participant', {
        pollId: poll.id,
        participantId: getParticipantId(),
        name,
        avatarSeed: getAvatarSeed(),
      })
    }
  }, [poll?.id])

  const slides = poll?.slides ?? []
  const activeSlide =
    currentSlideIndex !== null ? slides[currentSlideIndex] : undefined

  const submitVote = useMutationSubmitVote(
    poll?.id ?? '',
    activeSlide?.id ?? '',
    {
      onSuccess: () => setVoted(true),
    },
  )

  const handleSubmit = (value: unknown) => {
    submitVote.mutate({
      participantId: getParticipantId(),
      value,
    })
  }

  const effectiveStatus = liveStatus ?? poll?.status


  if (isLoading) {
    return (
      <AudienceShell>
        <div className="flex-1 flex items-center justify-center">
          <SpinnerGap size={32} className="text-primary-500 animate-spin" />
        </div>
      </AudienceShell>
    )
  }

  if (error || !poll) {
    return (
      <AudienceShell>
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Poll not found
            </h2>
            <p className="text-sm text-gray-400">
              The poll code may be incorrect or the poll has ended.
            </p>
          </div>
        </div>
      </AudienceShell>
    )
  }

  if (showLeaderboard && leaderboardScores.length > 0) {
    return (
      <div className="min-h-screen relative">
        <Leaderboard scores={leaderboardScores} onClose={() => {}} />
      </div>
    )
  }

  if (effectiveStatus === 'ended') return <AudienceShell><EndedScreen /></AudienceShell>

  if (!participantNameState || !nameConfirmed) {
    return (
      <AudienceShell>
        {participantNameState ? (
          <NameConfirmScreen
            name={participantNameState}
            onConfirm={() => setNameConfirmed(true)}
            onChange={() => setParticipantNameState(null)}
          />
        ) : (
          <NameEntryScreen onSubmit={handleNameSubmit} />
        )}
      </AudienceShell>
    )
  }

  if (showCountdown) {
    return (
      <div className="min-h-screen bg-primary-800 flex items-center justify-center p-5">
        <AnimatePresence mode="wait">
          <motion.span
            key={countdown}
            initial={{ scale: 2.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="text-[100px] font-black text-white select-none"
          >
            {countdown === 0 ? 'GO!' : countdown}
          </motion.span>
        </AnimatePresence>
      </div>
    )
  }

  if (effectiveStatus === 'waiting') {
    return (
      <AudienceShell>
        <WaitingScreen
          name={participantNameState}
          title={poll.title}
          questionNumber={currentSlideIndex !== null ? currentSlideIndex + 1 : undefined}
          totalQuestions={slides.length}
        />
      </AudienceShell>
    )
  }

  return (
    <AudienceShell>
      {activeSlide && (
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Question {(currentSlideIndex ?? 0) + 1}
            </p>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug"
              dangerouslySetInnerHTML={{ __html: activeSlide.question || 'No question' }}
            />
          </div>

          {voted ? (
            <ThankYouScreen scoreFeedback={lastScoreFeedback} />
          ) : (
            <AudienceSlideInput
              slide={activeSlide}
              onSubmit={handleSubmit}
              isPending={submitVote.isPending}
            />
          )}
        </div>
      )}
    </AudienceShell>
  )
}
