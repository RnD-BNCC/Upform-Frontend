import { createGamePlugin } from "../../gameDefinitionHelpers";
import LotteryCodeGameCard from "./LotteryCodeGameCard";

export const lotteryCodeGamePlugin = createGamePlugin({
  meta: {
    description: "Draw a random raffle code from submitted form responses.",
    label: "Lottery Code",
  },
  renderCard: (props) => <LotteryCodeGameCard {...props} />,
  type: "lottery_code",
});
