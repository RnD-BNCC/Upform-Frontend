export const Api = {
  events: '/events',
  eventDetail: (id: string) => `/events/${id}`,
  sections: (eventId: string) => `/events/${eventId}/sections`,
  sectionDetail: (eventId: string, sectionId: string) =>
    `/events/${eventId}/sections/${sectionId}`,
  sectionsReorder: (eventId: string) =>
    `/events/${eventId}/sections/reorder`,
  responses: (eventId: string) => `/events/${eventId}/responses`,
  responseDetail: (eventId: string, responseId: string) =>
    `/events/${eventId}/responses/${responseId}`,
  publicEventDetail: (id: string) => `/public/events/${id}`,
  publicResponses: (eventId: string) => `/public/events/${eventId}/responses`,

  // Polls
  polls: '/polls',
  pollDetail: (id: string) => `/polls/${id}`,
  pollSlides: (pollId: string) => `/polls/${pollId}/slides`,
  pollSlideDetail: (pollId: string, slideId: string) =>
    `/polls/${pollId}/slides/${slideId}`,
  pollSlidesReorder: (pollId: string) => `/polls/${pollId}/slides/reorder`,
  pollScores: (pollId: string) => `/polls/${pollId}/scores`,
  pollVotes: (pollId: string) => `/polls/${pollId}/votes`,

  // Public polls
  publicPollJoin: (code: string) => `/public/polls/join/${code}`,
  publicPollVote: (pollId: string, slideId: string) =>
    `/public/polls/${pollId}/slides/${slideId}/vote`,
  publicPollResults: (pollId: string, slideId: string) =>
    `/public/polls/${pollId}/slides/${slideId}/results`,
  publicPollVoteAnswer: (pollId: string, slideId: string, voteId: string) =>
    `/public/polls/${pollId}/slides/${slideId}/votes/${voteId}/answer`,

  // Q&A Questions
  pollQuestions: (pollId: string) => `/polls/${pollId}/questions`,

  // Upload
  upload: '/upload',
  uploadFile: '/upload/file',
} as const
