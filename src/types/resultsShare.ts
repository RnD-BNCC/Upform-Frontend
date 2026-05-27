import type { FormResponse, FormResponseProgress, FormSection } from "@/types/form";

export type ResultShareVisibility = "private" | "restricted" | "public";
export type ResultShareRole = "viewer" | "editor";

export type ResultShareMember = {
  id?: string;
  email: string;
  role: ResultShareRole;
};

export type ResultShare = {
  id: string;
  eventId: string;
  publicRole: ResultShareRole;
  visibility: ResultShareVisibility;
  token: string;
  shareUrl: string;
  members: ResultShareMember[];
};

export type SharedResultsData = {
  role: ResultShareRole;
  share: ResultShare;
  event: {
    id: string;
    name: string;
    status: string;
    color?: string;
    theme?: string;
    sections: FormSection[];
    responses: FormResponse[];
    responseProgresses: FormResponseProgress[];
  };
};

export type UpdateResultSharePayload = {
  members: Array<{ email: string; role: ResultShareRole }>;
  publicRole: ResultShareRole;
  visibility: ResultShareVisibility;
};
