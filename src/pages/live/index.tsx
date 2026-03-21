import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Presentation } from '@phosphor-icons/react'

export default function LiveJoinPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const handleJoin = () => {
    const trimmed = code.trim()
    if (!trimmed) {
      setError('Please enter a code')
      return
    }
    navigate(`/live/${trimmed}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-800 via-primary-600 to-primary-400 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
            <Presentation size={28} className="text-primary-600" weight="bold" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-1">Join a Poll</h1>
        <p className="text-sm text-gray-400 mb-6">
          Enter the code shown on the presenter's screen
        </p>

        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, '').slice(0, 8))
            setError('')
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          placeholder="Enter poll code"
          className="w-full text-center text-2xl font-bold tracking-[0.3em] border-2 border-gray-200 rounded-xl px-4 py-4 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all placeholder:text-gray-300 placeholder:tracking-normal placeholder:text-base placeholder:font-normal"
          autoFocus
          inputMode="numeric"
        />

        {error && (
          <p className="text-xs text-red-500 font-medium mt-2">{error}</p>
        )}

        <button
          onClick={handleJoin}
          className="w-full mt-4 bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm py-3 rounded-xl transition-colors cursor-pointer"
        >
          Join
        </button>
      </div>
    </div>
  )
}
