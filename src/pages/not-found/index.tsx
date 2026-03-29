import { useNavigate } from 'react-router'
import { ArrowLeftIcon } from '@phosphor-icons/react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
      <div className="flex items-center justify-center flex-col">
        <p className="text-lg font-black mb-4 text-primary-500">404</p>
        <p className="text-2xl font-extrabold text-black">
          Oops! The page you requested does not exist :(
        </p>
        <p className="text-gray-400 text-lg mb-16 font-semibold">
          We can't find the page you're looking for. It may have been moved or
          deleted
        </p>

        <button
          onClick={() => navigate('/')}
          className="bg-primary-500 hover:bg-primary-600 text-white text-sm flex font-bold px-4 py-2 rounded-md justify-center items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeftIcon size={14} weight="bold" color="white" />
          Back
        </button>
      </div>
    </div>
  )
}
