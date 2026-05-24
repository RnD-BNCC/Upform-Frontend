import { createGamePlugin } from "@/components/builder/layout/game/gameDefinitionHelpers";
import LotteryCodeGameCard from "@/components/builder/layout/game/plugins/lottery-code/LotteryCodeGameCard";

export const lotteryCodeGamePlugin = createGamePlugin({
  meta: {
    description: "Draw a random raffle code from submitted form responses.",
    label: "Lottery Code",
  },
  renderCard: (props) => <LotteryCodeGameCard {...props} />,
  type: "lottery_code",
});
