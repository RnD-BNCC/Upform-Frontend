import type { AxiosProgressEvent } from "axios";

export type UploadFileInput =
  | File
  | {
      file: File;
      onUploadProgress?: (event: AxiosProgressEvent) => void;
      signal?: AbortSignal;
    };
