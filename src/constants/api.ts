export const Api = {
  events: '/events',
  eventBuilder: (id: string) => `/events/${id}/builder`,
  eventDetail: (id: string) => `/events/${id}`,
  eventDuplicate: (id: string) => `/events/${id}/duplicate`,
  eventQuestions: (id: string) => `/events/${id}/questions`,
  eventRestore: (id: string) => `/events/${id}/restore`,
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
  pollRestore: (id: string) => `/polls/${id}/restore`,
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

  // Gallery
  galleryFiles: '/gallery/files',
  galleryMedia: '/gallery/media',
  galleryFileDelete: '/gallery/file',
  galleryFilePreview: '/gallery/file/preview',
  galleryEventShare: (eventId: string) => `/gallery/events/${eventId}/share`,
  galleryEventShareDriveAuth: (eventId: string) =>
    `/gallery/events/${eventId}/share/drive/auth`,
  galleryEventShareDrive: (eventId: string) =>
    `/gallery/events/${eventId}/share/drive`,
  galleryShare: (token: string) => `/gallery/share/${token}`,

  // Email blasts
  emailBlasts: '/email-blasts',
  emailBlastDetail: (id: string) => `/email-blasts/${id}`,
  emailBlastDraft: (eventId: string) =>
    `/email-blasts/events/${eventId}/draft`,
  submitFormSettings: (eventId: string) =>
    `/email-blasts/events/${eventId}/submit-settings`,

  // Permission requests
  permissionRequests: '/permission-requests',
  permissionRequestAccess: '/permission-requests/access',
  permissionRequestApprove: (id: string) => `/permission-requests/${id}/approve`,
  permissionRequestReject: (id: string) => `/permission-requests/${id}/reject`,

  // Form audit logs
  eventAuditLogs: (eventId: string) => `/events/${eventId}/audit-logs`,
  eventAuditLogRollback: (eventId: string, logId: string) =>
    `/events/${eventId}/audit-logs/${logId}/rollback`,
} as const
