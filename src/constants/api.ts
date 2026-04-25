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
  responseProgress: (eventId: string) =>
    `/events/${eventId}/response-progress`,
  responseProgressDetail: (eventId: string, progressId: string) =>
    `/events/${eventId}/response-progress/${progressId}`,
  eventAnalytics: (eventId: string) => `/events/${eventId}/analytics`,
  publicEventDetail: (id: string) => `/public/events/${id}`,
  publicResponses: (eventId: string) => `/public/events/${eventId}/responses`,
  publicEventAnalytics: (eventId: string) =>
    `/public/events/${eventId}/analytics`,
  publicResponseProgress: (eventId: string) =>
    `/public/events/${eventId}/response-progress`,
  publicResponseProgressDetail: (eventId: string, progressId: string) =>
    `/public/events/${eventId}/response-progress/${progressId}`,

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

  // Spreadsheet integration
  eventSpreadsheet: (eventId: string) => `/events/${eventId}/spreadsheet`,

  // Upload
  upload: '/upload',
  uploadFile: '/upload/file',

  // Gallery
  galleryFiles: '/gallery/files',
  galleryMedia: '/gallery/media',
  galleryFileDelete: '/gallery/file',

  // Email blasts
  emailBlasts: '/email-blasts',
  emailBlastDetail: (id: string) => `/email-blasts/${id}`,
  emailBlastDraft: (eventId: string) =>
    `/email-blasts/events/${eventId}/draft`,
} as const
