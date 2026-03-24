export type PollStatus = 'waiting' | 'active' | 'ended'

export type SlideType =
  | 'word_cloud'
  | 'multiple_choice'
  | 'open_ended'
  | 'ranking'
  | 'scales'
  | 'qa'
  | 'guess_number'
  | 'hundred_points'
  | 'grid_2x2'
  | 'pin_on_image'

export type Participant = {
  id: string
  name: string
  avatarSeed?: string
}

export type ImageLayout =
  | 'full'
  | 'above'
  | 'left'
  | 'right'
  | 'left-large'
  | 'right-large'

export type SlideSettings = {
  allowMultiple?: boolean
  maxSelections?: number
  maxWords?: number
  timer?: number
  showQrCode?: boolean
  showInstructionsBar?: boolean
  textColor?: string
  bgColor?: string
  imageUrl?: string
  imageLayout?: ImageLayout
  correctAnswer?: string
  correctAnswers?: string[]
  correctNumber?: number
  numberMin?: number
  numberMax?: number
  pointsTotal?: number
  axisXLabel?: string
  axisYLabel?: string
  scaleMin?: number
  scaleMax?: number
  scaleMinLabel?: string
  scaleMaxLabel?: string
  scaleColors?: string[]
  barColors?: string[]
}

export type PollSlide = {
  id: string
  pollId: string
  order: number
  type: SlideType
  question: string
  options: string[]
  settings: SlideSettings
  locked: boolean
  createdAt: string
  updatedAt: string
}

export type Poll = {
  id: string
  title: string
  code: string
  status: PollStatus
  currentSlide: number
  slides: PollSlide[]
  createdAt: string
  updatedAt: string
}

export type CreatePollPayload = {
  title?: string
}

export type UpdatePollPayload = {
  title?: string
  status?: PollStatus
  currentSlide?: number
}

export type CreateSlidePayload = {
  type?: SlideType
  question?: string
  options?: string[]
  settings?: SlideSettings
}

export type UpdateSlidePayload = {
  type?: SlideType
  question?: string
  options?: string[]
  settings?: SlideSettings
  locked?: boolean
}

export type PollListResponse = {
  data: Poll[]
  meta: {
    page: number
    take: number
    total: number
    totalPages: number
  }
}

export type WordCloudResult = { word: string; count: number }[]
export type MCResult = { option: string; count: number }[]
export type OpenEndedResult = { text: string; count: number; createdAt: string }[]
export type RankingResult = { option: string; avgRank: number }[]
export type ScaleStatementResult = {
  statement: string
  distribution: { value: number; count: number }[]
  average: number
  responseCount: number
}
export type ScaleResult = ScaleStatementResult[]
export type QAResult = { text: string; participantName: string; createdAt: string; isAnswered?: boolean; voteId?: string; likeCount?: number }[]
export type GuessNumberResult = { value: number; count: number }[]
export type HundredPointsResult = { option: string; totalPoints: number }[]
export type PinOnImageResult = { x: number; y: number; participantName: string }[]
export type Grid2x2Result = { option: string; avgX: number; avgY: number }[]

export type SlideResults =
  | WordCloudResult
  | MCResult
  | OpenEndedResult
  | RankingResult
  | ScaleResult
  | QAResult
  | GuessNumberResult
  | HundredPointsResult
  | PinOnImageResult
  | Grid2x2Result

export type LeaderboardEntry = {
  id: string
  name: string
  avatarSeed?: string
  score: number
}

export interface QAQuestion {
  id: string
  text: string
  authorName: string
  authorId?: string
  likeCount: number
  createdAt: string
  likedByIds: string[]
  pollVoteId?: string
}
