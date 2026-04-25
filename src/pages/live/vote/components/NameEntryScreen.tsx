import { useState } from "react";
import { ArrowsClockwise } from "@phosphor-icons/react";
import {
  getAvatarSeed,
  randomizeAvatarSeed,
} from "@/utils/polls/participant";

type Props = {
  onSubmit: (name: string) => void;
};

export default function NameEntryScreen({ onSubmit }: Props) {
  const [name, setName] = useState("");
  const [seed, setSeed] = useState(getAvatarSeed);

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
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) =>
          event.key === "Enter" && name.trim() && onSubmit(name.trim())
        }
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
  );
}
