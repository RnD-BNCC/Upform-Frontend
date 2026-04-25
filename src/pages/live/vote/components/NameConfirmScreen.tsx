import { useState } from "react";
import { ArrowsClockwise } from "@phosphor-icons/react";
import {
  getAvatarSeed,
  randomizeAvatarSeed,
} from "@/utils/polls/participant";

type Props = {
  name: string;
  onConfirm: () => void;
  onChange: () => void;
};

export default function NameConfirmScreen({
  name,
  onConfirm,
  onChange,
}: Props) {
  const [seed, setSeed] = useState(getAvatarSeed);

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
        <p className="text-sm text-gray-400 font-medium mb-1">
          You're joining as
        </p>
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
  );
}
